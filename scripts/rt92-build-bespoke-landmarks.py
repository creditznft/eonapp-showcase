#!/usr/bin/env python3
"""Build RT92's five deterministic My Frontier landmark GLB families.

The generated assets are geometry/PBR-material only: no external textures,
network references, animations, scripts, cameras or lights.  Every LOD is
content-addressed after export and copied to both source and public trees.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import shutil
from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/city/rt92/my-frontier/landmarks'
PUB = ROOT / 'public/assets/city/rt92/my-frontier/landmarks'
MANIFEST = ROOT / 'config/rt92-my-frontier-bespoke-landmarks.generated.json'

LANDMARKS = [
    ('design-pavilion', 'creator', 7.0),
    ('research-observatory', 'knowledge', 11.0),
    ('expedition-hangar', 'transit', 8.0),
    ('reflection-garden', 'personal', 5.0),
    ('vault-reveal-gallery', 'personal', 8.0),
]
LOD_PROFILE = {
    0: {'segments': 48, 'radial': 12, 'detail': 1.0},
    1: {'segments': 28, 'radial': 8, 'detail': 0.62},
    2: {'segments': 16, 'radial': 6, 'detail': 0.36},
}


def rgba(hexstr: str, alpha: int = 255):
    v = hexstr.strip().lstrip('#')
    return [int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16), alpha]


def pbr(name: str, base: str, emissive: str = '#000000', emission: float = 0.0,
        metallic: float = 0.35, roughness: float = 0.42, alpha: int = 255):
    e = rgba(emissive)
    return PBRMaterial(
        name=name,
        baseColorFactor=rgba(base, alpha),
        metallicFactor=metallic,
        roughnessFactor=roughness,
        emissiveFactor=[(e[i] / 255.0) * emission for i in range(3)],
        alphaMode='BLEND' if alpha < 255 else 'OPAQUE',
        doubleSided=alpha < 255,
    )


MATS = {
    'graphite': pbr('Graphite Composite', '#1b222b', metallic=0.62, roughness=0.32),
    'shell': pbr('Ceramic Structural Shell', '#bcc8cf', metallic=0.08, roughness=0.34),
    'dark_shell': pbr('Dark Ceramic Shell', '#303943', metallic=0.22, roughness=0.38),
    'glass': pbr('Smoked Architectural Glass', '#18394b', '#40bfe8', 0.10, metallic=0.03, roughness=0.12, alpha=125),
    'cyan': pbr('Cyan Energy', '#1c536c', '#3ad4ff', 0.82, metallic=0.22, roughness=0.25),
    'violet': pbr('Violet Prism', '#50377d', '#b27cff', 0.86, metallic=0.25, roughness=0.23),
    'magenta': pbr('Creative Magenta', '#733756', '#ff79c7', 0.72, metallic=0.16, roughness=0.30),
    'mint': pbr('Knowledge Mint', '#315d53', '#77ecc5', 0.72, metallic=0.15, roughness=0.30),
    'gold': pbr('Ceremonial Gold', '#7a5930', '#ffc66f', 0.70, metallic=0.72, roughness=0.24),
    'amber': pbr('Transit Amber', '#72502c', '#ffad55', 0.72, metallic=0.28, roughness=0.30),
    'garden': pbr('Biolight Garden', '#315044', '#74e6b4', 0.46, metallic=0.03, roughness=0.56),
    'water': pbr('Reflective Water', '#11394b', '#4eb9d5', 0.14, metallic=0.02, roughness=0.08, alpha=158),
    'vault': pbr('Vault Monolith', '#24242c', metallic=0.76, roughness=0.25),
}


def transform(mesh, pos=(0, 0, 0), yaw=0.0, pitch=0.0, roll=0.0, scale=None):
    if scale is not None:
        sx, sy, sz = scale
        mesh.apply_transform(np.diag([sx, sy, sz, 1.0]))
    if pitch:
        mesh.apply_transform(trimesh.transformations.rotation_matrix(pitch, [1, 0, 0]))
    if yaw:
        mesh.apply_transform(trimesh.transformations.rotation_matrix(yaw, [0, 1, 0]))
    if roll:
        mesh.apply_transform(trimesh.transformations.rotation_matrix(roll, [0, 0, 1]))
    mesh.apply_translation(pos)
    return mesh


def add(scene, mesh, name: str, material, **kwargs):
    mesh = mesh.copy()
    mesh.visual = trimesh.visual.TextureVisuals(material=material)
    transform(mesh, **kwargs)
    scene.add_geometry(mesh, node_name=name, geom_name=name)
    return mesh


def box(scene, name, size, pos, material, yaw=0, pitch=0, roll=0):
    return add(scene, trimesh.creation.box(extents=size), name, material, pos=pos, yaw=yaw, pitch=pitch, roll=roll)


def cyl(scene, name, radius, height, pos, material, sections=24, yaw=0, pitch=0, roll=0, scale=None):
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    # trimesh cylinders are Z-up; author assets are Y-up for glTF/Babylon.
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    return add(scene, mesh, name, material, pos=pos, yaw=yaw, pitch=pitch, roll=roll, scale=scale)


def cone(scene, name, radius, height, pos, material, sections=24, yaw=0, pitch=0, roll=0, scale=None):
    mesh = trimesh.creation.cone(radius=radius, height=height, sections=sections)
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    return add(scene, mesh, name, material, pos=pos, yaw=yaw, pitch=pitch, roll=roll, scale=scale)


def torus(scene, name, major, minor, pos, material, major_sections=36, minor_sections=8, yaw=0, pitch=0, roll=0, floor=False, scale=None):
    mesh = trimesh.creation.torus(major_radius=major, minor_radius=minor, major_sections=major_sections, minor_sections=minor_sections)
    # default torus is in XY with Z normal: vertical in Y-up. Rotate for floor rings.
    if floor:
        mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    return add(scene, mesh, name, material, pos=pos, yaw=yaw, pitch=pitch, roll=roll, scale=scale)


def sphere(scene, name, radius, pos, material, subdivisions=2, scale=None):
    return add(scene, trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius), name, material, pos=pos, scale=scale)


def design_pavilion(lod):
    cfg = LOD_PROFILE[lod]; seg = cfg['segments']; d = cfg['detail']; s = trimesh.Scene()
    box(s, 'pavilion_base', (7.6, .35, 7.8), (0, .18, 0), MATS['graphite'])
    box(s, 'pavilion_stage', (5.4, .18, 4.8), (0, .44, -.35), MATS['dark_shell'])
    # Folded, asymmetric floating roof.
    box(s, 'roof_left', (4.7, .34, 7.2), (-1.7, 5.85, -.15), MATS['shell'], roll=-.075, yaw=.035)
    box(s, 'roof_right', (4.2, .28, 6.8), (1.85, 6.05, .1), MATS['dark_shell'], roll=.11, yaw=-.045)
    for i, x in enumerate((-3.15, -1.85, 1.85, 3.15)):
        box(s, f'cantilever_pillar_{i}', (.22, 5.25 - (i % 2) * .35, .32), (x, 3.0, 1.85 if i % 2 else -1.8), MATS['graphite'], roll=(-.06 if x < 0 else .06))
    # Prism glass facade with clean vertical rhythm.
    panels = max(3, round(7 * d))
    for i in range(panels):
        x = -2.7 + i * (5.4 / max(1, panels - 1))
        box(s, f'glass_facade_{i}', (.62, 3.7, .10), (x, 2.55, 2.45), MATS['glass'], yaw=.01 * (i - panels / 2))
    # Open design sculpture and layered ribbon rings.
    torus(s, 'design_orbit_outer', 1.35, .075, (0, 2.35, -.35), MATS['violet'], seg, max(6, cfg['radial']), yaw=.22)
    torus(s, 'design_orbit_inner', .86, .055, (0, 2.35, -.35), MATS['cyan'], max(20, seg - 8), max(6, cfg['radial'] - 2), pitch=.38, yaw=-.2)
    cone(s, 'design_prism_core', .58, 2.25, (0, 2.2, -.35), MATS['magenta'], max(3, round(6*d)))
    # Facade ribbon + terraces.
    box(s, 'violet_ribbon', (6.7, .10, .18), (0, 4.75, 2.55), MATS['violet'], roll=.035)
    box(s, 'cyan_ribbon', (5.5, .07, .15), (0, 1.02, 2.58), MATS['cyan'], roll=-.025)
    for side in (-1, 1):
        box(s, f'terrace_{side}', (1.3, .20, 4.4), (side*3.5, .55, -.4), MATS['dark_shell'])
    if lod <= 1:
        fins = max(4, round(10*d))
        for i in range(fins):
            x = -3.25 + i * (6.5 / max(1, fins-1))
            box(s, f'roof_fin_{i}', (.075, .65 + (i % 3)*.12, 2.8), (x, 6.2 + (i%2)*.05, -.25), MATS['graphite'], yaw=.015*(i-fins/2))
    if lod == 0:
        for i in range(8):
            a = i / 8 * math.tau
            cyl(s, f'floor_light_{i}', .055, .18, (math.cos(a)*2.5, .58, math.sin(a)*2.1-.25), MATS['cyan'], 10)
    return s


def research_observatory(lod):
    cfg = LOD_PROFILE[lod]; seg = cfg['segments']; d = cfg['detail']; s = trimesh.Scene()
    cyl(s, 'observatory_base', 3.55, .45, (0, .23, 0), MATS['graphite'], seg)
    cyl(s, 'research_drum', 2.45, 2.1, (0, 1.45, 0), MATS['dark_shell'], max(12, seg//2))
    # Vertical research spine and stepped ribs.
    box(s, 'research_spine', (1.35, 7.5, 1.35), (0, 5.0, 0), MATS['shell'], yaw=.08)
    ribs = max(3, round(7*d))
    for i in range(ribs):
        y = 2.4 + i * (4.2 / max(1, ribs-1))
        torus(s, f'spine_sensor_ring_{i}', 1.05 + (i%2)*.2, .055, (0, y, 0), MATS['mint'] if i%2==0 else MATS['cyan'], max(20, seg-10), max(6,cfg['radial']-2), floor=True, yaw=i*.14)
    # Observation crown and transparent chamber.
    cyl(s, 'crown_lower', 2.55, .46, (0, 8.65, 0), MATS['graphite'], seg)
    sphere(s, 'observation_chamber', 2.05, (0, 9.25, 0), MATS['glass'], subdivisions=2 if lod==0 else 1, scale=(1, .58, 1))
    torus(s, 'crown_outer_ring', 2.55, .11, (0, 9.25, 0), MATS['mint'], seg, cfg['radial'], floor=True, pitch=.08)
    torus(s, 'crown_sensor_ring', 1.85, .075, (0, 9.65, 0), MATS['cyan'], max(24,seg-8), max(6,cfg['radial']-2), floor=True, pitch=-.16, yaw=.27)
    # Tilted sensor dish on side arm.
    box(s, 'dish_arm', (.28, .28, 3.3), (1.8, 8.0, .4), MATS['graphite'], yaw=math.pi/2-.3, pitch=.18)
    torus(s, 'sensor_dish_rim', 1.15, .08, (3.0, 8.45, .75), MATS['mint'], max(20,seg-10), max(6,cfg['radial']-2), yaw=.33, pitch=.42)
    cone(s, 'sensor_dish_core', 1.05, .38, (3.0, 8.42, .7), MATS['dark_shell'], max(12,seg//2), yaw=.33, pitch=.42)
    antenna_count = max(3, round(8*d))
    for i in range(antenna_count):
        a = i / antenna_count * math.tau
        r = 2.9
        cyl(s, f'roof_antenna_{i}', .045, 1.1+(i%3)*.2, (math.cos(a)*r, 9.5, math.sin(a)*r), MATS['cyan'] if i%3==0 else MATS['graphite'], 8)
    if lod == 0:
        for side in (-1,1):
            box(s, f'research_side_pod_{side}', (1.9, 1.25, 2.6), (side*2.45, 2.0, .25), MATS['dark_shell'], yaw=side*.12)
            box(s, f'research_side_glass_{side}', (1.45, .72, .06), (side*2.45, 2.12, 1.58), MATS['glass'], yaw=side*.12)
    return s


def expedition_hangar(lod):
    cfg = LOD_PROFILE[lod]; seg = cfg['segments']; d = cfg['detail']; s = trimesh.Scene()
    box(s, 'hangar_foundation', (10.6, .35, 8.3), (0, .18, 0), MATS['graphite'])
    # Heavy flanks and open launch aperture.
    for side in (-1,1):
        box(s, f'hangar_side_wall_{side}', (1.05, 5.6, 7.0), (side*4.4, 3.0, -.15), MATS['dark_shell'], roll=-side*.055)
        box(s, f'hangar_outer_rib_{side}', (.36, 6.25, 7.55), (side*4.85, 3.15, -.15), MATS['graphite'], roll=-side*.08)
    box(s, 'hangar_back', (8.3, 5.1, .75), (0, 2.75, -3.6), MATS['dark_shell'])
    # Folded roof leaves a strong central ridge.
    box(s, 'roof_left', (5.5, .38, 7.4), (-2.3, 6.05, -.2), MATS['shell'], roll=-.12)
    box(s, 'roof_right', (5.5, .38, 7.4), (2.3, 6.05, -.2), MATS['shell'], roll=.12)
    # Launch mouth frame and luminous aperture.
    box(s, 'launch_header', (8.2, .48, .48), (0, 5.45, 3.55), MATS['graphite'])
    for side in (-1,1):
        box(s, f'launch_frame_{side}', (.48, 5.0, .48), (side*3.9, 2.75, 3.55), MATS['graphite'])
    box(s, 'launch_light_top', (6.9, .10, .10), (0, 4.88, 3.84), MATS['amber'])
    for side in (-1,1): box(s, f'launch_light_side_{side}', (.10, 4.15, .10), (side*3.47, 2.75, 3.84), MATS['cyan'])
    # Departure lane and rails.
    box(s, 'departure_lane', (5.6, .08, 11.0), (0, .41, 3.1), MATS['dark_shell'])
    for side in (-1,1):
        box(s, f'departure_rail_{side}', (.13, .12, 10.3), (side*2.15, .52, 3.0), MATS['cyan'])
        box(s, f'departure_warning_{side}', (.08, .08, 9.5), (side*2.55, .50, 2.7), MATS['amber'])
    # Maintenance gantry + cargo equipment.
    gantries = max(2, round(5*d))
    for i in range(gantries):
        z = -2.5 + i * (5.0/max(1,gantries-1))
        for side in (-1,1): box(s, f'gantry_leg_{i}_{side}', (.22, 3.8, .3), (side*3.25, 2.1, z), MATS['graphite'])
        box(s, f'gantry_beam_{i}', (6.8, .22, .32), (0, 4.0, z), MATS['graphite'])
    pods = max(2, round(6*d))
    for i in range(pods):
        side = -1 if i%2==0 else 1
        z = -2.5 + (i//2)*1.7
        box(s, f'cargo_pod_{i}', (1.25, .9, 1.1), (side*3.1, .9, z), MATS['dark_shell'], yaw=side*.08)
        box(s, f'cargo_light_{i}', (.7, .06, .06), (side*3.1, 1.18, z+.56), MATS['amber'])
    if lod == 0:
        # Expedition craft silhouette in maintenance position (non-interactive art).
        box(s, 'expedition_craft_body', (3.4, .65, 4.1), (0, 1.15, -.4), MATS['shell'])
        box(s, 'expedition_craft_glass', (2.1, .45, 1.0), (0, 1.55, 1.0), MATS['glass'])
        for side in (-1,1): box(s, f'craft_wing_{side}', (2.8, .16, 1.1), (side*2.3, 1.05, -.2), MATS['dark_shell'], yaw=side*.12)
    return s


def reflection_garden(lod):
    cfg = LOD_PROFILE[lod]; seg = cfg['segments']; d = cfg['detail']; s = trimesh.Scene()
    # Terraced landscape rather than another cyber building.
    cyl(s, 'garden_terrace_outer', 4.9, .32, (0, .16, 0), MATS['graphite'], seg, scale=(1,1,.88))
    cyl(s, 'garden_terrace_inner', 3.85, .18, (0, .39, 0), MATS['dark_shell'], max(16,seg-8), scale=(1,1,.84))
    cyl(s, 'reflective_pool', 3.05, .09, (.45, .52, -.15), MATS['water'], max(20,seg), scale=(1,.45,.72))
    # Quiet curved route language via floor rings.
    torus(s, 'quiet_path_outer', 3.85, .09, (0, .55, 0), MATS['mint'], seg, cfg['radial'], floor=True, scale=(1,1,.84))
    torus(s, 'quiet_path_inner', 2.45, .055, (.3, .57, -.1), MATS['cyan'], max(20,seg-8), max(6,cfg['radial']-2), floor=True, scale=(1,1,.72))
    # Abstract reflection monument: tilted nested rings and crystal.
    torus(s, 'reflection_monument_outer', 1.18, .075, (-.7, 2.05, -.55), MATS['mint'], seg, cfg['radial'], yaw=.18, pitch=.16)
    torus(s, 'reflection_monument_inner', .72, .055, (-.7, 2.05, -.55), MATS['violet'], max(20,seg-8), max(6,cfg['radial']-2), yaw=-.24, pitch=-.22)
    cone(s, 'reflection_crystal', .38, 1.55, (-.7, 1.95, -.55), MATS['cyan'], max(4,round(8*d)), roll=math.pi)
    # Sculptural shade canopies.
    canopies = max(3, round(6*d))
    for i in range(canopies):
        a = i / canopies * math.tau + .42
        r = 3.3 + (i%2)*.55
        x,z = math.cos(a)*r, math.sin(a)*r*.82
        cyl(s, f'canopy_stem_{i}', .07, 2.0+(i%2)*.28, (x, 1.45, z), MATS['graphite'], 8)
        cyl(s, f'canopy_crown_{i}', 1.05+(i%2)*.15, .16, (x, 2.46+(i%2)*.28, z), MATS['garden'], max(6,round(8*d)), yaw=a, scale=(1,1,.62))
    # Bioluminescent vegetation clusters.
    plants = max(5, round(14*d))
    for i in range(plants):
        a = i / plants * math.tau + .15
        r = 2.8 + (i%4)*.48
        x,z = math.cos(a)*r, math.sin(a)*r*.88
        h=.55+(i%4)*.16
        cyl(s, f'plant_stem_{i}', .035, h, (x, .62+h/2, z), MATS['garden'], 6)
        sphere(s, f'plant_seed_{i}', .11+(i%2)*.03, (x, .65+h, z), MATS['mint'], 1)
    if lod == 0:
        for i in range(8):
            a=i/8*math.tau
            sphere(s, f'floating_light_seed_{i}', .07, (math.cos(a)*2.2, 1.7+(i%3)*.28, math.sin(a)*1.55), MATS['violet'] if i%2 else MATS['mint'], 1)
    return s


def vault_reveal_gallery(lod):
    cfg = LOD_PROFILE[lod]; seg = cfg['segments']; d = cfg['detail']; s = trimesh.Scene()
    box(s, 'vault_foundation', (8.7, .42, 8.3), (0, .21, 0), MATS['vault'])
    # Monolithic shell and deep central axis.
    for side in (-1,1):
        box(s, f'vault_monolith_{side}', (2.65, 7.3, 7.1), (side*2.75, 3.85, -.25), MATS['vault'], roll=-side*.035)
        box(s, f'vault_gold_rib_{side}', (.22, 6.15, .35), (side*1.48, 3.6, 3.25), MATS['gold'])
    box(s, 'vault_crown', (6.6, .65, 6.9), (0, 7.25, -.25), MATS['dark_shell'])
    box(s, 'gallery_spine', (2.4, .16, 8.8), (0, .58, 1.25), MATS['dark_shell'])
    box(s, 'gallery_axis_light', (.15, .05, 8.2), (0, .69, 1.2), MATS['gold'])
    # Huge ceremonial ring entrance, nested security rings.
    torus(s, 'vault_entry_outer', 2.25, .16, (0, 3.25, 3.62), MATS['gold'], seg, cfg['radial'])
    torus(s, 'vault_entry_mid', 1.75, .09, (0, 3.25, 3.70), MATS['violet'], max(20,seg-8), max(6,cfg['radial']-2))
    torus(s, 'vault_entry_inner', 1.35, .06, (0, 3.25, 3.77), MATS['cyan'], max(18,seg-12), max(6,cfg['radial']-3))
    # Reveal chamber implied through controlled transparent geometry.
    sphere(s, 'reveal_chamber', 1.25, (0, 3.05, -.85), MATS['glass'], 2 if lod==0 else 1, scale=(1,.92,1))
    torus(s, 'reveal_suspension_ring', 1.55, .07, (0, 3.05, -.85), MATS['violet'], max(20,seg-8), max(6,cfg['radial']-2), floor=True, pitch=.18)
    cone(s, 'reveal_keystone', .52, 1.45, (0, 3.0, -.85), MATS['gold'], max(5,round(8*d)), roll=math.pi)
    # Display alcoves and ceremonial approach fins.
    alcoves=max(2,round(6*d))
    for i in range(alcoves):
        side=-1 if i%2==0 else 1
        row=i//2
        z=1.5-row*1.7
        box(s, f'display_alcove_{i}', (1.0, 1.45, .35), (side*2.0, 1.55, z), MATS['dark_shell'])
        box(s, f'display_light_{i}', (.62, .72, .04), (side*2.0, 1.62, z+.2), MATS['violet'] if i%2 else MATS['cyan'])
    fins=max(3,round(8*d))
    for i in range(fins):
        side=-1 if i%2==0 else 1
        row=i//2
        z=5.3+row*1.2
        box(s, f'approach_fin_{i}', (.18, 1.7+(row%2)*.4, .55), (side*(2.8+row*.18), 1.2, z), MATS['gold'] if row%3==0 else MATS['vault'], roll=-side*.08)
    if lod == 0:
        torus(s, 'crown_ceremony_ring', 2.75, .08, (0, 6.15, -.2), MATS['gold'], seg, cfg['radial'], floor=True, pitch=.12)
        for side in (-1,1):
            box(s, f'vault_side_recess_{side}', (1.15, 3.2, .08), (side*4.12, 3.4, .5), MATS['glass'])
    return s


BUILDERS = {
    'design-pavilion': design_pavilion,
    'research-observatory': research_observatory,
    'expedition-hangar': expedition_hangar,
    'reflection-garden': reflection_garden,
    'vault-reveal-gallery': vault_reveal_gallery,
}


def export_one(building_id: str, lod: int):
    scene = BUILDERS[building_id](lod)
    raw = scene.export(file_type='glb')
    digest = hashlib.sha256(raw).hexdigest()
    name = f'{building_id}-lod{lod}.{digest[:12]}.glb'
    rel = Path(building_id) / name
    src_path = SRC / rel
    pub_path = PUB / rel
    src_path.parent.mkdir(parents=True, exist_ok=True)
    pub_path.parent.mkdir(parents=True, exist_ok=True)
    src_path.write_bytes(raw)
    shutil.copy2(src_path, pub_path)
    loaded = trimesh.load(src_path, force='scene')
    bounds = loaded.bounds
    tri_count = int(sum(len(g.faces) for g in loaded.geometry.values() if hasattr(g, 'faces')))
    vertex_count = int(sum(len(g.vertices) for g in loaded.geometry.values() if hasattr(g, 'vertices')))
    return {
        'lod': lod,
        'path': '/assets/city/rt92/my-frontier/landmarks/' + rel.as_posix(),
        'sourcePath': 'assets/city/rt92/my-frontier/landmarks/' + rel.as_posix(),
        'bytes': len(raw),
        'sha256': digest,
        'triangleCount': tri_count,
        'vertexCount': vertex_count,
        'meshCount': len(loaded.geometry),
        'bounds': {
            'min': [round(float(v), 4) for v in bounds[0]],
            'max': [round(float(v), 4) for v in bounds[1]],
            'size': [round(float(v), 4) for v in (bounds[1] - bounds[0])],
        },
        'externalTextures': 0,
        'animations': 0,
        'cameras': 0,
        'lights': 0,
    }


def main():
    # Clean stale generated files only under the RT92 landmark namespace.
    for target in (SRC, PUB):
        if target.exists(): shutil.rmtree(target)
        target.mkdir(parents=True, exist_ok=True)
    entries=[]
    total=0
    for building_id, district, target_height in LANDMARKS:
        lods=[]
        for lod in (0,1,2):
            row=export_one(building_id,lod)
            lods.append(row); total += row['bytes']
            print(f"{building_id} LOD{lod}: {row['bytes']:,} bytes, {row['triangleCount']:,} tris, {row['meshCount']} meshes")
        entries.append({
            'buildingId': building_id,
            'district': district,
            'targetHeight': target_height,
            'lods': lods,
            'fallbackRequiredUntilValidated': True,
            'sameOriginContentAddressed': True,
            'privateContentStored': False,
        })
    manifest={
        'schema':'eon.city.my-frontier.bespoke-landmarks.rt92.v1',
        'worldId':'my-frontier',
        'generator':'scripts/rt92-build-bespoke-landmarks.py',
        'entries':entries,
        'entryCount':len(entries),
        'lodAssetCount':sum(len(e['lods']) for e in entries),
        'totalBytes':total,
        'textureBytes':0,
        'remoteAssets':False,
        'firstFrameHubBinaryDelta':0,
        'ownsEngine':False,
        'ownsScene':False,
        'ownsRenderLoop':False,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'TOTAL: {total:,} bytes across {manifest["lodAssetCount"]} GLBs')
    print(MANIFEST)

if __name__ == '__main__':
    main()

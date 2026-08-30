/**
 * CITY-ART / CITY-WORLD — original EON Noir architecture kit.
 *
 * This module replaces the former single-box landmark language with an
 * intentionally art-directed procedural kit: tapered shells, split fins,
 * cantilevers, bridges, canopy rings and a layered skyline.  It is still
 * source-controlled geometry, not a claim that final commissioned GLB assets
 * have shipped.  It never loads remote artwork or reads private project data.
 */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

export const EON_NOIR_ARCHITECTURE_SCHEMA = 'eon.city.noir-architecture.v1';

const freeze = (value) => Object.freeze(value);
const color = (hex) => Color3.FromHexString(hex);

export const EON_NOIR_PALETTE = freeze({
  graphite: '#07111e',
  wetSteel: '#132742',
  carbon: '#0e1a2d',
  glass: '#163f59',
  cyan: '#69e7ff',
  violet: '#9b7cff',
  magenta: '#ff68cd',
  amber: '#ffbc68',
  mint: '#92f5c2',
  dawn: '#c7dcff'
});

export const EON_NOIR_LANDMARK_CATALOG = freeze([
  freeze({ id: 'command-loom', title: 'Command Loom', role: 'EONBOT, Projects and native work command', silhouette: 'split fin tower with a suspended work bridge and visible signal core' }),
  freeze({ id: 'agent-theatre', title: 'Agent Theatre', role: 'receipt-backed agent and automation review', silhouette: 'low circular civic theatre with an open signal crown and visibly dormant stage' }),
  freeze({ id: 'creator-atrium', title: 'Creator Atrium', role: 'visual and campaign creation', silhouette: 'layered glass terraces around a luminous gallery ribbon' }),
  freeze({ id: 'forge-basilica', title: 'Forge Basilica', role: 'website and app building', silhouette: 'industrial build cathedral with diagonal supports and heat-light bays' }),
  freeze({ id: 'signal-sail', title: 'Signal Sail', role: 'share packs and project postcards', silhouette: 'asymmetric sail tower with a split spectrum spine' }),
  freeze({ id: 'archive-canopy', title: 'Archive Canopy', role: 'Library and local project return', silhouette: 'bio-glass canopy with archive rings and garden terraces' }),
  freeze({ id: 'automation-observatory', title: 'Automation Observatory', role: 'proposal review only', silhouette: 'cantilevered observatory with a sensor halo and zero autonomous execution' }),
  freeze({ id: 'support-dock', title: 'Support Dock', role: 'guided support and safe return', silhouette: 'street-level service dock below elevated infrastructure' }),
  freeze({ id: 'device-observatory', title: 'Device Observatory', role: 'voice and local device tools', silhouette: 'rotating scan dish on a staggered research platform' }),
  freeze({ id: 'project-district', title: 'Project District', role: 'bounded private project shell', silhouette: 'three authored modules around a private project beacon' })
]);

const LANDMARK_IDS = new Set(EON_NOIR_LANDMARK_CATALOG.map((entry) => entry.id));

function makeMaterial(scene, name, { base = EON_NOIR_PALETTE.carbon, glow = '', intensity = 0, metallic = 0.45, roughness = 0.32, alpha = 1, texture = null } = {}) {
  const material = new PBRMetallicRoughnessMaterial(name, scene);
  material.baseColor = color(base);
  material.metallic = metallic;
  material.roughness = roughness;
  material.alpha = alpha;
  material.emissiveColor = glow ? color(glow).scale(Math.max(0, intensity)) : Color3.Black();
  if (texture) material.baseTexture = texture;
  material.backFaceCulling = alpha >= 0.98;
  return material;
}

function getMaterialKit(scene, vectorArt, quality = 'balanced') {
  scene.metadata ||= {};
  if (scene.metadata.eonNoirMaterialKit) return scene.metadata.eonNoirMaterialKit;
  const texture = (id, options = {}) => vectorArt?.getTexture?.(id, options) || null;
  const scale = quality === 'lite' ? 0.76 : quality === 'cinematic' ? 1.12 : 1;
  const kit = freeze({
    graphite: makeMaterial(scene, 'eon-noir-graphite', { base: EON_NOIR_PALETTE.graphite, glow: '#123451', intensity: 0.15 * scale, metallic: 0.76, roughness: 0.26, texture: texture('brushed-graphite', { uScale: 3.2, vScale: 3.2 }) }),
    wetSteel: makeMaterial(scene, 'eon-noir-wet-steel', { base: EON_NOIR_PALETTE.wetSteel, glow: '#0a5a75', intensity: 0.24 * scale, metallic: 0.68, roughness: 0.2, texture: texture('wet-street', { uScale: 2.2, vScale: 2.2 }) }),
    carbon: makeMaterial(scene, 'eon-noir-carbon', { base: EON_NOIR_PALETTE.carbon, glow: '#183a59', intensity: 0.18 * scale, metallic: 0.62, roughness: 0.31, texture: texture('carbon-weave', { uScale: 3.4, vScale: 3.4 }) }),
    glass: makeMaterial(scene, 'eon-noir-glass', { base: EON_NOIR_PALETTE.glass, glow: EON_NOIR_PALETTE.cyan, intensity: 0.34 * scale, metallic: 0.24, roughness: 0.12, alpha: 0.88, texture: texture('glass-grid', { uScale: 2.8, vScale: 3.5 }) }),
    cyan: makeMaterial(scene, 'eon-noir-cyan', { base: '#1a3f55', glow: EON_NOIR_PALETTE.cyan, intensity: 1.04 * scale, metallic: 0.18, roughness: 0.16 }),
    violet: makeMaterial(scene, 'eon-noir-violet', { base: '#2b1c58', glow: EON_NOIR_PALETTE.violet, intensity: 0.96 * scale, metallic: 0.2, roughness: 0.18 }),
    magenta: makeMaterial(scene, 'eon-noir-magenta', { base: '#4b1848', glow: EON_NOIR_PALETTE.magenta, intensity: 0.86 * scale, metallic: 0.18, roughness: 0.2 }),
    amber: makeMaterial(scene, 'eon-noir-amber', { base: '#4c2e14', glow: EON_NOIR_PALETTE.amber, intensity: 0.92 * scale, metallic: 0.22, roughness: 0.2 }),
    mint: makeMaterial(scene, 'eon-noir-mint', { base: '#164936', glow: EON_NOIR_PALETTE.mint, intensity: 0.92 * scale, metallic: 0.18, roughness: 0.22 }),
    accent(accent = EON_NOIR_PALETTE.cyan, id = 'accent') {
      return makeMaterial(scene, `eon-noir-${id}-accent`, { base: '#173650', glow: accent, intensity: 0.94 * scale, metallic: 0.2, roughness: 0.16 });
    }
  });
  scene.metadata.eonNoirMaterialKit = kit;
  return kit;
}

function addChild(root, mesh, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, material = null } = {}) {
  mesh.parent = root;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scaling.set(sx, sy, sz);
  if (material) mesh.material = material;
  mesh.isPickable = false;
  return mesh;
}

function taperedShell(scene, root, id, { x = 0, y = 0, z = 0, height = 5, bottom = 1.3, top = 0.42, sides = 5, rx = 0, ry = 0, rz = 0, material } = {}) {
  return addChild(root, MeshBuilder.CreateCylinder(id, { height, diameterBottom: bottom, diameterTop: top, tessellation: sides }, scene), { x, y: y + height / 2, z, rx, ry, rz, material });
}

function beam(scene, root, id, from, to, { diameter = 0.1, material } = {}) {
  const path = [new Vector3(from.x, from.y, from.z), new Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + Math.abs(from.z - to.z) * 0.04, (from.z + to.z) / 2), new Vector3(to.x, to.y, to.z)];
  return addChild(root, MeshBuilder.CreateTube(id, { path, radius: diameter, tessellation: 8, cap: MeshBuilder.CAP_ALL }, scene), { material });
}

function arch(scene, root, id, { x = 0, y = 0, z = 0, radius = 1.4, thickness = 0.08, material, ry = 0 } = {}) {
  const ring = addChild(root, MeshBuilder.CreateTorus(id, { diameter: radius * 2, thickness, tessellation: 32 }, scene), { x, y, z, rx: Math.PI / 2, ry, material });
  return ring;
}

function panel(scene, root, id, { x = 0, y = 0, z = 0, width = 1, height = 1, material, ry = 0, rz = 0 } = {}) {
  return addChild(root, MeshBuilder.CreatePlane(id, { width, height }, scene), { x, y, z, ry, rz, material });
}

function deck(scene, root, id, { x = 0, y = 0, z = 0, width = 3, depth = 3, material } = {}) {
  return addChild(root, MeshBuilder.CreateBox(id, { width, height: 0.16, depth }, scene), { x, y, z, material });
}

function createCommandLoom(scene, root, kit, quality, accent) {
  const coreMaterial = kit.accent(accent, 'command-loom');
  const primary = taperedShell(scene, root, 'command-loom-central-shell', { height: 8.8, bottom: 2.3, top: 0.64, sides: 5, ry: Math.PI / 5, material: kit.graphite });
  const core = taperedShell(scene, root, 'command-loom-signal-core', { height: 9.45, bottom: 0.7, top: 0.24, sides: 8, material: coreMaterial });
  taperedShell(scene, root, 'command-loom-left-fin', { x: -2.1, y: .4, z: .1, height: 7.25, bottom: .82, top: .18, sides: 3, rz: -0.31, material: kit.wetSteel });
  taperedShell(scene, root, 'command-loom-right-fin', { x: 2.1, y: .6, z: .24, height: 6.9, bottom: .78, top: .16, sides: 3, rz: 0.29, material: kit.carbon });
  const bridge = deck(scene, root, 'command-loom-suspended-bridge', { y: 2.1, z: -2.35, width: 9.8, depth: 0.72, material: kit.wetSteel });
  beam(scene, root, 'command-loom-bridge-left', { x: -4.6, y: 2.1, z: -2.35 }, { x: -1.3, y: 5.15, z: -.25 }, { material: coreMaterial, diameter: .07 });
  beam(scene, root, 'command-loom-bridge-right', { x: 4.6, y: 2.1, z: -2.35 }, { x: 1.3, y: 5.15, z: -.25 }, { material: coreMaterial, diameter: .07 });
  const halo = arch(scene, root, 'command-loom-signal-halo', { y: 7.2, radius: 2.55, thickness: .08, material: kit.cyan });
  const entry = arch(scene, root, 'command-loom-entry', { y: 2.05, z: -1.6, radius: 1.45, thickness: .12, material: coreMaterial });
  panel(scene, root, 'command-loom-glass-panel-left', { x: -1.24, y: 4.4, z: -1.17, width: .9, height: 3.7, ry: .22, material: kit.glass });
  panel(scene, root, 'command-loom-glass-panel-right', { x: 1.24, y: 4.4, z: -1.17, width: .9, height: 3.7, ry: -.22, material: kit.glass });
  if (quality !== 'lite') {
    arch(scene, root, 'command-loom-secondary-halo', { y: 4.95, radius: 1.52, thickness: .045, material: kit.violet });
  }
  return { primary, core, bridge, motionNodes: [halo, core, entry] };
}

function createAgentTheatre(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'agent-theatre');
  const primary = addChild(root, MeshBuilder.CreateCylinder('agent-theatre-civic-bowl', { height: .72, diameterTop: 4.2, diameterBottom: 5.4, tessellation: quality === 'lite' ? 12 : 24 }, scene), { y: .36, material: kit.carbon });
  const stage = deck(scene, root, 'agent-theatre-review-stage', { y: .82, z: -.35, width: 3.1, depth: 2.05, material: kit.wetSteel });
  const core = taperedShell(scene, root, 'agent-theatre-receipt-beacon', { y: .82, z: .28, height: 2.55, bottom: .48, top: .14, sides: 6, material: accentMaterial });
  const crown = arch(scene, root, 'agent-theatre-open-crown', { y: 3.0, radius: 2.22, thickness: .08, material: kit.amber, ry: .2 });
  const entry = arch(scene, root, 'agent-theatre-entry', { y: 1.08, z: -2.23, radius: 1.12, thickness: .09, material: accentMaterial });
  for (const side of [-1, 1]) {
    beam(scene, root, `agent-theatre-canopy-${side}`, { x: side * 2.35, y: .72, z: .92 }, { x: side * 1.2, y: 2.75, z: -.15 }, { material: kit.graphite, diameter: .095 });
  }
  const seatCount = quality === 'lite' ? 4 : 8;
  for (let index = 0; index < seatCount; index += 1) {
    const phase = Math.PI * (.12 + .76 * (index / Math.max(1, seatCount - 1)));
    const seat = addChild(root, MeshBuilder.CreateBox(`agent-theatre-dormant-seat-${index}`, { width: .42, height: .28, depth: .5 }, scene), { x: Math.cos(phase) * 1.82, y: .98, z: Math.sin(phase) * 1.28 + .35, ry: -phase + Math.PI / 2, material: index % 2 ? kit.graphite : kit.wetSteel });
    seat.metadata = { kind: 'agent-theatre-seat', state: 'dormant', representsLiveAgent: false, receiptRequired: true, localOnly: true };
  }
  return { primary, core, bridge: stage, motionNodes: [crown, core, entry] };
}

function createCreatorAtrium(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'creator-atrium');
  const primary = addChild(root, MeshBuilder.CreateSphere('creator-atrium-bio-glass-dome', { diameter: 5.25, segments: quality === 'lite' ? 10 : 16, slice: .58 }, scene), { y: .03, material: kit.glass });
  primary.scaling.y = .9;
  deck(scene, root, 'creator-atrium-lower-terrace', { y: .12, z: .25, width: 5.9, depth: 4.2, material: kit.carbon });
  deck(scene, root, 'creator-atrium-upper-gallery', { y: 2.2, z: .32, width: 4.25, depth: 2.7, material: kit.wetSteel });
  const ribbon = arch(scene, root, 'creator-atrium-gallery-ribbon', { y: 3.15, radius: 2.22, thickness: .10, material: accentMaterial, ry: .18 });
  const entry = arch(scene, root, 'creator-atrium-entry', { y: 1.35, z: -2.22, radius: 1.1, thickness: .09, material: kit.cyan });
  for (const side of [-1, 1]) {
    taperedShell(scene, root, `creator-atrium-wing-${side}`, { x: side * 2.45, y: .28, z: .55, height: 3.95, bottom: 1.05, top: .42, sides: 4, rz: side * -.16, material: kit.graphite });
    panel(scene, root, `creator-atrium-panel-${side}`, { x: side * 1.65, y: 2.2, z: -1.86, width: 1.2, height: 2.6, ry: side * .27, material: kit.glass });
  }
  if (quality !== 'lite') {
    beam(scene, root, 'creator-atrium-skywalk', { x: -3.1, y: 3.25, z: -.2 }, { x: 3.1, y: 3.25, z: -.2 }, { material: accentMaterial, diameter: .065 });
  }
  return { primary, core: ribbon, bridge: entry, motionNodes: [ribbon, entry] };
}

function createForgeBasilica(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'forge-basilica');
  const primary = taperedShell(scene, root, 'forge-basilica-central-spire', { y: .16, height: 6.8, bottom: 2.22, top: .5, sides: 4, ry: Math.PI / 4, material: kit.carbon });
  const core = taperedShell(scene, root, 'forge-basilica-heat-core', { y: .35, height: 6.2, bottom: .56, top: .26, sides: 6, material: kit.amber });
  for (const [index, side] of [-1, 1].entries()) {
    taperedShell(scene, root, `forge-basilica-buttress-${side}`, { x: side * 2.45, y: .08, z: .62, height: 5.1, bottom: 1.1, top: .22, sides: 3, rz: side * -.36, material: kit.wetSteel });
    beam(scene, root, `forge-basilica-brace-${side}`, { x: side * 3.1, y: .6, z: -1.45 }, { x: side * 1.02, y: 4.78, z: -.15 }, { material: accentMaterial, diameter: .08 + index * .005 });
  }
  const bridge = deck(scene, root, 'forge-basilica-build-bridge', { y: 1.55, z: -2.05, width: 5.2, depth: .82, material: kit.wetSteel });
  const halo = arch(scene, root, 'forge-basilica-crown', { y: 6.52, radius: 2.15, thickness: .075, material: accentMaterial });
  const entry = arch(scene, root, 'forge-basilica-build-entry', { y: 1.82, z: -2.34, radius: 1.25, thickness: .1, material: kit.amber });
  if (quality === 'cinematic') {
    panel(scene, root, 'forge-basilica-flame-panel-left', { x: -1.62, y: 3.0, z: -1.75, width: .82, height: 2.75, ry: .22, material: kit.amber });
    panel(scene, root, 'forge-basilica-flame-panel-right', { x: 1.62, y: 3.0, z: -1.75, width: .82, height: 2.75, ry: -.22, material: kit.amber });
  }
  return { primary, core, bridge, motionNodes: [halo, core, entry] };
}

function createSignalSail(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'signal-sail');
  const primary = taperedShell(scene, root, 'signal-sail-main-wing', { x: -.52, height: 8.25, bottom: 1.95, top: .16, sides: 3, ry: .55, rz: -.2, material: kit.graphite });
  const core = taperedShell(scene, root, 'signal-sail-spectrum-spine', { x: .38, y: .2, height: 8.45, bottom: .48, top: .12, sides: 5, rz: .11, material: accentMaterial });
  taperedShell(scene, root, 'signal-sail-counter-wing', { x: 1.18, y: .3, z: .35, height: 5.85, bottom: 1.1, top: .12, sides: 3, ry: -.32, rz: .24, material: kit.wetSteel });
  const bridge = deck(scene, root, 'signal-sail-media-balcony', { y: 2.15, z: -1.85, width: 4.4, depth: .68, material: kit.wetSteel });
  const halo = arch(scene, root, 'signal-sail-halo', { y: 6.15, radius: 1.75, thickness: .07, material: kit.magenta, ry: .48 });
  const entry = arch(scene, root, 'signal-sail-entry', { y: 1.42, z: -1.78, radius: 1.05, thickness: .08, material: accentMaterial });
  if (quality !== 'lite') {
    beam(scene, root, 'signal-sail-tension-cable-left', { x: -2.05, y: .55, z: .8 }, { x: -.5, y: 7.9, z: .12 }, { material: kit.cyan, diameter: .045 });
    beam(scene, root, 'signal-sail-tension-cable-right', { x: 2.05, y: .55, z: .86 }, { x: .52, y: 7.92, z: .15 }, { material: kit.violet, diameter: .045 });
  }
  return { primary, core, bridge, motionNodes: [halo, core, entry] };
}

function createArchiveCanopy(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'archive-canopy');
  const primary = addChild(root, MeshBuilder.CreateSphere('archive-canopy-shell', { diameter: 5.75, segments: quality === 'lite' ? 10 : 16, slice: .46 }, scene), { y: .06, material: kit.glass });
  primary.scaling.y = .84;
  deck(scene, root, 'archive-canopy-terrace', { y: .11, width: 6.2, depth: 4.7, material: kit.carbon });
  const core = arch(scene, root, 'archive-canopy-archive-ring', { y: 2.72, radius: 2.25, thickness: .1, material: accentMaterial, ry: .32 });
  const bridge = deck(scene, root, 'archive-canopy-reading-bridge', { y: 1.34, z: -2.0, width: 4.15, depth: .62, material: kit.wetSteel });
  const entry = arch(scene, root, 'archive-canopy-entry', { y: 1.2, z: -2.37, radius: 1.06, thickness: .08, material: kit.cyan });
  for (let index = 0; index < (quality === 'lite' ? 3 : 7); index += 1) {
    const phase = (Math.PI * 2 * index) / (quality === 'lite' ? 3 : 7);
    const pod = addChild(root, MeshBuilder.CreateSphere(`archive-canopy-biopod-${index}`, { diameter: .35 + (index % 2) * .12, segments: 8 }, scene), { x: Math.cos(phase) * 2.45, y: .4 + (index % 2) * .12, z: Math.sin(phase) * 1.72, material: index % 2 ? kit.mint : accentMaterial });
    pod.metadata = { kind: 'city-biopod', decorative: true, localOnly: true };
  }
  return { primary, core, bridge, motionNodes: [core, entry] };
}

function createAutomationObservatory(scene, root, kit, quality, accent, { device = false } = {}) {
  const accentMaterial = kit.accent(accent, device ? 'device-observatory' : 'automation-observatory');
  const primary = taperedShell(scene, root, `${device ? 'device' : 'automation'}-observatory-base`, { height: 4.3, bottom: 2.4, top: 1.05, sides: 6, material: kit.graphite });
  const core = addChild(root, MeshBuilder.CreateCylinder(`${device ? 'device' : 'automation'}-observatory-dish`, { height: .24, diameter: 3.85, tessellation: quality === 'lite' ? 16 : 28 }, scene), { y: 4.45, rx: .38, rz: .18, material: kit.glass });
  const bridge = deck(scene, root, `${device ? 'device' : 'automation'}-observatory-cantilever`, { y: 2.05, z: -1.98, width: 5.1, depth: .66, material: kit.wetSteel });
  const halo = arch(scene, root, `${device ? 'device' : 'automation'}-observatory-sensor-halo`, { y: 4.94, radius: 1.78, thickness: .07, material: accentMaterial, ry: .3 });
  const entry = arch(scene, root, `${device ? 'device' : 'automation'}-observatory-entry`, { y: 1.2, z: -2.06, radius: 1.0, thickness: .08, material: accentMaterial });
  for (const side of [-1, 1]) {
    beam(scene, root, `${device ? 'device' : 'automation'}-observatory-support-${side}`, { x: side * 2.45, y: .45, z: .42 }, { x: side * .88, y: 4.1, z: .05 }, { material: kit.carbon, diameter: .11 });
  }
  return { primary, core, bridge, motionNodes: [halo, core, entry] };
}

function createSupportDock(scene, root, kit, quality, accent) {
  const accentMaterial = kit.accent(accent, 'support-dock');
  const primary = addChild(root, MeshBuilder.CreateCylinder('support-dock-main-pod', { height: 3.4, diameterTop: 2.2, diameterBottom: 3.4, tessellation: 6 }, scene), { y: 1.7, ry: Math.PI / 6, material: kit.wetSteel });
  const core = arch(scene, root, 'support-dock-service-arc', { y: 2.42, z: -1.45, radius: 1.55, thickness: .09, material: accentMaterial });
  const bridge = deck(scene, root, 'support-dock-entry-platform', { y: .18, z: -1.72, width: 4.35, depth: 1.1, material: kit.carbon });
  const overpass = beam(scene, root, 'support-dock-overpass', { x: -4.3, y: 4.65, z: -.8 }, { x: 4.3, y: 4.65, z: -.8 }, { material: kit.graphite, diameter: .16 });
  if (quality !== 'lite') {
    panel(scene, root, 'support-dock-panel', { y: 2.1, z: -1.75, width: 1.35, height: .76, material: kit.glass });
  }
  return { primary, core, bridge, motionNodes: [core, overpass] };
}

function createProjectDistrict(scene, root, kit, quality, accent, geometry = {}, visualProfile = {}) {
  const accentMaterial = kit.accent(accent, 'private-project-district');
  const deckWidth = Math.max(1.4, Math.min(2.7, Number(geometry.deckWidth) || 2));
  const towerHeight = Math.max(2.1, Math.min(4.6, Number(geometry.towerHeight) || 3));
  const spireCount = Math.max(2, Math.min(4, Math.floor(Number(geometry.spireCount) || 3)));
  const primary = addChild(root, MeshBuilder.CreateCylinder('project-district-private-deck', { height: .14, diameter: deckWidth * 1.55, tessellation: 20 }, scene), { y: .07, material: kit.carbon });
  const core = taperedShell(scene, root, 'project-district-private-beacon', { y: .16, height: towerHeight, bottom: deckWidth * .45, top: deckWidth * .13, sides: 5, material: accentMaterial });
  const bridge = arch(scene, root, 'project-district-private-ring', { y: Math.min(towerHeight * .68, 2.55), radius: deckWidth * .52, thickness: .045, material: kit.cyan });
  for (let index = 0; index < spireCount; index += 1) {
    const phase = (Math.PI * 2 * index) / spireCount;
    const radius = deckWidth * .44;
    taperedShell(scene, root, `project-district-private-module-${index}`, { x: Math.cos(phase) * radius, y: .16, z: Math.sin(phase) * radius, height: towerHeight * (.52 + (index % 2) * .12), bottom: deckWidth * .22, top: deckWidth * .06, sides: 4, rz: Math.sin(phase) * .18, material: index % 2 ? kit.wetSteel : kit.graphite });
  }
  const profile = String(visualProfile?.silhouette || visualProfile?.id || 'signal-spire');
  if (profile === 'forge-buttress') {
    for (const side of [-1, 1]) {
      beam(scene, root, `project-district-forge-buttress-${side}`, { x: side * deckWidth * .66, y: .18, z: deckWidth * .14 }, { x: side * deckWidth * .25, y: towerHeight * .88, z: -deckWidth * .12 }, { material: side < 0 ? kit.violet : accentMaterial, diameter: .075 });
      panel(scene, root, `project-district-forge-fin-${side}`, { x: side * deckWidth * .48, y: towerHeight * .56, z: .18, width: deckWidth * .33, height: towerHeight * .48, ry: side * .28, material: kit.wetSteel });
    }
  } else if (profile === 'archive-canopy') {
    arch(scene, root, 'project-district-archive-canopy', { y: Math.min(towerHeight * .84, 3.4), radius: deckWidth * .64, thickness: .065, material: kit.mint });
    arch(scene, root, 'project-district-archive-inner-ring', { y: Math.min(towerHeight * .5, 2.15), radius: deckWidth * .34, thickness: .04, material: accentMaterial, ry: .22 });
  } else if (profile === 'garden-pavilion') {
    for (const side of [-1, 1]) {
      arch(scene, root, `project-district-garden-arc-${side}`, { x: side * deckWidth * .25, y: Math.min(towerHeight * .58, 2.35), z: .1, radius: deckWidth * .42, thickness: .058, material: side < 0 ? kit.mint : accentMaterial, ry: side * .46 });
    }
  } else {
    // Signal profile: a legible halo that reads at a distance without using
    // user content as signage or ornament.
    arch(scene, root, 'project-district-signal-crown', { y: Math.min(towerHeight * .9, 3.7), radius: deckWidth * .42, thickness: .052, material: accentMaterial });
  }
  if (quality === 'cinematic') {
    arch(scene, root, 'project-district-private-secondary-ring', { y: Math.min(towerHeight + .38, 4.8), radius: deckWidth * .34, thickness: .036, material: accentMaterial, ry: .28 });
  }
  return { primary, core, bridge, motionNodes: [bridge, core] };
}

/**
 * Creates an original authored-procedural landmark.  `project-district` only
 * consumes a sanitized render plan and never receives project text, files or
 * project references.
 */
export function createEonNoirLandmark(scene, {
  id = 'eon-noir-landmark',
  type = 'command-loom',
  parent = null,
  position = {},
  accent = EON_NOIR_PALETTE.cyan,
  quality = 'balanced',
  vectorArt = null,
  geometry = {},
  visualProfile = {},
  metadata = {}
} = {}) {
  const safeType = LANDMARK_IDS.has(String(type || '')) ? String(type) : 'command-loom';
  const root = new TransformNode(`${id}-${safeType}`, scene);
  root.parent = parent || null;
  root.position.set(Number(position.x) || 0, Number(position.y) || 0, Number(position.z) || 0);
  root.rotation.y = Number(position.heading ?? position.rotationY ?? 0) || 0;
  const kit = getMaterialKit(scene, vectorArt, quality);
  const factories = {
    'command-loom': () => createCommandLoom(scene, root, kit, quality, accent),
    'agent-theatre': () => createAgentTheatre(scene, root, kit, quality, accent),
    'creator-atrium': () => createCreatorAtrium(scene, root, kit, quality, accent),
    'forge-basilica': () => createForgeBasilica(scene, root, kit, quality, accent),
    'signal-sail': () => createSignalSail(scene, root, kit, quality, accent),
    'archive-canopy': () => createArchiveCanopy(scene, root, kit, quality, accent),
    'automation-observatory': () => createAutomationObservatory(scene, root, kit, quality, accent),
    'support-dock': () => createSupportDock(scene, root, kit, quality, accent),
    'device-observatory': () => createAutomationObservatory(scene, root, kit, quality, accent, { device: true }),
    'project-district': () => createProjectDistrict(scene, root, kit, quality, accent, geometry, visualProfile)
  };
  const composition = factories[safeType]();
  // Only landmark architecture is ray-pickable for the camera sightline
  // assist. World selection still uses transparent dedicated hit volumes.
  root.getChildMeshes?.().forEach((mesh) => {
    if (!mesh) return;
    mesh.isPickable = true;
    mesh.metadata = { ...(mesh.metadata || {}), eonCityCameraOcclusion: true, localVisualOnly: true };
  });
  root.metadata = {
    kind: 'eon-noir-landmark',
    id: String(id || '').slice(0, 96),
    type: safeType,
    originalProcedural: true,
    finalBinaryArt: false,
    remoteAssets: false,
    localOnly: true,
    privateProjectDataRead: false,
    projectReferenceExposed: false,
    promptExposed: false,
    fileExposed: false,
    secretExposed: false,
    visualProfile: safeType === 'project-district' ? String(visualProfile?.id || visualProfile?.silhouette || 'signal-spire').slice(0, 48) : '',
    ...metadata
  };
  const motionNodes = composition.motionNodes || [];
  if (motionNodes.length) {
    scene.registerBeforeRender(() => {
      if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
      const t = performance.now() * .00045;
      motionNodes.forEach((node, index) => {
        if (!node || node.isDisposed?.()) return;
        if (index % 2 === 0) node.rotation.z += .003 + index * .0006;
        else node.position.y += Math.sin(t + index) * .003;
      });
    });
  }
  return freeze({ root, ...composition, type: safeType, localOnly: true, originalProcedural: true, finalBinaryArt: false, remoteAssets: false });
}

/**
 * W455.1 — source-controlled world composition plan.
 *
 * This is a visual-density plan, not a simulation. It names the foreground,
 * mid-ground and distant layers that make the City read as a place before UI
 * overlays appear. Ambient couriers are decorative light forms only: they do
 * not represent people, accounts, routes, jobs, messages or product state.
 */
export const EON_NOIR_WORLD_COMPOSITION_SCHEMA = 'eon.city.noir-world-composition.w455.1.v1';

function normalizeWorldQuality(quality = 'balanced') {
  const normalized = String(quality || '').trim().toLowerCase();
  return normalized === 'lite' || normalized === 'cinematic' ? normalized : 'balanced';
}

export function getEonNoirWorldCompositionPlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeWorldQuality(quality);
  const ambientTransitCount = resolvedQuality === 'lite' ? 0 : resolvedQuality === 'cinematic' ? 2 : 1;
  const skylineTowerCount = resolvedQuality === 'lite' ? 4 : 6;
  return freeze({
    schema: EON_NOIR_WORLD_COMPOSITION_SCHEMA,
    quality: resolvedQuality,
    foreground: freeze(['wet-street-edges', 'route-rails', 'street-lanterns', 'arrival-thresholds']),
    midground: freeze(['original-landmark-silhouettes', 'entry-canopies', 'district-wayfinding']),
    background: freeze(['elevated-infrastructure', 'tapered-skyline', 'atmospheric-light-couriers']),
    skylineTowerCount,
    ambientTransit: freeze({
      count: ambientTransitCount,
      decorativeOnly: true,
      passengerData: false,
      routeData: false,
      stationStatus: false,
      remoteTraffic: false,
      simulatedTraffic: false
    }),
    originalProcedural: true,
    remoteAssets: false,
    privateDataRead: false,
    taskStatusFabricated: false,
    finalBinaryArt: false,
    deviceVisualProof: false,
    finalVisualCertification: false
  });
}

function createAmbientTransitCourier(scene, root, index, kit, quality) {
  const courier = new TransformNode(`eon-noir-ambient-transit-courier-${index}`, scene);
  courier.parent = root;
  const body = addChild(courier, MeshBuilder.CreateCylinder(`eon-noir-ambient-transit-body-${index}`, {
    height: 1.46,
    diameterTop: .36,
    diameterBottom: .48,
    tessellation: quality === 'cinematic' ? 12 : 8
  }, scene), { rz: Math.PI / 2, material: kit.wetSteel });
  const glass = addChild(courier, MeshBuilder.CreateCylinder(`eon-noir-ambient-transit-glass-${index}`, {
    height: .86,
    diameterTop: .29,
    diameterBottom: .31,
    tessellation: quality === 'cinematic' ? 12 : 8
  }, scene), { x: .03, rz: Math.PI / 2, material: index % 2 ? kit.violet : kit.cyan });
  const ring = addChild(courier, MeshBuilder.CreateTorus(`eon-noir-ambient-transit-ring-${index}`, {
    diameter: .54,
    thickness: .032,
    tessellation: 16
  }, scene), { x: -.18, rx: Math.PI / 2, material: kit.cyan });
  const fins = [-1, 1].map((side) => addChild(courier, MeshBuilder.CreateBox(`eon-noir-ambient-transit-fin-${index}-${side}`, {
    width: .18,
    height: .08,
    depth: .42
  }, scene), { x: side * .12, y: side * .24, z: .02, rz: side * .18, material: kit.carbon }));
  body.metadata = { kind: 'eon-noir-ambient-transit-body', decorative: true, localOnly: true };
  courier.metadata = {
    kind: 'eon-noir-ambient-transit-courier',
    decorative: true,
    localOnly: true,
    passengerData: false,
    routeData: false,
    stationStatus: false,
    remoteTraffic: false,
    simulatedTraffic: false,
    taskStatusFabricated: false
  };
  return freeze({ root: courier, body, glass, ring, fins: freeze(fins), phase: index * 9.8 });
}

/**
 * Adds a small, staged street-detail layer after the first City frame. These
 * are original local meshes for material rhythm and pedestrian-scale depth;
 * they are not simulated traffic, work status, or externally loaded assets.
 */
export function createEonNoirWorldDetailLayer(scene, { quality = 'balanced', vectorArt = null, seed = 'eon-noir' } = {}) {
  const root = new TransformNode('eon-noir-world-detail-layer', scene);
  const kit = getMaterialKit(scene, vectorArt, quality);
  const density = quality === 'lite' ? 2 : quality === 'cinematic' ? 6 : 4;
  const facadeFinCount = quality === 'lite' ? 2 : quality === 'cinematic' ? 7 : 5;
  let detailCount = 0;
  let reflectorCount = 0;
  let gardenCount = 0;

  // Paired entry pylons break up long flat street edges without using landmark boxes.
  [-7.6, -3.4, 1.4, 5.9, 9.5, 12.2].slice(0, density).forEach((z, index) => {
    const side = index % 2 ? 1 : -1;
    const accent = index % 3 === 0 ? kit.violet : index % 3 === 1 ? kit.cyan : kit.amber;
    taperedShell(scene, root, `eon-noir-entry-pylon-${index}`, {
      x: side * 4.55, y: .12, z, height: 2.1 + (index % 2) * .55, bottom: .48, top: .1, sides: 4, rz: side * -.16, material: kit.graphite
    });
    beam(scene, root, `eon-noir-entry-arc-${index}`, { x: side * 4.55, y: 1.25, z }, { x: side * 3.4, y: 1.9 + (index % 2) * .18, z: z - .18 }, { material: accent, diameter: .035 });
    detailCount += 2;
  });

  // Facade fins are micro-architecture, deliberately subordinate to the major silhouettes.
  for (let index = 0; index < facadeFinCount; index += 1) {
    const x = -11.6 + index * 1.05;
    const z = 7.25 + Math.sin(index * 1.4) * .28;
    const fin = taperedShell(scene, root, `eon-noir-backdrop-fin-${index}`, {
      x, y: .16, z, height: 2.65 + (index % 3) * .44, bottom: .24, top: .05, sides: 3, ry: .48, rz: -.18 + (index % 2) * .08, material: index % 2 ? kit.wetSteel : kit.carbon
    });
    fin.metadata = { kind: 'eon-noir-facade-fin', decorative: true, localOnly: true };
    detailCount += 1;
  }

  if (quality !== 'lite') {
    // Thin glass planes read as controlled wet-street reflection strips, not water simulation.
    for (const [index, z] of [-6.4, -1.1, 4.2, 8.7].entries()) {
      const reflector = addChild(root, MeshBuilder.CreatePlane(`eon-noir-reflection-strip-${index}`, { width: 2.2, height: .56 }, scene), {
        x: index % 2 ? 1.12 : -1.12, y: .115, z, rx: Math.PI / 2, material: kit.glass
      });
      reflector.metadata = { kind: 'eon-noir-reflection-strip', decorative: true, localOnly: true, simulatedWater: false };
      reflectorCount += 1;
    }
  }

  // Quiet-edge planters make the skyline feel inhabited without fabricating NPC activity.
  const planterCount = quality === 'lite' ? 2 : quality === 'cinematic' ? 6 : 4;
  for (let index = 0; index < planterCount; index += 1) {
    const phase = (Math.PI * 2 * index) / planterCount;
    const x = 8.8 + Math.cos(phase) * 1.7;
    const z = 8.5 + Math.sin(phase) * 1.15;
    const planter = addChild(root, MeshBuilder.CreateCylinder(`eon-noir-garden-planter-${index}`, { height: .32, diameterTop: .68, diameterBottom: .88, tessellation: 10 }, scene), { x, y: .16, z, material: kit.carbon });
    const foliage = addChild(root, MeshBuilder.CreateSphere(`eon-noir-garden-foliage-${index}`, { diameter: .52 + (index % 2) * .12, segments: 8 }, scene), { x, y: .55, z, material: index % 2 ? kit.mint : kit.glass });
    planter.metadata = { kind: 'eon-noir-quiet-edge-planter', decorative: true, localOnly: true };
    foliage.metadata = { kind: 'eon-noir-quiet-edge-foliage', decorative: true, localOnly: true };
    gardenCount += 2;
  }

  if (quality === 'cinematic') {
    const pod = addChild(root, MeshBuilder.CreateSphere('eon-noir-elevated-transit-pod', { diameterX: 1.45, diameterY: .44, diameterZ: .58, segments: 12 }, scene), { x: -1.8, y: 10.82, z: -23.4, material: kit.glass });
    const podHalo = arch(scene, root, 'eon-noir-elevated-transit-pod-halo', { x: -1.8, y: 10.82, z: -23.4, radius: .62, thickness: .035, material: kit.violet, ry: Math.PI / 2 });
    pod.metadata = { kind: 'eon-noir-decorative-transit-pod', decorative: true, localOnly: true, simulatedTransport: false };
    podHalo.metadata = { kind: 'eon-noir-decorative-transit-halo', decorative: true, localOnly: true };
    detailCount += 2;
  }

  root.metadata = {
    kind: 'eon-noir-world-detail-layer',
    seed: String(seed || 'eon-noir').slice(0, 96),
    quality: ['lite', 'balanced', 'cinematic'].includes(String(quality)) ? String(quality) : 'balanced',
    staged: 'street-life',
    originalProcedural: true,
    decorativeOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    privateProjectDataRead: false,
    promptExposed: false,
    secretExposed: false,
    localOnly: true
  };
  return freeze({ root, detailCount, reflectorCount, gardenCount, localOnly: true, originalProcedural: true, remoteAssets: false });
}

/** Adds infrastructure and horizon depth once for the city, not per district. */
export function createEonNoirWorldLayer(scene, { quality = 'balanced', vectorArt = null, seed = 'eon-noir' } = {}) {
  const composition = getEonNoirWorldCompositionPlan({ quality });
  const resolvedQuality = composition.quality;
  const root = new TransformNode('eon-noir-world-layer', scene);
  const kit = getMaterialKit(scene, vectorArt, resolvedQuality);
  const railMaterial = kit.wetSteel;
  const neonMaterial = kit.cyan;
  const remoteTraffic = resolvedQuality === 'lite' ? 1 : resolvedQuality === 'cinematic' ? 5 : 3;

  // Wet street edge / curb system: low, readable detail rather than a flat void.
  for (const side of [-1, 1]) {
    deck(scene, root, `eon-noir-curb-main-${side}`, { x: side * 2.0, y: .055, z: .45, width: .18, depth: 26.2, material: railMaterial });
    beam(scene, root, `eon-noir-route-rail-${side}`, { x: side * 3.15, y: .28, z: -10.7 }, { x: side * 3.15, y: .28, z: 11.45 }, { material: neonMaterial, diameter: .03 });
  }
  for (const z of [-8.8, -5.4, -1.8, 2.5, 6.4, 10.2]) {
    const barrier = deck(scene, root, `eon-noir-street-barrier-${z}`, { x: -5.75, y: .18, z, width: 1.35, depth: .34, material: kit.carbon });
    barrier.rotation.y = .18;
    const lantern = addChild(root, MeshBuilder.CreateSphere(`eon-noir-street-lantern-${z}`, { diameter: .2, segments: 8 }, scene), { x: -5.35, y: .72, z, material: z % 2 ? kit.magenta : kit.cyan });
    lantern.metadata = { kind: 'street-lantern', decorative: true, localOnly: true };
  }

  // Elevated mobility lines give the city vertical depth without simulating a real transport system.
  const overpass = beam(scene, root, 'eon-noir-elevated-transit-line', { x: -18.5, y: 11.2, z: -24.4 }, { x: 18.5, y: 11.2, z: -22.7 }, { material: kit.graphite, diameter: .11 });
  overpass.metadata = { kind: 'eon-noir-elevated-infrastructure', decorative: true, localOnly: true };
  beam(scene, root, 'eon-noir-elevated-transit-light', { x: -18.5, y: 10.98, z: -24.32 }, { x: 18.5, y: 10.98, z: -22.62 }, { material: kit.violet, diameter: .025 });

  // One or two light couriers create distant movement without implying transit
  // schedules, passengers, destinations, work state or a live city population.
  const ambientTransit = Array.from({ length: composition.ambientTransit.count }, (_, index) =>
    createAmbientTransitCourier(scene, root, index, kit, resolvedQuality)
  );

  // Original distant silhouettes: tapered / offset towers, never rows of plain blocks.
  const skylineSpecs = [
    [-18.8, -28.8, 10.2, 2.2, .26, 5, -.12],
    [-13.6, -30.5, 13.2, 2.6, .34, 4, .18],
    [-8.2, -32.2, 9.4, 1.9, .24, 6, -.2],
    [8.2, -31.8, 11.6, 2.2, .28, 5, .16],
    [13.4, -29.6, 14.4, 2.7, .38, 4, -.14],
    [18.6, -27.8, 9.0, 1.75, .2, 6, .21]
  ];
  skylineSpecs.slice(0, composition.skylineTowerCount).forEach(([x, z, height, bottom, top, sides, tilt], index) => {
    const tower = taperedShell(scene, root, `eon-noir-skyline-tower-${index}`, { x, z, height, bottom, top, sides, rz: tilt, material: index % 2 ? kit.graphite : kit.wetSteel });
    if (resolvedQuality !== 'lite') {
      const windowBand = arch(scene, root, `eon-noir-skyline-band-${index}`, { x, y: Math.max(3.4, height * .53), z, radius: Math.max(.55, bottom * .45), thickness: .025, material: index % 2 ? kit.magenta : kit.cyan });
      windowBand.rotation.y = index * .37;
    }
    tower.metadata = { kind: 'distant-eon-noir-silhouette', decorative: true, localOnly: true };
  });

  const drones = [];
  for (let index = 0; index < remoteTraffic; index += 1) {
    const drone = addChild(root, MeshBuilder.CreateSphere(`eon-noir-ambient-drone-${index}`, { diameter: .18, segments: 8 }, scene), { x: -9 + index * 6.6, y: 6.8 + index * .55, z: -22.5 - index * .7, material: index % 2 ? kit.magenta : kit.cyan });
    drones.push({ node: drone, originX: drone.position.x, originY: drone.position.y, originZ: drone.position.z, phase: index * 1.7 });
  }
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const t = performance.now() * .00044;
    drones.forEach(({ node, originX, originY, originZ, phase }) => {
      node.position.x = originX + Math.sin(t + phase) * 1.4;
      node.position.y = originY + Math.cos(t * 1.4 + phase) * .16;
      node.position.z = originZ + Math.sin(t * .82 + phase) * .24;
    });
    ambientTransit.forEach((courier) => {
      const cycle = ((t * 5.4 + courier.phase) % 29 + 29) % 29;
      courier.root.position.set(-14.35 + cycle, 11.22 + Math.sin(t * 1.8 + courier.phase) * .08, -23.55 + Math.sin(t * .65 + courier.phase) * .18);
      courier.root.rotation.y = Math.sin(t * .48 + courier.phase) * .035;
      courier.ring.rotation.z += .014;
    });
  });
  root.metadata = {
    kind: 'eon-noir-world-layer',
    seed: String(seed || 'eon-noir').slice(0, 96),
    composition,
    originalProcedural: true,
    remoteTraffic: false,
    simulatedTraffic: false,
    passengerData: false,
    routeData: false,
    stationStatus: false,
    taskStatusFabricated: false,
    remoteAssets: false,
    finalBinaryArt: false,
    localOnly: true
  };
  return freeze({
    root,
    composition,
    skylineCount: composition.skylineTowerCount,
    ambientDroneCount: drones.length,
    ambientTransitCount: ambientTransit.length,
    localOnly: true,
    originalProcedural: true,
    remoteAssets: false
  });
}

export function getEonNoirArchitectureSummary() {
  return freeze({
    schema: EON_NOIR_ARCHITECTURE_SCHEMA,
    style: 'EON Noir',
    landmarkCount: EON_NOIR_LANDMARK_CATALOG.length,
    primaryWorldLanguage: 'split fins, tapered shells, cantilevers, bridge infrastructure, canopy rings, wet-street reflection strips, quiet-edge planters, decorative ambient transit couriers and layered skyline',
    worldCompositionSchema: EON_NOIR_WORLD_COMPOSITION_SCHEMA,
    ambientTransitDecorativeOnly: true,
    plainBoxLandmarkLanguage: false,
    originalProcedural: true,
    finalBinaryArt: false,
    remoteAssets: false,
    privateProjectDataRead: false,
    projectReferenceExposed: false,
    deviceVisualProof: false,
    finalVisualCertification: false,
    stagedStreetDetail: true
  });
}

export function validateEonNoirArchitecture() {
  const ids = new Set();
  const errors = [];
  for (const entry of EON_NOIR_LANDMARK_CATALOG) {
    if (!/^[a-z0-9-]{4,64}$/.test(entry.id)) errors.push(`Invalid EON Noir landmark ID: ${entry.id}`);
    if (ids.has(entry.id)) errors.push(`Duplicate EON Noir landmark ID: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.title || !entry.role || !entry.silhouette) errors.push(`Incomplete EON Noir landmark brief: ${entry.id}`);
  }
  return freeze({ schema: EON_NOIR_ARCHITECTURE_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}

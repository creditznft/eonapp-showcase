#!/usr/bin/env python3
"""W422 — Generate original, self-contained EON City vector art extension.

This utility intentionally produces only local SVG source art. It embeds no image
references, fonts, remote URLs or user content. The generated SVGs are treated as
an original procedural/vector fallback, not as an approved final GLB/KTX2 release.
"""
from __future__ import annotations

from pathlib import Path
from hashlib import sha256
from textwrap import dedent
import json

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets' / 'city' / 'art'
KIT = ROOT / 'assets' / 'js' / 'city' / 'eon-city-vector-art-kit.js'

BASE = [
    ('wet-street', 'texture-wet-street.svg', 'repeating wet-street surface treatment', 'material', False, 1024, 1024, ['lite','balanced','cinematic']),
    ('brushed-graphite', 'texture-brushed-graphite.svg', 'brushed graphite facade and steel treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('glass-grid', 'texture-glass-grid.svg', 'night glass and window-grid treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('carbon-weave', 'texture-carbon-weave.svg', 'command-deck panel and street-furniture treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('neon-circuit', 'texture-neon-circuit.svg', 'local emissive console and route treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('skyline-depth', 'horizon-neon-skyline.svg', 'wide local skyline depth backdrop', 'backdrop', False, 2048, 768, ['balanced','cinematic']),
    ('eon-monogram', 'decal-eon-monogram.svg', 'EON City identity decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('arrival-emblem', 'decal-arrival-emblem.svg', 'Arrival Gate decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('command-emblem', 'decal-command-emblem.svg', 'Command District decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('creator-emblem', 'decal-creator-emblem.svg', 'Creator Atrium decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('forge-emblem', 'decal-forge-emblem.svg', 'Forge Bay decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('signal-emblem', 'decal-signal-emblem.svg', 'Signal Tower decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('automation-emblem', 'decal-automation-emblem.svg', 'Automation Observatory decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('archive-emblem', 'decal-archive-emblem.svg', 'Archive Gardens decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('eonbot-halo', 'decal-eonbot-halo.svg', 'EONBOT companion halo decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('wayfinding-cyan', 'decal-wayfinding-cyan.svg', 'cyan route arrow decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('wayfinding-violet', 'decal-wayfinding-violet.svg', 'violet route arrow decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('wayfinding-mint', 'decal-wayfinding-mint.svg', 'mint route arrow decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
]

EXTENSION_META = [
    ('prismatic-glass', 'texture-prismatic-glass.svg', 'prismatic Creator Atrium glass treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('amber-rail', 'texture-amber-rail.svg', 'industrial Forge Bay amber rail treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('bio-lattice', 'texture-bio-lattice.svg', 'bioluminescent Archive Gardens lattice treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('obsidian-ceramic', 'texture-obsidian-ceramic.svg', 'quiet command and archive ceramic panel treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('vapor-caustics', 'texture-vapor-caustics.svg', 'wet reflected-light surface treatment', 'material', False, 1024, 1024, ['cinematic']),
    ('signal-mesh', 'texture-signal-mesh.svg', 'violet Signal Tower field-mesh treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('archive-warmth', 'texture-archive-warmth.svg', 'amber Archive Gardens archival-inlay treatment', 'material', False, 1024, 1024, ['balanced','cinematic']),
    ('moon-grid', 'horizon-moon-grid.svg', 'layered celestial moon-grid backdrop', 'backdrop', True, 2048, 768, ['balanced','cinematic']),
    ('aurora-ribbon', 'horizon-aurora-ribbon.svg', 'cyan-violet atmospheric ribbon backdrop', 'backdrop', True, 2048, 768, ['cinematic']),
    ('aerial-traffic', 'horizon-aerial-traffic.svg', 'distant local aerial traffic silhouette layer', 'backdrop', True, 2048, 768, ['cinematic']),
    ('rain-veil', 'horizon-rain-veil.svg', 'subtle local rain veil layer', 'backdrop', True, 2048, 768, ['balanced','cinematic']),
    ('signal-array', 'horizon-signal-array.svg', 'Signal Tower antenna-array silhouette backdrop', 'backdrop', True, 2048, 768, ['balanced','cinematic']),
    ('forge-plumes', 'horizon-forge-plumes.svg', 'Forge Bay heat-plume silhouette backdrop', 'backdrop', True, 2048, 768, ['cinematic']),
    ('garden-canopy', 'horizon-garden-canopy.svg', 'Archive Gardens biolume canopy backdrop', 'backdrop', True, 2048, 768, ['balanced','cinematic']),
    ('relay-emblem', 'decal-relay-emblem.svg', 'Relay courtyard communication decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('observatory-emblem', 'decal-observatory-emblem.svg', 'Automation Observatory orbital decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('expedition-ember', 'decal-expedition-ember.svg', 'Ember Signal Expedition threshold decal', 'decal', True, 1024, 1024, ['cinematic']),
    ('expedition-tide', 'decal-expedition-tide.svg', 'Tide Signal Expedition threshold decal', 'decal', True, 1024, 1024, ['cinematic']),
    ('expedition-aurora', 'decal-expedition-aurora.svg', 'Aurora Signal Expedition threshold decal', 'decal', True, 1024, 1024, ['cinematic']),
    ('expedition-echo', 'decal-expedition-echo.svg', 'Echo Signal Expedition threshold decal', 'decal', True, 1024, 1024, ['cinematic']),
    ('protocol-grid', 'decal-protocol-grid.svg', 'Command protocol-grid floor decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('safety-grid', 'decal-safety-grid.svg', 'visible movement-safe-zone floor decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('transit-rune', 'decal-transit-rune.svg', 'City transit junction rune', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('portal-ring', 'decal-portal-ring.svg', 'Signal Expedition portal-ring decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('kinetic-lane', 'decal-kinetic-lane.svg', 'moving-route lane surface decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('biolume-leaf', 'decal-biolume-leaf.svg', 'Archive Gardens biolume leaf decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('archive-rune', 'decal-archive-rune.svg', 'Archive memory-rune decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('signal-chevron', 'decal-signal-chevron.svg', 'Signal Tower chevron route decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('forge-stripe', 'decal-forge-stripe.svg', 'Forge Bay industrial stripe decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('creator-prism', 'decal-creator-prism.svg', 'Creator Atrium prism floor decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('command-circuit', 'decal-command-circuit.svg', 'Command Circuit identity decal', 'decal', True, 1024, 1024, ['balanced','cinematic']),
    ('arrival-star', 'decal-arrival-star.svg', 'Arrival Gate orientation star decal', 'decal', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('neon-lantern', 'prop-neon-lantern.svg', 'local neon lantern billboard prop', 'prop', True, 1024, 1024, ['balanced','cinematic']),
    ('holo-kiosk', 'prop-holo-kiosk.svg', 'local holographic kiosk billboard prop', 'prop', True, 1024, 1024, ['balanced','cinematic']),
    ('drone-silhouette', 'prop-drone-silhouette.svg', 'distant autonomous drone silhouette prop', 'prop', True, 1024, 1024, ['cinematic']),
    ('garden-pod', 'prop-garden-pod.svg', 'Archive Gardens biolume pod billboard prop', 'prop', True, 1024, 1024, ['balanced','cinematic']),
    ('signal-kite', 'prop-signal-kite.svg', 'Signal Tower kinetic marker billboard prop', 'prop', True, 1024, 1024, ['cinematic']),
    ('street-barrier', 'prop-street-barrier.svg', 'city route safety barrier billboard prop', 'prop', True, 1024, 1024, ['lite','balanced','cinematic']),
    ('archive-orb', 'prop-archive-orb.svg', 'quiet Archive Gardens memory orb billboard prop', 'prop', True, 1024, 1024, ['balanced','cinematic']),
    ('tram-silhouette', 'prop-tram-silhouette.svg', 'distant local transit tram billboard prop', 'prop', True, 1024, 1024, ['cinematic']),
]

SVG_HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'


def write(name: str, svg: str) -> None:
    (ART / name).write_text(svg.strip() + '\n', encoding='utf-8')


def material_svg(kind: str) -> str:
    common = '''<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071526"/><stop offset=".5" stop-color="#132642"/><stop offset="1" stop-color="#050b17"/></linearGradient>
      <radialGradient id="glow" cx=".5" cy=".45" r=".7"><stop stop-color="#62f4ff" stop-opacity=".35"/><stop offset="1" stop-color="#0d1930" stop-opacity="0"/></radialGradient>
      <linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c4a4ff"/><stop offset="1" stop-color="#5030bb"/></linearGradient>
      <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c4ffdf"/><stop offset="1" stop-color="#1f9f82"/></linearGradient>
      <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe2a2"/><stop offset="1" stop-color="#c36a1c"/></linearGradient>
    </defs>'''
    if kind == 'prismatic-glass':
        body = '''<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>
        <g fill="none" stroke="#a9f8ff" stroke-opacity=".34" stroke-width="4"><path d="M-90 188 182 -42l260 230 256-230 298 230"/><path d="M-90 510 182 280l260 230 256-230 298 230"/><path d="M-90 832 182 602l260 230 256-230 298 230"/></g>
        <g fill="url(#violet)" fill-opacity=".25" stroke="#77f6ff" stroke-opacity=".48" stroke-width="3"><path d="M182 280 442 188l-90 252z"/><path d="M442 510 698 418l-92 256z"/><path d="M698 832 954 740l-92 256z"/></g>'''
    elif kind == 'amber-rail':
        body = '''<rect width="1024" height="1024" fill="#0d1523"/><g transform="rotate(-18 512 512)"><rect x="-180" y="0" width="1384" height="1024" fill="url(#amber)" fill-opacity=".2"/>
        <g stroke="#ffc871" stroke-width="28" stroke-opacity=".72"><path d="M-120 180 1144 180"/><path d="M-120 510 1144 510"/><path d="M-120 840 1144 840"/></g><g stroke="#151c2a" stroke-width="12"><path d="M-120 240 1144 240"/><path d="M-120 570 1144 570"/><path d="M-120 900 1144 900"/></g></g>
        <g fill="#ffe6ab" fill-opacity=".72"><circle cx="190" cy="170" r="16"/><circle cx="510" cy="500" r="16"/><circle cx="835" cy="830" r="16"/></g>'''
    elif kind == 'bio-lattice':
        body = '''<rect width="1024" height="1024" fill="#061b1c"/><rect width="1024" height="1024" fill="url(#glow)"/>
        <g fill="none" stroke="url(#mint)" stroke-width="8" stroke-opacity=".62"><path d="M0 220Q180 40 360 220T720 220T1080 220"/><path d="M0 520Q180 340 360 520T720 520T1080 520"/><path d="M0 820Q180 640 360 820T720 820T1080 820"/></g>
        <g fill="#8ff7c4" fill-opacity=".5"><ellipse cx="184" cy="206" rx="38" ry="17" transform="rotate(-38 184 206)"/><ellipse cx="360" cy="500" rx="38" ry="17" transform="rotate(34 360 500)"/><ellipse cx="720" cy="515" rx="38" ry="17" transform="rotate(-34 720 515)"/><ellipse cx="842" cy="817" rx="38" ry="17" transform="rotate(38 842 817)"/></g>'''
    elif kind == 'obsidian-ceramic':
        body = '''<rect width="1024" height="1024" fill="#080c15"/><g fill="#172235" stroke="#5d7aa0" stroke-opacity=".45" stroke-width="6"><path d="M0 0h242l62 94-64 154H0z"/><path d="M270 0h242l62 94-64 154H270z"/><path d="M540 0h242l62 94-64 154H540z"/><path d="M810 0h214v248H810z"/><path d="M0 270h242l62 94-64 154H0z"/><path d="M270 270h242l62 94-64 154H270z"/><path d="M540 270h242l62 94-64 154H540z"/><path d="M810 270h214v248H810z"/><path d="M0 540h242l62 94-64 154H0z"/><path d="M270 540h242l62 94-64 154H270z"/><path d="M540 540h242l62 94-64 154H540z"/><path d="M810 540h214v248H810z"/><path d="M0 810h242l62 94-64 120H0z"/><path d="M270 810h242l62 94-64 120H270z"/><path d="M540 810h242l62 94-64 120H540z"/><path d="M810 810h214v214H810z"/></g><g fill="#b6a1ff" fill-opacity=".26"><circle cx="121" cy="124" r="36"/><circle cx="661" cy="394" r="36"/><circle cx="391" cy="664" r="36"/><circle cx="932" cy="934" r="36"/></g>'''
    elif kind == 'vapor-caustics':
        body = '''<rect width="1024" height="1024" fill="#061525"/><rect width="1024" height="1024" fill="url(#glow)"/>
        <g fill="none" stroke="#8ceeff" stroke-width="7" stroke-opacity=".38"><path d="M-40 170c110-80 180 100 290 10s180-120 290-20 180 70 290-20 180-80 240 0"/><path d="M-40 390c110-80 180 100 290 10s180-120 290-20 180 70 290-20 180-80 240 0"/><path d="M-40 610c110-80 180 100 290 10s180-120 290-20 180 70 290-20 180-80 240 0"/><path d="M-40 830c110-80 180 100 290 10s180-120 290-20 180 70 290-20 180-80 240 0"/></g>
        <g stroke="#c2a4ff" stroke-width="2" stroke-opacity=".45"><path d="M0 0 1024 1024M240 0 1024 784M480 0 1024 544"/></g>'''
    elif kind == 'signal-mesh':
        body = '''<rect width="1024" height="1024" fill="#120b29"/><rect width="1024" height="1024" fill="url(#glow)"/>
        <g fill="none" stroke="url(#violet)" stroke-width="5" stroke-opacity=".64"><path d="M0 0 1024 1024M256 0 1024 768M512 0 1024 512M768 0 1024 256M0 256 768 1024M0 512 512 1024M0 768 256 1024"/><path d="M1024 0 0 1024M768 0 0 768M512 0 0 512M256 0 0 256M1024 256 256 1024M1024 512 512 1024M1024 768 768 1024"/></g>
        <g fill="#e3d4ff" fill-opacity=".72"><circle cx="512" cy="512" r="29"/><circle cx="256" cy="256" r="12"/><circle cx="768" cy="768" r="12"/><circle cx="768" cy="256" r="12"/><circle cx="256" cy="768" r="12"/></g>'''
    elif kind == 'archive-warmth':
        body = '''<rect width="1024" height="1024" fill="#1b120d"/><defs><radialGradient id="warm" cx=".5" cy=".5" r=".72"><stop stop-color="#ffd27d" stop-opacity=".4"/><stop offset="1" stop-color="#20140d" stop-opacity="0"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#warm)"/>
        <g fill="none" stroke="url(#amber)" stroke-width="6" stroke-opacity=".58"><path d="M120 900V120h784v780H120z"/><path d="M220 800V220h584v580H220z"/><path d="M320 700V320h384v380H320z"/></g><g fill="#fff0c5" fill-opacity=".54"><circle cx="512" cy="512" r="70"/><circle cx="512" cy="512" r="24"/><circle cx="320" cy="320" r="13"/><circle cx="704" cy="704" r="13"/></g>'''
    else:
        raise ValueError(kind)
    return SVG_HEAD.format(w=1024,h=1024) + common + body + '</svg>'


def horizon_svg(kind: str) -> str:
    common = '''<defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07152a" stop-opacity=".05"/><stop offset="1" stop-color="#031020" stop-opacity=".94"/></linearGradient><linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7ef8ff"/><stop offset="1" stop-color="#0c899c"/></linearGradient><linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5c0ff"/><stop offset="1" stop-color="#5f39bf"/></linearGradient><linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bafbd7"/><stop offset="1" stop-color="#23977c"/></linearGradient></defs>'''
    if kind == 'moon-grid':
        body = '''<rect width="2048" height="768" fill="url(#night)"/><circle cx="1538" cy="214" r="168" fill="#bfeaff" fill-opacity=".16"/><circle cx="1538" cy="214" r="126" fill="none" stroke="#8cf7ff" stroke-opacity=".46" stroke-width="5"/><g fill="none" stroke="#8cf7ff" stroke-opacity=".22" stroke-width="3"><path d="M1370 214h336M1538 46v336"/><circle cx="1538" cy="214" r="78"/><circle cx="1538" cy="214" r="39"/></g><g fill="#d7f8ff" fill-opacity=".6"><circle cx="216" cy="116" r="4"/><circle cx="438" cy="204" r="3"/><circle cx="692" cy="88" r="5"/><circle cx="1018" cy="142" r="3"/><circle cx="1194" cy="274" r="4"/><circle cx="1860" cy="120" r="3"/></g>'''
    elif kind == 'aurora-ribbon':
        body = '''<rect width="2048" height="768" fill="none"/><path d="M-80 500C240 210 520 660 830 336s520-214 760-40 346-95 550-280" fill="none" stroke="url(#cyan)" stroke-opacity=".55" stroke-width="42"/><path d="M-80 560C250 280 530 710 852 392s526-168 778-10 330-122 510-250" fill="none" stroke="url(#violet)" stroke-opacity=".44" stroke-width="21"/><path d="M-80 590C260 350 548 738 870 434s516-112 764 24 312-120 470-210" fill="none" stroke="#bdfde4" stroke-opacity=".26" stroke-width="8"/>'''
    elif kind == 'aerial-traffic':
        body = '''<rect width="2048" height="768" fill="none"/><g stroke="url(#cyan)" stroke-width="7" stroke-linecap="round" stroke-opacity=".62"><path d="M80 220h184l48-26 54 26h126"/><path d="M790 350h170l54-30 55 30h180"/><path d="M1460 175h126l39-21 40 21h125"/></g><g stroke="url(#violet)" stroke-width="3" stroke-opacity=".55"><path d="M10 240h270M708 370h610M1390 195h390"/></g><g fill="#e0faff" fill-opacity=".7"><circle cx="276" cy="220" r="9"/><circle cx="1020" cy="350" r="10"/><circle cx="1630" cy="175" r="8"/></g>'''
    elif kind == 'rain-veil':
        lines = ''.join(f'<path d="M{x} -40 {x-120} 820"/>' for x in range(0, 2200, 90))
        body = f'''<rect width="2048" height="768" fill="none"/><g stroke="#b7efff" stroke-opacity=".18" stroke-width="3">{lines}</g><g stroke="#9c8cff" stroke-opacity=".12" stroke-width="6"><path d="M200 -20 80 820"/><path d="M970 -20 850 820"/><path d="M1700 -20 1580 820"/></g>'''
    elif kind == 'signal-array':
        body = '''<rect width="2048" height="768" fill="none"/><g fill="#091426" stroke="url(#violet)" stroke-opacity=".62" stroke-width="5"><path d="M290 740 390 150l100 590z"/><path d="M900 740 1010 64l112 676z"/><path d="M1510 740 1610 210l100 530z"/></g><g fill="none" stroke="#bda7ff" stroke-opacity=".36" stroke-width="5"><path d="M360 222c50-74 100-74 150 0"/><path d="M980 166c58-84 116-84 174 0"/><path d="M1580 280c48-66 96-66 144 0"/></g><g fill="#d9c9ff" fill-opacity=".76"><circle cx="440" cy="138" r="13"/><circle cx="1066" cy="52" r="15"/><circle cx="1660" cy="198" r="12"/></g>'''
    elif kind == 'forge-plumes':
        body = '''<rect width="2048" height="768" fill="none"/><g fill="none" stroke="url(#amber)" stroke-linecap="round"><path d="M320 730C220 520 450 480 350 220S550 84 498 -10" stroke-opacity=".35" stroke-width="72"/><path d="M1060 730C970 560 1190 488 1080 286S1290 110 1232 -10" stroke-opacity=".28" stroke-width="86"/><path d="M1760 730c-90-188 128-260 8-448S1962 120 1918-10" stroke-opacity=".34" stroke-width="66"/></g><g stroke="#ffe4a5" stroke-opacity=".44" stroke-width="4"><path d="M250 730h350M940 730h310M1640 730h290"/></g>'''
    elif kind == 'garden-canopy':
        body = '''<rect width="2048" height="768" fill="none"/><g fill="url(#mint)" fill-opacity=".32" stroke="#c2ffe0" stroke-opacity=".46" stroke-width="3"><path d="M0 560c180-190 310 40 490-132s310 20 496-142 300 32 496-150 306 10 466-142v674H0z"/></g><g fill="#d4ffe8" fill-opacity=".55"><ellipse cx="280" cy="394" rx="48" ry="18" transform="rotate(-30 280 394)"/><ellipse cx="720" cy="310" rx="52" ry="20" transform="rotate(26 720 310)"/><ellipse cx="1180" cy="246" rx="55" ry="21" transform="rotate(-23 1180 246)"/><ellipse cx="1620" cy="170" rx="46" ry="18" transform="rotate(30 1620 170)"/></g>'''
    else:
        raise ValueError(kind)
    return SVG_HEAD.format(w=2048,h=768) + common + body + '</svg>'


def emblem_svg(kind: str) -> str:
    # A common transparent emblem language with deliberate differentiated geometry.
    common = '''<defs><radialGradient id="g" cx=".5" cy=".45" r=".6"><stop stop-color="#d9fbff" stop-opacity=".7"/><stop offset=".42" stop-color="#78f8ff" stop-opacity=".25"/><stop offset="1" stop-color="#101a32" stop-opacity="0"/></radialGradient><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#90f9ff"/><stop offset="1" stop-color="#1a75a1"/></linearGradient><linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e3d4ff"/><stop offset="1" stop-color="#6a42cb"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d3ffe8"/><stop offset="1" stop-color="#20977c"/></linearGradient><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe8b4"/><stop offset="1" stop-color="#bc6a20"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/>'''
    shapes = {
        'relay-emblem': '<circle cx="512" cy="512" r="260" fill="none" stroke="url(#c)" stroke-width="34"/><path d="M300 570 512 300l212 270-212 150z" fill="none" stroke="#d8fbff" stroke-width="28"/><path d="M190 512h134M700 512h134" stroke="#80f8ff" stroke-width="22"/>',
        'observatory-emblem': '<circle cx="512" cy="512" r="280" fill="none" stroke="url(#m)" stroke-width="28"/><ellipse cx="512" cy="512" rx="300" ry="138" fill="none" stroke="#b9ffdf" stroke-width="18" transform="rotate(-28 512 512)"/><circle cx="512" cy="512" r="68" fill="url(#m)"/><circle cx="770" cy="370" r="28" fill="#dcffef"/>',
        'expedition-ember': '<path d="M512 170c160 144 180 254 110 370-48 78-75 144-36 250-122-48-230-150-208-286 18-104 98-138 134-334z" fill="url(#a)" fill-opacity=".7" stroke="#fff0be" stroke-width="22"/><path d="M498 320c78 112 62 182 12 258" fill="none" stroke="#fff3ca" stroke-width="20"/>',
        'expedition-tide': '<path d="M170 590c120-186 232-186 342 0 110-186 222-186 342 0" fill="none" stroke="url(#c)" stroke-width="48"/><path d="M170 714c120-186 232-186 342 0 110-186 222-186 342 0" fill="none" stroke="#b6faff" stroke-width="18"/><circle cx="512" cy="310" r="92" fill="none" stroke="#d7fbff" stroke-width="24"/>',
        'expedition-aurora': '<path d="M124 650C290 292 434 780 596 410s206 78 304-216" fill="none" stroke="url(#v)" stroke-width="64"/><path d="M124 650C290 292 434 780 596 410s206 78 304-216" fill="none" stroke="#a2fbff" stroke-opacity=".76" stroke-width="18"/>',
        'expedition-echo': '<circle cx="512" cy="512" r="302" fill="none" stroke="url(#v)" stroke-width="24"/><circle cx="512" cy="512" r="210" fill="none" stroke="#a5f8ff" stroke-width="18"/><circle cx="512" cy="512" r="116" fill="none" stroke="#f0e7ff" stroke-width="13"/><path d="M512 206v612M206 512h612" stroke="#7cf9ff" stroke-width="14"/>',
        'protocol-grid': '<rect x="212" y="212" width="600" height="600" rx="54" fill="none" stroke="url(#c)" stroke-width="28"/><path d="M362 212v600M512 212v600M662 212v600M212 362h600M212 512h600M212 662h600" stroke="#8ef9ff" stroke-opacity=".68" stroke-width="16"/><circle cx="512" cy="512" r="52" fill="url(#c)"/>',
        'safety-grid': '<path d="M512 132 850 326v372L512 892 174 698V326z" fill="none" stroke="url(#a)" stroke-width="28"/><path d="M512 212v600M260 366h504M260 658h504" stroke="#fff0be" stroke-width="18"/><circle cx="512" cy="512" r="45" fill="#fff0be"/>',
        'transit-rune': '<path d="M208 512h608M512 208v608" stroke="url(#c)" stroke-width="44"/><path d="m512 160 104 104-104 104-104-104zM512 656l104 104-104 104-104-104zM160 512l104-104 104 104-104 104zM656 512l104-104 104 104-104 104z" fill="url(#v)"/>',
        'portal-ring': '<circle cx="512" cy="512" r="302" fill="none" stroke="url(#v)" stroke-width="46"/><circle cx="512" cy="512" r="212" fill="none" stroke="#7ef8ff" stroke-opacity=".78" stroke-width="14"/><path d="M512 210 606 512 512 814 418 512z" fill="none" stroke="#e9dfff" stroke-width="22"/>',
        'kinetic-lane': '<path d="M150 690 470 184l130 240 274-168-322 520-132-232z" fill="url(#c)" fill-opacity=".72" stroke="#d7fbff" stroke-width="18"/><path d="M202 738 514 694M394 424l284-46" stroke="#a9faff" stroke-width="15"/>',
        'biolume-leaf': '<path d="M512 160C760 252 826 456 704 710 548 812 368 744 288 550 268 360 366 224 512 160z" fill="url(#m)" fill-opacity=".66" stroke="#d9ffea" stroke-width="24"/><path d="M376 650 660 330M420 512l178 12M492 432l-6 168" stroke="#e4ffef" stroke-width="18"/>',
        'archive-rune': '<rect x="230" y="230" width="564" height="564" rx="98" fill="none" stroke="url(#a)" stroke-width="28"/><path d="M350 672 512 352l162 320M406 564h212" stroke="#fff0be" stroke-width="24"/><circle cx="512" cy="512" r="58" fill="none" stroke="#ffd884" stroke-width="14"/>',
        'signal-chevron': '<path d="m210 312 302 200 302-200M210 512l302 200 302-200" fill="none" stroke="url(#v)" stroke-width="62"/><path d="m242 320 270 174 270-174" fill="none" stroke="#dcd1ff" stroke-width="14"/>',
        'forge-stripe': '<path d="M112 734 632 168l92 84L204 818zM360 836 840 310l76 80-480 526z" fill="url(#a)" fill-opacity=".78" stroke="#ffe6ae" stroke-width="16"/><circle cx="248" cy="708" r="26" fill="#fff0bd"/><circle cx="764" cy="350" r="26" fill="#fff0bd"/>',
        'creator-prism': '<path d="m512 132 276 194-104 354H340L236 326z" fill="url(#v)" fill-opacity=".55" stroke="#c8fbff" stroke-width="24"/><path d="M512 132v548M236 326l276 150 276-150M340 680l172-204 172 204" fill="none" stroke="#a8f8ff" stroke-width="18"/>',
        'command-circuit': '<circle cx="512" cy="512" r="286" fill="none" stroke="url(#c)" stroke-width="34"/><path d="M512 226v132M512 666v132M226 512h132M666 512h132M310 310l94 94M620 620l94 94M714 310l-94 94M404 620l-94 94" stroke="#d8fbff" stroke-width="24"/><circle cx="512" cy="512" r="88" fill="url(#c)"/>',
        'arrival-star': '<path d="m512 122 84 280 282 110-282 110-84 280-84-280-282-110 282-110z" fill="url(#c)" fill-opacity=".62" stroke="#e1fbff" stroke-width="22"/><circle cx="512" cy="512" r="52" fill="#dffcff"/>',
    }
    return SVG_HEAD.format(w=1024,h=1024) + common + shapes[kind] + '</svg>'


def prop_svg(kind: str) -> str:
    common = '''<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b5fbff"/><stop offset="1" stop-color="#1985a5"/></linearGradient><linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e0d0ff"/><stop offset="1" stop-color="#633dc1"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#caffdf"/><stop offset="1" stop-color="#218d75"/></linearGradient><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe4a6"/><stop offset="1" stop-color="#c66d21"/></linearGradient></defs>'''
    shapes = {
        'neon-lantern': '<path d="M450 848h124l-28-204h-68z" fill="#14233c" stroke="#b6fbff" stroke-width="16"/><rect x="370" y="260" width="284" height="390" rx="88" fill="url(#c)" fill-opacity=".46" stroke="#e5fdff" stroke-width="20"/><path d="M420 346h184M420 560h184" stroke="#dffcff" stroke-width="15"/><circle cx="512" cy="456" r="66" fill="#e8ffff" fill-opacity=".78"/>',
        'holo-kiosk': '<path d="M350 818h324l-58-176H408z" fill="#132440" stroke="#a7f8ff" stroke-width="18"/><rect x="276" y="222" width="472" height="432" rx="36" fill="url(#v)" fill-opacity=".42" stroke="#d9faff" stroke-width="21"/><path d="M332 350h360M332 446h220M332 542h290" stroke="#bbf8ff" stroke-width="17" stroke-opacity=".82"/><circle cx="624" cy="480" r="48" fill="url(#c)"/>',
        'drone-silhouette': '<path d="M256 510 418 422h188l162 88-134 94H390z" fill="url(#c)" fill-opacity=".65" stroke="#d8fbff" stroke-width="22"/><path d="M310 474 210 364M714 474l100-110M350 606 268 738M674 606l82 132" stroke="#96f8ff" stroke-width="22"/><circle cx="512" cy="510" r="44" fill="#e3ffff"/><circle cx="512" cy="510" r="17" fill="#7149dc"/>',
        'garden-pod': '<ellipse cx="512" cy="600" rx="260" ry="280" fill="url(#m)" fill-opacity=".5" stroke="#d6ffe9" stroke-width="22"/><path d="M512 320c118 94 156 208 0 416-156-208-118-322 0-416z" fill="#d8ffe9" fill-opacity=".38"/><path d="M512 230v604M314 600h396" stroke="#b7ffdc" stroke-width="18"/><circle cx="512" cy="606" r="52" fill="#eafff2"/>',
        'signal-kite': '<path d="m512 152 226 260-226 460-226-460z" fill="url(#v)" fill-opacity=".58" stroke="#e4dbff" stroke-width="22"/><path d="M512 152v720M286 412h452" stroke="#b9f9ff" stroke-width="15"/><path d="M512 872 628 946M512 872 396 946" stroke="#af8aff" stroke-width="18"/>',
        'street-barrier': '<rect x="162" y="564" width="700" height="122" rx="22" fill="#18243a" stroke="#e4fbff" stroke-width="18"/><path d="M198 644 352 564l156 122 156-122 160 80" fill="none" stroke="url(#a)" stroke-width="48"/><path d="M264 686v146M760 686v146" stroke="#b5cbe4" stroke-width="28"/>',
        'archive-orb': '<circle cx="512" cy="490" r="270" fill="url(#a)" fill-opacity=".42" stroke="#fff0bf" stroke-width="22"/><circle cx="512" cy="490" r="174" fill="none" stroke="#ffdc89" stroke-width="15"/><path d="M248 700h528" stroke="#d7a659" stroke-width="20"/><path d="M410 766h204" stroke="#bd8039" stroke-width="45"/><circle cx="512" cy="490" r="52" fill="#fff3ce"/>',
        'tram-silhouette': '<path d="M188 620c0-138 100-242 228-242h192c128 0 228 104 228 242v96H188z" fill="#14243c" stroke="#c1faff" stroke-width="20"/><rect x="312" y="458" width="400" height="140" rx="44" fill="url(#c)" fill-opacity=".42"/><path d="M256 716h512M356 716v100M668 716v100" stroke="#b6d5ed" stroke-width="22"/><circle cx="350" cy="776" r="38" fill="#101724" stroke="#d9fbff" stroke-width="14"/><circle cx="674" cy="776" r="38" fill="#101724" stroke="#d9fbff" stroke-width="14"/>',
    }
    return SVG_HEAD.format(w=1024,h=1024) + common + shapes[kind] + '</svg>'


def write_extension() -> None:
    material_kinds = ['prismatic-glass','amber-rail','bio-lattice','obsidian-ceramic','vapor-caustics','signal-mesh','archive-warmth']
    for kind in material_kinds:
        write(f'texture-{kind}.svg', material_svg(kind))
    horizon_kinds = ['moon-grid','aurora-ribbon','aerial-traffic','rain-veil','signal-array','forge-plumes','garden-canopy']
    for kind in horizon_kinds:
        write(f'horizon-{kind}.svg', horizon_svg(kind))
    emblem_kinds = ['relay-emblem','observatory-emblem','expedition-ember','expedition-tide','expedition-aurora','expedition-echo','protocol-grid','safety-grid','transit-rune','portal-ring','kinetic-lane','biolume-leaf','archive-rune','signal-chevron','forge-stripe','creator-prism','command-circuit','arrival-star']
    for kind in emblem_kinds:
        write(f'decal-{kind}.svg', emblem_svg(kind))
    prop_kinds = ['neon-lantern','holo-kiosk','drone-silhouette','garden-pod','signal-kite','street-barrier','archive-orb','tram-silhouette']
    for kind in prop_kinds:
        write(f'prop-{kind}.svg', prop_svg(kind))


def catalog_rows(entries):
    rows = []
    for aid, file, role, cat, alpha, width, height, qualities in entries:
        source = ART / file
        if not source.exists():
            raise FileNotFoundError(source)
        digest = sha256(source.read_bytes()).hexdigest()
        rows.append({
            'id': aid, 'file': file, 'role': role, 'category': cat, 'alpha': alpha,
            'width': width, 'height': height, 'qualities': qualities, 'sha256': digest
        })
    return rows


def js_entry(row: dict) -> str:
    q = ', '.join(json.dumps(v) for v in row['qualities'])
    return f"  art({{ id: {json.dumps(row['id'])}, file: {json.dumps(row['file'])}, role: {json.dumps(row['role'])}, category: {json.dumps(row['category'])}, alpha: {str(row['alpha']).lower()}, width: {row['width']}, height: {row['height']}, qualities: [{q}], sha256: {json.dumps(row['sha256'])} }})"


def write_kit(base_rows, extension_rows) -> None:
    entries = base_rows + extension_rows
    base_ids = ', '.join(json.dumps(r['id']) for r in base_rows)
    ext_ids = ', '.join(json.dumps(r['id']) for r in extension_rows)
    source = f'''/**
 * W419/W422 — EON City original vector art pack.
 *
 * The first 18 assets form the W419 foundation. W422 extends that foundation
 * to a 58-piece local environmental art system: materials, backdrops, decals
 * and billboard props. It remains an original, same-origin vector fallback;
 * reviewed GLB/KTX2 final art still belongs to the separate W417 release lane.
 */
export const EON_CITY_VECTOR_ART_SCHEMA = 'eon.city.vector-art.w422.v1';
export const EON_CITY_VECTOR_ART_ROOT = '/assets/city/art/';
export const EON_CITY_VECTOR_ART_FOUNDATION_IDS = Object.freeze([{base_ids}]);
export const EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS = Object.freeze([{ext_ids}]);

const freeze = (value) => Object.freeze(value);
const art = (entry) => freeze({{
  status: 'shipped-original-vector',
  origin: 'EONAPP original in-house work',
  licence: 'EONAPP controlled original work',
  sameOrigin: true,
  remoteNetwork: false,
  userData: false,
  finalBinaryArt: false,
  ...entry,
  qualities: freeze([...(entry.qualities || ['lite', 'balanced', 'cinematic'])])
}});

/** SHA-256 values are generated from the exact source SVG bytes in this package. */
export const EON_CITY_VECTOR_ART_CATALOG = freeze([
{',\n'.join(js_entry(row) for row in entries)}
]);

const BY_ID = new Map(EON_CITY_VECTOR_ART_CATALOG.map((entry) => [entry.id, entry]));
const QUALITY_ORDER = freeze(['lite', 'balanced', 'cinematic']);
const CATEGORY_ORDER = freeze(['material', 'backdrop', 'decal', 'prop']);

export function normalizeCityVectorArtQuality(value = 'balanced') {{
  const candidate = String(value || '').trim().toLowerCase();
  return QUALITY_ORDER.includes(candidate) ? candidate : 'balanced';
}}

export function getCityVectorArtAsset(id = '') {{
  return BY_ID.get(String(id || '').trim()) || null;
}}

export function getCityVectorArtPath(id = '') {{
  const entry = getCityVectorArtAsset(id);
  return entry ? `${{EON_CITY_VECTOR_ART_ROOT}}${{entry.file}}` : null;
}}

export function getCityVectorArtPlan({{ quality = 'balanced', categories = null, ids = null }} = {{}}) {{
  const resolvedQuality = normalizeCityVectorArtQuality(quality);
  const allowedCategories = Array.isArray(categories) && categories.length ? new Set(categories) : null;
  const allowedIds = Array.isArray(ids) && ids.length ? new Set(ids) : null;
  const entries = EON_CITY_VECTOR_ART_CATALOG
    .filter((entry) => entry.qualities.includes(resolvedQuality) && (!allowedCategories || allowedCategories.has(entry.category)) && (!allowedIds || allowedIds.has(entry.id)))
    .map((entry) => freeze({{ ...entry, path: getCityVectorArtPath(entry.id) }}));
  return freeze({{
    schema: EON_CITY_VECTOR_ART_SCHEMA,
    quality: resolvedQuality,
    entries: freeze(entries),
    sameOriginOnly: true,
    remoteNetwork: false,
    finalBinaryArt: false,
    originalVectorArt: true
  }});
}}

export function getCityVectorArtCategoryCounts(catalog = EON_CITY_VECTOR_ART_CATALOG) {{
  const counts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
  for (const entry of catalog || []) {{
    if (Object.hasOwn(counts, entry?.category)) counts[entry.category] += 1;
  }}
  return freeze(counts);
}}

export function validateCityVectorArtCatalog(catalog = EON_CITY_VECTOR_ART_CATALOG) {{
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(catalog) || catalog.length !== 58) errors.push('W422 requires exactly 58 original vector art entries.');
  const counts = getCityVectorArtCategoryCounts(catalog);
  const expected = {{ material: 12, backdrop: 8, decal: 30, prop: 8 }};
  for (const category of CATEGORY_ORDER) {{
    if (counts[category] !== expected[category]) errors.push(`W422 needs ${{expected[category]}} ${{category}} art entries.`);
  }}
  for (const requiredId of [...EON_CITY_VECTOR_ART_FOUNDATION_IDS, ...EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS]) {{
    if (!(catalog || []).some((entry) => entry?.id === requiredId)) errors.push(`Missing required original art ID: ${{requiredId}}.`);
  }}
  for (const entry of catalog || []) {{
    if (!/^[a-z0-9-]{{3,48}}$/.test(String(entry?.id || ''))) errors.push('Vector art ID is invalid.');
    if (ids.has(entry?.id)) errors.push(`Duplicate vector art ID: ${{entry?.id}}.`);
    ids.add(entry?.id);
    if (!/^[-a-z0-9]+\\.svg$/i.test(String(entry?.file || ''))) errors.push(`${{entry?.id || 'unknown'}} must be a local SVG file.`);
    if (!CATEGORY_ORDER.includes(entry?.category)) errors.push(`${{entry?.id || 'unknown'}} has an unsupported art category.`);
    if (entry?.status !== 'shipped-original-vector' || entry?.origin !== 'EONAPP original in-house work' || entry?.licence !== 'EONAPP controlled original work') errors.push(`${{entry?.id || 'unknown'}} lacks original-art provenance.`);
    if (entry?.sameOrigin !== true || entry?.remoteNetwork !== false || entry?.userData !== false || entry?.finalBinaryArt !== false) errors.push(`${{entry?.id || 'unknown'}} violates the local art boundary.`);
    if (!Array.isArray(entry?.qualities) || !entry.qualities.length || !entry.qualities.every((quality) => QUALITY_ORDER.includes(quality))) errors.push(`${{entry?.id || 'unknown'}} has invalid quality tiers.`);
    if (!/^[a-f0-9]{{64}}$/i.test(String(entry?.sha256 || ''))) errors.push(`${{entry?.id || 'unknown'}} needs a source SHA-256.`);
    if (!Number.isInteger(entry?.width) || entry.width < 256 || !Number.isInteger(entry?.height) || entry.height < 256) errors.push(`${{entry?.id || 'unknown'}} has invalid source dimensions.`);
  }}
  return freeze({{ schema: EON_CITY_VECTOR_ART_SCHEMA, ok: errors.length === 0, errors: freeze(errors), catalogCount: Array.isArray(catalog) ? catalog.length : 0, categoryCounts: counts, localOnly: true }});
}}

export function getCityVectorArtSummary({{ quality = 'balanced' }} = {{}}) {{
  const plan = getCityVectorArtPlan({{ quality }});
  const validation = validateCityVectorArtCatalog();
  return freeze({{
    schema: EON_CITY_VECTOR_ART_SCHEMA,
    valid: validation.ok,
    quality: plan.quality,
    catalogCount: EON_CITY_VECTOR_ART_CATALOG.length,
    foundationCatalogCount: EON_CITY_VECTOR_ART_FOUNDATION_IDS.length,
    deepArtExtensionCount: EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS.length,
    categoryCounts: getCityVectorArtCategoryCounts(),
    loadedPlanCount: plan.entries.length,
    originalVectorArtShipped: true,
    binaryArtShipped: false,
    finalVisualCertification: false,
    finalInstitutionalArtClaim: false,
    localOnly: true,
    remoteNetwork: false,
    userData: false
  }});
}}
'''
    KIT.write_text(source, encoding='utf-8')


def update_readme(rows) -> None:
    counts = {'material':0,'backdrop':0,'decal':0,'prop':0}
    for row in rows:
        counts[row['category']] += 1
    doc = f'''# EON City Original Vector Art

**Current source art system:** W419 foundation + W422 deep art extension.

This directory contains **{len(rows)} original, same-origin SVG assets** authored for the Babylon procedural City fallback:

- {counts['material']} material treatments;
- {counts['backdrop']} atmospheric/backdrop layers;
- {counts['decal']} district, wayfinding and expedition decals;
- {counts['prop']} transparent billboard prop illustrations.

Every source SVG is self-contained, hash-recorded in `eon-city-vector-art-kit.js`, and must not embed remote URLs, `<image>` elements, data URIs, fonts, user content, tracking, screenshots, media uploads, or credentials.

## Honest visual boundary

This is **real shipped original vector source art**, applied locally to the procedural Babylon City. It is **not an approved GLB/KTX2 final-art release** and does not itself prove final institutional-grade visual certification. Final 3D visual release remains gated by W417 provenance, SHA-256, optimized GLB, KTX2/Basis, LOD0/LOD1/LOD2, human art/rights review, and real-device visual/performance evidence.
'''
    (ART / 'README.md').write_text(doc, encoding='utf-8')


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    write_extension()
    base_rows = catalog_rows(BASE)
    extension_rows = catalog_rows(EXTENSION_META)
    all_rows = base_rows + extension_rows
    write_kit(base_rows, extension_rows)
    update_readme(all_rows)
    print(json.dumps({
        'generated': len(extension_rows),
        'total': len(all_rows),
        'categories': {key: sum(1 for row in all_rows if row['category'] == key) for key in ['material','backdrop','decal','prop']}
    }, indent=2))

if __name__ == '__main__':
    main()

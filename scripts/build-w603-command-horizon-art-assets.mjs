#!/usr/bin/env node
/**
 * W603 — original Command Horizon art asset builder.
 *
 * Generates three deterministic same-origin GLB environment kits in three
 * profile variants. These are source-authored mesh/material scenes, not
 * imported packs or remote downloads. They contain no textures, user data,
 * external URI, audio or third-party mesh payload. KTX2/Basis detail remains a
 * separate future texture release and is not claimed here.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'city', 'models');
const MANIFEST = path.join(OUT, 'W603_COMMAND_HORIZON_ART_ASSET_MANIFEST.json');
const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const GLB_JSON = 0x4e4f534a;
const GLB_BIN = 0x004e4942;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;
const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;

const align4 = (value) => (value + 3) & ~3;
const round = (value, places = 5) => Number(Number(value).toFixed(places));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const quatFromEuler = (x = 0, y = 0, z = 0) => {
  const cx = Math.cos(x * 0.5), sx = Math.sin(x * 0.5);
  const cy = Math.cos(y * 0.5), sy = Math.sin(y * 0.5);
  const cz = Math.cos(z * 0.5), sz = Math.sin(z * 0.5);
  return [
    round(sx * cy * cz + cx * sy * sz),
    round(cx * sy * cz - sx * cy * sz),
    round(cx * cy * sz + sx * sy * cz),
    round(cx * cy * cz - sx * sy * sz)
  ];
};

function box(width = 1, height = 1, depth = 1) {
  const x = width / 2, y = height / 2, z = depth / 2;
  const faces = [
    [[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z],[0,0,1]],
    [[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z],[0,0,-1]],
    [[-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z],[-1,0,0]],
    [[x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z],[1,0,0]],
    [[-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z],[0,1,0]],
    [[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z],[0,-1,0]]
  ];
  const positions = [], normals = [], indices = [];
  for (const [a,b,c,d,n] of faces) {
    const start = positions.length / 3;
    positions.push(...a,...b,...c,...d);
    normals.push(...n,...n,...n,...n);
    indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  return { positions, normals, indices };
}

function taperedBox(bottomWidth = 1, bottomDepth = 1, topWidth = .8, topDepth = .8, height = 1) {
  const bx = bottomWidth / 2, bz = bottomDepth / 2, tx = topWidth / 2, tz = topDepth / 2, y = height / 2;
  const vertices = {
    b0: [-bx,-y,-bz], b1: [bx,-y,-bz], b2: [bx,-y,bz], b3: [-bx,-y,bz],
    t0: [-tx,y,-tz], t1: [tx,y,-tz], t2: [tx,y,tz], t3: [-tx,y,tz]
  };
  const faces = [
    [vertices.b3,vertices.b2,vertices.t2,vertices.t3,[0,0,1]],
    [vertices.b1,vertices.b0,vertices.t0,vertices.t1,[0,0,-1]],
    [vertices.b0,vertices.b3,vertices.t3,vertices.t0,[-1,0,0]],
    [vertices.b2,vertices.b1,vertices.t1,vertices.t2,[1,0,0]],
    [vertices.t3,vertices.t2,vertices.t1,vertices.t0,[0,1,0]],
    [vertices.b0,vertices.b1,vertices.b2,vertices.b3,[0,-1,0]]
  ];
  const positions = [], normals = [], indices = [];
  for (const [a,b,c,d,n] of faces) {
    const start = positions.length / 3;
    positions.push(...a,...b,...c,...d);
    normals.push(...n,...n,...n,...n);
    indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  return { positions, normals, indices };
}

function cylinder(radiusTop = .5, radiusBottom = .5, height = 1, segments = 12) {
  const positions = [], normals = [], indices = [];
  const y = height / 2;
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const s = Math.sin(angle), c = Math.cos(angle);
    positions.push(radiusBottom * s, -y, radiusBottom * c, radiusTop * s, y, radiusTop * c);
    const slope = (radiusBottom - radiusTop) / Math.max(height, .0001);
    const l = Math.hypot(s, slope, c) || 1;
    normals.push(s/l,slope/l,c/l,s/l,slope/l,c/l);
  }
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a,c,b,c,d,b);
  }
  const bottom = positions.length / 3; positions.push(0,-y,0); normals.push(0,-1,0);
  const top = positions.length / 3; positions.push(0,y,0); normals.push(0,1,0);
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2, c = ((index + 1) % segments) * 2;
    indices.push(bottom,c,a,top,a + 1,c + 1);
  }
  return { positions, normals, indices };
}

function ring(outer = .5, inner = .43, segments = 18) {
  const positions = [], normals = [], indices = [];
  for (let index = 0; index <= segments; index += 1) {
    const theta = (index / segments) * Math.PI * 2;
    const s = Math.sin(theta), c = Math.cos(theta);
    positions.push(outer*s,0,outer*c,inner*s,0,inner*c);
    normals.push(0,1,0,0,1,0);
  }
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a,c,b,c,d,b);
  }
  return { positions, normals, indices };
}

function uvSphere(radius = .5, rings = 8, segments = 12) {
  const positions = [], normals = [], indices = [];
  for (let row = 0; row <= rings; row += 1) {
    const v = row / rings, phi = v * Math.PI;
    const sp = Math.sin(phi), cp = Math.cos(phi);
    for (let col = 0; col <= segments; col += 1) {
      const u = col / segments, theta = u * Math.PI * 2;
      const x = Math.sin(theta) * sp, y = cp, z = Math.cos(theta) * sp;
      positions.push(radius*x,radius*y,radius*z);
      normals.push(x,y,z);
    }
  }
  for (let row = 0; row < rings; row += 1) for (let col = 0; col < segments; col += 1) {
    const a = row * (segments + 1) + col;
    const b = a + segments + 1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  return { positions, normals, indices };
}

class GlbBuilder {
  constructor({ name, assetId, lod, kind }) {
    this.name = name;
    this.json = {
      asset: { version: '2.0', generator: 'EONAPP W603 Command Horizon Original Art Builder', extras: { assetId, lod, kind, texturelessPbr: true } },
      scene: 0,
      scenes: [{ name: `${name} Scene`, nodes: [] }],
      nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }],
      extras: { eonAsset: true, original: true, remoteNetwork: false, userData: false, assetId, lod, kind, texturelessPbr: true }
    };
    this.chunks = [];
    this.byteLength = 0;
  }
  addMaterial(name, { baseColor = [1,1,1,1], metallic = .2, roughness = .6, emissive = [0,0,0] } = {}) {
    this.json.materials.push({ name, pbrMetallicRoughness: { baseColorFactor: baseColor, metallicFactor: metallic, roughnessFactor: roughness }, emissiveFactor: emissive, extras: { originalEonMaterial: true } });
    return this.json.materials.length - 1;
  }
  addBinary(typed, target) {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const offset = align4(this.byteLength);
    if (offset > this.byteLength) this.chunks.push(Buffer.alloc(offset - this.byteLength));
    this.chunks.push(bytes);
    this.byteLength = offset + bytes.length;
    const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length };
    if (target) view.target = target;
    this.json.bufferViews.push(view);
    return this.json.bufferViews.length - 1;
  }
  addAccessor(typed, { componentType, type, target, min = null, max = null }) {
    const view = this.addBinary(typed, target);
    const counts = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    const accessor = { bufferView: view, componentType, count: typed.length / counts[type], type };
    if (min) accessor.min = min;
    if (max) accessor.max = max;
    this.json.accessors.push(accessor);
    return this.json.accessors.length - 1;
  }
  addGeometryMesh(name, geometry, material) {
    const positions = new Float32Array(geometry.positions);
    const normals = new Float32Array(geometry.normals);
    const indices = new Uint16Array(geometry.indices);
    const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
    for (let index = 0; index < positions.length; index += 3) for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[index + axis]);
      max[axis] = Math.max(max[axis], positions[index + axis]);
    }
    const positionAccessor = this.addAccessor(positions, { componentType: FLOAT, type: 'VEC3', target: ARRAY_BUFFER, min, max });
    const normalAccessor = this.addAccessor(normals, { componentType: FLOAT, type: 'VEC3', target: ARRAY_BUFFER });
    const indexAccessor = this.addAccessor(indices, { componentType: UNSIGNED_SHORT, type: 'SCALAR', target: ELEMENT_ARRAY_BUFFER });
    this.json.meshes.push({ name, primitives: [{ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material }] });
    return this.json.meshes.length - 1;
  }
  addNode({ name, mesh = null, translation = null, rotation = null, scale = null, parent = null, extras = {} } = {}) {
    const node = { name, extras: { originalEonNode: true, ...extras } };
    if (mesh !== null) node.mesh = mesh;
    if (translation) node.translation = translation.map((value) => round(value));
    if (rotation) node.rotation = rotation.map((value) => round(value));
    if (scale) node.scale = scale.map((value) => round(value));
    this.json.nodes.push(node);
    const index = this.json.nodes.length - 1;
    if (parent === null || parent === undefined) this.json.scenes[0].nodes.push(index);
    else {
      const parentNode = this.json.nodes[parent];
      parentNode.children ||= [];
      parentNode.children.push(index);
    }
    return index;
  }
  build() {
    this.json.buffers[0].byteLength = align4(this.byteLength);
    const jsonRaw = Buffer.from(JSON.stringify(this.json), 'utf8');
    const jsonLength = align4(jsonRaw.length);
    const bin = Buffer.concat([...this.chunks, Buffer.alloc(align4(this.byteLength) - this.byteLength)]);
    const total = 12 + 8 + jsonLength + 8 + bin.length;
    const header = Buffer.alloc(12); header.writeUInt32LE(GLB_MAGIC, 0); header.writeUInt32LE(GLB_VERSION, 4); header.writeUInt32LE(total, 8);
    const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(jsonLength, 0); jsonHeader.writeUInt32LE(GLB_JSON, 4);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(GLB_BIN, 4);
    return Buffer.concat([header, jsonHeader, jsonRaw, Buffer.alloc(jsonLength - jsonRaw.length, 0x20), binHeader, bin]);
  }
}

function profile(level) {
  const quality = String(level);
  return quality === 'lod0'
    ? { detail: 1, segments: 20, panels: 5, rings: 3 }
    : quality === 'lod1'
      ? { detail: .78, segments: 14, panels: 4, rings: 2 }
      : { detail: .58, segments: 10, panels: 2, rings: 1 };
}

function makeArrivalGate(level) {
  const p = profile(level);
  const builder = new GlbBuilder({ name: `Command Horizon Arrival Gate ${level.toUpperCase()}`, assetId: 'command-horizon-arrival-gate', lod: level, kind: 'architecture' });
  const graphite = builder.addMaterial('Graphite frame', { baseColor: [.04,.08,.15,1], metallic: .82, roughness: .19 });
  const cobalt = builder.addMaterial('Cobalt plating', { baseColor: [.06,.16,.31,1], metallic: .54, roughness: .29, emissive: [.01,.025,.08] });
  const cyan = builder.addMaterial('Cyan signal', { baseColor: [.03,.36,.47,1], metallic: .23, roughness: .15, emissive: [.03,.92,1] });
  const violet = builder.addMaterial('Violet anomaly', { baseColor: [.17,.05,.34,1], metallic: .32, roughness: .18, emissive: [.56,.16,1] });
  const amber = builder.addMaterial('Arrival warmth', { baseColor: [.36,.17,.02,1], metallic: .55, roughness: .24, emissive: [.96,.48,.04] });
  const mesh = {
    plinth: builder.addGeometryMesh('arrival-plinth', cylinder(2.5, 2.82, .22, p.segments), graphite),
    tier: builder.addGeometryMesh('arrival-tier', cylinder(1.98, 2.3, .18, p.segments), cobalt),
    pylon: builder.addGeometryMesh('arrival-pylon', taperedBox(.92,.8,.58,.56,4.9), graphite),
    pylonPanel: builder.addGeometryMesh('arrival-pylon-panel', box(.56,2.68,.065), cyan),
    arch: builder.addGeometryMesh('arrival-arch', ring(2.18,1.98,Math.max(14,p.segments)), violet),
    core: builder.addGeometryMesh('arrival-core', uvSphere(.42,Math.max(6,Math.round(8*p.detail)),p.segments), cyan),
    beacon: builder.addGeometryMesh('arrival-beacon', cylinder(.07,.1,.62,Math.max(8,p.segments-4)), amber),
    fin: builder.addGeometryMesh('arrival-fin', taperedBox(.18,.48,.05,.72,1.4), cobalt),
    step: builder.addGeometryMesh('arrival-step', box(4.5,.12,.84), graphite)
  };
  const root = builder.addNode({ name: 'COMMAND_HORIZON_ARRIVAL_GATE', extras: { semantic: 'arrival-gate-root', originalArt: true } });
  builder.addNode({ name: 'arrival-plinth', mesh: mesh.plinth, translation: [0,.11,0], parent: root });
  builder.addNode({ name: 'arrival-tier', mesh: mesh.tier, translation: [0,.31,0], parent: root });
  builder.addNode({ name: 'arrival-front-step', mesh: mesh.step, translation: [0,.08,-2.24], parent: root });
  for (const side of [-1,1]) {
    builder.addNode({ name: `arrival-pylon-${side}`, mesh: mesh.pylon, translation: [side*1.72,2.68,0], rotation: quatFromEuler(0,0,side*.035), parent: root });
    builder.addNode({ name: `arrival-panel-${side}`, mesh: mesh.pylonPanel, translation: [side*1.72,2.78,-.43], rotation: quatFromEuler(0,0,side*.035), parent: root });
    builder.addNode({ name: `arrival-fin-${side}`, mesh: mesh.fin, translation: [side*2.22,1.38,.1], rotation: quatFromEuler(0,0,side*.34), parent: root });
    builder.addNode({ name: `arrival-beacon-${side}`, mesh: mesh.beacon, translation: [side*2.25,.48,-.52], parent: root });
  }
  builder.addNode({ name: 'arrival-arch', mesh: mesh.arch, translation: [0,3.0,.12], rotation: quatFromEuler(Math.PI/2,0,0), parent: root });
  builder.addNode({ name: 'arrival-core', mesh: mesh.core, translation: [0,2.94,.06], parent: root });
  for (let index = 0; index < p.rings; index += 1) builder.addNode({ name: `arrival-orbit-${index}`, mesh: mesh.arch, translation: [0,2.94,.04], rotation: quatFromEuler(Math.PI/2,index*.42,index*.21), scale: [0.42 + index*.07,0.42 + index*.07,0.42 + index*.07], parent: root });
  return builder.build();
}

function makeCommandDeck(level) {
  const p = profile(level);
  const builder = new GlbBuilder({ name: `Command Horizon Command Deck ${level.toUpperCase()}`, assetId: 'command-horizon-command-deck', lod: level, kind: 'architecture' });
  const graphite = builder.addMaterial('Deck graphite', { baseColor: [.035,.07,.13,1], metallic: .84, roughness: .18 });
  const slate = builder.addMaterial('Deck slate', { baseColor: [.08,.15,.27,1], metallic: .58, roughness: .28 });
  const cyan = builder.addMaterial('Deck cyan', { baseColor: [.03,.35,.48,1], metallic: .22, roughness: .14, emissive: [.02,.86,1] });
  const violet = builder.addMaterial('Deck violet', { baseColor: [.15,.04,.29,1], metallic: .33, roughness: .17, emissive: [.5,.13,.94] });
  const warm = builder.addMaterial('Deck human amber', { baseColor: [.28,.11,.01,1], metallic: .5, roughness: .25, emissive: [.82,.35,.02] });
  const mesh = {
    foundation: builder.addGeometryMesh('deck-foundation', box(6.8,.44,2.8), graphite),
    tower: builder.addGeometryMesh('deck-tower', taperedBox(1.62,1.18,1.18,.9,5.8), slate),
    crown: builder.addGeometryMesh('deck-crown', cylinder(.58,.78,.35,p.segments), cyan),
    facade: builder.addGeometryMesh('deck-facade-panel', box(.86,1.28,.055), cyan),
    canopy: builder.addGeometryMesh('deck-canopy', taperedBox(2.4,.95,1.35,.62,.42), graphite),
    fin: builder.addGeometryMesh('deck-fin', taperedBox(.16,.65,.06,.98,1.72), violet),
    rail: builder.addGeometryMesh('deck-rail', box(1.18,.08,.09), cyan),
    holo: builder.addGeometryMesh('deck-holo-core', uvSphere(.31,Math.max(5,Math.round(7*p.detail)),Math.max(8,p.segments-4)), violet),
    light: builder.addGeometryMesh('deck-lamp', cylinder(.05,.085,.58,Math.max(8,p.segments-4)), warm),
    balcony: builder.addGeometryMesh('deck-balcony', box(3.9,.12,.78), slate)
  };
  const root = builder.addNode({ name: 'COMMAND_HORIZON_COMMAND_DECK', extras: { semantic: 'command-deck-root', originalArt: true } });
  builder.addNode({ name: 'deck-foundation', mesh: mesh.foundation, translation: [0,.22,0], parent: root });
  builder.addNode({ name: 'deck-main-tower', mesh: mesh.tower, translation: [0,3.1,.12], parent: root });
  builder.addNode({ name: 'deck-crown', mesh: mesh.crown, translation: [0,6.16,.12], parent: root });
  builder.addNode({ name: 'deck-holo-core', mesh: mesh.holo, translation: [0,5.72,-.56], parent: root });
  builder.addNode({ name: 'deck-canopy', mesh: mesh.canopy, translation: [0,3.76,-.82], parent: root });
  builder.addNode({ name: 'deck-balcony', mesh: mesh.balcony, translation: [0,2.32,-.97], parent: root });
  for (const side of [-1,1]) {
    builder.addNode({ name: `deck-wing-${side}`, mesh: mesh.tower, translation: [side*2.18,2.22,.35], scale: [.62,.62,.62], rotation: quatFromEuler(0,0,side*.055), parent: root });
    builder.addNode({ name: `deck-fin-${side}`, mesh: mesh.fin, translation: [side*3.05,2.48,.02], rotation: quatFromEuler(0,0,side*.38), parent: root });
    builder.addNode({ name: `deck-lamp-${side}`, mesh: mesh.light, translation: [side*2.98,.48,-.92], parent: root });
  }
  for (let index = 0; index < p.panels; index += 1) {
    const x = (index - (p.panels - 1) / 2) * .92;
    builder.addNode({ name: `deck-facade-${index}`, mesh: mesh.facade, translation: [x,3.18,-.63], parent: root });
    builder.addNode({ name: `deck-rail-${index}`, mesh: mesh.rail, translation: [x,2.68,-1.37], parent: root });
  }
  return builder.build();
}

function makeWayfinding(level) {
  const p = profile(level);
  const builder = new GlbBuilder({ name: `Command Horizon Wayfinding Constellation ${level.toUpperCase()}`, assetId: 'command-horizon-wayfinding', lod: level, kind: 'prop-kit' });
  const graphite = builder.addMaterial('Wayfinding graphite', { baseColor: [.04,.075,.14,1], metallic: .78, roughness: .2 });
  const cyan = builder.addMaterial('Wayfinding cyan', { baseColor: [.03,.38,.49,1], metallic: .2, roughness: .14, emissive: [.02,.94,1] });
  const violet = builder.addMaterial('Wayfinding violet', { baseColor: [.17,.05,.3,1], metallic: .3, roughness: .2, emissive: [.55,.12,1] });
  const amber = builder.addMaterial('Wayfinding amber', { baseColor: [.33,.16,.02,1], metallic: .51, roughness: .25, emissive: [.92,.46,.03] });
  const mesh = {
    base: builder.addGeometryMesh('wayfinding-base', cylinder(1.26,1.48,.15,p.segments), graphite),
    spine: builder.addGeometryMesh('wayfinding-spine', taperedBox(.52,.38,.33,.27,3.26), graphite),
    panel: builder.addGeometryMesh('wayfinding-panel', box(.72,.66,.06), cyan),
    ring: builder.addGeometryMesh('wayfinding-ring', ring(.77,.68,Math.max(12,p.segments)), violet),
    beacon: builder.addGeometryMesh('wayfinding-beacon', uvSphere(.16,Math.max(5,Math.round(7*p.detail)),Math.max(8,p.segments-2)), amber),
    wing: builder.addGeometryMesh('wayfinding-wing', taperedBox(.1,.34,.04,.62,.78), graphite)
  };
  const root = builder.addNode({ name: 'COMMAND_HORIZON_WAYFINDING', extras: { semantic: 'wayfinding-root', originalArt: true } });
  builder.addNode({ name: 'wayfinding-base', mesh: mesh.base, translation: [0,.075,0], parent: root });
  builder.addNode({ name: 'wayfinding-spine', mesh: mesh.spine, translation: [0,1.72,0], parent: root });
  builder.addNode({ name: 'wayfinding-beacon', mesh: mesh.beacon, translation: [0,3.42,0], parent: root });
  for (let index = 0; index < p.rings + 1; index += 1) builder.addNode({ name: `wayfinding-ring-${index}`, mesh: mesh.ring, translation: [0,1.64 + index*.48,0], rotation: quatFromEuler(Math.PI/2,index*.42,index*.15), scale: [1 - index*.12,1 - index*.12,1 - index*.12], parent: root });
  for (const side of [-1,1]) {
    builder.addNode({ name: `wayfinding-panel-${side}`, mesh: mesh.panel, translation: [side*.5,2.18,-.19], rotation: quatFromEuler(0,side*.3,0), parent: root });
    builder.addNode({ name: `wayfinding-wing-${side}`, mesh: mesh.wing, translation: [side*.47,1.35,.12], rotation: quatFromEuler(0,0,side*.4), parent: root });
  }
  return builder.build();
}

const assets = [
  { id: 'command-horizon-arrival-gate', build: makeArrivalGate, output: (lod) => `command-horizon-arrival-gate-${lod}.glb`, role: 'Arrival Gate sculptural landmark' },
  { id: 'command-horizon-command-deck', build: makeCommandDeck, output: (lod) => `command-horizon-command-deck-${lod}.glb`, role: 'Command Deck exterior art kit' },
  { id: 'command-horizon-wayfinding', build: makeWayfinding, output: (lod) => `command-horizon-wayfinding-${lod}.glb`, role: 'Wayfinding constellation and landmark signal kit' }
];

fs.mkdirSync(OUT, { recursive: true });
const manifest = { schema: 'eon.city.w603.command-horizon-art-assets.v1', generatedAt: new Date().toISOString(), source: 'scripts/build-w603-command-horizon-art-assets.mjs', original: true, remoteNetwork: false, userData: false, texturelessPbr: true, assets: [] };
for (const asset of assets) {
  const variants = {};
  for (const lod of ['lod2','lod1','lod0']) {
    const bytes = asset.build(lod);
    const fileName = asset.output(lod);
    fs.writeFileSync(path.join(OUT, fileName), bytes);
    variants[lod] = { fileName, bytes: bytes.length, sha256: sha256(bytes) };
  }
  manifest.assets.push({ id: asset.id, role: asset.role, variants });
}
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));

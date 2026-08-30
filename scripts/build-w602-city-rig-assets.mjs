#!/usr/bin/env node
/**
 * W602 — original EON City rig asset builder.
 *
 * Builds deterministic, source-authored GLB candidates for the EON Navigator
 * and EONBOT companion. The meshes, materials, node hierarchy and animation
 * clips are original EONAPP work generated from this script; no remote assets,
 * textures, user data or third-party mesh content is used.
 *
 * These intentionally textureless PBR rigs use vertex geometry/material colour
 * only. KTX2/Basis remains mandatory for a later texture-bearing art release;
 * this builder does not claim to ship texture maps.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'city', 'models');
const MANIFEST = path.join(OUT, 'W602_ORIGINAL_RIG_ASSET_MANIFEST.json');

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const GLB_JSON = 0x4e4f534a;
const GLB_BIN = 0x004e4942;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;
const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;

function align4(value) { return (value + 3) & ~3; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function round(value, places = 5) { return Number(Number(value).toFixed(places)); }
function quatFromEuler(x = 0, y = 0, z = 0) {
  const cx = Math.cos(x * 0.5), sx = Math.sin(x * 0.5);
  const cy = Math.cos(y * 0.5), sy = Math.sin(y * 0.5);
  const cz = Math.cos(z * 0.5), sz = Math.sin(z * 0.5);
  return [
    round(sx * cy * cz + cx * sy * sz),
    round(cx * sy * cz - sx * cy * sz),
    round(cx * cy * sz + sx * sy * cz),
    round(cx * cy * cz - sx * sy * sz)
  ];
}
function identityQuat() { return [0, 0, 0, 1]; }
function vec3(value) { return value.map((item) => round(item)); }
function keyframes(duration, values) {
  const count = values.length;
  if (count === 1) return { times: [0], values };
  return {
    times: values.map((_, index) => round((duration * index) / (count - 1))),
    values
  };
}

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
    const sin = Math.sin(angle), cos = Math.cos(angle);
    positions.push(radiusBottom * sin, -y, radiusBottom * cos, radiusTop * sin, y, radiusTop * cos);
    const slope = (radiusBottom - radiusTop) / Math.max(height, .0001);
    const nx = sin, ny = slope, nz = cos;
    const length = Math.hypot(nx, ny, nz) || 1;
    normals.push(nx/length,ny/length,nz/length,nx/length,ny/length,nz/length);
  }
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a,c,b,c,d,b);
  }
  const bottomStart = positions.length / 3;
  positions.push(0,-y,0); normals.push(0,-1,0);
  const topStart = positions.length / 3;
  positions.push(0,y,0); normals.push(0,1,0);
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2, c = ((index + 1) % segments) * 2;
    indices.push(bottomStart,c,a);
    indices.push(topStart,a + 1,c + 1);
  }
  return { positions, normals, indices };
}

function uvSphere(radius = .5, rings = 8, segments = 12) {
  const positions = [], normals = [], indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const v = ring / rings, phi = v * Math.PI;
    const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
    for (let segment = 0; segment <= segments; segment += 1) {
      const u = segment / segments, theta = u * Math.PI * 2;
      const x = Math.sin(theta) * sinPhi, y = cosPhi, z = Math.cos(theta) * sinPhi;
      positions.push(radius * x, radius * y, radius * z);
      normals.push(x,y,z);
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
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
    const a = index*2, b = a+1, c = a+2, d = a+3;
    indices.push(a,c,b,c,d,b);
  }
  return { positions, normals, indices };
}

function mergeGeometries(parts = []) {
  const positions = [], normals = [], indices = [];
  for (const part of parts) {
    const offset = positions.length / 3;
    positions.push(...part.positions);
    normals.push(...part.normals);
    indices.push(...part.indices.map((value) => value + offset));
  }
  return { positions, normals, indices };
}

class GlbBuilder {
  constructor({ name, generator, extras = {} }) {
    this.json = {
      asset: { version: '2.0', generator, extras },
      scene: 0,
      scenes: [{ name: `${name} Scene`, nodes: [] }],
      nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], animations: [], buffers: [{ byteLength: 0 }],
      extras: { eonAsset: true, original: true, remoteNetwork: false, userData: false, ...extras }
    };
    this.chunks = [];
    this.byteLength = 0;
  }

  addMaterial(name, { baseColor = [1,1,1,1], metallic = .2, roughness = .6, emissive = [0,0,0], emissiveStrength = 1, alphaMode = 'OPAQUE' } = {}) {
    const material = {
      name,
      pbrMetallicRoughness: { baseColorFactor: baseColor, metallicFactor: metallic, roughnessFactor: roughness },
      emissiveFactor: emissive,
      alphaMode,
      doubleSided: false,
      extras: { originalEonMaterial: true, emissiveStrength }
    };
    this.json.materials.push(material);
    return this.json.materials.length - 1;
  }

  addBinary(typed, target = undefined) {
    let array;
    if (typed instanceof Uint8Array) array = typed;
    else if (ArrayBuffer.isView(typed)) array = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
    else throw new TypeError('Expected a typed array.');
    const byteOffset = align4(this.byteLength);
    const padding = byteOffset - this.byteLength;
    if (padding) this.chunks.push(Buffer.alloc(padding));
    const copy = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    this.chunks.push(copy);
    this.byteLength = byteOffset + copy.length;
    const index = this.json.bufferViews.length;
    const view = { buffer: 0, byteOffset, byteLength: copy.length };
    if (target) view.target = target;
    this.json.bufferViews.push(view);
    return index;
  }

  addAccessor(typed, { componentType, type, target, min = null, max = null } = {}) {
    const view = this.addBinary(typed, target);
    const componentCount = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4 }[type];
    if (!componentCount) throw new Error(`Unsupported accessor type ${type}`);
    const count = typed.length / componentCount;
    const accessor = { bufferView: view, componentType, count, type };
    if (min) accessor.min = min;
    if (max) accessor.max = max;
    this.json.accessors.push(accessor);
    return this.json.accessors.length - 1;
  }

  addGeometryMesh(name, geometry, material) {
    const positions = new Float32Array(geometry.positions);
    const normals = new Float32Array(geometry.normals);
    const indices = geometry.indices.length > 65535 ? new Uint32Array(geometry.indices) : new Uint16Array(geometry.indices);
    const positionsMin = [Infinity,Infinity,Infinity], positionsMax = [-Infinity,-Infinity,-Infinity];
    for (let index = 0; index < positions.length; index += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        positionsMin[axis] = Math.min(positionsMin[axis], positions[index + axis]);
        positionsMax[axis] = Math.max(positionsMax[axis], positions[index + axis]);
      }
    }
    const positionAccessor = this.addAccessor(positions, { componentType: FLOAT, type: 'VEC3', target: ARRAY_BUFFER, min: positionsMin.map((value) => round(value)), max: positionsMax.map((value) => round(value)) });
    const normalAccessor = this.addAccessor(normals, { componentType: FLOAT, type: 'VEC3', target: ARRAY_BUFFER });
    const indexAccessor = this.addAccessor(indices, { componentType: indices instanceof Uint32Array ? 5125 : UNSIGNED_SHORT, type: 'SCALAR', target: ELEMENT_ARRAY_BUFFER });
    this.json.meshes.push({ name, primitives: [{ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material, mode: 4 }] });
    return this.json.meshes.length - 1;
  }

  addNode({ name, mesh = null, translation = null, rotation = null, scale = null, parent = null, extras = {} } = {}) {
    const node = { name, extras: { originalEonNode: true, ...extras } };
    if (mesh !== null) node.mesh = mesh;
    if (translation) node.translation = vec3(translation);
    if (rotation) node.rotation = rotation.map((value) => round(value));
    if (scale) node.scale = vec3(scale);
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

  addAnimation(name, tracks = [], extras = {}) {
    const samplers = [], channels = [];
    for (const track of tracks) {
      const { node, path, times, values, interpolation = 'LINEAR' } = track;
      const input = this.addAccessor(new Float32Array(times), { componentType: FLOAT, type: 'SCALAR' });
      let outputType = 'VEC3';
      if (path === 'rotation') outputType = 'VEC4';
      if (path === 'weights') outputType = 'SCALAR';
      const output = this.addAccessor(new Float32Array(values.flat()), { componentType: FLOAT, type: outputType });
      const sampler = samplers.length;
      samplers.push({ input, output, interpolation });
      channels.push({ sampler, target: { node, path } });
    }
    this.json.animations.push({ name, samplers, channels, extras: { originalEonAnimation: true, ...extras } });
  }

  build() {
    this.json.buffers[0].byteLength = align4(this.byteLength);
    const bin = Buffer.concat([...this.chunks, Buffer.alloc(align4(this.byteLength) - this.byteLength)]);
    const jsonString = JSON.stringify(this.json);
    const jsonBuffer = Buffer.from(jsonString, 'utf8');
    const jsonPadded = Buffer.concat([jsonBuffer, Buffer.alloc(align4(jsonBuffer.length) - jsonBuffer.length, 0x20)]);
    const binPadded = Buffer.concat([bin, Buffer.alloc(align4(bin.length) - bin.length)]);
    const totalLength = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
    const header = Buffer.alloc(12);
    header.writeUInt32LE(GLB_MAGIC, 0);
    header.writeUInt32LE(GLB_VERSION, 4);
    header.writeUInt32LE(totalLength, 8);
    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonPadded.length, 0);
    jsonHeader.writeUInt32LE(GLB_JSON, 4);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binPadded.length, 0);
    binHeader.writeUInt32LE(GLB_BIN, 4);
    return Buffer.concat([header, jsonHeader, jsonPadded, binHeader, binPadded]);
  }
}

function navigatorSpec(level = 'lod1') {
  const detail = level === 'lod0' ? 1 : level === 'lod1' ? .8 : .58;
  const segments = level === 'lod0' ? 16 : level === 'lod1' ? 12 : 8;
  const builder = new GlbBuilder({
    name: `EON Navigator ${level.toUpperCase()}`,
    generator: 'EONAPP W602 Original Navigator Rig Builder',
    extras: { assetId: 'operator-hero', lod: level, kind: 'character', texturelessPbr: true, animationClipCount: 12 }
  });
  const graphite = builder.addMaterial('Navigator Graphite', { baseColor: [.055,.09,.16,1], metallic: .78, roughness: .31 });
  const fabric = builder.addMaterial('Navigator Fabric', { baseColor: [.095,.15,.25,1], metallic: .12, roughness: .72 });
  const accent = builder.addMaterial('Navigator Cyan Accent', { baseColor: [.04,.3,.4,1], metallic: .5, roughness: .27, emissive: [.02,.75,.82], emissiveStrength: 1.4 });
  const visor = builder.addMaterial('Navigator Visor', { baseColor: [.035,.09,.18,1], metallic: .66, roughness: .12, emissive: [.17,.68,.94], emissiveStrength: 1.7 });
  const violet = builder.addMaterial('Navigator Violet Signal', { baseColor: [.16,.07,.34,1], metallic: .38, roughness: .36, emissive: [.52,.24,.9], emissiveStrength: 1.25 });

  const meshes = {
    pelvis: builder.addGeometryMesh('nav-pelvis', taperedBox(.78,.46,.66,.38,.34), graphite),
    torso: builder.addGeometryMesh('nav-torso', taperedBox(.82,.48,.58,.36,.82), fabric),
    chest: builder.addGeometryMesh('nav-chest-plate', taperedBox(.64,.12,.56,.08,.44), graphite),
    neck: builder.addGeometryMesh('nav-neck', cylinder(.13,.15,.17,segments), graphite),
    head: builder.addGeometryMesh('nav-head', uvSphere(.34, Math.max(5, Math.round(7*detail)), segments), graphite),
    visor: builder.addGeometryMesh('nav-visor', taperedBox(.42,.08,.34,.06,.16), visor),
    shoulder: builder.addGeometryMesh('nav-shoulder', taperedBox(.28,.28,.22,.22,.22), graphite),
    upperArm: builder.addGeometryMesh('nav-upper-arm', taperedBox(.21,.2,.16,.16,.54), fabric),
    forearm: builder.addGeometryMesh('nav-forearm', taperedBox(.18,.18,.14,.14,.48), graphite),
    hand: builder.addGeometryMesh('nav-hand', uvSphere(.13, Math.max(4, Math.round(5*detail)), Math.max(7,segments-3)), fabric),
    thigh: builder.addGeometryMesh('nav-thigh', taperedBox(.29,.27,.2,.2,.68), fabric),
    shin: builder.addGeometryMesh('nav-shin', taperedBox(.22,.22,.17,.18,.63), graphite),
    boot: builder.addGeometryMesh('nav-boot', taperedBox(.25,.43,.21,.35,.23), graphite),
    coat: builder.addGeometryMesh('nav-coat-tail', taperedBox(.28,.14,.18,.08,.56), violet),
    pack: builder.addGeometryMesh('nav-command-pack', box(.38,.58,.16), graphite),
    chestLight: builder.addGeometryMesh('nav-chest-light', box(.3,.1,.045), accent)
  };

  const root = builder.addNode({ name: 'EON_NAVIGATOR_RIG', translation: [0,0,0], extras: { semantic: 'navigator-root' } });
  const hips = builder.addNode({ name: 'nav_hips', mesh: meshes.pelvis, translation: [0,.96,0], parent: root, extras: { semantic: 'hips' } });
  const spine = builder.addNode({ name: 'nav_spine', mesh: meshes.torso, translation: [0,.39,0], parent: hips, extras: { semantic: 'spine' } });
  builder.addNode({ name: 'nav_chest_plate', mesh: meshes.chest, translation: [0,.02,-.27], parent: spine });
  builder.addNode({ name: 'nav_command_pack', mesh: meshes.pack, translation: [0,-.04,.29], parent: spine });
  builder.addNode({ name: 'nav_chest_light', mesh: meshes.chestLight, translation: [0,.1,-.29], parent: spine });
  const neck = builder.addNode({ name: 'nav_neck', mesh: meshes.neck, translation: [0,.54,0], parent: spine });
  const head = builder.addNode({ name: 'nav_head', mesh: meshes.head, translation: [0,.24,0], parent: neck, extras: { semantic: 'head' } });
  builder.addNode({ name: 'nav_visor', mesh: meshes.visor, translation: [0,.01,-.29], parent: head });
  for (const side of [-1,1]) {
    const id = side < 0 ? 'l' : 'r';
    const shoulder = builder.addNode({ name: `nav_${id}_shoulder`, mesh: meshes.shoulder, translation: [side*.49,.42,0], parent: spine, extras: { semantic: `${id}-shoulder` } });
    const upper = builder.addNode({ name: `nav_${id}_upper_arm`, mesh: meshes.upperArm, translation: [0,-.32,0], parent: shoulder, extras: { semantic: `${id}-upper-arm` } });
    const fore = builder.addNode({ name: `nav_${id}_forearm`, mesh: meshes.forearm, translation: [0,-.47,0], parent: upper, extras: { semantic: `${id}-forearm` } });
    builder.addNode({ name: `nav_${id}_hand`, mesh: meshes.hand, translation: [0,-.37,0], parent: fore, extras: { semantic: `${id}-hand` } });
    const thigh = builder.addNode({ name: `nav_${id}_thigh`, mesh: meshes.thigh, translation: [side*.22,-.18,0], parent: hips, extras: { semantic: `${id}-thigh` } });
    const shin = builder.addNode({ name: `nav_${id}_shin`, mesh: meshes.shin, translation: [0,-.55,0], parent: thigh, extras: { semantic: `${id}-shin` } });
    builder.addNode({ name: `nav_${id}_boot`, mesh: meshes.boot, translation: [0,-.46,-.1], parent: shin, extras: { semantic: `${id}-boot` } });
    builder.addNode({ name: `nav_${id}_coat`, mesh: meshes.coat, translation: [side*.22,-.31,.25], parent: hips, extras: { semantic: `${id}-coat` } });
  }
  const node = (name) => builder.json.nodes.findIndex((item) => item.name === name);
  const three = (value) => [value[0],value[1],value[2]];
  const q = (x=0,y=0,z=0) => quatFromEuler(x,y,z);
  const transformTrack = (nodeName, path, duration, values) => {
    const frame = keyframes(duration, values);
    return { node: node(nodeName), path, times: frame.times, values: frame.values };
  };
  const rot = (nodeName, duration, frames) => transformTrack(nodeName,'rotation',duration,frames.map(([x=0,y=0,z=0])=>q(x,y,z)));
  const pos = (nodeName, duration, frames) => transformTrack(nodeName,'translation',duration,frames.map(three));
  const add = (name, duration, tracks, tag) => builder.addAnimation(`navigator::${name}`, tracks, { semantic: tag || name.toLowerCase(), loopSuggested: !/wave|acknowledge|point|arrival|celebrate|inspect/i.test(name) });

  add('Idle', 2.4, [pos('EON_NAVIGATOR_RIG',2.4,[[0,0,0],[0,.018,0],[0,0,0]]), rot('nav_spine',2.4,[[0,0,0],[.026,0,.012],[0,0,0]]), rot('nav_head',2.4,[[0,0,0],[0,.09,0],[0,0,0]])], 'idle');
  for (const [name, pace, swing, bob] of [['Walk',.84,.48,.045],['Run',.56,.78,.075]]) {
    add(name, pace, [
      pos('EON_NAVIGATOR_RIG',pace,[[0,0,0],[0,bob,0],[0,0,0]]),
      rot('nav_l_upper_arm',pace,[[swing,0,0],[-swing,0,0],[swing,0,0]]), rot('nav_r_upper_arm',pace,[[-swing,0,0],[swing,0,0],[-swing,0,0]]),
      rot('nav_l_forearm',pace,[[.12,0,0],[-.05,0,0],[.12,0,0]]), rot('nav_r_forearm',pace,[[-.05,0,0],[.12,0,0],[-.05,0,0]]),
      rot('nav_l_thigh',pace,[[-swing,0,0],[swing,0,0],[-swing,0,0]]), rot('nav_r_thigh',pace,[[swing,0,0],[-swing,0,0],[swing,0,0]]),
      rot('nav_l_shin',pace,[[.1,0,0],[.42,0,0],[.1,0,0]]), rot('nav_r_shin',pace,[[.42,0,0],[.1,0,0],[.42,0,0]])
    ], name.toLowerCase());
  }
  add('TurnLeft', .42, [rot('nav_spine',.42,[[0,0,0],[0,.36,0],[0,.52,0]]), rot('nav_head',.42,[[0,0,0],[0,.22,0],[0,.28,0]])], 'turn-left');
  add('TurnRight', .42, [rot('nav_spine',.42,[[0,0,0],[0,-.36,0],[0,-.52,0]]), rot('nav_head',.42,[[0,0,0],[0,-.22,0],[0,-.28,0]])], 'turn-right');
  add('LookAround', 2.1, [rot('nav_head',2.1,[[0,-.26,0],[.04,.32,0],[0,-.12,0]])], 'look-around');
  add('Inspect', 1.3, [rot('nav_r_upper_arm',1.3,[[0,0,0],[-.52,0,-.15],[-.3,0,-.08]]),rot('nav_r_forearm',1.3,[[0,0,0],[-.62,0,0],[-.48,0,0]]),rot('nav_head',1.3,[[0,0,0],[.13,.08,0],[.08,.06,0]])], 'inspect');
  add('Wave', 1.05, [rot('nav_r_upper_arm',1.05,[[0,0,0],[-1.15,0,-.22],[-1.12,0,.26],[-1.15,0,-.22]]),rot('nav_r_forearm',1.05,[[0,0,0],[-.42,0,0],[-.32,0,.42],[-.42,0,0]])], 'wave');
  add('Acknowledge', .78, [rot('nav_head',.78,[[0,0,0],[.24,0,0],[0,0,0]]),rot('nav_spine',.78,[[0,0,0],[.06,0,0],[0,0,0]])], 'acknowledge');
  add('Point', 1.1, [rot('nav_l_upper_arm',1.1,[[0,0,0],[-.88,0,.55],[-.88,0,.55]]),rot('nav_l_forearm',1.1,[[0,0,0],[-.42,0,0],[-.42,0,0]]),rot('nav_head',1.1,[[0,0,0],[0,.2,0],[0,.2,0]])], 'point');
  add('Celebrate', 1.2, [rot('nav_l_upper_arm',1.2,[[0,0,0],[-1.35,0,0],[-1.2,0,.18]]),rot('nav_r_upper_arm',1.2,[[0,0,0],[-1.35,0,0],[-1.2,0,-.18]]),pos('EON_NAVIGATOR_RIG',1.2,[[0,0,0],[0,.075,0],[0,0,0]])], 'celebrate');
  add('Arrival', 1.55, [pos('EON_NAVIGATOR_RIG',1.55,[[0,0,0],[0,.035,0],[0,0,0]]),rot('nav_spine',1.55,[[.12,0,0],[0,0,0],[0,0,0]]),rot('nav_head',1.55,[[0,0,0],[0,.2,0],[0,0,0]])], 'arrival');
  return builder.build();
}

function eonbotSpec(level = 'lod1') {
  const detail = level === 'lod0' ? 1 : level === 'lod1' ? .78 : .56;
  const segments = level === 'lod0' ? 16 : level === 'lod1' ? 12 : 8;
  const builder = new GlbBuilder({
    name: `EONBOT Companion ${level.toUpperCase()}`,
    generator: 'EONAPP W602 Original EONBOT Rig Builder',
    extras: { assetId: 'eonbot-companion', lod: level, kind: 'companion', texturelessPbr: true, animationClipCount: 14 }
  });
  const shell = builder.addMaterial('EONBOT Shell', { baseColor: [.06,.12,.21,1], metallic: .76, roughness: .21 });
  const core = builder.addMaterial('EONBOT Core', { baseColor: [.02,.29,.42,1], metallic: .36, roughness: .16, emissive: [.03,.8,1], emissiveStrength: 1.9 });
  const eye = builder.addMaterial('EONBOT Eye', { baseColor: [.25,.09,.55,1], metallic: .42, roughness: .12, emissive: [.62,.22,1], emissiveStrength: 2.1 });
  const gold = builder.addMaterial('EONBOT Guide Accent', { baseColor: [.32,.2,.04,1], metallic: .67, roughness: .29, emissive: [.75,.44,.05], emissiveStrength: 1.25 });

  const meshes = {
    body: builder.addGeometryMesh('bot-body', uvSphere(.35, Math.max(5,Math.round(7*detail)), segments), shell),
    core: builder.addGeometryMesh('bot-core', uvSphere(.16, Math.max(4,Math.round(5*detail)), Math.max(7,segments-3)), core),
    eye: builder.addGeometryMesh('bot-eye', taperedBox(.23,.055,.18,.035,.1), eye),
    wing: builder.addGeometryMesh('bot-wing', taperedBox(.11,.28,.05,.42,.4), shell),
    arm: builder.addGeometryMesh('bot-arm', taperedBox(.08,.1,.06,.07,.32), shell),
    hand: builder.addGeometryMesh('bot-hand', uvSphere(.08,4,7), core),
    ring: builder.addGeometryMesh('bot-orbit-ring', ring(.49,.44,Math.max(12,segments+2)), gold),
    antenna: builder.addGeometryMesh('bot-antenna', cylinder(.025,.035,.36,Math.max(6,segments-4)), gold),
    beacon: builder.addGeometryMesh('bot-beacon', uvSphere(.07,4,7), eye),
    tail: builder.addGeometryMesh('bot-tail-fin', taperedBox(.17,.08,.05,.28,.34), shell)
  };
  const root = builder.addNode({ name: 'EONBOT_COMPANION_RIG', extras: { semantic: 'companion-root' } });
  const body = builder.addNode({ name: 'bot_body', mesh: meshes.body, translation: [0,0,0], parent: root, extras: { semantic: 'body' } });
  builder.addNode({ name: 'bot_core', mesh: meshes.core, translation: [0,0,-.2], parent: body, extras: { semantic: 'core' } });
  builder.addNode({ name: 'bot_eye', mesh: meshes.eye, translation: [0,.025,-.33], parent: body, extras: { semantic: 'eye' } });
  const ringA = builder.addNode({ name: 'bot_ring_a', mesh: meshes.ring, translation: [0,0,0], rotation: quatFromEuler(Math.PI/2,0,0), parent: body });
  const ringB = builder.addNode({ name: 'bot_ring_b', mesh: meshes.ring, translation: [0,0,0], rotation: quatFromEuler(Math.PI/2,.78,.35), parent: body });
  const ringC = builder.addNode({ name: 'bot_ring_c', mesh: meshes.ring, translation: [0,0,0], rotation: quatFromEuler(.38,.4,0), parent: body });
  for (const side of [-1,1]) {
    const id = side < 0 ? 'l' : 'r';
    const wing = builder.addNode({ name: `bot_${id}_wing`, mesh: meshes.wing, translation: [side*.38,.02,.04], rotation: quatFromEuler(0,0,side*.42), parent: body, extras: { semantic: `${id}-wing` } });
    const arm = builder.addNode({ name: `bot_${id}_arm`, mesh: meshes.arm, translation: [side*.26,-.18,-.02], rotation: quatFromEuler(0,0,side*.26), parent: body, extras: { semantic: `${id}-arm` } });
    builder.addNode({ name: `bot_${id}_hand`, mesh: meshes.hand, translation: [0,-.22,0], parent: arm, extras: { semantic: `${id}-hand` } });
    const antenna = builder.addNode({ name: `bot_${id}_antenna`, mesh: meshes.antenna, translation: [side*.15,.3,.02], rotation: quatFromEuler(0,0,side*.2), parent: body });
    builder.addNode({ name: `bot_${id}_beacon`, mesh: meshes.beacon, translation: [0,.2,0], parent: antenna });
  }
  builder.addNode({ name: 'bot_tail', mesh: meshes.tail, translation: [0,-.15,.36], rotation: quatFromEuler(.1,0,0), parent: body });
  const node = (name) => builder.json.nodes.findIndex((item) => item.name === name);
  const q = (x=0,y=0,z=0) => quatFromEuler(x,y,z);
  const transformTrack = (nodeName, path, duration, values) => {
    const frame = keyframes(duration, values);
    return { node: node(nodeName), path, times: frame.times, values: frame.values };
  };
  const rot = (nodeName, duration, frames) => transformTrack(nodeName,'rotation',duration,frames.map(([x=0,y=0,z=0])=>q(x,y,z)));
  const pos = (nodeName, duration, frames) => transformTrack(nodeName,'translation',duration,frames.map((v)=>vec3(v)));
  const add = (name, duration, tracks, tag) => builder.addAnimation(`eonbot::${name}`, tracks, { semantic: tag || name.toLowerCase(), loopSuggested: !/greet|alert|celebrate|return|acknowledge/i.test(name) });
  add('HoverIdle',2.2,[pos('EONBOT_COMPANION_RIG',2.2,[[0,0,0],[0,.08,0],[0,0,0]]),rot('bot_ring_a',2.2,[[Math.PI/2,0,0],[Math.PI/2,0,1.1],[Math.PI/2,0,2.2]]),rot('bot_ring_b',2.2,[[Math.PI/2,.78,.35],[Math.PI/2,1.5,.65],[Math.PI/2,2.25,1]])],'hover-idle');
  add('Follow',1.05,[pos('EONBOT_COMPANION_RIG',1.05,[[0,0,0],[0,.05,-.03],[0,0,0]]),rot('bot_l_wing',1.05,[[0,0,-.42],[0,.1,-.68],[0,0,-.42]]),rot('bot_r_wing',1.05,[[0,0,.42],[0,-.1,.68],[0,0,.42]])],'follow');
  add('Observe',1.5,[rot('bot_body',1.5,[[0,0,0],[0,.28,0],[0,-.18,0]]),rot('bot_eye',1.5,[[0,0,0],[0,-.1,0],[0,.08,0]])],'observe');
  add('Scan',1.7,[rot('bot_body',1.7,[[0,-.24,0],[0,.24,0],[0,-.24,0]]),rot('bot_ring_c',1.7,[[.38,.4,0],[.38,.4,1.8],[.38,.4,3.6]])],'scan');
  add('Speak',1.2,[pos('bot_core',1.2,[[0,0,-.2],[0,.014,-.22],[0,0,-.2]]),rot('bot_eye',1.2,[[0,0,0],[.05,0,0],[0,0,0]]),rot('bot_l_arm',1.2,[[0,0,-.26],[-.14,0,-.48],[0,0,-.26]]),rot('bot_r_arm',1.2,[[0,0,.26],[-.14,0,.48],[0,0,.26]])],'speak');
  add('Guide',1.25,[rot('bot_l_arm',1.25,[[0,0,-.26],[-.78,0,-.62],[-.78,0,-.62]]),rot('bot_r_arm',1.25,[[0,0,.26],[-.2,0,.16],[-.2,0,.16]]),rot('bot_body',1.25,[[0,0,0],[0,.16,0],[0,.16,0]])],'guide');
  add('Greet',1.05,[rot('bot_r_arm',1.05,[[0,0,.26],[-.7,0,.65],[-.7,0,.2],[-.7,0,.65]]),pos('EONBOT_COMPANION_RIG',1.05,[[0,0,0],[0,.11,0],[0,0,0]])],'greet');
  add('Alert',.82,[pos('EONBOT_COMPANION_RIG',.82,[[0,0,0],[0,.16,0],[0,.04,0]]),rot('bot_ring_a',.82,[[Math.PI/2,0,0],[Math.PI/2,0,2.8],[Math.PI/2,0,5.4]])],'alert');
  add('Celebrate',1.15,[rot('bot_l_wing',1.15,[[0,0,-.42],[0,.2,-1.0],[0,0,-.42]]),rot('bot_r_wing',1.15,[[0,0,.42],[0,-.2,1.0],[0,0,.42]]),pos('EONBOT_COMPANION_RIG',1.15,[[0,0,0],[0,.13,0],[0,0,0]])],'celebrate');
  add('Return',.95,[rot('bot_body',.95,[[0,.2,0],[0,0,0],[0,-.12,0]]),pos('EONBOT_COMPANION_RIG',.95,[[0,0,0],[0,.04,.06],[0,0,0]])],'return');
  add('Listen',1.6,[rot('bot_body',1.6,[[0,0,0],[.12,0,0],[.07,0,0]]),rot('bot_eye',1.6,[[0,0,0],[.06,0,0],[.04,0,0]])],'listen');
  add('Perch',1.4,[pos('EONBOT_COMPANION_RIG',1.4,[[0,0,0],[0,-.15,0],[0,-.15,0]]),rot('bot_l_wing',1.4,[[0,0,-.42],[0,0,-.12],[0,0,-.12]]),rot('bot_r_wing',1.4,[[0,0,.42],[0,0,.12],[0,0,.12]])],'perch');
  add('Orbit',1.25,[rot('bot_body',1.25,[[0,0,0],[0,1.9,0],[0,3.8,0]]),rot('bot_ring_b',1.25,[[Math.PI/2,.78,.35],[Math.PI/2,2.2,1.2],[Math.PI/2,3.6,2.1]])],'orbit');
  add('Acknowledge',.72,[rot('bot_body',.72,[[0,0,0],[.18,0,0],[0,0,0]]),pos('EONBOT_COMPANION_RIG',.72,[[0,0,0],[0,.055,0],[0,0,0]])],'acknowledge');
  return builder.build();
}

function readGlbSummary(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.readUInt32LE(0) !== GLB_MAGIC || buffer.readUInt32LE(4) !== GLB_VERSION) throw new Error(`${path.basename(filePath)} is not a GLB v2 file.`);
  const total = buffer.readUInt32LE(8);
  if (total !== buffer.length) throw new Error(`${path.basename(filePath)} total length mismatch.`);
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== GLB_JSON) throw new Error(`${path.basename(filePath)} JSON chunk missing.`);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').trim());
  return {
    file: path.basename(filePath),
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    meshes: json.meshes?.length || 0,
    nodes: json.nodes?.length || 0,
    animations: json.animations?.length || 0,
    generator: json.asset?.generator || null,
    assetId: json.asset?.extras?.assetId || json.extras?.assetId || null,
    texturelessPbr: json.asset?.extras?.texturelessPbr === true
  };
}

function write(file, data) {
  const destination = path.join(OUT, file);
  fs.writeFileSync(destination, data);
  return destination;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['eon-navigator-lod0.glb', () => navigatorSpec('lod0')],
    ['eon-navigator-lod1.glb', () => navigatorSpec('lod1')],
    ['eon-navigator-lod2.glb', () => navigatorSpec('lod2')],
    ['eonbot-companion-lod0.glb', () => eonbotSpec('lod0')],
    ['eonbot-companion-lod1.glb', () => eonbotSpec('lod1')],
    ['eonbot-companion-lod2.glb', () => eonbotSpec('lod2')]
  ];
  const generated = [];
  for (const [file, build] of jobs) {
    const destination = write(file, build());
    generated.push(readGlbSummary(destination));
  }
  const manifest = {
    schema: 'eon.city.original-rig-assets.w602.v1',
    generatedAt: 'source-controlled-deterministic',
    generator: 'scripts/build-w602-city-rig-assets.mjs',
    provenance: {
      origin: 'EONAPP original in-house work',
      licence: 'EONAPP controlled original work',
      derivativeOfThirdParty: false,
      remoteNetwork: false,
      containsUserData: false,
      texturePolicy: 'Textureless PBR/vertex geometry candidate. A future texture-bearing release must use KTX2/Basis Universal and a separate art review.'
    },
    assets: generated
  };
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main();

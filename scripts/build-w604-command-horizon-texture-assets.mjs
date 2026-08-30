#!/usr/bin/env node
/**
 * W604 — original Command Horizon PBR texture asset builder.
 *
 * Reads W603's original local GLBs and emits separate Balanced/Cinematic
 * variants with embedded deterministic PNG surface textures. The textures are
 * generated from source code: wet graphite grain, brushed metal, emissive
 * panel grids, and normal/roughness response. No third-party asset, remote
 * URI, account data, microphone data, or network request is introduced.
 *
 * KTX2/Basis compression is intentionally not claimed by this script. It
 * requires a verified external compressor/DCC pipeline and remains pending.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'assets', 'city', 'models');
const OUTPUT_MANIFEST = path.join(MODELS, 'W604_COMMAND_HORIZON_TEXTURE_ASSET_MANIFEST.json');
const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const GLB_JSON = 0x4e4f534a;
const GLB_BIN = 0x004e4942;
const FLOAT = 5126;
const ARRAY_BUFFER = 34962;

const align4 = (value) => (value + 3) & ~3;
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function makePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a = 255] = pixel(x, y, width, height);
      const offset = row + 1 + x * 4;
      raw[offset] = clampByte(r);
      raw[offset + 1] = clampByte(g);
      raw[offset + 2] = clampByte(b);
      raw[offset + 3] = clampByte(a);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

function noise(x, y, seed = 1) {
  let value = Math.imul((x + 11 + seed * 97) ^ (y + 23 + seed * 193), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

function makeTextureSet(seed = 1) {
  const size = 128;
  const baseColor = makePng(size, size, (x, y, w, h) => {
    const vertical = Math.sin((x / w) * Math.PI * 30 + noise(x, y, seed) * 2.2) * 7;
    const rain = ((x + y * 3 + seed * 11) % 31 === 0) ? 16 : 0;
    const value = 112 + vertical + rain + (noise(x * 2, y * 2, seed) - .5) * 27 - (y / h) * 12;
    return [value * .70, value * .84, value, 255];
  });
  const metallicRoughness = makePng(size, size, (x, y, w, h) => {
    const scratches = Math.abs(Math.sin((x / w) * Math.PI * 22 + y * .035));
    const rough = 90 + scratches * 70 + noise(x, y, seed + 8) * 28;
    const metal = 174 + noise(x, y, seed + 13) * 58;
    return [0, rough, metal, 255];
  });
  const normal = makePng(size, size, (x, y, w, h) => {
    const ridgeX = Math.sin((x / w) * Math.PI * 18 + y * .026) * .58;
    const ridgeY = Math.cos((y / h) * Math.PI * 13 + x * .023) * .42;
    return [128 + ridgeX * 28, 128 + ridgeY * 28, 248, 255];
  });
  const emissive = makePng(size, size, (x, y, w, h) => {
    const line = x % 16 === 0 || y % 24 === 0 || (x + y + seed * 7) % 47 === 0;
    const node = (x % 32 === 0 && y % 24 === 0);
    const glow = node ? 255 : line ? 176 : 0;
    return [glow * .18, glow * .84, glow, 255];
  });
  return { baseColor, metallicRoughness, normal, emissive };
}

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== GLB_MAGIC || buffer.readUInt32LE(4) !== GLB_VERSION) throw new Error('invalid-source-glb');
  let cursor = 12;
  let json = null;
  let bin = null;
  while (cursor < buffer.length) {
    const length = buffer.readUInt32LE(cursor);
    const type = buffer.readUInt32LE(cursor + 4);
    const payload = buffer.subarray(cursor + 8, cursor + 8 + length);
    if (type === GLB_JSON) json = JSON.parse(payload.toString('utf8').trim());
    if (type === GLB_BIN) bin = Buffer.from(payload);
    cursor += 8 + length;
  }
  if (!json || !bin) throw new Error('source-glb-missing-json-or-bin');
  return { json, bin };
}

function buildGlb(json, bin) {
  json.buffers = [{ byteLength: align4(bin.length) }];
  const paddedBin = Buffer.concat([bin, Buffer.alloc(align4(bin.length) - bin.length)]);
  const jsonRaw = Buffer.from(JSON.stringify(json), 'utf8');
  const paddedJson = Buffer.concat([jsonRaw, Buffer.alloc(align4(jsonRaw.length) - jsonRaw.length, 0x20)]);
  const total = 12 + 8 + paddedJson.length + 8 + paddedBin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(GLB_VERSION, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(GLB_JSON, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBin.length, 0);
  binHeader.writeUInt32LE(GLB_BIN, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin]);
}

function appendState(bin) {
  const chunks = [Buffer.from(bin)];
  let length = bin.length;
  return {
    append(payload) {
      const data = Buffer.from(payload);
      const offset = align4(length);
      if (offset > length) chunks.push(Buffer.alloc(offset - length));
      chunks.push(data);
      length = offset + data.length;
      return { byteOffset: offset, byteLength: data.length };
    },
    build() { return Buffer.concat(chunks, length); }
  };
}

function appendBufferView(json, state, payload, target = null) {
  const view = { buffer: 0, ...state.append(payload) };
  if (target) view.target = target;
  json.bufferViews ||= [];
  json.bufferViews.push(view);
  return json.bufferViews.length - 1;
}

function appendAccessor(json, state, typed, { componentType = FLOAT, type = 'VEC2', target = ARRAY_BUFFER } = {}) {
  const view = appendBufferView(json, state, Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength), target);
  const count = typed.length / (type === 'VEC2' ? 2 : type === 'VEC3' ? 3 : 1);
  json.accessors ||= [];
  json.accessors.push({ bufferView: view, componentType, count, type });
  return json.accessors.length - 1;
}

function readPositionAccessor(json, bin, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];
  const view = json.bufferViews?.[accessor?.bufferView];
  if (!accessor || !view || accessor.componentType !== FLOAT || accessor.type !== 'VEC3') throw new Error('unsupported-position-accessor');
  const offset = Number(view.byteOffset || 0) + Number(accessor.byteOffset || 0);
  const count = Number(accessor.count || 0);
  return new Float32Array(bin.buffer, bin.byteOffset + offset, count * 3);
}

function addUvCoordinates(json, sourceBin, state) {
  for (const mesh of json.meshes || []) for (const primitive of mesh.primitives || []) {
    if (primitive.attributes?.TEXCOORD_0 !== undefined || primitive.attributes?.POSITION === undefined) continue;
    const positions = readPositionAccessor(json, sourceBin, primitive.attributes.POSITION);
    const uvs = new Float32Array((positions.length / 3) * 2);
    for (let index = 0; index < positions.length; index += 3) {
      const vertex = index / 3;
      const x = positions[index];
      const y = positions[index + 1];
      const z = positions[index + 2];
      uvs[vertex * 2] = ((x * .29 + z * .11) % 1 + 1) % 1;
      uvs[vertex * 2 + 1] = ((y * .31 + z * .17) % 1 + 1) % 1;
    }
    primitive.attributes.TEXCOORD_0 = appendAccessor(json, state, uvs);
  }
}

function addTextureImages(json, state, textureSet) {
  json.samplers ||= [];
  const sampler = json.samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }) - 1;
  json.images ||= [];
  json.textures ||= [];
  const textureIndex = {};
  for (const [name, payload] of Object.entries(textureSet)) {
    const view = appendBufferView(json, state, payload);
    const image = json.images.push({ name: `W604 ${name}`, bufferView: view, mimeType: 'image/png', extras: { originalEonTexture: true, generatedFromSource: true } }) - 1;
    textureIndex[name] = json.textures.push({ name: `W604 ${name}`, sampler, source: image, extras: { originalEonTexture: true } }) - 1;
  }
  return textureIndex;
}

function applyPbrTextures(json, textures) {
  for (const material of json.materials || []) {
    material.pbrMetallicRoughness ||= {};
    material.pbrMetallicRoughness.baseColorTexture = { index: textures.baseColor, texCoord: 0 };
    material.pbrMetallicRoughness.metallicRoughnessTexture = { index: textures.metallicRoughness, texCoord: 0 };
    material.normalTexture = { index: textures.normal, texCoord: 0, scale: .42 };
    const emissive = material.emissiveFactor || [0, 0, 0];
    if (emissive.some((value) => Number(value) > 0.001)) material.emissiveTexture = { index: textures.emissive, texCoord: 0 };
    material.extras = { ...(material.extras || {}), originalEonPbrTextureSet: true, textureAuthoring: 'source-generated-png', ktx2Basis: false };
  }
}

function textureAsset({ id, sourceFile, outputFile, lod, seed, role }) {
  const parsed = parseGlb(fs.readFileSync(path.join(MODELS, sourceFile)));
  const json = structuredClone(parsed.json);
  const state = appendState(parsed.bin);
  addUvCoordinates(json, parsed.bin, state);
  const textureIndices = addTextureImages(json, state, makeTextureSet(seed));
  applyPbrTextures(json, textureIndices);
  json.asset.generator = 'EONAPP W604 Command Horizon Original PBR Texture Builder';
  json.asset.extras = { ...(json.asset.extras || {}), assetId: id, lod, texturelessPbr: false, originalPbrTextures: true, ktx2Basis: false };
  json.extras = { ...(json.extras || {}), assetId: id, lod, texturelessPbr: false, originalPbrTextures: true, ktx2Basis: false, role };
  const output = buildGlb(json, state.build());
  fs.writeFileSync(path.join(MODELS, outputFile), output);
  return { fileName: outputFile, bytes: output.length, sha256: sha256(output), embeddedTextureCount: 4 };
}

const sourceAssets = [
  { base: 'command-horizon-arrival-gate', id: 'command-horizon-arrival-gate-textured', role: 'Arrival Gate original PBR-textured environment kit', seed: 11 },
  { base: 'command-horizon-command-deck', id: 'command-horizon-command-deck-textured', role: 'Command Deck original PBR-textured environment kit', seed: 23 },
  { base: 'command-horizon-wayfinding', id: 'command-horizon-wayfinding-textured', role: 'Wayfinding original PBR-textured environment kit', seed: 37 }
];

const manifest = {
  schema: 'eon.city.w604.command-horizon-texture-assets.v1',
  generatedAt: new Date().toISOString(),
  source: 'scripts/build-w604-command-horizon-texture-assets.mjs',
  original: true,
  remoteNetwork: false,
  userData: false,
  embeddedPngTextures: true,
  ktx2Basis: false,
  assets: []
};
for (const asset of sourceAssets) {
  const variants = {};
  for (const lod of ['lod2', 'lod1', 'lod0']) {
    const sourceFile = `${asset.base}-${lod}.glb`;
    const outputFile = `${asset.base}-${lod}-textured.glb`;
    variants[lod] = textureAsset({ id: asset.id, sourceFile, outputFile, lod, seed: asset.seed + lod.length, role: asset.role });
  }
  manifest.assets.push({ id: asset.id, role: asset.role, variants });
}
fs.writeFileSync(OUTPUT_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));

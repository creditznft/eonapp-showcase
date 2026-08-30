import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  getCityAssetById,
  getCityAssetVariant,
  validateCityAssetCatalog
} from '../../assets/js/city/eon-city-asset-catalog.js';
import {
  getEonCitySceneArtTextureMode,
  resolveEonCitySceneArtAssetId
} from '../../assets/js/city/eon-city-scene-art-quality.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const textured = Object.freeze({
  'command-horizon-arrival-gate-textured': Object.freeze({
    lite: 'command-horizon-arrival-gate-lod2-textured.glb',
    balanced: 'command-horizon-arrival-gate-lod1-textured.glb',
    cinematic: 'command-horizon-arrival-gate-lod0-textured.glb',
    fallback: 'command-horizon-arrival-gate'
  }),
  'command-horizon-command-deck-textured': Object.freeze({
    lite: 'command-horizon-command-deck-lod2-textured.glb',
    balanced: 'command-horizon-command-deck-lod1-textured.glb',
    cinematic: 'command-horizon-command-deck-lod0-textured.glb',
    fallback: 'command-horizon-command-deck'
  }),
  'command-horizon-wayfinding-textured': Object.freeze({
    lite: 'command-horizon-wayfinding-lod2-textured.glb',
    balanced: 'command-horizon-wayfinding-lod1-textured.glb',
    cinematic: 'command-horizon-wayfinding-lod0-textured.glb',
    fallback: 'command-horizon-wayfinding'
  })
});

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function parseGlb(relative) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${relative} must use GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2, `${relative} must use GLB 2`);
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength, `${relative} must declare its exact byte length`);
  let cursor = 12;
  let json = null;
  let bin = null;
  while (cursor < bytes.length) {
    const length = bytes.readUInt32LE(cursor);
    const type = bytes.readUInt32LE(cursor + 4);
    const payload = bytes.subarray(cursor + 8, cursor + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(payload.toString('utf8').trim());
    if (type === 0x004e4942) bin = payload;
    cursor += 8 + length;
  }
  assert.ok(json, `${relative} needs JSON chunk`);
  assert.ok(bin, `${relative} needs BIN chunk`);
  return { bytes, json, bin };
}

function verifyEmbeddedPng(json, bin, image) {
  assert.equal(image?.mimeType, 'image/png');
  assert.equal(typeof image?.uri, 'undefined');
  const view = json.bufferViews?.[image?.bufferView];
  assert.ok(view, 'embedded image must use a GLB bufferView');
  const offset = Number(view.byteOffset || 0);
  assert.deepEqual(bin.subarray(offset, offset + PNG_SIGNATURE.length), PNG_SIGNATURE, 'embedded texture must be a PNG payload');
}

test('W604 catalog ships the three original embedded-PNG PBR environment asset candidates with W603 fallbacks', () => {
  const validation = validateCityAssetCatalog();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  for (const [assetId, expected] of Object.entries(textured)) {
    const asset = getCityAssetById(assetId);
    assert.equal(asset?.status, 'shipped');
    assert.equal(asset?.fallback?.id, expected.fallback);
    assert.match(asset?.provenance?.evidencePath || '', /W604_COMMAND_HORIZON_TEXTURE_ASSET_PROVENANCE/);
    assert.equal(asset?.provenance?.derivativeOfThirdParty, false);
    assert.equal(asset?.constraints?.allowExternalNetwork, false);
    assert.equal(asset?.constraints?.containsUserData, false);
    assert.ok(asset?.tags?.includes('source-generated-png-pbr'));
    assert.ok(asset?.tags?.includes('ktx2-basis-pending'));
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const variant = getCityAssetVariant(asset, quality);
      assert.ok(variant?.sourcePath?.endsWith(expected[quality]));
      assert.match(variant?.sha256 || '', /^[a-f0-9]{64}$/);
    }
  }
});

test('W604 GLBs contain local embedded original PBR PNGs, UVs, and material bindings without remote URIs', async () => {
  for (const [assetId, expected] of Object.entries(textured)) {
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const file = expected[quality];
      const relative = `assets/city/models/${file}`;
      const { bytes, json, bin } = await parseGlb(relative);
      const asset = getCityAssetById(assetId);
      const variant = getCityAssetVariant(asset, quality);
      const publicBytes = await readFile(path.join(ROOT, 'public', relative));
      assert.equal(sha256(bytes), variant.sha256, `${file} source must match catalog hash`);
      assert.equal(sha256(publicBytes), variant.sha256, `${file} public copy must match catalog hash`);
      assert.match(json?.asset?.generator || '', /EONAPP W604 Command Horizon Original PBR Texture Builder/);
      assert.equal(json?.asset?.extras?.originalPbrTextures, true);
      assert.equal(json?.asset?.extras?.ktx2Basis, false);
      assert.equal(json?.extras?.originalPbrTextures, true);
      assert.equal(json?.extras?.ktx2Basis, false);
      assert.equal((json.images || []).length, 4, `${file} requires four embedded texture payloads`);
      assert.equal((json.textures || []).length, 4, `${file} requires four GLB texture records`);
      for (const image of json.images || []) verifyEmbeddedPng(json, bin, image);
      for (const material of json.materials || []) {
        assert.ok(material?.pbrMetallicRoughness?.baseColorTexture, `${file} material requires base color texture`);
        assert.ok(material?.pbrMetallicRoughness?.metallicRoughnessTexture, `${file} material requires metallic-roughness texture`);
        assert.ok(material?.normalTexture, `${file} material requires normal texture`);
        assert.equal(material?.extras?.originalEonPbrTextureSet, true);
        assert.equal(material?.extras?.ktx2Basis, false);
      }
      assert.ok((json.materials || []).some((material) => material?.emissiveTexture), `${file} should retain at least one emissive PBR material`);
      for (const mesh of json.meshes || []) for (const primitive of mesh.primitives || []) {
        assert.notEqual(primitive?.attributes?.TEXCOORD_0, undefined, `${file} every primitive needs local UV coordinates`);
      }
      const serialized = JSON.stringify(json);
      assert.equal(serialized.includes('http://'), false);
      assert.equal(serialized.includes('https://'), false);
      assert.equal(serialized.includes('data:'), false);
    }
  }
});

test('W604 quality selector keeps W603 textureless art on Lite and selects W604 textured art above Lite', () => {
  for (const [texturedAssetId, expected] of Object.entries(textured)) {
    assert.equal(resolveEonCitySceneArtAssetId({ assetId: expected.fallback, texturedAssetId, quality: 'lite' }), expected.fallback);
    assert.equal(resolveEonCitySceneArtAssetId({ assetId: expected.fallback, texturedAssetId, quality: 'balanced' }), texturedAssetId);
    assert.equal(resolveEonCitySceneArtAssetId({ assetId: expected.fallback, texturedAssetId, quality: 'cinematic' }), texturedAssetId);
  }
  assert.equal(getEonCitySceneArtTextureMode('lite'), 'textureless-pbr-fallback');
  assert.equal(getEonCitySceneArtTextureMode('balanced'), 'source-generated-png-pbr');
  assert.equal(getEonCitySceneArtTextureMode('cinematic'), 'source-generated-png-pbr');
});

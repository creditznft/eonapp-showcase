import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_ASSET_CATALOG,
  getCityAssetById,
  getCityAssetVariant,
  validateCityAssetCatalog
} from '../../assets/js/city/eon-city-asset-catalog.js';
import {
  createEonCityCharacterMotionDirector,
  getEonCityNavigatorMotionClip
} from '../../assets/js/city/eon-city-character-motion-director.js';
import {
  createEonCityCompanionDirector,
  EON_CITY_COMPANION_MODES
} from '../../assets/js/city/eon-city-companion-director.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sceneAssets = Object.freeze({
  'command-horizon-arrival-gate': Object.freeze({ lite: 'command-horizon-arrival-gate-lod2.glb', balanced: 'command-horizon-arrival-gate-lod1.glb', cinematic: 'command-horizon-arrival-gate-lod0.glb', minimumNodes: 15, minimumMeshes: 9 }),
  'command-horizon-command-deck': Object.freeze({ lite: 'command-horizon-command-deck-lod2.glb', balanced: 'command-horizon-command-deck-lod1.glb', cinematic: 'command-horizon-command-deck-lod0.glb', minimumNodes: 17, minimumMeshes: 10 }),
  'command-horizon-wayfinding': Object.freeze({ lite: 'command-horizon-wayfinding-lod2.glb', balanced: 'command-horizon-wayfinding-lod1.glb', cinematic: 'command-horizon-wayfinding-lod0.glb', minimumNodes: 10, minimumMeshes: 6 })
});

async function parseGlb(relative) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${relative} must have GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2, `${relative} must use GLB 2`);
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength, `${relative} must have a correct declared byte length`);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, `${relative} must start with a JSON GLB chunk`);
  const length = bytes.readUInt32LE(12);
  return { bytes, json: JSON.parse(bytes.subarray(20, 20 + length).toString('utf8').trim()) };
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

test('W603 catalog adds three shipped original Command Horizon environment kits without weakening asset provenance', () => {
  const validation = validateCityAssetCatalog();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  for (const [assetId, requirements] of Object.entries(sceneAssets)) {
    const asset = getCityAssetById(assetId);
    assert.equal(asset?.status, 'shipped');
    assert.match(asset?.provenance?.evidencePath || '', /W603_COMMAND_HORIZON_ART_ASSET_PROVENANCE/);
    assert.equal(asset?.provenance?.derivativeOfThirdParty, false);
    assert.equal(asset?.constraints?.allowExternalNetwork, false);
    assert.equal(asset?.constraints?.containsUserData, false);
    assert.equal(asset?.constraints?.staticOnly, true);
    assert.equal(asset?.constraints?.articulatedNodeRig, false);
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const variant = getCityAssetVariant(asset, quality);
      assert.ok(variant?.sourcePath?.endsWith(requirements[quality]));
      assert.match(variant?.sha256 || '', /^[a-f0-9]{64}$/);
    }
  }
  assert.ok(CITY_ASSET_CATALOG.filter((entry) => entry.status === 'shipped').length >= 5);
});

test('W603 original GLBs are deterministic local PBR containers with no image, remote URI, or user payload', async () => {
  for (const [assetId, requirements] of Object.entries(sceneAssets)) {
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const file = requirements[quality];
      const { bytes, json } = await parseGlb(`assets/city/models/${file}`);
      const variant = getCityAssetVariant(getCityAssetById(assetId), quality);
      assert.equal(sha256(bytes), variant.sha256, `${file} must match catalog hash`);
      assert.match(json?.asset?.generator || '', /EONAPP W603 Command Horizon Original Art Builder/);
      assert.equal(json?.asset?.extras?.assetId, assetId);
      assert.equal(json?.asset?.extras?.texturelessPbr, true);
      assert.equal(Array.isArray(json.images) ? json.images.length : 0, 0);
      assert.equal(Array.isArray(json.textures) ? json.textures.length : 0, 0);
      assert.equal(JSON.stringify(json).includes('http://'), false);
      assert.equal(JSON.stringify(json).includes('https://'), false);
      assert.ok((json.nodes || []).length >= requirements.minimumNodes);
      assert.ok((json.meshes || []).length >= requirements.minimumMeshes);
    }
  }
});

test('W603 navigator motion uses applied collision-resolved movement and never runs in place against a wall', () => {
  const director = createEonCityCharacterMotionDirector({ initialHeading: 0, walkSpeed: 4.8 });
  const blocked = director.update({ desiredMove: { x: 0, z: 1 }, appliedStep: 0, deltaMs: 16, focused: false });
  assert.equal(blocked.moving, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.clip, 'Idle');
  const left = director.update({ desiredMove: { x: -1, z: 0 }, appliedStep: 0.08, deltaMs: 16, focused: false });
  assert.equal(left.moving, true);
  assert.ok(left.heading < 0, `left-facing heading should be negative, got ${left.heading}`);
  assert.equal(left.clip, 'Walk');
  assert.equal(getEonCityNavigatorMotionClip({ moving: true, speed: 5.4 }), 'Run');
  assert.equal(getEonCityNavigatorMotionClip({ moving: false, speed: 0, focused: true }), 'Inspect');
});

test('W603 EONBOT director stays local, responds to deliberate intent, and offsets from a nearby camera', () => {
  const director = createEonCityCompanionDirector({ initialPosition: { x: 0, y: 1.5, z: 4 } });
  const follow = director.update({ operatorPosition: { x: 0, y: 0, z: 5 }, operatorHeading: 0, cameraPosition: { x: 0.9, y: 1.2, z: 5.6 }, moving: true, deltaMs: 32 });
  assert.equal(follow.mode, 'follow');
  assert.equal(follow.localOnly, true);
  assert.equal(follow.autonomousAgent, false);
  assert.equal(follow.remoteNetwork, false);
  const listening = director.update({ operatorPosition: { x: 0, y: 0, z: 5 }, operatorHeading: 0, cameraPosition: { x: 1, y: 1.5, z: 5.4 }, intent: 'listen', deltaMs: 32 });
  assert.equal(listening.mode, 'listen');
  assert.equal(listening.microphoneRequested, false);
  assert.ok(EON_CITY_COMPANION_MODES.includes(listening.mode));
});

test('W603 City runtime loads local environment art, uses motion directors, exposes companion intent, and removes fixed procedural follow positioning', async () => {
  const scene = await readFile(path.join(ROOT, 'assets/js/city/eon-city-play-babylon.js'), 'utf8');
  const artRuntime = await readFile(path.join(ROOT, 'assets/js/city/eon-city-original-scene-art-runtime.js'), 'utf8');
  const station = await readFile(path.join(ROOT, 'assets/js/eon-city-play-station.js'), 'utf8');
  assert.match(scene, /createEonCityOriginalSceneArtRuntime/);
  assert.match(scene, /createEonCityCharacterMotionDirector/);
  assert.match(scene, /createEonCityCompanionDirector/);
  assert.match(scene, /setCompanionIntent\(mode/);
  assert.match(scene, /originalSceneArtRuntime\.start/);
  assert.match(scene, /operator-procedural-fallback[\s\S]*fallback\.parent = root/);
  assert.doesNotMatch(scene, /operator-procedural-fallback[\s\S]*fallback\.parent = fallback/);
  assert.match(scene, /trackAsyncCityBootStage\('ORIGINAL_SCENE_ART_RUNTIME'/);
  assert.match(scene, /recordCityBootStage\('FIRST_RENDER_/);
  assert.match(scene, /recordCityBootStage\('RENDER_LOOP_/);
  assert.doesNotMatch(scene, /root\.position\.x = operator\.position\.x \+ staging\.followOffset\.x/);
  assert.match(artRuntime, /rootUrl\.startsWith\('\/assets\/city\/'\)/);
  assert.match(artRuntime, /timeoutMs:\s*CITY_BOOT_AWAIT_TIMEOUT_MS/);
  assert.match(artRuntime, /ownerVisualApprovalPending: true/);
  assert.match(station, /signalCompanion\('listen', 8_000\)/);
  assert.match(station, /signalCompanion\('speak', 4_200\)/);
  assert.match(station, /not a live AI conversation/);
  assert.match(station, /live assistant voice conversation remains unavailable/);
});

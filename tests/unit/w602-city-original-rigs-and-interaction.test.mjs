import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_ASSET_CATALOG,
  getCityAssetById,
  getCityAssetLoadPlan,
  getCityAssetVariant,
  validateCityAssetCatalog
} from '../../assets/js/city/eon-city-asset-catalog.js';
import { speakEonCityCaption } from '../../assets/js/city/eon-city-voice-consent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const expected = Object.freeze({
  'operator-hero': Object.freeze({
    lite: 'eon-navigator-lod2.glb', balanced: 'eon-navigator-lod1.glb', cinematic: 'eon-navigator-lod0.glb', animations: ['navigator::Idle', 'navigator::Walk', 'navigator::Run', 'navigator::TurnLeft', 'navigator::TurnRight', 'navigator::LookAround', 'navigator::Inspect', 'navigator::Wave', 'navigator::Acknowledge', 'navigator::Point', 'navigator::Celebrate', 'navigator::Arrival']
  }),
  'eonbot-companion': Object.freeze({
    lite: 'eonbot-companion-lod2.glb', balanced: 'eonbot-companion-lod1.glb', cinematic: 'eonbot-companion-lod0.glb', animations: ['eonbot::HoverIdle', 'eonbot::Follow', 'eonbot::Observe', 'eonbot::Scan', 'eonbot::Speak', 'eonbot::Guide', 'eonbot::Greet', 'eonbot::Alert', 'eonbot::Celebrate', 'eonbot::Return', 'eonbot::Listen', 'eonbot::Perch', 'eonbot::Orbit', 'eonbot::Acknowledge']
  })
});

async function parseGlb(relative) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${relative} must start with GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2, `${relative} must be GLB v2`);
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength, `${relative} must have a valid declared byte length`);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, `${relative} first chunk must be JSON`);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
}

test('W602 catalog validates and resolves same-origin LOD variants for the two shipped original rigs', () => {
  const validation = validateCityAssetCatalog();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.ok(CITY_ASSET_CATALOG.filter((entry) => entry.status === 'shipped').length >= 2);
  for (const [assetId, requirements] of Object.entries(expected)) {
    const asset = getCityAssetById(assetId);
    assert.equal(asset?.status, 'shipped');
    assert.equal(asset?.provenance?.derivativeOfThirdParty, false);
    assert.match(asset?.provenance?.evidencePath || '', /^docs\/city-art\//);
    assert.equal(asset?.constraints?.allowExternalNetwork, false);
    assert.equal(asset?.constraints?.containsUserData, false);
    assert.equal(asset?.constraints?.articulatedNodeRig, true);
    assert.equal(asset?.provenance?.reviewState, 'engineering-verified-owner-visual-approval-pending');
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const variant = getCityAssetVariant(asset, quality);
      assert.ok(variant?.sourcePath?.endsWith(requirements[quality]));
      assert.match(variant?.sha256 || '', /^[a-f0-9]{64}$/);
    }
  }
  const plan = getCityAssetLoadPlan({ quality: 'balanced', families: ['character', 'companion'] });
  assert.equal(plan.shippedCount, 2);
  assert.deepEqual(plan.entries.slice(0, 2).map((entry) => entry.sourcePath), [
    '/assets/city/models/eon-navigator-lod1.glb',
    '/assets/city/models/eonbot-companion-lod1.glb'
  ]);
});

test('W602 GLB candidates are valid local animation containers with no URI or image texture payloads', async () => {
  for (const [assetId, requirements] of Object.entries(expected)) {
    for (const quality of ['lite', 'balanced', 'cinematic']) {
      const file = requirements[quality];
      const json = await parseGlb(`assets/city/models/${file}`);
      assert.match(json?.asset?.generator || '', /EONAPP W602 Original (Navigator|EONBOT) Rig Builder/);
      assert.equal(json?.asset?.extras?.assetId, assetId);
      assert.equal(json?.asset?.extras?.texturelessPbr, true);
      assert.equal(Array.isArray(json.images) ? json.images.length : 0, 0, `${file} must not claim a texture pipeline it does not contain`);
      assert.equal(Array.isArray(json.textures) ? json.textures.length : 0, 0);
      assert.equal(JSON.stringify(json).includes('http://'), false);
      assert.equal(JSON.stringify(json).includes('https://'), false);
      const names = (json.animations || []).map((item) => item.name);
      assert.deepEqual(names, requirements.animations);
      assert.ok((json.nodes || []).length >= (assetId === 'operator-hero' ? 20 : 14));
      assert.ok((json.meshes || []).length >= (assetId === 'operator-hero' ? 12 : 8));
    }
  }
});

test('W602 Babylon rig runtime attaches same-origin GLB containers and preserves a procedural fallback on load failure', async () => {
  const source = await readFile(path.join(ROOT, 'assets/js/city/eon-city-original-rig-runtime.js'), 'utf8');
  const city = await readFile(path.join(ROOT, 'assets/js/city/eon-city-play-babylon.js'), 'utf8');
  assert.match(source, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(source, /rootUrl\.startsWith\('\/assets\/city\/'\)/);
  assert.match(source, /timeoutMs:\s*CITY_ASSET_LOAD_TIMEOUT_MS|timeoutMs:/);
  assert.match(source, /hideProceduralFallback/);
  assert.match(source, /ownerVisualApprovalPending: true/);
  assert.match(city, /createEonCityOriginalRigRuntime/);
  assert.match(city, /originalRigRuntime\.start/);
  assert.match(city, /trackAsyncCityBootStage\('ORIGINAL_RIG_RUNTIME'/);
  assert.match(city, /proceduralFallbackRoot/);
  assert.match(city, /createCityAssetRuntime/);
});

test('W602 City UI exposes direct voice/chat/district actions, removes generic Interact, and protects first-run input above canvas', async () => {
  const station = await readFile(path.join(ROOT, 'assets/js/eon-city-play-station.js'), 'utf8');
  const css = await readFile(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8');
  const scene = await readFile(path.join(ROOT, 'assets/js/city/eon-city-play-babylon.js'), 'utf8');
  for (const selector of ['data-eon-play-open-command-room>Command Room', 'data-eon-play-open-eonbot>EONBOT', 'data-eon-play-open-travel-map>Districts', 'data-eon-play-open-controls>Menu', 'data-eon-play-context-action']) assert.match(station, new RegExp(selector));
  assert.doesNotMatch(station, /data-eon-play-interact/);
  assert.match(station, /Review \$\{nearbyLabel\}/);
  assert.match(station, /containModalPointer/);
  assert.match(station, /panel\.style\.zIndex = String\(contract\.minimumZIndex\)/);
  assert.match(css, /\.eon-play-first-run-panel\{z-index:1200;isolation:isolate;contain:layout style paint;touch-action:manipulation\}/);
  assert.match(scene, /diameter: Math\.max\(2\.2, Math\.min\(3\.6, landmark\.radius \* 0\.9\)\)/);
  assert.match(scene, /eon-universe-landmark-label-/);
});

test('W602 EONBOT browser caption output is explicit and never implies a live conversation', () => {
  const calls = [];
  class FakeUtterance { constructor(text) { this.text = text; } }
  const environment = { speechSynthesis: { cancel() { calls.push('cancel'); }, speak(utterance) { calls.push(utterance.text); } }, SpeechSynthesisUtterance: FakeUtterance };
  const blocked = speakEonCityCaption({ environment, text: 'Hello', explicitUserAction: false });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error, 'explicit-user-action-required');
  assert.equal(calls.length, 0);
  const started = speakEonCityCaption({ environment, text: 'Choose a named City signal.', locale: 'en-US', explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(started.liveConversation, false);
  assert.equal(started.providerRequestCreated, false);
  assert.deepEqual(calls, ['cancel', 'Choose a named City signal.']);
});

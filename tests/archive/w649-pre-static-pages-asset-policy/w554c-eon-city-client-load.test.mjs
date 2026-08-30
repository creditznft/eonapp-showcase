import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_CLIENT_DELIVERY,
  EON_CITY_CLIENT_LOAD_SCHEMA,
  createEonCityClientLoadSnapshot,
  describeEonCityLoadProgress,
  isDirectStaticEonCityAssetPath,
  validateEonCityClientDeliveryContract
} from '../../config/w554c-eon-city-client-load-contract.mjs';
import {
  createEonCityClientLoadSequence,
  fetchDirectStaticEonCityAsset,
  renderEonCityClientLoadMarkup
} from '../../assets/js/city/eon-city-client-load-sequence.js';
import { buildEonCityAccessDecision } from '../../config/w554-eon-city-access-project-portals-contract.mjs';

test('W554C locks client-first static asset delivery and forbids Pages Function byte relays', () => {
  const validation = validateEonCityClientDeliveryContract();
  assert.equal(validation.ok, true);
  assert.equal(EON_CITY_CLIENT_DELIVERY.pagesFunctionAssetRelayAllowed, false);
  assert.equal(EON_CITY_CLIENT_DELIVERY.directStaticResponses, true);
  assert.equal(isDirectStaticEonCityAssetPath('/assets/city/command-horizon.glb'), true);
  assert.equal(isDirectStaticEonCityAssetPath('/city-assets/command-horizon.ktx2'), true);
  assert.equal(isDirectStaticEonCityAssetPath('/city-private/command-horizon.glb'), false);
  assert.equal(isDirectStaticEonCityAssetPath('https://assets.example/command-horizon.glb'), false);
  assert.equal(isDirectStaticEonCityAssetPath('/assets/city/command-horizon.glb?ticket=x'), false);
});

test('W554C stage progress cannot regress and only reports ready after a first frame', () => {
  const sequence = createEonCityClientLoadSequence({ quality: 'balanced', directEntry: true });
  assert.equal(sequence.getSnapshot().schema, EON_CITY_CLIENT_LOAD_SCHEMA);
  assert.equal(sequence.getSnapshot().progress, 6);
  sequence.advance('engine-loading');
  assert.equal(sequence.getSnapshot().progress, 52);
  sequence.advance('device-profile');
  assert.equal(sequence.getSnapshot().stage, 'engine-loading');
  assert.equal(sequence.getSnapshot().progress, 52);
  sequence.advance('world-building');
  assert.equal(sequence.getSnapshot().progress, 78);
  sequence.ready();
  assert.equal(sequence.getSnapshot().status, 'ready');
  assert.equal(sequence.getSnapshot().progress, 100);
  assert.match(describeEonCityLoadProgress(sequence.getSnapshot()), /Stage 7 of 7/);
});

test('W554C uses byte progress only when an approved direct static asset has real totals', () => {
  const sequence = createEonCityClientLoadSequence();
  sequence.startAsset({ id: 'command-horizon-kit', sourcePath: '/city-assets/command-horizon-kit.glb', totalBytes: 1000 });
  sequence.reportAssetBytes({ id: 'command-horizon-kit', sourcePath: '/city-assets/command-horizon-kit.glb', loadedBytes: 500, totalBytes: 1000 });
  const snapshot = sequence.getSnapshot();
  assert.equal(snapshot.stage, 'art-streaming');
  assert.equal(snapshot.asset.loadedBytes, 500);
  assert.equal(snapshot.asset.totalBytes, 1000);
  assert.equal(snapshot.asset.directStatic, true);
  assert.equal(snapshot.progress > 92 && snapshot.progress < 99, true);
  assert.match(describeEonCityLoadProgress(snapshot), /0 KB of 1 KB/);
  const rejected = sequence.startAsset({ id: 'bad', sourcePath: '/city-private/bad.glb' });
  assert.equal(rejected.status, 'error');
});

test('W554C direct asset fetch sends a same-origin static request and reports actual bytes', async () => {
  const calls = [];
  const body = new Uint8Array([1, 2, 3, 4, 5, 6]);
  const progress = [];
  const result = await fetchDirectStaticEonCityAsset('/assets/city/fixture.glb', {
    fetchImpl: async (path, options) => {
      calls.push({ path, options });
      return new Response(body, { headers: { 'content-length': String(body.byteLength), 'content-type': 'model/gltf-binary' } });
    },
    onProgress: (entry) => progress.push(entry)
  });
  assert.equal(result.ok, true);
  assert.equal(result.loadedBytes, body.byteLength);
  assert.equal(result.totalBytes, body.byteLength);
  assert.equal(result.directStatic, true);
  assert.equal(calls[0].path, '/assets/city/fixture.glb');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.cache, 'force-cache');
  assert.equal(progress.at(-1).loadedBytes, body.byteLength);
  const rejected = await fetchDirectStaticEonCityAsset('/city-private/fixture.glb', { fetchImpl: async () => { throw new Error('must not run'); } });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'asset-path-not-approved');
});

test('W554C loading markup communicates direct delivery without false asset or user-data claims', () => {
  const snapshot = createEonCityClientLoadSnapshot({ stage: 'world-building' });
  const markup = renderEonCityClientLoadMarkup(snapshot, { title: 'Loading Command Horizon' });
  assert.match(markup, /Direct client delivery/);
  assert.match(markup, /no Pages Function asset relay/);
  assert.match(markup, /No project, Vault, prompt, provider key, file, or chat content/);
  assert.doesNotMatch(markup, /100% loaded/i);
});

test('W554C extends the City access decision with client-first delivery truth', () => {
  const decision = buildEonCityAccessDecision({ mode: 'authenticated-play', identityAvailable: true, signedIn: true });
  assert.equal(decision.clientFirstStaticAssetDelivery, true);
  assert.equal(decision.pagesFunctionAssetRelayAllowed, false);
  assert.equal(decision.edgeAssetProtectionRequiredBeforeBinaryArt, true);
});

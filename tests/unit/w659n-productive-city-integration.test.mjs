import './w659n-p0-correctness.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonCityW731CommandHubContract } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST, validateEonCityW731LaunchAssetManifest } from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import { getEonCityW659gCaptureCapability, createEonCityW659gCaptureController } from '../../assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js';
import { createEonCityW659gCheckout, fetchEonCityW659gMembershipStatus } from '../../assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('current source contracts certify the complete compact Command Hub', () => {
  const commandHub = validateEonCityW731CommandHubContract();
  const assets = validateEonCityW731LaunchAssetManifest();
  assert.equal(commandHub.ok, true, commandHub.errors.join(','));
  assert.equal(commandHub.stationCount, 10);
  assert.equal(assets.ok, true, assets.errors.join(','));
  const expectedAssets = ['coreLazy', 'coreWorld', 'stationWorld', 'stationProps', 'discoveryWorld', 'roleCharacters', 'ambientAssets']
    .reduce((total, key) => total + EON_CITY_W731_LAUNCH_ASSET_MANIFEST[key].length, 0);
  // W765R4 adds four authored roaming citizens, while W766IR2 retains only
  // the single canonical Expanse Gate and retires the two duplicate discoveries.
  // Keep this a manifest-derived assertion, not the prior 45-asset snapshot.
  assert.equal(assets.assetCount, expectedAssets);
  assert.equal(expectedAssets, 44);
});

test('Creator Capture capability is explicit and reports no EONAPP upload', () => {
  function Canvas() {}
  Canvas.prototype.captureStream = () => ({ getVideoTracks: () => [] });
  const environment = {
    navigator: { mediaDevices: { getDisplayMedia() {}, getUserMedia() {} }, share() {} },
    MediaRecorder: function MediaRecorder() {}, MediaStream: function MediaStream() {}, Blob,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    document: { createElement() { return {}; } }, HTMLCanvasElement: Canvas, isSecureContext: true
  };
  environment.MediaRecorder.isTypeSupported = () => true;
  const capability = getEonCityW659gCaptureCapability(environment);
  assert.equal(capability.ready, true);
  assert.equal(capability.uploadsToEonapp, false);
  assert.equal(capability.startsAutomatically, false);
});

test('Creator Capture controller does not request media before an explicit start', () => {
  let displayRequests = 0;
  const environment = {
    navigator: { mediaDevices: { getDisplayMedia: async () => { displayRequests += 1; throw new Error('fixture-stop'); } } },
    MediaRecorder: function MediaRecorder() {},
    HTMLCanvasElement: class Canvas {},
    document: { createElement: () => ({ width: 0, height: 0, getContext: () => ({}) }) },
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    setInterval, clearInterval, setTimeout, clearTimeout
  };
  environment.HTMLCanvasElement.prototype.captureStream = () => ({});
  environment.MediaRecorder.isTypeSupported = () => true;
  const controller = createEonCityW659gCaptureController({ environment });
  assert.equal(displayRequests, 0);
  assert.equal(controller.getState().active, false);
  controller.dispose();
  assert.equal(displayRequests, 0);
});

test('membership status and checkout fail closed and never grant a local tier', async () => {
  const unavailable = await fetchEonCityW659gMembershipStatus({ fetch: async () => { throw new Error('offline'); } });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.error, 'billing_status_unavailable');
  const unsafe = await createEonCityW659gCheckout('studio', { explicitUserAction: true, environment: { fetch: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, checkoutUrl: 'https://evil.invalid/pay' }) }) } });
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.checkoutUrl, '');
});

test('browser proof script covers every Productive City public surface without claiming physical permissions', () => {
  const source = read('scripts/w659n-productive-city-browser-proof.mjs');
  for (const token of ['all-nine-districts-traversed-with-progressive-residency','effective-asset-authority-observed-across-traversal','creator-capture-panel-opens','server-backed-membership-panel-opens','genuine-agent-theatre-panel-opens','review-first-sharing-center-opens','mobile-city-canvas-dock-and-nine-nexus-without-horizontal-overflow']) assert.match(source, new RegExp(token));
  assert.match(source, /actualRecordingClaimed:\s*false/);
  assert.match(source, /cameraPermissionClaimed:\s*false/);
  assert.match(source, /productionAuthenticationClaimed:\s*false/);
});

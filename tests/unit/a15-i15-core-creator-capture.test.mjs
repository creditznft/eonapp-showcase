import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  createEonCreatorCaptureController,
  getEonCreatorCaptureCapability,
  getEonCreatorCaptureTruth
} from '../../assets/js/contracts/creator/eon-creator-capture.js';
import { saveEonCreatorCaptureToLibrary } from '../../assets/js/work-surface/adapters/eon-creator-capture-panel.js';

const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('A15 I15 Core owns the capture contract and City remains an adapter', () => {
  const core = read('assets/js/contracts/creator/eon-creator-capture.js');
  const city = read('assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js');
  const panel = read('assets/js/work-surface/adapters/eon-creator-capture-panel.js');
  assert.doesNotMatch(core, /assets\/js\/city|\.\.\/city\/|progression-ledger/);
  assert.match(city, /createEonCreatorCaptureController/);
  assert.match(city, /dispatchEonCityW659gVerifiedAction/);
  assert.match(panel, /contracts\/creator\/eon-creator-capture\.js/);
  assert.doesNotMatch(panel, /contracts\/city\/w659g/);
});

test('A15 I15 capture is permission-first, local-only and never automatic', () => {
  function Canvas() {}
  Canvas.prototype.captureStream = () => ({ getVideoTracks: () => [] });
  const environment = {
    navigator: { mediaDevices: { getDisplayMedia() {}, getUserMedia() {} }, share() {} },
    MediaRecorder: function MediaRecorder() {}, MediaStream: function MediaStream() {}, Blob,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    document: { createElement() { return {}; } }, HTMLCanvasElement: Canvas
  };
  environment.MediaRecorder.isTypeSupported = () => true;
  const capability = getEonCreatorCaptureCapability(environment);
  assert.equal(capability.ready, true);
  assert.equal(capability.uploadsToEonapp, false);
  assert.equal(capability.startsAutomatically, false);
  assert.deepEqual(getEonCreatorCaptureTruth(), {
    owner: 'core', localOnly: true, explicitPermissionRequired: true,
    automaticRecording: false, automaticUpload: false, automaticPublishing: false,
    microphoneDefault: 'off', creatorLibrarySupported: true, cityRole: 'adapter-only'
  });
});

test('A15 I15 controller requests no capture permission before explicit start', () => {
  let requests = 0;
  const environment = {
    navigator: { mediaDevices: { getDisplayMedia: async () => { requests += 1; throw new Error('fixture'); } } },
    MediaRecorder: function MediaRecorder() {}, MediaStream: function MediaStream() {}, Blob,
    HTMLCanvasElement: class Canvas {}, document: { createElement: () => ({ getContext: () => ({}) }) },
    URL: { createObjectURL: () => '', revokeObjectURL() {} }
  };
  environment.HTMLCanvasElement.prototype.captureStream = () => ({});
  environment.MediaRecorder.isTypeSupported = () => true;
  const controller = createEonCreatorCaptureController({ environment });
  assert.equal(requests, 0);
  assert.equal(controller.getState().status, 'idle');
  controller.dispose();
  assert.equal(requests, 0);
});

test('A15 I15 local WebM save binds an exact SHA-256 digest to Creator Library metadata', async () => {
  const file = new Blob(['capture-bytes'], { type: 'video/webm' });
  Object.defineProperty(file, 'name', { value: 'eonapp-capture.webm' });
  let captured = null;
  const result = await saveEonCreatorCaptureToLibrary(file, { durationMs: 2500 }, {
    environment: { crypto: globalThis.crypto },
    now: 1234,
    saveAsset: async (input, options) => {
      captured = { input, options };
      return { ok: true, asset: { assetId: 'asset_capture_1' }, media: { ok: true, bytes: input.bytes } };
    }
  });
  assert.equal(result.ok, true);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.equal(captured.input.sha256, result.sha256);
  assert.equal(captured.input.digestMatched, true);
  assert.equal(captured.input.mediaBlob, file);
  assert.equal(captured.input.durationSeconds, 2.5);
  assert.equal(captured.input.providerId, 'browser-capture');
  assert.equal(captured.options.explicitUserAction, true);
  assert.equal(result.localOnly, true);
  assert.equal(result.uploaded, false);
  assert.equal(result.posted, false);
});

test('A15 I15 surface exposes download, Creator Library and reviewed-share choices', () => {
  const panel = read('assets/js/work-surface/adapters/eon-creator-capture-panel.js');
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  assert.match(panel, /Download WebM/);
  assert.match(panel, /Save to Creator Library/);
  assert.match(panel, /saveEonCreatorCaptureToLibrary/);
  assert.match(panel, /Nothing uploads or posts automatically/);
  assert.match(panel, /I reviewed the video, caption and signed invite/);
  assert.match(registry, /Local recording and review/);
  assert.match(registry, /fallbackHref: '\/create'/);
});

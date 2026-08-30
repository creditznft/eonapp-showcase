import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W728 integrates City gameplay capture with signed invite sharing', () => {
  const share = read('assets/js/utils/eon-share-sheet.js');
  const capture = read('assets/js/work-surface/adapters/eon-creator-capture-panel.js');
  assert.match(share, /Record gameplay, then share the moment/);
  assert.match(share, /data-eon-share-capture/);
  assert.match(share, /id: 'creator-capture'/);
  assert.match(share, /creatorCaptureAvailable = options\.creatorCaptureAvailable !== false/);
  assert.match(share, /target\.id !== 'city' \|\| !creatorCaptureAvailable/);
  assert.equal((share.match(/data-eon-share-capture\]'\)\?\.addEventListener/g) || []).length, 1);
  const controlsBody = share.slice(share.indexOf('const updateControls'), share.indexOf('const activate'));
  assert.doesNotMatch(controlsBody, /addEventListener/);
  const engine = read('assets/js/contracts/creator/eon-creator-capture.js');
  assert.match(engine, /getDisplayMedia/);
  assert.match(capture, /createShareCenterDraft\(\{ type: cityContext \? 'city' : 'eonapp'/);
  assert.match(capture, /shareEonLocalMedia/);
  assert.match(capture, /Nothing uploads or posts automatically/);
  assert.match(capture, /Prepare video \+ invite/);
  assert.match(capture, /Review before sharing/);
  assert.match(capture, /data-capture-open-native/);
  assert.ok(capture.indexOf('createShareCenterDraft') < capture.indexOf("shareEonLocalMedia({ file: currentFile"));
  assert.match(engine, /disposed \|\| run !== lifecycle/);
  assert.match(engine, /recorder\.onstop = null/);
});

test('W728 replaces small City overlays with the shared surface while preserving engines', () => {
  const captureBridge = read('assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js');
  const planBridge = read('assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js');
  assert.match(captureBridge, /createEonCityW659gCaptureController/);
  assert.match(captureBridge, /dispatchEonWorkSurfaceOpen\(\{ id: 'creator-capture'/);
  assert.doesNotMatch(captureBridge.slice(captureBridge.indexOf('export function bindEonCityW659gCreatorCapture')), /createElement\('section'\)/);
  assert.match(planBridge, /fetchEonCityW659gMembershipStatus/);
  assert.match(planBridge, /explicit-user-action-required/);
  assert.match(planBridge, /dispatchEonWorkSurfaceOpen\(\{ id: 'plans'/);
});

test('W728 plan promotion is contextual, server-authoritative and non-interruptive', () => {
  const plans = read('assets/js/work-surface/adapters/eon-plans-panel.js');
  const city = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(plans, /server access/);
  assert.match(plans, /signed server billing events/);
  assert.match(plans, /explicitUserAction: true/);
  assert.match(plans, /contextual-not-advertising/);
  assert.match(plans, /validateServerCatalog/);
  assert.match(plans, /environment\.confirm/);
  assert.match(plans, /Review change on billing page/);
  assert.match(plans, /tier !== 'free'/);
  assert.match(city, /Plans &amp; access/);
  const bridge = read('assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js');
  assert.match(bridge, /station=plans/);
  assert.match(bridge, /body\?\.ok !== true/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/js/city/w731/eon-city-w731-command-hub-runtime.js', 'utf8');
const gateway = fs.readFileSync('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', 'utf8');
const overlay = fs.readFileSync('assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', 'utf8');
const heroAssets = fs.readFileSync('assets/js/city/w766/eon-expanse-w766b-hero-assets.js', 'utf8');

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test('W767A keeps exactly one canonical EONBOT identity across Hub and Expanse', () => {
  assert.equal(count(runtime, /new TransformNode\('w737-eonbot-anchor'/g), 1);
  assert.match(runtime, /deriveEonExpanseW767ACompanionState/);
  assert.match(runtime, /getExpanseCompanionState\(\)/);
  assert.match(runtime, /movementMode === 'dormant-rescue'/);
  assert.match(runtime, /expanseCompanionState\.bonded/);
  assert.doesNotMatch(gateway, /LoadAssetContainerAsync[\s\S]{0,240}eonbot/i);
});

test('W767A entry, rescue, Transit and return all synchronize the companion projection', () => {
  assert.match(runtime, /recordSignal\('companion-signal-detected'/);
  assert.match(runtime, /'scan-dormant-eonbot': 'dormant-eonbot-scanned'/);
  assert.match(runtime, /'recover-companion-signal-core': 'companion-signal-core-recovered'/);
  assert.match(runtime, /'restore-companion-link': 'companion-link-restored'/);
  assert.match(runtime, /syncExpanseCompanionState\(\);[\s\S]{0,360}expanseTransitCameraSnapshot/);
  assert.match(runtime, /transitJourneyState\.status === 'active'[\s\S]{0,1200}eonbotAnchor\.position\.set/);
  assert.match(runtime, /completeHubRestore[\s\S]{0,160}syncExpanseCompanionState\(\)/);
});

test('W767A provides a physical rescue sequence and a compact first-arrival explanation', () => {
  assert.match(gateway, /w767a-companion-rescue-relay-root/);
  assert.match(gateway, /w767a-dormant-eonbot-scan-proxy/);
  assert.match(gateway, /w767a-companion-signal-core/);
  assert.match(gateway, /applyCompanionState/);
  assert.match(overlay, /SIGNAL FRONTIER/);
  assert.match(overlay, /Regional network: 8% online/);
  assert.match(overlay, /Companion signal detected/);
  assert.match(overlay, /updateCompanion/);
});

test('W767A hero fallbacks are suppressed only after asset-truth presentation passes', () => {
  assert.match(heroAssets, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(heroAssets, /if \(!truth\.ok\)/);
  const validationIndex = heroAssets.indexOf('if (!truth.ok)');
  const suppressionIndex = heroAssets.indexOf('proxy.visibility = 0.025');
  assert.ok(validationIndex >= 0 && suppressionIndex > validationIndex);
  assert.match(heroAssets, /proxySuppressionRequiresPresentation: true/);
  assert.match(heroAssets, /attempts: entry\.attempts/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W759R3 keeps the maintained 2D Living Nexus linked to truthful W749 view events without synthetic activity', () => {
  const adapter = read('assets/js/work-surface/adapters/eon-nexus-panel.js');
  assert.match(adapter, /EON_CITY_W749_VIEW_EVENT/);
  assert.match(adapter, /const next = event\?\.detail\?\.view/);
  assert.match(adapter, /currentView = next/);
  assert.match(adapter, /environment\.addEventListener\?\.\(EON_CITY_W749_VIEW_EVENT, onView\)/);
  assert.match(adapter, /environment\.removeEventListener\?\.\(EON_CITY_W749_VIEW_EVENT, onView\)/);
  assert.match(adapter, /Raw prompts, files, keys, payment records and identity tokens are never projected here/);
  assert.doesNotMatch(adapter, /setInterval|setTimeout\([^)]*activity/i);
});

test('W759R3 keeps voice and microphone authority outside the bounded Nexus projection', () => {
  const adapter = read('assets/js/work-surface/adapters/eon-nexus-panel.js');
  const voiceConsent = read('assets/js/voice/eon-voice-consent.js');
  assert.doesNotMatch(adapter, /getUserMedia|SpeechRecognition|webkitSpeechRecognition|SpeechSynthesisUtterance|speechSynthesis/);
  assert.match(voiceConsent, /explicitUserAction/);
  assert.match(voiceConsent, /microphone/i);
});

test('W759R3 gives the skyline layered materials, controlled lights and crowns instead of flat slabs', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /w759r3-skyline-near/);
  assert.match(runtime, /w759r3-skyline-mid/);
  assert.match(runtime, /w759r3-skyline-far/);
  assert.match(runtime, /w759r3-skyline-light-strip-/);
  assert.match(runtime, /w759r3-skyline-crown-/);
  assert.match(runtime, /silhouetteStyle: 'w759r3-layered-crown-and-light'/);
  assert.match(runtime, /tier\.id === 'near' \? materials\.skylineNear/);
});

test('W759R3 reduces central Nexus visual spill while preserving all six truthful rings', () => {
  const nexus = read('assets/js/city/w749/eon-city-w749-living-nexus.js');
  assert.match(nexus, /diameter: 3\.65, segments: 32/);
  assert.match(nexus, /diameter: 2\.05 \+ index \* 0\.31/);
  assert.match(nexus, /EON_CITY_W749_RING_IDS\.forEach/);
  assert.match(nexus, /project|task|approval|systems|mission|results/);
  assert.match(nexus, /ownsRenderLoop: false, ownsState: false/);
});

test('W759R3 provides responsive styling for the maintained Nexus actions and bounded inspector', () => {
  const css = read('assets/css/eon-work-surface.css');
  assert.match(css, /\.eon-nexus-dock-actions\{/);
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.eon-nexus-dock-layout\{/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
});

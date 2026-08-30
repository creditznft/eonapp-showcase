import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const convergencePath = new URL('../../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js', import.meta.url);
const cssPath = new URL('../../assets/css/eon-city-play.css', import.meta.url);

const [runtime, convergence, css] = await Promise.all([
  readFile(runtimePath, 'utf8'),
  readFile(convergencePath, 'utf8'),
  readFile(cssPath, 'utf8')
]);

test('runtime integrates W760 skyline, camera and motherboard composition', () => {
  for (const token of ['w760-skyline-window-row', 'w760-skyline-facade-band', 'w760-skyline-crown', 'w760-distant-transit', 'w760-station-socket-halo', 'EON_CITY_W760_CAMERA_POSES']) assert.match(runtime, new RegExp(token));
  assert.match(runtime, /traceWidthMultiplier/);
  assert.match(runtime, /pulseSpeedMultiplier/);
});

test('runtime integrates W761 character materials, locomotion and varied EONBOT reactions', () => {
  for (const token of ['w761-finished-procedural-citizen', 'skinWarm', 'skinDeep', 'skinLight', 'turnResponsiveness', 'celebrate-mission', 'signal-approval', 'result-arrival', 'system-warning']) assert.match(runtime, new RegExp(token));
  assert.match(runtime, /maximumScoutDistance/);
});

test('runtime routes W762 and W764 effects through actual W749 and verified W752 authorities', () => {
  assert.match(runtime, /addEventListener\?\.\(EON_CITY_W749_VIEW_EVENT/);
  assert.match(runtime, /createEonCityW762NexusReactionController/);
  assert.match(runtime, /createEonCityW764RewardReactionController/);
  assert.match(runtime, /noteMissionClaim/);
  assert.match(runtime, /noteVaultReveal/);
  assert.match(runtime, /w762-actual-nexus-state-reaction/);
  assert.match(runtime, /w764-verified-mission-reward-reaction/);
  assert.doesNotMatch(convergence, /setInterval|requestAnimationFrame|getUserMedia|SpeechRecognition|webkitSpeechRecognition/);
  assert.match(convergence, /inventedActivity: false/);
  assert.match(convergence, /ownsXpLedger: false/);
});

test('W763 core actions are direct and visible in desktop/mobile UI', () => {
  for (const label of ['Living Nexus', 'Mission Board', 'Live Monitors', 'Share Command Center', 'Creator Capture', 'Plans &amp; Access', 'Open World — Signal Frontier']) assert.match(runtime, new RegExp(label.replace(/[&]/g, '&')));
  assert.match(runtime, /auditEonCityW763InteractionCompleteness/);
  assert.match(runtime, /w763-interaction-completeness-invalid/);
  assert.match(css, /eon-city-command-menu-quick/);
  assert.match(css, /eon-city-command-feedback/);
});

test('W765 summary exposes certification facts without claiming rendered approval', () => {
  assert.match(runtime, /commandCoreConvergence:/);
  assert.match(runtime, /fakeLiveData: false/);
  assert.match(runtime, /secondRuntime: false/);
  assert.match(convergence, /overallOwnerScore: 9\.5/);
  assert.doesNotMatch(runtime, /automaticallyCertified:\s*true/);
});

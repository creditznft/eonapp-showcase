/** W257 — Beginner City missions source/output safety gate. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const mission = read('assets/js/contracts/city/city-work-mission.js');
const play = read('assets/js/eon-city-play-station.js');
const lite = read('assets/js/eon-operator-map.js');
const visualTour = read('assets/js/eon-city-3d-station.js');
const workspace = read('assets/js/eon-workspace-pages.js');
const localAi = read('assets/js/local-ai/local-ai-page.js');

for (const token of ['CITY_PROJECTS_MISSION', 'CITY_WORKSPACE_MISSION', 'CITY_LOCAL_AI_MISSION', 'CITY_BEGINNER_MISSIONS']) {
  expect(mission.includes(token), `Missing W257 bounded mission definition: ${token}.`);
}
expect(mission.includes("id: 'first-project'") && mission.includes("destination: '/projects'"), 'Project mission must remain fixed to /projects.');
expect(mission.includes("id: 'project-brief'") && mission.includes("destination: '/workspace'"), 'Workspace brief mission must remain fixed to /workspace.');
expect(mission.includes("id: 'local-ai-self-test'") && mission.includes("destination: '/local-ai'"), 'Local AI mission must remain fixed to /local-ai.');
expect(mission.includes("outcomes: ['local-ai-self-test-passed', 'local-ai-self-test-not-passed']"), 'Local AI outcomes must remain finite and truthful.');
expect(mission.includes('opaque-receipt-only-no-user-content'), 'Mission receipts must declare their opaque data scope.');
expect(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(mission), 'Mission receipt contract must not transport or navigate.');
expect(!/FormData|HTMLInput|textarea|input\.value|document\./i.test(mission), 'Mission receipt contract must not collect user content or credentials.');

for (const [label, surface] of [['Babylon Play', play], ['City Lite', lite], ['Visual Tour', visualTour]]) {
  expect(surface.includes('offerCityBeginnerMission'), `${label} must offer a reviewed local mission.`);
  expect(surface.includes('openCityBeginnerMission'), `${label} must open a mission only after confirmation.`);
  expect(surface.includes('dismissCityBeginnerMission'), `${label} must dismiss a cancelled local mission.`);
}
expect(workspace.includes('completeCityBeginnerMission'), 'Projects/Workspace must explicitly complete local mission outcomes.');
expect(workspace.includes("'project-created'") && workspace.includes("'workspace-brief-created'"), 'Projects/Workspace outcome mapping is incomplete.');
expect(workspace.includes('Return to City Play'), 'Projects/Workspace must expose a separate explicit City return.');
expect(localAi.includes('recordCityLocalAiSelfTestOutcome'), 'Local AI must record only an explicit self-test result.');
expect(localAi.includes('Boolean(result.ok)'), 'Local AI result must be based on the user-triggered self-test result.');
expect(localAi.includes('Return to City Play'), 'Local AI must expose a separate explicit City return.');

const report = {
  schema: 'eon.w257.beginner-work-missions.v1',
  ok: failures.length === 0,
  checked: [
    'three-fixed-missions', 'opaque-local-receipts', 'no-remote-or-secret-intake',
    'city-play-lite-tour-parity', 'projects-workspace-outcomes', 'truthful-local-ai-self-test',
    'separate-city-return'
  ],
  failures
};
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W257_BEGINNER_WORK_MISSIONS_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log('W257 beginner work missions gate: PASS');
}

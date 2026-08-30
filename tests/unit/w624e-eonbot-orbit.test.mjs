import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_EONBOT_ORBIT_STATES,
  createEonCityEonbotOrbitController,
  createEonCityEonbotOrbitHint,
  getEonCityEonbotOrbitPresentation,
  validateEonCityEonbotOrbitExperience
} from '../../assets/js/city/eon-city-eonbot-orbit-experience.js';
import { validateW624eEonbotOrbitContract } from '../../config/w624e-eonbot-orbit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W624E defines nine deterministic local presentation states', () => {
  assert.deepEqual(EON_CITY_EONBOT_ORBIT_STATES, ['follow', 'lead', 'point', 'think', 'speak', 'scan', 'celebrate', 'warn', 'help']);
  assert.equal(validateEonCityEonbotOrbitExperience().ok, true);
  assert.equal(getEonCityEonbotOrbitPresentation('point').directorMode, 'guide');
  assert.equal(getEonCityEonbotOrbitPresentation('warn').directorMode, 'perch');
  assert.equal(getEonCityEonbotOrbitPresentation('unknown').state, 'follow');
});

test('W624E captions map only to real Command District routes and honest boundaries', () => {
  const expected = new Map([
    ['agent-theatre', '/automations'], ['creator-portal', '/create'], ['forge-basilica', '/forge'],
    ['project-dock', '/projects'], ['archive-canopy', '/library'], ['signal-sail', '/workspace']
  ]);
  for (const [landmarkId, route] of expected) {
    const hint = createEonCityEonbotOrbitHint({ nearbyLandmarkId: landmarkId });
    assert.equal(hint.landmarkId, landmarkId);
    assert.equal(hint.route, route);
    assert.equal(/automatically|confirmation|dormant/.test(hint.text), true);
  }
  const agent = createEonCityEonbotOrbitHint({ nearbyLandmarkId: 'agent-theatre' });
  assert.equal(agent.state, 'warn');
  assert.equal(agent.proofBoundary, true);
  assert.match(agent.text, /dormant, receipt-backed status only/);
});

test('W624E first-sixty-second guidance is useful and non-repeating', () => {
  let clock = 1_000;
  const controller = createEonCityEonbotOrbitController({ now: () => clock });
  const ids = [];
  for (const routeStepId of ['arrival', 'orient', 'agent', 'command', 'choose']) {
    clock += 1_000;
    ids.push(controller.updateContext({ routeStepId }).currentHint.id);
  }
  assert.deepEqual(ids, ['route:arrival', 'route:orient', 'route:agent', 'route:command', 'route:choose']);
  const before = controller.getSnapshot();
  controller.updateContext({ routeStepId: 'choose' });
  assert.deepEqual(controller.getSnapshot().usedHintIds, before.usedHintIds);
});

test('W624E exposes only bounded saved-project metadata and never private content', () => {
  const hint = createEonCityEonbotOrbitHint({ savedProjectCount: 4 });
  assert.equal(hint.route, '/projects');
  assert.match(hint.text, /4 private project portals/);
  assert.match(hint.text, /only this count/);
  assert.doesNotMatch(hint.text, /project name|file body|prompt value|credential/i);
});

test('W624E mute, dismiss, show-less, reduced-motion and disposal remain session-local', () => {
  const controller = createEonCityEonbotOrbitController();
  assert.equal(controller.setMuted(false).muted, false);
  assert.equal(controller.setShowLessGuidance(true).showLessGuidance, true);
  assert.equal(controller.updateContext({ routeStepId: 'arrival' }).currentHint, null);
  assert.equal(controller.request('help').currentHint.id, 'control:help');
  assert.equal(controller.setReducedMotion(true).reducedMotion, true);
  assert.equal(controller.setDismissed(true).dismissed, true);
  assert.equal(controller.getSnapshot().currentHint, null);
  assert.equal(controller.dispose().dismissed, true);
  assert.equal(controller.getSnapshot().usedHintIds.length, 0);
});

test('W624E source gate preserves W624B-W624D architecture and visible controls', () => {
  const gate = validateW624eEonbotOrbitContract();
  assert.equal(gate.ok, true);
  assert.equal(gate.total, 22);
  assert.equal(gate.passed, 22);
  const station = read('assets/js/eon-city-play-station.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /data-eon-play-orbit-mute/);
  assert.match(station, /data-eon-play-orbit-dismiss/);
  assert.match(station, /data-eon-play-orbit-less/);
  assert.match(renderer, /setEonbotOrbitPresentation/);
  assert.doesNotMatch(read('assets/js/city/eon-city-eonbot-orbit-experience.js'), /location\.assign|localStorage|sessionStorage|fetch\(/);
});

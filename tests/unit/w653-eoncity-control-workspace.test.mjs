import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonCityCommandRoomModel, getEonCityCommandRoomScreenReview, renderEonCityCommandRoomMarkup, validateEonCityCommandRoomModel } from '../../assets/js/city/eon-city-command-room.js';
import { inspectW653ControlWorkspace } from '../../scripts/w653-eoncity-control-workspace-audit.mjs';
import { buildEonCityAgentTheaterStage, renderEonCityAgentTheaterStage } from '../../assets/js/city/eon-city-agent-theater.js';

test('W653 Command Room is a seven-plus-four all-in-one EONAPP control workspace', () => {
  const model = getEonCityCommandRoomModel();
  const validation = validateEonCityCommandRoomModel(model);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.primaryCount, 7);
  assert.equal(validation.systemsCount, 4);
  assert.deepEqual(model.screens.filter((screen) => screen.tier === 'primary').map((screen) => screen.id), ['eonbot','projects','create','forge','library','research','automations']);
});

test('W653 native destinations require review while EONBOT remains inside City', () => {
  const project = getEonCityCommandRoomScreenReview('projects');
  assert.equal(project.ok, true);
  assert.equal(project.local, false);
  assert.equal(project.review.confirmationRequired, true);
  assert.equal(project.review.route, '/projects');
  const eonbot = getEonCityCommandRoomScreenReview('eonbot');
  assert.equal(eonbot.local, true);
  assert.equal(eonbot.review.action, 'eonbot-panel');
  assert.equal(eonbot.review.confirmationRequired, true);
});

test('W653 markup separates work, systems and optional 3D exploration', () => {
  const html = renderEonCityCommandRoomMarkup(getEonCityCommandRoomModel({ agentTheaterStage: renderEonCityAgentTheaterStage(buildEonCityAgentTheaterStage()) }));
  assert.match(html, /Start or continue work/);
  assert.match(html, /Systems and private spaces/);
  assert.match(html, /Enter 3D Explore/);
  assert.match(html, /Show interactives/);
  assert.match(html, /second visible click/i);
  assert.doesNotMatch(html, /<a[^>]+data-eon-command-room-screen/);
  assert.doesNotMatch(html, /<a[^>]+data-eon-command-room-agent-lane-route/);
  assert.match(html, /data-eon-command-room-agent-lane-review/);
  assert.match(html, /aria-pressed="false"/);
});

test('W653 Command Room keyboard shortcuts are lifecycle-owned across City restarts', async () => {
  const fs = await import('node:fs');
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(station, /const onKeydown = \(event\) =>/);
  assert.match(station, /root\.addEventListener\('keydown', onKeydown\)/);
  assert.match(station, /root\.removeEventListener\('keydown', onKeydown\)/);
  assert.match(station, /lifecycle\.own\('w653-command-room', unbindCommandRoom\)/);
});

test('W653 objective control-workspace audit clears the previsual 9.5 target', () => {
  const report = inspectW653ControlWorkspace();
  assert.equal(report.ok, true, report.failures.join('\n'));
  assert.ok(report.executivePrevisualScore >= 95);
  assert.equal(report.screenCounts.total, 11);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767RRestorationStatus } from '../../assets/js/city/w766/eon-expanse-w767r-restoration-status.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767R starts at truthful 8 percent and ignores XP without verified campaign progress', () => {
  const status = deriveEonExpanseW767RRestorationStatus({ totalXp: 99999 });
  assert.equal(status.onlinePercent, 8);
  assert.equal(status.currentStageId, 'arrival');
  assert.equal(status.nextStageId, 'companion');
  assert.equal(status.ignoresXpOnly, true);
});

test('W767R advances only through ordered mission or milestone authority', () => {
  const companion = deriveEonExpanseW767RRestorationStatus({ completedMissions: ['companion-in-the-static'] });
  assert.equal(companion.onlinePercent, 18);
  const gap = deriveEonExpanseW767RRestorationStatus({ completedMissions: ['companion-in-the-static', 'first-light'] });
  assert.equal(gap.onlinePercent, 18);
  const transit = deriveEonExpanseW767RRestorationStatus({ completedMissions: ['companion-in-the-static', 'beyond-the-gate', 'first-light', 'echoes-in-the-archive'], worldMilestones: ['regional-transit-restored'] });
  assert.equal(transit.onlinePercent, 74);
});

test('W767R reaches 100 only with the final verified mission, milestone or campaign receipt', () => {
  const base = { completedMissions: ['companion-in-the-static', 'beyond-the-gate', 'first-light', 'echoes-in-the-archive', 'the-broken-line', 'horizon-reconnected'] };
  assert.equal(deriveEonExpanseW767RRestorationStatus(base).onlinePercent, 90);
  const complete = deriveEonExpanseW767RRestorationStatus({ ...base, campaignReceipt: { id: 'campaign:signal-restoration:complete' } });
  assert.equal(complete.onlinePercent, 100);
  assert.equal(complete.complete, true);
  assert.equal(complete.awardsXp, false);
  assert.equal(complete.mutatesProgression, false);
});

test('W767R runtime and overlay surface restoration without adding another Babylon authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /deriveEonExpanseW767RRestorationStatus/);
  assert.match(runtime, /updateRestorationStatus/);
  assert.match(overlay, /Regional restoration/);
  assert.match(overlay, /hud-network/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

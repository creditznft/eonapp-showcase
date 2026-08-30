import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW767FOnboardingDirector } from '../../assets/js/city/w766/eon-expanse-w767f-onboarding-director.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767F explains location, first goal, companion, map and safe return inside one bounded presentation', () => {
  let clock = 1000;
  const director = createEonExpanseW767FOnboardingDirector({ now: () => clock, durationMs: 60000, clarityTargetMs: 30000 });
  const started = director.begin({
    companion: { signalDetected: true, bonded: false, nextAction: 'scan-dormant-eonbot' },
    guidance: { active: true, objective: 'scan-dormant-eonbot', prompt: 'Scan EONBOT' }
  });
  assert.equal(started.active, true);
  assert.equal(started.stepId, 'find-eonbot');
  assert.match(started.detail, /Gateway Overlook/);
  assert.match(started.shortcut, /E interact/);
  assert.match(started.shortcut, /M map/);
  assert.match(started.shortcut, /Return Hub/);
  assert.equal(started.acceptanceReady, true);
  assert.equal(started.certifiedWithinTarget, true);
  assert.deepEqual(started.checklist, {
    locationExplained: true,
    firstGoalVisible: true,
    companionTargetExplained: true,
    mapControlPresented: true,
    returnControlPresented: true
  });
  assert.deepEqual(director.certify(), {
    schema: 'eon.city.expanse.onboarding-director.w767f.v2',
    ok: true,
    elapsedMs: 0,
    targetMs: 30000,
    checklist: started.checklist,
    mapOpened: false,
    privateContentStored: false
  });
});

test('W767F advances from EONBOT rescue to explicit map discovery without storing private content', () => {
  let clock = 2000;
  const director = createEonExpanseW767FOnboardingDirector({ now: () => clock });
  director.begin({ companion: { signalDetected: true, nextAction: 'scan-dormant-eonbot' }, guidance: { active: true, objective: 'scan-dormant-eonbot' } });
  clock += 5000;
  const mapStep = director.update({ companion: { bonded: true, signalDetected: true }, guidance: { active: true, objective: 'meet-pathfinder' }, expanseActive: true, at: clock });
  assert.equal(mapStep.stepId, 'open-map');
  assert.match(mapStep.shortcut, /Open map/);
  assert.equal(director.recordMapOpened().ok, false);
  assert.equal(director.recordMapOpened({ explicitUserAction: true }).ok, true);
  const ready = director.update({ companion: { bonded: true, signalDetected: true }, guidance: { active: true, objective: 'meet-pathfinder' }, expanseActive: true, at: clock + 1 });
  assert.equal(ready.stepId, 'frontier-ready');
  assert.equal(ready.mapOpened, true);
  assert.equal(ready.privateContentStored, false);
});

test('W767F fails the 30-second clarity target when required presentation evidence arrives too late', () => {
  let clock = 0;
  const director = createEonExpanseW767FOnboardingDirector({ now: () => clock, durationMs: 60000, clarityTargetMs: 30000 });
  const incomplete = director.begin({ companion: {}, guidance: { active: false } });
  assert.equal(incomplete.acceptanceReady, false);
  clock = 31000;
  const late = director.update({ companion: { signalDetected: true }, guidance: { active: true, objective: 'scan-dormant-eonbot' }, expanseActive: true, at: clock });
  assert.equal(late.acceptanceReady, true);
  assert.equal(late.certifiedWithinTarget, false);
  assert.equal(director.certify().ok, false);
  assert.equal(director.certify().elapsedMs, 31000);
});

test('W767F expires cleanly and explicit dismissal is review gated', () => {
  let clock = 0;
  const director = createEonExpanseW767FOnboardingDirector({ now: () => clock, durationMs: 15000 });
  director.begin({ companion: { signalDetected: true }, guidance: { active: true, objective: 'scan-dormant-eonbot' } });
  assert.equal(director.dismiss().ok, false);
  const dismissed = director.dismiss({ explicitUserAction: true });
  assert.equal(dismissed.ok, true);
  assert.equal(dismissed.state.status, 'dismissed');

  director.begin({ companion: { signalDetected: true }, guidance: { active: true, objective: 'scan-dormant-eonbot' } });
  clock = 15001;
  const expired = director.update({ companion: { signalDetected: true }, guidance: { active: true, objective: 'scan-dormant-eonbot' }, expanseActive: true, at: clock });
  assert.equal(expired.active, false);
  assert.equal(expired.status, 'time-window-complete');
});

test('W767F runtime maps M to the maintained mission board and keeps onboarding inside the canonical overlay', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /createEonExpanseW767FOnboardingDirector/);
  assert.match(runtime, /openExpanseMissionMapAction/);
  assert.match(runtime, /event\.key === 'm' \|\| event\.key === 'M'/);
  assert.match(runtime, /closing \? expanseUiOverlay\.closeBoard\(\) : openExpanseMissionMapAction/);
  assert.match(runtime, /expanseOnboarding\.recordMapOpened\(\{ explicitUserAction: true \}\)/);
  assert.match(runtime, /certifyExpanseFirstMinuteClarity/);
  assert.match(runtime, /expanseOnboarding\.end\('returned-to-command-hub'\)/);
  assert.match(runtime, /onOpenMissionMap:/);
  assert.match(runtime, /onDismissOnboarding:/);
  assert.match(overlay, /data-eon-expanse-ui':'onboarding'/);
  assert.match(overlay, /text':'Open map'/);
  assert.match(overlay, /text':'Got it'/);
  assert.match(overlay, /updateOnboarding\(value=null\)/);
  assert.match(overlay, /board\.dataset\.open !== 'true'/);
  assert.match(overlay, /onOpenMissionMap\?\.\(\{ explicitUserAction: true \}\)/);
  assert.match(overlay, /onDismissOnboarding\?\.\(\{ explicitUserAction: true \}\)/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW773CMyFrontierCaptureDirector } from '../../assets/js/city/w773/eon-expanse-w773c-my-frontier-capture-director.js';

test('W773C requires an explicit verified action before exposing a capture moment', () => {
  let at = 1000;
  const director = createEonExpanseW773CMyFrontierCaptureDirector({ now: () => at });
  assert.equal(director.record({ type: 'construction', plotId: 'plot-creator', buildingId: 'creator-workshop' }).ok, false);
  assert.equal(director.derive({ expanseActive: true, at }).available, false);
  assert.equal(director.record({ type: 'construction', plotId: 'plot-creator', buildingId: 'creator-workshop', label: 'Creator Workshop' }, { explicitUserAction: true }).ok, true);
  assert.equal(director.derive({ expanseActive: true, at }).available, true);
});

test('W773C supports construction, operational upgrade, resident and productive moments', () => {
  let at = 2000;
  const director = createEonExpanseW773CMyFrontierCaptureDirector({ now: () => at });
  for (const input of [
    { type: 'construction', plotId: 'plot-creator', buildingId: 'creator-workshop' },
    { type: 'upgrade', plotId: 'plot-creator', buildingId: 'creator-workshop' },
    { type: 'resident', slotId: 'resident-pathfinder', residentId: 'pathfinder' },
    { type: 'productive', missionId: 'create-expedition', workspaceId: 'create' }
  ]) {
    assert.equal(director.record(input, { explicitUserAction: true }).ok, true);
    assert.equal(['my-frontier-construction', 'my-frontier-upgrade', 'my-frontier-resident', 'productive-result'].includes(director.derive({ expanseActive: true, at }).source), true);
    at += 100;
  }
});

test('W773C expires safely and falls back to the maintained restoration/event moment', () => {
  let at = 3000;
  const director = createEonExpanseW773CMyFrontierCaptureDirector({ now: () => at, ttlMs: 30000 });
  director.record({ type: 'resident', slotId: 'resident-navigator', residentId: 'navigator' }, { explicitUserAction: true });
  const fallback = Object.freeze({ available: true, source: 'restoration', momentId: 'restoration:first-light' });
  at += 30001;
  assert.equal(director.derive({ expanseActive: true, fallback, at }), fallback);
});

test('W773C stores no private content and never records or publishes automatically', () => {
  const director = createEonExpanseW773CMyFrontierCaptureDirector({ now: () => 4000 });
  director.record({ type: 'upgrade', plotId: 'plot-systems', buildingId: 'automation-relay', label: '<b>Automation Relay</b>' }, { explicitUserAction: true });
  const view = director.derive({ expanseActive: true, at: 4000 });
  assert.equal(view.context.includesPrivateContent, false);
  assert.equal(view.recordsAutomatically, false);
  assert.equal(view.publishesAutomatically, false);
  assert.doesNotMatch(view.label, /[<>]/);
});

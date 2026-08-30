import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW772EObjectiveCompletionDirector } from '../../assets/js/city/w772/eon-expanse-w772e-objective-completion-director.js';

const board = ({ missionId = 'first-light', objectiveId = 'scan-beacon-one', completed = 1, complete = false } = {}) => ({
  activeMission: missionId ? { id: missionId, label: missionId.replaceAll('-', ' '), currentObjective: objectiveId } : null,
  completion: { completed, campaignComplete: complete }
});

test('W772E seeds without presenting a false completion', () => {
  const director = createEonExpanseW772EObjectiveCompletionDirector();
  assert.equal(director.update(board(), { expanseActive: true }).ok, false);
});

test('W772E presents one non-blocking objective completion with the next maintained objective', () => {
  const director = createEonExpanseW772EObjectiveCompletionDirector();
  director.update(board(), { expanseActive: true });
  const result = director.update(board({ objectiveId: 'recover-signal-components' }), { expanseActive: true });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'objective-complete');
  assert.match(result.card.detail, /^Next:/);
  assert.equal(director.update(board({ objectiveId: 'recover-signal-components' }), { expanseActive: true }).ok, false);
});

test('W772E presents mission completion only after canonical completed count advances', () => {
  const director = createEonExpanseW772EObjectiveCompletionDirector();
  director.update(board({ completed: 1 }), { expanseActive: true });
  const result = director.update(board({ missionId: '', objectiveId: '', completed: 2 }), { expanseActive: true });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'mission-complete');
  assert.match(result.card.network, /Verified/);
});

test('W772E remains silent outside Expanse and never mutates progression', () => {
  const source = createEonExpanseW772EObjectiveCompletionDirector();
  source.update(board(), { expanseActive: false });
  assert.equal(source.update(board({ objectiveId: 'recover-signal-components' }), { expanseActive: false }).ok, false);
  const state = source.getState();
  assert.equal('xp' in state, false);
  assert.equal('receipt' in state, false);
});

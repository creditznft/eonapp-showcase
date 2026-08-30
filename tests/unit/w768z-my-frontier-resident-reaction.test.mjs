import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768ZResidentReaction } from '../../assets/js/city/w768/eon-expanse-w768z-my-frontier-resident-reaction.js';

const presented = Object.freeze({ status: 'presented-authored-resident', slotId: 'resident-navigator', residentId: 'navigator', requestKey: 'receipt:asset', interactionKind: 'talk', interactionName: 'Talk_with_Hands_Open', idleName: 'Idle_12' });
const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768y-my-frontier-resident-presenter.js', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W768Z requires explicit user action and a visibly presented matching resident', () => {
  assert.equal(deriveEonExpanseW768ZResidentReaction({ slotId: presented.slotId, residentId: presented.residentId, presentedResident: presented }).reason, 'explicit-user-action-required');
  assert.equal(deriveEonExpanseW768ZResidentReaction({ slotId: presented.slotId, residentId: presented.residentId, explicitUserAction: true }).reason, 'authored-resident-not-presented');
  assert.equal(deriveEonExpanseW768ZResidentReaction({ slotId: 'resident-pathfinder', residentId: presented.residentId, explicitUserAction: true, presentedResident: presented }).reason, 'resident-slot-changed');
});

test('W768Z produces one bounded authored interaction action with no progression authority', () => {
  const result = deriveEonExpanseW768ZResidentReaction({ slotId: presented.slotId, residentId: presented.residentId, explicitUserAction: true, presentedResident: presented });
  assert.equal(result.ok, true);
  assert.equal(result.action.interactionName, 'Talk_with_Hands_Open');
  assert.equal(result.grantsXp, false);
  assert.equal(result.mutatesMissionState, false);
  assert.equal(result.automaticDialogue, false);
});

test('W768Z presenter plays one maintained clip and returns to idle without timers', () => {
  assert.match(source, /deriveEonExpanseW768ZResidentReaction/);
  assert.match(source, /interaction\.start\?\.\(false/);
  assert.match(source, /onAnimationGroupEndObservable\?\.addOnce/);
  assert.match(source, /idle\?\.start\?\.\(true/);
  assert.match(source, /restoreRootSnapshots/);
  assert.doesNotMatch(source, /setTimeout|setInterval/);
});

test('W768Z is exposed by the canonical renderer and invoked only after station validation', () => {
  assert.match(renderer, /reactResident\(\{ slotId/);
  assert.match(renderer, /residentAssetPresenter\?\.react/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.reactResident/);
  assert.match(runtime, /if \(action === 'inspect-my-frontier-resident-station'\)/);
});

test('W768Z creates no runtime, dialogue automation, XP or private-data path', () => {
  const authority = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768z-my-frontier-resident-reaction.js', import.meta.url), 'utf8');
  assert.doesNotMatch(authority + source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|localStorage|awardXp|completeMission/);
});

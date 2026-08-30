import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW772CCurrentObjectiveAuthority, getEonExpanseW772CObjectiveAuthority, validateEonExpanseW772CCampaignAuthorityContract } from '../../assets/js/city/w772/eon-expanse-w772c-campaign-objective-authority.js';

test('W772C covers all 34 ordered campaign objectives with one completion authority', () => {
  const result = validateEonExpanseW772CCampaignAuthorityContract();
  assert.equal(result.ok, true);
  assert.equal(result.objectiveCount, 34);
  assert.equal(result.authorityCount, 34);
  assert.deepEqual(result.missing, []);
});

test('W772C forbids workspace-only and fabricated completion for adventure objectives', () => {
  const result = validateEonExpanseW772CCampaignAuthorityContract();
  assert.equal(result.workspaceCompletionAllowed, false);
  assert.equal(result.fabricatedCompletionAllowed, false);
  assert.equal(getEonExpanseW772CObjectiveAuthority('repair-beacon-one').physical, true);
  assert.equal(getEonExpanseW772CObjectiveAuthority('confirm-campaign-receipt').authority, 'mission-board-confirmation');
});

test('W772C derives a plain-language action and exact authority for the active objective', () => {
  const view = deriveEonExpanseW772CCurrentObjectiveAuthority({ activeMission: { id: 'first-light', currentObjective: 'scan-beacon-one' } });
  assert.equal(view.active, true);
  assert.equal(view.missionId, 'first-light');
  assert.equal(view.authority, 'physical-landmark-interaction');
  assert.match(view.detail, /Inspect Beacon One/);
});

test('W772C fails closed when no maintained objective authority exists', () => {
  assert.equal(deriveEonExpanseW772CCurrentObjectiveAuthority({}).active, false);
  assert.equal(deriveEonExpanseW772CCurrentObjectiveAuthority({ active: { objective: 'unknown' } }).reason, 'objective-authority-missing');
});

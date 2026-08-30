import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW772GPersistentNextAction } from '../../assets/js/city/w772/eon-expanse-w772g-persistent-next-action.js';

const activeBoard = {
  activeMission: { id: 'first-light', currentObjective: 'scan-beacon-one', guidance: { label: 'Inspect Beacon One to scan its damage.' } },
  availableMissions: [],
  completion: { campaignComplete: false }
};

test('W772G keeps the canonical active objective persistent without creating progression', () => {
  const result = deriveEonExpanseW772GPersistentNextAction({
    campaignBoard: activeBoard,
    objectiveAuthority: { physical: true, interactionLabel: 'Inspect Beacon One.' }
  });
  assert.equal(result.kind, 'active-objective');
  assert.equal(result.objectiveId, 'scan-beacon-one');
  assert.match(result.detail, /press E \/ tap Use/i);
  assert.equal(result.primaryAction, null);
  assert.equal(result.grantsXp, false);
  assert.equal(result.mutatesProgression, false);
});

test('W772G leaves one persistent next-mission action after a mission completes', () => {
  const result = deriveEonExpanseW772GPersistentNextAction({
    campaignBoard: {
      activeMission: null,
      availableMissions: [{ id: 'echoes-in-the-archive', label: 'Echoes in the Archive', xp: 280 }],
      completion: { campaignComplete: false }
    }
  });
  assert.equal(result.kind, 'next-mission');
  assert.equal(result.missionId, 'echoes-in-the-archive');
  assert.equal(result.primaryAction.kind, 'open-mission-board');
  assert.match(result.label, /Next mission:/);
});

test('W772G keeps a post-campaign choice visible instead of ending on a transient card', () => {
  const result = deriveEonExpanseW772GPersistentNextAction({
    campaignBoard: { activeMission: null, availableMissions: [], completion: { campaignComplete: true } },
    postCampaign: { nextLabel: 'Enter My Frontier to activate starter planning.' }
  });
  assert.equal(result.kind, 'post-campaign');
  assert.match(result.detail, /My Frontier/);
  assert.equal(result.primaryAction.kind, 'open-mission-board');
});

test('W772G fails visibly when canonical mission state has no active or available action', () => {
  const result = deriveEonExpanseW772GPersistentNextAction({
    campaignBoard: { activeMission: null, availableMissions: [], completion: { campaignComplete: false } }
  });
  assert.equal(result.kind, 'guidance-unavailable');
  assert.match(result.label, /Guidance unavailable/);
  assert.equal(result.primaryAction.kind, 'open-mission-board');
  assert.equal(result.automaticMovement, false);
});

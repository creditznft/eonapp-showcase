import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W766E_CAMPAIGN,
  EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD,
  buildEonExpanseW766EMissionBoard,
  createEonExpanseW766EMissionRuntime
} from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';

function complete(runtime, missionId) {
  const definition = EON_EXPANSE_W766E_CAMPAIGN.find((entry) => entry.id === missionId);
  const start = runtime.start(missionId, { explicitUserAction: true });
  assert.equal(start.ok, true);
  for (const objective of definition.objectives) {
    const result = runtime.completeObjective(missionId, objective, { receiptId: `test:${missionId}:${objective}` });
    assert.equal(result.ok, true, `${missionId}/${objective}`);
  }
}

function completeThroughHorizon(runtime) {
  for (const mission of EON_EXPANSE_W766E_CAMPAIGN.slice(0, 6)) complete(runtime, mission.id);
}

test('full seven-mission campaign awards XP once and exposes completion', () => {
  const runtime = createEonExpanseW766EMissionRuntime({ now: () => 1234 });
  completeThroughHorizon(runtime);
  assert.equal(runtime.start('the-first-reveal', { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('the-first-reveal', 'enter-vault-chamber', { receiptId: 'final:enter' }).ok, true);
  assert.equal(runtime.claimSignalVanguard({ explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('the-first-reveal', 'claim-signal-vanguard', { receiptId: 'final:claim' }).ok, true);
  assert.equal(runtime.selectCosmetic(EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId, { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('the-first-reveal', 'activate-cosmetic', { receiptId: 'final:activate' }).ok, true);
  assert.equal(runtime.completeObjective('the-first-reveal', 'return-command-hub', { receiptId: 'final:return' }).ok, true);
  const confirmed = runtime.confirmCampaignReceipt({ explicitUserAction: true });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.receipt.totalXp, 2040);
  const state = runtime.getState();
  assert.equal(state.completedMissions.length, 7);
  assert.equal(state.totalXp, 2040);
  assert.equal(state.currentLevel, 8);
  const board = buildEonExpanseW766EMissionBoard(state);
  assert.equal(board.completion.campaignComplete, true);
});

test('Signal Vanguard reward requires real Vault chamber entry and is idempotent', () => {
  const runtime = createEonExpanseW766EMissionRuntime();
  assert.equal(runtime.claimSignalVanguard({ explicitUserAction: true }).reason, 'horizon-mission-required');
  completeThroughHorizon(runtime);
  assert.equal(runtime.claimSignalVanguard({ explicitUserAction: true }).reason, 'vault-chamber-entry-required');
  assert.equal(runtime.start('the-first-reveal', { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('the-first-reveal', 'enter-vault-chamber', { receiptId: 'enter' }).ok, true);
  const claimed = runtime.claimSignalVanguard({ explicitUserAction: true });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.reward.cosmeticId, EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId);
  assert.equal(runtime.claimSignalVanguard({ explicitUserAction: true }).reason, 'reward-already-claimed');
});

test('missions and objectives reject locked or out-of-order completion', () => {
  const runtime = createEonExpanseW766EMissionRuntime();
  assert.equal(runtime.start('horizon-reconnected', { explicitUserAction: true }).reason, 'mission-locked');
  assert.equal(runtime.completeObjective('horizon-reconnected', 'reach-horizon-vault', { receiptId: 'locked' }).reason, 'mission-locked');
  assert.equal(runtime.start('beyond-the-gate', { explicitUserAction: true }).reason, 'mission-locked');
  assert.equal(runtime.start('companion-in-the-static', { explicitUserAction: true }).ok, true);
  const outOfOrder = runtime.completeObjective('companion-in-the-static', 'scan-dormant-eonbot', { receiptId: 'bad-order' });
  assert.equal(outOfOrder.reason, 'objective-out-of-order');
  const first = runtime.completeObjective('companion-in-the-static', 'review-expedition', { receiptId: 'review' });
  assert.equal(first.ok, true);
  const duplicate = runtime.completeObjective('companion-in-the-static', 'enter-expanse', { receiptId: 'review' });
  assert.equal(duplicate.reason, 'duplicate-receipt');
});

test('campaign receipt atomically completes final objective and cannot be confirmed twice', () => {
  const runtime = createEonExpanseW766EMissionRuntime({ now: () => 9876 });
  completeThroughHorizon(runtime);
  runtime.start('the-first-reveal', { explicitUserAction: true });
  runtime.completeObjective('the-first-reveal', 'enter-vault-chamber', { receiptId: 'final:enter' });
  runtime.claimSignalVanguard({ explicitUserAction: true });
  runtime.completeObjective('the-first-reveal', 'claim-signal-vanguard', { receiptId: 'final:claim' });
  runtime.selectCosmetic(EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId, { explicitUserAction: true });
  runtime.completeObjective('the-first-reveal', 'activate-cosmetic', { receiptId: 'final:activate' });
  runtime.completeObjective('the-first-reveal', 'return-command-hub', { receiptId: 'final:return' });
  const confirmed = runtime.confirmCampaignReceipt({ explicitUserAction: true });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.receipt.completedAt, 9876);
  assert.equal(confirmed.receipt.totalXp, 2040);
  assert.equal(runtime.getState().completedMissions.includes('the-first-reveal'), true);
  assert.equal(runtime.confirmCampaignReceipt({ explicitUserAction: true }).reason, 'campaign-receipt-already-confirmed');
});

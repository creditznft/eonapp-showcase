import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildEonCityAgentTheater, buildEonCityAgentTheaterStage, validateEonCityAgentTheaterStage, renderEonCityAgentTheaterStage } from '../../assets/js/city/eon-city-agent-theater.js';
import { getEonCityCommandRoomModel, renderEonCityCommandRoomMarkup } from '../../assets/js/city/eon-city-command-room.js';
import { buildEonKeyGrantPreview, chooseEonKeyUnlock, summarizeEonKeyUnlockCoverage, validateEonKeysFeatureUnlockLedger } from '../../assets/js/referrals/eon-keys-feature-unlock-ledger.js';
import { buildW620DodoOwnerChecklist, mapDodoWebhookTypeToW620LedgerEvent, validateW620DodoDashboardSetupContract } from '../../config/w620-dodo-dashboard-setup-contract.mjs';
import { inspectW620ReferralAgentDodoCompletionGate } from '../../scripts/w620-referral-agent-dodo-completion-gate.mjs';

test('W620 Agent Theater has complete visible stage lanes without fake activity', () => {
  const stage = buildEonCityAgentTheaterStage(buildEonCityAgentTheater());
  assert.equal(stage.schema, 'eon.city.agent-theater-stage.w620.v1');
  assert.equal(stage.laneCount, 6);
  assert.equal(stage.noFakeActivity, true);
  assert.equal(stage.noPromptOrOutputLeak, true);
  assert.equal(stage.opensCheckout, false);
  assert.equal(stage.grantsReward, false);
  assert.equal(validateEonCityAgentTheaterStage(stage).ok, true);
});

test('W620 Command Room renders Agent Theater stage inside City cockpit', () => {
  const stage = renderEonCityAgentTheaterStage(buildEonCityAgentTheaterStage());
  const model = getEonCityCommandRoomModel({ agentTheaterStage: stage });
  const html = renderEonCityCommandRoomMarkup(model);
  assert.match(html, /data-eon-command-room-agent-stage/);
  assert.match(html, /Forge Builder/);
  assert.match(html, /Local AI Guide/);
  assert.match(html, /Share Steward/);
});

test('W620 EON Keys are direct feature unlocks, not subscription rewards', () => {
  const coverage = summarizeEonKeyUnlockCoverage();
  assert.equal(coverage.directFeatureAndLimitUnlocks, true);
  assert.equal(coverage.subscriptionGrant, false);
  assert.equal(coverage.coversPlusStudioPowerAndSelectedMax, true);
  assert.ok(coverage.unlockCount >= 20);
  assert.equal(validateEonKeysFeatureUnlockLedger().ok, true);
});

test('W620 referral preview blocks clicks and paid referrals before retention', () => {
  const click = buildEonKeyGrantPreview({ eventType: 'invite-click', serverLedgerProof: true });
  assert.equal(click.ok, false);
  assert.match(click.errors.join(' '), /clicks never grant/i);
  const paid = buildEonKeyGrantPreview({ eventType: 'first-payment', serverLedgerProof: true, retainedDays: 3 });
  assert.equal(paid.ok, false);
  assert.match(paid.errors.join(' '), /14-day/);
  const signal = buildEonKeyGrantPreview({ eventType: 'activated-free-invite', serverLedgerProof: true });
  assert.equal(signal.ok, true);
  assert.equal(signal.keyType, 'signal');
  assert.equal(signal.subscriptionCreated, false);
  assert.equal(signal.fullMaxAccessCreated, false);
});

test('W620 EON Key choices include selected Max passes without full all-Max grant', () => {
  const decision = chooseEonKeyUnlock({ keyType: 'power', requestedUnlockId: 'power-max-pass-7d' });
  assert.equal(decision.ok, true);
  assert.equal(decision.unlock.planEquivalent, 'max');
  assert.equal(decision.unlock.durationDays, 7);
  assert.equal(decision.subscriptionCreated, false);
  assert.equal(decision.cashValue, false);
});

test('W620 Dodo owner checklist names products, secrets and webhook events', () => {
  const checklist = buildW620DodoOwnerChecklist();
  assert.equal(checklist.productsToCreate.length, 4);
  assert.ok(checklist.cloudflareSecrets.includes('DODO_PAYMENTS_API_KEY'));
  assert.ok(checklist.cloudflareSecrets.includes('DODO_WEBHOOK_SECRET'));
  assert.ok(checklist.cloudflareSecrets.includes('DODO_PRODUCT_PLUS'));
  assert.ok(checklist.webhookEventsToEnable.includes('subscription.active'));
  assert.ok(checklist.webhookEventsToEnable.includes('subscription.cancelled'));
  assert.ok(checklist.webhookEventsToEnable.includes('refund.succeeded'));
  assert.equal(checklist.keepDisabledUntilProof, true);
  assert.equal(validateW620DodoDashboardSetupContract().ok, true);
});

test('W620 Dodo official webhook types map to internal ledger actions', () => {
  const active = mapDodoWebhookTypeToW620LedgerEvent('subscription.active');
  assert.equal(active.recognized, true);
  assert.equal(active.grantsAccess, true);
  const refund = mapDodoWebhookTypeToW620LedgerEvent('refund.succeeded');
  assert.equal(refund.recognized, true);
  assert.equal(refund.revokesOrBlocksAccess, true);
  const dispute = mapDodoWebhookTypeToW620LedgerEvent('dispute.opened');
  assert.equal(dispute.ledgerEventType, 'chargeback_opened');
});

test('W620 focused source gate passes', () => {
  const report = inspectW620ReferralAgentDodoCompletionGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.agentStageLanes, 6);
  assert.equal(report.dodoProducts, 4);
});

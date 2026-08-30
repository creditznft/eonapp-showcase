import assert from 'node:assert/strict';
import test from 'node:test';

const mobileUx = await import('../../assets/js/realm3d/engine/EonCityMobileUxPerfectionRuntime.js');
const operator = await import('../../assets/js/chat/eonbot-app-operator.js');
const rewards = await import('../../assets/js/rewards/unified-reward-center.js');
const mobileLab = await import('../../assets/js/realm3d/engine/EonCityMobileGameAutomationLab.js');
const trust = await import('../../assets/js/utils/public-trust-polish.js');
const payments = await import('../../assets/js/utils/real-payment-proof-plan.js');

test('W170 EON City mobile UX contract blocks unclosable mobile overlays', () => {
  const portrait = mobileUx.classifyEonCityViewport({ width: 390, height: 844 });
  assert.equal(portrait.isMobile, true);
  assert.equal(portrait.orientation, 'portrait');
  assert.equal(portrait.panelMode, 'collapsed');
  assert.equal(portrait.shouldAutoCollapseSidePanel, true);
  const plan = mobileUx.buildEonCityMobileUxPlan({ viewport: { width: 390, height: 844 } });
  assert.equal(plan.contract.allOverlaysCloseable, true);
  assert.equal(plan.contract.hideUiButtonRequired, true);
  assert.equal(plan.contract.closeAllButtonRequired, true);
  assert.equal(plan.passCriteria.noUnclosableWindows, true);
  assert.ok(plan.overlaySelectors.includes('.rw-side-panel'));
});

test('W171 EONBOT operator turns text into safe app commands with approval gates', () => {
  const city = operator.buildOperatorActionPlan('open eon city and rotate city');
  assert.equal(city.matched, true);
  assert.equal(city.actionId, 'open-eon-city');
  assert.equal(city.route, '/realmworld.html');
  assert.equal(city.approvalRequired, false);
  assert.equal(city.commandReceipt.needsUserApproval, false);

  const ads = operator.buildOperatorActionPlan('enable multitag extra earnings');
  assert.equal(ads.actionId, 'enable-sponsor-boost');
  assert.equal(ads.approvalRequired, true);
  assert.equal(ads.commandReceipt.sensitiveActionBlockedUntilConfirm, true);
  assert.equal(ads.sponsorBoost.noPaidEntitlement, true);

  const voice = operator.buildOperatorActionPlan('talk to eonbot with microphone', {
    voiceOptions: { capabilities: { speechRecognition: false, getUserMedia: true }, telegramMiniApp: true }
  });
  assert.equal(voice.actionId, 'voice-mode');
  assert.equal(voice.approvalRequired, true);
  assert.match(voice.risk, /microphone/);
});

test('W172 Reward Center separates verified rewards from Sponsor Boost soft value', () => {
  const state = rewards.buildUnifiedRewardCenterState({ telegramVerified: true, postbackVerified: false, paidReceiptVerified: false });
  assert.equal(state.unlockRules.accountWideSupporter, false);
  assert.equal(state.unlockRules.directLinkCannotUnlockPaid, true);
  assert.equal(state.unlockRules.multiTagCannotUnlockPaid, true);
  assert.equal(state.unlockRules.socialProofCannotUnlockSubscription, true);
  const direct = rewards.decideRewardUnlock('direct-link-sponsor-boost');
  assert.equal(direct.ok, true);
  assert.equal(direct.accountWide, false);
  assert.equal(direct.noPaidEntitlement, true);
  const rewardedBeforePostback = rewards.decideRewardUnlock('verified-rewarded-ad', { telegramVerified: true, postbackVerified: false });
  assert.equal(rewardedBeforePostback.ok, false);
  assert.equal(rewardedBeforePostback.reason, 'provider-postback-required');
  const rewardedAfterPostback = rewards.decideRewardUnlock('verified-rewarded-ad', { telegramVerified: true, postbackVerified: true });
  assert.equal(rewardedAfterPostback.ok, true);
  assert.equal(rewardedAfterPostback.accountWide, true);
});

test('W173 mobile game automation matrix covers portrait and landscape gameplay proof', () => {
  const matrix = mobileLab.buildMobileGameAutomationMatrix();
  assert.equal(matrix.length >= 6, true);
  assert.ok(matrix.some((entry) => entry.orientation === 'portrait'));
  assert.ok(matrix.some((entry) => entry.orientation === 'landscape'));
  assert.ok(matrix.every((entry) => entry.route === '/realmworld.html'));
  assert.ok(matrix.every((entry) => entry.mustPass.includes('all-overlays-dismissible')));
  const spec = mobileLab.buildMobileGamePlaywrightSpecPlan();
  assert.equal(spec.file, 'e2e/w173-mobile-game-automation-lab.spec.js');
  assert.ok(spec.acceptance.some((entry) => /Close panels/i.test(entry)));
});

test('W174 public trust polish catches launch-risk claims and locks reward truth', () => {
  const checklist = trust.buildPublicTrustChecklist();
  assert.ok(checklist.requiredPages.includes('/privacy.html'));
  assert.match(checklist.copyLocks.sponsorBoost, /local soft-value/i);
  const bad = trust.auditTrustCopy({ 'bad.html': 'Guaranteed income and risk-free profit from voice works in every browser.' });
  assert.equal(bad.ok, false);
  const good = trust.auditTrustCopy({ 'good.html': checklist.copyLocks.rewards + ' ' + checklist.copyLocks.trading });
  assert.equal(good.ok, true);
});

test('W175 real payment proof stays live-only and low-value until receipts pass', () => {
  const plan = payments.buildRealPaymentProofPlan({ maxTestValueUsd: 2 });
  assert.equal(plan.safety.lowValueOnly, true);
  assert.equal(plan.safety.maxTestValueUsd, 2);
  assert.ok(plan.steps.some((step) => step.id === 'nowpayments-low-value' && step.liveOnly));
  assert.ok(plan.steps.some((step) => step.id === 'evm-low-value' && step.liveOnly));
  const incomplete = payments.evaluatePaymentProofEvidence({ nowpaymentsReceipt: true, evmReceipt: false, vaultReceiptPersisted: true, supportRefundVisible: true });
  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.missing.includes('evmReceipt'));
  const complete = payments.evaluatePaymentProofEvidence({ nowpaymentsReceipt: true, evmReceipt: true, vaultReceiptPersisted: true, supportRefundVisible: true });
  assert.equal(complete.ok, true);
  assert.equal(complete.liveMoneyComplete, true);
});

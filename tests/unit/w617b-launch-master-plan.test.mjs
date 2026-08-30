import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonLaunchMasterPlan,
  decideEonLaunchHandoffStage,
  validateEonLaunchMasterPlan
} from '../../assets/js/launch/eon-launch-master-plan.js';
import { buildFinalLaunchChecklist, decideLaunchStatus } from '../../assets/js/utils/final-launch-signoff.js';
import { buildCloudflareDeployRunbook, buildLivePaymentProofPlan, validateDeployProofPlan } from '../../assets/js/utils/deploy-proof-plan.js';
import { inspectW617bLaunchMasterPlanGate } from '../../scripts/w617b-launch-master-plan-gate.mjs';

test('W617B launch plan captures current subscription, referral and AI truth', () => {
  const plan = buildEonLaunchMasterPlan({ date: '2026-07-10' });
  assert.equal(plan.schema, 'eonapp.launch.master-plan.v1');
  assert.equal(plan.commercialBoundary.dodoCheckoutActive, false);
  assert.equal(plan.commercialBoundary.liveEonKeyRedemptionActive, false);
  assert.equal(plan.commercialBoundary.browserOnlyEntitlementAllowed, false);
  assert.equal(plan.aiCostBoundary.platformPaidHostedGeneration, false);
  assert.equal(plan.paidTierCount, 4);
  assert.deepEqual(plan.subscriptionTiers.map((tier) => tier.id), ['free', 'plus', 'studio', 'power', 'max']);
  assert.equal(plan.referralDecision.noCashOrPayout, true);
  assert.equal(plan.referralDecision.serverLedgerRequired, true);
});

test('W617B next stages define the correct coding and external proof sequence', () => {
  const plan = buildEonLaunchMasterPlan();
  assert.deepEqual(plan.nextCodingWaves.map((wave) => wave.id), ['w617c', 'w617d', 'w617e', 'w617f']);
  assert.ok(plan.nextCodingWaves[0].deliverable.includes('Dodo'));
  assert.ok(plan.nextCodingWaves[1].hardBoundary.includes('localStorage'));
  assert.ok(plan.certificationStages.some((stage) => stage.id === 'cloudflare'));
  assert.ok(plan.codexCommands.includes('npm run qa:w617b-launch-master-plan'));
  assert.ok(plan.codexCommands.includes('npm run security:secret-scan'));
});

test('W617B handoff decision blocks paid activation until Dodo and ledgers are proven', () => {
  const blocked = decideEonLaunchHandoffStage({ sourceQaPassed: true, lintPassed: true, buildPassed: true, secretScanPassed: true, enablePaidActivation: true, enableReferralGrants: true });
  assert.equal(blocked.paidActivationAllowed, false);
  assert.equal(blocked.referralGrantsAllowed, false);
  assert.ok(blocked.blockers.some((item) => /Dodo checkout/i.test(item)));
  assert.ok(blocked.blockers.some((item) => /entitlement ledger/i.test(item)));
  assert.ok(blocked.blockers.some((item) => /referral\/EON Key ledger/i.test(item)));
});

test('W617B Cloudflare and Dodo proof plans are source-only and disabled', () => {
  const deploy = buildCloudflareDeployRunbook({ projectName: 'eonapp-ch', branch: 'main' });
  assert.equal(deploy.buildCommand, 'npm run build');
  assert.equal(deploy.outputDirectory, 'dist');
  assert.equal(deploy.nodeVersion, '22');
  assert.equal(validateDeployProofPlan(deploy).ok, true);
  const dodo = buildLivePaymentProofPlan({ now: '2026-07-10T00:00:00.000Z' });
  assert.equal(dodo.dodoProof.activeNow, false);
  assert.equal(dodo.referralProof.activeNow, false);
  assert.ok(dodo.evidenceRequired.some((item) => /Dodo signed webhook/i.test(item)));
});

test('W617B final signoff uses Dodo proof, not older payment rails', () => {
  const checklist = buildFinalLaunchChecklist({ date: '2026-07-10' });
  const text = JSON.stringify(checklist);
  assert.match(text, /Dodo checkout\/webhook\/entitlement/);
  assert.doesNotMatch(text, /NOWPayments|direct-EVM|direct EVM/);
  const decision = decideLaunchStatus({ buildPassed: true, smokePassed: true, secretScanPassed: true, cloudflareDeployProof: true, enablePaidFeatures: true });
  assert.ok(decision.blockers.some((item) => /Dodo checkout/i.test(item)));
  assert.equal(decision.paidFeaturesAllowed, false);
});

test('W617B validation and standalone gate pass', () => {
  const validation = validateEonLaunchMasterPlan(buildEonLaunchMasterPlan());
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const gate = inspectW617bLaunchMasterPlanGate();
  assert.equal(gate.ok, true, gate.errors.join('\n'));
  assert.equal(gate.checks, 14);
});

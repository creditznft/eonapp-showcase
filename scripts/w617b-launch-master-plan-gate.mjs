#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEonLaunchMasterPlan,
  decideEonLaunchHandoffStage,
  validateEonLaunchMasterPlan
} from '../assets/js/launch/eon-launch-master-plan.js';
import { buildFinalLaunchChecklist, decideLaunchStatus } from '../assets/js/utils/final-launch-signoff.js';
import { buildCloudflareDeployRunbook, buildLivePaymentProofPlan, validateDeployProofPlan } from '../assets/js/utils/deploy-proof-plan.js';
import { buildCEOCertificationPlan, validateCEOCertificationPlan } from '../assets/js/utils/ceo-master-certification.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW617bLaunchMasterPlanGate() {
  const errors = [];
  const plan = buildEonLaunchMasterPlan({ date: '2026-07-10' });
  const validation = validateEonLaunchMasterPlan(plan);
  if (!validation.ok) errors.push(...validation.errors);

  const noProofDecision = decideEonLaunchHandoffStage({});
  if (noProofDecision.decision !== 'keep-coding-or-fix-before-codex') errors.push('Missing-proof handoff decision must remain blocked.');

  const sourceOnlyDecision = decideEonLaunchHandoffStage({ sourceQaPassed: true, lintPassed: true, buildPassed: true, secretScanPassed: true });
  if (sourceOnlyDecision.blockers.length) errors.push('Source-only proof should clear hard source blockers.');
  if (!sourceOnlyDecision.warnings.some((item) => /Cloudflare/i.test(item))) errors.push('Source-only proof must still warn about Cloudflare deploy proof.');

  const paidDecision = decideEonLaunchHandoffStage({ sourceQaPassed: true, lintPassed: true, buildPassed: true, secretScanPassed: true, enablePaidActivation: true });
  if (!paidDecision.blockers.some((item) => /Dodo checkout/i.test(item))) errors.push('Paid activation must require Dodo checkout proof.');
  if (!paidDecision.blockers.some((item) => /webhook/i.test(item))) errors.push('Paid activation must require Dodo webhook proof.');
  if (!paidDecision.blockers.some((item) => /entitlement ledger/i.test(item))) errors.push('Paid activation must require entitlement ledger proof.');

  const finalChecklist = buildFinalLaunchChecklist({ date: '2026-07-10' });
  if (!finalChecklist.requiredPasses.some((item) => /Dodo checkout\/webhook\/entitlement/i.test(item))) errors.push('Final signoff checklist missing Dodo proof pass.');
  const finalDecision = decideLaunchStatus({ buildPassed: true, smokePassed: true, secretScanPassed: true, cloudflareDeployProof: true, enablePaidFeatures: true });
  if (!finalDecision.blockers.some((item) => /Dodo checkout/i.test(item))) errors.push('Final launch decision must block paid activation without Dodo proof.');

  const deploy = buildCloudflareDeployRunbook({ projectName: 'eonapp-ch', branch: 'main' });
  const deployValidation = validateDeployProofPlan(deploy);
  if (!deployValidation.ok) errors.push(...deployValidation.errors.map((error) => `Deploy: ${error}`));
  if (deploy.outputDirectory !== 'dist') errors.push('Cloudflare runbook must use dist output.');
  const paymentPlan = buildLivePaymentProofPlan({ now: '2026-07-10T00:00:00.000Z' });
  if (paymentPlan.dodoProof.activeNow !== false || paymentPlan.referralProof.activeNow !== false) errors.push('Dodo/referral proof plan must remain inactive now.');

  const ceo = buildCEOCertificationPlan({ date: '2026-07-10' });
  const ceoValidation = validateCEOCertificationPlan(ceo);
  if (!ceoValidation.ok) errors.push(...ceoValidation.problems.map((error) => `CEO: ${error}`));
  if (!ceo.hardStop.some((item) => /Dodo/i.test(item))) errors.push('CEO hard stops must name Dodo proof.');

  const activeFiles = [
    'assets/js/launch/eon-launch-master-plan.js',
    'assets/js/utils/final-launch-signoff.js',
    'assets/js/utils/deploy-proof-plan.js',
    'assets/js/utils/financial-risk-guardrails.js',
    'assets/js/utils/all-app-audit-plan.js',
    'assets/js/utils/ceo-master-certification.js',
    'scripts/launch-ops-plan.mjs',
    'scripts/codex-handoff-certification.mjs'
  ];
  const forbidden = /NOWPayments|direct-EVM|direct EVM|Monetag|Pool Points|cashback|wallet balance|crypto payout|free month|renewal discount/i;
  for (const file of activeFiles) {
    const source = read(file);
    if (forbidden.test(source)) errors.push(`${file} contains retired payment/reward vocabulary.`);
  }

  const pkg = JSON.parse(read('package.json'));
  for (const scriptName of ['qa:w617b-launch-master-plan', 'launch:ops-plan', 'launch:all-app-plan', 'launch:codex-handoff']) {
    if (!pkg.scripts?.[scriptName]) errors.push(`package script missing: ${scriptName}`);
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w617b.launch-master-plan-gate.v1', checks: 14 });
}

const report = inspectW617bLaunchMasterPlanGate();
if (!report.ok) {
  console.error(`[W617B] launch master plan gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W617B] launch master plan gate passed (${report.checks}/14).`);

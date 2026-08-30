#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildFinalLaunchChecklist, decideLaunchStatus } from '../assets/js/utils/final-launch-signoff.js';
import { buildCEOCertificationPlan } from '../assets/js/utils/ceo-master-certification.js';
import { buildEonLaunchMasterPlan } from '../assets/js/launch/eon-launch-master-plan.js';

const launch = buildEonLaunchMasterPlan({ date: '2026-07-10' });
const checklist = buildFinalLaunchChecklist({ date: '2026-07-10' });
const ceoPlan = buildCEOCertificationPlan({ date: '2026-07-10' });
const dryEvidence = decideLaunchStatus({
  buildPassed: false,
  smokePassed: false,
  secretScanPassed: false,
  cloudflareDeployProof: false,
  enablePaidFeatures: false,
  enableReferralGrants: false,
  mobileQaPassed: false,
  accessibilityPassed: false,
  browserQaPassed: false,
  eonCityAuthenticatedProofPassed: false
});

const proofArtifacts = [
  'local npm install log',
  'focused W616/W617 QA log',
  'lint log',
  'build log and distribution hash',
  'smoke build log',
  'secret scan result',
  'browser QA screenshots for home, Projects, Workspace, Local AI, Automations, Vault, EON Keys and EON City',
  'mobile Chrome QA notes and screenshots',
  'Cloudflare Pages deployment id and custom-domain HTTPS proof',
  'headers, redirects and service-worker cache proof',
  'Dodo product/webhook/entitlement proof or explicit paid-disabled note',
  'referral/EON Key server-ledger proof or explicit grants-disabled note',
  'CEO final go / soft-launch / no-go note'
];

const md = [];
md.push('# EONAPP W617B — Codex Handoff Certification Pack');
md.push('');
md.push('Date: 2026-07-10');
md.push('Mode: local/Codex handoff; generated without deploy, checkout, webhook, trial, referral grant or EON Key redemption.');
md.push('');
md.push('## Current decision');
md.push(`- Dry decision without local proof: **${dryEvidence.decision}**`);
md.push(`- Launch stage: **${launch.launchStage}**`);
md.push('- This is expected: source QA, browser/mobile QA, Cloudflare deploy proof and Dodo/server proof must happen locally/outside this chat before production activation.');
md.push('');
md.push('## Exact Codex/local command order');
launch.codexCommands.forEach((cmd, index) => md.push(`${index + 1}. \`${cmd}\``));
md.push('');
md.push('## Proof artifacts to collect');
proofArtifacts.forEach((item) => md.push(`- ${item}`));
md.push('');
md.push('## Required final passes');
checklist.requiredPasses.forEach((item) => md.push(`- ${item}`));
md.push('');
md.push('## Accepted soft-launch limits');
checklist.acceptedSoftLaunchLimits.forEach((item) => md.push(`- ${item}`));
md.push('');
md.push('## CEO hard stops');
ceoPlan.hardStop.forEach((item) => md.push(`- ${item}`));
md.push('');
md.push('## Final handoff instruction');
md.push('Use this workspace as a source-validated candidate only. Do not broadly launch and do not enable Dodo checkout, trials, live referral grants or EON Key redemption until W617C/W617D server proof and Cloudflare deployment proof are recorded.');
md.push('');

mkdirSync('CodexDocs', { recursive: true });
const outPath = 'CodexDocs/EONAPP_W617B_CODEX_HANDOFF_CERTIFICATION_PACK_2026-07-10.md';
writeFileSync(outPath, `${md.join('\n')}\n`);
console.log(`Wrote ${outPath}`);
console.log(`Codex handoff dry launch decision: ${dryEvidence.decision}`);

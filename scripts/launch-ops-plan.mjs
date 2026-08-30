#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAllAppAuditPlan } from '../assets/js/utils/all-app-audit-plan.js';
import { buildCloudflareDeployRunbook, buildLivePaymentProofPlan } from '../assets/js/utils/deploy-proof-plan.js';
import { buildFinalLaunchChecklist } from '../assets/js/utils/final-launch-signoff.js';
import { buildFinancialWaveChecklist } from '../assets/js/utils/financial-risk-guardrails.js';
import { buildEonLaunchMasterPlan } from '../assets/js/launch/eon-launch-master-plan.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'CodexDocs', 'EONAPP_W617B_DODO_CLOUDFLARE_LAUNCH_RUNBOOK_2026-07-10.md');

const launch = buildEonLaunchMasterPlan({ date: '2026-07-10' });
const financial = buildFinancialWaveChecklist({ date: '2026-07-10' });
const deploy = buildCloudflareDeployRunbook({ projectName: 'eonapp-ch', branch: 'main' });
const proofs = buildLivePaymentProofPlan({ now: '2026-07-10T00:00:00.000Z' });
const signoff = buildFinalLaunchChecklist({ date: '2026-07-10' });
const allApp = buildAllAppAuditPlan({ date: '2026-07-10' });

function list(items = []) { return items.map((item) => `- ${item}`).join('\n'); }
function table(rows = []) { return rows.map((row) => `| ${row.id || row.label} | ${row.label || row.status || ''} | ${row.stage || row.status || ''} | ${row.hardBoundary || row.deliverable || ''} |`).join('\n'); }

const md = `# EONAPP W617B Dodo + Cloudflare Launch Runbook

Date: 2026-07-10  
Mode: generated source runbook; no deploy, checkout, webhook, trial, referral grant or EON Key redemption was performed.

## Current launch decision

- Stage: **${launch.launchStage}**
- Broad launch: **${launch.broadLaunchDecision}**
- Soft launch path: ${launch.softLaunchPath}
- Paid activation now: **off**
- Referral/EON Key grants now: **off**
- Platform-paid AI/image/video generation: **off**

## Completed coding waves

${list(launch.completedWaves.map((wave) => `${wave.id.toUpperCase()} — ${wave.label} (${wave.proof})`))}

## Next coding / proof waves

| Wave | Name | Stage | Boundary |
| --- | --- | --- | --- |
${table(launch.nextCodingWaves)}

## Subscription plan

${list(launch.subscriptionTiers.map((tier) => `${tier.label}: $${tier.monthlyUsd}/month / ₹${tier.monthlyInr}/month, checkoutActive=${tier.checkoutActive}, Dodo product required=${tier.dodoProductRequired}`))}

## Referral decision

- Rail: ${launch.referralDecision.launchRewardRail}
- Active now: ${launch.referralDecision.activeNow}
- Server ledger required: ${launch.referralDecision.serverLedgerRequired}
- No cash/payout/wallet/crypto/token/NFT/reward discount value is granted by this source wave.
- Future invitee coupon, if used, must be a separate Dodo coupon/config decision and not a browser-side grant.

## Financial / reward risk guardrails

Files to inspect:
${list(financial.requiredFilesToInspect)}

Coding tasks:
${list(financial.codingTasks)}

Known live blockers:
${list(financial.launchBlockers)}

## Cloudflare Pages setup

Project: ${deploy.projectName}  
Branch: ${deploy.branch}  
Build command: \`${deploy.buildCommand}\`  
Output directory: \`${deploy.outputDirectory}\`  
Node version: \`${deploy.nodeVersion}\`

Required Cloudflare settings:
${list(deploy.requiredCloudflareSettings)}

Pre-deploy local commands:
${list(deploy.preDeployLocalCommands.map((cmd) => `\`${cmd}\``))}

Post-deploy smoke checks:
${list(deploy.postDeploySmokeChecks)}

Rollback plan:
${list(deploy.rollbackPlan)}

## Dodo / entitlement proof plan

Dodo proof steps:
${list(proofs.dodoProof.steps)}

Referral/EON Key proof steps:
${list(proofs.referralProof.steps)}

Evidence required:
${list(proofs.evidenceRequired)}

## Whole-app audit scope

Page groups:
${Object.entries(allApp.pageGroups).map(([group, pages]) => `- ${group}: ${pages.join(', ')}`).join('\n')}

Code groups:
${Object.entries(allApp.codeGroups).map(([group, files]) => `- ${group}: ${files.join(', ')}`).join('\n')}

Audit checks:
${list(allApp.auditChecks)}

## Final CEO signoff requirements

Required passes:
${list(signoff.requiredPasses)}

Accepted soft-launch limits:
${list(signoff.acceptedSoftLaunchLimits)}

Go criteria:
${list(signoff.goCriteria)}

## Handoff rule

Hand this to Codex after W617B source validation. Codex/local should deploy only after the command list passes and should keep Dodo checkout, trials, referral grants and EON Key redemption disabled until W617C/W617D server proof exists.
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md);
console.log(`Wrote ${path.relative(root, outPath)}`);

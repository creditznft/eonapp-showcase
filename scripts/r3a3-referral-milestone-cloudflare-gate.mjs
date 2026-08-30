#!/usr/bin/env node
/**
 * W260-R3 A3 — referral/milestone and Cloudflare deployment-state gate.
 * Source-only proof. It intentionally cannot inspect the owner's Cloudflare
 * account, secrets, historical deployments, live D1 data, or Pages dashboard.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_INVITE_PROGRAM_ACTIVE,
  EON_INVITE_PROGRAM_MODE,
  validateEonInviteArchitectureContract
} from '../config/eon-invite-architecture.mjs';
import {
  EON_ACCESS_MILESTONES_ACTIVE,
  EON_ACCESS_MILESTONES_MODE,
  requestAccessMilestoneGrant
} from '../assets/js/access/access-milestones-registry.js';
import {
  ACCESS_MILESTONE_PILOT_MODE,
  evaluateAccessMilestonePilotGate
} from '../config/access-milestone-pilot-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = path.join(ROOT, 'artifacts', 'W260_R3_A3_REFERRAL_MILESTONE_CLOUDFLARE_GATE_REPORT.json');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));

function findActiveFunctionFiles() {
  const dir = path.join(ROOT, 'functions');
  const results = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.name !== 'README.md' && entry.name !== 'package.json') results.push(path.relative(ROOT, absolute).replace(/\\/g, '/'));
    }
  };
  if (exists('functions')) visit(dir);
  return results.sort();
}

function main() {
  const errors = [];
  const warnings = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const deployWorkflow = read('.github/workflows/deploy.yml');
  const pagesFunctionsReadme = read('functions/README.md');
  const referralRuntime = read('assets/js/utils/referral-par.js');
  const accessRegistry = read('assets/js/access/access-milestones-registry.js');
  const backendWrangler = read('platform-backend/wrangler.toml');
  const futureMigration = read('platform-backend/migrations/future/0100_eon_invite_access_milestones_schema.DISABLED.sql');
  const activeFunctionFiles = findActiveFunctionFiles();
  const pilot = evaluateAccessMilestonePilotGate();
  const requestedGrant = requestAccessMilestoneGrant();

  assert(validateEonInviteArchitectureContract().ok, 'Invite architecture contract must remain valid.');
  assert(EON_INVITE_PROGRAM_ACTIVE === false && EON_INVITE_PROGRAM_MODE === 'read-only-design', 'Invite program must remain read-only and inactive.');
  assert(EON_ACCESS_MILESTONES_ACTIVE === false && EON_ACCESS_MILESTONES_MODE === 'disabled', 'Access Milestones must remain disabled at source level.');
  assert(ACCESS_MILESTONE_PILOT_MODE === 'no-go' && pilot.go === false && pilot.active === false, 'Access Milestone pilot gate must remain no-go.');
  assert(requestedGrant?.reason === 'access-milestones-disabled' && requestedGrant?.storageUnchanged === true, 'Access Milestone grant requests must fail closed without local entitlement writes.');
  assert(/REFERRAL_REWARDS_ENABLED\s*=\s*false/.test(referralRuntime), 'Referral rewards must remain false.');
  assert(/no_active_referral_or_reward_program/.test(referralRuntime), 'Referral settlement must fail closed.');
  assert(!/\/api\/referrals/.test(referralRuntime), 'Active referral runtime must not call a referral API.');
  assert(!/\bfetch\s*\(/.test(referralRuntime), 'Active referral runtime must not perform network settlement.');
  assert(!exists('functions/api/referrals'), 'No active Pages referral route may exist.');
  assert(activeFunctionFiles.length === 1 && activeFunctionFiles[0] === 'functions/csp-report.js', 'The only active Pages Function must be the CSP report receiver.');
  assert(/Only the privacy-safe CSP report receiver remains active/.test(pagesFunctionsReadme), 'Functions inventory must explain the inactive referral/reward state.');
  assert(/wrangler pages deploy\s+dist\s+--project-name=eonapp-ch\s+--branch=main/.test(deployWorkflow), 'Production workflow must deploy the built Pages artifact only.');
  assert(!/platform-backend/.test(deployWorkflow), 'Production Pages workflow must not deploy platform-backend.');
  assert(/database_id\s*=\s*"replace-with-real-d1-database-id"/.test(backendWrangler), 'Platform backend must retain a placeholder D1 id in this source freeze.');
  assert(/FUTURE-ONLY\s*\/\s*NOT DEPLOYED/.test(futureMigration), 'Future invite/milestone D1 schema must be visibly non-deployed.');
  assert(!/amount|exchange_rate|wallet|payout|coin|token|pool_points|commission|revenue_share/i.test(futureMigration), 'Future invite/milestone D1 schema must stay non-financial.');
  if (/database_name\s*=\s*"eonapp-platform"/.test(backendWrangler)) warnings.push('Historical platform-backend D1 template exists in source; it is not evidence of a live binding.');
  warnings.push('Cloudflare account state is unverified in this source-only environment: use the owner/Codex read-only runbook before any deploy.');

  const report = {
    schema: 'eonapp.w260-r3.a3.referral-milestone-cloudflare-gate.v1',
    checkedAt: new Date().toISOString(),
    ok: errors.length === 0,
    decision: errors.length === 0 ? 'no-cloudflare-change-authorised' : 'source-contract-failed',
    sourceObserved: {
      inviteProgramActive: EON_INVITE_PROGRAM_ACTIVE,
      inviteProgramMode: EON_INVITE_PROGRAM_MODE,
      referralRewardsEnabled: /REFERRAL_REWARDS_ENABLED\s*=\s*false/.test(referralRuntime),
      accessMilestonesActive: EON_ACCESS_MILESTONES_ACTIVE,
      accessMilestonesMode: EON_ACCESS_MILESTONES_MODE,
      pilotMode: ACCESS_MILESTONE_PILOT_MODE,
      activePagesFunctionFiles: activeFunctionFiles,
      pagesReferralEndpointPresent: exists('functions/api/referrals'),
      pagesWorkflowDeploysPlatformBackend: /platform-backend/.test(deployWorkflow),
      platformD1IdPlaceholder: /replace-with-real-d1-database-id/.test(backendWrangler),
      futureMigrationDeferred: /FUTURE-ONLY\s*\/\s*NOT DEPLOYED/.test(futureMigration)
    },
    cloudflareAccountState: 'not-collected-in-source-freeze',
    proofLimit: 'This gate has no Cloudflare credentials and cannot prove dashboard bindings, old Workers, remote D1 tables, environment secrets, deployed Pages Functions, or historical deployment state.',
    warnings,
    errors
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log('W260-R3 A3 referral/milestone Cloudflare gate: PASS (source-only inactive-state proof; no Cloudflare change authorised).');
    warnings.forEach((warning) => console.warn(`[W260-R3 A3] ${warning}`));
  }
}

main();

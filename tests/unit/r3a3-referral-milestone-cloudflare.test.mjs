import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  EON_INVITE_PROGRAM_ACTIVE,
  EON_INVITE_PROGRAM_MODE
} from '../../config/eon-invite-architecture.mjs';
import {
  EON_ACCESS_MILESTONES_ACTIVE,
  EON_ACCESS_MILESTONES_MODE,
  requestAccessMilestoneGrant
} from '../../assets/js/access/access-milestones-registry.js';
import { evaluateAccessMilestonePilotGate } from '../../config/access-milestone-pilot-gate.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W260-R3 A3 preserves inactive referral and milestone state', () => {
  assert.equal(EON_INVITE_PROGRAM_ACTIVE, false);
  assert.equal(EON_INVITE_PROGRAM_MODE, 'read-only-design');
  assert.equal(EON_ACCESS_MILESTONES_ACTIVE, false);
  assert.equal(EON_ACCESS_MILESTONES_MODE, 'disabled');
  assert.equal(evaluateAccessMilestonePilotGate().go, false);
  const result = requestAccessMilestoneGrant();
  assert.equal(result.reason, 'access-milestones-disabled');
  assert.equal(result.storageUnchanged, true);
});

test('W260-R3 A3 keeps referral rewards outside the active protected Pages release', () => {
  const workflow = read('.github/workflows/deploy.yml');
  const referral = read('assets/js/utils/referral-par.js');
  const wrangler = read('platform-backend/wrangler.toml');
  assert.match(workflow, /w660l-stage-pages-deploy-root\.mjs/);
  assert.match(workflow, /wrangler@4 pages deploy \.\s*\\?\s*--project-name=eonapp-ch\s*\\?\s*--branch=main/);
  assert.match(workflow, /functions\/api\/auth\/session\.js/);
  assert.match(workflow, /functions\/api\/city\/access\.js/);
  assert.match(workflow, /functions\/api\/referrals\.js/);
  assert.match(workflow, /eonapp\.referrals\.scalable-minimal-ledger\.w623i\.v2/);
  assert.match(workflow, /w641-verify-release-candidate\.mjs/);

  const legacyEnvironmentReceipt = /w641-create-environment-receipt\.mjs/.test(workflow);
  const exactSameBuildProtection = [
    /environment:\s*\n\s*name:\s*production/,
    /PRIOR_CERTIFIED_PREVIEW_DIGEST/,
    /eonapp\/a15-stage4-production-bundle-proof/,
    /Capture exact rollback authority/,
    /Record protected owner authorization/,
    /Resolve and verify exact production provenance/,
    /release\/candidate-provenance\.json/,
    /Stage-4 exact same-build production promotion passed/
  ].every((pattern) => pattern.test(workflow));
  assert.equal(
    legacyEnvironmentReceipt || exactSameBuildProtection,
    true,
    'production promotion must retain either the W641 environment receipt or the exact same-build protected promotion contract'
  );

  assert.doesNotMatch(workflow, /npm (?:run )?build/);
  assert.doesNotMatch(workflow, /platform-backend/);
  assert.match(referral, /REFERRAL_REWARDS_ENABLED\s*=\s*false/);
  assert.doesNotMatch(referral, /\/api\/referrals/);
  assert.match(wrangler, /replace-with-real-d1-database-id/);
});

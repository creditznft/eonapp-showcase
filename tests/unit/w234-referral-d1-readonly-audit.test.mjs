import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  EON_INVITE_PROGRAM_ACTIVE,
  EON_INVITE_PROGRAM_MODE,
  EON_INVITE_NON_QUALIFYING_SIGNALS,
  getEonInviteArchitectureStatus,
  validateEonInviteArchitectureContract
} from '../../config/eon-invite-architecture.mjs';
import { getW393ALeanHandoverStatus } from '../../config/w393a-lean-handover-integrity-contract.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W234 leaves EON Invite as a read-only architecture, not an activated program', () => {
  assert.equal(EON_INVITE_PROGRAM_ACTIVE, false);
  assert.equal(EON_INVITE_PROGRAM_MODE, 'read-only-design');
  const status = getEonInviteArchitectureStatus();
  assert.equal(status.serverWrites, false);
  assert.equal(validateEonInviteArchitectureContract().ok, true);
  for (const signal of ['raw_click', 'impression', 'copied_link', 'ad_view', 'ad_click', 'self_report']) {
    assert.ok(EON_INVITE_NON_QUALIFYING_SIGNALS.includes(signal));
  }
});

test('W234 keeps the referral/D1 source boundary inactive in a lean handover', () => {
  const wrangler = read('platform-backend/wrangler.toml');
  const referral = read('assets/js/utils/referral-par.js');
  const future = read('platform-backend/migrations/future/0100_eon_invite_access_milestones_schema.DISABLED.sql');
  const status = getW393ALeanHandoverStatus();
  assert.match(wrangler, /replace-with-real-d1-database-id/);
  assert.equal(fs.existsSync(path.join(root, 'functions/api/referrals')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/js/utils/referral-cloud-storage.js')), false);
  assert.doesNotMatch(referral, /\/api\/referrals/);
  assert.match(future, /FUTURE-ONLY \/ NOT DEPLOYED/);
  assert.doesNotMatch(future, /amount|exchange_rate|wallet|payout|coin|token|pool_points|commission/i);
  assert.equal(status.historicArchiveVerification, 'not-certified-by-this-handover');
});

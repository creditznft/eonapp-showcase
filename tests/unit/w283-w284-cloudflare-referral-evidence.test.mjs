import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  W283_CLOUDFLARE_EVIDENCE_MODE,
  W284_REFERRAL_ACTIVATION_MODE,
  W284_REQUIRED_APPROVALS,
  W284_PROHIBITED_ACTIVATION_BEHAVIOURS,
  evaluateW284ReferralActivationDecision,
  validateW283W284EvidenceContract
} from '../../config/w283-w284-cloudflare-referral-evidence.mjs';
import { EON_INVITE_PROGRAM_ACTIVE } from '../../config/eon-invite-architecture.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W283 is evidence-only and names no remote mutation authority', () => {
  assert.equal(validateW283W284EvidenceContract().ok, true);
  assert.equal(W283_CLOUDFLARE_EVIDENCE_MODE, 'owner-read-only-evidence-pending');
  assert.equal(EON_INVITE_PROGRAM_ACTIVE, false);
  const runbook = read('docs/W283_CLOUDFLARE_EDGE_ROLLBACK_READ_ONLY_EVIDENCE_RUNBOOK_2026-06-25.md');
  assert.match(runbook, /sqlite_master/);
  assert.match(runbook, /Do \*\*not\*\* run `wrangler d1 migrations apply`/);
  const cli = runbook.match(/```bash\n([\s\S]*?)```/)?.[1] || '';
  assert.equal(cli.split(/\n/).some((line) => /^\s*npx wrangler (?:d1 migrations apply|d1 create|secret put|pages deploy(?:\s|$)|deploy(?:\s|$))/.test(line)), false);
});

test('W284 remains a decision packet with all approvals missing by default', () => {
  const decision = evaluateW284ReferralActivationDecision();
  assert.equal(W284_REFERRAL_ACTIVATION_MODE, 'not-authorised');
  assert.equal(decision.authorised, false);
  assert.equal(decision.active, false);
  assert.equal(decision.missing.length, Object.keys(W284_REQUIRED_APPROVALS).length);
  for (const term of ['wallet', 'coin', 'token', 'payout', 'raw IP storage']) assert.ok(W284_PROHIBITED_ACTIVATION_BEHAVIOURS.includes(term));
  const packet = read('docs/W284_REFERRAL_MILESTONE_ACTIVATION_DECISION_PACKET_2026-06-25.md');
  assert.match(packet, /Not authorised/);
  assert.match(packet, /No activation decision can be made from source code/);
});

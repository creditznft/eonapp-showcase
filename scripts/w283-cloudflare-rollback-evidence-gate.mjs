#!/usr/bin/env node
/** W283-A0 — source guard for owner-only Cloudflare/D1 evidence collection. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W283_CLOUDFLARE_EVIDENCE_MODE, W283_READ_ONLY_EVIDENCE_REQUIREMENTS, validateW283W284EvidenceContract } from '../config/w283-w284-cloudflare-referral-evidence.mjs';
import { EON_INVITE_PROGRAM_ACTIVE } from '../config/eon-invite-architecture.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const runbook = read('docs/W283_CLOUDFLARE_EDGE_ROLLBACK_READ_ONLY_EVIDENCE_RUNBOOK_2026-06-25.md');
const codex = read('HANDOFF/W283_W284_CLOUDFLARE_D1_EVIDENCE_2026-06-25/CODEX_READONLY_CLOUDFLARE_AND_D1_PROMPT.md');
const futureMigration = read('platform-backend/migrations/future/0100_eon_invite_access_milestones_schema.DISABLED.sql');
assert(validateW283W284EvidenceContract().ok, 'W283/W284 contract must be valid.');
assert(W283_CLOUDFLARE_EVIDENCE_MODE === 'owner-read-only-evidence-pending', 'W283 must remain owner-read-only evidence pending.');
assert(EON_INVITE_PROGRAM_ACTIVE === false, 'W283 must not activate the invite program.');
assert(exists('release-evidence/W283_CLOUDFLARE_READ_ONLY_EVIDENCE_2026-06-25/W283_BOARD.json'), 'W283 evidence board must exist.');
for (const phrase of ['wrangler pages deployment list', 'wrangler d1 list', 'sqlite_master', 'Do **not** run `wrangler d1 migrations apply`']) assert(runbook.includes(phrase), `W283 runbook missing ${phrase}.`);
assert(/Do not deploy, bind, create D1, migrate D1, apply a Worker, write D1, edit a secret/.test(codex), 'Codex handoff must remain no-mutation.');
assert(/FUTURE-ONLY\s*\/\s*NOT DEPLOYED/.test(futureMigration), 'Deferred D1 schema must remain visibly undeployed.');
assert(W283_READ_ONLY_EVIDENCE_REQUIREMENTS.every((line) => /read-only|inventor|schema|redacted|rollback/i.test(line)), 'W283 requirements must remain evidence-only.');
const report = { schema: 'eonapp.w283.cloudflare-rollback-evidence-gate.v1', ok: errors.length === 0, checkedAt: new Date().toISOString(), mode: W283_CLOUDFLARE_EVIDENCE_MODE, remoteMutationAuthorised: false, inviteActive: EON_INVITE_PROGRAM_ACTIVE, limitations: ['No Cloudflare account or D1 remote state is available in this source gate.', 'A passing gate is not evidence of deployment parity, binding accuracy, D1 schema, owner access or rollback.'], errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/W283_CLOUDFLARE_ROLLBACK_EVIDENCE_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

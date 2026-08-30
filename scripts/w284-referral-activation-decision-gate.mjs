#!/usr/bin/env node
/** W284-A0 — fail-closed future referral/milestone activation decision gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_INVITE_PROGRAM_ACTIVE, EON_INVITE_PROGRAM_MODE } from '../config/eon-invite-architecture.mjs';
import { EON_ACCESS_MILESTONES_ACTIVE, EON_ACCESS_MILESTONES_MODE } from '../assets/js/access/access-milestones-registry.js';
import { W284_REFERRAL_ACTIVATION_MODE, W284_REQUIRED_APPROVALS, W284_PROHIBITED_ACTIVATION_BEHAVIOURS, evaluateW284ReferralActivationDecision, validateW283W284EvidenceContract } from '../config/w283-w284-cloudflare-referral-evidence.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const packet = read('docs/W284_REFERRAL_MILESTONE_ACTIVATION_DECISION_PACKET_2026-06-25.md');
const decision = evaluateW284ReferralActivationDecision();
assert(validateW283W284EvidenceContract().ok, 'W284 contract must be valid.');
assert(W284_REFERRAL_ACTIVATION_MODE === 'not-authorised', 'W284 must remain not authorised.');
assert(decision.authorised === false && decision.active === false, 'W284 must fail closed.');
assert(decision.missing.length === Object.keys(W284_REQUIRED_APPROVALS).length, 'W284 requires independent evidence for every approval.');
assert(EON_INVITE_PROGRAM_ACTIVE === false && EON_INVITE_PROGRAM_MODE === 'read-only-design', 'Invite program must remain inactive.');
assert(EON_ACCESS_MILESTONES_ACTIVE === false && EON_ACCESS_MILESTONES_MODE === 'disabled', 'Milestones must remain disabled.');
for (const term of ['wallet', 'token', 'coin', 'payout', 'commission', 'revenue share', 'raw IP storage', 'device fingerprint']) assert(W284_PROHIBITED_ACTIVATION_BEHAVIOURS.includes(term), `W284 must prohibit ${term}.`);
for (const phrase of ['**Not authorised.**', 'No activation decision can be made from source code', 'single non-financial, non-transferable, clearly expiring capability']) assert(packet.includes(phrase), `W284 packet missing ${phrase}.`);
const report = { schema: 'eonapp.w284.referral-activation-decision-gate.v1', ok: errors.length === 0, checkedAt: new Date().toISOString(), mode: W284_REFERRAL_ACTIVATION_MODE, activationAuthorised: false, inviteActive: EON_INVITE_PROGRAM_ACTIVE, milestonesActive: EON_ACCESS_MILESTONES_ACTIVE, missingApprovals: decision.missing, prohibited: W284_PROHIBITED_ACTIVATION_BEHAVIOURS, errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/W284_REFERRAL_ACTIVATION_DECISION_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

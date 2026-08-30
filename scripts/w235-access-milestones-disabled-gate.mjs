#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_ACCESS_MILESTONES_ACTIVE,
  EON_ACCESS_MILESTONES_MODE,
  EON_ACCESS_MILESTONE_PROHIBITED,
  getAccessMilestoneKillSwitch,
  validateAccessMilestoneCandidate
} from '../assets/js/access/access-milestones-registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const registry = read('assets/js/access/access-milestones-registry.js');
const rewards = read('assets/js/access/rewards-status-page.js');
const survival = read('assets/js/utils/update-safe-user-data.js');
const localExport = read('assets/js/local-first/eon-local-encrypted-export.js');

assert(EON_ACCESS_MILESTONES_ACTIVE === false, 'Access Milestones must be inactive.');
assert(EON_ACCESS_MILESTONES_MODE === 'disabled', 'Access Milestones must remain disabled.');
assert(getAccessMilestoneKillSwitch().engaged === true, 'The source kill switch must be engaged.');
assert(validateAccessMilestoneCandidate({ id: 'city_cosmetic', durationDays: 31 }).ok, 'Safe cosmetic candidate should be valid.');
assert(!validateAccessMilestoneCandidate({ id: 'city_cosmetic', durationDays: 40 }).ok, 'Out-of-bound duration must be rejected.');
assert(!validateAccessMilestoneCandidate({ id: 'city_cosmetic', transferable: true }).ok, 'Transferability must be rejected.');
assert(!/fetch\s*\(|XMLHttpRequest|\/api\/|grant.*localStorage|activate.*subscription/i.test(registry), 'Disabled registry must not contain an activation/network/entitlement path.');
assert(/access-milestones-disabled/.test(registry), 'Disabled registry must return a stable fail-closed reason.');
assert(/Access Milestones/.test(rewards) && /disabled/.test(rewards), 'Rewards page must accurately show disabled Access Milestones.');
assert(/eon:access-milestones:preferences:v1/.test(survival), 'W145 storage survival registry must protect Access Milestone preferences.');
assert(/eon:access-milestones:preferences:v1/.test(backup), 'Encrypted local export allowlist must cover non-sensitive Access Milestone preferences.');
assert(EON_ACCESS_MILESTONE_PROHIBITED.includes('subscription_entitlement'), 'Subscription entitlement must remain prohibited.');

const report = { schema: 'eonapp.w235.access-milestones-disabled-gate.v1', ok: errors.length === 0, checkedAt: new Date().toISOString(), errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W235_ACCESS_MILESTONES_DISABLED_GATE_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[W235] ${report.ok ? 'PASS' : 'FAIL'}: Access Milestones source kill switch is ${getAccessMilestoneKillSwitch().engaged ? 'engaged' : 'not engaged'}.`);
if (!report.ok) errors.forEach((error) => console.error(`[W235] ${error}`));
process.exitCode = report.ok ? 0 : 1;

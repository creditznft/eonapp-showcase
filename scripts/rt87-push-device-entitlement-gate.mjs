#!/usr/bin/env node
/** RT87 — subscription-entitled Web Push device cost control (read-only). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_PUSH_DEVICE_LIMITS, getEonPushDeviceEntitlementTruth, resolveEonPushDevicePolicy } from '../functions/_shared/eon-push-device-policy.js';
import { getEonRetentionNotificationScaleTruth } from '../workers/eon-retention-notifications/src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (id, ok, detail) => { checks.push({ id, ok: Boolean(ok), detail }); if (!ok) console.error(`[RT87] FAIL ${id}: ${detail}`); };

const helper = read('functions/_shared/eon-push-device-policy.js');
const subscription = read('functions/api/notifications/subscription.js');
const billing = read('assets/js/billing/eon-dodo-live-runtime.js');
const l95 = read('scripts/l95-final-source-gate.mjs');
const runner = read('scripts/run-current-unit-suite.mjs');
const codex = read('CODEXDocs/EONAPP_RT87_PUSH_DEVICE_ENTITLEMENT_COST_CONTROL_2026-08-11.md');
const schemaAuthority = read('assets/js/infrastructure/eon-d1-schema-authority.js');
const pagesAuthority = JSON.parse(read('config/cloudflare/eon-pages-source-authority.json'));
const migrationManifest = JSON.parse(read('config/cloudflare/generated/eon-d1-migration-manifest.json'));
const pkg = JSON.parse(read('package.json'));
const truth = getEonPushDeviceEntitlementTruth();
const scale = getEonRetentionNotificationScaleTruth();

check('exact-plan-device-caps', JSON.stringify(EON_PUSH_DEVICE_LIMITS) === JSON.stringify({ free: 1, trial: 1, plus: 2, studio: 3, power: 4, max: 5 }), 'Free/Trial must be 1; Plus 2; Studio 3; Power 4; Max 5.');
check('paid-status-only', JSON.stringify(truth.paidMultiDeviceStatuses) === JSON.stringify(['active', 'cancelling']) && truth.freeAndTrialDevices === 1, 'Only paid active/cancelling lifecycle states may own multi-device push.');
check('trial-grace-fail-closed', resolveEonPushDevicePolicy({ tier_id: 'max', status: 'trialing' }).maxActiveDevices === 1 && resolveEonPushDevicePolicy({ tier_id: 'max', status: 'grace' }).maxActiveDevices === 1 && resolveEonPushDevicePolicy({ tier_id: 'max', status: 'past_due' }).maxActiveDevices === 1, 'Trial/grace/past-due must fall back to one device.');
check('paid-tier-resolution', resolveEonPushDevicePolicy({ tier_id: 'plus', status: 'active' }).maxActiveDevices === 2 && resolveEonPushDevicePolicy({ tier_id: 'studio', status: 'active' }).maxActiveDevices === 3 && resolveEonPushDevicePolicy({ tier_id: 'power', status: 'active' }).maxActiveDevices === 4 && resolveEonPushDevicePolicy({ tier_id: 'max', status: 'cancelling' }).maxActiveDevices === 5, 'Paid plan caps must resolve exactly from server entitlement truth.');
check('newest-devices-survive-prune', /ORDER BY updated_at DESC LIMIT \?/.test(helper) && /disabled_at=\?, updated_at=\?/.test(helper), 'Downgrade pruning must keep the newest allowed active devices and disable older excess rows.');
check('subscription-front-door-entitlement', /readAccountEntitlement\(env\.EON_BILLING_DB, session\.accountId\)/.test(subscription) && /resolveEonPushDevicePolicy\(entitlement\)/.test(subscription) && /pruneEonPushSubscriptionsToPolicy\(identity\.database/.test(subscription), 'Every enrollment must enforce the Dodo-ledger allowance server-side.');
check('subscription-fail-closed-one', /devicePolicy = resolveEonPushDevicePolicy\(null\)/.test(subscription) && /catch \{\s*devicePolicy = resolveEonPushDevicePolicy\(null\)/.test(subscription), 'Missing/unreadable billing authority must fail closed to one device, never grant paid slots.');
check('browser-cannot-override', truth.browserOverrideAllowed === false && !/parsed\.value\?\.(?:tier|plan|maxActiveDevices)/.test(subscription), 'The browser may not submit a tier/device-cap override.');
check('webhook-auto-prune', /\['testing', 'production'\]\.includes\(pushRollout\)/.test(billing) && /readAccountEntitlement\(env\.EON_BILLING_DB, event\.accountId\)/.test(billing) && /pruneEonPushSubscriptionsToPolicy\(env\.EON_IDENTITY_DB/.test(billing), 'Signed Dodo lifecycle processing must automatically enforce downgrade/expiry pruning while push is active.');
check('webhook-retry-on-prune-failure', /push_device_policy_retry_required/.test(billing) && /billingEventApplied: true/.test(billing) && /retryable: true/.test(billing), 'If active push pruning fails after an idempotent billing event, provider retry must be requested rather than silently leaking excess devices.');
check('rt86-scale-ceiling-preserved', scale.maxActiveDevicesPerAccount === 5 && /five-device-ceiling/.test(read('scripts/rt86-retention-notification-scale-gate.mjs')), 'RT86 scale assumptions must keep five as the absolute paid ceiling, not the free default.');
check('launch95-runs-rt87', /rt87-push-device-entitlement-gate\.mjs/.test(l95), 'The final Launch95 source gate must include RT87.');
check('maintained-suite-runs-rt87', /tests\/unit\/rt87-push-device-entitlement-cost-control\.test\.mjs/.test(runner), 'RT87 regression tests must stay in the maintained unit suite.');
check('stable-rt87-command', pkg.scripts?.['qa:rt87-push-device-cost'] === 'node scripts/rt87-push-device-entitlement-gate.mjs && node --test tests/unit/rt87-push-device-entitlement-cost-control.test.mjs', 'Codex needs one stable RT87 command.');
check('codex-policy-documented', /Free\/Trial[^\n]*1 device/i.test(codex) && /Plus[^\n]*2/i.test(codex) && /Studio[^\n]*3/i.test(codex) && /Power[^\n]*4/i.test(codex) && /Max[^\n]*5/i.test(codex) && /downgrade|expiry/i.test(codex), 'Final Codex handover must document the entitlement/cost policy and downgrade behavior.');
check('identity-schema-authority-v6', /identity: Object\.freeze\(\{ binding: 'EON_IDENTITY_DB', version: 6/.test(schemaAuthority) && pagesAuthority.bindings.find((row) => row.binding === 'EON_IDENTITY_DB')?.expectedVersion === 6, 'RT92 notification policy migration 0006 requires identity schema authority v6 everywhere.');
check('identity-migration-manifest-current', migrationManifest.migrations.some((row) => row.domain === 'identity' && row.file === 'identity/migrations/0005_notification_scale_indexes.sql') && migrationManifest.migrations.some((row) => row.domain === 'identity' && row.file === 'identity/migrations/0006_notification_policy_authority.sql'), 'Cloudflare migration manifest must include both RT86 scale migration 0005 and RT92 notification policy migration 0006.');

const failed = checks.filter((row) => !row.ok);
if (failed.length) {
  console.error(`[RT87] FAIL ${failed.length}/${checks.length}`);
  process.exit(1);
}
console.log(`[RT87] PASS ${checks.length}/${checks.length} free=1 plus=2 studio=3 power=4 max=5 serverAuthority=dodo-ledger`);

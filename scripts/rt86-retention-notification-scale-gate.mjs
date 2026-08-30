#!/usr/bin/env node
/** RT86 — retention Web Push scale/cost/source authority (read-only). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonRetentionNotificationScaleTruth } from '../workers/eon-retention-notifications/src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
function check(id, ok, detail) { checks.push({ id, ok: Boolean(ok), detail }); if (!ok) console.error(`[RT86] FAIL ${id}: ${detail}`); }

const worker = read('workers/eon-retention-notifications/src/index.js');
const wrangler = read('workers/eon-retention-notifications/wrangler.jsonc');
const pagesWrangler = read('wrangler.jsonc');
const migration = read('identity/migrations/0005_notification_scale_indexes.sql');
const reminderApi = read('functions/api/notifications/reminder.js');
const subscriptionApi = read('functions/api/notifications/subscription.js');
const devicePolicy = read('functions/_shared/eon-push-device-policy.js');
const push = read('functions/_shared/eon-web-push.js');
const serviceWorker = read('service-worker/eonapp-service-worker.js');
const readme = read('workers/eon-retention-notifications/README.md');
const secretGenerator = read('scripts/rt86-generate-web-push-secrets.mjs');
const codexRunbook = read('CODEXDocs/EONAPP_RT86_CLOUDFLARE_RETENTION_PUSH_LAUNCH_2026-08-11.md');
const truth = getEonRetentionNotificationScaleTruth();

check('queue-architecture', truth.deliveryArchitecture === 'd1-due-index-to-cloudflare-queue-to-web-push' && /EON_RETENTION_QUEUE\.sendBatch/.test(worker) && /async queue\(batch, env, ctx\)/.test(worker), 'D1 must schedule and Cloudflare Queue must absorb fan-out/backpressure.');
check('minute-release-headroom', truth.maxRemindersPerMinuteScan === 5000 && truth.theoreticalReminderReleasePerDay === 7_200_000 && (wrangler.match(/"crons"\s*:\s*\[\s*"\* \* \* \* \*"\s*\]/g) || []).length === 1, 'Preview must own the only shipped one-minute scheduler and the release path must exceed a one-million-user service-reminder envelope without per-user Cron jobs.');
check('d1-bind-parameter-safety', truth.claimChunkSize === 80 && truth.claimChunkSize + 4 < 100, 'Claim chunks must stay below D1\'s 100 bound-parameter limit with control parameters included.');
check('queue-batch-subrequest-safety', truth.queueBatchSize === 50 && truth.maxD1QueriesPerQueueBatchUpperBound <= 400 && truth.maxD1QueriesPerQueueBatchUpperBound < 1000, 'A full Queue batch must remain comfortably below the paid D1 per-invocation query/subrequest ceiling.');
check('outgoing-connection-safety', truth.queueConsumerConcurrencyPerInvocation === 4 && truth.queueConsumerConcurrencyPerInvocation < 6 && /for \(const row of subscriptions\)/.test(worker), 'Each invocation must keep concurrent Web Push fetches below the six-connection Worker ceiling.');
check('shared-d1-backpressure', (wrangler.match(/"max_concurrency"\s*:\s*10/g) || []).length === 3 && /keep Queue `max_concurrency` at 10/.test(readme), 'Queue scale-out must be capped to protect the shared identity D1 until production metrics justify a change.');
check('queue-batch-bounds', (wrangler.match(/"max_batch_size"\s*:\s*50/g) || []).length === 3 && (wrangler.match(/"max_retries"\s*:\s*3/g) || []).length === 3 && /dead_letter_queue/.test(wrangler), 'Every environment must use bounded batches, retries and DLQ handling.');
check('rollout-guarded-promotion', (wrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"disabled"/g) || []).length === 2 && (wrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"testing"/g) || []).length === 1 && (pagesWrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"disabled"/g) || []).length === 2 && (pagesWrangler.match(/"EON_PUSH_ROLLOUT"\s*:\s*"testing"/g) || []).length === 1, 'Preview may run closed-tab proof in testing mode, while local/default and Production remain disabled in both Pages and the retention Worker until explicit promotion.');
check('production-scheduler-disabled-default', (wrangler.match(/"crons"\s*:\s*\[\s*\]/g) || []).length === 2 && /"production"\s*:\s*\{[\s\S]*?"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*\]/.test(wrangler), 'Local/default and Production must ship with Cron disabled; Preview alone may schedule until explicit production promotion.');
check('preview-production-isolated', /eonapp-identity-preview/.test(wrangler) && /83b32cf2-67f1-4bbf-8c1d-b1d1517cf9fa/.test(wrangler) && /eonapp-identity-prod/.test(wrangler) && /947300be-0e59-4fee-9587-27f11389d318/.test(wrangler), 'Preview and Production identity D1 bindings must stay separate.');
check('no-public-worker-route', !/async\s+fetch\s*\(/.test(worker) && /async scheduled\(/.test(worker), 'Retention worker must have no public fetch handler.');
check('no-terminal-reminder-graveyard', truth.terminalReminderRowsPersisted === false && /DELETE FROM eon_push_reminders/.test(worker) && /DELETE FROM eon_push_reminders/.test(reminderApi) && !/SET delivered_at=/.test(worker), 'New delivered/cancelled reminders must be deleted rather than retained as terminal rows.');
check('bounded-legacy-cleanup', truth.legacyTerminalCleanupDays === 7 && truth.disabledSubscriptionCleanupDays === 7 && /idx_eon_push_reminders_terminal_cleanup/.test(migration) && /idx_eon_push_subscriptions_disabled_cleanup/.test(migration), 'Only legacy terminal rows/stale disabled subscriptions may remain for a short indexed cleanup window.');
check('due-index-optimized', /DROP INDEX IF EXISTS idx_eon_push_reminders_due/.test(migration) && /DROP INDEX IF EXISTS idx_eon_push_reminders_account/.test(migration) && /DROP INDEX IF EXISTS idx_eon_push_subscriptions_account_id/.test(migration) && /idx_eon_push_reminders_pending_due/.test(migration), 'High-volume scheduling must retire superseded broad indexes and keep a partial pending-due index.');
check('five-device-ceiling', /max:\s*5/.test(devicePolicy) && /pruneEonPushSubscriptionsToPolicy/.test(subscriptionApi) && truth.maxActiveDevicesPerAccount === 5, 'The paid Max tier may reach five devices, while RT87 owns the lower entitlement caps.');
check('no-success-heartbeat-write', truth.successHeartbeatWritePerPush === false && !/SET last_success_at=/.test(worker), 'Accepted pushes must not create a per-device D1 success write in the retention hot path.');
check('fixed-content-only', truth.automaticMarketing === false && truth.explicitReminderOnly === true && /title: 'Continue in EONAPP'/.test(worker) && /body: 'Your one-time return reminder is ready\.'/.test(worker) && /customBodiesLoaded: 0/.test(worker) && /marketingMessages: 0/.test(worker), 'RT86 may deliver explicit service reminders only; no marketing or user-authored body may enter Queue/D1.');
check('push-security-boundary', /PUSH_ENDPOINT_HOSTS/.test(push) && /PUSH_ENDPOINT_SUFFIXES/.test(push) && /AES-GCM/.test(push) && /PUSH_FETCH_TIMEOUT_MS = 10_000/.test(push), 'Subscription custody must stay encrypted and push endpoints must remain allow-listed with a finite fetch timeout.');
check('safe-click-reentry', /EON_NOTIFICATION_SAFE_PATHS/.test(serviceWorker) && /notificationclick/.test(serviceWorker) && /sameOrigin\?\.navigate/.test(serviceWorker), 'Closed-tab notifications must re-enter only through finite same-origin app routes.');
check('cost-guard-doc', /one million registered users/.test(readme) && /number of reminders actually sent per day/.test(readme) && /Queue-only charges/.test(readme), 'Codex handover must explain that notification volume, not registered-user count alone, drives cost.');
check('worker-cpu-cost-cap', !/"cpu_ms"\s*:/.test(wrangler) && /Cloudflare still enforces the plan default/.test(wrangler) && /"head_sampling_rate"\s*:\s*0\.1/.test(wrangler), 'Worker must remain compatible with the account plan while Queue batch/concurrency bounds and Cloudflare’s plan CPU default protect execution.');
check('environment-keyset-generator', /generateKeyPairSync\('ec'/.test(secretGenerator) && /prime256v1/.test(secretGenerator) && /randomBytes\(32\)/.test(secretGenerator) && /writes nothing to disk/.test(secretGenerator), 'Codex must have a source-safe generator for per-environment VAPID and subscription-custody secrets without committed key material.');
check('codex-cloudflare-proof-runbook', /same four values/i.test(codexRunbook) && /five-minute Cron -> Queue -> Worker -> (?:Web Push|push)/i.test(codexRunbook) && /production rollout still `disabled`/i.test(codexRunbook) && /Production Cron.*disabled/i.test(codexRunbook) && /Emergency rollback/.test(codexRunbook), 'Final source must carry an exact Preview proof, guarded Production promotion and rollback runbook.');

const failed = checks.filter((row) => !row.ok);
if (failed.length) {
  console.error(`[RT86] FAIL ${failed.length}/${checks.length}`);
  process.exit(1);
}
console.log(`[RT86] PASS ${checks.length}/${checks.length} release=${truth.maxRemindersPerMinuteScan}/min theoretical=${truth.theoreticalReminderReleasePerDay}/day queueBatch=${truth.queueBatchSize} maxD1QueriesPerBatch<=${truth.maxD1QueriesPerQueueBatchUpperBound} terminalRowsPersisted=${truth.terminalReminderRowsPersisted}`);

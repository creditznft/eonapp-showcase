/** Institutional AI V2 / RT86 — scalable, low-cost return-reminder delivery.
 *
 * Architecture:
 *   D1 due-time authority -> minute cron lease/producer -> Cloudflare Queue ->
 *   bounded queue consumer -> standards-based Web Push.
 *
 * The Worker has no fetch route, no marketing campaign path and no user-authored
 * notification bodies. D1 remains the 30-day scheduling authority because Queue
 * delivery delay is intentionally not used as long-term reminder storage.
 */
import { getEonWebPushConfig, openEonPushSubscription, sendEonWebPush } from '../../../functions/_shared/eon-web-push.js';
import { EON_RETURN_REMINDER_POLICY_RETENTION_MS, attributedReminderRoute, isReminderQuietAt, nextReminderQuietEndAt } from '../../../functions/_shared/eon-notification-reminder-policy.js';

const MAX_REMINDERS_PER_SCAN = 5000;
const CLAIM_CHUNK_SIZE = 80;
const MAX_ATTEMPTS = 3;
const DELIVERY_LEASE_MS = 10 * 60 * 1000;
const MAX_CONCURRENT_REMINDERS_PER_CONSUMER = 4;
const LEGACY_TERMINAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 5000;

function changes(result) {
  return Number(result?.meta?.changes || result?.changes || 0);
}

function chunk(values = [], size = 80) {
  const out = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

function validReminderMessage(value = {}) {
  const reminderId = String(value?.reminderId || '');
  const leaseAt = Math.floor(Number(value?.leaseAt || 0));
  const attemptCount = Math.floor(Number(value?.attemptCount || 0));
  if (!/^rem_[A-Za-z0-9_-]{20,80}$/.test(reminderId)) return null;
  if (!Number.isFinite(leaseAt) || leaseAt <= 0 || !Number.isInteger(attemptCount) || attemptCount < 0 || attemptCount >= MAX_ATTEMPTS) return null;
  return Object.freeze({ reminderId, leaseAt, attemptCount });
}

async function processReminder(env, reminder, now, fetchImpl = fetch) {
  const result = await env.EON_IDENTITY_DB.prepare(`
    SELECT subscription_id, encrypted_subscription, encryption_iv
    FROM eon_push_subscriptions
    WHERE account_id=? AND disabled_at IS NULL
    ORDER BY updated_at DESC LIMIT 5
  `).bind(reminder.account_id).all();
  const subscriptions = Array.isArray(result?.results) ? result.results : [];
  let accepted = 0;
  let permanent = 0;
  let transient = 0;

  // Intentionally sequential inside one reminder. Queue consumer concurrency
  // provides horizontal throughput while this stays below Workers' simultaneous
  // outgoing-connection ceiling and avoids a burst of five upstream requests.
  for (const row of subscriptions) {
    try {
      const subscription = await openEonPushSubscription(row, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
      const pushed = await sendEonWebPush({
        subscription,
        env,
        fetchImpl,
        ttlSeconds: 15 * 60,
        payload: {
          title: 'Continue in EONAPP',
          body: 'Your one-time return reminder is ready.',
          tag: `eonapp-return-${String(reminder.reminder_id).slice(-16)}`,
          route: attributedReminderRoute(reminder.route || '/')
        }
      });
      if (pushed.ok) {
        // Do not write a D1 success heartbeat for every accepted Web Push.
        // Acceptance is not proof the person saw the notification, and avoiding
        // this hot-path write materially reduces cost at large notification volume.
        accepted += 1;
      } else {
        if (pushed.permanentFailure) permanent += 1; else transient += 1;
        await env.EON_IDENTITY_DB.prepare(`
          UPDATE eon_push_subscriptions
          SET last_failure_at=?, disabled_at=CASE WHEN ?=1 THEN ? ELSE disabled_at END
          WHERE subscription_id=?
        `).bind(now, pushed.permanentFailure ? 1 : 0, now, row.subscription_id).run();
      }
    } catch {
      transient += 1;
      await env.EON_IDENTITY_DB.prepare('UPDATE eon_push_subscriptions SET last_failure_at=? WHERE subscription_id=?').bind(now, row.subscription_id).run();
    }
  }

  const nextAttempts = Number(reminder.attempt_count || 0) + 1;
  if (accepted > 0) {
    // A delivered reminder has no product value after the queue consumer accepts
    // at least one Web Push. Delete it instead of retaining a terminal row so a
    // high-volume return loop cannot turn D1 into a 30-day notification graveyard.
    await env.EON_IDENTITY_DB.prepare(`
      DELETE FROM eon_push_reminders
      WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL
        AND attempt_count=? AND last_attempt_at=?
    `).bind(reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
    return { accepted, permanent, transient, delivered: true, cancelled: false, terminalRowPersisted: false };
  }

  const cancel = nextAttempts >= MAX_ATTEMPTS || subscriptions.length === 0;
  if (cancel) {
    await env.EON_IDENTITY_DB.prepare(`
      DELETE FROM eon_push_reminders
      WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL
        AND attempt_count=? AND last_attempt_at=?
    `).bind(reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
    return { accepted: 0, permanent, transient, delivered: false, cancelled: true, terminalRowPersisted: false };
  }

  await env.EON_IDENTITY_DB.prepare(`
    UPDATE eon_push_reminders
    SET attempt_count=?, last_attempt_at=?, updated_at=?
    WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL
      AND attempt_count=? AND last_attempt_at=?
  `).bind(nextAttempts, now, now, reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
  return { accepted: 0, permanent, transient, delivered: false, cancelled: false, terminalRowPersisted: false };
}

async function releaseLeases(env, reminderIds, leaseAt) {
  let released = 0;
  for (const ids of chunk(reminderIds, CLAIM_CHUNK_SIZE)) {
    if (!ids.length) continue;
    const placeholders = ids.map(() => '?').join(',');
    const result = await env.EON_IDENTITY_DB.prepare(`
      UPDATE eon_push_reminders SET last_attempt_at=NULL, updated_at=?
      WHERE reminder_id IN (${placeholders}) AND delivered_at IS NULL AND cancelled_at IS NULL AND last_attempt_at=?
    `).bind(leaseAt, ...ids, leaseAt).run();
    released += changes(result);
  }
  return released;
}

async function claimAndEnqueueDue(env, now) {
  if (!env?.EON_RETENTION_QUEUE?.sendBatch) return Object.freeze({ ok: false, reason: 'retention-queue-missing', scanned: 0, claimed: 0, queued: 0, queueFailures: 0, released: 0, skippedLeased: 0 });
  const leaseBefore = now - DELIVERY_LEASE_MS;
  const due = await env.EON_IDENTITY_DB.prepare(`
    SELECT reminder_id, attempt_count
    FROM eon_push_reminders
    WHERE delivered_at IS NULL AND cancelled_at IS NULL AND due_at<=? AND attempt_count<?
      AND (last_attempt_at IS NULL OR last_attempt_at<=?)
    ORDER BY due_at ASC LIMIT ?
  `).bind(now, MAX_ATTEMPTS, leaseBefore, MAX_REMINDERS_PER_SCAN).all();
  const rows = Array.isArray(due?.results) ? due.results : [];
  let claimed = 0;
  let queued = 0;
  let queueFailures = 0;
  let released = 0;

  for (const group of chunk(rows, CLAIM_CHUNK_SIZE)) {
    const ids = group.map((row) => String(row.reminder_id || '')).filter(Boolean);
    if (!ids.length) continue;
    const placeholders = ids.map(() => '?').join(',');
    await env.EON_IDENTITY_DB.prepare(`
      UPDATE eon_push_reminders SET last_attempt_at=?, updated_at=?
      WHERE reminder_id IN (${placeholders}) AND delivered_at IS NULL AND cancelled_at IS NULL AND attempt_count<?
        AND (last_attempt_at IS NULL OR last_attempt_at<=?)
    `).bind(now, now, ...ids, MAX_ATTEMPTS, leaseBefore).run();
    const leased = await env.EON_IDENTITY_DB.prepare(`
      SELECT reminder_id, attempt_count
      FROM eon_push_reminders
      WHERE reminder_id IN (${placeholders}) AND delivered_at IS NULL AND cancelled_at IS NULL AND last_attempt_at=?
      ORDER BY due_at ASC
    `).bind(...ids, now).all();
    const claimedRows = Array.isArray(leased?.results) ? leased.results : [];
    claimed += claimedRows.length;
    if (!claimedRows.length) continue;
    try {
      await env.EON_RETENTION_QUEUE.sendBatch(claimedRows.map((row) => ({
        body: { reminderId: row.reminder_id, leaseAt: now, attemptCount: Number(row.attempt_count || 0) },
        contentType: 'json'
      })));
      queued += claimedRows.length;
    } catch {
      queueFailures += claimedRows.length;
      released += await releaseLeases(env, claimedRows.map((row) => row.reminder_id), now);
    }
  }

  return Object.freeze({
    ok: queueFailures === 0,
    reason: queueFailures ? 'retention-queue-partial-failure' : 'retention-reminders-queued',
    scanned: rows.length,
    claimed,
    queued,
    queueFailures,
    released,
    skippedLeased: Math.max(0, rows.length - claimed),
    maxPerScan: MAX_REMINDERS_PER_SCAN,
    leaseMs: DELIVERY_LEASE_MS
  });
}

async function cleanupTerminalRows(env, now) {
  // New RT86 reminders are removed immediately when terminal. This bounded
  // sweep exists only for pre-RT86 terminal rows and stale disabled devices.
  if (new Date(now).getUTCMinutes() !== 7) return Object.freeze({ ran: false, remindersDeleted: 0, subscriptionsDeleted: 0, policiesDeleted: 0 });
  const cutoff = now - LEGACY_TERMINAL_RETENTION_MS;
  const reminders = await env.EON_IDENTITY_DB.prepare(`
    DELETE FROM eon_push_reminders WHERE reminder_id IN (
      SELECT reminder_id FROM eon_push_reminders
      WHERE (delivered_at IS NOT NULL OR cancelled_at IS NOT NULL) AND updated_at<=?
      ORDER BY updated_at ASC LIMIT ?
    )
  `).bind(cutoff, CLEANUP_BATCH_SIZE).run();
  const subscriptions = await env.EON_IDENTITY_DB.prepare(`
    DELETE FROM eon_push_subscriptions WHERE subscription_id IN (
      SELECT subscription_id FROM eon_push_subscriptions
      WHERE disabled_at IS NOT NULL AND updated_at<=?
      ORDER BY updated_at ASC LIMIT ?
    )
  `).bind(cutoff, CLEANUP_BATCH_SIZE).run();
  const policies = await env.EON_IDENTITY_DB.prepare(`
    DELETE FROM eon_push_reminder_daily_policy WHERE rowid IN (
      SELECT rowid FROM eon_push_reminder_daily_policy
      WHERE updated_at<=? ORDER BY updated_at ASC LIMIT ?
    )
  `).bind(now - EON_RETURN_REMINDER_POLICY_RETENTION_MS, CLEANUP_BATCH_SIZE).run();
  return Object.freeze({ ran: true, remindersDeleted: changes(reminders), subscriptionsDeleted: changes(subscriptions), policiesDeleted: changes(policies) });
}

export async function runEonRetentionNotificationCycle(env, { now = Date.now() } = {}) {
  const push = getEonWebPushConfig(env);
  if (!push.configured) return Object.freeze({ ok: true, reason: 'push-disabled-or-unconfigured', processed: 0, scanned: 0, claimed: 0, queued: 0, delivered: 0, failed: 0, skippedLeased: 0, marketingMessages: 0, customBodiesLoaded: 0 });
  if (!env?.EON_IDENTITY_DB?.prepare) return Object.freeze({ ok: false, reason: 'identity-db-missing', processed: 0, delivered: 0 });
  if (!env?.EON_RETENTION_QUEUE?.sendBatch) return Object.freeze({ ok: false, reason: 'retention-queue-missing', processed: 0, delivered: 0, marketingMessages: 0, customBodiesLoaded: 0 });
  const [delivery, cleanup] = await Promise.all([claimAndEnqueueDue(env, now), cleanupTerminalRows(env, now)]);
  return Object.freeze({ ...delivery, processed: delivery.scanned, delivered: 0, failed: delivery.queueFailures, cleanup, marketingMessages: 0, customBodiesLoaded: 0 });
}

async function processQueueMessage(env, message, now, fetchImpl) {
  const body = validReminderMessage(message?.body);
  if (!body) return Object.freeze({ ack: true, reason: 'invalid-retention-message', delivered: false, failed: false });
  const reminder = await env.EON_IDENTITY_DB.prepare(`
    SELECT reminder_id, account_id, route, due_at, attempt_count, last_attempt_at,
      quiet_hours_enabled, quiet_start_minute, quiet_end_minute, timezone_offset_minutes, expires_at
    FROM eon_push_reminders
    WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL AND attempt_count=? AND last_attempt_at=?
    LIMIT 1
  `).bind(body.reminderId, body.attemptCount, body.leaseAt).first();
  if (!reminder?.reminder_id) return Object.freeze({ ack: true, reason: 'stale-or-complete-retention-message', delivered: false, failed: false });
  const expiresAt = Number(reminder.expires_at || 0);
  if (expiresAt > 0 && expiresAt <= now) {
    await env.EON_IDENTITY_DB.prepare(`
      DELETE FROM eon_push_reminders
      WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL AND attempt_count=? AND last_attempt_at=?
    `).bind(reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
    return Object.freeze({ ack: true, reason: 'retention-reminder-expired', delivered: false, failed: false, expired: true });
  }
  if (isReminderQuietAt(reminder, now)) {
    const nextDueAt = nextReminderQuietEndAt(reminder, now);
    if (expiresAt > 0 && nextDueAt >= expiresAt) {
      await env.EON_IDENTITY_DB.prepare(`
        DELETE FROM eon_push_reminders
        WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL AND attempt_count=? AND last_attempt_at=?
      `).bind(reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
      return Object.freeze({ ack: true, reason: 'retention-reminder-expired-in-quiet-hours', delivered: false, failed: false, expired: true });
    }
    await env.EON_IDENTITY_DB.prepare(`
      UPDATE eon_push_reminders SET due_at=?, last_attempt_at=NULL, updated_at=?
      WHERE reminder_id=? AND delivered_at IS NULL AND cancelled_at IS NULL AND attempt_count=? AND last_attempt_at=?
    `).bind(nextDueAt, now, reminder.reminder_id, reminder.attempt_count, reminder.last_attempt_at).run();
    return Object.freeze({ ack: true, reason: 'retention-reminder-deferred-quiet-hours', delivered: false, failed: false, deferredQuietHours: true, nextDueAt });
  }
  const result = await processReminder(env, reminder, now, fetchImpl);
  return Object.freeze({ ack: true, reason: result.delivered ? 'retention-push-accepted' : (result.cancelled ? 'retention-reminder-terminal' : 'retention-reminder-retry-later'), delivered: result.delivered, failed: !result.delivered, ...result });
}

async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next; next += 1;
      results[index] = await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, () => worker()));
  return results;
}

export async function runEonRetentionNotificationQueueBatch(env, batch, { now = Date.now(), fetchImpl = fetch } = {}) {
  const messages = Array.isArray(batch?.messages) ? batch.messages : [];
  const push = getEonWebPushConfig(env);
  if (!push.configured) {
    for (const message of messages) message?.ack?.();
    return Object.freeze({ ok: true, reason: 'push-disabled-or-unconfigured', processed: messages.length, delivered: 0, failed: 0, retried: 0, marketingMessages: 0, customBodiesLoaded: 0 });
  }
  if (!env?.EON_IDENTITY_DB?.prepare) {
    for (const message of messages) message?.retry?.({ delaySeconds: 60 });
    return Object.freeze({ ok: false, reason: 'identity-db-missing', processed: messages.length, delivered: 0, failed: messages.length, retried: messages.length, marketingMessages: 0, customBodiesLoaded: 0 });
  }

  let retried = 0;
  const results = await mapWithConcurrency(messages, MAX_CONCURRENT_REMINDERS_PER_CONSUMER, async (message) => {
    try {
      const result = await processQueueMessage(env, message, now, fetchImpl);
      message?.ack?.();
      return result;
    } catch {
      retried += 1;
      const attempts = Math.max(1, Number(message?.attempts || 1));
      message?.retry?.({ delaySeconds: Math.min(15 * 60, 30 * (2 ** Math.min(5, attempts - 1))) });
      return Object.freeze({ ack: false, reason: 'retention-consumer-internal-error', delivered: false, failed: true });
    }
  });
  const delivered = results.filter((row) => row?.delivered).length;
  const failed = results.filter((row) => row?.failed).length;
  return Object.freeze({ ok: retried === 0, reason: retried ? 'retention-consumer-partial-retry' : 'retention-consumer-complete', processed: messages.length, delivered, failed, retried, concurrency: MAX_CONCURRENT_REMINDERS_PER_CONSUMER, marketingMessages: 0, customBodiesLoaded: 0 });
}

export function getEonRetentionNotificationScaleTruth() {
  return Object.freeze({
    schema: 'eonapp.retention-notification-scale.rt86.v1',
    deliveryArchitecture: 'd1-due-index-to-cloudflare-queue-to-web-push',
    maxRemindersPerMinuteScan: MAX_REMINDERS_PER_SCAN,
    theoreticalReminderReleasePerDay: MAX_REMINDERS_PER_SCAN * 24 * 60,
    queueConsumerConcurrencyPerInvocation: MAX_CONCURRENT_REMINDERS_PER_CONSUMER,
    maxActiveDevicesPerAccount: 5,
    successHeartbeatWritePerPush: false,
    terminalReminderRowsPersisted: false,
    legacyTerminalCleanupDays: 7,
    disabledSubscriptionCleanupDays: 7,
    queueBatchSize: 50,
    claimChunkSize: CLAIM_CHUNK_SIZE,
    maxD1QueriesPerQueueBatchUpperBound: 400,
    automaticMarketing: false,
    explicitReminderOnly: true,
    serverQuietHoursEnforced: true,
    staleReminderExpiryHours: 24,
    freshReminderScheduleCapPerUtcDay: 3,
    reminderAttribution: 'generic-nonunique-utm-to-product-activity'
  });
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runEonRetentionNotificationCycle(env, { now: Number(controller?.scheduledTime || Date.now()) }));
  },
  async queue(batch, env, ctx) {
    ctx.waitUntil(runEonRetentionNotificationQueueBatch(env, batch, { now: Date.now() }));
  }
};

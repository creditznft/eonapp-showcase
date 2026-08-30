/** Institutional AI V2 / RT92 — explicit, generic, one-time return reminder scheduling. */
import { clearSessionCookie, enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { getEonWebPushConfig } from '../../_shared/eon-web-push.js';
import {
  EON_RETURN_REMINDER_EXPIRY_AFTER_DUE_MS,
  EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY,
  normalizeReminderQuietHours,
  reminderRoutePathOnly,
  utcDayStartedAt
} from '../../_shared/eon-notification-reminder-policy.js';
import { isEonNotificationRouteAllowed, normalizeEonNotificationRoute } from '../../../config/eon-notification-route-authority.mjs';

const CONSENT = 'service-return-reminder-v1';
const MIN_DELAY = 5 * 60 * 1000;
const MAX_DELAY = 30 * 24 * 60 * 60 * 1000;
const clean = (value = '', max = 240) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const changes = (result) => Number(result?.meta?.changes || result?.changes || 0);

function safeRoute(value = '/') {
  const raw = clean(value, 300) || '/';
  if (!isEonNotificationRouteAllowed(raw)) return '';
  return reminderRoutePathOnly(normalizeEonNotificationRoute(raw));
}
async function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return `rem_${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const identity = getIdentityConfig(request, env);
  if (!identity.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503);
  if (!enforceSameOriginMutation(request, identity)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  const parsed = await readBoundedJson(request, { maxBytes: 3072 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const session = await readSession(identity, request);
  if (!session) return jsonResponse({ ok: false, error: 'sign_in_required' }, 401, { 'set-cookie': clearSessionCookie() });
  if (!getEonWebPushConfig(env).configured) return jsonResponse({ ok: false, error: 'background_push_not_configured' }, 503);
  if (clean(parsed.value?.consent, 64) !== CONSENT) return jsonResponse({ ok: false, error: 'explicit_reminder_consent_required' }, 400);
  const route = safeRoute(parsed.value?.route || '/');
  if (!route) return jsonResponse({ ok: false, error: 'internal_route_required' }, 400);
  const dueAt = Math.floor(Number(parsed.value?.dueAt || 0));
  const now = Date.now();
  if (!Number.isFinite(dueAt) || dueAt < now + MIN_DELAY || dueAt > now + MAX_DELAY) return jsonResponse({ ok: false, error: 'reminder_due_time_out_of_range' }, 400);
  const active = await identity.database.prepare('SELECT subscription_id FROM eon_push_subscriptions WHERE account_id=? AND disabled_at IS NULL LIMIT 1').bind(session.accountId).first();
  if (!active?.subscription_id) return jsonResponse({ ok: false, error: 'background_push_subscription_required' }, 409);

  const pending = await identity.database.prepare(`
    SELECT reminder_id FROM eon_push_reminders
    WHERE account_id=? AND delivered_at IS NULL AND cancelled_at IS NULL
    LIMIT 1
  `).bind(session.accountId).first();
  const replacedExisting = Boolean(pending?.reminder_id);
  const dayStartedAt = utcDayStartedAt(now);
  if (!replacedExisting) {
    const policy = await identity.database.prepare(`
      INSERT INTO eon_push_reminder_daily_policy
        (account_id, day_started_at, kind, scheduled_count, last_scheduled_at, updated_at)
      VALUES (?, ?, 'return-reminder', 1, ?, ?)
      ON CONFLICT(account_id, day_started_at, kind) DO UPDATE SET
        scheduled_count=eon_push_reminder_daily_policy.scheduled_count + 1,
        last_scheduled_at=excluded.last_scheduled_at,
        updated_at=excluded.updated_at
      WHERE eon_push_reminder_daily_policy.scheduled_count < ?
    `).bind(session.accountId, dayStartedAt, now, now, EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY).run();
    if (changes(policy) !== 1) return jsonResponse({ ok: false, error: 'return_reminder_daily_cap_reached', maxNewPerUtcDay: EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY }, 429);
  }

  const quiet = normalizeReminderQuietHours({
    ...(parsed.value?.quietHours || {}),
    timezoneOffsetMinutes: parsed.value?.timezoneOffsetMinutes
  });
  const expiresAt = dueAt + EON_RETURN_REMINDER_EXPIRY_AFTER_DUE_MS;
  const reminderId = await randomId();
  const results = await identity.database.batch([
    identity.database.prepare(`
      DELETE FROM eon_push_reminders
      WHERE account_id=? AND delivered_at IS NULL AND cancelled_at IS NULL
    `).bind(session.accountId),
    identity.database.prepare(`
      INSERT INTO eon_push_reminders (
        reminder_id, account_id, kind, route, due_at, consent_version, created_at, updated_at, attempt_count,
        quiet_hours_enabled, quiet_start_minute, quiet_end_minute, timezone_offset_minutes, expires_at
      ) VALUES (?, ?, 'return-reminder', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
    `).bind(
      reminderId, session.accountId, route, dueAt, CONSENT, now, now,
      quiet.enabled ? 1 : 0, quiet.startMinute, quiet.endMinute, quiet.timezoneOffsetMinutes, expiresAt
    )
  ]);
  const cancelled = results?.[0];
  return jsonResponse({
    ok: true,
    reminderId,
    dueAt,
    expiresAt,
    route,
    oneTime: true,
    replacedExisting: replacedExisting || changes(cancelled) > 0,
    quietHoursEnforced: quiet.enabled,
    maxNewPerUtcDay: EON_RETURN_REMINDER_MAX_NEW_PER_UTC_DAY,
    customContentStored: false,
    marketingConsentImplied: false
  });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const identity = getIdentityConfig(request, env);
  if (!identity.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503);
  if (!enforceSameOriginMutation(request, identity)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  const parsed = await readBoundedJson(request, { maxBytes: 2048 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const session = await readSession(identity, request);
  if (!session) return jsonResponse({ ok: false, error: 'sign_in_required' }, 401, { 'set-cookie': clearSessionCookie() });
  const reminderId = clean(parsed.value?.reminderId, 120);
  if (!/^rem_[A-Za-z0-9_-]{20,80}$/.test(reminderId)) return jsonResponse({ ok: false, error: 'reminder_id_invalid' }, 400);
  const result = await identity.database.prepare(`DELETE FROM eon_push_reminders WHERE reminder_id=? AND account_id=? AND delivered_at IS NULL AND cancelled_at IS NULL`).bind(reminderId, session.accountId).run();
  return jsonResponse({ ok: true, cancelled: changes(result) > 0 });
}

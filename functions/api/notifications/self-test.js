/** Institutional AI V2 — owner/user initiated push proof to this signed-in account only. */
import {
  clearSessionCookie,
  enforceSameOriginMutation,
  getIdentityConfig,
  jsonResponse,
  readSession
} from '../../_shared/eon-auth.js';
import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { getEonWebPushConfig, openEonPushSubscription, sendEonWebPush } from '../../_shared/eon-web-push.js';

const clean = (value = '', max = 120) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);

export async function onRequestPost(context) {
  const { request, env } = context;
  const identity = getIdentityConfig(request, env);
  if (!identity.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503);
  if (!enforceSameOriginMutation(request, identity)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  const parsed = await readBoundedJson(request, { maxBytes: 2048 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  if (clean(parsed.value?.confirm, 64) !== 'SEND_DEVICE_ALERT_TEST') return jsonResponse({ ok: false, error: 'explicit_confirmation_required' }, 400);
  const session = await readSession(identity, request);
  if (!session) return jsonResponse({ ok: false, error: 'sign_in_required' }, 401, { 'set-cookie': clearSessionCookie() });
  const push = getEonWebPushConfig(env);
  if (!push.configured) return jsonResponse({ ok: false, error: 'background_push_not_configured' }, 503);

  const now = Date.now();
  const recent = await identity.database.prepare(`
    SELECT MAX(CASE
      WHEN COALESCE(last_success_at, 0) >= COALESCE(last_failure_at, 0) THEN COALESCE(last_success_at, 0)
      ELSE COALESCE(last_failure_at, 0)
    END) AS last_attempt_at
    FROM eon_push_subscriptions
    WHERE account_id=? AND disabled_at IS NULL
  `).bind(session.accountId).first();
  if (Number(recent?.last_attempt_at || 0) > now - 30_000) return jsonResponse({ ok: false, error: 'push_test_rate_limited', retryAfterSeconds: 30 }, 429);

  const rows = await identity.database.prepare(`
    SELECT subscription_id, encrypted_subscription, encryption_iv
    FROM eon_push_subscriptions
    WHERE account_id=? AND disabled_at IS NULL
    ORDER BY updated_at DESC LIMIT 5
  `).bind(session.accountId).all();
  const subscriptions = Array.isArray(rows?.results) ? rows.results : [];
  if (!subscriptions.length) return jsonResponse({ ok: false, error: 'no_active_push_subscription' }, 409);

  let accepted = 0;
  let failed = 0;
  let disabled = 0;
  for (const row of subscriptions) {
    try {
      const subscription = await openEonPushSubscription(row, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
      const result = await sendEonWebPush({
        subscription,
        env,
        payload: { title: 'EONAPP device alerts are working', body: 'Background Web Push reached this device.', tag: 'eonapp-device-alert-test', route: '/' },
        ttlSeconds: 60
      });
      if (result.ok) {
        accepted += 1;
        await identity.database.prepare('UPDATE eon_push_subscriptions SET last_success_at=?, last_failure_at=NULL WHERE subscription_id=? AND account_id=?').bind(now, row.subscription_id, session.accountId).run();
      } else {
        failed += 1;
        const disabledAt = result.permanentFailure ? now : null;
        if (disabledAt) disabled += 1;
        await identity.database.prepare('UPDATE eon_push_subscriptions SET last_failure_at=?, disabled_at=COALESCE(?, disabled_at) WHERE subscription_id=? AND account_id=?').bind(now, disabledAt, row.subscription_id, session.accountId).run();
      }
    } catch {
      failed += 1;
      await identity.database.prepare('UPDATE eon_push_subscriptions SET last_failure_at=? WHERE subscription_id=? AND account_id=?').bind(now, row.subscription_id, session.accountId).run();
    }
  }
  const ok = accepted > 0;
  return jsonResponse({ ok, accepted, failed, disabled, deviceCount: subscriptions.length, deliveryClaim: ok ? 'push-service-accepted' : 'not-delivered' }, ok ? 200 : 502);
}

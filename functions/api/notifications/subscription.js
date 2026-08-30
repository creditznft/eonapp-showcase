/** Institutional AI V2 — explicit, same-origin Web Push subscription enrollment. */
import {
  clearSessionCookie,
  enforceSameOriginMutation,
  getIdentityConfig,
  jsonResponse,
  readSession
} from '../../_shared/eon-auth.js';
import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { readAccountEntitlement } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { pruneEonPushSubscriptionsToPolicy, resolveEonPushDevicePolicy } from '../../_shared/eon-push-device-policy.js';
import { fingerprintEonPushSubscriptionEndpoint, getEonWebPushConfig, normalizeEonPushSubscription, sealEonPushSubscription } from '../../_shared/eon-web-push.js';

const MAX_BODY = 12 * 1024;
const CONSENT = 'service-device-alerts-v1';
const clean = (value = '', max = 160) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);

export async function onRequestPost(context) {
  const { request, env } = context;
  const identity = getIdentityConfig(request, env);
  if (!identity.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503);
  if (!enforceSameOriginMutation(request, identity)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  const parsed = await readBoundedJson(request, { maxBytes: MAX_BODY });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const session = await readSession(identity, request);
  if (!session) return jsonResponse({ ok: false, error: 'sign_in_required' }, 401, { 'set-cookie': clearSessionCookie() });
  const push = getEonWebPushConfig(env);
  if (!push.configured) return jsonResponse({ ok: false, error: 'background_push_not_configured' }, 503);
  if (clean(parsed.value?.consent, 64) !== CONSENT) return jsonResponse({ ok: false, error: 'explicit_push_consent_required' }, 400);

  try {
    const subscription = normalizeEonPushSubscription(parsed.value?.subscription || {});
    const sealed = await sealEonPushSubscription(subscription, env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY);
    const subscriptionId = `push_${sealed.endpointHash.slice(0, 40)}`;
    const now = Date.now();
    await identity.database.prepare(`
      INSERT INTO eon_push_subscriptions (
        subscription_id, account_id, endpoint_hash, encrypted_subscription, encryption_iv,
        consent_version, created_at, updated_at, last_success_at, last_failure_at, disabled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
      ON CONFLICT(endpoint_hash) DO UPDATE SET
        subscription_id=excluded.subscription_id,
        account_id=excluded.account_id,
        encrypted_subscription=excluded.encrypted_subscription,
        encryption_iv=excluded.encryption_iv,
        consent_version=excluded.consent_version,
        updated_at=excluded.updated_at,
        disabled_at=NULL
    `).bind(
      subscriptionId, session.accountId, sealed.endpointHash, sealed.encryptedSubscription,
      sealed.encryptionIv, CONSENT, now, now
    ).run();
    let entitlement = null;
    let devicePolicy = resolveEonPushDevicePolicy(null);
    if (env.EON_BILLING_DB?.prepare) {
      try {
        entitlement = await readAccountEntitlement(env.EON_BILLING_DB, session.accountId);
        devicePolicy = resolveEonPushDevicePolicy(entitlement);
      } catch {
        devicePolicy = resolveEonPushDevicePolicy(null);
      }
    }
    const pruned = await pruneEonPushSubscriptionsToPolicy(identity.database, session.accountId, devicePolicy, now);
    return jsonResponse({
      ok: true,
      subscriptionId,
      serviceNotificationsOnly: true,
      marketingConsentImplied: false,
      maxActiveDevices: devicePolicy.maxActiveDevices,
      deviceTier: devicePolicy.effectiveDeviceTier,
      entitlementStatus: devicePolicy.entitlementStatus,
      entitlementLedgerAvailable: Boolean(env.EON_BILLING_DB?.prepare),
      serverAuthoritativeDeviceLimit: true,
      olderDevicesDisabled: pruned.olderDevicesDisabled
    });
  } catch (error) {
    const code = clean(error?.message, 100);
    const clientError = /^(?:push_endpoint_not_allowed|push_subscription_key_length_invalid|push_expiration_invalid|invalid_base64url)$/.test(code);
    return jsonResponse({ ok: false, error: clientError ? code : 'push_subscription_store_failed' }, clientError ? 400 : 503);
  }
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
  const subscriptionId = clean(parsed.value?.subscriptionId, 120);
  let endpointHash = '';
  if (parsed.value?.subscription) {
    try { endpointHash = await fingerprintEonPushSubscriptionEndpoint(parsed.value.subscription); }
    catch (error) {
      const code = clean(error?.message, 100);
      return jsonResponse({ ok: false, error: /^(?:push_endpoint_not_allowed|push_subscription_key_length_invalid|push_expiration_invalid|invalid_base64url)$/.test(code) ? code : 'push_subscription_invalid' }, 400);
    }
  }
  if (!/^push_[A-Za-z0-9_-]{20,80}$/.test(subscriptionId) && !endpointHash) return jsonResponse({ ok: false, error: 'subscription_identity_required' }, 400);
  const now = Date.now();
  const result = subscriptionId && /^push_[A-Za-z0-9_-]{20,80}$/.test(subscriptionId)
    ? await identity.database.prepare(`
      UPDATE eon_push_subscriptions SET disabled_at=?, updated_at=?
      WHERE subscription_id=? AND account_id=? AND disabled_at IS NULL
    `).bind(now, now, subscriptionId, session.accountId).run()
    : await identity.database.prepare(`
      UPDATE eon_push_subscriptions SET disabled_at=?, updated_at=?
      WHERE endpoint_hash=? AND account_id=? AND disabled_at IS NULL
    `).bind(now, now, endpointHash, session.accountId).run();
  return jsonResponse({ ok: true, disabled: Number(result?.meta?.changes || result?.changes || 0) > 0, endpointFallbackUsed: !subscriptionId && Boolean(endpointHash) });
}

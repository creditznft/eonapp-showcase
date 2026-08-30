/** RT87 — server-authoritative Web Push device allowance from Dodo entitlement truth. */
export const EON_PUSH_DEVICE_LIMITS = Object.freeze({
  free: 1,
  trial: 1,
  plus: 2,
  studio: 3,
  power: 4,
  max: 5
});

const PAID_MULTI_DEVICE_STATUSES = new Set(['active', 'cancelling']);
const PAID_TIERS = new Set(['plus', 'studio', 'power', 'max', 'pro', 'ultra']);

const clean = (value = '', max = 64) => String(value || '').trim().toLowerCase().slice(0, max);

export function resolveEonPushDevicePolicy(entitlement = null) {
  const tierId = clean(entitlement?.tier_id || entitlement?.tierId || 'free', 24);
  const status = clean(entitlement?.status || 'free', 32);
  const paidTier = PAID_TIERS.has(tierId);
  const paidMultiDevice = paidTier && PAID_MULTI_DEVICE_STATUSES.has(status);
  const effectiveTier = paidMultiDevice ? tierId : 'free';
  const deviceLimitTier = ['pro', 'ultra'].includes(tierId) ? 'max' : tierId;
  const maxActiveDevices = paidMultiDevice ? EON_PUSH_DEVICE_LIMITS[deviceLimitTier] : EON_PUSH_DEVICE_LIMITS.free;
  return Object.freeze({
    schema: 'eonapp.push-device-entitlement.rt87.v1',
    tierId: paidTier ? tierId : 'free',
    entitlementStatus: status || 'free',
    effectiveDeviceTier: effectiveTier,
    maxActiveDevices,
    serverAuthoritative: true,
    trialMultiDeviceAllowed: false,
    graceMultiDeviceAllowed: false,
    browserOverrideAllowed: false
  });
}

export async function pruneEonPushSubscriptionsToPolicy(database, accountId = '', policy = resolveEonPushDevicePolicy(), now = Date.now()) {
  if (!database?.prepare) throw new Error('identity_db_missing');
  const account = String(accountId || '').trim().slice(0, 80);
  if (!account) throw new Error('account_id_missing');
  const limit = Math.min(EON_PUSH_DEVICE_LIMITS.max, Math.max(1, Number(policy?.maxActiveDevices || 1)));
  const result = await database.prepare(`
    UPDATE eon_push_subscriptions SET disabled_at=?, updated_at=?
    WHERE account_id=? AND disabled_at IS NULL AND subscription_id NOT IN (
      SELECT subscription_id FROM eon_push_subscriptions
      WHERE account_id=? AND disabled_at IS NULL
      ORDER BY updated_at DESC LIMIT ?
    )
  `).bind(now, now, account, account, limit).run();
  return Object.freeze({
    ok: true,
    maxActiveDevices: limit,
    olderDevicesDisabled: Number(result?.meta?.changes || result?.changes || 0)
  });
}

export function getEonPushDeviceEntitlementTruth() {
  return Object.freeze({
    schema: 'eonapp.push-device-entitlement.rt87.v1',
    limits: EON_PUSH_DEVICE_LIMITS,
    paidMultiDeviceStatuses: Object.freeze([...PAID_MULTI_DEVICE_STATUSES]),
    freeAndTrialDevices: 1,
    downgradePrunesNewestFirst: true,
    browserOverrideAllowed: false
  });
}

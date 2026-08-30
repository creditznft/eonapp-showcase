import { getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { readAccountBillingLifecycle, readAccountEntitlement } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { readAccountActiveEonKeyUnlocks, resolveReferralDatabase } from '../../../assets/js/referrals/eon-referral-server-runtime.js';
import { buildEffectiveCapabilitySnapshot, signCapabilitySnapshot } from '../../../assets/js/capabilities/eon-capability-service.js';
import { readAccountActiveSoftwareGrants } from '../../../assets/js/billing/eon-premium-software-grant-ledger.js';

export async function onRequestGet(context) {
  try {
    const config = getIdentityConfig(context.request, context.env);
    const session = await readSession(config, context.request);
    const accountId = session?.accountId || '';
    if (accountId && !context.env.EON_BILLING_DB?.prepare) {
      return jsonResponse({ ok: false, schema: 'eonapp.capability-envelope.a15.v1', reason: 'capability-ledger-unavailable', freeFallbackRequired: true }, 503, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
    }
    const referralDatabase = resolveReferralDatabase(context.env).database;
    const [entitlement, lifecycle, unlocks, softwareGrants] = accountId
      ? await Promise.all([
        readAccountEntitlement(context.env.EON_BILLING_DB, accountId),
        readAccountBillingLifecycle(context.env.EON_BILLING_DB, accountId),
        readAccountActiveEonKeyUnlocks({ database: referralDatabase, accountId }),
        readAccountActiveSoftwareGrants(context.env.EON_BILLING_DB, accountId)
      ])
      : [null, null, [], []];
    const snapshot = buildEffectiveCapabilitySnapshot({ accountId, entitlement, lifecycle, unlocks, softwareGrants, source: 'cloudflare-pages-functions' });
    const envelope = await signCapabilitySnapshot(snapshot, context.env.EON_ENTITLEMENT_SIGNING_KEY || '');
    if (!envelope.ok) return jsonResponse({ ok: false, schema: envelope.schema || 'eonapp.capability-envelope.a15.v1', reason: envelope.reason, freeFallbackRequired: true }, 503, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
    return jsonResponse(envelope, 200, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
  } catch {
    return jsonResponse({ ok: false, schema: 'eonapp.capability-envelope.a15.v1', reason: 'capability-ledger-read-failed', freeFallbackRequired: true }, 503, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
  }
}

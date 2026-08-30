import { getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { buildReferralPublicStatus, readReferralAccountStatus, resolveReferralDatabase } from '../../../assets/js/referrals/eon-referral-server-runtime.js';

export async function onRequestGet(context) {
  const identity = getIdentityConfig(context.request, context.env);
  const session = identity.configured ? await readSession(identity, context.request) : null;
  const status = buildReferralPublicStatus(context.env);
  let account = null;
  if (status.active && session?.accountId) {
    try {
      account = (await readReferralAccountStatus({ database: resolveReferralDatabase(context.env).database, accountId: session.accountId })).account;
    } catch {
      return jsonResponse({ ...status, ok: false, signedIn: true, account: null, error: 'referral_status_unavailable' }, 503, { 'cache-control': 'no-store, max-age=0' });
    }
  }
  return jsonResponse({
    ...status,
    signedIn: Boolean(session?.accountId),
    account,
    message: status.active
      ? 'The minimal referral ledger is active. Signed links stay stateless; only verified account associations, useful milestones, grants, reversals and unlocks are stored.'
      : 'Sharing is active. EONKEY grants remain disabled until EON_REFERRAL_ROLLOUT requires the dedicated EON_REFERRALS_DB binding (or temporary billing fallback).'
  }, 200, { 'cache-control': 'no-store, max-age=0' });
}

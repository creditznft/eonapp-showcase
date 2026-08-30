import { jsonResponse } from '../../_shared/eon-auth.js';
import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { readRewardCenterStatus, redeemRewardUnlock } from './_ledger.js';
import { requireRewardSession } from './_auth.js';

export async function onRequestGet(context) {
  const auth = await requireRewardSession(context);
  if (auth.response) return auth.response;
  const result = await readRewardCenterStatus({ env: context.env, accountId: auth.session.accountId });
  return jsonResponse(result, result.ok ? 200 : 503);
}

export async function onRequestPost(context) {
  const auth = await requireRewardSession(context, { mutation: true });
  if (auth.response) return auth.response;
  const parsed = await readBoundedJson(context.request, { maxBytes: 2048 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const action = String(parsed.value?.action || '').trim().toLowerCase();
  if (action !== 'redeem') return jsonResponse({ ok: false, error: 'unsupported_reward_action' }, 400);
  if (context.env.EON_REFERRAL_RATE_LIMITER?.limit) {
    const limited = await context.env.EON_REFERRAL_RATE_LIMITER.limit({ key: `${auth.session.accountId}:reward-redeem` });
    if (!limited?.success) return jsonResponse({ ok: false, error: 'rate_limited', retryable: true }, 429);
  }
  const result = await redeemRewardUnlock({ env: context.env, accountId: auth.session.accountId, unlockId: parsed.value?.unlockId });
  const status = result.ok ? 200 : (result.status === 'insufficient_eonkeys' || result.status === 'reward_debt_outstanding' ? 409 : 400);
  return jsonResponse(result, status);
}

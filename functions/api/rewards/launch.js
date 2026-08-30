import { jsonResponse } from '../../_shared/eon-auth.js';
import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { launchMyLeadMission } from './_ledger.js';
import { requireRewardSession } from './_auth.js';

export async function onRequestPost(context) {
  const auth = await requireRewardSession(context, { mutation: true });
  if (auth.response) return auth.response;
  const parsed = await readBoundedJson(context.request, { maxBytes: 2048 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const provider = String(parsed.value?.provider || 'mylead').trim().toLowerCase();
  if (provider !== 'mylead') return jsonResponse({ ok: false, error: 'reward_provider_not_supported' }, 400);
  if (context.env.EON_REFERRAL_RATE_LIMITER?.limit) {
    const limited = await context.env.EON_REFERRAL_RATE_LIMITER.limit({ key: `${auth.session.accountId}:reward-launch` });
    if (!limited?.success) return jsonResponse({ ok: false, error: 'rate_limited', retryable: true }, 429);
  }
  const result = await launchMyLeadMission({
    env: context.env,
    accountId: auth.session.accountId,
    surface: parsed.value?.surface || 'rewards'
  });
  const status = result.ok ? 201 : (result.status === 'sign_in_required' ? 401 : result.status === 'mylead_not_configured' ? 503 : 409);
  return jsonResponse(result, status);
}

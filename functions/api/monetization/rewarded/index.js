import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../../_shared/eon-auth.js';
import { readBoundedJson } from '../../../_shared/eon-request-security.js';
import { readRewardedSponsorAccountStatus, redeemSponsorUnlock, startRewardedSponsorSession } from '../../../_shared/eon-rewarded-sponsor-runtime.js';
import { recordGrowthOperationalEvent } from '../../../_shared/eon-growth-attribution.js';

async function signedIn(context, mutation = false) {
  const identity = getIdentityConfig(context.request, context.env);
  if (!identity.configured) return { response: jsonResponse({ ok: false, error: 'identity_unavailable' }, 503) };
  if (mutation && !enforceSameOriginMutation(context.request, identity)) return { response: jsonResponse({ ok: false, error: 'same_origin_required' }, 403) };
  const session = await readSession(identity, context.request);
  if (!session?.accountId) return { response: jsonResponse({ ok: false, error: 'sign_in_required' }, 401) };
  return { identity, session };
}

export async function onRequestGet(context) {
  const auth = await signedIn(context, false);
  if (auth.response) return auth.response;
  const url = new URL(context.request.url);
  const result = await readRewardedSponsorAccountStatus({ env: context.env, accountId: auth.session.accountId, sessionId: url.searchParams.get('session') || '' });
  return jsonResponse(result, result.ok ? 200 : 503);
}

export async function onRequestPost(context) {
  const auth = await signedIn(context, true);
  if (auth.response) return auth.response;
  const parsed = await readBoundedJson(context.request, { maxBytes: 4096 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const action = String(parsed.value?.action || '').trim().toLowerCase();
  if (action === 'start') {
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_session_requested', context.request, context.env);
    const origin = new URL(context.request.url).origin;
    const result = await startRewardedSponsorSession({ env: context.env, accountId: auth.session.accountId, surface: parsed.value.surface, worldId: parsed.value.worldId, requestOrigin: origin });
    if (result.ok) await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_session_started', context.request, context.env);
    else if (result.status === 'rewarded_runtime_unavailable') await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'rewarded_provider_error', context.request, context.env);
    return jsonResponse(result, result.ok ? 200 : (result.status === 'daily_cap_reached' || result.status === 'cooldown_active' ? 429 : 503));
  }
  if (action === 'redeem') {
    const result = await redeemSponsorUnlock({ env: context.env, accountId: auth.session.accountId, unlockId: parsed.value.unlockId });
    return jsonResponse(result, result.ok ? 200 : 409);
  }
  return jsonResponse({ ok: false, error: 'unsupported_reward_action' }, 400);
}

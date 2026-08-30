import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';
import { createDodoCheckoutSession } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { createPremiumDodoCheckoutSession } from '../../../assets/js/billing/eon-premium-dodo-runtime.js';

export async function onRequestPost(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!enforceSameOriginMutation(context.request, config)) return jsonResponse({ ok: false, error: 'same_origin_required' }, 403);
  const session = await readSession(config, context.request);
  if (!session?.accountId) return jsonResponse({ ok: false, error: 'login_required', loginUrl: '/api/auth/google/start?returnTo=/billing' }, 401);
  const parsed = await readBoundedJson(context.request, { maxBytes: EON_REQUEST_LIMITS.billingMutation });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  const requestedTier = String(parsed.value?.tier || parsed.value?.tierId || '').trim().toLowerCase();
  const result = requestedTier === 'ultimate'
    ? await createPremiumDodoCheckoutSession({ request: context.request, env: context.env, accountId: session.accountId, input: parsed.value })
    : await createDodoCheckoutSession({ request: context.request, env: context.env, accountId: session.accountId, input: parsed.value });
  const conflict = ['existing_subscription_use_plan_change', 'idempotency_conflict'].includes(result.status);
  const pending = ['account_pending_command', 'duplicate_command'].includes(result.status);
  return jsonResponse(result, result.ok ? 200 : conflict ? 409 : pending ? 202 : (result.status === 'invalid_request' ? 400 : (result.status === 'rate_limited' ? 429 : 503)), { 'cache-control': 'no-store, max-age=0' });
}

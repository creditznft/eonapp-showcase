import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { readAccountEntitlement } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { createDodoCustomerPortal } from '../../../assets/js/billing/eon-dodo-customer-actions.js';

export async function onRequestPost(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!enforceSameOriginMutation(context.request, config)) return jsonResponse({ ok: false, error: 'same_origin_required' }, 403);
  const session = await readSession(config, context.request);
  if (!session?.accountId) return jsonResponse({ ok: false, error: 'login_required', loginUrl: '/api/auth/google/start?returnTo=/billing' }, 401);
  const entitlement = await readAccountEntitlement(context.env.EON_BILLING_DB, session.accountId);
  const result = await createDodoCustomerPortal({ request: context.request, env: context.env, entitlement });
  return jsonResponse(result, result.ok ? 200 : (result.status === 'invalid_request' ? 409 : 503), { 'cache-control': 'no-store, max-age=0' });
}

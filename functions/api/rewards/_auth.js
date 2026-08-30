import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';

export async function requireRewardSession(context, { mutation = false } = {}) {
  const identity = getIdentityConfig(context.request, context.env);
  if (!identity.configured) return { response: jsonResponse({ ok: false, error: 'identity_unavailable' }, 503) };
  if (mutation && !enforceSameOriginMutation(context.request, identity)) return { response: jsonResponse({ ok: false, error: 'same_origin_required' }, 403) };
  const session = await readSession(identity, context.request);
  if (!session?.accountId) return { response: jsonResponse({ ok: false, error: 'sign_in_required' }, 401) };
  return { identity, session };
}

export default Object.freeze({ requireRewardSession });

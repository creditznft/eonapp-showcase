/** Institutional AI V2 — public-safe Web Push capability/configuration truth. */
import { getIdentityConfig, jsonResponse } from '../../_shared/eon-auth.js';
import { getEonWebPushConfig } from '../../_shared/eon-web-push.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const identity = getIdentityConfig(request, env);
  const push = getEonWebPushConfig(env);
  const available = identity.configured && push.configured;
  return jsonResponse({
    ok: true,
    available,
    reason: available ? '' : (identity.configured ? 'background-push-not-configured' : 'identity-not-configured'),
    signedInRequired: true,
    applicationServerKey: available ? push.applicationServerKey : '',
    serviceNotificationsOnly: true,
    marketingConsentImplied: false,
    silentPushSupported: false
  });
}

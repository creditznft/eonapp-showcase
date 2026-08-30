/** W374 + UX-1 — starts optional, identity-only Google OAuth after the compact local-work privacy notice. */
import {
  EON_AUTH_FLOW_SECONDS,
  authStatusRedirect,
  clearOauthFlowCookie,
  getIdentityConfig,
  makeOauthFlow,
  oauthFlowCookie,
  redirectResponse,
  sealOauthFlow
} from '../../../_shared/eon-auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const config = getIdentityConfig(request, env);
  if (!config.configured) return authStatusRedirect(url.origin, 'unavailable', {
    returnTo: url.searchParams.get('returnTo'),
    accountCode: 'identity_not_ready',
    setCookies: [clearOauthFlowCookie()]
  });

  const flow = await makeOauthFlow(config, url.searchParams.get('returnTo'));
  const sealed = await sealOauthFlow(flow, config.flowKey);
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.searchParams.set('client_id', config.clientId);
  authorization.searchParams.set('redirect_uri', config.redirectUri);
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', 'openid email profile');
  authorization.searchParams.set('state', flow.state);
  authorization.searchParams.set('nonce', flow.nonce);
  authorization.searchParams.set('code_challenge', flow.challenge);
  authorization.searchParams.set('code_challenge_method', 'S256');
  authorization.searchParams.set('include_granted_scopes', 'false');
  authorization.searchParams.set('prompt', 'select_account');

  return new Response(null, {
    status: 302,
    headers: {
      location: authorization.toString(),
      'cache-control': 'no-store, max-age=0',
      'referrer-policy': 'no-referrer',
      'set-cookie': oauthFlowCookie(sealed, EON_AUTH_FLOW_SECONDS)
    }
  });
}

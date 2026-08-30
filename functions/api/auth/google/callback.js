/** W374 — validates Google OAuth callback, creates only a minimal opaque session, then returns to EONAPP. */
import {
  authStatusRedirect,
  authStatusReturnRedirect,
  clearOauthFlowCookie,
  createSession,
  ensureMinimalAccount,
  exchangeGoogleCode,
  getIdentityConfig,
  openOauthFlow,
  readCookie,
  sessionCookie,
  verifyGoogleIdToken
} from '../../../_shared/eon-auth.js';

function sameState(left = '', right = '') {
  const a = String(left || '');
  const b = String(right || '');
  const size = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < size; index += 1) mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return mismatch === 0;
}

function safeFailureCode(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('flow')) return 'flow_missing';
  if (message.includes('state') || message.includes('callback')) return 'state_invalid';
  if (message.includes('token') || message.includes('exchange')) return 'token_exchange';
  if (message.includes('identity') || message.includes('issuer') || message.includes('nonce')) return 'identity_check';
  if (message.includes('account')) return 'account_write';
  if (message.includes('session')) return 'session_create';
  return 'oauth_callback';
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const config = getIdentityConfig(request, env);
  const requestOrigin = new URL(request.url).origin;
  if (!config.configured) return authStatusRedirect(requestOrigin, 'unavailable', {
    accountCode: 'identity_not_ready',
    setCookies: [clearOauthFlowCookie()]
  });

  const url = new URL(request.url);
  // The return destination is trusted only after the signed, short-lived flow
  // cookie has been opened. Never read a callback return target from the URL.
  let flow = null;
  try { flow = await openOauthFlow(readCookie(request, 'eon_oauth_flow'), config.flowKey); } catch {}
  const providerError = String(url.searchParams.get('error') || '');
  if (providerError) {
    return authStatusReturnRedirect(config.appOrigin, flow?.returnTo || '/', providerError === 'access_denied' ? 'cancelled' : 'error', {
      accountCode: providerError === 'access_denied' ? '' : 'google_declined',
      setCookies: [clearOauthFlowCookie()]
    });
  }

  try {
    if (!flow) throw new Error('oauth_flow_missing');
    const state = String(url.searchParams.get('state') || '');
    const code = String(url.searchParams.get('code') || '');
    if (!sameState(state, flow.state) || !code) throw new Error('oauth_callback_invalid');
    const idToken = await exchangeGoogleCode(config, code, flow);
    const identity = await verifyGoogleIdToken(config, idToken, flow.nonce);
    const account = await ensureMinimalAccount(config, identity);
    const session = await createSession(config, account.accountId);
    return authStatusReturnRedirect(config.appOrigin, flow.returnTo, 'connected', { setCookies: [clearOauthFlowCookie(), sessionCookie(session.sessionId)] });
  } catch (error) {
    return authStatusReturnRedirect(config.appOrigin, flow?.returnTo || '/', 'error', {
      accountCode: safeFailureCode(error),
      setCookies: [clearOauthFlowCookie()]
    });
  }
}

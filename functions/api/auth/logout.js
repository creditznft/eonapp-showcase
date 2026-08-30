/** W374 — same-origin logout revokes the opaque server session and clears its HttpOnly cookie. */
import {
  clearSessionCookie,
  enforceSameOriginMutation,
  getIdentityConfig,
  jsonResponse,
  endSession
} from '../../_shared/eon-auth.js';

export async function onRequestPost(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!config.configured) return jsonResponse({ ok: true, signedIn: false, guestUseAvailable: true }, 200, { 'set-cookie': clearSessionCookie() });
  if (!enforceSameOriginMutation(context.request, config)) return jsonResponse({ ok: false, error: 'origin_check_failed' }, 403);
  try { await endSession(config, context.request); } catch { return jsonResponse({ ok: false, error: 'logout_unavailable' }, 503, { 'set-cookie': clearSessionCookie() }); }
  return jsonResponse({ ok: true, signedIn: false, guestUseAvailable: true }, 200, { 'set-cookie': clearSessionCookie() });
}

/** W374 — safe session-display endpoint. It never returns an email, Google subject, account id, token or local work data. */
import { getIdentityConfig, jsonResponse, publicAuthStatus, readSession } from '../../_shared/eon-auth.js';

export async function onRequestGet(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!config.configured) return jsonResponse(publicAuthStatus(config), 200);
  const session = await readSession(config, context.request);
  return jsonResponse(publicAuthStatus(config, session), 200);
}

/** W388B: public-safe disabled connector status. No OAuth, token or platform API call. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestGet() {
  return jsonResponse({ ok: true, enabled: false, rollout: 'disabled', oauthStarted: false, tokenStored: false, directPostCreated: false }, 200);
}

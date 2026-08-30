/** W389: public-safe disabled Forge deployment status. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestGet() {
  return jsonResponse({ ok: true, enabled: false, rollout: 'disabled', githubConnected: false, cloudflareConnected: false, deploymentCreated: false }, 200);
}

/** W406: explicit disabled action-gateway status; no durable action read/write. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestGet() {
  return jsonResponse({ ok: true, enabled: false, rollout: 'disabled', reason: 'action-gateway-not-configured', externalEffect: false }, 200);
}

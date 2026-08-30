/** W406: hard-disabled action proposal endpoint. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestPost() {
  return jsonResponse({ ok: false, enabled: false, error: 'action-gateway-not-configured', proposalCreated: false, externalEffect: false }, 503);
}

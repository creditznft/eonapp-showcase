/** W407: hard-disabled action execution endpoint. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestPost() {
  return jsonResponse({ ok: false, enabled: false, error: 'action-gateway-not-configured', receiptCreated: false, externalEffect: false }, 503);
}

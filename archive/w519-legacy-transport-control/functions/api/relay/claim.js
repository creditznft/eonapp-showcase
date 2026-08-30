/** W391: hard-disabled Relay claim endpoint. It never accepts or records an invite. */
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestPost() {
  return jsonResponse({ ok: false, enabled: false, error: 'eon-relay-pilot-not-configured', grantCreated: false }, 503);
}

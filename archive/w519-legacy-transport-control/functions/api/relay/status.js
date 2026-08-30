/** W391D: public status remains non-activating and never queries relay data. */
import { getRelayConfig } from '../../_shared/eon-relay.js';
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestGet(context) {
  const config = getRelayConfig(context.request, context.env);
  return jsonResponse({
    ok: true,
    enabled: false,
    trackingEnabled: false,
    grantsEnabled: false,
    rollout: config.configured ? config.rollout : 'disabled',
    reason: config.configured ? 'relay-tracking-requires-explicit-user-action-and-policy-approval' : 'eon-relay-tracking-not-configured',
    guestUseAvailable: true
  }, 200);
}

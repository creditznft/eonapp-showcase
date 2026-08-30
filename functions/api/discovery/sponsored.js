import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { enforceTrustSameOrigin, trustJson } from '../../_shared/eon-trust-operations.js';
import { runSponsoredDiscovery } from '../../_shared/eon-sponsored-discovery-runtime.js';

export const EON_SPONSORED_DISCOVERY_API_SCHEMA = 'eonapp.api.sponsored-discovery.rt97.v2';

function response(body, status = 200) {
  return trustJson({ schema: EON_SPONSORED_DISCOVERY_API_SCHEMA, ...body }, status);
}

export async function onRequestPost(context) {
  if (!enforceTrustSameOrigin(context.request)) return response({ ok: false, error: 'same_origin_required' }, 403);
  const parsed = await readBoundedJson(context.request, { maxBytes: 2048 });
  if (!parsed.ok) return response({ ok: false, error: parsed.error || 'invalid_request' }, parsed.status || 400);
  const result = await runSponsoredDiscovery({ env: context.env, request: context.request, input: parsed.value });
  if (!result.ok) return response({ ok: false, error: result.reason }, result.status || 503);
  return response({
    ok: true, sponsored: true, disclosure: result.disclosure, answer: result.answer,
    provider: result.provider, model: result.model, routing: result.routing, economicsState: result.economicsState,
    outbound: result.outbound
  }, 200);
}

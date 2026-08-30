import { readBoundedJson } from '../../_shared/eon-request-security.js';
import { consumeTrustRateLimit, trustRateLimitSubject } from '../../_shared/eon-trust-rate-limit.js';
import { enforceTrustSameOrigin, trustJson } from '../../_shared/eon-trust-operations.js';
import { EON_PUBLIC_GROWTH_EVENT_NAMES, recordGrowthAccountLifecycle, recordGrowthEvent, verifyGrowthSignupClaim } from '../../_shared/eon-growth-attribution.js';
import { readEonMonetizationAccountEligibility } from '../../_shared/eon-monetization-eligibility.js';

export const EON_GROWTH_EVENT_SCHEMA = 'eonapp.growth.event.rt92.v1';
const MAX_BYTES = 4096;

function response(body, status = 200) {
  return trustJson({ schema: EON_GROWTH_EVENT_SCHEMA, ...body }, status);
}

export async function onRequestPost(context) {
  if (!enforceTrustSameOrigin(context.request)) return response({ ok: false, error: 'same_origin_required' }, 403);
  const subject = trustRateLimitSubject(context.request);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'growth_event', subject, Date.now(), { limit: 120, windowMs: 60 * 60 * 1000 });
  if (!allowance.ok) return response({ ok: false, error: allowance.error === 'trust_rate_limit_exceeded' ? 'growth_rate_limited' : 'growth_rate_limit_unavailable' }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503);
  const parsed = await readBoundedJson(context.request, { maxBytes: MAX_BYTES });
  if (!parsed.ok) return response({ ok: false, error: parsed.error || 'invalid_request' }, parsed.status || 400);
  const event = String(parsed.value?.event || '');
  if (!EON_PUBLIC_GROWTH_EVENT_NAMES.has(event)) return response({ ok: false, error: 'growth_event_server_only' }, 403);
  const now = Date.now();
  const result = event === 'signup'
    ? await verifyGrowthSignupClaim(context.env.EON_TRUST_DB, parsed.value, context.request, context.env, now)
    : await recordGrowthEvent(context.env.EON_TRUST_DB, parsed.value, context.request, context.env, now);
  if (result.ok && event === 'first_prompt') {
    try {
      const eligibility = await readEonMonetizationAccountEligibility(context.request, context.env);
      if (eligibility?.ok && eligibility.signedIn && eligibility.free && eligibility.accountId) {
        await recordGrowthAccountLifecycle(context.env.EON_TRUST_DB, 'qualified_free_user', eligibility.accountId, context.env, now);
      }
    } catch {}
  }
  return response(result.ok ? { ok: true, event: result.event, signedIn: result.signedIn } : { ok: false, error: result.reason }, result.ok ? 200 : 400);
}

import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';
import { createIncident } from '../../../assets/js/trust/eon-trust-support-ledger.js';
import { requireOperator, trustJson } from '../../_shared/eon-trust-operations.js';
import { consumeTrustRateLimit } from '../../_shared/eon-trust-rate-limit.js';

export async function onRequestPost(context) {
  if (!requireOperator(context.request, context.env)) return trustJson({ ok: false, error: 'operator_authorization_required' }, 401);
  if (!context.env.EON_TRUST_DB?.prepare) return trustJson({ ok: false, error: 'status_service_unavailable' }, 503);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'operator', String(context.request.headers.get('authorization') || ''));
  if (!allowance.ok) return trustJson({ ok: false, error: allowance.error }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503, { 'retry-after': '60' });
  const parsed = await readBoundedJson(context.request, { maxBytes: EON_REQUEST_LIMITS.supportCase || 20 * 1024 });
  if (!parsed.ok) return trustJson({ ok: false, error: parsed.error }, parsed.status);
  const result = await createIncident(context.env.EON_TRUST_DB, parsed.value);
  return trustJson(result, result.ok ? 201 : 400);
}

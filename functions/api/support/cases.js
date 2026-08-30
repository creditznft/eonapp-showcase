import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';
import { createTrustCase, listTrustCasesForOperator } from '../../../assets/js/trust/eon-trust-support-ledger.js';
import { enforceTrustSameOrigin, readOptionalTrustSession, requireOperator, trustJson } from '../../_shared/eon-trust-operations.js';
import { consumeTrustRateLimit, trustRateLimitSubject } from '../../_shared/eon-trust-rate-limit.js';

export async function onRequestPost(context) {
  if (!enforceTrustSameOrigin(context.request)) return trustJson({ ok: false, error: 'same_origin_required' }, 403);
  if (!context.env.EON_TRUST_DB?.prepare) return trustJson({ ok: false, error: 'support_case_service_unavailable' }, 503);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'support', trustRateLimitSubject(context.request));
  if (!allowance.ok) return trustJson({ ok: false, error: allowance.error }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503, { 'retry-after': '3600' });
  const parsed = await readBoundedJson(context.request, { maxBytes: EON_REQUEST_LIMITS.supportCase || 20 * 1024 });
  if (!parsed.ok) return trustJson({ ok: false, error: parsed.error }, parsed.status);
  const session = await readOptionalTrustSession(context.request, context.env);
  try {
    const result = await createTrustCase(context.env.EON_TRUST_DB, parsed.value, { accountId: session?.accountId || '' });
    return trustJson(result, result.ok ? 201 : 400);
  } catch {
    return trustJson({ ok: false, error: 'support_case_create_failed' }, 503);
  }
}

export async function onRequestGet(context) {
  if (!requireOperator(context.request, context.env)) return trustJson({ ok: false, error: 'operator_authorization_required' }, 401);
  if (!context.env.EON_TRUST_DB?.prepare) return trustJson({ ok: false, error: 'support_case_service_unavailable' }, 503);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'operator', String(context.request.headers.get('authorization') || ''));
  if (!allowance.ok) return trustJson({ ok: false, error: allowance.error }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503, { 'retry-after': '60' });
  const url = new URL(context.request.url);
  const cases = await listTrustCasesForOperator(context.env.EON_TRUST_DB, { status: url.searchParams.get('status') || '', limit: Number(url.searchParams.get('limit') || 50) });
  return trustJson({ ok: true, cases });
}

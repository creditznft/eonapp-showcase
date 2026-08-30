import { readProfitabilityReport } from '../../_shared/eon-profitability-report.js';
import { consumeTrustRateLimit } from '../../_shared/eon-trust-rate-limit.js';
import { requireOperator, trustJson } from '../../_shared/eon-trust-operations.js';

export const EON_PROFITABILITY_REPORT_SCHEMA = 'eonapp.profitability.operator.rt92.v1';

export async function onRequestGet(context) {
  if (!requireOperator(context.request, context.env)) return trustJson({ ok: false, schema: EON_PROFITABILITY_REPORT_SCHEMA, error: 'operator_authorization_required' }, 401);
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'operator_profitability', String(context.request.headers.get('authorization') || ''), Date.now(), { limit: 60, windowMs: 60 * 60 * 1000 });
  if (!allowance.ok) return trustJson({ ok: false, schema: EON_PROFITABILITY_REPORT_SCHEMA, error: allowance.error }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503);
  const url = new URL(context.request.url);
  const report = await readProfitabilityReport(context.env.EON_TRUST_DB, { windowDays: Number(url.searchParams.get('days') || 30), limit: Number(url.searchParams.get('limit') || 80), now: Date.now() });
  if (!report.ok) return trustJson({ ok: false, schema: EON_PROFITABILITY_REPORT_SCHEMA, error: report.reason }, 503);
  return trustJson({ schema: EON_PROFITABILITY_REPORT_SCHEMA, ...report }, 200);
}

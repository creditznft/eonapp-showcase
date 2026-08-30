import { reconcileProfitabilityEvidence } from '../../../_shared/eon-profitability-reconciliation.js';
import { consumeTrustRateLimit } from '../../../_shared/eon-trust-rate-limit.js';
import { requireOperator, trustJson } from '../../../_shared/eon-trust-operations.js';

export const EON_PROFITABILITY_RECONCILE_SCHEMA = 'eonapp.profitability.reconciliation.rt92.v1';
const MAX_BODY_BYTES = 64 * 1024;

export async function onRequestPost(context) {
  if (!requireOperator(context.request, context.env)) return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: 'operator_authorization_required' }, 401);
  const authorization = String(context.request.headers.get('authorization') || '');
  const allowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'operator_profitability_reconcile', authorization, Date.now(), { limit: 30, windowMs: 60 * 60 * 1000 });
  if (!allowance.ok) return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: allowance.error }, allowance.error === 'trust_rate_limit_exceeded' ? 429 : 503);
  let text = '';
  try { text = await context.request.text(); } catch { return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: 'invalid_request_body' }, 400); }
  if (!text || new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: 'invalid_request_body' }, 400);
  let payload = null;
  try { payload = JSON.parse(text); } catch { return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: 'invalid_json' }, 400); }
  const result = await reconcileProfitabilityEvidence(context.env.EON_TRUST_DB, payload, { now: Date.now() });
  if (!result.ok) {
    const status = result.reason === 'reconciliation_evidence_conflict' ? 409 : (result.reason === 'reconciliation_database_unavailable' || result.reason === 'reconciliation_write_failed' ? 503 : 400);
    return trustJson({ ok: false, schema: EON_PROFITABILITY_RECONCILE_SCHEMA, error: result.reason }, status);
  }
  return trustJson({ schema: EON_PROFITABILITY_RECONCILE_SCHEMA, ...result }, result.skipped ? 200 : 201);
}

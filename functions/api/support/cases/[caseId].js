import { anonymizeTrustCaseWithToken, readTrustCaseWithToken } from '../../../../assets/js/trust/eon-trust-support-ledger.js';
import { readCaseToken, trustJson } from '../../../_shared/eon-trust-operations.js';

export async function onRequestGet(context) {
  if (!context.env.EON_TRUST_DB?.prepare) return trustJson({ ok: false, error: 'support_case_service_unavailable' }, 503);
  const token = readCaseToken(context.request);
  if (!token) return trustJson({ ok: false, error: 'case_token_required' }, 401);
  const row = await readTrustCaseWithToken(context.env.EON_TRUST_DB, context.params.caseId, token);
  return row ? trustJson({ ok: true, case: row }) : trustJson({ ok: false, error: 'case_not_found' }, 404);
}

export async function onRequestDelete(context) {
  if (!context.env.EON_TRUST_DB?.prepare) return trustJson({ ok: false, error: 'support_case_service_unavailable' }, 503);
  const token = readCaseToken(context.request);
  if (!token) return trustJson({ ok: false, error: 'case_token_required' }, 401);
  const row = await anonymizeTrustCaseWithToken(context.env.EON_TRUST_DB, context.params.caseId, token);
  return row ? trustJson({ ok: true, case: row, deletion: 'case_content_anonymized' }) : trustJson({ ok: false, error: 'case_not_found_or_token_invalid' }, 404);
}

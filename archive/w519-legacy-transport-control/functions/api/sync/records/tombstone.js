/** W412 — controlled tombstone transport; callers must still decide deletion locally. */
import { EON_SYNC_BASIC_TRANSPORT_LIMITS, normalizeEonSyncBasicRecord, publicEonSyncBasicStatus, verifyEonSyncBasicRecordContentHash, readJsonBody, requestHasAllowedSameOrigin, requireEonSyncBasicSession, upsertEonSyncBasicRecords } from '../../../_shared/eon-sync-basic.js';
import { jsonResponse } from '../../../_shared/eon-auth.js';

export async function onRequestPost(context) {
  const required = await requireEonSyncBasicSession(context.request, context.env);
  if (!required.ok) return required.response;
  if (!requestHasAllowedSameOrigin(context.request, required.config)) return jsonResponse({ ok: false, error: 'same-origin-required' }, 403);
  const parsed = await readJsonBody(context.request, { maxBytes: EON_SYNC_BASIC_TRANSPORT_LIMITS.maxRecordBytes + 4096 });
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, 400);
  const normalized = normalizeEonSyncBasicRecord(parsed.value.record);
  if (!normalized.ok || !normalized.record?.deletedAt) return jsonResponse({ ok: false, error: normalized.error || 'tombstone-required' }, 400);
  if (await verifyEonSyncBasicRecordContentHash(normalized.record) !== true) return jsonResponse({ ok: false, error: 'content-hash-mismatch' }, 400);
  const result = await upsertEonSyncBasicRecords(required.config.database, required.session.accountId, [normalized.record]);
  return jsonResponse({ ok: true, ...publicEonSyncBasicStatus(required.config, required.session), accepted: result.accepted, deletionPropagation: 'tombstone-review-required', automaticDeletion: false }, 202);
}

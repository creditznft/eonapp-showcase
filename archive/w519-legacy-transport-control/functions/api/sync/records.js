/** W412 — manual-proof Sync Basic records. No background sync or automatic merge. */
import { EON_SYNC_BASIC_TRANSPORT_LIMITS, normalizeEonSyncBasicRecord, parseSyncCursor, verifyEonSyncBasicRecordContentHash, publicEonSyncBasicStatus, readJsonBody, requestHasAllowedSameOrigin, requireEonSyncBasicSession, serializeSyncRecord, upsertEonSyncBasicRecords } from '../../_shared/eon-sync-basic.js';
import { jsonResponse } from '../../_shared/eon-auth.js';

export async function onRequestGet(context) {
  const required = await requireEonSyncBasicSession(context.request, context.env);
  if (!required.ok) return required.response;
  const url = new URL(context.request.url);
  const since = parseSyncCursor(url.searchParams.get('since'));
  const rows = await required.config.database.prepare(`
    SELECT record_id, record_type, updated_at, version, origin_device_id, deleted_at, content_hash, content_json
    FROM eon_sync_records WHERE account_id = ? AND updated_at > ? ORDER BY updated_at ASC LIMIT 200
  `).bind(required.session.accountId, since).all();
  const records = (rows.results || []).map(serializeSyncRecord);
  const cursor = records.length ? Date.parse(records[records.length - 1].updatedAt) : since;
  return jsonResponse({ ok: true, ...publicEonSyncBasicStatus(required.config, required.session), records, cursor, mergeRequired: true, automaticMerge: false, deletionPropagation: 'tombstone-review-required' });
}

export async function onRequestPost(context) {
  const required = await requireEonSyncBasicSession(context.request, context.env);
  if (!required.ok) return required.response;
  if (!requestHasAllowedSameOrigin(context.request, required.config)) return jsonResponse({ ok: false, error: 'same-origin-required' }, 403);
  const parsed = await readJsonBody(context.request);
  if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, 400);
  const rawRecords = Array.isArray(parsed.value.records) ? parsed.value.records : [];
  if (!rawRecords.length || rawRecords.length > EON_SYNC_BASIC_TRANSPORT_LIMITS.maxRecordsPerWrite) return jsonResponse({ ok: false, error: 'invalid-record-batch' }, 400);
  const normalized = rawRecords.map(normalizeEonSyncBasicRecord);
  const invalid = normalized.find((entry) => !entry.ok);
  if (invalid) return jsonResponse({ ok: false, error: invalid.error }, 400);
  const records = normalized.map((entry) => entry.record);
  const integrity = await Promise.all(records.map((record) => verifyEonSyncBasicRecordContentHash(record)));
  if (integrity.some((valid) => valid !== true)) return jsonResponse({ ok: false, error: 'content-hash-mismatch' }, 400);
  const result = await upsertEonSyncBasicRecords(required.config.database, required.session.accountId, records);
  return jsonResponse({ ok: true, ...publicEonSyncBasicStatus(required.config, required.session), accepted: result.accepted, deviceCount: result.deviceCount, automaticUpload: false, automaticMerge: false, liveReleaseApproved: false }, 202);
}

import { assertD1SchemaAuthority } from '../infrastructure/eon-d1-schema-authority.js';
/** A15 I20 — D1-backed support and incident ledger. DDL lives only in migrations/trust. */
import {
  EON_CASE_STATUSES,
  EON_TRUST_SUPPORT_SCHEMA,
  publicTrustCase,
  validateTrustCaseInput
} from './eon-trust-support-authority.js';

const encoder = new TextEncoder();
const freeze = Object.freeze;
function clean(value = '', limit = 4000) { return Array.from(String(value ?? '')).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').trim().slice(0, limit); }
function cleanId(value = '', limit = 120) { return clean(value, limit).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, limit); }
function randomBase32(bytes = 18, cryptoImpl = globalThis.crypto) {
  const data = new Uint8Array(bytes);
  cryptoImpl.getRandomValues(data);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let output = '';
  for (const byte of data) output += alphabet[byte % alphabet.length];
  return output;
}
async function sha256Hex(value = '', cryptoImpl = globalThis.crypto) {
  const digest = await cryptoImpl.subtle.digest('SHA-256', encoder.encode(String(value || '')));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function requireDatabase(database) { if (!database?.prepare) throw new Error('trust_db_missing'); await assertD1SchemaAuthority(database, 'trust'); }

export async function createTrustCase(database, input = {}, options = {}) {
  await requireDatabase(database);
  const parsed = validateTrustCaseInput(input);
  if (!parsed.ok) return freeze({ ok: false, status: 'invalid_case', errors: parsed.errors, case: null, accessToken: '' });
  const now = Number(options.now || Date.now());
  const cryptoImpl = options.cryptoImpl || globalThis.crypto;
  const caseId = cleanId(options.caseId || `EON-${new Date(now).toISOString().slice(0, 10).replaceAll('-', '')}-${randomBase32(6, cryptoImpl)}`, 80);
  const accessToken = clean(options.accessToken || `case_${randomBase32(24, cryptoImpl)}`, 160);
  const tokenHash = await sha256Hex(accessToken, cryptoImpl);
  const accountId = cleanId(options.accountId, 80);
  // Evidence attachments are intentionally not accepted or persisted in Trust.
  const evidenceJson = '';
  await database.prepare(`INSERT INTO eon_trust_cases (case_id, token_hash, account_id, category_id, subject, description, route_path, evidence_json, status, priority, owner_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?)`)
    .bind(caseId, tokenHash, accountId || null, parsed.value.categoryId, parsed.value.subject, parsed.value.description, parsed.value.routePath, evidenceJson || null, parsed.value.priority, parsed.value.ownerRole, now, now).run();
  const row = await database.prepare(`SELECT * FROM eon_trust_cases WHERE case_id = ? LIMIT 1`).bind(caseId).first();
  return freeze({ ok: true, status: 'case_created', case: publicTrustCase(row), accessToken });
}

export async function readTrustCaseWithToken(database, caseId = '', accessToken = '', options = {}) {
  await requireDatabase(database);
  const id = cleanId(caseId, 80);
  const token = clean(accessToken, 160);
  if (!id || !token) return null;
  const tokenHash = await sha256Hex(token, options.cryptoImpl || globalThis.crypto);
  const row = await database.prepare(`SELECT * FROM eon_trust_cases WHERE case_id = ? AND token_hash = ? LIMIT 1`).bind(id, tokenHash).first();
  return row ? publicTrustCase(row) : null;
}

export async function listTrustCasesForOperator(database, options = {}) {
  await requireDatabase(database);
  const limit = Math.max(1, Math.min(100, Number(options.limit || 50)));
  const status = EON_CASE_STATUSES.includes(options.status) ? options.status : '';
  const statement = status
    ? database.prepare(`SELECT * FROM eon_trust_cases WHERE status = ? ORDER BY updated_at DESC LIMIT ?`).bind(status, limit)
    : database.prepare(`SELECT * FROM eon_trust_cases ORDER BY updated_at DESC LIMIT ?`).bind(limit);
  const result = await statement.all();
  return freeze((result?.results || []).map((row) => freeze({ ...publicTrustCase(row), description: clean(row.description, 2000), evidence: null })));
}

export async function updateTrustCaseForOperator(database, caseId = '', patch = {}, options = {}) {
  await requireDatabase(database);
  const id = cleanId(caseId, 80);
  const status = EON_CASE_STATUSES.includes(patch.status) ? patch.status : '';
  if (!id || !status) return null;
  const now = Number(options.now || Date.now());
  const publicResponse = clean(patch.publicResponse, 1000);
  const ownerRole = cleanId(patch.ownerRole, 80);
  const resolvedAt = ['resolved', 'closed'].includes(status) ? now : 0;
  await database.prepare(`UPDATE eon_trust_cases SET status = ?, public_response = ?, owner_role = COALESCE(NULLIF(?, ''), owner_role), resolved_at = ?, updated_at = ? WHERE case_id = ?`)
    .bind(status, publicResponse || null, ownerRole, resolvedAt || null, now, id).run();
  const row = await database.prepare(`SELECT * FROM eon_trust_cases WHERE case_id = ? LIMIT 1`).bind(id).first();
  return row ? publicTrustCase(row) : null;
}

export async function anonymizeTrustCaseWithToken(database, caseId = '', accessToken = '', options = {}) {
  await requireDatabase(database);
  const id = cleanId(caseId, 80);
  const token = clean(accessToken, 160);
  if (!id || !token) return null;
  const tokenHash = await sha256Hex(token, options.cryptoImpl || globalThis.crypto);
  const now = Number(options.now || Date.now());
  await database.prepare(`UPDATE eon_trust_cases
    SET account_id = NULL, token_hash = '', subject = '[anonymized]', description = '[anonymized]', evidence_json = NULL,
        public_response = NULL, status = 'closed', resolved_at = COALESCE(resolved_at, ?), anonymized_at = ?, updated_at = ?
    WHERE case_id = ? AND token_hash = ?`).bind(now, now, now, id, tokenHash).run();
  const row = await database.prepare(`SELECT * FROM eon_trust_cases WHERE case_id = ? AND anonymized_at = ? LIMIT 1`).bind(id, now).first();
  return row ? publicTrustCase(row) : null;
}

export async function createIncident(database, input = {}, options = {}) {
  await requireDatabase(database);
  const now = Number(options.now || Date.now());
  const cryptoImpl = options.cryptoImpl || globalThis.crypto;
  const incidentId = cleanId(options.incidentId || `INC-${new Date(now).toISOString().slice(0, 10).replaceAll('-', '')}-${randomBase32(5, cryptoImpl)}`, 80);
  const title = clean(input.title, 180);
  const summary = clean(input.summary, 1000);
  const severity = ['minor', 'major', 'critical'].includes(input.severity) ? input.severity : 'minor';
  const component = cleanId(input.component || 'core-app', 80);
  const ownerRole = cleanId(input.ownerRole || 'incident-commander', 80);
  if (title.length < 5 || summary.length < 20) return freeze({ ok: false, status: 'invalid_incident', incident: null });
  await database.prepare(`INSERT INTO eon_incidents (incident_id, title, public_summary, severity, status, affected_component, owner_role, started_at, updated_at) VALUES (?, ?, ?, ?, 'investigating', ?, ?, ?, ?)`)
    .bind(incidentId, title, summary, severity, component, ownerRole, now, now).run();
  return freeze({ ok: true, status: 'incident_created', incident: await readIncident(database, incidentId) });
}

async function readIncident(database, incidentId = '') {
  const row = await database.prepare(`SELECT incident_id,title,public_summary,severity,status,affected_component,started_at,updated_at,resolved_at FROM eon_incidents WHERE incident_id = ? LIMIT 1`).bind(cleanId(incidentId, 80)).first();
  return row ? freeze({
    incidentId: cleanId(row.incident_id, 80), title: clean(row.title, 180), summary: clean(row.public_summary, 2000),
    severity: row.severity, status: row.status, component: row.affected_component,
    startedAt: Number(row.started_at || 0), updatedAt: Number(row.updated_at || 0), resolvedAt: Number(row.resolved_at || 0)
  }) : null;
}

export async function updateIncident(database, incidentId = '', patch = {}, options = {}) {
  await requireDatabase(database);
  const id = cleanId(incidentId, 80);
  const status = ['investigating', 'identified', 'monitoring', 'resolved'].includes(patch.status) ? patch.status : '';
  if (!id || !status) return null;
  const now = Number(options.now || Date.now());
  const summary = clean(patch.summary, 1000);
  await database.prepare(`UPDATE eon_incidents SET status = ?, public_summary = CASE WHEN ? = '' THEN public_summary ELSE ? END, updated_at = ?, resolved_at = ? WHERE incident_id = ?`)
    .bind(status, summary, summary, now, status === 'resolved' ? now : null, id).run();
  return readIncident(database, id);
}

export async function readPublicServiceStatus(database) {
  if (!database?.prepare) return freeze({ schema: `${EON_TRUST_SUPPORT_SCHEMA}.public-status`, configured: false, overall: 'unknown', components: freeze([]), incidents: freeze([]) });
  await requireDatabase(database);
  const componentResult = await database.prepare(`SELECT component_id,label,status,public_note,updated_at FROM eon_service_components ORDER BY component_id`).all();
  const incidentResult = await database.prepare(`SELECT incident_id,title,public_summary,severity,status,affected_component,started_at,updated_at,resolved_at FROM eon_incidents WHERE status != 'resolved' OR resolved_at > ? ORDER BY started_at DESC LIMIT 20`).bind(Date.now() - 7 * 86400000).all();
  const components = (componentResult?.results || []).map((row) => freeze({ id: cleanId(row.component_id, 80), label: clean(row.label, 120), status: row.status, note: clean(row.public_note, 500), updatedAt: Number(row.updated_at || 0) }));
  const incidents = (incidentResult?.results || []).map((row) => freeze({ incidentId: row.incident_id, title: row.title, summary: row.public_summary, severity: row.severity, status: row.status, component: row.affected_component, startedAt: Number(row.started_at || 0), updatedAt: Number(row.updated_at || 0), resolvedAt: Number(row.resolved_at || 0) }));
  const overall = components.some((row) => row.status === 'major_outage') ? 'major_outage' : components.some((row) => row.status === 'degraded') ? 'degraded' : components.length ? 'operational' : 'unknown';
  return freeze({ schema: `${EON_TRUST_SUPPORT_SCHEMA}.public-status`, configured: components.length > 0, overall, components: freeze(components), incidents: freeze(incidents), generatedAt: Date.now(), privateContentIncluded: false });
}

export function getTrustLedgerTruth() {
  return freeze({ schema: `${EON_TRUST_SUPPORT_SCHEMA}.ledger-truth`, requestTimeDdl: false, rawCaseTokenStored: false, rawAttachmentStorage: false, supportCanMutateBilling: false, operatorUpdatesAuditable: true, publicStatusPrivateContent: false, resolvedCaseRetentionDays: 90, selfServiceAnonymization: true, rateLimitStoresRawIp: false });
}

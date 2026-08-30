import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  getPublicOperatorConfig,
  getTrustPolicySet,
  getTrustSupportTruth,
  validateTrustCaseInput
} from '../../assets/js/trust/eon-trust-support-authority.js';
import {
  createIncident,
  createTrustCase,
  getTrustLedgerTruth,
  listTrustCasesForOperator,
  readPublicServiceStatus,
  readTrustCaseWithToken,
  updateIncident,
  updateTrustCaseForOperator,
  anonymizeTrustCaseWithToken
} from '../../assets/js/trust/eon-trust-support-ledger.js';
import { onRequestPost as createCaseHandler } from '../../functions/api/support/cases.js';
import { onRequestGet as readCaseHandler } from '../../functions/api/support/cases/[caseId].js';
import { onRequestGet as trustConfigHandler } from '../../functions/api/trust/config.js';
import { onRequestGet as publicStatusHandler } from '../../functions/api/status/current.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../migrations/trust/0001_trust_support_incident_authority.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../migrations/trust/0002_vexrail_economic_aggregate.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../migrations/trust/0003_growth_profitability_authority.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../migrations/trust/0004_growth_operational_events.sql', import.meta.url), 'utf8'));
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); }, async batch(rows) { sqlite.exec('BEGIN'); try { const result = rows.map((row) => row.run()); sqlite.exec('COMMIT'); return result; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
}
const caseInput = { categoryId: 'billing', subject: 'Duplicate subscription charge', description: 'A verified Dodo receipt appears to show the same monthly charge twice. I request manual review.', routePath: '/billing' };
const configuredEnv = {
  EONAPP_OPERATOR_LEGAL_NAME: 'Example Operator GmbH', EONAPP_OPERATOR_TRADING_NAME: 'EONAPP', EONAPP_OPERATOR_ADDRESS: 'Example Street 1', EONAPP_OPERATOR_COUNTRY: 'Exampleland',
  EONAPP_SUPPORT_CONTACT: 'support@example.invalid', EONAPP_PRIVACY_CONTACT: 'privacy@example.invalid', EONAPP_SECURITY_CONTACT: 'security@example.invalid', EONAPP_GOVERNING_LAW: 'Example law', EONAPP_LEGAL_VENUE: 'Example courts'
};

test('A15 I20 validates bounded cases and rejects secret-like content', () => {
  assert.equal(validateTrustCaseInput(caseInput).ok, true);
  const bad = validateTrustCaseInput({ ...caseInput, description: 'Here is my private key: -----BEGIN PRIVATE KEY----- abc' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.includes('secret_like_content_rejected'));
  const attachment = validateTrustCaseInput({ ...caseInput, evidence: { screenshot: 'not accepted' } });
  assert.equal(attachment.ok, false);
  assert.ok(attachment.errors.includes('attachments_or_evidence_not_accepted'));
  const truth = getTrustSupportTruth();
  assert.equal(truth.supportCaseCanAlterEntitlement, false);
  assert.equal(truth.operatorIdentityMustBeConfiguredBeforePaidLaunch, true);
});

test('A15 I20 operator configuration fails closed until every required field exists', () => {
  const missing = getPublicOperatorConfig({ EONAPP_OPERATOR_TRADING_NAME: 'EONAPP' });
  assert.equal(missing.configured, false);
  assert.equal(missing.launchEligible, false);
  assert.ok(missing.missing.includes('legalName'));
  const configured = getPublicOperatorConfig(configuredEnv);
  assert.equal(configured.configured, true);
  assert.equal(configured.launchEligible, true);
  assert.equal(configured.identity.legalName, 'Example Operator GmbH');
});

test('A15 I20 policy set publishes cancellation/refund and privacy-rights boundaries', () => {
  const policy = getTrustPolicySet();
  assert.match(policy.refundWithdrawalCancellation.cancellation, /customer portal/i);
  assert.match(policy.refundWithdrawalCancellation.withdrawalAndRefund, /applicable law/i);
  assert.ok(policy.privacyRights.rights.includes('deletion'));
  assert.equal(policy.support.automaticRefunds, false);
  assert.equal(policy.incident.publicUpdatesContainPrivateContent, false);
});

test('A15 I20 creates a real case ID, stores only the token hash and rejects a wrong token', async () => {
  const db = makeD1();
  const created = await createTrustCase(db, caseInput, { now: Date.parse('2026-08-05T02:00:00Z'), caseId: 'EON-20260805-ABC123', accessToken: ['case', 'PRIVATE', 'ACCESS', 'TOKEN', '123456789'].join('_') });
  assert.equal(created.ok, true);
  assert.equal(created.case.caseId, 'EON-20260805-ABC123');
  assert.equal(created.case.ownerRole, 'billing-operations');
  const raw = db.sqlite.prepare('SELECT token_hash FROM eon_trust_cases WHERE case_id = ?').get(created.case.caseId);
  assert.notEqual(raw.token_hash, created.accessToken);
  assert.equal(JSON.stringify(raw).includes(created.accessToken), false);
  assert.equal(await readTrustCaseWithToken(db, created.case.caseId, 'wrong-token'), null);
  assert.equal((await readTrustCaseWithToken(db, created.case.caseId, created.accessToken)).status, 'submitted');
  db.sqlite.close();
});

test('A15 I20 operator workflow triages and resolves a case without commercial side effects', async () => {
  const db = makeD1();
  const created = await createTrustCase(db, caseInput, { now: 1000, caseId: 'EON-20260805-CASE20', accessToken: ['case', 'i20', 'private', 'token', '0000000001'].join('_') });
  const triaged = await updateTrustCaseForOperator(db, created.case.caseId, { status: 'triaged', ownerRole: 'billing-operations', publicResponse: 'We are reviewing the verified provider record.' }, { now: 2000 });
  assert.equal(triaged.status, 'triaged');
  assert.match(triaged.publicResponse, /provider record/i);
  const resolved = await updateTrustCaseForOperator(db, created.case.caseId, { status: 'resolved', publicResponse: 'Review completed. Use the Dodo portal for the verified next step.' }, { now: 3000 });
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.resolvedAt, 3000);
  const rows = await listTrustCasesForOperator(db);
  assert.equal(rows.length, 1);
  assert.equal(getTrustLedgerTruth().supportCanMutateBilling, false);
  db.sqlite.close();
});

test('A15 I20 self-service deletion anonymizes content and invalidates the one-time case token', async () => {
  const db = makeD1();
  const created = await createTrustCase(db, caseInput, { now: 1000, caseId: 'EON-20260805-DELETE', accessToken: ['case', 'PRIVATE', 'ACCESS', 'TOKEN', '123456789'].join('_') });
  const anonymized = await anonymizeTrustCaseWithToken(db, created.case.caseId, created.accessToken, { now: 2000 });
  assert.equal(anonymized.status, 'closed');
  const raw = db.sqlite.prepare('SELECT account_id, subject, description, evidence_json, token_hash, anonymized_at FROM eon_trust_cases WHERE case_id=?').get(created.case.caseId);
  assert.equal(raw.account_id, null);
  assert.equal(raw.subject, '[anonymized]');
  assert.equal(raw.description, '[anonymized]');
  assert.equal(raw.evidence_json, null);
  assert.equal(raw.token_hash, '');
  assert.equal(raw.anonymized_at, 2000);
  assert.equal(await readTrustCaseWithToken(db, created.case.caseId, created.accessToken), null);
  db.sqlite.close();
});

test('A15 I20 incident drill publishes only bounded public status and can resolve', async () => {
  const db = makeD1();
  const drillNow = Date.now();
  const seeded = await readPublicServiceStatus(db);
  assert.equal(seeded.configured, true);
  assert.equal(seeded.overall, 'operational');
  db.sqlite.prepare(`UPDATE eon_service_components SET label = ?, public_note = ?, updated_at = ? WHERE component_id = ?`).run('Core app', 'Normal service', drillNow, 'core-app');
  const created = await createIncident(db, { title: 'Checkout response delays', summary: 'Some signed-in users may see delayed checkout session creation while the provider path is reviewed.', severity: 'major', component: 'billing', ownerRole: 'incident-commander' }, { now: drillNow, incidentId: 'INC-20260805-I20' });
  assert.equal(created.ok, true);
  let publicStatus = await readPublicServiceStatus(db);
  assert.equal(publicStatus.configured, true);
  assert.equal(publicStatus.incidents.length, 1);
  assert.equal(publicStatus.privateContentIncluded, false);
  assert.equal(JSON.stringify(publicStatus).includes('provider key'), false);
  assert.equal(JSON.stringify(publicStatus).includes('workspace content'), false);
  const resolved = await updateIncident(db, created.incident.incidentId, { status: 'resolved', summary: 'Provider response recovered and monitoring completed.' }, { now: drillNow + 1000 });
  assert.equal(resolved.status, 'resolved');
  publicStatus = await readPublicServiceStatus(db);
  assert.equal(publicStatus.incidents[0].status, 'resolved');
  db.sqlite.close();
});

test('A15 I20 case API requires same origin, returns token once and supports private lookup', async () => {
  const db = makeD1();
  const request = new Request('https://eonapp.ch/api/support/cases', { method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' }, body: JSON.stringify(caseInput) });
  const env = { EON_TRUST_DB: db, EON_TRUST_RATE_LIMIT_SALT: 'test-trust-rate-limit-salt-0123456789' };
  const response = await createCaseHandler({ request, env });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.match(payload.accessToken, /^case_/);
  const lookup = await readCaseHandler({ request: new Request(`https://eonapp.ch/api/support/cases/${payload.case.caseId}`, { headers: { 'x-eon-case-token': payload.accessToken } }), env, params: { caseId: payload.case.caseId } });
  assert.equal(lookup.status, 200);
  assert.equal((await lookup.json()).case.caseId, payload.case.caseId);
  const crossOrigin = await createCaseHandler({ request: new Request('https://eonapp.ch/api/support/cases', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify(caseInput) }), env });
  assert.equal(crossOrigin.status, 403);
  db.sqlite.close();
});

test('A15 I20 public config/status endpoints fail closed when deployment authority is missing', async () => {
  const configResponse = await trustConfigHandler({ request: new Request('https://eonapp.ch/api/trust/config'), env: {} });
  assert.equal(configResponse.status, 503);
  assert.equal((await configResponse.json()).launchEligible, false);
  const statusResponse = await publicStatusHandler({ request: new Request('https://eonapp.ch/api/status/current'), env: {} });
  assert.equal(statusResponse.status, 503);
  assert.equal((await statusResponse.json()).overall, 'unknown');
});

test('A15 I20 applies a bounded anonymous submission limit without storing an address and caches public status safely', async () => {
  const db = makeD1();
  const env = { EON_TRUST_DB: db, EON_TRUST_RATE_LIMIT_SALT: 'test-trust-rate-limit-salt-0123456789' };
  for (let index = 0; index < 5; index += 1) {
    const request = new Request('https://eonapp.ch/api/support/cases', { method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.20' }, body: JSON.stringify({ ...caseInput, subject: `Case request ${index}` }) });
    assert.equal((await createCaseHandler({ request, env })).status, 201);
  }
  const blocked = await createCaseHandler({ request: new Request('https://eonapp.ch/api/support/cases', { method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.20' }, body: JSON.stringify(caseInput) }), env });
  assert.equal(blocked.status, 429);
  const bucket = db.sqlite.prepare('SELECT bucket_key FROM eon_trust_submission_limits').get();
  assert.doesNotMatch(bucket.bucket_key, /198\.51\.100\.20/);
  db.sqlite.prepare(`UPDATE eon_service_components SET label = ?, status = ?, public_note = ?, updated_at = ? WHERE component_id = ?`).run('Core app', 'operational', 'Normal service', Date.now(), 'core-app');
  const status = await publicStatusHandler({ request: new Request('https://eonapp.ch/api/status/current'), env });
  assert.match(status.headers.get('cache-control') || '', /max-age=60/);
  db.sqlite.close();
});

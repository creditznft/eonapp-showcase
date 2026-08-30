import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W717_CERTIFICATION_LANES,
  W717_EXTERNAL_EVIDENCE_REQUIRED,
  W717_THREAT_MODEL,
  getW717SecurityCertificationTruth,
  validateW717SecurityCertificationContract
} from '../../config/w717-security-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));

test('W717 threat-models all five launch-sensitive domains without claiming external proof', () => {
  assert.deepEqual(W717_THREAT_MODEL.map((row) => row.id), ['project-handoff', 'vault-and-recovery', 'provider-keys', 'referral-and-eonkeys', 'payment-callbacks']);
  for (const row of W717_THREAT_MODEL) {
    assert.ok(row.assets.length >= 3);
    assert.ok(row.threats.length >= 3);
    assert.ok(row.controls.length >= 4);
    assert.match(row.externalProof, /W718/);
  }
  assert.ok(W717_EXTERNAL_EVIDENCE_REQUIRED.length >= 8);
});

test('W717 reduces current certification to seven named lanes with dependency truth', () => {
  assert.deepEqual(W717_CERTIFICATION_LANES.map((row) => row.id), ['source-authority', 'current-unit', 'integration', 'build-smoke', 'browser-device', 'security', 'release']);
  assert.equal(W717_CERTIFICATION_LANES.find((row) => row.id === 'source-authority').requiresDependencies, false);
  assert.equal(W717_CERTIFICATION_LANES.find((row) => row.id === 'security').requiresDependencies, false);
  assert.equal(W717_CERTIFICATION_LANES.find((row) => row.id === 'browser-device').current, false);
  assert.equal(W717_CERTIFICATION_LANES.find((row) => row.id === 'release').current, false);
  assert.equal(validateW717SecurityCertificationContract().ok, true);
});

test('W717 current unit manifest and non-certifying archive are explicit', () => {
  const manifest = json('config/w624d-current-unit-test-manifest.json');
  const archive = json('config/w701-non-certifying-archive-manifest.json');
  assert.ok(Number(String(manifest.wave).replace(/^W/, '')) >= 717);
  assert.equal(manifest.certifying, true);
  assert.equal(manifest.testFileCount, manifest.testFiles.length);
  assert.equal(archive.certifying, false);
  assert.ok(archive.entries.every((row) => row.reason && row.archivedPath));
});

test('W717 source headers and opaque session cookies retain hardened boundaries', () => {
  const headers = read('public/_headers');
  const auth = read('functions/_shared/eon-auth.js');
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Strict-Transport-Security:/);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /object-src 'none'/);
  assert.match(auth, /Secure/);
  assert.match(auth, /HttpOnly/);
  assert.match(auth, /SameSite=/);
});

test('W717 exposes concise source and security commands without hiding future proof', () => {
  const packageJson = json('package.json');
  const source = packageJson.scripts['verify:institutional-source'];
  const security = packageJson.scripts['verify:institutional-security'];
  for (let wave = 701; wave <= 717; wave += 1) assert.match(source, new RegExp(`qa:w${wave}`));
  assert.match(security, /security:secret-scan/);
  assert.match(security, /qa:w530-security-oauth/);
  assert.match(security, /qa:w636-security-privacy-abuse/);
  assert.match(security, /qa:w717-security-certification-simplification/);
  assert.equal(W717_CERTIFICATION_LANES.find((row) => row.id === 'integration').current, false);
});

test('W717 truth is source-ready but refuses production, dependency or penetration claims', () => {
  const truth = getW717SecurityCertificationTruth();
  assert.equal(truth.sourceSecurityReviewed, true);
  assert.equal(truth.productionSecurityCertified, false);
  assert.equal(truth.dependencyAuditCompleted, false);
  assert.equal(truth.penetrationTestCompleted, false);
  assert.equal(truth.physicalBrowserEvidenceCompleted, false);
  assert.equal(truth.historicalTestsCertifyCurrentSource, false);
  assert.equal(truth.performsNetworkRequest, false);
  assert.equal(truth.mutatesProduction, false);
  assert.equal(truth.startsOauth, false);
  assert.equal(truth.startsPayment, false);
});

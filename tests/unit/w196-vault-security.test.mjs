import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inspectVaultStorageNames, createSafeVaultBackupSummary, getVaultSecurityTruth } from '../../assets/js/vault/eon-vault-security.js';

const vaultHtml = fs.readFileSync(new URL('../../vault.html', import.meta.url), 'utf8');
const vaultJs = fs.readFileSync(new URL('../../assets/js/vault/eon-vault-page.js', import.meta.url), 'utf8');
const profileHtml = fs.readFileSync(new URL('../../profile.html', import.meta.url), 'utf8');
const redirects = fs.readFileSync(new URL('../../_redirects', import.meta.url), 'utf8');

function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { get length(){return map.size;}, key(i){return [...map.keys()][i] || null;}, getItem(k){return map.get(k) || null;}, setItem(k,v){map.set(k,String(v));} };
}

test('W196 vault audit reads names but not values and flags legacy key names', () => {
  const storage = fakeStorage({
    'eon:api-key-vault:v1': 'ciphertext only',
    'eon:onboarding:providers:v1': '{"apiKey":"do-not-read"}',
    'eon:chat:history:v2': 'chat body'
  });
  const report = inspectVaultStorageNames({ storage });
  assert.equal(report.valuesRead, false);
  assert.deepEqual(report.legacyPlaintextCandidateKeys, ['eon:onboarding:providers:v1']);
  assert.ok(report.encryptedVaultRecords.includes('eon:api-key-vault:v1'));
});

test('W196 safe backup summary never contains raw values or recovery secret', () => {
  const summary = createSafeVaultBackupSummary();
  assert.equal(summary.includesRawSecrets, false);
  assert.equal(summary.includesDeviceRecoverySecret, false);
  assert.doesNotMatch(JSON.stringify(summary), /gsk_|AIza|seed phrase/i);
});

test('W196 Vault page is Chat-first and avoids the legacy dashboard runtime', () => {
  assert.match(vaultHtml, /data-eon-app-shell="1"/);
  assert.match(vaultHtml, /Local profile only/);
  assert.match(vaultHtml, /never rendered/i);
  assert.doesNotMatch(vaultHtml, /src="\/assets\/js\/vault-page\.js/);
  assert.doesNotMatch(vaultHtml, /Pool Points/);
  assert.match(vaultJs, /without reading or showing secret values/i);
  assert.match(profileHtml, /Profile & preferences/);
  assert.doesNotMatch(redirects, /\/profile \/profile\.html 200/);
});

test('W196 security truth never claims cross-device sync', () => {
  const report = getVaultSecurityTruth({ storage: fakeStorage() });
  assert.equal(report.pwa.crossDeviceSync, false);
  assert.match(report.notices.join(' '), /Cross-device sync is not active/i);
});

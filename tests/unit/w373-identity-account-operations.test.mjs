import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT } from '../../config/w373-identity-account-operations-contract.mjs';
import { runW373IdentityAccountOperationsGate } from '../../scripts/w373-identity-account-operations-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W373 keeps the D1 identity schema minimal and does not add cloud workspace storage', () => {
  const migration = read('identity/migrations/0001_eon_identity.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS eon_identity_accounts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS eon_identity_sessions/);
  for (const prohibited of W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT.prohibitedSchemaColumns) {
    assert.doesNotMatch(migration, new RegExp(prohibited.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(migration, /google_access_token|google_refresh_token|raw_email|chat_text|vault_data|card_number/i);
});

test('W373 keeps the local-work boundary visible without blocking identity-only sign-in', () => {
  const profile = read('profile.html');
  const runtime = read('assets/js/profile-page.js');
  assert.match(profile, /Optional account access only\. It never backs up this device\.|Your current work stays on this device/i);
  assert.doesNotMatch(profile, /eon-profile-google-data-ack/);
  assert.match(profile, /Back up this device/i);
  assert.match(profile, /eon-profile-delete-account/);
  assert.match(runtime, /DELETE_EON_ACCOUNT/);
  assert.match(runtime, /This device remains local|browser-local EONAPP work remains on this device/i);
});

test('W373 account deletion is exact-confirmation, same-origin, and only server-account scoped', () => {
  const deletion = read('functions/api/account/delete-request.js');
  assert.match(deletion, /enforceSameOriginMutation/);
  assert.match(deletion, /DELETE_EON_ACCOUNT/);
  assert.match(deletion, /deleteAuthenticatedAccount/);
  assert.doesNotMatch(deletion, /localStorage|sessionStorage|indexedDB|caches\.open|fetch\s*\(/i);
});

test('W373 source gate passes with guest-first and no-cloud-backup truth', () => {
  const report = runW373IdentityAccountOperationsGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.automaticCloudBackup, false);
});

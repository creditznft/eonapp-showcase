import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CompanionPairingAuthority, getPairingTruth } from '../../creator-companion/src/pairing.mjs';
import { getCredentialStoreTruth } from '../../creator-companion/src/credential-store.mjs';
import { getCreatorCompanionClientTruth } from '../../assets/js/direct-byok/companion-client.js';

function memoryStore() { const map = new Map(); return { get: (key) => map.get(key) || '', set: (key, value) => map.set(key, value), delete: (key) => map.delete(key) }; }

test('W626B pairing issues short-lived origin-bound sessions', () => {
  let shown = '';
  let now = 1000;
  const authority = new CompanionPairingAuthority({ credentialStore: memoryStore(), now: () => now, announce: (message) => { shown = message; } });
  const started = authority.start('https://eonapp.ch');
  const code = shown.match(/(\d{6})$/)?.[1];
  const confirmed = authority.confirm('https://eonapp.ch', started.challengeId, code);
  assert.equal(authority.verify('https://eonapp.ch', confirmed.sessionToken), true);
  assert.equal(authority.verify('http://localhost:5173', confirmed.sessionToken), false);
  now = confirmed.expiresAt + 1;
  assert.equal(authority.verify('https://eonapp.ch', confirmed.sessionToken), false);
});

test('W626B companion stays loopback-only and has no plaintext fallback', () => {
  const client = getCreatorCompanionClientTruth();
  const store = getCredentialStoreTruth();
  const source = fs.readFileSync(new URL('../../creator-companion/src/server.mjs', import.meta.url), 'utf8');
  assert.equal(client.loopbackHost, '127.0.0.1');
  assert.equal(client.lanAllowed, false);
  assert.equal(store.plaintextFileFallback, false);
  assert.match(source, /server\.listen\(PORT, HOST/);
  assert.equal(getPairingTruth().maxPairingAttempts, 5);
});

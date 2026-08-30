import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseTapSummary } from '../../scripts/run-current-unit-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] || null; }
}

async function loadVault() {
  globalThis.localStorage = new MemoryStorage();
  globalThis.sessionStorage = new MemoryStorage();
  return import(`../../assets/js/utils/api-key-vault.js?test=${Date.now()}-${Math.random()}`);
}

test('W646 keeps provider keys session-only by default', async () => {
  const { ApiKeyVault } = await loadVault();
  const receipt = await ApiKeyVault.store('groq', 'test-groq-key');
  assert.equal(receipt.custody, 'session-only');
  assert.equal(globalThis.localStorage.getItem('eon:api-key-vault:v2'), null);
  assert.equal(await ApiKeyVault.retrieve('groq'), 'test-groq-key');
});

test('W646 durable restore requires the user passphrase and never creates a device secret', async () => {
  const { ApiKeyVault } = await loadVault();
  const passphrase = 'correct horse battery staple';
  await ApiKeyVault.store('groq', 'test-groq-key', { persist: true, passphrase });
  globalThis.sessionStorage.removeItem('eon:ai-chat-session-keys:v1');
  const blocked = await ApiKeyVault.diagnoseRetrieve('groq');
  assert.equal(blocked.failureStage, 'passphrase-required');
  assert.equal(await ApiKeyVault.retrieve('groq', { passphrase }), 'test-groq-key');
  assert.equal(globalThis.localStorage.getItem('eon:api-key-vault:device-secret:v1'), null);
});

test('W646 classifies malformed encrypted envelopes without exposing values', async () => {
  const { ApiKeyVault, EON_API_KEY_VAULT_ENTRY_SCHEMA } = await loadVault();
  globalThis.localStorage.setItem('eon:api-key-vault:v2', JSON.stringify({ groq: { schema: EON_API_KEY_VAULT_ENTRY_SCHEMA, iv: 'not-base64' } }));
  const diagnostic = await ApiKeyVault.diagnoseRetrieve('groq', { passphrase: 'correct horse battery staple' });
  assert.equal(diagnostic.failureStage, 'envelope-malformed');
  assert.equal(diagnostic.nonEmptyKeyReturned, false);
});

test('W646 browser certification uses the canonical EONBOT surface and stable rerender waits', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/w646-browser-byok-certification.mjs'), 'utf8');
  assert.match(source, /page\.goto\(`\$\{baseUrl\}\/\?new=1`/);
  assert.doesNotMatch(source, /page\.goto\(`\$\{baseUrl\}\/chat\?new=1`/);
  assert.match(source, /async function waitForStableChatControls/);
  assert.match(source, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
  assert.match(source, /required\.evaluate\(\(element\) => element\.scrollIntoView/);
  assert.match(source, /Canonical EONBOT setup trigger is missing/);
});

test('W646 browser certification verifies provider-specific cleanup instead of assuming it', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/w646-browser-byok-certification.mjs'), 'utf8');
  assert.match(source, /\[provider\]/);
  assert.match(source, /ApiKeyVault\.status\(\)\.providers/);
  assert.match(source, /Boolean\(runtime\.getApiKey\(provider\)\)/);
  assert.match(source, /!removal\.encryptedEntryPresent/);
  assert.match(source, /!removal\.sessionKeyPresent/);
  assert.doesNotMatch(source, /receipt\.vault\.removedFromSession = true/);
  assert.doesNotMatch(source, /receipt\.vault\.removedFromEncryptedVault = true/);
});

test('W646 maintained-suite receipts parse both Node 22 and Node 24 TAP summaries', () => {
  assert.deepEqual(parseTapSummary('# tests 5\n# pass 4\n# fail 0\n# skipped 1\n'), { tests: 5, passed: 4, failed: 0, skipped: 1, cancelled: 0, todo: 0 });
  assert.deepEqual(parseTapSummary('ℹ tests 7\nℹ pass 7\nℹ fail 0\nℹ skipped 0\n'), { tests: 7, passed: 7, failed: 0, skipped: 0, cancelled: 0, todo: 0 });
});

test('W646 dialog diagnostics survive a missing or non-actionable setup control', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/w646-browser-byok-certification.mjs'), 'utf8');
  assert.match(source, /controlsChildElementCount/);
  assert.match(source, /controlsTextOnly/);
  assert.match(source, /requiredWithinControls/);
  assert.match(source, /setupScrollHeight/);
  assert.match(source, /scrollIntoView\(\{ behavior: 'instant'/);
  assert.match(source, /\$\{label\}-failed/);
});

test('W646 ASCII provider-certification prompts bypass optional UI-language routing translation', () => {
  const source = fs.readFileSync(path.join(root, 'assets/js/chat-page.js'), 'utf8');
  assert.match(source, /if \(!looksNonLatin\) return source;/);
});

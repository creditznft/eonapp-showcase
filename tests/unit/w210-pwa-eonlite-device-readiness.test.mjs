import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  LOCAL_RUNTIME_STATUS_KEY,
  LOCAL_RUNTIME_STATUS_SCHEMA,
  clearLocalRuntimeStatus,
  normalizeRuntimeEndpoint,
  readLocalRuntimeStatus,
  saveLocalRuntimeStatus
} from '../../assets/js/local-ai/local-runtime-status.js';
import { installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
installStoragePolyfill();

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

test('W210 Local AI stores only neutral local runtime proof and keeps a legacy record as a non-destructive migration source', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage({
    'eon:lite:runtime-status:v1': JSON.stringify({ ok: true, runtime: 'Ollama', model: 'local-model', endpoint: 'http://127.0.0.1:11434', checkedAt: '2026-06-24T00:00:00.000Z' })
  });
  const migrated = readLocalRuntimeStatus();
  assert.equal(migrated.schema, LOCAL_RUNTIME_STATUS_SCHEMA);
  assert.equal(migrated.ok, true);
  assert.match(globalThis.localStorage.getItem(LOCAL_RUNTIME_STATUS_KEY), /local-model/);
  assert.match(globalThis.localStorage.getItem('eon:lite:runtime-status:v1'), /local-model/);
  const saved = saveLocalRuntimeStatus({ ok: true, runtime: 'LM Studio', model: 'my-local-model', endpoint: 'http://127.0.0.1:1234/v1?token=secret', note: 'ok' });
  assert.equal(saved.endpoint, 'http://127.0.0.1:1234/v1');
  assert.equal(normalizeRuntimeEndpoint('javascript:alert(1)', 'Ollama'), 'http://127.0.0.1:11434');
  assert.equal(clearLocalRuntimeStatus({ model: 'my-local-model' }).ok, true);
  globalThis.localStorage = original;
});

test('W210 canonical Local AI surface uses the neutral runtime and the PWA precache excludes retired EON Lite modules', () => {
  const html = read('local-ai.html');
  const page = read('assets/js/local-ai/local-ai-page.js');
  const runtime = read('assets/js/local-ai/local-runtime-status.js');
  const sw = read('sw.js');
  const precache = sw.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  assert.match(html, /assets\/js\/local-ai\/local-ai-page\.js/);
  assert.match(html, /href="\/">Back to EONBOT/);
  assert.match(page, /Run self-test/);
  assert.match(page, /does not start a runtime, download a model, or send hardware details anywhere/i);
  assert.match(page, /The download starts only after your tap/i);
  assert.match(page, /EON never silently switches Local AI to a cloud provider/i);
  assert.match(page, /Third-party installation\/model downloads remain explicit; setup is never silently sent to a cloud service/i);
  assert.match(runtime, /LOCAL_RUNTIME_STATUS_SCHEMA/);
  assert.match(sw, /W476 owned-cache\/update-safety boundary/);
  assert.match(sw, /const RELEASE_ID = '[a-z0-9._-]+'/i);
  assert.match(sw, /Canonical public documents only/);
  assert.match(sw, /CITY_RUNTIME_RELEASE_CACHE_PREFIXES/);
  assert.match(sw, /\/assets\/js\/city\//);
  assert.doesNotMatch(sw, /const VERSION = 'v54'/);
  assert.doesNotMatch(precache, /\/assets\/js\//);
  assert.doesNotMatch(precache, /\/assets\/css\//);
  assert.doesNotMatch(precache, /assets\/js\/eon-lite\//);
});

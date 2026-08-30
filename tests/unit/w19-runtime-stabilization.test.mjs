import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

const localStore = new MemoryStorage();
const sessionStore = new MemoryStorage();

globalThis.localStorage = localStore;
globalThis.sessionStorage = sessionStore;
globalThis.location = { origin: 'https://eonapp.ch' };
globalThis.window = {
  location: globalThis.location,
  setTimeout,
  clearTimeout,
  AbortController: globalThis.AbortController,
  navigator: { webdriver: false },
  dispatchEvent() {},
  CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }
};
try { Object.defineProperty(globalThis, 'navigator', { value: globalThis.window.navigator, configurable: true }); } catch {}
globalThis.CustomEvent = globalThis.window.CustomEvent;

const runtime = await import('../../assets/js/chat/ai-runtime.js');

test('W19 filters non-chat/transcription models before provider selection', () => {
  const models = runtime.filterChatCapableModels([
    'whisper-large-v3-turbo',
    'text-embedding-3-small',
    'llama-3.3-70b-versatile',
    'qwen-2.5-32b-instruct'
  ]);
  assert.deepEqual(models, ['llama-3.3-70b-versatile', 'qwen-2.5-32b-instruct']);
  assert.equal(runtime.selectBestChatModel(models, 'groq'), 'llama-3.3-70b-versatile');
});

test('W19 verifies Groq key with discovered chat-capable model', async () => {
  localStore.clear();
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://api.groq.com/openai/v1/models');
    return new Response(JSON.stringify({
      data: [
        { id: 'whisper-large-v3-turbo' },
        { id: 'llama-3.3-70b-versatile' }
      ]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const result = await runtime.verifyProviderReadiness('groq', 'gsk_test', { forceRefresh: true });
  assert.equal(result.ok, true);
  assert.equal(result.model, 'llama-3.3-70b-versatile');
  assert.equal(result.discoveredCount, 1);
});

test('W19 detects local Ollama when user explicitly requests local scan', async () => {
  localStore.clear();
  globalThis.fetch = async (url) => {
    if (String(url).includes('11434')) {
      return new Response(JSON.stringify({ models: [{ name: 'llama3.2:latest' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new TypeError('connection refused');
  };
  const providers = await runtime.detectLocalProviders({ force: true });
  assert.ok(providers.some((provider) => provider.provider === 'ollama' && provider.available));
});

test('W19 service worker no longer precaches removed CSS bundle names', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.match(sw, /VERSION = 'v50'/);
  assert.doesNotMatch(sw, /\/assets\/css\/base\.css/);
  assert.doesNotMatch(sw, /\/assets\/css\/layout\.css/);
  assert.doesNotMatch(sw, /\/assets\/css\/components\.css/);
});

test('W19 CSP allows user-triggered localhost runtime checks and browser self frames', () => {
  const onboarding = fs.readFileSync('onboarding.html', 'utf8');
  assert.match(onboarding, /http:\/\/127\.0\.0\.1:\*/);
  assert.match(onboarding, /http:\/\/localhost:\*/);
  const browser = fs.readFileSync('eon-browser.html', 'utf8');
  assert.match(browser, /frame-src 'self' blob:/);
});

test('W19 ad provider markers stay removed from launch surfaces', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8')
    .replace(/<meta[^>]+name="adwixo-verification"[^>]*>/gi, '')
    .replace(/<meta[^>]+name="monetag"[^>]*>/gi, '');
  assert.doesNotMatch(indexHtml, /adwixo|monetag|quge5|data-ad-slot|Sponsored/i);

  const headers = fs.readFileSync('_headers', 'utf8');
  const publicHeaders = fs.readFileSync('public/_headers', 'utf8');
  for (const text of [headers, publicHeaders]) {
    const sanitized = text
      .replace(/\/reward-access\.html[\s\S]*?(?=\n\/|\s*$)/g, '')
      .replace(/\/telegram(?:\.html)?[\s\S]*?(?=\n\/|\s*$)/g, '');
    assert.doesNotMatch(sanitized, /adwixo|monetag|quge5|data-ad-slot|Sponsored/i);
    assert.match(text, /\/reward-access\.html[\s\S]*https:\/\/\*\.monetag\.com/i);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('AI live supertest includes remote env, Ollama, browser CSP, and masked reports', () => {
  const script = readFileSync('scripts/ai-live-supertest.mjs', 'utf8');
  assert.match(script, /EON_OPENAI_API_KEY/);
  assert.match(script, /EON_GROQ_API_KEY/);
  assert.match(script, /EON_GEMINI_API_KEY/);
  assert.match(script, /OLLAMA_BASE_URL/);
  assert.match(script, /\/api\/tags/);
  assert.match(script, /\/api\/chat/);
  assert.match(script, /browser-csp-localhost/);
  assert.match(script, /EONAPP_AI_LIVE_SUPERTEST_RESULTS/);
  assert.match(script, /mask\(/);
});

test('package exposes AI live supertest scripts without putting them in default unit test runner', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['qa:ai-live-super'], 'node scripts/ai-live-supertest.mjs');
  assert.equal(pkg.scripts['qa:ai-live-super:strict'], 'node scripts/ai-live-supertest.mjs --strict');
  assert.equal(pkg.scripts['qa:ai-live-super:local'], 'node scripts/ai-live-supertest.mjs --no-remote --local-model-limit 20');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const live = readFileSync(new URL('../../scripts/live-ai-e2e-matrix.mjs', import.meta.url), 'utf8');
const smoke = [
  'scripts/ai-live-supertest.mjs',
  'scripts/browser-cockpit-proof.mjs',
  'scripts/smoke-shared.mjs',
  'scripts/provider-smoke-matrix.mjs'
].map((path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')).join('\n');

test('RT92 live provider matrix reuses canonical provider discovery and selection', () => {
  assert.match(live, /discoverProviderModels/);
  assert.match(live, /selectBestChatModel/);
  assert.match(live, /pickCanonicalProviderModel/);
});

test('RT92 live browser proof never seeds raw provider keys into localStorage', () => {
  assert.doesNotMatch(live, /localStorage\.setItem\(['"]eon:ai-chat-device-keys:v1/);
  assert.doesNotMatch(live, /localStorage\.setItem\(['"]eon:workbench:provider-keys:v1/);
  assert.match(live, /sessionStorage\.setItem\(['"]eon:ai-chat-session-keys:v1/);
});

test('RT92 live matrix does not probe source-disabled hosted providers as supported', () => {
  assert.match(live, /SKIP_DISABLED_BY_CURRENT_PRODUCT_AUTHORITY/);
  for (const provider of ['nvidia', 'sambanova', 'cohere', 'anthropic']) {
    assert.doesNotMatch(live, new RegExp(`await\\s+probe(?:OpenAICompatible|Cohere|Anthropic)\\(['"]${provider}-text`));
  }
});

test('RT92 OpenRouter live proof disables router fallbacks and data collection', () => {
  assert.match(live, /allow_fallbacks:\s*false/);
  assert.match(live, /require_parameters:\s*true/);
  assert.match(live, /data_collection:\s*['"]deny['"]/);
});

test('RT92 Groq live defaults are migrated off the August 16 developer-tier shutdown models', () => {
  const all = `${live}\n${smoke}`;
  assert.doesNotMatch(all, /['"]llama-3\.1-8b-instant['"]/);
  assert.doesNotMatch(all, /['"]llama-3\.3-70b-versatile['"]/);
  assert.match(all, /openai\/gpt-oss-(?:20b|120b)/);
});

test('RT92 live matrix uses max_completion_tokens on reviewed OpenAI-compatible rails that require it', () => {
  assert.match(live, /completionTokenField:\s*['"]max_completion_tokens['"]/);
});

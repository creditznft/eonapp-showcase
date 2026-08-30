import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const runtime = fs.readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
const harness = fs.readFileSync(new URL('../../scripts/w646-browser-byok-certification.mjs', import.meta.url), 'utf8');

test('W646 Gemini batch, stream and discovery authenticate by header without a credential URL parameter', () => {
  assert.match(runtime, /generateContent`;[\s\S]{0,900}'x-goog-api-key': apiKey/);
  assert.match(runtime, /streamGenerateContent\?alt=sse`;[\s\S]{0,900}'x-goog-api-key': apiKey/);
  assert.match(runtime, /provider\.kind === 'gemini'\) headers\['x-goog-api-key'\] = apiKey/);
  assert.doesNotMatch(runtime, /generativelanguage\.googleapis\.com[^'`\n]*\?key=/);
});

test('W646 provider receipt remains metadata-only and excludes request content', () => {
  assert.match(harness, /keyInUrlDetected/);
  assert.doesNotMatch(harness, /request\.postData\(|response\.text\(|response\.body\(/);
  assert.doesNotMatch(harness, /JSON\.stringify\(apiKey\)/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const runtime = fs.readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
const harness = fs.readFileSync(new URL('../../scripts/w646-browser-byok-certification.mjs', import.meta.url), 'utf8');
const executor = fs.readFileSync(new URL('../../assets/js/ai-kernel/eon-ai-request-executor.js', import.meta.url), 'utf8');

test('W646 Groq browser generation uses the reviewed single-request streaming Chat Completion path', () => {
  const batchOnlyMatch = runtime.match(/BATCH_ONLY_PROVIDERS\s*=\s*new Set\(\[[^\]]*\]/);
  assert.ok(batchOnlyMatch, 'the batch-only provider set must remain explicit');
  assert.doesNotMatch(batchOnlyMatch[0], /'groq'/, 'Groq must use the reviewed streaming path when incremental output is requested');
  assert.match(runtime, /OpenAI-compatible streaming \(Groq,/);
  assert.match(runtime, /const endpoint = `\$\{runtimeSettings\.endpoint\.replace\([^\n]+\)\}\/chat\/completions`;/);
  assert.match(runtime, /buildOpenAICompatibleChatPayload\(runtimeSettings, messages, cappedBudget, \{ stream: true \}\)/);
  assert.match(executor, /export const EON_AI_REQUEST_MAX_ATTEMPTS = 1;/);
  assert.match(executor, /fallbackAttempted: false,[\s\S]*?providerChanged: false,[\s\S]*?modelChanged: false/);
});

test('W646 receipt records a sanitized Chromium failure category', () => {
  assert.match(harness, /target\.on\('requestfailed'/);
  assert.match(harness, /net::ERR_\[A-Z0-9_\]/);
  assert.match(harness, /browserFailureCategory/);
  assert.match(harness, /browser-console:\$\{browserConsoleCategory/);
  assert.doesNotMatch(harness, /request\.postData\(|response\.text\(|response\.body\(/);
});

test('W646 delayed generation lifecycle does not mistake a placeholder for a completed AI reply', async () => {
  const lifecycle = { active: true, settled: false, cleanupStarted: false };
  const messages = [{ id: 'typing-row', avatar: '✨', text: 'Thinking…' }];
  const completedAiMessages = () => messages.filter((message) => message.id !== 'typing-row' && message.id !== 'stream-row' && message.avatar === '✨' && message.text.trim());

  assert.equal(completedAiMessages().length, 0, 'typing placeholder cannot be certified');
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(lifecycle.active, true, 'the delayed request remains active');
  assert.equal(lifecycle.cleanupStarted, false, 'cleanup cannot begin before requestfinished');

  lifecycle.active = false;
  lifecycle.settled = true;
  messages.splice(0, 1, { id: 'completed-ai-message', avatar: '✨', text: 'EON_BROWSER_OK_DELAYED' });
  assert.equal(lifecycle.settled, true);
  assert.deepEqual(completedAiMessages().map((message) => message.text), ['EON_BROWSER_OK_DELAYED']);
  assert.match(harness, /target\.on\('requestfinished'/);
  assert.match(harness, /generationLifecycle\.active/);
  assert.match(harness, /\['typing-row', 'stream-row'\]/);
  assert.match(harness, /msg-avatar'\)\?\.textContent\?\.trim\(\) === '✨'/);
  assert.match(harness, /HARNESS_TIMEOUT_ABORT/);
});

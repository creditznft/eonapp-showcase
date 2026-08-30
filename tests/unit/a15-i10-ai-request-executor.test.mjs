import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EON_AI_REQUEST_MAX_ATTEMPTS,
  EonAiRequestExecutionError,
  createEonAiRequestPlan,
  executeEonAiRequest,
  getEonAiRequestExecutorTruth
} from '../../assets/js/ai-kernel/eon-ai-request-executor.js';

const cryptoApi = { randomUUID: () => '00000000-0000-4000-8000-000000000010' };

function plan(overrides = {}) {
  return createEonAiRequestPlan({
    providerId: 'mistral',
    model: 'mistral-small-latest',
    origin: 'chat',
    taskType: 'chat',
    userInitiated: true,
    consentSource: 'chat-send-action',
    inputChars: 10,
    ...overrides
  }, { cryptoApi, now: () => 1000 });
}

test('A15 I10 accepts only a user-initiated exact provider/model request with consent', () => {
  const valid = plan();
  assert.equal(valid.state, 'ready');
  assert.equal(valid.maxAttempts, 1);
  assert.equal(valid.allowProviderFallback, false);
  assert.equal(valid.allowModelFallback, false);
  const rejected = plan({ userInitiated: false, consentSource: '', allowProviderFallback: true });
  assert.equal(rejected.state, 'rejected');
  assert.deepEqual(rejected.errors, ['user-initiation-required', 'request-consent-required', 'silent-fallback-forbidden']);
});

test('A15 I10 executes one transport attempt and emits a redacted settlement receipt', async () => {
  let attempts = 0;
  const result = await executeEonAiRequest({
    plan: plan(),
    now: (() => { let value = 1000; return () => value += 25; })(),
    transport: async ({ attempt, plan: activePlan }) => {
      attempts += 1;
      assert.equal(attempt, 1);
      assert.equal(activePlan.providerId, 'mistral');
      return { text: 'private output' };
    }
  });
  assert.equal(attempts, 1);
  assert.equal(result.value.text, 'private output');
  assert.equal(result.receipt.state, 'completed');
  assert.equal(result.receipt.attemptCount, 1);
  assert.equal(result.receipt.fallbackAttempted, false);
  assert.equal(result.receipt.containsPrompt, false);
  assert.equal(result.receipt.containsReply, false);
  assert.equal(result.receipt.containsApiKey, false);
});

test('A15 I10 never retries a failing paid-provider attempt', async () => {
  let attempts = 0;
  await assert.rejects(
    executeEonAiRequest({
      plan: plan(),
      transport: async () => { attempts += 1; throw Object.assign(new Error('Provider 503'), { code: 'provider-503' }); }
    }),
    (error) => {
      assert.equal(error instanceof EonAiRequestExecutionError, true);
      assert.equal(error.receipt.state, 'failed');
      assert.equal(error.receipt.attemptCount, 1);
      assert.equal(error.receipt.errorCode, 'provider-503');
      return true;
    }
  );
  assert.equal(attempts, 1);
});

test('A15 I10 cancellation before and during transport is terminal and cannot fall back', async () => {
  const before = new AbortController();
  before.abort('owner-cancelled');
  await assert.rejects(executeEonAiRequest({ plan: plan(), signal: before.signal, transport: async () => 'never' }), (error) => {
    assert.equal(error.receipt.state, 'cancelled');
    assert.equal(error.receipt.attemptCount, 0);
    assert.equal(error.receipt.cancellationReason, 'owner-cancelled');
    return true;
  });

  const during = new AbortController();
  await assert.rejects(executeEonAiRequest({
    plan: plan(),
    signal: during.signal,
    transport: async ({ signal }) => {
      during.abort('stop-now');
      await new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
        if (signal.aborted) reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        else resolve();
      });
    }
  }), (error) => {
    assert.equal(error.receipt.state, 'cancelled');
    assert.equal(error.receipt.attemptCount, 1);
    assert.equal(error.receipt.fallbackAttempted, false);
    return true;
  });
});

test('A15 I10 truth and source prohibit legacy orchestrator loading in normal Chat', () => {
  const truth = getEonAiRequestExecutorTruth();
  assert.equal(truth.maxAttempts, EON_AI_REQUEST_MAX_ATTEMPTS);
  assert.equal(truth.hiddenRetryAllowed, false);
  const chatPage = readFileSync(new URL('../../assets/js/chat-page.js', import.meta.url), 'utf8');
  const runtime = readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
  const mission = readFileSync(new URL('../../assets/js/utils/mission-engine.js', import.meta.url), 'utf8');
  assert.doesNotMatch(chatPage, /agent-orchestrator|provider-orchestrator|request-orchestrator-bridge/i);
  assert.doesNotMatch(runtime, /agent-orchestrator|provider-orchestrator|request-orchestrator-bridge/i);
  assert.doesNotMatch(mission, /agent-orchestrator|provider-orchestrator|request-orchestrator-bridge/i);
  assert.match(runtime, /createEonAiRequestPlan/);
  assert.match(runtime, /executeEonAiRequest/);
  assert.match(runtime, /requestReceipt: settled\.receipt/);
  assert.doesNotMatch(runtime, /_withRetry|RETRY_MAX/);
});

test('A15 I10 active Chat, Mission and Forge callers declare the user action and consent source', () => {
  const chat = readFileSync(new URL('../../assets/js/chat-page.js', import.meta.url), 'utf8');
  const mission = readFileSync(new URL('../../assets/js/utils/mission-engine.js', import.meta.url), 'utf8');
  const forge = readFileSync(new URL('../../assets/js/forge/forge-ai-controller.js', import.meta.url), 'utf8');
  assert.match(chat, /userInitiated: true, consentSource: 'chat-send-action'/);
  assert.match(mission, /consentSource: String\(metadata\?\.consentSource/);
  assert.match(forge, /userInitiated: true, consentSource: 'forge-reviewed-source-selection'/);
});

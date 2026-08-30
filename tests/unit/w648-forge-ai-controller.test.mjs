import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOpenAICompatibleChatPayload } from '../../assets/js/chat/ai-runtime.js';
import { createForgeAiGovernor, getForgeAiReadiness, runForgeAiRequest } from '../../assets/js/forge/forge-ai-controller.js';
import { FORGE_AI_SCHEMA } from '../../assets/js/forge/forge-ai-protocol.js';
import { EON_FORGE_QUICK_BUILD } from '../../assets/js/forge/eon-forge-quick-build.js';

const settings = { provider: 'groq', model: 'verified-model', endpoint: 'https://api.groq.com/openai/v1', assistantMode: 'advanced' };
const providers = { guide: { id: 'guide', label: 'Guide only' }, groq: { id: 'groq', label: 'Groq', defaultEndpoint: settings.endpoint, enabled: true } };
const base = EON_FORGE_QUICK_BUILD.buildProject({ title: 'Controller', brief: 'Test the trusted controller.', type: 'website', style: 'graphite' }).files;
const nextScript = `${base['script.js']}\ndocument.body.dataset.controller = 'passed';`;
const payload = JSON.stringify({ schema: FORGE_AI_SCHEMA, requestId: 'controller-1', summary: 'Controller improvement', changes: [{ path: 'script.js', content: nextScript }] });

function overrides(extra = {}) {
  return {
    providers,
    loadAISettings: () => settings,
    getProviderVerification: () => ({ ready: true, state: 'verified-model-list', model: settings.model, endpoint: settings.endpoint, checkedAt: '2026-07-13T00:00:00.000Z' }),
    ...extra
  };
}

test('W648 readiness blocks requests when no provider is verified', async () => {
  let calls = 0;
  const blocked = overrides({
    getProviderVerification: () => ({ ready: false, state: 'verification-required', reason: 'Verify Groq first.', model: '' }),
    createAIReply: async () => { calls += 1; return {}; }
  });
  const readiness = getForgeAiReadiness(settings, blocked);
  assert.equal(readiness.ready, false);
  const result = await runForgeAiRequest({ files: base, instruction: 'Improve it', selectedPaths: ['script.js'], requestId: 'controller-1', settings }, blocked);
  assert.equal(result.ok, false);
  assert.equal(result.state, 'not-ready');
  assert.equal(calls, 0);
});

test('W648 verified provider returns one validated proposal with exact provider and model settlement', async () => {
  const result = await runForgeAiRequest({ files: base, instruction: 'Improve interaction behavior', selectedPaths: ['script.js'], requestId: 'controller-1', settings }, overrides({
    createAIReply: async ({ settings: requestSettings, governor }) => {
      assert.equal(requestSettings.taskType, 'forge-code');
      assert.equal(requestSettings.temperature, 0.2);
      assert.equal(requestSettings.abortSignal instanceof AbortSignal, true);
      assert.equal(governor.createAbortController().signal, requestSettings.abortSignal);
      assert.equal(governor.getBudget().maxOutputTokens, 4096);
      return { text: payload, meta: { providerId: 'groq', provider: 'Groq', model: 'verified-model', elapsedMs: 120, local: false } };
    }
  }));
  assert.equal(result.ok, true);
  assert.equal(result.proposal.providerId, 'groq');
  assert.equal(result.proposal.model, 'verified-model');
  assert.match(result.proposal.nextFiles['script.js'], /controller = 'passed'/);
});

test('W648 rejects provider/model mismatch and 401/402/429 failures without producing a proposal', async () => {
  const mismatch = await runForgeAiRequest({ files: base, instruction: 'Improve interaction behavior', selectedPaths: ['script.js'], requestId: 'controller-1', settings }, overrides({
    createAIReply: async () => ({ text: payload, meta: { providerId: 'openai', model: 'verified-model' } })
  }));
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.state, 'provider-mismatch');

  for (const [message, state] of [['401 Unauthorized', 'unauthorized'], ['402 Payment required', 'payment-required'], ['429 rate limit', 'rate-limited']]) {
    const failed = await runForgeAiRequest({ files: base, instruction: 'Improve interaction behavior', selectedPaths: ['script.js'], requestId: 'controller-1', settings }, overrides({ createAIReply: async () => { throw new Error(message); } }));
    assert.equal(failed.ok, false);
    assert.equal(failed.state, state);
    assert.equal(failed.proposal, undefined);
  }
});

test('W648 cancel token discards a late valid response', async () => {
  const token = { cancelled: false };
  const result = await runForgeAiRequest({ files: base, instruction: 'Improve interaction behavior', selectedPaths: ['script.js'], requestId: 'controller-1', settings, cancelToken: token }, overrides({
    createAIReply: async () => { token.cancelled = true; return { text: payload, meta: { providerId: 'groq', model: 'verified-model' } }; }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.state, 'cancelled');
});

test('W648 dedicated Forge governor raises only the explicit code workload budget', () => {
  const budget = createForgeAiGovernor().getBudget();
  assert.equal(budget.maxInputChars, 56000);
  assert.equal(budget.maxOutputTokens, 4096);
  assert.equal(budget.maxHistoryMessages, 0);
});


test('W648B keeps normal chat temperature unchanged while allowing Forge structured generation to lower it', () => {
  const messages = [{ role: 'user', content: 'Hello' }];
  const budget = { maxOutputTokens: 100 };
  assert.equal(buildOpenAICompatibleChatPayload({ provider: 'groq', model: 'test' }, messages, budget).temperature, 0.7);
  assert.equal(buildOpenAICompatibleChatPayload({ provider: 'groq', model: 'test', temperature: 0.2 }, messages, budget).temperature, 0.2);
  assert.equal(buildOpenAICompatibleChatPayload({ provider: 'groq', model: 'test', temperature: 9 }, messages, budget).temperature, 1);
});


test('W648C active cancellation aborts the provider transport instead of only ignoring a late result', async () => {
  const token = { cancelled: false };
  const abortController = new AbortController();
  const request = runForgeAiRequest({ files: base, instruction: 'Improve interaction behavior', action: 'fix', selectedPaths: ['script.js'], requestId: 'controller-1', settings, cancelToken: token, abortController }, overrides({
    createAIReply: async ({ settings: requestSettings }) => new Promise((_resolve, reject) => {
      requestSettings.abortSignal.addEventListener('abort', () => reject(new Error('Request cancelled.')), { once: true });
    })
  }));
  token.cancelled = true;
  abortController.abort('forge-cancelled');
  const result = await request;
  assert.equal(result.ok, false);
  assert.equal(result.state, 'cancelled');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { extractOpenAICompatibleModelIds } from '../../assets/js/chat/ai-provider-model-manifest.mjs';
import { evaluateAiProviderModelCompatibility } from '../../config/ai-api-contracts.mjs';
test('Together accepts a top-level namespaced model manifest', () => {
  assert.deepEqual(extractOpenAICompatibleModelIds([{ id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }]), ['meta-llama/Llama-3.3-70B-Instruct-Turbo']);
  assert.equal(evaluateAiProviderModelCompatibility('together', 'meta-llama/Llama-3.3-70B-Instruct-Turbo').allowed, true);
  assert.equal(evaluateAiProviderModelCompatibility('together', 'gpt-4o').allowed, false);
});

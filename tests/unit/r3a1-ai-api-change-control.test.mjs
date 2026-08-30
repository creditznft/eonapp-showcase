import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_HOSTED_PROVIDER_IDS,
  AI_PROVIDER_CONTRACTS,
  AI_PROVIDER_REVIEW_BOARD,
  REVIEWED_HOSTED_PROVIDER_IDS,
  evaluateAiProviderModelCompatibility,
  isRetiredNvidiaTeamScopedPath
} from '../../config/ai-api-contracts.mjs';
import {
  buildR3A1ApiChangeControlBoard,
  validateR3A1ApiChangeControlBoard
} from '../../assets/js/utils/r3a1-ai-api-change-control.js';
import { PROVIDERS } from '../../assets/js/chat/ai-provider-catalog.js';

test('W260-R3 A1 records every active hosted contract with HTTPS model verification', () => {
  assert.ok(ACTIVE_HOSTED_PROVIDER_IDS.length >= 13);
  assert.equal(REVIEWED_HOSTED_PROVIDER_IDS.length, 15);
  assert.equal(ACTIVE_HOSTED_PROVIDER_IDS.includes('nvidia'), false);
  assert.equal(ACTIVE_HOSTED_PROVIDER_IDS.includes('sambanova'), false);
  for (const id of ACTIVE_HOSTED_PROVIDER_IDS) {
    const row = AI_PROVIDER_CONTRACTS[id];
    assert.match(row.baseUrl, /^https:\/\//);
    assert.match(row.modelsUrl, /^https:\/\//);
    if (id === 'perplexity') assert.equal(row.readinessProof, 'user-initiated-public-model-catalogue-plus-first-inference-key-proof');
    else assert.equal(row.readinessProof, 'user-initiated-authenticated-model-list');
    assert.equal(row.executionPolicy, 'byok-only');
  }
});

test('W260-R3 A1 distinguishes retired NVIDIA NGC team paths from API Catalog inference', () => {
  assert.equal(isRetiredNvidiaTeamScopedPath('/v2/orgs/acme/teams/legacy/nvcf/functions/abc'), true);
  assert.equal(isRetiredNvidiaTeamScopedPath('/v3/ngc/nvcf/orgs/acme/teams/legacy/keys/abc'), true);
  assert.equal(isRetiredNvidiaTeamScopedPath('https://integrate.api.nvidia.com/v1/chat/completions'), false);
  assert.equal(AI_PROVIDER_CONTRACTS.nvidia.baseUrl, 'https://integrate.api.nvidia.com/v1');
});

test('W260-R3 A1 board stays static-only and does not invent BYOK evidence', () => {
  const board = buildR3A1ApiChangeControlBoard();
  const validation = validateR3A1ApiChangeControlBoard(board);
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(board.externalEvidence.providerAccountCompatibility, 'not-collected-in-source-freeze');
  assert.ok(board.claimFence.some((row) => /not a live provider-account/i.test(row)));
});


test('W260-R3 A1 keeps API review records static and preserves the current DeepSeek contract', () => {
  assert.equal(AI_PROVIDER_CONTRACTS.deepseek.baseUrl, 'https://api.deepseek.com');
  assert.equal(AI_PROVIDER_CONTRACTS.deepseek.modelsUrl, 'https://api.deepseek.com/models');
  assert.equal(AI_PROVIDER_CONTRACTS.xai.migration.chatCompletions, 'legacy-supported');
  assert.equal(AI_PROVIDER_CONTRACTS.qwen.migration.workspaceSpecificRegionalEndpoint, 'supported-after-user-selection');
  assert.equal(AI_PROVIDER_CONTRACTS.fireworks.modelsUrl, 'https://api.fireworks.ai/v1/accounts/fireworks/models?filter=supports_serverless%3Dtrue&pageSize=200');
  assert.equal(evaluateAiProviderModelCompatibility('groq', 'llama-3.1-8b-instant').allowed, true); // Enterprise may still expose it; automatic selection avoidance is tested separately.
  assert.equal(evaluateAiProviderModelCompatibility('groq', 'openai/gpt-oss-20b').allowed, true);
  for (const id of REVIEWED_HOSTED_PROVIDER_IDS) {
    assert.equal(AI_PROVIDER_REVIEW_BOARD[id]?.status, 'static-contract-reviewed');
    assert.equal(AI_PROVIDER_REVIEW_BOARD[id]?.liveAccountProof, 'required-on-user-action');
  }
});


test('W260-R3 A1 runtime enabled hosted providers exactly match governed active contracts', () => {
  const runtimeEnabled = Object.values(PROVIDERS)
    .filter((provider) => provider?.enabled !== false && provider?.requiresApiKey === true && Boolean(provider?.modelsUrl))
    .map((provider) => provider.id)
    .sort();
  assert.deepEqual(runtimeEnabled, [...ACTIVE_HOSTED_PROVIDER_IDS].sort());
  for (const id of ['cohere', 'anthropic', 'nvidia', 'sambanova']) {
    assert.equal(PROVIDERS[id]?.enabled, false, `${id} must remain dormant until separately re-reviewed`);
  }
});

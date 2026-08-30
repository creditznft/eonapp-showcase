import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEonappKnowledgeContext, getEonappKnowledgeTruth } from '../../config/eonapp-ai-knowledge-base.mjs';
import { buildCapabilityTruthContext } from '../../assets/js/capabilities/capability-truth-registry.js';
import {
  classifyEonAiMemoryCandidate,
  exportEonAiMemorySnapshot,
  forgetEonAiMemoryCard,
  getEonAiMemoryTruth,
  listEonAiMemory,
  recallEonAiMemory,
  rememberEonAiMemory,
  updateEonAiMemoryCard
} from '../../assets/js/ai-kernel/eon-ai-memory-ledger.js';
import { readEonAiMemoryPolicy, writeEonAiMemoryPolicy } from '../../assets/js/ai-kernel/eon-ai-memory-policy.js';
import { getEonAiStructuredMemoryTruth, rememberEonAiStructuredSignal } from '../../assets/js/ai-kernel/eon-ai-structured-memory.js';
import { buildEonAiRoutingPolicy, assessEonAiProviderRoute, getEonAiRoutingPolicyTruth } from '../../assets/js/ai-kernel/eon-ai-routing-policy.js';
import { clearEonAiEvaluations, getEonAiEvaluationTruth, recordEonAiEvaluation, recordEonAiOperationalOutcome, recordEonAiUserQualityFeedback, summarizeEonAiModelEvidence } from '../../assets/js/ai-kernel/eon-ai-evaluation-ledger.js';
import { buildEonVerifiedModelEnvelope, describeEonModel, selectEonInstitutionalModel } from '../../assets/js/chat/eon-model-intelligence-registry.js';
import { extractProviderModelManifest, getProviderModelManifestTruth, manifestMetadataByModel } from '../../assets/js/chat/ai-provider-model-manifest.mjs';
import { capBudgetForVerifiedModelContext, classifyEonChatTask, resolveVerifiedRequestModel, selectBestChatModel } from '../../assets/js/chat/ai-runtime.js';
import { findPreferredDiscoveredLocalModel, getLocalAiStarterCatalog } from '../../assets/js/local-ai/local-ai-catalog.js';
import { buildLocalModelInstallHandoff, buildLocalModelLifecycleState, getLocalModelLifecycleTruth } from '../../assets/js/local-ai/eon-local-model-lifecycle.js';
import { buildLocalAiSetupGuide } from '../../config/local-ai-setup-guide-contract.mjs';
import { buildEonMusicCapabilityPlan, getEonMusicCapabilityTruth } from '../../assets/js/creator/music/eon-music-capability-router.js';
import { buildAutoDjSetPlan, getEonAutoDjPlanTruth } from '../../assets/js/creator/music/eon-auto-dj.js';
import { createEonAutoDjPreviewSession, getEonAutoDjPreviewTruth } from '../../assets/js/creator/music/eon-auto-dj-preview.js';
import { canRecordMusicOutcome, getEonMusicArtifactProofTruth, prepareMusicArtifactProof, verifyMusicArtifactReopen } from '../../assets/js/creator/music/eon-music-artifact-proof.js';
import { createEonRadioStation, deleteEonRadioStation, listEonRadioStations } from '../../assets/js/creator/music/eon-radio-store.js';
import { createEonRadioSession } from '../../assets/js/creator/music/eon-radio-session.js';
import { createEonRadioPlayer, getEonRadioPlayerTruth } from '../../assets/js/creator/music/eon-radio-player.js';
import { buildEonRadioNextTrackPlan, getEonRadioNextTrackTruth } from '../../assets/js/creator/music/eon-radio-next-track.js';
import { getEonRadioPreferenceMemoryTruth, readEonRememberedRadioPreferences } from '../../assets/js/creator/music/eon-radio-preference-memory.js';
import { EON_CREATE_MODES } from '../../assets/js/create/eon-create-catalog.js';
import { consumeEonCreatorIntentHandoff, getEonCreatorIntentHandoffTruth, writeEonCreatorIntentHandoff } from '../../assets/js/create/eon-creator-intent-handoff.js';
import { buildEonbotCommandHubPlan } from '../../assets/js/chat/eonbot-command-hub.js';
import { discoverAceStepLocalMusic, generateAceStepLocalMusic, getAceStepLocalMusicTruth } from '../../assets/js/creator/music/eon-acestep-local-adapter.js';
import { renderComfyUiImageLab } from '../../assets/js/local-ai/comfyui-image-lab.js';
import { renderComfyUiVideoLab } from '../../assets/js/local-ai/comfyui-video-lab.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

test('Institutional grounding expands beyond W605 and resolves specific media truth', () => {
  const truth = getEonappKnowledgeTruth();
  assert.equal(truth.hybridRetrieval, true);
  assert.equal(truth.authorityMetadata, true);
  assert.ok(truth.cardCount >= 14);
  const video = buildEonappKnowledgeContext('Can I run image-to-video locally on RTX 3050 4GB and verify current sources?', { limit: 7 });
  assert.ok(video.cardIds.includes('creator-video'));
  assert.ok(video.cardIds.includes('local-media-hardware'));
  assert.doesNotMatch(video.prompt, /local video is still disabled/i);
  const hostedMedia = buildEonappKnowledgeContext('Can I make a hosted image with fal or Replicate and a hosted Seedance video?', { limit: 7 });
  assert.ok(hostedMedia.cardIds.includes('creator-image'));
  assert.ok(hostedMedia.cardIds.includes('creator-video'));
  assert.match(hostedMedia.prompt, /paired local Creator Companion/i);
  assert.match(hostedMedia.prompt, /real owner-key|real launch-device|proof-pending|certification/i);
  assert.doesNotMatch(hostedMedia.prompt, /universally certified|automatic paid retry/i);
  const music = buildEonappKnowledgeContext('Make music, Auto DJ a set and build my personal radio', { limit: 7 });
  assert.ok(music.cardIds.includes('creator-music'));
  assert.ok(music.cardIds.includes('creator-auto-dj-radio'));
});

test('Referral and EONKEY grounding is server-authoritative and never awards value for raw sharing', () => {
  const referral = buildEonappKnowledgeContext('Is the referral EONKEY programme active? I shared my link, do I earn a key?', { limit: 7 });
  assert.ok(referral.cardIds.includes('referrals-eonkeys'));
  assert.match(referral.prompt, /server-authoritative/i);
  assert.match(referral.prompt, /shares alone do not qualify/i);
  assert.doesNotMatch(referral.prompt, /No reward\/referral program is active/i);
});


test('Turn-time capability truth overlay converges canonical Creator and referral lifecycle facts without account state', () => {
  const music = buildCapabilityTruthContext('Can EON create music and run my own radio?', { limit: 5 });
  assert.ok(music.ids.includes('creator-browser-music'));
  assert.ok(music.ids.includes('creator-generative-music'));
  assert.doesNotMatch(music.prompt, /Canonical Create.*does not generate media/i);
  assert.equal(music.accountStateIncluded, false);
  assert.equal(music.credentialStateIncluded, false);
  assert.equal(music.externalCompletionProof, false);

  const hosted = buildCapabilityTruthContext('Can I use fal or Replicate for hosted image and video inside EON City?', { limit: 6 });
  assert.ok(hosted.ids.includes('creator-hosted-image-video'));
  assert.match(hosted.prompt, /OS credential vault/i);
  assert.match(hosted.prompt, /Real owner-key provider\/browser certification remains pending/i);
  assert.equal(hosted.accountStateIncluded, false);
  assert.equal(hosted.credentialStateIncluded, false);
  assert.equal(hosted.externalCompletionProof, false);

  const referral = buildCapabilityTruthContext('Does sharing my referral link give me EONKEY cash?', { limit: 6 });
  assert.ok(referral.ids.includes('server-referral-eonkeys'));
  assert.ok(referral.ids.includes('reward-wallet-referral'));
  assert.match(referral.prompt, /Sharing, copying, posting, clicks or impressions never grant value by themselves/i);
  assert.match(referral.prompt, /wallet, token, payout/i);
});

test('Institutional memory is scoped, expiring, editable, deduplicated and secret-safe', () => {
  const storage = new MemoryStorage();
  const now = 1_800_000_000_000;
  assert.equal(classifyEonAiMemoryCandidate({ content: 'api_key=super-secret-value', kind: 'context' }, { explicit: true }).state, 'reject');
  const global = rememberEonAiMemory({ kind: 'preference', content: 'Prefer concise implementation receipts and concrete tests.', tags: ['style'] }, { storage, consent: true, now });
  assert.equal(global.ok, true);
  const project = rememberEonAiMemory({ kind: 'project', projectId: 'alpha', content: 'Project Alpha uses the private local model path.', tags: ['routing'] }, { storage, consent: true, now: now + 1 });
  assert.equal(project.ok, true);
  const duplicate = rememberEonAiMemory({ kind: 'project', projectId: 'alpha', content: 'Project Alpha uses a private local model path.', tags: ['routing'] }, { storage, consent: true, now: now + 2 });
  assert.equal(duplicate.merged, true);
  const context = rememberEonAiMemory({ kind: 'context', content: 'Temporary launch context for this week.' }, { storage, consent: true, now, expiresAt: now + 50 });
  assert.equal(context.ok, true);
  assert.equal(listEonAiMemory({ storage, projectId: 'beta', now: now + 2 }).some((row) => row.projectId === 'alpha'), false);
  assert.equal(recallEonAiMemory('private local model', { storage, projectId: 'alpha', now: now + 3 }).some((row) => row.projectId === 'alpha'), true);
  const edited = updateEonAiMemoryCard(global.card.id, { content: 'Prefer concise verified implementation receipts.' }, { storage, consent: true, now: now + 4 });
  assert.equal(edited.ok, true);
  assert.equal(listEonAiMemory({ storage, now: now + 100 }).some((row) => row.id === context.card.id), false);
  const snapshot = exportEonAiMemorySnapshot({ storage, now: now + 100 });
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.containsCredentials, false);
  assert.equal(snapshot.containsRawChat, false);
  assert.ok(snapshot.cards.every((row) => !('accessCount' in row) && !('lastAccessedAt' in row) && !('source' in row)));
  assert.equal(forgetEonAiMemoryCard(global.card.id, { storage }), true);
  assert.equal(getEonAiMemoryTruth().fineTuning, false);
  assert.equal(getEonAiMemoryTruth().explicitLocalExport, true);
});

test('Safe Auto memory learns only finite explicit product controls', () => {
  const storage = new MemoryStorage();
  const now = 1_800_000_100_000;
  const enabled = writeEonAiMemoryPolicy('safe-auto', { storage, explicitUserAction: true, now });
  assert.equal(enabled.ok, true);
  assert.equal(readEonAiMemoryPolicy({ storage }).mode, 'safe-auto');

  const rejectedRaw = rememberEonAiStructuredSignal('raw-chat', 'remember my password hunter2', { storage, explicitControlChange: true, now: now + 1 });
  assert.equal(rejectedRaw.stored, false);
  assert.equal(rejectedRaw.reason, 'structured-signal-invalid');
  const rejectedImplicit = rememberEonAiStructuredSignal('model-selection-policy', 'fast', { storage, now: now + 2 });
  assert.equal(rejectedImplicit.stored, false);
  assert.equal(rejectedImplicit.reason, 'explicit-control-change-required');

  const model = rememberEonAiStructuredSignal('model-selection-policy', 'fast', { storage, explicitControlChange: true, now: now + 3 });
  const runtime = rememberEonAiStructuredSignal('runtime-preference', 'local-first', { storage, explicitControlChange: true, now: now + 4 });
  const language = rememberEonAiStructuredSignal('chat-language', 'de-DE', { storage, explicitControlChange: true, now: now + 5 });
  const radioGenre = rememberEonAiStructuredSignal('radio-genre', 'techno', { storage, explicitControlChange: true, now: now + 6 });
  const radioVocals = rememberEonAiStructuredSignal('radio-vocals', 'instrumental', { storage, explicitControlChange: true, now: now + 7 });
  const radioEnergy = rememberEonAiStructuredSignal('radio-energy', 'high', { storage, explicitControlChange: true, now: now + 8 });
  const rejectedRadioPrompt = rememberEonAiStructuredSignal('radio-prompt', 'store my secret free-text station prompt', { storage, explicitControlChange: true, now: now + 9 });
  assert.equal(model.stored, true);
  assert.equal(runtime.stored, true);
  assert.equal(language.stored, true);
  assert.equal(radioGenre.stored, true);
  assert.equal(radioVocals.stored, true);
  assert.equal(radioEnergy.stored, true);
  assert.equal(rejectedRadioPrompt.stored, false);
  assert.equal(rejectedRadioPrompt.reason, 'structured-signal-invalid');
  const rows = listEonAiMemory({ storage, now: now + 10 });
  assert.ok(rows.some((row) => /model policy: Fast/i.test(row.content)));
  assert.ok(rows.some((row) => /runtime mode: Local-first/i.test(row.content)));
  assert.ok(rows.some((row) => /chat language: de-de/i.test(row.content)));
  assert.ok(rows.some((row) => /Radio genre family: Techno/i.test(row.content)));
  assert.ok(rows.some((row) => /Radio vocal mode: Instrumental/i.test(row.content)));
  assert.ok(rows.some((row) => /Radio energy: High energy/i.test(row.content)));
  assert.equal(rows.some((row) => /store my secret free-text|hunter2|password/i.test(row.content)), false);
  const rememberedRadio = readEonRememberedRadioPreferences({ storage, now: now + 10 });
  assert.equal(rememberedRadio.genre, 'techno');
  assert.equal(rememberedRadio.vocals, 'instrumental');
  assert.equal(rememberedRadio.energy, 'high');
  assert.equal(rememberedRadio.stationPromptRead, false);
  assert.equal(rememberedRadio.arbitraryContentParsed, false);
  assert.equal(getEonRadioPreferenceMemoryTruth().automaticModelTraining, false);

  writeEonAiMemoryPolicy('ask', { storage, explicitUserAction: true, now: now + 11 });
  const ask = rememberEonAiStructuredSignal('model-selection-policy', 'best', { storage, explicitControlChange: true, now: now + 12 });
  assert.equal(ask.stored, false);
  assert.equal(ask.requiresConfirmation, true);
  assert.equal(ask.reason, 'confirmation-required');
  const truth = getEonAiStructuredMemoryTruth();
  assert.equal(truth.rawChatAccepted, false);
  assert.equal(truth.arbitraryTextAccepted, false);
  assert.equal(truth.providerKeyStored, false);
  assert.equal(truth.promptStored, false);
  assert.equal(truth.responseStored, false);
  assert.equal(truth.fineTuning, false);
});

test('Institutional routing envelope never invents cross-provider, billing or download consent', () => {
  const auto = buildEonAiRoutingPolicy({ qualityMode: 'auto', selectedProviderId: 'openai', approvedProviderIds: ['groq'] });
  assert.deepEqual(auto.allowedProviderIds, ['openai']);
  assert.equal(auto.allowCrossProvider, false);
  assert.equal(assessEonAiProviderRoute({ providerId: 'groq', costClass: 'paid' }, auto).allowed, false);
  const approved = buildEonAiRoutingPolicy({ qualityMode: 'best', selectedProviderId: 'openai', approvedProviderIds: ['groq'], crossProviderConsent: true, billableProviderConsent: true });
  assert.equal(assessEonAiProviderRoute({ providerId: 'groq', costClass: 'paid' }, approved).allowed, true);
  const privatePolicy = buildEonAiRoutingPolicy({ qualityMode: 'private', selectedProviderId: 'ollama', approvedProviderIds: ['openai'] });
  assert.deepEqual(privatePolicy.allowedProviderIds, ['ollama']);
  assert.equal(assessEonAiProviderRoute({ providerId: 'openai', costClass: 'paid' }, privatePolicy).allowed, false);
  assert.equal(getEonAiRoutingPolicyTruth().silentModelDownloads, false);
});

test('Institutional model selection reacts to quality, speed, privacy and device evidence', () => {
  const models = ['acme-4b-fast', 'acme-coder-8b', 'acme-pro-70b'];
  const metadataByModel = {
    'acme-4b-fast': { reliability: .96, evalScore: 82, measuredTokensPerSecond: 70, firstTokenLatencyMs: 180, costClass: 'free' },
    'acme-coder-8b': { coding: true, reliability: .95, evalScore: 92, measuredTokensPerSecond: 38, firstTokenLatencyMs: 300, costClass: 'low' },
    'acme-pro-70b': { reliability: .98, evalScore: 98, measuredTokensPerSecond: 8, firstTokenLatencyMs: 1200, costClass: 'paid' }
  };
  assert.equal(selectEonInstitutionalModel(models, 'ollama', { mode: 'fast', device: { memoryGB: 16 }, metadataByModel }).model, 'acme-4b-fast');
  assert.equal(selectEonInstitutionalModel(models, 'ollama', { mode: 'auto', taskType: 'code', device: { memoryGB: 16 }, metadataByModel }).model, 'acme-coder-8b');
  assert.equal(selectEonInstitutionalModel(['cloud-pro'], 'openai', { mode: 'private' }).model, '');
  assert.notEqual(selectEonInstitutionalModel(models, 'ollama', { mode: 'best', device: { memoryGB: 8 }, metadataByModel }).model, 'acme-pro-70b');
});

test('Provider model manifest keeps only reported capability facts and leaves unknowns unknown', () => {
  const gemini = extractProviderModelManifest({ models: [{
    name: 'models/gemini-test',
    displayName: 'Gemini Test',
    description: 'arbitrary provider prose must not persist',
    inputTokenLimit: 131072,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
    thinking: true
  }] }, 'gemini');
  assert.equal(gemini[0].metadata.contextWindow, 131072);
  assert.equal(gemini[0].metadata.outputTokenLimit, 8192);
  assert.equal(gemini[0].metadata.chat, true);
  assert.equal(gemini[0].metadata.reasoning, true);
  assert.equal('description' in gemini[0].metadata, false);

  const lm = extractProviderModelManifest({ models: [{
    type: 'llm', key: 'google/gemma-local', publisher: 'google', params_string: '4B', size_bytes: 3_200_000_000, max_context_length: 262144,
    quantization: { name: 'Q4_K_M', bits_per_weight: 4 },
    capabilities: { vision: true, trained_for_tool_use: true, reasoning: { allowed_options: ['on'], default: 'on' } }
  }, { type: 'embedding', key: 'text-embedding-test', max_context_length: 2048 }] }, 'lmstudio');
  const lmMetadata = manifestMetadataByModel(lm);
  assert.equal(lmMetadata['google/gemma-local'].contextWindow, 262144);
  assert.equal(lmMetadata['google/gemma-local'].sizeB, 4);
  assert.equal(lmMetadata['google/gemma-local'].vision, true);
  assert.equal(lmMetadata['google/gemma-local'].toolCalling, true);
  assert.equal(lmMetadata['google/gemma-local'].reasoning, true);
  assert.equal(lmMetadata['text-embedding-test'].chat, false);
  const described = describeEonModel('google/gemma-local', 'lmstudio', lmMetadata['google/gemma-local']);
  assert.equal(described.metadataAuthority, 'provider-reported');
  assert.equal(described.capabilities.toolCalling, true);

  const openai = extractProviderModelManifest({ data: [{ id: 'gpt-test', owned_by: 'openai', created: 123 }] }, 'openai');
  assert.equal(openai[0].metadata.publisher, 'openai');
  assert.equal('contextWindow' in openai[0].metadata, false, 'basic model-list APIs must not gain invented context limits');
  const truth = getProviderModelManifestTruth();
  assert.equal(truth.providerReportedFactsOnly, true);
  assert.equal(truth.pricingInferred, false);
  assert.equal(truth.arbitraryDescriptionsStored, false);
});

test('Verified model envelope is finite, policy-diverse and independent of provider response order', () => {
  const models = [
    ...Array.from({ length: 20 }, (_, index) => `acme-generic-${index + 1}`),
    'acme-pro-120b',
    'acme-mini-fast',
    'acme-coder-32b',
    'acme-reasoning-70b'
  ];
  const envelope = buildEonVerifiedModelEnvelope(models, 'mistral', { preferredModel: 'acme-pro-120b' });
  assert.ok(envelope.length <= 48);
  assert.equal(envelope[0], 'acme-pro-120b');
  assert.ok(envelope.includes('acme-mini-fast'));
  assert.ok(envelope.includes('acme-coder-32b'));
  assert.ok(envelope.includes('acme-reasoning-70b'));
  assert.ok(models.indexOf('acme-pro-120b') > 11, 'test must prove the useful model appears after the former first-12 cutoff');
});

test('Canonical runtime derives a bounded task class from the current prompt without changing provider authority', () => {
  assert.equal(classifyEonChatTask('Debug this TypeScript function and fix the failing API call'), 'code');
  assert.equal(classifyEonChatTask('Compare these two architecture options and analyze the trade-offs'), 'reasoning');
  assert.equal(classifyEonChatTask('Write a friendly birthday message'), 'chat');
  assert.equal(classifyEonChatTask('debug this', { taskType: 'forge-code' }), 'forge-code');
});

test('Canonical runtime model policy re-ranks only the current verified provider envelope and respects explicit pins', () => {
  const hosted = { id: 'mistral' };
  const proof = { model: 'mistral-large-latest', models: ['mistral-small-latest', 'mistral-large-latest'] };
  const fast = resolveVerifiedRequestModel(hosted, { modelSelectionPolicy: 'fast', modelPinned: false }, proof);
  const best = resolveVerifiedRequestModel(hosted, { modelSelectionPolicy: 'best', modelPinned: false }, proof);
  assert.equal(fast.model, 'mistral-small-latest');
  assert.equal(best.model, 'mistral-large-latest');
  assert.match(fast.reason, /policy-ranked:fast/);
  assert.equal(resolveVerifiedRequestModel(hosted, { modelSelectionPolicy: 'fast', modelPinned: true, model: 'mistral-large-latest' }, proof).model, 'mistral-large-latest');
  assert.throws(() => resolveVerifiedRequestModel(hosted, { modelSelectionPolicy: 'best', modelPinned: true, model: 'unverified-model' }, proof), /pinned model is not in the current verified model list/i);
  assert.equal(selectBestChatModel(proof.models, 'mistral', { mode: 'private' }), '');
});

test('Canonical runtime automatically avoids Groq tier-deprecated models without overriding verified Enterprise access', () => {
  const groq = { id: 'groq' };
  const proof = { model: 'llama-3.3-70b-versatile', models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b'] };
  const recovered = resolveVerifiedRequestModel(groq, { modelSelectionPolicy: 'best', modelPinned: false }, proof);
  assert.equal(recovered.model, 'openai/gpt-oss-120b');
  assert.equal(recovered.candidateCount, 2);
  const explicit = resolveVerifiedRequestModel(groq, { modelSelectionPolicy: 'best', modelPinned: true, model: 'llama-3.3-70b-versatile' }, proof);
  assert.equal(explicit.model, 'llama-3.3-70b-versatile');
  assert.equal(explicit.reason, 'explicit-model-pin');
});

test('Canonical runtime keeps Local AI fail-closed to its self-tested model even when policy changes', () => {
  const proof = { model: 'gemma3:4b', models: ['gemma3:4b', 'qwen2.5-coder:7b'] };
  const decision = resolveVerifiedRequestModel({ id: 'ollama' }, { modelSelectionPolicy: 'best', modelPinned: false }, proof);
  assert.equal(decision.model, 'gemma3:4b');
  assert.equal(decision.reason, 'local-self-tested-model-only');
});

test('Verified model context metadata conservatively caps first-turn input, history and output budgets', () => {
  const base = { maxHistoryMessages: 18, maxInputChars: 4000, maxOutputTokens: 900, timeoutMs: 40000 };
  const tiny = capBudgetForVerifiedModelContext(base, { contextWindow: 4096, outputTokenLimit: 2048 });
  assert.equal(tiny.contextWindowReported, true);
  assert.equal(tiny.compactContext, true);
  assert.equal(tiny.memoryLimit, 1);
  assert.ok(tiny.knowledgeMaxChars <= 1200);
  assert.ok(tiny.maxInputChars < base.maxInputChars);
  assert.ok(tiny.maxHistoryMessages < base.maxHistoryMessages);
  assert.ok(tiny.maxHistoryCharsTotal > 0);
  assert.ok(tiny.maxOutputTokens <= Math.floor(4096 * 0.22));

  const large = capBudgetForVerifiedModelContext(base, { contextWindow: 32768, outputTokenLimit: 4096 });
  assert.equal(large.compactContext, false);
  assert.equal(large.memoryLimit, 4);
  assert.ok(large.maxInputChars <= base.maxInputChars);
  assert.ok(large.maxHistoryCharsTotal > tiny.maxHistoryCharsTotal);

  const unknown = capBudgetForVerifiedModelContext(base, {});
  assert.equal(unknown.contextWindowReported, false);
  assert.equal(unknown.maxInputChars, base.maxInputChars);
  assert.equal(unknown.maxOutputTokens, base.maxOutputTokens);

  const unsupported = capBudgetForVerifiedModelContext(base, { contextWindow: 2048, outputTokenLimit: 1024 });
  assert.equal(unsupported.contextTooSmall, true);
  assert.equal(unsupported.minimumSupportedContextWindow, 4096);
});

test('Evaluation ledger stores metrics only and produces routing evidence', () => {
  const storage = new MemoryStorage();
  const now = 1_800_000_000_000;
  assert.equal(recordEonAiEvaluation({ providerId: 'ollama', modelId: 'gemma3:4b', success: true }, { storage }).reason, 'explicit-foreground-test-required');
  recordEonAiEvaluation({ providerId: 'ollama', modelId: 'gemma3:4b', taskType: 'chat', local: true, success: true, latencyMs: 900, firstTokenLatencyMs: 300, tokensPerSecond: 34, qualityScore: 88, structuredOutputValid: true }, { storage, explicitForegroundTest: true, now });
  recordEonAiEvaluation({ providerId: 'ollama', modelId: 'gemma3:4b', taskType: 'chat', local: true, success: false, failureClass: 'timeout', latencyMs: 4000, qualityScore: 0 }, { storage, explicitForegroundTest: true, now: now + 1 });
  const operational = recordEonAiOperationalOutcome({ providerId: 'ollama', modelId: 'gemma3:4b', taskType: 'chat', local: true, success: true, latencyMs: 700, firstTokenLatencyMs: 180, tokensPerSecond: 42, qualityScore: 100, prompt: 'must not persist', response: 'must not persist', failureClass: 'provider leaked text' }, { storage, userInitiatedRequest: true, now: now + 2 });
  assert.equal(operational.ok, true);
  assert.equal(operational.record.evidenceType, 'foreground-operation');
  assert.equal(operational.record.qualityScored, false);
  assert.equal(operational.record.qualityScore, 0);
  assert.equal('prompt' in operational.record, false);
  assert.equal('response' in operational.record, false);
  assert.equal(operational.record.errorTextStored, false);
  assert.equal(recordEonAiOperationalOutcome({ providerId: 'ollama', modelId: 'gemma3:4b', success: true }, { storage, now: now + 3 }).reason, 'user-initiated-request-required');
  const evidence = summarizeEonAiModelEvidence('ollama', 'gemma3:4b', { storage, now: now + 4 });
  assert.equal(evidence.sampleCount, 3);
  assert.equal(evidence.operationalSampleCount, 1);
  assert.equal(evidence.qualitySampleCount, 2);
  assert.equal(evidence.reliability, 2 / 3);
  assert.ok(evidence.measuredTokensPerSecond > 34 && evidence.measuredTokensPerSecond < 42);
  assert.equal(evidence.evalScore, 44, 'operational success must not inflate explicit quality scoring');
  const truth = getEonAiEvaluationTruth();
  assert.equal(truth.promptStored, false);
  assert.equal(truth.responseStored, false);
  assert.equal(truth.errorTextStored, false);
  assert.equal(truth.foregroundOperationalLearning, true);
  assert.equal(truth.operationalQualityInference, false);
  assert.equal(clearEonAiEvaluations({ storage }), true);
});

test('Explicit model-quality feedback is content-free, task-scoped and replaces duplicate votes', () => {
  const storage = new MemoryStorage();
  const now = 1_800_000_200_000;
  assert.equal(recordEonAiUserQualityFeedback({ providerId: 'mistral', modelId: 'model-a', rating: 'positive' }, { storage }).reason, 'explicit-user-feedback-required');
  const first = recordEonAiUserQualityFeedback({ providerId: 'mistral', modelId: 'model-a', taskType: 'code', rating: 'positive', requestId: 'request-123', prompt: 'private prompt', response: 'private answer' }, { storage, explicitUserFeedback: true, now });
  assert.equal(first.ok, true);
  assert.equal(first.record.qualityScore, 100);
  assert.equal(first.record.evidenceType, 'user-quality-feedback');
  assert.equal('prompt' in first.record, false);
  assert.equal('response' in first.record, false);
  const replaced = recordEonAiUserQualityFeedback({ providerId: 'mistral', modelId: 'model-a', taskType: 'code', rating: 'negative', requestId: 'request-123' }, { storage, explicitUserFeedback: true, now: now + 1 });
  assert.equal(replaced.ok, true);
  const evidence = summarizeEonAiModelEvidence('mistral', 'model-a', { storage, taskType: 'code', now: now + 2 });
  assert.equal(evidence.sampleCount, 1);
  assert.equal(evidence.userFeedbackSampleCount, 1);
  assert.equal(evidence.qualitySampleCount, 1);
  assert.equal(evidence.evalScore, 0);
  assert.equal(evidence.reliability, 0, 'quality feedback must not masquerade as a transport reliability sample');
  const truth = getEonAiEvaluationTruth();
  assert.equal(truth.explicitUserQualityFeedback, true);
  assert.equal(truth.feedbackStoresMessageContent, false);
});

test('Local starter recommendation is internally consistent', () => {
  const profiles = getLocalAiStarterCatalog({ device: { label: 'Test', computeClass: 'desktop', memoryGB: 16, cpuCores: 8 } }).profiles;
  const phi = profiles.find((row) => row.model === 'phi4-mini');
  const gemma = profiles.find((row) => row.model === 'gemma3:4b');
  assert.ok(phi && gemma);
  assert.equal(gemma.priority, 0);
  assert.ok(phi.priority > gemma.priority);
  assert.match(gemma.fit.label, /Recommended first local model/i);
  assert.doesNotMatch(phi.fit.label, /Recommended first local model/i);
});

test('Local model lifecycle is explicit, freshness-aware and fails unknown on weak devices', () => {
  const device = { label: 'Desktop', computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16, cpuCores: 8 };
  const now = 2_000_000_000_000;
  const installed = [{ model: 'phi4-mini:latest', localOnly: true, sizeBytes: 2_500_000_000 }];
  const lifecycle = buildLocalModelLifecycleState({ runtimeId: 'ollama', models: installed, selectedModel: 'phi4-mini:latest', device, scannedAt: now - 1000, now });
  assert.equal(lifecycle.preferredInstalledModel, 'phi4-mini:latest');
  assert.equal(lifecycle.reviewedUpgradeAvailable, true);
  assert.equal(lifecycle.installCandidate?.model, 'gemma3:4b');
  assert.equal(lifecycle.installHandoff?.kind, 'copy-command');
  assert.equal(lifecycle.installHandoff?.downloadStarted, false);
  assert.equal(lifecycle.scanFresh, true);
  assert.equal(lifecycle.automaticDownload, false);
  assert.equal(lifecycle.automaticChatSelection, false);
  const stale = buildLocalModelLifecycleState({ runtimeId: 'ollama', models: installed, device, scannedAt: now - (16 * 60 * 1000), now });
  assert.equal(stale.refreshRecommended, true);

  const weak = { label: 'Phone', computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 8, cpuCores: 8 };
  const weakLifecycle = buildLocalModelLifecycleState({ runtimeId: 'ollama', models: [{ model: 'gemma3:4b' }], device: weak, scannedAt: now, now });
  assert.equal(weakLifecycle.state, 'guide-mode-default');
  assert.equal(weakLifecycle.preferredInstalledModel, '');
  assert.equal(weakLifecycle.installHandoff, null);
  assert.equal(findPreferredDiscoveredLocalModel([{ model: 'random-unknown-local-model' }], { device }), null);
  assert.equal(getLocalModelLifecycleTruth().backgroundRuntimeProbe, false);
  assert.equal(getLocalModelLifecycleTruth().automaticModelDownload, false);
});

test('Local install handoff never maps an Ollama tag into another runtime download API', () => {
  const profile = getLocalAiStarterCatalog({ device: { computeClass: 'cpu-local', memoryGB: 16, cpuCores: 8 } }).profiles.find((row) => row.model === 'gemma3:4b');
  const ollama = buildLocalModelInstallHandoff(profile, 'ollama');
  assert.equal(ollama.kind, 'copy-command');
  assert.equal(ollama.command, 'ollama pull gemma3:4b');
  assert.equal(ollama.downloadStarted, false);
  const lm = buildLocalModelInstallHandoff(profile, 'lmstudio');
  assert.equal(lm.kind, 'open-runtime-model-manager');
  assert.equal(lm.command, '');
  assert.match(lm.note, /does not assume/i);
  assert.equal(lm.downloadStarted, false);
});

test('Beginner Local AI guide agrees with the reviewed first private-chat model', () => {
  const guide = buildLocalAiSetupGuide({ computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16, cpuCores: 8 }, { goalId: 'private-chat' });
  assert.equal(guide.suggestedProfileId, 'compact-private-chat');
  assert.doesNotMatch(guide.goal.mediaBoundary, /future local-media/i);
});

test('Music is first-class but truthful about deterministic and generative states', () => {
  assert.deepEqual(EON_CREATE_MODES.slice(0, 3).map((row) => row.id), ['image', 'video', 'music']);
  const plan = buildEonMusicCapabilityPlan({ profile: { computeClass: 'gpu-standard', label: 'GPU device', summary: 'test' }, aceStepDetected: true });
  assert.equal(plan.modes.pattern.modelGenerated, false);
  assert.equal(plan.modes.generativeTrack.localEngine, 'acestep-v1.5-loopback');
  assert.equal(plan.modes.generativeTrack.certified, false);
  assert.equal(getEonMusicCapabilityTruth().aceStepLocalAdapterSourceIntegrated, true);
  assert.equal(getEonMusicCapabilityTruth().aceStepExternalRuntimeProof, false);
  assert.equal(getEonMusicCapabilityTruth().commercialStreamingCatalogue, false);
  const dj = buildAutoDjSetPlan([{ id: 'a', title: 'A', bpm: 120, energy: .3 }, { id: 'b', title: 'B', bpm: 122, energy: .7 }]);
  assert.equal(dj.ok, true);
  assert.equal(dj.renderState, 'plan-only');
  assert.equal(dj.rightsBoundary, 'user-authorized-or-eon-generated-audio-only');
  const storage = new MemoryStorage();
  const station = createEonRadioStation({ name: 'Night', prompt: 'melodic techno' }, { storage, now: 123, memoryConsent: false });
  assert.equal(station.ok, true);
  assert.equal(station.station.commercialCatalogueAccess, false);
  assert.equal(listEonRadioStations({ storage }).length, 1);
  assert.equal(deleteEonRadioStation(station.station.id, { storage }), true);
  assert.equal(listEonRadioStations({ storage }).length, 0);
});

test('EON Radio continuously advances a private queue only after an explicit open-page start', async () => {
  let nextUrl = 0;
  const session = createEonRadioSession({ urlApi: { createObjectURL: () => `blob:radio-${++nextUrl}`, revokeObjectURL() {} } });
  session.addGeneratedBlob(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' }), { fileName: 'one.wav', type: 'audio/wav' }, { explicitUserAction: true });
  session.addGeneratedBlob(new Blob([new Uint8Array([4, 5, 6])], { type: 'audio/wav' }), { fileName: 'two.wav', type: 'audio/wav' }, { explicitUserAction: true });
  const audios = [];
  const player = createEonRadioPlayer(session, { audioFactory: (src) => { const audio = { src, play: async () => {}, pause() {}, onended: null, onerror: null }; audios.push(audio); return audio; } });
  assert.equal((await player.play()).reason, 'explicit-user-action-required');
  const started = await player.play({ explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(player.snapshot().playing, true);
  assert.equal(player.snapshot().current.name, 'one.wav');
  audios[0].onended?.();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(player.snapshot().current.name, 'two.wav');
  assert.equal(player.snapshot().playing, true);
  assert.equal(player.stop({ explicitUserAction: true }).ok, true);
  const truth = getEonRadioPlayerTruth();
  assert.equal(truth.explicitStartRequired, true);
  assert.equal(truth.continuousQueueWhilePageOpen, true);
  assert.equal(truth.backgroundStreaming, false);
  assert.equal(truth.serviceWorkerAudioPlayback, false);
  assert.equal(truth.upload, false);
});

test('EON Radio plans the next original track locally without provider calls or automatic generation', () => {
  const station = {
    id: 'radio-night',
    name: 'Night Drive',
    prompt: 'dark melodic techno with warm analog synths and occasional Hindi vocal texture',
    genres: ['techno', 'electronic'],
    vocalPreference: 'mixed',
    energy: 0.82
  };
  const first = buildEonRadioNextTrackPlan(station, { iteration: 0 });
  const second = buildEonRadioNextTrackPlan(station, { iteration: 1 });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.plan.arcId, second.plan.arcId);
  assert.notEqual(first.plan.prompt, second.plan.prompt);
  assert.ok(first.plan.prompt.length <= 1100);
  assert.match(first.plan.prompt, /Night Drive/);
  assert.match(first.plan.prompt, /techno, electronic/i);
  assert.equal(first.plan.providerCalled, false);
  assert.equal(first.plan.automaticGeneration, false);
  assert.equal(first.plan.automaticPaidRequest, false);
  assert.equal(first.plan.automaticLocalCompute, false);
  assert.equal(first.plan.commercialCatalogueAccess, false);
  assert.equal(first.plan.stationPromptPersistedByPlanner, false);
  assert.equal(first.plan.generatedAudio, false);
  assert.equal(first.plan.requiresSeparateGenerateAction, true);
  const truth = getEonRadioNextTrackTruth();
  assert.equal(truth.localPlanningOnly, true);
  assert.equal(truth.providerCalled, false);
  assert.equal(truth.automaticGeneration, false);
  assert.equal(truth.automaticPaidRequest, false);
  assert.equal(truth.commercialCatalogueAccess, false);
  assert.equal(truth.stationPromptPersistedByPlanner, false);
  assert.equal(buildEonRadioNextTrackPlan({}, { iteration: 0 }).reason, 'station-description-required');
});

test('Auto DJ adds a real local crossfade-preview rail without claiming beat matching or rendered mix export', () => {
  const created = []; const revoked = [];
  const session = createEonAutoDjPreviewSession({
    urlApi: { createObjectURL: (media) => { const url = `blob:dj-${created.length + 1}`; created.push([url, media]); return url; }, revokeObjectURL: (url) => revoked.push(url) },
    audioFactory: () => ({ play: async () => {}, pause() {}, volume: 1, currentTime: 0, duration: 180, ontimeupdate: null, onended: null, onerror: null })
  });
  const file = new File([new Uint8Array([1, 2, 3, 4])], 'owned.wav', { type: 'audio/wav' });
  assert.equal(session.addFiles([file], { explicitUserAction: false }).reason, 'explicit-user-action-required');
  const added = session.addFiles([file], { explicitUserAction: true });
  assert.equal(added.ok, true);
  assert.equal(added.snapshot.itemCount, 1);
  assert.equal(added.snapshot.upload, false);
  assert.equal(added.snapshot.beatMatching, false);
  assert.equal(added.snapshot.exportedMix, false);
  assert.equal(session.clear({ explicitUserAction: true }).ok, true);
  assert.equal(revoked.length, 1);
  const truth = getEonAutoDjPreviewTruth();
  assert.equal(truth.browserCrossfadePreview, true);
  assert.equal(truth.userAuthorizedAudioOnly, true);
  assert.equal(truth.beatGridAnalysis, false);
  assert.equal(truth.tempoStretch, false);
  assert.equal(truth.renderedMixExport, false);
  assert.equal(truth.eonGeneratedAudioAllowed, true);
  const generated = new Blob([new Uint8Array([9, 8, 7, 6])], { type: 'audio/wav' });
  const generatedAdded = session.addGeneratedBlob(generated, { fileName: 'eon.wav', type: 'audio/wav' }, { explicitUserAction: true });
  assert.equal(generatedAdded.ok, true);
  assert.equal(generatedAdded.item.source, 'eon-generated');

  const plan = buildAutoDjSetPlan([
    { id: 'a', title: 'A', bpm: 122, energy: 0.3 },
    { id: 'b', title: 'B', bpm: 124, energy: 0.7 }
  ]);
  assert.equal(plan.ok, true);
  assert.equal(plan.transitions[0].beatMatchingApplied, false);
  assert.equal(plan.transitions[0].tempoStretchApplied, false);
  assert.doesNotMatch(plan.transitions[0].suggestion, /beat-match|tempo-reset/i);
  const plannerTruth = getEonAutoDjPlanTruth();
  assert.equal(plannerTruth.metadataSequencingOnly, true);
  assert.equal(plannerTruth.beatMatchingApplied, false);
  assert.equal(plannerTruth.providerCalled, false);
});

test('Music progression proof requires explicit save plus byte-for-byte reopened audio and stores no content', async () => {
  const generated = new Blob([new Uint8Array([1, 3, 3, 7, 9, 2])], { type: 'audio/wav' });
  const prepared = await prepareMusicArtifactProof(generated, { fileName: 'track.wav', contentType: 'audio/wav' });
  assert.equal(prepared.ok, true);
  const artifact = { saved: true, digestMatched: false, sha256: prepared.sha256, expectedBytes: prepared.sizeBytes };
  assert.equal(canRecordMusicOutcome(artifact), false);
  const reopened = new File([new Uint8Array([1, 3, 3, 7, 9, 2])], 'track.wav', { type: 'audio/wav' });
  const verified = await verifyMusicArtifactReopen(reopened, { expectedSha256: prepared.sha256, expectedBytes: prepared.sizeBytes });
  assert.equal(verified.ok, true);
  artifact.digestMatched = true;
  assert.equal(canRecordMusicOutcome(artifact), true);
  const mismatch = await verifyMusicArtifactReopen(new File([new Uint8Array([1, 2, 3])], 'track.wav', { type: 'audio/wav' }), { expectedSha256: prepared.sha256, expectedBytes: prepared.sizeBytes });
  assert.equal(mismatch.ok, false);
  const proofTruth = getEonMusicArtifactProofTruth();
  assert.equal(proofTruth.explicitReopenRequired, true);
  assert.equal(proofTruth.byteForByteDigestMatchRequired, true);
  assert.equal(proofTruth.promptStoredInProof, false);
  assert.equal(proofTruth.audioUploadedForProof, false);
});


test('ACE-Step local music rail is explicit, loopback-only, bounded and receipt-redacted', async () => {
  const requests = [];
  const receipts = { transport: 'direct-browser', authenticated: false };
  const requestJson = async (options) => {
    requests.push({ ...options });
    if (options.url.endsWith('/health')) return { data: { data: { status: 'ok', service: 'ACE-Step API', version: '1.5-test' } }, receipt: receipts };
    if (options.url.endsWith('/v1/models')) return { data: { data: { models: [{ id: 'acestep-v15-turbo', is_default: true, is_loaded: true }] } }, receipt: receipts };
    if (options.url.endsWith('/release_task')) return { data: { data: { task_id: 'task-1', queue_position: 1 } }, receipt: receipts };
    if (options.url.endsWith('/query_result')) return {
      data: { data: [{
        task_id: 'task-1',
        status: 1,
        result: JSON.stringify([{
          file: '/v1/audio?path=%2Ftmp%2Fapi_audio%2Ftrack.wav',
          status: 1,
          dit_model: 'acestep-v15-turbo',
          lm_model: 'acestep-5Hz-lm-0.6B',
          metas: { bpm: 124, duration: 30, keyscale: 'A Minor', timesignature: '4' }
        }])
      }] },
      receipt: receipts
    };
    throw new Error(`unexpected-json-request:${options.url}`);
  };
  const request = async (options) => {
    requests.push({ ...options, outputFetch: true });
    return {
      response: new Response(new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]), { status: 200, headers: { 'content-type': 'audio/wav' } }),
      receipt: receipts
    };
  };

  const blockedDiscovery = await discoverAceStepLocalMusic({ requestJson });
  assert.equal(blockedDiscovery.ok, false);
  assert.equal(blockedDiscovery.reason, 'explicit-user-action-required');
  const discovery = await discoverAceStepLocalMusic({ explicitUserAction: true, requestJson });
  assert.equal(discovery.ok, true);
  assert.equal(discovery.defaultModel, 'acestep-v15-turbo');
  assert.equal(discovery.modelDownloadStarted, false);
  assert.equal(discovery.modelInitializationStarted, false);

  const blockedGeneration = await generateAceStepLocalMusic({ prompt: 'private prompt' }, { requestJson, request });
  assert.equal(blockedGeneration.reason, 'explicit-user-action-required');
  const generated = await generateAceStepLocalMusic({
    prompt: 'Dreamy Goa sunset electronic track',
    lyrics: 'Private draft lyrics',
    durationSec: 30,
    bpm: 124,
    model: 'acestep-v15-turbo',
    format: 'wav'
  }, {
    explicitUserAction: true,
    requestJson,
    request,
    wait: async () => {},
    pollIntervalMs: 250
  });
  assert.equal(generated.ok, true);
  assert.ok(generated.blob instanceof Blob);
  assert.equal(generated.blob.type, 'audio/wav');
  assert.equal(generated.metadata.bpm, 124);
  assert.equal(generated.serverJobCancellationSupported, false);
  const submit = requests.find((row) => row.url?.endsWith('/release_task'));
  const body = JSON.parse(submit.body);
  assert.equal(body.task_type, 'text2music');
  assert.equal(body.batch_size, 1);
  assert.equal(body.audio_duration, 30);
  assert.equal(body.model, 'acestep-v15-turbo');
  assert.equal('reference_audio' in body, false);
  assert.equal('reference_audio_path' in body, false);
  assert.equal('src_audio' in body, false);
  assert.equal('src_audio_path' in body, false);
  assert.equal('path' in body, false);
  assert.equal('train' in body, false);
  assert.equal('init' in body, false);
  const serializedReceipt = JSON.stringify(generated.receipt);
  assert.doesNotMatch(serializedReceipt, /Dreamy Goa|Private draft lyrics/i);
  assert.equal(generated.receipt.containsPrompt, false);
  assert.equal(generated.receipt.containsLyrics, false);
  assert.equal(generated.receipt.containsCredential, false);
  assert.equal(generated.receipt.externalRuntimeCertification, false);
  const outputCall = requests.find((row) => row.outputFetch);
  assert.match(outputCall.url, /^http:\/\/127\.0\.0\.1:8001\/v1\/audio\?path=/);
  const truth = getAceStepLocalMusicTruth();
  assert.equal(truth.modelDownload, false);
  assert.equal(truth.modelInitialization, false);
  assert.equal(truth.adapterTraining, false);
  assert.equal(truth.referenceAudioUpload, false);
  assert.equal(truth.cloudFallback, false);
  assert.equal(truth.liveReferenceDeviceProof, false);
});


test('EONBOT routes Image, Video and Music creation requests into the canonical Creator with a user-tap boundary', () => {
  const image = buildEonbotCommandHubPlan('make an image');
  const video = buildEonbotCommandHubPlan('create a video');
  const music = buildEonbotCommandHubPlan('make a song');
  assert.equal(image.commandId, 'open-create-image');
  assert.equal(image.route, '/create?mode=image');
  assert.equal(video.commandId, 'open-create-video');
  assert.equal(video.route, '/create?mode=video');
  assert.equal(music.commandId, 'open-create-music');
  assert.equal(music.route, '/create?mode=music');
  for (const plan of [image, video, music]) {
    assert.equal(plan.commandReceipt.completed, false);
    assert.equal(plan.confirmation, 'user-tap');
    assert.equal(plan.commandReceipt.execution, 'prepared-user-tap');
    assert.match(plan.truthNote, /No |nothing|generates nothing/i);
  }
});


test('Creator intent continuity is explicit, session-only, single-use and secret-safe', () => {
  const storage = new MemoryStorage();
  const now = 1_800_000_200_000;
  const prompt = 'Make a dark melodic techno track for a Goa sunset, instrumental, 124 BPM.';

  assert.equal(writeEonCreatorIntentHandoff({ mode: 'music', prompt }, { sessionStorage: storage, now }).reason, 'explicit-user-action-required');
  const written = writeEonCreatorIntentHandoff({ mode: 'music', prompt }, { sessionStorage: storage, now, explicitUserAction: true });
  assert.equal(written.ok, true);
  assert.equal(JSON.stringify(written).includes(prompt), false);
  assert.equal(written.handoff.promptStoredInSession, true);
  assert.equal(written.handoff.generationStarted, false);

  const mismatchStorage = new MemoryStorage();
  assert.equal(writeEonCreatorIntentHandoff({ mode: 'image', prompt: 'Create a neon city poster.' }, { sessionStorage: mismatchStorage, now, explicitUserAction: true }).ok, true);
  assert.equal(consumeEonCreatorIntentHandoff({ sessionStorage: mismatchStorage, mode: 'video', now: now + 1 }).reason, 'creator-intent-mode-mismatch');
  assert.equal(consumeEonCreatorIntentHandoff({ sessionStorage: mismatchStorage, mode: 'image', now: now + 2 }).reason, 'creator-intent-handoff-not-found');

  const consumed = consumeEonCreatorIntentHandoff({ sessionStorage: storage, mode: 'music', now: now + 10 });
  assert.equal(consumed.ok, true);
  assert.equal(consumed.handoff.prompt, prompt);
  assert.equal(consumed.handoff.providerCalled, false);
  assert.equal(consumeEonCreatorIntentHandoff({ sessionStorage: storage, mode: 'music', now: now + 11 }).reason, 'creator-intent-handoff-not-found');

  const secretStorage = new MemoryStorage();
  const secret = writeEonCreatorIntentHandoff({ mode: 'image', prompt: 'Use api_key=super-secret-value-123456789 in this poster' }, { sessionStorage: secretStorage, now, explicitUserAction: true });
  assert.equal(secret.ok, false);
  assert.equal(secret.reason, 'creator-prompt-sensitive-value-rejected');
  assert.equal(secretStorage.getItem('eon:create:intent-handoff:v1'), null);

  const expiredStorage = new MemoryStorage();
  assert.equal(writeEonCreatorIntentHandoff({ mode: 'video', prompt: 'Create a short cinematic clip.', ttlMs: 30_000 }, { sessionStorage: expiredStorage, now, explicitUserAction: true }).ok, true);
  assert.equal(consumeEonCreatorIntentHandoff({ sessionStorage: expiredStorage, mode: 'video', now: now + 30_001 }).reason, 'creator-intent-handoff-expired');

  const truth = getEonCreatorIntentHandoffTruth();
  assert.equal(truth.durableStorage, false);
  assert.equal(truth.urlPromptTransport, false);
  assert.equal(truth.receiptContainsPrompt, false);
  assert.equal(truth.providerTelemetryContainsPrompt, false);
  assert.equal(truth.generationStartedByHandoff, false);
  assert.equal(truth.legacyCreatorLaunchKeyConsumed, false);
});

test('Canonical Create reuses maintained local Image and Video execution labs without hidden execution', () => {
  const image = renderComfyUiImageLab({}, { compact: false });
  assert.match(image, /data-comfy-image-lab/);
  assert.match(image, /data-comfy-scan/);
  assert.match(image, /data-comfy-generate/);
  assert.match(image, /No model install, LAN scan, public endpoint, hidden cloud fallback or prompt upload/i);

  const collapsedVideo = renderComfyUiVideoLab({}, { compact: false });
  assert.doesNotMatch(collapsedVideo, /data-video-generate/);
  const embeddedVideo = renderComfyUiVideoLab({}, { compact: false, embedded: true });
  assert.match(embeddedVideo, /data-comfy-video-lab/);
  assert.match(embeddedVideo, /data-video-scan/);
  assert.match(embeddedVideo, /data-video-generate/);
  assert.match(embeddedVideo, /Generate stays disabled unless capability is supported/i);
});

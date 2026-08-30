import assert from 'node:assert/strict';
import test from 'node:test';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EON_AI_GROUNDING_CONTRACT, assessEonAiResearchRequest, validateEonAiGroundingContract } from '../../config/eon-ai-capability-and-grounding-contract.mjs';
import { buildEonappKnowledgeContext } from '../../config/eonapp-ai-knowledge-base.mjs';
import { EON_AI_OUTPUT_TEST_MATRIX, getEonAiOutputTestCase } from '../../config/eon-ai-output-test-matrix.mjs';
import { buildLocalCreatorMediaProfilePlan, classifyCreatorMediaHardware } from '../../assets/js/local-ai/eon-local-creator-media-profiles.js';
import { buildEonbotTurnContext } from '../../assets/js/chat/eonbot-context-pack.js';
import { forgetEonAiMemory, recallEonAiMemory, rememberEonAiMemory } from '../../assets/js/ai-kernel/eon-ai-memory-ledger.js';
import { getEonbotGroundingTruth } from '../../assets/js/chat/eonbot-knowledge-grounding.js';
import { inspectW605AiGroundingAndOutput, resolveW605RepositoryRoot } from '../../scripts/w605-ai-grounding-and-output-gate.mjs';

function storage() { const values = new Map(); return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) }; }

test('W605 keeps training, memory, web and media truth fail-closed', () => {
  assert.deepEqual(validateEonAiGroundingContract(EON_AI_GROUNDING_CONTRACT), []);
  assert.equal(EON_AI_GROUNDING_CONTRACT.training.automaticFineTuningFromUserContent, false);
  assert.equal(EON_AI_GROUNDING_CONTRACT.webResearch.directLocalModelInternetAccess, false);
  assert.equal(EON_AI_GROUNDING_CONTRACT.media.localMediaAdapterActive, false);
  assert.equal(getEonbotGroundingTruth().runtimeGrounding, true);
});

test('W605/W606 requires explicit client-captured sources before current web research', () => {
  assert.equal(assessEonAiResearchRequest('find current AI news', {}).state, 'client-sources-required');
  assert.equal(assessEonAiResearchRequest('find current AI news', { clientSourcesReady: true }).state, 'explicit-client-sourced-research');
  assert.equal(assessEonAiResearchRequest('draft a local plan', {}).state, 'not-requested');
});

test('W605 selects concise product cards for local media and research questions', () => {
  const context = buildEonappKnowledgeContext('Can local image-to-video browse current model sources on RTX 3050 4GB VRAM?', { limit: 6 });
  assert.match(context.prompt, /source-controlled grounding/i);
  assert.ok(context.cardIds.includes('web-research'));
  assert.ok(context.cardIds.includes('local-media-hardware'));
  assert.ok(context.cardIds.includes('creator-video'));
  assert.doesNotMatch(context.prompt, /local video is still disabled/i);
});

test('W605 memory is explicit, local and blocks secret-like content', () => {
  const store = storage();
  const saved = rememberEonAiMemory({ kind: 'preference', content: 'I prefer concise EONAPP plans with real test receipts.', tags: ['style'] }, { storage: store, consent: true, now: 1 });
  assert.equal(saved.ok, true);
  assert.equal(rememberEonAiMemory({ content: 'api_key=example-secret-value-never-use', kind: 'context' }, { storage: store, consent: true }).reason, 'secret-like-content-blocked');
  assert.equal(recallEonAiMemory('test receipts', { storage: store }).length, 1);
  assert.equal(forgetEonAiMemory({ storage: store }), true);
  assert.equal(recallEonAiMemory('test receipts', { storage: store }).length, 0);
});

test('W605 turn context supplies grounding to compatible local and connected text calls', () => {
  const context = buildEonbotTurnContext('How do I test local image and current web information?');
  assert.match(context, /EONAPP_GROUNDING_W606/);
  assert.match(context, /no client-captured source packet is queued/i);
  assert.match(context, /proof-gated ComfyUI image adapter is source-integrated/i);
});

test('W643 current low-VRAM plan starts with image and keeps video closed', () => {
  const profile = classifyCreatorMediaHardware({ systemMemoryGb: 16, gpuVramGb: 4 });
  const plan = buildLocalCreatorMediaProfilePlan({ systemMemoryGb: 16, gpuVramGb: 4 });
  assert.equal(profile.id, 'low-vram');
  assert.ok(plan.recommendedIds.includes('image-sd15-512-baseline'));
  assert.ok(!plan.recommendedIds.includes('video-ltx-2b-microclip-trial'));
  assert.ok(!plan.recommendedIds.includes('video-wan-13b-480'));
  assert.match(plan.firstTest, /512px image baseline/i);
  assert.match(plan.firstTest, /video stays locked/i);
});

test('W605 has one output contract per required channel', () => {
  assert.deepEqual([...new Set(EON_AI_OUTPUT_TEST_MATRIX.map((row) => row.channel))].sort(), ['code', 'creator-edit', 'image', 'text', 'video']);
  assert.equal(getEonAiOutputTestCase('local-video-output').channel, 'video');
});

test('W605 deterministic source gate passes without live model execution', () => {
  const report = inspectW605AiGroundingAndOutput();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
});

test('W605 resolves encoded module file URLs without duplicating the Windows drive prefix', () => {
  const modulePath = join(process.cwd(), 'fixture with spaces', 'scripts', 'w605-gate.mjs');
  assert.equal(resolveW605RepositoryRoot(pathToFileURL(modulePath).href), resolve(process.cwd(), 'fixture with spaces'));
});

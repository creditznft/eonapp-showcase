#!/usr/bin/env node
/** W605 source integrity gate: no network, no browser, no model execution. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_AI_GROUNDING_CONTRACT, validateEonAiGroundingContract } from '../config/eon-ai-capability-and-grounding-contract.mjs';
import { EONAPP_AI_KNOWLEDGE_BASE_VERSION, EONAPP_AI_KNOWLEDGE_CARDS, buildEonappKnowledgeContext } from '../config/eonapp-ai-knowledge-base.mjs';
import { EON_AI_OUTPUT_TEST_MATRIX } from '../config/eon-ai-output-test-matrix.mjs';
import { buildLocalCreatorMediaProfilePlan } from '../assets/js/local-ai/eon-local-creator-media-profiles.js';
import { getEonbotGroundingTruth } from '../assets/js/chat/eonbot-knowledge-grounding.js';

export function resolveW605RepositoryRoot(moduleUrl = import.meta.url) {
  return resolve(fileURLToPath(new URL('..', moduleUrl)));
}

const ROOT = resolveW605RepositoryRoot();
const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8');
export function inspectW605AiGroundingAndOutput() {
  const checks = [];
  const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
check('grounding-contract-valid', validateEonAiGroundingContract(EON_AI_GROUNDING_CONTRACT).length === 0, 'automatic fine-tuning, silent browsing and active media adapter claims stay disabled');
check('knowledge-base-versioned', /^(?:w605-eonapp-grounding-v\d+|institutional-grounding-v\d+\.\d+\.\d+)$/.test(EONAPP_AI_KNOWLEDGE_BASE_VERSION), EONAPP_AI_KNOWLEDGE_BASE_VERSION);
check('knowledge-cards-present', EONAPP_AI_KNOWLEDGE_CARDS.length >= 14, `${EONAPP_AI_KNOWLEDGE_CARDS.length} source-controlled product cards`);
const grounding = buildEonappKnowledgeContext('How can I use local image to video on 4GB VRAM and browse current model documentation?', { limit: 6 });
check('knowledge-covers-web-media-hardware', ['web-research', 'creator-video', 'local-media-hardware'].every((id) => grounding.cardIds.includes(id)), grounding.cardIds.join(','));
check('output-test-matrix-complete', ['text', 'code', 'image', 'video', 'creator-edit'].every((channel) => EON_AI_OUTPUT_TEST_MATRIX.some((row) => row.channel === channel)), 'text/code/image/video/creator-edit');
const low = buildLocalCreatorMediaProfilePlan({ systemMemoryGb: 16, gpuVramGb: 4 });
check('low-vram-profile-honest', low.hardware.id === 'low-vram' && low.recommendedIds.includes('image-sd15-512-baseline') && !low.recommendedIds.includes('video-ltx-2b-microclip-trial') && !low.recommendedIds.includes('video-wan-13b-480'), low.recommendedIds.join(','));
const contextPack = read('assets/js/chat/eonbot-context-pack.js');
check('shared-text-runtime-grounding-wired', contextPack.includes("buildEonbotKnowledgeGrounding") && contextPack.includes('${grounding.prompt}'), 'context pack injects W605 grounding for model calls');
const runtime = read('assets/js/chat/ai-runtime.js');
check('ai-runtime-uses-turn-context', runtime.includes('buildEonbotTurnContext(trimmedInput'), 'text runtime requests contextual system prompt');
const localSetup = read('assets/js/local-ai/local-creator-media-setup.js');
check('creator-setup-remains-fail-closed', localSetup.includes('generationAvailable: false') && localSetup.includes('adapterConnected: false'), 'no media adapter activation claim');
const truth = getEonbotGroundingTruth();
check('grounding-truth-fail-closed', truth.runtimeGrounding === true && truth.automaticFineTuning === false && truth.directLocalModelWebAccess === false && truth.mediaAdapterActive === false && truth.localVideoAdapterSourceIntegrated === true && truth.localVideoUniversallyCertified === false && truth.musicGenerativeAdapterCertified === false, JSON.stringify(truth));
for (const file of [
  'config/eon-ai-capability-and-grounding-contract.mjs',
  'config/eonapp-ai-knowledge-base.mjs',
  'config/eon-ai-output-test-matrix.mjs',
  'assets/js/ai-kernel/eon-ai-memory-ledger.js',
  'assets/js/chat/eonbot-knowledge-grounding.js',
  'assets/js/local-ai/eon-local-creator-media-profiles.js',
  'scripts/w605-live-ai-output-matrix.mjs'
]) check(`file-present:${file}`, existsSync(resolve(ROOT, file)), file);

  const passed = checks.every((row) => row.pass);
  return Object.freeze({ schema: 'eonapp.w605.ai-grounding-output-gate.v1', status: passed ? 'pass' : 'fail', sourceOnly: true, checks: Object.freeze(checks) });
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const report = inspectW605AiGroundingAndOutput();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

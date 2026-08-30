#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_AI_REQUEST_MAX_ATTEMPTS,
  createEonAiRequestPlan,
  executeEonAiRequest,
  getEonAiRequestExecutorTruth
} from '../assets/js/ai-kernel/eon-ai-request-executor.js';
import { A15_REPOSITORY_ROOT, buildModuleClosure } from './lib/a15-source-authority.mjs';

const ROOT = A15_REPOSITORY_ROOT;
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I10_AI_REQUEST_EXECUTOR_GATE_RECEIPT.json');
const EXECUTOR = 'assets/js/ai-kernel/eon-ai-request-executor.js';
const ACTIVE_ROOTS = Object.freeze([
  'assets/js/chat-page.js',
  'assets/js/utils/mission-engine.js',
  'assets/js/forge/forge-ai-controller.js',
  'assets/js/workbench-ai.js',
  'assets/js/eon-browser-page.js',
  'assets/js/code-maker-page.js'
]);
const FORBIDDEN_ACTIVE_MODULES = Object.freeze([
  'assets/js/utils/agent-orchestrator.js',
  'assets/js/utils/provider-orchestrator.js',
  'assets/js/utils/request-orchestrator-bridge.js',
  'assets/js/utils/eon-auto-router.js'
]);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];
const closures = [];

for (const root of ACTIVE_ROOTS) {
  const closure = buildModuleClosure([root]);
  const forbidden = closure.modules.filter((file) => FORBIDDEN_ACTIVE_MODULES.includes(file));
  const executorReachable = closure.modules.includes(EXECUTOR);
  if (closure.unresolved.length) errors.push(`${root} has ${closure.unresolved.length} unresolved local import(s).`);
  if (forbidden.length) errors.push(`${root} reaches retired router/orchestrator modules: ${forbidden.join(', ')}.`);
  if (!executorReachable) errors.push(`${root} does not reach the canonical AI Request Executor.`);
  closures.push({ root, moduleCount: closure.modules.length, unresolved: closure.unresolved, forbidden, executorReachable });
}

const runtimeSource = readFileSync(path.join(ROOT, 'assets/js/chat/ai-runtime.js'), 'utf8');
const missionSource = readFileSync(path.join(ROOT, 'assets/js/utils/mission-engine.js'), 'utf8');
const durabilitySource = readFileSync(path.join(ROOT, 'assets/js/utils/mission-durability.js'), 'utf8');
const readinessSource = readFileSync(path.join(ROOT, 'assets/js/utils/ai-readiness.js'), 'utf8');
const executorSource = readFileSync(path.join(ROOT, EXECUTOR), 'utf8');

if (/_withRetry|RETRY_MAX/.test(runtimeSource)) errors.push('Maintained AI runtime still contains a hidden retry authority.');
if (!/requestReceipt: settled\.receipt/.test(runtimeSource)) errors.push('Maintained AI runtime does not expose the canonical settlement receipt.');
if (/request-orchestrator-bridge|agent-orchestrator|provider-orchestrator/.test(missionSource)) errors.push('Active mission engine still imports a retired orchestration authority.');
if (/agent-orchestrator|getAgentOrchestrator/.test(durabilitySource)) errors.push('Normal Chat mission durability still loads the legacy AgentOrchestrator.');
if (/eon-auto-router|buildAutoRoutePlan/.test(readinessSource)) errors.push('AI readiness still loads automatic provider routing.');
if (/Math\.random/.test(executorSource)) errors.push('Canonical executor uses non-cryptographic request identity randomness.');

const truth = getEonAiRequestExecutorTruth();
if (truth.maxAttempts !== 1 || EON_AI_REQUEST_MAX_ATTEMPTS !== 1) errors.push('Canonical executor attempt ceiling is not exactly one.');
if (truth.hiddenRetryAllowed || truth.providerFallbackAllowed || truth.modelFallbackAllowed) errors.push('Canonical executor truth permits hidden retry or fallback.');

const cryptoApi = { randomUUID: () => '00000000-0000-4000-8000-000000000010' };
const plan = createEonAiRequestPlan({
  providerId: 'mistral',
  model: 'mistral-small-latest',
  origin: 'a15-i10-gate',
  taskType: 'gate',
  userInitiated: true,
  consentSource: 'institutional-source-gate',
  inputChars: 12
}, { cryptoApi, now: () => 1000 });
let attempts = 0;
let successfulReceipt = null;
try {
  const settled = await executeEonAiRequest({
    plan,
    now: (() => { let value = 1000; return () => value += 10; })(),
    transport: async ({ attempt }) => {
      attempts += 1;
      if (attempt !== 1) throw new Error('unexpected-attempt');
      return { text: 'private-gate-output' };
    }
  });
  successfulReceipt = settled.receipt;
  if (settled.receipt.containsPrompt || settled.receipt.containsReply || settled.receipt.containsApiKey) errors.push('Settlement receipt contains private request material.');
} catch (error) {
  errors.push(`Canonical executor success simulation failed: ${error?.message || error}.`);
}
if (attempts !== 1) errors.push(`Canonical executor performed ${attempts} attempts instead of one.`);

let failedAttempts = 0;
let failedReceipt = null;
try {
  await executeEonAiRequest({
    plan: createEonAiRequestPlan({
      providerId: 'mistral',
      model: 'mistral-small-latest',
      origin: 'a15-i10-gate-failure',
      taskType: 'gate',
      userInitiated: true,
      consentSource: 'institutional-source-gate'
    }, { cryptoApi, now: () => 2000 }),
    transport: async () => {
      failedAttempts += 1;
      throw Object.assign(new Error('Provider unavailable'), { code: 'provider-503' });
    }
  });
} catch (error) {
  failedReceipt = error?.receipt || null;
}
if (failedAttempts !== 1 || failedReceipt?.attemptCount !== 1 || failedReceipt?.fallbackAttempted !== false) {
  errors.push('Provider failure did not settle after exactly one attempt with no fallback.');
}

const core = {
  schema: 'eonapp.a15.i10.ai-request-executor-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I10',
  status: errors.length ? 'fail' : 'pass',
  authority: {
    foregroundOnly: true,
    userInitiationRequired: true,
    consentSourceRequired: true,
    exactProviderAndModel: true,
    maxAttempts: 1,
    hiddenRetryAllowed: false,
    providerFallbackAllowed: false,
    modelFallbackAllowed: false,
    cancellationOwnedByExecutor: true,
    settlementReceiptRedacted: true,
    legacyOrchestratorLoadedByActiveRoots: false
  },
  activeRoots: closures,
  forbiddenActiveModules: FORBIDDEN_ACTIVE_MODULES,
  simulations: {
    successAttemptCount: attempts,
    successReceipt: successfulReceipt,
    failureAttemptCount: failedAttempts,
    failureReceipt: failedReceipt
  },
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I10] ${receipt.status.toUpperCase()}: ${ACTIVE_ROOTS.length} active roots use one foreground executor; ${attempts} success attempt; ${failedAttempts} failure attempt; no legacy router closure.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I10] ${error}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
/** W331–W334 — verifies canonical Chat is explicit, local-first and legacy fenced. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W331_W334_RUNTIME_PRIVACY_CONTRACT } from '../config/w331-w334-runtime-privacy-contract.mjs';
import { getChatThreadStorageTruth } from '../assets/js/utils/chat-threads.js';
import { getEonKernelBridgeTruth } from '../assets/js/ai-kernel/eon-ai-kernel-bridge.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function countLegacyImports(source = '') {
  const needles = [
    "eon-auto-router.js",
    "agent-executor.js",
    "agent-orchestrator.js",
    "mission-engine.js",
    "provider-orchestrator.js"
  ];
  return needles.reduce((count, needle) => count + (source.includes(needle) ? 1 : 0), 0);
}

export function runW331W334RuntimePrivacyGate(root = ROOT) {
  const errors = [];
  const contract = W331_W334_RUNTIME_PRIVACY_CONTRACT;
  for (const relative of contract.requiredFiles) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Required W331–W334 file missing: ${relative}`);
  }
  if (errors.length) return Object.freeze({ schema: contract.schema, ok: false, errors });

  const runtime = fs.readFileSync(path.join(root, 'assets/js/chat/ai-runtime.js'), 'utf8');
  const chatPage = fs.readFileSync(path.join(root, 'assets/js/chat-page.js'), 'utf8');
  const commandIntake = fs.readFileSync(path.join(root, 'assets/js/ai-kernel/eon-command-intake.js'), 'utf8');
  const threads = fs.readFileSync(path.join(root, 'assets/js/utils/chat-threads.js'), 'utf8');
  const canonical = contract.canonicalSurfaces.map((relative) => ({ relative, source: fs.readFileSync(path.join(root, relative), 'utf8') }));

  if (runtime.includes("from '../utils/eon-auto-router.js'")) errors.push('Canonical AI runtime must not import the heuristic auto-router.');
  if (runtime.includes('buildAutoRoutePlan(') || runtime.includes('globalThis.eonModelPolicyRouter')) errors.push('Canonical AI runtime still delegates route selection to a heuristic/global router.');
  if (!runtime.includes("reason: 'explicit-selected-provider'")) errors.push('Canonical AI runtime does not emit an explicit-provider routing receipt.');
  if (!runtime.includes("fallback: 'none'")) errors.push('Canonical AI runtime does not declare provider fallback as none.');
  if (/defaultModel:\s*['\"](?!['\"])/.test(runtime)) errors.push('Provider protocol packs must not embed an operative default model.');
  if (runtime.includes('localStorage.getItem(MODEL_CACHE_KEY)') || runtime.includes('localStorage.setItem(MODEL_CACHE_KEY')) errors.push('Discovered model manifests must not persist in localStorage.');
  if (!runtime.includes('sessionStorage.getItem(MODEL_CACHE_KEY)') || !runtime.includes('sessionStorage.setItem(MODEL_CACHE_KEY')) errors.push('Discovered model manifests must be tab-session cache only.');
  if (chatPage.includes('getAgentOrchestrator') || chatPage.includes('createPipelineJob') || chatPage.includes('parseAgentCommand')) errors.push('Canonical Chat still calls the retired executor path.');
  if (!chatPage.includes("from './ai-kernel/eon-command-intake.js'")) errors.push('Canonical Chat is not using the local Kernel command intake.');
  if (commandIntake.includes('fetch(') || commandIntake.includes('localStorage') || /from\s+['"](?:\.\/|\.\.\/).*agent-orchestrator/.test(commandIntake)) errors.push('Kernel command intake must remain local and non-executing.');

  if (!threads.includes('globalThis.sessionStorage') || threads.includes('function getStorage(storage = null) {\n  if (storage) return storage;\n  try { return globalThis.localStorage')) errors.push('Raw Chat thread storage must default to sessionStorage.');
  if (!threads.includes('clearLegacyPlaintextChatThreads') || !threads.includes('contentMigrated: false')) errors.push('Legacy plaintext chat cleanup must be explicit and non-migrating.');
  if (!threads.includes('getChatThreadStorageTruth')) errors.push('Chat storage truth export missing.');

  const legacyImports = canonical.map(({ relative, source }) => ({ relative, count: countLegacyImports(source) }));
  for (const item of legacyImports) if (item.count > 0) errors.push(`Canonical surface imports a legacy execution/router module: ${item.relative}`);
  const chatTruth = getChatThreadStorageTruth();
  const kernelTruth = getEonKernelBridgeTruth();
  if (chatTruth.defaultStorage !== contract.expectedTruth.rawChatThreadStorage || chatTruth.cloudSync !== contract.expectedTruth.cloudSync) errors.push('Chat storage truth drifted from local-first policy.');
  if (kernelTruth.externalExecution !== contract.expectedTruth.externalExecution || kernelTruth.foregroundOnly !== true) errors.push('Kernel foreground/execution truth drifted.');

  return Object.freeze({
    schema: contract.schema,
    ok: errors.length === 0,
    errors,
    truth: Object.freeze({ chatTruth, kernelTruth, legacyImports })
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW331W334RuntimePrivacyGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W331–W334 runtime/privacy gate passed: explicit user-selected routing, session-only raw Chat threads/model lists, and canonical legacy-executor fencing are intact.');
  process.exitCode = report.ok ? 0 : 1;
}

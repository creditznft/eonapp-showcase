#!/usr/bin/env node
/** W316–W320 — verifies the Chat/Workspace/City bridge stays local and non-executing. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W316_W320_KERNEL_BRIDGE_CONTRACT } from '../config/w316-w320-kernel-bridge-contract.mjs';
import { getEonKernelRoleTruth } from '../assets/js/ai-kernel/eon-role-profiles.js';
import { getGuidedWorkflowTruth } from '../assets/js/ai-kernel/eon-guided-workflow-blueprints.js';
import { getEonKernelSessionTruth } from '../assets/js/ai-kernel/eon-ai-kernel-session-store.js';
import { getEonKernelReviewInboxTruth } from '../assets/js/ai-kernel/eon-ai-kernel-review-inbox.js';
import { getEonKernelCityBridgeTruth } from '../assets/js/ai-kernel/eon-city-event-bridge.js';
import { getEonKernelBridgeTruth } from '../assets/js/ai-kernel/eon-ai-kernel-bridge.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW316W320KernelBridgeGate(root = ROOT) {
  const errors = [];
  const contract = W316_W320_KERNEL_BRIDGE_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required Kernel bridge file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`Kernel bridge source contains forbidden capability ${pattern}: ${relative}`);
  }
  const chat = fs.readFileSync(path.join(root, 'assets/js/chat-page.js'), 'utf8');
  if (!chat.includes("from './ai-kernel/eon-ai-kernel-bridge.js'")) errors.push('Chat is not connected to the EON AI Kernel bridge.');
  if (chat.includes('getAgentOrchestrator') || chat.includes('createPipelineJob')) errors.push('Chat still invokes the legacy agent executor path.');
  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  if (!workspace.includes('listEonKernelForegroundReviewItems')) errors.push('Workspace is not connected to the foreground kernel review summary.');
  const truths = Object.freeze({
    roles: getEonKernelRoleTruth(),
    workflow: getGuidedWorkflowTruth(),
    session: getEonKernelSessionTruth(),
    inbox: getEonKernelReviewInboxTruth(),
    city: getEonKernelCityBridgeTruth(),
    bridge: getEonKernelBridgeTruth()
  });
  const expected = contract.expectedTruth;
  if (truths.roles.autonomousAgents !== expected.autonomousAgents) errors.push('Role profiles may not become autonomous agents.');
  if (truths.bridge.foregroundOnly !== expected.foregroundOnly || truths.bridge.externalExecution !== expected.externalExecution) errors.push('Kernel bridge execution boundary drifted.');
  if (truths.bridge.rawPromptStored !== expected.rawPromptStored || truths.bridge.rawOutputStored !== expected.rawOutputStored) errors.push('Kernel bridge may not store raw chat content.');
  if (truths.city.cityCanApprove !== expected.cityCanApprove || truths.city.cityCanExecute !== expected.cityCanExecute) errors.push('City mirror may not approve or execute.');
  if (truths.session.storage !== 'session-only-redacted') errors.push('Kernel session must stay session-only and redacted.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truths });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW316W320KernelBridgeGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W316–W320 Kernel bridge gate passed: Chat, Workspace and City share a redacted foreground-only local task loop.');
  process.exitCode = report.ok ? 0 : 1;
}

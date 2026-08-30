#!/usr/bin/env node
/** W310–W315 — verifies one provider-neutral, local-first AI kernel foundation. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W310_W315_AI_KERNEL_CONTRACT } from '../config/w310-w315-ai-kernel-contract.mjs';
import { getEonTaskContractTruth } from '../assets/js/ai-kernel/eon-task-contract.js';
import { getProviderAdapterRegistryTruth } from '../assets/js/ai-kernel/eon-provider-adapter-registry.js';
import { getModelManifestTruth } from '../assets/js/ai-kernel/eon-model-manifest.js';
import { getModelPolicyResolverTruth } from '../assets/js/ai-kernel/eon-model-policy-resolver.js';
import { getAdapterContractLabTruth } from '../assets/js/ai-kernel/eon-adapter-contract-lab.js';
import { getEonRoutingReceiptTruth } from '../assets/js/ai-kernel/eon-routing-receipt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW310W315AiKernelGate(root = ROOT) {
  const errors = [];
  const contract = W310_W315_AI_KERNEL_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required AI Kernel file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`AI Kernel source contains forbidden capability ${pattern}: ${relative}`);
  }
  const truths = Object.freeze({
    task: getEonTaskContractTruth(),
    adapters: getProviderAdapterRegistryTruth(),
    manifest: getModelManifestTruth(),
    resolver: getModelPolicyResolverTruth(),
    lab: getAdapterContractLabTruth(),
    receipt: getEonRoutingReceiptTruth()
  });
  const expected = contract.expectedTruth;
  if (truths.task.foregroundOnly !== expected.foregroundOnly) errors.push('Task contract must remain foreground-only.');
  if (truths.adapters.hardcodedModelSelection !== expected.hardcodedModelSelection) errors.push('Provider registry may not hardcode model selection.');
  if (truths.manifest.backgroundDiscovery !== expected.backgroundDiscovery) errors.push('Model discovery must remain user-triggered.');
  if (truths.resolver.hiddenCrossProviderFallback !== expected.hiddenCrossProviderFallback || truths.resolver.localTaskHostedFallback !== expected.localTaskHostedFallback) errors.push('Policy resolver fallback boundary drifted.');
  if (truths.lab.adapterCannotBeSupportedWithoutTests !== expected.adapterCannotBeSupportedWithoutTests) errors.push('Adapter contract lab must require tests.');
  if (truths.receipt.dataDestinationVisible !== expected.dataDestinationVisible) errors.push('Routing receipt must disclose data destination.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truths });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW310W315AiKernelGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W310–W315 AI Kernel gate passed: one local task contract, dynamic manifests, explicit routing, adapter tests and receipts.');
  process.exitCode = report.ok ? 0 : 1;
}

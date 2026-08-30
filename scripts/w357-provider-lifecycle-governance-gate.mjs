#!/usr/bin/env node
/** W357 verifies protocol compatibility and stale-model governance stay local-first. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEonProviderProtocolContractTruth, normalizeEonProviderProtocol } from '../assets/js/ai-kernel/eon-provider-protocol-contract.js';
import { getEonModelManifestLifecycleTruth } from '../assets/js/ai-kernel/eon-model-manifest-lifecycle.js';
import { getProviderAdapterRegistryTruth } from '../assets/js/ai-kernel/eon-provider-adapter-registry.js';
import { getModelPolicyResolverTruth } from '../assets/js/ai-kernel/eon-model-policy-resolver.js';
import { getEonProviderReviewBoardTruth } from '../assets/js/ai-kernel/eon-provider-review-board.js';
import { W357_FORBIDDEN_RUNTIME_TOKENS, W357_PROVIDER_LIFECYCLE_GOVERNANCE_SCHEMA, W357_REQUIRED_SOURCES } from '../config/w357-provider-lifecycle-governance-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export function runW357ProviderLifecycleGovernanceGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W357_REQUIRED_SOURCES) if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W357 source: ${relative}`);
  const aliases = [
    ['anthropic-messages', 'anthropic-native'],
    ['gemini-generate-content', 'gemini-native'],
    ['local-web-runtime', 'local-openai-compatible'],
    ['openai-chat-completions', 'openai-compatible-chat']
  ];
  for (const [input, expected] of aliases) if (normalizeEonProviderProtocol(input).protocol !== expected) errors.push(`Protocol alias ${input} must normalize to ${expected}.`);
  const protocolTruth = getEonProviderProtocolContractTruth();
  const lifecycleTruth = getEonModelManifestLifecycleTruth();
  const adapterTruth = getProviderAdapterRegistryTruth();
  const resolverTruth = getModelPolicyResolverTruth();
  const reviewTruth = getEonProviderReviewBoardTruth();
  if (!protocolTruth.protocolFamiliesOnly || protocolTruth.hardcodedModels || protocolTruth.endpointStored || protocolTruth.credentialStored || protocolTruth.networkRequestCreated || protocolTruth.automaticProviderActivation) errors.push('Protocol contract must describe families only with no endpoint, key, network, or activation behavior.');
  if (lifecycleTruth.backgroundRefreshCreated || lifecycleTruth.providerCallCreated || lifecycleTruth.silentModelReplacement || lifecycleTruth.staleManifestAutoRouting) errors.push('Manifest lifecycle must never refresh, call, replace, or auto-route stale models.');
  if (adapterTruth.hardcodedModelSelection || adapterTruth.backgroundDiscovery || adapterTruth.hiddenRelay || adapterTruth.crossProviderFallbackDefault !== 'none') errors.push('Adapter registry local-first boundary drifted.');
  if (resolverTruth.staleManifestAutoRouting || resolverTruth.hiddenCrossProviderFallback || resolverTruth.localTaskHostedFallback) errors.push('Policy resolver must block stale manifests without cross-provider or hosted fallback.');
  if (reviewTruth.hardcodedModels || reviewTruth.automaticModelDiscovery || reviewTruth.providerCallCreated || reviewTruth.activationFromReviewBoard) errors.push('Provider review board must remain review-only.');
  for (const relative of [
    'assets/js/ai-kernel/eon-provider-protocol-contract.js',
    'assets/js/ai-kernel/eon-model-manifest-lifecycle.js',
    'assets/js/ai-kernel/eon-provider-adapter-registry.js',
    'assets/js/ai-kernel/eon-provider-review-board.js',
    'assets/js/ai-kernel/eon-model-policy-resolver.js'
  ]) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const token of W357_FORBIDDEN_RUNTIME_TOKENS) if (source.includes(token)) errors.push(`${relative} must not contain activation/network token: ${token}`);
  }
  return Object.freeze({ schema: W357_PROVIDER_LIFECYCLE_GOVERNANCE_SCHEMA, ok: errors.length === 0, errors });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = runW357ProviderLifecycleGovernanceGate();
  if (!result.ok) result.errors.forEach((error) => console.error(`[W357] ${error}`));
  else console.log('[W357] PASS: provider protocol aliases normalize locally; stale manifests require explicit user refresh with no silent replacement.');
  process.exitCode = result.ok ? 0 : 1;
}

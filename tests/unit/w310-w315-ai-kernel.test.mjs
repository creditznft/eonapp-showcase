import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { createEonTaskGraph, createEonArtifact, createEonReviewRecord, getEonTaskContractTruth } from '../../assets/js/ai-kernel/eon-task-contract.js';
import { createProviderAdapterRegistry, getProviderAdapterRegistryTruth } from '../../assets/js/ai-kernel/eon-provider-adapter-registry.js';
import { createModelManifest, getEligibleModelRecords, getModelManifestTruth } from '../../assets/js/ai-kernel/eon-model-manifest.js';
import { resolveEonModelPolicy, getModelPolicyResolverTruth } from '../../assets/js/ai-kernel/eon-model-policy-resolver.js';
import { runAdapterContractLab, getAdapterContractLabTruth } from '../../assets/js/ai-kernel/eon-adapter-contract-lab.js';
import { createEonRoutingReceipt, getEonRoutingReceiptTruth } from '../../assets/js/ai-kernel/eon-routing-receipt.js';
import { runW310W315AiKernelGate } from '../../scripts/w310-w315-ai-kernel-gate.mjs';

const cryptoApi = webcrypto;
const now = 1_770_000_000_000;
const projectId = 'eonproj_local-ai-kernel';

test('W310 creates one foreground-only task, hashed artifact, and non-executing review record', () => {
  const task = createEonTaskGraph({ projectId, title: 'Prepare a private local project', nodes: [{ nodeId: 'draft-brief', role: 'writer', state: 'draft', privacyClass: 'device-local', expectedArtifacts: ['brief'], foregroundOnly: true }] }, { now, cryptoApi });
  const artifact = createEonArtifact({ projectId, taskId: task.taskId, kind: 'brief', contentHash: 'sha256:AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-ABCDE', provenance: 'guide', truthLabel: 'drafted' }, { now, cryptoApi });
  const review = createEonReviewRecord({ taskId: task.taskId, artifactIds: [artifact.artifactId] }, { now, cryptoApi });
  assert.equal(task.backgroundAfterClose, false);
  assert.equal(task.rawPromptStored, false);
  assert.equal(artifact.publicUpload, false);
  assert.equal(review.canApproveExternalEffect, false);
});

test('W311–W313 use protocol adapters, dynamic records, exact pin by default, and no silent cross-provider fallback', () => {
  const registry = createProviderAdapterRegistry([{
    schema: 'eonapp.provider-pack.v2', providerId: 'direct-example', label: 'Direct example', adapterId: 'openai-compatible-chat/v1', protocol: 'openai-compatible-chat', trustLevel: 'bundled-audited', endpointPolicy: { mode: 'direct-user-selected' }, discovery: { mode: 'user-import', userActionRequired: true, backgroundProbeAllowed: false, modelCache: 'encrypted-device-local' }, privacy: { route: 'direct-to-provider', cloudRelayAllowed: false, defaultCrossProviderFallback: 'none' }, supportedProfiles: ['chat.fast'], adapterVersion: '1'
  }]);
  assert.equal(registry.packs[0].modelRecordsIncluded, false);
  const manifest = createModelManifest({ providerId: 'direct-example', adapterId: 'openai-compatible-chat/v1', records: [{ modelId: 'future-model-2026-x', verificationState: 'verified', privacyRoute: 'direct-to-provider', capabilities: { 'chat.fast': 'verified' } }], source: 'user-import', checkedAt: now });
  assert.equal(getEligibleModelRecords(manifest, { profile: 'chat.fast', privacyRoute: 'direct-to-provider' }).length, 1);
  const exact = resolveEonModelPolicy({ manifest, requestedProfile: 'chat.fast', taskPrivacyClass: 'direct-to-provider', selection: { providerId: 'direct-example', modelId: 'future-model-2026-x' }, now });
  assert.equal(exact.ok, true);
  const wrong = resolveEonModelPolicy({ manifest, requestedProfile: 'chat.fast', taskPrivacyClass: 'direct-to-provider', selection: { providerId: 'other', modelId: 'anything' }, now });
  assert.equal(wrong.ok, false);
  assert.match(wrong.reason, /exact-pin/i);
});

test('W314–W315 require explicit adapter contract proof and expose the selected data destination without prompt or key storage', async () => {
  const denied = await runAdapterContractLab({ runContractFixture: async () => ({}) });
  assert.equal(denied.ok, false);
  const passed = await runAdapterContractLab({ runContractFixture: async () => ({ streamEvents: ['start', 'delta', 'complete'], structured: { schema: 'example.v1', valid: true }, error: { code: 'rate_limited', retryable: true } }) }, { userInitiated: true });
  assert.equal(passed.ok, true);
  const manifest = createModelManifest({ providerId: 'direct-example', adapterId: 'openai-compatible-chat/v1', records: [{ modelId: 'future-model-2026-x', verificationState: 'verified', privacyRoute: 'direct-to-provider', capabilities: { 'chat.fast': 'verified' } }], source: 'user-import', checkedAt: now });
  const resolution = resolveEonModelPolicy({ manifest, requestedProfile: 'chat.fast', taskPrivacyClass: 'direct-to-provider', selection: { providerId: 'direct-example', modelId: 'future-model-2026-x' }, now });
  const task = createEonTaskGraph({ projectId, title: 'Direct provider task', privacyClass: 'direct-to-provider', nodes: [{ nodeId: 'write-draft', role: 'writer', state: 'ready', privacyClass: 'direct-to-provider', expectedArtifacts: ['draft'], foregroundOnly: true }] }, { now, cryptoApi });
  const receipt = createEonRoutingReceipt({ taskId: task.taskId, resolution, now, cryptoApi });
  assert.match(receipt.dataDestination, /directly to the provider/i);
  assert.equal(receipt.rawPromptStored, false);
  assert.equal(receipt.providerKeyStored, false);
});

test('W310–W315 truth contracts and source gate remain local-first', () => {
  assert.equal(getEonTaskContractTruth().externalExecution, false);
  assert.equal(getProviderAdapterRegistryTruth().hardcodedModelSelection, false);
  assert.equal(getModelManifestTruth().backgroundDiscovery, false);
  assert.equal(getModelPolicyResolverTruth().hiddenCrossProviderFallback, false);
  assert.equal(getAdapterContractLabTruth().adapterCannotBeSupportedWithoutTests, true);
  assert.equal(getEonRoutingReceiptTruth().dataDestinationVisible, true);
  const report = runW310W315AiKernelGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

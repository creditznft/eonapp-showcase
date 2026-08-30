/**
 * RT92 Project AI Profile + Local AI Autopilot policy foundation.
 *
 * A profile is ordinary project preference metadata. It contains no API keys,
 * never probes a runtime, never downloads/starts a model, never changes the
 * selected provider silently and never grants billable/cross-provider consent.
 * The existing institutional routing policy remains execution authority.
 */
import { buildEonAiRoutingPolicy, normalizeEonAiQualityMode } from '../ai-kernel/eon-ai-routing-policy.js';

export const EON_PROJECT_AI_PROFILE_SCHEMA = 'eonapp.project-ai-profile.rt92.v1';
export const EON_LOCAL_AI_AUTOPILOT_SCHEMA = 'eonapp.local-ai-autopilot.rt92.v1';
const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z][a-z0-9._:-]{0,79}$/i;
const POLICY_MODES = new Set(['exact-pin', 'same-provider-auto', 'local-first']);

function safeId(value = '') {
  const id = String(value || '').trim().toLowerCase().slice(0, 80);
  return SAFE_ID.test(id) ? id : '';
}

export function normalizeEonProjectAiProfile(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const preferredProviderId = safeId(source.preferredProviderId || source.providerId);
  const approvedProviderIds = freeze([...new Set((Array.isArray(source.approvedProviderIds) ? source.approvedProviderIds : [])
    .map(safeId).filter(Boolean))].slice(0, 12));
  const modelPolicyMode = POLICY_MODES.has(String(source.modelPolicyMode || '')) ? String(source.modelPolicyMode) : 'exact-pin';
  return freeze({
    schema: EON_PROJECT_AI_PROFILE_SCHEMA,
    qualityMode: normalizeEonAiQualityMode(source.qualityMode || 'auto'),
    preferLocal: source.preferLocal === true,
    preferredRuntimeId: safeId(source.preferredRuntimeId),
    preferredProviderId,
    preferredModelId: String(source.preferredModelId || '').trim().slice(0, 160),
    approvedProviderIds,
    modelPolicyMode,
    allowSameProviderAuto: source.allowSameProviderAuto === true && modelPolicyMode === 'same-provider-auto',
    crossProviderConsent: false,
    billableProviderConsent: false,
    automaticRuntimeProbe: false,
    automaticRuntimeStart: false,
    automaticModelDownload: false,
    automaticProviderSwitch: false,
    automaticBillableFallback: false,
    containsCredential: false
  });
}

export function buildEonProjectAiRoutingEnvelope(profile = {}) {
  const normalized = normalizeEonProjectAiProfile(profile);
  const selectedProviderId = normalized.preferLocal && !normalized.preferredProviderId
    ? normalized.preferredRuntimeId
    : normalized.preferredProviderId;
  return buildEonAiRoutingPolicy({
    qualityMode: normalized.preferLocal && normalized.qualityMode === 'auto' ? 'private' : normalized.qualityMode,
    selectedProviderId,
    approvedProviderIds: normalized.approvedProviderIds,
    crossProviderConsent: false,
    billableProviderConsent: false
  });
}

/**
 * Advisory only. It describes the next reviewed action; it never performs it.
 */
export function buildEonLocalAiAutopilotRecommendation({ profile = {}, localRuntime = {}, modelLifecycle = {} } = {}) {
  const normalized = normalizeEonProjectAiProfile(profile);
  const localWanted = normalized.preferLocal || normalized.qualityMode === 'private' || normalized.modelPolicyMode === 'local-first';
  const runtimeReady = localRuntime?.ready === true || localRuntime?.verified === true || localRuntime?.status === 'ready';
  const modelReady = modelLifecycle?.selfTestPassed === true || modelLifecycle?.verified === true;
  let action = 'review-project-ai-profile';
  let route = '/local-ai';
  let reason = 'Review the project AI preferences before changing any execution route.';

  if (localWanted && !runtimeReady) {
    action = 'make-local-ai-ready';
    reason = 'This project prefers local/private AI, but no verified local runtime is ready. Use the existing Local AI setup flow; no runtime probe or cloud fallback starts automatically.';
  } else if (localWanted && runtimeReady && !modelReady) {
    action = 'run-reviewed-local-self-test';
    reason = 'A local runtime is ready, but a reviewed model self-test is still required before EONBOT can rely on it.';
  } else if (localWanted && runtimeReady && modelReady) {
    action = 'use-reviewed-local-route';
    reason = 'The project can prefer the already-verified local route inside the existing routing envelope. Provider switching and downloads remain explicit.';
  } else if (normalized.preferredProviderId) {
    action = 'use-explicit-selected-provider';
    route = '/settings';
    reason = 'Use the explicitly selected provider for this project. Cross-provider and billable fallback consent remain disabled.';
  }

  return freeze({
    schema: EON_LOCAL_AI_AUTOPILOT_SCHEMA,
    action,
    route,
    reason,
    profile: normalized,
    localWanted,
    runtimeReady,
    modelReady,
    advisoryOnly: true,
    runtimeProbeStarted: false,
    runtimeStartStarted: false,
    modelDownloadStarted: false,
    providerSwitchStarted: false,
    networkRequestCreated: false,
    billableFallbackAuthorized: false,
    crossProviderFallbackAuthorized: false
  });
}

export function validateEonProjectAiProfileFoundation() {
  const errors = [];
  const profile = normalizeEonProjectAiProfile({ qualityMode: 'private', preferLocal: true, preferredRuntimeId: 'ollama', crossProviderConsent: true, billableProviderConsent: true });
  if (profile.crossProviderConsent || profile.billableProviderConsent || profile.automaticProviderSwitch || profile.automaticModelDownload) errors.push('Project AI profile must not store implicit cross-provider/billable/automatic execution consent.');
  const envelope = buildEonProjectAiRoutingEnvelope(profile);
  if (envelope.privacyRoute !== 'device-local' || envelope.allowBillableProvider || envelope.allowCrossProvider) errors.push('Private Local AI profile must remain device-local without billable/cross-provider fallback.');
  const recommendation = buildEonLocalAiAutopilotRecommendation({ profile, localRuntime: { status: 'offline' } });
  if (!recommendation.advisoryOnly || recommendation.networkRequestCreated || recommendation.runtimeProbeStarted) errors.push('Autopilot recommendation must remain advisory-only.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PROJECT_AI_PROFILE_SCHEMA });
}

export default freeze({
  EON_PROJECT_AI_PROFILE_SCHEMA,
  EON_LOCAL_AI_AUTOPILOT_SCHEMA,
  normalizeEonProjectAiProfile,
  buildEonProjectAiRoutingEnvelope,
  buildEonLocalAiAutopilotRecommendation,
  validateEonProjectAiProfileFoundation
});

/** W313 — consent-aware local model policy resolver. */

import { getEligibleModelRecords } from './eon-model-manifest.js';
import { evaluateEonModelManifestLifecycle } from './eon-model-manifest-lifecycle.js';

export const EON_MODEL_POLICY_MODES = Object.freeze(['exact-pin', 'same-provider-auto', 'approved-group-auto', 'local-first']);

function policyValue(value = {}) {
  const policy = value && typeof value === 'object' ? value : {};
  const mode = EON_MODEL_POLICY_MODES.includes(String(policy.mode || '')) ? String(policy.mode) : 'exact-pin';
  const approvedProviderIds = Array.isArray(policy.approvedProviderIds)
    ? [...new Set(policy.approvedProviderIds.map((item) => String(item || '').trim()).filter((item) => /^[a-z][a-z0-9-]{1,64}$/i.test(item)))].sort()
    : [];
  return Object.freeze({ mode, approvedProviderIds, allowSameProviderAuto: policy.allowSameProviderAuto === true });
}

function declined(reason, policy) {
  return Object.freeze({ ok: false, reason, policy, route: null, providerChangeDisclosed: false, networkRequestCreated: false });
}

function route(record, policy, requestedProfile, selection, reason) {
  return Object.freeze({
    ok: true,
    reason,
    policy,
    route: Object.freeze({
      providerId: record.providerId,
      modelId: record.modelId,
      adapterId: record.adapterId,
      adapterVersion: record.adapterVersion,
      profile: requestedProfile,
      privacyRoute: record.privacyRoute,
      verificationState: record.verificationState,
      fallback: 'none'
    }),
    providerChangeDisclosed: record.providerId !== String(selection.providerId || '') || record.modelId !== String(selection.modelId || ''),
    networkRequestCreated: false
  });
}

export function resolveEonModelPolicy({ manifest, requestedProfile, selection = {}, policy = {}, taskPrivacyClass = 'device-local', now = Date.now() } = {}) {
  const requested = String(requestedProfile || '').trim();
  const resolvedPolicy = policyValue(policy);
  if (!['device-local', 'direct-to-provider'].includes(String(taskPrivacyClass))) return declined('invalid-task-privacy-class', resolvedPolicy);
  const lifecycle = evaluateEonModelManifestLifecycle(manifest, { now });
  if (lifecycle.status === 'recheck-required') return declined('model-manifest-user-refresh-required', resolvedPolicy);
  if (lifecycle.status === 'invalid-manifest' || lifecycle.status === 'invalid-records') return declined('model-manifest-invalid', resolvedPolicy);
  const currentIds = new Set(lifecycle.records.filter((record) => record.autoSelectable).map((record) => `${record.providerId}:${record.modelId}`));
  const candidates = getEligibleModelRecords(manifest, { profile: requested, privacyRoute: taskPrivacyClass })
    .filter((record) => currentIds.has(`${record.providerId}:${record.modelId}`));
  if (!candidates.length) return declined('no-current-verified-model-for-profile-and-privacy-boundary', resolvedPolicy);
  const selectedProvider = String(selection.providerId || '').trim();
  const selectedModel = String(selection.modelId || '').trim();

  if (resolvedPolicy.mode === 'exact-pin') {
    const exact = candidates.find((record) => record.providerId === selectedProvider && record.modelId === selectedModel);
    return exact ? route(exact, resolvedPolicy, requested, selection, 'exact-user-pin') : declined('exact-pin-is-not-verified-for-this-profile', resolvedPolicy);
  }
  if (resolvedPolicy.mode === 'same-provider-auto') {
    if (!resolvedPolicy.allowSameProviderAuto || !selectedProvider) return declined('same-provider-auto-not-explicitly-enabled', resolvedPolicy);
    const sameProvider = candidates.filter((record) => record.providerId === selectedProvider);
    if (!sameProvider.length) return declined('no-verified-same-provider-route', resolvedPolicy);
    return route(sameProvider[0], resolvedPolicy, requested, selection, 'same-provider-auto');
  }
  if (resolvedPolicy.mode === 'approved-group-auto') {
    if (taskPrivacyClass === 'device-local') return declined('device-local-task-may-not-route-across-providers', resolvedPolicy);
    if (!resolvedPolicy.approvedProviderIds.length) return declined('approved-group-is-empty', resolvedPolicy);
    const approved = candidates.find((record) => resolvedPolicy.approvedProviderIds.includes(record.providerId));
    return approved ? route(approved, resolvedPolicy, requested, selection, 'approved-group-auto') : declined('no-verified-approved-group-route', resolvedPolicy);
  }
  const local = candidates.find((record) => record.privacyRoute === 'device-local');
  return local ? route(local, resolvedPolicy, requested, selection, 'local-first') : declined('local-first-requires-a-verified-local-route', resolvedPolicy);
}

export function getModelPolicyResolverTruth() {
  return Object.freeze({
    defaultMode: 'exact-pin',
    hiddenCrossProviderFallback: false,
    localTaskHostedFallback: false,
    unknownCapabilityAutoSelection: false,
    providerChangeDisclosureRequired: true,
    staleManifestAutoRouting: false,
    directNetwork: false
  });
}

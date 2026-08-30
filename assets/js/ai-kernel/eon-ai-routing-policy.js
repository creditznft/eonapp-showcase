/**
 * Institutional routing policy envelope.
 *
 * This module turns a simple user-facing quality preference into hard routing
 * boundaries. It never probes a provider, reads a credential, downloads a
 * model, starts a request, or grants cross-provider/billable consent.
 */
export const EON_AI_ROUTING_POLICY_SCHEMA = 'eonapp.ai-routing-policy.v1';
export const EON_AI_ROUTING_QUALITY_MODES = Object.freeze(['auto', 'private', 'best', 'fast', 'economy']);

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);
const clean = (value = '', max = 100) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9._:-]/g, '').slice(0, max);

export function normalizeEonAiQualityMode(value = '') {
  const id = clean(value, 24);
  return EON_AI_ROUTING_QUALITY_MODES.includes(id) ? id : 'auto';
}

export function buildEonAiRoutingPolicy(input = {}) {
  const qualityMode = normalizeEonAiQualityMode(input.qualityMode || input.modelSelectionPolicy);
  const selectedProviderId = clean(input.selectedProviderId || input.providerId, 64);
  const approvedProviderIds = [...new Set((Array.isArray(input.approvedProviderIds) ? input.approvedProviderIds : [])
    .map((id) => clean(id, 64)).filter(Boolean))];
  const crossProviderConsent = input.crossProviderConsent === true;
  const billableProviderConsent = input.billableProviderConsent === true;
  const selectedIsLocal = LOCAL_PROVIDER_IDS.has(selectedProviderId);

  let privacyRoute = 'selected-provider';
  if (qualityMode === 'private') privacyRoute = 'device-local';

  const allowedProviderIds = qualityMode === 'private'
    ? [...new Set([selectedIsLocal ? selectedProviderId : '', ...approvedProviderIds.filter((id) => LOCAL_PROVIDER_IDS.has(id))].filter(Boolean))]
    : crossProviderConsent
      ? [...new Set([selectedProviderId, ...approvedProviderIds].filter(Boolean))]
      : (selectedProviderId ? [selectedProviderId] : []);

  return Object.freeze({
    schema: EON_AI_ROUTING_POLICY_SCHEMA,
    qualityMode,
    modelPolicy: qualityMode,
    selectedProviderId,
    privacyRoute,
    allowedProviderIds: Object.freeze(allowedProviderIds),
    crossProviderConsent,
    billableProviderConsent,
    allowCrossProvider: crossProviderConsent && allowedProviderIds.length > 1,
    allowBillableProvider: billableProviderConsent,
    allowSameProviderModelAutoSelection: qualityMode !== 'private' || selectedIsLocal,
    allowModelDownload: false,
    allowRuntimeInstall: false,
    allowHiddenRetry: false,
    requireProviderChangeDisclosure: true,
    requireCostBoundaryDisclosure: true
  });
}

export function assessEonAiProviderRoute(candidate = {}, policy = {}) {
  const envelope = policy?.schema === EON_AI_ROUTING_POLICY_SCHEMA ? policy : buildEonAiRoutingPolicy(policy);
  const providerId = clean(candidate.providerId || candidate.id, 64);
  const local = candidate.local === true || LOCAL_PROVIDER_IDS.has(providerId) || candidate.privacyRoute === 'device-local';
  const billable = candidate.billable === true || ['paid', 'metered', 'unknown'].includes(clean(candidate.costClass, 24));
  if (!providerId) return Object.freeze({ allowed: false, reason: 'provider-id-required', policy: envelope });
  if (!envelope.allowedProviderIds.includes(providerId)) return Object.freeze({ allowed: false, reason: 'provider-outside-approved-envelope', policy: envelope });
  if (envelope.qualityMode === 'private' && !local) return Object.freeze({ allowed: false, reason: 'private-mode-device-local-only', policy: envelope });
  const selectedDirectRoute = providerId === envelope.selectedProviderId;
  // Selecting a provider is already an explicit instruction to use that provider.
  // A second billing toggle is required only before a router may move to a
  // different metered/billable provider. This prevents surprise-cost fallback
  // without breaking ordinary BYOK requests to the provider the user chose.
  if (billable && !selectedDirectRoute && !envelope.allowBillableProvider) {
    return Object.freeze({ allowed: false, reason: 'billable-provider-consent-required', policy: envelope });
  }
  return Object.freeze({
    allowed: true,
    reason: local ? 'approved-device-local-route' : (selectedDirectRoute ? 'explicit-selected-provider-route' : 'approved-provider-route'),
    policy: envelope
  });
}

export function getEonAiRoutingPolicyTruth() {
  return Object.freeze({
    schema: EON_AI_ROUTING_POLICY_SCHEMA,
    defaultQualityMode: 'auto',
    silentCrossProviderFallback: false,
    silentBillableFallback: false,
    silentModelDownloads: false,
    silentRuntimeInstalls: false,
    modelAutoSelectionWithinApprovedEnvelope: true,
    providerChangeDisclosureRequired: true
  });
}

/** W626A/W626C/W626D — reviewed Direct BYOK provider and model registry. */

const freeze = Object.freeze;

export const EON_DIRECT_PROVIDER_REGISTRY_SCHEMA = 'eon.direct-byok.provider-registry.w626d.v1';
export const EON_DIRECT_REVIEWED_MODEL_SCHEMA = 'eon.direct-byok.reviewed-model.w626d.v1';

export const EON_DIRECT_PROVIDERS = freeze([
  freeze({
    id: 'fal',
    label: 'fal',
    authScheme: 'Key',
    apiOrigins: freeze(['https://queue.fal.run']),
    mediaHostnameSuffixes: freeze(['fal.media', 'storage.googleapis.com']),
    companionOnly: true,
    capabilities: freeze(['image', 'video']),
    queueStates: freeze(['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED']),
    supportsCancel: true,
    supportsProviderCostEstimate: false,
    retryPolicy: 'manual-only',
    docsContract: 'async-queue-rest'
  }),
  freeze({
    id: 'replicate',
    label: 'Replicate',
    authScheme: 'Bearer',
    apiOrigins: freeze(['https://api.replicate.com']),
    mediaHostnameSuffixes: freeze(['replicate.delivery']),
    companionOnly: true,
    capabilities: freeze(['image', 'video']),
    queueStates: freeze(['starting', 'processing', 'succeeded', 'failed', 'canceled']),
    supportsCancel: true,
    supportsProviderCostEstimate: false,
    retryPolicy: 'manual-only',
    docsContract: 'predictions-rest'
  }),
  freeze({
    id: 'elevenlabs',
    label: 'ElevenLabs Music',
    authScheme: 'xi-api-key',
    apiOrigins: freeze(['https://api.elevenlabs.io']),
    mediaHostnameSuffixes: freeze([]),
    companionOnly: true,
    capabilities: freeze(['music']),
    queueStates: freeze(['completed', 'failed']),
    supportsCancel: false,
    supportsProviderCostEstimate: false,
    retryPolicy: 'manual-only',
    docsContract: 'music-v2-binary-compose-rest'
  })
]);

const PROVIDER_BY_ID = new Map(EON_DIRECT_PROVIDERS.map((row) => [row.id, row]));

export function getDirectProvider(providerId = '') {
  return PROVIDER_BY_ID.get(String(providerId || '').trim().toLowerCase()) || null;
}

export function normalizeReviewedModel(candidate = {}) {
  const provider = getDirectProvider(candidate.providerId);
  const id = String(candidate.id || '').trim();
  const remoteId = String(candidate.remoteId || '').trim();
  const mediaKind = String(candidate.mediaKind || '').trim();
  const inputModes = Array.isArray(candidate.inputModes) ? candidate.inputModes.filter((value) => ['text', 'image'].includes(value)) : [];
  if (!provider || !/^[a-z0-9][a-z0-9._:-]{2,127}$/i.test(id) || !['image', 'video', 'music'].includes(mediaKind)) return null;
  if (!remoteId || !/^[a-z0-9][a-z0-9._/-]{2,180}$/i.test(remoteId)) return null;
  if (!provider.capabilities.includes(mediaKind) || !inputModes.length) return null;
  return freeze({
    schema: EON_DIRECT_REVIEWED_MODEL_SCHEMA,
    id,
    providerId: provider.id,
    remoteId,
    mediaKind,
    inputModes: freeze([...new Set(inputModes)]),
    outputContentTypes: freeze((Array.isArray(candidate.outputContentTypes) ? candidate.outputContentTypes : []).filter((value) => /^(image|video|audio)\//.test(String(value)))),
    enabled: candidate.enabled === true,
    reviewedAt: String(candidate.reviewedAt || ''),
    reviewedBy: String(candidate.reviewedBy || ''),
    registryDigest: String(candidate.registryDigest || ''),
    costEstimate: candidate.costEstimate && typeof candidate.costEstimate === 'object' ? freeze({ ...candidate.costEstimate }) : freeze({ available: false, reason: 'provider-does-not-expose-preflight-estimate' })
  });
}

export function buildReviewedModelRegistry(candidates = []) {
  const rows = (Array.isArray(candidates) ? candidates : []).map(normalizeReviewedModel).filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.providerId}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return freeze({ schema: EON_DIRECT_PROVIDER_REGISTRY_SCHEMA, models: freeze(unique), providerCount: EON_DIRECT_PROVIDERS.length, enabledModelCount: unique.filter((row) => row.enabled).length });
}

export function resolveReviewedModel(registry = {}, providerId = '', modelId = '', mediaKind = '') {
  const row = (Array.isArray(registry.models) ? registry.models : []).find((candidate) => candidate.providerId === providerId && candidate.id === modelId && candidate.mediaKind === mediaKind && candidate.enabled === true);
  return row || null;
}

export function getDirectProviderRegistryTruth() {
  return freeze({
    providers: freeze(EON_DIRECT_PROVIDERS.map((row) => row.id)),
    twoImageAdaptersPresent: EON_DIRECT_PROVIDERS.filter((row) => row.capabilities.includes('image')).length >= 2,
    twoVideoAdaptersPresent: EON_DIRECT_PROVIDERS.filter((row) => row.capabilities.includes('video')).length >= 2,
    hostedMusicAdapterPresent: EON_DIRECT_PROVIDERS.some((row) => row.id === 'elevenlabs' && row.capabilities.includes('music')),
    arbitraryProviderEndpointsAllowed: false,
    arbitraryModelIdsAllowed: false,
    realProviderProofComplete: false,
    currentProofState: 'source-adapters-complete-real-user-owned-provider-proof-pending'
  });
}

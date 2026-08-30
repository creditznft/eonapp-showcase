/**
 * W311 — versioned provider adapter registry.
 *
 * An adapter describes a protocol boundary; a model record remains separate.
 * Packs are local data supplied with a release or explicitly imported by a
 * person. No pack contains an API key or starts a discovery request.
 */

import { EON_CANONICAL_PROVIDER_PROTOCOLS, normalizeEonProviderProtocol } from './eon-provider-protocol-contract.js';

export const EON_PROVIDER_PACK_SCHEMA = 'eonapp.provider-pack.v2';
export const EON_PROVIDER_PROTOCOLS = EON_CANONICAL_PROVIDER_PROTOCOLS;
export const EON_PROVIDER_TRUST_LEVELS = Object.freeze(['bundled-audited', 'signed-import', 'user-custom']);

const PROVIDER_ID_RE = /^[a-z][a-z0-9-]{1,64}$/;
const ADAPTER_ID_RE = /^[a-z][a-z0-9-]{1,80}\/v[1-9][0-9]*$/;

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validateEndpointPolicy(value = {}) {
  const policy = value && typeof value === 'object' ? value : {};
  const mode = String(policy.mode || '').trim();
  if (!['none', 'loopback-local', 'direct-user-selected'].includes(mode)) throw new Error('Provider pack endpoint policy is invalid.');
  if (policy.url !== undefined || policy.apiKey !== undefined || policy.token !== undefined || policy.secret !== undefined) throw new Error('Provider packs cannot contain endpoints, credentials, or tokens.');
  return Object.freeze({ mode });
}

function validateDiscovery(value = {}) {
  const discovery = value && typeof value === 'object' ? value : {};
  if (discovery.userActionRequired !== true || discovery.backgroundProbeAllowed !== false) throw new Error('Provider discovery must be user-triggered and never background.');
  if (!['manual-only', 'user-triggered-direct-provider', 'user-import'].includes(String(discovery.mode || ''))) throw new Error('Provider discovery mode is invalid.');
  if (String(discovery.modelCache || '') !== 'encrypted-device-local') throw new Error('Provider model cache must be encrypted and device-local.');
  return Object.freeze({
    mode: String(discovery.mode),
    userActionRequired: true,
    backgroundProbeAllowed: false,
    modelCache: 'encrypted-device-local'
  });
}

function validatePrivacy(value = {}) {
  const privacy = value && typeof value === 'object' ? value : {};
  const route = String(privacy.route || '').trim();
  if (!['device-local', 'direct-to-provider'].includes(route) || privacy.cloudRelayAllowed !== false || privacy.defaultCrossProviderFallback !== 'none') throw new Error('Provider pack privacy boundary is invalid.');
  return Object.freeze({ route, cloudRelayAllowed: false, defaultCrossProviderFallback: 'none' });
}

export function normalizeProviderPack(value = {}) {
  const pack = value && typeof value === 'object' ? value : {};
  const providerId = String(pack.providerId || '').trim();
  const adapterId = String(pack.adapterId || '').trim();
  const protocolResolution = normalizeEonProviderProtocol(pack.protocol);
  const protocol = protocolResolution.protocol;
  const trustLevel = String(pack.trustLevel || '').trim();
  if (pack.schema !== EON_PROVIDER_PACK_SCHEMA || !PROVIDER_ID_RE.test(providerId) || !ADAPTER_ID_RE.test(adapterId) || !EON_PROVIDER_PROTOCOLS.includes(protocol) || !EON_PROVIDER_TRUST_LEVELS.includes(trustLevel)) throw new Error('Provider pack identity is invalid.');
  if (/model|gpt|claude|gemini|llama/i.test(adapterId.replace(/\/v\d+$/, '')) && !['guide', 'local-openai-compatible', 'openai-compatible-chat', 'gemini-native', 'anthropic-native', 'cohere-native', 'perplexity-sonar'].includes(protocol)) throw new Error('Provider adapter identity may not claim a model family.');
  return Object.freeze({
    schema: EON_PROVIDER_PACK_SCHEMA,
    version: 2,
    providerId,
    label: cleanText(pack.label || providerId, 80),
    adapterId,
    protocol,
    protocolAliasUsed: protocolResolution.aliasUsed,
    trustLevel,
    endpointPolicy: validateEndpointPolicy(pack.endpointPolicy),
    discovery: validateDiscovery(pack.discovery),
    privacy: validatePrivacy(pack.privacy),
    supportedProfiles: Object.freeze((Array.isArray(pack.supportedProfiles) ? pack.supportedProfiles : []).map((item) => cleanText(item, 48)).filter((item) => /^[a-z][a-z0-9.]{1,48}$/i.test(item)).slice(0, 24)),
    adapterVersion: cleanText(pack.adapterVersion || '1', 24),
    keysIncluded: false,
    modelRecordsIncluded: false
  });
}

export function createProviderAdapterRegistry(packs = []) {
  const normalized = (Array.isArray(packs) ? packs : []).map(normalizeProviderPack);
  const ids = new Set();
  for (const pack of normalized) {
    if (ids.has(pack.providerId)) throw new Error('Provider pack IDs must be unique.');
    ids.add(pack.providerId);
  }
  return Object.freeze({
    schema: 'eonapp.provider-adapter-registry.v1',
    packs: Object.freeze(normalized),
    directNetwork: false,
    automaticDiscovery: false,
    hiddenCrossProviderFallback: false
  });
}

export function getProviderAdapter(registry, providerId = '') {
  return Object.freeze((registry?.packs || []).find((pack) => pack.providerId === String(providerId || '').trim()) || null);
}

export function getProviderAdapterRegistryTruth() {
  return Object.freeze({
    schema: 'eonapp.provider-adapter-registry.v1',
    protocolAndModelSeparated: true,
    hardcodedModelSelection: false,
    directNetwork: false,
    backgroundDiscovery: false,
    hiddenRelay: false,
    crossProviderFallbackDefault: 'none',
    keysInPacks: false
  });
}

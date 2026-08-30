/**
 * W357 — provider protocol canonicalization.
 *
 * Provider packs describe transport families, never named models. Aliases are
 * accepted only at user-reviewed import time and normalized into a stable,
 * versionable canonical identifier. No endpoint, credential, model list,
 * discovery request, or network action exists here.
 */

export const EON_PROVIDER_PROTOCOL_CONTRACT_SCHEMA = 'eonapp.provider-protocol-contract.v1';

export const EON_CANONICAL_PROVIDER_PROTOCOLS = Object.freeze([
  'guide',
  'local-openai-compatible',
  'openai-compatible-chat',
  'gemini-native',
  'anthropic-native',
  'cohere-native',
  'perplexity-sonar',
  'custom-direct'
]);

const PROTOCOL_ALIASES = Object.freeze({
  guide: 'guide',
  'local-openai-compatible': 'local-openai-compatible',
  'local-web-runtime': 'local-openai-compatible',
  'openai-compatible-chat': 'openai-compatible-chat',
  'openai-chat-completions': 'openai-compatible-chat',
  'gemini-native': 'gemini-native',
  'gemini-generate-content': 'gemini-native',
  'anthropic-native': 'anthropic-native',
  'anthropic-messages': 'anthropic-native',
  'cohere-native': 'cohere-native',
  'cohere-v2-chat': 'cohere-native',
  'perplexity-sonar': 'perplexity-sonar',
  'perplexity-sonar-api': 'perplexity-sonar',
  'custom-direct': 'custom-direct'
});

function cleanProtocol(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
}

export function normalizeEonProviderProtocol(value = '') {
  const input = cleanProtocol(value);
  const protocol = PROTOCOL_ALIASES[input] || '';
  return Object.freeze({
    input,
    protocol,
    valid: Boolean(protocol),
    aliasUsed: Boolean(protocol && input !== protocol)
  });
}

export function listEonProviderProtocolAliases() {
  return Object.freeze(Object.entries(PROTOCOL_ALIASES).map(([alias, protocol]) => Object.freeze({ alias, protocol, canonical: alias === protocol }))); 
}

export function getEonProviderProtocolContractTruth() {
  return Object.freeze({
    schema: EON_PROVIDER_PROTOCOL_CONTRACT_SCHEMA,
    protocolFamiliesOnly: true,
    hardcodedModels: false,
    aliasesRequireUserReview: true,
    endpointStored: false,
    credentialStored: false,
    networkRequestCreated: false,
    automaticProviderActivation: false
  });
}

export default Object.freeze({
  EON_PROVIDER_PROTOCOL_CONTRACT_SCHEMA,
  EON_CANONICAL_PROVIDER_PROTOCOLS,
  normalizeEonProviderProtocol,
  listEonProviderProtocolAliases,
  getEonProviderProtocolContractTruth
});

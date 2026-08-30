/**
 * A15 I11 — canonical provider execution contract.
 *
 * This is the runtime-facing bridge between the protocol catalog and one
 * foreground provider call. It contains no endpoint, model, key or prompt.
 */

export const EON_PROVIDER_EXECUTION_CONTRACT_SCHEMA = 'eonapp.provider-execution-contract.a15.v1';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 100) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, max);

function protocolFor(provider = {}) {
  const id = clean(provider.id, 80);
  const kind = clean(provider.kind, 80);
  if (id === 'guide' || kind === 'guide') return 'guide';
  if (id === 'browserlocal' || kind === 'browser-local') return 'browser-local';
  if (id === 'browserlocal') return 'browser-local';
  if (id === 'ollama' || id === 'lmstudio' || id === 'jan') return 'local-openai-compatible';
  if (kind === 'gemini') return 'gemini-native';
  if (kind === 'anthropic') return 'anthropic-native';
  if (kind === 'cohere') return 'cohere-native';
  if (kind === 'perplexity') return 'perplexity-sonar';
  if (id === 'custom') return 'custom-direct';
  return 'openai-compatible-chat';
}

export function createEonProviderExecutionContract(provider = {}, requestContext = {}) {
  const providerId = clean(provider.id, 80);
  const protocol = protocolFor(provider);
  const providerSearchCapable = protocol === 'perplexity-sonar';
  const explicitSearchRequested = requestContext.searchMode === true;
  const searchConsentSource = String(requestContext.searchConsentSource || '').trim().slice(0, 160);
  const searchEnabled = providerSearchCapable && explicitSearchRequested && Boolean(searchConsentSource);
  const searchState = searchEnabled
    ? 'explicit-provider-search'
    : providerSearchCapable
      ? (explicitSearchRequested ? 'blocked-missing-explicit-search-consent' : 'disabled-for-ordinary-request')
      : 'unsupported-by-active-adapter';

  return freeze({
    schema: EON_PROVIDER_EXECUTION_CONTRACT_SCHEMA,
    providerId,
    protocol,
    privacyRoute: ['browserlocal', 'ollama', 'lmstudio', 'jan'].includes(providerId) ? 'device-local' : 'direct-to-provider',
    userOwnedCredential: provider.requiresApiKey === true,
    oneProviderAttempt: true,
    hiddenRetryAllowed: false,
    crossProviderFallback: 'none',
    search: freeze({
      capable: providerSearchCapable,
      requested: explicitSearchRequested,
      enabled: searchEnabled,
      state: searchState,
      consentSource: searchEnabled ? searchConsentSource : '',
      ordinaryRequestDisableSearch: providerSearchCapable && !searchEnabled,
      citationsRequiredWhenEnabled: providerSearchCapable,
      searchResultsRequiredWhenEnabled: providerSearchCapable
    }),
    usage: freeze({
      authority: 'provider-response',
      inventedTokenCountsAllowed: false,
      inventedCostAllowed: false,
      billingAuthority: providerId === 'guide' ? 'none' : 'user-provider-account'
    })
  });
}

export function getEonProviderExecutionContractTruth() {
  return freeze({
    schema: EON_PROVIDER_EXECUTION_CONTRACT_SCHEMA,
    oneProviderAttempt: true,
    hiddenRetryAllowed: false,
    crossProviderFallback: 'none',
    ordinaryProviderSearchDefault: 'disabled',
    explicitSearchConsentRequired: true,
    citationsPreservedWhenReturned: true,
    providerUsageOnly: true,
    inventedCostAllowed: false,
    containsEndpoint: false,
    containsCredential: false,
    containsPrompt: false
  });
}

export default freeze({ createEonProviderExecutionContract, getEonProviderExecutionContractTruth });

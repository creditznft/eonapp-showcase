import { getPartnerMonetizationRuntimeConfig } from './rt97-partner-monetization-contract.mjs';

/**
 * RT97 — explicit Sponsored Discovery boundary for Local AI / BYOK users.
 *
 * This is deliberately NOT part of private inference. A user reviews a small
 * outbound search intent and explicitly sends it to a separately configured
 * sponsored-discovery provider. Full chat history, memory and provider keys are
 * not accepted by this contract.
 */
export const EON_SPONSORED_DISCOVERY_SCHEMA = 'eonapp.sponsored-discovery.rt97.v2';
export const EON_SPONSORED_DISCOVERY_PROVIDER = 'zyntent-first-vexrail-fallback';
export const EON_SPONSORED_DISCOVERY_CATEGORIES = Object.freeze([
  'general', 'software', 'business', 'travel', 'shopping'
]);
export const EON_SPONSORED_DISCOVERY_FORBIDDEN_FIELDS = Object.freeze([
  'messages', 'conversation', 'history', 'memory', 'memories', 'prompt',
  'systemPrompt', 'system_prompt', 'apiKey', 'api_key', 'providerKey',
  'provider_key', 'authorization', 'cookie', 'attachments', 'files',
  'localAnswer', 'local_answer', 'byokResponse', 'byok_response'
]);

const SECRET_PATTERN = /(?:\b(?:api[-_ ]?key|password|secret|authorization|bearer|private[-_ ]?key|mnemonic|seed phrase)\b|\bsk-[A-Za-z0-9_-]{12,}|\bAIza[0-9A-Za-z_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;

function cleanText(value = '', max = 180) {
  return Array.from(String(value || '').trim())
    .filter((character) => {
      const code = character.codePointAt(0) || 0;
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

export function sanitizeSponsoredDiscoveryIntent(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const forbidden = EON_SPONSORED_DISCOVERY_FORBIDDEN_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(source, key));
  if (forbidden.length) return Object.freeze({ ok: false, reason: 'private_context_field_rejected', forbidden: Object.freeze(forbidden) });
  if (source.explicitReview !== true) return Object.freeze({ ok: false, reason: 'explicit_review_required' });
  const query = cleanText(source.query, 180);
  if (query.length < 3) return Object.freeze({ ok: false, reason: 'query_too_short' });
  if (SECRET_PATTERN.test(query)) return Object.freeze({ ok: false, reason: 'secret_like_intent_rejected' });
  const categoryCandidate = cleanText(source.category || 'general', 24).toLowerCase();
  const category = EON_SPONSORED_DISCOVERY_CATEGORIES.includes(categoryCandidate) ? categoryCandidate : 'general';
  const requested = Number(source.maxResults ?? source.limit ?? 4);
  const maxResults = Number.isFinite(requested) ? Math.min(5, Math.max(1, Math.floor(requested))) : 4;
  return Object.freeze({
    ok: true,
    schema: EON_SPONSORED_DISCOVERY_SCHEMA,
    intent: Object.freeze({ query, category, maxResults }),
    outboundFields: Object.freeze(['query', 'category', 'maxResults']),
    fullConversationForwarded: false,
    localAnswerForwarded: false,
    privateMemoryForwarded: false,
    providerKeysForwarded: false,
    guestOneShotUsed: false
  });
}

export function getSponsoredDiscoveryRuntimeConfig(env = {}) {
  const partner = getPartnerMonetizationRuntimeConfig(env);
  const zyntentReady = partner.zyntent.ready === true;
  return Object.freeze({
    schema: EON_SPONSORED_DISCOVERY_SCHEMA,
    active: true,
    provider: zyntentReady ? EON_SPONSORED_DISCOVERY_PROVIDER : 'vexrail-one-turn',
    zyntentFirst: zyntentReady,
    requiresSignedIn: true,
    requiresExplicitReview: true,
    usesVexrailAuthority: true,
    usesSeparateProviderCredential: zyntentReady,
    usesSeparateProviderEndpoint: zyntentReady,
    maxResults: 5,
    hourlyNetworkCap: 12,
    hourlyAccountCap: 8,
    dailyNetworkCap: 40,
    fullConversationForwarded: false,
    localAnswerForwarded: false,
    privateMemoryForwarded: false,
    providerKeysForwarded: false,
    reason: zyntentReady ? 'zyntent_structured_results_then_vexrail_fallback' : 'delegated_to_vexrail_one_turn_authority'
  });
}

export default Object.freeze({
  EON_SPONSORED_DISCOVERY_SCHEMA,
  EON_SPONSORED_DISCOVERY_PROVIDER,
  EON_SPONSORED_DISCOVERY_CATEGORIES,
  EON_SPONSORED_DISCOVERY_FORBIDDEN_FIELDS,
  sanitizeSponsoredDiscoveryIntent,
  getSponsoredDiscoveryRuntimeConfig
});

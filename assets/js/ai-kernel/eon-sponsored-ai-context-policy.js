/**
 * Sponsored AI context sharing policy.
 *
 * Vexrail is an external sponsored execution rail. EONAPP therefore keeps
 * locally saved memory and recent local activity out of Sponsored AI unless
 * the user explicitly opts in. Even when enabled, only a tiny relevant,
 * redacted context tier is eligible; Vault data, credentials, arbitrary local
 * state, files and raw receipts are never part of this policy.
 */
import { readEonAiMemoryPolicy } from './eon-ai-memory-policy.js';
import { buildEonClientResearchPacket } from '../../../config/eon-client-research-contract.mjs';

export const EON_SPONSORED_AI_CONTEXT_POLICY_SCHEMA = 'eonapp.sponsored-ai.context-policy.v1';
export const EON_SPONSORED_AI_CONTEXT_POLICY_KEY = 'eon:sponsored-ai:context-policy:v1';
export const EON_SPONSORED_AI_MEMORY_MAX_CHAT = 2;
export const EON_SPONSORED_AI_MEMORY_MAX_DEEP = 3;
export const EON_SPONSORED_AI_RESEARCH_MAX_SOURCES = 3;
export const EON_SPONSORED_AI_RESEARCH_MAX_EXCERPT_CHARS = 2400;
export const EON_SPONSORED_AI_RESEARCH_MAX_TOTAL_EXCERPT_CHARS = 6000;

const STOPWORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'can', 'could', 'did', 'does', 'for', 'from', 'have', 'help', 'how', 'into',
  'last', 'like', 'make', 'more', 'need', 'our', 'please', 'that', 'the', 'their', 'them', 'then', 'this', 'those', 'use', 'using',
  'want', 'was', 'were', 'what', 'when', 'where', 'which', 'with', 'would', 'you', 'your'
]);
const CONTROL_CHARACTERS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`, 'g');

function storageTarget(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

function normalizeText(value = '', max = 1800) {
  return String(value || '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function tokenizeRelevant(value = '') {
  return [...new Set((normalizeText(value, 4000).toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => !STOPWORDS.has(token)))];
}

function luhnValid(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * This is deliberately stricter than the ordinary local-memory ledger because
 * a selected card will cross the Sponsored AI privacy boundary.
 */
export function inspectEonSponsoredAiMemoryCard(value = '') {
  const text = normalizeText(typeof value === 'object'
    ? `${value?.kind || ''} ${(Array.isArray(value?.tags) ? value.tags : []).join(' ')} ${value?.content || ''}`
    : value);
  if (!text) return Object.freeze({ ok: false, categories: Object.freeze(['empty']) });
  const categories = new Set();
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) categories.add('email');
  if (/-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----/i.test(text)) categories.add('private_key');
  if (/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9_-]{12,}\b/i.test(text)
    || /\b(?:sk|pk)-[A-Za-z0-9_-]{20,}\b/i.test(text)
    || /\bAIza[0-9A-Za-z_-]{30,}\b/.test(text)
    || /\b(?:ghp|github_pat|xox[baprs])[_-][A-Za-z0-9_-]{16,}\b/i.test(text)
    || /\bAKIA[0-9A-Z]{16}\b/.test(text)
    || /\bBearer\s+[A-Za-z0-9._~+/-]{20,}={0,2}\b/i.test(text)
    || /\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|authorization)\b\s*[:=]?\s*\S+/i.test(text)) categories.add('credential');
  if (/\b(?:password|passcode|pin|otp|one[- ]time password|cvv|cvc|recovery code|secret question)\s*(?:(?:is)\s*[:=]?|[:=])?\s*\S{3,}/i.test(text)) categories.add('secret');
  if (/\b(?:aadhaar|aadhar)\s*(?:number|no\.?|is|:|=)?\s*\d{4}[ -]?\d{4}[ -]?\d{4}\b/i.test(text)
    || /\b(?:pan|pan card)\s*(?:number|no\.?|is|:|=)?\s*[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(text)
    || /\b(?:ssn|social security(?: number)?)\s*(?:is|:|=)?\s*\d{3}-?\d{2}-?\d{4}\b/i.test(text)
    || /\b(?:passport|tax id|tax identification)\s*(?:number|no\.?|is|:|=)\s*[A-Z0-9-]{6,20}\b/i.test(text)) categories.add('government_id');
  if (/\b(?:phone|mobile|whatsapp|contact number)\s*(?:is|:|=)?\s*\+?[0-9][0-9 ()-]{7,}[0-9]\b/i.test(text)) categories.add('phone');
  if (/\b(?:bank account|account number|iban|routing number|upi id)\s*(?:is|:|=)\s*[A-Z0-9@._ -]{6,34}\b/i.test(text)) categories.add('financial_identifier');
  if (/\b(?:my|our)\s+(?:medical record|medical report|diagnosis|prescription|lab report|health record)\b/i.test(text)) categories.add('sensitive_personal_context');
  const digitCandidates = text.match(/(?:\d[ -]?){13,19}/g) || [];
  if (digitCandidates.some((entry) => luhnValid(entry))) categories.add('payment_card');
  return Object.freeze({ ok: categories.size === 0, categories: Object.freeze([...categories].sort()) });
}

export function isEonSponsoredAiMemoryCardSafe(card = {}) {
  return inspectEonSponsoredAiMemoryCard(card).ok;
}

/** Keep only model-useful memory data across the Sponsored boundary. */
export function projectEonSponsoredAiMemoryCardForPrompt(card = {}) {
  const rawScope = String(card?.scope || '').trim().toLowerCase();
  return Object.freeze({
    kind: normalizeText(card?.kind || 'context', 48) || 'context',
    scope: rawScope.startsWith('project:') ? 'project' : 'global',
    confidence: Number(Number(card?.confidence || 0).toFixed(2)),
    content: normalizeText(card?.content || '', 1600)
  });
}

/**
 * Sponsored memory must have lexical relevance instead of receiving a card
 * merely because it is recent/pinned. This is intentionally conservative to
 * avoid needless paid context tokens.
 */
export function isEonSponsoredAiMemoryCardRelevant(card = {}, query = '') {
  const queryTokens = tokenizeRelevant(query);
  if (!queryTokens.length) return false;
  const cardTokens = new Set(tokenizeRelevant(`${card?.kind || ''} ${(card?.tags || []).join(' ')} ${card?.content || ''}`));
  return queryTokens.some((token) => cardTokens.has(token));
}

export function isEonSponsoredAiMemoryCardEligible(card = {}, query = '') {
  return isEonSponsoredAiMemoryCardSafe(card) && isEonSponsoredAiMemoryCardRelevant(card, query);
}

export function readEonSponsoredAiContextPolicy(options = {}) {
  const storage = storageTarget(options.storage);
  let raw = {};
  try { raw = JSON.parse(storage?.getItem(EON_SPONSORED_AI_CONTEXT_POLICY_KEY) || '{}'); } catch { raw = {}; }
  return Object.freeze({
    schema: EON_SPONSORED_AI_CONTEXT_POLICY_SCHEMA,
    enabled: raw.enabled === true,
    updatedAt: Number(raw.updatedAt || 0),
    explicitOptInRequired: true,
    rawChatCapture: false,
    wholeLedgerSharing: false,
    clientResearchSharing: 'explicit-one-turn-only',
    vaultSharing: false,
    fileSharing: false
  });
}

export function writeEonSponsoredAiContextPolicy(enabled = false, options = {}) {
  if (options.explicitUserAction !== true) {
    return Object.freeze({ ok: false, reason: 'explicit-user-action-required', policy: readEonSponsoredAiContextPolicy(options) });
  }
  const storage = storageTarget(options.storage);
  if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', policy: readEonSponsoredAiContextPolicy(options) });
  const policy = {
    schema: EON_SPONSORED_AI_CONTEXT_POLICY_SCHEMA,
    enabled: enabled === true,
    updatedAt: Number(options.now ?? Date.now()),
    rawChatCapture: false,
    wholeLedgerSharing: false,
    clientResearchSharing: 'explicit-one-turn-only',
    vaultSharing: false,
    fileSharing: false
  };
  try {
    storage.setItem(EON_SPONSORED_AI_CONTEXT_POLICY_KEY, JSON.stringify(policy));
    return Object.freeze({ ok: true, reason: null, policy: Object.freeze(policy) });
  } catch {
    return Object.freeze({ ok: false, reason: 'storage-unavailable', policy: readEonSponsoredAiContextPolicy(options) });
  }
}

function sponsoredMemoryTaskCap(input = '', taskType = 'chat') {
  const task = String(taskType || 'chat').trim().toLowerCase();
  if (task === 'code' || task === 'coding' || task === 'reasoning' || task === 'strategy' || task === 'forge-code') return EON_SPONSORED_AI_MEMORY_MAX_DEEP;
  const text = normalizeText(input, 1200).toLowerCase();
  if (/\b(continue|resume|pick up|carry on|project|website|app|code|debug|architecture|reason|analysis|analyse|strategy|plan|audit|investigate)\b/.test(text)) return EON_SPONSORED_AI_MEMORY_MAX_DEEP;
  return EON_SPONSORED_AI_MEMORY_MAX_CHAT;
}

/**
 * Rebuild an explicitly queued client-only research packet for Sponsored AI.
 *
 * The queue action itself is the consent. Vexrail never gets an autonomous
 * browser/tool handle: EONAPP passes only a small cited evidence packet that
 * was already captured locally and queued for this one turn. Guest bootstrap
 * is isolated, and sensitive/irrelevant oversized source material is excluded.
 */
export function resolveEonSponsoredAiResearchPacket(packet = null, options = {}) {
  const guest = options.guestSponsoredBootstrap === true;
  if (guest || packet?.clientOnly !== true || Number(packet?.sourceCount || 0) <= 0) {
    return buildEonClientResearchPacket({}, options);
  }

  const safeSources = [];
  let totalExcerptChars = 0;
  for (const source of Array.isArray(packet?.sources) ? packet.sources : []) {
    if (safeSources.length >= EON_SPONSORED_AI_RESEARCH_MAX_SOURCES) break;
    const title = normalizeText(source?.title || '', 180);
    const url = normalizeText(source?.url || '', 2048);
    const excerpt = normalizeText(source?.excerpt || '', EON_SPONSORED_AI_RESEARCH_MAX_EXCERPT_CHARS);
    if (!excerpt) continue;
    const inspection = inspectEonSponsoredAiMemoryCard(`${title}\n${url}\n${excerpt}`);
    if (!inspection.ok) continue;
    const remaining = EON_SPONSORED_AI_RESEARCH_MAX_TOTAL_EXCERPT_CHARS - totalExcerptChars;
    if (remaining <= 0) break;
    const boundedExcerpt = excerpt.slice(0, remaining);
    if (!boundedExcerpt) continue;
    safeSources.push({
      id: source?.id || '',
      title,
      url,
      excerpt: boundedExcerpt,
      method: source?.method || 'manual-paste',
      capturedAt: source?.capturedAt || ''
    });
    totalExcerptChars += boundedExcerpt.length;
  }

  return buildEonClientResearchPacket({
    query: normalizeText(packet?.query || '', 1400),
    sources: safeSources,
    capturedAt: packet?.capturedAt || ''
  }, options);
}

/** Resolve the only context EONAPP may add across the Sponsored AI boundary. */
export function resolveEonSponsoredAiContext(input = '', options = {}) {
  const sponsoredPolicy = readEonSponsoredAiContextPolicy(options);
  const memoryPolicy = readEonAiMemoryPolicy({ storage: options.storage });
  const budgetMemoryLimit = Math.max(0, Math.min(8, Number(options.budgetMemoryLimit ?? 0)));
  const guest = options.guestSponsoredBootstrap === true;
  const enabled = sponsoredPolicy.enabled === true && memoryPolicy.mode !== 'off' && !guest;
  const memoryLimit = enabled ? Math.min(budgetMemoryLimit, sponsoredMemoryTaskCap(input, options.taskType)) : 0;
  return Object.freeze({
    schema: EON_SPONSORED_AI_CONTEXT_POLICY_SCHEMA,
    enabled,
    memoryLimit,
    recentOutcomeContext: enabled,
    recentOutcomeIncludeRoute: false,
    clientResearchContext: 'explicit-one-turn-only',
    memoryMode: memoryPolicy.mode,
    reason: guest
      ? 'guest-sponsored-bootstrap-isolated'
      : memoryPolicy.mode === 'off'
        ? 'eon-memory-off'
        : sponsoredPolicy.enabled !== true
          ? 'sponsored-context-opt-in-off'
          : 'explicit-sponsored-context-opt-in',
    memoryCardFilter: enabled ? (card) => isEonSponsoredAiMemoryCardEligible(card, input) : () => false,
    memoryPromptCardProjector: projectEonSponsoredAiMemoryCardForPrompt
  });
}

export function getEonSponsoredAiContextTruth() {
  return Object.freeze({
    schema: EON_SPONSORED_AI_CONTEXT_POLICY_SCHEMA,
    defaultEnabled: false,
    explicitOptInRequired: true,
    eonMemoryOffOverrides: true,
    guestMemorySharing: false,
    maximumChatMemoryCards: EON_SPONSORED_AI_MEMORY_MAX_CHAT,
    maximumDeepMemoryCards: EON_SPONSORED_AI_MEMORY_MAX_DEEP,
    relevanceRequired: true,
    stricterSensitiveCardFilter: true,
    sponsoredMemoryMetadataMinimized: true,
    recentOutcomeIntentGatedByExistingProjection: true,
    sponsoredRecentOutcomeRouteIncluded: false,
    clientResearchAutomaticSharing: false,
    clientResearchExplicitOneTurnSharing: true,
    clientCapturedWebEvidence: true,
    providerNativeSearchThroughVexrail: false,
    maximumResearchSources: EON_SPONSORED_AI_RESEARCH_MAX_SOURCES,
    maximumResearchExcerptCharsPerSource: EON_SPONSORED_AI_RESEARCH_MAX_EXCERPT_CHARS,
    maximumResearchTotalExcerptChars: EON_SPONSORED_AI_RESEARCH_MAX_TOTAL_EXCERPT_CHARS,
    autonomousBrowserControl: false,
    rawChatCapture: false,
    wholeLedgerSharing: false,
    vaultSharing: false,
    credentialSharing: false,
    privateFileSharing: false,
    actionAuthority: false,
    foundationModelTraining: false
  });
}

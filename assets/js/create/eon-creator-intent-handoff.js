/**
 * EON Creator Intent Handoff
 * --------------------------
 * A deliberately narrow, ephemeral bridge for carrying one user-authored
 * creation idea from a user-tapped Chat CTA into the canonical Create page.
 *
 * This is NOT the durable/navigation handoff authority. Prompts remain banned
 * from that metadata-only contract. This bridge stores at most one bounded
 * prompt in sessionStorage, requires an explicit write action, expires quickly,
 * is consumed exactly once, and never starts generation or provider work.
 */

export const EON_CREATOR_INTENT_HANDOFF_SCHEMA = 'eon.creator.intent-handoff.v1';
export const EON_CREATOR_INTENT_HANDOFF_KEY = 'eon:create:intent-handoff:v1';
export const EON_CREATOR_INTENT_HANDOFF_TTL_MS = 5 * 60 * 1000;
export const EON_CREATOR_INTENT_HANDOFF_MAX_PROMPT_CHARS = 1200;

const MODES = new Set(['image', 'video', 'music']);
const freeze = (value) => Object.freeze(value);
const SECRET_PATTERNS = Object.freeze([
  /\b(?:gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|sk-proj)_[A-Za-z0-9_-]{16,}\b/i,
  /\bsk-[A-Za-z0-9_-]{18,}\b/i,
  /\b(?:api[-_ ]?key|access[-_ ]?token|secret[-_ ]?key|password|passphrase|private[-_ ]?key)\s*[:=]\s*[^\s]{8,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i
]);

function normalizeMode(value = '') {
  const mode = String(value || '').trim().toLowerCase();
  return MODES.has(mode) ? mode : '';
}

function cleanPrompt(value = '') {
  return String(value || '')
    // Strip NUL from an ephemeral user-authored handoff before validation.
    // eslint-disable-next-line no-control-regex
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

function containsSecretLikeValue(value = '') {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function readRaw(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CREATOR_INTENT_HANDOFF_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function removeRaw(storage) {
  try { storage?.removeItem?.(EON_CREATOR_INTENT_HANDOFF_KEY); } catch {}
}

function fail(reason) {
  return freeze({ ok: false, reason, handoff: null });
}

/**
 * Write a single-use Creator idea only after the user taps a supported CTA.
 * The public result intentionally never echoes the prompt.
 */
export function writeEonCreatorIntentHandoff(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return fail('explicit-user-action-required');
  const mode = normalizeMode(input.mode);
  if (!mode) return fail('creator-mode-not-supported');
  const prompt = cleanPrompt(input.prompt);
  if (!prompt) return fail('creator-prompt-required');
  if (containsSecretLikeValue(prompt)) return fail('creator-prompt-sensitive-value-rejected');
  if (prompt.length > EON_CREATOR_INTENT_HANDOFF_MAX_PROMPT_CHARS) return fail('creator-prompt-too-long');

  const storage = options.sessionStorage || globalThis.sessionStorage;
  const now = Number(options.now ?? Date.now());
  const ttlMs = Math.max(30_000, Math.min(EON_CREATOR_INTENT_HANDOFF_TTL_MS, Number(input.ttlMs || EON_CREATOR_INTENT_HANDOFF_TTL_MS)));
  const handoff = {
    schema: EON_CREATOR_INTENT_HANDOFF_SCHEMA,
    mode,
    prompt,
    source: 'chat-user-tap',
    createdAt: now,
    expiresAt: now + ttlMs,
    generationStarted: false,
    providerCalled: false,
    externalExecutionAuthority: false,
    durableStorage: false
  };
  try {
    storage?.setItem?.(EON_CREATOR_INTENT_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    return fail('creator-intent-session-storage-unavailable');
  }
  return freeze({
    ok: true,
    reason: '',
    handoff: freeze({
      schema: handoff.schema,
      mode: handoff.mode,
      source: handoff.source,
      createdAt: handoff.createdAt,
      expiresAt: handoff.expiresAt,
      generationStarted: false,
      providerCalled: false,
      externalExecutionAuthority: false,
      durableStorage: false,
      promptStoredInSession: true,
      promptEchoedInReceipt: false
    })
  });
}

/**
 * Consume exactly once. The record is removed before validation so stale,
 * tampered, mismatched, or sensitive records cannot remain available for a
 * later page to recover accidentally.
 */
export function consumeEonCreatorIntentHandoff(options = {}) {
  const storage = options.sessionStorage || globalThis.sessionStorage;
  const raw = readRaw(storage);
  if (!raw) return fail('creator-intent-handoff-not-found');
  removeRaw(storage);

  if (raw.schema !== EON_CREATOR_INTENT_HANDOFF_SCHEMA) return fail('creator-intent-schema-mismatch');
  const mode = normalizeMode(raw.mode);
  const expectedMode = normalizeMode(options.mode || mode);
  if (!mode || !expectedMode || expectedMode !== mode) return fail('creator-intent-mode-mismatch');
  const prompt = cleanPrompt(raw.prompt);
  if (!prompt) return fail('creator-prompt-required');
  if (prompt.length > EON_CREATOR_INTENT_HANDOFF_MAX_PROMPT_CHARS) return fail('creator-prompt-too-long');
  if (containsSecretLikeValue(prompt)) return fail('creator-prompt-sensitive-value-rejected');

  const now = Number(options.now ?? Date.now());
  const createdAt = Number(raw.createdAt || 0);
  const expiresAt = Number(raw.expiresAt || 0);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || createdAt <= 0 || expiresAt <= createdAt) return fail('creator-intent-time-invalid');
  if (expiresAt < now) return fail('creator-intent-handoff-expired');
  if (expiresAt - createdAt > EON_CREATOR_INTENT_HANDOFF_TTL_MS) return fail('creator-intent-ttl-invalid');
  if (raw.generationStarted === true || raw.providerCalled === true || raw.externalExecutionAuthority === true || raw.durableStorage === true) return fail('creator-intent-truth-boundary-invalid');

  return freeze({
    ok: true,
    reason: '',
    handoff: freeze({
      schema: EON_CREATOR_INTENT_HANDOFF_SCHEMA,
      mode,
      prompt,
      source: 'chat-user-tap',
      createdAt,
      expiresAt,
      consumed: true,
      generationStarted: false,
      providerCalled: false,
      externalExecutionAuthority: false,
      durableStorage: false
    })
  });
}

export function clearEonCreatorIntentHandoff(options = {}) {
  removeRaw(options.sessionStorage || globalThis.sessionStorage);
  return true;
}

export function getEonCreatorIntentHandoffTruth() {
  return freeze({
    schema: EON_CREATOR_INTENT_HANDOFF_SCHEMA,
    allowedModes: freeze([...MODES]),
    storage: 'sessionStorage-single-record',
    durableStorage: false,
    urlPromptTransport: false,
    receiptContainsPrompt: false,
    coreOutcomeContainsPrompt: false,
    providerTelemetryContainsPrompt: false,
    explicitUserActionRequired: true,
    singleConsume: true,
    maxPromptChars: EON_CREATOR_INTENT_HANDOFF_MAX_PROMPT_CHARS,
    ttlMs: EON_CREATOR_INTENT_HANDOFF_TTL_MS,
    generationStartedByHandoff: false,
    providerCalledByHandoff: false,
    externalExecutionAuthority: false,
    legacyCreatorLaunchKeyConsumed: false
  });
}

export default freeze({
  EON_CREATOR_INTENT_HANDOFF_SCHEMA,
  EON_CREATOR_INTENT_HANDOFF_KEY,
  EON_CREATOR_INTENT_HANDOFF_TTL_MS,
  EON_CREATOR_INTENT_HANDOFF_MAX_PROMPT_CHARS,
  writeEonCreatorIntentHandoff,
  consumeEonCreatorIntentHandoff,
  clearEonCreatorIntentHandoff,
  getEonCreatorIntentHandoffTruth
});

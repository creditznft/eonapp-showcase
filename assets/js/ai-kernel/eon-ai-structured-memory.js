import { rememberEonAiMemory } from './eon-ai-memory-ledger.js';
import { assessEonAiAutomaticMemoryCandidate, readEonAiMemoryPolicy } from './eon-ai-memory-policy.js';

/**
 * Institutional AI V2 — safe structured memory signals.
 *
 * Only finite, user-operated product controls can enter this bridge. Arbitrary
 * chat text is intentionally impossible to submit through this API. In Ask or
 * Off mode nothing is written. Safe Auto writes only the normalized sentence
 * defined by the signal schema below.
 */
export const EON_AI_STRUCTURED_MEMORY_SCHEMA = 'eonapp.ai-structured-memory.v1';

const freeze = (value) => Object.freeze(value);
const LANGUAGE_RE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i;

const MODEL_POLICY_LABELS = freeze({
  auto: 'Auto',
  private: 'Private',
  best: 'Best quality',
  fast: 'Fast',
  economy: 'Economy'
});
const RUNTIME_LABELS = freeze({
  'local-first': 'Local-first',
  hybrid: 'Hybrid',
  'provider-connected': 'Provider-connected'
});
const RADIO_GENRE_LABELS = freeze({ ambient: 'Ambient', electronic: 'Electronic', house: 'House', techno: 'Techno', 'hip-hop': 'Hip-hop', pop: 'Pop', rock: 'Rock', jazz: 'Jazz', classical: 'Classical', cinematic: 'Cinematic', world: 'World', experimental: 'Experimental' });
const RADIO_VOCAL_LABELS = freeze({ instrumental: 'Instrumental', mixed: 'Mixed vocals', vocal: 'Vocal-forward' });
const RADIO_ENERGY_LABELS = freeze({ calm: 'Calm', balanced: 'Balanced', high: 'High energy' });

function normalizeSignal(signalId = '', value = '') {
  const id = String(signalId || '').trim().toLowerCase();
  const raw = String(value ?? '').trim();
  if (id === 'model-selection-policy' && MODEL_POLICY_LABELS[raw]) {
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'structured-preference-control', content: `Preferred EONBOT model policy: ${MODEL_POLICY_LABELS[raw]}.`, tags: freeze(['model-policy', raw]), safe: true });
  }
  if (id === 'runtime-preference' && RUNTIME_LABELS[raw]) {
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'structured-preference-control', content: `Preferred EONBOT runtime mode: ${RUNTIME_LABELS[raw]}.`, tags: freeze(['runtime-preference', raw]), safe: true });
  }
  if (id === 'chat-language') {
    const lang = raw.toLowerCase().replace(/_/g, '-').slice(0, 24);
    if (!LANGUAGE_RE.test(lang)) return null;
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'structured-preference-control', content: `Preferred EONBOT chat language: ${lang}.`, tags: freeze(['chat-language', lang]), safe: true });
  }
  if (id === 'radio-genre' && RADIO_GENRE_LABELS[raw]) {
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'creator-setting', content: `Preferred EON Radio genre family: ${RADIO_GENRE_LABELS[raw]}.`, tags: freeze(['radio-genre', raw]), safe: true });
  }
  if (id === 'radio-vocals' && RADIO_VOCAL_LABELS[raw]) {
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'creator-setting', content: `Preferred EON Radio vocal mode: ${RADIO_VOCAL_LABELS[raw]}.`, tags: freeze(['radio-vocals', raw]), safe: true });
  }
  if (id === 'radio-energy' && RADIO_ENERGY_LABELS[raw]) {
    return freeze({ signalId: id, kind: 'preference', sourceClass: 'creator-setting', content: `Preferred EON Radio energy: ${RADIO_ENERGY_LABELS[raw]}.`, tags: freeze(['radio-energy', raw]), safe: true });
  }
  return null;
}

export function rememberEonAiStructuredSignal(signalId = '', value = '', options = {}) {
  if (options.explicitControlChange !== true) return freeze({ ok: false, stored: false, reason: 'explicit-control-change-required', card: null });
  const signal = normalizeSignal(signalId, value);
  if (!signal) return freeze({ ok: false, stored: false, reason: 'structured-signal-invalid', card: null });
  const policy = options.policy || readEonAiMemoryPolicy({ storage: options.storage });
  const assessment = assessEonAiAutomaticMemoryCandidate({ sourceClass: signal.sourceClass, safe: signal.safe }, { policy, storage: options.storage });
  if (!assessment.allowed) return freeze({ ok: true, stored: false, reason: assessment.reason, requiresConfirmation: assessment.requiresConfirmation, card: null, signalId: signal.signalId });
  const result = rememberEonAiMemory({
    kind: signal.kind,
    content: signal.content,
    tags: signal.tags,
    source: `safe-auto:${signal.sourceClass}`,
    confidence: 1,
    pinned: false
  }, { consent: true, storage: options.storage, now: options.now });
  return freeze({
    ok: result.ok === true,
    stored: result.ok === true,
    reason: result.reason || 'safe-structured-signal',
    requiresConfirmation: false,
    signalId: signal.signalId,
    card: result.card || null
  });
}

export function getEonAiStructuredMemoryTruth() {
  return freeze({
    schema: EON_AI_STRUCTURED_MEMORY_SCHEMA,
    supportedSignals: freeze(['model-selection-policy', 'runtime-preference', 'chat-language', 'radio-genre', 'radio-vocals', 'radio-energy']),
    rawChatAccepted: false,
    arbitraryTextAccepted: false,
    safeAutoPolicyRequired: true,
    explicitControlChangeRequired: true,
    providerKeyStored: false,
    promptStored: false,
    responseStored: false,
    fineTuning: false
  });
}

export default freeze({ EON_AI_STRUCTURED_MEMORY_SCHEMA, rememberEonAiStructuredSignal, getEonAiStructuredMemoryTruth });

/**
 * A15 I13 — bounded voice-session authority.
 *
 * Dictation is always editable-first and never gains send authority. Voice
 * Conversation is an optional browser-assisted Beta. It may auto-send final
 * turns only after an explicit, current-session review. No audio, transcript,
 * provider key or active-microphone state is persisted here.
 */
export const EON_VOICE_SESSION_SCHEMA = 'eonapp.voice-session-authority.a15.v1';
export const EON_VOICE_CONSENT_SESSION_KEY = 'eon:voice:conversation-consent:a15:v1';
export const EON_VOICE_CONSENT_TTL_MS = 30 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 160) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').trim().slice(0, max);

function storeFor(store) {
  if (store) return store;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function secureId(cryptoImpl = globalThis.crypto) {
  if (typeof cryptoImpl?.randomUUID === 'function') return cryptoImpl.randomUUID();
  if (typeof cryptoImpl?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoImpl.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

export function buildVoiceConversationReview({ locale = 'en-US', routeLabel = 'current AI route', browserAssisted = true } = {}) {
  return freeze({
    schema: EON_VOICE_SESSION_SCHEMA,
    mode: 'voice-conversation-beta',
    title: 'Voice Conversation (Beta)',
    locale: clean(locale, 24) || 'en-US',
    routeLabel: clean(routeLabel, 120) || 'current AI route',
    browserAssisted: browserAssisted === true,
    autoSendFinalTurns: true,
    continuousListeningUntilStopped: true,
    microphoneStartsOnlyAfterConfirmation: true,
    stopEndsMicrophoneAndSpokenOutput: true,
    dictateAlternative: 'Use Dictate when you want speech converted to editable text without automatic sending.',
    privacy: browserAssisted
      ? 'Browser speech recognition may use a browser or operating-system service. EONAPP does not store audio.'
      : 'Speech follows the disclosed active voice route. EONAPP does not store audio.'
  });
}

export function grantVoiceConversationConsent({
  explicitUserAction = false,
  autoSendAcknowledged = false,
  continuousListeningAcknowledged = false,
  locale = 'en-US',
  routeLabel = 'current AI route'
} = {}, { store, now = () => Date.now(), cryptoImpl = globalThis.crypto } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, error: 'explicit-user-action-required' });
  if (!autoSendAcknowledged || !continuousListeningAcknowledged) return freeze({ ok: false, error: 'voice-disclosures-not-acknowledged' });
  const token = secureId(cryptoImpl);
  if (!token) return freeze({ ok: false, error: 'secure-random-unavailable' });
  const issuedAtMs = Number(now());
  const record = {
    schema: EON_VOICE_SESSION_SCHEMA,
    token,
    locale: clean(locale, 24) || 'en-US',
    routeLabel: clean(routeLabel, 120) || 'current AI route',
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt: new Date(issuedAtMs + EON_VOICE_CONSENT_TTL_MS).toISOString(),
    autoSendFinalTurns: true,
    continuousListeningUntilStopped: true,
    containsAudio: false,
    containsTranscript: false,
    activeMicrophone: false
  };
  try {
    const resolved = storeFor(store);
    if (!resolved) return freeze({ ok: false, error: 'session-storage-unavailable' });
    resolved.setItem(EON_VOICE_CONSENT_SESSION_KEY, JSON.stringify(record));
    const verified = JSON.parse(String(resolved.getItem(EON_VOICE_CONSENT_SESSION_KEY) || '{}'));
    if (verified.token !== token || verified.schema !== EON_VOICE_SESSION_SCHEMA) throw new Error('voice-consent-write-verification-failed');
  } catch (error) {
    return freeze({ ok: false, error: clean(error?.message || 'voice-consent-write-failed', 120) });
  }
  return freeze({ ok: true, token, expiresAt: record.expiresAt, receipt: freeze({ ...record, token: '[session-token-redacted]' }) });
}

export function readVoiceConversationConsent({ token = '', store, now = () => Date.now() } = {}) {
  try {
    const resolved = storeFor(store);
    const record = JSON.parse(String(resolved?.getItem(EON_VOICE_CONSENT_SESSION_KEY) || '{}'));
    const valid = record?.schema === EON_VOICE_SESSION_SCHEMA
      && Boolean(record?.token)
      && (!token || record.token === token)
      && record.autoSendFinalTurns === true
      && record.continuousListeningUntilStopped === true
      && Date.parse(String(record.expiresAt || '')) > Number(now());
    if (!valid) return freeze({ ok: false, error: 'voice-consent-missing-or-expired' });
    return freeze({ ok: true, token: record.token, locale: record.locale, routeLabel: record.routeLabel, expiresAt: record.expiresAt });
  } catch {
    return freeze({ ok: false, error: 'voice-consent-invalid' });
  }
}

export function authorizeVoiceInput({ mode = 'dictate', explicitUserAction = false, consentToken = '' } = {}, options = {}) {
  if (mode === 'dictate') {
    return freeze({
      ok: explicitUserAction === true,
      mode: 'dictate',
      editableBeforeSend: true,
      autoSend: false,
      error: explicitUserAction === true ? '' : 'explicit-user-action-required'
    });
  }
  const consent = readVoiceConversationConsent({ token: consentToken, ...options });
  return freeze({
    ok: consent.ok,
    mode: 'voice-conversation',
    editableBeforeSend: false,
    autoSend: consent.ok,
    continuous: consent.ok,
    error: consent.ok ? '' : consent.error
  });
}

export function clearVoiceConversationConsent({ store } = {}) {
  try { storeFor(store)?.removeItem(EON_VOICE_CONSENT_SESSION_KEY); } catch {}
  return freeze({ ok: true, schema: EON_VOICE_SESSION_SCHEMA });
}

export function getVoiceSessionAuthorityTruth() {
  return freeze({
    schema: EON_VOICE_SESSION_SCHEMA,
    dictateAutoSend: false,
    dictateEditableBeforeSend: true,
    voiceConversationBeta: true,
    voiceConversationAutoSendDisclosed: true,
    voiceConversationConsentScope: 'sessionStorage-bounded',
    activeMicrophonePersisted: false,
    transcriptPersisted: false,
    audioPersisted: false,
    microphoneRequiresUserAction: true,
    typedFallbackPermanent: true,
    stopClearsConsent: true
  });
}

export default freeze({
  EON_VOICE_SESSION_SCHEMA,
  EON_VOICE_CONSENT_SESSION_KEY,
  buildVoiceConversationReview,
  grantVoiceConversationConsent,
  readVoiceConversationConsent,
  authorizeVoiceInput,
  clearVoiceConversationConsent,
  getVoiceSessionAuthorityTruth
});

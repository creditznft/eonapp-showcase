/**
 * W562 — explicit, captions-first City dictation consent.
 *
 * This is a narrow browser-assisted dictation surface. It never starts from
 * City boot, never listens in the background, never stores audio/transcripts,
 * never sends a transcript to Chat, and never executes a route, tool, or
 * approval. Browser SpeechRecognition is intentionally labelled browser
 * assisted: a browser may use an external recognition service.
 */
import { buildNativeVoiceCapabilityPlan } from '../chat/native-voice-strategy.js';
import { VOICE_LANGUAGE_OPTIONS, normalizeVoiceLanguagePreference } from '../chat/voice-language-preferences.js';
import { authorizeVoiceInput } from '../chat/eon-voice-session-authority.js';

export const EON_CITY_VOICE_CONSENT_SCHEMA = 'eon.city.voice-consent.w562.v1';
export const EON_CITY_VOICE_MAX_TRANSCRIPT_CHARS = 720;

const freeze = (value) => Object.freeze(value);

function windowLike(environment = globalThis) {
  return environment?.window || environment || globalThis;
}

function navigatorLike(environment = globalThis) {
  return environment?.navigator || environment?.window?.navigator || globalThis.navigator || {};
}

function recognitionConstructor(environment = globalThis) {
  const view = windowLike(environment);
  return view?.SpeechRecognition || view?.webkitSpeechRecognition || null;
}

function microphoneRequest(environment = globalThis) {
  const nav = navigatorLike(environment);
  return typeof nav?.mediaDevices?.getUserMedia === 'function' ? nav.mediaDevices.getUserMedia.bind(nav.mediaDevices) : null;
}

function secureContextAvailable(environment = globalThis) {
  const view = windowLike(environment);
  return view?.isSecureContext === true || environment?.isSecureContext === true || globalThis.isSecureContext === true;
}

function browserFamily(userAgent = '') {
  const ua = String(userAgent || '').toLowerCase();
  if (ua.includes('telegram')) return 'telegram-webview';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome') || ua.includes('crios')) return 'chromium';
  if (ua.includes('safari')) return 'safari';
  return 'unknown';
}

function cleanText(value = '', maximum = EON_CITY_VOICE_MAX_TRANSCRIPT_CHARS) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function appendText(previous = '', next = '') {
  return cleanText([previous, next].filter(Boolean).join(' '));
}

function readableError(error) {
  const name = String(error?.name || error?.code || '').trim().toLowerCase();
  if (name.includes('notallowed') || name.includes('permission') || name.includes('service-not-allowed')) return 'permission-denied';
  if (name.includes('notfound') || name.includes('audio-capture')) return 'microphone-unavailable';
  if (name.includes('network')) return 'browser-speech-network-unavailable';
  if (name.includes('aborted')) return 'stopped';
  return 'browser-dictation-unavailable';
}

export function getEonCityVoiceLanguageOptions() {
  return VOICE_LANGUAGE_OPTIONS;
}

/** A display-safe feature receipt; availability is not physical-device proof. */
export function getEonCityVoiceCapability({ environment = globalThis } = {}) {
  const nav = navigatorLike(environment);
  const secureContext = secureContextAvailable(environment);
  const recognizer = recognitionConstructor(environment);
  const getUserMedia = microphoneRequest(environment);
  const synthesisSupported = Boolean(windowLike(environment)?.speechSynthesis);
  const userAgent = String(nav?.userAgent || '');
  const telegramMiniApp = /telegram/i.test(userAgent);
  const nativePlan = buildNativeVoiceCapabilityPlan({
    userAgent,
    telegramMiniApp,
    capabilities: {
      speechRecognition: Boolean(recognizer),
      speechSynthesis: synthesisSupported,
      getUserMedia: Boolean(getUserMedia),
      mediaRecorder: Boolean(windowLike(environment)?.MediaRecorder)
    }
  });
  const microphoneCheckAvailable = secureContext && Boolean(getUserMedia);
  const dictationAvailable = microphoneCheckAvailable && Boolean(recognizer) && !telegramMiniApp;
  let mode = 'typed-fallback';
  let reason = 'Use typed EONBOT input. This browser cannot offer the City permission check here.';
  if (!secureContext) {
    mode = 'blocked-insecure-context';
    reason = 'Microphone and browser dictation need a secure HTTPS context. Typed input remains available.';
  } else if (telegramMiniApp) {
    mode = 'full-browser-required';
    reason = 'Telegram webviews may hide microphone prompts. Open the full browser for any voice experiment.';
  } else if (!recognizer && microphoneCheckAvailable) {
    mode = 'permission-check-only';
    reason = 'This browser can check microphone permission but does not expose browser speech recognition. Use typed EONBOT input.';
  } else if (dictationAvailable) {
    mode = 'ready-for-explicit-dictation';
    reason = 'Browser-assisted dictation can begin only after your microphone check and a second visible Start Dictation action.';
  }
  return freeze({
    schema: EON_CITY_VOICE_CONSENT_SCHEMA,
    browserFamily: browserFamily(userAgent),
    secureContext,
    recognitionSupported: Boolean(recognizer),
    speechSynthesisSupported: synthesisSupported,
    microphoneCheckAvailable,
    dictationAvailable,
    browserAssisted: Boolean(recognizer),
    localSpeechModelClaimed: false,
    physicalDeviceProven: false,
    languageDeviceProven: false,
    mode,
    reason,
    nativePlan,
    captionsFirst: true,
    explicitMicrophoneActionRequired: true,
    explicitDictationActionRequired: true,
    voiceConversationRestartRequiresSessionConsent: true,
    continuousListening: false,
    audioPersisted: false,
    transcriptPersisted: false,
    automaticChatSend: false,
    automaticRoute: false,
    automaticToolExecution: false
  });
}

/**
 * Owns one City-panel dictation session. All state is in-memory and discarded
 * on close/dispose. `getUserMedia` is used only after an explicit permission
 * check and each check stream is stopped immediately.
 */
export function createEonCityVoiceConsentController({ environment = globalThis, onState = null } = {}) {
  const capability = getEonCityVoiceCapability({ environment });
  const listeners = new Set();
  let recognition = null;
  let disposed = false;
  let state = {
    microphonePermission: 'not-requested',
    microphoneCheckCompleted: false,
    microphoneTrackActive: false,
    dictationState: 'idle',
    selectedLocale: 'auto',
    finalTranscript: '',
    interimTranscript: '',
    transcript: '',
    reviewReady: false,
    lastError: '',
    startedByUser: false,
    microphoneRequestedByUser: false
  };

  const snapshot = () => freeze({
    schema: EON_CITY_VOICE_CONSENT_SCHEMA,
    capability,
    ...state,
    transcriptMemoryOnly: true,
    transcriptPersisted: false,
    audioPersisted: false,
    backgroundListening: false,
    routeOpened: false,
    chatMessageSent: false,
    toolExecuted: false,
    providerRequestCreated: false
  });
  const emit = () => {
    const current = snapshot();
    try { onState?.(current); } catch {}
    for (const listener of listeners) {
      try { listener(current); } catch {}
    }
    return current;
  };
  const update = (patch = {}) => {
    state = { ...state, ...patch };
    return emit();
  };
  const resetRecognition = () => { recognition = null; };

  const checkMicrophonePermission = async ({ explicitUserAction = false } = {}) => {
    if (disposed) return freeze({ ok: false, error: 'controller-disposed', snapshot: snapshot() });
    if (!explicitUserAction) return freeze({ ok: false, error: 'explicit-user-action-required', snapshot: snapshot() });
    if (!capability.microphoneCheckAvailable) {
      update({ microphonePermission: 'unavailable', microphoneCheckCompleted: false, microphoneTrackActive: false, lastError: 'microphone-check-unavailable' });
      return freeze({ ok: false, error: 'microphone-check-unavailable', snapshot: snapshot() });
    }
    update({ microphonePermission: 'checking', microphoneCheckCompleted: false, microphoneTrackActive: false, microphoneRequestedByUser: true, lastError: '' });
    try {
      const stream = await microphoneRequest(environment)({ audio: true });
      const tracks = typeof stream?.getTracks === 'function' ? stream.getTracks() : [];
      for (const track of tracks) {
        try { track?.stop?.(); } catch {}
      }
      update({ microphonePermission: 'granted-check-only', microphoneCheckCompleted: true, microphoneTrackActive: false, lastError: '' });
      return freeze({ ok: true, status: 'granted-check-only', stoppedTrackCount: tracks.length, snapshot: snapshot() });
    } catch (error) {
      const code = readableError(error);
      update({ microphonePermission: code === 'permission-denied' ? 'denied' : 'unavailable', microphoneCheckCompleted: false, microphoneTrackActive: false, lastError: code });
      return freeze({ ok: false, error: code, snapshot: snapshot() });
    }
  };

  const stopDictation = (reason = 'user-stop') => {
    const active = recognition;
    resetRecognition();
    try { active?.stop?.(); } catch {}
    update({ microphoneTrackActive: false, dictationState: state.transcript ? 'review-ready' : 'idle', lastError: reason === 'user-stop' ? '' : state.lastError });
    return freeze({ ok: true, reason, snapshot: snapshot() });
  };

  const startDictation = ({ explicitUserAction = false, locale = 'auto', mode = 'dictate', consentToken = '' } = {}) => {
    if (disposed) return freeze({ ok: false, error: 'controller-disposed', snapshot: snapshot() });
    const voiceConversation = mode === 'voice';
    const inputAuthority = voiceConversation
      ? authorizeVoiceInput({ mode: 'voice', consentToken }, { store: windowLike(environment)?.sessionStorage })
      : authorizeVoiceInput({ mode: 'dictate', explicitUserAction });
    if (!inputAuthority.ok) return freeze({ ok: false, error: inputAuthority.error || 'explicit-user-action-required', snapshot: snapshot() });
    if (!capability.dictationAvailable) return freeze({ ok: false, error: 'browser-dictation-unavailable', snapshot: snapshot() });
    if (state.microphonePermission !== 'granted-check-only') return freeze({ ok: false, error: 'microphone-check-required', snapshot: snapshot() });
    if (recognition) return freeze({ ok: false, error: 'dictation-already-active', snapshot: snapshot() });
    const Recognition = recognitionConstructor(environment);
    if (!Recognition) return freeze({ ok: false, error: 'browser-dictation-unavailable', snapshot: snapshot() });
    const selectedLocale = normalizeVoiceLanguagePreference(locale);
    const instance = new Recognition();
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    if (selectedLocale !== 'auto') instance.lang = selectedLocale;
    instance.onstart = () => update({ microphoneTrackActive: true, dictationState: 'listening', selectedLocale, startedByUser: voiceConversation ? false : true, lastError: '' });
    instance.onresult = (event) => {
      let finalTranscript = state.finalTranscript;
      let interimTranscript = '';
      const rows = event?.results || [];
      const start = Number.isInteger(event?.resultIndex) ? event.resultIndex : 0;
      for (let index = start; index < rows.length; index += 1) {
        const result = rows[index];
        const phrase = cleanText(result?.[0]?.transcript || '');
        if (!phrase) continue;
        if (result?.isFinal) finalTranscript = appendText(finalTranscript, phrase);
        else interimTranscript = appendText(interimTranscript, phrase);
      }
      const transcript = appendText(finalTranscript, interimTranscript);
      update({ finalTranscript, interimTranscript, transcript, reviewReady: Boolean(transcript), dictationState: recognition ? 'listening' : (transcript ? 'review-ready' : 'idle') });
    };
    instance.onerror = (event) => {
      const code = readableError(event?.error ? { code: event.error } : event);
      resetRecognition();
      update({ microphoneTrackActive: false, dictationState: state.transcript ? 'review-ready' : 'idle', lastError: code });
    };
    instance.onend = () => {
      resetRecognition();
      update({ microphoneTrackActive: false, dictationState: state.transcript ? 'review-ready' : 'idle' });
    };
    recognition = instance;
    update({ dictationState: 'starting', selectedLocale, startedByUser: voiceConversation ? false : true, lastError: '' });
    try {
      instance.start();
      return freeze({ ok: true, status: 'browser-dictation-requested', snapshot: snapshot() });
    } catch (error) {
      resetRecognition();
      const code = readableError(error);
      update({ microphoneTrackActive: false, dictationState: 'idle', lastError: code });
      return freeze({ ok: false, error: code, snapshot: snapshot() });
    }
  };

  const clearReview = ({ explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, error: 'explicit-user-action-required', snapshot: snapshot() });
    update({ finalTranscript: '', interimTranscript: '', transcript: '', reviewReady: false, lastError: '' });
    return freeze({ ok: true, snapshot: snapshot() });
  };

  return freeze({
    getSnapshot: snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    checkMicrophonePermission,
    startDictation,
    stopDictation,
    clearReview,
    dispose() {
      disposed = true;
      stopDictation('city-panel-dispose');
      state = { ...state, finalTranscript: '', interimTranscript: '', transcript: '', reviewReady: false, microphoneTrackActive: false };
      listeners.clear();
    }
  });
}

/**
 * Requests browser speech for one visible EONBOT guide caption.
 * This is intentionally separate from microphone dictation and does not imply a
 * live AI voice model, text transfer, background audio, or a provider call.
 */
export function speakEonCityCaption({ environment = globalThis, text = '', locale = 'auto', explicitUserAction = false } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, error: 'explicit-user-action-required', captionPersisted: false, providerRequestCreated: false });
  const view = windowLike(environment);
  const synthesis = view?.speechSynthesis;
  const Utterance = view?.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
  const caption = cleanText(text, 360);
  if (!caption) return freeze({ ok: false, error: 'empty-caption', captionPersisted: false, providerRequestCreated: false });
  if (!synthesis || typeof synthesis.speak !== 'function' || typeof Utterance !== 'function') return freeze({ ok: false, error: 'browser-caption-speech-unavailable', captionPersisted: false, providerRequestCreated: false });
  const selectedLocale = normalizeVoiceLanguagePreference(locale);
  try {
    synthesis.cancel?.();
    const utterance = new Utterance(caption);
    if (selectedLocale !== 'auto') utterance.lang = selectedLocale;
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    synthesis.speak(utterance);
    return freeze({ ok: true, status: 'browser-caption-speech-requested', locale: selectedLocale, captionChars: caption.length, browserSpeech: true, captionPersisted: false, providerRequestCreated: false, liveConversation: false });
  } catch (error) {
    return freeze({ ok: false, error: readableError(error), captionPersisted: false, providerRequestCreated: false });
  }
}

/** Stops an already user-requested browser caption speech session. */
export function stopEonCityCaption({ environment = globalThis, explicitUserAction = false } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, error: 'explicit-user-action-required', providerRequestCreated: false });
  const synthesis = windowLike(environment)?.speechSynthesis;
  if (!synthesis || typeof synthesis.cancel !== 'function') return freeze({ ok: false, error: 'browser-caption-speech-unavailable', providerRequestCreated: false });
  try {
    synthesis.cancel();
    return freeze({ ok: true, status: 'browser-caption-speech-stopped', providerRequestCreated: false });
  } catch (error) {
    return freeze({ ok: false, error: readableError(error), providerRequestCreated: false });
  }
}

export function getEonCityVoiceConsentTruth() {
  return freeze({
    schema: EON_CITY_VOICE_CONSENT_SCHEMA,
    captionsFirst: true,
    microphoneStartsOnBoot: false,
    explicitMicrophoneActionRequired: true,
    explicitDictationActionRequired: true,
    continuousListening: false,
    backgroundListening: false,
    audioPersisted: false,
    transcriptPersisted: false,
    automaticChatSend: false,
    automaticRoute: false,
    automaticToolExecution: false,
    providerRequestCreated: false,
    browserCaptionSpeechRequiresUserAction: true,
    browserCaptionSpeechPersisted: false,
    browserCaptionSpeechIsLiveConversation: false,
    localSpeechModelClaimed: false,
    physicalDeviceProven: false,
    languageDeviceProven: false,
    liveVoiceProof: false
  });
}

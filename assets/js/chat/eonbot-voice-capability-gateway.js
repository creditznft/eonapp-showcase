/**
 * W623F — EONBOT browser voice capability gateway.
 *
 * Dictation and spoken Guide replies are useful even before a model is
 * connected. This gateway therefore separates browser speech capability from
 * AI capability. It never opens a microphone, calls an AI provider, or stores
 * audio. Browser recognition is labelled browser-assisted because some
 * browsers may process recognition outside the device.
 */
import { resolveEonVoiceFallbackPlan } from './eon-voice-fallback-strategy.js';

export const EONBOT_VOICE_CAPABILITY_GATEWAY_VERSION = 'eonbot-voice-capability-gateway:w659g.v4';

const freeze = (value) => Object.freeze(value);

function normalizedMode(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return id === 'local' || id === 'connected' ? id : 'guide';
}

function routeLabel(value = '') {
  const id = normalizedMode(value);
  if (id === 'local') return 'Local AI + browser voice';
  if (id === 'connected') return 'Connected AI + browser voice';
  return 'Guide + browser voice';
}

/**
 * Produces a display-safe capability receipt. A voice-ready result means the
 * browser-assisted route is available on this device. It does not prove an
 * offline local STT/TTS model is installed.
 */
export function buildEonbotVoiceCapabilityGateway(options = {}) {
  const activeMode = normalizedMode(options.activeMode);
  const recognitionSupported = options.recognitionSupported === true;
  const synthesisSupported = options.synthesisSupported === true;
  const microphoneCaptureSupported = options.microphoneCaptureSupported === true;
  const browserSpeechAllowed = options.browserSpeechAllowed !== false;
  const activeAi = activeMode !== 'guide';
  const localCompanionReady = options.localCompanionReady === true;
  const liveVoiceReady = options.liveVoiceReady === true;
  const liveVoiceReason = String(options.liveVoiceReason || '').trim();
  const fallbackPlan = resolveEonVoiceFallbackPlan({
    targetLocale: options.targetLocale || 'en-US',
    recognitionSupported: browserSpeechAllowed && recognitionSupported,
    synthesisSupported: browserSpeechAllowed && synthesisSupported,
    microphoneCaptureSupported,
    voices: options.voices || [],
    localCompanionReady,
    localCompanionAirplaneModeProven: options.localCompanionAirplaneModeProven === true
  });
  const dictationReady = localCompanionReady || (browserSpeechAllowed && recognitionSupported && microphoneCaptureSupported);
  const voiceReady = localCompanionReady || (dictationReady && synthesisSupported);

  let mode = 'blocked';
  let reason = !browserSpeechAllowed
    ? 'Browser speech is disabled on this surface. Keep typing.'
    : !recognitionSupported
      ? 'This browser does not expose speech recognition. Keep typing, use your keyboard or operating-system dictation, or try a supported full browser.'
      : !microphoneCaptureSupported
        ? 'This browser cannot request microphone access here. Keep typing or use operating-system dictation in the text field.'
        : 'Browser voice is unavailable on this device.';

  if (dictationReady && !voiceReady) {
    mode = 'dictation-ready';
    reason = activeAi
      ? 'Dictation is ready. Spoken replies need browser speech output on this device.'
      : 'Dictation is ready for Guide Mode. Spoken Guide replies need browser speech output on this device.';
  } else if (voiceReady) {
    mode = 'voice-ready';
    reason = activeAi
      ? 'Dictate and Voice Conversation are ready for the active AI route.'
      : 'Dictate and Voice Conversation are ready for built-in Guide replies. Model-powered work still needs Local or Connected AI.';
  }

  const privacyNote = activeMode === 'local'
    ? 'Your text model route is Local. Browser speech is separate and may use your browser or operating-system recognition service.'
    : activeMode === 'connected'
      ? 'Your text model route is Connected. Browser speech is separate and may use your browser or operating-system recognition service.'
      : 'Guide replies are built in. Browser speech may still use your browser or operating-system recognition service.';

  return freeze({
    version: EONBOT_VOICE_CAPABILITY_GATEWAY_VERSION,
    activeMode,
    activeAi,
    mode,
    routeLabel: routeLabel(activeMode),
    dictationReady,
    voiceReady,
    liveVoiceReady,
    liveVoiceReason: liveVoiceReady ? 'Audio-native Live Voice is ready.' : (liveVoiceReason || 'Audio-native Live Voice is not configured.'),
    modes: freeze({
      dictate: freeze({ id: 'dictate', ready: dictationReady, editableBeforeSend: true }),
      conversation: freeze({ id: 'conversation', ready: voiceReady, speechToTextLoop: true, beta: true, autoSendFinalTurns: true, perSessionReviewRequired: true }),
      live: freeze({ id: 'live', ready: liveVoiceReady, audioNative: true })
    }),
    showDictate: browserSpeechAllowed,
    showUseVoice: browserSpeechAllowed,
    showLiveVoice: true,
    showLanguageChoice: false,
    languageSettingsPath: '/profile#profile-voice-language',
    showVoiceOutputToggle: synthesisSupported,
    browserAssisted: browserSpeechAllowed,
    guideRepliesAvailable: activeMode === 'guide',
    modelPoweredRepliesAvailable: activeAi,
    noAutomaticMicrophone: true,
    noBackgroundListening: true,
    noAudioPersistence: true,
    noSilentAiFallback: true,
    noEonappSpeechApiKey: true,
    fallbackPlan,
    privacyNote,
    reason,
    dictateTooltip: 'Dictate — turn speech into editable text.',
    useVoiceTooltip: 'Voice Conversation (Beta) — review automatic sending and continuous listening before the microphone starts.',
    liveVoiceTooltip: liveVoiceReady
      ? 'Live Voice — start an audio-native realtime conversation.'
      : (liveVoiceReason || 'Live Voice is not configured on this device.'),
    stopVoiceTooltip: 'Stop voice — end microphone and spoken output now.',
    limitations: freeze([
      'Dictate, Voice Conversation, and Live Voice are separate modes and are never presented as equivalent.',
      'Browser speech support varies by browser, language and device.',
      'Browser recognition may use a browser or operating-system service and is not proof of offline local speech.',
      'Guide Mode can answer product questions and route work, but model-powered generation still needs Local or Connected AI.',
      'When browser recognition is missing, operating-system dictation can still fill the editable text field but remains user-controlled outside EONAPP.',
      'When browser speech output is missing, the visible reply remains available for device Read Aloud or accessibility tools.',
      'Dictate never sends by itself. Voice Conversation can auto-send final spoken turns only after an explicit per-session Beta review.',
      'No voice control starts recording or posts anything without a user action.'
    ])
  });
}

export default freeze({ EONBOT_VOICE_CAPABILITY_GATEWAY_VERSION, buildEonbotVoiceCapabilityGateway });

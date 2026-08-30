/**
 * W623G — no-key voice reach strategy.
 *
 * A web page cannot manufacture universal speech recognition or voices. This
 * strategy ranks the honest paths available on a device without introducing an
 * EONAPP cloud speech proxy or requiring a user API key.
 */
export const EON_VOICE_FALLBACK_SCHEMA = 'eonapp.voice-fallback.w623g.v1';

const freeze = (value) => Object.freeze(value);

function locale(value = 'en-US') {
  return String(value || 'en-US').trim().replace('_', '-') || 'en-US';
}

function languageBase(value = '') {
  return locale(value).toLowerCase().split('-')[0] || 'en';
}

function voiceMatch(targetLocale = 'en-US', voices = []) {
  const target = locale(targetLocale).toLowerCase();
  const base = languageBase(target);
  const list = Array.isArray(voices) ? voices : [];
  const exact = list.find((voice) => String(voice?.lang || '').toLowerCase().replace('_', '-') === target);
  if (exact) return freeze({ level: 'exact', voice: exact, usable: true });
  const sameLanguage = list.find((voice) => languageBase(voice?.lang || '') === base);
  if (sameLanguage) return freeze({ level: 'same-language', voice: sameLanguage, usable: true });
  const browserDefault = list.find((voice) => voice?.default === true) || null;
  return freeze({ level: browserDefault ? 'device-default' : 'none', voice: browserDefault, usable: Boolean(browserDefault) });
}

export function resolveEonVoiceFallbackPlan(options = {}) {
  const targetLocale = locale(options.targetLocale || 'en-US');
  const recognitionSupported = options.recognitionSupported === true;
  const synthesisSupported = options.synthesisSupported === true;
  const microphoneCaptureSupported = options.microphoneCaptureSupported === true;
  const localCompanionReady = options.localCompanionReady === true;
  const voices = Array.isArray(options.voices) ? options.voices : [];
  const match = voiceMatch(targetLocale, voices);

  const input = localCompanionReady
    ? freeze({ mode: 'local-companion-stt', noApiKey: true, offlineClaimAllowed: options.localCompanionAirplaneModeProven === true })
    : recognitionSupported && microphoneCaptureSupported
      ? freeze({ mode: 'browser-assisted-dictation', noApiKey: true, offlineClaimAllowed: false })
      : freeze({ mode: 'typed-or-os-dictation', noApiKey: true, offlineClaimAllowed: false });

  let output;
  if (localCompanionReady) {
    output = freeze({ mode: 'local-companion-tts', noApiKey: true, languageMatch: 'companion-reported', offlineClaimAllowed: options.localCompanionAirplaneModeProven === true });
  } else if (synthesisSupported && (match.level === 'exact' || match.level === 'same-language')) {
    output = freeze({ mode: 'browser-speech-synthesis', noApiKey: true, languageMatch: match.level, offlineClaimAllowed: false });
  } else if (synthesisSupported) {
    output = freeze({ mode: 'device-default-best-effort', noApiKey: true, languageMatch: match.level, offlineClaimAllowed: false });
  } else {
    output = freeze({ mode: 'visible-text-and-device-read-aloud', noApiKey: true, languageMatch: 'none', offlineClaimAllowed: false });
  }

  const nearUniversalReach = input.mode !== 'browser-assisted-dictation' || output.mode !== 'browser-speech-synthesis'
    ? 'fallback-available-not-equivalent'
    : 'native-browser-path';

  return freeze({
    schema: EON_VOICE_FALLBACK_SCHEMA,
    targetLocale,
    input,
    output,
    nearUniversalReach,
    noEonappApiKey: true,
    noCloudSpeechProxy: true,
    typedChatAlwaysAvailable: true,
    typedChatAvailable: true,
    disclosure: 'Browser and operating-system speech support varies. OS dictation and device Read Aloud are user-controlled fallbacks, not EONAPP speech engines. Fully local speech requires a separately installed and airplane-mode-proven companion.',
    nextBestActions: freeze([
      input.mode === 'typed-or-os-dictation' ? 'Use the keyboard microphone or operating-system dictation, then review the editable text.' : 'Use EONAPP Dictate and review the editable transcript before sending.',
      output.mode === 'visible-text-and-device-read-aloud' ? 'Use the browser or operating-system Read Aloud/accessibility command for the visible reply.' : 'Use spoken replies and keep the visible transcript available.',
      'Install the optional local speech companion only after its language pack, privacy boundary and airplane-mode proof are available.'
    ])
  });
}

export function getEonVoiceFallbackTruth() {
  return freeze({
    schema: EON_VOICE_FALLBACK_SCHEMA,
    universalBrowserRecognition: false,
    universalBrowserSynthesis: false,
    noKeyBrowserBaseline: true,
    osDictationFallback: true,
    deviceReadAloudFallback: true,
    localCompanionPlanned: true,
    eonappCloudSpeechProxy: false,
    offlineSpeechClaimActive: false
  });
}

export default freeze({ EON_VOICE_FALLBACK_SCHEMA, resolveEonVoiceFallbackPlan, getEonVoiceFallbackTruth });

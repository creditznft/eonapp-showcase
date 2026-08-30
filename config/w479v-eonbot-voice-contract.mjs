/** W623F refresh of W479-V — Dictate-first and browser-assisted Use Voice boundary. */
export const W479V_EONBOT_VOICE_SCHEMA = 'eonapp.w479v.eonbot-voice.v2';

const freeze = (value) => Object.freeze(value);

export const W479V_REQUIRED_VOICE_STATES = freeze(['blocked', 'dictation-ready', 'voice-ready']);

export const W479V_TRUTH = freeze({
  guideModeVoiceAvailableWhenBrowserSupportsIt: true,
  activeAiRequiredForBrowserVoice: false,
  guideRepliesRemainDeterministic: true,
  dictateCreatesEditableTextFirst: true,
  dictateAutoSend: false,
  useVoiceExplicitUserAction: true,
  useVoiceStopsImmediately: true,
  browserSpeechLabelled: true,
  languageSettingsHiddenFromMainChat: true,
  audioPersistence: false,
  backgroundListening: false,
  silentCloudAiFallback: false,
  localOfflineVoiceClaim: false,
  deviceProofRequired: true
});

export function validateW479VEonbotVoiceContract(contract = W479V_TRUTH) {
  const errors = [];
  const mustBeTrue = [
    'guideModeVoiceAvailableWhenBrowserSupportsIt',
    'guideRepliesRemainDeterministic',
    'dictateCreatesEditableTextFirst',
    'useVoiceExplicitUserAction',
    'useVoiceStopsImmediately',
    'browserSpeechLabelled',
    'languageSettingsHiddenFromMainChat',
    'deviceProofRequired'
  ];
  const mustBeFalse = [
    'activeAiRequiredForBrowserVoice',
    'dictateAutoSend',
    'audioPersistence',
    'backgroundListening',
    'silentCloudAiFallback',
    'localOfflineVoiceClaim'
  ];
  if (mustBeTrue.some((key) => contract[key] !== true) || mustBeFalse.some((key) => contract[key] !== false)) {
    errors.push('W479-V voice truth values are invalid.');
  }
  if (new Set(W479V_REQUIRED_VOICE_STATES).size !== W479V_REQUIRED_VOICE_STATES.length || !W479V_REQUIRED_VOICE_STATES.includes('voice-ready')) {
    errors.push('W479-V required voice states are invalid.');
  }
  return freeze(errors);
}

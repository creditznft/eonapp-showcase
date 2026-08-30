import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_CODES, EON_LANGUAGE_MATRIX_VERSION, EON_VOICE_LANGUAGE_VALUES } from '../assets/js/utils/language-matrix.js';

/** W394B contract: explicit browser speech language selection with local-only preference metadata. */
export const W394B_MULTILINGUAL_VOICE_CONTRACT = Object.freeze({
  wave: 'W394B',
  languageMatrixVersion: EON_LANGUAGE_MATRIX_VERSION,
  defaults: Object.freeze({ speechLanguage: 'auto', microphoneRequiresUserTap: true, transcriptStorage: 'message-text-only' }),
  supported: EON_VOICE_LANGUAGE_VALUES,
  chatGuideLanguages: EON_CHAT_GUIDE_LANGUAGE_CODES,
  publishedFullProductLanguages: EON_FULL_PRODUCT_LANGUAGE_CODES,
  persistence: Object.freeze({ localPreferenceOnly: true, audioStored: false, separateTranscriptStore: false }),
  boundaries: Object.freeze({ remoteTransport: false, browserSpeechOnly: true, languageFallbackMustRespectManualChoice: true, speechDoesNotPublishInterface: true })
});

export function validateW394BMultilingualVoiceContract(contract = W394B_MULTILINGUAL_VOICE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W394B') errors.push('W394B wave identifier is invalid.');
  if (contract?.defaults?.speechLanguage !== 'auto' || contract?.defaults?.microphoneRequiresUserTap !== true || contract?.defaults?.transcriptStorage !== 'message-text-only') errors.push('W394B default voice boundaries are invalid.');
  if (!Array.isArray(contract?.supported) || JSON.stringify(contract.supported) !== JSON.stringify(EON_VOICE_LANGUAGE_VALUES) || !contract.supported.includes('zh-CN') || contract.supported.includes('bn-BD') || contract.supported.includes('id-ID')) errors.push('W394B supported speech language set is invalid.');
  if (JSON.stringify(contract?.chatGuideLanguages) !== JSON.stringify(EON_CHAT_GUIDE_LANGUAGE_CODES) || contract.chatGuideLanguages.length !== 11) errors.push('W394B Chat/Guide language matrix is invalid.');
  if (JSON.stringify(contract?.publishedFullProductLanguages) !== JSON.stringify(EON_FULL_PRODUCT_LANGUAGE_CODES) || contract.publishedFullProductLanguages.length !== 1) errors.push('W394B published interface language truth is invalid.');
  if (contract?.persistence?.localPreferenceOnly !== true || contract?.persistence?.audioStored !== false || contract?.persistence?.separateTranscriptStore !== false) errors.push('W394B privacy persistence boundaries are invalid.');
  if (contract?.boundaries?.remoteTransport !== false || contract?.boundaries?.browserSpeechOnly !== true || contract?.boundaries?.languageFallbackMustRespectManualChoice !== true || contract?.boundaries?.speechDoesNotPublishInterface !== true) errors.push('W394B speech boundaries are invalid.');
  return Object.freeze(errors);
}

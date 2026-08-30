import {
  EON_CHAT_GUIDE_LANGUAGE_CODES,
  EON_DEFERRED_VOICE_ONLY_LANGUAGE_CODES,
  EON_FULL_PRODUCT_LANGUAGE_CODES,
  EON_LANGUAGE_MATRIX_VERSION,
  EON_VOICE_LANGUAGE_VALUES
} from '../assets/js/utils/language-matrix.js';

export const W394C_LANGUAGE_MATRIX_CONTRACT = Object.freeze({
  wave: 'W394C',
  schema: 'eonapp.w394c.language-matrix-contract.v2',
  matrixVersion: EON_LANGUAGE_MATRIX_VERSION,
  publishedFullProductLanguages: EON_FULL_PRODUCT_LANGUAGE_CODES,
  chatGuideLanguages: EON_CHAT_GUIDE_LANGUAGE_CODES,
  voiceValues: EON_VOICE_LANGUAGE_VALUES,
  deferredVoiceOnlyLanguages: EON_DEFERRED_VOICE_ONLY_LANGUAGE_CODES,
  behavior: Object.freeze({ autoDefault: true, manualChoiceNeverOverwritten: true, unsupportedBrowserShowsDisabledControls: true, guideUsesResolvedChatLanguage: true, interfacePublicationRequiresCertification: true }),
  boundaries: Object.freeze({ browserSpeechOnly: true, audioStored: false, remoteSpeechTransport: false, syncActivation: false, chatCapabilityDoesNotPublishInterface: true })
});

export function validateW394CLanguageMatrixContract(contract = W394C_LANGUAGE_MATRIX_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W394C' || contract?.schema !== 'eonapp.w394c.language-matrix-contract.v2') errors.push('W394C identity is invalid.');
  if (JSON.stringify(contract?.publishedFullProductLanguages) !== JSON.stringify(EON_FULL_PRODUCT_LANGUAGE_CODES) || contract.publishedFullProductLanguages.length !== 1 || contract.publishedFullProductLanguages[0] !== 'en') errors.push('W394C published interface language truth is invalid.');
  if (JSON.stringify(contract?.chatGuideLanguages) !== JSON.stringify(EON_CHAT_GUIDE_LANGUAGE_CODES) || contract.chatGuideLanguages.length !== 11) errors.push('W394C Chat/Guide language matrix is invalid.');
  if (!Array.isArray(contract?.voiceValues) || JSON.stringify(contract.voiceValues) !== JSON.stringify(EON_VOICE_LANGUAGE_VALUES) || !contract.voiceValues.includes('zh-CN')) errors.push('W394C voice values do not match the matrix.');
  if (!Array.isArray(contract?.deferredVoiceOnlyLanguages) || !contract.deferredVoiceOnlyLanguages.includes('bn') || !contract.deferredVoiceOnlyLanguages.includes('id')) errors.push('W394C deferred voice-only languages are not explicit.');
  if (contract?.behavior?.autoDefault !== true || contract?.behavior?.manualChoiceNeverOverwritten !== true || contract?.behavior?.unsupportedBrowserShowsDisabledControls !== true || contract?.behavior?.guideUsesResolvedChatLanguage !== true || contract?.behavior?.interfacePublicationRequiresCertification !== true) errors.push('W394C UX behavior boundaries are invalid.');
  if (contract?.boundaries?.browserSpeechOnly !== true || contract?.boundaries?.audioStored !== false || contract?.boundaries?.remoteSpeechTransport !== false || contract?.boundaries?.syncActivation !== false || contract?.boundaries?.chatCapabilityDoesNotPublishInterface !== true) errors.push('W394C privacy/publication boundaries are invalid.');
  return Object.freeze(errors);
}

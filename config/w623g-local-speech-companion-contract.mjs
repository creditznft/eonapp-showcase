/** W623G — design-only local speech companion contract. */
export const W623G_LOCAL_SPEECH_COMPANION_SCHEMA = 'eonapp.local-speech-companion.w623g.v1';
export const W623G_LOCAL_SPEECH_COMPANION_ACTIVE = false;

export const W623G_LOCAL_SPEECH_COMPANION_CONTRACT = Object.freeze({
  schema: W623G_LOCAL_SPEECH_COMPANION_SCHEMA,
  active: W623G_LOCAL_SPEECH_COMPANION_ACTIVE,
  transport: 'authenticated-loopback-only',
  allowedOrigins: Object.freeze(['http://127.0.0.1', 'http://localhost', 'https://eonapp.ch']),
  authentication: Object.freeze({ mode: 'paired-short-lived-origin-token', queryStringToken: false, localStorageSecret: false }),
  endpoints: Object.freeze([
    Object.freeze({ path: '/v1/status', method: 'GET', purpose: 'Report installed STT/TTS engines, language packs and device budget.' }),
    Object.freeze({ path: '/v1/stt', method: 'POST', purpose: 'Transcribe explicitly captured ephemeral audio after visible user action.' }),
    Object.freeze({ path: '/v1/tts', method: 'POST', purpose: 'Render or stream speech for explicitly supplied text after visible user action.' }),
    Object.freeze({ path: '/v1/cancel', method: 'POST', purpose: 'Cancel active local speech work and release audio/device resources.' })
  ]),
  privacy: Object.freeze({ rawAudioStoredByDefault: false, transcriptCloudUpload: false, promptCloudUpload: false, telemetryContainsContent: false }),
  safety: Object.freeze({ backgroundListening: false, wakeWord: false, autoSendTranscript: false, explicitMicrophoneAction: true, cancelRequired: true }),
  proofRequired: Object.freeze(['signed-binary-provenance', 'origin-authentication', 'airplane-mode-stt', 'airplane-mode-tts', 'language-pack-licence', 'uninstall-cleanup', 'low-memory-failure-recovery']),
  sourceOnlyBoundary: 'This contract does not install a model, open a port, capture audio or prove offline speech.'
});

export function validateW623gLocalSpeechCompanionContract() {
  const errors = [];
  const contract = W623G_LOCAL_SPEECH_COMPANION_CONTRACT;
  if (contract.active !== false || W623G_LOCAL_SPEECH_COMPANION_ACTIVE !== false) errors.push('Local speech companion must remain inactive until real binary and airplane-mode proof exist.');
  if (contract.transport !== 'authenticated-loopback-only') errors.push('Local speech transport must remain authenticated loopback only.');
  if (contract.authentication.queryStringToken || contract.authentication.localStorageSecret) errors.push('Pairing secrets cannot use query strings or ordinary LocalStorage.');
  if (contract.privacy.rawAudioStoredByDefault || contract.privacy.transcriptCloudUpload || contract.privacy.promptCloudUpload) errors.push('Local speech contract violates the privacy boundary.');
  if (!contract.proofRequired.includes('airplane-mode-stt') || !contract.proofRequired.includes('airplane-mode-tts')) errors.push('Airplane-mode STT and TTS proof are mandatory.');
  if (contract.safety.backgroundListening || contract.safety.wakeWord || contract.safety.autoSendTranscript) errors.push('Background listening, wake words and automatic transcript sending are prohibited.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: W623G_LOCAL_SPEECH_COMPANION_SCHEMA, checks: 12 });
}

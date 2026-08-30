/** Institutional Music capability routing. No provider call is made here. */
import { detectLocalAiCapabilityProfile } from '../../utils/local-ai-capability-matrix.js';

export const EON_MUSIC_CAPABILITY_SCHEMA = 'eonapp.creator.music-capability.v2';
export const EON_MUSIC_MODES = Object.freeze(['pattern', 'generative-track', 'auto-dj', 'radio']);

export function buildEonMusicCapabilityPlan(options = {}) {
  const profile = options.profile || detectLocalAiCapabilityProfile(options.deviceContext || {});
  const aceStepDetected = options.aceStepDetected === true;
  const hostedMusicVerified = options.hostedMusicVerified === true;
  const hostedMusicSourceReady = options.hostedMusicSourceReady !== false;
  return Object.freeze({
    schema: EON_MUSIC_CAPABILITY_SCHEMA,
    device: Object.freeze({ computeClass: profile.computeClass, label: profile.label, summary: profile.summary }),
    modes: Object.freeze({
      pattern: Object.freeze({ state: 'available-browser', engine: 'web-audio-sequencer', modelGenerated: false, externalEffect: false }),
      generativeTrack: Object.freeze({
        state: aceStepDetected ? 'local-acestep-discovered-proof-pending' : hostedMusicVerified ? 'hosted-byok-verified' : hostedMusicSourceReady ? 'hosted-byok-source-ready-proof-pending' : 'setup-required',
        localCandidate: aceStepDetected,
        localEngine: aceStepDetected ? 'acestep-v1.5-loopback' : '',
        hostedCandidate: hostedMusicSourceReady,
        certified: false,
        reason: aceStepDetected
          ? 'A user-started ACE-Step loopback runtime exposed loaded models. Each generation remains explicit and live launch certification still requires a real saved/reopened artifact plus runtime/browser proof.'
          : hostedMusicVerified
            ? 'A user-verified hosted music adapter may be used after explicit run approval and cost disclosure.'
            : hostedMusicSourceReady
              ? 'A reviewed hosted Direct BYOK Music v2 rail is source-integrated through the paired local Creator Companion. Real provider output certification is still pending.'
              : 'Use the browser pattern engine now or explicitly connect a separately verified local/hosted music adapter.'
      }),
      autoDj: Object.freeze({ state: 'metadata-plan-and-local-crossfade-preview', crossfadePreview: true, metadataSequencingOnly: true, audioRenderCertified: false, beatMatchingCertified: false, tempoStretchCertified: false, stemSeparationCertified: false, userOwnedOrEonGeneratedAudioOnly: true }),
      radio: Object.freeze({ state: 'local-session-radio-available', commercialCatalogueAccess: false, memoryConsentRequired: true, generatedTrackQueueSupported: true })
    }),
    boundaries: Object.freeze([
      'Pattern generation is deterministic browser synthesis and must not be described as model-generated audio.',
      'ACE-Step discovery and text-to-music execution are explicit loopback actions; source integration does not equal external runtime certification.',
      'EONAPP does not start ACE-Step, initialize or download models, train adapters, upload reference/source audio, or silently fall back to cloud.',
      'Hosted Music uses the paired local Creator Companion and OS credential vault. The first hosted rail supports prompt-to-music only; no upload, inpainting, automatic retry or EONAPP server proxy is enabled.',
      'Generative music requires a concrete adapter result plus explicit save and byte-for-byte reopened-artifact verification before it can advance a verified Creator mission.',
      'Auto DJ and Radio may use only user-authorized/imported audio and EON-generated tracks.',
      'No model download, provider spend, publishing or commercial-catalogue access happens from this capability plan.'
    ])
  });
}

export function getEonMusicCapabilityTruth() {
  return Object.freeze({
    schema: EON_MUSIC_CAPABILITY_SCHEMA,
    browserPatternEngine: true,
    generativeMusicAdapterArchitecture: true,
    aceStepLocalAdapterSourceIntegrated: true,
    aceStepExternalRuntimeProof: false,
    hostedDirectByokMusicSourceIntegrated: true,
    hostedDirectByokMusicProvider: 'elevenlabs-music-v2',
    hostedDirectByokRealProviderProof: false,
    comfyUiMusicWorkflowCertified: false,
    generativeMusicCertified: false,
    autoDjPlanning: true,
    autoDjCrossfadePreview: true,
    autoDjBeatMatchingCertified: false,
    autoDjRenderCertified: false,
    personalRadioPlanning: true,
    personalRadioSessionPlayback: true,
    personalRadioContinuousOpenPagePlayback: true,
    personalRadioBackgroundStreaming: false,
    commercialStreamingCatalogue: false
  });
}

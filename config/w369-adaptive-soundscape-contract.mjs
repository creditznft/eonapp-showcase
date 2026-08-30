/** W369 — EON City adaptive soundscape contract. */
export const W369_ADAPTIVE_SOUNDSCAPE_CONTRACT = Object.freeze({
  wave: 'W369',
  schema: 'eonapp.w369.adaptive-soundscape-contract.v1',
  routeScope: Object.freeze(['/eoncity/play', '/eoncity/tour']),
  defaults: Object.freeze({ music: false, ambience: false, ui: false, voice: false, reducedSensory: false }),
  truthRules: Object.freeze({
    localOnly: true,
    remoteAudio: false,
    remoteTelemetry: false,
    microphone: false,
    automaticAudio: false,
    originalMusicPackageShipped: false,
    automaticVoice: false,
    captionsFirst: true,
    gestureRequired: true,
    cleanupRequired: true
  }),
  evidence: Object.freeze({
    sourceGateIsNotListeningProof: true,
    requiresLaterBrowserProof: true,
    requiresLaterDeviceAudioProof: true,
    requiresLaterAccessibilityReview: true
  })
});

export function validateW369AdaptiveSoundscapeContract() {
  const errors = [];
  const rules = W369_ADAPTIVE_SOUNDSCAPE_CONTRACT.truthRules;
  if (!rules.localOnly || rules.remoteAudio || rules.remoteTelemetry || rules.microphone || rules.automaticAudio) errors.push('W369 must remain local and never begin automatic or remote audio.');
  if (rules.originalMusicPackageShipped || rules.automaticVoice || !rules.captionsFirst || !rules.gestureRequired || !rules.cleanupRequired) errors.push('W369 sound/voice disclosure or lifecycle rules are incomplete.');
  return errors;
}

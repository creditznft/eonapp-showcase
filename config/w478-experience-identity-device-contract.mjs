/**
 * W478 — accessibility, identity and real-device evidence aggregation.
 *
 * This contract deliberately separates source readiness from human/device proof.
 * It is not a release approval and it must remain NO_GO until the listed
 * independent observations are attached outside source control.
 */
export const W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA = 'eonapp.w478.experience-identity-device.v1';

export const W478_SOURCE_LANES = Object.freeze([
  Object.freeze({ id: 'accessibility-i18n', label: 'Accessibility and language source wiring', command: 'qa:w271-accessibility-i18n', sourceOnly: true }),
  Object.freeze({ id: 'voice-permission', label: 'EONBOT language and voice permission boundary', command: 'qa:w287-eonbot-language-voice', sourceOnly: true }),
  Object.freeze({ id: 'identity-account', label: 'Minimal account lifecycle source boundary', command: 'qa:w373-identity-account-operations', sourceOnly: true }),
  Object.freeze({ id: 'google-oauth-optional', label: 'Optional Google OAuth Pages Functions boundary', command: 'qa:w374-google-oauth-pages-functions', sourceOnly: true }),
  Object.freeze({ id: 'device-proof-kit', label: 'Local-only device evidence kit', command: 'qa:w345-local-device-proof-kit', sourceOnly: true }),
  Object.freeze({ id: 'update-recovery', label: 'Update-safe local data survival', command: 'qa:w145-update-safe-user-data-survival', sourceOnly: true }),
  Object.freeze({ id: 'legacy-transport-quarantine', label: 'Legacy transport and device-control paths remain physically quarantined', command: 'qa:w519-legacy-transport-quarantine', sourceOnly: true })
]);

export const W478_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'desktop-keyboard-screenreader', owner: 'independent accessibility reviewer', evidence: 'Keyboard-only journey, focus return, NVDA or VoiceOver, zoom/reflow, reduced motion and forced-colors across canonical desktop routes.' }),
  Object.freeze({ id: 'locale-rtl-human-review', owner: 'content owner and locale reviewer', evidence: 'Human review of all supported language copy, fallback language and RTL layout; machine output alone is insufficient.' }),
  Object.freeze({ id: 'voice-microphone-device-review', owner: 'device reviewer', evidence: 'Voice remains off by default; microphone permission only follows a deliberate user action; denial and typed fallback are understandable.' }),
  Object.freeze({ id: 'identity-preview-proof', owner: 'release owner', evidence: 'Only if Google OAuth is configured: reviewed preview sign-in, cancel, error, session, logout, account-deletion request and callback allowlist proof.' }),
  Object.freeze({ id: 'android-ios-pwa-matrix', owner: 'device reviewer', evidence: 'Android and iOS portrait/landscape, safe-area, touch targets, virtual keyboard, install prompts, offline/slow-network and orientation proof.' }),
  Object.freeze({ id: 'pwa-update-rollback-recovery', owner: 'release owner', evidence: 'Disposable test data survives install/update/rollback and explicit encrypted backup/restore; cache recovery is understandable.' }),
  Object.freeze({ id: 'legacy-transport-quarantine-review', owner: 'independent source reviewer', evidence: 'Independent review confirms the W519 inventory, active-import fence, Function removal and built-output denylist keep retired transport/control families unreachable.' })
]);

export const W478_RELEASE_DECISION = 'NO_GO_PENDING_EXTERNAL_EVIDENCE';

export function validateW478ExperienceIdentityDeviceBoard(board = {}) {
  const errors = [];
  if (board.schema !== W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA) errors.push('W478 board schema must match.');
  if (board.scope !== 'source-readiness-plus-external-evidence-plan') errors.push('W478 board must keep the source/external-evidence split.');
  if (board.releaseDecision !== W478_RELEASE_DECISION) errors.push('W478 board must remain NO_GO pending external evidence.');
  if (!Array.isArray(board.sourceLanes) || board.sourceLanes.length !== W478_SOURCE_LANES.length) errors.push('W478 board must list each source lane.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W478_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W478 board must list every external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 5) errors.push('W478 board must include a clear claim fence.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function getW478Truth() {
  return Object.freeze({
    schema: W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA,
    sourceReadinessOnly: true,
    accessibilityCertified: false,
    localeHumanReviewed: false,
    microphoneAutomaticallyStarted: false,
    googleOAuthLiveVerified: false,
    androidIosPwaVerified: false,
    updateRollbackVerified: false,
    legacyTransportQuarantineIndependentlyReviewed: false,
    releaseDecision: W478_RELEASE_DECISION
  });
}

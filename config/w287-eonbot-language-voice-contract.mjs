/** W287-A0 — source-only EONBOT language/voice/personalization accessibility contract. */
export const W287_EONBOT_LANGUAGE_VOICE_SCHEMA = 'eonapp.w287.eonbot-language-voice-source-readiness.v1';

export const W287_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'voice-permission-device-review', status: 'pending-independent-review', owner: 'device/accessibility reviewer', evidence: 'Keyboard, touch, screen-reader, permission-denial, muted-system and browser/WebView voice walkthroughs on real devices.' }),
  Object.freeze({ id: 'language-fallback-review', status: 'pending-content-accessibility-review', owner: 'language/accessibility reviewer', evidence: 'Human review of reply-language, RTL, typed fallback and localization behavior for all publicly selectable locales.' }),
  Object.freeze({ id: 'preference-deletion-review', status: 'pending-privacy-review', owner: 'privacy owner', evidence: 'Observed local preference reset/backup/restore behavior and truthful disclosure review.' })
]);

export function validateW287EonbotLanguageVoiceBoard(board = {}) {
  const errors = [];
  if (board.schema !== W287_EONBOT_LANGUAGE_VOICE_SCHEMA) errors.push('W287 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W287 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W287 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W287_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W287 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W287 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}

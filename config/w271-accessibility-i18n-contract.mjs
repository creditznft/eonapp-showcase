/** W271-A0 — source-only accessibility and language readiness contract. */
export const W271_ACCESSIBILITY_I18N_SCHEMA = 'eonapp.w271.accessibility-i18n-source-readiness.v1';

export const W271_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'keyboard-desktop', status: 'pending-independent-review', owner: 'release owner', evidence: 'Keyboard-only task pass on canonical desktop routes.' }),
  Object.freeze({ id: 'screen-reader', status: 'pending-independent-review', owner: 'accessibility reviewer', evidence: 'NVDA/VoiceOver reading, focus and live-region review.' }),
  Object.freeze({ id: 'locale-content', status: 'pending-content-owner', owner: 'content owner', evidence: 'Human review of supported locale copy, RTL flow and fallback language.' }),
  Object.freeze({ id: 'mobile-assistive-tech', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Android TalkBack and iOS VoiceOver task pass.' }),
  Object.freeze({ id: 'contrast-motion', status: 'pending-independent-review', owner: 'design reviewer', evidence: 'Contrast, zoom, reduced-motion and forced-colors review.' })
]);

export function validateW271AccessibilityI18nBoard(board = {}) {
  const errors = [];
  if (board.schema !== W271_ACCESSIBILITY_I18N_SCHEMA) errors.push('W271 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W271 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W271 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W271_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W271 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W271 board must retain a proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}

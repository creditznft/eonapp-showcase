/** W775A — reviewed, privacy-safe handoff from Expanse moments to Creator Capture. */
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,239}$/i;
const safeText = (value = '', max = 180) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 && character !== '<' && character !== '>' ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

export const EON_EXPANSE_W775A_CAPTURE_HANDOFF_SCHEMA = 'eon.expanse.capture-handoff.w775a.v1';

export function buildEonExpanseW775ACaptureHandoff(context = {}) {
  const momentId = String(context?.momentId || '');
  const source = String(context?.source || '');
  const label = safeText(context?.label || 'Signal Frontier moment', 100);
  if (context?.type !== 'expanse-capture-moment' || !SAFE_ID.test(momentId) || !SAFE_ID.test(source) || !label) {
    return freeze({ ok: false, reason: 'valid-expanse-capture-context-required' });
  }
  const shortCaption = safeText(`${label} — building the Infinite Frontier with EONAPP.`, 140);
  const detailedCaption = safeText(`A verified moment from EON Expanse: ${label}. Real progress changes the frontier, while every capture and share remains under the user's control.`, 220);
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W775A_CAPTURE_HANDOFF_SCHEMA,
    type: 'expanse-capture-handoff',
    momentId,
    source,
    label,
    captureOptions: freeze(['screenshot', 'short-clip', 'full-recording']),
    cleanHudRecommended: true,
    eonbotPoseAvailable: true,
    creatorFrameAvailable: true,
    suggestedCaptions: freeze({ short: shortCaption, detailed: detailedCaption }),
    qrOptional: true,
    referralLinkOptional: true,
    platformCopyOptional: true,
    privacyReviewRequired: true,
    localCaptureOnly: true,
    includesPrivateContent: false,
    publicPostingRequired: false,
    createsReferralLinkAutomatically: false,
    startsRecordingAutomatically: false,
    uploadsAutomatically: false,
    publishesAutomatically: false,
    mutatesProgression: false,
    awardsXp: false
  });
}

export function validateEonExpanseW775ACaptureHandoff(handoff = {}, { expectedMomentId = '' } = {}) {
  if (!handoff?.ok || handoff?.schema !== EON_EXPANSE_W775A_CAPTURE_HANDOFF_SCHEMA) return freeze({ ok: false, reason: 'capture-handoff-invalid' });
  if (expectedMomentId && String(expectedMomentId) !== String(handoff.momentId || '')) return freeze({ ok: false, reason: 'capture-moment-changed' });
  if (handoff.includesPrivateContent || handoff.publicPostingRequired || handoff.startsRecordingAutomatically || handoff.uploadsAutomatically || handoff.publishesAutomatically) return freeze({ ok: false, reason: 'capture-handoff-boundary-invalid' });
  return freeze({ ok: true, handoff });
}

export default freeze({ EON_EXPANSE_W775A_CAPTURE_HANDOFF_SCHEMA, buildEonExpanseW775ACaptureHandoff, validateEonExpanseW775ACaptureHandoff });

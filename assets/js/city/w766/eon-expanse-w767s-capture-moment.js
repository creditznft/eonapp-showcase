const freeze = (value) => Object.freeze(value);
const token = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);
const safeText = (value = '', max = 100) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 && character !== '<' && character !== '>' ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

export const EON_EXPANSE_W767S_CAPTURE_MOMENT_SCHEMA = 'eon.city.expanse.capture-moment.w767s.v1';

export function deriveEonExpanseW767SCaptureMoment({
  expanseActive = false,
  restorationStatus = null,
  dynamicEvent = null
} = {}) {
  const eventActive = dynamicEvent?.active === true;
  const stageId = token(restorationStatus?.currentStageId || '');
  const meaningfulStage = Boolean(stageId && stageId !== 'arrival');
  const available = Boolean(expanseActive && (eventActive || meaningfulStage));
  const source = eventActive ? 'dynamic-event' : meaningfulStage ? 'restoration' : 'none';
  const momentId = eventActive
    ? `event:${token(dynamicEvent.eventId)}:${token(dynamicEvent.windowId, 120)}`
    : meaningfulStage ? `restoration:${stageId}` : '';
  const label = eventActive
    ? safeText(dynamicEvent.label || 'Frontier event')
    : safeText(restorationStatus?.currentLabel || 'Frontier restoration');
  return freeze({
    schema: EON_EXPANSE_W767S_CAPTURE_MOMENT_SCHEMA,
    available,
    source,
    momentId,
    label,
    buttonLabel: available ? 'Capture moment' : '',
    ariaLabel: available ? `Open Creator Capture for ${label}` : '',
    context: available ? freeze({
      type: 'expanse-capture-moment',
      momentId,
      source,
      label,
      zoneId: token(dynamicEvent?.zoneId || ''),
      restorationPercent: Math.max(0, Math.min(100, Number(restorationStatus?.onlinePercent || 0))),
      localCaptureOnly: true,
      publicPostingRequired: false,
      referralLinkOptional: true,
      includesPrivateContent: false
    }) : null,
    opensCaptureAutomatically: false,
    recordsAutomatically: false,
    publishesAutomatically: false,
    requiresExplicitUserAction: true,
    mutatesProgression: false,
    awardsXp: false
  });
}

export function validateEonExpanseW767SCaptureRequest(moment = null, { explicitUserAction = false, expectedMomentId = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!moment?.available || !moment?.momentId) return freeze({ ok: false, reason: 'capture-moment-unavailable' });
  if (expectedMomentId && String(expectedMomentId) !== String(moment.momentId)) return freeze({ ok: false, reason: 'capture-moment-changed' });
  return freeze({ ok: true, context: moment.context, explicitUserAction: true, recordsAutomatically: false, publishesAutomatically: false, mutatesProgression: false });
}

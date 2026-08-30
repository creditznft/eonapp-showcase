/** W773C — explicit, privacy-safe My Frontier Creator Capture moments. */
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,159}$/i;
const safeId = (value = '') => SAFE_ID.test(String(value || '')) ? String(value) : '';
const safeLabel = (value = '', max = 90) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 && character !== '<' && character !== '>' ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

export const EON_EXPANSE_W773C_MY_FRONTIER_CAPTURE_SCHEMA = 'eon.expanse.my-frontier-capture.w773c.v1';
const TYPES = freeze({
  construction: freeze({ title: 'Frontier construction', source: 'my-frontier-construction', verb: 'constructed' }),
  upgrade: freeze({ title: 'District online', source: 'my-frontier-upgrade', verb: 'activated' }),
  resident: freeze({ title: 'Resident arrived', source: 'my-frontier-resident', verb: 'invited' }),
  productive: freeze({ title: 'Verified work complete', source: 'productive-result', verb: 'verified' })
});

export function createEonExpanseW773CMyFrontierCaptureDirector({ now = Date.now, ttlMs = 10 * 60 * 1000 } = {}) {
  let moment = null;
  const record = ({ type = '', plotId = '', buildingId = '', slotId = '', residentId = '', missionId = '', workspaceId = '', label = '' } = {}, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const policy = TYPES[String(type || '')];
    if (!policy) return freeze({ ok: false, reason: 'capture-action-type-invalid' });
    const primaryId = type === 'resident' ? safeId(slotId) : type === 'productive' ? safeId(missionId) : safeId(plotId);
    const subjectId = type === 'resident' ? safeId(residentId) : type === 'productive' ? safeId(workspaceId) : safeId(buildingId);
    if (!primaryId || !subjectId) return freeze({ ok: false, reason: 'capture-action-identity-invalid' });
    const at = Number(now());
    moment = freeze({
      type,
      source: policy.source,
      momentId: `${policy.source}:${primaryId}:${subjectId}:${at}`,
      label: safeLabel(label || subjectId.replaceAll('-', ' ')),
      primaryId,
      subjectId,
      recordedAt: at,
      expiresAt: at + Math.max(30000, Number(ttlMs || 0))
    });
    return freeze({ ok: true, moment });
  };
  const derive = ({ expanseActive = false, fallback = null, at = now() } = {}) => {
    const currentAt = Number(at);
    if (!expanseActive || !moment || currentAt >= moment.expiresAt) return fallback || freeze({ schema: EON_EXPANSE_W773C_MY_FRONTIER_CAPTURE_SCHEMA, available: false, source: 'none' });
    const policy = TYPES[moment.type];
    return freeze({
      schema: EON_EXPANSE_W773C_MY_FRONTIER_CAPTURE_SCHEMA,
      available: true,
      source: moment.source,
      momentId: moment.momentId,
      label: moment.label,
      buttonLabel: 'Capture moment',
      ariaLabel: `Open Creator Capture for ${moment.label}`,
      context: freeze({
        type: 'expanse-capture-moment',
        momentId: moment.momentId,
        source: moment.source,
        label: moment.label,
        actionType: moment.type,
        primaryId: moment.primaryId,
        subjectId: moment.subjectId,
        localCaptureOnly: true,
        publicPostingRequired: false,
        referralLinkOptional: true,
        includesPrivateContent: false
      }),
      title: policy.title,
      opensCaptureAutomatically: false,
      recordsAutomatically: false,
      publishesAutomatically: false,
      requiresExplicitUserAction: true,
      mutatesProgression: false,
      awardsXp: false
    });
  };
  const reset = (reason = 'reset') => { moment = null; return freeze({ ok: true, reason }); };
  return freeze({ schema: EON_EXPANSE_W773C_MY_FRONTIER_CAPTURE_SCHEMA, record, derive, reset, getState: () => freeze({ moment }) });
}

export default freeze({ EON_EXPANSE_W773C_MY_FRONTIER_CAPTURE_SCHEMA, createEonExpanseW773CMyFrontierCaptureDirector });

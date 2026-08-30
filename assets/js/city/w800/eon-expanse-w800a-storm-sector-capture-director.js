/** W800A — explicit, privacy-safe Storm Sector Creator Capture moments. */
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,159}$/i;
const safeId = (value = '') => SAFE_ID.test(String(value || '')) ? String(value) : '';
const safeLabel = (value = '', max = 100) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 && character !== '<' && character !== '>' ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

export const EON_EXPANSE_W800A_STORM_CAPTURE_SCHEMA = 'eon.expanse.storm-sector-capture.w800a.v1';
const POLICIES = freeze({
  objective: freeze({ source: 'storm-sector-objective', title: 'Storm objective complete' }),
  mission: freeze({ source: 'storm-sector-mission', title: 'Storm mission restored' }),
  region: freeze({ source: 'storm-sector-restored', title: 'Storm Sector restored' })
});

export function createEonExpanseW800AStormCaptureDirector({ now = Date.now, ttlMs = 10 * 60 * 1000 } = {}) {
  let moment = null;
  const record = ({ type = '', objectiveId = '', missionId = '', label = '' } = {}, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const policy = POLICIES[String(type || '')] || null;
    if (!policy) return freeze({ ok: false, reason: 'storm-capture-type-invalid' });
    const primaryId = type === 'objective' ? safeId(objectiveId) : safeId(missionId || 'storm-sector');
    if (!primaryId) return freeze({ ok: false, reason: 'storm-capture-identity-invalid' });
    const recordedAt = Math.max(1, Number(now()) || Date.now());
    moment = freeze({
      type,
      source: policy.source,
      title: policy.title,
      primaryId,
      label: safeLabel(label || primaryId.replaceAll('-', ' ')),
      momentId: `${policy.source}:${primaryId}:${recordedAt}`,
      recordedAt,
      expiresAt: recordedAt + Math.max(30000, Number(ttlMs || 0))
    });
    return freeze({ ok: true, moment, recordsAutomatically: false, publishesAutomatically: false, awardsXp: false });
  };
  const derive = ({ regionActive = false, at = now() } = {}) => {
    const currentAt = Number(at);
    if (!regionActive || !moment || currentAt >= moment.expiresAt) return freeze({ schema: EON_EXPANSE_W800A_STORM_CAPTURE_SCHEMA, available: false, source: 'none' });
    return freeze({
      schema: EON_EXPANSE_W800A_STORM_CAPTURE_SCHEMA,
      available: true,
      source: moment.source,
      momentId: moment.momentId,
      label: moment.label,
      title: moment.title,
      buttonLabel: 'Capture Storm moment',
      ariaLabel: `Open Creator Capture for ${moment.label}`,
      context: freeze({
        type: 'expanse-capture-moment',
        momentId: moment.momentId,
        source: moment.source,
        label: moment.label,
        regionId: 'storm-sector',
        actionType: moment.type,
        primaryId: moment.primaryId,
        localCaptureOnly: true,
        publicPostingRequired: false,
        referralLinkOptional: true,
        includesPrivateContent: false
      }),
      opensCaptureAutomatically: false,
      recordsAutomatically: false,
      uploadsAutomatically: false,
      publishesAutomatically: false,
      requiresExplicitUserAction: true,
      mutatesProgression: false,
      awardsXp: false
    });
  };
  const reset = (reason = 'reset') => { moment = null; return freeze({ ok: true, reason }); };
  return freeze({ schema: EON_EXPANSE_W800A_STORM_CAPTURE_SCHEMA, record, derive, reset, getState: () => freeze({ moment }) });
}

export default freeze({ EON_EXPANSE_W800A_STORM_CAPTURE_SCHEMA, createEonExpanseW800AStormCaptureDirector });

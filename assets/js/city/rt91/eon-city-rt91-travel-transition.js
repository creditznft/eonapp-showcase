/** RT91 — one canonical world-travel transition plan. Pure policy; owns no renderer. */
export const EON_CITY_RT91_TRAVEL_SCHEMA = 'eon.city.travel-transition.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const WORLDS = freeze(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);

export function buildEonCityRt91TravelTransition({ fromWorldId = 'command-hub', toWorldId = '', targetAnchorId = '', discoveredAnchorIds = [], internalFastTravel = false } = {}) {
  const from = clean(fromWorldId);
  const to = clean(toWorldId);
  const target = clean(targetAnchorId);
  const discovered = new Set((discoveredAnchorIds || []).map(clean));
  if (!WORLDS.includes(from) || !WORLDS.includes(to) || from === to) return freeze({ ok: false, reason: 'invalid-world-transition' });
  if (internalFastTravel && (!target || !discovered.has(target))) return freeze({ ok: false, reason: 'undiscovered-fast-travel-anchor' });
  return freeze({
    ok: true,
    schema: EON_CITY_RT91_TRAVEL_SCHEMA,
    fromWorldId: from,
    toWorldId: to,
    targetAnchorId: target,
    internalFastTravel: internalFastTravel === true,
    phases: freeze([
      'lock-player-input',
      'suspend-outgoing-world',
      'release-outgoing-optional-work',
      'set-target-streaming-focus',
      'mount-target-world-in-canonical-scene',
      'wait-for-target-first-playable-frame',
      'release-player-input',
      'resume-target-optional-streaming'
    ]),
    directWorldSwitchAllowed: true,
    signalCompletionRequiredForWorldEntry: false,
    grantsXp: false,
    mutatesProgression: false,
    createsSecondEngine: false,
    createsSecondScene: false,
    createsSecondRenderLoop: false
  });
}

export function validateEonCityRt91TravelTransition(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT91_TRAVEL_SCHEMA || plan?.ok !== true) errors.push('schema-or-status');
  if (!WORLDS.includes(plan?.fromWorldId) || !WORLDS.includes(plan?.toWorldId) || plan.fromWorldId === plan.toWorldId) errors.push('worlds');
  const phases = plan?.phases || [];
  const firstFrameIndex = phases.indexOf('wait-for-target-first-playable-frame');
  const optionalIndex = phases.indexOf('resume-target-optional-streaming');
  if (firstFrameIndex < 0 || optionalIndex <= firstFrameIndex) errors.push('first-frame-before-optional');
  if (plan?.signalCompletionRequiredForWorldEntry !== false || plan?.grantsXp !== false || plan?.mutatesProgression !== false) errors.push('progression-boundary');
  if (plan?.createsSecondEngine || plan?.createsSecondScene || plan?.createsSecondRenderLoop) errors.push('runtime-authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_TRAVEL_SCHEMA, buildEonCityRt91TravelTransition, validateEonCityRt91TravelTransition });

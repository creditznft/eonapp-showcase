/**
 * W407 — Arrival District authored-procedural vertical slice contract.
 *
 * This is an art-directed scene blueprint for the first 10 seconds of City
 * entry. It contains no binary asset, remote source, user content or automatic
 * task. The detailed renderer remains Babylon-only and uses local procedural
 * geometry until W406B's binary-art release requirements are actually met.
 */
export const EON_CITY_ARRIVAL_DISTRICT_SCHEMA = 'eon.city.arrival-district.w407.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT = freeze({
  schema: EON_CITY_ARRIVAL_DISTRICT_SCHEMA,
  id: 'arrival-gate-command-route',
  title: 'Arrival Gate',
  publicEngine: 'babylon-eoncity',
  publicRoute: '/eoncity',
  visualTruth: 'authored-procedural vertical slice; binary art remains unshipped',
  firstFrame: freeze([
    freeze({ id: 'arrival-gate', label: 'Arrival Gate', purpose: 'A calm readable entry landmark.', fallback: 'procedural-arrival-gate' }),
    freeze({ id: 'wet-street-path', label: 'Wet Street Path', purpose: 'A clear pedestrian route toward real work.', fallback: 'procedural-arrival-path' }),
    freeze({ id: 'command-deck-exterior', label: 'Command Deck', purpose: 'A visible route to EONBOT and native work choice.', fallback: 'procedural-command-centre' }),
    freeze({ id: 'skyline-depth', label: 'Skyline Depth', purpose: 'A bounded background silhouette and atmosphere layer.', fallback: 'procedural-skyline' }),
    freeze({ id: 'eonbot-companion', label: 'EONBOT', purpose: 'A visible local guide; it never performs background work.', fallback: 'procedural-eonbot' })
  ]),
  firstMission: freeze({
    id: 'meet-eonbot-and-choose-work',
    label: 'Meet EONBOT, then choose one real work route',
    detail: 'Walk toward the Command Centre. When you are ready, use the visible Interact control to review a native EONAPP route.',
    autoStart: false,
    autoOpenRoute: false,
    storesUserContent: false,
    reward: null
  }),
  rendering: freeze({
    originalProcedural: true,
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    binaryAssets: false,
    userData: false,
    mobileFallback: 'retain the same path and mission beacon with reduced detail'
  }),
  nonGoals: freeze(['open-world simulation', 'fake productivity grind', 'background agent work', 'wallet, reward, commerce or token loops', 'claiming final art quality'])
});

export function getArrivalDistrictFirstMission() {
  return EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission;
}

export function validateArrivalDistrictBlueprint(blueprint = EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT) {
  const errors = [];
  if (blueprint?.schema !== EON_CITY_ARRIVAL_DISTRICT_SCHEMA) errors.push('Unexpected W407 Arrival District schema.');
  if (blueprint?.publicEngine !== 'babylon-eoncity' || blueprint?.publicRoute !== '/eoncity') errors.push('Arrival District must stay on canonical Babylon /eoncity.');
  if (!Array.isArray(blueprint?.firstFrame) || blueprint.firstFrame.length !== 5) errors.push('Arrival District needs the five-part first frame.');
  const ids = new Set(blueprint?.firstFrame?.map((entry) => entry.id) || []);
  for (const id of ['arrival-gate', 'wet-street-path', 'command-deck-exterior', 'skyline-depth', 'eonbot-companion']) if (!ids.has(id)) errors.push(`First frame is missing ${id}.`);
  if (blueprint?.firstMission?.autoStart !== false || blueprint?.firstMission?.autoOpenRoute !== false || blueprint?.firstMission?.storesUserContent !== false || blueprint?.firstMission?.reward !== null) errors.push('First mission must remain user-controlled and non-rewarding.');
  if (blueprint?.rendering?.originalProcedural !== true || blueprint?.rendering?.localOnly !== true || blueprint?.rendering?.remoteAssets !== false || blueprint?.rendering?.remoteTelemetry !== false || blueprint?.rendering?.binaryAssets !== false || blueprint?.rendering?.userData !== false) errors.push('Arrival District renderer boundary is incomplete.');
  if (/https?:\/\//i.test(JSON.stringify(blueprint))) errors.push('Arrival District contains a forbidden remote URL.');
  return freeze({ schema: EON_CITY_ARRIVAL_DISTRICT_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}

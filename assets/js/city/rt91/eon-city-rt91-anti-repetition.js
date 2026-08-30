/** RT91 — bounded recent-history scoring for repeatable mission variety. */
export const EON_CITY_RT91_ANTI_REPETITION_SCHEMA = 'eon.city.anti-repetition.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const HISTORY_LIMIT = 12;

export function normalizeEonCityRt91ActivityHistory(history = []) {
  return freeze((Array.isArray(history) ? history : []).slice(-HISTORY_LIMIT).map((entry) => freeze({
    familyId: clean(entry?.familyId),
    regionId: clean(entry?.regionId),
    zoneId: clean(entry?.zoneId),
    npcRole: clean(entry?.npcRole),
    objectiveSignature: clean(entry?.objectiveSignature)
  })));
}

function recentDistance(history, predicate) {
  for (let index = history.length - 1, distance = 0; index >= 0; index -= 1, distance += 1) if (predicate(history[index])) return distance;
  return Number.POSITIVE_INFINITY;
}

export function scoreEonCityRt91ActivityCandidate(candidate = {}, historyInput = []) {
  const history = normalizeEonCityRt91ActivityHistory(historyInput);
  let score = 100;
  const reasons = [];
  const penalties = [
    ['family', 44, (entry) => clean(entry.familyId) === clean(candidate.familyId)],
    ['region', 24, (entry) => clean(candidate.regionId) && clean(entry.regionId) === clean(candidate.regionId)],
    ['zone', 18, (entry) => clean(candidate.zoneId) && clean(entry.zoneId) === clean(candidate.zoneId)],
    ['npc', 14, (entry) => clean(candidate.npcRole) && clean(entry.npcRole) === clean(candidate.npcRole)],
    ['objective', 34, (entry) => clean(candidate.objectiveSignature) && clean(entry.objectiveSignature) === clean(candidate.objectiveSignature)]
  ];
  for (const [name, maximum, predicate] of penalties) {
    const distance = recentDistance(history, predicate);
    if (!Number.isFinite(distance)) continue;
    const penalty = Math.max(2, Math.round(maximum * Math.max(0.12, 1 - distance / HISTORY_LIMIT)));
    score -= penalty;
    reasons.push(`${name}:${penalty}`);
  }
  return freeze({ schema: EON_CITY_RT91_ANTI_REPETITION_SCHEMA, score: Math.max(1, score), penalties: freeze(reasons), historySize: history.length });
}

export function appendEonCityRt91ActivityHistory(history = [], entry = {}) {
  return normalizeEonCityRt91ActivityHistory([...normalizeEonCityRt91ActivityHistory(history), entry]);
}

export default freeze({ EON_CITY_RT91_ANTI_REPETITION_SCHEMA, normalizeEonCityRt91ActivityHistory, scoreEonCityRt91ActivityCandidate, appendEonCityRt91ActivityHistory });

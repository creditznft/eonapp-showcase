/**
 * W682 — dense, varied Expanse population, discovery and street-activity plan.
 *
 * Population is deterministic, bounded and local. Actors are ambient public
 * silhouettes with authored schedules; they never claim to be real workers,
 * agents, users or network participants. Discoveries remain review-first.
 */
export const EON_CITY_W682_EXPANSE_POPULATION_SCHEMA = 'eon.city.expanse-population.w682.v1';
const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const CELL_SIZE = 10;

const QUALITY = freeze({
  lite: freeze({ population: 14, discoveries: 6, streetActivity: 8 }),
  balanced: freeze({ population: 30, discoveries: 12, streetActivity: 16 }),
  cinematic: freeze({ population: 52, discoveries: 18, streetActivity: 28 })
});
const ARCHETYPES = freeze([
  freeze({ id: 'wayfinder', label: 'Wayfinder', silhouette: 'human', accent: '#55eaff' }),
  freeze({ id: 'maker', label: 'Maker', silhouette: 'human', accent: '#ad78ff' }),
  freeze({ id: 'archive-navigator', label: 'Archive Navigator', silhouette: 'human', accent: '#75f7cf' }),
  freeze({ id: 'maintenance-orb', label: 'Maintenance Orb', silhouette: 'orb', accent: '#ffc45c' }),
  freeze({ id: 'courier-drone', label: 'Courier Drone', silhouette: 'drone', accent: '#64d8ff' }),
  freeze({ id: 'bio-gardener', label: 'Bio Gardener', silhouette: 'human', accent: '#8dffbf' }),
  freeze({ id: 'market-host', label: 'Market Host', silhouette: 'human', accent: '#ffda73' }),
  freeze({ id: 'signal-keeper', label: 'Signal Keeper', silhouette: 'robot', accent: '#9c8cff' })
]);
const ACTIVITIES = freeze(['walking a public route', 'reviewing a public display', 'resting at a plaza', 'maintaining street furniture', 'guiding a local wayfinding cue', 'observing a discovery signal', 'crossing between districts', 'working at a public kiosk']);
const DISCOVERY_KINDS = freeze(['signal-garden', 'memory-obelisk', 'realm-echo', 'street-performance', 'public-workshop', 'rare-material-display', 'transit-overlook', 'atlas-marker']);
const STREET_KINDS = freeze(['pedestrian-crossing', 'kiosk-pulse', 'delivery-route', 'maintenance-cue', 'plaza-gathering', 'light-rail-passage', 'wayfinding-signal', 'public-art-cycle']);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-population')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function unit(seed = '') { return (hash32(seed) % 100000) / 100000; }
function center(cell = {}) { return freeze({ x: finite(cell.x) * CELL_SIZE + CELL_SIZE / 2, z: finite(cell.z) * CELL_SIZE + CELL_SIZE / 2 }); }

function chooseNonRepeating(entries, count, key) {
  const result = [];
  let previous = '';
  for (let index = 0; index < count; index += 1) {
    let candidate = entries[hash32(`${key}:${index}`) % entries.length];
    if (candidate.id === previous) candidate = entries[(entries.indexOf(candidate) + 1 + (index % Math.max(1, entries.length - 1))) % entries.length];
    result.push(candidate);
    previous = candidate.id;
  }
  return result;
}

export function buildEonCityW682ExpansePopulationPlan({ cells = [], seed = 'eonapp-expanse', quality = 'balanced', reducedMotion = false } = {}) {
  const resolvedQuality = QUALITY[String(quality)] ? String(quality) : 'balanced';
  const profile = QUALITY[resolvedQuality];
  const interactive = (Array.isArray(cells) ? cells : []).filter((entry) => entry?.interactive !== false && entry?.residencyTier !== 'horizon');
  const visible = Array.isArray(cells) ? cells : [];
  const population = [];
  const archetypeSequence = chooseNonRepeating(ARCHETYPES, profile.population, `${seed}:archetypes`);
  for (let index = 0; index < profile.population; index += 1) {
    const cell = (interactive.length ? interactive : visible)[index % Math.max(1, (interactive.length ? interactive : visible).length)] || { id: 'cell-0-0', x: 0, z: 0 };
    const c = center(cell);
    const angle = unit(`${seed}:population:${index}:angle`) * Math.PI * 2;
    const radius = 1.2 + unit(`${seed}:population:${index}:radius`) * 3.1;
    const routeLength = 0.7 + unit(`${seed}:population:${index}:route`) * 1.7;
    const archetype = archetypeSequence[index];
    const activity = ACTIVITIES[(hash32(`${seed}:population:${index}:activity`) + index) % ACTIVITIES.length];
    const start = freeze({ x: c.x + Math.cos(angle) * radius, y: archetype.silhouette === 'drone' || archetype.silhouette === 'orb' ? 1.15 : 0.62, z: c.z + Math.sin(angle) * radius });
    const end = freeze({ x: start.x + Math.cos(angle + Math.PI / 2) * routeLength, y: start.y, z: start.z + Math.sin(angle + Math.PI / 2) * routeLength });
    population.push(freeze({
      id: `w682-population-${index + 1}`,
      cellId: cell.id,
      archetype,
      activity,
      start,
      end,
      speed: reducedMotion ? 0 : 0.018 + unit(`${seed}:population:${index}:speed`) * 0.032,
      phase: unit(`${seed}:population:${index}:phase`),
      scale: 0.82 + unit(`${seed}:population:${index}:scale`) * 0.36,
      scheduleId: `schedule-${hash32(`${cell.id}:${activity}:${index}`).toString(36)}`,
      claimsRealWork: false,
      interactive: false,
      privateDataRead: false
    }));
  }

  const discoveries = [];
  for (let index = 0; index < profile.discoveries; index += 1) {
    const cell = (interactive.length ? interactive : visible)[(index * 5 + 2) % Math.max(1, (interactive.length ? interactive : visible).length)] || { id: 'cell-0-0', x: 0, z: 0 };
    const c = center(cell);
    const kind = DISCOVERY_KINDS[(hash32(`${seed}:discovery:${index}`) + index) % DISCOVERY_KINDS.length];
    discoveries.push(freeze({
      id: `w682-discovery-${hash32(`${seed}:${cell.id}:${kind}:${index}`).toString(36)}`,
      cellId: cell.id,
      kind,
      label: kind.replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
      position: freeze({ x: c.x + (unit(`${seed}:discovery:${index}:x`) - 0.5) * 6.2, y: 0.12, z: c.z + (unit(`${seed}:discovery:${index}:z`) - 0.5) * 6.2 }),
      rarity: index % 11 === 0 ? 'rare' : index % 4 === 0 ? 'uncommon' : 'common',
      atlasEligible: true,
      reviewFirst: true,
      automaticOpen: false,
      privateByDefault: true
    }));
  }

  const streetActivity = [];
  for (let index = 0; index < profile.streetActivity; index += 1) {
    const cell = visible[(index * 3 + 1) % Math.max(1, visible.length)] || { id: 'cell-0-0', x: 0, z: 0 };
    const c = center(cell);
    const kind = STREET_KINDS[(hash32(`${seed}:street:${index}`) + index) % STREET_KINDS.length];
    streetActivity.push(freeze({
      id: `w682-street-${index + 1}`,
      cellId: cell.id,
      kind,
      position: freeze({ x: c.x + (unit(`${seed}:street:${index}:x`) - 0.5) * 7.4, y: 0.09, z: c.z + (unit(`${seed}:street:${index}:z`) - 0.5) * 7.4 }),
      phase: unit(`${seed}:street:${index}:phase`),
      motion: reducedMotion ? 'static-pulse' : index % 3 === 0 ? 'rotate' : 'pulse',
      interactive: false,
      claimsRealActivity: false
    }));
  }

  const archetypeIds = new Set(population.map((entry) => entry.archetype.id));
  const activityIds = new Set(population.map((entry) => entry.activity));
  const scheduleIds = new Set(population.map((entry) => entry.scheduleId));
  const adjacentRepeats = population.slice(1).filter((entry, index) => entry.archetype.id === population[index].archetype.id).length;
  return freeze({
    schema: EON_CITY_W682_EXPANSE_POPULATION_SCHEMA,
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    cellCount: visible.length,
    population: freeze(population),
    discoveries: freeze(discoveries),
    streetActivity: freeze(streetActivity),
    populationCount: population.length,
    discoveryCount: discoveries.length,
    streetActivityCount: streetActivity.length,
    archetypeVariety: archetypeIds.size,
    activityVariety: activityIds.size,
    uniqueScheduleCount: scheduleIds.size,
    adjacentArchetypeRepeats: adjacentRepeats,
    repetitionScore: population.length ? Number((1 - adjacentRepeats / population.length).toFixed(3)) : 1,
    boundedDensity: true,
    deterministic: true,
    localOnly: true,
    autonomousAgents: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function validateEonCityW682ExpansePopulationPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W682_EXPANSE_POPULATION_SCHEMA) errors.push('schema-invalid');
  if (plan.populationCount < 14 || plan.discoveryCount < 6 || plan.streetActivityCount < 8) errors.push('density-invalid');
  if (plan.archetypeVariety < 6 || plan.activityVariety < 6 || plan.uniqueScheduleCount !== plan.populationCount) errors.push('variety-invalid');
  if (plan.adjacentArchetypeRepeats !== 0 || plan.repetitionScore < 0.95) errors.push('repetition-invalid');
  if (!plan.boundedDensity || !plan.deterministic || !plan.localOnly) errors.push('runtime-contract-invalid');
  if (plan.autonomousAgents || plan.privateDataRead || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), populationCount: plan.populationCount || 0, discoveryCount: plan.discoveryCount || 0, streetActivityCount: plan.streetActivityCount || 0 });
}

export function getEonCityW682ExpansePopulationTruth() {
  return freeze({
    schema: EON_CITY_W682_EXPANSE_POPULATION_SCHEMA,
    denseBoundedPopulation: true,
    reducedRepetition: true,
    variedDiscoveries: true,
    visibleStreetActivity: true,
    autonomousAgents: false,
    claimsRealWorkers: false,
    privateDataRead: false,
    networkRequestCreated: false,
    ownsRenderLoop: false
  });
}

export default freeze({
  EON_CITY_W682_EXPANSE_POPULATION_SCHEMA,
  buildEonCityW682ExpansePopulationPlan,
  validateEonCityW682ExpansePopulationPlan,
  getEonCityW682ExpansePopulationTruth
});

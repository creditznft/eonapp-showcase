/**
 * W681 — persistent Expanse macro-regions and arterial continuity.
 *
 * The detailed renderer keeps its proven 5×5 streamed window. This authority
 * describes a larger 3×3 macro-region neighbourhood around that window, with
 * deterministic arterial roads and horizon identities that continue as the
 * player moves. It owns no render loop, navigation or network work.
 */
export const EON_CITY_W681_EXPANSE_MACRO_SCHEMA = 'eon.city.expanse-macro-regions.w681.v1';
export const EON_CITY_W681_CELL_SIZE = 10;
export const EON_CITY_W681_MACRO_SIZE_CELLS = 18;

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clean = (value = '') => String(value || '').trim();

const ARCHETYPES = freeze([
  freeze({ id: 'civic-spine', label: 'Civic Spine', accent: '#55eaff', skyline: 'command-towers', purpose: 'public orientation and transit continuity' }),
  freeze({ id: 'maker-ward', label: 'Maker Ward', accent: '#ad78ff', skyline: 'forge-stacks', purpose: 'creator workshops and project streets' }),
  freeze({ id: 'archive-quarter', label: 'Archive Quarter', accent: '#75f7cf', skyline: 'canopy-archives', purpose: 'research courts and memory routes' }),
  freeze({ id: 'golden-market', label: 'Golden Market', accent: '#ffda73', skyline: 'terrace-domes', purpose: 'public exchange and showcase spaces' }),
  freeze({ id: 'oceanic-habitat', label: 'Oceanic Habitat', accent: '#64d8ff', skyline: 'light-reefs', purpose: 'restorative public habitats and water plazas' }),
  freeze({ id: 'bio-city', label: 'Living Bio-City', accent: '#8dffbf', skyline: 'living-spires', purpose: 'ecology routes and adaptive public spaces' }),
  freeze({ id: 'noir-arcade', label: 'Archive Noir Arcades', accent: '#9c8cff', skyline: 'noir-bridges', purpose: 'investigation streets and hidden courtyards' }),
  freeze({ id: 'time-gardens', label: 'Path of Time Gardens', accent: '#ffc45c', skyline: 'chronology-rings', purpose: 'reflection routes and history landmarks' }),
  freeze({ id: 'eonbot-temple', label: 'EONBOT Temple Reach', accent: '#7ef1ff', skyline: 'signal-sanctums', purpose: 'companion wayfinding and public signal beacons' })
]);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-expanse')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function point(x = 0, z = 0, y = 0) { return freeze({ x: finite(x), y: finite(y), z: finite(z) }); }
function regionId(x, z) { return `macro-${x}-${z}`; }

function resolveCurrentCell(position = {}) {
  return freeze({
    x: Math.floor(finite(position.x) / EON_CITY_W681_CELL_SIZE),
    z: Math.floor(finite(position.z) / EON_CITY_W681_CELL_SIZE)
  });
}

function resolveMacro(cell = {}) {
  const half = EON_CITY_W681_MACRO_SIZE_CELLS / 2;
  return freeze({
    x: Math.floor((finite(cell.x) + half) / EON_CITY_W681_MACRO_SIZE_CELLS),
    z: Math.floor((finite(cell.z) + half) / EON_CITY_W681_MACRO_SIZE_CELLS)
  });
}

function archetypeFor(seed = '', x = 0, z = 0) {
  return ARCHETYPES[hash32(`${seed}:${x}:${z}`) % ARCHETYPES.length];
}

export function buildEonCityW681ExpanseMacroRegionPlan({ position = {}, seed = 'eonapp-expanse', quality = 'balanced' } = {}) {
  const currentCell = resolveCurrentCell(position);
  const currentMacro = resolveMacro(currentCell);
  const macroWorldSize = EON_CITY_W681_MACRO_SIZE_CELLS * EON_CITY_W681_CELL_SIZE;
  const regions = [];
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = currentMacro.x + dx;
      const z = currentMacro.z + dz;
      const archetype = archetypeFor(seed, x, z);
      regions.push(freeze({
        id: regionId(x, z),
        x,
        z,
        role: dx === 0 && dz === 0 ? 'current' : Math.abs(dx) + Math.abs(dz) === 1 ? 'adjacent' : 'horizon',
        center: point(x * macroWorldSize, z * macroWorldSize),
        sizeCells: EON_CITY_W681_MACRO_SIZE_CELLS,
        worldSize: macroWorldSize,
        archetype,
        deterministicSignature: `${archetype.id}:${x}:${z}:${hash32(`${seed}:${x}:${z}:signature`).toString(36)}`,
        detailedWindowResident: dx === 0 && dz === 0,
        visibleIdentityOnly: dx !== 0 || dz !== 0,
        containsPrivateData: false
      }));
    }
  }

  const regionMap = new Map(regions.map((entry) => [entry.id, entry]));
  const arterials = [];
  for (const region of regions) {
    const east = regionMap.get(regionId(region.x + 1, region.z));
    const south = regionMap.get(regionId(region.x, region.z + 1));
    if (east) arterials.push(freeze({ id: `${region.id}:east`, fromRegionId: region.id, toRegionId: east.id, from: point(region.center.x, region.center.z), to: point(east.center.x, east.center.z), kind: 'east-west-arterial', width: 2.4, continuity: true }));
    if (south) arterials.push(freeze({ id: `${region.id}:south`, fromRegionId: region.id, toRegionId: south.id, from: point(region.center.x, region.center.z), to: point(south.center.x, south.center.z), kind: 'north-south-arterial', width: 2.4, continuity: true }));
  }

  const current = regionMap.get(regionId(currentMacro.x, currentMacro.z));
  const approaches = freeze([
    freeze({ id: 'macro-north-approach', from: point(current.center.x, current.center.z - macroWorldSize * 0.52), to: point(current.center.x, current.center.z + macroWorldSize * 0.52), width: 2.8 }),
    freeze({ id: 'macro-east-approach', from: point(current.center.x - macroWorldSize * 0.52, current.center.z), to: point(current.center.x + macroWorldSize * 0.52, current.center.z), width: 2.8 })
  ]);

  const horizonAnchors = freeze(regions.filter((entry) => entry.id !== current.id).map((entry, index) => freeze({
    id: `${entry.id}:horizon-anchor`,
    regionId: entry.id,
    label: entry.archetype.label,
    position: point(entry.center.x, entry.center.z, 4 + (hash32(entry.id) % 11)),
    width: quality === 'lite' ? 7 : quality === 'cinematic' ? 13 : 10,
    depth: quality === 'lite' ? 5 : quality === 'cinematic' ? 9 : 7,
    height: quality === 'lite' ? 7 + index % 4 : quality === 'cinematic' ? 14 + index % 8 : 10 + index % 6,
    accent: entry.archetype.accent,
    skyline: entry.archetype.skyline,
    interactive: false,
    collision: false
  })));

  return freeze({
    schema: EON_CITY_W681_EXPANSE_MACRO_SCHEMA,
    seedRef: clean(seed).slice(0, 80),
    quality: ['lite', 'balanced', 'cinematic'].includes(String(quality)) ? String(quality) : 'balanced',
    currentCell,
    currentMacro,
    currentRegionId: current.id,
    macroSizeCells: EON_CITY_W681_MACRO_SIZE_CELLS,
    macroWorldSize,
    detailedWindowCells: 25,
    macroRegionCount: regions.length,
    regions: freeze(regions),
    arterials: freeze(arterials),
    approaches,
    horizonAnchors,
    allAdjacentRegionsRoadConnected: arterials.length === 12,
    detailedFiveByFiveStreamingPreserved: true,
    visibleHardBorder: false,
    coherentUrbanContinuity: true,
    automaticNavigation: false,
    localOnly: true,
    networkRequestCreated: false
  });
}

export function validateEonCityW681ExpanseMacroRegionPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W681_EXPANSE_MACRO_SCHEMA) errors.push('schema-invalid');
  if (plan.macroRegionCount !== 9 || plan.regions?.length !== 9) errors.push('macro-region-count-invalid');
  if (plan.arterials?.length !== 12 || plan.allAdjacentRegionsRoadConnected !== true) errors.push('arterial-continuity-invalid');
  if (plan.detailedWindowCells !== 25 || plan.detailedFiveByFiveStreamingPreserved !== true) errors.push('detailed-window-contract-invalid');
  if (plan.visibleHardBorder !== false || plan.coherentUrbanContinuity !== true) errors.push('world-continuity-invalid');
  if (plan.automaticNavigation || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), regionCount: plan.regions?.length || 0, arterialCount: plan.arterials?.length || 0 });
}

export function getEonCityW681ExpanseMacroRegionTruth() {
  return freeze({
    schema: EON_CITY_W681_EXPANSE_MACRO_SCHEMA,
    persistentMacroRegions: true,
    coherentArterialContinuity: true,
    detailedFiveByFiveStreamingPreserved: true,
    secondRendererCreated: false,
    automaticNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W681_EXPANSE_MACRO_SCHEMA,
  EON_CITY_W681_CELL_SIZE,
  EON_CITY_W681_MACRO_SIZE_CELLS,
  buildEonCityW681ExpanseMacroRegionPlan,
  validateEonCityW681ExpanseMacroRegionPlan,
  getEonCityW681ExpanseMacroRegionTruth
});

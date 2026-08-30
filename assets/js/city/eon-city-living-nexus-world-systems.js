/**
 * W660U — bounded Living Nexus world systems.
 *
 * Produces a deterministic, public-safe presentation plan for the resident
 * Expanse cells. The plan is local visual choreography only: it does not read
 * device time, weather, account, project or identity data; it creates no
 * network request, route transition, reward, payment or autonomous work.
 */
export const EON_CITY_LIVING_NEXUS_WORLD_SYSTEMS_SCHEMA = 'eon.city.living-nexus-world-systems.w660u.v1';

const freeze = (value) => Object.freeze(value);
const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const SAFE_CELL = /^cell--?\d+--?\d+$/;
const CELL_SIZE = 10;

const QUALITY = freeze({
  lite: freeze({ transitCount: 0, maintenanceCount: 1, rainStrandCount: 0, motionEnabled: false }),
  balanced: freeze({ transitCount: 1, maintenanceCount: 2, rainStrandCount: 10, motionEnabled: true }),
  cinematic: freeze({ transitCount: 2, maintenanceCount: 3, rainStrandCount: 18, motionEnabled: true })
});

const VISUAL_PHASES = freeze([
  freeze({ id: 'nexus-midnight', label: 'Nexus Midnight', light: 0.18 }),
  freeze({ id: 'signal-dawn', label: 'Signal Dawn', light: 0.34 }),
  freeze({ id: 'creator-glow', label: 'Creator Glow', light: 0.27 }),
  freeze({ id: 'quiet-horizon', label: 'Quiet Horizon', light: 0.21 })
]);

const WEATHER = freeze([
  freeze({ id: 'clear-neon', label: 'Clear Neon', shelterNeeded: false }),
  freeze({ id: 'rain-veil', label: 'Rain Veil', shelterNeeded: true }),
  freeze({ id: 'neon-mist', label: 'Neon Mist', shelterNeeded: true })
]);

const REALMS = freeze([
  freeze({ id: 'archive-noir', label: 'Archive Noir', accent: '#75f7cf' }),
  freeze({ id: 'living-bio-city', label: 'Living Bio-City', accent: '#8fffb8' }),
  freeze({ id: 'golden-sovereign', label: 'Golden Sovereign Realm', accent: '#ffda73' }),
  freeze({ id: 'forge-depths', label: 'Forge Depths', accent: '#ad78ff' }),
  freeze({ id: 'orbital-white-city', label: 'Orbital White City', accent: '#d9f8ff' }),
  freeze({ id: 'nexus-ruins', label: 'Nexus Ruins', accent: '#ff9f76' })
]);

const WORLD_EVENTS = freeze([
  freeze({ id: 'signal-bloom', label: 'Signal Bloom', summary: 'A public light relay opens across the current cell.' }),
  freeze({ id: 'maker-lanterns', label: 'Maker Lanterns', summary: 'Local maker lights form a temporary navigation constellation.' }),
  freeze({ id: 'archive-echo', label: 'Archive Echo', summary: 'A bounded memory-glass pulse marks a safe Atlas discovery.' }),
  freeze({ id: 'transit-window', label: 'Transit Window', summary: 'Transit signals align for a short visual crossing.' })
]);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'living-nexus-world')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeQuality(value = 'balanced') {
  return VALID_QUALITY.has(String(value)) ? String(value) : 'balanced';
}

function normalizePhaseIndex(value = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.abs(Math.trunc(number)) % VISUAL_PHASES.length : 0;
}

function centerForCell(cell = {}) {
  return freeze({ x: Number(cell.x || 0) * CELL_SIZE + CELL_SIZE / 2, z: Number(cell.z || 0) * CELL_SIZE + CELL_SIZE / 2 });
}

function boundedCells(cells = []) {
  const valid = (Array.isArray(cells) ? cells : []).filter((cell) =>
    SAFE_CELL.test(String(cell?.id || ''))
    && Number.isInteger(Number(cell?.x))
    && Number.isInteger(Number(cell?.z))
    && cell?.residencyTier !== 'horizon'
    && cell?.interactive !== false
  );
  return freeze(valid.slice(0, 9).map((cell) => freeze({
    id: String(cell.id), x: Number(cell.x), z: Number(cell.z),
    role: cell.role === 'current' ? 'current' : 'adjacent',
    residencyTier: 'interactive'
  })));
}

function pick(list, key, offset = 0) {
  return list[(hash32(`${key}:${offset}`) + offset) % list.length];
}

function buildTransit(cells, current, seedKey, profile) {
  if (!profile.transitCount || !current) return freeze([]);
  const minX = Math.min(...cells.map((cell) => centerForCell(cell).x));
  const maxX = Math.max(...cells.map((cell) => centerForCell(cell).x));
  const minZ = Math.min(...cells.map((cell) => centerForCell(cell).z));
  const maxZ = Math.max(...cells.map((cell) => centerForCell(cell).z));
  const center = centerForCell(current);
  const rows = [];
  for (let index = 0; index < profile.transitCount; index += 1) {
    const axis = index % 2 === 0 ? 'east-west' : 'north-south';
    const laneOffset = ((hash32(`${seedKey}:transit:${index}`) % 5) - 2) * 0.24;
    const start = axis === 'east-west'
      ? freeze({ x: minX - 4.4, y: 2.45 + index * 0.62, z: center.z + laneOffset })
      : freeze({ x: center.x + laneOffset, y: 3.05 + index * 0.52, z: minZ - 4.4 });
    const end = axis === 'east-west'
      ? freeze({ x: maxX + 4.4, y: start.y, z: start.z })
      : freeze({ x: start.x, y: start.y, z: maxZ + 4.4 });
    rows.push(freeze({
      id: `transit-capsule-${index + 1}`,
      label: index === 0 ? 'Transit Capsule' : 'Signal Shuttle',
      axis,
      start,
      end,
      speed: 0.055 + (hash32(`${seedKey}:speed:${index}`) % 18) / 1000,
      phase: (hash32(`${seedKey}:phase:${index}`) % 1000) / 1000,
      visibleEncounterOnly: true,
      boardable: false,
      automaticTravel: false,
      localOnly: true
    }));
  }
  return freeze(rows);
}

function buildMaintenance(cells, seedKey, profile) {
  const ordered = [...cells].sort((a, b) => hash32(`${seedKey}:${a.id}:maintenance`) - hash32(`${seedKey}:${b.id}:maintenance`));
  return freeze(ordered.slice(0, Math.min(profile.maintenanceCount, ordered.length)).map((cell, index) => {
    const center = centerForCell(cell);
    return freeze({
      id: `maintenance-${cell.id}`,
      cellId: cell.id,
      label: index === 0 ? 'Maintenance calibration' : 'Public systems check',
      position: freeze({ x: center.x - 2.15 + index * 0.28, y: 1.35 + index * 0.12, z: center.z + 2.05 - index * 0.24 }),
      schedulePhase: (hash32(`${seedKey}:${cell.id}:schedule`) % 4),
      visualCueOnly: true,
      claimsWorkComplete: false,
      readsUserState: false,
      localOnly: true
    });
  }));
}

function buildPortal(cells, currentCellId, seedKey) {
  const portalRoll = hash32(`${seedKey}:${currentCellId}:rare-portal`) % 11;
  if (portalRoll !== 0 || !cells.length) return null;
  const candidates = cells.filter((cell) => cell.id !== currentCellId);
  const cell = candidates[hash32(`${seedKey}:portal-cell`) % Math.max(1, candidates.length)] || cells[0];
  const center = centerForCell(cell);
  const realm = pick(REALMS, seedKey, 9);
  return freeze({
    id: `rare-portal-${realm.id}-${cell.id}`,
    realmId: realm.id,
    label: realm.label,
    accent: realm.accent,
    cellId: cell.id,
    position: freeze({ x: center.x + 2.35, y: 1.65, z: center.z - 2.1 }),
    inspectOnly: true,
    authoredRealm: true,
    generatedGeometry: false,
    automaticNavigation: false,
    routePrepared: false,
    privateContentStored: false,
    localOnly: true
  });
}

export function buildEonCityLivingNexusWorldSystemsPlan({
  cells = [],
  currentCellId = '',
  seed = 'eoncity-living-nexus',
  quality = 'balanced',
  reducedEffects = false,
  phaseIndex = 0
} = {}) {
  const residentCells = boundedCells(cells);
  const resolvedQuality = normalizeQuality(quality);
  const profile = QUALITY[resolvedQuality];
  const current = residentCells.find((cell) => cell.id === String(currentCellId || '')) || residentCells.find((cell) => cell.role === 'current') || residentCells[0] || null;
  const safeCurrentCellId = current?.id || null;
  const seedKey = `${String(seed || 'eoncity-living-nexus')}:${safeCurrentCellId || 'no-cell'}`;
  const resolvedPhaseIndex = normalizePhaseIndex(phaseIndex);
  const phase = VISUAL_PHASES[resolvedPhaseIndex];
  const selectedWeather = reducedEffects ? WEATHER[0] : pick(WEATHER, seedKey, resolvedPhaseIndex + 3);
  const shelterCell = selectedWeather.shelterNeeded && current ? residentCells[(hash32(`${seedKey}:shelter`) % residentCells.length)] : null;
  const shelterCenter = shelterCell ? centerForCell(shelterCell) : null;
  const worldEvent = current ? pick(WORLD_EVENTS, seedKey, resolvedPhaseIndex + 11) : null;
  const currentCenter = current ? centerForCell(current) : freeze({ x: 0, z: 0 });
  const rarePortal = buildPortal(residentCells, safeCurrentCellId, seedKey);
  return freeze({
    schema: EON_CITY_LIVING_NEXUS_WORLD_SYSTEMS_SCHEMA,
    quality: resolvedQuality,
    reducedEffects: Boolean(reducedEffects),
    currentCellId: safeCurrentCellId,
    phase: freeze({ ...phase, index: resolvedPhaseIndex, visualOnly: true, readsDeviceClock: false }),
    anchor: freeze({ x: currentCenter.x, y: 0, z: currentCenter.z }),
    weather: freeze({
      ...selectedWeather,
      localVisualOnly: true,
      readsRealWeather: false,
      rainStrandCount: reducedEffects ? 0 : profile.rainStrandCount,
      motionEnabled: !reducedEffects && profile.motionEnabled
    }),
    shelter: shelterCenter ? freeze({ id: `weather-shelter-${shelterCell.id}`, cellId: shelterCell.id, position: freeze({ x: shelterCenter.x - 2.4, y: 0.9, z: shelterCenter.z - 2.25 }), visibleWayfindingOnly: true, automaticMovement: false, localOnly: true }) : null,
    transit: buildTransit(residentCells, current, seedKey, reducedEffects ? QUALITY.lite : profile),
    maintenance: buildMaintenance(residentCells, seedKey, profile),
    rarePortal,
    worldEvent: worldEvent ? freeze({ ...worldEvent, cellId: safeCurrentCellId, position: freeze({ x: currentCenter.x + 2.1, y: 0.36, z: currentCenter.z + 2.15 }), authored: true, localVisualOnly: true, automaticAction: false }) : null,
    residentCellCount: residentCells.length,
    deterministic: true,
    oneCanonicalScene: true,
    oneExistingRenderLoop: true,
    localOnly: true,
    userDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    rewardIssued: false,
    paymentClaimed: false
  });
}

export function validateEonCityLivingNexusWorldSystemsPlan(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_LIVING_NEXUS_WORLD_SYSTEMS_SCHEMA) errors.push('schema-invalid');
  if (!VALID_QUALITY.has(String(plan?.quality))) errors.push('quality-invalid');
  if (plan?.residentCellCount !== 9) errors.push('resident-3x3-required');
  if (!plan?.phase?.id || plan.phase.visualOnly !== true || plan.phase.readsDeviceClock !== false) errors.push('visual-phase-invalid');
  if (!WEATHER.some((entry) => entry.id === plan?.weather?.id) || plan.weather.localVisualOnly !== true || plan.weather.readsRealWeather !== false) errors.push('weather-boundary-invalid');
  if (!Array.isArray(plan?.transit) || plan.transit.some((entry) => entry.boardable || entry.automaticTravel || !entry.localOnly)) errors.push('transit-boundary-invalid');
  if (!Array.isArray(plan?.maintenance) || plan.maintenance.some((entry) => entry.claimsWorkComplete || entry.readsUserState || !entry.localOnly)) errors.push('maintenance-boundary-invalid');
  if (plan?.rarePortal && (!plan.rarePortal.inspectOnly || plan.rarePortal.automaticNavigation || plan.rarePortal.generatedGeometry || plan.rarePortal.privateContentStored)) errors.push('rare-portal-boundary-invalid');
  if (plan?.worldEvent && (!plan.worldEvent.authored || !plan.worldEvent.localVisualOnly || plan.worldEvent.automaticAction)) errors.push('world-event-boundary-invalid');
  if (plan?.oneCanonicalScene !== true || plan?.oneExistingRenderLoop !== true || plan?.deterministic !== true) errors.push('canonical-runtime-invalid');
  if (plan?.userDataRead || plan?.privateContentStored || plan?.networkRequestCreated || plan?.automaticNavigation || plan?.automaticExecution || plan?.rewardIssued || plan?.paymentClaimed) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

/**
 * W660S — functional Living Nexus encounter layer.
 *
 * Encounters are deterministic, public-safe and review-first. They bind one
 * rendered Expanse location to one existing Productive RPG mission without
 * reading project content, prompts, files, credentials or provider responses.
 * A location can transform only after the matching native surface writes a
 * verified bounded receipt and the user explicitly checks the return receipt.
 */
import { getEonCityProductiveRpgPlan } from './eon-city-productive-rpg-loop.js';

export const EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA = 'eon.city.living-nexus-encounters.w660s.v1';
export const EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY = 'eon:city:living-nexus:encounters:w660s:v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;
const CELL_ID = /^cell--?\d+--?\d+$/;
const MAX_RESOLUTIONS = 18;
const MAX_PENDING_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const CELL_SIZE = 10;

const SPECIALISTS = freeze([
  freeze({ id: 'pathfinder-guide', missionId: 'orientation', name: 'Pathfinder Guide', role: 'Arrival navigator', landmark: 'Command Signal', verb: 'stabilise the local route', interpretation: 'This signal teaches the current controls and safe return path. It can record only a local orientation receipt.' }),
  freeze({ id: 'project-guide', missionId: 'project', name: 'Project Guide', role: 'Project district coordinator', landmark: 'Project Habitat', verb: 'restore a project habitat', interpretation: 'This habitat can connect to a real project shell or an explicitly resumed local project. No project name or task enters the City.' }),
  freeze({ id: 'device-pathfinder', missionId: 'local-ai-byok', name: 'Device Pathfinder', role: 'Local AI systems specialist', landmark: 'Device Observatory', verb: 'power the observatory', interpretation: 'This observatory responds only to a real Local AI self-test or an explicitly verified user-owned provider key.' }),
  freeze({ id: 'creator-technician', missionId: 'creator', name: 'Creator Technician', role: 'Creator proposal specialist', landmark: 'Lumina Studio', verb: 'prepare the studio bay', interpretation: 'This studio can prepare a review guide for real creator work. It never claims that media was generated before a verified runtime acts.' }),
  freeze({ id: 'automation-operator', missionId: 'automation', name: 'Automation Operator', role: 'Workflow planning specialist', landmark: 'Railworks Console', verb: 'plan the automation rail', interpretation: 'This console can prepare a local workflow proposal for review. It does not run, schedule or queue an automation.' }),
  freeze({ id: 'archive-steward', missionId: 'vault-recovery', name: 'Archive Steward', role: 'Capsule and recovery specialist', landmark: 'Archive Sanctum', verb: 'seal the archive route', interpretation: 'This sanctum changes only after a real encrypted Capsule or an explicitly reviewed restore writes a bounded receipt.' })
]);

const SPECIALIST_BY_MISSION = new Map(SPECIALISTS.map((entry) => [entry.missionId, entry]));

const OUTCOME_TO_MISSION = freeze({
  'orientation-receipt': 'orientation',
  'project-shell': 'project',
  'project-resume': 'project',
  'local-ai-self-test': 'local-ai-byok',
  'byok-provider-verification': 'local-ai-byok',
  'creator-guide-artifact': 'creator',
  'automation-proposal': 'automation',
  'backup-readiness-receipt': 'vault-recovery',
  'recovery-restore-receipt': 'vault-recovery'
});

const cleanId = (value = '', fallback = '') => {
  const text = String(value || '').trim().toLowerCase();
  return SAFE_ID.test(text) ? text : fallback;
};
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-living-nexus-encounter')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function missionDefinitions(plan = getEonCityProductiveRpgPlan({ storage: null })) {
  return new Map((plan?.missions || []).map((entry) => [entry.id, entry]));
}

function specialistForCell(cell = {}, seed = 'eoncity-living-nexus') {
  return SPECIALISTS[hash32(`${seed}:${cell.id}:specialist`) % SPECIALISTS.length];
}

function encounterPosition(cell = {}, seed = 'eoncity-living-nexus') {
  const x = finite(cell.x) * CELL_SIZE + CELL_SIZE / 2;
  const z = finite(cell.z) * CELL_SIZE + CELL_SIZE / 2;
  const hash = hash32(`${seed}:${cell.id}:position`);
  const side = hash % 4;
  const offset = 1.62 + ((hash >>> 5) % 5) * 0.08;
  const points = [
    { x: x + offset, z: z - 1.42 },
    { x: x - 1.42, z: z - offset },
    { x: x - offset, z: z + 1.42 },
    { x: x + 1.42, z: z + offset }
  ];
  return freeze({ x: points[side].x, y: 0, z: points[side].z });
}

function normalizeResolution(value = {}) {
  const encounterId = cleanId(value.encounterId);
  const cellId = CELL_ID.test(String(value.cellId || '')) ? String(value.cellId) : '';
  const missionId = cleanId(value.missionId);
  const receiptId = cleanId(value.receiptId);
  const outcomeKind = cleanId(value.outcomeKind);
  const specialist = SPECIALIST_BY_MISSION.get(missionId);
  if (!encounterId || !cellId || !specialist || !receiptId || OUTCOME_TO_MISSION[outcomeKind] !== missionId) return null;
  return freeze({
    encounterId,
    cellId,
    missionId,
    receiptId,
    outcomeKind,
    resolvedAt: finite(value.resolvedAt),
    privateContentStored: false,
    rewardIssued: false,
    paymentClaimed: false
  });
}

function normalizeState(value = {}, now = Date.now()) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  let pending = null;
  const pendingEncounterId = cleanId(source.pending?.encounterId);
  const pendingCellId = CELL_ID.test(String(source.pending?.cellId || '')) ? String(source.pending.cellId) : '';
  const pendingMissionId = cleanId(source.pending?.missionId);
  const preparedAt = finite(source.pending?.preparedAt);
  if (pendingEncounterId && pendingCellId && SPECIALIST_BY_MISSION.has(pendingMissionId) && preparedAt > 0 && Math.max(0, finite(now) - preparedAt) <= MAX_PENDING_AGE_MS) {
    pending = freeze({ encounterId: pendingEncounterId, cellId: pendingCellId, missionId: pendingMissionId, preparedAt, privateContentStored: false });
  }
  const resolutions = [];
  const seen = new Set();
  for (const entry of Array.isArray(source.resolutions) ? source.resolutions : []) {
    const normalized = normalizeResolution(entry);
    if (!normalized || seen.has(normalized.encounterId)) continue;
    seen.add(normalized.encounterId);
    resolutions.push(normalized);
    if (resolutions.length >= MAX_RESOLUTIONS) break;
  }
  return { schema: EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA, pending, resolutions };
}

export function sanitizeEonCityLivingNexusEncounterState(value = {}, { now = Date.now() } = {}) {
  return freeze(normalizeState(value, now));
}

export function readEonCityLivingNexusEncounterState({ storage = globalThis.localStorage, now = Date.now() } = {}) {
  try { return sanitizeEonCityLivingNexusEncounterState(JSON.parse(storage?.getItem?.(EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY) || 'null') || {}, { now }); }
  catch { return sanitizeEonCityLivingNexusEncounterState({}, { now }); }
}

function readState(storage = globalThis.localStorage, now = Date.now()) {
  return readEonCityLivingNexusEncounterState({ storage, now });
}

function writeState(state, storage = globalThis.localStorage, now = Date.now()) {
  const normalized = normalizeState(state, now);
  try {
    storage?.setItem?.(EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch { return false; }
}

export function buildEonCityLivingNexusEncounter(cell = {}, { seed = 'eoncity-living-nexus', missionPlan = getEonCityProductiveRpgPlan({ storage: null }), state = normalizeState() } = {}) {
  const cellId = CELL_ID.test(String(cell.id || '')) ? String(cell.id) : `cell-${finite(cell.x)}-${finite(cell.z)}`;
  const specialist = specialistForCell({ ...cell, id: cellId }, seed);
  const mission = missionDefinitions(missionPlan).get(specialist.missionId);
  const position = encounterPosition({ ...cell, id: cellId }, seed);
  const encounterId = cleanId(`encounter:${cellId}:${specialist.id}`);
  const resolution = state.resolutions?.find?.((entry) => entry.encounterId === encounterId) || null;
  const pending = state.pending?.encounterId === encounterId;
  return freeze({
    schema: EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA,
    id: encounterId,
    cellId,
    specialistId: specialist.id,
    specialistName: specialist.name,
    specialistRole: specialist.role,
    landmarkLabel: specialist.landmark,
    missionId: specialist.missionId,
    missionTitle: mission?.title || specialist.missionId,
    requiredAction: mission?.requiredAction || '',
    privacyBoundary: mission?.privacyBoundary || '',
    route: mission?.route || '/eoncity',
    alternateRoute: mission?.alternateRoute || '',
    interpretation: specialist.interpretation,
    worldVerb: specialist.verb,
    position,
    interactionRadius: 3.1,
    state: resolution ? 'transformed' : pending ? 'prepared' : 'available',
    resolution,
    reviewFirst: true,
    requiresSeparateRouteConfirmation: true,
    executesWork: false,
    autonomousAgent: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    localOnly: true
  });
}

export function buildEonCityLivingNexusEncounters(cells = [], { seed = 'eoncity-living-nexus', storage = globalThis.localStorage, now = Date.now() } = {}) {
  const state = readState(storage, now);
  const missionPlan = getEonCityProductiveRpgPlan({ storage });
  return freeze((Array.isArray(cells) ? cells : [])
    .filter((cell) => cell?.residencyTier !== 'horizon' && cell?.interactive !== false)
    .slice(0, 9)
    .map((cell) => buildEonCityLivingNexusEncounter(cell, { seed, missionPlan, state })));
}

export function resolveNearestEonCityLivingNexusEncounter(position = {}, encounters = [], { maxDistance = 3.1 } = {}) {
  const point = { x: finite(position?.x), z: finite(position?.z) };
  let nearest = null;
  for (const encounter of Array.isArray(encounters) ? encounters : []) {
    const distance = Math.hypot(point.x - finite(encounter?.position?.x), point.z - finite(encounter?.position?.z));
    if (nearest && distance >= nearest.distance) continue;
    nearest = { ...encounter, distance: Math.round(distance * 10) / 10 };
  }
  return nearest && nearest.distance <= Math.max(0.5, finite(maxDistance, 3.1)) ? freeze(nearest) : null;
}

export function getEonCityLivingNexusEncounterSnapshot({ cells = [], seed = 'eoncity-living-nexus', storage = globalThis.localStorage, now = Date.now(), position = null } = {}) {
  const state = readState(storage, now);
  const encounters = buildEonCityLivingNexusEncounters(cells, { seed, storage, now });
  const nearest = position ? resolveNearestEonCityLivingNexusEncounter(position, encounters) : null;
  return freeze({
    schema: EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA,
    encounters,
    encounterCount: encounters.length,
    pending: state.pending,
    resolutions: freeze(state.resolutions),
    resolvedCount: state.resolutions.length,
    nearest,
    deterministic: true,
    localOnly: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false
  });
}

export function createEonCityLivingNexusEncounterController({ storage = globalThis.localStorage, now = () => Date.now(), getCells = () => [], getEncounters = null, getPosition = () => ({ x: 0, z: 0 }), seed = 'eoncity-living-nexus' } = {}) {
  let disposed = false;
  const clock = () => finite(now(), Date.now());
  const snapshot = () => {
    if (typeof getEncounters !== 'function') return getEonCityLivingNexusEncounterSnapshot({ cells: getCells(), seed, storage, now: clock(), position: getPosition() });
    const state = readState(storage, clock());
    const encounters = freeze((Array.isArray(getEncounters()) ? getEncounters() : []).map((entry) => {
      const resolution = state.resolutions.find((item) => item.encounterId === entry?.id) || null;
      const pending = state.pending?.encounterId === entry?.id;
      return freeze({ ...entry, state: resolution ? 'transformed' : pending ? 'prepared' : 'available', resolution, privateContentStored: false, rewardIssued: false, paymentClaimed: false });
    }));
    return freeze({
      schema: EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA,
      encounters,
      encounterCount: encounters.length,
      pending: state.pending,
      resolutions: freeze(state.resolutions),
      resolvedCount: state.resolutions.length,
      nearest: resolveNearestEonCityLivingNexusEncounter(getPosition(), encounters),
      deterministic: true, localOnly: true, automaticNavigation: false, automaticExecution: false, privateDataRead: false, privateContentStored: false, networkRequestCreated: false, rewardIssued: false, paymentClaimed: false
    });
  };
  const encounterById = (id) => snapshot().encounters.find((entry) => entry.id === String(id || '')) || null;
  return freeze({
    getSnapshot: snapshot,
    inspect(encounterId, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed', snapshot: snapshot() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      const encounter = encounterById(encounterId);
      return encounter ? freeze({ ok: true, encounter, snapshot: snapshot(), automaticExecution: false }) : freeze({ ok: false, reason: 'encounter-not-resident', snapshot: snapshot() });
    },
    interpret(encounterId, { explicitUserAction = false } = {}) {
      const result = this.inspect(encounterId, { explicitUserAction });
      if (!result.ok) return result;
      return freeze({ ok: true, encounter: result.encounter, interpretation: result.encounter.interpretation, eonbotMode: 'guide', providerRequestCreated: false, privateDataRead: false, snapshot: result.snapshot });
    },
    prepareMission(encounterId, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed', snapshot: snapshot() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      const encounter = encounterById(encounterId);
      if (!encounter) return freeze({ ok: false, reason: 'encounter-not-resident', snapshot: snapshot() });
      if (encounter.state === 'transformed') return freeze({ ok: true, reason: 'already-transformed', encounter, snapshot: snapshot() });
      const state = readState(storage, clock());
      const pending = freeze({ encounterId: encounter.id, cellId: encounter.cellId, missionId: encounter.missionId, preparedAt: clock(), privateContentStored: false });
      const stored = writeState({ ...state, pending }, storage, clock());
      const nextSnapshot = snapshot();
      return freeze({ ok: stored, reason: stored ? '' : 'local-storage-unavailable', encounter: nextSnapshot.encounters.find((entry) => entry.id === encounter.id) || encounter, pending, snapshot: nextSnapshot, opensRoute: false, automaticExecution: false });
    },
    cancelPending({ explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed', snapshot: snapshot() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      const state = readState(storage, clock());
      const stored = writeState({ ...state, pending: null }, storage, clock());
      return freeze({ ok: stored, reason: stored ? '' : 'local-storage-unavailable', snapshot: snapshot() });
    },
    syncVerifiedReturn({ explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed', resolved: null, snapshot: snapshot() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', resolved: null, snapshot: snapshot() });
      const state = readState(storage, clock());
      if (!state.pending) return freeze({ ok: true, reason: 'no-pending-encounter', resolved: null, snapshot: snapshot() });
      const mission = getEonCityProductiveRpgPlan({ storage }).missions.find((entry) => entry.id === state.pending.missionId);
      const outcome = mission?.outcome?.verified === true ? mission.outcome : null;
      if (!outcome || OUTCOME_TO_MISSION[outcome.kind] !== state.pending.missionId) {
        return freeze({ ok: true, reason: 'matching-verified-receipt-not-found', resolved: null, snapshot: snapshot(), fakeCompletion: false });
      }
      const resolution = normalizeResolution({
        ...state.pending,
        receiptId: outcome.receiptId,
        outcomeKind: outcome.kind,
        resolvedAt: outcome.verifiedAt || clock()
      });
      if (!resolution) return freeze({ ok: false, reason: 'verified-receipt-invalid', resolved: null, snapshot: snapshot() });
      const resolutions = [resolution, ...state.resolutions.filter((entry) => entry.encounterId !== resolution.encounterId)].slice(0, MAX_RESOLUTIONS);
      const stored = writeState({ ...state, pending: null, resolutions }, storage, clock());
      return freeze({ ok: stored, reason: stored ? '' : 'local-storage-unavailable', resolved: stored ? resolution : null, snapshot: snapshot(), privateContentStored: false, rewardIssued: false, paymentClaimed: false });
    },
    dispose() { disposed = true; return freeze({ ...snapshot(), disposed: true }); }
  });
}

export function validateEonCityLivingNexusEncounterSnapshot(snapshot = {}) {
  const errors = [];
  if (snapshot?.schema !== EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA) errors.push('schema-invalid');
  if (snapshot?.encounterCount !== snapshot?.encounters?.length) errors.push('encounter-count-invalid');
  for (const encounter of snapshot?.encounters || []) {
    if (!CELL_ID.test(String(encounter.cellId || '')) || !SAFE_ID.test(String(encounter.id || ''))) errors.push(`encounter-id-invalid:${encounter.id || 'unknown'}`);
    if (!SPECIALIST_BY_MISSION.has(encounter.missionId) || !String(encounter.route || '').startsWith('/')) errors.push(`mission-binding-invalid:${encounter.id}`);
    if (encounter.reviewFirst !== true || encounter.requiresSeparateRouteConfirmation !== true) errors.push(`review-boundary-invalid:${encounter.id}`);
    if (encounter.executesWork || encounter.autonomousAgent || encounter.automaticNavigation || encounter.automaticExecution || encounter.privateDataRead || encounter.privateContentStored || encounter.networkRequestCreated || encounter.rewardIssued || encounter.paymentClaimed) errors.push(`truth-boundary-invalid:${encounter.id}`);
  }
  if (snapshot?.automaticNavigation || snapshot?.automaticExecution || snapshot?.privateDataRead || snapshot?.privateContentStored || snapshot?.networkRequestCreated || snapshot?.rewardIssued || snapshot?.paymentClaimed) errors.push('global-truth-boundary-invalid');
  const serialised = JSON.stringify(snapshot);
  if (/api[_-]?key\s*[:=]\s*[a-z0-9._-]{12,}|bearer\s+[a-z0-9._-]{12,}|payment complete|reward earned|autonomous agent active/i.test(serialised)) errors.push('private-or-fake-claim-detected');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), encounterCount: snapshot?.encounterCount || 0, resolvedCount: snapshot?.resolvedCount || 0 });
}

export function getEonCityLivingNexusMissionIdForOutcomeKind(outcomeKind = '') {
  return OUTCOME_TO_MISSION[cleanId(outcomeKind)] || null;
}

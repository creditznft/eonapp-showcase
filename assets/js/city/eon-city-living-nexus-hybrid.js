/**
 * W660P / W667 — EONCITY: THE LIVING NEXUS hybrid streaming foundation.
 *
 * This module unifies the authored nine-district Core, deterministic local
 * Expanse cells and verified-receipt transformations without creating a second
 * assistant, project store, task store, renderer, canvas or navigation system.
 * It stores only coarse public-safe ids and bounded receipt references.
 */
import { getEonCityResidentCells } from './eon-city-cell-streamer.js';
import { getEonCityProductiveRpgPlan } from './eon-city-productive-rpg-loop.js';
import {
  EON_CITY_W667_PRACTICAL_WORLD_BOUND,
  buildEonCityW667WorldCell,
  getEonCityW667WorldGrammarSummary
} from './w667/eon-city-w667-expanse-world-grammar.js';

export const EON_CITY_LIVING_NEXUS_SCHEMA = 'eon.city.living-nexus-hybrid.w660p.v1';
export const EON_CITY_LIVING_NEXUS_STORAGE_KEY = 'eon:city:living-nexus:w660p:v1';
export const EON_CITY_EXPANSE_STREAMING_SCHEMA = 'eon.city.expanse-streaming.w667.v1';

const freeze = (value) => Object.freeze(value);
export const EON_CITY_LIVING_NEXUS_ENTRY_POSES = freeze({
  expanse: freeze({ destination: 'expanse', x: 48, y: 0, z: 5, heading: Math.PI / 2, cameraAlpha: -Math.PI / 2, cameraBeta: 1.04, cameraRadius: 12.8 }),
  'my-realm': freeze({ destination: 'my-realm', x: -48, y: 0, z: 0, heading: -Math.PI / 2, cameraAlpha: Math.PI / 2, cameraBeta: 1.02, cameraRadius: 11.4 }),
  realm: freeze({ destination: 'realm', x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI / 2, cameraBeta: 1.01, cameraRadius: 12.4 })
});
const MODES = freeze(['focus', 'explore']);
const DESTINATIONS = freeze(['core', 'expanse', 'my-realm']);
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;
const MAX_ATLAS_ENTRIES = 24;
const MAX_ATLAS_DISCOVERIES = 48;
const MAX_REALM_DISCOVERIES = 24;
const MAX_REALM_VISITS = 12;
const LIVING_NEXUS_WORLD_BOUND = EON_CITY_W667_PRACTICAL_WORLD_BOUND;
const CELL_SIZE = 10;
const EXPANSE_VISIBLE_RADIUS = 2;
const EXPANSE_INTERACTION_RADIUS = 1;

const OUTCOME_TRANSFORMATIONS = freeze({
  'orientation-receipt': freeze({ id: 'core-command-awakened', destination: 'core', location: 'orientation-hall', label: 'Orientation beacon awakened' }),
  'project-shell': freeze({ id: 'project-habitat-online', destination: 'core', location: 'project-district', label: 'Project habitat came online' }),
  'project-resume': freeze({ id: 'project-route-restored', destination: 'core', location: 'project-district', label: 'Project route restored' }),
  'local-ai-self-test': freeze({ id: 'device-lab-signal-live', destination: 'core', location: 'device-lab', label: 'Device Lab signal verified' }),
  'byok-provider-verification': freeze({ id: 'vault-provider-beacon-live', destination: 'core', location: 'trade-dome', label: 'Provider beacon verified' }),
  'creator-guide-artifact': freeze({ id: 'creator-atrium-gallery-ready', destination: 'core', location: 'creator-atrium', label: 'Creator gallery prepared' }),
  'automation-proposal': freeze({ id: 'automation-rail-planned', destination: 'expanse', location: 'automation-railworks', label: 'Automation rail plan appeared' }),
  'backup-readiness-receipt': freeze({ id: 'archive-vault-sealed', destination: 'my-realm', location: 'archive-sanctum', label: 'Archive sanctum sealed' }),
  'recovery-restore-receipt': freeze({ id: 'archive-return-path-lit', destination: 'my-realm', location: 'archive-sanctum', label: 'Archive return path illuminated' })
});

export const EON_CITY_LIVING_NEXUS_DESTINATIONS = freeze([
  freeze({ id: 'core', label: 'EONCITY CORE', state: 'available', summary: 'Nine authored districts, real terminals, EONBOT, NPCs, transit and productive work.' }),
  freeze({ id: 'expanse', label: 'THE EXPANSE', state: 'deterministic-infinite', summary: 'A seed-stable open world with coherent regions, varied streets, plazas, buildings, discoveries and rare landmarks streaming around the player.' }),
  freeze({ id: 'my-realm', label: 'MY REALM', state: 'local-foundation', summary: 'A private local reflection of verified bounded outcomes and world transformations.' })
]);

export const EON_CITY_LIVING_NEXUS_VERTICAL_SLICE = freeze([
  'leave-core', 'enter-expanse', 'discover-landmark', 'meet-functional-npc', 'review-productive-mission',
  'complete-native-action', 'transform-location', 'record-atlas', 'return-through-nexus', 'reflect-in-my-realm'
]);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-living-nexus')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}


function cleanId(value = '', fallback = '') {
  const text = String(value || '').trim().toLowerCase();
  return SAFE_ID.test(text) ? text : fallback;
}

function normalizePosition(position = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  return freeze({ x: Number.isFinite(x) ? Math.max(-LIVING_NEXUS_WORLD_BOUND, Math.min(LIVING_NEXUS_WORLD_BOUND, x)) : 0, z: Number.isFinite(z) ? Math.max(-LIVING_NEXUS_WORLD_BOUND, Math.min(LIVING_NEXUS_WORLD_BOUND, z)) : 0 });
}

function normalizeStoredState(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const mode = MODES.includes(String(source.mode)) ? String(source.mode) : 'explore';
  const destination = DESTINATIONS.includes(String(source.destination)) ? String(source.destination) : 'core';
  const selectedCellId = /^cell--?\d+--?\d+$/.test(String(source.selectedCellId || '')) ? String(source.selectedCellId) : '';
  const atlasEntries = [];
  const seen = new Set();
  for (const entry of Array.isArray(source.atlasEntries) ? source.atlasEntries : []) {
    const receiptId = cleanId(entry?.receiptId);
    const outcomeKind = cleanId(entry?.outcomeKind);
    const transformation = OUTCOME_TRANSFORMATIONS[outcomeKind];
    if (!receiptId || !transformation || seen.has(receiptId)) continue;
    seen.add(receiptId);
    atlasEntries.push(freeze({
      receiptId,
      outcomeKind,
      transformationId: transformation.id,
      destination: transformation.destination,
      location: transformation.location,
      verifiedAt: Number.isFinite(Number(entry?.verifiedAt)) ? Number(entry.verifiedAt) : 0,
      privateContentStored: false
    }));
    if (atlasEntries.length >= MAX_ATLAS_ENTRIES) break;
  }
  const atlasDiscoveries = [];
  const discoverySeen = new Set();
  for (const entry of Array.isArray(source.atlasDiscoveries) ? source.atlasDiscoveries : []) {
    const cellId = /^cell--?\d+--?\d+$/.test(String(entry?.cellId || '')) ? String(entry.cellId) : '';
    const seedRef = cleanId(entry?.seedRef);
    const visualIdentityId = cleanId(entry?.visualIdentityId);
    const roadPattern = cleanId(entry?.roadPattern);
    const gameplayPurpose = String(entry?.gameplayPurpose || '').trim().slice(0, 80);
    const discoveredAt = Number.isFinite(Number(entry?.discoveredAt)) ? Number(entry.discoveredAt) : 0;
    const key = `${seedRef}:${cellId}`;
    if (!cellId || !seedRef || !visualIdentityId || !roadPattern || !gameplayPurpose || !discoveredAt || discoverySeen.has(key)) continue;
    discoverySeen.add(key);
    atlasDiscoveries.push(freeze({ cellId, seedRef, visualIdentityId, roadPattern, gameplayPurpose, discoveredAt, privateContentStored: false, sharePermission: 'private' }));
    if (atlasDiscoveries.length >= MAX_ATLAS_DISCOVERIES) break;
  }
  const realmDiscoveries = [];
  const realmDiscoverySeen = new Set();
  for (const entry of Array.isArray(source.realmDiscoveries) ? source.realmDiscoveries : []) {
    const realmId = cleanId(entry?.realmId);
    const discoveryId = cleanId(entry?.discoveryId);
    const label = String(entry?.label || '').trim().slice(0, 80);
    const discoveredAt = Number.isFinite(Number(entry?.discoveredAt)) ? Number(entry.discoveredAt) : 0;
    const key = `${realmId}:${discoveryId}`;
    if (!realmId || !discoveryId || !label || !discoveredAt || realmDiscoverySeen.has(key)) continue;
    realmDiscoverySeen.add(key);
    realmDiscoveries.push(freeze({ realmId, discoveryId, label, discoveredAt, privateContentStored: false, sharePermission: 'private' }));
    if (realmDiscoveries.length >= MAX_REALM_DISCOVERIES) break;
  }
  const realmVisits = [];
  const realmVisitSeen = new Set();
  for (const entry of Array.isArray(source.realmVisits) ? source.realmVisits : []) {
    const realmId = cleanId(entry?.realmId);
    const portalId = cleanId(entry?.portalId);
    const enteredAt = Number.isFinite(Number(entry?.enteredAt)) ? Number(entry.enteredAt) : 0;
    if (!realmId || !portalId || !enteredAt || realmVisitSeen.has(realmId)) continue;
    realmVisitSeen.add(realmId);
    realmVisits.push(freeze({ realmId, portalId, enteredAt, privateContentStored: false, sharePermission: 'private' }));
    if (realmVisits.length >= MAX_REALM_VISITS) break;
  }
  const candidateReturnPoint = source.returnPoint && typeof source.returnPoint === 'object' ? source.returnPoint : null;
  const returnCellId = /^cell--?\d+--?\d+$/.test(String(candidateReturnPoint?.cellId || '')) ? String(candidateReturnPoint.cellId) : '';
  const returnSeedRef = cleanId(candidateReturnPoint?.seedRef);
  const returnX = Number(candidateReturnPoint?.x);
  const returnZ = Number(candidateReturnPoint?.z);
  const returnSetAt = Number(candidateReturnPoint?.setAt);
  const returnPoint = returnCellId && returnSeedRef && Number.isFinite(returnX) && Number.isFinite(returnZ) && Math.abs(returnX) <= LIVING_NEXUS_WORLD_BOUND && Math.abs(returnZ) <= LIVING_NEXUS_WORLD_BOUND && Number.isFinite(returnSetAt) && returnSetAt > 0
    ? freeze({ cellId: returnCellId, seedRef: returnSeedRef, x: returnX, z: returnZ, setAt: returnSetAt, privateContentStored: false, sharePermission: 'private', automaticNavigation: false })
    : null;
  return { schema: EON_CITY_LIVING_NEXUS_SCHEMA, mode, destination, selectedCellId, atlasEntries, atlasDiscoveries, realmDiscoveries, realmVisits, returnPoint, atlasSharePermission: 'private' };
}

export function sanitizeEonCityLivingNexusState(value = {}) {
  return freeze(normalizeStoredState(value));
}

export function readEonCityLivingNexusState({ storage = globalThis.localStorage } = {}) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CITY_LIVING_NEXUS_STORAGE_KEY) || 'null');
    return sanitizeEonCityLivingNexusState(parsed || {});
  } catch { return sanitizeEonCityLivingNexusState({}); }
}

function readState(storage = globalThis.localStorage) {
  return readEonCityLivingNexusState({ storage });
}

function writeState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(EON_CITY_LIVING_NEXUS_STORAGE_KEY, JSON.stringify(sanitizeEonCityLivingNexusState(state)));
    return true;
  } catch { return false; }
}

function buildSafeNavigationRoute(cell, pattern) {
  const baseX = cell.x * CELL_SIZE;
  const baseZ = cell.z * CELL_SIZE;
  const bend = (hash32(`${cell.id}:${pattern}`) % 5) - 2;
  return freeze({
    connectedToAllCardinalNeighbours: true,
    entry: 'west',
    exit: 'east',
    waypoints: freeze([
      freeze({ x: baseX + 1, z: baseZ + 5 }),
      freeze({ x: baseX + 5, z: baseZ + 5 + bend * 0.35 }),
      freeze({ x: baseX + 9, z: baseZ + 5 })
    ]),
    autoNavigation: false
  });
}

export function buildEonCityLivingNexusCell(cell = {}, { seed = 'eoncity-living-nexus' } = {}) {
  const x = Number.isInteger(Number(cell.x)) ? Number(cell.x) : 0;
  const z = Number.isInteger(Number(cell.z)) ? Number(cell.z) : 0;
  const id = /^cell--?\d+--?\d+$/.test(String(cell.id || '')) ? String(cell.id) : `cell-${x}-${z}`;
  const grammar = buildEonCityW667WorldCell({ x, z, seed });
  return freeze({
    ...grammar,
    id,
    role: ['current', 'adjacent', 'horizon'].includes(cell.role) ? cell.role : 'adjacent',
    residencyTier: cell.residencyTier === 'horizon' ? 'horizon' : 'interactive',
    interactive: cell.residencyTier !== 'horizon',
    distance: Number.isFinite(Number(cell.distance)) ? Number(cell.distance) : Math.max(Math.abs(x), Math.abs(z)),
    safeNavigationRoute: buildSafeNavigationRoute({ id, x, z }, grammar.roadGrammar.pattern),
    containsUserData: false,
    remoteNetwork: false
  });
}

export function buildEonCityLivingNexusExpanse({ position = { x: 0, z: 0 }, seed = 'eoncity-living-nexus' } = {}) {
  const point = normalizePosition(position);
  const resident = getEonCityResidentCells(point, { cellSize: CELL_SIZE, radius: EXPANSE_VISIBLE_RADIUS });
  const cells = resident.map((cell) => buildEonCityLivingNexusCell(cell, { seed }));
  return freeze({
    schema: EON_CITY_EXPANSE_STREAMING_SCHEMA,
    livingNexusSchema: EON_CITY_LIVING_NEXUS_SCHEMA,
    center: point,
    seedRef: hash32(seed).toString(36),
    cells: freeze(cells),
    cellCount: cells.length,
    residentCellCount: cells.length,
    visibleCellCount: cells.length,
    interactiveCellCount: cells.filter((entry) => entry.interactive).length,
    horizonCellCount: cells.filter((entry) => entry.residencyTier === 'horizon').length,
    visibleRadius: EXPANSE_VISIBLE_RADIUS,
    interactionRadius: EXPANSE_INTERACTION_RADIUS,
    currentCellId: cells.find((entry) => entry.role === 'current')?.id || null,
    allRoadsConnected: cells.every((entry) => entry.roadGrammar.connected && entry.safeNavigationRoute.connectedToAllCardinalNeighbours),
    deterministic: true,
    streamed: true,
    incrementalResidency: true,
    visibleHardBorder: false,
    practicallyInfinite: true,
    worldGrammar: getEonCityW667WorldGrammarSummary(),
    localOnly: true,
    binaryCellAssetsLoaded: false,
    remoteNetwork: false,
    containsUserData: false
  });
}

function getTransformations(state) {
  return freeze(state.atlasEntries.map((entry) => freeze({ ...entry, ...OUTCOME_TRANSFORMATIONS[entry.outcomeKind] })));
}

export function getEonCityLivingNexusSnapshot({ storage = globalThis.localStorage, position = { x: 0, z: 0 }, seed = 'eoncity-living-nexus', state: suppliedState = null } = {}) {
  const state = suppliedState ? normalizeStoredState(suppliedState) : readState(storage);
  const expanse = buildEonCityLivingNexusExpanse({ position, seed });
  const productive = getEonCityProductiveRpgPlan({ storage });
  const transformations = getTransformations(state);
  return freeze({
    schema: EON_CITY_LIVING_NEXUS_SCHEMA,
    productName: 'EONCITY: THE LIVING NEXUS',
    formula: 'Handcrafted Core + Living Streets + Seeded Expanse + Rare Realms + Productive Missions + Persistent Personal Transformation',
    mode: state.mode,
    destination: state.destination,
    selectedCellId: state.selectedCellId || expanse.currentCellId,
    destinations: EON_CITY_LIVING_NEXUS_DESTINATIONS,
    verticalSlice: EON_CITY_LIVING_NEXUS_VERTICAL_SLICE,
    expanse,
    productiveMissionCount: productive.totalCount,
    verifiedProductiveOutcomeCount: productive.completedCount,
    atlasEntries: freeze(state.atlasEntries.map((entry) => freeze({ ...entry }))),
    atlasDiscoveries: freeze(state.atlasDiscoveries.map((entry) => freeze({ ...entry }))),
    atlasDiscoveryCount: state.atlasDiscoveries.length,
    realmDiscoveries: freeze(state.realmDiscoveries.map((entry) => freeze({ ...entry }))),
    realmDiscoveryCount: state.realmDiscoveries.length,
    realmVisits: freeze(state.realmVisits.map((entry) => freeze({ ...entry }))),
    realmVisitCount: state.realmVisits.length,
    atlasReturnPoint: state.returnPoint ? freeze({ ...state.returnPoint }) : null,
    atlasSharePermission: 'private',
    transformations,
    myRealmTransformationCount: transformations.filter((entry) => entry.destination === 'my-realm').length,
    reviewFirst: true,
    autoNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    secondAssistantCreated: false,
    secondProjectStoreCreated: false,
    secondTaskStoreCreated: false,
    secondRenderLoopCreated: false,
    secondCanvasCreated: false
  });
}

export function createEonCityLivingNexusController({ storage = globalThis.localStorage, getPosition = () => ({ x: 0, z: 0 }), seed = 'eoncity-living-nexus' } = {}) {
  let disposed = false;
  let memoryState = readState(storage);
  const snapshot = () => getEonCityLivingNexusSnapshot({ storage, state: memoryState, position: getPosition?.() || { x: 0, z: 0 }, seed });
  const update = (patch = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'living-nexus-disposed', snapshot: snapshot() });
    const next = normalizeStoredState({ ...memoryState, ...patch });
    memoryState = next;
    const stored = writeState(next, storage);
    return freeze({ ok: true, persisted: stored, reason: stored ? '' : 'session-only-storage-unavailable', snapshot: snapshot() });
  };
  return freeze({
    getSnapshot: snapshot,
    setMode(mode, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      if (!MODES.includes(String(mode))) return freeze({ ok: false, reason: 'unknown-living-nexus-mode', snapshot: snapshot() });
      return update({ mode: String(mode) });
    },
    selectDestination(destination, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      if (!DESTINATIONS.includes(String(destination))) return freeze({ ok: false, reason: 'unknown-living-nexus-destination', snapshot: snapshot() });
      return update({ destination: String(destination) });
    },
    selectCell(cellId, { explicitUserAction = false } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      if (!current.expanse.cells.some((entry) => entry.id === String(cellId))) return freeze({ ok: false, reason: 'cell-not-resident', snapshot: current });
      return update({ selectedCellId: String(cellId), destination: 'expanse' });
    },
    recordAtlasCell(cellId, { explicitUserAction = false, now = Date.now() } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      const cell = current.expanse.cells.find((entry) => entry.id === String(cellId || ''));
      if (!cell) return freeze({ ok: false, reason: 'cell-not-resident', snapshot: current });
      const state = memoryState;
      const entry = freeze({
        cellId: cell.id,
        seedRef: current.expanse.seedRef,
        visualIdentityId: cell.visualIdentity.id,
        roadPattern: cell.roadGrammar.pattern,
        gameplayPurpose: cell.gameplayPurpose,
        discoveredAt: Number.isFinite(Number(now)) ? Number(now) : Date.now(),
        privateContentStored: false,
        sharePermission: 'private'
      });
      const key = `${entry.seedRef}:${entry.cellId}`;
      const atlasDiscoveries = [...state.atlasDiscoveries.filter((item) => `${item.seedRef}:${item.cellId}` !== key), entry].slice(-MAX_ATLAS_DISCOVERIES);
      return update({ atlasDiscoveries, selectedCellId: cell.id, destination: 'expanse' });
    },
    recordRealmVisit(realmId, portalId, { explicitUserAction = false, now = Date.now() } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      const safeRealmId = cleanId(realmId);
      const safePortalId = cleanId(portalId);
      if (!safeRealmId || !safePortalId) return freeze({ ok: false, reason: 'public-safe-realm-reference-required', snapshot: current });
      const state = memoryState;
      const entry = freeze({ realmId: safeRealmId, portalId: safePortalId, enteredAt: Number.isFinite(Number(now)) ? Number(now) : Date.now(), privateContentStored: false, sharePermission: 'private' });
      const realmVisits = [...state.realmVisits.filter((item) => item.realmId !== safeRealmId), entry].slice(-MAX_REALM_VISITS);
      return update({ realmVisits });
    },
    recordRealmDiscovery(realmId, discovery = {}, { explicitUserAction = false, now = Date.now() } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      const safeRealmId = cleanId(realmId);
      const discoveryId = cleanId(discovery?.id || discovery?.discoveryId);
      const label = String(discovery?.label || '').trim().slice(0, 80);
      if (!safeRealmId || !discoveryId || !label) return freeze({ ok: false, reason: 'public-safe-realm-discovery-required', snapshot: current });
      const state = memoryState;
      const entry = freeze({ realmId: safeRealmId, discoveryId, label, discoveredAt: Number.isFinite(Number(now)) ? Number(now) : Date.now(), privateContentStored: false, sharePermission: 'private' });
      const key = `${safeRealmId}:${discoveryId}`;
      const realmDiscoveries = [...state.realmDiscoveries.filter((item) => `${item.realmId}:${item.discoveryId}` !== key), entry].slice(-MAX_REALM_DISCOVERIES);
      return update({ realmDiscoveries });
    },
    setAtlasReturnPoint(cellId, { explicitUserAction = false, now = Date.now() } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      const cell = current.expanse.cells.find((entry) => entry.id === String(cellId || ''));
      if (!cell) return freeze({ ok: false, reason: 'cell-not-resident', snapshot: current });
      const returnPoint = freeze({
        cellId: cell.id,
        seedRef: current.expanse.seedRef,
        x: Math.max(-LIVING_NEXUS_WORLD_BOUND, Math.min(LIVING_NEXUS_WORLD_BOUND, cell.x * CELL_SIZE + CELL_SIZE / 2)),
        z: Math.max(-LIVING_NEXUS_WORLD_BOUND, Math.min(LIVING_NEXUS_WORLD_BOUND, cell.z * CELL_SIZE + CELL_SIZE / 2)),
        setAt: Number.isFinite(Number(now)) ? Number(now) : Date.now(),
        privateContentStored: false,
        sharePermission: 'private',
        automaticNavigation: false
      });
      const state = memoryState;
      const discoveryKey = `${returnPoint.seedRef}:${returnPoint.cellId}`;
      const discovery = freeze({ cellId: cell.id, seedRef: current.expanse.seedRef, visualIdentityId: cell.visualIdentity.id, roadPattern: cell.roadGrammar.pattern, gameplayPurpose: cell.gameplayPurpose, discoveredAt: returnPoint.setAt, privateContentStored: false, sharePermission: 'private' });
      const atlasDiscoveries = [...state.atlasDiscoveries.filter((item) => `${item.seedRef}:${item.cellId}` !== discoveryKey), discovery].slice(-MAX_ATLAS_DISCOVERIES);
      return update({ returnPoint, atlasDiscoveries, selectedCellId: cell.id, destination: 'expanse' });
    },
    clearAtlasReturnPoint({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      return update({ returnPoint: null });
    },
    prepareAtlasReturn({ explicitUserAction = false } = {}) {
      const state = memoryState;
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', returnPoint: null, snapshot: snapshot() });
      if (!state.returnPoint) return freeze({ ok: false, reason: 'atlas-return-point-unavailable', returnPoint: null, snapshot: snapshot() });
      const result = update({ destination: 'expanse', selectedCellId: state.returnPoint.cellId });
      return freeze({ ...result, returnPoint: freeze({ ...state.returnPoint }), explicitUserAction: true, automaticNavigation: false, opensRoute: false, privateContentStored: false });
    },
    recordVerifiedOutcome(outcome = {}, { explicitUserAction = false } = {}) {
      const current = snapshot();
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: current });
      const outcomeKind = cleanId(outcome.kind);
      const transformation = OUTCOME_TRANSFORMATIONS[outcomeKind];
      const receiptId = cleanId(outcome.receiptId);
      if (!transformation || !receiptId || outcome.verified !== true || !Number.isFinite(Number(outcome.verifiedAt))) {
        return freeze({ ok: false, reason: 'verified-bounded-outcome-required', snapshot: current });
      }
      const state = memoryState;
      if (state.atlasEntries.some((entry) => entry.receiptId === receiptId)) return freeze({ ok: true, reason: 'already-recorded', snapshot: current });
      const atlasEntry = freeze({
        receiptId,
        outcomeKind,
        transformationId: transformation.id,
        destination: transformation.destination,
        location: transformation.location,
        verifiedAt: Number(outcome.verifiedAt),
        privateContentStored: false
      });
      const atlasEntries = [...state.atlasEntries, atlasEntry].slice(-MAX_ATLAS_ENTRIES);
      return update({ atlasEntries, destination: transformation.destination === 'my-realm' ? 'my-realm' : state.destination });
    },
    syncVerifiedProductiveOutcomes({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      const plan = getEonCityProductiveRpgPlan({ storage });
      let recorded = 0;
      for (const mission of plan.missions) {
        if (!mission.outcome?.verified) continue;
        const result = this.recordVerifiedOutcome(mission.outcome, { explicitUserAction: true });
        if (result.ok && result.reason !== 'already-recorded') recorded += 1;
      }
      return freeze({ ok: true, recorded, snapshot: snapshot(), privateContentStored: false, rewardIssued: false });
    },
    clearLocalFoundation({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      try { storage?.removeItem?.(EON_CITY_LIVING_NEXUS_STORAGE_KEY); } catch {}
      memoryState = normalizeStoredState();
      return freeze({ ok: true, snapshot: snapshot() });
    },
    dispose() { disposed = true; return snapshot(); }
  });
}

export function validateEonCityLivingNexusSnapshot(snapshot = getEonCityLivingNexusSnapshot({ storage: null })) {
  const errors = [];
  if (snapshot?.schema !== EON_CITY_LIVING_NEXUS_SCHEMA) errors.push('schema-invalid');
  if (!MODES.includes(snapshot?.mode)) errors.push('mode-invalid');
  if (!DESTINATIONS.includes(snapshot?.destination)) errors.push('destination-invalid');
  if (snapshot?.destinations?.length !== 3) errors.push('three-destinations-required');
  if (snapshot?.verticalSlice?.length !== 10) errors.push('ten-step-vertical-slice-required');
  if (snapshot?.expanse?.cellCount !== 25 || snapshot?.expanse?.cells?.length !== 25) errors.push('deterministic-5x5-expanse-required');
  if (snapshot?.expanse?.interactiveCellCount !== 9 || snapshot?.expanse?.horizonCellCount !== 16) errors.push('expanse-streaming-tiers-invalid');
  if (snapshot?.expanse?.visibleHardBorder !== false || snapshot?.expanse?.incrementalResidency !== true) errors.push('expanse-streaming-authority-invalid');
  if (!snapshot?.expanse?.allRoadsConnected) errors.push('expanse-roads-must-connect');
  for (const cell of snapshot?.expanse?.cells || []) {
    if (!cell.roadGrammar?.connected || !cell.visualIdentity?.id || !cell.buildingComposition?.length || !cell.activityLayer || !cell.gameplayPurpose || !cell.safeNavigationRoute?.waypoints?.length) errors.push(`cell-grammar-incomplete:${cell.id || 'unknown'}`);
    if (cell.remoteNetwork || cell.containsUserData || cell.safeNavigationRoute.autoNavigation) errors.push(`cell-boundary-invalid:${cell.id || 'unknown'}`);
  }
  if (snapshot?.atlasDiscoveryCount !== snapshot?.atlasDiscoveries?.length || snapshot?.atlasDiscoveryCount > MAX_ATLAS_DISCOVERIES) errors.push('atlas-discovery-count-invalid');
  for (const discovery of snapshot?.atlasDiscoveries || []) {
    if (!/^cell--?\d+--?\d+$/.test(String(discovery.cellId || '')) || !SAFE_ID.test(String(discovery.seedRef || '')) || discovery.privateContentStored || discovery.sharePermission !== 'private') errors.push(`atlas-discovery-invalid:${discovery.cellId || 'unknown'}`);
  }
  if (snapshot?.realmDiscoveryCount !== snapshot?.realmDiscoveries?.length || snapshot?.realmDiscoveryCount > MAX_REALM_DISCOVERIES) errors.push('realm-discovery-count-invalid');
  for (const discovery of snapshot?.realmDiscoveries || []) {
    if (!SAFE_ID.test(String(discovery.realmId || '')) || !SAFE_ID.test(String(discovery.discoveryId || '')) || !String(discovery.label || '').trim() || discovery.privateContentStored || discovery.sharePermission !== 'private') errors.push(`realm-discovery-invalid:${discovery.discoveryId || 'unknown'}`);
  }
  if (snapshot?.realmVisitCount !== snapshot?.realmVisits?.length || snapshot?.realmVisitCount > MAX_REALM_VISITS) errors.push('realm-visit-count-invalid');
  for (const visit of snapshot?.realmVisits || []) {
    if (!SAFE_ID.test(String(visit.realmId || '')) || !SAFE_ID.test(String(visit.portalId || '')) || !Number.isFinite(Number(visit.enteredAt)) || visit.privateContentStored || visit.sharePermission !== 'private') errors.push(`realm-visit-invalid:${visit.realmId || 'unknown'}`);
  }
  if (snapshot?.atlasReturnPoint && (!/^cell--?\d+--?\d+$/.test(String(snapshot.atlasReturnPoint.cellId || '')) || Math.abs(Number(snapshot.atlasReturnPoint.x)) > LIVING_NEXUS_WORLD_BOUND || Math.abs(Number(snapshot.atlasReturnPoint.z)) > LIVING_NEXUS_WORLD_BOUND || snapshot.atlasReturnPoint.privateContentStored || snapshot.atlasReturnPoint.sharePermission !== 'private' || snapshot.atlasReturnPoint.automaticNavigation)) errors.push('atlas-return-point-invalid');
  if (snapshot?.atlasSharePermission !== 'private') errors.push('atlas-share-permission-invalid');
  if (snapshot?.autoNavigation || snapshot?.automaticExecution || snapshot?.privateDataRead || snapshot?.privateContentStored || snapshot?.networkRequestCreated || snapshot?.rewardIssued || snapshot?.paymentClaimed) errors.push('truth-boundary-invalid');
  if (snapshot?.secondAssistantCreated || snapshot?.secondProjectStoreCreated || snapshot?.secondTaskStoreCreated || snapshot?.secondRenderLoopCreated || snapshot?.secondCanvasCreated) errors.push('duplicate-system-created');
  const serialised = JSON.stringify(snapshot);
  if (/api[-_ ]?key|password|secret|wallet seed|private key|payment complete|reward earned|autonomous completion/i.test(serialised)) errors.push('sensitive-or-fake-claim-detected');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), cellCount: snapshot?.expanse?.cellCount || 0, destinationCount: snapshot?.destinations?.length || 0, transformationCount: snapshot?.transformations?.length || 0 });
}

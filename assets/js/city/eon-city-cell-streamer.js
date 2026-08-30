/**
 * W569 / W667 — client-first streamed City cell residency and disposal authority.
 *
 * The current City contains no binary cell package. This module keeps a
 * local residency plan and deterministic cleanup ownership ready for future
 * approved static assets. It never fetches, proxies, stores, or names private
 * work/account/project content.
 */
export const EON_CITY_CELL_RESIDENCY_SCHEMA = 'eon.city.cell-residency.w569.v1';
export const EON_CITY_STATIC_CELL_MANIFEST_SCHEMA = 'eon.city.static-cell-manifest.w569.v1';
export const EON_CITY_CELL_STREAMING_AUTHORITY_SCHEMA = 'eon.city.cell-streaming-authority.w667.v1';

const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const RESOURCE_KINDS = new Set(['mesh', 'material', 'texture', 'particle', 'observer', 'sound', 'timer', 'asset-container']);
const SAFE_CELL_ID = /^cell--?\d+--?\d+$/;
const SAFE_ASSET_ID = /^[a-z0-9][a-z0-9-]{2,79}$/;
const SAFE_STATIC_PATH = /^\/assets\/city\/cells\/[a-z0-9][a-z0-9/_-]*\.(?:glb|ktx2|png|webp|ogg|mp3)$/i;
const MAX_COORDINATE = 2048;
export const EON_CITY_CELL_SIZE = 10;
const DEFAULT_RADIUS = 1;
const MAX_RADIUS = 2;
const freeze = (value) => Object.freeze(value);
const exactKeys = (value, keys) => Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const resolvedQuality = (quality) => VALID_QUALITY.has(String(quality)) ? String(quality) : 'balanced';

/**
 * No binary/static asset is registered during W569. Future entries must pass
 * W566 provenance, W567 packaging, edge policy and actual device proof first.
 */
export const EON_CITY_STATIC_CELL_MANIFEST = freeze({
  schema: EON_CITY_STATIC_CELL_MANIFEST_SCHEMA,
  sourceOnly: true,
  binaryAssets: false,
  remoteNetwork: false,
  containsUserData: false,
  entries: freeze([])
});

export const EON_CITY_CELL_DISPOSAL_REQUIREMENTS = freeze([
  'mesh geometry and hierarchy ownership',
  'material and texture ownership',
  'particle system stop and dispose',
  'observer removal',
  'sound stop and dispose',
  'timer cancellation',
  'asset-container release',
  'no private work data in cell identity or manifest'
]);

function normalizeCellSize(value = EON_CITY_CELL_SIZE) {
  return Math.max(4, Math.min(64, Number(value) || EON_CITY_CELL_SIZE));
}

function normalizeRadius(value = DEFAULT_RADIUS) {
  return Math.max(1, Math.min(MAX_RADIUS, Math.floor(Number(value) || DEFAULT_RADIUS)));
}

function expectedCellCount(radius = DEFAULT_RADIUS) {
  const resolvedRadius = normalizeRadius(radius);
  return (resolvedRadius * 2 + 1) ** 2;
}

function normalizePosition(position = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!finite(x, -MAX_COORDINATE, MAX_COORDINATE) || !finite(z, -MAX_COORDINATE, MAX_COORDINATE)) return null;
  return freeze({ x: Math.round(x * 1000) / 1000, z: Math.round(z * 1000) / 1000 });
}

export function getEonCityCellId(position = {}, { cellSize = EON_CITY_CELL_SIZE } = {}) {
  const point = normalizePosition(position);
  if (!point) return null;
  const size = normalizeCellSize(cellSize);
  const cellX = Math.floor(point.x / size);
  const cellZ = Math.floor(point.z / size);
  return `cell-${cellX}-${cellZ}`;
}

function parseCellId(cellId = '') {
  const match = /^cell-(-?\d+)-(-?\d+)$/.exec(String(cellId || ''));
  if (!match) return null;
  const x = Number(match[1]);
  const z = Number(match[2]);
  if (!Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 512 || Math.abs(z) > 512) return null;
  return freeze({ x, z });
}

function cellDescriptor(x, z, { cellSize, role, distance, residencyTier }) {
  return freeze({
    id: `cell-${x}-${z}`, x, z, cellSize, role, distance, residencyTier,
    interactive: residencyTier !== 'horizon',
    localOnly: true, privateContent: false,
    privateDataRead: false, networkRequestCreated: false
  });
}

/** Returns a deterministic 3×3 interaction window or 5×5 visible horizon. */
export function getEonCityResidentCells(position = {}, { cellSize = EON_CITY_CELL_SIZE, radius = DEFAULT_RADIUS } = {}) {
  const point = normalizePosition(position);
  if (!point) return freeze([]);
  const size = normalizeCellSize(cellSize);
  const resolvedRadius = normalizeRadius(radius);
  const current = parseCellId(getEonCityCellId(point, { cellSize: size }));
  if (!current) return freeze([]);
  const cells = [];
  for (let z = current.z - resolvedRadius; z <= current.z + resolvedRadius; z += 1) {
    for (let x = current.x - resolvedRadius; x <= current.x + resolvedRadius; x += 1) {
      const distance = Math.max(Math.abs(x - current.x), Math.abs(z - current.z));
      const role = distance === 0 ? 'current' : distance <= 1 ? 'adjacent' : 'horizon';
      cells.push(cellDescriptor(x, z, { cellSize: size, role, distance, residencyTier: distance <= 1 ? 'interactive' : 'horizon' }));
    }
  }
  return freeze(cells);
}

export function getEonCityResidentCellIds({ position = { x: 0, z: 0 }, cellSize = EON_CITY_CELL_SIZE, radius = DEFAULT_RADIUS } = {}) {
  return freeze(getEonCityResidentCells(position, { cellSize, radius }).map((cell) => cell.id));
}

export function getEonCityCellResidencyPlan({ position = { x: 0, z: 0 }, quality = 'balanced', cellSize = EON_CITY_CELL_SIZE, radius = DEFAULT_RADIUS } = {}) {
  const point = normalizePosition(position);
  const cells = getEonCityResidentCells(point || {}, { cellSize, radius });
  const current = cells.find((cell) => cell.role === 'current') || null;
  return freeze({
    schema: EON_CITY_CELL_RESIDENCY_SCHEMA,
    quality: resolvedQuality(quality),
    position: point,
    currentCellId: current?.id || null,
    cells,
    residentCellCount: cells.length,
    expectedResidentCellCount: expectedCellCount(radius),
    interactiveCellCount: cells.filter((cell) => cell.interactive).length,
    horizonCellCount: cells.filter((cell) => cell.residencyTier === 'horizon').length,
    staticManifestEntryCount: EON_CITY_STATIC_CELL_MANIFEST.entries.length,
    staticAssetsLoaded: false,
    remoteNetwork: false,
    containsUserData: false,
    automaticCrossDeviceSync: false
  });
}

/** A future static cell entry is direct same-origin only and never active in W569. */
export function inspectEonCityStaticCellEntry(entry = {}) {
  const errors = [];
  const value = entry && typeof entry === 'object' ? entry : {};
  if (!exactKeys(value, ['cellId', 'assetId', 'path', 'stage', 'binaryPresent', 'runtimeLoadEnabled', 'containsUserData', 'remoteNetwork'])) errors.push('entry-has-unknown-or-sensitive-fields');
  if (!SAFE_CELL_ID.test(String(value.cellId || '')) || !parseCellId(value.cellId)) errors.push('entry-cell-id-invalid');
  if (!SAFE_ASSET_ID.test(String(value.assetId || ''))) errors.push('entry-asset-id-invalid');
  if (!SAFE_STATIC_PATH.test(String(value.path || '')) || String(value.path || '').includes('..')) errors.push('entry-path-must-be-direct-same-origin-static');
  if (value.stage !== 'planned-static-direct-delivery') errors.push('entry-stage-must-remain-planned');
  if (value.binaryPresent !== false || value.runtimeLoadEnabled !== false) errors.push('entry-cannot-claim-binary-or-runtime-load');
  if (value.containsUserData !== false || value.remoteNetwork !== false) errors.push('entry-must-not-contain-user-data-or-remote-network');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function validateEonCityStaticCellManifest(manifest = EON_CITY_STATIC_CELL_MANIFEST) {
  const errors = [];
  const value = manifest && typeof manifest === 'object' ? manifest : {};
  if (!exactKeys(value, ['schema', 'sourceOnly', 'binaryAssets', 'remoteNetwork', 'containsUserData', 'entries'])) errors.push('manifest-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_STATIC_CELL_MANIFEST_SCHEMA) errors.push('manifest-schema-invalid');
  if (value.sourceOnly !== true || value.binaryAssets !== false || value.remoteNetwork !== false || value.containsUserData !== false) errors.push('manifest-truth-flags-invalid');
  if (!Array.isArray(value.entries) || value.entries.length !== 0) errors.push('manifest-must-remain-empty-until-proof-complete');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), registeredEntryCount: Array.isArray(value.entries) ? value.entries.length : 0 });
}

function disposeRecord(record = {}) {
  try { record?.dispose?.(); } catch {}
  return true;
}

/**
 * Local cell controller. Resource ownership is explicit: callers register an
 * idempotent disposer against a local public cell id, then exit/dispose releases
 * it. No handler has an implicit network, storage, or identity side effect.
 */
export function createEonCityCellResidencyController({ quality = 'balanced', cellSize = EON_CITY_CELL_SIZE, radius = DEFAULT_RADIUS, onEnter = null, onLeave = null } = {}) {
  const state = {
    quality: resolvedQuality(quality),
    cellSize: normalizeCellSize(cellSize),
    radius: normalizeRadius(radius),
    currentCellId: null,
    resident: new Map(),
    resources: new Map(),
    disposed: false,
    transitions: []
  };

  const getSummary = () => freeze({
    schema: EON_CITY_CELL_RESIDENCY_SCHEMA,
    quality: state.quality,
    cellSize: state.cellSize,
    radius: state.radius,
    currentCellId: state.currentCellId,
    residentCellIds: freeze([...state.resident.keys()].sort()),
    residentCellCount: state.resident.size,
    expectedResidentCellCount: expectedCellCount(state.radius),
    interactiveCellCount: [...state.resident.values()].filter((cell) => cell.interactive).length,
    horizonCellCount: [...state.resident.values()].filter((cell) => cell.residencyTier === 'horizon').length,
    registeredResourceCount: [...state.resources.values()].reduce((count, entries) => count + entries.length, 0),
    staticManifestEntryCount: EON_CITY_STATIC_CELL_MANIFEST.entries.length,
    staticAssetsLoaded: false,
    remoteNetwork: false,
    containsUserData: false,
    disposed: state.disposed,
    transitions: freeze(state.transitions.slice(-24).map((entry) => freeze({ ...entry })))
  });

  const releaseCell = (cellId, reason = 'cell-left') => {
    const entries = state.resources.get(cellId) || [];
    entries.forEach(disposeRecord);
    state.resources.delete(cellId);
    state.resident.delete(cellId);
    state.transitions.push({ type: 'leave', cellId, reason, releasedResourceCount: entries.length });
    if (state.transitions.length > 40) state.transitions.splice(0, state.transitions.length - 40);
    try { onLeave?.(freeze({ cellId, reason, releasedResourceCount: entries.length, localOnly: true })); } catch {}
  };

  return freeze({
    schema: EON_CITY_CELL_RESIDENCY_SCHEMA,
    update(position = {}) {
      if (state.disposed) return freeze({ ok: false, error: 'cell-residency-disposed', summary: getSummary() });
      const plan = getEonCityCellResidencyPlan({ position, quality: state.quality, cellSize: state.cellSize, radius: state.radius });
      if (!plan.position || plan.cells.length !== expectedCellCount(state.radius)) return freeze({ ok: false, error: 'cell-position-invalid', summary: getSummary() });
      const next = new Map(plan.cells.map((cell) => [cell.id, cell]));
      const unloaded = [...state.resident.keys()].filter((cellId) => !next.has(cellId));
      unloaded.forEach((cellId) => releaseCell(cellId, 'cell-left-residency-window'));
      const entered = [];
      for (const [cellId, cell] of next) {
        if (state.resident.has(cellId)) continue;
        state.resident.set(cellId, cell);
        entered.push(cellId);
        state.transitions.push({ type: 'enter', cellId, role: cell.role });
        if (state.transitions.length > 40) state.transitions.splice(0, state.transitions.length - 40);
        try { onEnter?.(freeze({ cellId, role: cell.role, localOnly: true })); } catch {}
      }
      state.currentCellId = plan.currentCellId;
      return freeze({ ok: true, currentCellId: plan.currentCellId, entered: freeze(entered), unloaded: freeze(unloaded), residentCellCount: state.resident.size, summary: getSummary() });
    },
    registerResource(cellId = '', { kind = '', dispose = null } = {}) {
      if (state.disposed) return false;
      if (!state.resident.has(String(cellId)) || !RESOURCE_KINDS.has(String(kind)) || typeof dispose !== 'function') return false;
      const entries = state.resources.get(String(cellId)) || [];
      entries.push(freeze({ kind: String(kind), dispose }));
      state.resources.set(String(cellId), entries);
      return true;
    },
    releaseCell(cellId = '', { reason = 'explicit-local-release' } = {}) {
      if (state.disposed || !state.resident.has(String(cellId))) return false;
      releaseCell(String(cellId), String(reason || 'explicit-local-release'));
      return true;
    },
    getSummary,
    dispose() {
      if (state.disposed) return getSummary();
      [...state.resident.keys()].forEach((cellId) => releaseCell(cellId, 'city-runtime-dispose'));
      state.disposed = true;
      return getSummary();
    }
  });
}

export function getEonCityCellStreamerTruth({ quality = 'balanced' } = {}) {
  const manifest = validateEonCityStaticCellManifest();
  const plan = getEonCityCellResidencyPlan({ quality });
  return freeze({
    schema: EON_CITY_CELL_RESIDENCY_SCHEMA,
    quality: plan.quality,
    manifestValid: manifest.ok,
    registeredStaticCellEntries: manifest.registeredEntryCount,
    residentCellCount: plan.residentCellCount,
    staticAssetsLoaded: false,
    directStaticManifestOnly: true,
    pagesFunctionProxy: false,
    remoteNetwork: false,
    containsUserData: false,
    browserMemoryProofCaptured: false,
    deviceStreamingProofCaptured: false
  });
}

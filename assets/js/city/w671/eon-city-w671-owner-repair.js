/**
 * W671 — owner-observed City repair authority and first N3/C3 bridge.
 *
 * Pure helpers only: canonical player-facing alignment, district-boundary
 * stabilization, and the readable two-dimensional Atlas projection used by the
 * productive City shell. This module owns no renderer, route, storage, task,
 * voice, billing, network, or private project state.
 */
export const EON_CITY_W671_OWNER_REPAIR_SCHEMA = 'eon.city.w671.owner-repair.v1';
export const EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET = 0;
export const EON_CITY_W671_DISTRICT_HOLD_MS = 520;

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeEonCityW671Heading(value = 0) {
  let angle = finite(value);
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function resolveEonCityW671PlayerVisualHeading(worldHeading = 0, modelHeadingOffset = EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET) {
  return normalizeEonCityW671Heading(finite(worldHeading) + finite(modelHeadingOffset));
}

export function createEonCityW671DistrictBoundaryStabilizer({ holdMs = EON_CITY_W671_DISTRICT_HOLD_MS } = {}) {
  const requiredHoldMs = clamp(finite(holdMs, EON_CITY_W671_DISTRICT_HOLD_MS), 0, 5_000);
  let currentId = '';
  let candidateId = '';
  let candidateMs = 0;

  return freeze({
    reset(nextCurrentId = '') {
      currentId = clean(nextCurrentId);
      candidateId = '';
      candidateMs = 0;
      return currentId;
    },
    update({ currentDistrictId = currentId, candidateDistrictId = '', deltaSeconds = 0.016, force = false } = {}) {
      currentId = clean(currentDistrictId) || currentId;
      const next = clean(candidateDistrictId) || currentId;
      if (!currentId) {
        currentId = next;
        candidateId = '';
        candidateMs = 0;
        return freeze({ districtId: currentId, changed: true, pendingDistrictId: '', pendingMs: 0, requiredHoldMs });
      }
      if (force || next === currentId) {
        const changed = force && next !== currentId;
        currentId = next;
        candidateId = '';
        candidateMs = 0;
        return freeze({ districtId: currentId, changed, pendingDistrictId: '', pendingMs: 0, requiredHoldMs });
      }
      if (candidateId !== next) {
        candidateId = next;
        candidateMs = 0;
      }
      candidateMs += clamp(finite(deltaSeconds, 0.016) * 1_000, 0, 250);
      if (candidateMs < requiredHoldMs) {
        return freeze({ districtId: currentId, changed: false, pendingDistrictId: candidateId, pendingMs: Math.round(candidateMs), requiredHoldMs });
      }
      currentId = candidateId;
      candidateId = '';
      candidateMs = 0;
      return freeze({ districtId: currentId, changed: true, pendingDistrictId: '', pendingMs: 0, requiredHoldMs });
    },
    getSnapshot() {
      return freeze({ districtId: currentId, pendingDistrictId: candidateId, pendingMs: Math.round(candidateMs), requiredHoldMs });
    }
  });
}

function atlasCoordinate(value, min, max) {
  if (max <= min) return 50;
  return Number((8 + ((finite(value) - min) / (max - min)) * 84).toFixed(2));
}

export function buildEonCityW671AtlasModel(districts = [], currentDistrictId = '') {
  const rows = (Array.isArray(districts) ? districts : []).filter((entry) => entry?.id && Number.isFinite(Number(entry?.center?.x)) && Number.isFinite(Number(entry?.center?.z)));
  const xs = rows.map((entry) => finite(entry.center.x));
  const zs = rows.map((entry) => finite(entry.center.z));
  const minX = Math.min(...xs, 0); const maxX = Math.max(...xs, 0);
  const minZ = Math.min(...zs, 0); const maxZ = Math.max(...zs, 0);
  const activeId = clean(currentDistrictId);
  const nodes = rows.map((entry) => freeze({
    id: clean(entry.id),
    label: String(entry.label || entry.id),
    purpose: String(entry.purpose || ''),
    x: atlasCoordinate(entry.center.x, minX, maxX),
    y: atlasCoordinate(-finite(entry.center.z), -maxZ, -minZ),
    active: clean(entry.id) === activeId,
    accent: String(entry?.palette?.accent || '#69e7ff'),
    warm: String(entry?.palette?.warm || '#f4b860')
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const links = [];
  const seen = new Set();
  for (const node of nodes) {
    const nearest = nodes
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - node.x, candidate.y - node.y) }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 2);
    for (const { candidate } of nearest) {
      const key = [node.id, candidate.id].sort().join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(freeze({ id: key, from: node.id, to: candidate.id }));
    }
  }
  return freeze({
    schema: `${EON_CITY_W671_OWNER_REPAIR_SCHEMA}.atlas.v1`,
    currentDistrictId: nodeById.has(activeId) ? activeId : (nodes[0]?.id || ''),
    nodes: freeze(nodes),
    links: freeze(links),
    readable2dFirst: true,
    automaticTravel: false,
    privateContentRead: false
  });
}

export function getEonCityW671OwnerRepairTruth() {
  return freeze({
    schema: EON_CITY_W671_OWNER_REPAIR_SCHEMA,
    playerFacingUsesCanonicalMovementHeading: true,
    invertedModelOffsetRemoved: true,
    idleAnimationRecoveryRequired: true,
    districtBoundaryDwellRequired: true,
    atlasVisibleFromPrimaryDock: true,
    atlasReadable2dFirst: true,
    overlayCollisionForbidden: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticTravel: false,
    remoteNetwork: false
  });
}

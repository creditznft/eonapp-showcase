/**
 * W624F — bounded Command District NPC production system.
 *
 * The system is local presentation and wayfinding only. It cannot read private
 * work, navigate, execute tasks, call providers, claim jobs, or mutate account,
 * billing, referral, Vault, project, or commercial state.
 */
import {
  EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES,
  EON_CITY_COMMAND_DISTRICT_PATHS,
  EON_CITY_COMMAND_DISTRICT_SPAWN,
  EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS
} from './eon-city-command-district-vertical-slice.js';

export const EON_CITY_COMMAND_DISTRICT_NPC_SCHEMA = 'eon.city.command-district-npc-system.w624f.v1';
export const EON_CITY_COMMAND_DISTRICT_NPC_STATES = Object.freeze([
  'idle', 'navigate', 'work', 'talk', 'listen', 'point', 'wait', 'recover', 'unavailable'
]);

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim().toLowerCase();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const PATHS = new Map(EON_CITY_COMMAND_DISTRICT_PATHS.map((entry) => [entry.id, entry]));

export const EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES = freeze([
  freeze({
    id: 'project-guide', title: 'Project Guide', castName: 'Mira', silhouette: 'short graphite field coat, cyan route baton and compact project satchel', accent: '#55f4e2',
    role: 'Explains the private-by-default Projects return path without reading project names, files, prompts or content.', landmarkId: 'project-dock', pathId: 'project-branch',
    routes: freeze([{ label: 'Projects', route: '/projects' }]), boundary: 'private-project-list-only', truthRule: 'No project activity, success, sync or progress is implied.'
  }),
  freeze({
    id: 'creator-technician', title: 'Creator Technician', castName: 'Tavi', silhouette: 'violet utility mantle, asymmetric tool halo and warm wrist light', accent: '#b792ff',
    role: 'Explains user-started creation and build surfaces without claiming generation, publishing, deployment or provider activity.', landmarkId: 'creator-portal', pathId: 'creator-branch',
    routes: freeze([{ label: 'Create', route: '/create' }, { label: 'EON Forge', route: '/forge' }]), boundary: 'user-started-authoring-only', truthRule: 'No creation, build, repository or deployment is already running.'
  }),
  freeze({
    id: 'automation-operator', title: 'Automation Operator', castName: 'Oren', silhouette: 'amber signal collar, narrow operator coat and dormant receipt slate', accent: '#f7bd62',
    role: 'Explains the proof-gated Automations surface and keeps all job state visibly dormant until a genuine receipt exists.', landmarkId: 'agent-theatre', pathId: 'agent-branch',
    routes: freeze([{ label: 'Automations', route: '/automations' }]), boundary: 'proof-gated-dormant', truthRule: 'No job, queue, customer, schedule, provider call or external action is invented.'
  }),
  freeze({
    id: 'archive-workspace-guide', title: 'Archive & Workspace Guide', castName: 'Sera', silhouette: 'mint archive cape, split cyan signal fin and low-profile index lens', accent: '#81e6c6',
    role: 'Explains saved-output and workspace routes without exposing document titles, live feeds, recipients or sharing activity.', landmarkId: 'archive-canopy', pathId: 'archive-branch',
    routes: freeze([{ label: 'Library', route: '/library' }, { label: 'Workspace', route: '/workspace' }]), boundary: 'saved-content-hidden', truthRule: 'No document, live feed, message, share, post or recipient state is exposed.'
  })
]);

const ARCHETYPE_BY_ID = new Map(EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => [entry.id, entry]));

export const EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES = freeze({
  disabled: freeze({ id: 'disabled', activeCount: 0, detail: 'none', motionEnabled: false, updateHz: 0, readableFaces: false }),
  lite: freeze({ id: 'lite', activeCount: 2, detail: 'silhouette', motionEnabled: true, updateHz: 4, readableFaces: false }),
  balanced: freeze({ id: 'balanced', activeCount: 4, detail: 'readable', motionEnabled: true, updateHz: 12, readableFaces: true }),
  cinematic: freeze({ id: 'cinematic', activeCount: 4, detail: 'authored', motionEnabled: true, updateHz: 24, readableFaces: true })
});

function resolveLod(value = 'balanced') {
  const id = clean(value);
  return EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES[id] || EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES.balanced;
}

function pathPoint(path, ratio, index, direction = 1) {
  const x = finite(path?.from?.x) + ((finite(path?.to?.x) - finite(path?.from?.x)) * ratio);
  const z = finite(path?.from?.z) + ((finite(path?.to?.z) - finite(path?.from?.z)) * ratio);
  const dx = finite(path?.to?.x) - finite(path?.from?.x);
  const dz = finite(path?.to?.z) - finite(path?.from?.z);
  const length = Math.max(.001, Math.hypot(dx, dz));
  const side = (index % 2 ? 1 : -1) * direction;
  const offset = .12 * side;
  return freeze({ x: x + ((-dz / length) * offset), y: 0, z: z + ((dx / length) * offset) });
}

function nearestDistance(point, entries) {
  return Math.min(...entries.map((entry) => Math.hypot(point.x - entry.x, point.z - entry.z)));
}

function buildEntity(archetype, index, lod) {
  const path = PATHS.get(archetype.pathId);
  const start = pathPoint(path, .08, index, 1);
  const end = pathPoint(path, .5, index, -1);
  return freeze({
    id: `command-npc-${archetype.id}`,
    archetypeId: archetype.id,
    castName: archetype.castName,
    title: archetype.title,
    accent: archetype.accent,
    silhouette: archetype.silhouette,
    landmarkId: archetype.landmarkId,
    pathId: archetype.pathId,
    path: freeze({ start, end, width: path.width }),
    state: lod.motionEnabled ? 'navigate' : 'idle',
    detail: lod.detail,
    readableFace: lod.readableFaces,
    active: index < lod.activeCount,
    localOnly: true,
    presentationOnly: true,
    interactiveReviewOnly: true,
    collisionRadius: .34,
    minSpawnDistance: Math.round(nearestDistance(start, [EON_CITY_COMMAND_DISTRICT_SPAWN]) * 100) / 100,
    minUnstuckDistance: Math.round(Math.min(nearestDistance(start, EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS), nearestDistance(end, EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS)) * 100) / 100
  });
}

export function getEonCityCommandDistrictNpcPlan({ lod = 'balanced' } = {}) {
  const profile = resolveLod(lod);
  const entities = EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry, index) => buildEntity(entry, index, profile));
  return freeze({
    schema: EON_CITY_COMMAND_DISTRICT_NPC_SCHEMA,
    lod: profile,
    states: EON_CITY_COMMAND_DISTRICT_NPC_STATES,
    archetypes: EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES,
    entities: freeze(entities),
    activeEntities: freeze(entities.filter((entry) => entry.active)),
    authoredPathIds: freeze([...new Set(entities.map((entry) => entry.pathId))]),
    localOnly: true,
    presentationOnly: true,
    autoNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    browserStorageWritten: false,
    networkRequestCreated: false,
    operationalStateClaimed: false,
    commercialStateClaimed: false
  });
}

export function getEonCityCommandDistrictNpcReview(archetypeId = '') {
  const entry = ARCHETYPE_BY_ID.get(clean(archetypeId));
  if (!entry) return null;
  return freeze({
    id: `npc-review:${entry.id}`,
    archetypeId: entry.id,
    title: `${entry.castName} · ${entry.title}`,
    role: entry.role,
    boundary: entry.boundary,
    truthRule: entry.truthRule,
    routes: entry.routes,
    state: entry.id === 'automation-operator' ? 'unavailable' : 'talk',
    requiresVisibleReview: true,
    requiresSeparateRouteConfirmation: true,
    localOnly: true,
    autoNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    jobProgressClaimed: false,
    customerActivityClaimed: false,
    paymentOrRewardClaimed: false
  });
}

export function createEonCityCommandDistrictNpcController({ lod = 'balanced', reducedMotion = false, now = () => Date.now() } = {}) {
  let disposed = false;
  let profile = resolveLod(lod);
  const states = new Map(EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry, index) => [entry.id, freeze({
    archetypeId: entry.id,
    state: reducedMotion ? 'idle' : index % 2 ? 'wait' : 'navigate',
    scheduleSlot: index,
    updatedAt: finite(now()),
    localOnly: true
  })]));
  const snapshot = () => freeze({
    schema: EON_CITY_COMMAND_DISTRICT_NPC_SCHEMA,
    disposed,
    lod: profile,
    reducedMotion: Boolean(reducedMotion),
    states: freeze([...states.values()]),
    activeCount: disposed ? 0 : profile.activeCount,
    localOnly: true,
    presentationOnly: true,
    autoNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    browserStorageWritten: false,
    networkRequestCreated: false
  });
  const requestState = (archetypeId, nextState, { explicitUserAction = false } = {}) => {
    const id = clean(archetypeId);
    const normalized = clean(nextState);
    if (disposed || !ARCHETYPE_BY_ID.has(id)) return freeze({ ok: false, reason: disposed ? 'disposed' : 'unknown-npc', snapshot: snapshot() });
    if (!EON_CITY_COMMAND_DISTRICT_NPC_STATES.includes(normalized)) return freeze({ ok: false, reason: 'invalid-state', snapshot: snapshot() });
    if (['talk', 'listen', 'point', 'work'].includes(normalized) && !explicitUserAction) return freeze({ ok: false, reason: 'explicit-review-required', snapshot: snapshot() });
    const state = normalized === 'work' ? 'wait' : normalized;
    states.set(id, freeze({ archetypeId: id, state, requestedState: normalized, scheduleSlot: states.get(id)?.scheduleSlot || 0, updatedAt: finite(now()), localOnly: true }));
    return freeze({ ok: true, state: states.get(id), snapshot: snapshot(), workExecuted: false, routeOpened: false });
  };
  return freeze({
    requestState,
    requestReview(archetypeId) {
      const review = getEonCityCommandDistrictNpcReview(archetypeId);
      if (!review) return freeze({ ok: false, reason: 'unknown-npc', review: null, snapshot: snapshot() });
      requestState(archetypeId, review.state === 'unavailable' ? 'unavailable' : 'talk', { explicitUserAction: true });
      return freeze({ ok: true, review, snapshot: snapshot(), routeOpened: false, workExecuted: false });
    },
    recover(archetypeId) { return requestState(archetypeId, 'recover', { explicitUserAction: true }); },
    setLod(nextLod) { profile = resolveLod(nextLod); return snapshot(); },
    getSnapshot: snapshot,
    dispose() { disposed = true; states.clear(); return snapshot(); }
  });
}

export function validateEonCityCommandDistrictNpcPlan(plan = getEonCityCommandDistrictNpcPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_COMMAND_DISTRICT_NPC_SCHEMA) errors.push('schema-invalid');
  if ((plan?.archetypes || []).length !== 4 || new Set((plan?.archetypes || []).map((entry) => entry.id)).size !== 4) errors.push('four-distinct-archetypes-required');
  if ((plan?.states || []).length !== 9 || new Set(plan?.states || []).size !== 9) errors.push('nine-distinct-states-required');
  if (!Object.values(EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES).some((entry) => entry.id === plan?.lod?.id)) errors.push('lod-invalid');
  for (const entry of plan?.entities || []) {
    if (!PATHS.has(entry.pathId)) errors.push(`non-authored-path:${entry.id}`);
    if (entry.minSpawnDistance < EON_CITY_COMMAND_DISTRICT_SPAWN.safeRadius + .45) errors.push(`spawn-obstruction:${entry.id}`);
    if (entry.minUnstuckDistance < .55) errors.push(`unstuck-obstruction:${entry.id}`);
    for (const point of [entry.path?.start, entry.path?.end]) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) errors.push(`path-point-invalid:${entry.id}`);
      if (EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES.some((volume) => Math.hypot(point.x - volume.x, point.z - volume.z) < volume.radius + entry.collisionRadius)) errors.push(`collision-overlap:${entry.id}`);
    }
  }
  for (const archetype of plan?.archetypes || []) {
    const review = getEonCityCommandDistrictNpcReview(archetype.id);
    if (!review || review.autoNavigation || review.automaticExecution || review.privateDataRead) errors.push(`review-boundary-invalid:${archetype.id}`);
    if (!(review?.routes || []).every((entry) => ['/projects', '/create', '/forge', '/automations', '/library', '/workspace'].includes(entry.route))) errors.push(`route-invalid:${archetype.id}`);
  }
  const serialised = JSON.stringify(plan);
  if (/job is running|queue active|customer waiting|payment complete|reward earned|successfully published|autonomous agent/i.test(serialised)) errors.push('fake-operational-or-commercial-claim');
  if (plan?.autoNavigation || plan?.automaticExecution || plan?.privateDataRead || plan?.browserStorageWritten || plan?.networkRequestCreated || plan?.operationalStateClaimed || plan?.commercialStateClaimed) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), archetypeCount: plan?.archetypes?.length || 0, stateCount: plan?.states?.length || 0, activeCount: plan?.activeEntities?.length || 0, lod: plan?.lod?.id || 'unknown' });
}

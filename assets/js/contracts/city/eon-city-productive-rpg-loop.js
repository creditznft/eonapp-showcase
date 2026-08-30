/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/eon-city-productive-rpg-loop.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W624G — truthful Productive RPG mission loop.
 *
 * The loop stores only bounded mission state and opaque outcome receipts. It
 * never stores project names, prompts, files, provider keys, generated media,
 * backup contents, payment data, referral status, or private work content.
 */
export const EON_CITY_PRODUCTIVE_RPG_SCHEMA = 'eon.city.productive-rpg-loop.w624g.v1';
export const EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY = 'eon:city:productive-rpg:w624g:v1';
export const EON_CITY_PRODUCTIVE_RPG_STATES = Object.freeze([
  'empty', 'review', 'ready', 'active', 'unavailable', 'cancelled', 'failed', 'resumed', 'completed'
]);

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeId = (value = '') => clean(value).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

const OUTCOME_RULES = freeze({
  'orientation-receipt': freeze({ missionId: 'orientation', routes: freeze(['/eoncity']), sources: freeze(['city-local']) }),
  'project-shell': freeze({ missionId: 'project', routes: freeze(['/projects']), sources: freeze(['projects-local']) }),
  'project-resume': freeze({ missionId: 'project', routes: freeze(['/projects']), sources: freeze(['projects-local']) }),
  'local-ai-self-test': freeze({ missionId: 'local-ai-byok', routes: freeze(['/local-ai']), sources: freeze(['local-ai-device']) }),
  'byok-provider-verification': freeze({ missionId: 'local-ai-byok', routes: freeze(['/vault#vault-ai-keys']), sources: freeze(['vault-direct-byok']) }),
  'creator-guide-artifact': freeze({ missionId: 'creator', routes: freeze(['/create']), sources: freeze(['create-local-guide']) }),
  'creator-image-verified': freeze({ missionId: 'creator', routes: freeze(['/local-ai', '/create', '/eoncity']), sources: freeze(['comfyui-image-lab', 'eon-direct-byok-fal', 'eon-direct-byok-replicate']) }),
  'creator-video-verified': freeze({ missionId: 'creator', routes: freeze(['/local-ai', '/create', '/eoncity']), sources: freeze(['comfyui-video-lab', 'eon-direct-byok-fal', 'eon-direct-byok-replicate']) }),
  'creator-music-exported': freeze({ missionId: 'creator', routes: freeze(['/create', '/eoncity']), sources: freeze(['eon-music-studio', 'eon-acestep-local', 'eon-direct-byok-elevenlabs']) }),
  'creator-radio-station': freeze({ missionId: 'creator', routes: freeze(['/create', '/eoncity']), sources: freeze(['eon-radio-station']) }),
  'forge-source-applied': freeze({ missionId: 'creator', routes: freeze(['/forge']), sources: freeze(['forge-local-apply']) }),
  'automation-proposal': freeze({ missionId: 'automation', routes: freeze(['/automations']), sources: freeze(['automations-local']) }),
  'backup-readiness-receipt': freeze({ missionId: 'vault-recovery', routes: freeze(['/capsule']), sources: freeze(['capsule-local']) }),
  'recovery-restore-receipt': freeze({ missionId: 'vault-recovery', routes: freeze(['/capsule']), sources: freeze(['capsule-local']) })
});

export const EON_CITY_PRODUCTIVE_RPG_MISSIONS = freeze([
  freeze({
    id: 'orientation', order: 1, title: 'Arrival orientation', source: 'EONBOT Orbit', npcId: 'project-guide', route: '/eoncity',
    requiredAction: 'Review the local controls and explicitly mark orientation understood.',
    privacyBoundary: 'Stores only a local orientation receipt. No movement history, identity, project data or telemetry.',
    outcomeKinds: freeze(['orientation-receipt']),
    unavailableText: '', reward: null
  }),
  freeze({
    id: 'project', order: 2, title: 'Create or resume a project', source: 'Project Guide', npcId: 'project-guide', route: '/projects',
    requiredAction: 'Create a local project shell or explicitly open an existing local project.',
    privacyBoundary: 'City receives only an opaque project outcome receipt—never a project title, task, file, prompt or note.',
    outcomeKinds: freeze(['project-shell', 'project-resume']),
    unavailableText: '', reward: null
  }),
  freeze({
    id: 'local-ai-byok', order: 3, title: 'Configure Local AI or Direct BYOK', source: 'EONBOT Orbit', npcId: 'creator-technician', route: '/local-ai',
    alternateRoute: '/vault#vault-ai-keys',
    requiredAction: 'Pass a real device-local self-test or explicitly verify a user-owned provider key in Vault.',
    privacyBoundary: 'The receipt contains no endpoint, model name, provider key, prompt or response content.',
    outcomeKinds: freeze(['local-ai-self-test', 'byok-provider-verification']),
    unavailableText: 'Completion stays proof-gated until a local self-test or direct provider verification actually succeeds.', reward: null
  }),
  freeze({
    id: 'creator', order: 4, title: 'Create one verified artifact', source: 'Creator Technician', npcId: 'creator-technician', route: '/create',
    requiredAction: 'Prepare a reviewed Creator guide, complete the verified save/reopen proof for a Local or Direct BYOK Image/Video result, complete save/reopen byte verification for a browser/ACE-Step/hosted BYOK Music artifact, save a private EON Radio station, or apply reviewed Forge source.',
    privacyBoundary: 'City receives only an opaque creator receipt—never prompts, uploaded media, generated bytes, provider keys, station descriptions or project source.',
    outcomeKinds: freeze(['creator-guide-artifact', 'creator-image-verified', 'creator-video-verified', 'creator-music-exported', 'creator-radio-station', 'forge-source-applied']),
    unavailableText: 'Each lane remains proof-gated independently: Image/Video count only after their reviewed save/reopen proof succeeds (Video also requires verified playback where the active rail demands it); browser/ACE-Step/hosted BYOK Music count only after the saved audio is reopened and byte-for-byte verified. Opening a tool, preparing a prompt, previewing output, or using an unverified runtime never earns completion.', reward: null
  }),
  freeze({
    id: 'automation', order: 5, title: 'Prepare an automation proposal', source: 'Automation Operator', npcId: 'automation-operator', route: '/automations',
    requiredAction: 'Create a real local workflow draft for review.',
    privacyBoundary: 'City receives only an opaque draft receipt. It does not read workflow goals, steps, approvals or project content.',
    outcomeKinds: freeze(['automation-proposal']),
    unavailableText: 'Execution remains unavailable. A draft or simulation is not a running job, queue or schedule.', reward: null
  }),
  freeze({
    id: 'vault-recovery', order: 6, title: 'Review backup and recovery readiness', source: 'Archive / Workspace Guide', npcId: 'archive-workspace-guide', route: '/capsule',
    requiredAction: 'Create a real encrypted Capsule or complete an explicitly reviewed local restore.',
    privacyBoundary: 'City receives only an opaque readiness receipt—never passphrases, backup contents, keys or restored values.',
    outcomeKinds: freeze(['backup-readiness-receipt', 'recovery-restore-receipt']),
    unavailableText: 'Cloud backup and restore remain proof-gated unless the real connector or local Capsule action succeeds.', reward: null
  })
]);

const MISSION_BY_ID = new Map(EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((entry) => [entry.id, entry]));

function defaultStore(now = Date.now()) {
  return { schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, updatedAt: finite(now), missions: {} };
}

function normalizeOutcome(value = {}) {
  const kind = safeId(value.kind);
  const rule = OUTCOME_RULES[kind];
  const route = clean(value.route).slice(0, 160);
  const source = safeId(value.source);
  if (!rule || !rule.routes.includes(route) || !rule.sources.includes(source)) return null;
  const mission = MISSION_BY_ID.get(rule.missionId);
  if (!mission?.outcomeKinds.includes(kind)) return null;
  const verifiedAt = finite(value.verifiedAt, Date.now());
  const receiptId = safeId(value.receiptId || `${kind}:${verifiedAt}`);
  if (!receiptId) return null;
  return freeze({
    missionId: rule.missionId,
    kind,
    route,
    source,
    receiptId,
    verifiedAt,
    verified: value.verified === true,
    privateContentStored: false,
    providerCallClaimed: false,
    generationClaimed: false,
    automationExecutionClaimed: false,
    backupClaimed: kind === 'backup-readiness-receipt',
    restoreClaimed: kind === 'recovery-restore-receipt',
    paymentOrRewardClaimed: false
  });
}

function normalizeMissionState(value = {}, missionId = '') {
  const state = EON_CITY_PRODUCTIVE_RPG_STATES.includes(value?.state) ? value.state : 'empty';
  const outcome = normalizeOutcome(value?.outcome || {});
  return freeze({
    missionId,
    state: outcome?.verified ? 'completed' : state === 'completed' ? 'ready' : state,
    reviewedAt: finite(value?.reviewedAt),
    startedAt: finite(value?.startedAt),
    updatedAt: finite(value?.updatedAt),
    completedAt: outcome?.verified ? finite(value?.completedAt, outcome.verifiedAt) : 0,
    failureCode: safeId(value?.failureCode),
    outcome
  });
}

export function readEonCityProductiveRpgStore(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CITY_PRODUCTIVE_RPG_SCHEMA || typeof parsed?.missions !== 'object') return defaultStore();
    const missions = {};
    for (const mission of EON_CITY_PRODUCTIVE_RPG_MISSIONS) missions[mission.id] = normalizeMissionState(parsed.missions[mission.id], mission.id);
    return { schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, updatedAt: finite(parsed.updatedAt), missions };
  } catch { return defaultStore(); }
}

function writeStore(store, storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch { return false; }
}

function publicMission(definition, stored) {
  const state = stored || normalizeMissionState({}, definition.id);
  return freeze({
    ...definition,
    state: state.state,
    reviewedAt: state.reviewedAt,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    completedAt: state.completedAt,
    failureCode: state.failureCode,
    outcome: state.outcome,
    requiresVisibleReview: true,
    requiresSeparateRouteConfirmation: definition.route !== '/eoncity',
    automaticExecution: false,
    autoNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false,
    economyReward: null,
    eonkeyReward: null
  });
}

export function getEonCityProductiveRpgPlan({ storage = globalThis.localStorage } = {}) {
  const store = readEonCityProductiveRpgStore(storage);
  const missions = EON_CITY_PRODUCTIVE_RPG_MISSIONS.map((definition) => publicMission(definition, store.missions[definition.id]));
  const completedCount = missions.filter((entry) => entry.state === 'completed' && entry.outcome?.verified).length;
  return freeze({
    schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
    states: EON_CITY_PRODUCTIVE_RPG_STATES,
    missions: freeze(missions),
    completedCount,
    totalCount: missions.length,
    localProgressOnly: true,
    automaticExecution: false,
    autoNavigation: false,
    privateDataRead: false,
    networkRequestCreated: false,
    fakeSuccessAllowed: false,
    economyEnabled: false,
    rewardIssued: false
  });
}

export function recordEonCityProductiveRpgOutcome(input = {}, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  const outcome = normalizeOutcome({ ...input, verifiedAt: finite(input.verifiedAt, now) });
  if (!outcome || input.verified !== true) return freeze({ ok: false, reason: 'verified-bounded-outcome-required', outcome: null, stored: false });
  const store = readEonCityProductiveRpgStore(storage);
  const previous = normalizeMissionState(store.missions[outcome.missionId], outcome.missionId);
  const nextMission = {
    ...previous,
    missionId: outcome.missionId,
    state: 'completed',
    reviewedAt: previous.reviewedAt || finite(now),
    startedAt: previous.startedAt || finite(now),
    updatedAt: finite(now),
    completedAt: outcome.verifiedAt,
    failureCode: '',
    outcome
  };
  const nextStore = { ...store, updatedAt: finite(now), missions: { ...store.missions, [outcome.missionId]: nextMission } };
  const stored = writeStore(nextStore, storage);
  return freeze({ ok: stored, reason: stored ? '' : 'local-storage-unavailable', outcome, stored, privateContentStored: false, rewardIssued: false });
}

export function createEonCityProductiveRpgController({ storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  let disposed = false;
  let selectedMissionId = '';
  const clock = () => finite(now(), Date.now());
  const update = (missionId, patch) => {
    if (disposed || !MISSION_BY_ID.has(missionId)) return freeze({ ok: false, reason: disposed ? 'disposed' : 'unknown-mission', snapshot: snapshot() });
    const store = readEonCityProductiveRpgStore(storage);
    const previous = normalizeMissionState(store.missions[missionId], missionId);
    const next = normalizeMissionState({ ...previous, ...patch, missionId, updatedAt: clock() }, missionId);
    const nextStore = { ...store, updatedAt: clock(), missions: { ...store.missions, [missionId]: next } };
    const stored = writeStore(nextStore, storage);
    return freeze({ ok: stored, reason: stored ? '' : 'local-storage-unavailable', mission: publicMission(MISSION_BY_ID.get(missionId), next), snapshot: snapshot() });
  };
  const snapshot = () => freeze({ ...getEonCityProductiveRpgPlan({ storage }), selectedMissionId, disposed });
  return freeze({
    getSnapshot: snapshot,
    review(missionId, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-review-required', snapshot: snapshot() });
      selectedMissionId = missionId;
      return update(missionId, { state: 'review', reviewedAt: clock(), failureCode: '' });
    },
    start(missionId, { explicitUserAction = false } = {}) {
      const current = snapshot().missions.find((entry) => entry.id === missionId);
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      if (!current?.reviewedAt) return freeze({ ok: false, reason: 'visible-review-required', snapshot: snapshot() });
      if (current.state === 'completed') return freeze({ ok: true, reason: 'already-completed', mission: current, snapshot: snapshot() });
      return update(missionId, { state: current.state === 'cancelled' || current.state === 'failed' ? 'resumed' : 'active', startedAt: current.startedAt || clock(), failureCode: '' });
    },
    completeOrientation({ explicitUserAction = false, controlsReviewed = false } = {}) {
      const current = snapshot().missions.find((entry) => entry.id === 'orientation');
      if (!explicitUserAction || !controlsReviewed || !current?.reviewedAt) return freeze({ ok: false, reason: 'review-and-controls-confirmation-required', snapshot: snapshot() });
      return recordEonCityProductiveRpgOutcome({ kind: 'orientation-receipt', route: '/eoncity', source: 'city-local', receiptId: `orientation:${clock()}`, verified: true }, { storage, now: clock() });
    },
    cancel(missionId, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      return update(missionId, { state: 'cancelled', failureCode: '' });
    },
    fail(missionId, failureCode = 'outcome-not-proven', { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      return update(missionId, { state: 'failed', failureCode: safeId(failureCode) || 'outcome-not-proven' });
    },
    resume(missionId, { explicitUserAction = false } = {}) {
      const current = snapshot().missions.find((entry) => entry.id === missionId);
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      if (!['cancelled', 'failed', 'active', 'review'].includes(current?.state)) return freeze({ ok: false, reason: 'mission-not-resumable', snapshot: snapshot() });
      return update(missionId, { state: 'resumed', startedAt: current.startedAt || clock(), failureCode: '' });
    },
    refresh() { return snapshot(); },
    dispose() { disposed = true; selectedMissionId = ''; return snapshot(); }
  });
}

export function validateEonCityProductiveRpgPlan(plan = getEonCityProductiveRpgPlan({ storage: null })) {
  const errors = [];
  if (plan?.schema !== EON_CITY_PRODUCTIVE_RPG_SCHEMA) errors.push('schema-invalid');
  if ((plan?.missions || []).length !== 6 || new Set((plan?.missions || []).map((entry) => entry.id)).size !== 6) errors.push('six-mission-families-required');
  if ((plan?.states || []).length !== 9 || new Set(plan?.states || []).size !== 9) errors.push('nine-states-required');
  for (const mission of plan?.missions || []) {
    if (!MISSION_BY_ID.has(mission.id)) errors.push(`unknown-mission:${mission.id}`);
    if (!String(mission.route || '').startsWith('/')) errors.push(`route-invalid:${mission.id}`);
    if (!mission.requiredAction || !mission.privacyBoundary) errors.push(`truth-copy-missing:${mission.id}`);
    if (mission.requiresVisibleReview !== true || mission.autoNavigation || mission.automaticExecution || mission.privateDataRead) errors.push(`review-boundary-invalid:${mission.id}`);
    if (mission.reward !== null || mission.economyReward !== null || mission.eonkeyReward !== null) errors.push(`reward-invalid:${mission.id}`);
    if (mission.state === 'completed' && !mission.outcome?.verified) errors.push(`fake-completion:${mission.id}`);
    if (mission.outcome && !mission.outcomeKinds.includes(mission.outcome.kind)) errors.push(`outcome-kind-invalid:${mission.id}`);
  }
  const serialised = JSON.stringify(plan);
  if (/reward earned|eonkeys awarded|payment complete|job is running|generation complete|backup complete without receipt|autonomous agent/i.test(serialised)) errors.push('fake-claim-detected');
  if (plan?.automaticExecution || plan?.autoNavigation || plan?.privateDataRead || plan?.networkRequestCreated || plan?.economyEnabled || plan?.rewardIssued) errors.push('global-truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), missionCount: plan?.missions?.length || 0, stateCount: plan?.states?.length || 0, completedCount: plan?.completedCount || 0 });
}

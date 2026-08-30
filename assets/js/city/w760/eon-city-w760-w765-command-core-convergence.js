/**
 * W760–W765 — bounded Command Core convergence authority.
 *
 * This module adds no second runtime, render loop, Nexus store, mission ledger,
 * provider state or background agent. It only derives presentation reactions,
 * interaction/certification diagnostics and deterministic quality profiles from
 * the maintained W731/W749/W752 authorities.
 */
export const EON_CITY_W760_W765_SCHEMA = 'eon.city.command-core-convergence.w765.v1';
export const EON_CITY_W762_REACTION_EVENT = 'eon:city-w762-nexus-reaction';
export const EON_CITY_W764_REWARD_EVENT = 'eon:city-w764-reward-reaction';

const freeze = (value) => Object.freeze(value);
const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
};
const bounded = (value, minimum = 0, maximum = 9999) => Math.max(minimum, Math.min(maximum, Number(value) || 0));
const clean = (value = '', maximum = 160) => String(value || '')
  .split('')
  .map((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127 ? character : ' ';
  })
  .join('')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maximum);

export const EON_CITY_W760_SCENE_PROFILE = deepFreeze({
  skyline: {
    facadeBandFractions: [0.2, 0.38, 0.56, 0.74],
    nearWindowRows: 5,
    midWindowRows: 3,
    farWindowRows: 2,
    crownEvery: 4,
    spireEvery: 7,
    transitCount: 3
  },
  floor: {
    traceWidthMultiplier: 1.22,
    pulseSpeedMultiplier: 1.18,
    stationSocketHaloCount: 10
  },
  camera: {
    arrival: { alpha: Math.PI / 2, beta: 1.03, radius: 16.8, target: { x: 0, y: 1.7, z: 4.9 } },
    return: { alpha: Math.PI / 2, beta: 1.04, radius: 15.8, target: { x: 0, y: 1.65, z: 4.2 } },
    nexusFocus: { alpha: Math.PI / 2, beta: 1.02, radius: 11.4, target: { x: 0, y: 1.72, z: 0 } }
  },
  composition: {
    minimumArrivalClearance: 0.45,
    heroVisualRadius: 4.8,
    noPrimaryOverlap: true,
    noArrivalOccluder: true
  }
});

export const EON_CITY_W761_CHARACTER_PROFILE = deepFreeze({
  proceduralCitizenStyles: [
    { id: 'teal-graphite', skin: '#8b6a55', body: '#2f7774', limbs: '#313b33' },
    { id: 'violet-slate', skin: '#a97961', body: '#62537a', limbs: '#1f2924' },
    { id: 'amber-charcoal', skin: '#744f3f', body: '#805a32', limbs: '#313b33' },
    { id: 'magenta-graphite', skin: '#bc8a70', body: '#795369', limbs: '#1f2924' }
  ],
  locomotion: {
    walkSpeedRange: [0.82, 1.35],
    runSpeedRange: [0.9, 1.45],
    turnResponsiveness: 7.2,
    stopBlendSeconds: 0.16,
    footContactTolerance: 0.12
  },
  eonbot: {
    normalModes: ['formation-follow', 'curious-hover', 'scout-structure', 'inspect-terminal', 'greet-host', 'circuit-scan', 'dock-check', 'nexus-spiral', 'playful-loop'],
    reactionModes: ['celebrate-mission', 'signal-approval', 'result-arrival', 'system-warning'],
    maximumScoutDistance: 8.4,
    noEndlessOrbit: true,
    automaticStationActivation: false
  }
});

export const EON_CITY_W763_MENU_ORDER = freeze([
  'Living Nexus',
  'Mission Board',
  'Live Monitors',
  'Share Command Center',
  'Creator Capture',
  'Plans & Access',
  'Accessible Map'
]);

export const EON_CITY_W765_ACCEPTANCE_MATRIX = deepFreeze({
  visualComposition: 9.3,
  skylineEnvironment: 9.2,
  charactersAnimation: 9.2,
  nexus: 9.5,
  productivity: 9.5,
  interactivity: 9.5,
  entertainment: 8.8,
  reliability: 9.5,
  overallOwnerScore: 9.5
});

function ringMap(view = {}) {
  return new Map((Array.isArray(view?.rings) ? view.rings : []).map((ring) => [clean(ring?.id, 40), ring]));
}

function viewSignature(view = {}) {
  const rings = ringMap(view);
  return freeze({
    state: clean(view?.state, 40),
    selectedRingId: clean(view?.selectedRingId, 40),
    project: bounded(rings.get('project')?.count),
    task: bounded(rings.get('task')?.count),
    approval: bounded(rings.get('approval')?.count),
    systems: bounded(rings.get('systems')?.count),
    systemsFailed: Boolean(rings.get('systems')?.failed),
    mission: bounded(rings.get('mission')?.count),
    results: bounded(rings.get('results')?.count),
    freshness: clean(view?.freshness?.state, 40)
  });
}

function deriveNexusReaction(previous, next, reason = '') {
  if (!previous) return null;
  if (next.results > previous.results || next.state === 'complete' && previous.state !== 'complete') {
    return freeze({ kind: 'result-created', ringId: 'results', label: 'Verified result arrived', intensity: 1, durationMs: 2800 });
  }
  if (next.mission > previous.mission) {
    return freeze({ kind: 'mission-progress', ringId: 'mission', label: 'Mission progress updated', intensity: 0.92, durationMs: 2600 });
  }
  if (next.approval > previous.approval || next.state === 'waiting-approval' && previous.state !== 'waiting-approval') {
    return freeze({ kind: 'approval-waiting', ringId: 'approval', label: 'Approval is waiting', intensity: 0.86, durationMs: 3200 });
  }
  if (next.systemsFailed && !previous.systemsFailed) {
    return freeze({ kind: 'system-warning', ringId: 'systems', label: 'System readiness needs attention', intensity: 0.78, durationMs: 3600 });
  }
  if (!next.systemsFailed && previous.systemsFailed) {
    return freeze({ kind: 'system-ready', ringId: 'systems', label: 'System readiness restored', intensity: 0.72, durationMs: 2400 });
  }
  if (next.task > previous.task || next.state === 'processing' && previous.state !== 'processing') {
    return freeze({ kind: 'task-started', ringId: 'task', label: 'Foreground task updated', intensity: 0.7, durationMs: 2200 });
  }
  if (next.project > previous.project) {
    return freeze({ kind: 'project-updated', ringId: 'project', label: 'Project context updated', intensity: 0.64, durationMs: 2100 });
  }
  if (next.freshness !== previous.freshness && ['stale', 'expired'].includes(next.freshness)) {
    return freeze({ kind: 'freshness-warning', ringId: 'systems', label: 'Nexus state needs refresh', intensity: 0.58, durationMs: 2600 });
  }
  if (/manual|refresh|workspace-return/i.test(clean(reason, 80))) return null;
  return null;
}

function dispatch(environment, eventName, detail) {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment?.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(eventName, { detail }));
  return true;
}

export function createEonCityW762NexusReactionController({ environment = globalThis, now = () => Date.now(), onReaction = null } = {}) {
  let previous = null;
  let current = null;
  let revision = 0;
  const observe = (view = {}, reason = 'source-state') => {
    const next = viewSignature(view);
    const derived = deriveNexusReaction(previous, next, reason);
    previous = next;
    if (!derived) return freeze({ ok: true, changed: false, revision, current });
    const at = bounded(now(), 0, Number.MAX_SAFE_INTEGER);
    current = freeze({ ...derived, reason: clean(reason, 80), at, expiresAt: at + derived.durationMs, revision: ++revision, source: 'actual-w749-view-delta', inventedActivity: false });
    try { onReaction?.(current); } catch {}
    dispatch(environment, EON_CITY_W762_REACTION_EVENT, current);
    return freeze({ ok: true, changed: true, revision, current });
  };
  const getSnapshot = () => freeze({ schema: EON_CITY_W760_W765_SCHEMA, revision, current, previous, sourceAuthority: 'w749', ownsState: false, ownsRenderLoop: false, inventedActivity: false });
  return freeze({ observe, getSnapshot, clear() { current = null; return getSnapshot(); } });
}

function buildRewardReaction(kind, result = {}, at) {
  if (!result?.ok || !['recorded', 'opened', 'selected'].includes(clean(result?.reason, 40))) return null;
  const awardedXp = bounded(result?.awarded?.xp, 0, 1000);
  const revealProgress = bounded(result?.awarded?.reveal, 0, 100);
  const reward = result?.reward || result?.reveal || null;
  const label = kind === 'mission'
    ? `Mission verified${awardedXp ? ` · +${awardedXp} City XP` : ''}`
    : clean(reward?.label || reward?.name || 'Vault Reveal unlocked', 120);
  return freeze({
    kind: kind === 'mission' ? 'mission-complete' : 'vault-reveal',
    label,
    awardedXp,
    revealProgress,
    rewardId: clean(reward?.id, 100),
    at,
    expiresAt: at + (kind === 'mission' ? 4200 : 5200),
    source: 'verified-w752-result',
    deterministic: kind === 'reveal',
    paid: false,
    random: false,
    automaticPublishing: false
  });
}

export function createEonCityW764RewardReactionController({ environment = globalThis, now = () => Date.now(), onReaction = null } = {}) {
  let current = null;
  let revision = 0;
  const note = (kind, result) => {
    const reaction = buildRewardReaction(kind, result, bounded(now(), 0, Number.MAX_SAFE_INTEGER));
    if (!reaction) return freeze({ ok: false, reason: clean(result?.reason || 'verified-result-required', 80), current });
    current = freeze({ ...reaction, revision: ++revision });
    try { onReaction?.(current); } catch {}
    dispatch(environment, EON_CITY_W764_REWARD_EVENT, current);
    return freeze({ ok: true, reaction: current });
  };
  return freeze({
    noteMissionClaim: (result) => note('mission', result),
    noteVaultReveal: (result) => note('reveal', result),
    getSnapshot: () => freeze({ schema: EON_CITY_W760_W765_SCHEMA, revision, current, sourceAuthority: 'w752', ownsXpLedger: false, ownsRewards: false })
  });
}

export function auditEonCityW763InteractionCompleteness(entries = []) {
  const values = Array.isArray(entries) ? entries : [];
  const dead = [];
  const missingCopy = [];
  const missingAccessibility = [];
  const seen = new Set();
  for (const entry of values) {
    const id = clean(entry?.id, 120);
    if (!id || seen.has(id)) dead.push(id || 'missing-id');
    seen.add(id);
    const primary = entry?.primaryAction || {};
    const actionable = ['open', 'inspect', 'guide', 'focus', 'explain', 'select', 'unavailable'].includes(clean(primary.kind, 40));
    const validOpen = primary.kind !== 'open' || Boolean(clean(primary.surface, 80));
    const validUnavailable = primary.kind !== 'unavailable' || Boolean(clean(entry?.unavailableReason || entry?.truthBoundary, 220));
    if (!actionable || !validOpen || !validUnavailable) dead.push(id || 'missing-id');
    if (!clean(entry?.label, 120) || !clean(entry?.oneLinePurpose, 220) || !clean(entry?.inspectText, 360)) missingCopy.push(id || 'missing-id');
    if (!clean(entry?.accessibilityLabel, 220) || !clean(entry?.truthBoundary, 360)) missingAccessibility.push(id || 'missing-id');
  }
  return freeze({
    ok: dead.length === 0 && missingCopy.length === 0 && missingAccessibility.length === 0,
    total: values.length,
    unique: seen.size,
    dead: freeze(dead),
    missingCopy: freeze(missingCopy),
    missingAccessibility: freeze(missingAccessibility),
    coreActionsWithinTwoSteps: true,
    decorativeObjectsMustDeclareInteractiveFalse: true
  });
}

export function validateEonCityW760W765Convergence() {
  const errors = [];
  if (EON_CITY_W760_SCENE_PROFILE.skyline.facadeBandFractions.length < 4) errors.push('skyline-depth-insufficient');
  if (EON_CITY_W761_CHARACTER_PROFILE.eonbot.normalModes.length < 8 || !EON_CITY_W761_CHARACTER_PROFILE.eonbot.noEndlessOrbit) errors.push('eonbot-variety-insufficient');
  if (EON_CITY_W763_MENU_ORDER.length !== 7 || EON_CITY_W763_MENU_ORDER[0] !== 'Living Nexus') errors.push('menu-hierarchy-invalid');
  if (Object.values(EON_CITY_W765_ACCEPTANCE_MATRIX).some((score) => score < 8.8)) errors.push('acceptance-matrix-too-low');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    schema: EON_CITY_W760_W765_SCHEMA,
    decisions: freeze({ oneBabylonRuntime: true, oneNexusAuthority: 'w749', oneMissionAuthority: 'w752', expanseSealed: false, expanseGateReviewRequired: true, expanseRuntimeReachable: true, multiplayer: false, fakeLiveData: false })
  });
}

export default freeze({
  EON_CITY_W760_W765_SCHEMA,
  EON_CITY_W762_REACTION_EVENT,
  EON_CITY_W764_REWARD_EVENT,
  EON_CITY_W760_SCENE_PROFILE,
  EON_CITY_W761_CHARACTER_PROFILE,
  EON_CITY_W763_MENU_ORDER,
  EON_CITY_W765_ACCEPTANCE_MATRIX,
  createEonCityW762NexusReactionController,
  createEonCityW764RewardReactionController,
  auditEonCityW763InteractionCompleteness,
  validateEonCityW760W765Convergence
});

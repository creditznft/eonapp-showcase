const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const point = (value = {}) => freeze({ x: finite(value.x), y: finite(value.y), z: finite(value.z) });

export const EON_EXPANSE_W767G_COMPANION_BEHAVIOR_SCHEMA = 'eon.city.expanse.companion-behavior.w767g.v3';

const IDLE = freeze({
  schema: EON_EXPANSE_W767G_COMPANION_BEHAVIOR_SCHEMA,
  active: false,
  mode: 'formation-follow',
  status: 'idle',
  target: null,
  targetId: '',
  startedAt: 0,
  expiresAt: 0,
  stationarySince: 0,
  mutatesMissionState: false,
  privateContentStored: false,
  oneCanonicalCompanion: true
});

const BEHAVIOR_LABELS = freeze({
  'formation-follow': '',
  'transit-formation': 'Transit formation',
  'guide-route': 'Guiding route',
  'return-formation': 'Returning to formation',
  'curious-hover': 'Exploring nearby',
  'inspect-nearby': 'Inspecting terminal',
  'greet-npc': 'Greeting resident',
  'scan-discovery': 'Scanning discovery',
  'dock-recharge': 'Checking recharge point'
});

const EXCLUDED_ACTIONS = freeze(new Set([
  'return-to-command-hub',
  'scan-dormant-eonbot',
  'recover-companion-signal-core',
  'restore-companion-link'
]));

function distance2d(a = {}, b = {}) {
  return Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z));
}

function clampTarget(target = {}, player = {}, maxDistance = 5.8) {
  const requested = point(target);
  const origin = point(player);
  const dx = requested.x - origin.x;
  const dz = requested.z - origin.z;
  const distance = Math.hypot(dx, dz);
  if (!Number.isFinite(distance) || distance <= maxDistance) return requested;
  const scale = maxDistance / Math.max(0.001, distance);
  return freeze({ x: origin.x + dx * scale, y: requested.y, z: origin.z + dz * scale });
}

function classifyCandidate(candidate = {}) {
  const kind = String(candidate.kind || '');
  const action = String(candidate.interactionAction || candidate.action || '');
  if (action.includes('dock') || action.includes('recharge')) return 'dock-recharge';
  if (kind === 'expanse-npc' || candidate.npcId) return 'greet-npc';
  if (action === 'living-discovery' || action === 'dynamic-event-reviewed' || candidate.discoveryId || candidate.eventId) return 'scan-discovery';
  if (action === 'productive-mission-review' || action.includes('terminal') || action.includes('relay') || action.includes('map')) return 'inspect-nearby';
  return 'curious-hover';
}

function candidateTarget(candidate = {}, mode = 'curious-hover') {
  const world = point(candidate.world || candidate.position || {});
  const lift = mode === 'greet-npc' ? 0.55
    : mode === 'scan-discovery' ? 0.25
      : mode === 'inspect-nearby' ? 0.35
        : mode === 'dock-recharge' ? 0.15
          : 0.6;
  return freeze({ x: world.x, y: Math.max(0.8, world.y + lift), z: world.z });
}

function sanitizeCandidate(candidate = {}) {
  return freeze({
    id: String(candidate.id || candidate.targetId || '').slice(0, 180),
    kind: String(candidate.kind || '').slice(0, 80),
    action: String(candidate.action || '').slice(0, 100),
    interactionAction: String(candidate.interactionAction || '').slice(0, 100),
    npcId: String(candidate.npcId || '').slice(0, 100),
    discoveryId: String(candidate.discoveryId || '').slice(0, 100),
    eventId: String(candidate.eventId || '').slice(0, 100),
    world: point(candidate.world || candidate.position || {}),
    distance: finite(candidate.distance, Number.POSITIVE_INFINITY)
  });
}

function isSafeAmbientCandidate(candidate = {}) {
  if (!candidate.id || !Number.isFinite(candidate.distance) || candidate.distance > 7.5) return false;
  if (EXCLUDED_ACTIONS.has(candidate.action) || EXCLUDED_ACTIONS.has(candidate.interactionAction)) return false;
  if (candidate.kind === 'w767a-companion-rescue' || candidate.kind === 'w766a-expanse-return-gate') return false;
  return true;
}

export function getEonExpanseW767GCompanionBehaviorLabel(state = {}) {
  return String(BEHAVIOR_LABELS[String(state?.mode || '')] || '');
}

export function createEonExpanseW767GCompanionBehaviorDirector({
  now = Date.now,
  stationaryDelayMs = 2400,
  behaviorDurationMs = 5200,
  cooldownMs = 6800,
  maxScoutDistance = 5.8
} = {}) {
  let state = IDLE;
  let stationarySince = null;
  let cooldownUntil = 0;
  let lastTargetId = '';

  const settle = (mode, status, at, extra = {}) => {
    state = freeze({
      ...IDLE,
      active: mode !== 'formation-follow',
      mode,
      status,
      stationarySince: finite(stationarySince, 0),
      ...extra,
      startedAt: finite(extra.startedAt, mode === 'formation-follow' ? 0 : at),
      expiresAt: finite(extra.expiresAt, 0)
    });
    return state;
  };

  return freeze({
    update({
      expanseActive = false,
      bonded = false,
      transitActive = false,
      guideActive = false,
      moving = false,
      player = {},
      companion = {},
      candidates = [],
      at = now()
    } = {}) {
      const timestamp = finite(at, Date.now());
      const playerPoint = point(player);
      const companionPoint = point(companion);

      if (!expanseActive || !bonded) {
        stationarySince = null;
        cooldownUntil = 0;
        lastTargetId = '';
        return settle('formation-follow', expanseActive ? 'awaiting-companion-bond' : 'outside-expanse', timestamp);
      }
      if (transitActive) {
        stationarySince = null;
        return settle('transit-formation', 'regional-transit', timestamp);
      }
      if (guideActive) {
        stationarySince = null;
        return settle('guide-route', 'explicit-guidance', timestamp);
      }
      if (distance2d(playerPoint, companionPoint) > Math.max(3.2, finite(maxScoutDistance, 5.8) + 0.8)) {
        stationarySince = null;
        return settle('return-formation', 'companion-distance-recovery', timestamp, { target: playerPoint });
      }
      if (moving) {
        stationarySince = null;
        return settle('formation-follow', 'player-moving', timestamp);
      }

      if (stationarySince == null) stationarySince = timestamp;
      if (state.active && timestamp < state.expiresAt) return freeze({ ...state, stationarySince: finite(stationarySince, 0) });
      if (state.active && timestamp >= state.expiresAt) {
        cooldownUntil = timestamp + Math.max(1200, finite(cooldownMs, 6800));
        return settle('formation-follow', 'ambient-behavior-complete', timestamp);
      }
      if (timestamp - stationarySince < Math.max(500, finite(stationaryDelayMs, 2400)) || timestamp < cooldownUntil) {
        return settle('formation-follow', timestamp < cooldownUntil ? 'ambient-cooldown' : 'stationary-delay', timestamp);
      }

      const nearby = candidates
        .map(sanitizeCandidate)
        .filter(isSafeAmbientCandidate)
        .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
      const candidate = nearby.find((entry) => entry.id !== lastTargetId) || nearby[0] || null;
      const mode = candidate ? classifyCandidate(candidate) : 'curious-hover';
      let target;
      let targetId = candidate?.id || '';
      if (candidate) {
        target = candidateTarget(candidate, mode);
      } else {
        const cycle = Math.floor(timestamp / 6000);
        const angle = (cycle % 8) * (Math.PI / 4);
        target = freeze({
          x: playerPoint.x + Math.sin(angle) * 2.4,
          y: Math.max(1.05, playerPoint.y + 1.25),
          z: playerPoint.z + Math.cos(angle) * 2.4
        });
        targetId = `curiosity-sector:${cycle % 8}`;
      }
      target = clampTarget(target, playerPoint, Math.max(3.2, finite(maxScoutDistance, 5.8)));
      lastTargetId = targetId;
      state = freeze({
        ...IDLE,
        active: true,
        mode,
        status: candidate ? 'ambient-inspection' : 'ambient-curiosity',
        target,
        targetId,
        startedAt: timestamp,
        expiresAt: timestamp + Math.max(1800, finite(behaviorDurationMs, 5200)),
        stationarySince: finite(stationarySince, 0),
        mutatesMissionState: false,
        privateContentStored: false,
        oneCanonicalCompanion: true
      });
      return state;
    },
    react(candidate = {}, {
      explicitUserAction = false,
      expanseActive = false,
      bonded = false,
      transitActive = false,
      guideActive = false,
      player = {},
      at = now()
    } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      if (!expanseActive) return freeze({ ok: false, reason: 'expanse-not-active', state });
      if (!bonded) return freeze({ ok: false, reason: 'companion-not-bonded', state });
      if (transitActive) return freeze({ ok: false, reason: 'transit-active', state });
      if (guideActive) return freeze({ ok: false, reason: 'explicit-guidance-active', state });
      const safeCandidate = sanitizeCandidate(candidate);
      if (!isSafeAmbientCandidate(safeCandidate)) return freeze({ ok: false, reason: 'safe-reaction-target-required', state });
      const timestamp = finite(at, Date.now());
      const mode = classifyCandidate(safeCandidate);
      const target = clampTarget(candidateTarget(safeCandidate, mode), point(player), Math.max(3.2, finite(maxScoutDistance, 5.8)));
      stationarySince = timestamp;
      cooldownUntil = 0;
      lastTargetId = safeCandidate.id;
      state = freeze({
        ...IDLE,
        active: true,
        mode,
        status: 'explicit-interaction-reaction',
        target,
        targetId: safeCandidate.id,
        startedAt: timestamp,
        expiresAt: timestamp + Math.max(1800, Math.min(4200, finite(behaviorDurationMs, 5200))),
        stationarySince: timestamp,
        mutatesMissionState: false,
        privateContentStored: false,
        oneCanonicalCompanion: true
      });
      return freeze({ ok: true, state });
    },
    cancel(reason = 'cancelled') {
      stationarySince = null;
      cooldownUntil = 0;
      lastTargetId = '';
      state = freeze({ ...IDLE, status: String(reason || 'cancelled') });
      return freeze({ ok: true, state });
    },
    getState() { return state; },
    certify() {
      const errors = [];
      if (state.schema !== EON_EXPANSE_W767G_COMPANION_BEHAVIOR_SCHEMA) errors.push('schema-invalid');
      if (state.mutatesMissionState !== false) errors.push('mission-mutation-forbidden');
      if (state.privateContentStored !== false) errors.push('private-content-forbidden');
      if (state.oneCanonicalCompanion !== true) errors.push('canonical-companion-required');
      if (state.target && ![state.target.x, state.target.y, state.target.z].every((value) => Number.isFinite(Number(value)))) errors.push('target-invalid');
      if (state.target && state.mode !== 'return-formation' && distance2d(state.target, { x: 0, z: 0 }) > 100000) errors.push('target-out-of-bounds');
      return freeze({ ok: errors.length === 0, errors: freeze(errors), state });
    }
  });
}

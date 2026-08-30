const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const point = (value = {}) => freeze({ x: finite(value.x), y: finite(value.y), z: finite(value.z) });

export const EON_EXPANSE_W767B_GUIDANCE_SCHEMA = 'eon.city.expanse.guidance-director.w767b.v1';

const HUMAN_LABELS = freeze({
  'return-to-command-hub': 'Return Gate',
  'scan-dormant-eonbot': 'Scan dormant EONBOT',
  'recover-companion-signal-core': 'Recover signal core',
  'restore-companion-link': 'Restore EONBOT link',
  'meet-pathfinder': 'Pathfinder',
  'meet-navigator': 'Navigator',
  'meet-maintainer': 'Maintenance Worker',
  'activate-expanse-map': 'Expanse map',
  'beacon-one-progress': 'Beacon One',
  'archive-record-collected': 'Archive record',
  'archive-routing-solved': 'Archive routing console',
  'beacon-two-repaired': 'Beacon Two',
  'relay-node-activated': 'Transit relay node',
  'transit-relay-stabilized': 'Transit stabilizer',
  'regional-transit-restored': 'Regional Transit core',
  'verify-three-signals': 'Signal verification console',
  'synchronize-regional-core': 'Regional signal core',
  'unlock-horizon-transit': 'Horizon Transit anchor',
  'open-vault-route': 'Horizon Vault route',
  'enter-vault-chamber': 'Vault Reveal chamber',
  'claim-signal-vanguard': 'Signal Vanguard Reveal',
  'activate-signal-vanguard': 'Activate Signal Vanguard',
  'living-discovery': 'Frontier discovery',
  'productive-mission-review': 'Productive expedition',
  'dynamic-event-reviewed': 'Dynamic signal event'
});

const humanize = (value = '') => String(value || '')
  .replace(/^expanse[-:]/, '')
  .replaceAll('_', '-')
  .split('-')
  .filter(Boolean)
  .map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0]?.toUpperCase() || ''}${part.slice(1)}`)
  .join(' ');

export function getEonExpanseW767BLabelIdentity(metadata = {}, fallback = '') {
  const parts = [
    metadata.kind,
    metadata.action,
    metadata.interactionAction,
    metadata.npcId,
    metadata.missionId,
    metadata.itemId,
    metadata.discoveryId,
    metadata.recordId,
    metadata.relayNodeId,
    metadata.eventId
  ].filter(Boolean).map(String);
  return parts.length ? parts.join(':') : String(fallback || 'expanse-interaction');
}

export function getEonExpanseW767BInteractionTargetId(metadata = {}, fallback = '') {
  const parts = [
    metadata.action,
    metadata.interactionAction,
    metadata.npcId,
    metadata.missionId,
    metadata.itemId,
    metadata.recordId,
    metadata.relayNodeId,
    metadata.discoveryId,
    metadata.eventId,
    metadata.stepId,
    metadata.plotId,
    metadata.slotId,
    metadata.gatewayId,
    metadata.activationId,
    metadata.packageDigest
  ].filter(Boolean).map(String);
  return parts.length ? parts.join(':') : String(fallback || 'expanse-interaction');
}

export function formatEonExpanseW767BInteractionLabel(metadata = {}, fallback = 'Interact') {
  if (metadata.label) return String(metadata.label);
  if (metadata.npcLabel) return String(metadata.npcLabel);
  const action = String(metadata.action || '');
  if (action === 'living-world-interaction' && metadata.interactionAction) return humanize(metadata.interactionAction);
  if (HUMAN_LABELS[action]) return HUMAN_LABELS[action];
  if (metadata.npcId) return humanize(metadata.npcId);
  if (metadata.discoveryId) return humanize(metadata.discoveryId);
  if (metadata.missionId) return humanize(metadata.missionId);
  return humanize(action || metadata.kind || fallback) || fallback;
}

export function buildEonExpanseW767BGroundCircuitRoute({ player = {}, target = null, spacing = 2.8, maxSegments = 18 } = {}) {
  if (!target) return freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: false, length: 0, heading: 0, points: freeze([]) });
  const from = point(player);
  const to = point(target);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  if (!Number.isFinite(length) || length < 0.25) return freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: false, length, heading: 0, points: freeze([]) });
  const safeSpacing = Math.max(1.4, finite(spacing, 2.8));
  const count = Math.max(1, Math.min(Math.max(1, Math.floor(finite(maxSegments, 18))), Math.ceil(length / safeSpacing)));
  const heading = Math.atan2(dx, dz);
  const points = [];
  for (let index = 0; index < count; index += 1) {
    const progress = Math.min(0.94, (index + 1) / (count + 1));
    points.push(freeze({
      x: from.x + dx * progress,
      y: Math.max(0.08, from.y + (to.y - from.y) * progress + 0.08),
      z: from.z + dz * progress,
      heading,
      progress,
      intensity: 0.45 + progress * 0.55
    }));
  }
  return freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: true, from, to, length, heading, points: freeze(points) });
}

export function arbitrateEonExpanseW767BLabels(candidates = [], { maxPrimary = 1, maxNearby = 2, maxDistance = 18, maxPrimaryDistance = 180 } = {}) {
  const visible = candidates
    .map((candidate, index) => ({ ...candidate, index, distance: finite(candidate?.distance, Number.POSITIVE_INFINITY) }))
    .filter((candidate) => candidate?.visible !== false && candidate?.inFront !== false && candidate?.occluded !== true && candidate.distance <= (candidate.primaryObjective === true ? maxPrimaryDistance : maxDistance))
    .sort((a, b) => {
      const aObjective = a.primaryObjective === true ? 0 : 1;
      const bObjective = b.primaryObjective === true ? 0 : 1;
      return aObjective - bObjective || a.distance - b.distance || a.index - b.index;
    });
  const primary = visible.filter((candidate) => candidate.primaryObjective === true).slice(0, Math.max(0, maxPrimary));
  const primaryIds = new Set(primary.map((candidate) => String(candidate.id || candidate.label || candidate.index)));
  const nearby = visible.filter((candidate) => !primaryIds.has(String(candidate.id || candidate.label || candidate.index))).slice(0, Math.max(0, maxNearby));
  const selected = [
    ...primary.map((candidate) => freeze({ ...candidate, role: 'primary-objective' })),
    ...nearby.map((candidate) => freeze({ ...candidate, role: 'nearby-interaction' }))
  ];
  return freeze({
    schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA,
    selected: freeze(selected),
    primaryCount: primary.length,
    nearbyCount: nearby.length,
    rejectedCount: Math.max(0, candidates.length - selected.length)
  });
}

export function createEonExpanseW767BGuideController({ now = Date.now, durationMs = 16000 } = {}) {
  let state = freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: false, objective: '', requestedAt: 0, expiresAt: 0, status: 'idle', leadTarget: null, distance: null });
  const idle = (status = 'idle') => freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: false, objective: '', requestedAt: 0, expiresAt: 0, status, leadTarget: null, distance: null });
  return freeze({
    request(guidance = {}, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      if (!guidance?.active || !guidance?.target || !guidance?.objective) return freeze({ ok: false, reason: 'active-objective-required', state });
      const at = finite(now(), Date.now());
      state = freeze({ schema: EON_EXPANSE_W767B_GUIDANCE_SCHEMA, active: true, objective: String(guidance.objective), requestedAt: at, expiresAt: at + Math.max(4000, finite(durationMs, 16000)), status: 'guiding', leadTarget: point(guidance.target), distance: finite(guidance.distance, null) });
      return freeze({ ok: true, state });
    },
    update(guidance = {}, player = {}, at = now()) {
      if (!state.active) return state;
      const timestamp = finite(at, Date.now());
      if (!guidance?.active || !guidance?.target || String(guidance.objective || '') !== state.objective) {
        state = idle('objective-changed');
        return state;
      }
      const px = finite(player.x); const pz = finite(player.z);
      const tx = finite(guidance.target.x); const tz = finite(guidance.target.z);
      const dx = tx - px; const dz = tz - pz;
      const distance = Math.hypot(dx, dz);
      if (distance <= 3.2) {
        state = freeze({ ...idle('arrived'), objective: String(guidance.objective || ''), distance, leadTarget: point(guidance.target) });
        return state;
      }
      if (timestamp >= state.expiresAt) {
        state = idle('expired');
        return state;
      }
      const leadDistance = Math.min(5.2, Math.max(2.8, distance * 0.24));
      const scale = leadDistance / Math.max(0.001, distance);
      state = freeze({ ...state, status: 'guiding', distance, leadTarget: freeze({ x: px + dx * scale, y: Math.max(1.05, finite(guidance.target.y, 0.2) + 0.95), z: pz + dz * scale }) });
      return state;
    },
    cancel(reason = 'cancelled') { state = idle(String(reason || 'cancelled')); return freeze({ ok: true, state }); },
    getState() { return state; }
  });
}

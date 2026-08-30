
const freeze = (value) => Object.freeze(value);
export const EON_EXPANSE_W766H_PLAYABILITY_SCHEMA = 'eon.city.expanse.playability.w766h.v1';

export const EON_EXPANSE_W766H_OBJECTIVE_TARGETS = freeze({
  'review-expedition': freeze({ x: 0, y: 1.2, z: 10, zoneId: 'gateway-overlook' }),
  'enter-expanse': freeze({ x: 0, y: 1.2, z: 10, zoneId: 'gateway-overlook' }),
  'detect-companion-signal': freeze({ x: 5.4, y: 1.2, z: 3.2, zoneId: 'gateway-overlook' }),
  'scan-dormant-eonbot': freeze({ x: 5.4, y: 1.2, z: 3.2, zoneId: 'gateway-overlook' }),
  'recover-signal-core': freeze({ x: 7.35, y: 1.1, z: 2.1, zoneId: 'gateway-overlook' }),
  'restore-companion-link': freeze({ x: 5.4, y: 1.2, z: 3.2, zoneId: 'gateway-overlook' }),
  'meet-pathfinder': freeze({ x: 4, y: 1.4, z: 6, zoneId: 'gateway-overlook' }),
  'activate-map': freeze({ x: -4, y: 1.2, z: 8, zoneId: 'gateway-overlook' }),
  'visit-overlook': freeze({ x: 0, y: 1.2, z: -8, zoneId: 'gateway-overlook' }),
  'reach-beacon-one': freeze({ x: -42, y: 2.5, z: -32, zoneId: 'beacon-fields' }),
  'scan-beacon-one': freeze({ x: -42, y: 2.5, z: -32, zoneId: 'beacon-fields' }),
  'recover-signal-components': freeze({ x: -42, y: 2.5, z: -32, zoneId: 'beacon-fields' }),
  'repair-beacon-one': freeze({ x: -42, y: 2.5, z: -32, zoneId: 'beacon-fields' }),
  'reveal-beacon-fields': freeze({ x: -42, y: 1.2, z: -32, zoneId: 'beacon-fields' }),
  'reach-archive-ruins': freeze({ x: 42, y: 1.5, z: -48, zoneId: 'archive-ruins' }),
  'meet-navigator': freeze({ x: 38, y: 1.5, z: -46, zoneId: 'archive-ruins' }),
  'recover-archive-records': freeze({ x: 42, y: 1.5, z: -48, zoneId: 'archive-ruins' }),
  'solve-signal-routing': freeze({ x: 46, y: 1.4, z: -51, zoneId: 'archive-ruins' }),
  'repair-beacon-two': freeze({ x: 42, y: 2.7, z: -55, zoneId: 'archive-ruins' }),
  'reach-transit-scar': freeze({ x: -12, y: 1.5, z: -88, zoneId: 'transit-scar' }),
  'meet-maintainer': freeze({ x: -17, y: 1.5, z: -84, zoneId: 'transit-scar' }),
  'activate-relay-nodes': freeze({ x: -12, y: 1.5, z: -88, zoneId: 'transit-scar' }),
  'stabilize-transit-relay': freeze({ x: -8, y: 2.2, z: -92, zoneId: 'transit-scar' }),
  'restore-regional-transit': freeze({ x: -12, y: 2.0, z: -96, zoneId: 'transit-scar' }),
  'reach-horizon-vault': freeze({ x: 18, y: 1.5, z: -132, zoneId: 'horizon-vault' }),
  'verify-three-signals': freeze({ x: 12, y: 1.8, z: -126, zoneId: 'horizon-vault' }),
  'synchronize-regional-core': freeze({ x: 18, y: 2.5, z: -132, zoneId: 'horizon-vault' }),
  'unlock-horizon-transit': freeze({ x: 25, y: 1.8, z: -128, zoneId: 'horizon-vault' }),
  'open-vault-route': freeze({ x: 18, y: 2.0, z: -140, zoneId: 'horizon-vault' }),
  'enter-vault-chamber': freeze({ x: 18, y: 1.5, z: -146, zoneId: 'horizon-vault' }),
  'claim-signal-vanguard': freeze({ x: 18, y: 2.0, z: -150, zoneId: 'horizon-vault' }),
  'activate-cosmetic': freeze({ x: 18, y: 2.3, z: -150, zoneId: 'horizon-vault' }),
  'return-command-hub': freeze({ x: 0, y: 1.5, z: 14, zoneId: 'gateway-overlook' }),
  'confirm-campaign-receipt': freeze({ x: 0, y: 1.5, z: 10, zoneId: 'gateway-overlook' })
});

export function buildEonExpanseW766HGuidance(board = null, player = {}) {
  const objective = String(board?.activeMission?.currentObjective || '');
  const target = EON_EXPANSE_W766H_OBJECTIVE_TARGETS[objective] || null;
  if (!objective || !target) return freeze({ schema: EON_EXPANSE_W766H_PLAYABILITY_SCHEMA, active: false, objective: '', target: null, distance: null, prompt: board?.completion?.campaignComplete ? 'Signal Restoration complete.' : 'Choose a mission on the Mission Board.' });
  const distance = Math.hypot(Number(player.x || 0) - target.x, Number(player.z || 0) - target.z);
  const guidance = board?.activeMission?.guidance?.label || objective.replaceAll('-', ' ');
  const prompt = distance <= 4 ? `Interact: ${guidance}` : `${guidance} · ${Math.round(distance)} m`;
  return freeze({ schema: EON_EXPANSE_W766H_PLAYABILITY_SCHEMA, active: true, objective, target, distance, prompt, nearTarget: distance <= 4 });
}
export function validateEonExpanseW766HPrimaryRoutes({ zones = [], maxGap = 70, minWidth = 4.5 } = {}) {
  const failures = [];
  if (zones.length < 2) failures.push('at-least-two-zones-required');
  for (let index = 0; index < zones.length - 1; index += 1) {
    const from = zones[index]; const to = zones[index + 1];
    const distance = Math.hypot(Number(to.x) - Number(from.x), Number(to.z) - Number(from.z));
    if (!Number.isFinite(distance) || distance <= 0) failures.push(`invalid-route:${from.id}:${to.id}`);
    if (distance > maxGap) failures.push(`route-gap-exceeds-budget:${from.id}:${to.id}:${Math.round(distance)}`);
  }
  if (minWidth < 4.5) failures.push('route-width-below-player-camera-clearance');
  return freeze({ ok: failures.length === 0, failures: freeze(failures), segmentCount: Math.max(0, zones.length - 1), maxGap, minWidth });
}

export function createEonExpanseW766HTransitJourney({ durationMs = 2600 } = {}) {
  let state = freeze({ status: 'idle', from: null, to: null, startedAt: 0, progress: 0, pose: null });
  return freeze({
    begin(from, to, now = Date.now()) {
      if (!from || !to) return freeze({ ok: false, reason: 'journey-endpoints-required' });
      state = freeze({ status: 'active', from: freeze({ ...from }), to: freeze({ ...to }), startedAt: Number(now), progress: 0, pose: freeze({ x: Number(from.x), y: Number(from.y || 0.15), z: Number(from.z) }) });
      return freeze({ ok: true, state });
    },
    update(now = Date.now()) {
      if (state.status !== 'active') return state;
      const raw = Math.max(0, Math.min(1, (Number(now) - state.startedAt) / durationMs));
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const lift = Math.sin(Math.PI * eased) * 2.2;
      const pose = freeze({ x: state.from.x + (state.to.x - state.from.x) * eased, y: Number(state.from.y || 0.15) + lift, z: state.from.z + (state.to.z - state.from.z) * eased });
      state = freeze({ ...state, status: raw >= 1 ? 'complete' : 'active', progress: raw, pose });
      return state;
    },
    finish() { const result = state; state = freeze({ status: 'idle', from: null, to: null, startedAt: 0, progress: 0, pose: null }); return result; },
    cancel(reason = 'cancelled') { const result = state; state = freeze({ status: 'idle', from: null, to: null, startedAt: 0, progress: 0, pose: null, cancelledReason: String(reason || 'cancelled') }); return freeze({ ok: true, previous: result, state }); },
    getState() { return state; }
  });
}

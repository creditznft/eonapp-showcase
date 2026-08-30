/**
 * W766IR2-B — one named input-lock lease authority for EON City overlays.
 *
 * The manager stores only local runtime diagnostics. It never reads account,
 * project, prompt, file, provider or billing data.
 */
export const EON_CITY_W766IR2_INPUT_LOCK_SCHEMA = 'eon.city.input-lock-leases.w766ir2-b.v1';
export const EON_CITY_W766IR2_INPUT_LOCK_OWNERS = Object.freeze([
  'city-menu',
  'accessible-map',
  'transit-review',
  'work-surface',
  'expanse-entry-review',
  'city-readiness'
]);

const OWNER_SET = new Set(EON_CITY_W766IR2_INPUT_LOCK_OWNERS);
const freeze = (value) => Object.freeze(value);
const safeText = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9._:/-]/gi, '-').replace(/-+/g, '-').slice(0, max);

const SURFACE_KEY_BY_OWNER = Object.freeze({
  'city-menu': 'cityMenu',
  'accessible-map': 'accessibleMap',
  'transit-review': 'transitReview',
  'work-surface': 'workSurface',
  'expanse-entry-review': 'expanseReview',
  'city-readiness': 'cityReadiness'
});

const normalizeSurfaceLifecycle = (value, activeOwnerIds) => {
  if (value === true) {
    return freeze({
      logicalOpen: true,
      connected: true,
      accessibilityHidden: false,
      intentionallyHidden: false,
      transitionActive: false,
      successorOwnerId: '',
      successorActive: false,
      geometryVisible: true,
      legacyBoolean: true
    });
  }
  if (!value || value === false || typeof value !== 'object') {
    return freeze({
      logicalOpen: false,
      connected: false,
      accessibilityHidden: true,
      intentionallyHidden: true,
      transitionActive: false,
      successorOwnerId: '',
      successorActive: false,
      geometryVisible: false,
      legacyBoolean: true
    });
  }
  const successorOwnerId = safeText(value.successorOwnerId, 64);
  return freeze({
    logicalOpen: value.logicalOpen === true,
    connected: value.connected === true,
    accessibilityHidden: value.accessibilityHidden === true,
    intentionallyHidden: value.intentionallyHidden === true || value.hidden === true,
    transitionActive: value.transitionActive === true,
    successorOwnerId,
    successorActive: Boolean(successorOwnerId && activeOwnerIds.has(successorOwnerId)),
    geometryVisible: typeof value.geometryVisible === 'boolean' ? value.geometryVisible : null,
    legacyBoolean: false
  });
};

/**
 * Return mature input leases whose controller-owned surface lifecycle is no
 * longer open and whose expected DOM surface is genuinely unavailable.
 *
 * Geometry is retained as diagnostic evidence only. A temporary zero-size or
 * offscreen rectangle must never close a logically open maintained surface.
 * A grace period protects first paint and explicit synchronous handoffs.
 */
export function getEonCityW766IR2OrphanedInputLockOwners({
  snapshot = null,
  surfaceState = {},
  at = Date.now(),
  graceMs = 1200
} = {}) {
  const leases = Array.isArray(snapshot?.activeLeases) ? snapshot.activeLeases : [];
  const activeOwnerIds = new Set(leases.map((lease) => safeText(lease?.ownerId, 64)).filter(Boolean));
  const clock = Number(at || Date.now());
  const grace = Math.max(0, Number(graceMs || 0));
  const orphaned = [];
  for (const lease of leases) {
    const ownerId = safeText(lease?.ownerId, 64);
    const surfaceKey = SURFACE_KEY_BY_OWNER[ownerId];
    if (!surfaceKey) continue;
    const ageMs = Math.max(0, clock - Number(lease?.acquiredAt || clock));
    if (ageMs < grace) continue;
    const lifecycle = normalizeSurfaceLifecycle(surfaceState?.[surfaceKey], activeOwnerIds);
    if (lifecycle.logicalOpen || lifecycle.transitionActive || lifecycle.successorActive) continue;
    const expectedSurfaceUnavailable = lifecycle.connected === false
      || lifecycle.accessibilityHidden
      || lifecycle.intentionallyHidden;
    if (!expectedSurfaceUnavailable) continue;
    orphaned.push(freeze({
      ownerId,
      surfaceKey,
      ageMs,
      acquiredAt: Number(lease?.acquiredAt || 0),
      lifecycle
    }));
  }
  return freeze(orphaned);
}

export function createEonCityW766IR2InputLockLeaseManager({ now = Date.now, onEvent = null } = {}) {
  const leases = new Map();
  const events = [];
  let sequence = 0;
  let disposed = false;

  const emit = (type, detail = {}) => {
    const event = freeze({
      schema: EON_CITY_W766IR2_INPUT_LOCK_SCHEMA,
      sequence: ++sequence,
      at: Number(now?.() || Date.now()),
      type: safeText(type, 64) || 'input-lock-event',
      ownerId: safeText(detail.ownerId, 64) || null,
      reason: safeText(detail.reason, 96) || null,
      result: safeText(detail.result, 64) || null,
      activeOwners: freeze([...leases.keys()])
    });
    events.push(event);
    while (events.length > 96) events.shift();
    try { onEvent?.(event); } catch {}
    return event;
  };

  const validateOwner = (ownerId) => {
    const normalized = safeText(ownerId, 64);
    if (!OWNER_SET.has(normalized)) return freeze({ ok: false, ownerId: normalized, reason: 'unknown-input-lock-owner' });
    return freeze({ ok: true, ownerId: normalized });
  };

  const acquire = (ownerId, metadata = {}) => {
    if (disposed) return freeze({ ok: false, ownerId: safeText(ownerId, 64), reason: 'input-lock-manager-disposed' });
    const owner = validateOwner(ownerId);
    if (!owner.ok) {
      emit('acquire-rejected', { ownerId: owner.ownerId, reason: owner.reason, result: 'rejected' });
      return owner;
    }
    if (leases.has(owner.ownerId)) {
      emit('acquire-rejected', { ownerId: owner.ownerId, reason: 'duplicate-input-lock-acquire', result: 'rejected' });
      return freeze({ ok: false, ownerId: owner.ownerId, reason: 'duplicate-input-lock-acquire', lease: leases.get(owner.ownerId) });
    }
    const lease = freeze({
      schema: EON_CITY_W766IR2_INPUT_LOCK_SCHEMA,
      ownerId: owner.ownerId,
      acquiredAt: Number(now?.() || Date.now()),
      source: safeText(metadata?.source || owner.ownerId, 96) || owner.ownerId,
      reason: safeText(metadata?.reason || 'explicit-open', 96) || 'explicit-open'
    });
    leases.set(owner.ownerId, lease);
    emit('acquired', { ownerId: owner.ownerId, reason: lease.reason, result: 'active' });
    return freeze({ ok: true, ownerId: owner.ownerId, lease, movementBlocked: true });
  };

  const release = (ownerId, reason = 'explicit-close') => {
    if (disposed) return freeze({ ok: false, ownerId: safeText(ownerId, 64), reason: 'input-lock-manager-disposed' });
    const owner = validateOwner(ownerId);
    if (!owner.ok) {
      emit('release-rejected', { ownerId: owner.ownerId, reason: owner.reason, result: 'rejected' });
      return owner;
    }
    if (!leases.has(owner.ownerId)) {
      emit('release-rejected', { ownerId: owner.ownerId, reason: 'unknown-input-lock-release', result: 'rejected' });
      return freeze({ ok: false, ownerId: owner.ownerId, reason: 'unknown-input-lock-release' });
    }
    const lease = leases.get(owner.ownerId);
    leases.delete(owner.ownerId);
    emit('released', { ownerId: owner.ownerId, reason, result: 'released' });
    return freeze({ ok: true, ownerId: owner.ownerId, reason: safeText(reason, 96), lease, movementBlocked: leases.size > 0 });
  };

  const releaseAllForOwner = (ownerId, reason = 'owner-disposed') => {
    const owner = validateOwner(ownerId);
    if (!owner.ok) return owner;
    if (!leases.has(owner.ownerId)) return freeze({ ok: true, ownerId: owner.ownerId, released: 0, reason: 'no-active-lease' });
    const result = release(owner.ownerId, reason);
    return freeze({ ...result, released: result.ok ? 1 : 0 });
  };

  const getSnapshot = () => freeze({
    schema: EON_CITY_W766IR2_INPUT_LOCK_SCHEMA,
    disposed,
    movementBlocked: leases.size > 0,
    activeOwnerIds: freeze([...leases.keys()]),
    activeLeases: freeze([...leases.values()]),
    events: freeze([...events])
  });

  return freeze({
    schema: EON_CITY_W766IR2_INPUT_LOCK_SCHEMA,
    acquire,
    release,
    releaseAllForOwner,
    has(ownerId) { return leases.has(safeText(ownerId, 64)); },
    isMovementBlocked() { return leases.size > 0; },
    getSnapshot,
    dispose(reason = 'runtime-destroyed') {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true, released: 0 });
      const active = [...leases.keys()];
      for (const ownerId of active) release(ownerId, reason);
      disposed = true;
      emit('disposed', { reason, result: 'disposed' });
      return freeze({ ok: true, released: active.length });
    }
  });
}

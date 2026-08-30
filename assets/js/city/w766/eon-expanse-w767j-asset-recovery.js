const freeze = (value) => Object.freeze(value);
const totalsOf = (report = {}) => ({
  requested: Number(report?.totals?.requested || 0),
  presented: Number(report?.totals?.presented || 0),
  pending: Number(report?.totals?.pending || 0),
  rejected: Number(report?.totals?.rejected || 0),
  proceduralFallback: Number(report?.totals?.proceduralFallback || 0)
});

export const EON_EXPANSE_W767J_ASSET_RECOVERY_SCHEMA = 'eon.city.expanse.asset-recovery.w767j.v1';

export function createEonExpanseW767JAssetRecoveryController({
  now = () => Date.now(),
  cooldownMs = 10000,
  maxAttempts = 3
} = {}) {
  const safeCooldownMs = Math.max(1000, Number(cooldownMs || 10000));
  const safeMaxAttempts = Math.max(1, Math.min(5, Number(maxAttempts || 3)));
  let attemptCount = 0;
  let activeToken = '';
  let lastAttemptAt = 0;
  let lastCompletedAt = 0;
  let lastReason = '';
  let lastReport = null;
  let sequence = 0;

  const snapshot = ({ expanseActive = false, at = now() } = {}) => {
    const totals = totalsOf(lastReport || {});
    const releaseReady = lastReport?.releaseReady === true;
    const repairRequired = totals.rejected > 0 || totals.proceduralFallback > 0 || Number(lastReport?.missingZoneIds?.length || 0) > 0;
    const pending = totals.pending > 0;
    const exhausted = attemptCount >= safeMaxAttempts && repairRequired;
    const coolingDown = lastAttemptAt > 0 && at < lastAttemptAt + safeCooldownMs;
    let status = 'idle';
    if (activeToken) status = 'retrying';
    else if (!expanseActive) status = 'inactive';
    else if (releaseReady) status = 'release-ready';
    else if (pending) status = 'loading';
    else if (exhausted) status = 'exhausted';
    else if (repairRequired && coolingDown) status = 'cooldown';
    else if (repairRequired) status = 'available';
    return freeze({
      schema: EON_EXPANSE_W767J_ASSET_RECOVERY_SCHEMA,
      status,
      available: status === 'available',
      retrying: status === 'retrying',
      repairRequired,
      releaseReady,
      expanseActive,
      attemptCount,
      maxAttempts: safeMaxAttempts,
      remainingAttempts: Math.max(0, safeMaxAttempts - attemptCount),
      cooldownMs: safeCooldownMs,
      nextAllowedAt: coolingDown ? lastAttemptAt + safeCooldownMs : 0,
      lastAttemptAt,
      lastCompletedAt,
      lastReason,
      totals: freeze(totals),
      activeToken: activeToken || '',
      explicitUserActionRequired: true,
      automaticRetry: false,
      ownsScene: false,
      storesPrivateContent: false
    });
  };

  const inspect = (report = {}, { expanseActive = false, at = now() } = {}) => {
    lastReport = report || null;
    return snapshot({ expanseActive, at });
  };

  const request = (report = {}, { explicitUserAction = false, expanseActive = false, at = now() } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: inspect(report, { expanseActive, at }) });
    const state = inspect(report, { expanseActive, at });
    if (state.status === 'inactive') return freeze({ ok: false, reason: 'expanse-not-active', state });
    if (state.status === 'loading') return freeze({ ok: false, reason: 'asset-load-pending', state });
    if (state.status === 'release-ready' || !state.repairRequired) return freeze({ ok: false, reason: 'authored-assets-retry-not-required', state });
    if (state.status === 'retrying') return freeze({ ok: false, reason: 'asset-retry-already-active', state });
    if (state.status === 'cooldown') return freeze({ ok: false, reason: 'asset-retry-cooldown', state });
    if (state.status === 'exhausted') return freeze({ ok: false, reason: 'asset-retry-attempts-exhausted', state });
    attemptCount += 1;
    lastAttemptAt = at;
    lastReason = '';
    sequence += 1;
    activeToken = `w767j:${attemptCount}:${sequence}:${at}`;
    return freeze({ ok: true, token: activeToken, state: snapshot({ expanseActive, at }) });
  };

  const complete = (token = '', { ok = false, report = {}, reason = '', expanseActive = true, at = now() } = {}) => {
    if (!activeToken || token !== activeToken) return freeze({ ok: false, reason: 'valid-active-retry-token-required', state: snapshot({ expanseActive, at }) });
    activeToken = '';
    lastCompletedAt = at;
    lastReason = ok ? '' : String(reason || 'asset-retry-failed').slice(0, 160);
    lastReport = report || null;
    const state = snapshot({ expanseActive, at });
    return freeze({ ok: Boolean(ok), reason: ok ? '' : lastReason, state });
  };

  const cancel = (reason = 'cancelled', { expanseActive = false, at = now() } = {}) => {
    if (activeToken) {
      activeToken = '';
      lastCompletedAt = at;
      lastReason = String(reason || 'cancelled').slice(0, 160);
    }
    return freeze({ ok: true, state: snapshot({ expanseActive, at }) });
  };

  const certify = ({ expanseActive = true, at = now() } = {}) => {
    const state = snapshot({ expanseActive, at });
    return freeze({
      ok: true,
      schema: EON_EXPANSE_W767J_ASSET_RECOVERY_SCHEMA,
      explicitUserActionRequired: state.explicitUserActionRequired,
      automaticRetryDisabled: state.automaticRetry === false,
      boundedAttempts: state.maxAttempts <= 5,
      cooldownEnforced: state.cooldownMs >= 1000,
      canonicalSceneOwnershipPreserved: state.ownsScene === false,
      privateContentStored: state.storesPrivateContent,
      state
    });
  };

  return freeze({ inspect, request, complete, cancel, getState: (options = {}) => snapshot(options), certify });
}

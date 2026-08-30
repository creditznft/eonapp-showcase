/** W770F — explicit, bounded recovery for rejected My Frontier composition parts. */
const freeze = Object.freeze;

export const EON_EXPANSE_W770F_COMPOSITION_RECOVERY_SCHEMA = 'eon.expanse.my-frontier-composition-recovery.w770f.v1';

const totalsOf = (summary = {}) => freeze({
  requested: Math.max(0, Number(summary?.requestedPartCount || 0)),
  presented: Math.max(0, Number(summary?.presentedPartCount || 0)),
  pending: Math.max(0, Number(summary?.loadingPartCount || summary?.pendingTasks || 0)),
  rejected: Math.max(0, Number(summary?.rejectedPartCount || 0)),
  proceduralFallback: Math.max(0, (Array.isArray(summary?.plots) ? summary.plots : []).filter((plot) => plot?.status === 'rejected-authored-composition').length)
});

export function createEonExpanseW770FCompositionRecoveryController({
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
  let lastSummary = null;
  let sequence = 0;

  const snapshot = ({ expanseActive = false, at = now() } = {}) => {
    const totals = totalsOf(lastSummary || {});
    const repairRequired = totals.rejected > 0 || totals.proceduralFallback > 0;
    const pending = totals.pending > 0;
    const releaseReady = totals.requested > 0 && totals.presented === totals.requested && !pending && !repairRequired;
    const exhausted = repairRequired && attemptCount >= safeMaxAttempts;
    const coolingDown = lastAttemptAt > 0 && at < lastAttemptAt + safeCooldownMs;
    let status = 'idle';
    if (activeToken) status = 'retrying';
    else if (!expanseActive) status = 'inactive';
    else if (pending) status = 'loading';
    else if (releaseReady || (!repairRequired && totals.requested > 0)) status = 'release-ready';
    else if (exhausted) status = 'exhausted';
    else if (repairRequired && coolingDown) status = 'cooldown';
    else if (repairRequired) status = 'available';
    return freeze({
      schema: EON_EXPANSE_W770F_COMPOSITION_RECOVERY_SCHEMA,
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
      totals,
      activeToken: activeToken || '',
      explicitUserActionRequired: true,
      automaticRetry: false,
      scaffoldingPreserved: true,
      foundationPreserved: true,
      ownsScene: false,
      storesPrivateContent: false
    });
  };

  const inspect = (summary = {}, { expanseActive = false, at = now() } = {}) => {
    lastSummary = summary || null;
    return snapshot({ expanseActive, at });
  };

  const request = (summary = {}, { explicitUserAction = false, expanseActive = false, at = now() } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: inspect(summary, { expanseActive, at }) });
    const state = inspect(summary, { expanseActive, at });
    if (state.status === 'inactive') return freeze({ ok: false, reason: 'expanse-not-active', state });
    if (state.status === 'loading') return freeze({ ok: false, reason: 'composition-load-pending', state });
    if (state.status === 'release-ready' || !state.repairRequired) return freeze({ ok: false, reason: 'composition-retry-not-required', state });
    if (state.status === 'retrying') return freeze({ ok: false, reason: 'composition-retry-already-active', state });
    if (state.status === 'cooldown') return freeze({ ok: false, reason: 'composition-retry-cooldown', state });
    if (state.status === 'exhausted') return freeze({ ok: false, reason: 'composition-retry-attempts-exhausted', state });
    attemptCount += 1;
    lastAttemptAt = at;
    lastReason = '';
    sequence += 1;
    activeToken = `w770f:${attemptCount}:${sequence}:${at}`;
    return freeze({ ok: true, token: activeToken, state: snapshot({ expanseActive, at }) });
  };

  const complete = (token = '', { ok = false, summary = {}, reason = '', expanseActive = true, at = now() } = {}) => {
    if (!activeToken || token !== activeToken) return freeze({ ok: false, reason: 'valid-active-composition-retry-token-required', state: snapshot({ expanseActive, at }) });
    activeToken = '';
    lastCompletedAt = at;
    lastReason = ok ? '' : String(reason || 'composition-retry-failed').slice(0, 160);
    lastSummary = summary || null;
    return freeze({ ok: Boolean(ok), reason: ok ? '' : lastReason, state: snapshot({ expanseActive, at }) });
  };

  const cancel = (reason = 'cancelled', { expanseActive = false, at = now() } = {}) => {
    if (activeToken) {
      activeToken = '';
      lastCompletedAt = at;
      lastReason = String(reason || 'cancelled').slice(0, 160);
    }
    return freeze({ ok: true, state: snapshot({ expanseActive, at }) });
  };

  return freeze({ inspect, request, complete, cancel, getState: (options = {}) => snapshot(options) });
}

export default freeze({ EON_EXPANSE_W770F_COMPOSITION_RECOVERY_SCHEMA, createEonExpanseW770FCompositionRecoveryController });

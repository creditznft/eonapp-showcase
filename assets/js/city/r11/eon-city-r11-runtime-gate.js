const freeze = (value) => Object.freeze(value);
export const EON_CITY_R11_RUNTIME_GATE_SCHEMA = 'eon.city.owner-runtime-gate.r11.v1';
export const EON_CITY_R11_RUNTIME_GATE_EVENT = 'eon:city:owner-runtime-gate:r11';

export function evaluateEonCityR11RuntimeGate({
  spatialReport = null,
  surfaceSnapshot = null,
  viewportProfile = null,
  firstPlayableFrame = true
} = {}) {
  const failures = [];
  if (firstPlayableFrame !== true) failures.push('first-playable-frame');
  if (spatialReport?.ok !== true) failures.push('spatial-diagnostics');
  if ((surfaceSnapshot?.openBlockingCount ?? 0) > 1) failures.push('blocking-surface-count');
  if (!viewportProfile?.id) failures.push('viewport-profile');
  if (viewportProfile?.mobile && Number(viewportProfile?.labelBudget || 0) > 1) failures.push('mobile-label-budget');
  return freeze({
    schema: EON_CITY_R11_RUNTIME_GATE_SCHEMA,
    ok: failures.length === 0,
    ownerCandidateReady: failures.length === 0,
    failures: freeze(failures),
    spatialOk: spatialReport?.ok === true,
    openBlockingCount: Number(surfaceSnapshot?.openBlockingCount || 0),
    viewportProfileId: String(viewportProfile?.id || ''),
    firstPlayableFrame: firstPlayableFrame === true
  });
}

export function publishEonCityR11RuntimeGate(result, { environment = globalThis, root = null } = {}) {
  const gate = result?.schema === EON_CITY_R11_RUNTIME_GATE_SCHEMA ? result : evaluateEonCityR11RuntimeGate(result || {});
  if (root?.dataset) {
    root.dataset.eonCityOwnerRuntimeGate = gate.ok ? 'pass' : 'fail';
    root.dataset.eonCityOwnerRuntimeFailures = gate.failures.join('|');
  }
  if (typeof environment?.dispatchEvent === 'function' && typeof environment?.CustomEvent === 'function') {
    environment.dispatchEvent(new environment.CustomEvent(EON_CITY_R11_RUNTIME_GATE_EVENT, { detail: gate }));
  }
  return gate;
}

export default freeze({ EON_CITY_R11_RUNTIME_GATE_SCHEMA, EON_CITY_R11_RUNTIME_GATE_EVENT, evaluateEonCityR11RuntimeGate, publishEonCityR11RuntimeGate });

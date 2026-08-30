/**
 * L95-W16C — progressive City asset admission policy.
 *
 * The visible-frame gate remains unconditional. This policy only governs
 * post-entry authored detail (stations, terminals, role NPCs, discoveries and
 * ambience) so browser-side GLB decode/scene attachment cannot keep competing
 * with low-FPS gameplay, Local AI, or a hidden tab.
 */
export const EON_CITY_L95_PROGRESSIVE_ASSET_ADMISSION_SCHEMA = 'eon.city.l95.progressive-asset-admission.v1';

const freeze = (value) => Object.freeze(value);
const PRESSURES = new Set(['nominal', 'elevated', 'critical']);

function normalizePressure(value = 'nominal') {
  const candidate = String(value || '').trim().toLowerCase();
  return PRESSURES.has(candidate) ? candidate : 'nominal';
}

export function buildEonCityL95ProgressiveAssetAdmission({
  pressure = 'nominal',
  visibility = 'visible',
  maxConcurrentLoads = 1,
  reason = ''
} = {}) {
  const normalizedPressure = normalizePressure(pressure);
  const normalizedVisibility = String(visibility || '').trim().toLowerCase() === 'hidden' ? 'hidden' : 'visible';
  const maximum = Math.max(1, Math.min(2, Number(maxConcurrentLoads || 1)));
  const optionalConcurrencyLimit = normalizedVisibility === 'hidden' || normalizedPressure === 'critical'
    ? 0
    : normalizedPressure === 'elevated'
      ? 1
      : maximum;
  return freeze({
    schema: EON_CITY_L95_PROGRESSIVE_ASSET_ADMISSION_SCHEMA,
    pressure: normalizedPressure,
    visibility: normalizedVisibility,
    reason: String(reason || '').slice(0, 120),
    maxConcurrentLoads: maximum,
    optionalConcurrencyLimit,
    optionalPaused: optionalConcurrencyLimit === 0,
    visibleFrameBypassesAdmission: true,
    cancelInflightLoads: false,
    sameSessionResidentAssetsRetained: true,
    networkCacheAuthorityChanged: false
  });
}

export function validateEonCityL95ProgressiveAssetAdmission(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_L95_PROGRESSIVE_ASSET_ADMISSION_SCHEMA) errors.push('schema');
  if (!PRESSURES.has(String(plan.pressure || ''))) errors.push('pressure');
  if (!['visible', 'hidden'].includes(String(plan.visibility || ''))) errors.push('visibility');
  if (!Number.isInteger(plan.optionalConcurrencyLimit) || plan.optionalConcurrencyLimit < 0 || plan.optionalConcurrencyLimit > Number(plan.maxConcurrentLoads || 0)) errors.push('optional-concurrency');
  if (plan.visibleFrameBypassesAdmission !== true) errors.push('visible-frame-bypass');
  if (plan.cancelInflightLoads !== false) errors.push('inflight-cancel');
  if (plan.networkCacheAuthorityChanged !== false) errors.push('cache-authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

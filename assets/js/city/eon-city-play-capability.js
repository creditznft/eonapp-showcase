/**
 * W249 — EON City Play capability policy.
 *
 * This is a conservative local-only hint, never a lockout. The direct Babylon
 * City route stays canonical; low-detail mode is offered only as same-route recovery.
 */
export const CITY_PLAY_CAPABILITY_SCHEMA = 'eon.city.play.capability.v1';

function finiteInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function getReducedMotion(matchMediaFn = globalThis.matchMedia?.bind(globalThis)) {
  try { return Boolean(matchMediaFn?.('(prefers-reduced-motion: reduce)')?.matches); } catch { return false; }
}

function supportsWebgl(documentRef = globalThis.document) {
  try {
    const canvas = documentRef?.createElement?.('canvas');
    if (!canvas?.getContext) return false;
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function assessCityPlayCapability(input = {}) {
  const webgl = input.webgl === undefined ? supportsWebgl(input.document) : Boolean(input.webgl);
  const cores = finiteInteger(input.cores);
  const memoryGb = finiteInteger(input.memoryGb);
  const reducedMotion = input.reducedMotion === undefined ? getReducedMotion(input.matchMedia) : Boolean(input.reducedMotion);
  const saveData = Boolean(input.saveData);
  const coarsePointer = Boolean(input.coarsePointer);
  const touchPoints = finiteInteger(input.touchPoints) || 0;
  const isMobile = input.isMobile === undefined
    ? coarsePointer || touchPoints > 1
    : Boolean(input.isMobile);

  let recommendedQuality = 'balanced';
  const lowTier = (memoryGb !== null && memoryGb <= 4) || (cores !== null && cores <= 4) || saveData || reducedMotion;
  const highTier = !lowTier && memoryGb !== null && memoryGb >= 8 && cores !== null && cores >= 8;
  if (lowTier) recommendedQuality = 'lite';
  else if (highTier) recommendedQuality = 'cinematic';

  const reasons = [];
  if (!webgl) reasons.push('WebGL is unavailable in this browser.');
  if (lowTier) reasons.push("This device is better served by EON City’s low-detail graphics mode.");
  if (reducedMotion) reasons.push('Reduced motion is enabled, so Play will use the lightest safe effects.');
  if (saveData) reasons.push("Data Saver is reported, so EON City’s low-detail graphics mode is recommended.");

  return Object.freeze({
    schema: CITY_PLAY_CAPABILITY_SCHEMA,
    webgl,
    eligible: webgl,
    recommendedQuality,
    lowTier,
    highTier,
    reducedMotion,
    saveData,
    cores,
    memoryGb,
    isMobile,
    landscapeRecommended: isMobile,
    reasons: Object.freeze(reasons),
    guidance: webgl
      ? (lowTier ? 'Low-detail EON City is recommended; the direct City route remains your optional choice.' : 'EON City can start after your explicit request.')
      : 'EON City cannot start a 3D renderer in this browser. Try again later; no City data was lost.'
  });
}

export function getCityPlayCapability(environment = {}) {
  const navigatorRef = environment.navigator || globalThis.navigator || {};
  const connection = navigatorRef.connection || navigatorRef.mozConnection || navigatorRef.webkitConnection || {};
  const matchMediaFn = environment.matchMedia || globalThis.matchMedia?.bind(globalThis);
  return assessCityPlayCapability({
    document: environment.document || globalThis.document,
    webgl: environment.webgl,
    cores: environment.cores ?? navigatorRef.hardwareConcurrency,
    memoryGb: environment.memoryGb ?? navigatorRef.deviceMemory,
    reducedMotion: environment.reducedMotion,
    saveData: environment.saveData ?? connection.saveData,
    coarsePointer: environment.coarsePointer ?? (() => {
      try { return Boolean(matchMediaFn?.('(pointer: coarse)')?.matches); } catch { return false; }
    })(),
    touchPoints: environment.touchPoints ?? navigatorRef.maxTouchPoints,
    isMobile: environment.isMobile,
    matchMedia: matchMediaFn
  });
}

export const CITY_PLAY_QUALITY_OPTIONS = Object.freeze(['lite', 'balanced', 'cinematic']);

export function normalizeCityPlayQuality(value, capability = getCityPlayCapability()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (capability.reducedMotion || capability.saveData) return 'lite';
  return CITY_PLAY_QUALITY_OPTIONS.includes(normalized) ? normalized : capability.recommendedQuality;
}

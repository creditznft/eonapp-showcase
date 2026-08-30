/**
 * W759R1 — single, strict quality override authority for City entry paths.
 * Certification quality is diagnostic/review-only and is never accepted on
 * production hosts.
 */
const QUALITY_VALUES = new Set(['lite', 'balanced', 'cinematic']);

function normalizeQuality(value, fallback = 'balanced') {
  const normalized = String(value || '').trim().toLowerCase();
  return QUALITY_VALUES.has(normalized) ? normalized : fallback;
}

function isEligibleCertificationHost(hostname) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || (hostname.endsWith('.eonapp-ch.pages.dev') && hostname !== 'eonapp-ch.pages.dev');
}

export function resolveEonCityQualityAuthority({ locationRef = globalThis.location, detectedQuality = 'balanced', deviceProfile = null } = {}) {
  const hostname = String(locationRef?.hostname || '').trim().toLowerCase();
  const params = new URLSearchParams(String(locationRef?.search || ''));
  const requested = String(params.get('eon-city-quality') || '').trim().toLowerCase() || null;
  const detected = normalizeQuality(detectedQuality);
  const overrideAllowed = isEligibleCertificationHost(hostname);
  const certificationRequested = params.get('eon-city-certification') === '1';
  let rejectionReason = null;
  if (!overrideAllowed) rejectionReason = 'host-not-eligible';
  else if (!certificationRequested) rejectionReason = 'certification-flag-required';
  else if (!requested) rejectionReason = 'quality-required';
  else if (requested !== 'cinematic') rejectionReason = 'unsupported-quality';
  const overrideAccepted = rejectionReason === null;
  return Object.freeze({
    detected,
    requested,
    effective: overrideAccepted ? 'cinematic' : detected,
    source: overrideAccepted ? 'certification-override' : 'automatic',
    overrideAllowed,
    overrideAccepted,
    rejectionReason,
    hostname,
    renderer: String(deviceProfile?.gpuRenderer || deviceProfile?.renderer || '')
  });
}

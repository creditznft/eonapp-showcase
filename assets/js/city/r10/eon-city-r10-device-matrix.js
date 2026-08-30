import { deriveEonCityR02ViewportProfile } from '../r02/eon-city-r02-viewport-director.js';

const freeze = (value) => Object.freeze(value);
export const EON_CITY_R10_DEVICE_MATRIX_SCHEMA = 'eon.city.device-matrix.r10.v1';

export const EON_CITY_R10_CANONICAL_VIEWPORTS = freeze([
  freeze({ id: 'phone-small-portrait', width: 320, height: 568, coarsePointer: true }),
  freeze({ id: 'phone-standard-portrait', width: 360, height: 800, coarsePointer: true }),
  freeze({ id: 'phone-modern-portrait', width: 390, height: 844, coarsePointer: true }),
  freeze({ id: 'phone-large-portrait', width: 412, height: 915, coarsePointer: true }),
  freeze({ id: 'tablet-portrait', width: 768, height: 1024, coarsePointer: true }),
  freeze({ id: 'tablet-landscape', width: 1024, height: 768, coarsePointer: true }),
  freeze({ id: 'desktop-720p', width: 1280, height: 720, coarsePointer: false }),
  freeze({ id: 'desktop-common', width: 1366, height: 768, coarsePointer: false }),
  freeze({ id: 'desktop-900p', width: 1440, height: 900, coarsePointer: false }),
  freeze({ id: 'desktop-1080p', width: 1920, height: 1080, coarsePointer: false }),
  freeze({ id: 'desktop-ultrawide', width: 2560, height: 1080, coarsePointer: false })
]);

export function deriveEonCityR10DeviceCase(viewport = {}) {
  const profile = deriveEonCityR02ViewportProfile(viewport);
  const touchTargetPx = viewport.coarsePointer ? 48 : 40;
  const sheetFraction = profile.surfaceMode === 'bottom-sheet' ? 0.72 : profile.surfaceMode === 'sheet' ? 0.76 : null;
  return freeze({
    schema: EON_CITY_R10_DEVICE_MATRIX_SCHEMA,
    viewportId: String(viewport.id || `${profile.width}x${profile.height}`),
    profile,
    startsBabylon: true,
    portraitBlocked: false,
    automaticFullscreen: false,
    automaticOrientationLock: false,
    touchTargetPx,
    maximumBlockingSurfaces: 1,
    sheetFraction,
    requiresMinimizeRestore: profile.mobile || profile.id === 'tablet-portrait' || profile.id === 'desktop-compact'
  });
}

export function buildEonCityR10DeviceMatrix(viewports = EON_CITY_R10_CANONICAL_VIEWPORTS) {
  return freeze((Array.isArray(viewports) ? viewports : []).map(deriveEonCityR10DeviceCase));
}

export function validateEonCityR10DeviceMatrix(matrix = buildEonCityR10DeviceMatrix()) {
  const errors = [];
  if (!Array.isArray(matrix) || matrix.length !== EON_CITY_R10_CANONICAL_VIEWPORTS.length) errors.push('viewport-count');
  for (const entry of Array.isArray(matrix) ? matrix : []) {
    if (!entry.startsBabylon || entry.portraitBlocked) errors.push(`playability:${entry.viewportId}`);
    if (entry.automaticFullscreen || entry.automaticOrientationLock) errors.push(`immersion-consent:${entry.viewportId}`);
    if (entry.maximumBlockingSurfaces !== 1) errors.push(`surface-ownership:${entry.viewportId}`);
    if (entry.profile?.coarsePointer && entry.touchTargetPx < 48) errors.push(`touch-target:${entry.viewportId}`);
    if (entry.profile?.mobile && entry.profile.labelBudget > 1) errors.push(`mobile-label-budget:${entry.viewportId}`);
    if (entry.profile?.id === 'mobile-portrait' && entry.profile.surfaceMode !== 'bottom-sheet') errors.push(`portrait-sheet:${entry.viewportId}`);
    if (entry.sheetFraction != null && entry.sheetFraction > 0.78) errors.push(`sheet-height:${entry.viewportId}`);
  }
  return freeze({
    schema: EON_CITY_R10_DEVICE_MATRIX_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    viewportCount: Array.isArray(matrix) ? matrix.length : 0,
    matrix: freeze(Array.isArray(matrix) ? [...matrix] : [])
  });
}

export default freeze({
  EON_CITY_R10_DEVICE_MATRIX_SCHEMA,
  EON_CITY_R10_CANONICAL_VIEWPORTS,
  deriveEonCityR10DeviceCase,
  buildEonCityR10DeviceMatrix,
  validateEonCityR10DeviceMatrix
});

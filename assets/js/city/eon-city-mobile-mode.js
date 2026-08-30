/**
 * CITY-MOBILE: choose an intentional City presentation before Babylon starts.
 *
 * Phones use the same canonical Babylon City in both orientations. Presentation
 * adapts to the available viewport; portrait is playable rather than a separate
 * companion product. Landscape remains the wider exploration presentation. This file
 * does not inspect device identity, send telemetry, or persist a preference.
 */
export const EON_CITY_MOBILE_MODE_SCHEMA = 'eon.city.mobile-mode.v1';

function positiveSize(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

export function getCityMobileMode({ isMobile = false, width = globalThis.innerWidth, height = globalThis.innerHeight } = {}) {
  const viewportWidth = positiveSize(width);
  const viewportHeight = positiveSize(height);
  const mobile = Boolean(isMobile);
  const portrait = mobile && viewportHeight > viewportWidth;
  const landscape = mobile && viewportWidth >= viewportHeight && viewportWidth > 0;
  const mode = !mobile
    ? 'desktop'
    : portrait
      ? 'portrait-explore'
      : landscape
        ? 'landscape-explore'
        : 'mobile-unknown';
  return Object.freeze({
    schema: EON_CITY_MOBILE_MODE_SCHEMA,
    mode,
    isMobile: mobile,
    portrait,
    landscape,
    width: viewportWidth,
    height: viewportHeight,
    startsBabylonAutomatically: mode !== 'mobile-unknown',
    label: mode === 'portrait-explore'
      ? 'Portrait Explore'
      : mode === 'landscape-explore'
        ? 'Landscape Explore'
        : mode === 'desktop'
          ? 'Desktop City'
          : 'Mobile City'
  });
}

export function subscribeCityMobileMode({ environment = globalThis, isMobile = false, onChange = () => {} } = {}) {
  if (!environment?.addEventListener || typeof onChange !== 'function') return () => {};
  let previous = getCityMobileMode({ isMobile, width: environment.innerWidth, height: environment.innerHeight });
  const notify = () => {
    const next = getCityMobileMode({ isMobile, width: environment.innerWidth, height: environment.innerHeight });
    if (next.mode === previous.mode && next.width === previous.width && next.height === previous.height) return;
    previous = next;
    onChange(next);
  };
  environment.addEventListener('resize', notify, { passive: true });
  environment.addEventListener('orientationchange', notify, { passive: true });
  return () => {
    environment.removeEventListener?.('resize', notify);
    environment.removeEventListener?.('orientationchange', notify);
  };
}

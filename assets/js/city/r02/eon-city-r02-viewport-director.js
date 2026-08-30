/** R02 — container-driven viewport and camera composition authority. */
export const EON_CITY_R02_VIEWPORT_SCHEMA = 'eon.city.viewport-director.r02.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));

export function deriveEonCityR02ViewportProfile({ width = 1280, height = 720, coarsePointer = false } = {}) {
  const w = Math.max(240, finite(width, 1280));
  const h = Math.max(320, finite(height, 720));
  const aspect = w / h;
  const portrait = h > w;
  const short = h <= 600;
  let id = 'desktop-standard';

  if (w <= 520 && portrait) id = 'mobile-portrait';
  else if (w <= 960 && short && !portrait) id = 'mobile-landscape';
  else if (w <= 900 && portrait) id = 'tablet-portrait';
  else if (w <= 1180 || h <= 700) id = 'desktop-compact';
  else if (w >= 1700 || aspect >= 2.05) id = 'desktop-wide';

  const table = {
    'mobile-portrait': { radiusScale: 1.19, fov: 0.96, labelBudget: 1, hudDensity: 'minimal', sheetMode: 'bottom-sheet' },
    'mobile-landscape': { radiusScale: 1.11, fov: 0.88, labelBudget: 1, hudDensity: 'minimal', sheetMode: 'bottom-sheet' },
    'tablet-portrait': { radiusScale: 1.12, fov: 0.9, labelBudget: 2, hudDensity: 'compact', sheetMode: 'sheet' },
    'desktop-compact': { radiusScale: 1.07, fov: 0.84, labelBudget: 2, hudDensity: 'compact', sheetMode: 'dock-or-sheet' },
    'desktop-standard': { radiusScale: 1, fov: 0.8, labelBudget: 3, hudDensity: 'standard', sheetMode: 'dock' },
    'desktop-wide': { radiusScale: 0.97, fov: 0.76, labelBudget: 3, hudDensity: 'standard', sheetMode: 'dock' }
  };
  const selected = table[id];
  return freeze({
    schema: EON_CITY_R02_VIEWPORT_SCHEMA,
    id,
    width: Math.round(w),
    height: Math.round(h),
    aspect: Number(aspect.toFixed(4)),
    portrait,
    landscape: !portrait,
    coarsePointer: Boolean(coarsePointer),
    compact: ['mobile-portrait', 'mobile-landscape', 'tablet-portrait', 'desktop-compact'].includes(id),
    mobile: id.startsWith('mobile-'),
    camera: freeze({ radiusScale: selected.radiusScale, fov: selected.fov }),
    labelBudget: selected.labelBudget,
    hudDensity: selected.hudDensity,
    surfaceMode: selected.sheetMode
  });
}

function measureHost(host, globalRef) {
  const rect = host?.getBoundingClientRect?.();
  const visualViewport = globalRef?.visualViewport;
  const width = finite(rect?.width, finite(visualViewport?.width, finite(globalRef?.innerWidth, 1280)));
  const height = finite(rect?.height, finite(visualViewport?.height, finite(globalRef?.innerHeight, 720)));
  return freeze({ width: Math.max(1, width), height: Math.max(1, height) });
}

export function createEonCityR02ViewportDirector({
  host = null,
  productRoot = null,
  globalRef = globalThis,
  ResizeObserverRef = globalThis.ResizeObserver,
  coarsePointer = () => Boolean(globalRef?.matchMedia?.('(pointer: coarse)')?.matches),
  onResize = () => {},
  onCompose = () => {},
  onChange = () => {}
} = {}) {
  let destroyed = false;
  let observer = null;
  let frame = 0;
  let profile = null;
  let previousProfile = null;
  const onWindowResize = () => schedule('window-resize');
  const onOrientationChange = () => schedule('orientation-change');
  const onVisualViewportResize = () => schedule('visual-viewport-resize');

  const publish = (reason = 'manual') => {
    if (destroyed) return profile;
    const measured = measureHost(host, globalRef);
    const next = deriveEonCityR02ViewportProfile({ ...measured, coarsePointer: coarsePointer() });
    const changed = !profile || profile.id !== next.id || profile.width !== next.width || profile.height !== next.height;
    previousProfile = profile;
    profile = next;
    try {
      if (productRoot?.dataset) {
        productRoot.dataset.eonCityViewportProfile = next.id;
        productRoot.dataset.eonCityViewportWidth = String(next.width);
        productRoot.dataset.eonCityViewportHeight = String(next.height);
        productRoot.dataset.eonCitySurfaceMode = next.surfaceMode;
        productRoot.dataset.eonCityLabelBudget = String(next.labelBudget);
      }
    } catch {}
    try { onResize(next, reason); } catch {}
    try { onCompose(next, previousProfile, reason); } catch {}
    if (changed) {
      try { onChange(next, previousProfile, reason); } catch {}
    }
    return profile;
  };

  const schedule = (reason = 'resize') => {
    if (destroyed) return;
    if (frame && typeof globalRef?.cancelAnimationFrame === 'function') globalRef.cancelAnimationFrame(frame);
    const run = () => { frame = 0; publish(reason); };
    if (typeof globalRef?.requestAnimationFrame === 'function') frame = globalRef.requestAnimationFrame(run);
    else run();
  };

  if (typeof ResizeObserverRef === 'function' && host) {
    try {
      observer = new ResizeObserverRef(() => schedule('container-resize'));
      observer.observe(host);
    } catch { observer = null; }
  }
  globalRef?.addEventListener?.('resize', onWindowResize);
  globalRef?.addEventListener?.('orientationchange', onOrientationChange);
  globalRef?.visualViewport?.addEventListener?.('resize', onVisualViewportResize);
  publish('mounted');

  return freeze({
    schema: EON_CITY_R02_VIEWPORT_SCHEMA,
    getProfile: () => profile,
    refresh: publish,
    schedule,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame && typeof globalRef?.cancelAnimationFrame === 'function') globalRef.cancelAnimationFrame(frame);
      try { observer?.disconnect?.(); } catch {}
      try { globalRef?.removeEventListener?.('resize', onWindowResize); } catch {}
      try { globalRef?.removeEventListener?.('orientationchange', onOrientationChange); } catch {}
      try { globalRef?.visualViewport?.removeEventListener?.('resize', onVisualViewportResize); } catch {}
      observer = null;
    }
  });
}

export function recomposeEonCityR02CameraRadius({ radius = 10.8, previousScale = 1, nextScale = 1, min = 6.5, max = 26 } = {}) {
  const ratio = clamp(nextScale, 0.5, 2) / clamp(previousScale, 0.5, 2);
  return Number(clamp(finite(radius, 10.8) * ratio, finite(min, 6.5), finite(max, 26)).toFixed(4));
}

export default freeze({
  EON_CITY_R02_VIEWPORT_SCHEMA,
  deriveEonCityR02ViewportProfile,
  createEonCityR02ViewportDirector,
  recomposeEonCityR02CameraRadius
});

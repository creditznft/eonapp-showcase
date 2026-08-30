export const EON_CITY_PROGRESSIVE_NEXUS_BRIDGE_SCHEMA = 'eon.city.progressive-nexus-bridge.w661e.v1';

import { bindEonCityLivingNexusPanel, renderEonCityLivingNexusPanel } from './eon-city-living-nexus-panel.js';
import { bindEonCityLivingNexusEncounterPanel } from './eon-city-living-nexus-encounter-panel.js';
import { bindEonCityLivingNexusRealmPanel } from './eon-city-living-nexus-realm-panel.js';

const TOP_ACTIONS_SELECTOR = '.eon-city-reduced-actions';
const REALM_INDEX_SELECTOR = '.eon-play-living-nexus-realm-index li[data-realm-id]';
const LIVING_NEXUS_PANEL_SELECTOR = '[data-eon-play-living-nexus-panel]';

function ensureStyles(documentRef = globalThis.document) {
  if (!documentRef?.head?.append) return null;
  const existing = documentRef.querySelector?.('style[data-eon-city-w661e-repair-styles="true"]');
  if (existing) return existing;
  const style = documentRef.createElement('style');
  style.dataset.eonCityW661eRepairStyles = 'true';
  style.textContent = `
    .eon-city-full-session > .eon-city-reduced-touch {
      z-index: 30 !important;
      isolation: isolate;
      display: grid;
      grid-template-columns: repeat(3, minmax(2.65rem, 3.2rem));
      grid-template-areas: '. forward .' 'left backward right';
      gap: .32rem;
      padding: .5rem;
      border: 1px solid rgba(126, 231, 255, .42);
      border-radius: 1rem;
      background: rgba(3, 12, 27, .96);
      box-shadow: 0 12px 34px rgba(0, 0, 0, .4), inset 0 0 24px rgba(70, 218, 255, .08);
      pointer-events: auto;
      touch-action: none;
    }
    .eon-city-full-session > .eon-city-reduced-touch::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      border-radius: inherit;
      background: rgba(3, 12, 27, .98);
      pointer-events: auto;
    }
    .eon-city-full-session > .eon-city-reduced-touch button {
      position: relative;
      z-index: 1;
      min-width: 2.65rem;
      min-height: 2.65rem;
      border: 1px solid rgba(126, 231, 255, .46);
      background: rgba(10, 31, 56, .98);
      color: #effcff;
    }
    .eon-city-full-session > .eon-city-reduced-touch [data-eon-city-move='forward'] { grid-area: forward; }
    .eon-city-full-session > .eon-city-reduced-touch [data-eon-city-move='left'] { grid-area: left; }
    .eon-city-full-session > .eon-city-reduced-touch [data-eon-city-move='backward'] { grid-area: backward; }
    .eon-city-full-session > .eon-city-reduced-touch [data-eon-city-move='right'] { grid-area: right; }
    .eon-play-living-nexus-realm-index li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: .35rem .75rem;
      align-items: center;
    }
    .eon-play-living-nexus-realm-index li > span { grid-column: 1; }
    .eon-play-living-nexus-realm-index [data-eon-living-locate-realm] {
      grid-column: 2;
      grid-row: 1 / span 2;
      min-height: 2.5rem;
      white-space: nowrap;
    }
    @media (max-width: 620px) {
      .eon-play-living-nexus-realm-index li { grid-template-columns: 1fr; }
      .eon-play-living-nexus-realm-index [data-eon-living-locate-realm] { grid-column: 1; grid-row: auto; width: 100%; }
    }
  `;
  documentRef.head.append(style);
  return style;
}

function ensureTopAction(root, documentRef) {
  const actions = root.querySelector?.(TOP_ACTIONS_SELECTOR);
  if (!actions) return null;
  let button = actions.querySelector?.('[data-eon-play-open-living-nexus]');
  if (button) return button;
  button = documentRef.createElement('button');
  button.type = 'button';
  button.dataset.eonPlayOpenLivingNexus = 'true';
  button.textContent = 'Living Nexus';
  button.setAttribute('aria-label', 'Open EONCITY Living Nexus');
  actions.prepend(button);
  return button;
}

function ensureLivingNexusPanel(root, documentRef) {
  const existing = root.querySelector?.(LIVING_NEXUS_PANEL_SELECTOR);
  if (existing) return { panel: existing, mountedByBridge: false };
  const mount = documentRef?.createElement?.('template');
  if (!mount) return { panel: null, mountedByBridge: false };
  mount.innerHTML = renderEonCityLivingNexusPanel();
  const panel = mount.content?.firstElementChild || null;
  if (!panel) return { panel: null, mountedByBridge: false };
  root.append(panel);
  return { panel, mountedByBridge: true };
}

function ensureTouchLayer(root) {
  const controls = root.querySelector?.('[data-eon-city-touch-controls]');
  if (!controls) return;
  Object.assign(controls.style, {
    position: 'absolute',
    zIndex: '30',
    isolation: 'isolate',
    pointerEvents: 'auto',
    touchAction: 'none'
  });
  for (const button of controls.querySelectorAll?.('button[data-eon-city-move]') || []) button.type = 'button';
}

function ensureRealmLocators(root) {
  for (const item of root.querySelectorAll?.(REALM_INDEX_SELECTOR) || []) {
    if (item.querySelector?.('[data-eon-living-locate-realm]')) continue;
    const realmId = String(item.dataset.realmId || '').trim();
    if (!realmId) continue;
    const button = root.ownerDocument.createElement('button');
    button.type = 'button';
    button.dataset.eonLivingLocateRealm = realmId;
    button.textContent = 'Locate portal';
    button.setAttribute('aria-label', `Locate ${item.querySelector('strong')?.textContent || realmId} portal`);
    item.append(button);
  }
}

export function mountEonCityProgressiveNexusBridge(root, runtime, { environment = globalThis } = {}) {
  if (!root?.querySelector || !runtime) return () => {};
  if (root.dataset.eonCityLivingNexusProgressiveBinding === 'ready') return () => {};
  const documentRef = root.ownerDocument || environment.document || globalThis.document;
  ensureStyles(documentRef);
  ensureTopAction(root, documentRef);
  ensureTouchLayer(root);
  const nexusMount = ensureLivingNexusPanel(root, documentRef);

  // Direct /eoncity sessions mount the progressive controls without the play
  // station template. W719.20 correctly prevented a second controller in full
  // play-station sessions, but also left this direct path with a trigger and no
  // panel. Mount the missing surface only on that path and make it the single
  // canonical owner for the session; existing play-station panels remain
  // entirely owned by the play station.
  const ownsCanonicalNexus = nexusMount.mountedByBridge && Boolean(nexusMount.panel);
  const disposeCanonicalNexus = ownsCanonicalNexus
    ? bindEonCityLivingNexusPanel(root, { getRuntime: () => runtime })
    : () => {};
  const disposeCanonicalEncounters = ownsCanonicalNexus
    ? bindEonCityLivingNexusEncounterPanel(root, { getRuntime: () => runtime })
    : () => {};
  const disposeCanonicalRealms = ownsCanonicalNexus
    ? bindEonCityLivingNexusRealmPanel(root, { getRuntime: () => runtime })
    : () => {};

  const position = root.querySelector?.('[data-eon-city-reduced-position]');
  const player = runtime.getPlayerPosition?.() || runtime.getRuntimeSummary?.()?.player;
  if (position && Number.isFinite(Number(player?.x)) && Number.isFinite(Number(player?.z))) {
    position.textContent = `Player x ${Number(player.x).toFixed(2)} · z ${Number(player.z).toFixed(2)}`;
  }

  root.dataset.eonCityLivingNexusBridgeRole = ownsCanonicalNexus ? 'direct-city-canonical-owner' : 'presentation-only';

  const refreshLocators = () => ensureRealmLocators(root);
  const ViewMutationObserver = documentRef?.defaultView?.MutationObserver || globalThis.MutationObserver;
  const observer = typeof ViewMutationObserver === 'function' ? new ViewMutationObserver(refreshLocators) : null;
  observer?.observe?.(root, { childList: true, subtree: true });
  refreshLocators();

  const onClick = (event) => {
    const button = event.target?.closest?.('[data-eon-living-locate-realm]');
    if (!button || !root.contains(button)) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    const realmId = String(button.dataset.eonLivingLocateRealm || '');
    let summary = runtime.getLivingNexusSummary?.() || {};
    if (summary.destination !== 'expanse') {
      const entered = runtime.enterLivingNexusDestination?.('expanse', { explicitUserAction: true, transformations: [] });
      if (!entered?.ok) return;
      summary = runtime.getLivingNexusSummary?.() || {};
    }
    const located = runtime.locateLivingNexusRealmPortal?.(realmId, { explicitUserAction: true });
    if (!located?.ok) return;
    const ViewCustomEvent = documentRef?.defaultView?.CustomEvent || globalThis.CustomEvent;
    root.dispatchEvent(new ViewCustomEvent('eon:city:living-nexus:realm-signal', {
      detail: { ...located.portal, signalType: 'rare-portal', distance: 0, activeRealmId: null }
    }));
    root.querySelector?.('[data-eon-realm-signal-open]')?.click?.();
  };
  root.addEventListener('click', onClick);
  root.dataset.eonCityLivingNexusProgressiveBinding = 'ready';
  root.dataset.eonCityW661eMovementLayer = 'isolated';

  return () => {
    observer?.disconnect?.();
    root.removeEventListener('click', onClick);
    disposeCanonicalRealms();
    disposeCanonicalEncounters();
    disposeCanonicalNexus();
    if (ownsCanonicalNexus && nexusMount.panel?.isConnected) nexusMount.panel.remove();
    delete root.dataset.eonCityLivingNexusProgressiveBinding;
    delete root.dataset.eonCityLivingNexusBridgeRole;
    delete root.dataset.eonCityW661eMovementLayer;
  };
}

export default Object.freeze({
  EON_CITY_PROGRESSIVE_NEXUS_BRIDGE_SCHEMA,
  mountEonCityProgressiveNexusBridge
});

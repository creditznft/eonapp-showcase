/**
 * W591 — Command Horizon Quality Summit.
 *
 * A deliberately small presentation layer for the City: it reduces first-entry
 * decision density, prevents stacked dialogs, and gives a player a single,
 * truthful waypoint before asking them to understand the wider EONAPP world.
 *
 * This module is local UI only. It does not fetch, authenticate, route, open
 * work, create a project, request permissions, start media, or record telemetry.
 */

const freeze = (value) => Object.freeze(value);

export const EON_CITY_QUALITY_SUMMIT_SCHEMA = 'eon.city.quality-summit.w591.v1';

export const EON_CITY_QUALITY_SUMMIT_DECISIONS = freeze({
  primaryArrivalAction: 'Give a first-time player one visible waypoint instead of a dashboard of equal-weight controls.',
  directHudActions: freeze(['command-room', 'eonbot', 'districts', 'menu']),
  overlayPolicy: 'Only one modal City surface may be visible at a time.',
  routePolicy: 'Every native EONAPP route remains a separate explicit confirmation.',
  accessPolicy: 'The canonical /eoncity access station remains the only public full-City boot path.',
  scorePolicy: 'No synthetic visual, device, accessibility, or production score is assigned without preview and human evidence.'
});

export function getEonCityQualitySummitPlan({ directEntry = true } = {}) {
  return freeze({
    schema: EON_CITY_QUALITY_SUMMIT_SCHEMA,
    directEntry: Boolean(directEntry),
    primaryHudActions: directEntry
      ? freeze(['Command Room', 'EONBOT', 'Districts', 'Menu'])
      : freeze(['Enter full screen', 'Controls', 'City map', 'Command Deck', 'Menu']),
    arrivalCompass: freeze({
      visible: Boolean(directEntry),
      landmarkId: 'command-centre',
      title: 'Start with one waypoint.',
      detail: 'Follow the Command Deck signal, or choose a route first. Nothing opens automatically.'
    }),
    overlayCoordinator: freeze({
      enabled: true,
      modalStackingAllowed: false,
      focusRestoration: 'best-effort-local-only'
    }),
    externalAction: false,
    automaticRouteOpen: false,
    automaticCertification: false,
    automaticProductionApproval: false
  });
}

export function validateEonCityQualitySummitPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return ['plan must be an object'];
  if (plan.schema !== EON_CITY_QUALITY_SUMMIT_SCHEMA) errors.push('schema mismatch');
  const directActions = ['Command Room', 'EONBOT', 'Districts', 'Menu'];
  if (!Array.isArray(plan.primaryHudActions) || plan.primaryHudActions.length < 4) errors.push('primary HUD action set is incomplete');
  if (plan.directEntry && JSON.stringify(plan.primaryHudActions) !== JSON.stringify(directActions)) errors.push('direct HUD action set must remain named and compact');
  if (!plan.arrivalCompass || plan.arrivalCompass.landmarkId !== 'command-centre') errors.push('arrival compass must lead to command-centre');
  if (plan.overlayCoordinator?.modalStackingAllowed !== false) errors.push('modal stacking must remain disabled');
  for (const key of ['externalAction', 'automaticRouteOpen', 'automaticCertification', 'automaticProductionApproval']) {
    if (plan[key] !== false) errors.push(`${key} must remain false`);
  }
  return errors;
}

function isVisibleDialog(node) {
  return Boolean(node?.matches?.('[role="dialog"]') && !node.hidden);
}

function describeCompass(landmark) {
  if (!landmark?.label) {
    return freeze({
      title: 'Start with one waypoint.',
      detail: 'Follow the Command Deck signal, or choose a route first. Nothing opens automatically.',
      actionLabel: 'Guide to Command Deck'
    });
  }
  return freeze({
    title: `Near ${String(landmark.label)}.`,
    detail: 'You are in range. Review this landmark only when you choose Review.',
    actionLabel: 'Review nearby signal'
  });
}

/**
 * Keeps City dialog surfaces mutually exclusive. Existing panels keep their own
 * action handlers and focus decisions; this coordinator only closes competing
 * visible dialogs after a new one opens, including the first-run and resume
 * overlays that otherwise sit above a live renderer.
 */
export function createEonCityOverlayCoordinator(root, { onStatus = () => {} } = {}) {
  if (!root?.querySelectorAll || typeof MutationObserver === 'undefined') {
    return freeze({ activeId: () => '', dispose: () => {}, sync: () => {} });
  }
  let active = null;
  let suppress = false;

  const getVisible = () => [...root.querySelectorAll('[role="dialog"]')].filter(isVisibleDialog);
  const identify = (node) => node?.dataset?.eonPlayPanel || node?.dataset?.eonPlayUniversePanel || node?.getAttribute?.('aria-labelledby') || node?.className || 'city-modal';

  const sync = (preferred = null) => {
    if (suppress) return;
    const visible = getVisible();
    const chosen = preferred && visible.includes(preferred) ? preferred : visible.at(-1) || null;
    suppress = true;
    for (const panel of visible) {
      if (panel !== chosen) panel.hidden = true;
    }
    suppress = false;
    active = chosen;
    root.dataset.eonCityOverlayActive = chosen ? String(identify(chosen)) : '';
    root.classList.toggle('eon-city-overlay-open', Boolean(chosen));
    if (chosen) onStatus('One City panel is open. Close it before opening another surface.');
  };

  const observer = new MutationObserver((records) => {
    if (suppress) return;
    let opened = null;
    for (const record of records) {
      if (record.type !== 'attributes' || record.attributeName !== 'hidden') continue;
      if (isVisibleDialog(record.target)) opened = record.target;
    }
    sync(opened);
  });
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  sync();

  return freeze({
    activeId: () => active ? String(identify(active)) : '',
    sync: () => sync(),
    dispose: () => {
      observer.disconnect();
      active = null;
      root.dataset.eonCityOverlayActive = '';
      root.classList.remove('eon-city-overlay-open');
    }
  });
}

/**
 * Binds the compact arrival compass and the overlay coordinator to a mounted City.
 * The supplied runtime is read lazily because the UI is constructed before Babylon
 * finishes mounting.
 */
export function bindEonCityQualitySummit(root, {
  directEntry = false,
  getRuntime = () => null,
  onStatus = () => {},
  onOpenStartHere = () => {},
  onOpenCommandDeck = () => {}
} = {}) {
  const plan = getEonCityQualitySummitPlan({ directEntry });
  const overlay = createEonCityOverlayCoordinator(root, { onStatus });
  const compass = root?.querySelector?.('[data-eon-play-arrival-compass]') || null;
  const firstRun = root?.querySelector?.('[data-eon-play-first-run-panel]') || null;
  let landmark = null;
  let collapsed = false;

  const renderCompass = () => {
    if (!compass) return;
    const copy = describeCompass(landmark);
    const title = compass.querySelector('[data-eon-play-compass-title]');
    const detail = compass.querySelector('[data-eon-play-compass-detail]');
    const action = compass.querySelector('[data-eon-play-compass-guide]');
    const body = compass.querySelector('[data-eon-play-compass-body]');
    const toggle = compass.querySelector('[data-eon-play-compass-collapse]');
    if (title) title.textContent = copy.title;
    if (detail) detail.textContent = copy.detail;
    if (action) action.textContent = copy.actionLabel;
    if (body) body.hidden = collapsed;
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.textContent = collapsed ? 'Show' : 'Minimise';
    }
    compass.dataset.eonCityCompassState = landmark?.id || 'orient';
  };

  const onGuide = () => {
    const runtime = getRuntime?.();
    if (landmark?.id) {
      runtime?.focusLandmark?.(landmark.id);
      onStatus(`Focused ${landmark.label} locally. Choose Review only when you are ready to inspect it.`);
      return;
    }
    const result = runtime?.guideToLandmark?.('command-centre');
    onStatus(result ? 'Command Deck guide is active locally. Move manually at any time to cancel it.' : 'Command Deck guide is not ready yet. You can still choose Start here.');
  };

  const guide = compass?.querySelector?.('[data-eon-play-compass-guide]');
  const start = compass?.querySelector?.('[data-eon-play-compass-start]');
  const deck = compass?.querySelector?.('[data-eon-play-compass-deck]');
  const collapse = compass?.querySelector?.('[data-eon-play-compass-collapse]');
  guide?.addEventListener('click', onGuide);
  start?.addEventListener('click', () => onOpenStartHere());
  deck?.addEventListener('click', () => onOpenCommandDeck());
  collapse?.addEventListener('click', () => { collapsed = !collapsed; renderCompass(); });

  const firstRunObserver = firstRun && typeof MutationObserver !== 'undefined'
    ? new MutationObserver(() => {
      if (!compass) return;
      compass.hidden = !firstRun.hidden;
      if (!compass.hidden) renderCompass();
    })
    : null;
  firstRunObserver?.observe(firstRun, { attributes: true, attributeFilter: ['hidden'] });
  if (compass && firstRun?.hidden) compass.hidden = false;
  renderCompass();

  root.dataset.eonCityQualitySummit = EON_CITY_QUALITY_SUMMIT_SCHEMA;
  return freeze({
    plan,
    updateCompass: (nextLandmark = null) => { landmark = nextLandmark || null; renderCompass(); },
    dispose: () => {
      guide?.removeEventListener('click', onGuide);
      firstRunObserver?.disconnect();
      overlay.dispose();
      if (root) {
        root.dataset.eonCityQualitySummit = '';
        root.dataset.eonCityCompassState = '';
      }
    }
  });
}

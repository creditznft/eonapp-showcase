/**
 * W756 — onboarding, navigation, mobile and accessibility convergence.
 *
 * This authority composes the maintained City Menu, station map and W624K
 * accessibility preferences. It adds one semantic alternative to the 3D world;
 * it does not create another navigation/runtime owner or auto-open a route.
 */
import { EON_CITY_W731_STATIONS, EON_CITY_W737_DISCOVERIES } from '../w731/eon-city-w731-command-hub-contract.js';
import { getCityMobileMode } from '../eon-city-mobile-mode.js';
import { EON_CITY_ACCESSIBILITY_DEFAULTS } from '../eon-city-accessibility-device-system.js';

export const EON_CITY_W756_SCHEMA = 'eon.city.onboarding-navigation-accessibility.w756.v1';
const freeze = (value) => Object.freeze(value);
const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function buildEonCityW756ExperiencePlan({ width = 1280, height = 720, coarsePointer = false, reducedMotion = false, highContrast = false } = {}) {
  const mobile = Boolean(coarsePointer || Number(width) < 820);
  const mobileMode = getCityMobileMode({ isMobile: mobile, width, height });
  return freeze({
    schema: EON_CITY_W756_SCHEMA,
    onboarding: freeze({
      first15Seconds: freeze(['See Pathfinder and EONBOT', 'Recognize the central Living Nexus', 'Wake the Nexus or open City Menu']),
      first60Seconds: freeze(['Activate the Nexus', 'Review EONBOT, Projects, Missions and Approvals', 'Close the Dock and remain at the same location']),
      firstThreeMinutes: freeze(['Complete one genuine productive loop', 'Return with a bounded native receipt', 'See Nexus, mission and XP state react']),
      firstRunCard: true,
      dismissible: true,
      automaticNavigation: false,
      permissionPressure: false
    }),
    navigation: freeze({
      layers: freeze(['floor-routes', 'contextual-compass', 'atlas-wall', 'city-menu', 'eonbot-guidance', 'reviewed-transit']),
      oneMenuLauncher: true,
      oneMenuController: true,
      maxWorldLabels: 3,
      oneInteractionCard: true,
      proximityAutoOpen: false,
      exactLocationRestore: true
    }),
    mobile: freeze({
      ...mobileMode,
      portraitDock: 'bottom-sheet',
      landscapeDock: 'split-view',
      minimumTouchTargetPx: EON_CITY_ACCESSIBILITY_DEFAULTS.touchTargetPx,
      safeAreas: true,
      orientationLock: false,
      fullscreenAutomatic: false
    }),
    recovery: freeze({
      offlineMessage: 'The current Command Core shell must be cached before it can start offline.',
      retryRequiresExplicitAction: true,
      restart3dRequiresExplicitAction: true,
      nativeWorkspaceFallback: true,
      preservesPrivateDrafts: true,
      automaticReload: false,
      automaticNavigation: false
    }),
    accessibility: freeze({
      keyboardMouseTouchParity: true,
      keyboardOnly: true,
      touchOnly: true,
      reducedMotion: Boolean(reducedMotion),
      highContrast: Boolean(highContrast),
      captionsPrimary: true,
      semanticAlternative: true,
      focusRestoration: true,
      dialogFocusTrap: true,
      escapeClosesDialogs: true,
      screenReaderStationCount: EON_CITY_W731_STATIONS.length,
      screenReaderOutsideDestinationCount: EON_CITY_W737_DISCOVERIES.length,
      touchTargetPx: EON_CITY_ACCESSIBILITY_DEFAULTS.touchTargetPx
    }),
    stationCount: EON_CITY_W731_STATIONS.length,
    outsideDestinationCount: EON_CITY_W737_DISCOVERIES.length,
    noDuplicateRuntime: true,
    noAutomaticWork: true
  });
}

export function validateEonCityW756ExperiencePlan(plan = buildEonCityW756ExperiencePlan()) {
  const errors = [];
  if (plan.schema !== EON_CITY_W756_SCHEMA) errors.push('schema');
  if (plan.stationCount !== 10 || plan.accessibility?.screenReaderStationCount !== 10) errors.push('station-semantic-coverage');
  if (plan.outsideDestinationCount !== 3 || plan.accessibility?.screenReaderOutsideDestinationCount !== 3) errors.push('outside-destination-semantic-coverage');
  if (plan.navigation?.maxWorldLabels !== 3 || plan.navigation?.oneInteractionCard !== true) errors.push('label-prompt-strategy');
  if (plan.navigation?.oneMenuLauncher !== true || plan.navigation?.oneMenuController !== true) errors.push('city-menu-authority');
  if (plan.mobile?.minimumTouchTargetPx < 48 || plan.accessibility?.touchTargetPx < 48) errors.push('touch-target');
  if (plan.mobile?.portraitDock !== 'bottom-sheet' || plan.mobile?.landscapeDock !== 'split-view') errors.push('mobile-dock');
  if (plan.accessibility?.keyboardMouseTouchParity !== true || plan.accessibility?.semanticAlternative !== true || plan.accessibility?.dialogFocusTrap !== true) errors.push('input-semantic-parity');
  if (plan.recovery?.retryRequiresExplicitAction !== true || plan.recovery?.restart3dRequiresExplicitAction !== true || plan.recovery?.nativeWorkspaceFallback !== true || plan.recovery?.automaticReload !== false || plan.recovery?.automaticNavigation !== false) errors.push('recovery-boundary');
  if (plan.onboarding?.automaticNavigation !== false || plan.navigation?.proximityAutoOpen !== false || plan.recovery?.automaticReload !== false || plan.recovery?.automaticNavigation !== false || plan.noAutomaticWork !== true) errors.push('explicit-action-boundary');
  return freeze({ schema: EON_CITY_W756_SCHEMA, ok: errors.length === 0, errors: freeze(errors), plan });
}

export function createEonCityW756SemanticNavigationController({
  root,
  environment = globalThis,
  onOpen = () => ({ ok: true }),
  onClose = () => ({ ok: true }),
  onMinimize = () => ({ ok: true }),
  onRestore = () => ({ ok: true }),
  onRequestMinimize = () => ({ ok: false, reason: 'surface-manager-unavailable' }),
  onGuideStation = () => ({ ok: false, reason: 'guide-station-unavailable' }),
  onOpenStation = () => ({ ok: false, reason: 'open-station-unavailable' }),
  onInspectStation = () => ({ ok: false, reason: 'inspect-station-unavailable' }),
  onGuideDiscovery = () => ({ ok: false, reason: 'guide-discovery-unavailable' }),
  onInspectDiscovery = () => ({ ok: false, reason: 'inspect-discovery-unavailable' }),
  onReviewTransit = () => ({ ok: false, reason: 'transit-review-unavailable' }),
  onOpenReadiness = () => ({ ok: false, reason: 'city-readiness-unavailable' }),
  onReviewExpanse = () => ({ ok: false, reason: 'expanse-review-unavailable' }),
  onSetEnvironment = () => ({ ok: false, reason: 'environment-unavailable' }),
  onActivateAudio = () => ({ ok: false, reason: 'audio-unavailable' }),
  onOpenNexus = () => ({ ok: false, reason: 'nexus-unavailable' }),
  onOpenWorlds = () => ({ ok: false, reason: 'worlds-unavailable' }),
  onOpenMenu = () => ({ ok: false, reason: 'menu-unavailable' }),
  showLauncher = true,
  onStatus = () => {}
} = {}) {
  if (!root?.append || !environment?.document) return freeze({ schema: EON_CITY_W756_SCHEMA, mounted: false, reason: 'root-required', dispose() {} });
  const documentRef = environment.document;
  let disposed = false;
  let open = false;
  let minimized = false;
  let transitionActive = false;
  let successorOwnerId = '';
  let lastFocus = null;
  const storageKey = 'eon:city:w756:onboarding-seen:v1';

  const style = documentRef.createElement('style');
  style.dataset.eonCityW756Styles = '1';
  style.textContent = `.eon-city-w756-map-launcher{appearance:none;-webkit-appearance:none;min-height:48px;min-width:48px;padding:.66rem .9rem;border:1px solid rgba(121,222,255,.5);border-radius:.76rem;background:linear-gradient(145deg,rgba(4,24,45,.98),rgba(18,13,52,.96));color:#f4fbff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 .55rem 1.45rem rgba(0,0,0,.35)}.eon-city-w756-map-launcher:hover{border-color:#9ff5ff;background:linear-gradient(145deg,rgba(8,46,70,.98),rgba(34,22,76,.96))}.eon-city-w756-map-launcher:focus-visible{outline:3px solid #fff;outline-offset:3px}.eon-city-w756-onboarding{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(82px,calc(env(safe-area-inset-bottom) + 70px));z-index:16;max-width:min(390px,calc(100% - 32px));padding:14px;border:1px solid rgba(121,222,255,.35);border-radius:16px;background:rgba(7,12,24,.93);box-shadow:0 18px 50px rgba(0,0,0,.35);color:#f4f8ff;backdrop-filter:blur(14px)}.eon-city-w756-onboarding[hidden]{display:none}.eon-city-w756-onboarding p{margin:.45rem 0 .8rem;color:#c8d4e8}.eon-city-w756-onboarding div{display:flex;flex-wrap:wrap;gap:8px}.eon-city-w756-onboarding button,.eon-city-w756-semantic-map button,.eon-city-w756-semantic-map select{appearance:none!important;-webkit-appearance:none!important;min-height:48px!important;min-width:48px!important;border:1px solid rgba(142,232,255,.48)!important;border-radius:.72rem!important;background:linear-gradient(145deg,rgba(4,26,55,.98),rgba(15,12,56,.96))!important;color:#effcff!important;font:inherit!important;font-weight:760!important;line-height:1.2!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035),0 .35rem 1rem rgba(0,0,0,.22)!important}.eon-city-w756-onboarding button,.eon-city-w756-semantic-map button{padding:.68rem .85rem}.eon-city-w756-semantic-map select{padding:.68rem 2.35rem .68rem .8rem;background-image:linear-gradient(45deg,transparent 50%,#c9fbff 50%),linear-gradient(135deg,#c9fbff 50%,transparent 50%),linear-gradient(145deg,rgba(4,26,55,.98),rgba(15,12,56,.96));background-position:calc(100% - 17px) 50%,calc(100% - 11px) 50%,0 0;background-size:6px 6px,6px 6px,100% 100%;background-repeat:no-repeat}.eon-city-w756-onboarding button:hover,.eon-city-w756-semantic-map button:hover,.eon-city-w756-semantic-map select:hover{border-color:#a8fff7;background-color:#103455}.eon-city-w756-semantic-map button:active{transform:translateY(1px);filter:brightness(1.12)}.eon-city-w756-onboarding button:focus-visible,.eon-city-w756-semantic-map button:focus-visible,.eon-city-w756-semantic-map select:focus-visible{outline:3px solid #fff;outline-offset:3px}.eon-city-w756-onboarding button:disabled,.eon-city-w756-semantic-map button:disabled,.eon-city-w756-semantic-map select:disabled{cursor:not-allowed;opacity:.52;filter:saturate(.45)}.eon-city-w756-semantic-map button[aria-busy=true]{cursor:progress}.eon-city-w756-semantic-map{position:fixed;inset:0;z-index:2147482000;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overflow:auto;background:rgba(2,6,15,.86);color:#f5f8ff;backdrop-filter:blur(18px)}.eon-city-w756-semantic-map[hidden]{display:none}.eon-city-w756-semantic-card{width:min(1040px,100%);margin:0 auto;padding:20px;border:1px solid rgba(121,222,255,.35);border-radius:20px;background:#0a1222;box-shadow:0 24px 90px rgba(0,0,0,.5)}.eon-city-w756-semantic-card>header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eon-city-w756-semantic-card nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:18px}.eon-city-w756-semantic-card article{display:flex;flex-direction:column;justify-content:space-between;gap:12px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}.eon-city-w756-semantic-card article p{color:#c9d4e6;line-height:1.45}.eon-city-w756-semantic-card article>div:last-child,.eon-city-w756-environment-controls>div{display:flex;flex-wrap:wrap;gap:8px}.eon-city-w756-outside{margin-top:22px;padding-top:16px;border-top:1px solid rgba(201,155,255,.25)}.eon-city-w756-outside h3{margin:0 0 .35rem}.eon-city-w756-outside>p{margin:0;color:#c8b8dd}.eon-city-w756-environment-controls{margin-top:18px;padding:14px;border:1px solid rgba(177,125,255,.25);border-radius:14px}.eon-city-w756-environment-controls label{display:grid;gap:6px;min-width:9rem}.eon-city-w756-semantic-status{margin-top:16px;min-height:3rem;padding:.75rem .85rem;border:1px solid rgba(121,222,255,.28);border-radius:.8rem;background:rgba(0,0,0,.18);color:#cfe9f3}.eon-city-w756-semantic-status[data-state=error]{border-color:#ff9caa;color:#ffdce2;background:rgba(92,12,29,.25)}.eon-city-w756-semantic-status[data-state=success]{border-color:#7cf4bf;color:#d9fff0;background:rgba(8,76,53,.22)}@media(max-width:819px){.eon-city-w756-semantic-map{padding:0}.eon-city-w756-semantic-card{min-height:100%;border-radius:0}.eon-city-w756-semantic-card>header{position:sticky;top:0;padding:10px 0;background:#0a1222;z-index:1}.eon-city-w756-onboarding{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));bottom:max(76px,calc(env(safe-area-inset-bottom) + 64px));max-width:none}}@media(forced-colors:active){.eon-city-w756-map-launcher,.eon-city-w756-onboarding,.eon-city-w756-semantic-card,.eon-city-w756-semantic-card article,.eon-city-w756-semantic-map button,.eon-city-w756-semantic-map select,.eon-city-w756-semantic-status{forced-color-adjust:auto;border:2px solid CanvasText;background:Canvas;color:CanvasText;box-shadow:none;background-image:none}.eon-city-w756-semantic-map button:focus-visible,.eon-city-w756-semantic-map select:focus-visible{outline:3px solid Highlight}}@media(prefers-reduced-motion:reduce){.eon-city-w756-semantic-map,.eon-city-w756-onboarding{scroll-behavior:auto;transition:none!important;animation:none!important}.eon-city-w756-semantic-map button:active{transform:none}}`;
  documentRef.head?.append?.(style);

  const onboarding = documentRef.createElement('aside');
  onboarding.className = 'eon-city-w756-onboarding';
  onboarding.dataset.eonCityW756Onboarding = '1';
  onboarding.setAttribute('aria-label', 'EON City first steps');
  const onboardingWidth = Math.max(1, Number(environment.innerWidth || documentRef.documentElement?.clientWidth || 1));
  const coarseOnboardingPointer = Boolean(environment.matchMedia?.('(pointer: coarse)')?.matches);
  const compactOnboarding = Boolean(coarseOnboardingPointer || onboardingWidth < 820);
  onboarding.dataset.eonCityW756OnboardingMode = compactOnboarding ? 'mobile-controls' : 'desktop-discovery';
  onboarding.innerHTML = compactOnboarding
    ? '<header><strong>Move to begin</strong><button type="button" data-eon-city-w756-dismiss aria-label="Dismiss EON City welcome">×</button></header><p>Left thumb: move. Drag the right side to look. Use the action prompt near a station.</p><div><button type="button" data-eon-city-w756-dismiss>Got it</button><button type="button" data-eon-city-w756-menu>Menu</button></div>'
    : '<header><strong>Welcome to EON City</strong><button type="button" data-eon-city-w756-dismiss aria-label="Dismiss EON City welcome">×</button></header><p>Explore the Open Worlds or open Menu for Command Hub operations. Nothing records, publishes or starts work without your choice.</p><div><button type="button" data-eon-city-w756-worlds>Explore Worlds</button><button type="button" data-eon-city-w756-menu>Open Menu</button><button type="button" data-eon-city-w756-wake>EONBOT Nexus</button></div>';
  let onboardingSeen = false;
  try { onboardingSeen = environment.sessionStorage?.getItem?.(storageKey) === '1'; } catch {}
  onboarding.hidden = onboardingSeen;
  root.append(onboarding);

  const launcher = documentRef.createElement('button');
  launcher.type = 'button';
  launcher.dataset.eonCitySemanticMapOpen = '1';
  launcher.className = 'eon-city-w756-map-launcher';
  launcher.textContent = 'Accessible City map';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  const actions = root.querySelector?.('.eon-city-reduced-actions,.eon-play-hud-actions') || root;
  launcher.hidden = showLauncher !== true;
  actions.append(launcher);

  const outsideAction = (discovery) => discovery.id === 'transit-overlook'
    ? { label: 'Review Transit', attribute: 'data-eon-city-semantic-review-transit' }
    : discovery.id === 'maintenance-relay'
      ? { label: 'Open Readiness', attribute: 'data-eon-city-semantic-open-readiness' }
      : { label: 'Review Gate', attribute: 'data-eon-city-semantic-review-expanse' };
  const stationCards = EON_CITY_W731_STATIONS.map((station) => `<article data-eon-city-semantic-station="${escapeHtml(station.id)}"><div><strong>${escapeHtml(station.label)}</strong><p>${escapeHtml(station.description || station.npc?.greeting || '')}</p><small>${escapeHtml(station.npc?.name || '')} · ${escapeHtml(station.npc?.role || '')}</small></div><div><button type="button" data-eon-city-semantic-guide="${escapeHtml(station.id)}">Guide to station</button><button type="button" data-eon-city-semantic-open="${escapeHtml(station.id)}">Open workspace</button><button type="button" data-eon-city-semantic-inspect="${escapeHtml(station.id)}">Explain</button></div></article>`).join('');
  const outsideCards = EON_CITY_W737_DISCOVERIES.map((discovery) => {
    const action = outsideAction(discovery);
    return `<article data-eon-city-semantic-discovery="${escapeHtml(discovery.id)}"><div><strong>${escapeHtml(discovery.label)}</strong><p>${escapeHtml(discovery.npc?.greeting || '')}</p><small>${escapeHtml(discovery.npc?.name || '')} · ${escapeHtml(discovery.npc?.role || '')}</small></div><div><button type="button" data-eon-city-semantic-guide-discovery="${escapeHtml(discovery.id)}">Guide to destination</button><button type="button" ${action.attribute}="${escapeHtml(discovery.id)}">${escapeHtml(action.label)}</button><button type="button" data-eon-city-semantic-inspect-discovery="${escapeHtml(discovery.id)}">Explain</button></div></article>`;
  }).join('');

  const panel = documentRef.createElement('section');
  panel.className = 'eon-city-w756-semantic-map';
  panel.dataset.eonCitySemanticMap = '1';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('inert', '');
  try { panel.inert = true; } catch {}
  panel.setAttribute('aria-labelledby', 'eon-city-w756-semantic-title');
  panel.innerHTML = `<div class="eon-city-w756-semantic-card"><header><div><small>Screen-reader and keyboard alternative</small><h2 id="eon-city-w756-semantic-title">Living Command Centre map</h2><p>All ten stations and the three outside destinations remain available without relying on the 3D view. Actions require your explicit choice.</p></div><div><button type="button" data-eon-city-semantic-minimize aria-label="Minimize accessible City map">Minimize</button><button type="button" data-eon-city-semantic-close aria-label="Close accessible City map">Close</button></div></header><nav aria-label="EON City stations">${stationCards}</nav><section class="eon-city-w756-outside" aria-labelledby="eon-city-w756-outside-title"><h3 id="eon-city-w756-outside-title">Outside destinations and Open World</h3><p>Open World — Signal Frontier is entered through the physical Expanse Gate. Transit, Maintenance Relay and the gateway use the same maintained controllers as their 3D interactions.</p><nav aria-label="EON City outside destinations">${outsideCards}</nav></section><section class="eon-city-w756-environment-controls" aria-labelledby="eon-city-w756-environment-title"><h3 id="eon-city-w756-environment-title">Visual ambience and local audio</h3><p>Dawn/day/dusk/night and clear/mist/rain are local visual profiles, not real weather.</p><div><label>Time <select data-eon-city-semantic-time><option>dawn</option><option>day</option><option selected>dusk</option><option>night</option></select></label><label>Ambience <select data-eon-city-semantic-weather><option selected>clear</option><option>mist</option><option>rain</option></select></label><button type="button" data-eon-city-semantic-apply-environment>Apply visual profile</button><button type="button" data-eon-city-semantic-enable-audio>Enable local ambience</button></div></section><section class="eon-city-w756-environment-controls" aria-labelledby="eon-city-w756-recovery-title"><h3 id="eon-city-w756-recovery-title">Recovery</h3><p>If WebGL stops, close this map and use the visible Restart 3D action. Native work surfaces and private drafts remain separate from the renderer; no reload starts automatically.</p></section><div class="eon-city-w756-semantic-status" data-eon-city-semantic-status data-state="idle" role="status" aria-live="polite">Map ready. No action has started.</div></div>`;
  documentRef.body.append(panel);

  const isVisiblyOpen = () => {
    if (!open || !panel.isConnected || panel.hidden || panel.getAttribute('aria-hidden') === 'true') return false;
    try {
      const style = environment.getComputedStyle?.(panel);
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) <= 0.01)) return false;
      const rect = panel.getBoundingClientRect?.();
      if (rect && [rect.width, rect.height, rect.left, rect.right, rect.top, rect.bottom].every(Number.isFinite)) {
        if (rect.width <= 1 || rect.height <= 1) return false;
        const width = Math.max(1, Number(environment.innerWidth || documentRef.documentElement?.clientWidth || 1));
        const height = Math.max(1, Number(environment.innerHeight || documentRef.documentElement?.clientHeight || 1));
        if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= width || rect.top >= height) return false;
      }
    } catch {}
    return true;
  };
  const inspectPresentation = () => {
    const connected = panel.isConnected === true;
    const intentionallyHidden = panel.hidden === true || panel.hasAttribute('hidden');
    const accessibilityHidden = panel.getAttribute('aria-hidden') === 'true' || panel.inert === true || panel.hasAttribute('inert');
    let computedHidden = false;
    let geometryVisible = null;
    if (connected) {
      try {
        const style = environment.getComputedStyle?.(panel);
        computedHidden = Boolean(style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) <= 0.01));
        const rect = panel.getBoundingClientRect?.();
        if (rect && [rect.width, rect.height, rect.left, rect.right, rect.top, rect.bottom].every(Number.isFinite)) {
          const width = Math.max(1, Number(environment.innerWidth || documentRef.documentElement?.clientWidth || 1));
          const height = Math.max(1, Number(environment.innerHeight || documentRef.documentElement?.clientHeight || 1));
          geometryVisible = rect.width > 1 && rect.height > 1 && rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height;
        }
      } catch {}
    }
    return freeze({ connected, intentionallyHidden, accessibilityHidden, computedHidden, geometryVisible });
  };
  const focusOutsideBeforeHide = (preferred = null) => {
    const activeElement = documentRef.activeElement;
    if (!panel.contains(activeElement)) return false;
    for (const target of [preferred, launcher, root].filter((candidate, index, list) => candidate?.isConnected && !panel.contains(candidate) && list.indexOf(candidate) === index)) {
      try { target.focus?.({ preventScroll: true }); } catch {}
      if (!panel.contains(documentRef.activeElement)) return true;
    }
    try { activeElement?.blur?.(); } catch {}
    return !panel.contains(documentRef.activeElement);
  };
  const setPanelOpen = (nextOpen) => {
    if (nextOpen) {
      panel.hidden = false;
      panel.removeAttribute('hidden');
      try { panel.inert = false; } catch {}
      panel.removeAttribute('inert');
      panel.setAttribute('aria-hidden', 'false');
    } else {
      try { panel.inert = true; } catch {}
      panel.setAttribute('inert', '');
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      panel.setAttribute('aria-hidden', 'true');
    }
  };

  const statusNode = panel.querySelector('[data-eon-city-semantic-status]');
  const setMapStatus = (message, state = 'idle') => {
    if (statusNode) {
      statusNode.textContent = String(message || '');
      statusNode.dataset.state = state;
    }
    onStatus(String(message || ''));
  };
  const focusable = () => [...panel.querySelectorAll('button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];
  const normalizeResult = (result) => result && typeof result === 'object' ? result : { ok: result !== false };
  const runAction = async (button, callback, args = [], { closeOnSuccess = false, handoff = false, successor = '', successMessage = 'Action started.' } = {}) => {
    if (!button || typeof callback !== 'function') return { ok: false, reason: 'action-unavailable' };
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    if (handoff && !hide({ reason: 'surface-handoff', restoreFocus: false, successorOwnerId: successor })) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      setMapStatus('Action could not start because the map did not release movement safely.', 'error');
      return { ok: false, reason: 'accessible-map-release-failed' };
    }
    let result;
    try { result = normalizeResult(await callback(...args)); }
    catch (error) { result = { ok: false, reason: String(error?.message || error || 'action-failed') }; }
    finally { button.disabled = false; button.removeAttribute('aria-busy'); }
    if (handoff) {
      transitionActive = false;
      successorOwnerId = '';
    }
    if (!result.ok) {
      if (handoff) show(launcher);
      setMapStatus(`Action could not start: ${String(result.reason || 'unknown error')}. Movement remains available.`, 'error');
      return result;
    }
    setMapStatus(successMessage, 'success');
    if (closeOnSuccess && !handoff) hide({ reason: 'successful-action', restoreFocus: false });
    return result;
  };
  const show = (trigger = launcher) => {
    if (disposed || open) return false;
    transitionActive = true;
    successorOwnerId = '';
    const lease = normalizeResult(onOpen({ ownerId: 'accessible-map', trigger, explicitUserAction: true }));
    if (!lease.ok) {
      transitionActive = false;
      setMapStatus(`Accessible map could not open safely: ${String(lease.reason || 'input lock unavailable')}.`, 'error');
      return false;
    }
    lastFocus = trigger;
    open = true;
    minimized = false;
    setPanelOpen(true);
    launcher.setAttribute('aria-expanded', 'true');
    transitionActive = false;
    panel.querySelector('button,select')?.focus?.({ preventScroll: true });
    setMapStatus('Accessible City map opened. The same Babylon runtime remains active.', 'success');
    return true;
  };
  const hide = ({ reason = 'explicit-close', restoreFocus = true, successorOwnerId: nextOwnerId = '' } = {}) => {
    if (!open) return false;
    transitionActive = true;
    successorOwnerId = String(nextOwnerId || '');
    const release = normalizeResult(onClose({ ownerId: 'accessible-map', reason }));
    if (!release.ok) {
      transitionActive = false;
      successorOwnerId = '';
      setMapStatus(`Map could not release movement safely: ${String(release.reason || 'input lock release failed')}.`, 'error');
      return false;
    }
    open = false;
    minimized = false;
    focusOutsideBeforeHide(restoreFocus && lastFocus?.isConnected ? lastFocus : launcher);
    setPanelOpen(false);
    launcher.setAttribute('aria-expanded', 'false');
    lastFocus = null;
    transitionActive = Boolean(successorOwnerId);
    return true;
  };
  const minimize = () => {
    if (!open || minimized) return { ok: false, reason: minimized ? 'accessible-map-already-minimized' : 'accessible-map-not-open' };
    const release = normalizeResult(onMinimize({ ownerId: 'accessible-map', reason: 'surface-minimized' }));
    if (!release.ok) return release;
    minimized = true;
    focusOutsideBeforeHide(launcher);
    setPanelOpen(false);
    launcher.setAttribute('aria-expanded', 'false');
    setMapStatus('Accessible map minimized. Restore it from the City window shelf.', 'success');
    return { ok: true, minimized: true };
  };
  const restore = () => {
    if (!open || !minimized) return { ok: false, reason: 'accessible-map-not-minimized' };
    const lease = normalizeResult(onRestore({ ownerId: 'accessible-map', reason: 'surface-restored' }));
    if (!lease.ok) return lease;
    minimized = false;
    setPanelOpen(true);
    launcher.setAttribute('aria-expanded', 'true');
    panel.querySelector('button,select')?.focus?.({ preventScroll: true });
    setMapStatus('Accessible map restored without resetting City state.', 'success');
    return { ok: true, minimized: false };
  };
  const dismissOnboarding = () => {
    onboarding.hidden = true;
    try { environment.sessionStorage?.setItem?.(storageKey, '1'); } catch {}
  };
  const onOnboardingClick = (event) => {
    if (event.target.closest('[data-eon-city-w756-worlds]')) { dismissOnboarding(); onOpenWorlds(event.target); return; }
    if (event.target.closest('[data-eon-city-w756-wake]')) { dismissOnboarding(); onOpenNexus(event.target); return; }
    if (event.target.closest('[data-eon-city-w756-menu]')) { dismissOnboarding(); onOpenMenu(event.target); return; }
    if (event.target.closest('[data-eon-city-w756-dismiss]')) dismissOnboarding();
  };
  const onLauncher = (event) => show(event.currentTarget);
  const onClick = async (event) => {
    if (event.target.closest('[data-eon-city-semantic-minimize]')) { onRequestMinimize(); return; }
    if (event.target === panel || event.target.closest('[data-eon-city-semantic-close]')) { hide({ reason: 'close-button' }); return; }
    const guide = event.target.closest('[data-eon-city-semantic-guide]');
    if (guide) { await runAction(guide, onGuideStation, [String(guide.dataset.eonCitySemanticGuide || ''), launcher], { handoff: true, successMessage: 'Guidance started. Returning to the City.' }); return; }
    const stationOpen = event.target.closest('[data-eon-city-semantic-open]');
    if (stationOpen) { await runAction(stationOpen, onOpenStation, [String(stationOpen.dataset.eonCitySemanticOpen || ''), launcher], { handoff: true, successor: 'work-surface', successMessage: 'Workspace opened.' }); return; }
    const inspect = event.target.closest('[data-eon-city-semantic-inspect]');
    if (inspect) { await runAction(inspect, onInspectStation, [String(inspect.dataset.eonCitySemanticInspect || ''), inspect], { successMessage: 'Station explanation updated.' }); return; }
    const guideDiscovery = event.target.closest('[data-eon-city-semantic-guide-discovery]');
    if (guideDiscovery) { await runAction(guideDiscovery, onGuideDiscovery, [String(guideDiscovery.dataset.eonCitySemanticGuideDiscovery || ''), launcher], { handoff: true, successMessage: 'Destination guidance started.' }); return; }
    const inspectDiscovery = event.target.closest('[data-eon-city-semantic-inspect-discovery]');
    if (inspectDiscovery) { await runAction(inspectDiscovery, onInspectDiscovery, [String(inspectDiscovery.dataset.eonCitySemanticInspectDiscovery || ''), inspectDiscovery], { successMessage: 'Destination explanation updated.' }); return; }
    const transit = event.target.closest('[data-eon-city-semantic-review-transit]');
    if (transit) { await runAction(transit, onReviewTransit, [launcher], { handoff: true, successor: 'transit-review', successMessage: 'Transit review opened.' }); return; }
    const readiness = event.target.closest('[data-eon-city-semantic-open-readiness]');
    if (readiness) { await runAction(readiness, onOpenReadiness, [launcher], { handoff: true, successor: 'city-readiness', successMessage: 'City Readiness opened.' }); return; }
    const expanse = event.target.closest('[data-eon-city-semantic-review-expanse]');
    if (expanse) { await runAction(expanse, onReviewExpanse, [launcher], { handoff: true, successor: 'expanse-entry-review', successMessage: 'Expanse entry review opened.' }); return; }
    if (event.target.closest('[data-eon-city-semantic-apply-environment]')) {
      const button = event.target.closest('[data-eon-city-semantic-apply-environment]');
      const timeProfile = String(panel.querySelector('[data-eon-city-semantic-time]')?.value || 'dusk');
      const weatherProfile = String(panel.querySelector('[data-eon-city-semantic-weather]')?.value || 'clear');
      await runAction(button, onSetEnvironment, [{ timeProfile, weatherProfile }, { explicitUserAction: true }], { successMessage: `${timeProfile} / ${weatherProfile} visual ambience selected. This is not a real-weather claim.` });
      return;
    }
    if (event.target.closest('[data-eon-city-semantic-enable-audio]')) {
      const button = event.target.closest('[data-eon-city-semantic-enable-audio]');
      await runAction(button, onActivateAudio, [{ explicitUserAction: true }], { successMessage: 'Local procedural ambience requested from an explicit action.' });
    }
  };
  const gameplayIntentKeys = freeze(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', ' ']);
  const onGameplayIntent = (event) => {
    if (onboarding.hidden) return;
    if (event?.type === 'keydown') {
      if (!gameplayIntentKeys.includes(String(event.key || '').toLowerCase())) return;
      dismissOnboarding();
      return;
    }
    const target = event?.target?.closest?.('[data-eon-city-move],[data-eon-city-sprint-toggle],[data-eon-city-command-open],[data-eon-city-command-inspect]');
    if (target) dismissOnboarding();
  };
  const onKeydown = (event) => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); hide({ reason: 'escape-key' }); return; }
    if (event.key !== 'Tab') return;
    const nodes = focusable();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && documentRef.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && documentRef.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  onboarding.addEventListener('click', onOnboardingClick);
  root.addEventListener('click', onGameplayIntent);
  environment.addEventListener?.('keydown', onGameplayIntent);
  launcher.addEventListener('click', onLauncher);
  panel.addEventListener('click', onClick);
  panel.addEventListener('keydown', onKeydown);

  return freeze({
    schema: EON_CITY_W756_SCHEMA,
    mounted: true,
    show,
    hide,
    minimize,
    restore,
    isOpen: () => open,
    isMinimized: () => minimized,
    isVisible: isVisiblyOpen,
    getSurfaceLifecycle: () => {
      const presentation = inspectPresentation();
      return freeze({
        logicalOpen: open,
        minimized,
        transitionActive,
        successorOwnerId,
        connected: presentation.connected,
        accessibilityHidden: presentation.accessibilityHidden,
        intentionallyHidden: presentation.intentionallyHidden || presentation.computedHidden,
        geometryVisible: presentation.geometryVisible
      });
    },
    getSummary: () => freeze({
      schema: EON_CITY_W756_SCHEMA,
      mounted: true,
      open,
      minimized,
      stationCount: EON_CITY_W731_STATIONS.length,
      outsideDestinationCount: EON_CITY_W737_DISCOVERIES.length,
      minimumTouchTargetPx: 48,
      semanticAlternative: true,
      onboardingVisible: !onboarding.hidden,
      focusTrap: true,
      escapeCloses: true,
      focusRestoration: true,
      automaticNavigation: false,
      automaticWork: false,
      disposed
    }),
    dispose() {
      if (disposed) return;
      if (open) hide({ reason: 'controller-dispose', restoreFocus: false });
      disposed = true;
      onboarding.removeEventListener('click', onOnboardingClick);
      root.removeEventListener('click', onGameplayIntent);
      environment.removeEventListener?.('keydown', onGameplayIntent);
      launcher.removeEventListener('click', onLauncher);
      panel.removeEventListener('click', onClick);
      panel.removeEventListener('keydown', onKeydown);
      onboarding.remove();
      launcher.remove();
      panel.remove();
      style.remove();
    }
  });
}

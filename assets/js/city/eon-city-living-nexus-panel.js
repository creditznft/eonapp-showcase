import { createEonCityLivingNexusController } from './eon-city-living-nexus-hybrid.js';
import { createEonAppW700SignatureFlowController, readEonAppW700SignatureFlow, writeEonAppW700SignatureFlow } from '../nexus/w700/eonapp-w700-signature-flow.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const PRODUCTIVE_MENU_GRID_SELECTOR = '[data-eon-w659n-panel="city-menu"] .eon-city-product-grid';
const PRODUCTIVE_MENU_ENTRY_SELECTOR = '[data-eon-w661e-open-living-nexus]';
const LIVING_NEXUS_OPEN_SELECTOR = '[data-eon-play-open-living-nexus], [data-eon-w661e-open-living-nexus]';
const LIVING_NEXUS_CLOSE_SELECTOR = '[data-eon-play-living-nexus-close]';

export function renderEonCityLivingNexusPanel() {
  return `<section class="eon-play-living-nexus-panel" data-eon-play-living-nexus-panel hidden aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="eon-play-living-nexus-title"><div class="eon-play-living-nexus-card"><header><div><p class="eon-play-kicker">EON NEXUS · ONE WORLD</p><h2 id="eon-play-living-nexus-title">EONCITY: THE LIVING NEXUS</h2></div><div class="eon-play-living-nexus-window-actions"><button type="button" data-eon-play-living-nexus-minimize aria-pressed="false">Minimize</button><button type="button" data-eon-play-living-nexus-close>Close</button></div></header><p>Choose one destination. The world changes only after your explicit Enter action.</p><div data-eon-play-living-nexus-content></div></div></section>`;
}

export function bindEonCityLivingNexusPanel(root, { getRuntime = () => null, onStatus = null } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-living-nexus-panel]');
  const content = panel?.querySelector?.('[data-eon-play-living-nexus-content]');
  const close = panel?.querySelector?.('[data-eon-play-living-nexus-close]');
  const minimize = panel?.querySelector?.('[data-eon-play-living-nexus-minimize]');
  const initialOpenButtons = [...(root?.querySelectorAll?.('[data-eon-play-open-living-nexus]') || [])];
  if (!panel || !content || !close || !root?.addEventListener) return () => {};
  // The play station is the canonical City-session owner. A second binding
  // would create two independent controllers and make Close/Expanse clicks
  // nondeterministic after the progressive bridge loads.
  if (root.dataset.eonCityLivingNexusController === 'ready') return () => {};
  root.dataset.eonCityLivingNexusController = 'ready';
  const getPosition = () => {
    const runtime = getRuntime?.();
    return runtime?.getPlayerPosition?.() || runtime?.getThirdPersonSummary?.()?.position || { x: 0, z: 0 };
  };
  const controller = createEonCityLivingNexusController({ getPosition });
  let reviewTarget = '';
  let minimized = false;
  let lastOpenButton = initialOpenButtons[0] || null;

  const status = (message) => { try { onStatus?.(message); } catch {} };
  const dispatch = (type, detail = {}) => {
    try {
      const ViewCustomEvent = root?.ownerDocument?.defaultView?.CustomEvent || globalThis.CustomEvent;
      root.dispatchEvent(new ViewCustomEvent(type, { detail }));
    } catch {}
  };
  const runtimeSummary = () => getRuntime?.()?.getLivingNexusSummary?.() || null;
  const runtimeWorldSystems = () => getRuntime?.()?.getLivingNexusWorldSystems?.() || null;
  const runtimeRealmCatalog = () => getRuntime?.()?.getLivingNexusRealmCatalog?.() || [];
  const runtimeConnectedCore = () => getRuntime?.()?.getConnectedCoreSummary?.() || null;
  const selectedCell = (snapshot) => snapshot.expanse.cells.find((entry) => entry.id === snapshot.selectedCellId) || snapshot.expanse.cells.find((entry) => entry.role === 'current');
  const enterLabel = (snapshot) => snapshot.destination === 'core' ? 'Return to EONCITY Core' : snapshot.destination === 'expanse' ? 'Enter the Expanse open world' : 'Enter My Realm reflection';
  const syncRuntimeTransformations = (snapshot) => getRuntime?.()?.syncLivingNexusTransformations?.(snapshot.transformations || []);

  // W661E: the progressive Productive City layer is mounted after this panel is
  // bound. Inject one unmistakable Living Nexus card when that menu arrives and
  // use root-level delegation so late progressive DOM remains functional. The
  // existing EON NEXUS continuity card stays separate; this card opens the
  // connected Core / Expanse / My Realm surface in the same Babylon session.
  const ensureProductiveMenuEntry = () => {
    const grid = root.querySelector?.(PRODUCTIVE_MENU_GRID_SELECTOR);
    if (!grid) {
      root.dataset.eonCityLivingNexusProductMenuEntry = 'pending';
      return null;
    }
    const existing = grid.querySelector?.(PRODUCTIVE_MENU_ENTRY_SELECTOR);
    if (existing) {
      root.dataset.eonCityLivingNexusProductMenuEntry = 'ready';
      return existing;
    }
    const documentRef = root.ownerDocument || globalThis.document;
    const button = documentRef?.createElement?.('button');
    if (!button) return null;
    button.type = 'button';
    button.dataset.eonW661eOpenLivingNexus = 'true';
    button.setAttribute('aria-label', 'Open EONCITY Living Nexus');
    button.innerHTML = '<strong>Living Nexus</strong><span>Connected Core, the Expanse, My Realm and six authored Realms.</span>';
    const continuityEntry = grid.querySelector?.('[data-eon-w659n-open="nexus"]');
    if (continuityEntry) grid.insertBefore(button, continuityEntry);
    else grid.append(button);
    root.dataset.eonCityLivingNexusProductMenuEntry = 'ready';
    dispatch('eon:city:living-nexus:product-menu-ready', { entry: 'living-nexus', oneCanonicalPanel: true });
    return button;
  };

  const render = () => {
    const snapshot = controller.getSnapshot();
    const renderer = runtimeSummary();
    const worldSystems = runtimeWorldSystems();
    const realmCatalog = runtimeRealmCatalog();
    const connectedCore = runtimeConnectedCore();
    root.dataset.eonCityLivingMode = snapshot.mode;
    root.dataset.eonCityLivingDestination = snapshot.destination;
    root.dataset.eonCityLivingRenderedDestination = renderer?.destination || 'core';
    const cell = selectedCell(snapshot);
    const activeDestination = snapshot.destinations.find((entry) => entry.id === snapshot.destination) || snapshot.destinations[0];
    const simpleDestinationCopy = {
      core: 'Work with residents, terminals and the connected nine-district City.',
      expanse: 'Enter EONAPP’s flagship effectively endless seeded world: nine visible macro-regions, connected roads, populated streets, discoveries and rare portals.',
      'my-realm': 'See your private verified transformations reflected in a personal world.'
    };
    const destinations = snapshot.destinations.map((entry) => `<button type="button" data-eon-living-destination="${escapeHtml(entry.id)}" aria-pressed="${entry.id === snapshot.destination}"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.summary)}</span><small>${escapeHtml(entry.state)}</small></button>`).join('');
    const cells = snapshot.expanse.cells.filter((entry) => entry.interactive !== false).map((entry) => `<button type="button" data-eon-living-cell="${escapeHtml(entry.id)}" data-role="${escapeHtml(entry.role)}" aria-pressed="${entry.id === snapshot.selectedCellId}"><strong>${escapeHtml(entry.id)}</strong><span>${escapeHtml(entry.visualIdentity.label)}</span><small>${escapeHtml(entry.roadGrammar.pattern)} · ${escapeHtml(entry.gameplayPurpose)}</small></button>`).join('');
    const transformations = snapshot.transformations.length
      ? snapshot.transformations.map((entry) => `<li><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.location)} · verified bounded receipt</span></li>`).join('')
      : '<li><strong>No verified world transformations yet.</strong><span>Use the existing productive mission path, complete a real native action, then sync its bounded receipt here.</span></li>';
    const atlasDiscoveries = snapshot.atlasDiscoveries.length
      ? snapshot.atlasDiscoveries.slice(-6).reverse().map((entry) => `<li><strong>${escapeHtml(entry.cellId)}</strong><span>${escapeHtml(entry.visualIdentityId)} · ${escapeHtml(entry.roadPattern)} · private Atlas entry</span></li>`).join('')
      : '<li><strong>No Expanse discoveries recorded yet.</strong><span>Inspect a resident cell, then explicitly record it in the private EON Atlas.</span></li>';
    const realmAtlasDiscoveries = snapshot.realmDiscoveries.length
      ? snapshot.realmDiscoveries.slice(-6).reverse().map((entry) => `<li><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.realmId)} · private authored discovery</span></li>`).join('')
      : '<li><strong>No curated Realm discoveries recorded yet.</strong><span>Approach an authored discovery inside a Realm and explicitly add it to the private Atlas.</span></li>';
    const realmVisits = snapshot.realmVisits.length
      ? snapshot.realmVisits.slice(-6).reverse().map((entry) => `<li><strong>${escapeHtml(entry.realmId)}</strong><span>${escapeHtml(entry.portalId)} · explicitly entered Realm</span></li>`).join('')
      : '<li><strong>No curated Realm visits recorded yet.</strong><span>Preparing a portal does not count; only a separately confirmed entry is recorded.</span></li>';
    const atlasReturn = snapshot.atlasReturnPoint
      ? `${escapeHtml(snapshot.atlasReturnPoint.cellId)} · ${escapeHtml(snapshot.atlasReturnPoint.seedRef)} · private local return point`
      : 'No Nexus return point is set.';
    const review = reviewTarget === 'my-realm'
      ? '<article class="eon-play-living-nexus-review"><strong>Open My Realm Studio?</strong><p>This leaves the City only after your second click. No private City state, mission text, project data or Expanse seed is transferred.</p><a href="/realm-studio" data-eon-living-native-route>Confirm and open My Realm Studio</a><button type="button" data-eon-living-review-cancel>Stay in City</button></article>'
      : '';
    const renderedState = renderer
      ? `${renderer.destination === 'core' ? 'Core' : renderer.destination === 'expanse' ? 'Expanse' : 'My Realm'} active · ${renderer.renderedCellCount || 0} rendered cells · ${renderer.renderedTransformationCount || 0} transformations`
      : 'Renderer handoff pending in this browser session';
    const realmIndex = realmCatalog.length
      ? `<div class="eon-play-living-nexus-realm-index"><div><small>Curated rare destinations</small><strong>${realmCatalog.length} authored Nexus Realms</strong><span>They remain Expanse portal sub-destinations, never another top-level product mode.</span></div><ul>${realmCatalog.map((entry) => `<li data-realm-id="${escapeHtml(entry.id)}"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.chapter)} · premium authored Realm</span></li>`).join('')}</ul></div>`
      : '';
    const connectedCoreSummary = connectedCore
      ? `<div class="eon-play-living-nexus-world-systems"><article><small>Connected Core</small><strong>${connectedCore.districtCount} districts · ${connectedCore.streetConnectionCount} links</strong><span>One continuous source-controlled street graph</span></article><article><small>Visible transit loop</small><strong>${connectedCore.stationCount} stations · ${connectedCore.transitCapsuleCount} Capsules</strong><span>Physical loop plus review-first fast travel</span></article><article><small>Living schedules</small><strong>${connectedCore.ambientScheduleCount} ambient routines</strong><span>No claim of real work · reduced-effects aware</span></article><article><small>EONBOT network</small><strong>${connectedCore.eonbotDockCount} district docks</strong><span>Explicit call only · no automatic action</span></article></div>`
      : '';
    const worldSystemSummary = worldSystems
      ? `<div class="eon-play-living-nexus-world-systems"><article><small>Flagship regional map</small><strong>${renderer?.macroRegionCount || renderer?.flagshipExpanseRegionCount || 9} regions · ${renderer?.macroArterialCount || 12} arterials</strong><span>${renderer?.expanseDiscoveryCount || renderer?.flagshipExpanseDiscoveryCount || 12} deterministic discoveries · explicit safe return</span></article><article><small>Local visual phase</small><strong>${escapeHtml(worldSystems.phase?.label || 'Nexus Midnight')}</strong><span>${escapeHtml(worldSystems.weather?.label || 'Clear Neon')} · no real-weather claim</span></article><article><small>Living movement</small><strong>${worldSystems.transit?.length || 0} transit · ${worldSystems.maintenance?.length || 0} maintenance</strong><span>Existing render loop · reduced-effects aware</span></article><article><small>Authored event</small><strong>${escapeHtml(worldSystems.worldEvent?.label || 'No current event')}</strong><span>${escapeHtml(worldSystems.worldEvent?.summary || 'The current cell remains calm and navigable.')}</span></article><article><small>Rare Nexus signal</small><strong>${escapeHtml(worldSystems.rarePortal?.label || 'No rare portal in this window')}</strong><span>${worldSystems.rarePortal ? `${escapeHtml(worldSystems.rarePortal.cellId)} · inspect-only authored Realm` : 'Rare portals remain deterministic and intentionally uncommon.'}</span></article></div>`
      : '<div class="eon-play-living-nexus-world-systems"><article><strong>Living-world renderer handoff pending.</strong><span>Enter the Expanse to activate the local bounded system.</span></article></div>';
    content.innerHTML = `
      <section class="eon-play-living-nexus-journey" data-destination="${escapeHtml(snapshot.destination)}">
        <div class="eon-play-living-nexus-portal" aria-hidden="true"><span></span><i></i><b></b></div>
        <div class="eon-play-living-nexus-journey-copy">
          <small>ONE WORLD · ONE CLEAR CHOICE</small>
          <h3>${escapeHtml(activeDestination?.label || 'EONCITY CORE')}</h3>
          <p>${escapeHtml(simpleDestinationCopy[snapshot.destination] || activeDestination?.summary || '')}</p>
          <div class="eon-play-living-nexus-quick-facts">
            <span><strong>${renderer?.flagshipExpanseRegionCount || 9}</strong> open-world regions</span>
            <span><strong>${renderer?.flagshipExpanseDiscoveryCount || 12}</strong> discoveries</span>
            <span><strong>${snapshot.expanse.interactiveCellCount || 9}</strong> interactive nearby</span>
            <span><strong>${renderer?.safeCoreReturnAvailable ? 'Ready' : 'Captured on entry'}</strong> safe Core return</span>
          </div>
        </div>
        <div class="eon-play-living-nexus-mode eon-play-living-nexus-mode--simple" role="group" aria-label="Living Nexus mode">
          <button type="button" data-eon-living-mode="focus" aria-pressed="${snapshot.mode === 'focus'}"><strong>Focus</strong><span>Work and direct actions</span></button>
          <button type="button" data-eon-living-mode="explore" aria-pressed="${snapshot.mode === 'explore'}"><strong>Explore</strong><span>Movement and discovery</span></button>
        </div>
        <div class="eon-play-living-nexus-destinations eon-play-living-nexus-destinations--simple">${destinations}</div>
        <div class="eon-play-living-nexus-primary-action">
          ${renderer?.destination === 'expanse'
            ? '<button type="button" data-eon-living-return-core>Return to Orientation Hall</button><span>Return is a separate visible action. It restores the reviewed Core approach and keeps movement available.</span>'
            : snapshot.destination === 'expanse'
              ? '<button type="button" data-eon-living-guide-gateway>Guide Pathfinder to the physical gateway</button><span>Selection and travel are separate visible actions. The Expanse remains a physical journey: review the gateway, then choose Enter. The Nexus stays open if guidance cannot start.</span>'
              : `<button type="button" data-eon-living-enter-destination>${escapeHtml(enterLabel(snapshot))}</button><span>Safe return restores your reviewed Core approach position when available.</span>`}
        </div>
        ${worldSystems?.rarePortal ? `<button class="eon-play-living-nexus-rare-shortcut" type="button" data-eon-living-guide-cell="${escapeHtml(worldSystems.rarePortal.cellId)}"><span>RARE SIGNAL</span><strong>${escapeHtml(worldSystems.rarePortal.label)}</strong><small>Guide to ${escapeHtml(worldSystems.rarePortal.cellId)}</small></button>` : ''}
      </section>

      <details class="eon-play-living-nexus-advanced">
        <summary><span>World map, Atlas and advanced controls</span><small>Optional</small></summary>
        <div class="eon-play-living-nexus-advanced-body">
          <section>
            <div class="eon-play-living-nexus-section-head"><div><small>Deterministic streamed residency</small><h3>The Expanse around your current position</h3></div><button type="button" data-eon-living-refresh>Refresh from player position</button></div>
            <div class="eon-play-living-nexus-cells">${cells}</div>
            ${cell ? `<article class="eon-play-living-nexus-cell-detail"><small>${escapeHtml(cell.id)} · ${escapeHtml(cell.role)}</small><h3>${escapeHtml(cell.visualIdentity.label)}</h3><p>${escapeHtml(cell.visualIdentity.atmosphere)}. Buildings: ${escapeHtml(cell.buildingComposition.join(', '))}. Activity: ${escapeHtml(cell.activityLayer)}.</p><p><strong>Safe route:</strong> connected local waypoints; manual movement remains available.</p><button type="button" data-eon-living-guide-cell="${escapeHtml(cell.id)}">Enter Expanse and guide to this cell</button></article>` : ''}
            ${connectedCoreSummary}${worldSystemSummary}${realmIndex}
            <div class="eon-play-living-nexus-actions"><button type="button" data-eon-living-open-capture>Creator Capture</button><button type="button" data-eon-living-open-share>Sharing Center</button>${worldSystems?.rarePortal ? `<button type="button" data-eon-living-guide-cell="${escapeHtml(worldSystems.rarePortal.cellId)}">Guide to rare portal</button>` : ''}</div>
          </section>
          <section>
            <div class="eon-play-living-nexus-section-head"><div><small>Truthful transformation loop</small><h3>EON Atlas + My Realm</h3></div><button type="button" data-eon-living-sync>Sync verified outcomes</button></div>
            <ul class="eon-play-living-nexus-transformations">${transformations}</ul>
            <div class="eon-play-living-nexus-atlas"><div><small>Private exploration memory</small><strong>${snapshot.atlasDiscoveryCount} recorded cells</strong><span>${atlasReturn}</span></div><ul>${atlasDiscoveries}</ul><div class="eon-play-living-nexus-realm-atlas"><div><small>Curated Realm memory</small><strong>${snapshot.realmVisitCount} visited Realms · ${snapshot.realmDiscoveryCount} discoveries</strong><span>Private by default</span></div><ul>${realmVisits}${realmAtlasDiscoveries}</ul></div></div>
            <div class="eon-play-living-nexus-actions"><button type="button" data-eon-living-record-atlas>Record selected cell</button><button type="button" data-eon-living-set-return>Set return point</button><button type="button" data-eon-living-return-atlas ${snapshot.atlasReturnPoint ? '' : 'disabled'}>Return through Nexus</button><button type="button" data-eon-living-open-missions>Productive missions</button><button type="button" data-eon-living-open-districts>Core districts</button><button type="button" data-eon-living-review-realm>My Realm Studio</button></div>
            ${review}
          </section>
          <footer><span>${snapshot.verifiedProductiveOutcomeCount}/${snapshot.productiveMissionCount} productive missions have verified outcomes.</span><span>${escapeHtml(renderedState)} · local source proof · authenticated browser proof pending.</span></footer>
        </div>
      </details>`
  };

  const setMinimized = (value = false) => {
    minimized = value === true;
    panel.dataset.eonLivingNexusMinimized = String(minimized);
    panel.classList?.toggle('is-minimized', minimized);
    panel.setAttribute?.('aria-modal', String(!minimized));
    minimize?.setAttribute?.('aria-pressed', String(minimized));
    if (minimize) minimize.textContent = minimized ? 'Restore' : 'Minimize';
    return minimized;
  };
  const show = (trigger = null) => {
    lastOpenButton = trigger || lastOpenButton || initialOpenButtons[0] || null;
    const competingPanel = trigger?.closest?.('[data-eon-w659n-panel]');
    if (competingPanel && competingPanel !== panel) competingPanel.hidden = true;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    root.dataset.eonCityLivingPanelOpen = 'true';
    setMinimized(false);
    reviewTarget = '';
    render();
    panel.querySelector('[data-eon-living-enter-destination], [data-eon-living-mode], button')?.focus?.({ preventScroll: true });
    status('Living Nexus opened. Core, Expanse, My Realm and six authored Realms share the existing City scene and truthful local foundation.');
  };
  const hide = (options = {}) => {
    const focusCanvas = options?.focusCanvas === true;
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    root.dataset.eonCityLivingPanelOpen = 'false';
    setMinimized(false);
    reviewTarget = '';
    if (focusCanvas) getRuntime?.()?.canvas?.focus?.({ preventScroll: true });
    else (lastOpenButton || initialOpenButtons[0])?.focus?.({ preventScroll: true });
  };
  const onCloseClick = (event) => { event?.preventDefault?.(); event?.stopPropagation?.(); hide(); };
  const onMinimizeClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const next = setMinimized(!minimized);
    status(next ? 'Living Nexus minimized. Restore or close it before returning to the world.' : 'Living Nexus restored.');
    minimize?.focus?.({ preventScroll: true });
  };
  const enterDestination = (snapshot, { returnPoint = null } = {}) => {
    const runtime = getRuntime?.();
    if (!runtime?.enterLivingNexusDestination) return { ok: false, reason: 'living-nexus-renderer-unavailable' };
    syncRuntimeTransformations(snapshot);
    return runtime.enterLivingNexusDestination(snapshot.destination, { explicitUserAction: true, transformations: snapshot.transformations, returnPoint });
  };
  const syncVerifiedOutcomes = (source = 'living-nexus-panel') => {
    const result = controller.syncVerifiedProductiveOutcomes({ explicitUserAction: true });
    syncRuntimeTransformations(result.snapshot);
    render();
    dispatch('eon:city:living-nexus:sync-result', { source, recorded: result.recorded, transformationCount: result.snapshot?.transformations?.length || 0, privateContentStored: false, rewardIssued: false });
    status(`${result.recorded} new verified bounded outcome${result.recorded === 1 ? '' : 's'} reflected in Atlas and the rendered Living Nexus.`);
    return result;
  };
  const onSyncRequest = (event) => syncVerifiedOutcomes(event?.detail?.source || 'external-visible-request');
  const onRecordRealmVisit = (event) => {
    const detail = event?.detail || {};
    const result = controller.recordRealmVisit(detail.realmId, detail.portalId, { explicitUserAction: detail.explicitUserAction === true, now: detail.enteredAt || Date.now() });
    render();
    dispatch('eon:city:living-nexus:realm-atlas-result', { kind: 'visit', ok: result.ok, reason: result.reason || '', realmId: detail.realmId || '', privateContentStored: false, sharePermission: 'private' });
    if (result.ok) status(`${detail.realmId} recorded as an explicit private Realm visit. No project, prompt, file or identity data was stored.`);
    return result;
  };
  const onRecordRealmDiscovery = (event) => {
    const detail = event?.detail || {};
    const result = controller.recordRealmDiscovery(detail.realmId, { id: detail.discoveryId, label: detail.label }, { explicitUserAction: detail.explicitUserAction === true, now: detail.discoveredAt || Date.now() });
    render();
    dispatch('eon:city:living-nexus:realm-atlas-result', { kind: 'discovery', ok: result.ok, reason: result.reason || '', realmId: detail.realmId || '', discoveryId: detail.discoveryId || '', privateContentStored: false, sharePermission: 'private' });
    if (result.ok) status(`${detail.label || detail.discoveryId} recorded in the private Realm Atlas. Nothing was shared automatically.`);
    return result;
  };

  const onClick = (event) => {
    const mode = event.target?.closest?.('[data-eon-living-mode]');
    if (mode) {
      const result = controller.setMode(mode.dataset.eonLivingMode, { explicitUserAction: true });
      getRuntime?.()?.setLivingNexusMode?.(mode.dataset.eonLivingMode, { explicitUserAction: true });
      render();
      status(result.ok ? `${result.snapshot.mode === 'focus' ? 'Focus' : 'Explore'} Mode selected locally. No work or navigation started.` : 'Living Nexus mode was not changed.');
      return;
    }
    const destination = event.target?.closest?.('[data-eon-living-destination]');
    if (destination) {
      const result = controller.selectDestination(destination.dataset.eonLivingDestination, { explicitUserAction: true });
      render();
      status(result.ok ? `${result.snapshot.destinations.find((entry) => entry.id === result.snapshot.destination)?.label || 'Destination'} selected for review. Use the separate Enter control to move.` : 'Destination was not changed.');
      return;
    }
    if (event.target?.closest?.('[data-eon-living-enter-destination]')) {
      const snapshot = controller.getSnapshot();
      const result = enterDestination(snapshot);
      if (result?.ok) {
        if (snapshot.destination === 'core') {
          const signatureState = readEonAppW700SignatureFlow(globalThis.sessionStorage);
          if (signatureState?.stage === 'my-realm-reflected') {
            const signatureController = createEonAppW700SignatureFlowController({ initialState: signatureState });
            const returned = signatureController.returnCore({ explicitUserAction: true });
            if (returned.ok) {
              writeEonAppW700SignatureFlow(returned.state, globalThis.sessionStorage);
              root.dataset.eonCitySignatureFlowStage = returned.state.stage;
            }
          }
        }
        hide({ focusCanvas: true });
        status(`${snapshot.destinations.find((entry) => entry.id === result.destination)?.label || result.destination} entered inside the existing Babylon scene. No route or work action was opened.`);
      } else status(`That Living Nexus destination could not be entered: ${result?.reason || 'unknown-renderer-failure'}.`);
      return;
    }
    if (event.target?.closest?.('[data-eon-living-guide-gateway]')) {
      const result = getRuntime?.()?.guideToLivingNexusPhysicalGateway?.({ explicitUserAction: true });
      if (result?.ok) {
        status('Guidance is active to the physical Expanse gateway. Review the gateway, then choose Enter; no travel occurs automatically.');
      } else {
        status(`The physical gateway guide could not start: ${result?.reason || 'gateway-unavailable'}. The Living Nexus remains open.`);
      }
      return;
    }
    if (event.target?.closest?.('[data-eon-living-return-core]')) {
      const result = getRuntime?.()?.enterLivingNexusDestination?.('core', { explicitUserAction: true, transformations: controller.getSnapshot().transformations || [] });
      if (result?.ok) {
        hide({ focusCanvas: true });
        status('Returned to Orientation Hall. Movement and camera remain active.');
      } else {
        status(`Return to Orientation Hall could not complete: ${result?.reason || 'unknown-renderer-failure'}. The Living Nexus remains open.`);
      }
      return;
    }
    const cell = event.target?.closest?.('[data-eon-living-cell]');
    if (cell) {
      const result = controller.selectCell(cell.dataset.eonLivingCell, { explicitUserAction: true });
      render();
      status(result.ok ? `${cell.dataset.eonLivingCell} inspected. No automatic movement or asset fetch occurred.` : 'That Expanse cell is outside the current visible streaming horizon.');
      return;
    }
    const guide = event.target?.closest?.('[data-eon-living-guide-cell]');
    if (guide) {
      controller.selectCell(guide.dataset.eonLivingGuideCell, { explicitUserAction: true });
      const snapshot = controller.getSnapshot();
      const entered = enterDestination(snapshot);
      const result = entered?.ok ? getRuntime?.()?.guideToLivingNexusCell?.(guide.dataset.eonLivingGuideCell, { explicitUserAction: true }) : entered;
      if (result?.ok) {
        hide({ focusCanvas: true });
        status(`${guide.dataset.eonLivingGuideCell} guide activated locally in the rendered Expanse. Manual movement cancels it.`);
      } else status('That Expanse cell guide could not be activated. Refresh the current 3×3 window and try again.');
      return;
    }
    if (event.target?.closest?.('[data-eon-living-refresh]')) { render(); status('The local 5×5 Expanse horizon refreshed from the current player position.'); return; }
    if (event.target?.closest?.('[data-eon-living-record-atlas]')) {
      const snapshot = controller.getSnapshot();
      const targetCellId = selectedCell(snapshot)?.id || '';
      const result = controller.recordAtlasCell(targetCellId, { explicitUserAction: true });
      render();
      status(result.ok ? `${targetCellId} recorded in the private EON Atlas. No project, prompt, file or identity data was stored.` : 'That cell is no longer resident and was not recorded.');
      return;
    }
    if (event.target?.closest?.('[data-eon-living-set-return]')) {
      const snapshot = controller.getSnapshot();
      const targetCellId = selectedCell(snapshot)?.id || '';
      const result = controller.setAtlasReturnPoint(targetCellId, { explicitUserAction: true });
      render();
      status(result.ok ? `${targetCellId} is now the private Nexus return point. Returning still requires a separate explicit click.` : 'That cell is no longer resident and was not set as a return point.');
      return;
    }
    if (event.target?.closest?.('[data-eon-living-return-atlas]')) {
      const prepared = controller.prepareAtlasReturn({ explicitUserAction: true });
      if (!prepared.ok) { status('No private EON Atlas return point is available.'); return; }
      const entered = enterDestination(prepared.snapshot, { returnPoint: prepared.returnPoint });
      if (entered?.ok) {
        hide({ focusCanvas: true });
        status(`${prepared.returnPoint.cellId} restored through the Nexus after explicit confirmation. No private work content was transferred.`);
      } else status('The private Nexus return point could not be restored in this browser session.');
      return;
    }
    if (event.target?.closest?.('[data-eon-living-open-capture]')) { hide(); root.querySelector('[data-capture-toggle]')?.click?.(); status('Creator Capture opened. Screen, microphone and facecam permissions remain separate direct browser choices; nothing uploads automatically.'); return; }
    if (event.target?.closest?.('[data-eon-living-open-share]')) { hide(); root.querySelector('[data-eon-play-share-city]')?.click?.(); status('The one global Sharing Center opened for explicit review. No post or upload was performed automatically.'); return; }
    if (event.target?.closest?.('[data-eon-living-sync]')) { syncVerifiedOutcomes('living-nexus-panel'); return; }
    if (event.target?.closest?.('[data-eon-living-open-missions]')) { hide(); root.querySelector('[data-eon-play-rpg-toggle]')?.click(); return; }
    if (event.target?.closest?.('[data-eon-living-open-districts]')) { hide(); root.querySelector('[data-eon-play-open-travel-map]')?.click(); return; }
    if (event.target?.closest?.('[data-eon-living-review-realm]')) { reviewTarget = 'my-realm'; render(); status('My Realm Studio route prepared for a separate visible confirmation.'); return; }
    if (event.target?.closest?.('[data-eon-living-review-cancel]')) { reviewTarget = ''; render(); return; }
    if (event.target?.closest?.('[data-eon-living-native-route]')) status('My Realm Studio route confirmed after review. No private Living Nexus data is transferred.');
  };
  const onRootClick = (event) => {
    // W719.14: retain the direct button listener, but also delegate from the
    // stable City root. This keeps the visible Close action functional if a
    // late progressive render replaces the header controls after binding.
    const closeTrigger = event.target?.closest?.(LIVING_NEXUS_CLOSE_SELECTOR);
    if (closeTrigger && panel.contains?.(closeTrigger)) {
      event.preventDefault?.();
      event.stopPropagation?.();
      hide();
      return;
    }
    const trigger = event.target?.closest?.(LIVING_NEXUS_OPEN_SELECTOR);
    if (!trigger || (typeof root.contains === 'function' && !root.contains(trigger))) return;
    event.preventDefault?.();
    if (trigger.matches?.(PRODUCTIVE_MENU_ENTRY_SELECTOR)) event.stopPropagation?.();
    show(trigger);
  };
  const onKeydown = (event) => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation?.(); hide(); } };
  const onBackdropClick = (event) => { if (event.target === panel) hide(); };

  const ViewMutationObserver = root?.ownerDocument?.defaultView?.MutationObserver || globalThis.MutationObserver;
  const productMenuObserver = typeof ViewMutationObserver === 'function'
    ? new ViewMutationObserver(() => ensureProductiveMenuEntry())
    : null;
  ensureProductiveMenuEntry();
  productMenuObserver?.observe?.(root, { childList: true, subtree: true });

  root.addEventListener('click', onRootClick);
  close.addEventListener('click', onCloseClick);
  minimize?.addEventListener?.('click', onMinimizeClick);
  root.addEventListener('eon:city:living-nexus:sync-request', onSyncRequest);
  root.addEventListener('eon:city:living-nexus:record-realm-visit', onRecordRealmVisit);
  root.addEventListener('eon:city:living-nexus:record-realm-discovery', onRecordRealmDiscovery);
  panel.addEventListener('click', onClick);
  panel.addEventListener('keydown', onKeydown);
  root.ownerDocument?.addEventListener?.('keydown', onKeydown, true);
  panel.addEventListener('click', onBackdropClick);
    return () => {
    productMenuObserver?.disconnect?.();
    root.removeEventListener('click', onRootClick);
    close.removeEventListener('click', onCloseClick);
    minimize?.removeEventListener?.('click', onMinimizeClick);
    root.removeEventListener('eon:city:living-nexus:sync-request', onSyncRequest);
    root.removeEventListener('eon:city:living-nexus:record-realm-visit', onRecordRealmVisit);
    root.removeEventListener('eon:city:living-nexus:record-realm-discovery', onRecordRealmDiscovery);
    panel.removeEventListener('click', onClick);
    panel.removeEventListener('click', onBackdropClick);
    panel.removeEventListener('keydown', onKeydown);
      root.ownerDocument?.removeEventListener?.('keydown', onKeydown, true);
      controller.dispose();
      delete root.dataset.eonCityLivingNexusController;
    };
}

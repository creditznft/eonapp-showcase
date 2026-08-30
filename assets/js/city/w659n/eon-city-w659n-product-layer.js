/**
 * W659N — progressive Productive City integration layer.
 *
 * This module is imported only after the proven Babylon first frame and W649
 * starter scene. It restores the W659F/W659G/W659H product systems without
 * reviving the retired monolithic City owner. Every action is explicit,
 * review-first and disposable; no optional panel may own the render loop.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer.js';
import { Scene } from '@babylonjs/core/scene.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import {
  createEonNoirLandmark,
  createEonNoirWorldDetailLayer,
  createEonNoirWorldLayer
} from '../eon-city-noir-architecture.js';
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { resolveEonCityThirdPersonPosition } from '../eon-city-third-person-controller.js';
import { renderEonCityEonbotQuickWorkMarkup, bindEonCityEonbotQuickWork } from '../eon-city-eonbot-quick-work.js';
import { createEonCityGenuineAgentTheatreController } from '../eon-city-genuine-agent-theatre.js';
import { bindEonCitySharingCenter } from '../eon-city-sharing-center.js';
import { createEonCityW659fCollisionRegistry } from '../w659f/eon-city-w659f-collision-residency.js';
import {
  EON_CITY_W659F_FUNCTIONAL_ASSETS,
  EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS,
  getEonCityW659fCanonicalCollisionVolumes
} from '../w659f/eon-city-w659f-functional-asset-manifest.js';
import { createEonCityW659fFunctionalAssetRuntime } from '../w659f/eon-city-w659f-functional-asset-runtime.js';
import { createEonCityW659fTransportRuntime } from '../w659f/eon-city-w659f-transport-runtime.js';
import {
  EON_CITY_W659G_FUNCTIONAL_STATIONS,
  getEonCityW659gFunctionalStation
} from '../w659g/eon-city-w659g-functional-station-registry.js';
import {
  EON_CITY_W659G_NPC_OPERATORS,
  resolveEonCityW659gNpcOperatorsNearPosition
} from '../w659g/eon-city-w659g-npc-operator-registry.js';
import { bindEonCityW659gProgression } from '../w659g/eon-city-w659g-progression-ui.js';
import {
  EON_CITY_W659G_CAPTURE_OPEN_EVENT,
  bindEonCityW659gCreatorCapture
} from '../w659g/eon-city-w659g-creator-capture.js';
import {
  EON_CITY_W659G_MEMBERSHIP_OPEN_EVENT,
  bindEonCityW659gMembershipConsole
} from '../w659g/eon-city-w659g-membership-console.js';
import { EON_CITY_W659G_VERIFIED_ACTION_EVENT, dispatchEonCityW659gVerifiedAction } from '../w659g/eon-city-w659g-progression-ledger.js';
import { bindEonCityW659hOverlayCoordinator } from '../w659h/eon-city-w659h-overlay-coordinator.js';
import { createEonCityW660NexusHologram } from '../w660/eon-city-w660-nexus-hologram.js';
import { createEonCityW660iDistrictComposition } from '../w660i/eon-city-w660i-district-composition.js';
import { createEonCityW660kTravelPresentation } from '../w660k/eon-city-w660k-travel-presentation.js';
import { projectEonCityW660nNexusView } from '../w660n/eon-city-w660n-nexus-continuity.js';
import { readEonNexusContinuitySnapshot } from '../../nexus/eon-nexus-continuity-contract.js';
import {
  createEonAppW700SignatureFlowController,
  readEonAppW700SignatureFlow,
  writeEonAppW700SignatureFlow
} from '../../nexus/w700/eonapp-w700-signature-flow.js';
import {
  EON_CITY_W660I_TERMINALS,
  getEonCityW660iTerminal,
  getEonCityW660iTerminalsForDistrict,
  getNearestEonCityW660iTerminal
} from '../w660i/eon-city-w660i-terminal-registry.js';
import { getEonCityW666AssetFunction } from '../w666/eon-city-w666-asset-function-registry.js';
import { buildEonCityW671AtlasModel } from '../w671/eon-city-w671-owner-repair.js';
// W671 predecessor boundary contract retained for historical source alignment: createEonCityW671DistrictBoundaryStabilizer.
import { resolveEonCityW675DistrictAtPosition } from '../w675/eon-city-w675-orientation-belt-activation.js';
// W675 predecessor authority: EON_CITY_W675_PRODUCT_DISTRICTS.
import { resolveEonCityW688DistrictAtPosition } from '../w688/eon-city-w688-creator-forge-belt-activation.js';
// W688 predecessor authority: EON_CITY_W688_PRODUCT_DISTRICTS.
import { EON_CITY_W689_PRODUCT_DISTRICTS, resolveEonCityW689DistrictAtPosition } from '../w689/eon-city-w689-all-district-belts.js';
import { buildEonCityW690CompleteCoreIdentityPlan } from '../w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityW711DistrictStreetIdentity } from '../w711/eon-city-w711-district-street-identity.js';
import { projectEonCityW678AtlasModel } from '../w678/eon-city-w678-expanse-threshold.js';
import { resolveEonCityW692ExperienceProfile } from '../w692/eon-city-w692-experience-quality.js';
import {
  EON_CITY_W696_WORLD_BOUND,
  createEonCityW696PhysicalDistrictTransitionController,
  resolveEonCityW696InteractionTarget
} from '../w696/eon-city-w696-interaction-boundary-hud.js';
import { resolveEonCityW719FunctionalArrival } from '../w719/eon-city-w719-functional-arrival.js';
import {
  createEonCityW680OrientationProductiveLoopController,
  getEonCityW680OrientationProductiveLoopForBuilding,
  getEonCityW680OrientationProductiveLoopForResident,
  getEonCityW680OrientationProductiveLoopForTerminal
} from '../w680/eon-city-w680-orientation-productive-loop.js';

export const EON_CITY_W659N_PRODUCT_LAYER_SCHEMA = 'eon.city.w659n.product-layer.v1';
export const EON_CITY_W659N_STYLESHEET = '/assets/css/eon-city-product-layer.css';

const freeze = (value) => Object.freeze(value);
const INTERACTION_RADIUS = 3.2;
const PRODUCT_DISTRICTS = EON_CITY_W689_PRODUCT_DISTRICTS;
const W711_STREET_IDENTITY_PLAN = buildEonCityW711DistrictStreetIdentity({ districts: buildEonCityW690CompleteCoreIdentityPlan({ quality: 'balanced', mode: 'explore' }).districts });
const W711_STREET_IDENTITY_BY_DISTRICT = new Map(W711_STREET_IDENTITY_PLAN.districts.map((entry) => [entry.id, entry]));
const DISTRICT_CENTERS = freeze(PRODUCT_DISTRICTS.map((entry) => freeze({
  id: entry.id,
  label: entry.label,
  x: entry.center.x,
  z: entry.center.z,
  radius: entry.radius,
  purpose: entry.purpose,
  palette: entry.palette,
  signatureLandmarkId: entry.signatureLandmarkId,
  activeAssetGroupId: entry.activeAssetGroupId
})));

const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function ensureStyles(documentRef = globalThis.document) {
  if (!documentRef?.head?.append) return null;
  const existing = documentRef.querySelector?.('link[data-eon-city-product-layer-styles="true"]');
  if (existing) return existing;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = EON_CITY_W659N_STYLESHEET;
  link.dataset.eonCityProductLayerStyles = 'true';
  documentRef.head.append(link);
  return link;
}

function nearestByPosition(entries, position, getPoint) {
  return entries.map((entry) => {
    const point = getPoint(entry);
    return { entry, distance: Math.hypot(Number(position?.x || 0) - point.x, Number(position?.z || 0) - point.z) };
  }).sort((left, right) => left.distance - right.distance)[0] || null;
}

function nearestDistrict(position = {}, currentDistrictId = '') {
  const resolved = resolveEonCityW689DistrictAtPosition(position, { currentDistrictId })
    || resolveEonCityW688DistrictAtPosition(position, { currentDistrictId })
    || resolveEonCityW675DistrictAtPosition(position, { currentDistrictId });
  return DISTRICT_CENTERS.find((entry) => entry.id === resolved?.id) || DISTRICT_CENTERS[0];
}


function nearestStation(position = {}) {
  const result = nearestByPosition(EON_CITY_W659F_FUNCTIONAL_ASSETS, position, (entry) => entry.placement);
  return result ? freeze({ ...result, station: getEonCityW659gFunctionalStation(result.entry.id) }) : null;
}

function renderActionButtons(actions = []) {
  return actions.map((action) => `<button type="button" data-eon-w659n-action="${escapeHtml(action.id)}" data-panel="${escapeHtml(action.panel || '')}" data-route="${escapeHtml(action.route || '')}"><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.purpose || 'Review this City action.')}</span></button>`).join('');
}

function renderProductShell(documentRef) {
  const shell = documentRef.createElement('section');
  shell.className = 'eon-city-product-layer';
  shell.dataset.eonCityProductLayer = EON_CITY_W659N_PRODUCT_LAYER_SCHEMA;
  shell.innerHTML = `
    <header class="eon-city-product-dock" aria-label="EON City tools">
      <button type="button" data-eon-w659n-open="city-menu"><span>◆</span> City Menu</button>
      <button type="button" data-eon-w659n-interact><span>E</span> Interact</button>
      <button type="button" data-eon-w659n-open="eonbot"><span>✦</span> EONBOT</button>
      <button type="button" data-eon-w659n-open="travel-map"><span>⌁</span> Atlas</button>
      <button type="button" data-eon-w659n-nexus><span>◈</span> Nexus</button>
      <button type="button" data-eon-play-share-city hidden>Sharing Center</button>
    </header>
    <aside class="eon-city-district-identity" data-eon-w660i-district-identity aria-live="polite">
      <span>ACTIVE DISTRICT</span>
      <strong data-eon-w660i-district-label>Orientation Hall</strong>
      <small data-eon-w660i-district-purpose>Tutorial, device guidance, first missions and EONBOT introduction.</small>
      <em data-eon-w660m-living-status>Living district systems are warming up.</em>
    </aside>
    <aside class="eon-city-nearby-prompt" data-eon-w659n-nearby hidden aria-live="polite">
      <span data-eon-w659n-nearby-kicker>Nearby station</span>
      <strong data-eon-w659n-nearby-title></strong>
      <small data-eon-w659n-nearby-detail>Press E or choose Interact.</small>
    </aside>
    <aside class="eon-city-travel-transition" data-eon-w660k-travel-transition hidden role="status" aria-live="polite" aria-label="District travel progress">
      <div class="eon-city-travel-transition-card">
        <div class="eon-city-travel-orbit" aria-hidden="true"><span></span><i></i></div>
        <p class="eon-play-kicker">EON TRANSIT · LOCAL DISTRICT STREAM</p>
        <h2 data-eon-w660k-travel-destination>Preparing district</h2>
        <p data-eon-w660k-travel-detail>Switching the active district composition and arrival camera.</p>
        <div class="eon-city-travel-progress" data-eon-w660k-travel-progress role="progressbar" aria-label="District loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="12"><span></span></div>
        <div class="eon-city-travel-meta"><span>First visit may take 3–10 seconds</span><strong data-eon-w660k-travel-elapsed>0.0 s</strong></div>
        <button type="button" data-eon-w660k-travel-continue hidden>Continue with lightweight district</button>
      </div>
    </aside>
    <aside class="eon-city-arrival-toast" data-eon-w660k-arrival-toast hidden aria-live="polite">
      <span>ARRIVAL CONFIRMED</span><strong data-eon-w660k-arrival-title>District online</strong><small data-eon-w660k-arrival-detail>Landmark, camera and district systems are ready.</small>
    </aside>
    <section class="eon-city-product-panel" data-eon-play-landmark-panel data-eon-w659n-panel="city-menu" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w659n-menu-title">
      <div class="eon-city-product-card eon-city-product-card-wide">
        <header><div><p class="eon-play-kicker">PRODUCTIVE CITY · real functions</p><h2 id="eon-w659n-menu-title">EON City Command Menu</h2></div><button type="button" data-eon-w659n-close aria-label="Close City Menu">Close</button></header>
        <p>Explore the 3D districts or open a real EONAPP function. Every route, microphone, camera, checkout and share action remains explicit.</p>
        <div class="eon-city-product-grid">
          <button type="button" data-eon-w659n-open="eonbot"><strong>EONBOT</strong><span>Text, Dictate, Voice Conversation and compatible Live Voice.</span></button>
          <button type="button" data-eon-w659n-open="travel-map"><strong>Transit Hub</strong><span>Review and confirm travel between active districts.</span></button>
          <button type="button" data-eon-w659n-open="missions-rewards"><strong>Missions &amp; Vault Reveals</strong><span>Verified City XP, deterministic Reveals and EONKEY status.</span></button>
          <button type="button" data-eon-w659n-open="creator-capture"><strong>Creator Capture</strong><span>Record gameplay with optional microphone and facecam locally.</span></button>
          <button type="button" data-eon-w659n-open="share-center"><strong>Sharing Center</strong><span>Review public-safe sharing and signed invite handoffs.</span></button>
          <button type="button" data-eon-w659n-open="membership"><strong>Plans &amp; access</strong><span>Compare useful plan benefits and review server-confirmed access. Checkout stays explicit.</span></button>
          <button type="button" data-eon-w659n-open="command-room"><strong>Agent Theatre</strong><span>Review genuine bounded job receipts only.</span></button>
          <button type="button" data-eon-w659n-open="nexus"><strong>EON NEXUS</strong><span>Continue the same Chat, selected project, task stage, approvals and results.</span></button>
          <button type="button" data-eon-w659n-open="nearby"><strong>Nearby Station / NPC</strong><span>Show actions tied to the closest functional object.</span></button>
        </div>
      </div>
    </section>
    <section class="eon-city-product-panel" data-eon-play-travel-panel data-eon-w659n-panel="travel-map" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w659n-travel-title">
      <div class="eon-city-product-card eon-city-product-card-travel"><header><div><p class="eon-play-kicker">EON City Atlas · explicit local travel</p><h2 id="eon-w659n-travel-title">Core districts and routes</h2></div><button type="button" data-eon-w659n-close aria-label="Close District Map">Close</button></header><div class="eon-city-atlas-map" data-eon-w671-atlas-map aria-label="EON City Atlas"></div><div data-eon-w659n-travel-content></div><p data-eon-w659n-travel-status aria-live="polite">Choose a destination to review it. Travel never starts from proximity alone.</p></div>
    </section>
    <section class="eon-city-product-panel" data-eon-play-eonbot-panel data-eon-w659n-panel="eonbot" hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-eonbot-title">
      <div class="eon-city-product-card eon-city-product-card-wide"><header><div><p class="eon-play-kicker">EONBOT Companion Station</p><h2>Work with EONBOT inside City</h2></div><button type="button" data-eon-w659n-close aria-label="Close EONBOT">Close</button></header>${renderEonCityEonbotQuickWorkMarkup()}</div>
    </section>
    <section class="eon-city-product-panel" data-eon-command-room-panel data-eon-w659n-panel="command-room" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w659n-agent-title">
      <div class="eon-city-product-card eon-city-product-card-wide"><header><div><p class="eon-play-kicker">Agent Theatre · truthful receipts</p><h2 id="eon-w659n-agent-title">Genuine Agent Theatre</h2></div><button type="button" data-eon-w659n-close aria-label="Close Agent Theatre">Close</button></header><div data-eon-w659n-agent-content></div></div>
    </section>
    <section class="eon-city-product-panel" data-eon-play-authored-slice-panel data-eon-w659n-panel="nearby" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w659n-nearby-title">
      <div class="eon-city-product-card"><header><div><p class="eon-play-kicker">Proximity function · review first</p><h2 id="eon-w659n-nearby-title">Nearby station</h2></div><button type="button" data-eon-w659n-close aria-label="Close Nearby Actions">Close</button></header><div data-eon-w659n-nearby-content></div></div>
    </section>
    <section class="eon-city-product-panel" data-eon-w659n-panel="nexus" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w660n-nexus-title">
      <div class="eon-city-product-card eon-city-product-card-wide eon-city-nexus-card"><header><div><p class="eon-play-kicker">EON NEXUS · same intelligence everywhere</p><h2 id="eon-w660n-nexus-title">City Nexus Continuity</h2></div><button type="button" data-eon-w659n-close aria-label="Close EON NEXUS">Close</button></header><div data-eon-w660n-nexus-content></div></div>
    </section>
    <section class="eon-city-product-panel" data-eon-play-mission-board-panel data-eon-w659n-panel="route-review" hidden role="dialog" aria-modal="true" aria-labelledby="eon-w659n-route-title">
      <div class="eon-city-product-card"><header><div><p class="eon-play-kicker">Native EONAPP destination</p><h2 id="eon-w659n-route-title">Review route</h2></div><button type="button" data-eon-w659n-close aria-label="Close Route Review">Close</button></header><div data-eon-w659n-route-content></div></div>
    </section>`;
  return shell;
}

export function getEonCityW659nWorldPolishPlan(quality = 'balanced') {
  const resolvedQuality = quality === 'lite' || quality === 'cinematic' ? quality : 'balanced';
  const landmarkScale = resolvedQuality === 'cinematic' ? 0.42 : resolvedQuality === 'lite' ? 0.3 : 0.36;
  return freeze({
    schema: 'eon.city.w659n.world-polish-plan.v2',
    quality: resolvedQuality,
    landmarkScale,
    worldLayerScale: resolvedQuality === 'cinematic' ? 0.96 : resolvedQuality === 'lite' ? 0.86 : 0.92,
    detailLayerScale: resolvedQuality === 'cinematic' ? 0.9 : resolvedQuality === 'lite' ? 0.76 : 0.84,
    // Duplicate procedural silhouettes belong at the perimeter. The resident
    // W649/W659F GLBs remain the readable, interactive district anchors.
    landmarks: freeze([
      freeze({ type: 'command-loom', x: 0, y: -0.06, z: -17.2, heading: 0, accent: '#69e7ff' }),
      freeze({ type: 'creator-atrium', x: -16.4, y: -0.06, z: -10.2, heading: 0.28, accent: '#ffbc68' }),
      freeze({ type: 'forge-basilica', x: 16.2, y: -0.06, z: -10.1, heading: -0.22, accent: '#9b7cff' }),
      freeze({ type: 'archive-canopy', x: 17.2, y: -0.06, z: 17.1, heading: 0.5, accent: '#92f5c2' }),
      freeze({ type: 'agent-theatre', x: 15.2, y: -0.06, z: 4.8, heading: Math.PI, accent: '#ff68cd' })
    ])
  });
}

function markDecorativeComposition(root, metadata = {}) {
  if (!root) return root;
  root.metadata = { ...(root.metadata || {}), decorativeOnly: true, cameraOcclusion: false, ...metadata };
  root.getChildMeshes?.().forEach((mesh) => {
    if (!mesh) return;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = {
      ...(mesh.metadata || {}),
      decorativeOnly: true,
      eonCityCameraOcclusion: false,
      localVisualOnly: true
    };
  });
  return root;
}

function createWorldPolish(scene, quality, reducedMotion) {
  const resources = [];
  const plan = getEonCityW659nWorldPolishPlan(quality);
  const previous = {
    fogMode: scene.fogMode,
    fogDensity: scene.fogDensity,
    fogColor: scene.fogColor?.clone?.() || null,
    clearColor: scene.clearColor?.clone?.() || null
  };
  scene.metadata ||= {};
  scene.metadata.playReducedEffects = reducedMotion === true;
  try {
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = quality === 'lite' ? 0.008 : quality === 'cinematic' ? 0.014 : 0.011;
    scene.fogColor = Color3.FromHexString('#071326');
    const key = new DirectionalLight('eon-w659n-moon-key', new Vector3(-0.28, -0.82, 0.38), scene);
    key.position = new Vector3(9, 16, -12);
    key.intensity = quality === 'lite' ? 0.34 : 0.58;
    resources.push(key);
    if (quality !== 'lite') {
      const glow = new GlowLayer('eon-w659n-neon-glow', scene, { blurKernelSize: quality === 'cinematic' ? 40 : 28 });
      glow.intensity = quality === 'cinematic' ? 0.46 : 0.32;
      resources.push(glow);
    }
    const worldRoot = markDecorativeComposition(createEonNoirWorldLayer(scene, { quality: plan.quality, seed: 'w659n-world' }).root, { compositionRole: 'perimeter-world' });
    worldRoot.scaling.copyFromFloats(plan.worldLayerScale, plan.worldLayerScale, plan.worldLayerScale);
    worldRoot.position.y = -0.08;
    resources.push(worldRoot);

    const detailRoot = markDecorativeComposition(createEonNoirWorldDetailLayer(scene, { quality: plan.quality, seed: 'w659n-detail' }).root, { compositionRole: 'street-detail' });
    detailRoot.scaling.copyFromFloats(plan.detailLayerScale, plan.detailLayerScale, plan.detailLayerScale);
    detailRoot.position.y = -0.04;
    resources.push(detailRoot);

    for (const landmark of plan.landmarks) {
      const root = markDecorativeComposition(createEonNoirLandmark(scene, {
        id: `w659n-${landmark.type}`,
        type: landmark.type,
        position: landmark,
        accent: landmark.accent,
        quality: plan.quality,
        metadata: { compositionRole: 'perimeter-silhouette', residentAssetDuplicate: true }
      }).root, { compositionRole: 'perimeter-silhouette', residentAssetDuplicate: true });
      root.scaling.copyFromFloats(plan.landmarkScale, plan.landmarkScale, plan.landmarkScale);
      resources.push(root);
    }
  } catch (error) {
    try { console.warn('[W659N_WORLD_POLISH_DEFERRED]', error); } catch {}
  }
  return () => {
    for (const resource of resources.reverse()) {
      try { resource?.dispose?.(false, true); } catch {}
    }
    scene.fogMode = previous.fogMode;
    scene.fogDensity = previous.fogDensity;
    if (previous.fogColor) scene.fogColor = previous.fogColor;
    if (previous.clearColor) scene.clearColor = previous.clearColor;
  };
}

function createAgentTheatreBinding(root, panel, onStatus) {
  const controller = createEonCityGenuineAgentTheatreController();
  const content = panel.querySelector('[data-eon-w659n-agent-content]');
  const render = () => {
    const snapshot = controller.getSnapshot();
    const jobs = Array.isArray(snapshot.jobs) ? snapshot.jobs : [];
    content.innerHTML = jobs.length ? `<div class="eon-city-agent-list">${jobs.map((job) => `<article><header><strong>${escapeHtml(job.safeLabel)}</strong><span>${escapeHtml(job.state)}</span></header><p>${escapeHtml(job.railLabel)} · ${escapeHtml(job.sourceLabel)}</p><small>${escapeHtml(job.boundary)}</small><div><button type="button" data-eon-w659n-review-job="${escapeHtml(job.jobId)}">Review receipt</button>${job.route ? `<button type="button" data-eon-w659n-route="${escapeHtml(job.route)}" data-route-label="Open ${escapeHtml(job.sourceLabel)}">Open native surface</button>` : ''}</div></article>`).join('')}</div>` : '<div class="eon-city-product-empty"><strong>No genuine agent receipts yet</strong><p>Use EONBOT, Forge, Local AI, Create or Automations. Agent Theatre will show only bounded receipts that those real surfaces record.</p></div>';
  };
  const onClick = (event) => {
    const review = event.target.closest('[data-eon-w659n-review-job]');
    if (!review) return;
    const result = controller.review(review.dataset.eonW659nReviewJob, { explicitUserAction: true });
    if (result.ok) {
      dispatchEonCityW659gVerifiedAction({ type: 'city.agent-receipt.reviewed', receiptId: `review:${review.dataset.eonW659nReviewJob}:${Date.now()}`, verified: true, source: 'agent-theatre' });
      onStatus('Genuine Agent Theatre receipt reviewed. No job was started or changed.');
    }
    render();
  };
  panel.addEventListener('click', onClick);
  render();
  return freeze({ render, dispose() { panel.removeEventListener('click', onClick); controller.dispose(); } });
}

export function createEonCityW659nProductLayer({
  scene,
  camera: _camera = null,
  root,
  quality = 'balanced',
  reducedMotion = false,
  experienceMode = 'explore',
  playerAnchor,
  eonbotAnchor: _eonbotAnchor,
  onStatus = () => {},
  onProgress = () => {},
  setPlayerPose = () => false,
  activateDistrictAssets = async () => ({ ok: true, reason: 'no-district-asset-runtime' }),
  getCoreRuntime = () => null,
  onLeaveCity = null
} = {}) {
  if (!scene || !root || !playerAnchor) throw new Error('w659n-product-layer-missing-runtime');
  ensureStyles(root.ownerDocument || globalThis.document);
  const documentRef = root.ownerDocument || globalThis.document;
  const environment = documentRef?.defaultView || globalThis;
  const leaveCity = typeof onLeaveCity === 'function'
    ? onLeaveCity
    : (route = '/') => {
      const destination = String(route || '/');
      if (!destination.startsWith('/')) return false;
      try { environment.location.assign(destination); return true; } catch {}
      try { environment.location.href = destination; return true; } catch {}
      return false;
    };
  const experienceProfile = resolveEonCityW692ExperienceProfile({
    mode: experienceMode,
    quality,
    reducedMotion,
    touch: 'ontouchstart' in (environment || {}),
    viewportWidth: environment?.innerWidth || 1366,
    viewportHeight: environment?.innerHeight || 768,
    deviceMemory: environment?.navigator?.deviceMemory || 8,
    hardwareConcurrency: environment?.navigator?.hardwareConcurrency || 8
  });
  const shell = renderProductShell(documentRef);
  root.append(shell);
  root.dataset.eonCityProductiveCity = 'loading';
  root.dataset.eonCityFunctionalStationCount = String(EON_CITY_W659G_FUNCTIONAL_STATIONS.length);
  root.dataset.eonCityExperienceMode = experienceProfile.mode;
  root.dataset.eonCityPanelLayout = experienceProfile.panelLayout;
  root.dataset.eonCityPortraitSafe = experienceProfile.portraitSafeLayout ? 'true' : 'false';

  const collisionRegistry = createEonCityW659fCollisionRegistry({ fixedVolumes: getEonCityW659fCanonicalCollisionVolumes() });
  const functionalRuntime = createEonCityW659fFunctionalAssetRuntime({
    scene,
    quality,
    reducedMotion,
    collisionRegistry,
    onStatus,
    onProgress
  });
  const transport = createEonCityW659fTransportRuntime();
  const nexusLayer = createEonCityW660NexusHologram({ scene, quality, reducedMotion, environment, onStatus });
  // W719.14: the active Babylon core is the single camera authority. The
  // district composition still owns local geometry, lighting and transition
  // overlap, but it must never replace the reviewed first-frame/arrival pose.
  // Passing a null camera retires the older W660I camera mutation path without
  // duplicating or weakening the composition runtime.
  const districtComposition = createEonCityW660iDistrictComposition({ scene, camera: null, playerAnchor, quality, reducedMotion, onStatus });
  const travelPresentation = createEonCityW660kTravelPresentation(root, { environment });
  const disposers = [];
  const panels = new Map([...shell.querySelectorAll('[data-eon-w659n-panel]')].map((panel) => [panel.dataset.eonW659nPanel, panel]));
  const nearbyPrompt = shell.querySelector('[data-eon-w659n-nearby]');
  const nearbyPanelTitle = shell.querySelector('#eon-w659n-nearby-title');
  const nearbyTitle = shell.querySelector('[data-eon-w659n-nearby-title]');
  const nearbyKicker = shell.querySelector('[data-eon-w659n-nearby-kicker]');
  const nearbyContent = shell.querySelector('[data-eon-w659n-nearby-content]');
  const routeContent = shell.querySelector('[data-eon-w659n-route-content]');
  const atlasMap = shell.querySelector('[data-eon-w671-atlas-map]');
  const travelContent = shell.querySelector('[data-eon-w659n-travel-content]');
  const travelStatus = shell.querySelector('[data-eon-w659n-travel-status]');
  const districtIdentity = shell.querySelector('[data-eon-w660i-district-identity]');
  const districtIdentityLabel = shell.querySelector('[data-eon-w660i-district-label]');
  const districtIdentityPurpose = shell.querySelector('[data-eon-w660i-district-purpose]');
  const livingStatus = shell.querySelector('[data-eon-w660m-living-status]');
  const nexusContent = shell.querySelector('[data-eon-w660n-nexus-content]');
  let disposed = false;
  let started = false;
  let currentPosition = freeze({ x: Number(playerAnchor.position.x || 0), z: Number(playerAnchor.position.z || 0) });
  let currentDistrict = nearestDistrict(currentPosition);
  const publishDistrictContext = (reason = 'district-update') => {
    const detail = freeze({
      id: currentDistrict.id,
      label: currentDistrict.label,
      purpose: currentDistrict.purpose || 'Explore this connected EON City district.',
      reason,
      position: freeze({ ...currentPosition })
    });
    try { root.dispatchEvent(new environment.CustomEvent('eon:city:district-context', { detail })); } catch {}
    return detail;
  };
  const districtBoundary = createEonCityW696PhysicalDistrictTransitionController({ initialDistrictId: currentDistrict.id, initialPosition: currentPosition });
  districtBoundary.reset(currentDistrict.id, currentPosition);
  let currentStation = null;
  let currentOperatorBindings = freeze([]);
  const orientationProductiveLoopController = createEonCityW680OrientationProductiveLoopController({ now: () => environment?.performance?.now?.() || Date.now() });
  let focusedInteraction = null;
  let worldPickHighlight = null;
  let worldPickHighlightTimer = null;
  let polishDispose = () => {};
  let replacementBoundary = freeze({ ok: false, reason: 'not-started', excludedAssetIds: freeze([]), disposedAssetIds: freeze([]) });
  let lastLivingStatusText = '';
  let nexusRefreshElapsed = 0;
  let lastNexusPanelSignature = '';
  let livingContextSnapshot = freeze({
    schema: `${EON_CITY_W659N_PRODUCT_LAYER_SCHEMA}.w660m-living-context.v1`,
    districtId: currentDistrict.id,
    nearby: null,
    panelOpen: false,
    actorCount: 0,
    reactiveActors: 0,
    activities: freeze([]),
    localOnly: true
  });

  const setStatus = (message = '') => {
    try { onStatus(String(message || '')); } catch {}
  };
  const getSignatureFlowController = () => createEonAppW700SignatureFlowController({
    initialState: readEonAppW700SignatureFlow(environment.sessionStorage) || {}
  });
  const persistSignatureFlow = (controller) => writeEonAppW700SignatureFlow(controller.getState(), environment.sessionStorage);
  const advanceSignatureCityEntry = ({ workObject, continuity }) => {
    const controller = getSignatureFlowController();
    let state = controller.getState();
    if (state.stage === 'city-handoff-reviewed') {
      const entry = controller.confirmCityEntry({ handoff: state.handoff, explicitUserAction: true });
      if (!entry.ok) return entry;
      persistSignatureFlow(controller);
      state = entry.state;
    }
    if (state.stage === 'city-entered') {
      const inspected = controller.inspectWorkObject({
        workObjectId: workObject?.id,
        districtId: continuity?.workObjectHandoff?.placement?.districtId || state.handoff?.placement?.districtId,
        stationId: continuity?.workObjectHandoff?.placement?.stationId || state.handoff?.placement?.stationId,
        explicitUserAction: true
      });
      if (inspected.ok) persistSignatureFlow(controller);
      return inspected;
    }
    return freeze({ ok: state.stage === 'work-object-visible', reason: state.stage === 'work-object-visible' ? 'already-visible' : 'signature-city-stage-not-ready', state });
  };
  const reviewSignatureSpecialist = (candidate = null) => {
    if (!candidate) return null;
    const controller = getSignatureFlowController();
    const state = controller.getState();
    if (state.stage !== 'work-object-visible') return null;
    const type = candidate.type;
    const value = candidate.value || {};
    const station = value.station || value;
    const specialistId = type === 'operator' ? String(value.id || value.residentAssetId || '') : '';
    const terminalId = type === 'terminal'
      ? String(value.id || '')
      : type === 'station'
        ? String(station.id || value.entry?.id || '')
        : String(value.nearbyStationId || value.nearbyBuildingId || '');
    const result = controller.reviewSpecialist({ specialistId, terminalId, districtId: currentDistrict.id, explicitUserAction: true });
    if (result.ok) persistSignatureFlow(controller);
    return result;
  };
  const confirmSignatureNativeAction = (action = {}) => {
    const controller = getSignatureFlowController();
    const state = controller.getState();
    if (state.stage !== 'specialist-reviewed') return null;
    if (!String(action.route || '').startsWith('/') && !String(action.panel || '').trim()) return null;
    const result = controller.confirmNativeAction({
      actionId: String(action.id || 'city-native-action'),
      route: String(action.route || ''),
      panel: String(action.panel || ''),
      explicitUserAction: true
    });
    if (result.ok) persistSignatureFlow(controller);
    return result;
  };
  const wait = (durationMs = 0) => new Promise((resolve) => environment.setTimeout?.(resolve, Math.max(0, Number(durationMs) || 0)) || resolve());
  const renderDistrictIdentity = (district = currentDistrict, composition = districtComposition.getSummary()) => {
    if (!districtIdentity || !district) return;
    districtIdentity.dataset.eonW660iDistrictId = district.id;
    districtIdentity.dataset.eonW660iLandmarkId = composition?.activeLandmarkId || district.signatureLandmarkId || '';
    districtIdentity.style.setProperty('--eon-city-district-accent', district.palette?.accent || '#69e7ff');
    districtIdentity.style.setProperty('--eon-city-district-warm', district.palette?.warm || '#f4b860');
    const streetIdentity = W711_STREET_IDENTITY_BY_DISTRICT.get(district.id) || null;
    districtIdentity.dataset.eonW711Form = streetIdentity?.form || 'district-prism';
    districtIdentity.dataset.eonW711Accent = streetIdentity?.accent || 'district';
    if (districtIdentityLabel) districtIdentityLabel.textContent = district.label;
    if (districtIdentityPurpose) districtIdentityPurpose.textContent = streetIdentity?.purposeLine || district.purpose || 'Productive EON City district.';
  };
  const getResidency = () => {
    const coreRuntime = getCoreRuntime?.();
    const coreSummary = coreRuntime?.getCoreResidencySummary?.() || {};
    const districtAssetIds = (coreSummary?.district?.residents || []).flatMap((entry) => entry.loadedAssetIds || []);
    const coreAssetIds = [coreSummary?.w649Core?.player?.assetId, coreSummary?.w649Core?.eonbot?.assetId].filter(Boolean);
    const functionalSummary = functionalRuntime.getSummary();
    return freeze({
      districtId: normalizeEonCityDistrictId(coreSummary?.district?.activeDistrictId || currentDistrict.id),
      residentAssetIds: freeze([...new Set([...districtAssetIds, ...coreAssetIds])]),
      residentStationIds: freeze([...(functionalSummary.residentAssetIds || [])])
    });
  };
  const resolveNearbyOperators = () => {
    const residency = getResidency();
    currentOperatorBindings = resolveEonCityW659gNpcOperatorsNearPosition({
      districtId: currentDistrict.id,
      position: currentPosition,
      residentAssetIds: residency.residentAssetIds,
      residentStationIds: residency.residentStationIds
    });
    return currentOperatorBindings;
  };

  const closePanels = (except = null) => {
    for (const panel of panels.values()) if (panel !== except) panel.hidden = true;
  };
  const openPanel = (id = '') => {
    const panel = panels.get(id);
    if (!panel) return false;
    closePanels(panel);
    panel.hidden = false;
    panel.querySelector('button, a, input, textarea, select')?.focus?.({ preventScroll: true });
    if (id === 'command-room') agentTheatre.render();
    if (id === 'nearby') renderNearbyPanel();
    if (id === 'nexus') renderNexusPanel({ force: true });
    return true;
  };

  const renderTravel = () => {
    const destinations = transport.listDestinations();
    const atlas = projectEonCityW678AtlasModel(buildEonCityW671AtlasModel(PRODUCT_DISTRICTS, currentDistrict.id), { quality: experienceProfile.quality, mode: experienceProfile.mode });
    if (atlasMap) {
      const byId = new Map(atlas.nodes.map((node) => [node.id, node]));
      atlasMap.innerHTML = `<svg class="eon-city-atlas-links" viewBox="0 0 100 100" aria-hidden="true">${atlas.links.map((link) => {
        const from = byId.get(link.from); const to = byId.get(link.to);
        return from && to ? `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>` : '';
      }).join('')}</svg>${atlas.nodes.map((node) => `<button type="button" class="eon-city-atlas-node" ${node.id === 'expanse-gateway' ? 'data-eon-w678-guide-expanse' : `data-eon-w659n-travel="${escapeHtml(node.id)}"`} data-active="${node.active === true}" style="--atlas-x:${node.x}%;--atlas-y:${node.y}%;--atlas-accent:${escapeHtml(node.accent)};--atlas-warm:${escapeHtml(node.warm)}" aria-label="${escapeHtml(node.label)}${node.active ? ', current district' : ''}"><span></span><strong>${escapeHtml(node.label)}</strong></button>`).join('')}<div class="eon-city-atlas-legend"><strong>Connected Core + Expanse</strong><span>District nodes open reviewed Capsule travel. The Expanse node guides you to its physical gateway and never enters automatically.</span></div>`;
    }
    travelContent.innerHTML = `<div class="eon-city-travel-grid">${destinations.map((entry) => `<button type="button" data-eon-w659n-travel="${escapeHtml(entry.id)}"><strong>${escapeHtml(entry.label)}</strong><span>${entry.id === currentDistrict.id ? 'Current district' : 'Review Capsule destination'}</span></button>`).join('')}</div><article class="eon-city-travel-review" data-eon-w712-expanse-primary><strong>The Expanse · flagship open world</strong><p>Choose Guide, review the physical Orientation Hall gateway once, then choose Enter the Expanse. No automatic travel or hidden second movement step.</p><button type="button" data-eon-w678-guide-expanse>Guide me to the Expanse review lane</button></article><div data-eon-w659n-travel-review></div>`;
  };

  const getNearbyCandidates = () => {
    const stationResult = nearestStation(currentPosition);
    const stationCandidate = stationResult?.station && stationResult.distance <= INTERACTION_RADIUS
      ? freeze({ type: 'station', distance: stationResult.distance, value: stationResult })
      : null;
    const terminal = getNearestEonCityW660iTerminal(currentPosition, currentDistrict.id);
    const terminalCandidate = terminal && terminal.distance <= terminal.entry.interactionRadius
      ? freeze({ type: 'terminal', distance: terminal.distance, value: terminal.entry })
      : null;
    const operator = resolveNearbyOperators()[0] || null;
    const operatorCandidate = operator ? freeze({ type: 'operator', distance: operator.distance, value: operator }) : null;
    const nexus = nexusLayer.getNearestStation(currentPosition);
    const nexusCandidate = nexus?.inRange ? freeze({ type: 'nexus', distance: nexus.distance, value: nexus }) : null;
    const functionalAssetCandidate = (getCoreRuntime?.()?.getW649FunctionalAssets?.() || [])
      .filter((entry) => entry.interactionKind !== 'npc' && entry.interactionKind !== 'player-avatar' && entry.position)
      .map((entry) => freeze({
        type: 'asset-function',
        distance: Math.hypot(currentPosition.x - Number(entry.position.x || 0), currentPosition.z - Number(entry.position.z || 0)),
        value: entry
      }))
      .filter((entry) => entry.distance <= Math.max(1.8, Number(entry.value.interactionRadius || 3.2)))
      .sort((left, right) => left.distance - right.distance)[0] || null;
    const candidates = [stationCandidate, terminalCandidate, operatorCandidate, nexusCandidate, functionalAssetCandidate].filter(Boolean);
    return resolveEonCityW696InteractionTarget(candidates, { currentDistrictId: currentDistrict.id }).ordered;
  };

  const resolveLivingTarget = (candidate = null) => {
    if (!candidate) return null;
    if (candidate.type === 'station') {
      return freeze({
        type: 'station',
        id: candidate.value.entry.id,
        label: candidate.value.station?.label || candidate.value.entry.id,
        position: freeze({ ...candidate.value.entry.placement })
      });
    }
    if (candidate.type === 'terminal') {
      return freeze({
        type: 'terminal',
        id: candidate.value.id,
        label: candidate.value.label,
        position: freeze({ ...candidate.value.position })
      });
    }
    if (candidate.type === 'operator') {
      return freeze({
        type: 'operator',
        id: candidate.value.id,
        label: candidate.value.label,
        position: freeze({ ...candidate.value.interactionPoint })
      });
    }
    if (candidate.type === 'nexus') {
      return freeze({
        type: 'nexus',
        id: candidate.value.station.id,
        label: candidate.value.station.label,
        position: freeze({ ...candidate.value.station.position })
      });
    }
    if (candidate.type === 'asset-function') {
      return freeze({
        type: 'asset-function',
        id: candidate.value.assetId,
        label: candidate.value.label,
        position: freeze({ ...candidate.value.position })
      });
    }
    return null;
  };

  const buildLivingContext = () => {
    const nearest = getNearbyCandidates()[0] || null;
    const living = getCoreRuntime?.()?.getW649LivingSummary?.() || null;
    return freeze({
      schema: `${EON_CITY_W659N_PRODUCT_LAYER_SCHEMA}.w660m-living-context.v1`,
      districtId: currentDistrict.id,
      nearby: resolveLivingTarget(nearest),
      panelOpen: [...panels.values()].some((panel) => panel.hidden === false),
      actorCount: Number(living?.actorCount || 0),
      reactiveActors: Number(living?.reactiveActors || 0),
      activities: freeze([...(living?.activities || [])]),
      nexusState: String(nexusLayer.getSnapshot()?.eonbot?.state || 'ready'),
      nexusApprovalPending: nexusLayer.getSnapshot()?.approval?.pending === true,
      nexusProjectSelected: nexusLayer.getSnapshot()?.project?.selected === true,
      localOnly: true
    });
  };

  const getLivingContext = () => livingContextSnapshot;

  const updateLivingStatus = () => {
    const context = buildLivingContext();
    livingContextSnapshot = context;
    const experience = getCoreRuntime?.()?.getExperienceSummary?.() || null;
    const companionMode = String(experience?.companionMode || 'nearby').replaceAll('-', ' ');
    const target = context.nearby?.label ? ` · observing ${context.nearby.label}` : '';
    const actors = context.actorCount > 0 ? `${context.actorCount} district ${context.actorCount === 1 ? 'resident' : 'residents'} active` : 'district routines active';
    const statusText = `EONBOT ${companionMode}${target} · ${actors}`;
    if (livingStatus && statusText !== lastLivingStatusText) {
      livingStatus.textContent = statusText;
      lastLivingStatusText = statusText;
    }
    if (root.dataset.eonCityW660mLiving !== 'active') root.dataset.eonCityW660mLiving = 'active';
    const nextCompanionMode = String(experience?.companionMode || 'loading');
    if (root.dataset.eonCityW660mCompanionMode !== nextCompanionMode) root.dataset.eonCityW660mCompanionMode = nextCompanionMode;
    const nextActorCount = String(context.actorCount);
    if (root.dataset.eonCityW660mActorCount !== nextActorCount) root.dataset.eonCityW660mActorCount = nextActorCount;
    return context;
  };

  const renderNexusPanel = ({ force = false } = {}) => {
    if (!nexusContent) return null;
    const nearest = nexusLayer.getNearestStation(currentPosition);
    const continuity = readEonNexusContinuitySnapshot({ storage: environment.sessionStorage });
    const view = projectEonCityW660nNexusView({
      snapshot: nexusLayer.getSnapshot(),
      station: nearest?.station || null,
      distance: nearest?.distance,
      districtId: currentDistrict.id,
      stationActionsAvailable: nearest?.inRange === true,
      continuity
    });
    const signature = JSON.stringify([
      view.state,
      view.stageLabel,
      view.routeLabel,
      view.project.selected,
      view.project.status,
      view.task.stageLabel,
      view.approval.count,
      view.results.count,
      view.station.id,
      view.station.inRange,
      view.workObjectHandoff?.handoffId || '',
      view.workObjectHandoff?.atTargetStation || false,
      view.actions.map((entry) => entry.id)
    ]);
    if (!force && signature === lastNexusPanelSignature) return view;
    lastNexusPanelSignature = signature;
    const metrics = [
      ['EONBOT', view.stageLabel],
      ['Route', view.routeLabel],
      ['Project', view.project.selected ? `${view.project.label} · ${view.project.status}` : 'No project selected'],
      ['Task', view.task.active ? `${view.task.label} · ${view.task.stageLabel}` : 'No active task'],
      ['Approvals', view.approval.pending ? view.approval.label : 'None waiting'],
      ['Results', view.results.count ? view.results.label : 'No new results']
    ];
    const workObjectMarkup = view.workObjectHandoff?.present ? `<article class="eon-city-nexus-work-object" data-at-target-district="${view.workObjectHandoff.atTargetDistrict ? 'true' : 'false'}" data-at-target-station="${view.workObjectHandoff.atTargetStation ? 'true' : 'false'}"><span>NEXUS WORK OBJECT</span><strong>${escapeHtml(view.workObjectHandoff.label)}</strong><p>${escapeHtml(`${view.workObjectHandoff.kind} · ${view.workObjectHandoff.meta}`)}</p><small>${escapeHtml(view.workObjectHandoff.atTargetStation ? `Arrived at ${view.workObjectHandoff.stationId}. Inspect before opening its native action.` : `Proposed placement: ${view.workObjectHandoff.districtId} · ${view.workObjectHandoff.stationId}. Travel requires confirmation.`)}</small></article>` : '';
    nexusContent.innerHTML = `<div class="eon-city-nexus-overview" data-eon-w660n-nexus-state="${escapeHtml(view.state)}" data-eon-w660n-nexus-shape="${escapeHtml(view.shape)}" data-eon-w660n-nexus-topology="${escapeHtml(view.topology)}" data-eon-w660n-nexus-continuity="${escapeHtml(view.continuityId)}" data-eon-w660n-nexus-private="${view.privateRoute ? 'true' : 'false'}" style="--eon-nexus-accent:${escapeHtml(view.accent)};--eon-nexus-secondary:${escapeHtml(view.secondaryAccent)};--eon-nexus-energy:${Number(view.flagship?.energy || 0.4)}"><div class="eon-city-nexus-hero"><span aria-hidden="true" class="eon-city-nexus-orb-mark"><i class="eon-city-nexus-orb-core"></i></span><div><strong>${escapeHtml(view.stateLabel)}</strong><p>${escapeHtml(view.summary)}</p><small>${escapeHtml(view.connectionLabel)}</small></div></div><div class="eon-city-nexus-metrics">${metrics.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('')}</div>${workObjectMarkup}<article class="eon-city-nexus-station" data-in-range="${view.station.inRange ? 'true' : 'false'}"><div class="eon-city-nexus-station-identity"><span>PHYSICAL DISTRICT NODE</span><strong>${escapeHtml(view.station.label)}</strong><p>${escapeHtml(view.station.purpose)}</p></div><div class="eon-city-nexus-station-proximity"><b>${escapeHtml(view.station.distanceLabel)}</b><small>${escapeHtml(view.station.interactionLabel)}</small></div></article><div class="eon-city-product-action-list">${renderActionButtons(view.actions)}</div><p class="eon-city-nexus-boundary">One EONBOT, one conversation and one selected-project state. The same light, topology and node identity continue from Pulse to Expanded Nexus to this spatial City form.</p></div>`;
    return view;
  };

  const readInteractiveMetadata = (mesh = null) => {
    let node = mesh;
    let depth = 0;
    while (node && depth < 12) {
      const metadata = node.metadata;
      if (metadata?.interactive === true && (metadata?.assetId || metadata?.interactionId)) return freeze({ ...metadata, assetId: metadata.assetId || metadata.interactionId, mesh: node });
      node = node.parent;
      depth += 1;
    }
    return null;
  };

  const findOperatorForAsset = (assetId = '') => {
    const id = String(assetId || '');
    if (!id) return null;
    const residency = getResidency();
    const residentAssets = new Set(residency.residentAssetIds || []);
    const residentStations = new Set(residency.residentStationIds || []);
    const entry = EON_CITY_W659G_NPC_OPERATORS.find((candidate) => {
      if (candidate.districtId !== currentDistrict.id) return false;
      const matchesAsset = candidate.assetId === id || (candidate.fallbackAssetIds || []).includes(id);
      if (!matchesAsset || !residentAssets.has(id)) return false;
      if (candidate.nearbyStationId) return residentStations.has(candidate.nearbyStationId);
      return candidate.nearbyBuildingId ? residentAssets.has(candidate.nearbyBuildingId) : true;
    });
    if (!entry) return null;
    const distance = Math.hypot(currentPosition.x - entry.interactionPoint.x, currentPosition.z - entry.interactionPoint.z);
    return freeze({
      ...entry,
      residentAssetId: id,
      distance,
      interactionState: distance <= entry.interactionRadius ? 'available-for-review' : 'move-closer',
      operatorBinding: freeze({
        assetId: id,
        nearbyStationId: entry.nearbyStationId,
        nearbyBuildingId: entry.nearbyBuildingId,
        pairedResident: true
      })
    });
  };

  const findStationForAsset = (assetId = '') => {
    const entry = EON_CITY_W659F_FUNCTIONAL_ASSETS.find((candidate) => candidate.id === String(assetId || ''));
    const station = entry ? getEonCityW659gFunctionalStation(entry.id) : null;
    if (!entry || !station) return null;
    const distance = Math.hypot(currentPosition.x - entry.placement.x, currentPosition.z - entry.placement.z);
    return freeze({ entry, station, distance });
  };

  const findTerminalForAsset = (terminalId = '') => {
    const entry = getEonCityW660iTerminal(String(terminalId || ''));
    if (!entry || entry.districtId !== currentDistrict.id) return null;
    const distance = Math.hypot(currentPosition.x - entry.position.x, currentPosition.z - entry.position.z);
    return freeze({ ...entry, distance });
  };

  const findFunctionalAsset = (assetId = '', mesh = null) => {
    const entry = getEonCityW666AssetFunction(String(assetId || ''));
    if (!entry || entry.interactionKind === 'player-avatar') return null;
    let position = null;
    try { position = mesh?.getAbsolutePosition?.() || null; } catch {}
    if (!position) {
      const resident = (getCoreRuntime?.()?.getW649FunctionalAssets?.() || []).find((item) => item.residentAssetId === entry.assetId || item.assetId === entry.assetId);
      position = resident?.position || null;
    }
    const distance = position
      ? Math.hypot(currentPosition.x - Number(position.x || 0), currentPosition.z - Number(position.z || 0))
      : Number.POSITIVE_INFINITY;
    return freeze({ ...entry, position: position ? freeze({ x: Number(position.x || 0), y: Number(position.y || 0), z: Number(position.z || 0) }) : null, distance });
  };

  const findOrientationProductiveResident = (assetId = '', mesh = null) => {
    if (currentDistrict.id !== 'orientation-hall') return null;
    const loop = getEonCityW680OrientationProductiveLoopForResident(String(assetId || ''));
    if (!loop) return null;
    let position = null;
    try { position = mesh?.getAbsolutePosition?.() || null; } catch {}
    position ||= loop.residentPosition;
    const distance = Math.hypot(currentPosition.x - Number(position?.x || 0), currentPosition.z - Number(position?.z || 0));
    return freeze({
      id: loop.residentId,
      label: loop.residentLabel,
      role: loop.residentRole,
      prompt: loop.purpose,
      residentAssetId: loop.residentAssetId,
      nearbyStationId: loop.terminalId,
      nearbyBuildingId: loop.buildingId,
      interactionRadius: loop.interactionRadius,
      distance,
      productiveLoopId: loop.id,
      actions: freeze([]),
      localOnly: true
    });
  };

  const resolveOrientationProductiveLoop = (candidate = null) => {
    if (!candidate || currentDistrict.id !== 'orientation-hall') return null;
    if (candidate.type === 'terminal') return getEonCityW680OrientationProductiveLoopForTerminal(candidate.value?.id);
    if (candidate.type === 'operator') return getEonCityW680OrientationProductiveLoopForResident(candidate.value?.id) || getEonCityW680OrientationProductiveLoopForResident(candidate.value?.residentAssetId);
    if (candidate.type === 'asset-function') return getEonCityW680OrientationProductiveLoopForBuilding(candidate.value?.assetId);
    return null;
  };

  const setWorldPickHighlight = (mesh = null) => {
    if (worldPickHighlightTimer) environment.clearTimeout?.(worldPickHighlightTimer);
    if (worldPickHighlight?.mesh) {
      try {
        worldPickHighlight.mesh.renderOutline = worldPickHighlight.renderOutline;
        worldPickHighlight.mesh.outlineWidth = worldPickHighlight.outlineWidth;
        worldPickHighlight.mesh.outlineColor = worldPickHighlight.outlineColor;
      } catch {}
    }
    worldPickHighlight = null;
    if (!mesh) return;
    try {
      worldPickHighlight = {
        mesh,
        renderOutline: mesh.renderOutline,
        outlineWidth: mesh.outlineWidth,
        outlineColor: mesh.outlineColor
      };
      mesh.renderOutline = true;
      mesh.outlineWidth = Math.max(0.025, Number(mesh.outlineWidth || 0));
      mesh.outlineColor = Color3.FromHexString('#7ef1ff');
      worldPickHighlightTimer = environment.setTimeout?.(() => setWorldPickHighlight(null), 1400) || null;
    } catch {}
  };

  const focusPickedInteraction = (metadata = null) => {
    if (!metadata?.assetId) return freeze({ ok: false, reason: 'interactive-metadata-missing' });
    if (metadata.interactionKind === 'nexus-work-object') {
      const continuity = readEonNexusContinuitySnapshot({ storage: environment.sessionStorage });
      const workObject = continuity?.workObjectHandoff?.workObject || null;
      if (!workObject?.id || workObject.id !== metadata.assetId) return freeze({ ok: false, reason: 'nexus-work-object-handoff-unavailable', assetId: metadata.assetId });
      let position = null;
      try { position = metadata.mesh?.getAbsolutePosition?.() || null; } catch {}
      const distance = position
        ? Math.hypot(currentPosition.x - Number(position.x || 0), currentPosition.z - Number(position.z || 0))
        : Number.POSITIVE_INFINITY;
      const radius = Math.max(2.8, Number(metadata.interactionRadius || 3.4));
      setWorldPickHighlight(metadata.mesh);
      if (distance > radius) {
        setStatus(`${workObject.label || 'NEXUS work object'} selected. Move closer to inspect it (${distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'nexus-work-object-out-of-range', assetId: metadata.assetId, distance });
      }
      const signatureResult = advanceSignatureCityEntry({ workObject, continuity });
      renderNexusPanel();
      openPanel('nexus');
      setStatus(signatureResult?.ok
        ? `${workObject.label || 'NEXUS work object'} is physically visible in ${continuity.workObjectHandoff.placement.districtId}. Review the nearby specialist or terminal next.`
        : `${workObject.label || 'NEXUS work object'} selected. Review its continuity receipt before opening any native action.`);
      return freeze({ ok: true, interactionType: 'nexus-work-object', assetId: metadata.assetId, distance, signatureStage: signatureResult?.state?.stage || '' });
    }
    if (metadata.interactionKind === 'expanse-encounter') {
      const runtime = getCoreRuntime?.();
      const encounter = (runtime?.getLivingNexusOpportunities?.() || []).find((entry) => entry.id === String(metadata.interactionId || metadata.assetId));
      if (!encounter) return freeze({ ok: false, reason: 'expanse-encounter-not-resident', encounterId: metadata.interactionId || metadata.assetId });
      const distance = Math.hypot(currentPosition.x - Number(encounter.position?.x || 0), currentPosition.z - Number(encounter.position?.z || 0));
      setWorldPickHighlight(metadata.mesh);
      if (distance > 3.1) {
        setStatus(`${encounter.specialistName} selected. Move closer to inspect this Expanse signal (${distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'expanse-encounter-out-of-range', encounterId: encounter.id, distance });
      }
      root.dispatchEvent(new environment.CustomEvent('eon:city:living-nexus:open-encounter', { detail: { encounterId: encounter.id, source: 'world-pick' } }));
      setStatus(`${encounter.specialistName} selected directly. This exact Expanse encounter is open for review.`);
      return freeze({ ok: true, interactionType: 'expanse-encounter', encounterId: encounter.id, assetId: encounter.id, distance });
    }
    if (metadata.interactionKind === 'expanse-landmark') {
      let position = null;
      try { position = metadata.mesh?.getAbsolutePosition?.() || null; } catch {}
      const distance = position
        ? Math.hypot(currentPosition.x - Number(position.x || 0), currentPosition.z - Number(position.z || 0))
        : Number.POSITIVE_INFINITY;
      const radius = Math.max(2.4, Number(metadata.interactionRadius || 3.5));
      setWorldPickHighlight(metadata.mesh);
      if (distance > radius) {
        focusedInteraction = null;
        setStatus(`${metadata.label || 'Expanse landmark'} selected. Move closer to inspect it (${distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'expanse-landmark-out-of-range', landmarkId: metadata.assetId, distance });
      }
      const actions = freeze([freeze({
        id: `expanse-landmark-${metadata.assetId}`,
        label: metadata.panel === 'living-nexus' ? 'Review discovery in Atlas' : metadata.panel === 'nexus' ? 'Open EON NEXUS' : metadata.route ? 'Open reviewed destination' : 'Review landmark',
        panel: String(metadata.panel || ''),
        route: String(metadata.route || ''),
        purpose: String(metadata.purpose || 'Review this deterministic Expanse discovery.'),
        reviewRequired: true,
        explicitUserAction: true,
        autoExecute: false,
        autoNavigate: false,
        privateDataRead: false
      })]);
      focusedInteraction = freeze({
        type: 'asset-function',
        distance,
        source: 'world-pick',
        value: freeze({
          assetId: metadata.assetId,
          label: metadata.label || 'Expanse landmark',
          purpose: `${metadata.rarity || 'uncommon'} discovery · ${metadata.purpose || 'Review this landmark.'}`,
          actions,
          position: position ? freeze({ x: Number(position.x || 0), y: Number(position.y || 0), z: Number(position.z || 0) }) : null
        })
      });
      currentStation = null;
      renderNearbyPanel();
      openPanel('nearby');
      setStatus(`${metadata.label || 'Expanse landmark'} discovered directly. Its one reviewed action is ready.`);
      return freeze({ ok: true, interactionType: 'expanse-landmark', landmarkId: metadata.assetId, assetId: metadata.assetId, distance });
    }
    if (metadata.interactionKind === 'companion-dock') {
      let position = null;
      try { position = metadata.mesh?.getAbsolutePosition?.() || null; } catch {}
      const distance = position
        ? Math.hypot(currentPosition.x - Number(position.x || 0), currentPosition.z - Number(position.z || 0))
        : Number.POSITIVE_INFINITY;
      const radius = Math.max(2.4, Number(metadata.interactionRadius || 3.2));
      setWorldPickHighlight(metadata.mesh);
      if (distance > radius) {
        focusedInteraction = null;
        setStatus(`${metadata.label || 'EONBOT Dock'} selected. Move closer to call EONBOT (${distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'eonbot-dock-out-of-range', dockId: metadata.dockId || metadata.assetId, distance });
      }
      focusedInteraction = freeze({ type: 'eonbot-dock', distance, source: 'world-pick', value: freeze({ ...metadata, position }) });
      currentStation = null;
      renderNearbyPanel();
      openPanel('nearby');
      setStatus(`${metadata.label || 'EONBOT Dock'} selected. Calling EONBOT requires the visible button.`);
      return freeze({ ok: true, interactionType: 'eonbot-dock', dockId: metadata.dockId || metadata.assetId, distance });
    }
    if (metadata.interactionKind === 'npc' || metadata.kind === 'w649-district-npc-mesh' || metadata.kind === 'w649-district-npc') {
      const operator = findOperatorForAsset(metadata.assetId) || findOrientationProductiveResident(metadata.assetId, metadata.mesh);
      if (!operator) {
        setStatus('This resident is visible, but no truthful product action is bound to this exact character yet.');
        return freeze({ ok: false, reason: 'npc-operator-binding-unavailable', assetId: metadata.assetId });
      }
      setWorldPickHighlight(metadata.mesh);
      if (operator.distance > operator.interactionRadius) {
        focusedInteraction = null;
        setStatus(`${operator.label} selected. Move closer to interact (${operator.distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'npc-out-of-range', operatorId: operator.id, distance: operator.distance });
      }
      focusedInteraction = freeze({ type: 'operator', distance: operator.distance, value: operator, source: 'world-pick' });
      currentStation = null;
      renderNearbyPanel();
      openPanel('nearby');
      try { getCoreRuntime?.()?.requestW649NpcState?.(operator.residentAssetId, 'talk', { durationMs: 3200 }); } catch {}
      const signatureReview = reviewSignatureSpecialist(focusedInteraction);
      setStatus(signatureReview?.ok ? `${operator.label} reviewed as the specialist for the selected NEXUS work object.` : `${operator.label} selected directly. Only this resident's actions are shown.`);
      return freeze({ ok: true, interactionType: 'operator', operatorId: operator.id, assetId: operator.residentAssetId, distance: operator.distance, signatureStage: signatureReview?.state?.stage || '' });
    }
    if (metadata.kind === 'w659f-functional-city-anchor-mesh' || metadata.kind === 'w659f-functional-city-anchor') {
      const stationResult = findStationForAsset(metadata.assetId);
      if (!stationResult) return freeze({ ok: false, reason: 'station-binding-unavailable', assetId: metadata.assetId });
      setWorldPickHighlight(metadata.mesh);
      if (stationResult.distance > INTERACTION_RADIUS) {
        focusedInteraction = null;
        setStatus(`${stationResult.station.label} selected. Move closer to interact (${stationResult.distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'station-out-of-range', assetId: metadata.assetId, distance: stationResult.distance });
      }
      focusedInteraction = freeze({ type: 'station', distance: stationResult.distance, value: stationResult, source: 'world-pick' });
      currentStation = stationResult;
      renderNearbyPanel();
      openPanel('nearby');
      const signatureReview = reviewSignatureSpecialist(focusedInteraction);
      setStatus(signatureReview?.ok ? `${stationResult.station.label} reviewed for the selected NEXUS work object.` : `${stationResult.station.label} selected directly. Transit cannot replace an NPC interaction.`);
      return freeze({ ok: true, interactionType: 'station', assetId: metadata.assetId, distance: stationResult.distance, signatureStage: signatureReview?.state?.stage || '' });
    }
    if (metadata.interactionKind === 'terminal' || metadata.kind === 'productive-terminal-screen') {
      const terminal = findTerminalForAsset(metadata.terminalId || metadata.assetId);
      if (!terminal) return freeze({ ok: false, reason: 'terminal-binding-unavailable', terminalId: metadata.terminalId || metadata.assetId });
      setWorldPickHighlight(metadata.mesh);
      if (terminal.distance > terminal.interactionRadius) {
        focusedInteraction = null;
        setStatus(`${terminal.label} selected. Move closer to interact (${terminal.distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'terminal-out-of-range', terminalId: terminal.id, distance: terminal.distance });
      }
      focusedInteraction = freeze({ type: 'terminal', distance: terminal.distance, value: terminal, source: 'world-pick' });
      currentStation = null;
      renderNearbyPanel();
      openPanel('nearby');
      const signatureReview = reviewSignatureSpecialist(focusedInteraction);
      setStatus(signatureReview?.ok ? `${terminal.label} reviewed for the selected NEXUS work object.` : `${terminal.label} selected directly. Only this terminal's actions are shown.`);
      return freeze({ ok: true, interactionType: 'terminal', terminalId: terminal.id, distance: terminal.distance, signatureStage: signatureReview?.state?.stage || '' });
    }
    if (['landmark', 'portal', 'transport', 'wayfinding', 'companion', 'companion-dock', 'world-asset'].includes(String(metadata.interactionKind || '')) || metadata.kind === 'w649-district-functional-asset-mesh' || metadata.kind === 'w649-district-functional-asset') {
      const productiveBuildingLoop = currentDistrict.id === 'orientation-hall'
        ? getEonCityW680OrientationProductiveLoopForBuilding(metadata.assetId)
        : null;
      let assetFunction = findFunctionalAsset(metadata.assetId, metadata.mesh);
      if (!assetFunction && productiveBuildingLoop) {
        let position = null;
        try { position = metadata.mesh?.getAbsolutePosition?.() || null; } catch {}
        const distance = position
          ? Math.hypot(currentPosition.x - Number(position.x || 0), currentPosition.z - Number(position.z || 0))
          : Math.hypot(currentPosition.x - productiveBuildingLoop.destinationPosition.x, currentPosition.z - productiveBuildingLoop.destinationPosition.z);
        assetFunction = freeze({
          assetId: productiveBuildingLoop.buildingId,
          label: productiveBuildingLoop.destinationLabel,
          purpose: productiveBuildingLoop.purpose,
          interactionRadius: 4.2,
          actions: freeze([]),
          position: position ? freeze({ x: Number(position.x || 0), y: Number(position.y || 0), z: Number(position.z || 0) }) : productiveBuildingLoop.destinationPosition,
          distance,
          productiveLoopId: productiveBuildingLoop.id,
          localOnly: true
        });
      }
      if (!assetFunction) return freeze({ ok: false, reason: 'asset-function-binding-unavailable', assetId: metadata.assetId });
      setWorldPickHighlight(metadata.mesh);
      const radius = Math.max(1.8, Number(metadata.interactionRadius || assetFunction.interactionRadius || 3.2));
      if (assetFunction.distance > radius) {
        focusedInteraction = null;
        setStatus(`${assetFunction.label} selected. Move closer to use it (${assetFunction.distance.toFixed(1)} m).`);
        return freeze({ ok: false, reason: 'asset-function-out-of-range', assetId: assetFunction.assetId, distance: assetFunction.distance });
      }
      focusedInteraction = freeze({ type: 'asset-function', distance: assetFunction.distance, value: assetFunction, source: 'world-pick' });
      currentStation = null;
      renderNearbyPanel();
      openPanel('nearby');
      setStatus(`${assetFunction.label} selected directly. Only this landmark's real functions are shown.`);
      return freeze({ ok: true, interactionType: 'asset-function', assetId: assetFunction.assetId, distance: assetFunction.distance });
    }
    return freeze({ ok: false, reason: 'unsupported-world-pick', assetId: metadata.assetId });
  };

  const renderNearbyPanel = () => {
    const district = nearestDistrict(currentPosition, currentDistrict.id);
    const candidates = focusedInteraction ? [focusedInteraction] : getNearbyCandidates();
    const first = candidates[0] || null;
    const stationActions = first?.type === 'station' ? first.value?.station?.actions || [] : [];
    const terminalActions = first?.type === 'terminal' ? first.value?.actions || [] : [];
    const operator = first?.type === 'operator' ? first.value : null;
    const npcActions = operator?.actions?.map((item) => freeze({ ...item, operatorId: operator.id, operatorAssetId: operator.residentAssetId })) || [];
    const nexusActions = first?.type === 'nexus' ? first.value?.station?.actions || [] : [];
    const assetActions = first?.type === 'asset-function' ? first.value?.actions || [] : [];
    const productiveLoop = resolveOrientationProductiveLoop(first);
    const productiveState = orientationProductiveLoopController.getSnapshot();
    const productiveReviewed = productiveLoop && productiveState.loopId === productiveLoop.id && ['reviewed', 'action-reviewed'].includes(productiveState.status);
    const productiveMarkup = productiveLoop ? `<article class="eon-city-productivity-loop" data-eon-w680-productivity-loop="${escapeHtml(productiveLoop.id)}"><span>RESIDENT + PRODUCTIVE DESTINATION</span><strong>${escapeHtml(productiveLoop.label)}</strong><p>${escapeHtml(productiveLoop.residentLabel)} connects this interaction to ${escapeHtml(productiveLoop.destinationLabel)}. ${escapeHtml(productiveLoop.purpose)}</p>${productiveReviewed ? `<ol>${productiveLoop.handoff.map((step) => `<li>${escapeHtml(step.label)}</li>`).join('')}</ol><button type="button" data-eon-w659n-action="w680-confirm:${escapeHtml(productiveLoop.id)}" data-panel="${escapeHtml(productiveLoop.panel || '')}" data-route="${escapeHtml(productiveLoop.route || '')}"><strong>${escapeHtml(productiveLoop.handoff[3].label)}</strong><span>Review the native destination; opening it remains a separate final action.</span></button>` : `<button type="button" data-eon-w680-review-loop="${escapeHtml(productiveLoop.id)}">Review ${escapeHtml(productiveLoop.destinationLabel)} handoff</button>`}</article>` : '';
    const dockMarkup = first?.type === 'eonbot-dock' ? `<article class="eon-city-productivity-loop" data-eon-w679-dock-review="${escapeHtml(first.value?.dockId || first.value?.assetId || 'nearest')}"><span>EONBOT COMPANION DOCK</span><strong>${escapeHtml(first.value?.label || 'Orientation EONBOT Dock')}</strong><p>${escapeHtml(first.value?.purpose || 'Call EONBOT to this visible local dock. No route, work, voice or network request starts.')}</p><button type="button" data-eon-w679-dock-target="${escapeHtml(first.value?.dockId || first.value?.assetId || 'nearest')}">Call EONBOT to dock</button></article>` : '';
    const focus = first?.type === 'station'
      ? { label: first.value.station.label, detail: `${first.distance.toFixed(1)} m away · ${first.value.station.operatorClass.replaceAll('-', ' ')}` }
      : first?.type === 'terminal'
        ? { label: first.value.label, detail: `${first.distance.toFixed(1)} m away · ${first.value.purpose}` }
        : first?.type === 'operator'
          ? { label: first.value.label, detail: `${first.distance.toFixed(1)} m away · ${first.value.role.replaceAll('-', ' ')} · ${first.value.prompt || 'Review this resident interaction.'}` }
          : first?.type === 'nexus'
            ? { label: first.value.station.label, detail: `${first.distance.toFixed(1)} m away · ${first.value.station.purpose.replaceAll('-', ' ')} · ${first.value.state.replaceAll('-', ' ')}` }
            : first?.type === 'asset-function'
              ? { label: first.value.label, detail: `${first.distance.toFixed(1)} m away · ${first.value.purpose}` }
              : first?.type === 'eonbot-dock'
                ? { label: first.value?.label || 'EONBOT Dock', detail: `${first.distance.toFixed(1)} m away · explicit local companion docking` }
                : { label: district.label, detail: 'No functional resident, terminal, station, landmark or Nexus node is in range' };
    if (nearbyPanelTitle) nearbyPanelTitle.textContent = first?.type === 'operator' ? 'Resident interaction' : first?.type === 'terminal' ? 'Terminal interaction' : first?.type === 'station' ? 'Station interaction' : first?.type === 'nexus' ? 'Nexus interaction' : first?.type === 'asset-function' ? 'Landmark interaction' : first?.type === 'eonbot-dock' ? 'EONBOT docking' : 'Nearby interaction';
    nearbyContent.innerHTML = `<div class="eon-city-nearby-summary"><strong>${escapeHtml(focus.label)}</strong><span>${escapeHtml(focus.detail)}</span></div>${productiveMarkup}${dockMarkup}<div class="eon-city-product-action-list">${renderActionButtons([...assetActions, ...nexusActions, ...terminalActions, ...stationActions, ...npcActions].slice(0, 4)) || (productiveMarkup || dockMarkup ? '' : '<p>No functional action is available at this exact position. Walk toward an illuminated resident, terminal, station, landmark or Nexus node.</p>')}</div>`;
  };

  const prepareRoute = (route, label = 'Open destination', purpose = '') => {
    if (!String(route || '').startsWith('/')) return false;
    routeContent.innerHTML = `<article><strong>${escapeHtml(label)}</strong><p>${escapeHtml(purpose || 'This opens the native EONAPP surface in the same tab. City movement and voice stop when you leave.')}</p><small>No work runs and no route opens until you use the final link.</small><div class="eon-city-product-actions"><a href="${escapeHtml(route)}" data-eon-w659n-confirm-route>Open reviewed destination</a><button type="button" data-eon-w659n-close>Stay in City</button></div></article>`;
    openPanel('route-review');
    return true;
  };

  const openExternalProductPanel = (id) => {
    closePanels();
    if (id === 'missions-rewards') {
      const toggle = root.querySelector('[data-w659g-toggle]');
      toggle?.click?.();
      return Boolean(toggle);
    }
    if (id === 'creator-capture') {
      environment.dispatchEvent?.(new environment.CustomEvent(EON_CITY_W659G_CAPTURE_OPEN_EVENT));
      return true;
    }
    if (id === 'membership') {
      environment.dispatchEvent?.(new environment.CustomEvent(EON_CITY_W659G_MEMBERSHIP_OPEN_EVENT));
      return true;
    }
    if (id === 'share-center') {
      root.querySelector('[data-eon-play-share-city]')?.click?.();
      return true;
    }
    if (id === 'living-nexus') {
      const trigger = root.querySelector('[data-eon-play-open-living-nexus]');
      trigger?.click?.();
      return Boolean(trigger);
    }
    return false;
  };

  const executeAction = (action = {}) => {
    const actionId = String(action.id || '');
    const panelId = String(action.panel || '');
    const route = String(action.route || '');
    const signatureConfirmation = confirmSignatureNativeAction({ ...action, id: actionId, panel: panelId, route });
    if (signatureConfirmation && !signatureConfirmation.ok) {
      setStatus(`Signature-flow action confirmation unavailable: ${signatureConfirmation.reason}.`);
      return false;
    }
    if (actionId.startsWith('w680-confirm:')) {
      const result = orientationProductiveLoopController.confirmAction(actionId, { explicitUserAction: true });
      if (!result.ok) { setStatus(`Productive handoff confirmation unavailable: ${result.reason}.`); return false; }
      setStatus(`${result.loop.residentLabel} handoff reviewed. The native destination still requires the final visible open action.`);
    }
    if (panelId && panels.has(panelId)) return openPanel(panelId);
    if (panelId && openExternalProductPanel(panelId)) return true;
    if (route) return prepareRoute(route, action.label, action.purpose);
    return false;
  };

  const interactNearest = ({ nexusOnly = false } = {}) => {
    focusedInteraction = null;
    const candidates = getNearbyCandidates().filter((entry) => !nexusOnly || entry.type === 'nexus');
    const first = candidates[0] || null;
    currentStation = first?.type === 'station' ? first.value : null;
    renderNearbyPanel();
    openPanel('nearby');
    if (first?.type === 'station') {
      const signatureReview = reviewSignatureSpecialist(first);
      setStatus(signatureReview?.ok ? `${first.value.station.label} reviewed for the selected NEXUS work object.` : `${first.value.station.label} actions are ready for review.`);
      return freeze({ ok: true, assetId: first.value.entry.id, distance: first.distance, interactionType: 'station', signatureStage: signatureReview?.state?.stage || '' });
    }
    if (first?.type === 'terminal') {
      const signatureReview = reviewSignatureSpecialist(first);
      setStatus(signatureReview?.ok ? `${first.value.label} reviewed for the selected NEXUS work object.` : `${first.value.label} actions are ready for review. Nothing runs or opens automatically.`);
      return freeze({ ok: true, terminalId: first.value.id, distance: first.distance, interactionType: 'terminal', signatureStage: signatureReview?.state?.stage || '' });
    }
    if (first?.type === 'operator') {
      const operator = first.value;
      try { getCoreRuntime?.()?.requestW649NpcState?.(operator.residentAssetId, 'talk', { durationMs: 3200 }); } catch {}
      const signatureReview = reviewSignatureSpecialist(first);
      setStatus(signatureReview?.ok ? `${operator.label} reviewed as the specialist for the selected NEXUS work object.` : `${operator.label} actions are ready for review beside ${operator.nearbyStationId || operator.nearbyBuildingId}.`);
      return freeze({ ok: true, assetId: operator.residentAssetId, operatorId: operator.id, distance: operator.distance, interactionType: 'operator', signatureStage: signatureReview?.state?.stage || '' });
    }
    if (first?.type === 'nexus') {
      renderNexusPanel({ force: true });
      openPanel('nexus');
      setStatus(`${first.value.station.label} is showing the same privacy-projected EON NEXUS state, selected project, task stage, approvals and results.`);
      return freeze({ ok: true, nexusStationId: first.value.station.id, distance: first.distance, interactionType: 'nexus' });
    }
    if (first?.type === 'asset-function') {
      setStatus(`${first.value.label} functions are ready for review. Nothing starts automatically.`);
      return freeze({ ok: true, assetId: first.value.assetId, distance: first.distance, interactionType: 'asset-function' });
    }
    setStatus(`No ${nexusOnly ? 'Nexus station' : 'functional resident, terminal, station, landmark or Nexus node'} is within interaction range.`);
    return freeze({ ok: false, reason: nexusOnly ? 'no-nexus-in-range' : 'no-bound-interaction-in-range', districtId: currentDistrict.id });
  };

  const updateNearbyPrompt = () => {
    const first = getNearbyCandidates()[0] || null;
    nearbyPrompt.hidden = !first;
    if (!first) {
      currentStation = null;
      return;
    }
    if (first.type === 'station') {
      currentStation = first.value;
      nearbyKicker.textContent = `${first.value.station.operatorClass.replaceAll('-', ' ')} · ${first.distance.toFixed(1)} m`;
      nearbyTitle.textContent = first.value.station.label;
      return;
    }
    currentStation = null;
    if (first.type === 'terminal') {
      nearbyKicker.textContent = `PRODUCT TERMINAL · ${first.distance.toFixed(1)} m`;
      nearbyTitle.textContent = first.value.label;
      return;
    }
    if (first.type === 'operator') {
      nearbyKicker.textContent = `${first.value.role.replaceAll('-', ' ')} · ${first.distance.toFixed(1)} m`;
      nearbyTitle.textContent = first.value.label;
      return;
    }
    if (first.type === 'asset-function') {
      nearbyKicker.textContent = `${first.value.role.replaceAll('-', ' ')} · ${first.distance.toFixed(1)} m`;
      nearbyTitle.textContent = first.value.label;
      return;
    }
    nearbyKicker.textContent = `EON NEXUS · ${first.value.state.replaceAll('-', ' ')} · ${first.distance.toFixed(1)} m`;
    nearbyTitle.textContent = first.value.station.label;
  };

  const performTravel = async (button) => {
    const token = button?.dataset?.eonW659nConfirmTravel || '';
    const travelMode = button?.dataset?.eonW659nTravelMode === 'skip' ? 'skip' : 'ride';
    const result = transport.confirm(token, { explicitUserAction: true, travelMode });
    if (!result.ok) { travelStatus.textContent = `Travel stopped safely: ${result.reason}.`; return result; }
    button.disabled = true;
    const destinationId = normalizeEonCityDistrictId(result.destination.id);
    const destinationConfig = PRODUCT_DISTRICTS.find((entry) => entry.id === destinationId) || null;
    const startedAt = Number(environment?.performance?.now?.() ?? Date.now());
    closePanels();
    travelPresentation.begin({
      label: result.destination.label,
      accent: destinationConfig?.palette?.accent,
      warm: destinationConfig?.palette?.warm
    });
    root.dataset.eonCityTransitMode = result.journey?.mode || travelMode;
    const coreRuntime = getCoreRuntime?.();
    if (result.journey?.mode === 'ride') {
      const journeyStart = coreRuntime?.beginConnectedCoreTransitJourney?.(result.journey, { explicitUserAction: true, receiptId: result.receipt.id });
      travelPresentation.stage({ id: 'capsule-boarding', detailText: `Boarding the reviewed Capsule for ${result.destination.label}.`, progressValue: 18 });
      travelStatus.textContent = `Capsule boarding confirmed for ${result.destination.label}. The visible ride may be skipped on the next journey.`;
      const rideMs = reducedMotion ? Math.min(480, result.journey.durationMs) : result.journey.durationMs;
      if (journeyStart?.ok !== false) await wait(rideMs);
    } else {
      travelPresentation.stage({ id: 'accessible-skip', detailText: `Accessible instant travel to ${result.destination.label}.`, progressValue: 24 });
      travelStatus.textContent = `Capsule ride skipped by explicit choice. Preparing ${result.destination.label}.`;
    }
    const compositionResult = districtComposition.enterDistrict(destinationId, { reason: 'reviewed-travel-preview' });
    if (!compositionResult.ok) {
      travelPresentation.fail({ label: result.destination.label, reason: compositionResult.reason });
      travelStatus.textContent = `Travel stopped safely: ${compositionResult.reason}.`;
      button.disabled = false;
      return compositionResult;
    }

    // W660K: make the district change visible immediately. Detailed GLBs may
    // continue loading, but the player, camera, landmark and functional local
    // composition no longer wait behind an opaque travel dialog.
    const functionalArrival = resolveEonCityW719FunctionalArrival({
      destination: result.destination,
      terminals: EON_CITY_W660I_TERMINALS
    });
    const arrivalDestination = functionalArrival.destination || result.destination;
    setPlayerPose(arrivalDestination);
    districtComposition.enterDistrict(destinationId, { reason: 'reviewed-travel-arrival-camera' });
    currentPosition = freeze({ x: arrivalDestination.x, z: arrivalDestination.z });
    currentDistrict = nearestDistrict(currentPosition);
    districtBoundary.reset(currentDistrict.id, currentPosition);
    root.dataset.eonCityProductDistrict = currentDistrict.id;
    root.dataset.eonCityActiveDistrict = currentDistrict.id;
    root.dataset.eonCityActiveLandmark = compositionResult.landmarkId || result.destination.signatureLandmarkId || '';
    root.dataset.eonCityActiveAssetGroup = compositionResult.assetGroupId || result.destination.activeAssetGroupId || '';
    renderDistrictIdentity(currentDistrict, districtComposition.getSummary());
    publishDistrictContext('reviewed-travel-arrival');
    travelPresentation.stage({ id: 'district-core', detailText: `${result.destination.label} core is visible near ${functionalArrival.terminalLabel || 'a functional station'}. Streaming paid characters and station assets.`, progressValue: 38 });

    let assetResult = null;
    let degraded = false;
    try {
      assetResult = await activateDistrictAssets(destinationId, { reason: 'w660k-reviewed-travel' });
      if (disposed) return freeze({ ok: false, reason: 'product-layer-disposed' });
      degraded = assetResult?.ok === false;
    } catch (error) {
      degraded = true;
      assetResult = freeze({ ok: false, reason: 'district-asset-activation-failed', error: String(error?.message || error || 'unknown-error').slice(0, 180) });
    }

    const elapsedMs = Math.max(0, Number(environment?.performance?.now?.() ?? Date.now()) - startedAt);
    root.dataset.eonCityLastTravelMs = String(Math.round(elapsedMs));
    root.dataset.eonCityLastTravelDistrict = currentDistrict.id;
    root.dataset.eonCityLastTravelState = degraded ? 'degraded' : 'ready';
    dispatchEonCityW659gVerifiedAction({ type: 'city.district-arrival', receiptId: result.receipt.id, verified: true, verifiedAt: result.receipt.confirmedAt, source: 'w660k-reviewed-transit', districtId: currentDistrict.id, landmarkId: root.dataset.eonCityActiveLandmark, assetGroupId: root.dataset.eonCityActiveAssetGroup }, environment);
    const assetNote = degraded ? ` Detailed district assets reported ${assetResult?.reason || 'a degraded load'}; the playable district core remains active.` : '';
    travelStatus.textContent = `Arrived at ${result.destination.label} in ${(elapsedMs / 1000).toFixed(1)} s. ${root.dataset.eonCityActiveLandmark} is active and the previous district composition is unloaded.${assetNote}`;
    renderTravel();
    updateNearbyPrompt();
    travelPresentation.complete({
      label: result.destination.label,
      elapsedMs,
      degraded,
      detailText: degraded
        ? `${(elapsedMs / 1000).toFixed(1)} s · Playable district core active; detailed assets continue progressively.`
        : `${(elapsedMs / 1000).toFixed(1)} s · Landmark, camera, terminals and resident assets are ready.`
    });
    return freeze({ ok: true, degraded, destination: result.destination, receipt: result.receipt, composition: compositionResult, districtAssets: assetResult, elapsedMs });
  };

  const onShellClick = (event) => {
    const close = event.target.closest('[data-eon-w659n-close]');
    if (close) {
      close.closest('[data-eon-w659n-panel]')?.setAttribute('hidden', '');
      return;
    }
    const open = event.target.closest('[data-eon-w659n-open]');
    if (open) {
      const id = open.dataset.eonW659nOpen;
      if (id === 'nearby') interactNearest();
      else if (panels.has(id)) openPanel(id);
      else openExternalProductPanel(id);
      return;
    }
    if (event.target.closest('[data-eon-w659n-interact]')) { interactNearest(); return; }
    if (event.target.closest('[data-eon-w659n-nexus]')) { renderNexusPanel({ force: true }); openPanel('nexus'); return; }
    const productiveReview = event.target.closest('[data-eon-w680-review-loop]');
    if (productiveReview) {
      const result = orientationProductiveLoopController.beginReview(productiveReview.dataset.eonW680ReviewLoop, { explicitUserAction: true });
      if (result.ok) {
        try { getCoreRuntime?.()?.requestW649NpcState?.(result.loop.residentAssetId, 'talk', { durationMs: 2600 }); } catch {}
        setStatus(`${result.loop.residentLabel} and ${result.loop.destinationLabel} are reviewed together. Choose the separate destination action when ready.`);
        renderNearbyPanel();
      } else setStatus(`Productive loop review unavailable: ${result.reason}.`);
      return;
    }
    const dockButton = event.target.closest('[data-eon-w679-dock-target]');
    if (dockButton) {
      const result = getCoreRuntime?.()?.requestEonbotDock?.(dockButton.dataset.eonW679DockTarget || 'nearest', { explicitUserAction: true, districtId: currentDistrict.id }) || freeze({ ok: false, reason: 'eonbot-runtime-unavailable' });
      setStatus(result.ok ? `${result.target.label} docking requested locally. EONBOT remains visible and no work or voice starts.` : `EONBOT docking unavailable: ${result.reason}.`);
      return;
    }
    const actionButton = event.target.closest('[data-eon-w659n-action]');
    if (actionButton) {
      executeAction({ id: actionButton.dataset.eonW659nAction, panel: actionButton.dataset.panel, route: actionButton.dataset.route, label: actionButton.querySelector('strong')?.textContent || 'Open action', purpose: actionButton.querySelector('span')?.textContent || '' });
      return;
    }
    const routeButton = event.target.closest('[data-eon-w659n-route]');
    if (routeButton) {
      const route = routeButton.dataset.eonW659nRoute;
      const signatureConfirmation = confirmSignatureNativeAction({ id: `route:${String(route || '').replace(/[^a-z0-9]+/gi, '-')}`, route });
      if (signatureConfirmation && !signatureConfirmation.ok) { setStatus(`Signature-flow action confirmation unavailable: ${signatureConfirmation.reason}.`); return; }
      prepareRoute(route, routeButton.dataset.routeLabel || 'Open native surface');
      return;
    }
    const expanseGuide = event.target.closest('[data-eon-w678-guide-expanse]');
    if (expanseGuide) {
      const result = getCoreRuntime?.()?.guideToLivingNexusPhysicalGateway?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'physical-gateway-unavailable' });
      if (result.ok) {
        closePanels();
        setStatus('Expanse guidance active. Follow the visible road, review the gateway once, then choose Enter. Nothing enters automatically.');
      } else travelStatus.textContent = `Expanse guidance unavailable: ${result.reason}.`;
      return;
    }
    const travel = event.target.closest('[data-eon-w659n-travel]');
    if (travel) {
      const review = transport.request(travel.dataset.eonW659nTravel, { explicitUserAction: true, fromDistrictId: currentDistrict.id });
      if (!review.ok) { travelStatus.textContent = `Travel review unavailable: ${review.reason}.`; return; }
      const reviewNode = travelContent.querySelector('[data-eon-w659n-travel-review]');
      reviewNode.innerHTML = `<article class="eon-city-travel-review"><strong>${escapeHtml(review.destination.label)}</strong><p>Move Pathfinder and EONBOT to this active district. Choose the visible Capsule ride or the accessible instant skip. No native route or private data is transferred.</p><div class="eon-city-product-actions"><button type="button" data-eon-w659n-confirm-travel="${escapeHtml(review.token)}" data-eon-w659n-travel-mode="ride">Board Capsule</button><button type="button" data-eon-w659n-confirm-travel="${escapeHtml(review.token)}" data-eon-w659n-travel-mode="skip">Skip ride</button><button type="button" data-eon-w659n-cancel-travel>Cancel</button></div></article>`;
      travelStatus.textContent = 'Destination reviewed. Boarding or skipping the ride both require this separate confirmation.';
      return;
    }
    const confirmTravel = event.target.closest('[data-eon-w659n-confirm-travel]');
    if (confirmTravel) { void performTravel(confirmTravel); return; }
    if (event.target.closest('[data-eon-w659n-cancel-travel]')) {
      transport.cancel(); renderTravel(); travelStatus.textContent = 'Travel cancelled. Pathfinder stayed in the current district.';
    }
  };

  const onKeydown = (event) => {
    if (event.code !== 'KeyE' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target?.matches?.('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault();
    interactNearest();
  };

  const onWorldPick = (pointerInfo = {}) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
    const pickedMesh = pointerInfo.pickInfo?.hit === true ? pointerInfo.pickInfo.pickedMesh : null;
    const metadata = readInteractiveMetadata(pickedMesh);
    if (!metadata) return;
    const result = focusPickedInteraction(metadata);
    root.dataset.eonCityLastWorldPick = result?.ok === true ? `${result.interactionType}:${metadata.assetId}` : `rejected:${result?.reason || 'unknown'}`;
  };

  const onVerifiedSignatureOutcome = (event) => {
    const detail = event?.detail || {};
    const supported = new Set(['city.real-work-receipt', 'city.agent-receipt.reviewed', 'city.capture.saved-local', 'city.share-pack.prepared', 'eonbot.real-reply']);
    if (detail.verified !== true || !supported.has(String(detail.type || '')) || !detail.receiptId) return;
    const controller = getSignatureFlowController();
    if (controller.getState().stage !== 'native-action-confirmed') return;
    const outcome = controller.recordVerifiedOutcome({ receiptId: detail.receiptId, type: detail.type, label: detail.label || detail.type, verified: true, explicitUserAction: true });
    if (!outcome.ok) return;
    const reflected = controller.reflectMyRealm({ quality: experienceProfile.quality, mode: experienceProfile.mode, explicitUserAction: true });
    if (reflected.ok) {
      persistSignatureFlow(controller);
      root.dataset.eonCitySignatureFlowStage = reflected.state.stage;
      setStatus('Verified native outcome reflected in My Realm. Enter My Realm to inspect it, then return to Core explicitly.');
    }
  };

  shell.addEventListener('click', onShellClick);
  environment.addEventListener?.('keydown', onKeydown);
  environment.addEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedSignatureOutcome);
  const worldPickObserver = scene.onPointerObservable.add(onWorldPick);
  disposers.push(() => shell.removeEventListener('click', onShellClick));
  disposers.push(() => environment.removeEventListener?.('keydown', onKeydown));
  disposers.push(() => environment.removeEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedSignatureOutcome));
  disposers.push(() => {
    try { scene.onPointerObservable.remove(worldPickObserver); } catch {}
    if (worldPickHighlightTimer) environment.clearTimeout?.(worldPickHighlightTimer);
    setWorldPickHighlight(null);
  });

  renderTravel();
  polishDispose = createWorldPolish(scene, quality, reducedMotion);
  disposers.push(polishDispose);
  disposers.push(bindEonCityW659gProgression(root, { onStatus: setStatus }));
  disposers.push(bindEonCityW659gCreatorCapture(root, { onStatus: setStatus }));
  disposers.push(bindEonCityW659gMembershipConsole(root, { onStatus: setStatus }));
  disposers.push(bindEonCitySharingCenter(root, { onStatus: setStatus }));
  disposers.push(bindEonCityEonbotQuickWork(root, {
    getRuntime: () => getCoreRuntime?.() || freeze({ setCompanionIntent: () => null }),
    onStatus: setStatus,
    onLeaveCity: leaveCity
  }));
  const agentTheatre = createAgentTheatreBinding(root, panels.get('command-room'), setStatus);
  disposers.push(() => agentTheatre.dispose());
  disposers.push(bindEonCityW659hOverlayCoordinator(root, { onStatus: setStatus }));

  const start = async () => {
    if (started) return getSummary();
    started = true;
    replacementBoundary = getCoreRuntime?.()?.excludeW649DistrictAssets?.([...EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS], { reason: 'w659f-functional-replacements-starting' }) || freeze({ ok: false, reason: 'w649-runtime-unavailable', excludedAssetIds: freeze([...EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS]), disposedAssetIds: freeze([]) });
    districtComposition.enterDistrict(currentDistrict.id, { reason: 'productive-city-start' });
    root.dataset.eonCityActiveDistrict = currentDistrict.id;
    root.dataset.eonCityActiveLandmark = districtComposition.getSummary().activeLandmarkId || '';
    root.dataset.eonCityActiveAssetGroup = districtComposition.getSummary().activeAssetGroupId || '';
    renderDistrictIdentity(currentDistrict, districtComposition.getSummary());
    publishDistrictContext('product-layer-start');
    const result = await functionalRuntime.start();
    const nexus = nexusLayer.start();
    root.dataset.eonCityNexusStationCount = String(nexus.stationCount || 0);
    root.dataset.eonCityProductiveCity = 'ready';
    updateLivingStatus();
    setStatus(`Productive City systems are active. Six asset-backed stations, ${EON_CITY_W660I_TERMINALS.length} district terminals, nine Nexus holograms, EONBOT, Transit, Creator Capture, Sharing and Plans & access are ready by explicit action.`);
    return freeze({ ok: true, functionalAssets: result, stationCount: EON_CITY_W659G_FUNCTIONAL_STATIONS.length });
  };

  const update = (position = {}, deltaSeconds = 0.016) => {
    if (disposed) return null;
    currentPosition = freeze({ x: Number(position.x || 0), z: Number(position.z || 0) });
    const candidateDistrict = nearestDistrict(currentPosition, currentDistrict.id);
    const boundary = districtBoundary.update({
      position: currentPosition,
      candidateDistrictId: candidateDistrict.id,
      deltaSeconds
    });
    const nextDistrict = boundary.districtId === candidateDistrict.id
      ? candidateDistrict
      : (PRODUCT_DISTRICTS.find((entry) => entry.id === boundary.districtId) || currentDistrict);
    root.dataset.eonCityPendingDistrict = boundary.pendingDistrictId || '';
    root.dataset.eonCityPendingBoundary = boundary.pendingBoundaryId || '';
    root.dataset.eonCityBoundaryReason = boundary.reason || '';
    root.dataset.eonCityBoundaryDwellMs = String(boundary.pendingMs || 0);
    if (boundary.changed && nextDistrict.id !== currentDistrict.id) {
      focusedInteraction = null;
      currentDistrict = freeze({ ...nextDistrict, id: normalizeEonCityDistrictId(nextDistrict.id) });
      root.dataset.eonCityProductDistrict = currentDistrict.id;
      const compositionResult = districtComposition.enterDistrict(currentDistrict.id, { reason: 'walked-district-boundary' });
      root.dataset.eonCityActiveDistrict = currentDistrict.id;
      root.dataset.eonCityActiveLandmark = compositionResult.landmarkId || '';
      root.dataset.eonCityActiveAssetGroup = compositionResult.assetGroupId || '';
      renderDistrictIdentity(currentDistrict, districtComposition.getSummary());
      publishDistrictContext('walked-district-boundary');
      renderTravel();
      void activateDistrictAssets(currentDistrict.id, { reason: 'w660i-walked-district-boundary' });
      setStatus(`Entered ${currentDistrict.label}. ${compositionResult.landmarkId || 'District composition'} and nearby functional stations are loading progressively.`);
    }
    functionalRuntime.update(currentPosition);
    nexusLayer.update(currentPosition, deltaSeconds);
    districtComposition.update(deltaSeconds);
    nexusRefreshElapsed += Math.max(0, Number(deltaSeconds) || 0);
    if (panels.get('nexus')?.hidden === false && nexusRefreshElapsed >= 0.45) {
      nexusRefreshElapsed = 0;
      renderNexusPanel();
    }
    updateNearbyPrompt();
    updateLivingStatus();
    return getSummary();
  };

  const resolveMovement = ({ position = {}, desiredMove = {}, step = 0 } = {}) => resolveEonCityThirdPersonPosition({
    position,
    desiredMove,
    step,
    bounds: EON_CITY_W696_WORLD_BOUND,
    radius: 0.4,
    colliders: collisionRegistry.getVolumes()
  });

  const getSummary = () => freeze({
    schema: EON_CITY_W659N_PRODUCT_LAYER_SCHEMA,
    started,
    disposed,
    quality,
    currentDistrictId: currentDistrict.id,
    districtBoundary: districtBoundary.getSnapshot(),
    nearestStationId: currentStation?.entry?.id || null,
    functionalAssets: functionalRuntime.getSummary(),
    nexus: nexusLayer.getSummary(),
    nexusContinuity: freeze({ panelBound: Boolean(nexusContent), sameConversation: true, sameSelectedProject: true, selectedWorkObjectHandoff: true, districtActionsRequireProximity: true }),
    districtComposition: districtComposition.getSummary(),
    replacementBoundary,
    collision: collisionRegistry.getSummary(),
    transport: transport.getSnapshot(),
    travelPresentation: travelPresentation.getSnapshot(),
    orientationProductiveLoop: orientationProductiveLoopController.getSnapshot(),
    signatureFlow: readEonAppW700SignatureFlow(environment.sessionStorage),
    stationCount: EON_CITY_W659G_FUNCTIONAL_STATIONS.length,
    districtTerminalCount: EON_CITY_W660I_TERMINALS.length,
    activeDistrictTerminalIds: freeze(getEonCityW660iTerminalsForDistrict(currentDistrict.id).map((entry) => entry.id)),
    npcOperatorCount: EON_CITY_W659G_NPC_OPERATORS.length,
    operatorBindings: freeze(currentOperatorBindings.map((entry) => freeze({ operatorId: entry.id, assetId: entry.residentAssetId, districtId: entry.districtId, distance: entry.distance, nearbyStationId: entry.nearbyStationId, nearbyBuildingId: entry.nearbyBuildingId }))),
    activeAssetIds: freeze([...new Set([...(getResidency().residentAssetIds || []), ...(functionalRuntime.getSummary().residentAssetIds || [])])]),
    creatorCaptureBound: root.dataset.eonCityW659gCapture === 'true' || Boolean(root.dataset.eonCityW659gCapture),
    membershipBound: Boolean(root.dataset.eonCityW659gMembership),
    progressionBound: Boolean(root.querySelector('[data-eon-city-w659g-progression]')),
    livingWorld: freeze({
      active: root.dataset.eonCityW660mLiving === 'active',
      actorCount: Number(root.dataset.eonCityW660mActorCount || 0),
      companionMode: root.dataset.eonCityW660mCompanionMode || 'loading'
    }),
    oneBabylonOwner: true,
    legacyRuntimeOwnerImported: false
  });

  return freeze({
    start,
    update,
    resolveMovement,
    getSummary,
    getLivingContext,
    interactNearest,
    openPanel(id) { return panels.has(id) ? openPanel(id) : openExternalProductPanel(id); },
    executeAction,
    setCompanionIntent(mode, options) {
      try { return getCoreRuntime?.()?.setCompanionIntent?.(mode, options) || null; } catch { return null; }
    },
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      try { travelPresentation.dispose(); } catch {}
      try { nexusLayer.dispose(); } catch {}
      try { districtComposition.dispose(); } catch {}
      try { functionalRuntime.dispose(); } catch {}
      for (const dispose of disposers.reverse()) { try { dispose?.(); } catch {} }
      shell.remove();
      delete root.dataset.eonCityProductiveCity;
      delete root.dataset.eonCityFunctionalStationCount;
      delete root.dataset.eonCityNexusStationCount;
      delete root.dataset.eonCityProductDistrict;
      delete root.dataset.eonCityActiveDistrict;
      delete root.dataset.eonCityActiveLandmark;
      delete root.dataset.eonCityActiveAssetGroup;
      delete root.dataset.eonCityW660mLiving;
      delete root.dataset.eonCityW660mCompanionMode;
      delete root.dataset.eonCityW660mActorCount;
      return getSummary();
    }
  });
}

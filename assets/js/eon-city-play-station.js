/**
 * W249 — EON City Play station.
 *
 * Babylon is imported from the direct City route only after the person chooses EON City
 * in the foreground. Full screen, orientation lock, sound and haptics remain explicit
 * in-game actions. The archived compatibility source retains a manual review gate. It never opens
 * an app route automatically and does not activate accounts, provider configuration,
 * wallets, rewards, commerce, or remote telemetry.
 */
import './utils/analytics-bridge.js';
import { ensureCityWorldState, getCityWorldPublicSummary, recordCityDistrictVisit, updateCityPlayPreferences, recordCityPlayLandmark } from './city/city-world-state.js';
import { prepareCityPlayAction, confirmPreparedCityAction } from './city/city-prepared-action.js';
import { offerCityBeginnerMission, openCityBeginnerMission, dismissCityBeginnerMission, readCityBeginnerMissionFromSearch } from './city/city-work-mission.js';
import { EON_CITY_FIRST_RUN_PATHS, createEonCityFirstRunPathReview, dismissEonCityFirstRun, selectEonCityFirstRunPath } from './city/eon-city-first-run.js';
import { getEonCityOverlayInputIsolationContract } from './city/eon-city-gameplay-contract.js';
import { getCityPlayCapability, normalizeCityPlayQuality, CITY_PLAY_QUALITY_OPTIONS } from './city/eon-city-play-capability.js';
import { isCityPreviewEvidenceMode, createCityPreviewSession, recordCityPreviewEvent, recordCityPreviewTask, recordCityPreviewFrame, saveCityPreviewSession, downloadCityPreviewEvidence, CITY_PREVIEW_TASKS } from './city/city-preview-evidence.js';
import { readCitySensoryPreferences, saveCitySensoryPreferences, triggerCitySensoryFeedback } from './city/city-sensory-preferences.js';
import { getCityScriptedGuideCard } from './city/city-scripted-guide.js';
import { appendOperatorActivity } from './operator/operator-activity.js';
import { describeAgentPresence, getAgentPresenceCollaboration, readAgentPresencePreferences, saveAgentPresencePreferences } from './operator/agent-presence.js';
import { getEonCityAgentSignalSnapshot, subscribeEonCityAgentSignals } from './city/eon-city-agent-signal.js';
import { createEonCityAiJobReceiptBridge } from './city/eon-city-ai-job-receipt.js';
import { createEonCityEonbotCompanionPlan, getEonCityEonbotCompanionSkins } from './city/eon-city-eonbot-companion.js';
import { getEonCityEonbotRigPlan } from './city/eon-city-eonbot-rig.js';
import { createEonCityEonbotOrbitController, EON_CITY_EONBOT_ORBIT_STATES } from './city/eon-city-eonbot-orbit-experience.js';
import { EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES, createEonCityCommandDistrictNpcController } from './city/eon-city-command-district-npc-system.js';
import { createEonCityProductiveRpgController } from './city/eon-city-productive-rpg-loop.js';
import { bindEonCityLivingNexusPanel, renderEonCityLivingNexusPanel } from './city/eon-city-living-nexus-panel.js';
import { bindEonCityLivingNexusEncounterPanel } from './city/eon-city-living-nexus-encounter-panel.js';
import { bindEonCityLivingNexusRealmPanel } from './city/eon-city-living-nexus-realm-panel.js';
import { bindEonCityVaultReveals, getEonCitySelectedCompanionSkinId, renderEonCityVaultReveals } from './city/eon-city-vault-reveals.js';
import { createEonCityVoiceConsentController, getEonCityVoiceCapability, getEonCityVoiceLanguageOptions, speakEonCityCaption, stopEonCityCaption } from './city/eon-city-voice-consent.js';
import { createEonCityUsefulWorkPathReview, getEonCityUsefulWorkPaths } from './city/eon-city-useful-work-paths.js';
import { createEonProjectDistrictRegistry } from './city/eon-city-project-district-manifest.js';
import { bindEonProjectDistrictWorkspace, renderEonProjectDistrictWorkspace } from './city/eon-city-project-district-workspace.js';
import { createEonCityWorkroomOverlay } from './city/eon-city-workroom-overlay.js';
import { bindEonCityMembershipMap, renderEonCityMembershipMap } from './city/eon-city-membership-map.js';
import { bindEonCityFairnessSafety, renderEonCityFairnessSafety } from './city/eon-city-fairness-safety.js';
import { bindEonCityTravelResume, captureEonCityResumeFromRuntime, renderEonCityTravelResume } from './city/eon-city-resume-travel.js';
import { bindCityModeLinkTracking, enterCityMode } from './city/city-mode-transition.js';
import { mountCityPlayAnalogJoystick, mountCityPlayMinimap } from './city/eon-city-immersive-controls.js';
import { getCommandDistrictMissionCard, readCommandDistrictState, recordCommandDistrictEvent } from './city/eon-city-command-district.js';
import { createCityWorkLoopProposal, getCityWorkLoopIntents } from './city/eon-city-work-loop.js';
import { CITY_SOUNDSCAPE_DEFAULTS, createCityAdaptiveSoundscape, normalizeCitySoundscapePreferences } from './city/eon-city-adaptive-soundscape.js';
import { EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, getEonCityOpenSkyProfileOptions, normalizeEonCityOpenSkyProfileId } from './city/eon-city-open-sky-profiles.js';
import { createEonCitySoundscapePolicyController } from './city/eon-city-soundscape-policy.js';
import { CITY_PERFORMANCE_LAB_CASES, buildCityPerformanceLabExport, loadCityPerformanceLab, saveCityPerformanceLabObservation } from './city/eon-city-performance-lab.js';
import { buildCityPerformanceObservationExport } from './city/eon-city-performance-observation.js';
import { CITY_VALIDATION_LAB_CASES, buildCityValidationLabExport, clearCityValidationLab, loadCityValidationLab, saveCityValidationLabObservation } from './city/eon-city-validation-lab.js';
import { getCommandDeckPanel, getCommandDeckPrimaryCards, getCommandDeckPrimarySummary } from './city/eon-city-command-deck.js';
import { getCityCreatorAtriumCards, getCityCreatorAtriumSummary } from './city/eon-city-creator-atrium.js';
import { buildSignalExpeditionPostcard, clearSignalExpeditionSession, createSignalExpeditionSession, getSignalExpeditionTemplate, getSignalExpeditionTemplates, readSignalExpeditionSession, recordSignalExpeditionMission, saveSignalExpeditionSession } from './city/eon-signal-expeditions.js';
import { EON_CITY_METROPOLIS_DISTRICTS } from './city/eon-city-metropolis-districts.js';
import { getCityArtReviewSummary } from './city/eon-city-art-review.js';
import { writeEonOutputShareHandoff } from './share/eon-output-share-handoff.js';
import { CITY_BOOT_MARKERS, createCityBootDiagnostics } from './city/eon-city-boot-diagnostics.js';
import { getCityAuthoredVerticalSlicePlan, getCityAuthoredVerticalSliceSummary } from './city/eon-city-authored-vertical-slice.js';
import { canonicalizeCityLocation } from './city/eon-city-route-canonicalizer.js';
import { getCityMobileMode } from './city/eon-city-mobile-mode.js';
import { buildCityMobileShareProofExport } from './city/eon-city-mobile-share-proof.js';
import { createEonCityRuntimeLifecycle } from './city/eon-city-runtime-lifecycle.js';
import { getEonUniverseCityInteraction } from './city/eon-universe-world-grammar.js';
import { getEonCityCommandDistrictInteraction } from './city/eon-city-command-district-vertical-slice.js';
import { bindEonCityClientLoadSequence, createEonCityClientLoadSequence, getEonCityClientLoadSequence, renderEonCityClientLoadMarkup } from './city/eon-city-client-load-sequence.js';
import { describeEonCityAssetCacheStatus, isEonCityAssetPathCached } from './city/eon-city-asset-cache-policy.js';
import { describeEonCityL95AssetTransferObservation, observeEonCityL95AssetTransfer } from './city/l95/eon-city-l95-asset-transfer-observation.js';
import { EON_WORKLOAD_KINDS, getEonWorkloadGovernor } from './runtime/eon-workload-governor.js';
import { bindEonCityUniverseCompletionPanel, renderEonCityUniverseCompletionPanel } from './city/eon-city-universe-completion.js';
import { bindEonCityQualitySummit } from './city/eon-city-quality-summit.js';
import { bindEonCitySharingCenter } from './city/eon-city-sharing-center.js';
import { buildEonCityCommandWorldPlan } from './city/eon-city-command-world-plan.js';
import { getEonCityCommandRoomModel, getEonCityCommandRoomScreenReview, getEonCityW709MasterStationReview, renderEonCityCommandRoomMarkup } from './city/eon-city-command-room.js';
import { buildEonCityLivingDashboard, renderEonCityLivingDashboardSignals } from './city/eon-city-living-dashboard.js';
import { buildEonCityAgentTheater, buildEonCityAgentTheaterStage, renderEonCityAgentTheaterAgents, renderEonCityAgentTheaterStage } from './city/eon-city-agent-theater.js';
import { createEonCityTruthfulCommandCenterController } from './city/eon-city-truthful-command-center.js';
import { createEonCityGenuineAgentTheatreController } from './city/eon-city-genuine-agent-theatre.js';
import { bindEonCityAccessibilityDeviceSystem } from './city/eon-city-accessibility-device-system.js';
import { bindEonCityFlagshipCertification } from './city/eon-city-flagship-certification.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from './city/w649/eon-city-w649-district-manifest.js';
import { bindEonCityDirectionalControls } from './city/eon-city-input-contract.js';
import { readEonNexusContinuitySnapshot } from './nexus/eon-nexus-continuity-contract.js';
import { getEonCityCastCertificationPlan, renderEonCityCastCertificationMarkup } from './city/eon-city-cast-certification.js';
import { bindEonCityOverlayCoordinator } from './city/eon-city-overlay-coordinator.js';
import { bindEonCityW696FocusReturn, structureEonCityW696Status } from './city/w696/eon-city-w696-interaction-boundary-hud.js';
import { resolveEonCityW712FlagshipExpanseEntryState } from './city/w712/eon-city-w712-flagship-expanse-entry.js';
import { EON_CITY_W659G_CAPTURE_OPEN_EVENT } from './city/w659g/eon-city-w659g-creator-capture.js';
import { resolveEonCityQualityAuthority } from './city/eon-city-quality-authority.js';

export const CITY_PLAY_STATION_SCHEMA = 'eon.city.play.station.w249.v1';
export const CITY_PLAY_LOCAL_PROOF_KEY = 'eon:city:play:w249:local-proof:v1';

const runtimes = new WeakMap();
const presenceUnsubscribers = new WeakMap();
const modeTrackingUnsubscribers = new WeakMap();
const controlUnsubscribers = new WeakMap();
const soundscapeControllers = new WeakMap();
const soundscapePolicyControllers = new WeakMap();
const cityBootControllers = new WeakMap();
const mobileModeUnsubscribers = new WeakMap();
const cityRuntimeLifecycles = new WeakMap();
const cityWorkloadLeases = new WeakMap();
const cityWorkloadUnsubscribers = new WeakMap();
const cityWorkroomOverlays = new WeakMap();

function getCityPlayInteraction(landmarkId = '') {
  return getEonUniverseCityInteraction(landmarkId) || getEonCityCommandDistrictInteraction(landmarkId);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

/**
 * W615 — City route-state bridge.
 *
 * The normal application shell remains present on the protected City route.
 * This small bridge lets the shell, recovery screen and authenticated runner
 * agree on the visible route state without storing user content or sending a
 * network request. It deliberately does not alter access decisions.
 */
function setCityRouteState(root, state = 'access-checking') {
  const normalized = String(state || 'access-checking').trim().toLowerCase() || 'access-checking';
  if (root?.dataset) root.dataset.eonCityRouteState = normalized;
  try {
    if (document?.body?.dataset) document.body.dataset.eonCityRouteState = normalized;
  } catch {}
  return normalized;
}

function startCitySafeMode(root, capability) {
  const directEntry = Boolean(root?.hasAttribute?.('data-eon-city-direct-entry'));
  if (root?.dataset) root.dataset.eonCityRecoveryAttempt = 'low-detail';
  return startPlay(root, capability, {
    quality: 'lite',
    reducedEffects: true,
    sensoryPreferences: readCitySensoryPreferences(),
    soundscapePreferences: CITY_SOUNDSCAPE_DEFAULTS,
    requestFullscreen: false,
    // Direct-entry recovery must keep the same calm, named HUD. The old
    // `safe` entry label accidentally reopened the legacy control wall.
    entryMode: directEntry ? 'direct' : 'safe'
  });
}

function createCityBootController(root, { quality = 'unknown', entryMode = 'direct' } = {}) {
  try { cityBootControllers.get(root)?.dispose?.(); } catch {}
  const diagnostics = createCityBootDiagnostics();
  let firstFrameTimer = null;
  let firstFrameReady = false;
  const record = (marker, detailCode = 'unspecified') => diagnostics.record(marker, { quality, entryMode, detailCode });
  const controller = Object.freeze({
    begin() { return record(CITY_BOOT_MARKERS[0], 'direct-route'); },
    record,
    firstFrame() {
      if (firstFrameReady) return diagnostics.getSnapshot();
      firstFrameReady = true;
      if (firstFrameTimer) globalThis.clearTimeout?.(firstFrameTimer);
      firstFrameTimer = null;
      record('CITY_FIRST_FRAME_READY', 'babylon-rendered');
      return diagnostics.getSnapshot();
    },
    armFirstFrameTimeout(timeoutMs = 6500) {
      if (firstFrameReady || firstFrameTimer) return;
      firstFrameTimer = globalThis.setTimeout?.(() => {
        if (!firstFrameReady) record('CITY_FIRST_FRAME_TIMEOUT', 'bounded-timeout');
      }, timeoutMs) || null;
    },
    getSnapshot() { return diagnostics.getSnapshot(); },
    dispose() {
      if (firstFrameTimer) globalThis.clearTimeout?.(firstFrameTimer);
      firstFrameTimer = null;
    }
  });
  cityBootControllers.set(root, controller);
  return controller;
}

function latestCityBootMarker(snapshot) {
  const records = Array.isArray(snapshot?.records) ? snapshot.records : [];
  return String(records.at?.(-1)?.marker || records[records.length - 1]?.marker || 'CITY_BOOT_STARTED');
}

function nowIso() {
  return new Date().toISOString();
}

function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readLocalProofs(storage = safeStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_PLAY_LOCAL_PROOF_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveLocalProof(summary, capability, storage = safeStorage()) {
  const report = {
    schema: 'eon.city.play.w249.local-proof.v1',
    createdAt: nowIso(),
    summary: {
      quality: summary?.quality || 'unknown',
      engine: summary?.engine || 'unknown',
      frameSamples: Number(summary?.frameSamples || 0),
      averageFrameMs: summary?.averageFrameMs ?? null,
      p95FrameMs: summary?.performanceObservation?.p95FrameMs ?? null,
      p99FrameMs: summary?.performanceObservation?.p99FrameMs ?? null,
      firstFrameMs: summary?.performanceObservation?.firstFrameMs ?? null,
      sessionDurationMs: summary?.performanceObservation?.sessionDurationMs ?? null,
      minFrameMs: summary?.minFrameMs ?? null,
      maxFrameMs: summary?.maxFrameMs ?? null,
      fps: Number(summary?.fps || 0),
      activeMeshes: Number(summary?.activeMeshes || 0),
      activeLights: Number(summary?.activeLights || 0),
      remoteTelemetry: false,
      remoteAssets: false
    },
    device: {
      webgl: Boolean(capability?.webgl),
      recommendedQuality: capability?.recommendedQuality || 'unknown',
      lowTier: Boolean(capability?.lowTier),
      reducedMotion: Boolean(capability?.reducedMotion),
      saveData: Boolean(capability?.saveData),
      cores: capability?.cores ?? null,
      memoryGb: capability?.memoryGb ?? null
    }
  };
  try {
    const next = [report, ...readLocalProofs(storage)].slice(0, 8);
    storage?.setItem(CITY_PLAY_LOCAL_PROOF_KEY, JSON.stringify(next));
    return { ok: true, report };
  } catch {
    return { ok: false, report };
  }
}

function buildQualityOptions(selected) {
  return CITY_PLAY_QUALITY_OPTIONS.map((quality) => `<option value="${quality}" ${quality === selected ? 'selected' : ''}>${quality[0].toUpperCase()}${quality.slice(1)}</option>`).join('');
}

function buildOpenSkyProfileOptions(selected) {
  return getEonCityOpenSkyProfileOptions().map((option) => `<option value="${escapeHtml(option.id)}"${option.id === selected ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
}

export function getCityFirstFrameTimeoutMs({ quality = 'balanced', directEntry = false, capability = null } = {}) {
  const normalizedQuality = CITY_PLAY_QUALITY_OPTIONS.includes(String(quality || '').trim().toLowerCase())
    ? String(quality || '').trim().toLowerCase()
    : (capability?.recommendedQuality || 'balanced');
  let timeoutMs = normalizedQuality === 'cinematic'
    ? 15000
    : normalizedQuality === 'balanced'
      ? 12000
      : 10000;
  if (directEntry) timeoutMs += 2000;
  return timeoutMs;
}

function capabilityLines(capability) {
  const lines = [
    `<span>WebGL: <strong>${capability.webgl ? 'available' : 'unavailable'}</strong></span>`,
    `<span>Recommended profile: <strong>${escapeHtml(capability.recommendedQuality)}</strong></span>`,
    `<span>Local only: <strong>no remote telemetry</strong></span>`
  ];
  if (capability.isMobile) lines.push('<span>Landscape: <strong>recommended</strong></span>');
  return lines.join('');
}

function describeSensoryPreferences(preferences) {
  const sound = preferences?.sound ? 'sound on' : 'sound off';
  const haptics = preferences?.haptics ? 'vibration on' : 'vibration off';
  return `Visual status is always available · ${sound} · ${haptics}`;
}

function renderFallback(root, capability, reason = '', { onRetry = null, onSafeMode = null, diagnostics = null } = {}) {
  const directEntry = root?.hasAttribute?.('data-eon-city-direct-entry');
  root.dataset.eonCityPlayState = 'fallback';
  root.classList.remove('eon-city-first-frame-pending', 'eon-city-first-frame-ready');
  const marker = latestCityBootMarker(diagnostics);
  root.dataset.eonCityRecoveryCode = marker;
  setCityRouteState(root, 'recovery');
  const recoveryQuality = String(root?.dataset?.eonCityQuality || '').trim().toLowerCase();
  const lowDetailAlreadyTried = recoveryQuality === 'lite';
  const canRetry = typeof onRetry === 'function' && Boolean(capability?.eligible);
  const canUseSafeMode = typeof onSafeMode === 'function' && Boolean(capability?.eligible) && !lowDetailAlreadyTried;
  const heading = directEntry
    ? (lowDetailAlreadyTried ? 'EON City could not start in low detail' : 'EON City needs a lighter start')
    : 'EON City could not start here';
  const detail = directEntry
    ? (lowDetailAlreadyTried
      ? 'Low-detail City did not become ready on this attempt. Your local work and City progress are safe.'
      : 'The full City view did not become ready on this attempt. Your local work and City progress are safe.')
    : 'The local City renderer did not become ready. No work, account, or private data was changed.';
  const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
  const recoveryReason = normalizedReason || 'You can retry the full City or start the same route with low-detail visuals.';
  const supportHref = `/support?city=${encodeURIComponent(marker)}`;
  root.innerHTML = `
    <section class="eon-play-gate eon-play-fallback" aria-labelledby="eon-play-title">
      <div class="eon-play-gate-copy eon-play-fallback-copy" data-eon-city-recovery-copy tabindex="-1">
        <p class="eon-play-kicker">EON City · recovery</p>
        <h1 id="eon-play-title">${heading}</h1>
        <p>${escapeHtml(detail)}</p>
        <p class="eon-play-fallback-reason">${escapeHtml(recoveryReason)}</p>
        <p>No project, local City progress, Vault setting, private chat, or account state was changed.</p>
        <div class="eon-play-gate-actions eon-play-fallback-actions">
          ${canUseSafeMode ? '<button class="eon-play-primary" type="button" data-eon-city-safe-mode>Start low-detail City</button>' : ''}
          ${canRetry ? '<button class="eon-play-secondary" type="button" data-eon-city-retry>Retry full City</button>' : ''}
          <button class="eon-play-tertiary" type="button" data-eon-city-support-details aria-expanded="false">Show safe City code</button>
          <a class="eon-play-tertiary" href="/">Open EONBOT</a>
          <a class="eon-play-tertiary" href="${escapeHtml(supportHref)}">Get City help</a>
        </div>
        <div class="eon-play-fallback-support" data-eon-city-support-panel hidden><p><strong>Safe City code:</strong> <code>${escapeHtml(marker)}</code></p><p>This code contains no prompt, project text, key, file, account token, or raw browser error. Share it only if you decide to ask support.</p></div>
        <p class="eon-play-fallback-note">Low-detail mode keeps the same protected Babylon City route and the same named controls. It is not a second map or a different workspace.</p>
      </div>
      <div class="eon-play-gate-art eon-play-fallback-art" aria-hidden="true"><span class="eon-play-gate-sun"></span><span class="eon-play-gate-tower"></span><span class="eon-play-gate-grid"></span></div>
    </section>`;
  root.querySelector('[data-eon-city-retry]')?.addEventListener('click', () => onRetry?.());
  root.querySelector('[data-eon-city-safe-mode]')?.addEventListener('click', () => onSafeMode?.());
  root.querySelector('[data-eon-city-support-details]')?.addEventListener('click', (event) => {
    const panel = root.querySelector('[data-eon-city-support-panel]');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
  });
  root.querySelector('[data-eon-city-recovery-copy]')?.focus?.({ preventScroll: true });
}

async function requestImmersion(root, capability) {
  let fullscreen = false;
  let orientation = false;
  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: 'hide' });
      fullscreen = true;
    }
  } catch {}
  if (capability.isMobile) {
    try {
      await globalThis.screen?.orientation?.lock?.('landscape');
      orientation = true;
    } catch {}
  }
  return { fullscreen, orientation };
}

async function exitImmersion() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
  } catch {}
  try { globalThis.screen?.orientation?.unlock?.(); } catch {}
}

function bindMovementControls(root, runtime) {
  return bindEonCityDirectionalControls(root, runtime, {
    selector: '[data-play-move]',
    datasetKey: 'playMove',
    environment: globalThis
  });
}

function bindControlGuide(root) {
  const panel = root.querySelector('[data-eon-play-controls-panel]');
  const open = root.querySelector('[data-eon-play-open-controls]');
  const close = root.querySelector('[data-eon-play-close-controls]');
  if (!panel || !open || !close) return;
  const show = () => {
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const hide = () => {
    panel.hidden = true;
    open.focus({ preventScroll: true });
  };
  open.addEventListener('click', show);
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => {
    if (event.target === panel) hide();
  });
}

function disposeCityPlayRuntime(root, reason = 'station-dispose') {
  // W559 capture happens only in browser storage and only after an active
  // workroom has restored its exact pose. No project or account context enters
  // the record; the resume module keeps a closed allowlist.
  const runtime = runtimes.get(root);
  try { cityWorkroomOverlays.get(root)?.dispose?.(reason); } catch {}
  try { captureEonCityResumeFromRuntime(runtime, { reason: 'local-runtime-dispose' }); } catch {}
  const lifecycle = cityRuntimeLifecycles.get(root);
  if (lifecycle) {
    try { lifecycle.dispose(reason); } catch {}
  } else {
    try { presenceUnsubscribers.get(root)?.(); } catch {}
    try { controlUnsubscribers.get(root)?.(); } catch {}
    try { soundscapeControllers.get(root)?.dispose?.(); } catch {}
    try { soundscapePolicyControllers.get(root)?.dispose?.(); } catch {}
    try { runtimes.get(root)?.destroy?.(); } catch {}
    try { modeTrackingUnsubscribers.get(root)?.(); } catch {}
    try { cityBootControllers.get(root)?.dispose?.(); } catch {}
    try { mobileModeUnsubscribers.get(root)?.(); } catch {}
  }
  try { cityWorkloadLeases.get(root)?.release?.(reason); } catch {}
  try { cityWorkloadUnsubscribers.get(root)?.(); } catch {}
  cityRuntimeLifecycles.delete(root);
  cityWorkloadLeases.delete(root);
  cityWorkloadUnsubscribers.delete(root);
  cityWorkroomOverlays.delete(root);
  presenceUnsubscribers.delete(root);
  controlUnsubscribers.delete(root);
  soundscapeControllers.delete(root);
  soundscapePolicyControllers.delete(root);
  runtimes.delete(root);
  modeTrackingUnsubscribers.delete(root);
  cityBootControllers.delete(root);
  mobileModeUnsubscribers.delete(root);
}

function createCityRuntimeLifecycle(root, { quality = 'balanced', entryMode = 'review' } = {}) {
  if (cityRuntimeLifecycles.has(root)) disposeCityPlayRuntime(root, 'superseded-start');
  const lifecycle = createEonCityRuntimeLifecycle();
  const boot = lifecycle.beginBoot({ reason: `${entryMode}:${quality}` });
  cityRuntimeLifecycles.set(root, lifecycle);
  return Object.freeze({ lifecycle, boot });
}

function bindAgentPresencePanel(root, runtime) {
  const panel = root.querySelector('[data-eon-play-work-panel]');
  const open = root.querySelector('[data-eon-play-open-work]');
  const close = root.querySelector('[data-eon-play-close-work]');
  const content = root.querySelector('[data-eon-play-work-content]');
  const visibility = root.querySelector('[data-eon-play-work-visibility]');
  const detail = root.querySelector('[data-eon-play-work-detail]');
  const crewStatus = root.querySelector('[data-eon-play-live-crew]');
  const resultRelay = root.querySelector('[data-eon-play-result-relay]');
  const manageWork = root.querySelector('[data-eon-play-manage-chat]');
  if (!panel || !open || !close || !content || !visibility || !detail) return () => {};
  let preferences = readAgentPresencePreferences();
  const cityReceiptBridge = createEonCityAiJobReceiptBridge();
  const render = () => {
    const signalSnapshot = getEonCityAgentSignalSnapshot();
    const receiptSnapshot = cityReceiptBridge.getSnapshot();
    const currentReceipt = receiptSnapshot.currentReceipt;
    const active = preferences.enabled ? signalSnapshot.presenceEntries : [];
    const collaboration = getAgentPresenceCollaboration(active);
    const outcome = preferences.enabled ? signalSnapshot.outcome : { visible: false };
    const latestCue = active[0] ? describeAgentPresence(active[0], preferences) : null;
    const items = active.length
      ? active.map((entry) => { const cue = describeAgentPresence(entry, preferences); return `<li><strong>${escapeHtml(cue.title)}</strong><span>${escapeHtml(cue.bubble)}</span></li>`; }).join('')
      : '<li><strong>No active local work signal</strong><span>Immersive Work Mode does not create a busy NPC just to make the scene look active.</span></li>';
    const latest = latestCue
      ? `<p class="eon-play-work-latest"><strong>Latest local status:</strong> ${escapeHtml(latestCue.title)} · ${escapeHtml(latestCue.bubble)} The actual work result remains in Chat or its native work surface.</p>`
      : '<p class="eon-play-work-latest">No local task outcome has been recorded in this browser yet.</p>';
    const outcomeCopy = outcome.visible
      ? `<p class="eon-play-work-outcome"><strong>${escapeHtml(outcome.title)}:</strong> ${escapeHtml(outcome.bubble)} City shows only this status relay, not the result itself.</p>`
      : '';
    const receiptCopy = currentReceipt
      ? `<section class="eon-play-ai-receipt" data-eon-play-ai-receipt><p class="eon-play-kicker">Current EONBOT receipt · status only</p><h3>${escapeHtml(currentReceipt.title)}</h3><p>${escapeHtml(currentReceipt.detail)}</p><p class="eon-play-work-latest">No prompt, draft, output, project ID, provider/model name, credential, or route is included here. Review actual work only in Chat or its native surface.</p></section>`
      : '<section class="eon-play-ai-receipt" data-eon-play-ai-receipt><p class="eon-play-kicker">Current EONBOT receipt · status only</p><p>No new local EONBOT receipt has appeared during this City session. City does not replay old work history as a fresh event.</p></section>';
    content.innerHTML = `<p class="eon-play-kicker">Live work layer · local cues</p><h2 id="eon-play-work-title">Agent presence is a view of real recorded work</h2><p class="eon-play-work-crew"><strong>${escapeHtml(collaboration.title)}</strong> · ${escapeHtml(collaboration.bubble)}</p><p>Only bounded local lifecycle signals appear here. This view never starts, stops, sends, or approves work and never exposes a prompt, reply, key, model name, transcript, wallet, or provider account.</p>${receiptCopy}<ul>${items}</ul>${outcomeCopy}${latest}`;
    if (crewStatus) {
      crewStatus.textContent = preferences.enabled
        ? `Live crew · ${collaboration.title}: ${collaboration.bubble}`
        : 'Live crew signals are hidden locally. Work is not changed.';
    }
    if (resultRelay) {
      resultRelay.hidden = !outcome.visible;
      resultRelay.textContent = outcome.visible ? `${outcome.title} · review in ${outcome.nativeSurface || 'Chat'}. City carries status only.` : '';
    }
    if (manageWork) {
      // This remains a visible user-controlled link; W560 never opens a route.
      manageWork.href = outcome.route || '/';
      manageWork.textContent = outcome.visible ? `Review in ${outcome.nativeSurface || 'Chat'}` : 'Manage in Chat';
    }
    visibility.textContent = preferences.enabled ? 'Hide signals' : 'Show signals';
    detail.disabled = !preferences.enabled;
    detail.textContent = preferences.detailLevel === 'provider-identity' ? 'Hide provider detail' : preferences.detailLevel === 'provider-category' ? 'Show selected provider' : 'Show provider category';
    runtime?.setAgentPresence?.(active, preferences, outcome);
  };
  const show = () => { render(); panel.hidden = false; close.focus({ preventScroll: true }); };
  const hide = () => { panel.hidden = true; open.focus({ preventScroll: true }); };
  open.addEventListener('click', show);
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  visibility.addEventListener('click', () => { preferences = saveAgentPresencePreferences({ ...preferences, enabled: !preferences.enabled }); render(); });
  detail.addEventListener('click', () => { if (!preferences.enabled) return; preferences = saveAgentPresencePreferences({ ...preferences, detailLevel: preferences.detailLevel === 'summary' ? 'provider-category' : preferences.detailLevel === 'provider-category' ? 'provider-identity' : 'summary' }); render(); });
  const stopSignals = subscribeEonCityAgentSignals(() => render());
  const stopReceipts = cityReceiptBridge.subscribe(() => render());
  cityReceiptBridge.start();
  render();
  return () => {
    try { stopSignals?.(); } catch {}
    try { stopReceipts?.(); } catch {}
    try { cityReceiptBridge.stop(); } catch {}
  };
}

function bindScriptedCityGuide(root, getNearbyLandmark) {
  const panel = root.querySelector('[data-eon-play-guide-panel]');
  const open = root.querySelector('[data-eon-play-open-guide]');
  const close = root.querySelector('[data-eon-play-close-guide]');
  const content = root.querySelector('[data-eon-play-guide-content]');
  if (!panel || !open || !close || !content) return;
  const render = () => {
    const nearby = getNearbyLandmark?.();
    const card = getCityScriptedGuideCard(nearby?.id);
    content.innerHTML = `<p class="eon-play-kicker">Scripted local guide · no AI or remote service</p><h2 id="eon-play-guide-title">${escapeHtml(card.title)}</h2><p>${escapeHtml(card.message)}</p><p>${escapeHtml(card.nextStep)}</p><ul>${card.boundaries.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
  };
  const show = () => {
    render();
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const hide = () => {
    panel.hidden = true;
    open.focus({ preventScroll: true });
  };
  open.addEventListener('click', show);
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
}

function bindEonbotCompanionPanel(root, { quality = 'balanced', reducedMotion = false } = {}) {
  const panel = root.querySelector('[data-eon-play-companion-panel]');
  const openButtons = [...root.querySelectorAll('[data-eon-play-open-companion]')];
  const close = root.querySelector('[data-eon-play-close-companion]');
  const content = root.querySelector('[data-eon-play-companion-content]');
  if (!panel || !openButtons.length || !close || !content) return;
  let returnFocus = openButtons[0];
  const render = () => {
    const plan = createEonCityEonbotCompanionPlan({ skinId: getEonCitySelectedCompanionSkinId(), quality, reducedMotion });
    const rig = getEonCityEonbotRigPlan({ quality, reducedMotion, companionSkinId: plan.visual.skinId });
    const skins = getEonCityEonbotCompanionSkins();
    content.innerHTML = `<p class="eon-play-kicker">EONBOT companion · local visual guide</p><h2 id="eon-play-companion-title">${escapeHtml(plan.identity.title)} · ${escapeHtml(plan.visual.skinLabel)}</h2><p>${escapeHtml(plan.caption.text)}</p><p>This original procedural companion is a captions-first City guide. It has local formation motion only; it does not act as a person, provider, autonomous worker, or background agent.</p><ul><li><strong>Body:</strong> ${escapeHtml(plan.identity.body)}</li><li><strong>Behavior:</strong> local visual guide only; it cannot open routes, approve work, send messages, start audio, request a microphone, or read Chat, Projects, Vault, prompts, outputs, keys, or account data.</li><li><strong>Current detail:</strong> ${escapeHtml(plan.visual.detail)}. Reduced-motion and Lite profiles intentionally simplify motion.</li><li><strong>Rig &amp; staging:</strong> ${escapeHtml(rig.detail)} local geometry with ${rig.rig.orbitRingCount} orbit ring${rig.rig.orbitRingCount === 1 ? '' : 's'}, ${rig.rig.finCount} optional fin${rig.rig.finCount === 1 ? '' : 's'}, and ${rig.rig.stageBeaconCount} stage beacon${rig.rig.stageBeaconCount === 1 ? '' : 's'}. ${rig.staging.motionEnabled ? 'Motion stays local and pauses with City.' : 'Lite or reduced-motion keeps this formation still.'}</li></ul><h3>Visual skin recipes</h3><ul>${skins.map((skin) => `<li><strong>${escapeHtml(skin.label)}</strong> — ${escapeHtml(skin.description)} <small>Visual-only · included in the Free core; no subscription benefit or ownership claim.</small></li>`).join('')}</ul><p class="eon-play-command-deck-note">Appearance choices are local visual preferences. A chosen style applies next time City starts or restarts; it is never bought, unlocked, transferred, or treated as an account entitlement.</p>`;
  };
  const show = (event) => {
    returnFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : returnFocus;
    render();
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const hide = () => {
    panel.hidden = true;
    returnFocus?.focus({ preventScroll: true });
  };
  openButtons.forEach((button) => button.addEventListener('click', show));
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
}


function bindEonbotOrbitCompanion(root, { getRuntime = () => null, getNearbyLandmark = () => null, savedProjectCount = 0, reducedMotion = false, onStatus = null } = {}) {
  const guide = root.querySelector('[data-eon-play-orbit-guide]');
  const title = root.querySelector('[data-eon-play-orbit-title]');
  const caption = root.querySelector('[data-eon-play-orbit-caption]');
  const stateLabel = root.querySelector('[data-eon-play-orbit-state-label]');
  const mute = root.querySelector('[data-eon-play-orbit-mute]');
  const less = root.querySelector('[data-eon-play-orbit-less]');
  const help = root.querySelector('[data-eon-play-orbit-help]');
  const dismiss = root.querySelector('[data-eon-play-orbit-dismiss]');
  const restoreButtons = [...root.querySelectorAll('[data-eon-play-orbit-restore]')];
  if (!guide || !title || !caption || !stateLabel || !mute || !less || !help || !dismiss || !restoreButtons.length) return () => {};
  const clock = () => globalThis.performance?.now?.() || Date.now();
  const startedAt = clock();
  const controller = createEonCityEonbotOrbitController({ reducedMotion, muted: true });
  const routeStepAt = (elapsedSeconds) => elapsedSeconds >= 60 ? 'choose' : elapsedSeconds >= 38 ? 'command' : elapsedSeconds >= 22 ? 'agent' : elapsedSeconds >= 10 ? 'orient' : 'arrival';
  let lastRenderedHintId = '';
  const applyRuntimePresentation = (snapshot) => {
    const state = snapshot?.presentation?.state || 'follow';
    if (!EON_CITY_EONBOT_ORBIT_STATES.includes(state)) return;
    try { getRuntime?.()?.setEonbotOrbitPresentation?.(state, { durationMs: state === 'help' || state === 'warn' ? 4200 : 2600 }); } catch {}
  };
  const render = (snapshot = controller.getSnapshot()) => {
    guide.hidden = Boolean(snapshot.dismissed);
    restoreButtons.forEach((button) => {
      button.hidden = !snapshot.dismissed;
      button.setAttribute('aria-pressed', snapshot.dismissed ? 'false' : 'true');
    });
    mute.setAttribute('aria-pressed', snapshot.muted ? 'true' : 'false');
    mute.textContent = snapshot.muted ? 'Voice muted' : 'Mute voice';
    less.setAttribute('aria-pressed', snapshot.showLessGuidance ? 'true' : 'false');
    less.textContent = snapshot.showLessGuidance ? 'Guidance reduced' : 'Show less guidance';
    guide.dataset.eonPlayOrbitState = snapshot.presentation?.state || 'follow';
    guide.dataset.eonPlayOrbitReducedMotion = snapshot.reducedMotion ? 'true' : 'false';
    const hint = snapshot.currentHint;
    if (hint) {
      title.textContent = hint.title;
      caption.textContent = hint.text;
      stateLabel.textContent = `${snapshot.presentation.state}${snapshot.reducedMotion ? ' · reduced motion' : ''} · captions first`;
      if (hint.id !== lastRenderedHintId) {
        lastRenderedHintId = hint.id;
        applyRuntimePresentation(snapshot);
      }
    } else {
      title.textContent = 'EONBOT Orbit';
      caption.textContent = snapshot.showLessGuidance ? 'Guidance is reduced. Orbit will surface only important safety boundaries or direct help.' : 'Orbit is nearby. Move toward a named destination for a local, non-repeating caption.';
      stateLabel.textContent = `${snapshot.presentation.state}${snapshot.reducedMotion ? ' · reduced motion' : ''} · local only`;
    }
    return snapshot;
  };
  const updateContext = () => {
    const nearby = getNearbyLandmark?.();
    const routeStepId = routeStepAt((clock() - startedAt) / 1000);
    return render(controller.updateContext({ routeStepId, nearbyLandmarkId: nearby?.id || '', savedProjectCount }));
  };
  mute.addEventListener('click', () => {
    const snapshot = render(controller.setMuted(!controller.getSnapshot().muted));
    onStatus?.(snapshot.muted ? 'EONBOT Orbit speech output is muted. Captions remain available.' : 'EONBOT Orbit speech output is unmuted, but speech still requires a separate explicit action in the Voice panel.');
  });
  less.addEventListener('click', () => {
    const snapshot = render(controller.setShowLessGuidance(!controller.getSnapshot().showLessGuidance));
    onStatus?.(snapshot.showLessGuidance ? 'Orbit will now show only direct help and important proof boundaries.' : 'Orbit will again show non-repeating local route guidance.');
  });
  help.addEventListener('click', () => {
    render(controller.request('help'));
    onStatus?.('Orbit help is visible as a local caption. No route or work action started.');
  });
  dismiss.addEventListener('click', () => {
    render(controller.setDismissed(true));
    onStatus?.('EONBOT Orbit guidance was dismissed for this City session. Use “Show Orbit” to restore it.');
  });
  restoreButtons.forEach((button) => button.addEventListener('click', () => {
    controller.setDismissed(false);
    render(controller.request('help'));
    onStatus?.('EONBOT Orbit guidance was restored locally.');
  }));
  root.querySelectorAll('[data-eon-play-open-companion]').forEach((button) => button.addEventListener('click', () => render(controller.request('help'))));
  const timer = globalThis.setInterval?.(updateContext, 2600);
  updateContext();
  root.dataset.eonCityEonbotOrbit = controller.getSnapshot().schema;
  return () => {
    if (timer) globalThis.clearInterval?.(timer);
    controller.dispose();
    try { getRuntime?.()?.setEonbotOrbitPresentation?.('follow', { durationMs: 240 }); } catch {}
    delete root.dataset.eonCityEonbotOrbit;
  };
}


function bindCommandDistrictNpcSystem(root, { getRuntime = () => null, quality = 'balanced', reducedMotion = false, onStatus = null } = {}) {
  const lod = quality === 'lite' ? 'lite' : quality === 'cinematic' ? 'cinematic' : 'balanced';
  const controller = createEonCityCommandDistrictNpcController({ lod, reducedMotion });
  const shell = document.createElement('section');
  shell.className = 'eon-play-npc-system';
  shell.dataset.eonPlayNpcSystem = controller.getSnapshot().schema;
  shell.innerHTML = `<button class="eon-play-npc-system-toggle" type="button" data-eon-play-npc-toggle aria-expanded="false">District guides</button><section class="eon-play-npc-system-panel" data-eon-play-npc-panel hidden aria-label="Command District guides"><header><div><small>W624F · local wayfinding cast</small><strong>Command District guides</strong></div><button type="button" data-eon-play-npc-close aria-label="Close District guides">Close</button></header><p data-eon-play-npc-status>Four bounded guides explain real routes. They do not run jobs, read private work, or open anything automatically.</p><div class="eon-play-npc-grid" data-eon-play-npc-grid></div><div class="eon-play-npc-review" data-eon-play-npc-review aria-live="polite"></div><footer><button type="button" data-eon-play-npc-lod>NPC detail: ${escapeHtml(lod)}</button><span>Captions first · review before route</span></footer></section>`;
  root.append(shell);
  const toggle = shell.querySelector('[data-eon-play-npc-toggle]');
  const panel = shell.querySelector('[data-eon-play-npc-panel]');
  const close = shell.querySelector('[data-eon-play-npc-close]');
  const grid = shell.querySelector('[data-eon-play-npc-grid]');
  const review = shell.querySelector('[data-eon-play-npc-review]');
  const lodButton = shell.querySelector('[data-eon-play-npc-lod]');
  const renderGrid = () => {
    const snapshot = controller.getSnapshot();
    grid.innerHTML = EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry, index) => {
      const active = index < snapshot.lod.activeCount;
      return `<article data-eon-play-npc-card="${escapeHtml(entry.id)}" data-active="${active ? 'true' : 'false'}"><small>${escapeHtml(entry.castName)}</small><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.role)}</p><button type="button" data-eon-play-npc-review="${escapeHtml(entry.id)}"${active ? '' : ' disabled'}>${active ? 'Review guidance' : 'Hidden by device fallback'}</button></article>`;
    }).join('');
    grid.querySelectorAll('[data-eon-play-npc-review]').forEach((button) => button.addEventListener('click', () => {
      const archetypeId = button.dataset.eonPlayNpcReview || '';
      const result = controller.requestReview(archetypeId);
      if (!result.ok || !result.review) return;
      const item = result.review;
      try { getRuntime?.()?.requestCommandDistrictNpcState?.(archetypeId, item.state, { explicitUserAction: true }); } catch {}
      review.innerHTML = `<article><small>${escapeHtml(item.boundary)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.role)}</p><p><strong>Truth boundary:</strong> ${escapeHtml(item.truthRule)}</p><div>${item.routes.map((route) => `<a href="${escapeHtml(route.route)}" data-eon-play-npc-route="${escapeHtml(archetypeId)}">Review ${escapeHtml(route.label)}</a>`).join('')}<button type="button" data-eon-play-npc-stay>Stay in City</button></div><p>No route opened yet. Choosing a named link is a second, visible action.</p></article>`;
      review.querySelector('[data-eon-play-npc-stay]')?.addEventListener('click', () => {
        review.textContent = 'Stayed in City. The guide returned to a local wait state; no work or route changed.';
        controller.requestState(archetypeId, 'wait', { explicitUserAction: true });
        try { getRuntime?.()?.requestCommandDistrictNpcState?.(archetypeId, 'wait', { explicitUserAction: true }); } catch {}
      });
      review.querySelectorAll('[data-eon-play-npc-route]').forEach((link) => link.addEventListener('click', () => {
        onStatus?.(`You explicitly chose ${link.textContent.replace(/^Review\s+/i, '')}. The NPC supplied only a route explanation; no work, provider, payment, reward or private content was transferred.`);
      }));
      onStatus?.(`${item.title} opened a review card only. Choose a named route separately or stay in City.`);
    }));
    lodButton.textContent = `NPC detail: ${snapshot.lod.id}`;
    root.dataset.eonCityNpcLod = snapshot.lod.id;
  };
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) close.focus({ preventScroll: true }); else toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  lodButton.addEventListener('click', () => {
    const order = ['cinematic', 'balanced', 'lite', 'disabled'];
    const current = controller.getSnapshot().lod.id;
    const next = order[(Math.max(0, order.indexOf(current)) + 1) % order.length];
    const snapshot = controller.setLod(next);
    try { getRuntime?.()?.setCommandDistrictNpcLod?.(next); } catch {}
    renderGrid();
    review.textContent = snapshot.activeCount ? `${snapshot.activeCount} optional guide${snapshot.activeCount === 1 ? '' : 's'} remain visible. Productive navigation does not depend on them.` : 'Optional guide visuals are disabled. All productive destinations remain available through the normal City landmarks.';
    onStatus?.(`Command District NPC detail changed locally to ${next}. This preference is session-only and does not alter work or account state.`);
  });
  renderGrid();
  return () => {
    controller.dispose();
    try { getRuntime?.()?.setCommandDistrictNpcLod?.('disabled'); } catch {}
    shell.remove();
    delete root.dataset.eonCityNpcLod;
  };
}


function bindProductiveRpgLoop(root, { onStatus = null } = {}) {
  const controller = createEonCityProductiveRpgController();
  const shell = document.createElement('section');
  shell.className = 'eon-play-productive-rpg';
  shell.dataset.eonPlayProductiveRpg = controller.getSnapshot().schema;
  shell.innerHTML = `<button class="eon-play-productive-rpg-toggle" type="button" data-eon-play-rpg-toggle aria-expanded="false">Mission path</button><section class="eon-play-productive-rpg-panel" data-eon-play-rpg-panel hidden aria-label="Productive mission path"><header><div><small>W624G · truthful outcomes</small><strong>Productive mission path</strong></div><button type="button" data-eon-play-rpg-close aria-label="Close mission path">Close</button></header><p data-eon-play-rpg-summary>Six review-first missions connect City guidance to real local outcomes or explicit proof-gated boundaries.</p><div class="eon-play-productive-rpg-grid" data-eon-play-rpg-grid></div><div class="eon-play-productive-rpg-review" data-eon-play-rpg-review aria-live="polite"></div><footer><button type="button" data-eon-play-rpg-refresh>Check real outcomes</button><span>No money, token, discount or EONKEY reward</span></footer></section>`;
  root.append(shell);
  const toggle = shell.querySelector('[data-eon-play-rpg-toggle]');
  const panel = shell.querySelector('[data-eon-play-rpg-panel]');
  const close = shell.querySelector('[data-eon-play-rpg-close]');
  const grid = shell.querySelector('[data-eon-play-rpg-grid]');
  const review = shell.querySelector('[data-eon-play-rpg-review]');
  const summary = shell.querySelector('[data-eon-play-rpg-summary]');
  const refresh = shell.querySelector('[data-eon-play-rpg-refresh]');
  let selectedMissionId = '';
  const stateLabel = (state = '') => ({ empty: 'Not started', review: 'Reviewed', ready: 'Ready', active: 'Active', unavailable: 'Proof-gated', cancelled: 'Cancelled', failed: 'Needs attention', resumed: 'Resumed', completed: 'Real outcome recorded' })[state] || 'Not started';
  const missionById = (id) => controller.getSnapshot().missions.find((entry) => entry.id === id) || null;
  const renderReview = () => {
    const mission = missionById(selectedMissionId);
    if (!mission) {
      review.innerHTML = '<p>Select one mission to review its required action, privacy boundary and truthful completion rule.</p>';
      return;
    }
    const completed = mission.state === 'completed' && mission.outcome?.verified;
    const resumable = ['cancelled', 'failed', 'active', 'review'].includes(mission.state);
    const alternate = mission.alternateRoute ? `<a href="${escapeHtml(mission.alternateRoute)}" data-eon-play-rpg-route="${escapeHtml(mission.id)}">Review Direct BYOK</a>` : '';
    const routeAction = mission.route === '/eoncity'
      ? `<button type="button" data-eon-play-rpg-orientation>Mark controls reviewed</button>`
      : `<a href="${escapeHtml(mission.route)}" data-eon-play-rpg-route="${escapeHtml(mission.id)}">Open ${escapeHtml(mission.route.replace(/^\//, '') || 'destination')}</a>${alternate}`;
    review.innerHTML = `<article data-state="${escapeHtml(mission.state)}"><small>${escapeHtml(mission.source)} · ${escapeHtml(stateLabel(mission.state))}</small><h3>${escapeHtml(mission.title)}</h3><p><strong>Required action:</strong> ${escapeHtml(mission.requiredAction)}</p><p><strong>Privacy boundary:</strong> ${escapeHtml(mission.privacyBoundary)}</p>${mission.unavailableText ? `<p><strong>Proof boundary:</strong> ${escapeHtml(mission.unavailableText)}</p>` : ''}${completed ? `<p><strong>Verified outcome:</strong> ${escapeHtml(mission.outcome.kind.replaceAll('-', ' '))} · stored locally at ${escapeHtml(new Date(mission.outcome.verifiedAt).toLocaleString())}.</p>` : '<p>No completion is claimed until a bounded receipt is written by the real destination action.</p>'}<div><button type="button" data-eon-play-rpg-start>${resumable ? 'Resume mission' : 'Start mission'}</button>${routeAction}<button type="button" data-eon-play-rpg-cancel>Cancel locally</button><button type="button" data-eon-play-rpg-stay>Stay in City</button></div></article>`;
    review.querySelector('[data-eon-play-rpg-start]')?.addEventListener('click', () => {
      const current = missionById(selectedMissionId);
      const result = ['cancelled', 'failed', 'active', 'review'].includes(current?.state)
        ? controller.resume(selectedMissionId, { explicitUserAction: true })
        : controller.start(selectedMissionId, { explicitUserAction: true });
      if (!result.ok && result.reason === 'visible-review-required') controller.review(selectedMissionId, { explicitUserAction: true });
      onStatus?.(result.ok ? `${mission.title} is active locally. No route or work action started.` : `Mission did not start: ${result.reason}.`);
      renderAll();
    });
    review.querySelector('[data-eon-play-rpg-orientation]')?.addEventListener('click', () => {
      controller.review('orientation', { explicitUserAction: true });
      const result = controller.completeOrientation({ explicitUserAction: true, controlsReviewed: true });
      onStatus?.(result.ok ? 'Orientation receipt saved locally. No telemetry, reward or account progress was created.' : 'Orientation could not be recorded in this browser.');
      renderAll();
    });
    review.querySelector('[data-eon-play-rpg-cancel]')?.addEventListener('click', () => {
      const result = controller.cancel(selectedMissionId, { explicitUserAction: true });
      onStatus?.(result.ok ? `${mission.title} was cancelled locally. Its real destination and data were not changed.` : 'Mission cancellation was unavailable.');
      renderAll();
    });
    review.querySelector('[data-eon-play-rpg-stay]')?.addEventListener('click', () => {
      review.textContent = 'Stayed in City. No route, provider, project, automation, backup or account state changed.';
      onStatus?.('Stayed in City. Mission review remains local.');
    });
    review.querySelectorAll('[data-eon-play-rpg-route]').forEach((link) => link.addEventListener('click', () => {
      controller.start(selectedMissionId, { explicitUserAction: true });
      onStatus?.(`You explicitly chose ${link.textContent}. City transferred only the mission id; completion still requires a real outcome receipt.`);
    }));
  };
  const renderAll = () => {
    const snapshot = controller.refresh();
    summary.textContent = `${snapshot.completedCount}/${snapshot.totalCount} missions have real bounded outcomes. Progress is local and has no financial or EONKEY value.`;
    grid.innerHTML = snapshot.missions.map((mission) => `<article data-eon-play-rpg-card="${escapeHtml(mission.id)}" data-state="${escapeHtml(mission.state)}"><small>${escapeHtml(stateLabel(mission.state))}</small><strong>${escapeHtml(mission.title)}</strong><p>${escapeHtml(mission.requiredAction)}</p><button type="button" data-eon-play-rpg-review="${escapeHtml(mission.id)}">Review mission</button></article>`).join('');
    grid.querySelectorAll('[data-eon-play-rpg-review]').forEach((button) => button.addEventListener('click', () => {
      selectedMissionId = button.dataset.eonPlayRpgReview || '';
      controller.review(selectedMissionId, { explicitUserAction: true });
      renderAll();
      onStatus?.(`${missionById(selectedMissionId)?.title || 'Mission'} opened for review only. No route or action started.`);
    }));
    root.dataset.eonCityProductiveRpgCompleted = String(snapshot.completedCount);
    renderReview();
  };
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) close.focus({ preventScroll: true }); else toggle.focus({ preventScroll: true });
  };
  const onExternalReview = (event) => {
    const missionId = String(event?.detail?.missionId || '');
    if (!missionById(missionId)) return;
    selectedMissionId = missionId;
    controller.review(selectedMissionId, { explicitUserAction: true });
    setOpen(true);
    renderAll();
    review.querySelector('article')?.focus?.({ preventScroll: true });
    onStatus?.(`${missionById(selectedMissionId)?.title || 'Mission'} opened from a Living Nexus encounter for visible review only.`);
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  refresh.addEventListener('click', () => {
    renderAll();
    onStatus?.('Mission outcomes refreshed from bounded local receipts. No private content was read.');
  });
  root.addEventListener('eon:city:productive-rpg:review', onExternalReview);
  renderAll();
  return () => {
    root.removeEventListener('eon:city:productive-rpg:review', onExternalReview);
    controller.dispose();
    shell.remove();
    delete root.dataset.eonCityProductiveRpgCompleted;
  };
}


function bindEonbotVoiceConsentPanel(root, { onStatus = null, getRuntime = () => null } = {}) {
  const panel = root.querySelector('[data-eon-play-voice-consent-panel]');
  const openButtons = [...root.querySelectorAll('[data-eon-play-open-voice-consent]')];
  const close = root.querySelector('[data-eon-play-close-voice-consent]');
  const content = root.querySelector('[data-eon-play-voice-consent-content]');
  if (!panel || !openButtons.length || !close || !content) return () => {};
  const controller = createEonCityVoiceConsentController({ environment: globalThis });
  let returnFocus = openButtons[0];
  const signalCompanion = (mode, durationMs) => {
    try {
      const runtime = getRuntime?.();
      runtime?.setCompanionIntent?.(mode, { durationMs });
      if (mode === 'speak') runtime?.setEonbotOrbitPresentation?.('speak', { durationMs });
    } catch {}
  };
  const render = () => {
    const snapshot = controller.getSnapshot();
    const capability = snapshot.capability || getEonCityVoiceCapability({ environment: globalThis });
    const languageOptions = getEonCityVoiceLanguageOptions();
    const canCheck = Boolean(capability.microphoneCheckAvailable);
    const canStart = Boolean(capability.dictationAvailable && snapshot.microphonePermission === 'granted-check-only');
    const active = snapshot.dictationState === 'starting' || snapshot.dictationState === 'listening';
    const localeOptions = languageOptions.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === snapshot.selectedLocale ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
    const transcript = snapshot.transcript || '';
    const status = snapshot.lastError
      ? `Current status: ${snapshot.lastError.replaceAll('-', ' ')}.`
      : snapshot.dictationState === 'listening'
        ? 'Listening after your direct action. Stop whenever you choose.'
        : snapshot.reviewReady
          ? 'Editable review text is ready in this panel only. City did not send it anywhere.'
          : capability.reason;
    content.innerHTML = `<p class="eon-play-kicker">W562 · captions-first voice review</p><h2 id="eon-play-voice-consent-title">Voice remains your explicit choice</h2><p>${escapeHtml(status)}</p><p>City never starts a microphone on boot. Browser speech, when exposed, is browser-assisted and may use a browser recognition service; it is not a local speech-model claim.</p><ul><li><strong>Browser:</strong> ${escapeHtml(capability.browserFamily)} · ${escapeHtml(capability.mode)}</li><li><strong>Availability:</strong> browser feature flags only. Physical-device and language behavior still need your real test.</li><li><strong>Privacy:</strong> no audio or transcript is saved by City, sent to EONBOT Chat, routed, published, or used to execute a tool.</li></ul><label>Dictation language<select data-eon-play-voice-locale>${localeOptions}</select></label><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-voice-check${canCheck ? '' : ' disabled'}>Check microphone permission</button><button type="button" data-eon-play-voice-start${canStart && !active ? '' : ' disabled'}>Start Dictation</button><button type="button" data-eon-play-voice-stop${active ? '' : ' disabled'}>Stop Dictation</button><button type="button" data-eon-play-voice-clear${transcript ? '' : ' disabled'}>Clear review text</button></div><section class="eon-play-voice-output"><strong>EONBOT caption voice</strong><p>Optional browser speech output for this visible City guide caption only. It is not a live AI conversation and never starts a microphone.</p><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-voice-preview${capability.speechSynthesisSupported ? '' : ' disabled'}>Hear EONBOT</button><button type="button" data-eon-play-voice-preview-stop${capability.speechSynthesisSupported ? '' : ' disabled'}>Stop EONBOT voice</button><a href="/?new=1" data-eon-play-voice-open-chat>Open EONBOT Chat</a></div></section><label>Editable review text<textarea data-eon-play-voice-transcript readonly rows="4" placeholder="No transcript until you explicitly start browser-assisted dictation.">${escapeHtml(transcript)}</textarea></label><p class="eon-play-command-deck-note">After reviewing, manually type only what you choose in EONBOT Chat. This panel never transfers text automatically. A live assistant voice conversation remains unavailable here until its Chat voice adapter is separately verified.</p>`;
    content.querySelector('[data-eon-play-voice-check]')?.addEventListener('click', async () => {
      const result = await controller.checkMicrophonePermission({ explicitUserAction: true });
      onStatus?.(result.ok ? 'Microphone permission was checked after your action. The check stream was stopped immediately.' : 'Microphone permission could not be checked here. Typed input remains available.');
      render();
    });
    content.querySelector('[data-eon-play-voice-start]')?.addEventListener('click', () => {
      const locale = content.querySelector('[data-eon-play-voice-locale]')?.value || 'auto';
      const result = controller.startDictation({ explicitUserAction: true, locale });
      if (result.ok) signalCompanion('listen', 8_000);
      onStatus?.(result.ok ? 'Browser-assisted dictation was requested from your action. Review any text here before using it elsewhere.' : 'Dictation did not start. Keep typing or use a supported full browser.');
      render();
    });
    content.querySelector('[data-eon-play-voice-stop]')?.addEventListener('click', () => {
      controller.stopDictation('user-stop');
      signalCompanion('return', 900);
      onStatus?.('Dictation stopped. Any review text remains only in this open City panel until you clear it or leave City.');
      render();
    });
    content.querySelector('[data-eon-play-voice-clear]')?.addEventListener('click', () => {
      controller.clearReview({ explicitUserAction: true });
      onStatus?.('Cleared the in-memory review text. City did not store it.');
      render();
    });
    content.querySelector('[data-eon-play-voice-preview]')?.addEventListener('click', () => {
      const locale = content.querySelector('[data-eon-play-voice-locale]')?.value || 'auto';
      const result = speakEonCityCaption({
        environment: globalThis,
        locale,
        explicitUserAction: true,
        text: 'I am EONBOT. Choose a named City signal, then decide what you want to open. Nothing starts without your next visible choice.'
      });
      if (result.ok) signalCompanion('speak', 4_200);
      onStatus?.(result.ok ? 'EONBOT browser caption voice was requested from your action. It is a local guide caption, not a live AI conversation.' : 'EONBOT browser caption voice is unavailable here. Captions and typed EONBOT Chat remain available.');
    });
    content.querySelector('[data-eon-play-voice-preview-stop]')?.addEventListener('click', () => {
      stopEonCityCaption({ environment: globalThis, explicitUserAction: true });
      signalCompanion('return', 900);
      onStatus?.('EONBOT browser caption voice stopped.');
    });
  };
  const show = (event) => {
    returnFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : returnFocus;
    signalCompanion('listen', 3_200);
    render();
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const hide = () => {
    controller.stopDictation('panel-close');
    stopEonCityCaption({ environment: globalThis, explicitUserAction: true });
    signalCompanion('return', 900);
    panel.hidden = true;
    returnFocus?.focus({ preventScroll: true });
  };
  const unsubscribe = controller.subscribe(() => { if (!panel.hidden) render(); });
  openButtons.forEach((button) => button.addEventListener('click', show));
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  return () => {
    try { unsubscribe?.(); } catch {}
    try { controller.dispose(); } catch {}
  };
}

function describeEonCitySoundscapePolicyState(snapshot = {}) {
  const state = String(snapshot.audibleState || 'off');
  if (state === 'active-local-procedural') return 'Local procedural sound is active after your action. No track, voice pack, or downloaded asset is used.';
  if (state === 'enable-pending-local-procedural-source') return 'Starting local procedural sound from your action. Captions and City visuals remain complete.';
  if (state === 'muted') return 'Sound is muted. Captions and City visuals remain complete.';
  if (state === 'unsupported') return 'Local sound is unavailable in this browser. Captions and City visuals remain complete.';
  if (state === 'reduced-effects-silent') return 'Reduced effects keeps sound off. Captions and City visuals remain complete.';
  if (state === 'paused-silent') return 'City is paused, so sound is stopped. It will not resume automatically.';
  if (state === 'hidden-silent') return 'This tab is hidden, so sound is stopped. It will not resume automatically.';
  return 'Sound is off. Captions and City visuals remain complete.';
}

/** W662G — source/runtime cast roster. Automated facts stay separate from visual acceptance. */
function bindEonCityCastCertificationPanel(root, { getRuntime = () => null, onStatus = () => {} } = {}) {
  const panel = root.querySelector('[data-eon-play-cast-certification-panel]');
  const content = root.querySelector('[data-eon-play-cast-certification-content]');
  const openButtons = [...root.querySelectorAll('[data-eon-play-open-cast-certification]')];
  const close = root.querySelector('[data-eon-play-close-cast-certification]');
  if (!panel || !content || !openButtons.length || !close) return () => {};
  let returnFocus = openButtons[0];
  const render = () => {
    const runtimeSummary = getRuntime?.()?.getRuntimeSummary?.() || {};
    const plan = getEonCityCastCertificationPlan({ runtimeSummary });
    content.innerHTML = renderEonCityCastCertificationMarkup(plan);
    panel.dataset.eonCastStatus = plan.status;
    return plan;
  };
  const show = (event) => {
    returnFocus = event?.currentTarget || returnFocus;
    const plan = render();
    panel.hidden = false;
    close.focus?.({ preventScroll: true });
    onStatus(`${plan.counts.total} source-controlled cast assets listed. Browser visual acceptance is still required.`);
  };
  const hide = () => {
    panel.hidden = true;
    returnFocus?.focus?.({ preventScroll: true });
  };
  openButtons.forEach((button) => button.addEventListener('click', show));
  close.addEventListener('click', hide);
  panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  return () => {
    openButtons.forEach((button) => button.removeEventListener('click', show));
    close.removeEventListener('click', hide);
    panel.hidden = true;
  };
}

/** W572 explicit local sound controls. No audio starts, resumes, or persists without a visible action. */
function bindEonCitySoundscapePolicyPanel(root, {
  soundscape,
  soundscapePolicy,
  getRuntime = () => null,
  getPreferences = () => CITY_SOUNDSCAPE_DEFAULTS,
  setPreferences = () => CITY_SOUNDSCAPE_DEFAULTS,
  isReducedEffects = () => false,
  onStatus = () => {}
} = {}) {
  const enable = root.querySelector('[data-eon-play-soundscape-enable]');
  const mute = root.querySelector('[data-eon-play-soundscape-mute]');
  const stop = root.querySelector('[data-eon-play-soundscape-stop]');
  const statusNodes = [...root.querySelectorAll('[data-eon-play-soundscape-policy-status], [data-eon-play-soundscape-status]')];
  if (!soundscape || !soundscapePolicy || !enable || !mute || !stop || !statusNodes.length) return () => {};

  const runtimeState = () => ({
    cityPaused: Boolean(getRuntime?.()?.isPaused?.()),
    tabVisible: globalThis.document?.visibilityState !== 'hidden',
    reducedEffects: Boolean(isReducedEffects?.())
  });
  const render = (snapshot = soundscapePolicy.getSnapshot()) => {
    const message = describeEonCitySoundscapePolicyState(snapshot);
    statusNodes.forEach((node) => { node.textContent = message; });
    root.dataset.eonCityPlaySoundscape = snapshot.audibleState === 'active-local-procedural' ? 'optional-enabled' : 'off';
    const stoppedByRuntime = Boolean(snapshot.cityPaused || !snapshot.tabVisible || snapshot.reducedEffects);
    enable.disabled = stoppedByRuntime;
    mute.disabled = !['active-local-procedural', 'enable-pending-local-procedural-source'].includes(snapshot.audibleState);
    stop.disabled = !['active-local-procedural', 'enable-pending-local-procedural-source', 'muted'].includes(snapshot.audibleState);
    return message;
  };
  const syncRuntime = (reason = 'runtime-guard') => {
    const result = soundscapePolicy.setRuntime(runtimeState());
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.(reason);
    render(result.snapshot);
    return result;
  };
  const onEnable = () => {
    const request = soundscapePolicy.requestEnable({ explicitUserAction: true, runtime: runtimeState() });
    if (!request.ok) {
      soundscape.stopForRuntimeGuard?.(`sound-enable-${request.error || 'blocked'}`);
      const message = render(request.snapshot);
      onStatus(message);
      return;
    }
    const nextPreferences = normalizeCitySoundscapePreferences({ ...getPreferences(), ambience: true, ui: true, reducedSensory: false });
    setPreferences(nextPreferences);
    const activation = soundscape.activateFromUserGesture();
    const playback = soundscapePolicy.reportPlaybackResult({ ok: activation?.activated === true, reason: activation?.reason || 'audio-start-failed' });
    const message = render(playback.snapshot);
    onStatus(message);
  };
  const onMute = () => {
    setPreferences(normalizeCitySoundscapePreferences({ ...getPreferences(), ambience: false, ui: false }));
    const result = soundscapePolicy.mute({ explicitUserAction: true });
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.('user-muted');
    const message = render(result.snapshot);
    onStatus(message);
  };
  const onStop = () => {
    setPreferences(normalizeCitySoundscapePreferences({ ...getPreferences(), ambience: false, ui: false }));
    const result = soundscapePolicy.stop({ explicitUserAction: true, reason: 'user-stopped' });
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.('user-stopped');
    const message = render(result.snapshot);
    onStatus(message);
  };
  const onVisibilityChange = () => { syncRuntime('tab-visibility-change'); };
  const unsubscribe = soundscapePolicy.subscribe(render);
  enable.addEventListener('click', onEnable);
  mute.addEventListener('click', onMute);
  stop.addEventListener('click', onStop);
  globalThis.document?.addEventListener?.('visibilitychange', onVisibilityChange);
  syncRuntime('initial-runtime-guard');
  return () => {
    try { unsubscribe?.(); } catch {}
    enable.removeEventListener('click', onEnable);
    mute.removeEventListener('click', onMute);
    stop.removeEventListener('click', onStop);
    globalThis.document?.removeEventListener?.('visibilitychange', onVisibilityChange);
  };
}


function bindEonCityUsefulWorkPaths(root, { workroomOverlay = null, onStatus = () => {} } = {}) {
  const panel = root.querySelector('[data-eon-play-work-paths-panel]');
  const openButtons = [...root.querySelectorAll('[data-eon-play-open-work-paths]')];
  const close = root.querySelector('[data-eon-play-close-work-paths]');
  const cards = root.querySelector('[data-eon-play-work-paths-cards]');
  const reviewRoot = root.querySelector('[data-eon-play-work-paths-review]');
  if (!panel || !openButtons.length || !close || !cards || !reviewRoot) return () => {};
  let returnFocus = openButtons[0];
  let activeReview = null;
  const renderReview = () => {
    if (!activeReview) {
      reviewRoot.innerHTML = '<p>Select one path to review its native handoff. City never imports your task, prompt, file, account, or Vault data into this panel.</p>';
      return;
    }
    reviewRoot.innerHTML = `<section class="eon-play-eonbot-review-card"><p class="eon-play-kicker">${escapeHtml(activeReview.district)} · local handoff review</p><h3>Continue as ${escapeHtml(activeReview.title)}?</h3><p>${escapeHtml(activeReview.outcome)}</p><p>City will only open the chosen native surface after your second visible click. It will not create a task, run a provider, schedule work, check an entitlement, grant a reward, or transfer City text.</p><div><a class="eon-play-primary" href="${escapeHtml(activeReview.destination.route)}" data-eon-play-confirm-work-path="${escapeHtml(activeReview.pathId)}">${escapeHtml(activeReview.destination.label)}</a><button class="eon-play-secondary" type="button" data-eon-play-cancel-work-path>Stay in City</button></div></section>`;
    reviewRoot.querySelector('[data-eon-play-cancel-work-path]')?.addEventListener('click', () => {
      activeReview = null;
      renderReview();
      onStatus('Stayed in City. No work path was opened or changed.');
    });
    reviewRoot.querySelector('[data-eon-play-confirm-work-path]')?.addEventListener('click', () => {
      appendOperatorActivity({ source: 'city', status: 'info', title: 'City work path confirmed', detail: `The user reviewed and opened the ${activeReview.title} native work path. No City task, private text, provider action, entitlement, or reward was transferred.`, route: activeReview.destination.route });
      disposeCityPlayRuntime(root, `useful-work-path:${activeReview.pathId}`);
    });
  };
  const show = (event) => {
    returnFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : returnFocus;
    const opened = workroomOverlay?.open?.({ id: 'useful-work-paths', explicitUserAction: true });
    if (opened && opened.ok !== true) {
      onStatus('Useful work paths could not open safely. City was not changed.');
      return;
    }
    activeReview = null;
    renderReview();
    panel.hidden = false;
    close.focus({ preventScroll: true });
    onStatus('Useful work paths are open. Pick a role, review the handoff, then choose a native surface yourself.');
  };
  const hide = () => {
    panel.hidden = true;
    activeReview = null;
    workroomOverlay?.close?.({ explicitUserAction: true, reason: 'useful-work-paths-close' });
    returnFocus?.focus({ preventScroll: true });
    onStatus('Returned to City. No path, task, reward, subscription or account state changed.');
  };
  const selectPath = (event) => {
    const result = createEonCityUsefulWorkPathReview({ pathId: event.currentTarget?.dataset?.eonPlayWorkPath || '' });
    if (!result.ok || !result.review) {
      onStatus('That City work path is unavailable. Nothing opened.');
      return;
    }
    activeReview = result.review;
    renderReview();
    reviewRoot.querySelector('[data-eon-play-confirm-work-path]')?.focus({ preventScroll: true });
    onStatus(`${activeReview.title} is ready for review. A second click is still required to open its native surface.`);
  };
  const onPanelClick = (event) => { if (event.target === panel) hide(); };
  openButtons.forEach((button) => button.addEventListener('click', show));
  cards.querySelectorAll('[data-eon-play-work-path]').forEach((button) => button.addEventListener('click', selectPath));
  close.addEventListener('click', hide);
  panel.addEventListener('click', onPanelClick);
  return () => {
    if (!panel.hidden) {
      panel.hidden = true;
      try { workroomOverlay?.close?.({ explicitUserAction: true, reason: 'useful-work-paths-unbind' }); } catch {}
    }
    openButtons.forEach((button) => button.removeEventListener('click', show));
    cards.querySelectorAll('[data-eon-play-work-path]').forEach((button) => button.removeEventListener('click', selectPath));
    close.removeEventListener('click', hide);
    panel.removeEventListener('click', onPanelClick);
  };
}

function createPreviewEvidenceController(root, { capability, quality, runtime, enabled, setStatus, proofStatus }) {
  if (!enabled) return Object.freeze({ enabled: false, event: () => {}, task: () => {}, save: () => {}, export: () => false });
  let session = createCityPreviewSession({
    capability,
    quality,
    environment: {
      touch: Boolean(globalThis.navigator?.maxTouchPoints),
      fullscreenSupported: Boolean(root.requestFullscreen),
      orientationLockSupported: Boolean(globalThis.screen?.orientation?.lock),
      screenWidth: globalThis.screen?.width,
      screenHeight: globalThis.screen?.height
    }
  });
  const panel = root.querySelector('[data-eon-play-preview-panel]');
  const summary = root.querySelector('[data-eon-play-preview-summary]');
  const render = () => {
    if (!summary) return;
    const marked = session.tasks.length;
    const events = session.events.length;
    summary.textContent = `${marked}/${CITY_PREVIEW_TASKS.length} review steps marked · ${events} local observations. Nothing is uploaded.`;
  };
  const checkpoint = () => {
    if (runtime?.getRuntimeSummary) {
      const frame = recordCityPreviewFrame(session, runtime.getRuntimeSummary());
      if (frame.ok) session = frame.session;
    }
    saveCityPreviewSession(session);
    render();
  };
  const event = (type, result = 'observe') => {
    const next = recordCityPreviewEvent(session, type, { result });
    if (next.ok) { session = next.session; checkpoint(); }
  };
  const task = (type, result = 'pass') => {
    const next = recordCityPreviewTask(session, type, { result });
    if (next.ok) { session = next.session; checkpoint(); }
  };
  root.querySelector('[data-eon-play-open-preview]')?.addEventListener('click', () => {
    if (panel) panel.hidden = false;
    root.querySelector('[data-eon-play-close-preview]')?.focus({ preventScroll: true });
  });
  root.querySelector('[data-eon-play-close-preview]')?.addEventListener('click', () => {
    if (panel) panel.hidden = true;
    root.querySelector('[data-eon-play-open-preview]')?.focus({ preventScroll: true });
  });
  panel?.addEventListener('click', (eventObject) => { if (eventObject.target === panel) panel.hidden = true; });
  root.querySelectorAll('[data-eon-preview-task]').forEach((button) => {
    button.addEventListener('click', () => {
      task(button.dataset.eonPreviewTask, 'pass');
      button.dataset.previewDone = 'true';
      button.textContent = `${button.textContent.replace(/^✓\s*/, '')} ✓`;
      setStatus?.('Saved a local preview task observation. Nothing was uploaded.');
    });
  });
  root.querySelector('[data-eon-preview-export]')?.addEventListener('click', () => {
    checkpoint();
    const exported = downloadCityPreviewEvidence(session);
    if (proofStatus) proofStatus.textContent = exported ? 'Exported local preview evidence. Nothing was uploaded.' : 'Local preview evidence could not be exported in this browser.';
  });
  event('preview-started', 'observe');
  return Object.freeze({ enabled: true, event, task, save: checkpoint, export: () => downloadCityPreviewEvidence(session), getSession: () => session });
}

export { resolveEonCityQualityAuthority } from './city/eon-city-quality-authority.js';

async function startPlay(root, capability, { quality, reducedEffects = false, previewEvidence = false, sensoryPreferences = readCitySensoryPreferences(), soundscapePreferences = CITY_SOUNDSCAPE_DEFAULTS, openSkyProfileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, requestFullscreen = true, entryMode = 'review', runtimeStateMachine = null, assetManifest = null } = {}) {
  // A repeated direct-entry request must not leave an older renderer lease alive.
  if (cityWorkloadLeases.has(root) || cityRuntimeLifecycles.has(root)) disposeCityPlayRuntime(root, 'superseded-city-start');
  const automaticQuality = normalizeCityPlayQuality(reducedEffects ? 'lite' : quality, capability);
  const certificationQuality = resolveEonCityQualityAuthority({ detectedQuality: automaticQuality, deviceProfile: capability });
  const selectedQuality = certificationQuality.effective;
  try {
    if (runtimeStateMachine?.getSnapshot?.().state === 'loading-shell') runtimeStateMachine.transition('loading-core', 'city-core-import');
  } catch {}
  if (root?.dataset) {
    root.dataset.eonCityQuality = selectedQuality;
    root.dataset.eonCityQualitySource = certificationQuality.source;
    if (assetManifest?.schema) root.dataset.eonCityAssetManifest = assetManifest.schema;
    if (assetManifest?.cacheVersion) root.dataset.eonCityCacheVersion = assetManifest.cacheVersion;
  }
  let selectedOpenSkyProfileId = normalizeEonCityOpenSkyProfileId(openSkyProfileId);
  const previewMode = Boolean(previewEvidence);
  const directEntry = entryMode === 'direct';
  const workloadGovernor = getEonWorkloadGovernor();
  const cityWorkload = workloadGovernor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, {
    id: `city-render:${Date.now()}:${selectedQuality}`,
    source: 'eon-city-play',
    label: 'EON City renderer',
    userInitiated: true
  });
  if (!cityWorkload.ok) {
    renderFallback(root, capability, 'City renderer is waiting for an active local heavy-media task to finish.', {
      onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
      onSafeMode: () => void startCitySafeMode(root, capability)
    });
    return;
  }
  cityWorkloadLeases.set(root, cityWorkload.lease);
  const cityWorkloadUnsubscribe = workloadGovernor.registerConsumer({
    id: `city-render-consumer:${Date.now()}`,
    workloads: [EON_WORKLOAD_KINDS.CITY_RENDER],
    onAction: (action) => {
      const runtime = runtimes.get(root);
      if (action.action === 'city:reduce-quality') {
        runtime?.applyWorkloadProtection?.(`universal-workload-governor:${action.reason || action.pressure || 'pressure'}`);
        root.dataset.eonCityWorkloadProtection = 'active';
      }
      if (action.action === 'city:pause' && action.userConfirmed) {
        const manuallyPaused = root.dataset.eonCityManualPause === 'active' || pausePanel?.hidden === false;
        if (!manuallyPaused && !runtime?.isPaused?.()) {
          runtime?.pause?.();
          root.dataset.eonCityWorkloadPause = 'active';
          soundscapePolicy?.setRuntime?.({
            cityPaused: true,
            tabVisible: globalThis.document?.visibilityState !== 'hidden',
            reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
          });
        }
      }
      if (action.action === 'city:resume' && root.dataset.eonCityWorkloadPause === 'active') {
        const manuallyPaused = root.dataset.eonCityManualPause === 'active' || pausePanel?.hidden === false;
        if (!manuallyPaused) {
          runtime?.resume?.();
          soundscapePolicy?.setRuntime?.({
            cityPaused: false,
            tabVisible: globalThis.document?.visibilityState !== 'hidden',
            reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
          });
        }
        delete root.dataset.eonCityWorkloadPause;
      }
    }
  });
  cityWorkloadUnsubscribers.set(root, cityWorkloadUnsubscribe);
  const cityLoadSequence = getEonCityClientLoadSequence(root)
    || bindEonCityClientLoadSequence(root, createEonCityClientLoadSequence({ quality: selectedQuality, directEntry }));
  cityLoadSequence.advance('device-profile', {
    detail: `Using the ${selectedQuality} City profile for this browser.`
  });
  const { lifecycle, boot } = createCityRuntimeLifecycle(root, { quality: selectedQuality, entryMode: directEntry ? 'direct' : entryMode });
  if (!boot.ok) {
    disposeCityPlayRuntime(root, 'city-boot-not-started');
    return;
  }
  const isCurrentBoot = () => lifecycle.isCurrent(boot.token);
  const bootController = createCityBootController(root, { quality: selectedQuality, entryMode: directEntry ? 'direct' : 'review' });
  lifecycle.own('boot-diagnostics', bootController);
  lifecycle.own('mode-link-tracking', modeTrackingUnsubscribers.get(root));
  bootController.begin();
  if (!capability?.webgl) bootController.record('CITY_WEBGL_UNAVAILABLE', 'capability-webgl-unavailable');
  let sensory = saveCitySensoryPreferences(sensoryPreferences);
  let soundscapePrefs = normalizeCitySoundscapePreferences(soundscapePreferences);
  let soundscapeMessage = '';
  const soundscape = createCityAdaptiveSoundscape({ preferences: soundscapePrefs, environment: globalThis, onStatus: (message) => { soundscapeMessage = message; } });
  const soundscapePolicy = createEonCitySoundscapePolicyController();
  soundscapePolicy.setRuntime({
    cityPaused: false,
    tabVisible: globalThis.document?.visibilityState !== 'hidden',
    reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
  });
  soundscapeControllers.set(root, soundscape);
  soundscapePolicyControllers.set(root, soundscapePolicy);
  lifecycle.own('adaptive-soundscape', soundscape);
  lifecycle.own('soundscape-policy', soundscapePolicy);
  // W572: entering City or fullscreen is never audio permission. A separate
  // visible Turn on local sound action is required inside City settings.
  const soundscapeActivation = { activated: false, reason: directEntry ? 'direct-entry-no-audio' : 'w572-explicit-sound-action-required' };
  const agentPresencePreferences = readAgentPresencePreferences();
  const agentSignalSnapshot = getEonCityAgentSignalSnapshot();
  root.dataset.eonCityPlaySound = sensory.sound ? 'optional-enabled' : 'off';
  root.dataset.eonCityPlayHaptics = sensory.haptics ? 'optional-enabled' : 'off';
  root.dataset.eonCityPlaySoundscape = soundscapeActivation.activated ? 'optional-enabled' : 'off';
  root.dataset.eonCityOpenSkyProfile = selectedOpenSkyProfileId;
  root.dataset.eonCityPlayState = 'loading';
  setCityRouteState(root, 'booting');
  root.innerHTML = renderEonCityClientLoadMarkup(cityLoadSequence.getSnapshot(), {
    title: directEntry ? 'Loading Command Horizon' : 'Preparing Immersive Work Mode',
    kicker: directEntry ? 'EON UNIVERSE · signed-in City' : 'EON City · Immersive Work Mode'
  });
  const immersion = requestFullscreen ? await requestImmersion(root, capability) : { fullscreen: false, orientation: false };
  if (!isCurrentBoot()) {
    disposeCityPlayRuntime(root, 'city-boot-superseded-before-import');
    return;
  }
  let module;
  try {
    cityLoadSequence.advance('engine-loading', { detail: 'Loading the City engine locally. No work is opening.' });
    root.innerHTML = renderEonCityClientLoadMarkup(cityLoadSequence.getSnapshot(), {
      title: directEntry ? 'Loading Command Horizon' : 'Preparing Immersive Work Mode',
      kicker: directEntry ? 'EON UNIVERSE · signed-in City' : 'EON City · Immersive Work Mode'
    });
    module = await import('./city/eon-city-play-babylon.js');
    if (!isCurrentBoot()) {
      disposeCityPlayRuntime(root, 'city-boot-superseded-after-import');
      return;
    }
  } catch {
    if (!isCurrentBoot()) {
      disposeCityPlayRuntime(root, 'city-import-stale-failure');
      return;
    }
    cityLoadSequence.fail('City engine code could not load. No work or private City data changed.');
    bootController.record('CITY_IMPORT_FAILED', 'babylon-module-unavailable');
    const diagnostics = bootController.getSnapshot();
    disposeCityPlayRuntime(root);
    renderFallback(root, capability, 'EON City could not load its local renderer.', {
      diagnostics,
      onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
      onSafeMode: () => void startCitySafeMode(root, capability)
    });
    return;
  }
  if (!isCurrentBoot()) {
    disposeCityPlayRuntime(root, 'city-boot-superseded-before-world');
    return;
  }
  cityLoadSequence.advance('world-building', { detail: 'Building Command Horizon locally. Approved art streaming begins only when real assets exist.' });
  ensureCityWorldState();
  updateCityPlayPreferences({ preferredQuality: selectedQuality, reducedEffects: Boolean(reducedEffects || capability.reducedMotion) });
  recordCityDistrictVisit('command');
  const commandDistrictEntry = recordCommandDistrictEvent('entered');
  const summary = getCityWorldPublicSummary(ensureCityWorldState().state);
  const previewAction = previewMode ? '<button type="button" data-eon-play-open-preview>Preview log</button>' : '';
  // W394 — Direct City entry starts with only the two decisions that matter. All other
  // controls remain available in the visible City controls sheet; this preserves a
  // clean mobile HUD without removing user agency or the same-route recovery.
  const projectDistrictSnapshot = createEonProjectDistrictRegistry().getSnapshot();
  const projectDistrictPortalLabel = projectDistrictSnapshot.activeCount ? `${projectDistrictSnapshot.activeCount} private project portal${projectDistrictSnapshot.activeCount === 1 ? '' : 's'} ready locally.` : 'Turn a reviewed local Project into a private City portal when you are ready.';
  // W592 — selection completes first-run orientation, while a dismissal keeps
  // City available without forcing a route. Neither state can auto-navigate.
  const cityFirstRunVisible = false;
  const nexusContinuity = readEonNexusContinuitySnapshot();
  const nexusContinuityMarkup = nexusContinuity
    ? `<aside class="eon-play-nexus-continuity" data-eon-play-nexus-continuity aria-label="EON Nexus continuity"><span>${escapeHtml(nexusContinuity.identity.stateLabel)}</span><strong>${escapeHtml(nexusContinuity.project.selected ? nexusContinuity.project.label : nexusContinuity.identity.assistantLabel)}</strong><small>${escapeHtml(nexusContinuity.providerRoute.providerLabel)} · same private state</small><a href="${escapeHtml(nexusContinuity.returnContext.route)}" data-eon-play-return-from-spatial-nexus>Return to ${escapeHtml(nexusContinuity.returnContext.surfaceLabel)}</a></aside>`
    : '';
  // W618C: Command Room is now the default direct-City orientation layer.
  // The older first-run path review remains available from tests/legacy flows, but
  // it no longer covers the direct cockpit on first launch.
  // W602 — direct entry keeps only high-frequency player decisions visible:
  // companion, explicit voice choice, native chat, districts, Command Deck and
  // the complete control sheet. No generic interaction button remains.
  const directHudActions = '<button type="button" data-eon-play-orbit-restore hidden aria-pressed="true">Show Orbit</button><button type="button" data-eon-play-open-controls aria-haspopup="dialog">More</button>';
  const commandWorldPlan = buildEonCityCommandWorldPlan({ includeScores: true });
  const livingDashboardSnapshot = buildEonCityLivingDashboard({
    projectPortalCount: projectDistrictSnapshot.activeCount,
    shareLedgerLive: false,
    agentSignalSnapshot
  });
  const agentTheaterSnapshot = buildEonCityAgentTheater({ agentSignalSnapshot });
  const agentTheaterStage = buildEonCityAgentTheaterStage(agentTheaterSnapshot);
  const commandRoomModel = getEonCityCommandRoomModel({
    dashboardSignals: renderEonCityLivingDashboardSignals(livingDashboardSnapshot),
    dormantAgents: renderEonCityAgentTheaterAgents(agentTheaterSnapshot),
    agentTheaterStage: renderEonCityAgentTheaterStage(agentTheaterStage)
  });
  const commandRoomMarkup = directEntry ? renderEonCityCommandRoomMarkup(commandRoomModel) : '';
  const openSkyProfileOptions = buildOpenSkyProfileOptions(selectedOpenSkyProfileId);
  const directBrandMarkup = `<p class="eon-play-kicker">EON City · Spatial Living Nexus</p><h1 id="eon-play-session-title">Command District</h1><p data-eon-play-status><strong data-eon-play-status-headline>Starting City…</strong><span data-eon-play-status-detail>Loading the local renderer and truthful product state.</span></p><p class="eon-city-runtime-objective"><strong data-eon-play-objective>Find the Living Nexus Gateway</strong><span data-eon-play-nearby>Follow the cyan-gold threshold from Arrival Plaza. Inspect first; entry is always separate.</span></p>${nexusContinuityMarkup}<p class="eon-play-input-status" data-eon-play-input-status hidden>Input status</p><p class="eon-play-live-crew" data-eon-play-live-crew hidden>Activity status</p><p class="eon-play-result-relay" data-eon-play-result-relay hidden></p><p class="eon-play-sensory-status" data-eon-play-sensory-status hidden>${escapeHtml(describeSensoryPreferences(sensory))}</p><p class="eon-play-soundscape-status" data-eon-play-soundscape-status hidden>${escapeHtml(soundscapeMessage || 'Sound remains optional.')}</p>`;
  const manualBrandMarkup = `<p class="eon-play-kicker">EON City · Immersive Work Mode</p><h1 id="eon-play-session-title">Neon Command District</h1><p data-eon-play-status><strong data-eon-play-status-headline>Starting local renderer…</strong><span data-eon-play-status-detail>No automatic work or navigation is running.</span></p><p class="eon-play-input-status" data-eon-play-input-status>Keyboard, touch and controller support are loading locally.</p><p class="eon-play-live-crew" data-eon-play-live-crew>Live crew · waiting for a recorded task.</p><p class="eon-play-result-relay" data-eon-play-result-relay hidden></p><p class="eon-play-sensory-status" data-eon-play-sensory-status>${escapeHtml(describeSensoryPreferences(sensory))}</p><p class="eon-play-soundscape-status" data-eon-play-soundscape-status>${escapeHtml(soundscapeMessage || 'Soundscape remains optional and local.')}</p>`;
  const manualHudActions = `<button type="button" data-eon-play-enter-fullscreen>Enter full screen</button><button type="button" data-eon-play-open-controls>Controls</button><button type="button" data-eon-play-open-travel-map>City map</button><button type="button" data-eon-play-toggle-map aria-pressed="true">Map</button><button type="button" data-eon-play-toggle-click-move aria-pressed="false">Click move: off</button><button type="button" data-eon-play-toggle-pointer-look aria-pressed="false">Pointer look: off</button><button type="button" data-eon-play-camera-cycle>Camera view</button><button type="button" data-eon-play-camera-reset>Camera reset</button><button type="button" data-eon-play-reset-view>Reset view</button><button type="button" data-eon-play-unstuck>Unstuck</button><button type="button" data-eon-play-open-guide>Guide</button><button type="button" data-eon-play-orbit-restore hidden aria-pressed="true">Show Orbit</button><button type="button" data-eon-play-open-companion>Meet EONBOT</button><button type="button" data-eon-play-open-eonbot>EONBOT</button><button type="button" data-eon-play-open-command-deck>Command Deck</button><button type="button" data-eon-play-open-creator-atrium>Creator Atrium</button><button type="button" data-eon-play-open-living-nexus>Nexus details</button><button type="button" data-eon-play-open-universe>Universe</button><button type="button" data-eon-play-open-settings>Settings</button><button type="button" data-eon-play-open-performance-lab>Device Lab</button><button type="button" data-eon-play-open-work>Work signals</button><button type="button" data-eon-play-open-project-districts>Project Portals</button><button type="button" data-eon-play-open-membership>Membership map</button><button type="button" data-eon-play-open-fairness>Fair Play</button><button type="button" data-eon-play-open-cosmetics>Appearance Vault</button><a href="/" data-eon-play-manage-chat>Manage work</a><a href="/profile?returnTo=%2Feoncity#eon-profile-account-foundation">Account &amp; settings</a>${previewAction}<button type="button" data-eon-play-pause>Pause</button><button type="button" data-eon-play-exit-fullscreen>Exit full screen</button><a href="/eoncity" data-eon-play-exit-city aria-label="Restart EON City">Restart EON City</a>`;
  const previewPanel = previewMode ? `<section class="eon-play-preview-panel" data-eon-play-preview-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-preview-title"><div class="eon-play-preview-card"><p class="eon-play-kicker">W259 · local preview evidence</p><h2 id="eon-play-preview-title">Device task study</h2><p>Mark only steps you actually observed. This record stays in this browser until you explicitly export a redacted JSON file.</p><p data-eon-play-preview-summary></p><div class="eon-play-preview-tasks">${CITY_PREVIEW_TASKS.map((task) => `<button type="button" data-eon-preview-task="${escapeHtml(task)}">${escapeHtml(task.replaceAll('-', ' '))}</button>`).join('')}</div><div class="eon-play-preview-actions"><button type="button" data-eon-preview-export>Export local evidence</button><button type="button" data-eon-play-close-preview>Close</button></div></div></section>` : '';
  const arrivalCompass = directEntry ? `<aside class="eon-play-arrival-compass" data-eon-play-arrival-compass${cityFirstRunVisible ? ' hidden' : ''} aria-label="EON City arrival compass"><div class="eon-play-arrival-compass-head"><p class="eon-play-kicker">Command Horizon · local wayfinding</p><button type="button" data-eon-play-compass-collapse aria-expanded="true">Minimise</button></div><div data-eon-play-compass-body><strong data-eon-play-compass-title>Start with one waypoint.</strong><span data-eon-play-compass-detail>Follow the cyan-gold Living Nexus signal first, or choose another route. Nothing opens automatically.</span><div class="eon-play-arrival-compass-actions"><button type="button" data-eon-play-compass-guide>Guide to Nexus Gateway</button><button type="button" data-eon-play-compass-start>Choose a route</button><button type="button" data-eon-play-compass-deck>Open Command Deck</button></div></div></aside>` : '';
  const overlayInputContract = getEonCityOverlayInputIsolationContract();
  root.dataset.eonCityOverlayInputContract = overlayInputContract.schema;
  root.dataset.eonCityPlayState = 'loading';
  setCityRouteState(root, 'booting');
  root.dataset.eonCityFirstFrame = 'pending';
  root.classList.remove('eon-city-first-frame-ready');
  root.classList.add('eon-city-first-frame-pending');
  root.innerHTML = `
    <section class="eon-play-session" aria-labelledby="eon-play-session-title">
      <div class="eon-play-canvas-host" data-eon-play-canvas-host></div>
      <div class="eon-city-first-frame-shield" data-eon-city-first-frame-shield aria-live="polite"><span class="eon-city-first-frame-orb" aria-hidden="true"></span><strong data-eon-city-first-frame-label>${escapeHtml(cityLoadSequence.getSnapshot().label)}</strong><span data-eon-city-first-frame-detail>${escapeHtml(cityLoadSequence.getSnapshot().detail)}</span><div class="eon-city-first-frame-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${cityLoadSequence.getSnapshot().progress}"><span data-eon-city-first-frame-progress-bar style="width:${cityLoadSequence.getSnapshot().progress}%"></span></div><small data-eon-city-first-frame-cache>${escapeHtml(describeEonCityAssetCacheStatus(cityLoadSequence.getSnapshot().cache || {}))}</small></div>
      <header class="eon-play-hud eon-play-hud-top${directEntry ? ' eon-play-hud-direct' : ''}">
        <div class="eon-play-brand">${directEntry ? directBrandMarkup : manualBrandMarkup}</div>
        <div class="eon-play-hud-actions">${directEntry ? directHudActions : manualHudActions}</div>
      </header>
      <div class="eon-play-orientation-note" data-eon-play-orientation-note><strong>Landscape is recommended.</strong> Rotate your device for the widest view. EONAPP cannot force orientation in every browser.</div>
      <aside class="eon-play-orbit-guide" data-eon-play-orbit-guide data-eon-play-orbit-state="follow" aria-live="polite" aria-label="EONBOT Orbit local guidance">
        <div class="eon-play-orbit-copy"><small data-eon-play-orbit-state-label>follow · captions first</small><strong data-eon-play-orbit-title>EONBOT Orbit</strong><span data-eon-play-orbit-caption>Local Command District guidance is starting. Nothing opens automatically.</span></div>
        <div class="eon-play-orbit-actions"><button type="button" data-eon-play-orbit-mute aria-pressed="true">Voice muted</button><button type="button" data-eon-play-orbit-less aria-pressed="false">Show less guidance</button><button type="button" data-eon-play-orbit-help>Help</button><button type="button" data-eon-play-orbit-dismiss>Dismiss</button></div>
      </aside>
      ${commandRoomMarkup}
      <section class="eon-play-first-run-panel" data-eon-play-first-run-panel ${directEntry && cityFirstRunVisible ? '' : 'hidden'} role="dialog" aria-modal="true" aria-labelledby="eon-play-first-run-title">
        <div class="eon-play-first-run-card">
          <p class="eon-play-kicker">EON City · start here</p>
          <h2 id="eon-play-first-run-title">Choose one simple path.</h2>
          <p>City is your visual workspace. Start from the Command Room, choose a district, or share EONAPP. The full work stays in the native surface after your tap.</p>
          <div class="eon-play-first-run-grid" data-eon-play-first-run-choices>${EON_CITY_FIRST_RUN_PATHS.map((path) => `<button type="button" data-eon-play-first-run-path="${escapeHtml(path.id)}"><strong>${escapeHtml(path.label)}</strong><span>${escapeHtml(path.detail)}</span><small>Open review →</small></button>`).join('')}</div>
          <section class="eon-play-first-run-review" data-eon-play-first-run-review hidden aria-live="polite"></section>
          <button type="button" data-eon-play-close-start-here>Explore City first</button>
        </div>
      </section>
      <section class="eon-play-controls-panel eon-play-menu-panel" data-eon-play-controls-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-controls-title"><div class="eon-play-controls-card eon-play-menu-card"><p class="eon-play-kicker">EON City · menu</p><h2 id="eon-play-controls-title">Keep exploring. Choose only what you need.</h2><p>Everything here is local and reversible. Work, account changes, providers, publishing and payments always stay in their own clearly reviewed surfaces.</p>
        <details class="eon-play-menu-group" open data-eon-play-menu-section="explore"><summary>Explore City</summary><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-open-living-nexus>Nexus details</button><button type="button" data-eon-play-open-travel-map>City map</button><button type="button" data-eon-play-open-district-guide>District guide</button><button type="button" data-eon-play-reset-view>Reset view</button><button type="button" data-eon-play-unstuck>Unstuck</button><button type="button" data-eon-play-pause>Pause City</button></div></details>
        <details class="eon-play-menu-group" data-eon-play-menu-section="movement"><summary>Movement &amp; display</summary><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-enter-fullscreen>Full screen</button><button type="button" data-eon-play-toggle-map aria-pressed="${directEntry ? 'false' : 'true'}">${directEntry ? 'Mini map: off' : 'Mini map'}</button><button type="button" data-eon-play-toggle-touch-dpad aria-pressed="false">Touch controls</button><button type="button" data-eon-play-toggle-pointer-look aria-pressed="false">Pointer look: off</button><button type="button" data-eon-play-camera-cycle>Cycle camera</button><button type="button" data-eon-play-camera-reset>Follow camera</button><button type="button" data-eon-play-toggle-click-move aria-pressed="false">Click-to-move: off</button></div><div class="eon-play-controls-card-actions" aria-label="Wayfinder local poses"><button type="button" data-eon-play-wayfinder-state="inspect">Inspect pose</button><button type="button" data-eon-play-wayfinder-state="celebrate">Celebrate pose</button><button type="button" data-eon-play-wayfinder-state="sit-work">Sit/work pose</button><button type="button" data-eon-play-wayfinder-state="recovery">Recovery pose</button></div><div class="eon-play-menu-controls-guide" aria-label="City controls · local only"><p><strong>City controls · local only</strong></p><p>Use WASD or arrow keys to move: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>. On a controller, use the left stick or D-pad. Touch controls remain optional.</p><p><kbd>M</kbd> toggles the Mini map. <kbd>E</kbd> or <kbd>Space</kbd> focuses a nearby landmark card. From the card, choose Enter, Guide, Quick Open or Inspect yourself. <kbd>L</kbd> requests Pointer look after your gesture; <kbd>C</kbd> cycles Follow/shoulder/close/wide camera views and <kbd>R</kbd> returns to Follow. Standard mouse drag remains available.</p><p>W618A default: mouse travel is on for direct City. Click a visible district signal to inspect it, or click the floor to move. It never confirms a work route. Separate confirmation is still required.</p></div></details>
        <details class="eon-play-menu-group" data-eon-play-menu-section="work" open><summary>Command Room, work &amp; share</summary><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-open-eonbot>EONBOT planner</button><button type="button" data-eon-play-open-capture>Creator Capture</button><button type="button" data-eon-play-open-work-paths>Work paths</button><button type="button" data-eon-play-open-command-deck>Command Deck</button><button type="button" data-eon-play-open-creator-atrium>Creator Atrium</button><button type="button" data-eon-play-open-project-districts>Project portals</button><button type="button" data-eon-play-share-city>Share City invite</button><button type="button" data-eon-play-open-mission-board>Route notes</button><button type="button" data-eon-play-open-companion>About EONBOT</button></div></details>
        <details class="eon-play-menu-group" data-eon-play-menu-section="appearance"><summary>Appearance &amp; accessibility</summary><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-open-settings>Graphics &amp; sound</button><button type="button" data-eon-play-open-cosmetics>Appearance</button><button type="button" data-eon-play-open-voice-consent>Voice &amp; captions</button></div></details>
        <details class="eon-play-menu-group" data-eon-play-menu-section="trust"><summary>Trust, access &amp; proof</summary><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-open-fairness>Fair Play &amp; privacy</button><button type="button" data-eon-play-open-membership>Access map</button><button type="button" data-eon-play-open-performance-lab>Device Lab</button><button type="button" data-eon-play-open-cast-certification>Cast status</button><button type="button" data-eon-play-open-universe>City status</button></div></details>
        <section class="eon-play-command-world-note" data-eon-city-command-world-plan><strong>Approved City direction</strong><span>${escapeHtml(commandWorldPlan.approvedDirection)} · current wave: ${escapeHtml(commandWorldPlan.roadmap.find((wave) => wave.codingNow)?.id || 'w618a')}</span><span>Command Room first, Living Dashboard second, Agent Theater later. Existing districts and assets stay.</span></section><p class="eon-play-menu-note">Need a work destination? Start with EONBOT or Command Room. Need control help? Open one section, make one change, then return to City.</p><button type="button" data-eon-play-close-controls>Back to City</button></div></section>
      <section class="eon-play-controls-panel eon-play-settings-panel" data-eon-play-settings-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-settings-title"><div class="eon-play-controls-card eon-play-settings-card"><p class="eon-play-kicker">City settings · local only</p><h2 id="eon-play-settings-title">Make City yours</h2><p>Full screen, sound and vibration remain off unless you choose them. Visual changes are saved locally and apply on your next City entry. Visual quality changes are saved locally and apply on your next City entry. The selected open-sky profile is a session-only visual style: it applies now, ends when City closes, and is not time, weather, or a forecast. W572 sound choices remain only in this City session.</p><div class="eon-play-settings-grid"><label>Visual profile<select data-eon-play-settings-quality>${buildQualityOptions(selectedQuality)}</select></label><label>Open-sky visual style<select data-eon-play-settings-open-sky>${openSkyProfileOptions}</select></label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-reduced ${reducedEffects || capability.reducedMotion ? 'checked' : ''}> Reduce visual effects</label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-sound ${sensory.sound ? 'checked' : ''}> Sound cues after actions</label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-haptics ${sensory.haptics ? 'checked' : ''}> Vibration after actions</label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-ambience ${soundscapePrefs.ambience ? 'checked' : ''}> Local procedural ambience</label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-ui ${soundscapePrefs.ui ? 'checked' : ''}> Local UI tones</label><label class="eon-play-settings-volume">Sound level <input type="range" min="0" max="100" value="55" step="5" data-eon-play-settings-volume aria-describedby="eon-play-settings-volume-value"><output id="eon-play-settings-volume-value" data-eon-play-settings-volume-value>55%</output></label><label class="eon-play-settings-check"><input type="checkbox" data-eon-play-settings-reduced-sensory ${soundscapePrefs.reducedSensory ? 'checked' : ''}> Reduced sensory mode</label></div><p class="eon-play-settings-status" data-eon-play-settings-status>Visual settings are stored on this device. Sound choices remain only until you leave City. Nothing is uploaded.</p><p class="eon-play-settings-status" data-eon-play-soundscape-policy-status>Sound is off. Captions and City visuals remain complete.</p><div class="eon-play-settings-actions"><button type="button" data-eon-play-soundscape-enable>Turn on local sound</button><button type="button" data-eon-play-soundscape-mute disabled>Mute sound</button><button type="button" data-eon-play-soundscape-stop disabled>Stop sound</button><button type="button" data-eon-play-settings-save>Save visual settings</button><button type="button" data-eon-play-close-settings>Close</button></div></div></section>
      <section class="eon-play-command-deck-panel" data-eon-play-command-deck-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-command-deck-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · Command Deck</p><h2 id="eon-play-command-deck-title">One room. Your next move.</h2><p data-eon-play-command-deck-summary>${escapeHtml(getCommandDeckPrimarySummary().detail)}</p><div class="eon-play-command-deck-grid eon-play-command-deck-primary-grid">${getCommandDeckPrimaryCards().map((card) => `<button type="button" data-eon-play-command-deck-card="${escapeHtml(card.id)}" data-eon-play-command-deck-accent="${escapeHtml(card.accent)}"><strong>${escapeHtml(card.label)}</strong><span>${escapeHtml(card.detail)}</span><small>Review station →</small></button>`).join('')}</div><section class="eon-play-command-deck-project-portal" aria-label="Private project districts"><p class="eon-play-kicker">Private project districts</p><strong>${escapeHtml(projectDistrictPortalLabel)}</strong><span>Only a reviewed label and approved City-safe cards can appear in the world. Project files, prompts, keys and private notes stay out.</span><button type="button" data-eon-play-open-project-districts>Open Project Portals</button></section><section class="eon-play-command-deck-detail" data-eon-play-command-deck-detail aria-live="polite"><p>Select a City station to review its local action.</p></section><p class="eon-play-command-deck-note">The Deck keeps five core work stations in view. Route notes and City settings stay in Menu. It never reads private work, sends data, publishes, rewards, or opens a native route without your second visible click.</p><button type="button" data-eon-play-close-command-deck>Return to explore</button></div></section>
      ${renderEonCityUniverseCompletionPanel()}
      ${renderEonCityLivingNexusPanel()}
      <section class="eon-play-command-deck-panel eon-play-authored-slice-panel" data-eon-play-authored-slice-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-authored-slice-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · authored vertical slice</p><h2 id="eon-play-authored-slice-title">Arrival → Command → Creator → Forge</h2><p>${escapeHtml(getCityAuthoredVerticalSliceSummary({ quality: selectedQuality }).title)}. These are source-controlled original vector/procedural surfaces; final binary art and real-device review remain separate gates.</p><div class="eon-play-command-deck-grid eon-play-authored-slice-grid">${getCityAuthoredVerticalSlicePlan({ quality: selectedQuality }).regions.map((region) => `<article data-eon-play-authored-slice-card="${escapeHtml(region.id)}"><p class="eon-play-kicker">${escapeHtml(region.chapter)}</p><h3>${escapeHtml(region.title)}</h3><p>${escapeHtml(region.detail)}</p><button type="button" data-eon-play-focus-authored-slice="${escapeHtml(region.id)}">Focus in City</button></article>`).join('')}</div><p class="eon-play-command-deck-note">Focus only moves the local camera/player. It does not open a route, read a project, send data, or execute work.</p><button type="button" data-eon-play-close-authored-slice>Return to City</button></div></section>
      ${renderEonProjectDistrictWorkspace(projectDistrictSnapshot)}
      ${renderEonCityMembershipMap()}
      ${renderEonCityFairnessSafety()}
      ${renderEonCityTravelResume()}
      ${renderEonCityVaultReveals()}
      <section class="eon-play-command-deck-panel eon-play-mission-board-panel" data-eon-play-mission-board-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-mission-board-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · Mission Board</p><h2 id="eon-play-mission-board-title">A local route, not a fabricated worker feed.</h2><div data-eon-play-mission-board-content></div><p class="eon-play-command-deck-note">Mission Board reads only safe local City progress markers. It does not start work, connect a service, publish, grant a value, or display private project content.</p><button type="button" data-eon-play-close-mission-board>Return to Command Deck</button></div></section>
      <section class="eon-play-command-deck-panel eon-play-creator-atrium-panel" data-eon-play-creator-atrium-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-creator-atrium-title"><div class="eon-play-command-deck-card eon-play-creator-atrium-card"><p class="eon-play-kicker">EON City · Creator Atrium</p><h2 id="eon-play-creator-atrium-title">Create, build, review—then return to City.</h2><p data-eon-play-creator-atrium-summary>${escapeHtml(getCityCreatorAtriumSummary().detail)}</p><div class="eon-play-command-deck-grid eon-play-creator-atrium-grid">${getCityCreatorAtriumCards().map((card) => `<a href="${escapeHtml(card.route)}" data-eon-play-creator-atrium-route="${escapeHtml(card.id)}" data-eon-play-creator-atrium-accent="${escapeHtml(card.accent)}"><strong>${escapeHtml(card.label)}</strong><span>${escapeHtml(card.detail)}</span><small>Open after your click →</small></a>`).join('')}</div><p class="eon-play-command-deck-note">Creator Atrium is a local City launch board. It does not show projects, files, keys, media, private chat, account state, model output, or provider status. Full creation and coding remain in their native surfaces.</p><button type="button" data-eon-play-close-creator-atrium>Return to City</button></div></section>
      <section class="eon-play-command-deck-panel eon-play-metropolis-panel" data-eon-play-metropolis-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-metropolis-title"><div class="eon-play-command-deck-card eon-play-metropolis-card"><p class="eon-play-kicker">EON City · Living Creator Metropolis</p><h2 id="eon-play-metropolis-title">Choose a district, then choose a native surface.</h2><p>The City only provides local wayfinding. It does not inspect projects, connect accounts, publish, run automations, or award rewards.</p><div class="eon-play-command-deck-grid eon-play-metropolis-grid">${EON_CITY_METROPOLIS_DISTRICTS.map((district) => `<article data-eon-play-metropolis-card="${escapeHtml(district.id)}"><strong>${escapeHtml(district.title)}</strong><span>${escapeHtml(district.description)}</span><div>${district.launches.map((launch) => `<a href="${escapeHtml(launch.route)}" data-eon-play-metropolis-route="${escapeHtml(district.id)}" data-eon-play-metropolis-launch="${escapeHtml(launch.id)}">${escapeHtml(launch.label)} →</a>`).join('')}</div><button type="button" data-eon-play-focus-metropolis="${escapeHtml(district.id)}">Focus in City</button></article>`).join('')}</div><p class="eon-play-command-deck-note">These are static public district cards. Your click is required for every focus or native-route action.</p><button type="button" data-eon-play-close-metropolis>Return to City</button></div></section>
      <section class="eon-play-command-deck-panel eon-play-signal-expedition-panel" data-eon-play-signal-expedition-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-signal-expedition-title"><div class="eon-play-command-deck-card eon-play-signal-expedition-card"><p class="eon-play-kicker">W413 · finite local project worlds</p><h2 id="eon-play-signal-expedition-title">Signal Expeditions</h2><p>Choose an authored 5–15 minute planning route. EON City only keeps the selected label in this browser session; it does not read a project, upload files, connect social accounts, run providers, schedule work, publish, track people, or issue rewards.</p><div data-eon-play-signal-expedition-content></div><button type="button" data-eon-play-close-signal-expedition>Return to City</button></div></section>
      <section class="eon-play-guide-panel" data-eon-play-guide-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-guide-title"><div class="eon-play-guide-card"><div data-eon-play-guide-content></div><button type="button" data-eon-play-close-guide>Close guide</button></div></section>
      <section class="eon-play-guide-panel" data-eon-play-companion-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-companion-title"><div class="eon-play-guide-card"><div data-eon-play-companion-content></div><button type="button" data-eon-play-close-companion>Close companion</button></div></section>
      <section class="eon-play-guide-panel" data-eon-play-voice-consent-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-voice-consent-title"><div class="eon-play-guide-card"><div data-eon-play-voice-consent-content></div><button type="button" data-eon-play-close-voice-consent>Close voice review</button></div></section>
      <section class="eon-play-command-deck-panel" data-eon-play-work-paths-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-work-paths-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · useful work paths</p><h2 id="eon-play-work-paths-title">Choose a useful work path</h2><p>Creator, Builder, Operator, Analyst and Guardian paths are core City wayfinding. They are not subscriptions, rewards, XP, task execution, or a claim that City knows your private work.</p><div class="eon-play-command-deck-grid" data-eon-play-work-paths-cards>${getEonCityUsefulWorkPaths().map((path) => `<button type="button" data-eon-play-work-path="${escapeHtml(path.id)}"><strong>${escapeHtml(path.label)}</strong><span>${escapeHtml(path.district)}</span><small>${escapeHtml(path.detail)}</small></button>`).join('')}</div><section class="eon-play-command-deck-detail" data-eon-play-work-paths-review aria-live="polite"></section><p class="eon-play-command-deck-note">Future maintained premium districts may be planned separately, but no paid district, pricing, entitlement, or checkout is active here.</p><button type="button" data-eon-play-close-work-paths>Return to City</button></div></section>
      <section class="eon-play-eonbot-panel" data-eon-play-eonbot-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-eonbot-title"><div class="eon-play-eonbot-card"><p class="eon-play-kicker">EONBOT · local work routing</p><h2 id="eon-play-eonbot-title">Choose a work lane</h2><p>City prepares only a local review-needed planning receipt. A note typed here is not stored or forwarded; enter full detail in the native surface after you review.</p><label>Optional private reminder <input data-eon-play-eonbot-note maxlength="180" autocomplete="off" placeholder="Not stored or forwarded" /></label><div class="eon-play-eonbot-intents">${getCityWorkLoopIntents().map((intent) => `<button type="button" data-eon-play-work-intent="${escapeHtml(intent.id)}"><strong>${escapeHtml(intent.label)}</strong><span>${escapeHtml(intent.detail)}</span></button>`).join('')}</div><div data-eon-play-eonbot-review aria-live="polite"></div><button type="button" data-eon-play-close-eonbot>Close EONBOT</button></div></section>
      <section class="eon-play-performance-lab" data-eon-play-performance-lab hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-performance-lab-title"><div class="eon-play-performance-lab-card"><p class="eon-play-kicker">City Performance Lab · manual local checklist</p><h2 id="eon-play-performance-lab-title">Record a real device observation</h2><p>Only mark a case after you test it yourself. This panel never probes a device, uploads a screenshot, sends telemetry, or certifies the City.</p><div data-eon-play-performance-lab-content></div><div class="eon-play-performance-lab-actions"><button type="button" data-eon-play-performance-export>Export local checklist</button><button type="button" data-eon-play-close-performance-lab>Close Device Lab</button></div></div></section>
      <section class="eon-play-performance-lab eon-play-validation-lab" data-eon-play-validation-lab hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-validation-lab-title"><div class="eon-play-performance-lab-card eon-play-validation-lab-card"><p class="eon-play-kicker">W410 · City Validation Lab · manual local checklist</p><h2 id="eon-play-validation-lab-title">Record what you actually observed</h2><p>This is a local human checklist for City controls and visual conditions. It never probes a device, reads screenshots or video, uploads evidence, marks a pass automatically or certifies the City.</p><div data-eon-play-validation-lab-content></div><div class="eon-play-performance-lab-actions"><button type="button" data-eon-play-open-validation-device-lab>Open Device Lab</button><button type="button" data-eon-play-validation-export>Export local checklist</button><button type="button" data-eon-play-validation-export-mobile-share-proof>Export mobile + share packet</button><button type="button" data-eon-play-validation-clear>Clear local checklist</button><button type="button" data-eon-play-close-validation-lab>Close Validation Lab</button></div></div></section>
      <section class="eon-play-controls-panel eon-play-cast-certification-panel" data-eon-play-cast-certification-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-cast-certification-title"><div class="eon-play-controls-card eon-play-cast-certification-card"><p class="eon-play-kicker">W662G · cast truth</p><h2 id="eon-play-cast-certification-title">Shipped cast and animation status</h2><p>This roster separates source/hash proof from what this browser actually loaded. It never marks model appearance, fallback replacement, animation quality, NPC role or terminal/dock behavior as accepted without observation.</p><div data-eon-play-cast-certification-content></div><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-close-cast-certification>Close cast status</button></div></div></section>
      <section class="eon-play-controls-panel eon-play-art-review-panel" data-eon-play-art-review-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-art-review-title"><div class="eon-play-controls-card eon-play-art-review-card"><p class="eon-play-kicker">W421 · Original City art · local review</p><h2 id="eon-play-art-review-title">Art direction and cinematic views</h2><p>The panel shows the source-controlled art actually included in this City build. No screenshot, video, upload or device probe is created here. This is not final binary art or visual certification.</p><div data-eon-play-art-review-content></div><div class="eon-play-controls-card-actions"><button type="button" data-eon-play-close-art-review>Close art review</button></div></div></section>
      <section class="eon-play-work-panel" data-eon-play-work-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-work-title"><div class="eon-play-work-card"><div data-eon-play-work-content></div><div class="eon-play-work-actions"><button type="button" data-eon-play-work-visibility></button><button type="button" data-eon-play-work-detail></button><button type="button" data-eon-play-close-work>Close work signals</button></div></div></section>
      <div class="eon-play-hud eon-play-hud-objective" data-eon-play-objective-panel${directEntry ? ' hidden' : ''}><p class="eon-play-kicker">First Circuit · route review</p><strong data-eon-play-objective>Find a district signal</strong><span data-eon-play-nearby>Click or tap a named City signal to inspect it. Nothing opens automatically.</span></div>
      ${arrivalCompass}
      <aside class="eon-play-living-nexus-gateway" data-eon-play-living-nexus-gateway data-eon-w712-state="distant" hidden aria-live="polite" aria-label="Flagship Expanse physical gateway">
        <header><small>FLAGSHIP OPEN WORLD · PHYSICAL GATEWAY</small><strong data-eon-play-gateway-title>The Expanse</strong><span data-eon-play-gateway-distance>Follow the cyan-gold approach road</span></header>
        <p data-eon-play-gateway-copy>Review once, then choose Enter the Expanse. Nothing enters or travels automatically.</p>
        <div class="eon-play-gateway-actions"><button type="button" data-eon-play-gateway-guide>Guide to review lane</button><button type="button" data-eon-play-gateway-inspect hidden>Inspect gateway</button><button type="button" data-eon-play-gateway-enter hidden>Enter the Expanse</button><button type="button" data-eon-play-gateway-map-toggle aria-expanded="false">Compact map</button><button type="button" data-eon-play-open-living-nexus>Nexus details</button></div>
        <div class="eon-play-gateway-map" data-eon-play-gateway-map hidden><strong>Living Nexus destinations</strong><span><b>Core</b> · connected City districts</span><span><b>Expanse</b> · discoveries, Atlas and physical Realm signals</span><span><b>My Realm</b> · verified transformations only</span><small>The gateway is the primary Expanse entrance. This map never moves you automatically.</small></div>
      </aside>
      <section class="eon-play-landmark-panel" data-eon-play-landmark-panel hidden aria-live="polite"></section>
      <aside class="eon-play-approach-prompt" data-eon-play-approach-prompt hidden aria-live="polite" aria-label="Nearby City landmark"></aside>
      <section class="eon-play-district-card" data-eon-play-district-card aria-live="polite"></section>
      <section class="eon-play-command-room-strip" data-eon-play-command-room-strip aria-label="EON City primary controls"><button type="button" data-eon-play-context-action-proxy>Interact</button><button type="button" data-eon-play-open-travel-map>Districts</button><button type="button" data-eon-play-open-eonbot>EONBOT</button><button type="button" data-eon-play-open-controls aria-haspopup="dialog">More</button></section>
      <section class="eon-play-minimap" data-eon-play-minimap aria-label="Local City map"><canvas data-eon-play-minimap-canvas width="180" height="180" aria-label="Local Neon Command District map"></canvas><p>Local map · no work data</p></section>
      <div class="eon-play-mobile-controls" aria-label="Touch movement controls"><div class="eon-play-joystick" data-eon-play-joystick role="group" aria-label="Analogue touch joystick"><span class="eon-play-joystick-core" aria-hidden="true"></span><span class="eon-play-joystick-knob" data-eon-play-joystick-knob aria-hidden="true"></span><span class="eon-play-joystick-label" aria-hidden="true">Move</span></div><div class="eon-play-touch-controls" data-eon-play-touch-dpad hidden aria-label="Alternative touch direction controls"><button type="button" data-play-move="up" aria-label="Move forward">▲</button><button type="button" data-play-move="left" aria-label="Move left">◀</button><button type="button" data-play-move="down" aria-label="Move back">▼</button><button type="button" data-play-move="right" aria-label="Move right">▶</button></div></div>
      <div class="eon-play-actions"><button type="button" data-eon-play-context-action disabled>Select a district</button>${previewMode ? '<button type="button" data-eon-play-save-proof>Save local frame note</button>' : ''}</div>
      <section class="eon-play-action-review" data-eon-play-action-review hidden aria-live="polite"></section>
      ${previewPanel}
      <div class="eon-play-proof-status" data-eon-play-proof-status aria-live="polite"${previewMode ? '' : ' hidden'}>${immersion.fullscreen ? 'Full screen requested.' : 'Browser display mode remains available.'} ${immersion.orientation ? 'Landscape lock requested.' : ''}</div>
      <section class="eon-play-pause-panel" data-eon-play-pause-panel hidden aria-label="Paused Immersive Work Mode"><p class="eon-play-kicker">Paused locally</p><h2>Neon Command District paused</h2><p>Nothing is running in the background. Resume, restart City, or leave full screen.</p><div><button type="button" data-eon-play-resume>Resume</button><a href="/eoncity" data-eon-play-exit-city aria-label="Restart EON City">Restart City</a></div></section>
    </section>`;
  const host = root.querySelector('[data-eon-play-canvas-host]');
  const status = root.querySelector('[data-eon-play-status]');
  const unbindW696FocusReturn = bindEonCityW696FocusReturn(root);
  root.querySelectorAll('[data-eon-play-open-capture]').forEach((button) => button.addEventListener('click', () => {
    globalThis.dispatchEvent?.(new globalThis.CustomEvent(EON_CITY_W659G_CAPTURE_OPEN_EVENT));
  }));
  root.dataset.eonCityHudAuthority = 'w696-four-primary-plus-more';
  const proofStatus = root.querySelector('[data-eon-play-proof-status]');
  const pausePanel = root.querySelector('[data-eon-play-pause-panel]');
  const contextActionButton = root.querySelector('[data-eon-play-context-action]');
  const gatewayPanel = root.querySelector('[data-eon-play-living-nexus-gateway]');
  const gatewayTitle = root.querySelector('[data-eon-play-gateway-title]');
  const gatewayDistance = root.querySelector('[data-eon-play-gateway-distance]');
  const gatewayCopy = root.querySelector('[data-eon-play-gateway-copy]');
  const gatewayGuide = root.querySelector('[data-eon-play-gateway-guide]');
  const gatewayInspect = root.querySelector('[data-eon-play-gateway-inspect]');
  const gatewayEnter = root.querySelector('[data-eon-play-gateway-enter]');
  const gatewayMapToggle = root.querySelector('[data-eon-play-gateway-map-toggle]');
  const gatewayMap = root.querySelector('[data-eon-play-gateway-map]');
  const objectivePanel = root.querySelector('[data-eon-play-objective-panel]');
  const objective = root.querySelector('[data-eon-play-objective]');
  const nearbyCopy = root.querySelector('[data-eon-play-nearby]');
  const landmarkPanel = root.querySelector('[data-eon-play-landmark-panel]');
  const approachPrompt = root.querySelector('[data-eon-play-approach-prompt]');
  const routeReview = root.querySelector('[data-eon-play-action-review]');
  const sensoryStatus = root.querySelector('[data-eon-play-sensory-status]');
  const soundscapeStatus = root.querySelector('[data-eon-play-soundscape-status]');
  const inputStatus = root.querySelector('[data-eon-play-input-status]');
  const minimap = root.querySelector('[data-eon-play-minimap]');
  const mapToggle = root.querySelector('[data-eon-play-toggle-map]');
  const touchDpad = root.querySelector('[data-eon-play-touch-dpad]');
  const touchDpadToggle = root.querySelector('[data-eon-play-toggle-touch-dpad]');
  const clickMoveToggle = root.querySelector('[data-eon-play-toggle-click-move]');
  const pointerLookToggles = [...root.querySelectorAll('[data-eon-play-toggle-pointer-look]')];
  const districtCard = root.querySelector('[data-eon-play-district-card]');
  let commandDistrictState = commandDistrictEntry?.state || readCommandDistrictState().state;
  let renderDistrictCard = () => {};
  let runtime = null;
  // Callbacks can fire during renderer mount. Start with an inert controller so
  // preview evidence never creates a temporal-dead-zone failure on a weak device.
  let previewController = Object.freeze({ enabled: false, event: () => {}, task: () => {}, save: () => {}, export: () => false });
  let nearbyLandmark = null;
  let nearbyLivingNexusOpportunity = null;
  let nearbyLivingNexusRealmSignal = null;
  let nearbyLivingNexusGateway = null;
  let livingNexusGatewayPrepared = false;
  let performanceProtected = false;
  let requestInteraction = () => {};
  let pauseSession = () => {};
  let toggleMinimap = () => {};
  let updateClickMove = () => {};
  let latestPointerLookState = null;
  let updatePointerLook = () => {};
  const statusHeadline = root.querySelector('[data-eon-play-status-headline]');
  const statusDetail = root.querySelector('[data-eon-play-status-detail]');
  const sessionTitle = root.querySelector('#eon-play-session-title');
  const onDistrictContext = (event) => {
    const detail = event?.detail || {};
    const label = String(detail.label || '').trim();
    if (!label) return;
    if (sessionTitle) sessionTitle.textContent = label;
    root.dataset.eonCityHudDistrict = String(detail.id || '');
    if (detail.reason !== 'product-layer-start' && !nearbyLivingNexusGateway && !nearbyLivingNexusRealmSignal && !nearbyLivingNexusOpportunity && !nearbyLandmark) {
      if (objective) objective.textContent = `Explore ${label}`;
      if (nearbyCopy) nearbyCopy.textContent = String(detail.purpose || 'Move through the district and approach an illuminated station to review its real function.');
    }
  };
  root.addEventListener('eon:city:district-context', onDistrictContext);
  lifecycle.own('w719-13-district-hud-context', () => root.removeEventListener('eon:city:district-context', onDistrictContext));
  const setStatus = (message) => {
    if (!status) return;
    const structured = structureEonCityW696Status(message);
    if (statusHeadline && statusDetail) {
      statusHeadline.textContent = structured.headline;
      statusDetail.textContent = structured.detail;
    } else status.textContent = `${structured.headline} ${structured.detail}`;
  };
  const qualitySummit = bindEonCityQualitySummit(root, {
    directEntry,
    getRuntime: () => runtime,
    onStatus: setStatus,
    onOpenStartHere: () => root.querySelector('[data-eon-play-open-start-here]')?.click(),
    onOpenCommandDeck: () => root.querySelector('[data-eon-play-open-command-room]')?.click() || root.querySelector('[data-eon-play-open-command-deck]')?.click()
  });
  lifecycle.own('quality-summit', qualitySummit);
  const acknowledgeSensoryAction = (cueId) => {
    const result = triggerCitySensoryFeedback(sensory, cueId);
    const soundscapeCue = soundscape.cue(cueId);
    if (sensoryStatus && (result.sound || result.haptics)) sensoryStatus.textContent = `${describeSensoryPreferences(sensory)} · optional feedback sent after your action`;
    if (soundscapeStatus && soundscapeCue) soundscapeStatus.textContent = 'Local UI sound played after your action. No audio was downloaded.';
  };
  const hideLandmarkPanel = () => {
    if (!landmarkPanel) return;
    landmarkPanel.hidden = true;
    landmarkPanel.textContent = '';
  };
  const hideApproachPrompt = () => {
    if (!approachPrompt) return;
    approachPrompt.hidden = true;
    approachPrompt.textContent = '';
  };
  const renderApproachPrompt = (landmark, approach = null) => {
    if (!approachPrompt || !directEntry || !landmark || approach?.inRange === false) {
      hideApproachPrompt();
      return false;
    }
    const interaction = getCityPlayInteraction(landmark.id);
    if (!interaction) {
      hideApproachPrompt();
      return false;
    }
    const label = interaction.title || landmark.label || 'City landmark';
    approachPrompt.hidden = false;
    approachPrompt.innerHTML = `<p class="eon-play-kicker">Nearby signal</p><strong>${escapeHtml(label)}</strong><span>Click/tap the world signal or review its local options. Nothing opens automatically.</span><div class="eon-play-approach-actions"><button type="button" data-eon-play-approach-review>Review ${escapeHtml(label)}</button><button type="button" data-eon-play-approach-guide>Guide</button></div>`;
    approachPrompt.querySelector('[data-eon-play-approach-review]')?.addEventListener('click', () => {
      renderLandmarkPanel(landmark, { source: 'world' });
    });
    approachPrompt.querySelector('[data-eon-play-approach-guide]')?.addEventListener('click', () => {
      const result = runtime?.guideToLandmark?.(interaction.id);
      if (result) setStatus(`${label} guide is active locally. Manual movement cancels it.`);
    });
    return true;
  };
  const renderLandmarkPanel = (landmark, { source = 'world' } = {}) => {
    const interaction = getCityPlayInteraction(landmark?.id);
    if (!landmarkPanel || !interaction) return false;
    const isNearby = nearbyLandmark?.id === interaction.id;
    const enterLabel = interaction.id === 'command-centre' ? 'Open Command Dock' : interaction.focusLabel;
    landmarkPanel.hidden = false;
    landmarkPanel.innerHTML = `<p class="eon-play-kicker">${escapeHtml(interaction.zone)} · local landmark</p><h2>${escapeHtml(interaction.title)}</h2><p>${escapeHtml(interaction.description)}</p><p class="eon-play-landmark-distance">${isNearby ? 'You are in range.' : 'Selected from the City. Guide or focus locally before you interact.'}</p><div class="eon-play-landmark-actions"><button type="button" data-eon-play-landmark-enter>${escapeHtml(enterLabel)}</button><button type="button" data-eon-play-landmark-guide>Guide me</button><button type="button" data-eon-play-landmark-quick-open>${escapeHtml(interaction.quickOpenLabel)}</button><button type="button" data-eon-play-landmark-inspect aria-expanded="false">Inspect</button></div><p class="eon-play-landmark-inspect" data-eon-play-landmark-inspect hidden>${escapeHtml(interaction.inspect)}</p><button type="button" class="eon-play-landmark-close" data-eon-play-landmark-close>Close</button>`;
    landmarkPanel.querySelector('[data-eon-play-landmark-enter]')?.addEventListener('click', () => {
      if (interaction.id === 'command-centre') root.querySelector('[data-eon-play-open-command-room]')?.click() || root.querySelector('[data-eon-play-open-command-deck]')?.click();
      else runtime?.focusLandmark?.(interaction.id);
      updateNearbyLandmark(runtime?.getNearestLandmark?.());
      if (interaction.id !== 'command-centre') hideLandmarkPanel();
    });
    landmarkPanel.querySelector('[data-eon-play-landmark-guide]')?.addEventListener('click', () => {
      const result = runtime?.guideToLandmark?.(interaction.id);
      if (result) setStatus(`${interaction.title} guide is active locally. Move manually at any time to cancel it.`);
      hideLandmarkPanel();
    });
    landmarkPanel.querySelector('[data-eon-play-landmark-quick-open]')?.addEventListener('click', () => {
      requestInteraction('landmark-card', interaction);
      hideLandmarkPanel();
    });
    landmarkPanel.querySelector('[data-eon-play-landmark-inspect]')?.addEventListener('click', (event) => {
      const detail = landmarkPanel.querySelector('[data-eon-play-landmark-inspect]');
      const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
      event.currentTarget.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      event.currentTarget.textContent = expanded ? 'Inspect' : 'Hide inspection';
      if (detail) detail.hidden = expanded;
    });
    landmarkPanel.querySelector('[data-eon-play-landmark-close]')?.addEventListener('click', hideLandmarkPanel);
    if (['world', 'mouse', 'touch', 'keyboard', 'controller'].includes(source)) landmarkPanel.querySelector('[data-eon-play-landmark-enter]')?.focus({ preventScroll: true });
    return true;
  };
  const getLivingNexusGatewayFlowState = (gateway = nearbyLivingNexusGateway) => gateway?.flowState || resolveEonCityW712FlagshipExpanseEntryState({
    gateway,
    destination: runtime?.getLivingNexusSummary?.()?.destination || 'core',
    prepared: livingNexusGatewayPrepared || gateway?.prepared === true
  });
  const renderNearbyLivingNexusGateway = () => {
    const gateway = nearbyLivingNexusGateway;
    if (!gateway) {
      if (gatewayPanel) gatewayPanel.hidden = true;
      return false;
    }
    const flowState = getLivingNexusGatewayFlowState(gateway);
    if (gatewayPanel) {
      gatewayPanel.hidden = false;
      gatewayPanel.dataset.eonW712State = flowState.id;
    }
    if (gatewayTitle) gatewayTitle.textContent = flowState.headline || gateway.label || 'The Expanse';
    if (gatewayDistance) gatewayDistance.textContent = `${Number(gateway.distance || 0).toFixed(1)} m · ${flowState.id === 'ready-to-enter' ? 'entry ready' : flowState.id === 'ready-to-review' ? 'review lane' : 'visible approach'}`;
    if (gatewayCopy) gatewayCopy.textContent = flowState.detail;
    if (gatewayGuide) {
      gatewayGuide.hidden = flowState.primaryAction !== 'guide';
      gatewayGuide.disabled = false;
      gatewayGuide.textContent = flowState.buttonLabel;
    }
    if (gatewayInspect) {
      gatewayInspect.hidden = flowState.primaryAction !== 'inspect';
      gatewayInspect.disabled = false;
      gatewayInspect.textContent = flowState.buttonLabel;
    }
    if (gatewayEnter) {
      gatewayEnter.hidden = flowState.primaryAction !== 'enter';
      gatewayEnter.disabled = false;
      gatewayEnter.textContent = flowState.buttonLabel;
    }
    if (objectivePanel && directEntry) objectivePanel.hidden = false;
    if (contextActionButton) {
      contextActionButton.disabled = false;
      contextActionButton.textContent = flowState.buttonLabel;
    }
    if (objective) objective.textContent = flowState.headline;
    if (nearbyCopy) nearbyCopy.textContent = flowState.detail;
    hideApproachPrompt();
    return true;
  };
  const updateNearbyLivingNexusGateway = (gateway) => {
    const previousId = nearbyLivingNexusGateway?.id || '';
    nearbyLivingNexusGateway = gateway || null;
    if (!nearbyLivingNexusGateway || (previousId && previousId !== nearbyLivingNexusGateway.id)) livingNexusGatewayPrepared = false;
    if (gateway?.prepared === true) livingNexusGatewayPrepared = true;
    root.dispatchEvent(new CustomEvent('eon:city:living-nexus:gateway-signal', { detail: nearbyLivingNexusGateway }));
    if (!renderNearbyLivingNexusGateway() && !renderNearbyLivingNexusRealmSignal() && !renderNearbyLivingNexusOpportunity()) updateNearbyLandmark(nearbyLandmark);
  };
  const guideLivingNexusGateway = () => {
    const result = runtime?.guideToLivingNexusPhysicalGateway?.({ explicitUserAction: true });
    if (!result?.ok) {
      setStatus('The Expanse review lane is not available yet. City remains active.');
      return result;
    }
    setStatus('Guidance is active to the Expanse review lane. Manual movement cancels it; entry never happens automatically.');
    return result;
  };
  const inspectLivingNexusGateway = () => {
    const result = runtime?.inspectLivingNexusPhysicalGateway?.({ explicitUserAction: true });
    if (!result?.ok) {
      setStatus(result?.reason === 'physical-gateway-out-of-range' ? 'Move closer to the Living Nexus Gateway before inspecting it.' : 'The physical gateway is not ready yet. City remains available.');
      return result;
    }
    livingNexusGatewayPrepared = true;
    updateNearbyLivingNexusGateway({ ...(runtime?.getNearestLivingNexusPhysicalGateway?.() || result.gateway || nearbyLivingNexusGateway), prepared: true });
    const orbitCaption = root.querySelector('[data-eon-play-orbit-caption]');
    if (orbitCaption) orbitCaption.textContent = result.gateway?.eonbotIntroduction || 'Gateway inspected. The Expanse contains discoveries, Atlas return points and physical Realm signals.';
    setStatus('Expanse gateway reviewed. Choose Enter the Expanse when ready; no extra movement step is required.');
    return result;
  };
  const enterLivingNexusGateway = () => {
    const result = runtime?.enterLivingNexusPhysicalGateway?.({ explicitUserAction: true });
    if (!result?.ok) {
      if (result?.reason === 'physical-gateway-inspection-required') {
        setStatus('Review the Expanse gateway once before choosing Enter.');
        return result;
      }
      setStatus('The Expanse entry could not complete. City remained safely in the Core.');
      return result;
    }
    livingNexusGatewayPrepared = false;
    updateNearbyLivingNexusGateway(null);
    if (gatewayPanel) gatewayPanel.hidden = true;
    const orbitCaption = root.querySelector('[data-eon-play-orbit-caption]');
    if (orbitCaption) orbitCaption.textContent = 'Welcome to the Expanse. Explore nearby cells, record discoveries in Atlas and look for physical Realm signals. The compact map is optional.';
    if (objective) objective.textContent = 'Explore the Expanse';
    if (nearbyCopy) nearbyCopy.textContent = 'Three nearby cells have distinct identities. Discover one, set an Atlas return point, or follow a physical Realm signal.';
    setStatus('Entered the Expanse through the physical Living Nexus Gateway. One City scene and one EONBOT remain active.');
    return result;
  };
  const renderNearbyLivingNexusRealmSignal = () => {
    const signal = nearbyLivingNexusRealmSignal;
    if (!signal) return false;
    const activeRealm = signal.signalType === 'realm-feature';
    const label = signal.label || signal.activeRealmId || (activeRealm ? 'Realm feature' : 'Rare Nexus portal');
    if (objectivePanel && directEntry) objectivePanel.hidden = false;
    if (contextActionButton) {
      contextActionButton.disabled = false;
      contextActionButton.textContent = activeRealm ? `Open Realm controls` : `Inspect ${label}`;
    }
    if (objective) objective.textContent = label;
    if (nearbyCopy) {
      nearbyCopy.textContent = activeRealm
        ? `${label} is nearby inside the authored Realm. Review it locally or use the immediate safe return.`
        : `${label} is a rare authored Realm signal. Inspect and prepare it before a separate entry confirmation.`;
    }
    hideApproachPrompt();
    setStatus(activeRealm ? `${label} found inside the curated Realm.` : `${label} portal found. Entry remains review-first and explicit.`);
    return true;
  };
  const updateNearbyLivingNexusRealmSignal = (signal) => {
    nearbyLivingNexusRealmSignal = signal || null;
    root.dispatchEvent(new CustomEvent('eon:city:living-nexus:realm-signal', { detail: nearbyLivingNexusRealmSignal }));
    if (!renderNearbyLivingNexusGateway() && !renderNearbyLivingNexusRealmSignal() && !renderNearbyLivingNexusOpportunity()) updateNearbyLandmark(nearbyLandmark);
  };
  const renderNearbyLivingNexusOpportunity = () => {
    if (nearbyLivingNexusRealmSignal) return false;
    const opportunity = nearbyLivingNexusOpportunity;
    if (!opportunity) return false;
    const label = opportunity.landmarkLabel || opportunity.specialistName || 'Expanse encounter';
    if (objectivePanel && directEntry) objectivePanel.hidden = false;
    if (contextActionButton) {
      contextActionButton.disabled = false;
      contextActionButton.textContent = `Inspect ${label}`;
    }
    if (objective) objective.textContent = label;
    if (nearbyCopy) nearbyCopy.textContent = `${opportunity.specialistName || 'A functional specialist'} is near ${label}. Inspect first; nothing opens or executes automatically.`;
    hideApproachPrompt();
    setStatus(`${label} encounter found. Inspect the visible signal before reviewing any productive mission.`);
    return true;
  };
  const updateNearbyLivingNexusOpportunity = (opportunity) => {
    nearbyLivingNexusOpportunity = opportunity || null;
    root.dispatchEvent(new CustomEvent('eon:city:living-nexus:opportunity', { detail: nearbyLivingNexusOpportunity }));
    if (!renderNearbyLivingNexusGateway() && !renderNearbyLivingNexusOpportunity()) updateNearbyLandmark(nearbyLandmark);
  };
  const updateNearbyLandmark = (landmark) => {
    nearbyLandmark = landmark || null;
    qualitySummit.updateCompass?.(nearbyLandmark);
    const nearbyLabel = nearbyLandmark?.label || '';
    if (nearbyLandmark?.id === 'command-centre') {
      commandDistrictState = recordCommandDistrictEvent('met-eonbot', { landmarkId: nearbyLandmark.id }).state;
      renderDistrictCard(commandDistrictState);
    } else if (nearbyLandmark?.id) {
      commandDistrictState = recordCommandDistrictEvent('selected-work-route', { landmarkId: nearbyLandmark.id }).state;
      renderDistrictCard(commandDistrictState);
    }
    if (renderNearbyLivingNexusGateway()) return;
    if (renderNearbyLivingNexusRealmSignal()) return;
    if (renderNearbyLivingNexusOpportunity()) return;
    if (objectivePanel && directEntry) objectivePanel.hidden = !nearbyLandmark;
    if (contextActionButton) {
      contextActionButton.disabled = !nearbyLandmark;
      contextActionButton.textContent = nearbyLabel ? `Review ${nearbyLabel}` : 'Select a district';
    }
    if (nearbyLandmark) {
      if (objective) objective.textContent = nearbyLabel;
      if (nearbyCopy) nearbyCopy.textContent = `You are near ${nearbyLabel}. Click/tap its neon signal or choose Review ${nearbyLabel}; nothing opens automatically.`;
      renderApproachPrompt(nearbyLandmark, { inRange: true });
      setStatus(`${nearbyLabel} signal found. Click/tap the visible signal, or review its destination from the City card.`);
    } else {
      hideApproachPrompt();
      if (objective) objective.textContent = 'Find a district signal';
      if (nearbyCopy) nearbyCopy.textContent = 'Click or tap a named City signal, or move close to a landmark. Nothing opens automatically.';
    }
  };
  renderDistrictCard = (state = commandDistrictState) => {
    if (!districtCard) return;
    const card = getCommandDistrictMissionCard(state || readCommandDistrictState().state);
    districtCard.innerHTML = `<p class="eon-play-kicker">First Command Route · local only</p><strong>${escapeHtml(card.title)}</strong><span>${escapeHtml(card.detail)}</span><small>${escapeHtml(card.next)} · ${escapeHtml(card.progressLabel)}</small>`;
    districtCard.dataset.stage = card.stageId;
  };
  renderDistrictCard(commandDistrictState);
  if (!host) {
    bootController.record('CITY_CANVAS_MOUNT_FAILED', 'canvas-host-missing');
    const diagnostics = bootController.getSnapshot();
    disposeCityPlayRuntime(root);
    renderFallback(root, capability, 'EON City could not mount its local canvas.', {
      diagnostics,
      onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
      onSafeMode: () => void startCitySafeMode(root, capability)
    });
    return;
  }
  let rendererFirstFrameReady = false;
  let initialAssetsReady = false;
  let initialAssetsResult = null;
  let cityReadyReported = false;
  const updateFirstFrameShield = (snapshot = cityLoadSequence.getSnapshot()) => {
    const shield = root.querySelector('[data-eon-city-first-frame-shield]');
    if (!shield) return snapshot;
    const label = shield.querySelector('[data-eon-city-first-frame-label]');
    const detail = shield.querySelector('[data-eon-city-first-frame-detail]');
    const bar = shield.querySelector('[data-eon-city-first-frame-progress-bar]');
    const progress = shield.querySelector('[role="progressbar"]');
    const cache = shield.querySelector('[data-eon-city-first-frame-cache]');
    if (label) label.textContent = snapshot.label;
    if (detail) detail.textContent = snapshot.detail;
    if (bar) bar.style.width = `${snapshot.progress}%`;
    if (progress) {
      progress.setAttribute('aria-valuenow', String(snapshot.progress));
      progress.setAttribute('aria-valuetext', snapshot.asset?.totalBytes > 0
        ? `${Math.round(snapshot.asset.loadedBytes / 1024)} KB of ${Math.round(snapshot.asset.totalBytes / 1024)} KB`
        : snapshot.label);
    }
    if (cache) cache.textContent = describeEonCityAssetCacheStatus(snapshot.cache || {});
    return snapshot;
  };
  const completePlayableCityBoot = () => {
    if (cityReadyReported || !rendererFirstFrameReady || !initialAssetsReady || !isCurrentBoot()) return false;
    cityReadyReported = true;
    const degraded = initialAssetsResult?.degraded === true;
    const readyDetail = degraded
      ? 'Command Horizon is ready with its safe procedural fallback; premium City art can retry by district.'
      : 'Command Horizon, Pathfinder, EONBOT, and Orientation Hall are ready to explore.';
    updateFirstFrameShield(cityLoadSequence.ready(readyDetail));
    try {
      const state = runtimeStateMachine?.getSnapshot?.().state;
      if (state === 'loading-core') runtimeStateMachine.transition('core-ready', degraded ? 'first-playable-frame-degraded' : 'first-playable-frame');
      if (runtimeStateMachine?.getSnapshot?.().state === 'core-ready') runtimeStateMachine.transition('streaming-detail', 'optional-detail-started');
      if (degraded) runtimeStateMachine?.degrade?.('w649-initial-art-procedural-fallback');
    } catch {}
    root.dataset.eonCityInitialAssets = degraded ? 'degraded-safe-fallback' : 'ready';
    root.dataset.eonCityPlayState = 'running';
    setCityRouteState(root, 'running');
    root.dataset.eonCityFirstFrame = 'ready';
    root.classList.remove('eon-city-first-frame-pending');
    root.classList.add('eon-city-first-frame-ready');
    bootController.firstFrame();
    return true;
  };
  const reportInitialAssetProgress = (progress = {}) => {
    if (cityReadyReported || !isCurrentBoot()) return;
    const sourcePath = String(progress.path || '').trim();
    if (!sourcePath.startsWith('/assets/city/w649/')) return;
    const id = String(progress.assetId || 'w649-city-asset');
    const loadedBytes = Math.max(0, Number(progress.loaded || 0));
    const totalBytes = Math.max(0, Number(progress.total || 0));
    const current = cityLoadSequence.getSnapshot();
    const savedLocally = isEonCityAssetPathCached(current.cache || {}, sourcePath);
    if (current.asset?.id !== id || current.asset?.sourcePath !== sourcePath) {
      cityLoadSequence.startAsset({
        id,
        sourcePath,
        totalBytes,
        detail: savedLocally
          ? `Restoring ${id.replaceAll('-', ' ')} from saved browser storage.`
          : `Preparing new or uncached ${id.replaceAll('-', ' ')} for direct same-origin delivery.`
      });
    }
    const snapshot = cityLoadSequence.reportAssetBytes({
      id,
      sourcePath,
      loadedBytes,
      totalBytes,
      detail: savedLocally
        ? `Restoring ${id.replaceAll('-', ' ')} from saved browser storage.`
        : totalBytes > 0
          ? `Receiving new or uncached ${id.replaceAll('-', ' ')} · ${Math.round(loadedBytes / 1024)} KB of ${Math.round(totalBytes / 1024)} KB.`
          : `Receiving new or uncached ${id.replaceAll('-', ' ')} from same-origin delivery.`
    });
    updateFirstFrameShield(snapshot);
  };
  try {
    runtime = module.mountBabylonCityProof({
      host,
      state: summary,
      quality: selectedQuality,
      openSkyProfileId: selectedOpenSkyProfileId,
      reducedMotion: reducedEffects || capability.reducedMotion,
      agentPresence: agentPresencePreferences.enabled ? agentSignalSnapshot.presenceEntries : [],
      agentPresencePreferences,
      agentOutcome: agentPresencePreferences.enabled ? agentSignalSnapshot.outcome : null,
      projectDistrictRenderPlans: projectDistrictSnapshot.renderPlans || [],
      defaultClickMove: directEntry,
      // Preview evidence is a local UI mode, never an authorization source for
      // a production world. The canonical access station supplies the only
      // server-authorized review decision.
      ownerWorldReview: false,
      onStatus: setStatus,
      onAssetProgress: reportInitialAssetProgress,
      onInitialAssetsReady: (result = {}) => {
        initialAssetsReady = true;
        initialAssetsResult = result;
        if (!rendererFirstFrameReady) {
          updateFirstFrameShield(cityLoadSequence.advance('art-streaming', {
            detail: result.degraded
              ? 'The premium starter set used a safe fallback. Finishing the first playable frame.'
              : 'Premium starter assets are ready. Finishing the first playable frame.'
          }));
        }
        completePlayableCityBoot();
      },
      onFirstFrame: () => {
        rendererFirstFrameReady = true;
        if (!initialAssetsReady) {
          updateFirstFrameShield(cityLoadSequence.advance('art-streaming', {
            detail: 'The renderer is ready. Loading only Pathfinder, EONBOT, and Orientation Hall before entry.'
          }));
        }
        completePlayableCityBoot();
      },
      onDetailStage: ({ id, status: detailStatus, summary: detailSummary }) => {
        try {
          if (detailStatus === 'failed') {
            runtimeStateMachine?.degrade?.(`optional-stage-${id}-failed`);
            return;
          }
          const stages = Array.isArray(detailSummary?.stages) ? detailSummary.stages : [];
          const settled = stages.length > 0 && stages.every((stage) => ['complete', 'skipped', 'failed'].includes(stage.status));
          const failed = stages.some((stage) => stage.status === 'failed');
          if (settled && failed) runtimeStateMachine?.degrade?.('optional-detail-partial');
          else if (settled && runtimeStateMachine?.getSnapshot?.().state === 'streaming-detail') runtimeStateMachine.transition('ready', 'optional-detail-settled');
        } catch {}
      },
      onTelemetry: (metrics) => {
        const workloadSnapshot = workloadGovernor.recordPerformanceSample?.({
          fps: metrics?.fps,
          averageFrameMs: metrics?.averageFrameMs,
          hardwareScalingLevel: metrics?.lifecycle?.hardwareScalingLevel,
          source: 'eon-city-runtime-telemetry'
        }, { emit: true, rendererOwnsProtection: true }) || workloadGovernor.getSnapshot?.();
        runtime?.setOptionalAssetAdmission?.({
          pressure: workloadSnapshot?.pressure || 'nominal',
          visibility: workloadSnapshot?.device?.visibility || globalThis.document?.visibilityState || 'visible',
          reason: workloadSnapshot?.pressureReason || 'city-runtime-telemetry'
        });
        if (!proofStatus || pausePanel?.hidden === false) return;
        proofStatus.textContent = performanceProtected
          ? 'Performance protection is active locally. Reduced effects are in use; EON City remains available.'
          : `${metrics.quality} · ${metrics.averageFrameMs ?? '—'} ms average · ${metrics.fps || '—'} FPS · local-only frame evidence`;
      },
      onPerformanceChange: ({ message }) => {
        performanceProtected = true;
        try { runtimeStateMachine?.degrade?.('performance-governor'); } catch {}
        previewController?.event?.('performance-protection', 'observe');
        if (proofStatus) proofStatus.textContent = 'Performance protection is active locally. Reduced effects are in use; EON City remains available.';
        setStatus(message || 'Performance protection reduced local effects.');
      },
      onContextLoss: () => {
        lifecycle.markContextLoss(boot.token, 'webgl-context-lost');
        try { runtimeStateMachine?.fail?.('webgl-context-lost'); } catch {}
      },
      onFallback: ({ reason }) => {
        try { runtimeStateMachine?.fail?.(reason || 'renderer-fallback'); } catch {}
        previewController?.event?.('context-lost', 'blocked');
        previewController?.task?.('context-loss-fallback', 'blocked');
        if (reason === 'webgl-context-lost') bootController.record('CITY_CONTEXT_LOST', 'webgl-context-lost');
        const diagnostics = bootController.getSnapshot();
        disposeCityPlayRuntime(root);
        renderFallback(root, capability, 'City graphics stopped safely.', {
          diagnostics,
          onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
          onSafeMode: () => void startCitySafeMode(root, capability)
        });
      },
      onLandmarkChange: (landmark) => updateNearbyLandmark(landmark),
      onLivingNexusOpportunityChange: (opportunity) => updateNearbyLivingNexusOpportunity(opportunity),
      onLivingNexusRealmSignalChange: (signal) => updateNearbyLivingNexusRealmSignal(signal),
      onLivingNexusGatewayChange: (gateway) => updateNearbyLivingNexusGateway(gateway),
      onLandmarkHover: (landmark) => {
        root.dataset.eonCityLandmarkHover = landmark?.id || '';
        if (landmark && !nearbyLandmark && inputStatus) inputStatus.textContent = `${landmark.label} is under the local pointer. Click or tap it to review its four bounded actions.`;
      },
      onLandmarkFocus: (landmark, focus) => {
        if (['keyboard', 'controller'].includes(focus?.source || '')) renderLandmarkPanel(landmark, { source: focus.source });
      },
      onLandmarkApproach: (landmark, approach) => renderApproachPrompt(landmark, approach),
      onLandmarkSelect: (landmark, metadata = {}) => renderLandmarkPanel(landmark, { source: metadata.source || 'world' }),
      onInputModeChange: (message) => { setStatus(message); if (inputStatus) inputStatus.textContent = message; },
      onPauseRequest: () => pauseSession('keyboard'),
      onMinimapToggle: () => toggleMinimap('keyboard'),
      onInteractRequest: (source) => requestInteraction(source || 'controller'),
      onClickMoveChange: ({ enabled }) => updateClickMove(enabled),
      onPointerLookChange: (state) => {
        latestPointerLookState = state || null;
        updatePointerLook(state);
      }
    });
  } catch (error) {
    try { runtimeStateMachine?.fail?.('renderer-mount-failed'); } catch {}
    const marker = CITY_BOOT_MARKERS.includes(String(error?.code || '')) ? String(error.code) : 'CITY_ENGINE_CREATE_FAILED';
    bootController.record(marker, marker === 'CITY_ASSET_LOAD_FAILED' ? 'scene-asset-initialization' : marker === 'CITY_CANVAS_MOUNT_FAILED' ? 'canvas-mount-failed' : 'engine-initialization');
    const diagnostics = bootController.getSnapshot();
    disposeCityPlayRuntime(root);
    renderFallback(root, capability, 'EON City could not start its local renderer.', {
      diagnostics,
      onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
      onSafeMode: () => void startCitySafeMode(root, capability)
    });
    return;
  }
  if (!lifecycle.attachRuntime(boot.token, runtime)) return;
  bootController.armFirstFrameTimeout(getCityFirstFrameTimeoutMs({ quality: selectedQuality, directEntry, capability }));
  previewController = createPreviewEvidenceController(root, { capability, quality: selectedQuality, runtime, enabled: previewMode, setStatus, proofStatus });
  previewController.event('renderer-ready', 'pass');
  const analogJoystick = mountCityPlayAnalogJoystick({
    root,
    onVector: (vector) => runtime?.setAnalogMove?.(vector),
    onStatus: (message) => { setStatus(message); if (inputStatus) inputStatus.textContent = message; }
  });
  const minimapController = mountCityPlayMinimap({
    root,
    runtime,
    landmarks: module.CITY_PLAY_LANDMARKS || [],
    reducedMotion: Boolean(reducedEffects || capability.reducedMotion)
  });
  const workroomOverlay = createEonCityWorkroomOverlay({
    runtime,
    onStatus: setStatus,
    onPoseRestored: () => {
      try { captureEonCityResumeFromRuntime(runtime, { reason: 'local-workroom-return' }); } catch {}
    }
  });
  cityWorkroomOverlays.set(root, workroomOverlay);
  const unbindProjectDistricts = bindEonProjectDistrictWorkspace(root, runtime, { onStatus: setStatus, workroomOverlay });
  const unbindMembershipMap = bindEonCityMembershipMap(root, { onStatus: setStatus, workroomOverlay });
  const unbindFairnessSafety = bindEonCityFairnessSafety(root, { onStatus: setStatus, workroomOverlay });
  const unbindTravelResume = bindEonCityTravelResume(root, runtime, { onStatus: setStatus, workroomOverlay });
  const unbindUsefulWorkPaths = bindEonCityUsefulWorkPaths(root, { onStatus: setStatus, workroomOverlay });
  const unbindVaultReveals = bindEonCityVaultReveals(root, { onStatus: setStatus, workroomOverlay });
  const unbindControls = () => {
    analogJoystick.destroy?.();
    minimapController.destroy?.();
    unbindProjectDistricts?.();
    unbindMembershipMap?.();
    unbindFairnessSafety?.();
    unbindTravelResume?.();
    unbindUsefulWorkPaths?.();
    unbindVaultReveals?.();
    workroomOverlay.dispose?.('immersive-controls-dispose');
  };
  controlUnsubscribers.set(root, unbindControls);
  lifecycle.own('immersive-controls', unbindControls);
  // Direct City entry keeps the map closed until a person asks for it. This prevents
  // it competing with the joystick and landmark cue on narrow screens.
  let minimapVisible = !directEntry;
  let touchDpadVisible = false;
  if (minimap) minimap.hidden = !minimapVisible;
  if (mapToggle) {
    mapToggle.setAttribute('aria-pressed', String(minimapVisible));
    mapToggle.textContent = minimapVisible ? 'Map' : 'Map: off';
  }
  const setTouchDpadVisible = (visible, source = 'ui') => {
    touchDpadVisible = Boolean(visible);
    if (touchDpad) touchDpad.hidden = !touchDpadVisible;
    if (touchDpadToggle) {
      touchDpadToggle.setAttribute('aria-pressed', String(touchDpadVisible));
      touchDpadToggle.textContent = touchDpadVisible ? 'Touch D-pad: on' : 'Touch D-pad: off';
    }
    const message = touchDpadVisible
      ? 'Touch D-pad shown as an accessibility alternative. The analogue joystick remains available.'
      : 'Touch D-pad hidden. Analogue joystick remains the primary touch control.';
    setStatus(message);
    if (inputStatus && source === 'ui') inputStatus.textContent = message;
  };
  toggleMinimap = (source = 'ui') => {
    minimapVisible = !minimapVisible;
    if (minimap) minimap.hidden = !minimapVisible;
    if (mapToggle) {
      mapToggle.setAttribute('aria-pressed', String(minimapVisible));
      mapToggle.textContent = minimapVisible ? 'Map' : 'Map: off';
    }
    const message = minimapVisible ? 'Local map shown. It contains public district coordinates only.' : 'Local map hidden.';
    setStatus(message);
    if (inputStatus && source === 'keyboard') inputStatus.textContent = message;
  };
  updateClickMove = (enabled) => {
    if (!clickMoveToggle) return;
    clickMoveToggle.setAttribute('aria-pressed', String(Boolean(enabled)));
    clickMoveToggle.textContent = enabled ? 'Mouse travel: on' : 'Mouse travel: off';
  };
  updateClickMove(directEntry);
  updatePointerLook = (state = latestPointerLookState || runtime?.getThirdPersonSummary?.()?.pointerLook || {}) => {
    const active = Boolean(state?.active);
    const requested = Boolean(state?.requested) && !active;
    const supported = state?.supported !== false;
    for (const button of pointerLookToggles) {
      button.setAttribute('aria-pressed', String(active));
      button.disabled = !supported;
      button.textContent = !supported ? 'Pointer look unavailable' : active ? 'Pointer look: on' : requested ? 'Pointer look: requesting' : 'Pointer look: off';
    }
  };
  updatePointerLook();
  const renderEonbotWorkReview = async (intentId) => {
    const panel = root.querySelector('[data-eon-play-eonbot-panel]');
    const review = root.querySelector('[data-eon-play-eonbot-review]');
    const note = root.querySelector('[data-eon-play-eonbot-note]');
    if (!panel || !review) return;
    review.textContent = 'Preparing a local review-needed planning receipt…';
    const result = await createCityWorkLoopProposal({ intentId, typedRequest: note?.value || '' });
    if (note) note.value = '';
    if (!result.ok || !result.proposal) {
      review.innerHTML = '<p>City could not prepare that local plan. Nothing opened and no provider was called.</p>';
      return;
    }
    commandDistrictState = readCommandDistrictState().state;
    renderDistrictCard(commandDistrictState);
    const proposal = result.proposal;
    review.innerHTML = `<section class="eon-play-eonbot-review-card"><h3>Review ${escapeHtml(proposal.title)}?</h3><p>${escapeHtml(proposal.role)} role · local planning receipt only. No provider call, automation run, or stored City note exists.</p><p>Continue in ${escapeHtml(proposal.destination.label)} only after your visible confirmation.</p><div><a class="eon-play-primary" href="${escapeHtml(proposal.destination.route)}" data-eon-play-confirm-eonbot="${escapeHtml(proposal.id)}">Confirm and open ${escapeHtml(proposal.destination.label)}</a><button class="eon-play-secondary" type="button" data-eon-play-cancel-eonbot>Stay in City</button></div></section>`;
    review.querySelector('[data-eon-play-cancel-eonbot]')?.addEventListener('click', () => {
      review.textContent = 'Stayed in City. The local planning receipt remains review-only and expires with the foreground session.';
    });
    review.querySelector('[data-eon-play-confirm-eonbot]')?.addEventListener('click', () => {
      commandDistrictState = recordCommandDistrictEvent('route-confirmed', { landmarkId: proposal.destination.landmarkId }).state;
      renderDistrictCard(commandDistrictState);
      appendOperatorActivity({ source: 'city', status: 'info', title: 'EONBOT City work lane confirmed', detail: 'The user reviewed and opened a native work surface from a local EONBOT planning receipt. No City text, provider output, or external action was transferred.', route: proposal.destination.route });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    });
  };
  const bindEonbotWorkDock = () => {
    const panel = root.querySelector('[data-eon-play-eonbot-panel]');
    const open = root.querySelector('[data-eon-play-open-eonbot]');
    const close = root.querySelector('[data-eon-play-close-eonbot]');
    if (!panel || !open || !close) return;
    open.addEventListener('click', () => { runtime?.setCompanionIntent?.('observe', { durationMs: 3_200 }); panel.hidden = false; root.querySelector('[data-eon-play-eonbot-note]')?.focus({ preventScroll: true }); });
    close.addEventListener('click', () => { runtime?.setCompanionIntent?.('return', { durationMs: 900 }); panel.hidden = true; open.focus({ preventScroll: true }); });
    panel.querySelectorAll('[data-eon-play-work-intent]').forEach((button) => button.addEventListener('click', () => { runtime?.setCompanionIntent?.('guide', { durationMs: 2_600 }); void renderEonbotWorkReview(button.dataset.eonPlayWorkIntent); }));
  };
  const bindPerformanceLab = () => {
    const panel = root.querySelector('[data-eon-play-performance-lab]');
    const open = root.querySelector('[data-eon-play-open-performance-lab]');
    const close = root.querySelector('[data-eon-play-close-performance-lab]');
    const content = root.querySelector('[data-eon-play-performance-lab-content]');
    const exportButton = root.querySelector('[data-eon-play-performance-export]');
    if (!panel || !open || !close || !content || !exportButton) return;
    const downloadChecklist = (snapshot) => {
      const blob = new Blob([buildCityPerformanceLabExport(snapshot)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eon-city-performance-checklist-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const downloadRendererSession = () => {
      const runtimeSummary = runtime?.getRuntimeSummary?.() || {};
      const observation = runtime?.getPerformanceObservation?.() || runtimeSummary?.performanceObservation || {};
      const worldRegionId = String(runtimeSummary?.activeWorldRegionId || runtimeSummary?.lifecycle?.lastFpsSample?.worldRegionId || 'command-hub');
      const cacheStatus = cityLoadSequence.getSnapshot().cache || {};
      const assetTransfer = observeEonCityL95AssetTransfer({ performanceRef: globalThis.performance, cacheStatus, baseUrl: globalThis.location?.href || 'https://eonapp.invalid/' });
      const fpsSample = runtimeSummary?.lifecycle?.lastFpsSample || {};
      const blob = new Blob([buildCityPerformanceObservationExport(observation, { worldRegionId, assetTransfer, fpsSample })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eon-city-renderer-session-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const render = () => {
      const snapshot = loadCityPerformanceLab();
      const runtimeSummary = runtime?.getRuntimeSummary?.() || {};
      const observation = runtime?.getPerformanceObservation?.() || runtimeSummary?.performanceObservation || null;
      const cacheStatus = cityLoadSequence.getSnapshot().cache || {};
      const assetTransfer = observeEonCityL95AssetTransfer({ performanceRef: globalThis.performance, cacheStatus, baseUrl: globalThis.location?.href || 'https://eonapp.invalid/' });
      const sourceResidency = runtimeSummary?.assets?.sourceResidency || null;
      const activeWorldRegionId = String(runtimeSummary?.activeWorldRegionId || runtimeSummary?.lifecycle?.lastFpsSample?.worldRegionId || 'command-hub').slice(0, 48);
      root.dataset.eonCityPerformanceWorldRegion = activeWorldRegionId;
      root.dataset.eonCityAssetNetworkTransfers = String(assetTransfer.networkTransferAssetCount);
      root.dataset.eonCityAssetLocalReuse = String(assetTransfer.localReuseOnlyAssetCount);
      root.dataset.eonCityAssetObservedTransferBytes = String(assetTransfer.totalTransferBytes);
      const sourceResidencyText = sourceResidency
        ? `${sourceResidency.logicalEntryCount} logical City asset uses resolve to ${sourceResidency.uniqueSourceCount} unique sources; ${sourceResidency.duplicateSourceCount} source families are reused and duplicate source decodes are serialized.`
        : 'Same-session source residency will appear after the progressive City asset runtime mounts.';
      const assetTransferSession = `<article class="eon-play-performance-session" data-eon-performance-asset-transfer><strong>Immutable City art residency</strong><span>${escapeHtml(describeEonCityL95AssetTransferObservation(assetTransfer))}</span><span>${escapeHtml(sourceResidencyText)}</span><p>This is local supporting evidence. Zero observed transfer does not claim a specific browser cache layer, and browser storage can still be evicted by the browser under storage pressure.</p></article>`;
      const rendererSession = observation ? `<article class="eon-play-performance-session" data-eon-performance-session><strong>Current local renderer session · ${escapeHtml(activeWorldRegionId)}</strong><span>First frame: ${escapeHtml(observation.firstFrameMs ?? 'pending')} ms · p95 frame: ${escapeHtml(observation.p95FrameMs ?? 'pending')} ms · estimated FPS: ${escapeHtml(observation.estimatedFps ?? 'pending')}</span><span>Memory slope: ${escapeHtml(observation.memory?.slopeBytesPerMinute ?? 'unavailable')} bytes/min · samples: ${escapeHtml(observation.frameSamples ?? 0)}</span><p>These automatic metrics stay in this session and are supporting evidence only. Console/WebGL warnings still need a human review, as do GPU visuals, thermal behaviour and touch/rotation.</p><button type="button" data-eon-performance-export-session>Export renderer session</button></article>` : `<p class="eon-play-performance-summary">Renderer metrics will appear after the first City frame. They stay local and cannot certify a device.</p>`;
      content.innerHTML = `${rendererSession}${assetTransferSession}<p class="eon-play-performance-summary">${snapshot.passedCaseCount}/${snapshot.requiredCaseCount} required cases marked passed by a person. Checklist status: ${escapeHtml(snapshot.status)}. This is not certification.</p><div class="eon-play-performance-cases">${CITY_PERFORMANCE_LAB_CASES.map((item) => {
        const record = snapshot.records.find((entry) => entry.id === item.id) || { status: 'not-run', note: '' };
        return `<article data-eon-performance-case="${escapeHtml(item.id)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span><label>Status<select data-eon-performance-status="${escapeHtml(item.id)}"><option value="not-run"${record.status === 'not-run' ? ' selected' : ''}>Not run</option><option value="passed"${record.status === 'passed' ? ' selected' : ''}>Passed manually</option><option value="failed"${record.status === 'failed' ? ' selected' : ''}>Failed</option><option value="blocked"${record.status === 'blocked' ? ' selected' : ''}>Blocked</option></select></label><label>Safe note<textarea data-eon-performance-note="${escapeHtml(item.id)}" maxlength="160" placeholder="Optional; credentials are removed">${escapeHtml(record.note)}</textarea></label><button type="button" data-eon-performance-save="${escapeHtml(item.id)}">Save this manual observation</button></article>`;
      }).join('')}</div>`;
      content.querySelector('[data-eon-performance-export-session]')?.addEventListener('click', () => {
        downloadRendererSession();
        setStatus('Local renderer session exported. It is supporting evidence only; no device certification was created.');
      });
      content.querySelectorAll('[data-eon-performance-save]').forEach((button) => button.addEventListener('click', () => {
        const id = button.dataset.eonPerformanceSave;
        const statusValue = content.querySelector(`[data-eon-performance-status="${id}"]`)?.value || 'not-run';
        const noteValue = content.querySelector(`[data-eon-performance-note="${id}"]`)?.value || '';
        const saved = saveCityPerformanceLabObservation({ id, status: statusValue, note: noteValue, runtime: runtime?.getRuntimeSummary?.() || {} }, { confirmedByUser: true });
        if (!saved.ok) { setStatus('That local device observation could not be saved. No evidence was uploaded.'); return; }
        render();
        setStatus('Manual local device observation saved. It is not an automatic pass or certification.');
      }));
      return snapshot;
    };
    open.addEventListener('click', () => { render(); panel.hidden = false; close.focus({ preventScroll: true }); });
    close.addEventListener('click', () => { panel.hidden = true; open.focus({ preventScroll: true }); });
    panel.addEventListener('click', (event) => { if (event.target === panel) panel.hidden = true; });
    exportButton.addEventListener('click', () => { downloadChecklist(loadCityPerformanceLab()); setStatus('Manual City performance checklist exported locally. It is not a certification.'); });
  };
  const bindCityValidationLab = () => {
    const panel = root.querySelector('[data-eon-play-validation-lab]');
    const open = root.querySelector('[data-eon-play-open-validation-lab]');
    const close = root.querySelector('[data-eon-play-close-validation-lab]');
    const content = root.querySelector('[data-eon-play-validation-lab-content]');
    const exportButton = root.querySelector('[data-eon-play-validation-export]');
    const mobileShareExportButton = root.querySelector('[data-eon-play-validation-export-mobile-share-proof]');
    const clearButton = root.querySelector('[data-eon-play-validation-clear]');
    const deviceLab = root.querySelector('[data-eon-play-open-validation-device-lab]');
    if (!panel || !open || !close || !content || !exportButton || !clearButton) return;
    const downloadChecklist = (snapshot) => {
      const blob = new Blob([buildCityValidationLabExport(snapshot)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eon-city-validation-checklist-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const render = () => {
      const snapshot = loadCityValidationLab();
      content.innerHTML = `<p class="eon-play-performance-summary">${snapshot.passedCaseCount}/${snapshot.requiredCaseCount} required cases marked passed manually. Status: ${escapeHtml(snapshot.status)}. This is not certification.</p><div class="eon-play-performance-cases eon-play-validation-cases">${CITY_VALIDATION_LAB_CASES.map((item) => {
        const record = snapshot.records.find((entry) => entry.id === item.id) || { status: 'not-run', note: '' };
        return `<article data-eon-validation-case="${escapeHtml(item.id)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span><label>Status<select data-eon-validation-status="${escapeHtml(item.id)}"><option value="not-run"${record.status === 'not-run' ? ' selected' : ''}>Not run</option><option value="passed"${record.status === 'passed' ? ' selected' : ''}>Passed manually</option><option value="failed"${record.status === 'failed' ? ' selected' : ''}>Failed</option><option value="blocked"${record.status === 'blocked' ? ' selected' : ''}>Blocked</option></select></label><label>Safe note<textarea data-eon-validation-note="${escapeHtml(item.id)}" maxlength="160" placeholder="Optional; credentials are removed">${escapeHtml(record.note)}</textarea></label><button type="button" data-eon-validation-save="${escapeHtml(item.id)}">Save this manual observation</button></article>`;
      }).join('')}</div>`;
      content.querySelectorAll('[data-eon-validation-save]').forEach((button) => button.addEventListener('click', () => {
        const id = button.dataset.eonValidationSave;
        const statusValue = content.querySelector(`[data-eon-validation-status="${id}"]`)?.value || 'not-run';
        const noteValue = content.querySelector(`[data-eon-validation-note="${id}"]`)?.value || '';
        const saved = saveCityValidationLabObservation({ id, status: statusValue, note: noteValue }, { confirmedByUser: true });
        if (!saved.ok) { setStatus('That local validation observation could not be saved. No evidence was uploaded.'); return; }
        render();
        setStatus('Manual City validation observation saved locally. It is not certification.');
      }));
      return snapshot;
    };
    open.addEventListener('click', () => { render(); panel.hidden = false; close.focus({ preventScroll: true }); });
    close.addEventListener('click', () => { panel.hidden = true; open.focus({ preventScroll: true }); });
    panel.addEventListener('click', (event) => { if (event.target === panel) panel.hidden = true; });
    exportButton.addEventListener('click', () => { downloadChecklist(loadCityValidationLab()); setStatus('Manual City validation checklist exported locally. It is not certification.'); });
    mobileShareExportButton?.addEventListener('click', () => {
      const blob = new Blob([buildCityMobileShareProofExport()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eon-city-mobile-share-proof-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus('Mobile + Share proof packet exported locally. It is a pending manual checklist; no device, screenshot, native share or privacy result was inspected.');
    });
    clearButton.addEventListener('click', () => {
      if (!globalThis.confirm?.('Clear this local City validation checklist? This does not affect Device Lab, City settings, work, Chat, Vault or backups.')) return;
      const result = clearCityValidationLab({ confirmedByUser: true });
      if (!result.ok) { setStatus('The local validation checklist could not be cleared in this browser.'); return; }
      render();
      setStatus('Local City validation checklist cleared. No evidence was uploaded.');
    });
    deviceLab?.addEventListener('click', () => {
      panel.hidden = true;
      root.querySelector('[data-eon-play-open-performance-lab]')?.click();
    });
  };
  const bindCityArtReview = () => {
    const panel = root.querySelector('[data-eon-play-art-review-panel]');
    const open = root.querySelector('[data-eon-play-open-art-review]');
    const close = root.querySelector('[data-eon-play-close-art-review]');
    const content = root.querySelector('[data-eon-play-art-review-content]');
    if (!panel || !open || !close || !content) return;
    let activeCategory = 'all';
    const render = () => {
      const summary = runtime?.getRuntimeSummary?.() || {};
      const review = summary.artReview || getCityArtReviewSummary({ quality: selectedQuality });
      const profile = review.artDirection || {};
      const categoryRows = Object.entries(review.originalArtCategories || {});
      const categories = categoryRows.map(([category, count]) => `<span>${escapeHtml(category)} · <strong>${Number(count)}</strong></span>`).join('');
      const filterButtons = [['all', 'All art'], ...categoryRows.map(([category]) => [category, category])]
        .map(([category, label]) => `<button type="button" data-eon-play-art-filter="${escapeHtml(category)}" aria-pressed="${activeCategory === category ? 'true' : 'false'}">${escapeHtml(label)}</button>`).join('');
      const sourceAssets = review.originalArtEntries || [];
      const visibleAssets = activeCategory === 'all' ? sourceAssets : sourceAssets.filter((entry) => entry.category === activeCategory);
      const assets = visibleAssets.map((entry) => `<article><img src="${escapeHtml(entry.path)}" alt="${escapeHtml(entry.role)}" loading="lazy"><div><strong>${escapeHtml(entry.id.replaceAll('-', ' '))}</strong><span>${escapeHtml(entry.role)}</span><small>${escapeHtml(entry.category)} · original local SVG</small></div></article>`).join('');
      const chapters = (review.artChapters || []).map((chapter) => `<article><strong>${escapeHtml(chapter.title)}</strong><span>${escapeHtml(chapter.detail)}</span><small>${Number(chapter.artIds?.length || 0)} linked local art assets</small></article>`).join('');
      const shots = (review.cinematicShots || []).map((shot) => `<button type="button" data-eon-play-art-shot="${escapeHtml(shot.id)}" data-eon-play-art-accent="${escapeHtml(shot.accent)}"><strong>${escapeHtml(shot.title)}</strong><span>${escapeHtml(shot.detail)}</span><small>Apply local view</small></button>`).join('');
      content.innerHTML = `<div class="eon-play-art-review-summary"><strong>${Number(review.vectorArt?.catalogCount || 0)} original local vector assets</strong><span>Profile: ${escapeHtml(profile.label || review.quality || 'balanced')} · ${escapeHtml(profile.toneMapping || 'standard')} tone mapping · ${Number(review.deepArt?.placementCount || 0)} authored local art placements · no remote LUT</span><div class="eon-play-art-review-categories">${categories}</div></div><section><h3>Local art inventory</h3><p class="eon-play-art-review-note">Filter the real locally shipped asset kit. This is original vector fallback art, not approved final binary 3D art.</p><div class="eon-play-art-filter-row">${filterButtons}</div><div class="eon-play-art-review-grid">${assets || '<p class="eon-play-art-review-note">No local art asset is assigned to this profile/category.</p>'}</div></section><section><h3>Art-directed City chapters</h3><div class="eon-play-art-chapter-grid">${chapters}</div></section><section><h3>Cinematic review views</h3><p class="eon-play-art-review-note">Views only move the local camera/player. Manual browser or device capture stays outside City.</p><div class="eon-play-art-shot-grid">${shots}</div></section>`;
      content.querySelectorAll('[data-eon-play-art-filter]').forEach((button) => button.addEventListener('click', () => {
        activeCategory = button.dataset.eonPlayArtFilter || 'all';
        render();
      }));
      content.querySelectorAll('[data-eon-play-art-shot]').forEach((button) => button.addEventListener('click', () => {
        const applied = runtime?.setCinematicShot?.(button.dataset.eonPlayArtShot);
        if (!applied) { setStatus('That local art composition is not available in this City session.'); return; }
        panel.hidden = true;
        setStatus(`${applied.title} local composition is ready. No screenshot, video, upload, route or work action was created.`);
      }));
    };
    open.addEventListener('click', () => { render(); panel.hidden = false; close.focus({ preventScroll: true }); });
    close.addEventListener('click', () => { panel.hidden = true; open.focus({ preventScroll: true }); });
    panel.addEventListener('click', (event) => { if (event.target === panel) panel.hidden = true; });
  };
  const renderPreparedActionReview = (action) => {
    if (!routeReview || !action) return;
    commandDistrictState = recordCommandDistrictEvent('route-prepared', { landmarkId: action.landmarkId }).state;
    renderDistrictCard(commandDistrictState);
    const missionOffer = offerCityBeginnerMission(action);
    const mission = missionOffer?.ok ? missionOffer.receipt : null;
    const href = missionOffer?.ok ? missionOffer.href : action.route;
    const missionCopy = mission
      ? `<li>Mission offered: <strong>${escapeHtml(mission.missionLabel)}</strong>. The destination will ask you to choose the next real step; no outcome is created here.</li>`
      : '';
    routeReview.hidden = false;
    routeReview.innerHTML = `<div class="eon-play-action-review-card"><p class="eon-play-kicker">Prepared route · review required</p><h2>Open ${escapeHtml(action.destinationLabel)}?</h2><p>${escapeHtml(action.purpose)}</p><ul><li>Source: ${escapeHtml(action.landmarkLabel)}</li>${missionCopy}<li>Only the route${mission ? ' and opaque mission receipt' : ''} are prepared; no private City, chat, Vault, provider, project, or account data moves with it.</li><li>No background task, signature, purchase, reward, contract action, or external request will run.</li></ul><div class="eon-play-action-review-actions"><a class="eon-play-primary" href="${escapeHtml(href)}" data-eon-play-confirm-action="${escapeHtml(action.id)}"${mission ? ` data-eon-play-mission-id="${escapeHtml(mission.id)}"` : ''}>Confirm and open ${escapeHtml(action.destinationLabel)}</a><button type="button" class="eon-play-secondary" data-eon-play-cancel-action${mission ? ` data-eon-play-mission-id="${escapeHtml(mission.id)}"` : ''}>Stay in Immersive Work Mode</button></div></div>`;
    routeReview.querySelector('[data-eon-play-cancel-action]')?.addEventListener('click', (event) => {
      const missionId = event.currentTarget.dataset.eonPlayMissionId;
      if (missionId) dismissCityBeginnerMission(missionId);
      routeReview.hidden = true;
      routeReview.textContent = '';
      setStatus('Stayed in Immersive Work Mode. The prepared route and any mission receipt remain local and expire automatically.');
    });
    routeReview.querySelector('[data-eon-play-confirm-action]')?.addEventListener('click', (event) => {
      const result = confirmPreparedCityAction(event.currentTarget.dataset.eonPlayConfirmAction);
      if (!result.ok) {
        event.preventDefault();
        setStatus('That prepared route is no longer available. Select the named City signal again to prepare a fresh route.');
        return;
      }
      const missionId = event.currentTarget.dataset.eonPlayMissionId;
      if (missionId) {
        const opened = openCityBeginnerMission(missionId);
        if (!opened.ok) {
          event.preventDefault();
          setStatus('That local mission receipt is no longer available. Select the named City signal again to prepare a fresh route.');
          return;
        }
      }
      commandDistrictState = recordCommandDistrictEvent('route-confirmed', { landmarkId: action.landmarkId }).state;
      renderDistrictCard(commandDistrictState);
      previewController.event('route-confirmed', 'pass');
      if (missionId) previewController.event('mission-opened', 'pass');
      disposeCityPlayRuntime(root);
      void exitImmersion();
    });
  };
  runtimes.set(root, runtime);
  lifecycle.own('w696-focus-return', unbindW696FocusReturn);
  const overlayCoordinator = bindEonCityOverlayCoordinator(root, { getRuntime: () => runtime, onStatus: setStatus });
  lifecycle.own('w662h-overlay-coordinator', () => overlayCoordinator.dispose?.());
  const unbindAgentPresence = bindAgentPresencePanel(root, runtime);
  presenceUnsubscribers.set(root, unbindAgentPresence);
  lifecycle.own('agent-presence', unbindAgentPresence);
  pauseSession = (source = 'ui') => {
    if (!runtime || pausePanel?.hidden === false) return;
    try { captureEonCityResumeFromRuntime(runtime, { reason: 'local-city-pause' }); } catch {}
    root.dataset.eonCityManualPause = 'active';
    runtime.pause();
    const soundscapeGuard = soundscapePolicy.setRuntime({
      cityPaused: true,
      tabVisible: globalThis.document?.visibilityState !== 'hidden',
      reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
    });
    if (soundscapeGuard.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.('city-paused');
    root.dataset.eonCityPlaySoundscape = 'off';
    previewController.event('paused', 'pass');
    acknowledgeSensoryAction('pause');
    if (pausePanel) pausePanel.hidden = false;
    if (inputStatus && source === 'keyboard') inputStatus.textContent = 'Immersive Work Mode paused locally. Nothing continues in the background.';
  };
  requestInteraction = (source = 'ui', landmarkOverride = null) => {
    if (!landmarkOverride && nearbyLivingNexusGateway) {
      const flowState = getLivingNexusGatewayFlowState();
      if (flowState.primaryAction === 'enter') enterLivingNexusGateway();
      else if (flowState.primaryAction === 'inspect') inspectLivingNexusGateway();
      else guideLivingNexusGateway();
      return;
    }
    if (!landmarkOverride && nearbyLivingNexusRealmSignal) {
      root.dispatchEvent(new CustomEvent('eon:city:living-nexus:realm-signal', { detail: nearbyLivingNexusRealmSignal }));
      root.dispatchEvent(new CustomEvent('eon:city:living-nexus:open-realm', { detail: { source, realmId: nearbyLivingNexusRealmSignal.realmId || '', portalId: nearbyLivingNexusRealmSignal.id || '' } }));
      setStatus(`${nearbyLivingNexusRealmSignal.label || 'Nexus Realm signal'} opened for review. No Realm or route opened automatically.`);
      return;
    }
    if (!landmarkOverride && nearbyLivingNexusOpportunity) {
      root.dispatchEvent(new CustomEvent('eon:city:living-nexus:open-encounter', { detail: { encounterId: nearbyLivingNexusOpportunity.id, source } }));
      setStatus(`${nearbyLivingNexusOpportunity.landmarkLabel || 'Expanse encounter'} opened for inspection. Nothing has executed or navigated.`);
      return;
    }
    const landmark = landmarkOverride || nearbyLandmark;
    if (!landmark) {
      setStatus('Select or approach a visible district signal first. City will not guess or open a route automatically.');
      if (inputStatus && source !== 'ui') inputStatus.textContent = 'No nearby district signal. Move closer or select a named neon signal first.';
      return;
    }
    recordCityPlayLandmark(landmark.id);
    const prepared = prepareCityPlayAction(landmark.id);
    if (!prepared.ok || !prepared.action) {
      setStatus('The route could not be prepared in this browser. EON City remains available.');
      return;
    }
    previewController.event('route-prepared', 'pass');
    previewController.task('prepared-route-review', 'pass');
    renderPreparedActionReview(prepared.action);
    acknowledgeSensoryAction('confirm');
    setStatus(`${prepared.action.destinationLabel} is prepared for review. Nothing has opened.`);
    if (inputStatus && source !== 'ui') inputStatus.textContent = `${source === 'gamepad' ? 'Controller' : source === 'landmark-card' ? 'Landmark card' : 'Keyboard'} requested a visible review. Separate confirmation is still required.`;
  };
  root.querySelector('[data-eon-play-manage-chat]')?.addEventListener('click', (event) => {
    const route = String(event.currentTarget?.getAttribute?.('href') || '/');
    appendOperatorActivity({ source: 'city', status: 'info', title: 'Immersive Work Mode native review chosen', detail: 'The user chose a native review surface from Immersive Work Mode. The City relayed status only and did not expose or transfer result content.', route });
  });
  const bindInWorldSettings = () => {
    const panel = root.querySelector('[data-eon-play-settings-panel]');
    const open = root.querySelector('[data-eon-play-open-settings]');
    const close = root.querySelector('[data-eon-play-close-settings]');
    const save = root.querySelector('[data-eon-play-settings-save]');
    const status = root.querySelector('[data-eon-play-settings-status]');
    if (!panel || !open || !close || !save) return;
    const readSettings = () => ({
      quality: root.querySelector('[data-eon-play-settings-quality]')?.value || selectedQuality,
      openSkyProfileId: root.querySelector('[data-eon-play-settings-open-sky]')?.value || selectedOpenSkyProfileId,
      reducedEffects: Boolean(root.querySelector('[data-eon-play-settings-reduced]')?.checked),
      sensory: {
        sound: Boolean(root.querySelector('[data-eon-play-settings-sound]')?.checked),
        haptics: Boolean(root.querySelector('[data-eon-play-settings-haptics]')?.checked)
      },
      soundVolume: Math.max(0, Math.min(1, Number(root.querySelector('[data-eon-play-settings-volume]')?.value || 55) / 100)),
      soundscape: {
        ambience: Boolean(root.querySelector('[data-eon-play-settings-ambience]')?.checked),
        ui: Boolean(root.querySelector('[data-eon-play-settings-ui]')?.checked),
        music: soundscapePrefs.music,
        voice: soundscapePrefs.voice,
        reducedSensory: Boolean(root.querySelector('[data-eon-play-settings-reduced-sensory]')?.checked)
      }
    });
    const show = () => { panel.hidden = false; root.querySelector('[data-eon-play-settings-quality]')?.focus({ preventScroll: true }); };
    const hide = () => { panel.hidden = true; open.focus({ preventScroll: true }); };
    const volume = root.querySelector('[data-eon-play-settings-volume]');
    const volumeValue = root.querySelector('[data-eon-play-settings-volume-value]');
    volume?.addEventListener('input', () => {
      const normalized = Math.max(0, Math.min(1, Number(volume.value || 55) / 100));
      soundscape.setVolume?.(normalized);
      if (volumeValue) volumeValue.textContent = `${Math.round(normalized * 100)}%`;
    });
    open.addEventListener('click', show);
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
    save.addEventListener('click', () => {
      const next = readSettings();
      const nextQuality = normalizeCityPlayQuality(next.reducedEffects ? 'lite' : next.quality, capability);
      const nextOpenSkyProfileId = normalizeEonCityOpenSkyProfileId(next.openSkyProfileId);
      const openSkyResult = runtime?.setOpenSkyProfile?.(nextOpenSkyProfileId);
      if (openSkyResult?.ok) {
        selectedOpenSkyProfileId = openSkyResult.profileId || nextOpenSkyProfileId;
        root.dataset.eonCityOpenSkyProfile = selectedOpenSkyProfileId;
      }
      sensory = saveCitySensoryPreferences(next.sensory);
      soundscapePrefs = normalizeCitySoundscapePreferences(next.soundscape);
      soundscape.setPreferences(soundscapePrefs);
      soundscape.setVolume?.(next.soundVolume);
      const runtimeGuard = soundscapePolicy.setRuntime({
        cityPaused: Boolean(runtime?.isPaused?.()),
        tabVisible: globalThis.document?.visibilityState !== 'hidden',
        reducedEffects: Boolean(next.reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
      });
      const wantsSessionSound = soundscapePrefs.ambience || soundscapePrefs.ui;
      if (runtimeGuard.shouldStopExistingAudio || !wantsSessionSound) {
        soundscape.stopForRuntimeGuard?.(runtimeGuard.snapshot?.reason || 'settings-sound-disabled');
        if (!wantsSessionSound) soundscapePolicy.stop({ explicitUserAction: true, reason: 'settings-sound-disabled' });
      }
      root.dataset.eonCityPlaySound = sensory.sound ? 'optional-enabled' : 'off';
      root.dataset.eonCityPlayHaptics = sensory.haptics ? 'optional-enabled' : 'off';
      root.dataset.eonCityPlaySoundscape = soundscapePolicy.getSnapshot().audibleState === 'active-local-procedural' ? 'optional-enabled' : 'off';
      updateCityPlayPreferences({ preferredQuality: nextQuality, reducedEffects: next.reducedEffects });
      const sensoryStatus = root.querySelector('[data-eon-play-sensory-status]');
      if (sensoryStatus) sensoryStatus.textContent = describeSensoryPreferences(sensory);
      const openSkyLabel = openSkyResult?.label || getEonCityOpenSkyProfileOptions().find((option) => option.id === selectedOpenSkyProfileId)?.label || 'Violet Dusk';
      const message = `Visual settings saved locally. ${nextQuality[0].toUpperCase()}${nextQuality.slice(1)} visual profile applies next City entry. ${openSkyLabel} is a session-only visual style applied to this City now; it is not time, weather, or a forecast. ${describeSensoryPreferences(sensory)}. Local sound stays off until you choose Turn on local sound and remains session-only.`;
      if (status) status.textContent = message;
      setStatus(message);
    });
  };
  const bindCityFirstRun = () => {
    const panel = root.querySelector('[data-eon-play-first-run-panel]');
    const card = panel?.querySelector('.eon-play-first-run-card');
    const openButtons = root.querySelectorAll('[data-eon-play-open-start-here]');
    const close = root.querySelector('[data-eon-play-close-start-here]');
    const choices = root.querySelector('[data-eon-play-first-run-choices]');
    const reviewRoot = root.querySelector('[data-eon-play-first-run-review]');
    if (!panel || !card || !close || !choices || !reviewRoot) return;
    const syncLayoutGuard = () => {
      const compact = (globalThis.innerWidth || 0) <= 760;
      const contract = overlayInputContract;
      const sidebarRect = document.querySelector('.eon-app-sidebar')?.getBoundingClientRect?.() || null;
      const leftInset = compact ? '1rem' : `${Math.max(16, Math.round((sidebarRect?.right || 0) + 16))}px`;
      panel.dataset.eonCityOverlayLayer = contract.layer;
      panel.style.position = 'fixed';
      panel.style.zIndex = String(contract.minimumZIndex);
      panel.style.isolation = 'isolate';
      panel.style.contain = 'layout style paint';
      panel.style.touchAction = 'manipulation';
      panel.style.top = compact ? '5rem' : 'clamp(4.5rem, 12vh, 8rem)';
      panel.style.right = '1rem';
      panel.style.bottom = 'auto';
      panel.style.left = leftInset;
      panel.style.display = panel.hidden ? 'none' : 'grid';
      panel.style.placeItems = 'center';
      panel.style.pointerEvents = 'auto';
      panel.style.padding = '0';
      card.style.display = 'grid';
      card.style.gap = '.78rem';
      card.style.width = 'min(100%, 45rem)';
      card.style.padding = 'clamp(1rem, 2.4vw, 1.6rem)';
      card.style.maxWidth = '45rem';
      card.style.position = 'relative';
      card.style.zIndex = '1';
      card.style.pointerEvents = 'auto';
      card.style.touchAction = 'manipulation';
      close.dataset.eonCityOverlayClose = 'true';
      close.style.justifySelf = 'start';
    };
    syncLayoutGuard();
    root.classList.toggle('eon-city-overlay-open', !panel.hidden);
    // The first-run dialog is a true modal input layer. Stop its pointer events
    // at the card so the underlying Babylon canvas can never receive the same
    // press/click and intercept the visible close or path controls.
    const containModalPointer = (event) => { event.stopPropagation?.(); };
    for (const type of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend']) card.addEventListener(type, containModalPointer);
    globalThis.addEventListener?.('resize', syncLayoutGuard);
    let lastOpen = null;
    const resetReview = () => {
      choices.hidden = false;
      reviewRoot.hidden = true;
      reviewRoot.innerHTML = '';
    };
    const show = () => {
      lastOpen = document.activeElement?.matches?.('[data-eon-play-open-start-here]') ? document.activeElement : null;
      globalThis.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
      document.scrollingElement?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
      panel.hidden = false;
      panel.style.display = 'grid';
      root.classList.add('eon-city-overlay-open');
      resetReview();
      panel.querySelector('[data-eon-play-first-run-path]')?.focus({ preventScroll: true });
      setStatus('Start here is open. Choose a path, review the destination, then decide whether to leave City.');
    };
    const hide = ({ dismiss = false } = {}) => {
      if (dismiss) dismissEonCityFirstRun();
      resetReview();
      panel.hidden = true;
      panel.style.display = 'none';
      root.classList.remove('eon-city-overlay-open');
      lastOpen?.focus?.({ preventScroll: true });
    };
    const showReview = (review) => {
      if (!review?.ok || !review.path) {
        setStatus('That City path is unavailable in this browser. You can keep exploring City.');
        return;
      }
      choices.hidden = true;
      reviewRoot.hidden = false;
      reviewRoot.innerHTML = `<p class="eon-play-kicker">Native surface · review first</p><h3>Open ${escapeHtml(review.path.label)}?</h3><p>${escapeHtml(review.path.detail)}</p><ul><li>This leaves City only after the next visible click.</li><li>No project, account, provider, payment, media or private City data is sent by this review.</li><li>You can choose another path or keep exploring instead.</li></ul><div class="eon-play-first-run-review-actions"><a href="${escapeHtml(review.route)}" data-eon-play-confirm-first-run-path="${escapeHtml(review.path.id)}">Continue to ${escapeHtml(review.path.label)} →</a><button type="button" data-eon-play-cancel-first-run-review>Choose another path</button></div>`;
      reviewRoot.querySelector('[data-eon-play-confirm-first-run-path]')?.addEventListener('click', () => {
        const result = selectEonCityFirstRunPath(review.path.id);
        if (!result.ok) {
          setStatus('The path is opening, but City could not save the local orientation marker in this browser.');
        } else {
          appendOperatorActivity({ source: 'city', status: 'info', title: 'City start path confirmed', detail: 'The user confirmed an approved native City orientation destination. No provider, account, media or external action started.', route: review.route });
        }
        // Let the anchor perform the native navigation. City never replaces or
        // mutates the route programmatically, so a browser-blocked navigation can
        // still be understood and retried by the person.
      });
      reviewRoot.querySelector('[data-eon-play-cancel-first-run-review]')?.addEventListener('click', () => {
        resetReview();
        choices.querySelector('[data-eon-play-first-run-path]')?.focus({ preventScroll: true });
        setStatus('Choose another path, or keep exploring City.');
      });
      reviewRoot.querySelector('[data-eon-play-confirm-first-run-path]')?.focus({ preventScroll: true });
      setStatus(`${review.path.label} is ready to review. City will not leave until you choose the visible continue button.`);
    };
    openButtons.forEach((button) => button.addEventListener('click', show));
    close.addEventListener('click', () => {
      hide({ dismiss: true });
      setStatus('Explore City first. Start here remains available from the City menu.');
    });
    panel.addEventListener('click', (event) => {
      if (event.target === panel) {
        hide({ dismiss: true });
        return;
      }
      const choice = event.target?.closest?.('[data-eon-play-first-run-path]');
      if (!choice) return;
      const review = createEonCityFirstRunPathReview(choice.dataset.eonPlayFirstRunPath || '');
      showReview(review);
    });
    lifecycle.own('city-first-run-layout-guard', () => {
      globalThis.removeEventListener?.('resize', syncLayoutGuard);
      for (const type of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend']) card.removeEventListener(type, containModalPointer);
    });
  };
  const bindMissionBoard = () => {
    const panel = root.querySelector('[data-eon-play-mission-board-panel]');
    const openButtons = root.querySelectorAll('[data-eon-play-open-mission-board]');
    const close = root.querySelector('[data-eon-play-close-mission-board]');
    const content = root.querySelector('[data-eon-play-mission-board-content]');
    if (!panel || !close || !content) return;
    const render = () => {
      const card = getCommandDistrictMissionCard(commandDistrictState || readCommandDistrictState().state);
      const world = getCityWorldPublicSummary(ensureCityWorldState().state);
      content.innerHTML = `<p><strong>${escapeHtml(card.title)}</strong></p><p>${escapeHtml(card.detail)}</p><p>${escapeHtml(card.next)} · ${escapeHtml(card.progressLabel)}</p><p class="eon-play-command-deck-note">Local City visits: ${escapeHtml(String(world?.districtVisitCount || 0))}. This value is a browser-local progress marker, never a credit, reward or account claim. Mission cards are optional route notes; dismissing one or letting a stale receipt expire never removes core access, work, safety settings, backups, or account value.</p>`;
    };
    const show = () => { render(); panel.hidden = false; close.focus({ preventScroll: true }); setStatus('Mission Board is open locally. It shows only safe City route markers.'); };
    const hide = () => { panel.hidden = true; (root.querySelector('[data-eon-play-open-command-room]') || root.querySelector('[data-eon-play-open-command-deck]'))?.focus({ preventScroll: true }); };
    openButtons.forEach((button) => button.addEventListener('click', show));
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  };
  const bindAuthoredVerticalSliceGuide = () => {
    const panel = root.querySelector('[data-eon-play-authored-slice-panel]');
    const openButtons = [...root.querySelectorAll('[data-eon-play-open-district-guide]')];
    const close = root.querySelector('[data-eon-play-close-authored-slice]');
    if (!panel || !openButtons.length || !close) return;
    let lastOpen = openButtons[0];
    const show = () => {
      lastOpen = document.activeElement?.matches?.('[data-eon-play-open-district-guide]') ? document.activeElement : openButtons[0];
      panel.hidden = false;
      panel.querySelector('[data-eon-play-focus-authored-slice]')?.focus({ preventScroll: true });
      setStatus('District guide is local wayfinding only. Choose a focus marker to look around the authored City slice.');
    };
    const hide = () => {
      panel.hidden = true;
      lastOpen?.focus?.({ preventScroll: true });
    };
    openButtons.forEach((button) => button.addEventListener('click', show));
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => {
      if (event.target === panel) hide();
      const focus = event.target?.closest?.('[data-eon-play-focus-authored-slice]');
      if (!focus) return;
      const id = String(focus.dataset.eonPlayFocusAuthoredSlice || '');
      const result = runtime.focusAuthoredVerticalSliceRegion?.(id);
      if (!result) {
        setStatus('That City focus point is unavailable in this renderer. Try restarting EON City or low-detail mode.');
        return;
      }
      setStatus(`${result.title} is in focus locally. No route, project, data transfer, or work action was opened.`);
      hide();
    });
  };

  const bindTruthfulCommandCenter = () => {
    const panel = root.querySelector('[data-eon-command-room-panel]');
    const cardShell = panel?.querySelector('.eon-command-room-card');
    const boundary = panel?.querySelector('.eon-command-room-boundary');
    const openButtons = [...root.querySelectorAll('[data-eon-play-open-command-room]')];
    if (!panel || !cardShell || !boundary || !openButtons.length) return () => {};

    const section = document.createElement('section');
    section.className = 'eon-command-room-truth';
    section.dataset.eonTruthfulCommandCenter = '';
    section.setAttribute('aria-labelledby', 'eon-command-room-truth-title');
    section.innerHTML = `<header><div><p class="eon-play-kicker">EON City · read-only system status</p><h3 id="eon-command-room-truth-title">System Status</h3><p>Bounded counts and receipts only. Review a card before choosing its native surface.</p></div><button type="button" data-eon-truth-refresh>Refresh status</button></header><div class="eon-command-room-truth-grid" data-eon-truth-grid aria-live="polite"></div><div class="eon-command-room-truth-review" data-eon-truth-review aria-live="polite"><p>Choose Review on a status card. No route opens automatically.</p></div>`;
    cardShell.insertBefore(section, boundary);

    const grid = section.querySelector('[data-eon-truth-grid]');
    const review = section.querySelector('[data-eon-truth-review]');
    const refresh = section.querySelector('[data-eon-truth-refresh]');
    const controller = createEonCityTruthfulCommandCenterController();
    const cleanups = [];
    let openedOnce = false;

    const timeLabel = (value) => {
      const timestamp = Number(value || 0);
      if (!timestamp) return 'No verified timestamp';
      try { return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
      catch { return new Date(timestamp).toISOString(); }
    };
    const renderReview = (snapshot) => {
      const selected = snapshot.cards.find((entry) => entry.id === snapshot.selectedId);
      if (!selected) {
        review.innerHTML = '<p>Choose Review on a status card. No route opens automatically.</p>';
        return;
      }
      const alternate = selected.alternateRoute ? `<a href="${escapeHtml(selected.alternateRoute)}" data-eon-truth-route data-eon-truth-family="${escapeHtml(selected.id)}">Review Direct BYOK keys</a>` : '';
      review.innerHTML = `<article data-state="${escapeHtml(selected.state)}"><p class="eon-play-kicker">Reviewed · ${escapeHtml(selected.label)}</p><h4>${escapeHtml(selected.summary)}</h4><p>${escapeHtml(selected.review)}</p><dl><div><dt>Source</dt><dd>${escapeHtml(selected.source)}</dd></div><div><dt>Authority</dt><dd>${escapeHtml(selected.authority)}</dd></div><div><dt>Observed</dt><dd>${escapeHtml(timeLabel(selected.observedAt))}</dd></div><div><dt>Freshness</dt><dd>${escapeHtml(selected.freshness.label)}</dd></div></dl><div class="eon-command-room-truth-actions"><a href="${escapeHtml(selected.route)}" data-eon-truth-route data-eon-truth-family="${escapeHtml(selected.id)}">Open ${escapeHtml(selected.label)}</a>${alternate}</div></article>`;
    };
    const render = (snapshot) => {
      grid.innerHTML = snapshot.cards.map((entry) => `<article data-state="${escapeHtml(entry.state)}" data-eon-truth-family="${escapeHtml(entry.id)}"><div class="eon-command-room-truth-card-top"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.state)}</span></div><p>${escapeHtml(entry.summary)}</p><dl><div><dt>Source</dt><dd>${escapeHtml(entry.source)}</dd></div><div><dt>Authority</dt><dd>${escapeHtml(entry.authority)}</dd></div><div><dt>Observed</dt><dd>${escapeHtml(timeLabel(entry.observedAt))}</dd></div><div><dt>Freshness</dt><dd>${escapeHtml(entry.freshness.label)}</dd></div></dl><button type="button" data-eon-truth-review-button="${escapeHtml(entry.id)}" aria-pressed="${entry.id === snapshot.selectedId ? 'true' : 'false'}">Review ${escapeHtml(entry.label)}</button></article>`).join('');
      renderReview(snapshot);
    };
    cleanups.push(controller.subscribe(render));

    const onSectionClick = (event) => {
      const reviewButton = event.target?.closest?.('[data-eon-truth-review-button]');
      if (reviewButton) {
        const result = controller.review(String(reviewButton.dataset.eonTruthReviewButton || ''), { explicitUserAction: true });
        setStatus(result.ok ? `${result.card.label} status reviewed. A separate route choice is now available.` : 'That status card could not be reviewed.');
        return;
      }
      const route = event.target?.closest?.('[data-eon-truth-route]');
      if (!route) return;
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Truthful Command Center route opened', detail: `The user opened the native ${route.dataset.eonTruthFamily || 'status'} surface after a separate review step. No private work, entitlement, credential, payment record, or hidden action was transferred.`, route: route.getAttribute('href') || '/' });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    };
    section.addEventListener('click', onSectionClick);
    cleanups.push(() => section.removeEventListener('click', onSectionClick));

    const refreshStatus = async () => {
      refresh.disabled = true;
      const result = await controller.refresh({ explicitUserAction: true });
      refresh.disabled = false;
      const billing = result.snapshot?.cards?.find?.((entry) => entry.id === 'billing');
      setStatus(`Command Center refreshed. Billing authority reports ${billing?.state || 'unavailable'}; no entitlement was inferred from browser storage.`);
    };
    const onRefresh = () => { void refreshStatus(); };
    refresh.addEventListener('click', onRefresh);
    cleanups.push(() => refresh.removeEventListener('click', onRefresh));

    const onOpen = () => {
      controller.refreshLocal();
      if (!openedOnce) {
        openedOnce = true;
        void refreshStatus();
      }
    };
    openButtons.forEach((button) => { button.addEventListener('click', onOpen); cleanups.push(() => button.removeEventListener('click', onOpen)); });
    const onStorage = (event) => {
      if (!event?.key || ['eon:workspace:projects:v1', 'eon:chat:job-fabric:v1', 'eon:city:productive-rpg:w624g:v1'].includes(event.key)) controller.refreshLocal();
    };
    globalThis.addEventListener?.('storage', onStorage);
    cleanups.push(() => globalThis.removeEventListener?.('storage', onStorage));

    return () => {
      cleanups.splice(0).reverse().forEach((cleanup) => { try { cleanup(); } catch {} });
      controller.dispose();
      section.remove();
    };
  };


  const bindGenuineAgentTheatre = () => {
    const panel = root.querySelector('[data-eon-command-room-panel]');
    const cardShell = panel?.querySelector('.eon-command-room-card');
    const boundary = panel?.querySelector('.eon-command-room-boundary');
    if (!panel || !cardShell || !boundary) return () => {};

    const section = document.createElement('section');
    section.className = 'eon-command-room-genuine-theatre';
    section.dataset.eonGenuineAgentTheatre = '';
    section.setAttribute('aria-labelledby', 'eon-genuine-agent-theatre-title');
    section.innerHTML = `<header><div><p class="eon-play-kicker">W624I · receipt-backed lifecycle</p><h3 id="eon-genuine-agent-theatre-title">Genuine Agent Theatre</h3><p>Real bounded receipts only. The Theatre never starts work or invents progress.</p></div></header><div class="eon-genuine-agent-theatre-grid" data-eon-genuine-agent-grid aria-live="polite"></div><div class="eon-genuine-agent-theatre-review" data-eon-genuine-agent-review aria-live="polite"><p>Review a genuine receipt to see its privacy boundary and native-surface actions.</p></div>`;
    cardShell.insertBefore(section, boundary);

    const grid = section.querySelector('[data-eon-genuine-agent-grid]');
    const review = section.querySelector('[data-eon-genuine-agent-review]');
    const controller = createEonCityGenuineAgentTheatreController();
    const cleanups = [];
    const timeLabel = (value) => {
      if (!value) return 'No verified timestamp';
      try { return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
      catch { return String(value); }
    };
    const renderReview = (snapshot) => {
      const job = snapshot.jobs.find((entry) => entry.jobId === snapshot.selectedJobId);
      if (!job) {
        review.innerHTML = '<p>Review a genuine receipt to see its privacy boundary and native-surface actions.</p>';
        return;
      }
      const progress = job.authoritativeProgress ? `<div class="eon-genuine-agent-progress"><span>Authoritative progress</span><progress max="100" value="${escapeHtml(String(job.progress))}">${escapeHtml(String(job.progress))}%</progress><strong>${escapeHtml(String(job.progress))}%</strong></div>` : '<p class="eon-genuine-agent-no-progress">No authoritative progress receipt is available.</p>';
      const logs = job.logs.map((entry) => `<li><time>${escapeHtml(timeLabel(entry.at))}</time><span>${escapeHtml(entry.message)}</span></li>`).join('');
      const actions = job.actions.filter((entry) => entry.available).map((entry) => `<a href="${escapeHtml(entry.route || job.route)}" data-eon-agent-native-route data-eon-agent-job="${escapeHtml(job.jobId)}" data-eon-agent-action="${escapeHtml(entry.id)}">${escapeHtml(entry.id.replace(/-/g, ' '))}</a>`).join('');
      review.innerHTML = `<article data-state="${escapeHtml(job.state)}"><p class="eon-play-kicker">Reviewed genuine receipt</p><h4>${escapeHtml(job.safeLabel)}</h4><dl><div><dt>Lifecycle</dt><dd>${escapeHtml(job.state)}</dd></div><div><dt>Execution rail</dt><dd>${escapeHtml(job.railLabel)}</dd></div><div><dt>Source</dt><dd>${escapeHtml(job.sourceLabel)}</dd></div><div><dt>Authority</dt><dd>${escapeHtml(job.authority)}</dd></div><div><dt>Created</dt><dd>${escapeHtml(timeLabel(job.createdAt))}</dd></div><div><dt>Updated</dt><dd>${escapeHtml(timeLabel(job.updatedAt))}</dd></div></dl>${progress}<div class="eon-genuine-agent-privacy"><strong>Privacy boundary</strong><p>${escapeHtml(job.boundary)}</p><p>${escapeHtml(job.leavesDevice)}</p></div><div class="eon-genuine-agent-logs"><strong>Display-safe lifecycle log</strong><ol>${logs}</ol></div><div class="eon-genuine-agent-actions">${actions}</div><p class="eon-genuine-agent-action-note">Every action opens the native surface. The Theatre itself never retries, pauses, resumes, cancels, sends, publishes or runs a provider.</p></article>`;
    };
    const render = (snapshot) => {
      if (!snapshot.jobs.length) {
        grid.innerHTML = `<article class="eon-genuine-agent-empty"><strong>Still and empty</strong><p>${escapeHtml(snapshot.emptyMessage)}</p><small>No worker avatar, workstation glow or running label is shown without a matching receipt.</small></article>`;
        renderReview(snapshot);
        return;
      }
      grid.innerHTML = snapshot.jobs.map((job) => {
        const progress = job.authoritativeProgress ? `<span>${escapeHtml(String(job.progress))}% authoritative</span>` : '<span>Progress not reported</span>';
        return `<article data-state="${escapeHtml(job.state)}" data-eon-genuine-agent-job="${escapeHtml(job.jobId)}"><div class="eon-genuine-agent-card-top"><strong>${escapeHtml(job.safeLabel)}</strong><span>${escapeHtml(job.state)}</span></div><p>${escapeHtml(job.jobType)} · ${escapeHtml(job.sourceLabel)}</p><dl><div><dt>Rail</dt><dd>${escapeHtml(job.railLabel)}</dd></div><div><dt>Updated</dt><dd>${escapeHtml(timeLabel(job.updatedAt))}</dd></div></dl><div class="eon-genuine-agent-progress-label">${progress}</div><button type="button" data-eon-genuine-agent-review-button="${escapeHtml(job.jobId)}" aria-pressed="${job.jobId === snapshot.selectedJobId ? 'true' : 'false'}">Review receipt</button></article>`;
      }).join('');
      renderReview(snapshot);
    };
    cleanups.push(controller.subscribe(render));

    const onClick = (event) => {
      const button = event.target?.closest?.('[data-eon-genuine-agent-review-button]');
      if (button) {
        const result = controller.review(String(button.dataset.eonGenuineAgentReviewButton || ''), { explicitUserAction: true });
        setStatus(result.ok ? 'Genuine job receipt reviewed. Native actions remain separate user choices.' : 'That genuine job receipt is no longer available.');
        return;
      }
      const route = event.target?.closest?.('[data-eon-agent-native-route]');
      if (!route) return;
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Agent Theatre native action chosen', detail: `The user chose ${route.dataset.eonAgentAction || 'review'} for a bounded genuine receipt. City did not execute or transfer private work.`, route: route.getAttribute('href') || '/' });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    };
    section.addEventListener('click', onClick);
    cleanups.push(() => section.removeEventListener('click', onClick));

    return () => {
      cleanups.splice(0).reverse().forEach((cleanup) => { try { cleanup(); } catch {} });
      controller.dispose();
      section.remove();
    };
  };

  const bindCommandRoom = () => {
    const panel = root.querySelector('[data-eon-command-room-panel]');
    const openButtons = [...root.querySelectorAll('[data-eon-play-open-command-room]')];
    if (!panel || !openButtons.length) return () => {};
    const review = panel.querySelector('[data-eon-command-room-review]');
    const highlight = panel.querySelector('[data-eon-command-room-highlight]');
    const focusFirst = () => panel.querySelector('[data-eon-command-room-master-station], [data-eon-command-room-action], [data-eon-command-room-explore]')?.focus?.({ preventScroll: true });
    const show = () => {
      panel.hidden = false;
      panel.dataset.eonCommandRoomState = 'open';
      runtime?.focusCommandDeck?.();
      setStatus('Command Room is open. Choose a work lane, review it, then continue only when you are ready.');
      focusFirst();
    };
    const hide = ({ focusExplore = false } = {}) => {
      panel.hidden = true;
      panel.dataset.eonCommandRoomState = 'explore';
      if (focusExplore) runtime?.resetView?.();
      setStatus('3D Explore is active. Use district signals or reopen Command Room at any time.');
      openButtons[0]?.focus?.({ preventScroll: true });
    };
    const runLocalAction = (action) => {
      const normalized = String(action || '').trim();
      if (normalized === 'share-command-center') { root.querySelector('[data-eon-play-share-city]')?.click(); return true; }
      if (normalized === 'district-map') { root.querySelector('[data-eon-play-open-travel-map]')?.click(); return true; }
      if (normalized === 'city-explore') { hide({ focusExplore: true }); return true; }
      if (normalized === 'command-deck') { root.querySelector('[data-eon-play-open-command-deck]')?.click(); return true; }
      if (normalized === 'eonbot-panel') { root.querySelector('[data-eon-play-open-eonbot]')?.click(); return true; }
      if (normalized === 'living-nexus-panel') { root.querySelector('[data-eon-play-open-living-nexus]')?.click(); return true; }
      return false;
    };

    const renderMasterStationReview = (stationId) => {
      if (!review) return false;
      const result = getEonCityW709MasterStationReview(stationId);
      if (!result.ok || !result.review) {
        review.innerHTML = '<p>That master-room station is unavailable in this build.</p>';
        return false;
      }
      const item = result.review;
      panel.querySelectorAll('[data-eon-command-room-master-station]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.eonCommandRoomMasterStation === stationId)));
      panel.querySelectorAll('[data-eon-command-room-screen]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
      if (result.local) {
        review.innerHTML = `<article><p class="eon-play-kicker">Command Centre station · in-City control</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><button type="button" data-eon-command-room-local-confirm="${escapeHtml(item.action)}">${escapeHtml(item.actionLabel)}</button></article>`;
      } else {
        review.innerHTML = `<article><p class="eon-play-kicker">Command Centre station · second click required</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><a href="${escapeHtml(item.route)}" data-eon-command-room-confirm="${escapeHtml(item.id)}" data-eon-command-room-confirm-route="${escapeHtml(item.route)}">${escapeHtml(item.actionLabel)} →</a></article>`;
      }
      review.querySelector('a,button')?.focus?.({ preventScroll: true });
      return true;
    };

    const renderScreenReview = (screenId) => {
      if (!review) return false;
      const result = getEonCityCommandRoomScreenReview(screenId);
      if (!result.ok || !result.review) {
        review.innerHTML = '<p>That Command Room screen is unavailable in this build.</p>';
        return false;
      }
      const item = result.review;
      panel.querySelectorAll('[data-eon-command-room-screen]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.eonCommandRoomScreen === screenId)));
      if (result.local) {
        review.innerHTML = `<article><p class="eon-play-kicker">In-City control</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><button type="button" data-eon-command-room-local-confirm="${escapeHtml(item.action)}">Open inside City</button></article>`;
      } else {
        review.innerHTML = `<article><p class="eon-play-kicker">Native EONAPP surface · second click required</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><a href="${escapeHtml(item.route)}" data-eon-command-room-confirm="${escapeHtml(item.id)}" data-eon-command-room-confirm-route="${escapeHtml(item.route)}">${escapeHtml(item.actionLabel)} →</a></article>`;
      }
      review.querySelector('a,button')?.focus?.({ preventScroll: true });
      return true;
    };
    const onExplore = () => hide({ focusExplore: true });
    const onMap = () => runLocalAction('district-map');
    const onShare = () => runLocalAction('share-command-center');
    const onHighlight = () => {
      const active = panel.classList.toggle('eon-command-room-highlight-mode');
      highlight.setAttribute('aria-pressed', String(active));
      highlight.textContent = active ? 'Hide interactives' : 'Show interactives';
      setStatus(active ? 'Interactive Command Room controls are highlighted. No action has started.' : 'Interactive highlights are off.');
    };
    const onPanelClick = (event) => {
      const localConfirm = event.target?.closest?.('[data-eon-command-room-local-confirm]');
      if (localConfirm) { runLocalAction(localConfirm.dataset.eonCommandRoomLocalConfirm); return; }
      const confirmed = event.target?.closest?.('[data-eon-command-room-confirm]');
      if (confirmed) {
        const route = String(confirmed.dataset.eonCommandRoomConfirmRoute || confirmed.getAttribute('href') || '');
        if (!route.startsWith('/')) { event.preventDefault(); return; }
        appendOperatorActivity({ source: 'city', status: 'info', title: 'Command Room route confirmed', detail: `The user confirmed ${confirmed.dataset.eonCommandRoomConfirm || 'a surface'} after review. No City content, provider output, entitlement, reward, or hidden action was transferred.`, route });
        disposeCityPlayRuntime(root);
        void exitImmersion();
        return;
      }
      const masterStation = event.target?.closest?.('[data-eon-command-room-master-station]');
      if (masterStation) {
        event.preventDefault();
        const stationId = String(masterStation.dataset.eonCommandRoomMasterStation || '');
        if (renderMasterStationReview(stationId)) setStatus('Master-room station reviewed. Use the second visible action when you are ready.');
        return;
      }
      const laneReview = event.target?.closest?.('[data-eon-command-room-agent-lane-review]');
      if (laneReview) {
        event.preventDefault();
        const screenId = String(laneReview.dataset.eonCommandRoomAgentLaneScreen || '');
        if (renderScreenReview(screenId)) setStatus('Agent Theater destination reviewed. Use the second visible action when you are ready.');
        return;
      }
      const screen = event.target?.closest?.('[data-eon-command-room-action]');
      if (!screen) return;
      event.preventDefault();
      if (renderScreenReview(String(screen.dataset.eonCommandRoomScreen || ''))) {
        setStatus('Destination reviewed. Use the second visible action to continue.');
      }
    };
    const onKeydown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = String(event.target?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || event.target?.isContentEditable) return;
      if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); hide({ focusExplore: true }); return; }
      if (event.key.toLowerCase() === 'r' && panel.hidden) { event.preventDefault(); show(); return; }
      if (panel.hidden) return;
      const key = event.key.toUpperCase();
      const match = [...panel.querySelectorAll('[data-eon-command-room-action]')].find((button) => String(button.dataset.eonCommandRoomShortcut || '').toUpperCase() === key);
      if (!match) return;
      event.preventDefault();
      match.click();
    };
    openButtons.forEach((button) => button.addEventListener('click', show));
    const explore = panel.querySelector('[data-eon-command-room-explore]');
    const map = panel.querySelector('[data-eon-command-room-map]');
    const share = panel.querySelector('[data-eon-command-room-share]');
    explore?.addEventListener('click', onExplore);
    map?.addEventListener('click', onMap);
    share?.addEventListener('click', onShare);
    highlight?.addEventListener('click', onHighlight);
    panel.addEventListener('click', onPanelClick);
    root.addEventListener('keydown', onKeydown);
    if (directEntry && !cityFirstRunVisible) show();
    return () => {
      openButtons.forEach((button) => button.removeEventListener('click', show));
      explore?.removeEventListener('click', onExplore);
      map?.removeEventListener('click', onMap);
      share?.removeEventListener('click', onShare);
      highlight?.removeEventListener('click', onHighlight);
      panel.removeEventListener('click', onPanelClick);
      root.removeEventListener('keydown', onKeydown);
    };
  };

  const bindCityShare = () => bindEonCitySharingCenter(root, { onStatus: setStatus });

  const bindCommandDeck = () => {
    const panel = root.querySelector('[data-eon-play-command-deck-panel]');
    const open = root.querySelector('[data-eon-play-open-command-deck]');
    const close = root.querySelector('[data-eon-play-close-command-deck]');
    const detail = root.querySelector('[data-eon-play-command-deck-detail]');
    if (!panel || !open || !close || !detail) return;
    let explorationPose = null;
    const renderDetail = (cardId) => {
      const card = getCommandDeckPanel(cardId);
      if (!card) { detail.innerHTML = '<p>That City station is unavailable in this local build.</p>'; return; }
      if (card.kind === 'native-route') {
        detail.innerHTML = `<p class="eon-play-kicker">Native surface · second click required</p><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.detail)}</p><a href="${escapeHtml(card.route)}" data-eon-play-command-deck-confirm="${escapeHtml(card.id)}">${escapeHtml(card.actionLabel)} →</a>`;
      } else {
        detail.innerHTML = `<p class="eon-play-kicker">In-world panel</p><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.detail)}</p><button type="button" data-eon-play-command-deck-local="${escapeHtml(card.panelId)}">${escapeHtml(card.actionLabel)}</button>`;
      }
      detail.querySelector('a, button')?.focus({ preventScroll: true });
    };
    const show = () => {
      // Opening the Deck may use a cinematic focus anchor, but it must never
      // overwrite the player's exploration pose. Restore on every non-routing close.
      explorationPose = runtime?.getExplorationPose?.() || null;
      runtime?.focusCommandDeck?.();
      panel.hidden = false;
      detail.innerHTML = '<p>Select a City station to review its local action.</p>';
      panel.querySelector('[data-eon-play-command-deck-card]')?.focus({ preventScroll: true });
      setStatus('Command Deck is open locally. Review a station before choosing any action.');
    };
    const hide = () => {
      panel.hidden = true;
      const restored = explorationPose && runtime?.restoreExplorationPose?.(explorationPose);
      explorationPose = null;
      if (!restored) setStatus('Returned to City. Your current view was preserved.');
      open.focus({ preventScroll: true });
    };
    open.addEventListener('click', show);
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
    panel.querySelectorAll('[data-eon-play-command-deck-card]').forEach((button) => button.addEventListener('click', () => renderDetail(button.dataset.eonPlayCommandDeckCard)));
    detail.addEventListener('click', (event) => {
      const localButton = event.target?.closest?.('[data-eon-play-command-deck-local]');
      if (localButton) {
        const panelId = String(localButton.dataset.eonPlayCommandDeckLocal || '');
        const trigger = panelId === 'eonbot'
          ? root.querySelector('[data-eon-play-open-eonbot]')
          : panelId === 'missions'
            ? root.querySelector('[data-eon-play-open-mission-board]')
            : root.querySelector('[data-eon-play-open-settings]');
        panel.hidden = true;
        trigger?.click();
        return;
      }
      const link = event.target?.closest?.('[data-eon-play-command-deck-confirm]');
      if (!link) return;
      const cardId = String(link.dataset.eonPlayCommandDeckConfirm || 'destination');
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Command Deck destination confirmed', detail: `The user confirmed the ${cardId} destination from the local Command Deck. No City content or hidden action was transferred.`, route: String(link.getAttribute('href') || '/') });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    });
  };

  const bindCreatorAtrium = () => {
    const panel = root.querySelector('[data-eon-play-creator-atrium-panel]');
    const open = root.querySelector('[data-eon-play-open-creator-atrium]');
    const close = root.querySelector('[data-eon-play-close-creator-atrium]');
    if (!panel || !open || !close) return;
    const show = () => {
      runtime?.focusCreatorAtrium?.();
      panel.hidden = false;
      panel.querySelector('[data-eon-play-creator-atrium-route]')?.focus({ preventScroll: true });
      setStatus('Creator Atrium is open locally. Choose a native creator or Forge surface only when you are ready.');
    };
    const hide = () => { panel.hidden = true; open.focus({ preventScroll: true }); };
    open.addEventListener('click', show);
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
    panel.querySelectorAll('[data-eon-play-creator-atrium-route]').forEach((link) => link.addEventListener('click', (event) => {
      const cardId = String(event.currentTarget?.dataset?.eonPlayCreatorAtriumRoute || 'destination');
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Creator Atrium destination chosen', detail: `The user selected the ${cardId} destination from the local Creator Atrium. No City content, file, model output, provider setting, or hidden action was transferred.`, route: String(event.currentTarget?.getAttribute?.('href') || '/') });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    }));
  };
  const bindMetropolisDistricts = () => {
    const panel = root.querySelector('[data-eon-play-metropolis-panel]');
    const openButtons = [...root.querySelectorAll('[data-eon-play-open-metropolis]')];
    const close = root.querySelector('[data-eon-play-close-metropolis]');
    if (!panel || !openButtons.length || !close) return;
    let lastOpen = openButtons[0];
    const show = () => {
      lastOpen = document.activeElement?.matches?.('[data-eon-play-open-metropolis]') ? document.activeElement : openButtons[0];
      panel.hidden = false;
      panel.querySelector('[data-eon-play-focus-metropolis]')?.focus({ preventScroll: true });
      setStatus('Living Creator Metropolis is open locally. Focus and native destinations still require a separate visible choice.');
    };
    const hide = () => { panel.hidden = true; lastOpen?.focus?.({ preventScroll: true }); };
    openButtons.forEach((button) => button.addEventListener('click', show));
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
    panel.querySelectorAll('[data-eon-play-focus-metropolis]').forEach((button) => button.addEventListener('click', () => {
      const districtId = String(button.dataset.eonPlayFocusMetropolis || '');
      const district = EON_CITY_METROPOLIS_DISTRICTS.find((entry) => entry.id === districtId);
      if (!district || !runtime?.focusMetropolisDistrict?.(districtId)) {
        setStatus('That City district could not be focused in this browser. No route opened.');
        return;
      }
      hide();
      setStatus(`${district.title} is now focused locally. No route opened.`);
    }));
    panel.querySelectorAll('[data-eon-play-metropolis-route]').forEach((link) => link.addEventListener('click', (event) => {
      const districtId = String(event.currentTarget?.dataset?.eonPlayMetropolisRoute || 'district');
      const launchId = String(event.currentTarget?.dataset?.eonPlayMetropolisLaunch || 'destination');
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Metropolis destination chosen', detail: `The user selected ${launchId} from the local ${districtId} card. No City content, account connection, provider action, schedule, or hidden work was transferred.`, route: String(event.currentTarget?.getAttribute?.('href') || '/') });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    }));
  };
  const bindSignalExpeditions = () => {
    const panel = root.querySelector('[data-eon-play-signal-expedition-panel]');
    const openButtons = [...root.querySelectorAll('[data-eon-play-open-signal-expedition]')];
    const close = root.querySelector('[data-eon-play-close-signal-expedition]');
    const content = root.querySelector('[data-eon-play-signal-expedition-content]');
    if (!panel || !openButtons.length || !close || !content) return;
    let lastOpen = openButtons[0];
    let session = readSignalExpeditionSession();
    let selectedTemplateId = session?.templateId || getSignalExpeditionTemplates()[0]?.id || '';
    let handoffReady = false;
    const show = () => {
      lastOpen = document.activeElement?.matches?.('[data-eon-play-open-signal-expedition]') ? document.activeElement : openButtons[0];
      render();
      panel.hidden = false;
      panel.querySelector('[data-eon-play-signal-template]')?.focus({ preventScroll: true });
      setStatus(session ? 'A local finite Signal Expedition is ready to continue. Nothing was read from a project or sent anywhere.' : 'Signal Expeditions are local finite planning routes. Select a template only when you are ready.');
    };
    const hide = () => { panel.hidden = true; lastOpen?.focus?.({ preventScroll: true }); };
    const nativeRouteChosen = (event, title = 'Signal Expedition native destination chosen') => {
      appendOperatorActivity({ source: 'city', status: 'info', title, detail: 'The user chose a native surface after a local Signal Expedition. No project data, source file, provider result, social connection, tracking, or hidden action was transferred.', route: String(event.currentTarget?.getAttribute?.('href') || '/') });
      disposeCityPlayRuntime(root);
      void exitImmersion();
    };
    const render = () => {
      const template = getSignalExpeditionTemplate(selectedTemplateId) || getSignalExpeditionTemplates()[0];
      if (!template) { content.textContent = 'No local Signal Expedition template is available in this source build.'; return; }
      const completed = new Set(session?.completedMissionIds || []);
      const progress = session ? `${completed.size}/${session.missions.length}` : '0/3';
      const templateCards = getSignalExpeditionTemplates().map((entry) => `<button type="button" class="eon-play-signal-template" data-eon-play-signal-template="${escapeHtml(entry.id)}" aria-pressed="${entry.id === selectedTemplateId ? 'true' : 'false'}" ${session ? 'disabled' : ''}><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.durationMinutes)} minute finite route · ${escapeHtml(entry.description)}</span></button>`).join('');
      const missions = session ? `<div class="eon-play-signal-missions"><p><strong>Local progress:</strong> ${escapeHtml(progress)}. This is not a productivity score, reward, or account record.</p>${session.missions.map((mission) => `<button type="button" data-eon-play-signal-mission="${escapeHtml(mission.id)}" ${mission.state === 'locked' || mission.state === 'complete' ? 'disabled' : ''}><strong>${escapeHtml(mission.label)}</strong><span>${mission.state === 'complete' ? 'Completed locally' : mission.state === 'locked' ? 'Unlock the previous step first' : 'Mark observed step locally'}</span></button>`).join('')}</div>` : '';
      const complete = session?.state === 'complete';
      const outcomes = session ? `<div class="eon-play-signal-outcomes"><a href="${escapeHtml(session.destination.route)}" data-eon-play-signal-destination>Open ${escapeHtml(session.destination.label)} after your click →</a>${complete ? `<button type="button" data-eon-play-signal-postcard>Create local Share/Remix postcard</button>${handoffReady ? '<a href="/workspace#eon-share" data-eon-play-signal-handoff>Review Share Pack →</a><a href="/workspace#eon-remix-card" data-eon-play-signal-handoff>Review Remix Card →</a>' : ''}` : '<p>Complete the three optional local steps before preparing a postcard.</p>'}</div>` : '';
      content.innerHTML = `<div class="eon-play-signal-expedition-flow"><div class="eon-play-signal-template-grid">${templateCards}</div><div class="eon-play-signal-start"><p><strong>Selected:</strong> ${escapeHtml(template.title)} · authored set pieces, finite duration, local browser session only.</p><label>Optional local project label <input data-eon-play-signal-label maxlength="96" autocomplete="off" value="${escapeHtml(session?.projectLabel || '')}" placeholder="Example: launch campaign" ${session ? 'disabled' : ''}></label>${session ? '<p>Your selected label remains only in this browser session and expires with it.</p>' : '<button type="button" data-eon-play-signal-start>Start local Signal Expedition</button>'}</div>${missions}${outcomes}</div>`;
      content.querySelectorAll('[data-eon-play-signal-template]').forEach((button) => button.addEventListener('click', () => {
        selectedTemplateId = String(button.dataset.eonPlaySignalTemplate || selectedTemplateId);
        render();
      }));
      content.querySelector('[data-eon-play-signal-start]')?.addEventListener('click', () => {
        try {
          session = createSignalExpeditionSession({ explicitUserAction: true, templateId: selectedTemplateId, projectLabel: content.querySelector('[data-eon-play-signal-label]')?.value || '' });
          const saved = saveSignalExpeditionSession(session);
          if (!saved.ok) throw new Error(saved.reason || 'browser_session_storage_unavailable');
          handoffReady = false;
          render();
          setStatus(`${session.title} started as a finite local route. No project was read, uploaded, or connected.`);
        } catch (error) {
          setStatus(`Signal Expedition was not started: ${String(error?.message || 'local browser session unavailable')}`);
        }
      });
      content.querySelectorAll('[data-eon-play-signal-mission]').forEach((button) => button.addEventListener('click', () => {
        const result = recordSignalExpeditionMission(session, button.dataset.eonPlaySignalMission, { explicitUserAction: true });
        if (!result.ok || !result.session) { setStatus('That local expedition step could not be recorded. No route or remote action was opened.'); return; }
        session = result.session;
        const saved = saveSignalExpeditionSession(session);
        if (!saved.ok) { clearSignalExpeditionSession(); session = null; handoffReady = false; setStatus('The local session expired or could not be saved. No data was uploaded.'); }
        render();
        if (session) setStatus(session.state === 'complete' ? 'Local Signal Expedition complete. You may create a local Share/Remix postcard or choose a native surface.' : 'Local Signal Expedition step recorded. Nothing was sent or published.');
      }));
      content.querySelector('[data-eon-play-signal-postcard]')?.addEventListener('click', () => {
        try {
          const result = writeEonOutputShareHandoff(buildSignalExpeditionPostcard(session));
          if (!result.ok) throw new Error(result.reason || 'browser_session_storage_unavailable');
          handoffReady = true;
          render();
          setStatus('A public-safe local Share/Remix postcard is ready for review. No link, post, invitation, tracking, or reward was created.');
        } catch (error) {
          setStatus(`The local postcard could not be prepared: ${String(error?.message || 'unknown local error')}`);
        }
      });
      content.querySelector('[data-eon-play-signal-destination]')?.addEventListener('click', (event) => nativeRouteChosen(event));
      content.querySelectorAll('[data-eon-play-signal-handoff]').forEach((link) => link.addEventListener('click', (event) => nativeRouteChosen(event, 'Signal Expedition Share/Remix review chosen')));
    };
    openButtons.forEach((button) => button.addEventListener('click', show));
    close.addEventListener('click', hide);
    panel.addEventListener('click', (event) => { if (event.target === panel) hide(); });
  };
  lifecycle.own('w660i-directional-input', bindMovementControls(root, runtime));
  bindControlGuide(root);
  bindInWorldSettings();
  const unbindCommandRoom = bindCommandRoom();
  lifecycle.own('w653-command-room', unbindCommandRoom);
  const unbindTruthfulCommandCenter = bindTruthfulCommandCenter();
  lifecycle.own('w624h-truthful-command-center', unbindTruthfulCommandCenter);
  const unbindGenuineAgentTheatre = bindGenuineAgentTheatre();
  lifecycle.own('w624i-genuine-agent-theatre', unbindGenuineAgentTheatre);
  bindCityFirstRun();
  bindAuthoredVerticalSliceGuide();
  bindCommandDeck();
  lifecycle.own('w624j-sharing-center', bindCityShare());
  const unbindUniverseCompletion = bindEonCityUniverseCompletionPanel(root, { onStatus: setStatus });
  lifecycle.own('w576-w590-universe-completion', unbindUniverseCompletion);
  bindMissionBoard();
  bindCreatorAtrium();
  bindMetropolisDistricts();
  bindSignalExpeditions();
  bindEonbotWorkDock();
  bindPerformanceLab();
  bindCityValidationLab();
  bindCityArtReview();
  const unbindCastCertification = bindEonCityCastCertificationPanel(root, { getRuntime: () => runtime, onStatus: setStatus });
  lifecycle.own('w662g-cast-certification', unbindCastCertification);
  bindScriptedCityGuide(root, () => nearbyLandmark);
  bindEonbotCompanionPanel(root, { quality: selectedQuality, reducedMotion: reducedEffects || capability.reducedMotion });
  const unbindOrbitCompanion = bindEonbotOrbitCompanion(root, { getRuntime: () => runtime, getNearbyLandmark: () => nearbyLandmark, savedProjectCount: projectDistrictSnapshot.activeCount, reducedMotion: reducedEffects || capability.reducedMotion, onStatus: setStatus });
  lifecycle.own('w624e-eonbot-orbit', unbindOrbitCompanion);
  const unbindCommandDistrictNpcs = bindCommandDistrictNpcSystem(root, { getRuntime: () => runtime, quality: selectedQuality, reducedMotion: reducedEffects || capability.reducedMotion, onStatus: setStatus });
  lifecycle.own('w624f-command-district-npcs', unbindCommandDistrictNpcs);
  const unbindProductiveRpg = bindProductiveRpgLoop(root, { onStatus: setStatus });
  lifecycle.own('w624g-productive-rpg-loop', unbindProductiveRpg);
  const unbindLivingNexus = bindEonCityLivingNexusPanel(root, { getRuntime: () => runtime, onStatus: setStatus });
  lifecycle.own('w660p-living-nexus-hybrid', unbindLivingNexus);
  const unbindLivingNexusEncounters = bindEonCityLivingNexusEncounterPanel(root, { getRuntime: () => runtime, onStatus: setStatus });
  lifecycle.own('w660s-living-nexus-encounters', unbindLivingNexusEncounters);
  const unbindLivingNexusRealms = bindEonCityLivingNexusRealmPanel(root, { getRuntime: () => runtime, onStatus: setStatus });
  lifecycle.own('w660v-living-nexus-realms', unbindLivingNexusRealms);
  const unbindVoiceConsent = bindEonbotVoiceConsentPanel(root, { onStatus: setStatus, getRuntime: () => runtime });
  lifecycle.own('voice-consent', unbindVoiceConsent);
  const unbindSoundscapePolicyPanel = bindEonCitySoundscapePolicyPanel(root, {
    soundscape,
    soundscapePolicy,
    getRuntime: () => runtime,
    getPreferences: () => soundscapePrefs,
    setPreferences: (next) => {
      soundscapePrefs = normalizeCitySoundscapePreferences(next);
      soundscape.setPreferences(soundscapePrefs);
      return soundscapePrefs;
    },
    isReducedEffects: () => Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory),
    onStatus: setStatus
  });
  lifecycle.own('soundscape-policy-panel', unbindSoundscapePolicyPanel);
  const unbindAccessibilityDevice = bindEonCityAccessibilityDeviceSystem(root, {
    onStatus: setStatus,
    onApply: ({ preferences }) => {
      if (preferences.muted || preferences.reducedSensory) {
        soundscapePolicy.stop({ explicitUserAction: true, reason: preferences.reducedSensory ? 'w624k-reduced-sensory' : 'w624k-muted' });
        soundscape.stopForRuntimeGuard?.(preferences.reducedSensory ? 'w624k-reduced-sensory' : 'w624k-muted');
      }
    }
  });
  lifecycle.own('w624k-accessibility-device', unbindAccessibilityDevice);
  const unbindFlagshipCertification = bindEonCityFlagshipCertification(root, { onStatus: setStatus, deviceClass: selectedQuality === 'lite' ? 'low' : selectedQuality === 'cinematic' ? 'high' : 'mid', getRuntime: () => runtime });
  lifecycle.own('w624l-flagship-certification', unbindFlagshipCertification);
  const returnedMission = readCityBeginnerMissionFromSearch(globalThis.location?.search || '');
  if (returnedMission.ok && returnedMission.receipt.returnedAt) {
    commandDistrictState = recordCommandDistrictEvent('returned', { landmarkId: returnedMission.receipt.sourceLandmarkId }).state;
    renderDistrictCard(commandDistrictState);
    previewController.event('mission-returned', 'pass');
    previewController.task('local-mission-outcome', 'pass');
    setStatus(`Returned from ${returnedMission.receipt.missionLabel}. Its local receipt remains in this browser only.`);
  }
  updateNearbyLandmark(runtime.getNearestLandmark?.());
  contextActionButton?.addEventListener('click', () => requestInteraction('context-action'));
  root.querySelector('[data-eon-play-context-action-proxy]')?.addEventListener('click', () => requestInteraction('primary-dock'));
  gatewayGuide?.addEventListener('click', guideLivingNexusGateway);
  gatewayInspect?.addEventListener('click', inspectLivingNexusGateway);
  gatewayEnter?.addEventListener('click', enterLivingNexusGateway);
  gatewayMapToggle?.addEventListener('click', () => {
    const expanded = gatewayMapToggle.getAttribute('aria-expanded') === 'true';
    gatewayMapToggle.setAttribute('aria-expanded', String(!expanded));
    gatewayMapToggle.textContent = expanded ? 'Compact map' : 'Hide compact map';
    if (gatewayMap) gatewayMap.hidden = expanded;
  });
  mapToggle?.addEventListener('click', () => toggleMinimap('ui'));
  touchDpadToggle?.addEventListener('click', () => setTouchDpadVisible(!touchDpadVisible));
  clickMoveToggle?.addEventListener('click', () => {
    const enabled = runtime.setClickMove?.(clickMoveToggle.getAttribute('aria-pressed') !== 'true');
    updateClickMove(enabled);
    const message = enabled ? 'Click-to-move enabled locally. Click the district floor to set a movement marker.' : 'Click-to-move disabled.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  });
  pointerLookToggles.forEach((button) => button.addEventListener('click', () => {
    const result = runtime?.togglePointerLook?.();
    updatePointerLook();
    if (!result) return;
    const snapshot = runtime?.getThirdPersonSummary?.()?.pointerLook || latestPointerLookState || {};
    const message = result.ok === false
      ? 'Pointer look could not be requested here. Mouse drag controls remain available.'
      : snapshot.active
        ? 'Pointer look is active locally. Press Escape to release it; WASD still moves the operator.'
        : snapshot.requested
          ? 'Pointer look requested from your action. Confirm the browser prompt if it appears; Escape releases it.'
          : 'Pointer look released. Standard mouse drag controls are available again.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelectorAll('[data-eon-play-camera-cycle]').forEach((button) => button.addEventListener('click', () => {
    const result = runtime?.cycleWayfinderCamera?.();
    const summary = runtime?.getWayfinderSummary?.();
    const message = result?.ok ? `${result.label} camera selected. Camera collision avoidance remains local and automatic; no navigation or work action occurs.` : 'The City camera could not change in this browser.';
    button.textContent = summary?.cameraProfileId ? `Camera: ${summary.cameraProfileId}` : 'Camera view';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelectorAll('[data-eon-play-camera-reset]').forEach((button) => button.addEventListener('click', () => {
    const result = runtime?.resetWayfinderCamera?.();
    const message = result?.ok ? 'Follow camera restored locally. Player position and work state were not changed.' : 'The City camera could not reset in this browser.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelectorAll('[data-eon-play-wayfinder-state]').forEach((button) => button.addEventListener('click', () => {
    const state = button.dataset.eonPlayWayfinderState || 'inspect';
    const result = runtime?.requestWayfinderState?.(state, { durationMs: state === 'sit-work' ? 1800 : 1000 });
    const message = result?.ok ? `${state} pose previewed locally. It does not execute work, open a route or change account state.` : 'That Wayfinder pose is unavailable.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelectorAll('[data-eon-play-reset-view]').forEach((button) => button.addEventListener('click', () => {
    const reset = runtime.resetView?.();
    if (reset) {
      try { captureEonCityResumeFromRuntime(runtime, { reason: 'explicit-arrival-reset', lastDestinationId: null }); } catch {}
    }
    const message = reset ? 'City view reset locally. Movement and camera are ready again.' : 'City view could not reset in this browser. Restart EON City or choose low-detail mode if you need a stable recovery.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelectorAll('[data-eon-play-unstuck]').forEach((button) => button.addEventListener('click', () => {
    const result = runtime.unstuck?.();
    if (result?.ok) {
      try { captureEonCityResumeFromRuntime(runtime, { reason: 'explicit-authored-unstuck', lastDestinationId: null }); } catch {}
    }
    const message = result?.ok
      ? `Returned to ${result.safePointId}. City work, routes, projects, providers, billing and account state were not changed.`
      : 'No authored safe point was available. Reset the view or restart EON City in low-detail mode.';
    setStatus(message);
    if (inputStatus) inputStatus.textContent = message;
  }));
  root.querySelector('[data-eon-play-save-proof]')?.addEventListener('click', () => {
    previewController.event('frame-note-saved', 'pass');
    const result = saveLocalProof(runtime.getRuntimeSummary(), capability);
    if (proofStatus) proofStatus.textContent = result.ok ? 'Saved a local W249 frame note. Nothing was uploaded.' : 'The local frame note could not be saved in this browser.';
  });
  root.querySelector('[data-eon-play-pause]')?.addEventListener('click', () => pauseSession('ui'));
  root.querySelector('[data-eon-play-resume]')?.addEventListener('click', () => {
    if (root.dataset.eonCityWorkloadPause === 'active') {
      setStatus('City is paused while the approved local media job is using the device. Cancel or finish that job before resuming City.');
      return;
    }
    delete root.dataset.eonCityManualPause;
    runtime.resume();
    soundscapePolicy.setRuntime({
      cityPaused: false,
      tabVisible: globalThis.document?.visibilityState !== 'hidden',
      reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
    });
    root.dataset.eonCityPlaySoundscape = 'off';
    previewController.event('resumed', 'pass');
    previewController.task('pause-and-resume', 'pass');
    acknowledgeSensoryAction('resume');
    if (pausePanel) pausePanel.hidden = true;
  });
  root.querySelector('[data-eon-play-enter-fullscreen]')?.addEventListener('click', () => {
    void (async () => {
      const result = await requestImmersion(root, capability);
      soundscapePolicy.setRuntime({
        cityPaused: Boolean(runtime?.isPaused?.()),
        tabVisible: globalThis.document?.visibilityState !== 'hidden',
        reducedEffects: Boolean(reducedEffects || capability?.reducedMotion || soundscapePrefs.reducedSensory)
      });
      if (proofStatus) proofStatus.textContent = result.fullscreen ? 'Full screen requested from your action. Local sound remains off until its separate setting is chosen.' : 'Browser display mode remains available.';
      setStatus(result.fullscreen ? 'Full screen requested. Local sound remains off until you choose Turn on local sound in City settings.' : 'Full screen was not available. The City remains playable in this view.');
    })();
  });
  root.querySelector('[data-eon-play-exit-fullscreen]')?.addEventListener('click', () => { void exitImmersion(); });
  root.querySelectorAll('[data-eon-play-exit-city]').forEach((link) => link.addEventListener('click', () => { previewController.event('city-lite-returned', 'pass'); previewController.task('city-lite-return', 'pass'); disposeCityPlayRuntime(root); void exitImmersion(); }));
}


function renderGate(root, capability) {
  const defaultQuality = normalizeCityPlayQuality(undefined, capability);
  const sensory = readCitySensoryPreferences();
  const soundscape = CITY_SOUNDSCAPE_DEFAULTS;
  root.dataset.eonCityPlayState = 'gate';
  root.innerHTML = `
    <section class="eon-play-gate" aria-labelledby="eon-play-title">
      <div class="eon-play-gate-art" aria-hidden="true"><span class="eon-play-gate-sun"></span><span class="eon-play-gate-grid"></span><span class="eon-play-gate-tower"></span></div>
      <div class="eon-play-gate-copy"><p class="eon-play-kicker">EON City · Immersive Work Mode</p><h1 id="eon-play-title">Enter the Neon Command District</h1><p>Full-screen, landscape-first Immersive Work Mode is the flagship City experience. It includes original procedural district art, controlled renderer loading, touch controls, lifecycle cleanup, context-loss fallback, and local frame evidence. Final device and human visual proof is still required.</p><div class="eon-play-capability">${capabilityLines(capability)}</div><p class="eon-play-gate-note">${escapeHtml(capability.guidance)}</p><label class="eon-play-quality">Visual profile <select data-eon-play-quality>${buildQualityOptions(defaultQuality)}</select></label><label class="eon-play-reduced"><input type="checkbox" data-eon-play-reduced ${capability.reducedMotion ? 'checked' : ''}> Reduce effects</label><fieldset class="eon-play-sensory" data-w273-sensory-options><legend>Optional sensory cues</legend><label><input type="checkbox" data-eon-play-sound ${sensory.sound ? 'checked' : ''}> Sound cue after an action</label><label><input type="checkbox" data-eon-play-haptics ${sensory.haptics ? 'checked' : ''}> Vibration after an action</label><p data-eon-play-sensory-gate-status>${escapeHtml(describeSensoryPreferences(sensory))}. Off by default; no sound or vibration starts until you enable it and choose an action. Visual status remains available.</p></fieldset><fieldset class="eon-play-soundscape" data-eon-play-soundscape><legend>Optional adaptive soundscape</legend><label><input type="checkbox" data-eon-play-soundscape-ambience ${soundscape.ambience ? 'checked' : ''}> Local procedural ambience after entry</label><label><input type="checkbox" data-eon-play-soundscape-ui ${soundscape.ui ? 'checked' : ''}> Local UI tones after actions</label><label><input type="checkbox" data-eon-play-soundscape-music ${soundscape.music ? 'checked' : ''}> Remember music preference</label><label><input type="checkbox" data-eon-play-soundscape-voice ${soundscape.voice ? 'checked' : ''}> Captions-first EONBOT voice preference</label><label><input type="checkbox" data-eon-play-soundscape-reduced ${soundscape.reducedSensory || capability.reducedMotion ? 'checked' : ''}> Reduced sensory mode</label><p data-eon-play-soundscape-gate-status>Off by default. No original music stems or voice pack are shipped yet; no microphone, download or automatic sound is used.</p></fieldset><div class="eon-play-gate-actions"><button type="button" class="eon-play-primary" data-eon-play-start>Enter Immersive Work Mode</button><a class="eon-play-secondary" href="/eoncity">Use EON City</a><a class="eon-play-tertiary" href="/eoncity">Restart EON City</a><a class="eon-play-tertiary" href="/profile?returnTo=%2Feoncity#eon-profile-account-foundation">Account &amp; backup</a></div><p class="eon-play-disclosure">Guest entry remains available. Optional Google Login is account access only and does not back up City progress, Chat, Vault, projects or local settings.</p><p class="eon-play-disclosure">No wallet, token, reward, loot, payment, referral, provider request, Chat content, or remote telemetry is active here.</p></div>
    </section>`;
  const getSensory = () => ({
    sound: Boolean(root.querySelector('[data-eon-play-sound]')?.checked),
    haptics: Boolean(root.querySelector('[data-eon-play-haptics]')?.checked)
  });
  const getSoundscape = () => ({
    ambience: Boolean(root.querySelector('[data-eon-play-soundscape-ambience]')?.checked),
    ui: Boolean(root.querySelector('[data-eon-play-soundscape-ui]')?.checked),
    music: Boolean(root.querySelector('[data-eon-play-soundscape-music]')?.checked),
    voice: Boolean(root.querySelector('[data-eon-play-soundscape-voice]')?.checked),
    reducedSensory: Boolean(root.querySelector('[data-eon-play-soundscape-reduced]')?.checked)
  });
  const updateSensoryGate = () => {
    const next = saveCitySensoryPreferences(getSensory());
    const status = root.querySelector('[data-eon-play-sensory-gate-status]');
    if (status) status.textContent = `${describeSensoryPreferences(next)}. Off by default; no sound or vibration starts until you enable it and choose an action. Visual status remains available.`;
    const soundscapeStatus = root.querySelector('[data-eon-play-soundscape-gate-status]');
    const soundscapeNext = normalizeCitySoundscapePreferences(getSoundscape());
    if (soundscapeStatus) {
      soundscapeStatus.textContent = soundscapeNext.reducedSensory
        ? 'Reduced sensory mode will keep ambience and UI tones off. Visual status remains available.'
        : 'No original music stems or voice pack are shipped yet; no microphone, download or automatic sound is used.';
    }
  };
  root.querySelectorAll('[data-eon-play-sound], [data-eon-play-haptics], [data-eon-play-soundscape-ambience], [data-eon-play-soundscape-ui], [data-eon-play-soundscape-music], [data-eon-play-soundscape-voice], [data-eon-play-soundscape-reduced]').forEach((control) => control.addEventListener('change', updateSensoryGate));
  root.querySelector('[data-eon-play-start]')?.addEventListener('click', () => {
    const quality = root.querySelector('[data-eon-play-quality]')?.value;
    const reducedEffects = Boolean(root.querySelector('[data-eon-play-reduced]')?.checked);
    const sensoryPreferences = saveCitySensoryPreferences(getSensory());
    const soundscapePreferences = normalizeCitySoundscapePreferences(getSoundscape());
    void startPlay(root, capability, { quality, reducedEffects, sensoryPreferences, soundscapePreferences, previewEvidence: isCityPreviewEvidenceMode(globalThis.location?.search || '') });
  });
}

export function createEonCityW649PreviewEvidenceBridge({ enabled = false, getRuntime = () => null } = {}) {
  if (!enabled) return null;
  const districtIds = Object.freeze(EON_CITY_W649_DISTRICT_MANIFEST.districts.map((entry) => entry.id).filter((id) => id !== 'bootstrap'));
  const knownDistricts = new Set(districtIds);
  const runtime = () => {
    try { return getRuntime?.() || null; } catch { return null; }
  };
  const getSnapshot = () => {
    const current = runtime();
    return Object.freeze({
      schema: 'eon.city.w649.preview-evidence-bridge.v1',
      ready: Boolean(current),
      districtIds,
      core: current?.getW649CoreSummary?.() || null,
      district: current?.getW649DistrictSummary?.() || null,
      localOnly: true,
      evidenceOnly: true,
      routeExecutionAllowed: false,
      privateDataIncluded: false,
      visualApprovalRequired: true
    });
  };
  return Object.freeze({
    schema: 'eon.city.w649.preview-evidence-bridge.v1',
    districtIds,
    getSnapshot,
    async enterDistrict(districtId = '') {
      const normalized = String(districtId || '').trim();
      if (!knownDistricts.has(normalized)) return Object.freeze({ ok: false, reason: 'unknown-w649-district', districtId: normalized, snapshot: getSnapshot() });
      const current = runtime();
      if (!current?.enterW649District) return Object.freeze({ ok: false, reason: 'w649-runtime-not-ready', districtId: normalized, snapshot: getSnapshot() });
      const result = await current.enterW649District(normalized, { reason: 'preview-evidence-explicit' });
      return Object.freeze({ ...result, snapshot: getSnapshot() });
    },
    requestPlayerState(state = 'idle') {
      const current = runtime();
      return current?.requestW649PlayerState?.(state, { restart: true, durationMs: 900 }) || Object.freeze({ ok: false, reason: 'w649-runtime-not-ready' });
    },
    requestNpcState(assetId = '', state = 'idle') {
      const current = runtime();
      return current?.requestW649NpcState?.(assetId, state, { restart: true, durationMs: 900 }) || Object.freeze({ ok: false, reason: 'w649-runtime-not-ready' });
    },
    getDistrictActions(districtId = '') {
      const normalized = String(districtId || '').trim();
      if (normalized && !knownDistricts.has(normalized)) return Object.freeze([]);
      return runtime()?.getW649DistrictActions?.(normalized) || Object.freeze([]);
    }
  });
}

export function mountEonCityPlayStation(root = document.querySelector('[data-eon-city-play-root]'), { runtimeStateMachine = null, assetManifest = null } = {}) {
  if (!root) return null;
  try {
    if (runtimeStateMachine?.getSnapshot?.().state === 'checking-access') runtimeStateMachine.transition('loading-shell', 'access-confirmed');
  } catch {}
  const routeRepair = canonicalizeCityLocation();
  if (routeRepair.changed) root.dataset.eonCityCanonicalized = 'true';
  disposeCityPlayRuntime(root);
  const directEntry = root.hasAttribute('data-eon-city-direct-entry');
  setCityRouteState(root, 'booting');
  // Old immersive documents remain in the source for build/history compatibility,
  // but they are not a second guest City entry. If one is ever served without the
  // edge redirect, send it to the access-station route before any renderer import.
  if (!directEntry && root.hasAttribute('data-eon-city-legacy-play-document')) {
    const target = routeRepair.target || '/eoncity';
    root.dataset.eonCityLegacyRedirect = 'required';
    try {
      if (typeof globalThis.location?.replace === 'function') {
        globalThis.location.replace(target);
        return Object.freeze({ schema: CITY_PLAY_STATION_SCHEMA, redirected: true, target });
      }
    } catch {}
    root.innerHTML = `<section class="eon-play-gate"><p class="eon-play-kicker">EON City · canonical entry</p><h1>Use the protected City entry</h1><p>This legacy document does not start the renderer. Continue through the EON City access station.</p><a class="eon-play-primary" href="/eoncity">Open EON City</a></section>`;
    return Object.freeze({ schema: CITY_PLAY_STATION_SCHEMA, redirected: false, blockedLegacyDocument: true, target });
  }
  const entry = directEntry ? 'direct-city-entry' : 'immersive-work';
  enterCityMode('immersive-work', { entry });
  modeTrackingUnsubscribers.set(root, bindCityModeLinkTracking(root, 'immersive-work', { entry }));
  const capability = getCityPlayCapability();
  root.dataset.eonCityPlaySchema = CITY_PLAY_STATION_SCHEMA;
  root.dataset.eonCityDirectEntry = String(directEntry);
  if (!capability.eligible) {
    renderFallback(root, capability, '', { onRetry: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }) });
  } else if (directEntry) {
    const mobileMode = getCityMobileMode({ isMobile: capability.isMobile });
    root.dataset.eonCityMobileMode = mobileMode.mode;
    // R10: every eligible direct entry starts the one canonical Babylon City.
    // Portrait is responsive gameplay, never a separate companion product.
    // Fullscreen, orientation lock and audio remain explicit user actions.
    void startPlay(root, capability, {
      quality: normalizeCityPlayQuality(undefined, capability),
      reducedEffects: Boolean(capability.reducedMotion),
      sensoryPreferences: readCitySensoryPreferences(),
      soundscapePreferences: CITY_SOUNDSCAPE_DEFAULTS,
      previewEvidence: isCityPreviewEvidenceMode(globalThis.location?.search || ''),
      requestFullscreen: false,
      entryMode: 'direct',
      runtimeStateMachine,
      assetManifest
    });
  } else {
    renderGate(root, capability);
  }
  const w649Preview = createEonCityW649PreviewEvidenceBridge({
    enabled: isCityPreviewEvidenceMode(globalThis.location?.search || ''),
    getRuntime: () => runtimes.get(root) || null
  });
  const controller = Object.freeze({
    schema: CITY_PLAY_STATION_SCHEMA,
    capability,
    directEntry,
    localProofCount: readLocalProofs().length,
    ...(w649Preview ? { w649Preview } : {}),
    reset: () => mountEonCityPlayStation(root, { runtimeStateMachine, assetManifest }),
    destroy: () => {
      disposeCityPlayRuntime(root);
      void exitImmersion();
    }
  });
  globalThis.EON_CITY_PLAY = controller;
  return controller;
}

export function disposeEonCityPlayStation(root = document.querySelector('[data-eon-city-play-root]'), reason = 'station-dispose') {
  if (!root) return false;
  disposeCityPlayRuntime(root, reason);
  void exitImmersion();
  return true;
}

// W624B: no auto-mount. The runtime owner is the only production lifecycle authority.

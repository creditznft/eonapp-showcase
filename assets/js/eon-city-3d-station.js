/**
 * W248 — optional WebGL Spatial Command Space of the shared CityWorldState.
 *
 * City Overview remains the resilient fallback. This route is an explicit, device-gated,
 * local-only Spatial Command Space renderer of the same districts, avatar, Realm palette and
 * progress. It is not a second product, multiplayer city, economy, market,
 * NPC simulation, or background task runner.
 */
import { appendOperatorActivity } from './operator/operator-activity.js';
import { describeAgentPresence, getAgentPresenceOutcome, getAgentPresenceSummary, readAgentPresencePreferences, saveAgentPresencePreferences, subscribeAgentPresence } from './operator/agent-presence.js';
import { ensureCityWorldState, getCityWorldPublicSummary } from './city/city-world-state.js';
import { prepareCityAction, confirmPreparedCityAction } from './city/city-prepared-action.js';
import { offerCityBeginnerMission, openCityBeginnerMission, dismissCityBeginnerMission } from './city/city-work-mission.js';
import { CITY_DISTRICTS } from './city/eon-city-2d-engine.js';
import { buildCity3dLocalProofExport, classifyCity3dRuntime, readCity3dLocalProofs, saveCity3dLocalProof } from './city/eon-city-3d-proof.js';
import { bindCityModeLinkTracking, enterCityMode, prepareCityModeTransition } from './city/city-mode-transition.js';
import { buildSpatialCommandProjection, normalizeSpatialCommandCameraPreset } from './city/eon-city-spatial-command-space.js';
import { createCityWorkLoopProposal, getCityWorkLoopIntents } from './city/eon-city-work-loop.js';
import { CITY_SOUNDSCAPE_DEFAULTS, createCityAdaptiveSoundscape, normalizeCitySoundscapePreferences } from './city/eon-city-adaptive-soundscape.js';
import { createEonCitySoundscapePolicyController } from './city/eon-city-soundscape-policy.js';

const STATION_SCHEMA = 'eon.city.webgl-station.v2';
const runtimes = new WeakMap();
const presenceUnsubscribers = new WeakMap();
const modeTrackingUnsubscribers = new WeakMap();
const soundscapeControllers = new WeakMap();
const soundscapePolicyControllers = new WeakMap();

function safeBoolean(value) { return value === true; }

function escapeHtml(value = '') {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&quot;').replace(/'/g, '&#39;');
}

function probeWebgl(doc = globalThis.document) {
  try {
    const canvas = doc?.createElement?.('canvas');
    if (!canvas) return { available: false, webgl2: false };
    const webgl2 = Boolean(canvas.getContext('webgl2'));
    const available = webgl2 || Boolean(canvas.getContext('webgl'));
    return { available, webgl2 };
  } catch {
    return { available: false, webgl2: false };
  }
}

function recommendedQuality({ cores, memoryGb, viewport }) {
  if (Number(cores) >= 8 && Number(memoryGb) >= 8 && viewport.width >= 1180) return 'high';
  if (Number(cores) > 0 && Number(cores) <= 4) return 'low';
  if (Number(memoryGb) > 0 && Number(memoryGb) <= 3) return 'low';
  return 'balanced';
}

/** Device truth only; it does not start a renderer or make a performance claim. */
export function getEonCity3dCapability(options = {}) {
  const win = options.window || globalThis;
  const nav = win.navigator || {};
  const reducedMotion = safeBoolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const saveData = safeBoolean(nav.connection?.saveData);
  const coresRaw = Number(nav.hardwareConcurrency);
  const memoryRaw = Number(nav.deviceMemory);
  const width = Number(win.innerWidth || 0);
  const height = Number(win.innerHeight || 0);
  const webgl = probeWebgl(options.document || win.document);
  const coresKnown = Number.isFinite(coresRaw) && coresRaw > 0;
  const memoryKnown = Number.isFinite(memoryRaw) && memoryRaw > 0;
  const coresOk = !coresKnown || coresRaw >= 4;
  const memoryOk = !memoryKnown || memoryRaw >= 4;
  const viewportOk = Math.max(width, height) >= 720 && Math.min(width, height) >= 420;
  const capable = webgl.available && !reducedMotion && !saveData && coresOk && memoryOk && viewportOk;
  const reasons = [];
  if (!webgl.available) reasons.push('WebGL is not available in this browser.');
  if (reducedMotion) reasons.push('Reduced motion is enabled.');
  if (saveData) reasons.push('Data saver is enabled.');
  if (!coresOk) reasons.push('This device reports fewer than four CPU cores.');
  if (!memoryOk) reasons.push('This device reports less than 4 GB of memory.');
  if (!viewportOk) reasons.push('This viewport is too small for the optional Spatial Command Space.');
  const viewport = { width, height, capable: viewportOk };
  return Object.freeze({
    schema: STATION_SCHEMA,
    capable,
    webgl: webgl.available,
    webgl2: webgl.webgl2,
    reducedMotion,
    saveData,
    cores: coresKnown ? coresRaw : null,
    memoryGb: memoryKnown ? memoryRaw : null,
    viewport,
    recommendedQuality: recommendedQuality({ cores: coresKnown ? coresRaw : 0, memoryGb: memoryKnown ? memoryRaw : 0, viewport }),
    reasons
  });
}

/** Backward-compatible name for earlier source-only callers. */
export const getCalmStationCapability = getEonCity3dCapability;

function worldSummary() {
  const loaded = ensureCityWorldState();
  return { loaded, state: loaded.state, summary: getCityWorldPublicSummary(loaded.state) };
}

function stateLine(summary) {
  const discovered = summary.unlockedDistricts.length;
  const last = CITY_DISTRICTS.find((district) => district.id === summary.progress.lastDistrictId)?.name || 'No district visited yet';
  return `${escapeHtml(summary.avatar.name || 'Operator')} · ${discovered}/${CITY_DISTRICTS.length} districts discovered · ${escapeHtml(last)}`;
}

function disposeVisualTourRuntime(root) {
  try { presenceUnsubscribers.get(root)?.(); } catch {}
  presenceUnsubscribers.delete(root);
  runtimes.get(root)?.destroy?.();
  runtimes.delete(root);
  try { modeTrackingUnsubscribers.get(root)?.(); } catch {}
  modeTrackingUnsubscribers.delete(root);
  try { soundscapeControllers.get(root)?.dispose?.(); } catch {}
  soundscapeControllers.delete(root);
  try { soundscapePolicyControllers.get(root)?.dispose?.(); } catch {}
  soundscapePolicyControllers.delete(root);
}

function renderFallback(root, capability, summary, reason = '') {
  disposeVisualTourRuntime(root);
  root.dataset.eonCity3dState = 'fallback';
  const reasonText = reason
    ? `Spatial Command Space returned safely to City Overview (${escapeHtml(reason)}).`
    : 'This device stays on City Overview.';
  root.innerHTML = `
    <section class="eon3-station-fallback" aria-labelledby="eon3-station-title">
      <p class="eon3-station-kicker">City Overview remains available</p>
      <h2 id="eon3-station-title">${reason ? 'Returned safely to City Overview.' : 'This device stays on City Overview.'}</h2>
      <p>${reasonText} The optional Spatial Command Space is never required for City progress, saved state, or any native route.</p>
      <p class="eon3-state-line">${stateLine(summary)}</p>
      <ul>${capability.reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>Use City Overview for the clearest, lightest experience.</li>'}</ul>
      <div class="eon3-station-actions"><a class="eon-hub-primary" href="/eoncity/lite">Open City Overview</a><a class="eon-operator-secondary" href="/chat?new=1">Ask EONBOT</a></div>
      <small>No City state was changed by this fallback. No simulation, market action, reward, payout, or background activity was started.</small>
    </section>`;
}

function qualityOptions(selected = 'balanced') {
  return ['low', 'balanced', 'high'].map((quality) => `<option value="${quality}"${quality === selected ? ' selected' : ''}>${quality[0].toUpperCase()}${quality.slice(1)}</option>`).join('');
}

function proofText(summary = {}) {
  const verdict = classifyCity3dRuntime(summary);
  const fps = summary.estimatedFps ? `${summary.estimatedFps} FPS` : 'collecting samples';
  const frame = summary.averageFrameMs ? `${summary.averageFrameMs} ms average` : 'no frame average yet';
  return `${verdict.label} ${fps} · ${frame} · render scale ${Math.round(Number(summary.resolutionScale || 1) * 100)}%.`;
}

function downloadLocalProof(report) {
  const text = buildCity3dLocalProofExport(report);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eon-city-3d-local-proof-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderGate(root, capability, summary) {
  disposeVisualTourRuntime(root);
  root.dataset.eonCity3dState = 'gate';
  root.innerHTML = `
    <section class="eon3-station-gate" aria-labelledby="eon3-gate-title">
      <p class="eon3-station-kicker">Optional Three.js Spatial Command Space · same City state</p>
      <h2 id="eon3-gate-title">Enter the optional Spatial Command Space?</h2>
      <p>City Overview is the fast fallback. Spatial Command Space renders the same local CityWorldState: avatar, district graph, discoveries, Realm palette, and current objective. It does not introduce a second inventory, game economy, NPC crowd, market, reward loop, or background simulation.</p>
      <p class="eon3-state-line">${stateLine(summary)}</p>
      <div class="eon3-station-gate-grid"><span>WebGL: ${capability.webgl ? (capability.webgl2 ? 'WebGL 2 ready' : 'WebGL ready') : 'not available'}</span><span>Reduced motion: ${capability.reducedMotion ? 'on' : 'off'}</span><span>Data saver: ${capability.saveData ? 'on' : 'off'}</span><span>Recommended: ${escapeHtml(capability.recommendedQuality)}</span></div>
      <label class="eon3-quality-field">Spatial Command Space quality<select data-eon3-quality>${qualityOptions(capability.recommendedQuality)}</select></label>
      <label class="eon3-fallback-field"><input type="checkbox" data-eon3-auto-fallback checked /> Automatically return to City Overview if sustained performance is unsafe</label>
      <label class="eon3-soundscape" data-eon3-soundscape><input type="checkbox" data-eon3-soundscape-enabled /> Prepare session-local ambience and UI choices <small>Off by default. This does not start sound; choose Turn on local sound after entering. No original music, voice pack, microphone or downloaded audio is included.</small></label>
      <div class="eon3-station-actions"><button class="eon-hub-primary" type="button" data-eon3-enter ${capability.capable ? '' : 'disabled'}>Enter Spatial Command Space</button><a class="eon-operator-secondary" href="/eoncity/lite">Use City Overview</a></div>
      <p class="eon3-station-status" role="status">${capability.capable ? 'The renderer loads only after you choose to enter.' : 'This device is routed to City Overview for clarity and performance.'}</p>
    </section>`;
  root.querySelector('[data-eon3-enter]')?.addEventListener('click', () => {
    const quality = root.querySelector('[data-eon3-quality]')?.value || capability.recommendedQuality;
    const automaticFallbackTo2d = Boolean(root.querySelector('[data-eon3-auto-fallback]')?.checked);
    const soundEnabled = Boolean(root.querySelector('[data-eon3-soundscape-enabled]')?.checked);
    const soundscapePreferences = normalizeCitySoundscapePreferences({ ambience: soundEnabled, ui: soundEnabled });
    void renderWebglStation(root, capability, summary, { quality, automaticFallbackTo2d, soundscapePreferences });
  }, { once: true });
}

function cameraOptions(selected = 'arrival') {
  const projection = buildSpatialCommandProjection();
  const camera = normalizeSpatialCommandCameraPreset(selected, 'arrival');
  return projection.cameraPresets.map((preset) => `<option value="${escapeHtml(preset.id)}"${preset.id === camera ? ' selected' : ''}>${escapeHtml(preset.label)}</option>`).join('');
}

function renderCommandBoard(projection) {
  const mission = projection.commandDistrict.mission;
  const lanes = projection.workLanes.map((lane) => {
    if (lane.destinationMode === 'immersive-work') {
      return `<button type="button" class="eon3-command-lane" data-eon3-prepare-immersive><strong>${escapeHtml(lane.label)}</strong><span>${escapeHtml(lane.detail)}</span><small>Review required</small></button>`;
    }
    return `<a class="eon3-command-lane" href="${escapeHtml(lane.href)}"><strong>${escapeHtml(lane.label)}</strong><span>${escapeHtml(lane.detail)}</span><small>Open native surface</small></a>`;
  }).join('');
  return `
    <section class="eon3-command-board" aria-label="Local Spatial Command Board">
      <header><div><p class="eon3-station-kicker">Command board · local-only</p><h3>Neon Command District</h3><p>Beautiful city presentation, bounded work routing. The board never mirrors private Chat, files, keys, provider output or background task detail.</p></div><span class="eon3-command-mode">Mode: ${escapeHtml(projection.commandDistrict.currentMode)}</span></header>
      <div class="eon3-command-eonbot"><button type="button" data-eon3-open-eonbot>Ask EONBOT to prepare a work lane</button><span>Creates a local review-needed plan only; no provider call or saved City text.</span></div>
      <div class="eon3-command-grid">
        <article class="eon3-command-card"><p class="eon3-station-kicker">City mission</p><strong>${escapeHtml(mission.progressLabel)} · ${escapeHtml(mission.title)}</strong><span>${escapeHtml(mission.detail)}</span><small>Next: ${escapeHtml(mission.next)}</small></article>
        <article class="eon3-command-card"><p class="eon3-station-kicker">AI crew signals</p><strong data-eon3-command-crew>${projection.crew.visibleCount ? `${projection.crew.visibleCount} local cue${projection.crew.visibleCount === 1 ? '' : 's'} visible` : 'No local work cue'}</strong><span>${projection.crew.visibleCount ? 'Status-only local cues. Review actual work in its native surface.' : escapeHtml(projection.crew.emptyCopy)}</span><small>Never a simulated busy crowd</small></article>
        <article class="eon3-command-card"><p class="eon3-station-kicker">City state</p><strong>${projection.commandDistrict.discoveredDistrictCount} discovered district${projection.commandDistrict.discoveredDistrictCount === 1 ? '' : 's'}</strong><span>Return target: ${escapeHtml(projection.commandDistrict.returnMode)}</span><small>Stored locally on this device</small></article>
      </div>
      <div class="eon3-command-lanes">${lanes}</div>
    </section>`;
}

function districtCards(summary) {
  return CITY_DISTRICTS.map((district) => {
    const discovered = summary.unlockedDistricts.includes(district.id);
    const visits = Number(summary.progress.visitCounts[district.id] || 0);
    const routeState = district.actionable ? 'Review route' : 'City marker only';
    return `<button type="button" class="eon3-district-card${discovered ? ' is-discovered' : ''}" data-eon3-district="${escapeHtml(district.id)}"><span aria-hidden="true">${escapeHtml(district.icon)}</span><strong>${escapeHtml(district.name)}</strong><small>${discovered ? `${visits} local visit${visits === 1 ? '' : 's'} · ${routeState}` : `Discover in City Overview · ${routeState}`}</small></button>`;
  }).join('');
}

async function renderWebglStation(root, capability, summary, options = {}) {
  let soundscapePreferences = normalizeCitySoundscapePreferences(options.soundscapePreferences || CITY_SOUNDSCAPE_DEFAULTS);
  let soundscapeMessage = '';
  const soundscape = createCityAdaptiveSoundscape({ preferences: soundscapePreferences, environment: globalThis, onStatus: (message) => { soundscapeMessage = message; } });
  const soundscapePolicy = createEonCitySoundscapePolicyController();
  soundscapePolicy.setRuntime({ cityPaused: false, tabVisible: globalThis.document?.visibilityState !== 'hidden', reducedEffects: Boolean(capability.reducedMotion) });
  soundscapeControllers.set(root, soundscape);
  root.dataset.eonCity3dSoundscape = 'off';
  root.dataset.eonCity3dState = 'loading';
  root.innerHTML = `<section class="eon3-station-loading"><p class="eon3-station-kicker">Optional Three.js Spatial Command Space</p><h2>Preparing your local City command space…</h2><p>Only the renderer needed for this chosen route is loading. Your City remains local and City Overview remains available.</p></section>`;
  let rendererModule;
  try {
    rendererModule = await import('./city/eon-city-3d-renderer.js');
  } catch {
    renderFallback(root, { ...capability, reasons: ['The optional Spatial Command Space renderer could not load in this browser.'] }, summary, 'renderer-load');
    return;
  }
  const preferences = rendererModule.getCity3dPreferences({ fallbackQuality: capability.recommendedQuality });
  const quality = rendererModule.normalizeCity3dQuality(options.quality, preferences.preferredQuality);
  const automaticFallbackTo2d = options.automaticFallbackTo2d !== false && preferences.automaticFallbackTo2d !== false;
  const commandProjection = buildSpatialCommandProjection({ citySummary: summary, agentPresence: getAgentPresenceSummary().active });
  rendererModule.saveCity3dPreferences({ preferredQuality: quality, automaticFallbackTo2d });
  root.dataset.eonCity3dState = 'ready';
  root.innerHTML = `
    <section class="eon3-webgl-station" aria-labelledby="eon3-station-title">
      <header class="eon3-station-head"><div><p class="eon3-station-kicker">Optional Three.js Spatial Command Space · CityWorldState parity</p><h2 id="eon3-station-title">EON City Spatial Command Space</h2><p>This is the same local City: ${escapeHtml(summary.avatar.name || 'Operator')}, ${summary.unlockedDistricts.length} discovered district${summary.unlockedDistricts.length === 1 ? '' : 's'}, and your ${escapeHtml(summary.realmAppearance.palette)} Realm palette.</p></div><div class="eon3-station-capability"><strong>Device gate passed</strong><span>WebGL${capability.webgl2 ? ' 2' : ''} · ${capability.cores ?? 'unknown'} cores · ${capability.memoryGb ?? 'unknown'} GB</span></div></header>
      <div class="eon3-webgl-toolbar"><label>Quality<select data-eon3-live-quality>${qualityOptions(quality)}</select></label><label>Camera<select data-eon3-camera>${cameraOptions('arrival')}</select></label><span data-eon3-runtime>Starting frame-time governor…</span><span data-eon3-soundscape-status>${escapeHtml(soundscapeMessage || 'Sound is off. Captions and City visuals remain complete.')}</span><button type="button" data-eon3-sound-enable>Turn on local sound</button><button type="button" data-eon3-sound-mute disabled>Mute sound</button><button type="button" data-eon3-sound-stop disabled>Stop sound</button><a href="/eoncity/lite">Return to City Overview</a></div>
      ${renderCommandBoard(commandProjection)}
      <section class="eon3-agent-presence" aria-label="Live AI work signals"><div><p class="eon3-station-kicker">Live work layer · local cues</p><h3>Real task signals, not a simulated crowd</h3><p data-eon3-agent-summary></p></div><div class="eon3-agent-presence-actions"><button type="button" data-eon3-agent-visibility></button><button type="button" data-eon3-agent-detail></button><a href="/chat" data-eon3-agent-review hidden>Review local work</a></div></section>
      <div class="eon3-webgl-host" data-eon3-webgl-host></div>
      <div class="eon3-station-status" data-eon3-status role="status">Opening the optional renderer from the same local CityWorldState…</div>
      <section class="eon3-proof-card" aria-label="Optional Spatial Command Space local device evidence"><div><p class="eon3-station-kicker">Private device evidence</p><h3>Save a local Spatial Command Space performance note</h3><p data-eon3-proof-summary>Keep the view open for at least a few seconds before saving evidence. Nothing is sent to EONAPP or Cloudflare.</p></div><div class="eon3-proof-actions"><button type="button" data-eon3-save-proof>Save local evidence</button><button type="button" data-eon3-export-proof ${readCity3dLocalProofs().length ? '' : 'disabled'}>Export latest JSON</button></div></section>
      <section class="eon3-district-directory" aria-label="Native City district routes">${districtCards(summary)}</section>
      <section class="eon3-route-review" data-eon3-route-review aria-live="polite" hidden></section>
      <div class="eon3-station-bottom"><span>Spatial Command Space is optional. City Overview remains the resilient low-device City.</span><a href="/realm-studio">Open My Realm</a><button type="button" data-eon3-reset>Restart Spatial Command Space</button></div>
    </section>`;
  const host = root.querySelector('[data-eon3-webgl-host]');
  const status = root.querySelector('[data-eon3-status]');
  const runtimeEl = root.querySelector('[data-eon3-runtime]');
  const soundscapeStatus = root.querySelector('[data-eon3-soundscape-status]');
  const proofSummary = root.querySelector('[data-eon3-proof-summary]');
  const proofExportButton = root.querySelector('[data-eon3-export-proof]');
  const routeReview = root.querySelector('[data-eon3-route-review]');
  const agentSummaryEl = root.querySelector('[data-eon3-agent-summary]');
  const agentVisibilityButton = root.querySelector('[data-eon3-agent-visibility]');
  const agentDetailButton = root.querySelector('[data-eon3-agent-detail]');
  const agentReviewLink = root.querySelector('[data-eon3-agent-review]');
  const commandCrewEl = root.querySelector('[data-eon3-command-crew]');
  const soundEnableButton = root.querySelector('[data-eon3-sound-enable]');
  const soundMuteButton = root.querySelector('[data-eon3-sound-mute]');
  const soundStopButton = root.querySelector('[data-eon3-sound-stop]');
  let agentPreferences = readAgentPresencePreferences();
  let runtime = null;
  const renderAgentPresence = (presence = getAgentPresenceSummary()) => {
    const active = agentPreferences.enabled ? presence.active : [];
    const first = active[0] ? describeAgentPresence(active[0], agentPreferences) : null;
    const outcome = agentPreferences.enabled ? getAgentPresenceOutcome(presence) : { visible: false };
    if (agentSummaryEl) {
      const workCopy = first
        ? `${active.length}/${presence.visibleLimit} active local cue${active.length === 1 ? '' : 's'} · ${first.title}: ${first.bubble}.`
        : 'No recorded work signal is active. The City does not invent busy NPCs.';
      const outcomeCopy = outcome.visible ? ` ${outcome.title}: ${outcome.bubble}` : '';
      agentSummaryEl.textContent = !agentPreferences.enabled
        ? 'Visual work signals are hidden. Work is not started, stopped, or altered by this preference.'
        : `${workCopy}${outcomeCopy} Selected-provider identity is optional and never shows a model, endpoint, key, prompt, reply, or transcript.`;
    }
    if (agentVisibilityButton) {
      agentVisibilityButton.textContent = agentPreferences.enabled ? 'Hide signals' : 'Show signals';
    }
    if (agentDetailButton) {
      agentDetailButton.disabled = !agentPreferences.enabled;
      agentDetailButton.textContent = agentPreferences.detailLevel === 'provider-identity' ? 'Hide provider detail' : agentPreferences.detailLevel === 'provider-category' ? 'Show selected provider' : 'Show provider category';
    }
    if (agentReviewLink) {
      agentReviewLink.hidden = !outcome.visible;
      agentReviewLink.href = outcome.route || '/chat';
      agentReviewLink.textContent = outcome.visible ? `Review in ${outcome.nativeSurface || 'Chat'}` : 'Review local work';
    }
    if (commandCrewEl) {
      commandCrewEl.textContent = !agentPreferences.enabled
        ? 'Visual signals hidden'
        : active.length ? `${active.length} local cue${active.length === 1 ? '' : 's'} visible` : 'No local work cue';
    }
    runtime?.setAgentPresence?.(active, agentPreferences, outcome);
  };
  const updateProof = (detail = runtime?.getRuntimeSummary?.() || {}) => {
    if (proofSummary) proofSummary.textContent = proofText(detail);
  };
  const setStatus = (message) => {
    if (status) status.textContent = String(message || '');
    if (runtimeEl && runtime) {
      const detail = runtime.getRuntimeSummary();
      runtimeEl.textContent = `${detail.quality} · ${detail.averageFrameMs || '—'} ms · automatic City Overview fallback ${automaticFallbackTo2d ? 'on' : 'off'}`;
      updateProof(detail);
    }
  };
  const describeSoundscape = (snapshot = {}) => {
    if (snapshot.audibleState === 'active-local-procedural') return 'Local procedural sound is active after your action. No track or voice pack is used.';
    if (snapshot.audibleState === 'muted') return 'Sound is muted. Captions and City visuals remain complete.';
    if (snapshot.audibleState === 'unsupported') return 'Local sound is unavailable in this browser. Captions and City visuals remain complete.';
    if (snapshot.audibleState === 'hidden-silent') return 'This tab is hidden, so sound is stopped. It will not resume automatically.';
    if (snapshot.audibleState === 'reduced-effects-silent') return 'Reduced motion keeps sound off. Captions and City visuals remain complete.';
    return 'Sound is off. Captions and City visuals remain complete.';
  };
  const renderSoundscape = (snapshot = soundscapePolicy.getSnapshot()) => {
    const message = describeSoundscape(snapshot);
    if (soundscapeStatus) soundscapeStatus.textContent = message;
    root.dataset.eonCity3dSoundscape = snapshot.audibleState === 'active-local-procedural' ? 'optional-enabled' : 'off';
    const runtimeBlocked = Boolean(snapshot.reducedEffects || !snapshot.tabVisible);
    if (soundEnableButton) soundEnableButton.disabled = runtimeBlocked;
    if (soundMuteButton) soundMuteButton.disabled = !['active-local-procedural', 'enable-pending-local-procedural-source'].includes(snapshot.audibleState);
    if (soundStopButton) soundStopButton.disabled = !['active-local-procedural', 'enable-pending-local-procedural-source', 'muted'].includes(snapshot.audibleState);
    return message;
  };
  const syncSoundscapeRuntime = (reason = 'runtime-guard') => {
    const result = soundscapePolicy.setRuntime({ cityPaused: false, tabVisible: globalThis.document?.visibilityState !== 'hidden', reducedEffects: Boolean(capability.reducedMotion) });
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.(reason);
    renderSoundscape(result.snapshot);
    return result;
  };
  const onSoundEnable = () => {
    const request = soundscapePolicy.requestEnable({ explicitUserAction: true, runtime: { cityPaused: false, tabVisible: globalThis.document?.visibilityState !== 'hidden', reducedEffects: Boolean(capability.reducedMotion) } });
    if (!request.ok) {
      soundscape.stopForRuntimeGuard?.(`sound-enable-${request.error || 'blocked'}`);
      setStatus(renderSoundscape(request.snapshot));
      return;
    }
    soundscapePreferences = normalizeCitySoundscapePreferences({ ...soundscapePreferences, ambience: true, ui: true, reducedSensory: false });
    soundscape.setPreferences(soundscapePreferences);
    const activation = soundscape.activateFromUserGesture();
    const playback = soundscapePolicy.reportPlaybackResult({ ok: activation?.activated === true, reason: activation?.reason || 'audio-start-failed' });
    setStatus(renderSoundscape(playback.snapshot));
  };
  const onSoundMute = () => {
    soundscapePreferences = normalizeCitySoundscapePreferences({ ...soundscapePreferences, ambience: false, ui: false });
    soundscape.setPreferences(soundscapePreferences);
    const result = soundscapePolicy.mute({ explicitUserAction: true });
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.('user-muted');
    setStatus(renderSoundscape(result.snapshot));
  };
  const onSoundStop = () => {
    soundscapePreferences = normalizeCitySoundscapePreferences({ ...soundscapePreferences, ambience: false, ui: false });
    soundscape.setPreferences(soundscapePreferences);
    const result = soundscapePolicy.stop({ explicitUserAction: true, reason: 'user-stopped' });
    if (result.shouldStopExistingAudio) soundscape.stopForRuntimeGuard?.('user-stopped');
    setStatus(renderSoundscape(result.snapshot));
  };
  const onSoundVisibility = () => { syncSoundscapeRuntime('tab-visibility-change'); };
  const unsubscribeSoundscapePolicy = soundscapePolicy.subscribe(renderSoundscape);
  soundEnableButton?.addEventListener('click', onSoundEnable);
  soundMuteButton?.addEventListener('click', onSoundMute);
  soundStopButton?.addEventListener('click', onSoundStop);
  globalThis.document?.addEventListener?.('visibilitychange', onSoundVisibility);
  soundscapePolicyControllers.set(root, {
    dispose() {
      try { unsubscribeSoundscapePolicy?.(); } catch {}
      soundEnableButton?.removeEventListener('click', onSoundEnable);
      soundMuteButton?.removeEventListener('click', onSoundMute);
      soundStopButton?.removeEventListener('click', onSoundStop);
      globalThis.document?.removeEventListener?.('visibilitychange', onSoundVisibility);
      try { soundscapePolicy.dispose(); } catch {}
    }
  });
  syncSoundscapeRuntime('initial-runtime-guard');
  const selectDistrict = (district) => {
    root.querySelectorAll('[data-eon3-district]').forEach((button) => button.classList.toggle('is-selected', button.dataset.eon3District === district.id));
    if (!routeReview) return;
    routeReview.hidden = false;
    if (!district.actionable) {
      routeReview.innerHTML = `<p class="eon3-station-kicker">City marker</p><h3>${escapeHtml(district.name)}</h3><p>${escapeHtml(district.description)} This marker intentionally has no City route in the current product.</p><div class="eon3-route-review-actions"><button type="button" data-eon3-cancel-district>Continue Spatial Command Space</button></div>`;
      routeReview.querySelector('[data-eon3-cancel-district]')?.addEventListener('click', () => {
        routeReview.hidden = true;
        routeReview.textContent = '';
        root.querySelectorAll('[data-eon3-district]').forEach((button) => button.classList.remove('is-selected'));
        setStatus('Stayed in Spatial Command Space. No destination opened.');
      });
      setStatus(`${district.name} is a local City marker. No app route is available here.`);
      return;
    }
    const prepared = prepareCityAction(district.landmarkId, { source: 'visual-tour' });
    if (!prepared.ok || !prepared.action) {
      routeReview.hidden = true;
      routeReview.textContent = '';
      setStatus(`${district.name} could not prepare a route in this browser. Nothing opened.`);
      return;
    }
    const action = prepared.action;
    const missionOffer = offerCityBeginnerMission(action);
    const mission = missionOffer?.ok ? missionOffer.receipt : null;
    const href = missionOffer?.ok ? missionOffer.href : action.route;
    routeReview.innerHTML = `<p class="eon3-station-kicker">Destination review</p><h3>Open ${escapeHtml(action.destinationLabel)}?</h3><p>${escapeHtml(action.purpose)} Spatial Command Space prepared only this shared City route${mission ? ' and an opaque local beginner-mission receipt' : ''}. Review it and confirm yourself; no hidden task, reward, provider call, Vault action, or background process will run.</p>${mission ? `<p class="eon3-route-note">Mission offered: <strong>${escapeHtml(mission.missionLabel)}</strong>. The destination asks you to choose the real outcome.</p>` : ''}<div class="eon3-route-review-actions"><a class="eon-hub-primary" href="${escapeHtml(href)}" data-eon3-confirm-district="${escapeHtml(action.id)}"${mission ? ` data-eon3-mission-id="${escapeHtml(mission.id)}"` : ''}>Confirm and open ${escapeHtml(action.destinationLabel)}</a><button type="button" data-eon3-cancel-district${mission ? ` data-eon3-mission-id="${escapeHtml(mission.id)}"` : ''}>Stay in Spatial Command Space</button></div>`;
    routeReview.querySelector('[data-eon3-cancel-district]')?.addEventListener('click', () => {
      if (mission?.id) dismissCityBeginnerMission(mission.id);
      routeReview.hidden = true;
      routeReview.textContent = '';
      root.querySelectorAll('[data-eon3-district]').forEach((button) => button.classList.remove('is-selected'));
      setStatus('Stayed in Spatial Command Space. No destination opened.');
    });
    routeReview.querySelector('[data-eon3-confirm-district]')?.addEventListener('click', (event) => {
      const confirmed = confirmPreparedCityAction(event.currentTarget.dataset.eon3ConfirmDistrict);
      if (!confirmed.ok) {
        event.preventDefault();
        setStatus('That prepared route expired. Select the landmark again to prepare a new route.');
        return;
      }
      if (mission?.id) {
        const opened = openCityBeginnerMission(mission.id);
        if (!opened.ok) {
          event.preventDefault();
          setStatus('That local mission receipt is no longer available. Select the landmark again to prepare a new route.');
          return;
        }
      }
      appendOperatorActivity({ source: 'city', status: 'complete', title: `${district.name} confirmed`, detail: 'The user reviewed and confirmed the shared City route contract from Spatial Command Space.', route: href });
    });
    setStatus(`${action.destinationLabel}: shared City route ready for review. Nothing has opened yet.`);
  };
  const prepareEonbotWorkLane = async () => {
    if (!routeReview) return;
    const intent = getCityWorkLoopIntents()[0];
    routeReview.hidden = false;
    routeReview.innerHTML = `<p class="eon3-station-kicker">EONBOT work lane</p><h3>Prepare ${escapeHtml(intent.label)}?</h3><p>Spatial Command Space will create a local review-needed planning receipt. It does not call a provider, run automation, or copy City text. The detailed request belongs in the native surface after review.</p><div class="eon3-route-review-actions"><button type="button" class="eon-hub-primary" data-eon3-confirm-eonbot-plan>Prepare local review</button><button type="button" data-eon3-cancel-eonbot-plan>Stay in Spatial Command Space</button></div>`;
    routeReview.querySelector('[data-eon3-cancel-eonbot-plan]')?.addEventListener('click', () => { routeReview.hidden = true; routeReview.textContent = ''; setStatus('Stayed in Spatial Command Space. No plan was prepared.'); });
    routeReview.querySelector('[data-eon3-confirm-eonbot-plan]')?.addEventListener('click', async () => {
      const result = await createCityWorkLoopProposal({ intentId: intent.id });
      if (!result.ok || !result.proposal) { setStatus('The local plan could not be prepared. No provider was called.'); return; }
      const proposal = result.proposal;
      routeReview.innerHTML = `<p class="eon3-station-kicker">Local plan review</p><h3>Open ${escapeHtml(proposal.destination.label)}?</h3><p>${escapeHtml(proposal.title)} is review-needed only. No provider request, automation, project content, or private City text has been created.</p><div class="eon3-route-review-actions"><a class="eon-hub-primary" href="${escapeHtml(proposal.destination.route)}" data-eon3-confirm-eonbot-route>Confirm and open ${escapeHtml(proposal.destination.label)}</a><button type="button" data-eon3-cancel-eonbot-plan>Stay in Spatial Command Space</button></div>`;
      routeReview.querySelector('[data-eon3-cancel-eonbot-plan]')?.addEventListener('click', () => { routeReview.hidden = true; routeReview.textContent = ''; setStatus('Stayed in Spatial Command Space. The local plan remains review-only.'); });
      routeReview.querySelector('[data-eon3-confirm-eonbot-route]')?.addEventListener('click', () => appendOperatorActivity({ source: 'city', status: 'info', title: 'Spatial EONBOT work lane confirmed', detail: 'The user reviewed a local EONBOT planning receipt and opened a native work surface. No private City data was transferred.', route: proposal.destination.route }));
      setStatus(`${proposal.destination.label} is ready for your visible confirmation. Nothing opened yet.`);
    });
    if (soundscape.cue('route') && soundscapeStatus) soundscapeStatus.textContent = 'Local UI tone played after your EONBOT action.';
    setStatus('EONBOT work lane requires a separate visible review. Nothing has started.');
  };
  const prepareImmersiveHandoff = () => {
    const prepared = prepareCityModeTransition({ fromMode: 'command-space', toMode: 'immersive-work', entry: 'command-space', landmarkId: 'command-centre' });
    if (!prepared.ok || !routeReview) {
      setStatus('Immersive Work Mode could not prepare a local handoff in this browser. Nothing opened.');
      return;
    }
    routeReview.hidden = false;
    routeReview.innerHTML = `<p class="eon3-station-kicker">Immersive Work Mode review</p><h3>Enter the Babylon City experience?</h3><p>Spatial Command Space prepared only a local City-mode transition to Immersive Work Mode. The view will not launch by itself, no task will run, and no private context transfers into the renderer.</p><div class="eon3-route-review-actions"><a class="eon-hub-primary" href="/eoncity/play" data-eon3-confirm-immersive>Confirm and enter Immersive Work Mode</a><button type="button" data-eon3-cancel-immersive>Stay in Spatial Command Space</button></div>`;
    routeReview.querySelector('[data-eon3-cancel-immersive]')?.addEventListener('click', () => {
      routeReview.hidden = true;
      routeReview.textContent = '';
      setStatus('Stayed in Spatial Command Space. Immersive Work Mode did not open.');
    });
    routeReview.querySelector('[data-eon3-confirm-immersive]')?.addEventListener('click', () => {
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Immersive Work Mode confirmed', detail: 'The user reviewed and confirmed a local City-mode transition from Spatial Command Space to Immersive Work Mode.', route: '/eoncity/play' });
    });
    setStatus('Immersive Work Mode is ready for your visible review. Nothing has opened yet.');
  };
  try {
    runtime = rendererModule.mountEonCityWebglRenderer({
      host,
      state: summary,
      quality,
      cameraPreset: 'arrival',
      agentPresence: agentPreferences.enabled ? getAgentPresenceSummary().active : [],
      agentPresencePreferences: agentPreferences,
      agentOutcome: agentPreferences.enabled ? getAgentPresenceOutcome(getAgentPresenceSummary()) : null,
      onStatus: setStatus,
      onTelemetry: updateProof,
      onDistrictSelect: selectDistrict,
      onFallback: ({ reason }) => {
        if (automaticFallbackTo2d) renderFallback(root, capability, summary, reason);
        else setStatus(`Performance safety requested City Overview fallback (${reason}). Use Return to City Overview when ready.`);
      }
    });
  } catch {
    renderFallback(root, { ...capability, reasons: ['The optional renderer could not start on this device.'] }, summary, 'renderer-start');
    return;
  }
  if (!runtime) {
    renderFallback(root, { ...capability, reasons: ['The optional renderer did not start on this device.'] }, summary, 'renderer-unavailable');
    return;
  }
  runtimes.set(root, runtime);
  renderAgentPresence();
  presenceUnsubscribers.set(root, subscribeAgentPresence((presence) => renderAgentPresence(presence)));
  agentVisibilityButton?.addEventListener('click', () => {
    agentPreferences = saveAgentPresencePreferences({ ...agentPreferences, enabled: !agentPreferences.enabled });
    renderAgentPresence();
  });
  agentDetailButton?.addEventListener('click', () => {
    if (!agentPreferences.enabled) return;
    agentPreferences = saveAgentPresencePreferences({ ...agentPreferences, detailLevel: agentPreferences.detailLevel === 'summary' ? 'provider-category' : agentPreferences.detailLevel === 'provider-category' ? 'provider-identity' : 'summary' });
    renderAgentPresence();
  });
  agentReviewLink?.addEventListener('click', () => {
    appendOperatorActivity({ source: 'city', status: 'info', title: 'Spatial Command Space result review chosen', detail: 'The user chose native Chat to review a status-only local result relay. Spatial Command Space did not expose or transfer any result content.', route: '/chat?new=1' });
  });
  appendOperatorActivity({ source: 'city', status: 'info', title: 'Spatial Command Space opened', detail: 'Opened the optional Spatial Command Space from the same local CityWorldState after an explicit device gate. No background simulation started.', route: '/eoncity/tour' });
  root.querySelectorAll('[data-eon3-district]').forEach((button) => button.addEventListener('click', () => {
    const district = CITY_DISTRICTS.find((item) => item.id === button.dataset.eon3District);
    if (!district) return;
    selectDistrict(district);
  }));
  root.querySelectorAll('[data-eon3-prepare-immersive]').forEach((button) => button.addEventListener('click', prepareImmersiveHandoff));
  root.querySelector('[data-eon3-open-eonbot]')?.addEventListener('click', () => { void prepareEonbotWorkLane(); });
  root.querySelector('[data-eon3-camera]')?.addEventListener('change', (event) => {
    const next = normalizeSpatialCommandCameraPreset(event.currentTarget.value, 'arrival');
    runtime?.setCameraPreset?.(next);
  });
  root.querySelector('[data-eon3-save-proof]')?.addEventListener('click', () => {
    const result = saveCity3dLocalProof({ summary: runtime.getRuntimeSummary(), device: capability });
    if (proofSummary) proofSummary.textContent = result.ok ? `Saved locally. ${proofText(result.report.summary)}` : 'The local evidence could not be saved in this browser.';
    if (proofExportButton) proofExportButton.disabled = !result.ok;
  });
  proofExportButton?.addEventListener('click', () => {
    const latest = readCity3dLocalProofs()[0];
    if (!latest) return;
    downloadLocalProof(latest);
  });
  root.querySelector('[data-eon3-live-quality]')?.addEventListener('change', (event) => {
    const next = event.currentTarget.value;
    disposeVisualTourRuntime(root);
    void renderWebglStation(root, capability, summary, { quality: next, automaticFallbackTo2d, soundscapePreferences });
  });
  root.querySelector('[data-eon3-reset]')?.addEventListener('click', () => {
    disposeVisualTourRuntime(root);
    void renderGate(root, capability, summary);
  });
  setStatus('Spatial Command Space ready. Select a district in the scene or directory, then review before opening its native route.');
}

export function mountEonCity3dStation(root = document.querySelector('[data-eon-city-3d-root]')) {
  if (!root) return null;
  enterCityMode('command-space', { entry: 'command-space' });
  try { modeTrackingUnsubscribers.get(root)?.(); } catch {}
  modeTrackingUnsubscribers.set(root, bindCityModeLinkTracking(root, 'command-space', { entry: 'command-space' }));
  const capability = getEonCity3dCapability();
  const { summary } = worldSummary();
  root.dataset.eonCity3dSchema = STATION_SCHEMA;
  if (!capability.capable) renderFallback(root, capability, summary);
  else renderGate(root, capability, summary);
  const controller = Object.freeze({
    schema: STATION_SCHEMA,
    capability,
    summary,
    reset: () => mountEonCity3dStation(root),
    destroy: () => {
      disposeVisualTourRuntime(root);
    }
  });
  globalThis.EON_CITY_3D = controller;
  globalThis.EON_CITY_CALM_STATION = controller;
  return controller;
}

/** Backward-compatible name retained for the old module entry point. */
export const mountCalmEonCityStation = mountEonCity3dStation;

function disposeVisualTourForPageExit() {
  const root = document.querySelector('[data-eon-city-3d-root]');
  if (!root) return;
  disposeVisualTourRuntime(root);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountEonCity3dStation(), { once: true });
  else mountEonCity3dStation();
  globalThis.addEventListener?.('pagehide', disposeVisualTourForPageExit);
  globalThis.addEventListener?.('pageshow', (event) => {
    if (event.persisted) mountEonCity3dStation();
  });
}

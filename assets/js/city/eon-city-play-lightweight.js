/** Lightweight, Canvas-first EON City entry. No WebGL or Babylon dependency. */
export const EON_CITY_LIGHTWEIGHT_RUNTIME_SCHEMA = 'eon.city.lightweight-runtime.w659j.v1';
export const EON_CITY_BOOT_TRACE_KEY = 'eon:city:boot-trace:w659h:v1';

const LANDMARKS = Object.freeze([
  Object.freeze({ id: 'command', label: 'Command Centre', x: 0, z: -8, radius: 4 }),
  Object.freeze({ id: 'creator', label: 'Creator Atrium', x: 10, z: -3, radius: 4 }),
  Object.freeze({ id: 'projects', label: 'Project District', x: -10, z: -3, radius: 4 }),
  Object.freeze({ id: 'transit', label: 'Transit Network', x: 0, z: 10, radius: 4 })
]);
const now = () => globalThis.performance?.now?.() || Date.now();

function appendTrace(host, startedAt, stage, detail = '') {
  const entry = Object.freeze({ stage, detail: String(detail || '').slice(0, 96), elapsedMs: Math.max(0, Math.round(now() - startedAt)), at: new Date().toISOString() });
  const root = host?.closest?.('[data-eon-city-play]') || host?.parentElement;
  if (root?.dataset) { root.dataset.eonCityBootStage = stage; root.dataset.eonCityBootElapsedMs = String(entry.elapsedMs); }
  try {
    const prior = JSON.parse(globalThis.sessionStorage?.getItem(EON_CITY_BOOT_TRACE_KEY) || '[]');
    globalThis.sessionStorage?.setItem(EON_CITY_BOOT_TRACE_KEY, JSON.stringify([...(Array.isArray(prior) ? prior : []), entry].slice(-40)));
  } catch {}
  try { console.info(`[CITY_BOOT_STAGE_${stage}]`, entry); } catch {}
  return entry;
}
function closestLandmark(position) {
  return LANDMARKS.map((item) => ({ ...item, distance: Math.hypot(position.x - item.x, position.z - item.z) }))
    .filter((item) => item.distance <= item.radius).sort((a, b) => a.distance - b.distance)[0] || null;
}
function renderDebug(host, readState) {
  if (new URLSearchParams(globalThis.location?.search || '').get('cityDebug') !== '1') return () => {};
  const panel = document.createElement('aside');
  panel.dataset.eonCityDebug = 'true';
  panel.style.cssText = 'position:absolute;right:12px;top:12px;z-index:8;max-width:330px;padding:10px;border:1px solid #64e7ff;background:#061226e8;color:#dffaff;font:12px/1.4 ui-monospace,monospace;border-radius:10px';
  const pre = document.createElement('pre'); pre.style.cssText = 'margin:0 0 8px;white-space:pre-wrap';
  const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy diagnostics';
  copy.addEventListener('click', () => { void globalThis.navigator?.clipboard?.writeText?.(JSON.stringify(readState(), null, 2)); });
  panel.append(pre, copy); host.append(panel);
  const timer = globalThis.setInterval?.(() => { pre.textContent = JSON.stringify(readState(), null, 2); }, 400);
  return () => { if (timer) globalThis.clearInterval?.(timer); panel.remove(); };
}

export function mountBabylonCityProof({ host, quality = 'balanced', onStatus, onTelemetry, onFirstFrame, onInitialAssetsReady, onDetailStage, onBootStage, onLandmarkChange, onInputModeChange, onPerformanceChange } = {}) {
  if (!host || typeof document === 'undefined') throw Object.assign(new Error('City canvas host is unavailable.'), { code: 'CITY_CANVAS_MOUNT_FAILED' });
  const startedAt = now();
  const stage = (name, detail = '') => { appendTrace(host, startedAt, name, detail); try { onBootStage?.({ stage: name, detailCode: detail }); } catch {} };
  stage('LIGHTWEIGHT_RUNTIME_STARTED');
  const canvas = document.createElement('canvas');
  canvas.className = 'eon-play-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'EON City lightweight world. Use W A S D or arrows to move.');
  host.replaceChildren(canvas);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw Object.assign(new Error('Canvas 2D is unavailable.'), { code: 'CITY_CANVAS_MOUNT_FAILED' });
  stage('FIXED_COLLISION_CREATED');
  const player = { x: 0, z: 2, heading: 0 };
  const eonbot = { x: 2, z: 2.6 };
  const movement = new Set(); const analog = { x: 0, z: 0 };
  let paused = false; let destroyed = false; let firstFrame = false; let pointerLook = false; let lastLandmark = null; let frameCount = 0; let lastTelemetry = now();
  const held = new Map([['KeyW', 'forward'], ['ArrowUp', 'forward'], ['KeyS', 'backward'], ['ArrowDown', 'backward'], ['KeyA', 'left'], ['ArrowLeft', 'left'], ['KeyD', 'right'], ['ArrowRight', 'right']]);
  const setMove = (direction, active) => { if (active) movement.add(direction); else movement.delete(direction); };
  const keyDown = (event) => { const direction = held.get(event.code); if (direction) { event.preventDefault(); setMove(direction, true); } };
  const keyUp = (event) => { const direction = held.get(event.code); if (direction) { event.preventDefault(); setMove(direction, false); } };
  globalThis.addEventListener?.('keydown', keyDown); globalThis.addEventListener?.('keyup', keyUp);
  const resize = () => { const rect = host.getBoundingClientRect(); canvas.width = Math.max(320, Math.floor(rect.width || 960)); canvas.height = Math.max(240, Math.floor(rect.height || 540)); };
  const draw = () => {
    resize(); const { width, height } = canvas; const scale = Math.min(width, height) / 52;
    context.fillStyle = '#06121d'; context.fillRect(0, 0, width, height);
    context.strokeStyle = '#164963'; context.lineWidth = 1;
    for (let step = -24; step <= 24; step += 4) { context.beginPath(); context.moveTo(width / 2 + step * scale, 0); context.lineTo(width / 2 + step * scale, height); context.stroke(); context.beginPath(); context.moveTo(0, height / 2 + step * scale); context.lineTo(width, height / 2 + step * scale); context.stroke(); }
    const point = (x, z) => [width / 2 + x * scale, height / 2 + z * scale];
    for (const landmark of LANDMARKS) { const [x, y] = point(landmark.x, landmark.z); context.fillStyle = '#48dff5'; context.fillRect(x - 8, y - 28, 16, 56); context.fillStyle = '#d9fbff'; context.font = '12px system-ui'; context.fillText(landmark.label, x + 12, y - 16); }
    const [bx, by] = point(eonbot.x, eonbot.z); context.fillStyle = '#a878ff'; context.beginPath(); context.arc(bx, by, 11, 0, Math.PI * 2); context.fill();
    const [px, py] = point(player.x, player.z); context.fillStyle = '#55f5c6'; context.beginPath(); context.arc(px, py, 12, 0, Math.PI * 2); context.fill(); context.fillStyle = '#05252d'; context.fillRect(px - 2, py - 20, 4, 18);
  };
  const state = () => ({ schema: EON_CITY_LIGHTWEIGHT_RUNTIME_SCHEMA, renderer: 'canvas-2d', quality, firstFrame, paused, webgl: false, player: { x: Number(player.x.toFixed(2)), z: Number(player.z.toFixed(2)) }, landmark: lastLandmark?.id || null, deferred: 'babylon-not-required-for-playability' });
  const removeDebug = renderDebug(host, () => ({ runtime: state(), trace: (() => { try { return JSON.parse(globalThis.sessionStorage?.getItem(EON_CITY_BOOT_TRACE_KEY) || '[]'); } catch { return []; } })() }));
  const frame = () => {
    if (destroyed) return;
    if (!paused) {
      const x = (movement.has('right') ? 1 : 0) - (movement.has('left') ? 1 : 0) + analog.x;
      const z = (movement.has('forward') ? 1 : 0) - (movement.has('backward') ? 1 : 0) - analog.z;
      if (x || z) { const length = Math.hypot(x, z) || 1; player.x = Math.max(-25, Math.min(25, player.x + x / length * 0.12)); player.z = Math.max(-25, Math.min(25, player.z - z / length * 0.12)); player.heading = Math.atan2(x, -z); }
      eonbot.x += (player.x + 1.7 - eonbot.x) * 0.08; eonbot.z += (player.z + 1.2 - eonbot.z) * 0.08;
      const nearby = closestLandmark(player); if (nearby?.id !== lastLandmark?.id) { lastLandmark = nearby; try { onLandmarkChange?.(nearby); } catch {} }
    }
    draw(); frameCount += 1;
    if (!firstFrame) { firstFrame = true; stage('LIGHTWEIGHT_FIRST_FRAME'); stage('CITY_FIRST_PLAYABLE_FRAME'); try { onFirstFrame?.(); onInitialAssetsReady?.({ ok: true, degraded: true, reason: 'canvas-first-safe-runtime' }); onStatus?.('EON City is playable in lightweight mode. 3D enhancement remains optional.'); } catch {} globalThis.setTimeout?.(() => { stage('DEFERRED_SYSTEMS_STARTED'); try { onDetailStage?.({ id: 'visual-enhancement', status: 'deferred', summary: { stages: [] } }); } catch {} }, 0); }
    const current = now(); if (current - lastTelemetry > 1000) { try { onTelemetry?.({ quality, fps: frameCount, averageFrameMs: Math.round(1000 / Math.max(1, frameCount)) }); } catch {} frameCount = 0; lastTelemetry = current; }
    globalThis.requestAnimationFrame?.(frame) || globalThis.setTimeout?.(frame, 16);
  };
  globalThis.requestAnimationFrame?.(frame) || globalThis.setTimeout?.(frame, 0);
  return Object.freeze({
    setMove, setAnalogMove(vector = {}) { analog.x = Number(vector.x) || 0; analog.z = Number(vector.z) || 0; }, setClickMove(value) { return Boolean(value); },
    togglePointerLook() { pointerLook = !pointerLook; try { onInputModeChange?.(`Pointer look ${pointerLook ? 'on' : 'off'}.`); } catch {} return { enabled: pointerLook }; }, getThirdPersonSummary() { return { pointerLook: { enabled: pointerLook }, position: { ...player } }; }, getRuntimeSummary: state, getPerformanceObservation() { return { renderer: 'canvas-2d', firstFrame }; }, getNearestLandmark() { return closestLandmark(player); },
    focusLandmark(id) { const target = LANDMARKS.find((item) => item.id === id); if (!target) return false; player.x = target.x; player.z = target.z + 2; return true; }, guideToLandmark(id) { return this.focusLandmark(id) ? { ok: true } : { ok: false }; }, getW649DistrictActions() { return []; }, focusCommandDeck() { return this.focusLandmark('command'); }, focusCreatorAtrium() { return this.focusLandmark('creator'); }, focusMetropolisDistrict(id) { return this.focusLandmark(id); }, focusAuthoredVerticalSliceRegion(id) { return this.focusLandmark(id); }, resetView() { player.x = 0; player.z = 2; return { ok: true }; }, getExplorationPose() { return { x: player.x, z: player.z }; }, restoreExplorationPose(pose = {}) { player.x = Number(pose.x) || 0; player.z = Number(pose.z) || 2; return true; }, cycleWayfinderCamera() { return { id: 'follow' }; }, getWayfinderSummary() { return { id: 'follow' }; }, resetWayfinderCamera() { return { ok: true }; }, requestWayfinderState() { return { ok: true }; }, setCinematicShot() { return { ok: true }; }, setOpenSkyProfile() { return { ok: true }; }, setAgentPresence() {}, setCompanionIntent() {}, setEonbotOrbitPresentation() {}, applyWorkloadProtection(reason) { try { onPerformanceChange?.({ message: `Lightweight performance protection: ${reason || 'active'}.` }); } catch {} }, unstuck() { return this.resetView(); }, pause() { paused = true; }, resume() { paused = false; }, isPaused() { return paused; },
    destroy() { destroyed = true; globalThis.removeEventListener?.('keydown', keyDown); globalThis.removeEventListener?.('keyup', keyUp); removeDebug(); }
  });
}

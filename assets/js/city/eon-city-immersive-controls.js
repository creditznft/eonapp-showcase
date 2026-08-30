/**
 * W364 — EON City Immersive Work Mode controls.
 *
 * A local input layer shared by the Babylon station and its HUD. It does not
 * query services, store movement telemetry, or trigger application routes.
 * The only outputs are normalized movement vectors and an optional local
 * minimap drawing. Route review remains in the station's visible Interact UI.
 */

export const EON_CITY_IMMERSIVE_CONTROLS_SCHEMA = 'eon.city.immersive-controls.w364.v1';
export const CITY_PLAY_MINIMAP_SCHEMA = 'eon.city.minimap.w364.v1';

const MAX_JOYSTICK_RADIUS = 0.44;
const MINIMAP_TICK_MS = 110;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function normalizeCityPlayVector(vector = {}) {
  const x = clamp(vector.x, -1, 1);
  const z = clamp(vector.z, -1, 1);
  const length = Math.hypot(x, z);
  if (length <= 1 || length === 0) return Object.freeze({ x, z });
  return Object.freeze({ x: x / length, z: z / length });
}

function releasePointer(element, pointerId) {
  try {
    if (element?.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
  } catch {}
}

/**
 * Installs a true analogue touch joystick. The joystick is progressive rather
 * than four hidden key buttons, and safely returns to neutral on all teardown
 * paths. It stays local and never dispatches synthetic keyboard events.
 */
export function mountCityPlayAnalogJoystick({ root, onVector, onStatus } = {}) {
  const zone = root?.querySelector?.('[data-eon-play-joystick]');
  const knob = root?.querySelector?.('[data-eon-play-joystick-knob]');
  if (!zone || !knob || typeof onVector !== 'function') return Object.freeze({ destroy() {}, active: false });

  let activePointerId = null;
  let announced = false;
  let destroyed = false;

  const setVector = (next = { x: 0, z: 0 }) => {
    const vector = normalizeCityPlayVector(next);
    onVector(vector);
    knob.style.setProperty('--eon-joystick-x', `${Math.round(vector.x * 36)}px`);
    knob.style.setProperty('--eon-joystick-y', `${Math.round(vector.z * 36)}px`);
    zone.dataset.active = vector.x || vector.z ? 'true' : 'false';
    return vector;
  };

  const pointerToVector = (event) => {
    const rect = zone.getBoundingClientRect();
    const halfX = Math.max(rect.width / 2, 1);
    const halfY = Math.max(rect.height / 2, 1);
    const rawX = (event.clientX - (rect.left + halfX)) / halfX;
    const rawZ = (event.clientY - (rect.top + halfY)) / halfY;
    const vector = normalizeCityPlayVector({
      x: clamp(rawX / MAX_JOYSTICK_RADIUS, -1, 1),
      z: clamp(rawZ / MAX_JOYSTICK_RADIUS, -1, 1)
    });
    return vector;
  };

  const release = (event = {}) => {
    if (activePointerId === null) return;
    if (event.pointerId !== undefined && event.pointerId !== activePointerId) return;
    releasePointer(zone, activePointerId);
    activePointerId = null;
    setVector();
  };

  const onPointerDown = (event) => {
    if (destroyed || activePointerId !== null) return;
    event.preventDefault();
    activePointerId = event.pointerId;
    zone.setPointerCapture?.(event.pointerId);
    setVector(pointerToVector(event));
    if (!announced) {
      announced = true;
      onStatus?.('Analogue touch movement is active. Interact remains a separate visible action.');
    }
  };
  const onPointerMove = (event) => {
    if (destroyed || event.pointerId !== activePointerId) return;
    event.preventDefault();
    setVector(pointerToVector(event));
  };
  const onBlur = () => release({ pointerId: activePointerId });
  const onVisibility = () => { if (globalThis.document?.visibilityState === 'hidden') release({ pointerId: activePointerId }); };
  const onPageHide = () => release({ pointerId: activePointerId });
  const onOrientationChange = () => release({ pointerId: activePointerId });

  zone.addEventListener('pointerdown', onPointerDown, { passive: false });
  zone.addEventListener('pointermove', onPointerMove, { passive: false });
  zone.addEventListener('pointerup', release);
  zone.addEventListener('pointercancel', release);
  zone.addEventListener('lostpointercapture', release);
  globalThis.addEventListener?.('blur', onBlur);
  globalThis.addEventListener?.('pagehide', onPageHide);
  globalThis.addEventListener?.('orientationchange', onOrientationChange);
  globalThis.document?.addEventListener?.('visibilitychange', onVisibility);

  return Object.freeze({
    schema: EON_CITY_IMMERSIVE_CONTROLS_SCHEMA,
    active: true,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      release({ pointerId: activePointerId });
      zone.removeEventListener('pointerdown', onPointerDown);
      zone.removeEventListener('pointermove', onPointerMove);
      zone.removeEventListener('pointerup', release);
      zone.removeEventListener('pointercancel', release);
      zone.removeEventListener('lostpointercapture', release);
      globalThis.removeEventListener?.('blur', onBlur);
      globalThis.removeEventListener?.('pagehide', onPageHide);
      globalThis.removeEventListener?.('orientationchange', onOrientationChange);
      globalThis.document?.removeEventListener?.('visibilitychange', onVisibility);
    }
  });
}

function drawMinimap(context, { position, landmarks, worldBounds, destination, reducedMotion } = {}) {
  const canvas = context.canvas;
  const size = Math.max(1, Math.floor(Math.min(canvas.clientWidth || 160, canvas.clientHeight || 160) * (globalThis.devicePixelRatio || 1)));
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const bounds = Math.max(1, Number(worldBounds) || 13);
  const project = (x, z) => ({
    x: ((Number(x) + bounds) / (bounds * 2)) * size,
    y: ((Number(z) + bounds) / (bounds * 2)) * size
  });
  context.clearRect(0, 0, size, size);
  context.fillStyle = '#071428';
  context.fillRect(0, 0, size, size);
  context.strokeStyle = 'rgba(139,248,255,.18)';
  context.lineWidth = Math.max(1, size * .008);
  for (let index = 1; index < 4; index += 1) {
    const line = (size / 4) * index;
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line, size);
    context.moveTo(0, line);
    context.lineTo(size, line);
    context.stroke();
  }
  for (const landmark of Array.isArray(landmarks) ? landmarks : []) {
    const point = project(landmark.x, landmark.z);
    context.fillStyle = landmark.id === 'command' ? '#b68cff' : '#7cf9ff';
    context.beginPath();
    context.arc(point.x, point.y, Math.max(2, size * .026), 0, Math.PI * 2);
    context.fill();
  }
  if (destination) {
    const point = project(destination.x, destination.z);
    context.strokeStyle = '#ffcb6b';
    context.lineWidth = Math.max(1, size * .012);
    context.beginPath();
    context.arc(point.x, point.y, Math.max(4, size * .06), 0, Math.PI * 2);
    context.stroke();
  }
  if (position) {
    const point = project(position.x, position.z);
    context.fillStyle = '#eaffff';
    context.beginPath();
    context.arc(point.x, point.y, Math.max(3, size * .04), 0, Math.PI * 2);
    context.fill();
    if (!reducedMotion) {
      context.strokeStyle = 'rgba(124,249,255,.78)';
      context.lineWidth = Math.max(1, size * .01);
      context.beginPath();
      context.arc(point.x, point.y, Math.max(6, size * .087), 0, Math.PI * 2);
      context.stroke();
    }
  }
}

/**
 * Keeps the minimap fully local. The station controls visibility; the canvas
 * only reflects public district coordinates and the user's in-browser player
 * position. It deliberately draws no task title, agent detail, or private data.
 */
export function mountCityPlayMinimap({ root, runtime, landmarks = [], reducedMotion = false } = {}) {
  const canvas = root?.querySelector?.('[data-eon-play-minimap-canvas]');
  if (!canvas || !runtime?.getPlayerPosition) return Object.freeze({ destroy() {}, redraw() {} });
  const context = canvas.getContext?.('2d', { alpha: false });
  if (!context) return Object.freeze({ destroy() {}, redraw() {} });
  let destroyed = false;
  let timer = null;
  const redraw = () => {
    if (destroyed) return;
    const control = runtime.getControlSummary?.() || {};
    drawMinimap(context, {
      position: runtime.getPlayerPosition?.(),
      landmarks,
      worldBounds: runtime.getWorldBounds?.(),
      destination: control.destination || null,
      reducedMotion
    });
  };
  redraw();
  timer = globalThis.setInterval?.(redraw, MINIMAP_TICK_MS) ?? null;
  return Object.freeze({
    schema: CITY_PLAY_MINIMAP_SCHEMA,
    redraw,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (timer !== null) globalThis.clearInterval?.(timer);
    }
  });
}

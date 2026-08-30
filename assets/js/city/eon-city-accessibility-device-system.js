/**
 * W624K — City audio/VFX/accessibility/mobile/controller consolidation.
 *
 * Preferences are local and reviewable. Sound remains muted until an explicit
 * user gesture in the existing soundscape controller. This module never starts
 * audio, requests sensors, locks orientation, enters fullscreen or probes a
 * battery/thermal API automatically.
 */
export const EON_CITY_ACCESSIBILITY_DEVICE_SCHEMA = 'eon.city.accessibility-device.w624k.v1';
export const EON_CITY_ACCESSIBILITY_STORAGE_KEY = 'eon:city:accessibility-device:w624k:v1';
export const EON_CITY_AUDIO_CHANNELS = Object.freeze(['master', 'ambience', 'footsteps', 'interaction', 'ui', 'voice']);
export const EON_CITY_INPUT_MODES = Object.freeze(['auto', 'keyboard-only', 'touch-only', 'controller']);
export const EON_CITY_THERMAL_PROFILES = Object.freeze(['auto', 'cool', 'balanced', 'visual']);
export const EON_CITY_CONTROLLER_ACTIONS = Object.freeze(['move-forward', 'move-back', 'move-left', 'move-right', 'interact', 'camera-cycle', 'menu', 'unstuck']);
export const EON_CITY_ACCESSIBILITY_DEFAULTS = Object.freeze({
  schema: EON_CITY_ACCESSIBILITY_DEVICE_SCHEMA,
  muted: true,
  audio: Object.freeze({ master: 0, ambience: 0, footsteps: 0, interaction: 0, ui: 0, voice: 0 }),
  captions: true,
  reducedSensory: false,
  reducedMotion: false,
  highContrast: false,
  textScale: 1,
  inputMode: 'auto',
  controllerMap: Object.freeze({ interact: 'A', 'camera-cycle': 'Y', menu: 'Start', unstuck: 'B' }),
  non3dFallbackEnabled: true,
  mobileLandscapePreferred: true,
  touchTargetPx: 48,
  safeAreaEnabled: true,
  batterySaver: false,
  thermalProfile: 'auto',
  weatherVfx: 'restrained',
  cinematics: 'restrained'
});

const freeze = (value) => Object.freeze(value);
const INPUT_SET = new Set(EON_CITY_INPUT_MODES);
const THERMAL_SET = new Set(EON_CITY_THERMAL_PROFILES);
const ACTION_SET = new Set(EON_CITY_CONTROLLER_ACTIONS);

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function normalizeAudio(audio = {}, muted = true) {
  const result = {};
  for (const channel of EON_CITY_AUDIO_CHANNELS) result[channel] = muted ? 0 : clamp(audio?.[channel], 0, 1);
  return freeze(result);
}
function normalizeControllerMap(value = {}) {
  const result = {};
  for (const [action, control] of Object.entries(value || {})) {
    if (!ACTION_SET.has(action)) continue;
    const label = String(control || '').replace(/[^A-Za-z0-9 +_-]/g, '').trim().slice(0, 24);
    if (label) result[action] = label;
  }
  return freeze({ ...EON_CITY_ACCESSIBILITY_DEFAULTS.controllerMap, ...result });
}

export function normalizeEonCityAccessibilityPreferences(value = {}) {
  const muted = value?.muted !== false;
  return freeze({
    schema: EON_CITY_ACCESSIBILITY_DEVICE_SCHEMA,
    muted,
    audio: normalizeAudio(value?.audio || EON_CITY_ACCESSIBILITY_DEFAULTS.audio, muted),
    captions: value?.captions !== false,
    reducedSensory: value?.reducedSensory === true,
    reducedMotion: value?.reducedMotion === true,
    highContrast: value?.highContrast === true,
    textScale: clamp(value?.textScale || 1, 0.9, 1.5),
    inputMode: INPUT_SET.has(value?.inputMode) ? value.inputMode : 'auto',
    controllerMap: normalizeControllerMap(value?.controllerMap),
    non3dFallbackEnabled: value?.non3dFallbackEnabled !== false,
    mobileLandscapePreferred: value?.mobileLandscapePreferred !== false,
    touchTargetPx: Math.round(clamp(value?.touchTargetPx || 48, 44, 64)),
    safeAreaEnabled: value?.safeAreaEnabled !== false,
    batterySaver: value?.batterySaver === true,
    thermalProfile: THERMAL_SET.has(value?.thermalProfile) ? value.thermalProfile : 'auto',
    weatherVfx: value?.reducedSensory === true || value?.reducedMotion === true ? 'off' : 'restrained',
    cinematics: value?.reducedMotion === true ? 'off' : 'restrained'
  });
}

export function getEonCityDeviceClass({ width = 1280, coarsePointer = false, deviceMemory = 4, hardwareConcurrency = 4, batterySaver = false, thermalProfile = 'auto' } = {}) {
  const memory = Number(deviceMemory) || 0;
  const cores = Number(hardwareConcurrency) || 0;
  const mobile = Boolean(coarsePointer || Number(width) < 820);
  const constrained = batterySaver || memory > 0 && memory <= 2 || cores > 0 && cores <= 2 || thermalProfile === 'cool';
  const classId = constrained ? 'low' : mobile || memory > 0 && memory <= 4 || cores > 0 && cores <= 4 ? 'mid' : 'high';
  return freeze({
    id: classId,
    mobile,
    recommendedQuality: classId === 'low' ? 'lite' : classId === 'mid' ? 'balanced' : 'high',
    npcLod: classId === 'low' ? 'off' : classId === 'mid' ? 'silhouette' : 'full',
    effects: classId === 'low' ? 'minimal' : classId === 'mid' ? 'restrained' : 'standard',
    maxPixelRatio: classId === 'low' ? 1 : classId === 'mid' ? 1.5 : 2,
    diagnosticsOnly: true,
    hardwareClaimed: false
  });
}

function publicSnapshot(preferences, deviceClass, disposed = false) {
  return freeze({
    schema: EON_CITY_ACCESSIBILITY_DEVICE_SCHEMA,
    preferences,
    deviceClass,
    usefulWithSoundOff: true,
    usefulWithReducedMotion: true,
    keyboardOnlySupported: true,
    touchOnlySupported: true,
    controllerRemappingSupported: true,
    non3dFallback: freeze({ enabled: preferences.non3dFallbackEnabled, route: '/eoncity', label: 'Use EON City non-3D fallback', automatic: false }),
    audioStartsAutomatically: false,
    orientationLocksAutomatically: false,
    fullscreenStartsAutomatically: false,
    batteryOrThermalSensorRead: false,
    disposed
  });
}

export function createEonCityAccessibilityDeviceController({ storage = null, now = () => Date.now(), environment = globalThis } = {}) {
  const target = storageFor(storage);
  let disposed = false;
  let preferences = EON_CITY_ACCESSIBILITY_DEFAULTS;
  try { preferences = normalizeEonCityAccessibilityPreferences(JSON.parse(target?.getItem(EON_CITY_ACCESSIBILITY_STORAGE_KEY) || '{}')); } catch { preferences = EON_CITY_ACCESSIBILITY_DEFAULTS; }
  const detect = () => getEonCityDeviceClass({
    width: Number(environment?.innerWidth || 1280),
    coarsePointer: Boolean(environment?.matchMedia?.('(pointer: coarse)')?.matches),
    deviceMemory: Number(environment?.navigator?.deviceMemory || 0),
    hardwareConcurrency: Number(environment?.navigator?.hardwareConcurrency || 0),
    batterySaver: preferences.batterySaver,
    thermalProfile: preferences.thermalProfile
  });
  const persist = () => { try { target?.setItem(EON_CITY_ACCESSIBILITY_STORAGE_KEY, JSON.stringify({ ...preferences, updatedAt: new Date(now()).toISOString() })); return true; } catch { return false; } };
  const snapshot = () => publicSnapshot(preferences, detect(), disposed);
  return freeze({
    getSnapshot: snapshot,
    update(patch = {}, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      preferences = normalizeEonCityAccessibilityPreferences({ ...preferences, ...patch, audio: { ...preferences.audio, ...(patch.audio || {}) }, controllerMap: { ...preferences.controllerMap, ...(patch.controllerMap || {}) } });
      const stored = persist();
      return freeze({ ok: true, stored, snapshot: snapshot(), networkRequestCreated: false, audioStarted: false, sensorRequested: false });
    },
    setControllerMapping(action = '', control = '', { explicitUserAction = false } = {}) {
      if (!ACTION_SET.has(action)) return freeze({ ok: false, reason: 'unsupported-controller-action' });
      return this.update({ controllerMap: { [action]: control } }, { explicitUserAction });
    },
    requestNon3dFallback({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!preferences.non3dFallbackEnabled) return freeze({ ok: false, reason: 'fallback-disabled' });
      return freeze({ ok: true, route: '/eoncity', automaticNavigation: false, rendererDisposed: false, networkRequestCreated: false });
    },
    applyTo(root) {
      if (!root?.dataset) return freeze({ ok: false, reason: 'root-required' });
      const current = snapshot();
      root.dataset.eonCityAccessibility = EON_CITY_ACCESSIBILITY_DEVICE_SCHEMA;
      root.dataset.eonCityMuted = String(preferences.muted);
      root.dataset.eonCityReducedSensory = String(preferences.reducedSensory);
      root.dataset.eonCityReducedMotion = String(preferences.reducedMotion);
      root.dataset.eonCityHighContrast = String(preferences.highContrast);
      root.dataset.eonCityInputMode = preferences.inputMode;
      root.dataset.eonCityDeviceClass = current.deviceClass.id;
      root.style?.setProperty?.('--eon-city-text-scale', String(preferences.textScale));
      root.style?.setProperty?.('--eon-city-touch-target', `${preferences.touchTargetPx}px`);
      return freeze({ ok: true, snapshot: current });
    },
    dispose() { disposed = true; return freeze({ disposed: true }); }
  });
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

export function bindEonCityAccessibilityDeviceSystem(root, { onStatus = () => {}, onApply = () => {}, environment = globalThis } = {}) {
  const controller = createEonCityAccessibilityDeviceController({ environment });
  controller.applyTo(root);
  const menuActions = root.querySelector('[data-eon-play-menu-section="environment"] .eon-play-controls-card-actions') || root.querySelector('[data-eon-play-menu-section="work"] .eon-play-controls-card-actions');
  if (!menuActions) return () => controller.dispose();
  const open = document.createElement('button');
  open.type = 'button';
  open.dataset.eonPlayOpenAccessibilityDevice = '';
  open.textContent = 'Accessibility & device';
  menuActions.append(open);
  const panel = document.createElement('section');
  panel.className = 'eon-city-accessibility-device-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'eon-city-accessibility-title');
  root.append(panel);

  const render = () => {
    const { preferences, deviceClass } = controller.getSnapshot();
    panel.innerHTML = `<div class="eon-city-accessibility-device-card"><header><div><p class="eon-play-kicker">W624K · local accessibility and device profile</p><h2 id="eon-city-accessibility-title">Accessibility & device</h2><p>Captions remain primary. Audio, fullscreen, orientation and device sensors never start automatically.</p></div><button type="button" data-eon-accessibility-close>Close</button></header><form data-eon-accessibility-form><fieldset><legend>Sensory</legend><label><input type="checkbox" name="muted" ${preferences.muted ? 'checked' : ''}> Mute every City channel</label><label><input type="checkbox" name="captions" ${preferences.captions ? 'checked' : ''}> Captions</label><label><input type="checkbox" name="reducedSensory" ${preferences.reducedSensory ? 'checked' : ''}> Reduced sensory mode</label><label><input type="checkbox" name="reducedMotion" ${preferences.reducedMotion ? 'checked' : ''}> Reduced motion</label><label><input type="checkbox" name="highContrast" ${preferences.highContrast ? 'checked' : ''}> High contrast</label><label>Text scale <input type="range" name="textScale" min="0.9" max="1.5" step="0.1" value="${escapeHtml(preferences.textScale)}"><output>${escapeHtml(preferences.textScale)}×</output></label></fieldset><fieldset><legend>Input & mobile</legend><label>Input mode <select name="inputMode">${EON_CITY_INPUT_MODES.map((id) => `<option value="${id}"${preferences.inputMode === id ? ' selected' : ''}>${id}</option>`).join('')}</select></label><label><input type="checkbox" name="mobileLandscapePreferred" ${preferences.mobileLandscapePreferred ? 'checked' : ''}> Prefer mobile landscape</label><label><input type="checkbox" name="safeAreaEnabled" ${preferences.safeAreaEnabled ? 'checked' : ''}> Respect safe areas</label><label><input type="checkbox" name="batterySaver" ${preferences.batterySaver ? 'checked' : ''}> Battery saver</label><label>Thermal profile <select name="thermalProfile">${EON_CITY_THERMAL_PROFILES.map((id) => `<option value="${id}"${preferences.thermalProfile === id ? ' selected' : ''}>${id}</option>`).join('')}</select></label></fieldset><fieldset><legend>Controller map</legend>${['interact','camera-cycle','menu','unstuck'].map((action) => `<label>${escapeHtml(action)} <input name="map:${escapeHtml(action)}" maxlength="24" value="${escapeHtml(preferences.controllerMap[action] || '')}"></label>`).join('')}</fieldset><div class="eon-city-accessibility-actions"><button type="submit">Save local preferences</button><button type="button" data-eon-accessibility-fallback>Review non-3D fallback</button></div></form><aside><strong>Detected class: ${escapeHtml(deviceClass.id)}</strong><p>Recommended quality: ${escapeHtml(deviceClass.recommendedQuality)} · NPC LOD: ${escapeHtml(deviceClass.npcLod)} · max pixel ratio: ${escapeHtml(deviceClass.maxPixelRatio)}</p><p>This is a local heuristic, not a hardware certification or thermal sensor reading.</p></aside></div>`;
    const scale = panel.querySelector('[name="textScale"]');
    scale?.addEventListener('input', () => { const output = scale.parentElement?.querySelector('output'); if (output) output.textContent = `${scale.value}×`; });
  };
  const show = () => { render(); panel.hidden = false; panel.querySelector('input,select,button')?.focus?.({ preventScroll: true }); };
  const hide = () => { panel.hidden = true; open.focus?.({ preventScroll: true }); };
  const onOpen = () => { show(); onStatus('Accessibility and device settings opened. Nothing starts automatically.'); };
  open.addEventListener('click', onOpen);
  panel.addEventListener('click', (event) => { if (event.target === panel || event.target.closest('[data-eon-accessibility-close]')) hide(); });
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); hide(); } });
  panel.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const controllerMap = {};
    for (const [key, value] of form.entries()) if (String(key).startsWith('map:')) controllerMap[String(key).slice(4)] = value;
    const result = controller.update({
      muted: form.get('muted') === 'on', captions: form.get('captions') === 'on', reducedSensory: form.get('reducedSensory') === 'on', reducedMotion: form.get('reducedMotion') === 'on', highContrast: form.get('highContrast') === 'on', textScale: Number(form.get('textScale')), inputMode: form.get('inputMode'), mobileLandscapePreferred: form.get('mobileLandscapePreferred') === 'on', safeAreaEnabled: form.get('safeAreaEnabled') === 'on', batterySaver: form.get('batterySaver') === 'on', thermalProfile: form.get('thermalProfile'), controllerMap
    }, { explicitUserAction: true });
    controller.applyTo(root);
    onApply(result.snapshot);
    render();
    onStatus('Accessibility and device preferences saved locally. Sound remains off until a separate explicit sound action.');
  });
  panel.addEventListener('click', (event) => {
    if (!event.target.closest('[data-eon-accessibility-fallback]')) return;
    const result = controller.requestNon3dFallback({ explicitUserAction: true });
    onStatus(result.ok ? 'Non-3D fallback reviewed. Use the normal EON City route after closing this panel; no automatic navigation occurred.' : `Non-3D fallback unavailable: ${result.reason}.`);
  });
  return () => { open.removeEventListener('click', onOpen); open.remove(); panel.remove(); controller.dispose(); };
}

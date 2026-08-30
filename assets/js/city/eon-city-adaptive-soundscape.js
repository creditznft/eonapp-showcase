/**
 * W369 — EON City adaptive soundscape.
 *
 * The City soundscape is local, optional and deliberately modest until a
 * separately reviewed original audio package exists. It never fetches music,
 * records microphone input, speaks automatically, sends telemetry, or starts
 * audio before the person makes an explicit gesture.
 */
export const CITY_SOUNDSCAPE_SCHEMA = 'eon.city.adaptive-soundscape.w369.v1';
export const CITY_SOUNDSCAPE_PREFERENCES_KEY = 'eon:city:adaptive-soundscape:v1';
export const CITY_SOUNDSCAPE_DEFAULTS = Object.freeze({
  music: false,
  ambience: false,
  ui: false,
  voice: false,
  reducedSensory: false
});

const CUES = Object.freeze({
  confirm: Object.freeze({ frequency: 520, duration: 0.055 }),
  pause: Object.freeze({ frequency: 330, duration: 0.045 }),
  resume: Object.freeze({ frequency: 440, duration: 0.05 }),
  route: Object.freeze({ frequency: 610, duration: 0.06 })
});

// W572 keeps active City sound choices memory-only. Storage is accepted only when
// an explicit caller injects it (for legacy migration/test compatibility); this
// module never reaches for browser storage on its own.

function getAudioContext(environment = globalThis) {
  return environment?.AudioContext || environment?.webkitAudioContext || null;
}

function clampBoolean(value) {
  return value === true;
}

export function normalizeCitySoundscapePreferences(value = {}) {
  return Object.freeze({
    music: clampBoolean(value.music),
    ambience: clampBoolean(value.ambience),
    ui: clampBoolean(value.ui),
    voice: clampBoolean(value.voice),
    reducedSensory: clampBoolean(value.reducedSensory)
  });
}

export function readCitySoundscapePreferences(storage = null) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_SOUNDSCAPE_PREFERENCES_KEY) || 'null');
    return normalizeCitySoundscapePreferences(parsed || CITY_SOUNDSCAPE_DEFAULTS);
  } catch {
    return normalizeCitySoundscapePreferences(CITY_SOUNDSCAPE_DEFAULTS);
  }
}

export function saveCitySoundscapePreferences(next, storage = null) {
  const preferences = normalizeCitySoundscapePreferences(next);
  try {
    storage?.setItem(CITY_SOUNDSCAPE_PREFERENCES_KEY, JSON.stringify({ schema: CITY_SOUNDSCAPE_SCHEMA, ...preferences }));
  } catch {}
  return preferences;
}

function closeNode(node) {
  try { node?.stop?.(); } catch {}
  try { node?.disconnect?.(); } catch {}
}

function closeContext(context) {
  try {
    const result = context?.close?.();
    if (result?.catch) result.catch(() => {});
  } catch {}
}

function normalizeVolume(value = 0.55) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0.55;
}

function ambientGain(volume) { return 0.012 + normalizeVolume(volume) * 0.03; }
function cueGain(volume) { return 0.016 + normalizeVolume(volume) * 0.055; }

function makeAmbientBed(context, volume = 0.55) {
  const master = context?.createGain?.();
  const low = context?.createOscillator?.();
  const high = context?.createOscillator?.();
  if (!master || !low || !high || !context.destination) return null;
  const now = Number(context.currentTime || 0);
  master.gain?.setValueAtTime?.(0.0001, now);
  master.gain?.linearRampToValueAtTime?.(ambientGain(volume), now + 0.22);
  low.type = 'sine';
  high.type = 'triangle';
  low.frequency?.setValueAtTime?.(49, now);
  high.frequency?.setValueAtTime?.(98, now);
  low.connect?.(master);
  high.connect?.(master);
  master.connect?.(context.destination);
  low.start?.(now);
  high.start?.(now);
  return Object.freeze({ master, low, high });
}

function playCue(context, cue, volume = 0.55) {
  const oscillator = context?.createOscillator?.();
  const gain = context?.createGain?.();
  if (!oscillator || !gain || !context?.destination) return false;
  try {
    const now = Number(context.currentTime || 0);
    oscillator.type = 'sine';
    oscillator.frequency?.setValueAtTime?.(cue.frequency, now);
    gain.gain?.setValueAtTime?.(0.0001, now);
    gain.gain?.exponentialRampToValueAtTime?.(cueGain(volume), now + 0.012);
    gain.gain?.exponentialRampToValueAtTime?.(0.0001, now + cue.duration);
    oscillator.connect?.(gain);
    gain.connect?.(context.destination);
    oscillator.start?.(now);
    oscillator.stop?.(now + cue.duration + 0.02);
    return true;
  } catch {
    closeNode(oscillator);
    try { gain.disconnect?.(); } catch {}
    return false;
  }
}

/**
 * Creates a local controller. Call activateFromUserGesture only from a real
 * click/tap/keyboard activation handler. The controller intentionally uses no
 * packaged music or speech in this source-only wave.
 */
export function createCityAdaptiveSoundscape({ preferences = CITY_SOUNDSCAPE_DEFAULTS, environment = globalThis, onStatus = () => {}, volume = 0.55 } = {}) {
  let selected = normalizeCitySoundscapePreferences(preferences);
  let sessionVolume = normalizeVolume(volume);
  let context = null;
  let ambient = null;
  let activated = false;
  let disposed = false;
  const status = (message) => { try { onStatus(String(message || '')); } catch {} };

  const stopAmbience = () => {
    if (!ambient) return;
    const now = Number(context?.currentTime || 0);
    try { ambient.master?.gain?.linearRampToValueAtTime?.(0.0001, now + 0.08); } catch {}
    const defer = environment?.setTimeout || globalThis.setTimeout;
    defer?.(() => {
      closeNode(ambient?.low);
      closeNode(ambient?.high);
      try { ambient?.master?.disconnect?.(); } catch {}
    }, 120);
    ambient = null;
  };

  const syncAmbient = () => {
    if (!activated || disposed || !context) return false;
    const shouldPlay = selected.ambience && !selected.reducedSensory;
    if (!shouldPlay) {
      stopAmbience();
      return false;
    }
    if (ambient) return true;
    ambient = makeAmbientBed(context, sessionVolume);
    return Boolean(ambient);
  };

  const activateFromUserGesture = () => {
    if (disposed) return Object.freeze({ ok: false, reason: 'disposed' });
    const wantsAudio = selected.ambience || selected.ui;
    if (!wantsAudio) {
      status('Soundscape remains off. Enable ambience or UI cues and choose Enter again to activate local audio.');
      return Object.freeze({ ok: true, activated: false, reason: 'preferences-off' });
    }
    const AudioContextConstructor = getAudioContext(environment);
    if (typeof AudioContextConstructor !== 'function') {
      status('This browser does not expose a local audio context. Visual status remains available.');
      return Object.freeze({ ok: false, activated: false, reason: 'audio-unavailable' });
    }
    try {
      context = context || new AudioContextConstructor();
      const resumed = context.resume?.();
      if (resumed?.catch) resumed.catch(() => {});
      activated = true;
      const ambienceActive = syncAmbient();
      if (selected.music) status('Music is set to on, but no original music stems are packaged in this code-only wave.');
      else if (ambienceActive) status('Local procedural ambience is active. No audio was downloaded.');
      else status('Local UI cues are active after your actions.');
      return Object.freeze({ ok: true, activated: true, ambience: ambienceActive, musicPackage: 'not-shipped', voiceMode: selected.voice ? 'captions-only' : 'off' });
    } catch {
      status('Local audio could not start. Visual status remains available.');
      return Object.freeze({ ok: false, activated: false, reason: 'audio-start-failed' });
    }
  };

  const setPreferences = (next) => {
    selected = normalizeCitySoundscapePreferences(next);
    if (selected.reducedSensory) stopAmbience();
    else syncAmbient();
    return selected;
  };

  const cue = (cueId = 'confirm') => {
    if (disposed || !activated || !selected.ui || selected.reducedSensory || !context) return false;
    return playCue(context, CUES[cueId] || CUES.confirm, sessionVolume);
  };

  const setVolume = (next) => {
    sessionVolume = normalizeVolume(next);
    if (ambient?.master?.gain && context) {
      const now = Number(context.currentTime || 0);
      try { ambient.master.gain.linearRampToValueAtTime(ambientGain(sessionVolume), now + 0.08); } catch {}
    }
    return sessionVolume;
  };

  const getSummary = () => Object.freeze({
    schema: CITY_SOUNDSCAPE_SCHEMA,
    active: activated,
    ambienceActive: Boolean(ambient),
    musicPackage: 'not-shipped',
    voiceMode: selected.voice ? 'captions-only' : 'off',
    localOnly: true,
    remoteAudio: false,
    microphone: false,
    automaticAudio: false,
    volume: sessionVolume,
    preferences: selected
  });

  const stopForRuntimeGuard = (reason = 'runtime-guard') => {
    if (disposed) return Object.freeze({ ok: false, reason: 'disposed' });
    stopAmbience();
    closeContext(context);
    context = null;
    activated = false;
    status(reason === 'tab-hidden' ? 'Local sound stopped because the tab is hidden. It will not resume automatically.' : reason === 'city-paused' ? 'Local sound stopped because City is paused. It will not resume automatically.' : 'Local sound stopped. It will not resume automatically.');
    return Object.freeze({ ok: true, reason: String(reason || 'runtime-guard') });
  };

  const dispose = () => {
    if (disposed) return;
    stopForRuntimeGuard('dispose');
    disposed = true;
  };

  return Object.freeze({
    schema: CITY_SOUNDSCAPE_SCHEMA,
    activateFromUserGesture,
    setPreferences,
    setVolume,
    cue,
    stopForRuntimeGuard,
    getSummary,
    dispose
  });
}

export function getCitySoundscapeTruth() {
  return Object.freeze({
    schema: CITY_SOUNDSCAPE_SCHEMA,
    localOnly: true,
    remoteAudio: false,
    remoteTelemetry: false,
    microphone: false,
    automaticAudio: false,
    audioPreferencePersistedByDefault: false,
    originalMusicPackage: 'not-shipped',
    voice: 'captions-only-until-opt-in-reviewed-voice-assets-exist',
    cleanupRequired: true
  });
}

/**
 * W273-A0 — City sensory preferences.
 *
 * All sensory feedback is browser-local, default-off, and can occur only after
 * the visitor explicitly enables it and makes a local action. Visual status is
 * always available; no audio asset, microphone, remote transport, or telemetry
 * is used here.
 */
export const CITY_SENSORY_PREFERENCES_SCHEMA = 'eon.city.sensory-preferences.w273.v1';
export const CITY_SENSORY_PREFERENCES_KEY = 'eon:city:sensory-preferences:v1';
export const CITY_SENSORY_DEFAULTS = Object.freeze({ sound: false, haptics: false });

const CUES = Object.freeze({
  confirm: Object.freeze({ frequency: 520, duration: 0.055, haptic: Object.freeze([12]) }),
  pause: Object.freeze({ frequency: 330, duration: 0.045, haptic: Object.freeze([8]) }),
  resume: Object.freeze({ frequency: 440, duration: 0.05, haptic: Object.freeze([8, 18, 8]) })
});

function safeStorage(storage = globalThis.localStorage) {
  try { return storage || null; } catch { return null; }
}

export function normalizeCitySensoryPreferences(value) {
  return Object.freeze({
    sound: Boolean(value?.sound),
    haptics: Boolean(value?.haptics)
  });
}

export function readCitySensoryPreferences(storage = safeStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_SENSORY_PREFERENCES_KEY) || 'null');
    return normalizeCitySensoryPreferences(parsed || CITY_SENSORY_DEFAULTS);
  } catch {
    return normalizeCitySensoryPreferences(CITY_SENSORY_DEFAULTS);
  }
}

export function saveCitySensoryPreferences(next, storage = safeStorage()) {
  const preferences = normalizeCitySensoryPreferences(next);
  try {
    storage?.setItem(CITY_SENSORY_PREFERENCES_KEY, JSON.stringify({ schema: CITY_SENSORY_PREFERENCES_SCHEMA, ...preferences }));
  } catch {}
  return preferences;
}

function createOptionalTone(cue, environment) {
  const AudioContextConstructor = environment?.AudioContext || environment?.webkitAudioContext;
  if (typeof AudioContextConstructor !== 'function') return false;
  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator?.();
    const gain = context.createGain?.();
    if (!oscillator || !gain || !context.destination) {
      void context.close?.();
      return false;
    }
    const now = Number(context.currentTime || 0);
    oscillator.type = 'sine';
    oscillator.frequency?.setValueAtTime?.(cue.frequency, now);
    gain.gain?.setValueAtTime?.(0.0001, now);
    gain.gain?.exponentialRampToValueAtTime?.(0.025, now + 0.012);
    gain.gain?.exponentialRampToValueAtTime?.(0.0001, now + cue.duration);
    oscillator.connect?.(gain);
    gain.connect?.(context.destination);
    oscillator.start?.(now);
    oscillator.stop?.(now + cue.duration + 0.015);
    const resume = context.resume?.();
    if (resume?.catch) resume.catch(() => {});
    const defer = environment?.setTimeout || globalThis.setTimeout;
    defer?.(() => { void context.close?.(); }, 250);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calls optional procedural feedback only from an explicit local action.
 * No caller should invoke this during page mount, render, navigation, or timer work.
 */
export function triggerCitySensoryFeedback(preferences, cueId = 'confirm', environment = globalThis) {
  const selected = normalizeCitySensoryPreferences(preferences);
  const cue = CUES[cueId] || CUES.confirm;
  const result = { sound: false, haptics: false };
  if (selected.sound) result.sound = createOptionalTone(cue, environment);
  if (selected.haptics && typeof environment?.navigator?.vibrate === 'function') {
    try { result.haptics = Boolean(environment.navigator.vibrate([...cue.haptic])); } catch {}
  }
  return Object.freeze(result);
}

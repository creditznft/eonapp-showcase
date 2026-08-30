/** RT91 — one soundscape projection across Hub and the three flagship worlds. */
import { buildEonCityRt91AudioMix } from './eon-city-rt91-audio-director.js';
import { normalizeEonCityAccessibilityPreferences } from '../eon-city-accessibility-device-system.js';

export const EON_CITY_RT91_SOUNDSCAPE_CONVERGENCE_SCHEMA = 'eon.city.soundscape-convergence.rt91.v1';
const freeze = Object.freeze;
const WORLDS = freeze(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);

export function buildEonCityRt91SoundscapeConvergence({ currentWorldId = 'command-hub', preferences = {}, zoneId = '', eventId = '', missionId = '', interactionCue = '' } = {}) {
  const prefs = normalizeEonCityAccessibilityPreferences(preferences);
  const activeWorld = WORLDS.includes(currentWorldId) ? currentWorldId : 'command-hub';
  const mixes = Object.fromEntries(WORLDS.map((worldId) => [worldId, buildEonCityRt91AudioMix({ worldId, zoneId: worldId === activeWorld ? zoneId : '', eventId: worldId === activeWorld ? eventId : '', missionId: worldId === activeWorld ? missionId : '', interactionCue: worldId === activeWorld ? interactionCue : '', hiddenWorld: worldId !== activeWorld, reducedSensory: prefs.reducedSensory })]));
  return freeze({
    schema: EON_CITY_RT91_SOUNDSCAPE_CONVERGENCE_SCHEMA,
    activeWorld,
    mixes: freeze(mixes),
    oneAudibleWorld: true,
    hiddenWorldsSuspended: WORLDS.filter((worldId) => worldId !== activeWorld).every((worldId) => mixes[worldId].hiddenWorldAudioSuspended),
    crossfadeInsteadOfTinyBoundaryRestart: true,
    captionsEnabled: prefs.captions,
    reducedSensoryHonored: prefs.reducedSensory,
    soundStartsOnlyAfterExistingExplicitGesture: true,
    ownsAudioContext: false,
    ownsTimer: false,
    networkRequestCreated: false
  });
}

export function validateEonCityRt91SoundscapeConvergence(plan = buildEonCityRt91SoundscapeConvergence()) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SOUNDSCAPE_CONVERGENCE_SCHEMA) errors.push('schema');
  if (!WORLDS.includes(plan.activeWorld) || !plan.oneAudibleWorld || !plan.hiddenWorldsSuspended || !plan.crossfadeInsteadOfTinyBoundaryRestart) errors.push('mix');
  if (!plan.soundStartsOnlyAfterExistingExplicitGesture || plan.ownsAudioContext || plan.ownsTimer || plan.networkRequestCreated) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_SOUNDSCAPE_CONVERGENCE_SCHEMA, buildEonCityRt91SoundscapeConvergence, validateEonCityRt91SoundscapeConvergence });

/** RT91 — layered audio mix plan; owns no AudioContext and no timer. */
export const EON_CITY_RT91_AUDIO_SCHEMA = 'eon.city.audio-director.rt91.v1';
const freeze = Object.freeze;

const BASE = freeze({
  'signal-frontier': 'signal-frontier-ambient',
  'storm-sector': 'storm-sector-ambient',
  'my-frontier': 'my-frontier-city-ambient',
  'command-hub': 'command-hub-ambient'
});

export function buildEonCityRt91AudioMix({ worldId = 'command-hub', zoneId = '', eventId = '', missionId = '', interactionCue = '', hiddenWorld = false, reducedSensory = false } = {}) {
  const world = Object.hasOwn(BASE, worldId) ? worldId : 'command-hub';
  const suspended = hiddenWorld === true;
  const layers = [
    freeze({ kind: 'base', key: BASE[world], gain: suspended ? 0 : 0.72 }),
    freeze({ kind: 'zone', key: zoneId ? `${world}:zone:${zoneId}` : '', gain: suspended ? 0 : 0.46 }),
    freeze({ kind: 'event', key: eventId ? `${world}:event:${eventId}` : '', gain: suspended || reducedSensory ? 0 : 0.42 }),
    freeze({ kind: 'mission', key: missionId ? `${world}:mission:${missionId}` : '', gain: suspended ? 0 : 0.34 }),
    freeze({ kind: 'interaction', key: interactionCue ? `${world}:cue:${interactionCue}` : '', gain: suspended ? 0 : 0.78 })
  ].filter((layer) => layer.key);
  return freeze({
    schema: EON_CITY_RT91_AUDIO_SCHEMA,
    worldId: world,
    layers: freeze(layers),
    crossfadeMs: reducedSensory ? 1200 : 700,
    tinyBoundaryCrossingRestartsBaseTrack: false,
    hiddenWorldAudioSuspended: suspended,
    eventSpectacleCanPreferAudioOverGeometry: true,
    ownsAudioContext: false,
    ownsTimer: false,
    networkRequestCreated: false
  });
}

export default freeze({ EON_CITY_RT91_AUDIO_SCHEMA, buildEonCityRt91AudioMix });

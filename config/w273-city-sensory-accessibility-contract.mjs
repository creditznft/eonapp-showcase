export const W273_CITY_SENSORY_ACCESSIBILITY_CONTRACT = Object.freeze({
  wave: 'W273-A0',
  scope: 'City Play source-only',
  preferenceKey: 'eon:city:sensory-preferences:v1',
  defaults: Object.freeze({ sound: false, haptics: false }),
  requiredStationMarkers: Object.freeze([
    'data-w273-sensory-options',
    'data-eon-play-sound',
    'data-eon-play-haptics',
    'Off by default; no sound or vibration starts until you enable it and choose an action.',
    'Visual status remains available.'
  ]),
  forbiddenRemotePatterns: Object.freeze(['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']),
  claimFence: 'This source baseline covers City Play only and cannot prove device audio, vibration support, hearing/vestibular accessibility, or usability on real hardware.'
});

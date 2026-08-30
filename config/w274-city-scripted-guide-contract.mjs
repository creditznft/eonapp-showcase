export const W274_CITY_SCRIPTED_GUIDE_CONTRACT = Object.freeze({
  wave: 'W274-A0',
  scope: 'City Play scripted orientation source-only',
  guideSchema: 'eon.city.scripted-guide.w274.v1',
  requiredStationMarkers: Object.freeze([
    'data-eon-play-open-guide',
    'data-eon-play-guide-panel',
    'data-eon-play-guide-content',
    'Scripted local guide · no AI or remote service',
    'bindScriptedCityGuide'
  ]),
  requiredBoundaryMarkers: Object.freeze([
    'scripted local orientation text',
    'It does not read Chat, Vault, provider, project, profile, device, or private City data.',
    'It never opens a route, confirms a work action, or starts a background task.'
  ]),
  forbiddenRemotePatterns: Object.freeze(['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']),
  forbiddenAutoActionPatterns: Object.freeze(['location.assign', 'window.location', 'location.href', 'open(', 'confirmPreparedCityAction']),
  claimFence: 'This source baseline proves only finite local guide copy and interaction boundaries. It cannot prove real-world moderation, NPC behavior, social presence, accessibility or device usability.'
});

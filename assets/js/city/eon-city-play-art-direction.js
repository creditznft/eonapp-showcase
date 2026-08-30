/**
 * W252 — Original visual-production contract for EON City Play.
 *
 * Every entry below is authored as procedural geometry, procedural text, or
 * source-controlled colour/material direction. No runtime image, model, sound,
 * marketplace asset, copied brand art, or remote asset URL is permitted.
 */
export const CITY_PLAY_ART_DIRECTION_SCHEMA = 'eon.city.play.art-direction.w252.v1';

export const CITY_PLAY_NEON_COMMAND_PALETTE = Object.freeze({
  night: '#06101d',
  steel: '#101b2e',
  steelEdge: '#263d61',
  glass: '#132b4b',
  cyan: '#7cf9ff',
  teal: '#39e7d3',
  violet: '#a584ff',
  amber: '#ffba54',
  mint: '#69efb5',
  rose: '#ff6aa9',
  paper: '#dbe8ff'
});

export const CITY_PLAY_ART_BUDGETS = Object.freeze({
  lite: Object.freeze({
    facadeFins: 2,
    windowRows: 3,
    skylineTowers: 4,
    streetProps: 6,
    signCount: 2,
    npcDetail: 'silhouette',
    fogDensity: 0.012,
    textureMaxPx: 256,
    particleCap: 0,
    expectedUse: 'low-memory and reduced-effects fallback'
  }),
  balanced: Object.freeze({
    facadeFins: 4,
    windowRows: 4,
    skylineTowers: 7,
    streetProps: 11,
    signCount: 4,
    npcDetail: 'readable',
    fogDensity: 0.016,
    textureMaxPx: 512,
    particleCap: 36,
    expectedUse: 'default mobile/desktop preview profile'
  }),
  cinematic: Object.freeze({
    facadeFins: 7,
    windowRows: 5,
    skylineTowers: 10,
    streetProps: 16,
    signCount: 6,
    npcDetail: 'readable-plus',
    fogDensity: 0.019,
    textureMaxPx: 1024,
    particleCap: 76,
    expectedUse: 'opt-in desktop/high-capability preview profile'
  })
});

/**
 * A licence/provenance ledger is kept adjacent to source so a future art pass
 * cannot silently introduce unknown origin assets. `sourcePath` is an internal
 * source reference, never a network location.
 */
export const CITY_PLAY_ORIGINAL_ASSET_LEDGER = Object.freeze([
  Object.freeze({
    id: 'neon-command-architecture',
    kind: 'procedural-geometry',
    sourcePath: 'assets/js/city/eon-city-play-babylon.js',
    origin: 'EONAPP original procedural construction',
    licence: 'EONAPP controlled original work',
    runtimeNetwork: false,
    userData: false,
    removalPath: 'disable addDistrictArchitecture in source'
  }),
  Object.freeze({
    id: 'neon-command-signage',
    kind: 'procedural-text-canvas',
    sourcePath: 'assets/js/city/eon-city-play-babylon.js',
    origin: 'EONAPP original text/layout treatment',
    licence: 'EONAPP controlled original work',
    runtimeNetwork: false,
    userData: false,
    removalPath: 'disable createDistrictSign in source'
  }),
  Object.freeze({
    id: 'neon-command-palette',
    kind: 'source-colour-system',
    sourcePath: 'assets/js/city/eon-city-play-art-direction.js',
    origin: 'EONAPP original colour direction',
    licence: 'EONAPP controlled original work',
    runtimeNetwork: false,
    userData: false,
    removalPath: 'replace CITY_PLAY_NEON_COMMAND_PALETTE'
  }),
  Object.freeze({
    id: 'neon-command-npc-silhouettes',
    kind: 'procedural-geometry',
    sourcePath: 'assets/js/city/eon-city-play-babylon.js',
    origin: 'EONAPP original primitive character construction',
    licence: 'EONAPP controlled original work',
    runtimeNetwork: false,
    userData: false,
    removalPath: 'disable addNpcs in source'
  })
]);

export const CITY_PLAY_ART_BIBLE = Object.freeze({
  mood: 'Original neo-noir command district: calm, premium, legible and work-focused.',
  hierarchy: 'Command Centre anchors the skyline; each work landmark has a distinct silhouette and accent.',
  lighting: 'Cool moonlit steel, warm controlled accent pools, readable paths and restrained bloom.',
  typography: 'Short functional district labels only; no advertising, token counters, reward pressure or decorative clutter.',
  accessibility: 'Strong landmark contrast, reduced-effects fallback, readable sign scale and no flashing hazard.',
  performance: 'Geometry first, shared materials, bounded props, no remote assets and explicit profile budgets.'
});

export function getCityPlayArtBudget(quality = 'balanced') {
  return CITY_PLAY_ART_BUDGETS[quality] || CITY_PLAY_ART_BUDGETS.balanced;
}

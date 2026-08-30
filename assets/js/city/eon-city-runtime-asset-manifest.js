/** W624B — deterministic, same-origin EON City runtime asset manifest. */
import { EON_CITY_ART_BIBLE_SCHEMA } from './eon-city-art-bible.js';
import {
  EON_CITY_W649_CHARACTER_MANIFEST,
  validateEonCityW649CharacterManifest
} from './w649/eon-city-w649-character-manifest.js';
import {
  EON_CITY_W649_WORLD_MANIFEST,
  validateEonCityW649WorldManifest
} from './w649/eon-city-w649-world-manifest.js';
import {
  EON_CITY_W649_ANIMATION_MANIFEST,
  validateEonCityW649AnimationManifest
} from './w649/eon-city-w649-animation-manifest.js';
import {
  EON_CITY_W649_DISTRICT_MANIFEST,
  validateEonCityW649DistrictManifest
} from './w649/eon-city-w649-district-manifest.js';

export const EON_CITY_W649_RUNTIME_EXTENSION_SCHEMA = 'eon.city.runtime-assets.w649c.v1';
export const EON_CITY_W649_RUNTIME_CACHE_VERSION = 'eon-city-w649c-content-hashed-assets-1';

export const EON_CITY_RUNTIME_ASSET_MANIFEST_SCHEMA = 'eon.city.runtime-assets.w624b.v1';
export const EON_CITY_RUNTIME_CACHE_VERSION = 'eon-city-w624b-productive-nocturne-1';

const entry = (id, path, tier, integrity, kind, extra = {}) => Object.freeze({
  id,
  path,
  tier,
  kind,
  integrity: integrity ? `sha256-${integrity}` : null,
  sameOrigin: true,
  remoteRequired: false,
  ...extra
});

export const EON_CITY_RUNTIME_ASSET_MANIFEST = Object.freeze({
  schema: EON_CITY_RUNTIME_ASSET_MANIFEST_SCHEMA,
  artBibleSchema: EON_CITY_ART_BIBLE_SCHEMA,
  version: '624.2.0',
  cacheVersion: EON_CITY_RUNTIME_CACHE_VERSION,
  coreRequired: Object.freeze([
    entry('arrival-gate-lite', '/assets/city/models/command-horizon-arrival-gate-lod2-textured.glb', 'core-required', 'c47049bd6c5cf74de63bf1929cf17fe805e5ac4ec79a17d71725269b41c15dbc', 'geometry'),
    entry('command-deck-lite', '/assets/city/models/command-horizon-command-deck-lod2-textured.glb', 'core-required', 'fb9b5619b234ad5bcff596573f67c825a239a3ec84c7af28d36702b70c978977', 'geometry'),
    entry('wayfinding-lite', '/assets/city/models/command-horizon-wayfinding-lod2-textured.glb', 'core-required', '9685624eacedb2279ec53d8245c5be5a12cbc7fa33e18316ee602599398089ca', 'geometry'),
    entry('wayfinder-lite', '/assets/city/models/eon-navigator-lod2.glb', 'core-required', '0f4427218199a46de42b4e62079d5cbcc26aa85281bbe061410126d2fd18582c', 'character'),
    entry('eonbot-lite', '/assets/city/models/eonbot-companion-lod2.glb', 'core-required', 'ce6a49d10cb013f0aea52370d1ec2053580565b43cc47649ca28a1891b928c64', 'character')
  ]),
  optionalStreamed: Object.freeze([
    entry('arrival-gate-detail', '/assets/city/models/command-horizon-arrival-gate-lod0-textured.glb', 'optional-streamed', null, 'geometry', { quality: 'cinematic' }),
    entry('command-deck-detail', '/assets/city/models/command-horizon-command-deck-lod0-textured.glb', 'optional-streamed', null, 'geometry', { quality: 'cinematic' }),
    entry('wayfinding-detail', '/assets/city/models/command-horizon-wayfinding-lod0-textured.glb', 'optional-streamed', null, 'geometry', { quality: 'cinematic' }),
    entry('wayfinder-detail', '/assets/city/models/eon-navigator-lod0.glb', 'optional-streamed', null, 'character', { quality: 'cinematic' }),
    entry('eonbot-detail', '/assets/city/models/eonbot-companion-lod0.glb', 'optional-streamed', null, 'character', { quality: 'cinematic' })
  ]),
  fallbacks: Object.freeze([
    Object.freeze({ id: 'procedural-command-district', tier: 'fallback', kind: 'procedural', localOnly: true, reason: 'required-asset-failure' }),
    Object.freeze({ id: 'wayfinder-reference-capsule', tier: 'fallback', kind: 'procedural', localOnly: true, reason: 'character-asset-failure' }),
    Object.freeze({ id: 'eonbot-orbit-reference', tier: 'fallback', kind: 'procedural', localOnly: true, reason: 'companion-asset-failure' }),
    Object.freeze({ id: 'silent-city', tier: 'fallback', kind: 'audio', localOnly: true, reason: 'audio-disabled-or-unavailable' })
  ]),
  targetFrameReferences: Object.freeze([
    entry('desktop-arrival-target', '/assets/city/art/w624a-targets/eon-city-desktop-arrival-target.svg', 'reference-only', '1a58b4c3d5ce7b997d7fcb0204ddb03fbe5c8a86ce41b1e48fde244aa3199471', 'target-frame'),
    entry('mobile-arrival-target', '/assets/city/art/w624a-targets/eon-city-mobile-arrival-target.svg', 'reference-only', 'fdea023c6edb5ec0b52265819464ca1954a7fbc4fe7531118c99edd98b630870', 'target-frame'),
    entry('cast-lineup-target', '/assets/city/art/w624a-targets/eon-city-cast-lineup-target.svg', 'reference-only', '1fd918fcdb6e0613be71333455c09af2bdb234aa8717fba60dc87f220c478768', 'target-frame')
  ]),
  audioGroups: Object.freeze([
    Object.freeze({ id: 'ambience', defaultState: 'off', activation: 'explicit-user-action', remoteRequired: false }),
    Object.freeze({ id: 'interaction', defaultState: 'off', activation: 'explicit-user-action', remoteRequired: false }),
    Object.freeze({ id: 'voice', defaultState: 'off', activation: 'explicit-user-action', remoteRequired: false })
  ]),
  w649: Object.freeze({
    schema: EON_CITY_W649_RUNTIME_EXTENSION_SCHEMA,
    version: '649.3.0',
    cacheVersion: EON_CITY_W649_RUNTIME_CACHE_VERSION,
    characters: EON_CITY_W649_CHARACTER_MANIFEST,
    world: EON_CITY_W649_WORLD_MANIFEST,
    animations: EON_CITY_W649_ANIMATION_MANIFEST,
    districts: EON_CITY_W649_DISTRICT_MANIFEST,
    activeLogicalAssetCount: EON_CITY_W649_CHARACTER_MANIFEST.entries.length + EON_CITY_W649_WORLD_MANIFEST.entries.length,
    variantPolicy: Object.freeze({ preferred: 'meshopt-webp', fallback: 'decoder-free', preloadAll: false }),
    truth: Object.freeze({ authenticatedBootOnly: true, contentHashedPaths: true, remoteArtDependency: false, privateDataInManifest: false, visualCertificationPending: true })
  }),
  truth: Object.freeze({
    remoteArtDependency: false,
    privateDataInManifest: false,
    targetFramesAreRuntimeAssets: false,
    optionalFailureBlocksCore: false,
    integrityMetadataIsBuildControlled: true
  })
});

export function getEonCityRuntimeAssetManifest() {
  return EON_CITY_RUNTIME_ASSET_MANIFEST;
}

export function validateEonCityRuntimeAssetManifest(manifest = EON_CITY_RUNTIME_ASSET_MANIFEST) {
  const errors = [];
  const allPathEntries = [...manifest.coreRequired, ...manifest.optionalStreamed, ...manifest.targetFrameReferences];
  if (manifest.schema !== EON_CITY_RUNTIME_ASSET_MANIFEST_SCHEMA) errors.push('schema');
  if (manifest.artBibleSchema !== EON_CITY_ART_BIBLE_SCHEMA) errors.push('art-bible');
  if (!String(manifest.cacheVersion || '').startsWith('eon-city-w624b-')) errors.push('cache-version');
  if (manifest.coreRequired.length < 5) errors.push('core-assets');
  if (manifest.fallbacks.length < 4) errors.push('fallbacks');
  if (allPathEntries.some((asset) => !String(asset.path || '').startsWith('/assets/city/'))) errors.push('non-city-path');
  if (allPathEntries.some((asset) => /^https?:/i.test(String(asset.path || '')) || asset.remoteRequired)) errors.push('remote-asset');
  if (manifest.coreRequired.some((asset) => !asset.integrity)) errors.push('missing-core-integrity');
  if (manifest.w649?.schema !== EON_CITY_W649_RUNTIME_EXTENSION_SCHEMA) errors.push('w649-schema');
  if (manifest.w649?.cacheVersion !== EON_CITY_W649_RUNTIME_CACHE_VERSION) errors.push('w649-cache-version');
  if (manifest.w649?.activeLogicalAssetCount !== 33) errors.push('w649-active-assets');
  const w649Checks = [
    validateEonCityW649CharacterManifest(manifest.w649?.characters),
    validateEonCityW649WorldManifest(manifest.w649?.world),
    validateEonCityW649AnimationManifest(manifest.w649?.animations),
    validateEonCityW649DistrictManifest(manifest.w649?.districts)
  ];
  for (const [index, check] of w649Checks.entries()) {
    if (!check.ok) errors.push(`w649-manifest-${index}:${check.errors.join(',')}`);
  }
  const w649Assets = [...(manifest.w649?.characters?.entries || []), ...(manifest.w649?.world?.entries || [])];
  if (w649Assets.some((asset) => !asset?.variants?.primary?.integrity || !asset?.variants?.fallback?.integrity)) errors.push('w649-missing-integrity');
  if (w649Assets.some((asset) => !/\.[a-f0-9]{12}\.glb$/i.test(String(asset?.variants?.primary?.path || '')) || !/\.[a-f0-9]{12}\.glb$/i.test(String(asset?.variants?.fallback?.path || '')))) errors.push('w649-unhashed-path');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

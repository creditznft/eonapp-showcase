/**
 * W792A — Storm Sector authored package candidate.
 *
 * The package is made from maintained same-origin authored meshes and local audio.
 * This module does not certify visible presentation, unlock a gateway, or own runtime state.
 */
const freeze = Object.freeze;

export const EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_SCHEMA = 'eon.expanse.storm-sector.authored-package.w792a.v1';
export const EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST = 'a5c13aa3ba94a0b60f0e2b7122f228f5534132b4985c3019e414cc85a9a96c4d';

const EON_EXPANSE_W792A_STORM_SECTOR_SOURCE_PREFIX = '/assets/city/future-regions/storm-sector/';
const EON_EXPANSE_W792A_STORM_SECTOR_IMMUTABLE_BINARY = /^\/assets\/city\/immutable\/future-regions\/storm-sector\/[^?#]+\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i;
const isMaintainedStormSectorAssetUrl = (url, { allowImmutableBinary = false } = {}) => {
  const value = String(url || '');
  return value.startsWith(EON_EXPANSE_W792A_STORM_SECTOR_SOURCE_PREFIX)
    || (allowImmutableBinary && EON_EXPANSE_W792A_STORM_SECTOR_IMMUTABLE_BINARY.test(value));
};

const lod = (level, url, sha256, bytes) => freeze({ level, url, sha256, bytes });
const hero = (id, lods) => freeze({ id, authoredComposite: true, developmentProxy: false, lods: freeze(lods) });
const audio = (id, url, sha256, bytes) => freeze({ id, url, sha256, bytes, explicitStartRequired: true });

export const EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE = freeze({
  schema: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_SCHEMA,
  regionId: 'storm-sector',
  gatewayId: 'future-gateway-storm-sector',
  packageKind: 'authored-composite-candidate',
  sourcePolicy: 'maintained-same-origin-authored-assets',
  packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
  heroAssets: freeze([
    hero('storm-command-spire', [
      lod(0, '/assets/city/future-regions/storm-sector/models/storm-command-spire-lod0.glb', '39b351b68b4d059d3ddd36388cc618fd9b04bab8ec6bfed98124598b89bdb529', 290180),
      lod(1, '/assets/city/future-regions/storm-sector/models/storm-command-spire-lod1.glb', '5d6178065054cfb0044d68b68f41865a37c8d49e07d4a492979f1ea7459999b0', 271112),
      lod(2, '/assets/city/future-regions/storm-sector/models/storm-command-spire-lod2.glb', '7da7815f9cdbc8a5d4ab36533c219a6e2427f5c370883bb659bbf7e0c52e71e9', 260220)
    ]),
    hero('atmospheric-stabilizer', [
      lod(0, '/assets/city/future-regions/storm-sector/models/atmospheric-stabilizer-lod0.glb', 'd3df8caf74464c29b0ef96d85f4813ffae33437780ff0e246f1dd916fc6955c4', 220184),
      lod(1, '/assets/city/future-regions/storm-sector/models/atmospheric-stabilizer-lod1.glb', '676fee318e0833ebd4a9957e05247078716df2060897f76656aaf95979895a56', 201344),
      lod(2, '/assets/city/future-regions/storm-sector/models/atmospheric-stabilizer-lod2.glb', 'daad0e328863af003d82402f325645fd19fde4f4e577f0582defbf90ec5dac1d', 192824)
    ]),
    hero('charged-transit-gate', [
      lod(0, '/assets/city/future-regions/storm-sector/models/charged-transit-gate-lod0.glb', 'ddba2fcf752d73524c0ac054836112d18e7bcb96d4e26e0ba57dde3b616803f1', 298428),
      lod(1, '/assets/city/future-regions/storm-sector/models/charged-transit-gate-lod1.glb', 'a0743ad7e733ae43e23a8172048d3e91a44ec8c68a0eaba79109af7463d120b2', 279044),
      lod(2, '/assets/city/future-regions/storm-sector/models/charged-transit-gate-lod2.glb', '0003ee32207ccbd45f139b1751fcb4535a82f06f06d9632036f10434260db1d5', 265868)
    ])
  ]),
  architectureKits: freeze([
    freeze({ id: 'storm-relay-kit', authored: true, moduleHeroIds: freeze(['storm-command-spire', 'atmospheric-stabilizer']) }),
    freeze({ id: 'industrial-platform-kit', authored: true, moduleHeroIds: freeze(['storm-command-spire']) }),
    freeze({ id: 'charged-transit-kit', authored: true, moduleHeroIds: freeze(['charged-transit-gate']) })
  ]),
  environmentFamilies: freeze([
    freeze({ id: 'electrical-storms', authored: true, reducedSensorySafe: true }),
    freeze({ id: 'rain-sheets', authored: true, reducedSensorySafe: true }),
    freeze({ id: 'charged-fog', authored: true, reducedSensorySafe: true }),
    freeze({ id: 'signal-pylons', authored: true, reducedSensorySafe: true })
  ]),
  audioFamilies: freeze([
    audio('storm-distance', '/assets/city/future-regions/storm-sector/audio/storm-distance.wav', 'c31a2f9a30be2468d024e973470852f185f7ed813e994ebfef8b4716f8212bad', 352844),
    audio('relay-hum', '/assets/city/future-regions/storm-sector/audio/relay-hum.wav', 'aa30d98c900b8568d3b92b0719b61b00a38f4dcc905044d0302ed6676228239f', 352844),
    audio('charged-wind', '/assets/city/future-regions/storm-sector/audio/charged-wind.wav', '928f24c13ef1c01ab70716bc4874479301d0b29ef175782f33b8b9bbcc058252', 352844)
  ]),
  missionFamilies: freeze([
    freeze({ id: 'weather-restoration', manualPlaythroughRequired: true, automaticCompletion: false }),
    freeze({ id: 'relay-repair', manualPlaythroughRequired: true, automaticCompletion: false }),
    freeze({ id: 'storm-rescue', manualPlaythroughRequired: true, automaticCompletion: false })
  ]),
  qualityProfiles: freeze({
    lite: freeze({ heroLod: 2, activeCells: 5, maxParticles: 32, maxDynamicLights: 2 }),
    balanced: freeze({ heroLod: 1, activeCells: 9, maxParticles: 72, maxDynamicLights: 4 }),
    cinematic: freeze({ heroLod: 0, activeCells: 13, maxParticles: 128, maxDynamicLights: 6 })
  }),
  oneCanonicalScene: true,
  ownsEngine: false,
  ownsScene: false,
  ownsRenderLoop: false,
  automaticCertification: false,
  automaticActivation: false,
  privateContentStored: false
});

const exactIds = (rows, ids) => Array.isArray(rows)
  && ids.every((id) => rows.some((row) => row?.id === id));

export function selectEonExpanseW792AStormSectorLod(quality = 'balanced') {
  const profile = EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.qualityProfiles[String(quality)]
    || EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.qualityProfiles.balanced;
  return freeze(EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets.map((entry) => freeze({
    id: entry.id,
    ...entry.lods.find((candidate) => candidate.level === profile.heroLod)
  })));
}

export function validateEonExpanseW792AStormSectorPackage(candidate = EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE) {
  const errors = [];
  if (candidate?.schema !== EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_SCHEMA) errors.push('schema-invalid');
  if (candidate?.regionId !== 'storm-sector' || candidate?.gatewayId !== 'future-gateway-storm-sector') errors.push('region-authority-invalid');
  if (!/^[a-f0-9]{64}$/i.test(String(candidate?.packageDigest || ''))) errors.push('package-digest-invalid');
  if (!exactIds(candidate?.heroAssets, ['storm-command-spire', 'atmospheric-stabilizer', 'charged-transit-gate'])) errors.push('hero-assets-incomplete');
  if (!exactIds(candidate?.architectureKits, ['storm-relay-kit', 'industrial-platform-kit', 'charged-transit-kit'])) errors.push('architecture-kits-incomplete');
  if (!exactIds(candidate?.environmentFamilies, ['electrical-storms', 'rain-sheets', 'charged-fog', 'signal-pylons'])) errors.push('environment-families-incomplete');
  if (!exactIds(candidate?.audioFamilies, ['storm-distance', 'relay-hum', 'charged-wind'])) errors.push('audio-families-incomplete');
  if (!exactIds(candidate?.missionFamilies, ['weather-restoration', 'relay-repair', 'storm-rescue'])) errors.push('mission-families-incomplete');
  for (const entry of candidate?.heroAssets || []) {
    if (entry?.developmentProxy !== false || entry?.authoredComposite !== true || entry?.lods?.length !== 3) errors.push(`hero-policy:${entry?.id || 'missing'}`);
    for (const level of entry?.lods || []) {
      if (![0, 1, 2].includes(level?.level)
        || !isMaintainedStormSectorAssetUrl(level?.url, { allowImmutableBinary: true })
        || !/^[a-f0-9]{64}$/i.test(String(level?.sha256 || ''))
        || !(Number(level?.bytes) > 0)) errors.push(`hero-lod:${entry?.id || 'missing'}:${level?.level}`);
    }
  }
  for (const entry of candidate?.audioFamilies || []) {
    if (entry?.explicitStartRequired !== true
      || !isMaintainedStormSectorAssetUrl(entry?.url)
      || !/^[a-f0-9]{64}$/i.test(String(entry?.sha256 || ''))) errors.push(`audio-policy:${entry?.id || 'missing'}`);
  }
  if (!candidate?.oneCanonicalScene || candidate?.ownsEngine || candidate?.ownsScene || candidate?.ownsRenderLoop) errors.push('runtime-authority-invalid');
  if (candidate?.automaticCertification || candidate?.automaticActivation || candidate?.privateContentStored) errors.push('safety-boundary-invalid');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    regionId: candidate?.regionId || '',
    gatewayId: candidate?.gatewayId || '',
    packageDigest: errors.length === 0 ? String(candidate.packageDigest).toLowerCase() : '',
    authoredHeroCount: candidate?.heroAssets?.length || 0,
    localAudioCount: candidate?.audioFamilies?.length || 0,
    certificationState: 'candidate-visible-validation-required',
    activatesGateway: false,
    rendersRegion: false,
    privateContentStored: false
  });
}

export default freeze({
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_SCHEMA,
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE,
  selectEonExpanseW792AStormSectorLod,
  validateEonExpanseW792AStormSectorPackage
});

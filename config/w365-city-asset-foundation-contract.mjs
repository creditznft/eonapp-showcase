export const W365_CITY_ASSET_FOUNDATION_CONTRACT = Object.freeze({
  id: 'W365',
  title: 'EON City Asset Foundation',
  scope: Object.freeze([
    'source-controlled asset catalog',
    'original/commissioned/properly-licensed provenance ledger requirements',
    'quality-tier budgets and local fallbacks',
    'engine-neutral Babylon and Three.js lifecycle adapters',
    'GLB/GLTF loader adapter contracts and disposal rules'
  ]),
  nonGoals: Object.freeze([
    'shipping binary GLB, GLTF, image, texture, audio, or third-party assets',
    'remote CDN or marketplace asset loading',
    'AI image or mesh generation at runtime',
    'user upload, avatar import, marketplace, reward, wallet, or commerce activation',
    'claiming final visual quality before art review and physical-device proof'
  ]),
  releaseRules: Object.freeze({
    localAssetRoot: '/assets/city/',
    allowedFormats: Object.freeze(['.glb', '.gltf']),
    allowedAssetOrigins: Object.freeze([
      'EONAPP original in-house work',
      'EONAPP commissioned original work',
      'EONAPP reviewed commercial licence'
    ]),
    requireHumanArtReview: true,
    requireSha256BeforeShip: true,
    requireEvidencePathBeforeShip: true,
    prohibitRemoteNetwork: true,
    prohibitUserDataInAssets: true,
    requireFallbackForEveryEntry: true
  }),
  qualityProfiles: Object.freeze(['lite', 'balanced', 'cinematic']),
  nextWave: 'W366 — Command District authored vertical slice using approved W365 asset entries only.'
});

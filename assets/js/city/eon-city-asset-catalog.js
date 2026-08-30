/**
 * W365 — EON City original asset foundation.
 *
 * This module is deliberately a source-controlled manifest, not an asset
 * downloader. W365 ships no GLB/GLTF, texture, sound, or third-party art
 * binary. Every future asset must be added here first, with provenance,
 * license, quality tier, byte budget and a local same-origin path before the
 * runtime is allowed to load it.
 */

export const CITY_ASSET_CATALOG_SCHEMA = 'eon.city.asset-catalog.w365.v1';
export const CITY_ASSET_ROOT = '/assets/city/';
export const CITY_ASSET_ALLOWED_EXTENSIONS = Object.freeze(['.glb', '.gltf']);
export const CITY_ASSET_ALLOWED_STATUSES = Object.freeze(['planned', 'approved', 'shipped', 'retired']);
export const CITY_ASSET_ALLOWED_ORIGINS = Object.freeze([
  'EONAPP original in-house work',
  'EONAPP commissioned original work',
  'EONAPP reviewed commercial licence'
]);

export const CITY_ASSET_QUALITY_BUDGETS = Object.freeze({
  lite: Object.freeze({
    label: 'Lite',
    meshTier: 'proxy',
    maxAssets: 3,
    maxCompressedBytes: 1_500_000,
    maxTextureDimension: 512,
    maxTextureBytes: 2_000_000,
    maxTrianglesPerAsset: 4_000,
    maxMaterialsPerAsset: 2,
    maxDrawCallsForAsset: 16,
    expectedUse: 'low-memory, reduced-effects or weak-device fallback'
  }),
  balanced: Object.freeze({
    label: 'Balanced',
    meshTier: 'mid',
    maxAssets: 8,
    maxCompressedBytes: 5_000_000,
    maxTextureDimension: 1024,
    maxTextureBytes: 8_000_000,
    maxTrianglesPerAsset: 25_000,
    maxMaterialsPerAsset: 5,
    maxDrawCallsForAsset: 45,
    expectedUse: 'default mobile and desktop quality profile'
  }),
  cinematic: Object.freeze({
    label: 'Cinematic',
    meshTier: 'hero',
    maxAssets: 14,
    maxCompressedBytes: 12_000_000,
    maxTextureDimension: 2048,
    maxTextureBytes: 24_000_000,
    maxTrianglesPerAsset: 70_000,
    maxMaterialsPerAsset: 8,
    maxDrawCallsForAsset: 90,
    expectedUse: 'opt-in capable desktop profile after device gating'
  })
});

function freezeLods(lods = null) {
  if (!lods || typeof lods !== 'object') return null;
  return Object.freeze(Object.fromEntries(Object.entries(lods).map(([quality, value]) => [quality, Object.freeze({ ...value })])));
}

function freezeAsset(entry) {
  return Object.freeze({
    ...entry,
    qualityTiers: Object.freeze({ ...entry.qualityTiers }),
    lods: freezeLods(entry.lods),
    fallback: Object.freeze({ ...entry.fallback }),
    provenance: Object.freeze({ ...entry.provenance }),
    constraints: Object.freeze({ ...entry.constraints })
  });
}

const planned = ({ id, family, role, fallbackId, qualityTiers, maxBytes, maxTriangles, maxTextureDimension, maxMaterials, maxDrawCalls, tags = [] }) => freezeAsset({
  id,
  family,
  role,
  status: 'planned',
  sourcePath: null,
  sha256: null,
  tags: Object.freeze([...tags]),
  targetPlatforms: Object.freeze(['babylon-immersive-work-mode', 'three-spatial-command-space']),
  qualityTiers,
  fallback: {
    id: fallbackId,
    mode: 'procedural-source-controlled',
    userData: false,
    remoteNetwork: false
  },
  provenance: {
    origin: 'EONAPP original in-house work',
    licence: 'EONAPP controlled original work',
    evidencePath: null,
    humanReviewRequired: true,
    derivativeOfThirdParty: false
  },
  constraints: {
    maxCompressedBytes: maxBytes,
    maxTriangles,
    maxTextureDimension,
    maxMaterials,
    maxDrawCalls,
    skinned: family === 'character' || family === 'companion',
    staticOnly: !(family === 'character' || family === 'companion'),
    allowExternalNetwork: false,
    containsUserData: false
  }
});


const shippedOriginalRig = ({ id, family, role, fallbackId, qualityTiers, maxBytes, maxTriangles, maxTextureDimension, maxMaterials, maxDrawCalls, tags = [], lods, evidencePath, releaseState }) => {
  const balanced = lods?.balanced;
  return freezeAsset({
    id,
    family,
    role,
    status: 'shipped',
    sourcePath: balanced?.sourcePath || null,
    sha256: balanced?.sha256 || null,
    tags: Object.freeze([...tags]),
    targetPlatforms: Object.freeze(['babylon-immersive-work-mode', 'three-spatial-command-space']),
    qualityTiers,
    lods,
    releaseState: releaseState || 'source-shipped-owner-visual-approval-pending',
    fallback: {
      id: fallbackId,
      mode: 'procedural-source-controlled',
      userData: false,
      remoteNetwork: false
    },
    provenance: {
      origin: 'EONAPP original in-house work',
      licence: 'EONAPP controlled original work',
      evidencePath,
      humanReviewRequired: true,
      derivativeOfThirdParty: false,
      reviewState: 'engineering-verified-owner-visual-approval-pending'
    },
    constraints: {
      maxCompressedBytes: maxBytes,
      maxTriangles,
      maxTextureDimension,
      maxMaterials,
      maxDrawCalls,
      skinned: false,
      articulatedNodeRig: family === 'character' || family === 'companion',
      staticOnly: !(family === 'character' || family === 'companion'),
      allowExternalNetwork: false,
      containsUserData: false
    }
  });
};

/**
 * Planned entries make the upcoming art handoff explicit without pretending
 * that placeholders are final characters or that binary art has been shipped.
 */
export const CITY_ASSET_CATALOG = Object.freeze([
  shippedOriginalRig({
    id: 'operator-hero', family: 'character', role: 'primary operator avatar', fallbackId: 'procedural-operator',
    qualityTiers: { lite: 'operator-proxy-rig', balanced: 'operator-mid-rig', cinematic: 'operator-hero-rig' },
    maxBytes: 3_500_000, maxTriangles: 28_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 38,
    tags: ['avatar', 'hero', 'command-district', 'original-rig', 'animated'],
    evidencePath: 'docs/city-art/W602_ORIGINAL_RIG_ASSET_PROVENANCE.md',
    lods: {
      lite: { sourcePath: '/assets/city/models/eon-navigator-lod2.glb', sha256: '0f4427218199a46de42b4e62079d5cbcc26aa85281bbe061410126d2fd18582c', animationCount: 12, meshCount: 16, nodeCount: 25 },
      balanced: { sourcePath: '/assets/city/models/eon-navigator-lod1.glb', sha256: '259b04017e5fa87a2a47eec813a68e0d44727256b2272f60a41f69addd203b1e', animationCount: 12, meshCount: 16, nodeCount: 25 },
      cinematic: { sourcePath: '/assets/city/models/eon-navigator-lod0.glb', sha256: 'ac7e8c3f3a62eaeddba8d1ec50c3e5493ebddf415169300326728264b5ca0f88', animationCount: 12, meshCount: 16, nodeCount: 25 }
    }
  }),
  shippedOriginalRig({
    id: 'eonbot-companion', family: 'companion', role: 'EONBOT visual companion shell', fallbackId: 'procedural-eonbot',
    qualityTiers: { lite: 'eonbot-lite-rig', balanced: 'eonbot-standard-rig', cinematic: 'eonbot-hero-rig' },
    maxBytes: 1_500_000, maxTriangles: 12_000, maxTextureDimension: 1024, maxMaterials: 4, maxDrawCalls: 22,
    tags: ['assistant', 'companion', 'truthful-presence', 'original-rig', 'animated'],
    evidencePath: 'docs/city-art/W602_ORIGINAL_RIG_ASSET_PROVENANCE.md',
    lods: {
      lite: { sourcePath: '/assets/city/models/eonbot-companion-lod2.glb', sha256: 'ce6a49d10cb013f0aea52370d1ec2053580565b43cc47649ca28a1891b928c64', animationCount: 14, meshCount: 10, nodeCount: 18 },
      balanced: { sourcePath: '/assets/city/models/eonbot-companion-lod1.glb', sha256: 'f3e1e973b484552a98fa112fc4d480b58bfb8b794f8cbac16484576a0d0cb556', animationCount: 14, meshCount: 10, nodeCount: 18 },
      cinematic: { sourcePath: '/assets/city/models/eonbot-companion-lod0.glb', sha256: '90d70cec515845920f0177aef1f7578bbaec70ad39908cf92a3e56cd4491cc35', animationCount: 14, meshCount: 10, nodeCount: 18 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-arrival-gate', family: 'architecture', role: 'Command Horizon Arrival Gate original environment kit', fallbackId: 'procedural-arrival-gate',
    qualityTiers: { lite: 'arrival-gate-proxy', balanced: 'arrival-gate-mid', cinematic: 'arrival-gate-hero' },
    maxBytes: 1_200_000, maxTriangles: 18_000, maxTextureDimension: 512, maxMaterials: 5, maxDrawCalls: 32,
    tags: ['architecture', 'arrival', 'command-horizon', 'original-glb', 'textureless-pbr'],
    evidencePath: 'docs/city-art/W603_COMMAND_HORIZON_ART_ASSET_PROVENANCE.md',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod2.glb', sha256: 'e65650d3cc34ce11687741b53917c0c634eec3034b0246d2b11e861065d8c7d0', animationCount: 0, meshCount: 9, nodeCount: 15 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod1.glb', sha256: 'f5214572b5d806c6d3d6f1b60f3fdb77782915e834d1660af37364a02fa49b27', animationCount: 0, meshCount: 9, nodeCount: 16 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod0.glb', sha256: '361b3ae93f974f0a09c24b707a11f80ca02b92e0dfe71535d30788a60264101e', animationCount: 0, meshCount: 9, nodeCount: 17 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-command-deck', family: 'architecture', role: 'Command Horizon Command Deck original environment kit', fallbackId: 'procedural-command-centre',
    qualityTiers: { lite: 'command-deck-proxy', balanced: 'command-deck-mid', cinematic: 'command-deck-hero' },
    maxBytes: 1_300_000, maxTriangles: 20_000, maxTextureDimension: 512, maxMaterials: 6, maxDrawCalls: 38,
    tags: ['architecture', 'command-deck', 'command-horizon', 'original-glb', 'textureless-pbr'],
    evidencePath: 'docs/city-art/W603_COMMAND_HORIZON_ART_ASSET_PROVENANCE.md',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod2.glb', sha256: '0e071d4447949822c869cf97f8dad4b301dd6e117d9ab9bd09fc1ae4f8186b3b', animationCount: 0, meshCount: 10, nodeCount: 17 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod1.glb', sha256: 'aabdade088eb54fe4a0701ecce7aa5df36bde2c8e383de474a58eece888e3bb4', animationCount: 0, meshCount: 10, nodeCount: 21 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod0.glb', sha256: '9737dc4ddf6fce8430756f700c118b404c0e29f753e96f0ab22cbc3b64c1e3d5', animationCount: 0, meshCount: 10, nodeCount: 23 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-wayfinding', family: 'prop', role: 'Command Horizon neon wayfinding original environment kit', fallbackId: 'procedural-district-signals',
    qualityTiers: { lite: 'wayfinding-proxy', balanced: 'wayfinding-mid', cinematic: 'wayfinding-hero' },
    maxBytes: 900_000, maxTriangles: 12_000, maxTextureDimension: 512, maxMaterials: 4, maxDrawCalls: 24,
    tags: ['wayfinding', 'signage', 'command-horizon', 'original-glb', 'textureless-pbr'],
    evidencePath: 'docs/city-art/W603_COMMAND_HORIZON_ART_ASSET_PROVENANCE.md',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod2.glb', sha256: '9a503a10afd4662b2c5f0829ebe818af923b6a01dd818f658c4ae8f06739cd93', animationCount: 0, meshCount: 6, nodeCount: 10 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod1.glb', sha256: '2fe189b896747c8fe42707b948a16be9b08f3570d6a3757829ed4cf92cc8c904', animationCount: 0, meshCount: 6, nodeCount: 11 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod0.glb', sha256: '27f669911a3d3947a70616f5327e8ac2fdbba477c3a2b4317c2e2802edb9cdcb', animationCount: 0, meshCount: 6, nodeCount: 12 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-arrival-gate-textured', family: 'architecture', role: 'Command Horizon Arrival Gate original embedded-PNG PBR environment kit', fallbackId: 'command-horizon-arrival-gate',
    qualityTiers: { lite: 'arrival-gate-textured-lite', balanced: 'arrival-gate-textured-balanced', cinematic: 'arrival-gate-textured-cinematic' },
    maxBytes: 1_300_000, maxTriangles: 18_000, maxTextureDimension: 128, maxMaterials: 5, maxDrawCalls: 32,
    tags: ['architecture', 'arrival', 'command-horizon', 'original-glb', 'source-generated-png-pbr', 'ktx2-basis-pending'],
    evidencePath: 'docs/city-art/W604_COMMAND_HORIZON_TEXTURE_ASSET_PROVENANCE.md',
    releaseState: 'source-shipped-ktx2-pending-owner-visual-approval-pending',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod2-textured.glb', sha256: 'c47049bd6c5cf74de63bf1929cf17fe805e5ac4ec79a17d71725269b41c15dbc', animationCount: 0, meshCount: 9, nodeCount: 15 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod1-textured.glb', sha256: 'ce28dd25ff364be3db14ef11359d1fe373e7fa27964441aa1cd3b12ac296cbc9', animationCount: 0, meshCount: 9, nodeCount: 16 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-arrival-gate-lod0-textured.glb', sha256: '933923d55bf8385b0fb1cec02eff0e94b3702c53c4ac11bb97c9d0a9ee5a6078', animationCount: 0, meshCount: 9, nodeCount: 17 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-command-deck-textured', family: 'architecture', role: 'Command Horizon Command Deck original embedded-PNG PBR environment kit', fallbackId: 'command-horizon-command-deck',
    qualityTiers: { lite: 'command-deck-textured-lite', balanced: 'command-deck-textured-balanced', cinematic: 'command-deck-textured-cinematic' },
    maxBytes: 1_400_000, maxTriangles: 20_000, maxTextureDimension: 128, maxMaterials: 6, maxDrawCalls: 38,
    tags: ['architecture', 'command-deck', 'command-horizon', 'original-glb', 'source-generated-png-pbr', 'ktx2-basis-pending'],
    evidencePath: 'docs/city-art/W604_COMMAND_HORIZON_TEXTURE_ASSET_PROVENANCE.md',
    releaseState: 'source-shipped-ktx2-pending-owner-visual-approval-pending',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod2-textured.glb', sha256: 'fb9b5619b234ad5bcff596573f67c825a239a3ec84c7af28d36702b70c978977', animationCount: 0, meshCount: 10, nodeCount: 17 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod1-textured.glb', sha256: '1a30064a786cdda90a39871c49c642cdfeed61e05439ac93c9b288dc151888f9', animationCount: 0, meshCount: 10, nodeCount: 21 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-command-deck-lod0-textured.glb', sha256: 'fa0257f66b082d680f9eb05626359d67a2ecaa39c383415da06f483111171c21', animationCount: 0, meshCount: 10, nodeCount: 23 }
    }
  }),
  shippedOriginalRig({
    id: 'command-horizon-wayfinding-textured', family: 'prop', role: 'Command Horizon neon wayfinding original embedded-PNG PBR environment kit', fallbackId: 'command-horizon-wayfinding',
    qualityTiers: { lite: 'wayfinding-textured-lite', balanced: 'wayfinding-textured-balanced', cinematic: 'wayfinding-textured-cinematic' },
    maxBytes: 1_000_000, maxTriangles: 12_000, maxTextureDimension: 128, maxMaterials: 4, maxDrawCalls: 24,
    tags: ['wayfinding', 'signage', 'command-horizon', 'original-glb', 'source-generated-png-pbr', 'ktx2-basis-pending'],
    evidencePath: 'docs/city-art/W604_COMMAND_HORIZON_TEXTURE_ASSET_PROVENANCE.md',
    releaseState: 'source-shipped-ktx2-pending-owner-visual-approval-pending',
    lods: {
      lite: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod2-textured.glb', sha256: '9685624eacedb2279ec53d8245c5be5a12cbc7fa33e18316ee602599398089ca', animationCount: 0, meshCount: 6, nodeCount: 10 },
      balanced: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod1-textured.glb', sha256: '87d340f83c6e784ca0a6fd689dcda49829196d6af889eddf1e3e7bf97366b59e', animationCount: 0, meshCount: 6, nodeCount: 11 },
      cinematic: { sourcePath: '/assets/city/models/command-horizon-wayfinding-lod0-textured.glb', sha256: '133778699d533ac9e1a516c8cd6161f2ecbe9c024f299bef249214045246441a', animationCount: 0, meshCount: 6, nodeCount: 12 }
    }
  }),
  planned({
    id: 'builder-guide', family: 'character', role: 'Builder Workroom guide', fallbackId: 'procedural-builder-guide',
    qualityTiers: { lite: 'guide-proxy', balanced: 'guide-mid', cinematic: 'guide-hero' },
    maxBytes: 2_700_000, maxTriangles: 20_000, maxTextureDimension: 1024, maxMaterials: 4, maxDrawCalls: 32,
    tags: ['npc', 'builder', 'workroom']
  }),
  planned({
    id: 'archivist-guide', family: 'character', role: 'Research and archive guide', fallbackId: 'procedural-archivist-guide',
    qualityTiers: { lite: 'guide-proxy', balanced: 'guide-mid', cinematic: 'guide-hero' },
    maxBytes: 2_700_000, maxTriangles: 20_000, maxTextureDimension: 1024, maxMaterials: 4, maxDrawCalls: 32,
    tags: ['npc', 'research', 'workroom']
  }),
  planned({
    id: 'reviewer-guide', family: 'character', role: 'Review and approval guide', fallbackId: 'procedural-reviewer-guide',
    qualityTiers: { lite: 'guide-proxy', balanced: 'guide-mid', cinematic: 'guide-hero' },
    maxBytes: 2_700_000, maxTriangles: 20_000, maxTextureDimension: 1024, maxMaterials: 4, maxDrawCalls: 32,
    tags: ['npc', 'review', 'approval']
  }),
  planned({
    id: 'realm-keeper-guide', family: 'character', role: 'My Realm guide', fallbackId: 'procedural-realm-keeper-guide',
    qualityTiers: { lite: 'guide-proxy', balanced: 'guide-mid', cinematic: 'guide-hero' },
    maxBytes: 2_700_000, maxTriangles: 20_000, maxTextureDimension: 1024, maxMaterials: 4, maxDrawCalls: 32,
    tags: ['npc', 'realm', 'identity']
  }),
  planned({
    id: 'command-centre-exterior', family: 'architecture', role: 'Neon Command District landmark exterior', fallbackId: 'procedural-command-centre',
    qualityTiers: { lite: 'landmark-proxy', balanced: 'landmark-mid', cinematic: 'landmark-hero' },
    maxBytes: 4_000_000, maxTriangles: 34_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 44,
    tags: ['architecture', 'command-centre', 'landmark']
  }),
  planned({
    id: 'command-room-interior', family: 'architecture', role: 'Spatial Command Space interior kit', fallbackId: 'procedural-command-room',
    qualityTiers: { lite: 'interior-proxy', balanced: 'interior-mid', cinematic: 'interior-hero' },
    maxBytes: 5_000_000, maxTriangles: 45_000, maxTextureDimension: 1024, maxMaterials: 6, maxDrawCalls: 56,
    tags: ['architecture', 'interior', 'threejs', 'babylon']
  }),
  planned({
    id: 'street-furniture-kit', family: 'prop', role: 'Street lamps, benches, rails and kiosks', fallbackId: 'procedural-street-furniture',
    qualityTiers: { lite: 'prop-proxy', balanced: 'prop-mid', cinematic: 'prop-hero' },
    maxBytes: 2_200_000, maxTriangles: 15_000, maxTextureDimension: 512, maxMaterials: 3, maxDrawCalls: 24,
    tags: ['prop', 'street', 'instanced']
  }),
  planned({
    id: 'command-terminal-kit', family: 'prop', role: 'Safe status-only work terminals', fallbackId: 'procedural-command-terminal',
    qualityTiers: { lite: 'terminal-proxy', balanced: 'terminal-mid', cinematic: 'terminal-hero' },
    maxBytes: 1_800_000, maxTriangles: 10_000, maxTextureDimension: 512, maxMaterials: 3, maxDrawCalls: 18,
    tags: ['prop', 'terminal', 'safe-status-only']
  }),
  planned({
    id: 'delivery-drone-kit', family: 'prop', role: 'Ambient non-interactive delivery drone', fallbackId: 'procedural-delivery-drone',
    qualityTiers: { lite: 'drone-proxy', balanced: 'drone-mid', cinematic: 'drone-hero' },
    maxBytes: 1_400_000, maxTriangles: 8_000, maxTextureDimension: 512, maxMaterials: 3, maxDrawCalls: 15,
    tags: ['prop', 'ambient', 'no-task-claim']
  }),
  planned({
    id: 'crowd-variation-kit', family: 'character', role: 'Ambient citizen variants', fallbackId: 'procedural-crowd-silhouette',
    qualityTiers: { lite: 'crowd-silhouette', balanced: 'crowd-mid', cinematic: 'crowd-readable' },
    maxBytes: 3_000_000, maxTriangles: 22_000, maxTextureDimension: 512, maxMaterials: 3, maxDrawCalls: 28,
    tags: ['npc', 'ambient', 'instanced', 'not-agent-status']
  }),
  planned({
    id: 'arrival-gate-exterior', family: 'architecture', role: 'Arrival Gate and calm entry-plaza landmark', fallbackId: 'procedural-arrival-gate',
    qualityTiers: { lite: 'arrival-proxy', balanced: 'arrival-mid', cinematic: 'arrival-hero' },
    maxBytes: 4_800_000, maxTriangles: 38_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 48,
    tags: ['architecture', 'arrival', 'orientation-hall', 'first-frame']
  }),
  planned({
    id: 'creator-atrium-exterior', family: 'architecture', role: 'Creator Atrium authored district exterior', fallbackId: 'procedural-creator-atrium',
    qualityTiers: { lite: 'atrium-proxy', balanced: 'atrium-mid', cinematic: 'atrium-hero' },
    maxBytes: 4_600_000, maxTriangles: 36_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 48,
    tags: ['architecture', 'creator', 'preview-gallery', 'share-pack']
  }),
  planned({
    id: 'forge-bay-exterior', family: 'architecture', role: 'Forge Bay authored district exterior', fallbackId: 'procedural-forge-bay',
    qualityTiers: { lite: 'forge-proxy', balanced: 'forge-mid', cinematic: 'forge-hero' },
    maxBytes: 4_600_000, maxTriangles: 36_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 48,
    tags: ['architecture', 'forge', 'workshop', 'build-preview']
  }),
  planned({
    id: 'signal-tower-exterior', family: 'architecture', role: 'Signal Tower authored focal landmark', fallbackId: 'procedural-signal-tower',
    qualityTiers: { lite: 'tower-proxy', balanced: 'tower-mid', cinematic: 'tower-hero' },
    maxBytes: 4_300_000, maxTriangles: 34_000, maxTextureDimension: 1024, maxMaterials: 5, maxDrawCalls: 44,
    tags: ['architecture', 'signal', 'relay', 'planning-only']
  }),
  planned({
    id: 'skyline-module-kit', family: 'architecture', role: 'Distant skyline and weather silhouette modules', fallbackId: 'procedural-skyline',
    qualityTiers: { lite: 'skyline-silhouette', balanced: 'skyline-mid', cinematic: 'skyline-layered' },
    maxBytes: 2_400_000, maxTriangles: 16_000, maxTextureDimension: 512, maxMaterials: 3, maxDrawCalls: 22,
    tags: ['architecture', 'skyline', 'distant', 'instanced', 'first-frame']
  })
]);

function isSafeAssetPath(value) {
  if (typeof value !== 'string' || !value.startsWith(CITY_ASSET_ROOT)) return false;
  if (/[:?#\\]/.test(value) || value.includes('..')) return false;
  return CITY_ASSET_ALLOWED_EXTENSIONS.some((extension) => value.endsWith(extension));
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

export function normalizeCityAssetQuality(value = 'balanced') {
  return Object.prototype.hasOwnProperty.call(CITY_ASSET_QUALITY_BUDGETS, value) ? value : 'balanced';
}

export function getCityAssetBudget(quality = 'balanced') {
  return CITY_ASSET_QUALITY_BUDGETS[normalizeCityAssetQuality(quality)];
}

export function getCityAssetById(id) {
  return CITY_ASSET_CATALOG.find((entry) => entry.id === id) || null;
}

export function getCityAssetVariant(entry, quality = 'balanced') {
  const normalizedQuality = normalizeCityAssetQuality(quality);
  const variant = entry?.lods?.[normalizedQuality] || null;
  if (variant && isSafeAssetPath(variant.sourcePath) && isSha256(variant.sha256)) {
    return Object.freeze({ quality: normalizedQuality, sourcePath: variant.sourcePath, sha256: variant.sha256, ...variant });
  }
  if (isSafeAssetPath(entry?.sourcePath) && isSha256(entry?.sha256)) {
    return Object.freeze({ quality: normalizedQuality, sourcePath: entry.sourcePath, sha256: entry.sha256 });
  }
  return null;
}

export function isCityAssetLoadable(entry) {
  return Boolean(
    entry
    && entry.status === 'shipped'
    && Boolean(getCityAssetVariant(entry, 'balanced'))
    && CITY_ASSET_ALLOWED_ORIGINS.includes(entry?.provenance?.origin)
    && entry?.provenance?.licence === 'EONAPP controlled original work'
    && typeof entry?.provenance?.evidencePath === 'string'
    && entry.provenance.evidencePath.startsWith('docs/')
    && entry?.provenance?.humanReviewRequired === true
    && entry?.provenance?.derivativeOfThirdParty === false
    && entry?.constraints?.allowExternalNetwork === false
    && entry?.constraints?.containsUserData === false
  );
}

export function getCityAssetFallback(entry) {
  if (!entry?.fallback?.id) return Object.freeze({ id: 'procedural-generic', mode: 'procedural-source-controlled', loadable: false });
  return Object.freeze({
    id: entry.fallback.id,
    mode: entry.fallback.mode || 'procedural-source-controlled',
    loadable: false,
    userData: false,
    remoteNetwork: false
  });
}

export function getCityAssetLoadPlan({ quality = 'balanced', families = null } = {}) {
  const normalizedQuality = normalizeCityAssetQuality(quality);
  const budget = getCityAssetBudget(normalizedQuality);
  const familySet = Array.isArray(families) && families.length ? new Set(families) : null;
  const entries = CITY_ASSET_CATALOG
    .filter((entry) => !familySet || familySet.has(entry.family))
    .slice(0, budget.maxAssets)
    .map((entry) => Object.freeze({
      id: entry.id,
      family: entry.family,
      role: entry.role,
      tier: entry.qualityTiers[normalizedQuality],
      status: entry.status,
      loadable: isCityAssetLoadable(entry),
      sourcePath: isCityAssetLoadable(entry) ? getCityAssetVariant(entry, normalizedQuality)?.sourcePath || null : null,
      sha256: isCityAssetLoadable(entry) ? getCityAssetVariant(entry, normalizedQuality)?.sha256 || null : null,
      lod: isCityAssetLoadable(entry) ? normalizedQuality : null,
      fallback: getCityAssetFallback(entry),
      constraints: Object.freeze({ ...entry.constraints })
    }));
  return Object.freeze({
    schema: CITY_ASSET_CATALOG_SCHEMA,
    quality: normalizedQuality,
    budget,
    entries: Object.freeze(entries),
    shippedCount: entries.filter((entry) => entry.loadable).length,
    plannedCount: entries.filter((entry) => entry.status === 'planned').length,
    remoteNetwork: false,
    containsUserData: false
  });
}

export function validateCityAssetCatalog(catalog = CITY_ASSET_CATALOG) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(catalog) || !catalog.length) errors.push('Catalog must contain at least one asset entry.');
  for (const entry of catalog || []) {
    if (!entry?.id || !/^[a-z0-9-]+$/.test(entry.id)) errors.push(`Invalid asset id: ${String(entry?.id || '')}.`);
    if (ids.has(entry?.id)) errors.push(`Duplicate asset id: ${entry.id}.`);
    ids.add(entry?.id);
    if (!CITY_ASSET_ALLOWED_STATUSES.includes(entry?.status)) errors.push(`${entry?.id || 'unknown'} has an unsupported status.`);
    if (!entry?.family || !entry?.role) errors.push(`${entry?.id || 'unknown'} must declare family and role.`);
    if (!entry?.fallback?.id || entry?.fallback?.remoteNetwork !== false || entry?.fallback?.userData !== false) errors.push(`${entry?.id || 'unknown'} needs a safe local fallback.`);
    if (!entry?.provenance?.origin || !CITY_ASSET_ALLOWED_ORIGINS.includes(entry.provenance.origin)) errors.push(`${entry?.id || 'unknown'} has an unsupported provenance origin.`);
    if (entry?.provenance?.licence !== 'EONAPP controlled original work') errors.push(`${entry?.id || 'unknown'} must use the controlled original licence declaration.`);
    if (entry?.provenance?.derivativeOfThirdParty !== false) errors.push(`${entry?.id || 'unknown'} cannot be a third-party derivative.`);
    if (entry?.provenance?.humanReviewRequired !== true) errors.push(`${entry?.id || 'unknown'} requires human art/provenance review.`);
    if (entry?.constraints?.allowExternalNetwork !== false || entry?.constraints?.containsUserData !== false) errors.push(`${entry?.id || 'unknown'} cannot use remote network or user data.`);
    if (!entry?.qualityTiers?.lite || !entry?.qualityTiers?.balanced || !entry?.qualityTiers?.cinematic) errors.push(`${entry?.id || 'unknown'} must have all quality tiers.`);
    if (!Array.isArray(entry?.targetPlatforms) || entry.targetPlatforms.length !== 2) errors.push(`${entry?.id || 'unknown'} must declare Babylon and Three.js targets.`);
    for (const numeric of ['maxCompressedBytes', 'maxTriangles', 'maxTextureDimension', 'maxMaterials', 'maxDrawCalls']) {
      if (!Number.isFinite(Number(entry?.constraints?.[numeric])) || Number(entry.constraints[numeric]) <= 0) errors.push(`${entry?.id || 'unknown'} has an invalid ${numeric}.`);
    }
    if (entry?.status === 'shipped' && !isCityAssetLoadable(entry)) errors.push(`${entry?.id || 'unknown'} is marked shipped but fails local asset release checks.`);
    if (entry?.lods) {
      for (const quality of ['lite', 'balanced', 'cinematic']) {
        const variant = entry.lods?.[quality];
        if (!variant || !isSafeAssetPath(variant.sourcePath) || !isSha256(variant.sha256)) errors.push(`${entry?.id || 'unknown'} has an invalid ${quality} LOD variant.`);
      }
    }
    if (entry?.status !== 'shipped' && (entry?.sourcePath || entry?.sha256 || entry?.provenance?.evidencePath)) errors.push(`${entry?.id || 'unknown'} cannot declare load data before it is shipped.`);
  }
  return Object.freeze({ schema: CITY_ASSET_CATALOG_SCHEMA, ok: errors.length === 0, errors: Object.freeze(errors), catalogCount: Array.isArray(catalog) ? catalog.length : 0 });
}

export function getCityAssetCatalogSummary() {
  const validation = validateCityAssetCatalog();
  const byFamily = CITY_ASSET_CATALOG.reduce((result, entry) => {
    result[entry.family] = Number(result[entry.family] || 0) + 1;
    return result;
  }, {});
  const byStatus = CITY_ASSET_CATALOG.reduce((result, entry) => {
    result[entry.status] = Number(result[entry.status] || 0) + 1;
    return result;
  }, {});
  return Object.freeze({
    schema: CITY_ASSET_CATALOG_SCHEMA,
    valid: validation.ok,
    catalogCount: CITY_ASSET_CATALOG.length,
    byFamily: Object.freeze(byFamily),
    byStatus: Object.freeze(byStatus),
    allAssetsSourceControlled: true,
    shippedBinaryCount: CITY_ASSET_CATALOG.filter(isCityAssetLoadable).length,
    remoteNetwork: false,
    containsUserData: false
  });
}

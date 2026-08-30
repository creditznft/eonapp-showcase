/**
 * W426 — authored City asset design kit.
 *
 * This is a production brief for the next original NPC and architecture pass.
 * It is not a binary asset loader and does not claim that final GLB/GLTF art
 * has shipped. The Babylon scene continues to use local procedural fallback
 * meshes until provenance, performance, accessibility and real-device proof
 * are accepted through the City asset release preflight.
 */

export const EON_CITY_ASSET_DESIGN_KIT_SCHEMA = 'eon.city.asset-design-kit.w426.v1';

const freeze = (value) => Object.freeze(value);
const list = (values = []) => freeze([...values]);

function brief(entry) {
  return freeze({
    ...entry,
    silhouette: freeze({ ...entry.silhouette }),
    materials: list(entry.materials),
    readableFeatures: list(entry.readableFeatures),
    animationLoops: list(entry.animationLoops),
    lod: freeze({ ...entry.lod }),
    provenance: freeze({
      originalOnly: true,
      remoteNetwork: false,
      finalBinaryArt: false,
      humanArtReviewRequired: true,
      realDeviceReviewRequired: true,
      ...entry.provenance
    })
  });
}

/**
 * Professionally authored character targets. Every brief is intentionally
 * role-based, not an account, user, provider or fake-agent representation.
 */
export const EON_CITY_NPC_ASSET_BRIEFS = freeze([
  brief({
    id: 'operator-avatar',
    family: 'player-avatar',
    role: 'private local operator avatar',
    district: 'arrival-command',
    silhouette: { shape: 'tailored field jacket with compact tool harness', stance: 'grounded, confident, non-military' },
    materials: ['matte graphite fabric', 'smoked glass visor', 'subtle cyan seam light'],
    readableFeatures: ['clear face plane', 'warm eye light', 'hands visible at interaction range'],
    animationLoops: ['breathing idle', 'look-around idle', 'walk', 'turn-in-place'],
    lod: { lite: 'silhouette with emissive trim', balanced: 'readable head and hands', cinematic: 'hero facial rig and garment micro-motion' }
  }),
  brief({
    id: 'eonbot-companion',
    family: 'companion',
    role: 'local EONBOT guide shell',
    district: 'all',
    silhouette: { shape: 'halo-orb with three offset fins', stance: 'floating companion, never a human impersonation' },
    materials: ['glass core', 'violet halo', 'cyan status pulse'],
    readableFeatures: ['distinct central eye-light', 'visible listening ring', 'calm status colour shifts'],
    animationLoops: ['hover', 'halo rotation', 'soft attention tilt', 'approved status pulse'],
    lod: { lite: 'single orb and ring', balanced: 'orb, fins and light', cinematic: 'layered glass shell and particle halo' }
  }),
  brief({
    id: 'forge-guide',
    family: 'district-npc',
    role: 'Forge station guide',
    district: 'forge-bay',
    silhouette: { shape: 'architectural work coat with rectangular utility pack', stance: 'open, approachable, focused' },
    materials: ['graphite weave', 'amber tool accents', 'ceramic hard-surface details'],
    readableFeatures: ['face silhouette', 'one readable expression state', 'visible tool glyph'],
    animationLoops: ['workbench glance', 'idle weight shift', 'short path walk', 'approval-ready gesture'],
    lod: { lite: 'simple silhouette and pack', balanced: 'readable face and accessories', cinematic: 'hero outfit layers and expression blend shapes' }
  }),
  brief({
    id: 'insight-guide',
    family: 'district-npc',
    role: 'Insight and Library guide',
    district: 'archive-observatory',
    silhouette: { shape: 'long archive coat with circular data slate', stance: 'calm, curious, non-authoritative' },
    materials: ['midnight textile', 'muted violet trim', 'frosted data slate'],
    readableFeatures: ['soft eye-line', 'readable slate gesture', 'clear profile shape'],
    animationLoops: ['reading slate', 'idle turn', 'short path walk', 'point-to-wayfinding gesture'],
    lod: { lite: 'coat silhouette and slate', balanced: 'head, hands and slate', cinematic: 'fabric layers and expressive eye direction' }
  }),
  brief({
    id: 'review-guide',
    family: 'district-npc',
    role: 'approval and safety guide',
    district: 'command-centre',
    silhouette: { shape: 'structured mantle with small review beacon', stance: 'observant, reassuring, never surveillance-like' },
    materials: ['dark technical cloth', 'mint confirmation accent', 'brushed ceramic beacon'],
    readableFeatures: ['calm face silhouette', 'visible review beacon', 'non-threatening posture'],
    animationLoops: ['review beacon pulse', 'idle posture', 'short path walk', 'review-ready hand cue'],
    lod: { lite: 'mantle silhouette and beacon', balanced: 'readable head and beacon', cinematic: 'layered mantle and subtle facial animation' }
  }),
  brief({
    id: 'city-ambient-citizen',
    family: 'ambient-npc',
    role: 'non-interactive City ambience',
    district: 'metropolis',
    silhouette: { shape: 'three neutral civilian silhouettes with different outerwear', stance: 'ambient only, no work claim' },
    materials: ['muted graphite', 'one low-intensity accent per variant', 'opaque cloth finish'],
    readableFeatures: ['clear silhouette at mid distance', 'no impersonation of an account or AI agent'],
    animationLoops: ['slow walk loop', 'pause and look', 'conversation posture without chat content'],
    lod: { lite: 'billboard-inspired silhouette', balanced: 'low-poly body and head', cinematic: 'instanced readable variant set' }
  })
]);

/**
 * Architecture targets use repeatable construction kits so a future project
 * district can feel authored without generating uncontrolled geometry.
 */
export const EON_CITY_BUILDING_ASSET_BRIEFS = freeze([
  brief({
    id: 'command-centre-kit',
    family: 'architecture',
    role: 'central Command District landmark and workstation façade',
    district: 'command-centre',
    silhouette: { shape: 'stepped monolith, luminous vertical core, calm bridge', stance: 'central but not oversized' },
    materials: ['carbon composite', 'rain-slick glass', 'violet energy spine', 'cyan route inlays'],
    readableFeatures: ['large entry portal', 'one iconic core', 'clear workstation wings'],
    animationLoops: ['slow window-grid shimmer', 'core pulse', 'route-light travel'],
    lod: { lite: 'single landmark mass', balanced: 'separate core and bridge', cinematic: 'modular façade, decals and interior silhouettes' }
  }),
  brief({
    id: 'forge-bay-kit',
    family: 'architecture',
    role: 'website, app and code making district',
    district: 'forge-bay',
    silhouette: { shape: 'wide workshop hangar with framed build portal', stance: 'practical, premium, welcoming' },
    materials: ['brushed graphite', 'warm amber signal glass', 'tool-rack ceramics'],
    readableFeatures: ['build portal', 'clear workshop volume', 'one amber source light'],
    animationLoops: ['panel light sweep', 'slow workbench indicator', 'portal threshold pulse'],
    lod: { lite: 'single hangar mass', balanced: 'portal and roof kit', cinematic: 'interior workbench silhouettes and dynamic decals' }
  }),
  brief({
    id: 'creator-atrium-kit',
    family: 'architecture',
    role: 'visual, video and campaign creation district',
    district: 'creator-atrium',
    silhouette: { shape: 'glass atrium with suspended gallery ribbon', stance: 'light, elegant, social without social feed pressure' },
    materials: ['frosted glass', 'cyan ribbon light', 'soft ceramic supports'],
    readableFeatures: ['gallery ribbon', 'clearly separated entry', 'calm public-facing façade'],
    animationLoops: ['ribbon drift', 'gallery light fade', 'soft volumetric window shimmer'],
    lod: { lite: 'atrium volume and emblem', balanced: 'ribbon and layered glass', cinematic: 'interior silhouettes and dynamic vector panels' }
  }),
  brief({
    id: 'project-district-kit',
    family: 'architecture',
    role: 'future project-linked private district shell',
    district: 'project-instance',
    silhouette: { shape: 'three interchangeable modules around a central project beacon', stance: 'bounded expansion, never an endless generated city' },
    materials: ['project-neutral carbon base', 'user-selected local visual accent', 'opaque privacy panes'],
    readableFeatures: ['one project beacon', 'clear station entrances', 'no private text shown on façade'],
    animationLoops: ['beacon breathe', 'route-light travel', 'accent panels drift'],
    lod: { lite: 'one station pod', balanced: 'three station modules', cinematic: 'modular skyline cluster with controlled decals' }
  })
]);

export function getCityAssetDesignBrief(id = '') {
  const key = String(id || '').trim();
  return EON_CITY_NPC_ASSET_BRIEFS.find((entry) => entry.id === key)
    || EON_CITY_BUILDING_ASSET_BRIEFS.find((entry) => entry.id === key)
    || null;
}

export function getCityAssetDesignKitSummary() {
  return freeze({
    schema: EON_CITY_ASSET_DESIGN_KIT_SCHEMA,
    npcBriefCount: EON_CITY_NPC_ASSET_BRIEFS.length,
    buildingBriefCount: EON_CITY_BUILDING_ASSET_BRIEFS.length,
    finalBinaryArt: false,
    remoteAssets: false,
    accountOrAgentRepresentation: false,
    humanArtReviewRequired: true,
    realDeviceReviewRequired: true
  });
}

export function getCityAssetDesignTruth() {
  return freeze({
    schema: EON_CITY_ASSET_DESIGN_KIT_SCHEMA,
    sourceControlledDesignBriefs: true,
    finalArtShipped: false,
    assetDownload: false,
    remoteNetwork: false,
    userData: false,
    privatePromptDisplay: false,
    liveAgentClaim: false,
    reward: false,
    wallet: false,
    payment: false,
    subscriptionEntitlement: false
  });
}

export function validateCityAssetDesignKit() {
  const errors = [];
  const entries = [...EON_CITY_NPC_ASSET_BRIEFS, ...EON_CITY_BUILDING_ASSET_BRIEFS];
  const seen = new Set();
  for (const entry of entries) {
    if (!/^[a-z0-9-]{3,64}$/.test(entry.id)) errors.push(`Invalid asset brief id: ${entry.id}`);
    if (seen.has(entry.id)) errors.push(`Duplicate asset brief id: ${entry.id}`);
    seen.add(entry.id);
    if (!entry.silhouette?.shape || !entry.silhouette?.stance) errors.push(`Asset brief silhouette is incomplete: ${entry.id}`);
    if (!entry.materials?.length || !entry.animationLoops?.length) errors.push(`Asset brief art direction is incomplete: ${entry.id}`);
    if (entry.provenance?.originalOnly !== true || entry.provenance?.finalBinaryArt !== false || entry.provenance?.remoteNetwork !== false) errors.push(`Asset brief boundary is incomplete: ${entry.id}`);
  }
  return freeze({ schema: EON_CITY_ASSET_DESIGN_KIT_SCHEMA, ok: errors.length === 0, errors: list(errors) });
}

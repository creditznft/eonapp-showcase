/**
 * W651 — premium GLB / procedural EON Noir visual bridge.
 *
 * Imported materials remain authored by the approved GLB. The bridge only
 * applies renderer-safety and scene-fit settings that the classic procedural
 * shell needs: bounded light participation, non-blocking visual meshes,
 * cinematic shadow receiving, and at most the explicitly approved shadow
 * owner. Route interactions and collisions continue to use dedicated local
 * proxies rather than high-poly visual geometry.
 */
export const EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA = 'eon.city.w649.visual-integration.v1';
const freeze = (value) => Object.freeze(value);

const LIGHT_BUDGET = freeze({ lite: 2, balanced: 4, cinematic: 6 });

function normalizeQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LIGHT_BUDGET, quality) ? quality : 'balanced';
}

function findShadowGenerator(scene) {
  for (const light of scene?.lights || []) {
    try {
      const generator = light?.getShadowGenerator?.();
      if (generator?.addShadowCaster) return generator;
    } catch {}
  }
  return null;
}

function hasRenderableGeometry(mesh) {
  try { return Number(mesh?.getTotalVertices?.() || 0) > 0; }
  catch { return false; }
}

function safeMetadata(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function integrateEonCityW649Container({
  scene,
  container,
  quality = 'balanced',
  assetId = 'w649-asset',
  role = 'district-visual',
  allowShadowCaster = false
} = {}) {
  const resolvedQuality = normalizeQuality(quality);
  const lightBudget = LIGHT_BUDGET[resolvedQuality];
  const meshes = [...(container?.meshes || [])].filter(Boolean);
  const materials = [...new Set([...(container?.materials || []), ...meshes.map((mesh) => mesh?.material).filter(Boolean)])];
  const shadowGenerator = resolvedQuality === 'cinematic' ? findShadowGenerator(scene) : null;
  const shadowCasters = [];
  let renderableMeshCount = 0;
  let skinnedMeshCount = 0;

  for (const mesh of meshes) {
    const renderable = hasRenderableGeometry(mesh);
    if (renderable) renderableMeshCount += 1;
    if (mesh?.skeleton) skinnedMeshCount += 1;
    // Premium visuals must not steal pointer hits from the maintained landmark
    // proxies or become expensive triangle-mesh collision owners.
    if ('isPickable' in mesh) mesh.isPickable = false;
    if ('checkCollisions' in mesh) mesh.checkCollisions = false;
    if ('receiveShadows' in mesh) mesh.receiveShadows = resolvedQuality === 'cinematic' && renderable;
    try {
      mesh.metadata = {
        ...safeMetadata(mesh.metadata),
        eonCityW649Visual: true,
        eonCityW649AssetId: String(assetId || 'w649-asset'),
        eonCityW649Role: String(role || 'district-visual'),
        eonCityShadowCasterEligible: Boolean(allowShadowCaster && renderable)
      };
    } catch {}
    if (allowShadowCaster && renderable && shadowGenerator) {
      try {
        shadowGenerator.addShadowCaster(mesh, false);
        shadowCasters.push(mesh);
      } catch {}
    }
  }

  for (const material of materials) {
    // Do not replace textures, colours, metallic/roughness, alpha, emissive, or
    // sidedness. Only cap simultaneous lights to the selected device profile.
    if ('maxSimultaneousLights' in material) {
      try { material.maxSimultaneousLights = lightBudget; } catch {}
    }
  }

  let disposed = false;
  const summary = () => freeze({
    schema: EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA,
    assetId: String(assetId || 'w649-asset'),
    role: String(role || 'district-visual'),
    quality: resolvedQuality,
    authoredMaterialsPreserved: true,
    materialCount: materials.length,
    meshCount: meshes.length,
    renderableMeshCount,
    skinnedMeshCount,
    maxSimultaneousLights: lightBudget,
    visualMeshesPickable: false,
    visualMeshCollisions: false,
    receivesCinematicShadows: resolvedQuality === 'cinematic',
    shadowCasterAllowed: Boolean(allowShadowCaster),
    registeredShadowCasterCount: shadowCasters.length,
    dedicatedInteractionProxiesRequired: true,
    disposed
  });

  return freeze({
    schema: EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA,
    getSummary: summary,
    dispose() {
      if (disposed) return summary();
      for (const mesh of shadowCasters) {
        try { shadowGenerator?.removeShadowCaster?.(mesh); } catch {}
      }
      disposed = true;
      return summary();
    }
  });
}

export function getEonCityW649VisualIntegrationPolicy() {
  return freeze({
    schema: EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA,
    artDirection: 'EON Noir procedural shell + authored premium GLB materials',
    toneMapping: 'ACES inherited from City renderer',
    fogAndGlow: 'inherited from City renderer',
    materialReplacementAllowed: false,
    highPolyVisualCollisionAllowed: false,
    highPolyPointerOwnershipAllowed: false,
    cinematicDynamicShadowOwners: 1,
    lightBudget: LIGHT_BUDGET,
    geometricLodCertificationPending: true,
    headedVisualApprovalRequired: true
  });
}

export default freeze({
  EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA,
  integrateEonCityW649Container,
  getEonCityW649VisualIntegrationPolicy
});

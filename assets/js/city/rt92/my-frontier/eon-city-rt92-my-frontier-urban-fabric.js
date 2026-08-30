import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS } from '../../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { buildEonCityRt91MyFrontierContinuity } from '../../rt91/my-frontier/eon-city-rt91-my-frontier-roads-plazas-transit.js';

export const EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA = 'eon.city.my-frontier.urban-fabric.rt92.v1';
const freeze = Object.freeze;
const QUALITY = freeze({
  lite: freeze({ furniture: 4, skyline: 2, accents: 3 }),
  balanced: freeze({ furniture: 7, skyline: 4, accents: 5 }),
  cinematic: freeze({ furniture: 10, skyline: 6, accents: 7 })
});
const DISTRICT_STYLE = freeze({
  central: freeze({ signature: 'monumental-civic-axis', primary: '#2cbcff', secondary: '#ffbc62', structure: '#25313d', skyline: 'civic' }),
  creator: freeze({ signature: 'expressive-prismatic-media', primary: '#9d72ff', secondary: '#ff77d6', structure: '#302842', skyline: 'prism' }),
  knowledge: freeze({ signature: 'archive-observatory-data-canopy', primary: '#58e6b2', secondary: '#7ccaff', structure: '#233a39', skyline: 'archive' }),
  systems: freeze({ signature: 'pristine-industrial-service-grid', primary: '#25b6ff', secondary: '#ffbc62', structure: '#29343d', skyline: 'utility' }),
  signal: freeze({ signature: 'vertical-relay-spire-field', primary: '#4bc8ff', secondary: '#a58aff', structure: '#222d3c', skyline: 'spire' }),
  transit: freeze({ signature: 'linear-departure-motion-axis', primary: '#62e6c5', secondary: '#ffbc62', structure: '#29343a', skyline: 'terminal' }),
  personal: freeze({ signature: 'calm-garden-reflection-quarter', primary: '#79e3c0', secondary: '#a78cff', structure: '#253634', skyline: 'garden' })
});

function qualityName(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return Object.hasOwn(QUALITY, id) ? id : 'balanced';
}
function color(hex, fallback = '#25b6ff') { try { return Color3.FromHexString(String(hex || fallback)); } catch { return Color3.FromHexString(fallback); } }
function makeMaterial(scene, name, diffuse, emissive = diffuse, intensity = 0.08, alpha = 1) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color(diffuse).scale(0.34);
  m.emissiveColor = color(emissive).scale(intensity);
  m.specularColor = color('#10141a');
  m.alpha = alpha;
  m.backFaceCulling = alpha >= 1;
  return m;
}
function routePose(from = {}, to = {}, offset = 0) {
  const dx = Number(to.x || 0) - Number(from.x || 0);
  const dz = Number(to.z || 0) - Number(from.z || 0);
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const nx = -dz / length;
  const nz = dx / length;
  return freeze({ x: (from.x + to.x) / 2 + nx * offset, z: (from.z + to.z) / 2 + nz * offset, length, rotationY: Math.atan2(dx, dz), nx, nz });
}
function plotByDistrict(id) { return EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.find((plot) => plot.district === id) || null; }

export function buildEonCityRt92MyFrontierUrbanFabricPlan({ quality = 'balanced' } = {}) {
  const resolved = qualityName(quality);
  const budget = QUALITY[resolved];
  const continuity = buildEonCityRt91MyFrontierContinuity();
  const districts = EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.map((plot) => freeze({
    districtId: plot.district,
    plotId: plot.id,
    anchor: plot.position,
    roadAnchor: plot.roadAnchor,
    style: DISTRICT_STYLE[plot.district],
    furnitureCount: budget.furniture,
    skylineFamilyCount: budget.skyline,
    accentCount: budget.accents,
    publicFabricOnly: true
  }));
  return freeze({
    schema: EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA,
    worldId: 'my-frontier',
    quality: resolved,
    districts: freeze(districts),
    continuity,
    roadSystem: freeze({ radialRoutes: 6, ringRoutes: 6, sidewalkPairs: 12, districtPlazas: 7, routeCircuitLanes: 12 }),
    streetFamilies: freeze(['wayfinding-pylon', 'public-lamp', 'utility-cabinet', 'bench', 'planter-pod', 'eonbot-service-point']),
    skylineFamilies: freeze(['civic-step', 'needle', 'split-crown', 'archive-rib', 'utility-stack', 'signal-spire', 'terminal-slab']),
    districtSignatures: DISTRICT_STYLE,
    evolution: freeze({ publicBaseAlwaysVisible: true, additionalSkylineRespondsToDistrictLevel: true, maxLevel: 4, presentationOnly: true }),
    performance: freeze({
      proceduralGeometryOnly: true,
      firstFrameHubBinaryDelta: 0,
      newBinaryBytes: 0,
      districtStreamingAware: true,
      hiddenWorldSuspended: true,
      ownsEngine: false,
      ownsScene: false,
      ownsRenderLoop: false,
      ownsNavigation: false,
      ownsCollision: false,
      remoteTextures: false
    })
  });
}

export function validateEonCityRt92MyFrontierUrbanFabricPlan(plan = buildEonCityRt92MyFrontierUrbanFabricPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA || plan?.worldId !== 'my-frontier') errors.push('schema-world');
  if (plan?.districts?.length !== 7 || new Set(plan.districts.map((entry) => entry.districtId)).size !== 7) errors.push('district-count');
  for (const district of plan?.districts || []) if (!district.style?.signature || district.furnitureCount < 4 || district.skylineFamilyCount < 2 || district.accentCount < 3 || district.publicFabricOnly !== true) errors.push(`district:${district?.districtId || 'missing'}`);
  if (plan?.continuity?.routeCount !== 12 || plan?.continuity?.plazaCount !== 7) errors.push('continuity');
  if (plan?.roadSystem?.radialRoutes !== 6 || plan?.roadSystem?.ringRoutes !== 6 || plan?.roadSystem?.districtPlazas !== 7) errors.push('roads');
  if ((plan?.streetFamilies?.length || 0) < 6 || (plan?.skylineFamilies?.length || 0) < 7) errors.push('families');
  const perf = plan?.performance || {};
  if (!perf.proceduralGeometryOnly || perf.firstFrameHubBinaryDelta !== 0 || perf.newBinaryBytes !== 0 || !perf.districtStreamingAware || !perf.hiddenWorldSuspended) errors.push('performance');
  if (perf.ownsEngine || perf.ownsScene || perf.ownsRenderLoop || perf.ownsNavigation || perf.ownsCollision || perf.remoteTextures) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export function mountEonCityRt92MyFrontierUrbanFabric({ scene, parent = null, quality = 'balanced', reducedMotion = false } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'canonical-scene-and-parent-required' });
  const plan = buildEonCityRt92MyFrontierUrbanFabricPlan({ quality });
  const validation = validateEonCityRt92MyFrontierUrbanFabricPlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: 'rt92-my-frontier-urban-fabric-plan-invalid', validation });

  const root = new TransformNode('rt92-my-frontier-urban-fabric-root', scene);
  root.parent = parent;
  root.setEnabled(false);
  root.metadata = freeze({ kind: 'rt92-my-frontier-public-urban-fabric', canonicalScene: true, userBuilding: false, interactive: false });

  const materials = freeze({
    road: makeMaterial(scene, 'rt92-frontier-road', '#111923', '#1c3142', 0.035),
    sidewalk: makeMaterial(scene, 'rt92-frontier-sidewalk', '#202a32', '#2a424c', 0.04),
    route: makeMaterial(scene, 'rt92-frontier-route', '#16425a', '#25b6ff', 0.42),
    structure: makeMaterial(scene, 'rt92-frontier-structure', '#27313a', '#344855', 0.045),
    glass: makeMaterial(scene, 'rt92-frontier-glass', '#163240', '#2f6d7f', 0.12, 0.62),
    warm: makeMaterial(scene, 'rt92-frontier-warm', '#57452f', '#ffbc62', 0.34),
    garden: makeMaterial(scene, 'rt92-frontier-garden', '#24473e', '#79e3c0', 0.18),
    water: makeMaterial(scene, 'rt92-frontier-water', '#102c38', '#3c93ac', 0.12, 0.72)
  });
  const districtMaterials = new Map();
  for (const [districtId, style] of Object.entries(DISTRICT_STYLE)) {
    districtMaterials.set(districtId, freeze({
      accent: makeMaterial(scene, `rt92-frontier-${districtId}-accent`, style.structure, style.primary, 0.30),
      secondary: makeMaterial(scene, `rt92-frontier-${districtId}-secondary`, style.structure, style.secondary, 0.22),
      shell: makeMaterial(scene, `rt92-frontier-${districtId}-shell`, style.structure, style.primary, 0.045)
    }));
  }

  const staticNodes = [];
  const animated = [];
  const districtRoots = new Map();
  const levelNodes = new Map();
  const districtLevels = new Map();
  let active = false;
  let disposed = false;
  let focus = null;

  const add = (mesh, mat, x, y, z, rotationY = 0, options = {}) => {
    mesh.parent = options.parent || root;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({ kind: 'rt92-my-frontier-public-art', family: options.family || 'urban-fabric', districtId: options.districtId || '', publicFabricOnly: true, userBuilding: false, interactive: false, minimumDistrictLevel: Number(options.minimumLevel || 0) });
    if (options.animate) animated.push(freeze({ mesh, kind: options.animate, phase: animated.length * 0.73, baseY: y, baseRotationY: rotationY })); else staticNodes.push(mesh);
    if (options.districtId && Number(options.minimumLevel || 0) > 0) {
      const rows = levelNodes.get(options.districtId) || [];
      rows.push(freeze({ mesh, minimumLevel: Number(options.minimumLevel || 0) }));
      levelNodes.set(options.districtId, rows);
    }
    return mesh;
  };

  for (const district of plan.districts) {
    const districtRoot = new TransformNode(`rt92-frontier-district-${district.districtId}-root`, scene);
    districtRoot.parent = root;
    districtRoot.metadata = freeze({ kind: 'rt92-my-frontier-district-public-root', districtId: district.districtId, signature: district.style.signature });
    districtRoots.set(district.districtId, districtRoot);
    districtLevels.set(district.districtId, district.districtId === 'central' ? 1 : 0);
  }

  // Complete city circulation: six existing radial links plus a second visual
  // public ring. All RT92 additions are collision/navigation-neutral.
  const routes = [...plan.continuity.radialRoutes, ...plan.continuity.ringRoutes];
  routes.forEach((route, routeIndex) => {
    const pose = routePose(route.from, route.to, 0);
    add(MeshBuilder.CreateBox(`rt92-frontier-road-${route.id}`, { width: route.width, height: 0.10, depth: pose.length }, scene), materials.road, pose.x, 0.11, pose.z, pose.rotationY, { family: route.kind });
    for (const side of [-1, 1]) {
      const sidePose = routePose(route.from, route.to, side * (route.width / 2 + 0.6));
      add(MeshBuilder.CreateBox(`rt92-frontier-sidewalk-${route.id}-${side > 0 ? 'r' : 'l'}`, { width: 0.78, height: 0.12, depth: pose.length * 0.98 }, scene), materials.sidewalk, sidePose.x, 0.16, sidePose.z, pose.rotationY, { family: 'sidewalk' });
      const tracePose = routePose(route.from, route.to, side * (route.width / 2 + 0.18));
      add(MeshBuilder.CreateBox(`rt92-frontier-route-trace-${route.id}-${side > 0 ? 'r' : 'l'}`, { width: 0.055, height: 0.025, depth: pose.length * 0.94 }, scene), materials.route, tracePose.x, 0.235, tracePose.z, pose.rotationY, { family: 'route-trace', animate: routeIndex % 3 === 0 && side > 0 ? 'route-pulse' : '' });
    }
  });

  // Seven civic plazas establish district identity before any user building is
  // constructed; they remain public environment, never land/build authority.
  for (const plaza of plan.continuity.plazas) {
    const districtId = plaza.districtId;
    const styleMats = districtMaterials.get(districtId);
    const districtRoot = districtRoots.get(districtId);
    const disc = add(MeshBuilder.CreateCylinder(`rt92-frontier-plaza-${districtId}`, { diameter: plaza.radius * 2, height: 0.14, tessellation: plan.quality === 'lite' ? 36 : 56 }, scene), materials.sidewalk, plaza.center.x, 0.15, plaza.center.z, 0, { parent: districtRoot, family: 'district-plaza', districtId });
    const halo = add(MeshBuilder.CreateTorus(`rt92-frontier-plaza-halo-${districtId}`, { diameter: plaza.radius * 1.65, thickness: 0.065, tessellation: 48 }, scene), styleMats.accent, plaza.center.x, 0.255, plaza.center.z, 0, { parent: districtRoot, family: 'district-plaza-halo', districtId, animate: districtId === 'signal' ? 'slow-ring' : '' });
    halo.rotation.x = Math.PI / 2;
    // A four-way seam prevents the large plaza disc from reading as an empty pad.
    for (let i = 0; i < 4; i += 1) {
      const seam = add(MeshBuilder.CreateBox(`rt92-frontier-plaza-seam-${districtId}-${i}`, { width: 0.055, height: 0.025, depth: plaza.radius * 1.45 }, scene), i % 2 ? styleMats.secondary : styleMats.accent, plaza.center.x, 0.24, plaza.center.z, i * Math.PI / 2, { parent: districtRoot, family: 'plaza-seam', districtId });
      seam.rotation.y += Math.PI / 4;
    }
    if (districtId === 'personal') {
      const pool = add(MeshBuilder.CreateCylinder('rt92-frontier-personal-reflection-pool', { diameter: plaza.radius * 0.72, height: 0.045, tessellation: 48 }, scene), materials.water, plaza.center.x + 1.6, 0.25, plaza.center.z - 1.1, 0, { parent: districtRoot, family: 'reflection-water', districtId });
      pool.scaling.z = 0.62;
    }
    void disc;
  }

  const createFurniture = (district) => {
    const plot = plotByDistrict(district.districtId);
    const mats = districtMaterials.get(district.districtId);
    const parentNode = districtRoots.get(district.districtId);
    const anchor = plot.roadAnchor;
    const count = district.furnitureCount;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + 0.27;
      const r = district.districtId === 'central' ? 8.7 + (i % 2) * 1.7 : 6.3 + (i % 3) * 1.2;
      const x = anchor.x + Math.cos(a) * r;
      const z = anchor.z + Math.sin(a) * r;
      const family = plan.streetFamilies[i % plan.streetFamilies.length];
      if (family === 'public-lamp' || family === 'wayfinding-pylon') {
        const h = family === 'public-lamp' ? 2.7 : 2.15;
        add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-${family}-${i}`, { diameterTop: 0.07, diameterBottom: 0.19, height: h, tessellation: 10 }, scene), materials.structure, x, h / 2, z, -a, { parent: parentNode, family, districtId: district.districtId });
        const cap = add(MeshBuilder.CreateTorus(`rt92-frontier-${district.districtId}-${family}-cap-${i}`, { diameter: family === 'public-lamp' ? 0.58 : 0.78, thickness: 0.045, tessellation: 20 }, scene), family === 'public-lamp' ? materials.warm : mats.accent, x, h * 0.86, z, 0, { parent: parentNode, family, districtId: district.districtId, animate: family === 'wayfinding-pylon' && district.districtId === 'signal' ? 'slow-ring' : '' });
        cap.rotation.x = Math.PI / 2;
      } else if (family === 'bench') {
        add(MeshBuilder.CreateBox(`rt92-frontier-${district.districtId}-bench-${i}`, { width: 1.55, height: 0.18, depth: 0.48 }, scene), materials.structure, x, 0.48, z, -a + Math.PI / 2, { parent: parentNode, family, districtId: district.districtId });
      } else if (family === 'planter-pod') {
        const pod = add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-planter-${i}`, { diameter: 1.05, height: 0.34, tessellation: 16 }, scene), district.districtId === 'personal' ? materials.garden : materials.structure, x, 0.25, z, 0, { parent: parentNode, family, districtId: district.districtId });
        if (district.districtId === 'personal' || district.districtId === 'knowledge') add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-plant-light-${i}`, { diameterTop: 0.08, diameterBottom: 0.32, height: 1.25, tessellation: 9 }, scene), materials.garden, x, 0.87, z, a, { parent: parentNode, family: 'biolight-plant', districtId: district.districtId, animate: 'gentle-bob' });
        void pod;
      } else if (family === 'utility-cabinet') {
        add(MeshBuilder.CreateBox(`rt92-frontier-${district.districtId}-utility-${i}`, { width: 0.72, height: 1.05, depth: 0.55 }, scene), district.districtId === 'systems' ? mats.secondary : materials.structure, x, 0.53, z, -a, { parent: parentNode, family, districtId: district.districtId });
      } else {
        const base = add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-eonbot-service-${i}`, { diameter: 0.86, height: 0.22, tessellation: 20 }, scene), mats.accent, x, 0.18, z, 0, { parent: parentNode, family, districtId: district.districtId });
        base.scaling.z = 0.7;
      }
    }
  };

  const createDistrictAccents = (district) => {
    const plot = plotByDistrict(district.districtId);
    const mats = districtMaterials.get(district.districtId);
    const parentNode = districtRoots.get(district.districtId);
    const anchor = plot.position;
    for (let i = 0; i < district.accentCount; i += 1) {
      const a = (i / district.accentCount) * Math.PI * 2 + 0.52;
      const radius = 11.4 + (i % 2) * 1.8;
      const x = anchor.x + Math.cos(a) * radius;
      const z = anchor.z + Math.sin(a) * radius;
      if (district.districtId === 'central') {
        add(MeshBuilder.CreateBox(`rt92-frontier-central-civic-pylon-${i}`, { width: 0.42, height: 3.8 + (i % 2) * 0.8, depth: 0.72 }, scene), i % 2 ? mats.secondary : mats.accent, x, 2.0, z, -a, { parent: parentNode, family: 'civic-pylon', districtId: district.districtId });
      } else if (district.districtId === 'creator') {
        const prism = add(MeshBuilder.CreateCylinder(`rt92-frontier-creator-prism-${i}`, { diameter: 1.25, height: 3.0 + (i % 3) * 0.5, tessellation: 3 }, scene), i % 2 ? mats.secondary : mats.accent, x, 1.55, z, a, { parent: parentNode, family: 'kinetic-prism', districtId: district.districtId, animate: i % 2 === 0 ? 'kinetic' : '' });
        prism.rotation.z = (i % 2 ? -1 : 1) * 0.10;
      } else if (district.districtId === 'knowledge') {
        const rib = add(MeshBuilder.CreateTorus(`rt92-frontier-knowledge-archive-rib-${i}`, { diameter: 3.2 + (i % 2) * 0.8, thickness: 0.10, tessellation: 40, arc: 0.56 }, scene), i % 2 ? mats.secondary : mats.accent, x, 2.0, z, a, { parent: parentNode, family: 'archive-rib', districtId: district.districtId });
        rib.rotation.x = Math.PI / 2;
        rib.rotation.z = Math.PI / 2;
      } else if (district.districtId === 'systems') {
        add(MeshBuilder.CreateBox(`rt92-frontier-systems-service-gantry-${i}`, { width: 3.8, height: 0.24, depth: 0.42 }, scene), i % 2 ? mats.secondary : materials.structure, x, 2.8 + (i % 2) * 0.6, z, -a, { parent: parentNode, family: 'service-gantry', districtId: district.districtId });
        for (const side of [-1, 1]) add(MeshBuilder.CreateBox(`rt92-frontier-systems-gantry-leg-${i}-${side}`, { width: 0.25, height: 3.1, depth: 0.3 }, scene), materials.structure, x + Math.cos(a + Math.PI / 2) * side * 1.65, 1.55, z + Math.sin(a + Math.PI / 2) * side * 1.65, -a, { parent: parentNode, family: 'service-gantry', districtId: district.districtId });
      } else if (district.districtId === 'signal') {
        const h = 4.2 + (i % 3) * 0.9;
        add(MeshBuilder.CreateCylinder(`rt92-frontier-signal-spire-${i}`, { diameterTop: 0.06, diameterBottom: 0.34, height: h, tessellation: 10 }, scene), materials.structure, x, h / 2, z, 0, { parent: parentNode, family: 'relay-spire', districtId: district.districtId });
        const ring = add(MeshBuilder.CreateTorus(`rt92-frontier-signal-spire-ring-${i}`, { diameter: 1.05, thickness: 0.05, tessellation: 24 }, scene), mats.accent, x, h * 0.72, z, 0, { parent: parentNode, family: 'relay-spire', districtId: district.districtId, animate: 'slow-ring' });
        ring.rotation.x = Math.PI / 2;
      } else if (district.districtId === 'transit') {
        add(MeshBuilder.CreateBox(`rt92-frontier-transit-direction-frame-${i}`, { width: 3.1, height: 2.4, depth: 0.28 }, scene), i % 2 ? mats.secondary : mats.accent, x, 1.2, z, -a, { parent: parentNode, family: 'departure-frame', districtId: district.districtId });
        add(MeshBuilder.CreateBox(`rt92-frontier-transit-direction-cut-${i}`, { width: 2.5, height: 1.85, depth: 0.32 }, scene), materials.road, x, 1.2, z, -a, { parent: parentNode, family: 'departure-frame-inset', districtId: district.districtId });
      } else {
        const canopy = add(MeshBuilder.CreateCylinder(`rt92-frontier-personal-canopy-${i}`, { diameter: 3.1, height: 0.18, tessellation: 6 }, scene), i % 2 ? materials.garden : mats.accent, x, 2.0 + (i % 2) * 0.35, z, a, { parent: parentNode, family: 'garden-canopy', districtId: district.districtId });
        canopy.scaling.z = 0.65;
        add(MeshBuilder.CreateCylinder(`rt92-frontier-personal-canopy-stem-${i}`, { diameter: 0.16, height: 2.0, tessellation: 10 }, scene), materials.structure, x, 1.0, z, a, { parent: parentNode, family: 'garden-canopy', districtId: district.districtId });
      }
    }
  };

  const createSkyline = (district) => {
    const plot = plotByDistrict(district.districtId);
    const mats = districtMaterials.get(district.districtId);
    const parentNode = districtRoots.get(district.districtId);
    const centerLen = Math.max(0.001, Math.hypot(plot.position.x, plot.position.z));
    const outwardX = district.districtId === 'central' ? 0 : plot.position.x / centerLen;
    const outwardZ = district.districtId === 'central' ? -1 : plot.position.z / centerLen;
    for (let i = 0; i < district.skylineFamilyCount; i += 1) {
      const spread = (i - (district.skylineFamilyCount - 1) / 2) * 3.1;
      const sideX = -outwardZ;
      const sideZ = outwardX;
      const r = district.districtId === 'central' ? 16 + (i % 2) * 2.5 : 10.5 + (i % 2) * 2.2;
      const x = plot.position.x + outwardX * r + sideX * spread;
      const z = plot.position.z + outwardZ * r + sideZ * spread;
      const h = 4.2 + (i % 4) * 1.4 + (district.districtId === 'signal' ? 1.8 : 0);
      const minLevel = i === 0 ? 0 : i < Math.ceil(district.skylineFamilyCount / 2) ? 1 : 2;
      if (district.districtId === 'signal') {
        add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-skyline-${i}`, { diameterTop: 0.35, diameterBottom: 1.7, height: h, tessellation: 6 }, scene), i % 2 ? mats.shell : mats.accent, x, h / 2, z, 0, { parent: parentNode, family: 'skyline-signal-spire', districtId: district.districtId, minimumLevel: minLevel });
      } else if (district.districtId === 'knowledge') {
        const tower = add(MeshBuilder.CreateBox(`rt92-frontier-${district.districtId}-skyline-${i}`, { width: 2.1 + (i % 2) * 0.7, height: h, depth: 1.6 }, scene), mats.shell, x, h / 2, z, 0.12 * (i % 3 - 1), { parent: parentNode, family: 'skyline-archive-rib', districtId: district.districtId, minimumLevel: minLevel });
        const crown = add(MeshBuilder.CreateTorus(`rt92-frontier-${district.districtId}-skyline-crown-${i}`, { diameter: 2.4, thickness: 0.08, tessellation: 28, arc: 0.62 }, scene), mats.accent, x, h * 0.78, z, tower.rotation.y, { parent: parentNode, family: 'skyline-archive-crown', districtId: district.districtId, minimumLevel: minLevel });
        crown.rotation.x = Math.PI / 2;
      } else if (district.districtId === 'creator') {
        const tower = add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-skyline-${i}`, { diameter: 2.4 + (i % 2) * 0.5, height: h, tessellation: i % 2 ? 5 : 4 }, scene), i % 2 ? mats.secondary : mats.shell, x, h / 2, z, i * 0.21, { parent: parentNode, family: 'skyline-prism', districtId: district.districtId, minimumLevel: minLevel });
        tower.rotation.z = (i % 2 ? -1 : 1) * 0.035;
      } else if (district.districtId === 'transit') {
        add(MeshBuilder.CreateBox(`rt92-frontier-${district.districtId}-skyline-${i}`, { width: 3.8 + (i % 2), height: h * 0.72, depth: 1.35 }, scene), mats.shell, x, h * 0.36, z, 0.06 * (i % 3 - 1), { parent: parentNode, family: 'skyline-terminal-slab', districtId: district.districtId, minimumLevel: minLevel });
      } else if (district.districtId === 'personal') {
        const tower = add(MeshBuilder.CreateCylinder(`rt92-frontier-${district.districtId}-skyline-${i}`, { diameter: 2.7 + (i % 2) * 0.7, height: h * 0.58, tessellation: 6 }, scene), i % 2 ? materials.garden : mats.shell, x, h * 0.29, z, 0, { parent: parentNode, family: 'skyline-garden-pavilion', districtId: district.districtId, minimumLevel: minLevel });
        tower.scaling.z = 0.72;
      } else {
        const width = district.districtId === 'central' ? 2.6 + (i % 2) * 1.0 : 2.0 + (i % 2) * 0.7;
        add(MeshBuilder.CreateBox(`rt92-frontier-${district.districtId}-skyline-${i}`, { width, height: h, depth: 1.5 + (i % 3) * 0.4 }, scene), i % 3 === 0 ? mats.accent : mats.shell, x, h / 2, z, 0.09 * (i % 3 - 1), { parent: parentNode, family: district.districtId === 'systems' ? 'skyline-utility-stack' : 'skyline-civic-step', districtId: district.districtId, minimumLevel: minLevel });
      }
    }
  };

  for (const district of plan.districts) {
    createFurniture(district);
    createDistrictAccents(district);
    createSkyline(district);
  }

  for (const node of staticNodes) try { node.freezeWorldMatrix?.(); } catch {}

  const applyLevelVisibility = () => {
    for (const [districtId, rows] of levelNodes) {
      const level = Number(districtLevels.get(districtId) || 0);
      for (const row of rows) row.mesh.setEnabled(active && level >= row.minimumLevel);
    }
  };

  const applyState = ({ myFrontierState = {}, upgradeProjection = {} } = {}) => {
    const choices = myFrontierState?.buildingChoices || {};
    const upgrades = new Map((upgradeProjection?.plots || []).map((entry) => [String(entry.plotId || ''), Number(entry.level || 0)]));
    for (const plot of EON_EXPANSE_W768A_MY_FRONTIER_PLOTS) {
      const built = Boolean(plot.requiredBuildingId || choices?.[plot.id]);
      const level = Math.max(built ? 1 : 0, Math.min(2, upgrades.get(plot.id) || 0));
      districtLevels.set(plot.district, level);
    }
    applyLevelVisibility();
    return freeze({ ok: true, districtLevels: freeze(Object.fromEntries(districtLevels)), writesProgression: false });
  };

  const setStreamingFocus = (nextFocus = null) => {
    focus = nextFocus?.valid === true ? freeze({ ...nextFocus }) : null;
    for (const [districtId, districtRoot] of districtRoots) {
      if (!active) { districtRoot.setEnabled(false); continue; }
      const plot = plotByDistrict(districtId);
      const distance = focus ? Math.hypot(plot.position.x - focus.x, plot.position.z - focus.z) : 0;
      // Public base never disappears in an active world; far districts simply
      // suppress the optional level>0 skyline dressing via their child flags.
      districtRoot.setEnabled(true);
      const level = Number(districtLevels.get(districtId) || 0);
      for (const row of levelNodes.get(districtId) || []) {
        const withinDistant = !focus || distance <= Number(focus.distantRadius || 42) + 10;
        row.mesh.setEnabled(active && withinDistant && level >= row.minimumLevel);
      }
    }
    return freeze({ ok: true, focusValid: Boolean(focus), districtStreamingAware: true });
  };

  return freeze({
    ok: true,
    schema: EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA,
    root,
    activate({ myFrontierState = {}, upgradeProjection = {} } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed' });
      active = true;
      root.setEnabled(true);
      applyState({ myFrontierState, upgradeProjection });
      setStreamingFocus(focus);
      return freeze({ ok: true, active: true });
    },
    deactivate() {
      active = false;
      root.setEnabled(false);
      for (const districtRoot of districtRoots.values()) districtRoot.setEnabled(false);
      return freeze({ ok: true, active: false });
    },
    applyState,
    setStreamingFocus,
    update(seconds = 0) {
      if (!active || disposed || reducedMotion) return freeze({ ok: true, animatedCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0) / 1000;
      let animatedCount = 0;
      for (const row of animated) {
        if (row.mesh.isDisposed?.() || row.mesh.isEnabled?.() === false) continue;
        if (row.kind === 'slow-ring') row.mesh.rotation.z = row.baseRotationY + t * 0.16 + row.phase * 0.03;
        else if (row.kind === 'kinetic') row.mesh.rotation.y = row.baseRotationY + Math.sin(t * 0.28 + row.phase) * 0.32;
        else if (row.kind === 'gentle-bob') row.mesh.position.y = row.baseY + Math.sin(t * 0.7 + row.phase) * 0.06;
        else if (row.kind === 'route-pulse') row.mesh.visibility = 0.70 + Math.sin(t * 1.0 + row.phase) * 0.16;
        animatedCount += 1;
      }
      return freeze({ ok: true, animatedCount, ownsRenderLoop: false });
    },
    getSummary() {
      return freeze({
        schema: EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA,
        active,
        quality: plan.quality,
        districtCount: plan.districts.length,
        radialRouteCount: plan.roadSystem.radialRoutes,
        ringRouteCount: plan.roadSystem.ringRoutes,
        plazaCount: plan.roadSystem.districtPlazas,
        streetFamilyCount: plan.streetFamilies.length,
        skylineFamilyCount: plan.skylineFamilies.length,
        staticNodeCount: staticNodes.length,
        animatedNodeCount: animated.length,
        districtLevels: freeze(Object.fromEntries(districtLevels)),
        streamingFocusValid: Boolean(focus),
        firstFrameHubBinaryDelta: 0,
        newBinaryBytes: 0,
        userBuildingCount: 0,
        ownsNavigation: false,
        ownsCollision: false,
        ownsRenderLoop: false,
        remoteTextures: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true; active = false;
      root.setEnabled(false);
      for (const rows of districtMaterials.values()) for (const m of Object.values(rows)) try { m.dispose?.(); } catch {}
      for (const m of Object.values(materials)) try { m.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({
  EON_CITY_RT92_MY_FRONTIER_URBAN_FABRIC_SCHEMA,
  buildEonCityRt92MyFrontierUrbanFabricPlan,
  validateEonCityRt92MyFrontierUrbanFabricPlan,
  mountEonCityRt92MyFrontierUrbanFabric
});

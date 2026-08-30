/**
 * W659F — functional EON City asset authority.
 *
 * These six same-origin, content-hashed GLBs are gameplay anchors, not loose
 * decoration. Their canonical transform, collision proxy, interaction class,
 * fallback and replacement relationship live together so rendering, movement
 * and product semantics cannot drift into separate coordinate systems.
 */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';

export const EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST_SCHEMA = 'eon.city.w659f.functional-assets.v1';
export const EON_CITY_W659F_RUNTIME_CACHE_VERSION = 'eon-city-w659f-content-hashed-assets-1';

const freeze = (value) => Object.freeze(value);
const variant = (path, bytes, sha256) => freeze({ path, bytes, sha256, integrity: `sha256-${sha256}` });
const action = (id, label, purpose, options = {}) => freeze({
  id,
  label,
  purpose,
  reviewRequired: true,
  explicitUserAction: true,
  autoExecute: false,
  autoNavigate: false,
  ...options
});
const collider = (value) => freeze({ source: 'w659f-canonical-functional-transform', visualMeshCollision: false, ...value });
const placement = (value) => freeze({ y: 0, ...value });
const asset = (value) => freeze({
  lifecycle: 'active',
  status: 'READY',
  localOnly: true,
  sameOrigin: true,
  privateDataVisible: false,
  remoteRequired: false,
  animationCount: 0,
  ...value,
  variants: freeze({ ...value.variants }),
  placement: placement(value.placement),
  collider: collider(value.collider),
  actions: freeze([...(value.actions || [])])
});

export const EON_CITY_W659F_FUNCTIONAL_ASSETS = freeze([
  asset({
    id: 'transit-hub-beacon-terminal',
    label: 'Transit Hub Beacon Terminal',
    sourceFile: 'Meshy_AI_EON_District_Map_Beac_0717095744_texture.glb',
    districtId: 'transit-network',
    landmarkId: 'transit-network',
    role: 'district-travel-anchor',
    loadClass: 'fixed-core',
    supersedesAssetId: 'eoncity-transit-core',
    targetHeight: 2.4,
    placement: { x: -1.72, z: 1.42, rotationY: 0.18 },
    collider: { id: 'w659f:transit-hub-beacon-base', type: 'circle', x: -1.72, z: 1.42, radius: 0.62 },
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_transit_hub_beacon_terminal.19fe9d112c53.glb', 817584, '19fe9d112c5382ffe5f9b6577108629b46dd1bf82f428351b82095ed8de90f8a'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_transit_hub_beacon_terminal.547f5d734761.glb', 487360, '547f5d734761ce89b07a35d48dfcfde9a9b3ec78b0a6807c755f5b2426b24cd0')
    },
    actions: [action('district-travel-map', 'Choose a district', 'Open the local district chooser. Travel occurs only after a separate confirmation.', { kind: 'city-panel', panel: 'travel-map' })]
  }),
  asset({
    id: 'eonbot-companion-dock',
    label: 'EONBOT Dock / Companion Station',
    sourceFile: 'Meshy_AI_EON_Holo_Projection_S_0717100548_texture.glb',
    districtId: 'creator-atrium',
    landmarkId: 'creator-atrium',
    role: 'eonbot-home-and-inspection-anchor',
    loadClass: 'district-resident',
    supersedesAssetId: 'eoncity-eonbot-charging-station',
    targetHeight: 1.46,
    placement: { x: -10.38, z: -5.22, rotationY: Math.PI / 2 },
    dockPoint: freeze({ x: -10.38, y: 0.82, z: -5.22, heading: Math.PI / 2 }),
    collider: { id: 'w659f:eonbot-dock-shell', type: 'box', x: -10.38, z: -5.22, halfWidth: 0.72, halfDepth: 0.5 },
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_eonbot_companion_dock.f533a1036208.glb', 698812, 'f533a1036208ec84251c8fa51ca6b1336b731ba8fef813db203d47cbdee166c6'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_eonbot_companion_dock.7f23aef5adfc.glb', 460044, '7f23aef5adfc1cd736dae2c772000ee3ab60e8ed763d624154919c7b72756502')
    },
    actions: [action('open-eonbot', 'Open EONBOT', 'Open the safe EONBOT panel without starting voice, reading private work, or sending a provider request.', { kind: 'city-panel', panel: 'eonbot' })]
  }),
  asset({
    id: 'agent-theatre-relay-console',
    label: 'Agent Theatre Relay Console',
    sourceFile: 'Meshy_AI_EON_Command_Operation_0717101702_texture.glb',
    districtId: 'agent-theatre',
    landmarkId: 'agent-theatre',
    role: 'truthful-agent-status-anchor',
    loadClass: 'district-resident',
    supersedesAssetId: 'eoncity-holo-interface-landmark',
    targetHeight: 2.22,
    placement: { x: 4.72, z: 1.48, rotationY: Math.PI },
    collider: { id: 'w659f:agent-theatre-console-base', type: 'box', x: 4.72, z: 1.48, halfWidth: 0.92, halfDepth: 0.7 },
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_agent_theatre_relay_console.da4372b861b5.glb', 816664, 'da4372b861b5697555d4190d0124191649afd762403261a436915a455f83f120'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_agent_theatre_relay_console.1671a0ba965b.glb', 536808, '1671a0ba965b1a4084f0e1ef12ea3d40690047312d0e5dcd4db2e7359a51db2d')
    },
    actions: [action('review-agent-theatre', 'Review Agent Theatre', 'Open the truthful local command view. It reports only observed job and agent signals.', { kind: 'city-panel', panel: 'command-room' })]
  }),
  asset({
    id: 'command-signal-totem',
    label: 'Command District Interactive Signal Totem',
    sourceFile: 'Meshy_AI_EON_District_Obelisk__0717102625_texture.glb',
    districtId: 'command-centre',
    landmarkId: 'command-centre',
    role: 'command-navigation-and-eonbot-anchor',
    loadClass: 'fixed-core',
    supersedesAssetId: null,
    targetHeight: 2.62,
    placement: { x: 2.18, z: -6.62, rotationY: -0.22 },
    collider: { id: 'w659f:command-signal-totem-base', type: 'circle', x: 2.18, z: -6.62, radius: 0.48 },
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_command_signal_totem.7287cb1afa75.glb', 798748, '7287cb1afa759a3f47e302a3507ec19809888abbdbd52d98059ec91ab6b9f6b4'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_command_signal_totem.918fb97728b4.glb', 516424, '918fb97728b4761c28e08e4a6830f19dc2429a7e373ce6dffa9e54f0eea43016')
    },
    actions: [
      action('open-command-room', 'Open Command Room', 'Review real City and work signals without executing anything.', { kind: 'city-panel', panel: 'command-room' }),
      action('open-eonbot', 'Open EONBOT', 'Open EONBOT after a visible click.', { kind: 'city-panel', panel: 'eonbot' })
    ]
  }),
  asset({
    id: 'creator-work-pod',
    label: 'Creator Work Pod / Terminal Alcove',
    sourceFile: 'Meshy_AI_EON_Personal_Command__0717105311_texture.glb',
    districtId: 'creator-atrium',
    landmarkId: 'creator-atrium',
    role: 'project-and-workspace-anchor',
    loadClass: 'district-resident',
    supersedesAssetId: 'eoncity-command-chair',
    targetHeight: 2.08,
    placement: { x: -8.35, z: -4.55, rotationY: 0 },
    collider: { id: 'w659f:creator-work-pod-shell', type: 'box', x: -8.35, z: -4.55, halfWidth: 0.96, halfDepth: 0.7 },
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_creator_work_pod.662f139f6c88.glb', 839468, '662f139f6c88c7a1c2d1932120523f3c437d658703886f3b28475d1263c7e9a0'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_creator_work_pod.6888af702cb0.glb', 525228, '6888af702cb00ff0a36afdc397ed8b2508806fa97e14a05560bcb090adb8468e')
    },
    actions: [
      action('open-projects', 'Open Projects', 'Choose a project in the native Projects surface; City does not reveal project names or bodies.', { kind: 'route', route: '/projects' }),
      action('open-workspace', 'Open Workspace', 'Continue work in the native Workspace after review.', { kind: 'route', route: '/workspace' })
    ]
  }),
  asset({
    id: 'district-arrival-gate',
    label: 'District Arrival Gate / Micro Portal',
    sourceFile: 'Meshy_AI_EON_Sanctum_Portal_Ar_0717103908_texture.glb',
    districtId: 'orientation-hall',
    landmarkId: 'orientation-hall',
    role: 'arrival-and-return-anchor',
    loadClass: 'fixed-core',
    supersedesAssetId: 'eoncity-ascension-portal',
    targetHeight: 3.28,
    placement: { x: -2.48, z: 5.92, rotationY: Math.PI / 2 },
    arrivalPoint: freeze({ x: -1.05, y: 0, z: 5.92, heading: -Math.PI / 2 }),
    collider: { id: 'w659f:arrival-gate-frame-left', type: 'box', x: -2.48, z: 5.2, halfWidth: 0.3, halfDepth: 0.42 },
    additionalColliders: freeze([
      collider({ id: 'w659f:arrival-gate-frame-right', type: 'box', x: -2.48, z: 6.64, halfWidth: 0.3, halfDepth: 0.42 })
    ]),
    variants: {
      primary: variant('/assets/city/w659f/primary/world/eoncity_district_arrival_gate.b87cbc2f9a54.glb', 711064, 'b87cbc2f9a54933669b71fc21adea3ff25c411a321a37fb3fd78d915ab3470c7'),
      fallback: variant('/assets/city/w659f/fallback/world/eoncity_district_arrival_gate.e12d6920b12f.glb', 392456, 'e12d6920b12f9a558dec562c4e1f33266ede14594b88b07bf758711aa2ed95e6')
    },
    actions: [action('district-travel-map', 'Open District Map', 'Choose and confirm a destination. The portal opening itself never auto-travels.', { kind: 'city-panel', panel: 'travel-map' })]
  })
]);

const byId = new Map(EON_CITY_W659F_FUNCTIONAL_ASSETS.map((entry) => [entry.id, entry]));
export const EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS = freeze(new Set(EON_CITY_W659F_FUNCTIONAL_ASSETS.map((entry) => entry.supersedesAssetId).filter(Boolean)));
export const EON_CITY_W659F_FIXED_CORE_ASSET_IDS = freeze(EON_CITY_W659F_FUNCTIONAL_ASSETS.filter((entry) => entry.loadClass === 'fixed-core').map((entry) => entry.id));

export const EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST = freeze({
  schema: EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST_SCHEMA,
  version: '659.6.0',
  cacheVersion: EON_CITY_W659F_RUNTIME_CACHE_VERSION,
  entries: EON_CITY_W659F_FUNCTIONAL_ASSETS,
  loadPolicy: freeze({
    firstPlayableFrameBlocked: false,
    liteModeLoadsAllFallbacks: false,
    liteModeUsesFallbackVariants: true,
    districtResidencyAllQualities: true,
    balancedPinnedAssetIds: EON_CITY_W659F_FIXED_CORE_ASSET_IDS,
    cinematicPinnedAssetIds: EON_CITY_W659F_FIXED_CORE_ASSET_IDS,
    residentLimitByQuality: freeze({ lite: 4, balanced: 5, cinematic: 6 }),
    maxConcurrentLoads: 2,
    proximityLoadRadius: 5.8,
    proximityUnloadRadius: 8.5,
    visualMeshCollision: false
  }),
  truth: freeze({
    authenticatedCityOnly: true,
    sameOriginOnly: true,
    contentHashedPaths: true,
    originalMeshyFilesShippedToRuntime: false,
    privateDataInAssets: false,
    remoteArtDependency: false,
    autoWorkExecution: false
  })
});

export function getEonCityW659fFunctionalAsset(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function getEonCityW659fActionsForDistrict(districtId = '') {
  const id = normalizeEonCityDistrictId(districtId);
  const seen = new Set();
  const rows = [];
  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
    if (entry.districtId !== id) continue;
    for (const item of entry.actions) {
      const key = `${item.id}:${item.route || ''}:${item.panel || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(item);
    }
  }
  return freeze(rows);
}

export function getEonCityW659fCanonicalCollisionVolumes() {
  const rows = [];
  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
    rows.push(entry.collider, ...(entry.additionalColliders || []));
  }
  return freeze(rows);
}

export function validateEonCityW659fFunctionalAssetManifest(manifest = EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST) {
  const errors = [];
  const ids = new Set();
  if (manifest?.schema !== EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST_SCHEMA) errors.push('schema');
  if (!Array.isArray(manifest?.entries) || manifest.entries.length !== 6) errors.push('asset-count');
  for (const entry of manifest?.entries || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`id:${entry?.id || 'missing'}`);
    ids.add(entry?.id);
    if (!entry?.districtId || !entry?.landmarkId || !entry?.role) errors.push(`semantics:${entry?.id}`);
    if (!Number.isFinite(entry?.targetHeight) || entry.targetHeight <= 0) errors.push(`height:${entry?.id}`);
    if (![entry?.placement?.x, entry?.placement?.z, entry?.placement?.rotationY].every(Number.isFinite)) errors.push(`placement:${entry?.id}`);
    for (const name of ['primary', 'fallback']) {
      const value = entry?.variants?.[name];
      if (!value?.path?.startsWith(`/assets/city/w659f/${name}/world/`)) errors.push(`${name}-path:${entry?.id}`);
      if (!/\.[a-f0-9]{12}\.glb$/i.test(String(value?.path || ''))) errors.push(`${name}-hash:${entry?.id}`);
      if (!Number.isInteger(value?.bytes) || value.bytes <= 0 || !/^[a-f0-9]{64}$/i.test(String(value?.sha256 || ''))) errors.push(`${name}-integrity:${entry?.id}`);
    }
    if (!entry?.collider?.id || !['circle', 'box'].includes(entry.collider.type)) errors.push(`collider:${entry?.id}`);
    if ((entry?.actions || []).some((item) => item.autoExecute || item.autoNavigate || item.reviewRequired !== true)) errors.push(`unsafe-action:${entry?.id}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), count: ids.size });
}

import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';

const freeze = (value) => Object.freeze(value);

const fromSource = (alias, source, tier, role, targetHeight, kind, options = {}) => {
  if (!source) throw new Error(`w737-asset-alias-missing:${alias}`);
  return freeze({
    id: `w737-${alias}`,
    sourceId: source.id,
    alias,
    kind,
    tier,
    role,
    targetHeight,
    ...options,
    options: freeze({ ...(options.options || {}) }),
    variants: freeze({ primary: source.variants.primary, fallback: source.variants.fallback }),
    animations: freeze([...(source.animationNames || [])])
  });
};

const character = (alias, tier, role, targetHeight, options = {}) => fromSource(alias, getEonCityW649Character(alias), tier, role, targetHeight, 'character', options);
const world = (alias, sourceId, tier, role, targetHeight, options = {}) => fromSource(alias, getEonCityW649WorldAsset(sourceId), tier, role, targetHeight, 'world', options);
const characterAsset = (alias, sourceId, tier, role, targetHeight, options = {}) => fromSource(alias, getEonCityW649Character(sourceId), tier, role, targetHeight, 'world', options);
const stationRole = (stationId, alias, role, targetHeight) => character(alias, 'role-lazy', role, targetHeight, { stationId });
const stationProp = (stationId, alias, sourceId, role, targetHeight, options = {}) => world(alias, sourceId, 'station-prop-lazy', role, targetHeight, { stationId, ...options });

// Owner correction on 2026-07-28: the damaged coat is the Architect assigned
// to Command Status. The earlier Share-station diagnosis was wrong. Keep the
// Architect out of the active launch cast until re-rigging and visual proof.
export const EON_CITY_W744_CHARACTER_REPLACEMENTS = freeze([
  freeze({
    stationId: 'command-console',
    rejectedAlias: 'architect',
    replacementAlias: 'security-sentinel',
    reason: 'owner-observed coat deformation at the Command Status station',
    scope: 'launch-role-only'
  })
]);
// Retained export name for older focused gates; the authority is W744 above.
export const EON_CITY_W741_CHARACTER_REPLACEMENTS = EON_CITY_W744_CHARACTER_REPLACEMENTS;

export const EON_CITY_W731_LAUNCH_ASSET_MANIFEST_SCHEMA = 'eon.city.launch-assets.w731.v1';
export const EON_CITY_W757_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1';
// Compatibility aliases retain older import names while pointing at current authority.
export const EON_CITY_W747_RUNTIME_PROVENANCE = EON_CITY_W757_RUNTIME_PROVENANCE;
export const EON_CITY_W745_RUNTIME_PROVENANCE = EON_CITY_W757_RUNTIME_PROVENANCE;
export const EON_CITY_W744_RUNTIME_PROVENANCE = EON_CITY_W757_RUNTIME_PROVENANCE;
export const EON_CITY_W743_RUNTIME_PROVENANCE = EON_CITY_W757_RUNTIME_PROVENANCE;
export const EON_CITY_W731_LAUNCH_ASSET_MANIFEST = freeze({
  schema: EON_CITY_W731_LAUNCH_ASSET_MANIFEST_SCHEMA,
  version: '757.0.0',
  cacheVersion: EON_CITY_W757_RUNTIME_PROVENANCE,
  firstFrame: freeze({
    requiredGlbCount: 0,
    proceduralFallbackRequired: true,
    oneEngine: true,
    oneScene: true,
    oneRenderLoop: true
  }),
  visibleFrame: freeze({
    authoredEnvironmentRequired: true,
    coreAssetAliases: freeze(['living-nexus-core', 'command-seat', 'district-hologram', 'eonbot-dock']),
    coreCharacterAliases: freeze(['player-primary', 'eonbot']),
    requiredCoreAssetCount: 4,
    requiredCoreCharacterCount: 2,
    hardTimeoutMs: 12_000,
    brandedDegradedFallback: true
  }),
  coreLazy: freeze([
    character('player-primary', 'core-lazy', 'main-avatar', 1.88),
    character('eonbot', 'core-lazy', 'eonbot-companion', 1.05)
  ]),
  coreWorld: freeze([
    world('living-nexus-core', 'eoncity-genesis-core', 'visible-frame', 'living-nexus-core', 4.1),
    world('command-seat', 'eoncity-command-chair', 'visible-frame', 'command-seat', 2.25),
    world('district-hologram', 'eoncity-district-hologram', 'visible-frame', 'district-hologram', 2.9),
    characterAsset('eonbot-dock', 'eonbot-dock', 'visible-frame', 'eonbot-dock', 1.65)
  ]),
  stationWorld: freeze([
    world('create-forge-world', 'eoncity-forge-basilica', 'station-lazy', 'create-forge-building', 5.2, { stationId: 'create-forge' }),
    world('project-atlas-world', 'eoncity-holo-map-beacon', 'station-lazy', 'project-atlas', 3.0, { stationId: 'project-atlas' }),
    world('library-vault-world', 'eoncity-navigator-arc', 'station-lazy', 'library-vault', 3.8, { stationId: 'library-vault' }),
    world('share-capture-world', 'eoncity-district-hologram', 'station-lazy', 'share-capture', 3.1, { stationId: 'share-capture' }),
    world('command-console-world', 'eoncity-holo-interface-landmark', 'station-lazy', 'command-status-structure', 4.2, { stationId: 'command-console' }),
    world('automation-theatre-world', 'eoncity-holo-interface-landmark', 'station-lazy', 'automation-theatre', 4.2, { stationId: 'automation-theatre' }),
    world('local-ai-lab-world', 'eoncity-ai-tower-core', 'station-lazy', 'local-ai-lab', 4.5, { stationId: 'local-ai-lab' }),
    world('my-realm-portal-world', 'eoncity-portal-gate', 'station-lazy', 'my-realm-portal', 4.6, { stationId: 'my-realm-portal' }),
    world('plans-access-world', 'eoncity-trade-dome-entrance', 'station-lazy', 'plans-access-structure', 4.4, { stationId: 'plans-access' })
  ]),
  stationProps: freeze([
    stationProp('eonbot-nexus', 'eonbot-nexus-terminal', 'eoncity-nav-info-kiosk', 'nexus-command-terminal', 1.9),
    stationProp('create-forge', 'create-forge-terminal', 'eoncity-forge-workbench', 'forge-terminal', 2.2),
    stationProp('project-atlas', 'project-atlas-terminal', 'eoncity-nav-info-kiosk', 'atlas-terminal', 1.9),
    stationProp('library-vault', 'library-vault-terminal', 'eoncity-district-info', 'vault-terminal', 1.9),
    stationProp('share-capture', 'share-capture-terminal', 'eoncity-market-trade-terminal', 'share-capture-terminal', 1.9),
    stationProp('command-console', 'command-console-terminal', 'eoncity-nav-info-kiosk', 'command-status-terminal', 2.0),
    stationProp('automation-theatre', 'automation-theatre-terminal', 'eoncity-district-info', 'automation-terminal', 1.9),
    stationProp('local-ai-lab', 'local-ai-lab-terminal', 'eoncity-market-trade-terminal', 'local-ai-terminal', 2.0),
    stationProp('my-realm-portal', 'my-realm-portal-terminal', 'eoncity-district-info', 'realm-control-terminal', 1.9),
    stationProp('plans-access', 'plans-access-terminal', 'eoncity-market-trade-terminal', 'membership-terminal', 2.0)
  ]),
  discoveryWorld: freeze([
    world('transit-overlook-world', 'eoncity-transit-core', 'discovery-lazy', 'transit-overlook', 4.2),
    world('maintenance-relay-world', 'eoncity-district-info', 'discovery-lazy', 'maintenance-relay', 3.0),
    world('expanse-gate-world', 'eoncity-ascension-portal', 'discovery-lazy', 'expanse-gate', 5.4)
  ]),
  roleCharacters: freeze([
    stationRole('create-forge', 'device-lab-specialist', 'forge-specialist', 1.78),
    stationRole('project-atlas', 'archive-guide', 'project-navigator', 1.8),
    stationRole('library-vault', 'vault-steward', 'library-steward', 1.8),
    stationRole('share-capture', 'citizen-variant', 'sharing-host', 1.8),
    stationRole('command-console', 'security-sentinel', 'command-status-coordinator', 1.82),
    stationRole('automation-theatre', 'holo-operator', 'automation-operator', 1.8),
    stationRole('local-ai-lab', 'forge-worker', 'local-ai-technician', 1.78),
    stationRole('my-realm-portal', 'creator-host', 'realm-steward', 1.78),
    stationRole('plans-access', 'trade-steward', 'access-guide', 1.8)
  ]),
  ambientAssets: freeze([
    world('transit-capsule-ambient', 'eoncity-transit-core', 'ambient-lazy', 'bounded-transit-capsule', 2.8, { ambientId: 'transit-capsule' }),
    fromSource('maintenance-worker-ambient', getEonCityW649Character('forge-worker'), 'ambient-lazy', 'maintenance-worker', 1.45, 'character', { ambientId: 'maintenance-worker' }),
    world('street-lamp-ambient', 'eoncity-street-lamp', 'ambient-lazy', 'authored-street-light-network', 2.35, { ambientId: 'street-light-network' }),
    fromSource('ambient-citizen-north', getEonCityW649Character('citizen-variant'), 'ambient-lazy', 'roaming-citizen-north', 1.78, 'character', { ambientId: 'citizen-north', noProceduralFallback: true }),
    fromSource('ambient-citizen-east', getEonCityW649Character('creator-host'), 'ambient-lazy', 'roaming-citizen-east', 1.8, 'character', { ambientId: 'citizen-east', noProceduralFallback: true }),
    fromSource('ambient-citizen-south', getEonCityW649Character('device-lab-specialist'), 'ambient-lazy', 'roaming-citizen-south', 1.78, 'character', { ambientId: 'citizen-south', noProceduralFallback: true }),
    fromSource('ambient-citizen-west', getEonCityW649Character('trade-steward'), 'ambient-lazy', 'roaming-citizen-west', 1.8, 'character', { ambientId: 'citizen-west', noProceduralFallback: true })
  ]),
  budgets: freeze({
    lite: freeze({ roleCharacters: 3, stationWorld: 5, stationProps: 4, discoveryWorld: 1, ambientAssets: 0, approximateLazyBytes: 12_000_000, maxConcurrentLoads: 1, maxResidentAssets: 20 }),
    balanced: freeze({ roleCharacters: 9, stationWorld: 9, stationProps: 10, discoveryWorld: 3, ambientAssets: 7, approximateLazyBytes: 35_200_000, maxConcurrentLoads: 2, maxResidentAssets: 45 }),
    cinematic: freeze({ roleCharacters: 9, stationWorld: 9, stationProps: 10, discoveryWorld: 3, ambientAssets: 7, approximateLazyBytes: 41_200_000, maxConcurrentLoads: 2, maxResidentAssets: 49 })
  }),
  truth: freeze({
    sameOriginOnly: true,
    contentHashedOnly: true,
    remoteAssets: false,
    privateDataInManifest: false,
    glbFailureBlocksMovement: false,
    loadAllAtBoot: false,
    inactiveStaticCandidatesExcluded: true,
    rawProceduralSkeletonOwnerVisible: false,
    proceduralAmbientCitizensVisible: false,
    authoredAmbientCitizensOrNone: true,
    environmentAssetsProgressive: true,
    allStationsHaveStructureTerminalNpcTriad: true,
    rejectedCommandStatusArchitectExcluded: true,
    allReadyWorldAssetsAssigned: true,
    retiredReadyWorldAssetIds: freeze(['eoncity-orientation-hall']),
    visibleFrameIncludesCoreCharacters: true,
    eonbotSimpleOrbitRetired: true,
    heroPresentationDirector: 'w745',
    eonbotStationHostGreetings: true,
    eonbotVisualDockVisitOnly: true,
    pathfinderNonStaticIdle: true,
    pathfinderOneShotIdleRecovery: true,
    animatedCircuitDataPulses: true,
    centralOrientationShellRetired: true,
    hubArchiveGardenRetired: true,
    expanseGateCanonical: true,
    spatialAuthority: 'w747-five-wing-hero-zone',
    heroZoneDiameterMetres: 12
  })
});

export function getEonCityW731QualityBudget(quality = 'balanced') {
  const normalized = ['lite', 'balanced', 'cinematic'].includes(String(quality || '').toLowerCase()) ? String(quality).toLowerCase() : 'balanced';
  return EON_CITY_W731_LAUNCH_ASSET_MANIFEST.budgets[normalized];
}

export function validateEonCityW731LaunchAssetManifest(manifest = EON_CITY_W731_LAUNCH_ASSET_MANIFEST) {
  const errors = [];
  if (manifest?.schema !== EON_CITY_W731_LAUNCH_ASSET_MANIFEST_SCHEMA) errors.push('schema');
  if (manifest?.firstFrame?.requiredGlbCount !== 0) errors.push('first-frame-hidden-safety');
  if (manifest?.visibleFrame?.requiredCoreAssetCount !== 4 || manifest?.coreWorld?.length !== 4) errors.push('visible-frame-core-count');
  if (manifest?.visibleFrame?.requiredCoreCharacterCount !== 2 || manifest?.visibleFrame?.coreCharacterAliases?.length !== 2) errors.push('visible-frame-character-count');
  if (manifest?.coreLazy?.length !== 2) errors.push('core-lazy-count');
  if (manifest?.roleCharacters?.length !== 9) errors.push('role-character-count');
  if (manifest?.stationWorld?.length !== 9) errors.push('station-world-count');
  if (manifest?.stationProps?.length !== 10) errors.push('station-prop-count');
  if (manifest?.discoveryWorld?.length !== 3) errors.push('discovery-world-count');
  if (manifest?.ambientAssets?.length !== 7) errors.push('ambient-asset-count');
  const activeRoleAliases = new Set((manifest?.roleCharacters || []).map((entry) => entry.alias));
  const roleByStation = new Map((manifest?.roleCharacters || []).map((entry) => [entry.stationId, entry.alias]));
  for (const replacement of EON_CITY_W744_CHARACTER_REPLACEMENTS) {
    if (activeRoleAliases.has(replacement.rejectedAlias)) errors.push(`rejected-role-active:${replacement.rejectedAlias}`);
    if (roleByStation.get(replacement.stationId) !== replacement.replacementAlias) errors.push(`replacement-role-missing:${replacement.stationId}`);
  }
  const stationProps = new Set((manifest?.stationProps || []).map((entry) => entry.stationId));
  if (stationProps.size !== 10) errors.push('station-prop-coverage');
  const entries = [
    ...(manifest?.coreLazy || []), ...(manifest?.coreWorld || []),
    ...(manifest?.stationWorld || []), ...(manifest?.stationProps || []),
    ...(manifest?.discoveryWorld || []), ...(manifest?.roleCharacters || []),
    ...(manifest?.ambientAssets || [])
  ];
  const paths = entries.flatMap((entry) => [entry.variants?.primary?.path, entry.variants?.fallback?.path]);
  if (paths.some((path) => !String(path || '').startsWith('/assets/city/w649/'))) errors.push('asset-path');
  if (paths.some((path) => !/\.[a-f0-9]{12}\.glb$/i.test(String(path || '')))) errors.push('content-hash');
  if (paths.some((path) => /^https?:/i.test(String(path || '')))) errors.push('remote-path');
  if (manifest?.truth?.loadAllAtBoot !== false || manifest?.truth?.glbFailureBlocksMovement !== false) errors.push('progressive-truth');
  if (manifest?.truth?.rawProceduralSkeletonOwnerVisible !== false || manifest?.truth?.proceduralAmbientCitizensVisible !== false || manifest?.truth?.authoredAmbientCitizensOrNone !== true) errors.push('owner-visible-skeleton');
  if (manifest?.cacheVersion !== EON_CITY_W743_RUNTIME_PROVENANCE) errors.push('runtime-provenance');
  if (manifest?.truth?.allStationsHaveStructureTerminalNpcTriad !== true) errors.push('station-triad-truth');
  if (manifest?.truth?.allReadyWorldAssetsAssigned !== true || manifest?.truth?.visibleFrameIncludesCoreCharacters !== true || !Array.isArray(manifest?.truth?.retiredReadyWorldAssetIds)) errors.push('completion-truth');
  if (manifest?.truth?.eonbotSimpleOrbitRetired !== true || manifest?.truth?.heroPresentationDirector !== 'w745') errors.push('hero-companion-truth');
  if (manifest?.truth?.eonbotStationHostGreetings !== true || manifest?.truth?.eonbotVisualDockVisitOnly !== true) errors.push('companion-variety-truth');
  if (manifest?.truth?.pathfinderNonStaticIdle !== true || manifest?.truth?.pathfinderOneShotIdleRecovery !== true || manifest?.truth?.animatedCircuitDataPulses !== true) errors.push('final-polish-truth');
  if (manifest?.truth?.centralOrientationShellRetired !== true || manifest?.truth?.hubArchiveGardenRetired !== true || manifest?.truth?.expanseGateCanonical !== true) errors.push('w766ir2-hub-gate-authority');
  if (manifest?.truth?.spatialAuthority !== 'w747-five-wing-hero-zone' || manifest?.truth?.heroZoneDiameterMetres !== 12) errors.push('w747-spatial-authority');
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const budget = manifest?.budgets?.[quality];
    if (!Number.isInteger(budget?.maxConcurrentLoads) || budget.maxConcurrentLoads < 1 || budget.maxConcurrentLoads > 2) errors.push(`load-concurrency:${quality}`);
    if (!Number.isInteger(budget?.maxResidentAssets) || budget.maxResidentAssets < 16) errors.push(`resident-budget:${quality}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), assetCount: entries.length });
}

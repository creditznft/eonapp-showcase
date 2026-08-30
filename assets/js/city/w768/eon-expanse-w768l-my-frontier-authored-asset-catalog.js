/**
 * W768L — truthful authored-asset catalog for My Frontier.
 *
 * Existing EON City assets may be reused as authored district anchors, but an
 * anchor is never described as a complete finished building. Buildings without
 * a semantically defensible same-origin asset remain explicitly pending.
 */
import { EON_EXPANSE_W768A_BUILDING_CATALOG } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';
import { getEonCityW659fFunctionalAsset } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

export const EON_EXPANSE_W768L_AUTHORED_ASSET_CATALOG_SCHEMA = 'eon.expanse.my-frontier-authored-assets.w768l.v1';

const freeze = (value) => Object.freeze(value);
const ready = (buildingId, sourceAuthority, assetId, targetHeight, role) => freeze({
  buildingId,
  status: 'authored-anchor-ready',
  sourceAuthority,
  assetId,
  targetHeight,
  role,
  finishedBuilding: false,
  preservesFoundationUntilValidated: true,
  preservesScaffoldingUntilValidated: true,
  fallbackRequired: true
});
const pending = (buildingId, reason) => freeze({
  buildingId,
  status: 'dedicated-authored-building-pending',
  sourceAuthority: '',
  assetId: '',
  targetHeight: 0,
  role: '',
  reason,
  finishedBuilding: false,
  preservesFoundationUntilValidated: true,
  preservesScaffoldingUntilValidated: true,
  fallbackRequired: true
});

const declarations = freeze({
  'command-core': ready('command-core', 'w649-world', 'eoncity-genesis-core', 8.6, 'central command energy anchor'),
  'creator-workshop': ready('creator-workshop', 'w649-world', 'eoncity-forge-basilica', 7.2, 'creator workshop hero anchor'),
  'media-foundry': ready('media-foundry', 'w659f-functional', 'creator-work-pod', 4.8, 'reviewed creator production anchor'),
  'design-pavilion': pending('design-pavilion', 'No existing authored asset truthfully represents the complete Design Pavilion.'),
  'project-atlas': ready('project-atlas', 'w649-world', 'eoncity-holo-map-beacon', 5.2, 'project navigation anchor'),
  'archive-vault': ready('archive-vault', 'w649-world', 'eoncity-navigator-arc', 7.4, 'archive navigation anchor'),
  'research-observatory': pending('research-observatory', 'A dedicated research observatory asset is still required.'),
  'local-ai-observatory': ready('local-ai-observatory', 'w649-world', 'eoncity-ai-tower-core', 8.4, 'local AI signal anchor'),
  'automation-relay': ready('automation-relay', 'w659f-functional', 'agent-theatre-relay-console', 4.6, 'reviewed automation relay anchor'),
  'agent-theatre': ready('agent-theatre', 'w649-world', 'eoncity-holo-interface-landmark', 7.2, 'agent theatre interface anchor'),
  'broadcast-tower': ready('broadcast-tower', 'w659f-functional', 'command-signal-totem', 7.8, 'broadcast signal anchor'),
  'creator-capture-studio': ready('creator-capture-studio', 'w659f-functional', 'creator-work-pod', 4.8, 'local capture preparation anchor'),
  'community-beacon': ready('community-beacon', 'w649-world', 'eoncity-district-hologram', 5.6, 'optional community signal anchor'),
  'regional-transit-station': ready('regional-transit-station', 'w649-world', 'eoncity-transit-core', 6.2, 'regional transit anchor'),
  'expedition-hangar': pending('expedition-hangar', 'A dedicated expedition hangar asset is still required.'),
  'gateway-terminal': ready('gateway-terminal', 'w659f-functional', 'district-arrival-gate', 6.5, 'safe region gateway anchor'),
  'eonbot-temple': ready('eonbot-temple', 'w659f-functional', 'eonbot-companion-dock', 4.2, 'EONBOT companion and docking anchor'),
  'reflection-garden': pending('reflection-garden', 'A dedicated authored landscape kit is still required.'),
  'vault-reveal-gallery': pending('vault-reveal-gallery', 'A dedicated non-tradable Vault Reveal gallery asset is still required.')
});

function resolveSource(entry) {
  if (entry.sourceAuthority === 'w649-world') return getEonCityW649WorldAsset(entry.assetId);
  if (entry.sourceAuthority === 'w659f-functional') return getEonCityW659fFunctionalAsset(entry.assetId);
  return null;
}

function projectEntry(entry) {
  const building = EON_EXPANSE_W768A_BUILDING_CATALOG[entry.buildingId] || null;
  const source = resolveSource(entry);
  return freeze({
    ...entry,
    buildingLabel: building?.label || entry.buildingId,
    district: building?.district || '',
    variants: source ? freeze({ primary: source.variants?.primary || null, fallback: source.variants?.fallback || null }) : freeze({ primary: null, fallback: null }),
    sourceStatus: source?.status || '',
    sameOriginOnly: true,
    contentHashedPathsRequired: true,
    remoteAssetAllowed: false,
    privateContentStored: false,
    automaticConstruction: false,
    automaticFallbackSuppression: false
  });
}

export const EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES = freeze(
  Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).map((buildingId) => projectEntry(declarations[buildingId] || pending(buildingId, 'No authored asset mapping has been approved.')))
);

const byBuildingId = new Map(EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES.map((entry) => [entry.buildingId, entry]));

export function getEonExpanseW768LAuthoredAssetEntry(buildingId = '') {
  return byBuildingId.get(String(buildingId || '').trim()) || null;
}

export function createEonExpanseW768LAuthoredAssetCatalog() {
  const readyCount = EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES.filter((entry) => entry.status === 'authored-anchor-ready').length;
  return freeze({
    schema: EON_EXPANSE_W768L_AUTHORED_ASSET_CATALOG_SCHEMA,
    entries: EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES,
    buildingCount: EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES.length,
    readyAnchorCount: readyCount,
    dedicatedBuildingPendingCount: EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES.length - readyCount,
    authoredAnchorsAreFinishedBuildings: false,
    foundationHiddenBeforeValidation: false,
    scaffoldingHiddenBeforeValidation: false,
    sameOriginOnly: true,
    privateContentStored: false,
    remoteAssetAllowed: false
  });
}

function validVariant(value) {
  return Boolean(value?.path?.startsWith('/assets/city/'))
    && /\.[a-f0-9]{12}\.glb$/i.test(String(value?.path || ''))
    && Number.isInteger(value?.bytes) && value.bytes > 0
    && /^[a-f0-9]{64}$/i.test(String(value?.sha256 || ''));
}

export function validateEonExpanseW768LAuthoredAssetCatalog(catalog = createEonExpanseW768LAuthoredAssetCatalog()) {
  const errors = [];
  const entries = Array.isArray(catalog?.entries) ? catalog.entries : [];
  if (catalog?.schema !== EON_EXPANSE_W768L_AUTHORED_ASSET_CATALOG_SCHEMA) errors.push('schema-invalid');
  if (entries.length !== Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).length) errors.push('all-buildings-required');
  if (new Set(entries.map((entry) => entry.buildingId)).size !== entries.length) errors.push('building-ids-must-be-unique');
  for (const entry of entries) {
    if (!EON_EXPANSE_W768A_BUILDING_CATALOG[entry.buildingId]) errors.push(`unknown-building:${entry.buildingId}`);
    if (entry.finishedBuilding !== false || entry.automaticConstruction !== false || entry.automaticFallbackSuppression !== false) errors.push(`truth-boundary:${entry.buildingId}`);
    if (entry.status === 'authored-anchor-ready') {
      if (!['w649-world', 'w659f-functional'].includes(entry.sourceAuthority)) errors.push(`source-authority:${entry.buildingId}`);
      if (!entry.assetId || !Number.isFinite(entry.targetHeight) || entry.targetHeight <= 0) errors.push(`ready-entry-invalid:${entry.buildingId}`);
      if (!validVariant(entry.variants?.primary) || !validVariant(entry.variants?.fallback)) errors.push(`variants-invalid:${entry.buildingId}`);
    } else if (entry.status === 'dedicated-authored-building-pending') {
      if (!entry.reason || entry.assetId || entry.variants?.primary || entry.variants?.fallback) errors.push(`pending-entry-invalid:${entry.buildingId}`);
    } else {
      errors.push(`status-invalid:${entry.buildingId}`);
    }
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), count: entries.length });
}

export default freeze({
  EON_EXPANSE_W768L_AUTHORED_ASSET_CATALOG_SCHEMA,
  EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES,
  getEonExpanseW768LAuthoredAssetEntry,
  createEonExpanseW768LAuthoredAssetCatalog,
  validateEonExpanseW768LAuthoredAssetCatalog
});

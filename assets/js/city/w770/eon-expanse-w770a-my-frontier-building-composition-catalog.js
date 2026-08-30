/**
 * W770A — authored multi-asset composition catalog for My Frontier buildings.
 *
 * Every approved building receives a deterministic composition assembled only
 * from existing same-origin, content-hashed authored GLBs. A composition is a
 * truthful interim district landmark, not a claim that bespoke building art is
 * complete. Users never supply transforms, paths, colors or raw coordinates.
 */
import { EON_EXPANSE_W768A_BUILDING_CATALOG } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';
import { getEonCityW659fFunctionalAsset } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

export const EON_EXPANSE_W770A_BUILDING_COMPOSITION_SCHEMA = 'eon.expanse.my-frontier-building-compositions.w770a.v1';
const freeze = Object.freeze;
const vec = (x = 0, y = 0, z = 0) => freeze({ x: Number(x), y: Number(y), z: Number(z) });

const part = ({ id, sourceAuthority, assetId, targetHeight, x = 0, y = 0, z = 0, rotationY = 0, required = true, minimumQuality = 'lite', role = '' }) => freeze({
  id,
  sourceAuthority,
  assetId,
  targetHeight: Number(targetHeight),
  localPosition: vec(x, y, z),
  rotationY: Number(rotationY),
  required: required === true,
  minimumQuality,
  role,
  finishedBuildingPart: false,
  userTransformAllowed: false
});
const w649 = (id, assetId, targetHeight, x, z, rotationY, role, options = {}) => part({ id, sourceAuthority: 'w649-world', assetId, targetHeight, x, z, rotationY, role, ...options });
const w659f = (id, assetId, targetHeight, x, z, rotationY, role, options = {}) => part({ id, sourceAuthority: 'w659f-functional', assetId, targetHeight, x, z, rotationY, role, ...options });
const composition = (buildingId, parts, { bespokeArtComplete = false, compositionRole = '', dedicatedArtNote = '' } = {}) => freeze({
  buildingId,
  status: 'authored-composition-ready',
  compositionRole,
  parts: freeze(parts),
  bespokeArtComplete: bespokeArtComplete === true,
  dedicatedArtNote,
  suppressScaffoldingAfterValidation: true,
  preserveFoundationAfterValidation: true,
  finishedBespokeBuilding: false,
  automaticConstruction: false,
  automaticPresentation: false,
  userCoordinatesAllowed: false,
  sameOriginOnly: true,
  privateContentStored: false
});

const declarations = freeze({
  'command-core': composition('command-core', [
    w649('core', 'eoncity-genesis-core', 8.6, 0, 0, 0, 'central command energy landmark'),
    w649('status-hologram', 'eoncity-district-hologram', 3.1, 0, 3.3, Math.PI, 'frontier status hologram', { minimumQuality: 'balanced' })
  ], { compositionRole: 'central command landmark', dedicatedArtNote: 'Uses the maintained Genesis Core composition; a unique My Frontier shell remains future art.' }),

  'creator-workshop': composition('creator-workshop', [
    w649('workshop-shell', 'eoncity-forge-basilica', 7.2, 0, 0.2, 0, 'creator workshop shell'),
    w649('workbench', 'eoncity-forge-workbench', 2.1, 0, 3.15, Math.PI, 'reviewed creator workbench', { minimumQuality: 'balanced' })
  ], { compositionRole: 'creator production landmark', dedicatedArtNote: 'District-specific assembly is ready; a unique creator facade remains future art.' }),

  'media-foundry': composition('media-foundry', [
    w659f('production-pod', 'creator-work-pod', 4.8, 0, 0, 0, 'reviewed media production anchor'),
    w649('command-seat', 'eoncity-command-chair', 2.0, -2.2, 1.5, Math.PI / 4, 'creator direction station', { minimumQuality: 'balanced' }),
    w649('media-hologram', 'eoncity-district-hologram', 2.7, 2.45, 1.35, -Math.PI / 4, 'capture preview display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'media preparation landmark', dedicatedArtNote: 'Uses authored creator assets; a bespoke foundry envelope remains future art.' }),

  'design-pavilion': composition('design-pavilion', [
    w649('design-interface', 'eoncity-holo-interface-landmark', 5.7, 0, -0.25, 0, 'design presentation landmark'),
    w649('design-seat', 'eoncity-command-chair', 1.9, 0, 2.65, Math.PI, 'reviewed design station', { minimumQuality: 'balanced' }),
    w649('design-hologram', 'eoncity-district-hologram', 2.5, -2.35, 1.2, Math.PI / 3, 'brand visualization display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'design planning pavilion', dedicatedArtNote: 'A dedicated pavilion skin is still required; this is an authored interim composition.' }),

  'project-atlas': composition('project-atlas', [
    w649('atlas-beacon', 'eoncity-holo-map-beacon', 5.2, 0, -0.2, 0, 'project navigation beacon'),
    w649('atlas-kiosk', 'eoncity-nav-info-kiosk', 2.0, 0, 2.75, Math.PI, 'project route kiosk', { minimumQuality: 'balanced' }),
    w649('atlas-marker', 'eoncity-district-info', 1.8, 2.1, 1.6, -Math.PI / 4, 'milestone marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'project navigation landmark', dedicatedArtNote: 'Project Atlas is represented by maintained navigation assets.' }),

  'archive-vault': composition('archive-vault', [
    w649('archive-arc', 'eoncity-navigator-arc', 7.4, 0, -0.4, 0, 'archive gateway landmark'),
    w649('archive-terminal', 'eoncity-market-trade-terminal', 2.0, 0, 2.8, Math.PI, 'informational archive terminal', { minimumQuality: 'balanced' }),
    w649('archive-marker', 'eoncity-district-info', 1.75, -2.2, 1.65, Math.PI / 4, 'archive collection marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'knowledge vault landmark', dedicatedArtNote: 'Uses authored archive/navigation assets; no trade or marketplace authority is enabled.' }),

  'research-observatory': composition('research-observatory', [
    w649('research-tower', 'eoncity-ai-tower-core', 8.7, 0, -0.5, 0, 'research signal tower'),
    w649('research-map', 'eoncity-holo-map-beacon', 2.7, 0, 2.8, Math.PI, 'evidence navigation display', { minimumQuality: 'balanced' }),
    w649('research-kiosk', 'eoncity-nav-info-kiosk', 1.8, 2.25, 1.65, -Math.PI / 4, 'reviewed evidence kiosk', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'research observatory landmark', dedicatedArtNote: 'A dedicated observatory shell is still required; this is an authored interim composition.' }),

  'local-ai-observatory': composition('local-ai-observatory', [
    w649('local-ai-tower', 'eoncity-ai-tower-core', 8.4, 0, -0.45, 0, 'local AI signal tower'),
    w649('local-ai-interface', 'eoncity-holo-interface-landmark', 3.5, 0, 2.75, Math.PI, 'provider verification display', { minimumQuality: 'balanced' }),
    w649('local-ai-marker', 'eoncity-district-info', 1.7, -2.25, 1.65, Math.PI / 4, 'private-compute marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'local AI observatory landmark', dedicatedArtNote: 'Maintained AI assets are composed without exposing provider credentials or prompts.' }),

  'automation-relay': composition('automation-relay', [
    w659f('relay-console', 'agent-theatre-relay-console', 4.6, 0, -0.15, 0, 'reviewed automation relay'),
    w659f('relay-totem', 'command-signal-totem', 2.7, -2.25, 1.75, Math.PI / 4, 'scheduled-signal totem', { minimumQuality: 'balanced' }),
    w649('relay-hologram', 'eoncity-district-hologram', 2.5, 2.2, 1.75, -Math.PI / 4, 'automation status display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'automation operations landmark', dedicatedArtNote: 'No automation is created by the composition or its terminal.' }),

  'agent-theatre': composition('agent-theatre', [
    w649('theatre-interface', 'eoncity-holo-interface-landmark', 6.2, 0, -0.35, 0, 'agent theatre landmark'),
    w659f('theatre-console', 'agent-theatre-relay-console', 2.8, 0, 2.75, Math.PI, 'reviewed agent console', { minimumQuality: 'balanced' }),
    w649('theatre-hologram', 'eoncity-district-hologram', 2.35, 2.25, 1.55, -Math.PI / 4, 'agent handoff display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'agent review landmark', dedicatedArtNote: 'Agent actions remain review-first and outside the visual composition.' }),

  'broadcast-tower': composition('broadcast-tower', [
    w659f('broadcast-totem', 'command-signal-totem', 7.8, 0, -0.4, 0, 'broadcast signal tower'),
    w649('broadcast-hologram', 'eoncity-district-hologram', 3.0, 0, 2.8, Math.PI, 'reviewed dispatch display', { minimumQuality: 'balanced' }),
    w649('broadcast-marker', 'eoncity-district-info', 1.75, 2.25, 1.7, -Math.PI / 4, 'signal status marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'reviewed broadcast landmark', dedicatedArtNote: 'The landmark never publishes or uploads automatically.' }),

  'creator-capture-studio': composition('creator-capture-studio', [
    w659f('capture-pod', 'creator-work-pod', 4.8, 0, -0.2, 0, 'local capture preparation pod'),
    w649('capture-seat', 'eoncity-command-chair', 1.9, -2.1, 1.65, Math.PI / 4, 'creator capture seat', { minimumQuality: 'balanced' }),
    w649('capture-preview', 'eoncity-district-hologram', 2.6, 2.2, 1.55, -Math.PI / 4, 'local capture preview', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'creator capture landmark', dedicatedArtNote: 'The composition cannot start recording or request permissions.' }),

  'community-beacon': composition('community-beacon', [
    w649('community-hologram', 'eoncity-district-hologram', 5.6, 0, -0.2, 0, 'optional community signal'),
    w649('community-kiosk', 'eoncity-nav-info-kiosk', 2.0, -2.0, 1.8, Math.PI / 4, 'invitation review kiosk', { minimumQuality: 'balanced' }),
    w649('community-marker', 'eoncity-district-info', 1.8, 2.0, 1.8, -Math.PI / 4, 'privacy status marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'optional community landmark', dedicatedArtNote: 'No invitation, contact access or public post occurs automatically.' }),

  'regional-transit-station': composition('regional-transit-station', [
    w649('transit-core', 'eoncity-transit-core', 6.2, 0, -0.55, 0, 'regional transit core'),
    w649('transit-gate', 'eoncity-portal-gate', 3.8, 0, 2.85, Math.PI, 'reviewed travel gate', { minimumQuality: 'balanced' }),
    w649('transit-lamp-left', 'eoncity-street-lamp', 2.6, -2.8, 2.1, 0, 'platform lamp', { minimumQuality: 'cinematic', required: false }),
    w649('transit-lamp-right', 'eoncity-street-lamp', 2.6, 2.8, 2.1, 0, 'platform lamp', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'regional transit landmark', dedicatedArtNote: 'Travel remains review-first and uses the maintained Transit authority.' }),

  'expedition-hangar': composition('expedition-hangar', [
    w649('hangar-core', 'eoncity-transit-core', 5.5, 0, -0.75, 0, 'expedition departure core'),
    w649('hangar-entrance', 'eoncity-trade-dome-entrance', 4.2, 0, 2.7, Math.PI, 'expedition hangar entrance', { minimumQuality: 'balanced' }),
    w649('hangar-gate', 'eoncity-portal-gate', 3.1, -2.6, 1.25, Math.PI / 3, 'reviewed expedition gate', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'expedition departure landmark', dedicatedArtNote: 'A dedicated hangar shell is still required; this is an authored interim composition.' }),

  'gateway-terminal': composition('gateway-terminal', [
    w659f('arrival-gate', 'district-arrival-gate', 6.5, 0, -0.2, 0, 'safe gateway terminal'),
    w649('gateway-kiosk', 'eoncity-nav-info-kiosk', 2.0, 0, 2.75, Math.PI, 'region selection kiosk', { minimumQuality: 'balanced' }),
    w649('gateway-marker', 'eoncity-district-info', 1.8, 2.25, 1.65, -Math.PI / 4, 'return status marker', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'safe region gateway landmark', dedicatedArtNote: 'Opening the terminal never auto-travels.' }),

  'eonbot-temple': composition('eonbot-temple', [
    w659f('companion-dock', 'eonbot-companion-dock', 4.2, 0, 1.25, Math.PI, 'EONBOT docking station'),
    w649('temple-core', 'eoncity-genesis-core', 5.1, 0, -1.75, 0, 'companion reflection core', { minimumQuality: 'balanced' }),
    w649('temple-hologram', 'eoncity-district-hologram', 2.4, 2.3, 1.25, -Math.PI / 4, 'companion memory display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'EONBOT companion landmark', dedicatedArtNote: 'No second companion identity is created.' }),

  'reflection-garden': composition('reflection-garden', [
    w649('garden-hologram', 'eoncity-district-hologram', 3.6, 0, -0.2, 0, 'verified progress reflection'),
    w649('garden-lamp-left', 'eoncity-street-lamp', 2.7, -3.0, 1.8, 0, 'reflection garden lamp', { minimumQuality: 'balanced' }),
    w649('garden-lamp-right', 'eoncity-street-lamp', 2.7, 3.0, 1.8, 0, 'reflection garden lamp', { minimumQuality: 'balanced' }),
    w649('garden-kiosk', 'eoncity-nav-info-kiosk', 1.8, 0, 2.75, Math.PI, 'private reflection kiosk', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'private reflection landscape', dedicatedArtNote: 'A dedicated authored landscape kit is still required; this is an interim authored composition.' }),

  'vault-reveal-gallery': composition('vault-reveal-gallery', [
    w649('gallery-arc', 'eoncity-navigator-arc', 6.4, 0, -0.65, 0, 'Vault Reveal gallery arc'),
    w649('gallery-core', 'eoncity-genesis-core', 3.6, 0, 1.25, Math.PI, 'non-tradable reveal core', { minimumQuality: 'balanced' }),
    w649('gallery-hologram', 'eoncity-district-hologram', 2.35, 2.25, 1.65, -Math.PI / 4, 'campaign memory display', { minimumQuality: 'cinematic', required: false })
  ], { compositionRole: 'non-tradable reveal gallery', dedicatedArtNote: 'A dedicated gallery shell is still required; reveals remain cosmetic and non-tradable.' })
});

function resolveSource(partEntry) {
  if (partEntry.sourceAuthority === 'w649-world') return getEonCityW649WorldAsset(partEntry.assetId);
  if (partEntry.sourceAuthority === 'w659f-functional') return getEonCityW659fFunctionalAsset(partEntry.assetId);
  return null;
}

function projectPart(partEntry) {
  const source = resolveSource(partEntry);
  return freeze({
    ...partEntry,
    variants: freeze({ primary: source?.variants?.primary || null, fallback: source?.variants?.fallback || null }),
    sourceStatus: source?.status || '',
    sameOriginOnly: true,
    remoteAssetAllowed: false,
    privateContentStored: false
  });
}

export const EON_EXPANSE_W770A_BUILDING_COMPOSITIONS = freeze(
  Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).map((buildingId) => {
    const declaration = declarations[buildingId];
    return freeze({
      ...declaration,
      buildingLabel: EON_EXPANSE_W768A_BUILDING_CATALOG[buildingId]?.label || buildingId,
      district: EON_EXPANSE_W768A_BUILDING_CATALOG[buildingId]?.district || '',
      parts: freeze((declaration?.parts || []).map(projectPart))
    });
  })
);
const byBuildingId = new Map(EON_EXPANSE_W770A_BUILDING_COMPOSITIONS.map((entry) => [entry.buildingId, entry]));

export function getEonExpanseW770ABuildingComposition(buildingId = '') {
  return byBuildingId.get(String(buildingId || '').trim()) || null;
}

export function createEonExpanseW770ABuildingCompositionCatalog() {
  const partCount = EON_EXPANSE_W770A_BUILDING_COMPOSITIONS.reduce((sum, entry) => sum + entry.parts.length, 0);
  return freeze({
    schema: EON_EXPANSE_W770A_BUILDING_COMPOSITION_SCHEMA,
    entries: EON_EXPANSE_W770A_BUILDING_COMPOSITIONS,
    buildingCount: EON_EXPANSE_W770A_BUILDING_COMPOSITIONS.length,
    partCount,
    compositionReadyCount: EON_EXPANSE_W770A_BUILDING_COMPOSITIONS.filter((entry) => entry.status === 'authored-composition-ready').length,
    bespokeArtCompleteCount: EON_EXPANSE_W770A_BUILDING_COMPOSITIONS.filter((entry) => entry.bespokeArtComplete).length,
    truthfulInterimCompositions: true,
    rawCoordinatesAccepted: false,
    sameOriginOnly: true,
    privateContentStored: false,
    finishedBespokeBuildingClaimed: false
  });
}

const validVariant = (value) => Boolean(value?.path?.startsWith('/assets/city/'))
  && /\.[a-f0-9]{12}\.glb$/i.test(String(value?.path || ''))
  && Number.isInteger(value?.bytes) && value.bytes > 0
  && /^[a-f0-9]{64}$/i.test(String(value?.sha256 || ''));
const QUALITY = freeze({ lite: 0, balanced: 1, cinematic: 2 });

export function validateEonExpanseW770ABuildingCompositionCatalog(catalog = createEonExpanseW770ABuildingCompositionCatalog()) {
  const errors = [];
  const entries = Array.isArray(catalog?.entries) ? catalog.entries : [];
  if (catalog?.schema !== EON_EXPANSE_W770A_BUILDING_COMPOSITION_SCHEMA) errors.push('schema-invalid');
  if (entries.length !== Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).length) errors.push('all-buildings-required');
  if (new Set(entries.map((entry) => entry.buildingId)).size !== entries.length) errors.push('building-ids-must-be-unique');
  for (const entry of entries) {
    const building = EON_EXPANSE_W768A_BUILDING_CATALOG[entry.buildingId];
    if (!building || entry.district !== building.district) errors.push(`building-invalid:${entry.buildingId}`);
    if (entry.status !== 'authored-composition-ready' || !Array.isArray(entry.parts) || entry.parts.length < 2) errors.push(`composition-invalid:${entry.buildingId}`);
    if (entry.finishedBespokeBuilding || entry.automaticConstruction || entry.automaticPresentation || entry.userCoordinatesAllowed || entry.privateContentStored) errors.push(`truth-boundary:${entry.buildingId}`);
    if (!entry.suppressScaffoldingAfterValidation || !entry.preserveFoundationAfterValidation || !entry.dedicatedArtNote) errors.push(`presentation-policy:${entry.buildingId}`);
    const ids = new Set();
    for (const component of entry.parts || []) {
      if (!component.id || ids.has(component.id)) errors.push(`part-id:${entry.buildingId}:${component.id || 'missing'}`);
      ids.add(component.id);
      if (!['w649-world', 'w659f-functional'].includes(component.sourceAuthority) || !component.assetId) errors.push(`part-source:${entry.buildingId}:${component.id}`);
      if (!validVariant(component.variants?.primary) || !validVariant(component.variants?.fallback)) errors.push(`part-variants:${entry.buildingId}:${component.id}`);
      if (!Number.isFinite(component.targetHeight) || component.targetHeight <= 0 || !Number.isFinite(component.rotationY)) errors.push(`part-transform:${entry.buildingId}:${component.id}`);
      if (![component.localPosition?.x, component.localPosition?.y, component.localPosition?.z].every(Number.isFinite)) errors.push(`part-position:${entry.buildingId}:${component.id}`);
      if (Math.abs(component.localPosition.x) > building.footprint.width / 2 + 1 || Math.abs(component.localPosition.z) > building.footprint.depth / 2 + 1) errors.push(`part-outside-footprint:${entry.buildingId}:${component.id}`);
      if (!(component.minimumQuality in QUALITY) || component.userTransformAllowed || component.finishedBuildingPart || component.remoteAssetAllowed || component.privateContentStored) errors.push(`part-boundary:${entry.buildingId}:${component.id}`);
    }
    if (!(entry.parts || []).some((component) => component.required && component.minimumQuality === 'lite')) errors.push(`lite-core-required:${entry.buildingId}`);
  }
  if (catalog.rawCoordinatesAccepted || !catalog.sameOriginOnly || catalog.privateContentStored || catalog.finishedBespokeBuildingClaimed) errors.push('catalog-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), buildingCount: entries.length, partCount: entries.reduce((sum, entry) => sum + (entry.parts?.length || 0), 0) });
}

export default freeze({
  EON_EXPANSE_W770A_BUILDING_COMPOSITION_SCHEMA,
  EON_EXPANSE_W770A_BUILDING_COMPOSITIONS,
  getEonExpanseW770ABuildingComposition,
  createEonExpanseW770ABuildingCompositionCatalog,
  validateEonExpanseW770ABuildingCompositionCatalog
});

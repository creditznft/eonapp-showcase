/**
 * W768A — authored, collision-safe My Frontier layout contract.
 *
 * This module defines placement authority only. Users select approved building
 * ids for authored plots; they never provide world coordinates, collision
 * bounds, entrance directions or road anchors.
 */

export const EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA = 'eon.expanse.my-frontier-layout.w768a.v1';

const freeze = (value) => Object.freeze(value);
const point = (x = 0, y = 0, z = 0) => freeze({ x: Number(x), y: Number(y), z: Number(z) });
const footprint = (width = 1, depth = 1, height = 1) => freeze({ width: Number(width), depth: Number(depth), height: Number(height) });
const envelope = (center, halfWidth, halfDepth) => freeze({
  minX: center.x - halfWidth,
  maxX: center.x + halfWidth,
  minZ: center.z - halfDepth,
  maxZ: center.z + halfDepth
});

const building = (id, district, label, nativeRoute, size, purpose) => freeze({
  id,
  district,
  label,
  nativeRoute,
  footprint: footprint(...size),
  purpose,
  reviewFirst: true,
  automaticExecution: false,
  privateContentStored: false
});

export const EON_EXPANSE_W768A_BUILDING_CATALOG = freeze({
  'command-core': building('command-core', 'central', 'Command Core', '/eoncity', [10, 10, 11], 'Safe return, EONBOT guidance and frontier status.'),

  'creator-workshop': building('creator-workshop', 'creator', 'Creator Workshop', '/create', [9, 8, 8], 'Websites, visual creation and reviewed creator work.'),
  'media-foundry': building('media-foundry', 'creator', 'Media Foundry', '/create', [10, 8, 9], 'Creator Capture, video and social content preparation.'),
  'design-pavilion': building('design-pavilion', 'creator', 'Design Pavilion', '/create', [8, 9, 7], 'Brand, presentation and creative planning.'),

  'project-atlas': building('project-atlas', 'knowledge', 'Project Atlas', '/projects', [9, 9, 9], 'Project continuity, milestones and reviewed next steps.'),
  'archive-vault': building('archive-vault', 'knowledge', 'Archive Vault', '/library', [10, 8, 8], 'Saved work, recovery and safe knowledge organization.'),
  'research-observatory': building('research-observatory', 'knowledge', 'Research Observatory', '/research', [8, 8, 11], 'Research synthesis and reviewed evidence.'),

  'local-ai-observatory': building('local-ai-observatory', 'systems', 'Local AI Observatory', '/local-ai', [9, 9, 11], 'Local and BYOK provider verification.'),
  'automation-relay': building('automation-relay', 'systems', 'Automation Relay', '/automations', [8, 8, 10], 'Reviewed schedules and bounded automations.'),
  'agent-theatre': building('agent-theatre', 'systems', 'Agent Theatre', '/agents', [10, 9, 8], 'Reviewed agent plans and visible handoffs.'),

  'broadcast-tower': building('broadcast-tower', 'signal', 'Broadcast Tower', '/share', [8, 8, 12], 'Quick Share, QR and reviewed frontier dispatches.'),
  'creator-capture-studio': building('creator-capture-studio', 'signal', 'Creator Capture Studio', '/creator-capture', [10, 9, 8], 'Local recording and capture preparation.'),
  'community-beacon': building('community-beacon', 'signal', 'Community Beacon', '/share', [8, 9, 10], 'Optional invitations and safe collaboration signals.'),

  'regional-transit-station': building('regional-transit-station', 'transit', 'Regional Transit Station', '/eoncity', [11, 8, 7], 'Reviewed travel between authored regions.'),
  'expedition-hangar': building('expedition-hangar', 'transit', 'Expedition Hangar', '/projects', [11, 9, 8], 'Productive expeditions and project departures.'),
  'gateway-terminal': building('gateway-terminal', 'transit', 'Gateway Terminal', '/eoncity', [9, 8, 10], 'Region selection and safe Hub return.'),

  'eonbot-temple': building('eonbot-temple', 'personal', 'EONBOT Temple', '/chat', [9, 9, 9], 'Companion reflection, guidance and docking.'),
  'reflection-garden': building('reflection-garden', 'personal', 'Reflection Garden', '/realm-studio', [10, 10, 5], 'A calm private reflection of verified progress.'),
  'vault-reveal-gallery': building('vault-reveal-gallery', 'personal', 'Vault Reveal Gallery', '/vault', [9, 9, 8], 'Non-tradable cosmetic reveals and campaign memories.')
});

const plot = ({ id, district, label, x, z, heading, max, allowedBuildingIds, requiredBuildingId = '' }) => {
  const position = point(x, 0, z);
  const towardCenterLength = Math.hypot(x, z) || 1;
  const towardCenter = point(-x / towardCenterLength, 0, -z / towardCenterLength);
  const entranceAnchor = point(x + towardCenter.x * (max[1] / 2 + 1.4), 0, z + towardCenter.z * (max[1] / 2 + 1.4));
  const roadAnchor = point(x + towardCenter.x * (max[1] / 2 + 4.5), 0, z + towardCenter.z * (max[1] / 2 + 4.5));
  return freeze({
    id,
    district,
    label,
    position,
    heading,
    maxFootprint: footprint(...max),
    allowedBuildingIds: freeze([...allowedBuildingIds]),
    requiredBuildingId,
    entranceDirection: towardCenter,
    entranceAnchor,
    interactionAnchor: point(entranceAnchor.x, 1.2, entranceAnchor.z),
    roadAnchor,
    cameraSafeRadius: Math.max(max[0], max[1]) * 1.25,
    collisionEnvelope: envelope(position, max[0] / 2 + 1.5, max[1] / 2 + 1.5),
    authoredPlacement: true,
    acceptsRawCoordinates: false
  });
};

export const EON_EXPANSE_W768A_MY_FRONTIER_PLOTS = freeze([
  plot({ id: 'plot-central-command', district: 'central', label: 'Central Command Plot', x: 0, z: 0, heading: 0, max: [12, 12, 13], allowedBuildingIds: ['command-core'], requiredBuildingId: 'command-core' }),
  plot({ id: 'plot-creator', district: 'creator', label: 'Creator District Plot', x: -21, z: -15, heading: Math.PI / 4, max: [12, 11, 13], allowedBuildingIds: ['creator-workshop', 'media-foundry', 'design-pavilion'] }),
  plot({ id: 'plot-knowledge', district: 'knowledge', label: 'Knowledge District Plot', x: 0, z: -28, heading: 0, max: [12, 11, 13], allowedBuildingIds: ['project-atlas', 'archive-vault', 'research-observatory'] }),
  plot({ id: 'plot-systems', district: 'systems', label: 'Systems District Plot', x: 21, z: -15, heading: -Math.PI / 4, max: [12, 11, 13], allowedBuildingIds: ['local-ai-observatory', 'automation-relay', 'agent-theatre'] }),
  plot({ id: 'plot-signal', district: 'signal', label: 'Signal District Plot', x: 21, z: 15, heading: -Math.PI * 0.75, max: [12, 11, 14], allowedBuildingIds: ['broadcast-tower', 'creator-capture-studio', 'community-beacon'] }),
  plot({ id: 'plot-transit', district: 'transit', label: 'Transit District Plot', x: 0, z: 28, heading: Math.PI, max: [13, 11, 12], allowedBuildingIds: ['regional-transit-station', 'expedition-hangar', 'gateway-terminal'] }),
  plot({ id: 'plot-personal', district: 'personal', label: 'Personal District Plot', x: -21, z: 15, heading: Math.PI * 0.75, max: [12, 11, 12], allowedBuildingIds: ['eonbot-temple', 'reflection-garden', 'vault-reveal-gallery'] })
]);

const residentSlot = (id, residentId, label, x, z, heading) => freeze({
  id,
  residentId,
  label,
  position: point(x, 0, z),
  heading,
  routeRadius: 3.25,
  interactionAnchor: point(x, 1.15, z),
  authoredPlacement: true,
  acceptsRawCoordinates: false
});

export const EON_EXPANSE_W768A_RESIDENT_SLOTS = freeze([
  residentSlot('resident-pathfinder', 'pathfinder', 'Pathfinder Station', -11, -8, Math.PI / 4),
  residentSlot('resident-navigator', 'navigator', 'Navigator Station', 0, -14, 0),
  residentSlot('resident-maintenance-specialist', 'maintenance-specialist', 'Maintenance Station', 11, -8, -Math.PI / 4),
  residentSlot('resident-creator-master', 'creator-trade-master', 'Creator Master Station', 11, 8, -Math.PI * 0.75),
  residentSlot('resident-vault-steward', 'vault-steward', 'Vault Steward Station', 0, 14, Math.PI),
  residentSlot('resident-eon-architect', 'eon-architect', 'EON Architect Station', -11, 8, Math.PI * 0.75)
]);

export function createEonExpanseW768AMyFrontierLayoutContract() {
  return freeze({
    schema: EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA,
    plots: EON_EXPANSE_W768A_MY_FRONTIER_PLOTS,
    residentSlots: EON_EXPANSE_W768A_RESIDENT_SLOTS,
    buildingCatalog: EON_EXPANSE_W768A_BUILDING_CATALOG,
    authoredPlanningGrid: true,
    rawCoordinatePlacementAllowed: false,
    oneCanonicalScene: true,
    secondEngineCreated: false,
    secondSceneCreated: false,
    secondRenderLoopCreated: false,
    privateContentStored: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

function finitePoint(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function envelopesOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function validateEonExpanseW768AMyFrontierLayoutContract(contract = {}) {
  const errors = [];
  const plots = Array.isArray(contract.plots) ? contract.plots : [];
  const residentSlots = Array.isArray(contract.residentSlots) ? contract.residentSlots : [];
  const catalog = contract.buildingCatalog && typeof contract.buildingCatalog === 'object' ? contract.buildingCatalog : {};

  if (contract.schema !== EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA) errors.push('schema-invalid');
  if (plots.length !== 7 || new Set(plots.map((entry) => entry.id)).size !== 7) errors.push('seven-unique-plots-required');
  if (plots.filter((entry) => entry.district === 'central').length !== 1) errors.push('one-central-plot-required');
  if (residentSlots.length !== 6 || new Set(residentSlots.map((entry) => entry.id)).size !== 6 || new Set(residentSlots.map((entry) => entry.residentId)).size !== 6) errors.push('six-unique-resident-slots-required');

  for (const entry of plots) {
    if (!entry?.id || !entry?.district || !finitePoint(entry.position) || !finitePoint(entry.entranceAnchor) || !finitePoint(entry.roadAnchor) || !finitePoint(entry.interactionAnchor)) errors.push(`plot-geometry-invalid:${entry?.id || 'unknown'}`);
    if (entry.authoredPlacement !== true || entry.acceptsRawCoordinates !== false) errors.push(`plot-authority-invalid:${entry?.id || 'unknown'}`);
    if (!Array.isArray(entry.allowedBuildingIds) || entry.allowedBuildingIds.length < 1 || new Set(entry.allowedBuildingIds).size !== entry.allowedBuildingIds.length) errors.push(`plot-catalog-invalid:${entry?.id || 'unknown'}`);
    if (!entry.maxFootprint || !Number.isFinite(entry.maxFootprint.width) || !Number.isFinite(entry.maxFootprint.depth) || !Number.isFinite(entry.maxFootprint.height)) errors.push(`plot-footprint-invalid:${entry?.id || 'unknown'}`);
    for (const buildingId of entry.allowedBuildingIds || []) {
      const choice = catalog[buildingId];
      if (!choice || choice.district !== entry.district) errors.push(`building-district-invalid:${entry?.id || 'unknown'}:${buildingId}`);
      else if (choice.footprint.width > entry.maxFootprint.width || choice.footprint.depth > entry.maxFootprint.depth || choice.footprint.height > entry.maxFootprint.height) errors.push(`building-footprint-exceeds-plot:${entry.id}:${buildingId}`);
    }
    if (entry.requiredBuildingId && !entry.allowedBuildingIds.includes(entry.requiredBuildingId)) errors.push(`required-building-invalid:${entry.id}`);
  }

  for (let index = 0; index < plots.length; index += 1) {
    for (let other = index + 1; other < plots.length; other += 1) {
      if (envelopesOverlap(plots[index]?.collisionEnvelope || {}, plots[other]?.collisionEnvelope || {})) errors.push(`plot-collision:${plots[index]?.id || index}:${plots[other]?.id || other}`);
    }
  }

  for (const slot of residentSlots) {
    if (!slot?.id || !slot?.residentId || !finitePoint(slot.position) || !finitePoint(slot.interactionAnchor) || slot.authoredPlacement !== true || slot.acceptsRawCoordinates !== false) errors.push(`resident-slot-invalid:${slot?.id || 'unknown'}`);
  }

  if (!contract.authoredPlanningGrid || contract.rawCoordinatePlacementAllowed || !contract.oneCanonicalScene || contract.secondEngineCreated || contract.secondSceneCreated || contract.secondRenderLoopCreated) errors.push('runtime-authority-invalid');
  if (contract.privateContentStored || contract.publicLandCreated || contract.tradablePropertyCreated) errors.push('product-boundary-invalid');

  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    plotCount: plots.length,
    residentSlotCount: residentSlots.length,
    buildingCount: Object.keys(catalog).length
  });
}

export function getEonExpanseW768AMyFrontierLayoutTruth() {
  return freeze({
    schema: EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA,
    fixedAuthoredPlots: true,
    userChoosesApprovedBuildingIdsOnly: true,
    rawCoordinatePlacementAllowed: false,
    collisionSafeByContract: true,
    privateContentStored: false,
    publicLandCreated: false,
    tradablePropertyCreated: false,
    oneCanonicalScene: true
  });
}

export default freeze({
  EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA,
  EON_EXPANSE_W768A_BUILDING_CATALOG,
  EON_EXPANSE_W768A_MY_FRONTIER_PLOTS,
  EON_EXPANSE_W768A_RESIDENT_SLOTS,
  createEonExpanseW768AMyFrontierLayoutContract,
  validateEonExpanseW768AMyFrontierLayoutContract,
  getEonExpanseW768AMyFrontierLayoutTruth
});

/**
 * W666B — complete EON City asset-to-function authority.
 *
 * Every shipped W649 character, prop and landmark receives one truthful role.
 * A role may open an existing City panel or prepare an existing same-origin
 * product route. It never starts work, travel, checkout, voice or sharing by
 * proximity alone.
 */
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W659G_NPC_OPERATORS } from '../w659g/eon-city-w659g-npc-operator-registry.js';

export const EON_CITY_W666_ASSET_FUNCTION_SCHEMA = 'eon.city.w666.asset-function-registry.v1';
const freeze = (value) => Object.freeze(value);

const action = (id, label, { panel = '', route = '', purpose = '' } = {}) => freeze({
  id,
  label,
  panel,
  route,
  purpose,
  reviewRequired: true,
  explicitUserAction: true,
  autoExecute: false,
  autoNavigate: false,
  privateDataRead: false
});

const operatorBindings = new Map();
for (const operator of EON_CITY_W659G_NPC_OPERATORS) {
  for (const assetId of [operator.assetId, ...(operator.fallbackAssetIds || [])].filter(Boolean)) {
    operatorBindings.set(assetId, freeze({
      schema: EON_CITY_W666_ASSET_FUNCTION_SCHEMA,
      assetId,
      label: operator.label,
      role: operator.role,
      purpose: operator.prompt,
      districtId: operator.districtId,
      interactionKind: 'npc',
      interactionRadius: operator.interactionRadius,
      operatorId: operator.id,
      operatorPreferred: true,
      actions: operator.actions,
      reviewFirst: true,
      localOnly: true
    }));
  }
}

const explicit = freeze({
  'eoncity-pathfinder-prime-11clips': freeze({
    label: 'Pathfinder Prime', role: 'playable-avatar', districtId: 'all-districts', interactionKind: 'player-avatar', interactionRadius: 0,
    purpose: 'Primary controllable City avatar with verified movement and animation states.',
    actions: freeze([action('avatar-city-menu', 'Open City Menu', { panel: 'city-menu', purpose: 'Review City tools and destinations.' }), action('avatar-progress', 'Review City progress', { panel: 'missions-rewards', purpose: 'Review verified missions and rewards.' })])
  }),
  'eoncity-pathfinder-a-vanguard-6clips': freeze({
    label: 'Pathfinder A Vanguard', role: 'alternate-playable-avatar', districtId: 'all-districts', interactionKind: 'player-avatar', interactionRadius: 0,
    purpose: 'Fallback controllable Pathfinder and alternate animation-compatible avatar.',
    actions: freeze([action('vanguard-city-menu', 'Open City Menu', { panel: 'city-menu', purpose: 'Review City tools and destinations.' }), action('vanguard-projects', 'Open Projects', { route: '/projects', purpose: 'Create or resume a project.' })])
  }),
  'eoncity-eonbot-orbit': freeze({
    label: 'EONBOT Companion', role: 'companion', districtId: 'all-districts', interactionKind: 'companion', interactionRadius: 3.4,
    purpose: 'The same EONBOT conversation and work companion across EONAPP and City.',
    actions: freeze([action('eonbot-open', 'Work with EONBOT', { panel: 'eonbot', purpose: 'Open the in-City EONBOT surface.' }), action('eonbot-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Review the same project, task, approval and result state.' })])
  }),
  'eoncity-eonbot-charging-station': freeze({
    label: 'EONBOT Charging Station', role: 'companion-dock', districtId: 'creator-atrium', interactionKind: 'companion-dock', interactionRadius: 3.2,
    purpose: 'A functional EONBOT dock for companion work, status and Nexus continuity.',
    actions: freeze([action('dock-eonbot', 'Open EONBOT', { panel: 'eonbot', purpose: 'Work with EONBOT without starting voice automatically.' }), action('dock-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Review live Nexus continuity.' })])
  }),

  'eoncity-orientation-hall': freeze({
    label: 'Orientation Hall', role: 'orientation-anchor', districtId: 'orientation-hall', interactionKind: 'landmark', interactionRadius: 5.2,
    purpose: 'The first-run City anchor for guidance, missions and district orientation.',
    actions: freeze([action('orientation-guide', 'Open City Menu', { panel: 'city-menu', purpose: 'Review the first-run guide and City tools.' }), action('orientation-missions', 'Review next mission', { panel: 'missions-rewards', purpose: 'Review verified mission progress.' })])
  }),
  'eoncity-nav-info-kiosk': freeze({
    label: 'Navigation Information Kiosk', role: 'wayfinding-terminal', districtId: 'orientation-hall', interactionKind: 'landmark', interactionRadius: 3.2,
    purpose: 'A compact wayfinding point for district travel and help.',
    actions: freeze([action('nav-districts', 'Open District Map', { panel: 'travel-map', purpose: 'Review district destinations before travel.' }), action('nav-help', 'Open Help', { route: '/help', purpose: 'Review City controls and product guidance.' })])
  }),
  'eoncity-district-info': freeze({
    label: 'District Information Marker', role: 'district-information', districtId: 'orientation-hall', interactionKind: 'landmark', interactionRadius: 3.1,
    purpose: 'Explains the current district and opens reviewed navigation.',
    actions: freeze([action('district-info-map', 'Review Districts', { panel: 'travel-map', purpose: 'Review the authored Core districts.' }), action('district-info-city', 'Open City Menu', { panel: 'city-menu', purpose: 'Review available City functions.' })])
  }),
  'eoncity-ascension-portal': freeze({
    label: 'Ascension Portal', role: 'living-nexus-gateway', districtId: 'orientation-hall', interactionKind: 'portal', interactionRadius: 3.8,
    purpose: 'The physical gateway from the handcrafted Core into the Living Nexus and Expanse.',
    actions: freeze([action('portal-living-nexus', 'Open Living Nexus', { panel: 'living-nexus', purpose: 'Review Core, Expanse and Realm destinations.' }), action('portal-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Review the same intelligence state before entering the world.' })])
  }),

  'eoncity-command-chair': freeze({
    label: 'Creator Command Seat', role: 'creator-command-workstation', districtId: 'creator-atrium', interactionKind: 'landmark', interactionRadius: 3.0,
    purpose: 'A creator workstation for projects, workspace and capture.',
    actions: freeze([action('chair-projects', 'Open Projects', { route: '/projects', purpose: 'Create or resume project work.' }), action('chair-workspace', 'Open Workspace', { route: '/workspace', purpose: 'Continue advanced project work.' }), action('chair-capture', 'Open Creator Capture', { panel: 'creator-capture', purpose: 'Prepare local gameplay or app recording.' })])
  }),
  'eoncity-district-hologram': freeze({
    label: 'District Hologram', role: 'core-map-hologram', districtId: 'creator-atrium', interactionKind: 'landmark', interactionRadius: 3.2,
    purpose: 'A spatial Core map for district travel and Nexus continuity.',
    actions: freeze([action('hologram-districts', 'Open District Map', { panel: 'travel-map', purpose: 'Review and confirm district travel.' }), action('hologram-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Review the live intelligence field.' })])
  }),
  'eoncity-holo-map-beacon': freeze({
    label: 'Project Atlas Beacon', role: 'atlas-beacon', districtId: 'creator-atrium', interactionKind: 'landmark', interactionRadius: 3.2,
    purpose: 'Connects project continuity, Atlas and City wayfinding.',
    actions: freeze([action('atlas-projects', 'Open Projects', { route: '/projects', purpose: 'Select a project for Project Atlas.' }), action('atlas-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Open the visual intelligence field and Project Atlas.' })])
  }),

  'eoncity-forge-basilica': freeze({
    label: 'Forge Basilica', role: 'forge-district-anchor', districtId: 'forge-basilica', interactionKind: 'landmark', interactionRadius: 5.2,
    purpose: 'The authored coding and device-lab district anchor.',
    actions: freeze([action('basilica-forge', 'Open Forge', { route: '/forge', purpose: 'Continue real coding work.' }), action('basilica-local-ai', 'Open Local AI', { route: '/local-ai', purpose: 'Review device-local runtime readiness.' })])
  }),
  'eoncity-forge-workbench': freeze({
    label: 'Forge Workbench', role: 'forge-workstation', districtId: 'forge-basilica', interactionKind: 'landmark', interactionRadius: 3.2,
    purpose: 'A functional workbench for Forge and project review.',
    actions: freeze([action('workbench-forge', 'Open Forge', { route: '/forge', purpose: 'Open the Forge workflow.' }), action('workbench-projects', 'Review Projects', { route: '/projects', purpose: 'Choose the project to continue.' })])
  }),
  'eoncity-ai-tower-core': freeze({
    label: 'AI Tower Core', role: 'device-runtime-anchor', districtId: 'forge-basilica', interactionKind: 'landmark', interactionRadius: 3.6,
    purpose: 'A device and provider readiness landmark.',
    actions: freeze([action('tower-local-ai', 'Open Local AI', { route: '/local-ai', purpose: 'Inspect local runtime and model readiness.' }), action('tower-settings', 'Open Settings', { route: '/settings', purpose: 'Review provider, device and language settings.' })])
  }),

  'eoncity-navigator-arc': freeze({
    label: 'Navigator Archive Arc', role: 'archive-anchor', districtId: 'archive-canopy', interactionKind: 'landmark', interactionRadius: 4.4,
    purpose: 'A knowledge, research and recovery navigation landmark.',
    actions: freeze([action('arc-library', 'Open Library', { route: '/library', purpose: 'Review saved local knowledge.' }), action('arc-research', 'Open Research', { route: '/insights', purpose: 'Review research and uncertainty.' })])
  }),

  'eoncity-portal-gate': freeze({
    label: 'Vault Portal Gate', role: 'vault-recovery-gateway', districtId: 'vault-station', interactionKind: 'portal', interactionRadius: 3.8,
    purpose: 'A custody and recovery gateway for Vault and backup guidance.',
    actions: freeze([action('vault-gate-open', 'Open Vault', { route: '/vault', purpose: 'Review local custody, backup and recovery.' }), action('vault-gate-settings', 'Security Settings', { route: '/settings', purpose: 'Review privacy and provider settings.' })])
  }),

  'eoncity-trade-dome-entrance': freeze({
    label: 'Trade Dome Entrance', role: 'trade-district-anchor', districtId: 'trade-dome', interactionKind: 'landmark', interactionRadius: 4.6,
    purpose: 'The informational membership, collection and sharing district entrance.',
    actions: freeze([action('trade-entrance-membership', 'Review Membership', { panel: 'membership', purpose: 'Review plan status without purchasing automatically.' }), action('trade-entrance-profile', 'Open Profile', { route: '/profile', purpose: 'Review account and public profile information.' })])
  }),
  'eoncity-market-trade-terminal': freeze({
    label: 'Market and Collection Terminal', role: 'collection-preview-terminal', districtId: 'trade-dome', interactionKind: 'landmark', interactionRadius: 3.2,
    purpose: 'An informational collection and Realm Studio terminal; no trading is executed.',
    actions: freeze([action('market-preview', 'Collection Preview', { route: '/market', purpose: 'Open the informational collection preview.' }), action('market-realm-studio', 'Open Realm Studio', { route: '/realm-studio', purpose: 'Continue private Realm Studio work.' })])
  }),

  'eoncity-transit-core': freeze({
    label: 'Transit Core', role: 'district-transit-anchor', districtId: 'transit-network', interactionKind: 'transport', interactionRadius: 4.0,
    purpose: 'The explicit reviewed travel authority for the nine Core districts.',
    actions: freeze([action('transit-map', 'Open District Map', { panel: 'travel-map', purpose: 'Review destinations before travel.' }), action('transit-nexus', 'Open Living Nexus', { panel: 'living-nexus', purpose: 'Review Core and Expanse world destinations.' })])
  }),
  'eoncity-street-lamp': freeze({
    label: 'Wayfinding Street Lamp', role: 'wayfinding-beacon', districtId: 'transit-network', interactionKind: 'wayfinding', interactionRadius: 2.8,
    purpose: 'A readable wayfinding beacon that opens the reviewed district map.',
    actions: freeze([action('lamp-map', 'Open District Map', { panel: 'travel-map', purpose: 'Choose a reviewed destination.' }), action('lamp-help', 'City Controls', { route: '/help', purpose: 'Review movement and interaction controls.' })])
  }),
  'eoncity-genesis-core': freeze({
    label: 'Genesis Core', role: 'city-status-anchor', districtId: 'transit-network', interactionKind: 'landmark', interactionRadius: 4.0,
    purpose: 'A City status and Nexus continuity landmark.',
    actions: freeze([action('genesis-nexus', 'Open EON NEXUS', { panel: 'nexus', purpose: 'Review live project, task, approval and result state.' }), action('genesis-command', 'Open Command Room', { panel: 'command-room', purpose: 'Review genuine jobs and receipts.' })])
  }),

  'eoncity-holo-interface-landmark': freeze({
    label: 'Agent Theatre Interface', role: 'agent-theatre-anchor', districtId: 'agent-theatre', interactionKind: 'landmark', interactionRadius: 4.4,
    purpose: 'A truthful agent and automation receipt interface.',
    actions: freeze([action('theatre-command', 'Review Agent Theatre', { panel: 'command-room', purpose: 'Review genuine bounded job receipts.' }), action('theatre-automations', 'Open Automations', { route: '/automations', purpose: 'Review automation drafts and records.' })])
  })
});

const byId = new Map();
for (const [assetId, entry] of operatorBindings) byId.set(assetId, entry);
for (const [assetId, entry] of Object.entries(explicit)) {
  // Player and EONBOT definitions intentionally override generic operator rows;
  // resident NPC rows remain authoritative for district characters.
  if (!byId.has(assetId) || ['player-avatar', 'companion', 'companion-dock'].includes(entry.interactionKind)) {
    byId.set(assetId, freeze({ schema: EON_CITY_W666_ASSET_FUNCTION_SCHEMA, assetId, ...entry, reviewFirst: true, localOnly: true }));
  }
}

export const EON_CITY_W666_ASSET_FUNCTIONS = freeze([...byId.values()].sort((left, right) => left.assetId.localeCompare(right.assetId)));

export function getEonCityW666AssetFunction(assetId = '') {
  return byId.get(String(assetId || '').trim()) || null;
}

export function getEonCityW666AssetFunctionsForDistrict(districtId = '') {
  const id = String(districtId || '').trim();
  return freeze(EON_CITY_W666_ASSET_FUNCTIONS.filter((entry) => entry.districtId === id || entry.districtId === 'all-districts'));
}

export function validateEonCityW666AssetFunctions(entries = EON_CITY_W666_ASSET_FUNCTIONS) {
  const errors = [];
  const known = new Set([
    ...EON_CITY_W649_CHARACTER_MANIFEST.entries.map((entry) => entry.id),
    ...EON_CITY_W649_WORLD_MANIFEST.entries.map((entry) => entry.id)
  ]);
  const seen = new Set();
  for (const entry of entries || []) {
    if (!known.has(entry.assetId)) errors.push(`unknown-asset:${entry.assetId}`);
    if (seen.has(entry.assetId)) errors.push(`duplicate-asset:${entry.assetId}`);
    seen.add(entry.assetId);
    if (!entry.label || !entry.role || !entry.purpose || !entry.interactionKind) errors.push(`identity:${entry.assetId}`);
    if (!Array.isArray(entry.actions) || entry.actions.length < 1) errors.push(`actions:${entry.assetId}`);
    if (entry.actions?.some((item) => !item.id || !item.label || !item.purpose || item.reviewRequired !== true || item.explicitUserAction !== true || item.autoExecute !== false || item.autoNavigate !== false || item.privateDataRead !== false || (!item.panel && !String(item.route || '').startsWith('/')))) errors.push(`unsafe-action:${entry.assetId}`);
  }
  for (const assetId of known) if (!seen.has(assetId)) errors.push(`unassigned-asset:${assetId}`);
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    assetCount: known.size,
    assignedAssetCount: seen.size,
    characterCount: EON_CITY_W649_CHARACTER_MANIFEST.entries.length,
    worldAssetCount: EON_CITY_W649_WORLD_MANIFEST.entries.length,
    everyShippedAssetHasFunction: errors.every((entry) => !entry.startsWith('unassigned-asset:'))
  });
}

export default freeze({
  EON_CITY_W666_ASSET_FUNCTION_SCHEMA,
  EON_CITY_W666_ASSET_FUNCTIONS,
  getEonCityW666AssetFunction,
  getEonCityW666AssetFunctionsForDistrict,
  validateEonCityW666AssetFunctions
});

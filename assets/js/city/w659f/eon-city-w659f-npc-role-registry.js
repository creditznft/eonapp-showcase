/**
 * W659F/W659G — canonical, asset-bound NPC operator authority.
 *
 * Product actions are exposed only after the exact character asset and its
 * paired station/building are resident and the player is within the declared
 * radius. This registry is the single source of truth used by W659N.
 */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS } from './eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W659F_NPC_ROLE_REGISTRY_SCHEMA = 'eon.city.w659f.npc-roles.v2';
const freeze = (value) => Object.freeze(value);
const point = (x, z) => freeze({ x, z });
const action = (id, label, panel = '', route = '', purpose = '') => freeze({
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
const role = (value) => freeze({
  ...value,
  districtId: normalizeEonCityDistrictId(value.districtId),
  fallbackAssetIds: freeze([...(value.fallbackAssetIds || [])]),
  states: freeze([...(value.states || [])]),
  actions: freeze([...(value.actions || [])]),
  proximityActivation: 'asset-and-distance-bound-review-prompt',
  localOnly: true,
  autoExecute: false,
  privateDataVisible: false,
  privateDataRead: false
});

export const EON_CITY_W659F_NPC_ROLES = freeze([
  role({
    id: 'pathfinder-vanguard',
    label: 'Pathfinder Vanguard',
    assetId: 'eoncity-pathfinder-prime-11clips',
    fallbackAssetIds: ['eoncity-pathfinder-a-vanguard-6clips'],
    districtId: 'orientation-hall',
    interactionPoint: point(0, 8.8),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-orientation-hall',
    role: 'first-run-guide-and-mission-router',
    prompt: 'Talk to Pathfinder about your next verified mission.',
    productAction: 'missions-and-projects-review',
    states: ['idle', 'walk', 'run', 'wave', 'guide'],
    actions: [
      action('pathfinder-missions', 'Review next mission', 'missions-rewards', '', 'Review verified mission progress and choose the next real work route.'),
      action('pathfinder-projects', 'Open Projects', '', '/projects', 'Create or resume a project after review.')
    ]
  }),
  role({
    id: 'eonbot-companion',
    label: 'EONBOT Companion',
    assetId: 'eoncity-eonbot-orbit',
    districtId: 'creator-atrium',
    interactionPoint: point(-10.38, -5.22),
    interactionRadius: 3.2,
    nearbyStationId: 'eonbot-companion-dock',
    nearbyBuildingId: null,
    role: 'ai-conversation-and-work-companion',
    prompt: 'Use the companion dock to work with EONBOT.',
    productAction: 'eonbot-text-dictate-conversation-live-review',
    states: ['idle', 'follow', 'dock', 'speak'],
    actions: [action('eonbot-work', 'Work with EONBOT', 'eonbot', '', 'Open the in-City EONBOT work surface. Voice never starts from proximity alone.')]
  }),
  role({
    id: 'creator-mentor',
    label: 'Creator Atrium Mentor',
    assetId: 'eoncity-civilian-creator-13clips',
    districtId: 'creator-atrium',
    interactionPoint: point(-9.9, -3.1),
    interactionRadius: 3.2,
    nearbyStationId: 'creator-work-pod',
    nearbyBuildingId: null,
    role: 'creator-project-and-capture-mentor',
    prompt: 'Talk to the Creator Mentor beside the Work Pod.',
    productAction: 'projects-workspace-and-capture-review',
    states: ['idle', 'wave', 'talk', 'inspect'],
    actions: [
      action('creator-capture', 'Record gameplay', 'creator-capture', '', 'Open the local Creator Capture Studio.'),
      action('creator-projects', 'Open Projects', '', '/projects', 'Create or resume real project work.'),
      action('creator-workspace', 'Open Workspace', '', '/workspace', 'Continue work in the native Workspace.')
    ]
  }),
  role({
    id: 'forge-specialist',
    label: 'Forge Specialist',
    assetId: 'forge-device-lab-specialist-6clips',
    districtId: 'forge-basilica',
    interactionPoint: point(10.7, -2),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-ai-tower-core',
    role: 'coding-and-device-lab-specialist',
    prompt: 'Talk to the Forge Specialist beside the AI Tower Core.',
    productAction: 'forge-and-local-ai-review',
    states: ['idle', 'talk', 'open', 'inspect'],
    actions: [
      action('forge-open', 'Open Forge', '', '/forge', 'Continue real coding work in Forge.'),
      action('forge-local-ai', 'Local AI setup', '', '/local-ai', 'Review device-local AI capability and models.')
    ]
  }),
  role({
    id: 'creator-trade-master',
    label: 'Creator Trade Master',
    assetId: 'eoncity-creator-trade-6clips',
    districtId: 'trade-dome',
    interactionPoint: point(-8.7, 7.5),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-market-trade-terminal',
    role: 'trade-dome-information-steward',
    prompt: 'Talk to the Trade Master beside the Market Terminal.',
    productAction: 'realm-studio-and-collection-information-review',
    states: ['idle', 'wave', 'talk', 'open'],
    actions: [
      action('trade-realm-studio', 'Open Realm Studio', '', '/realm-studio', 'Review and continue private Realm Studio work.'),
      action('trade-collection-preview', 'Collection Preview', '', '/market', 'Open the informational collection preview. No marketplace trade is executed.')
    ]
  }),
  role({
    id: 'navigator-archive-vault',
    label: 'Navigator Archive Vault',
    assetId: 'eoncity-navigator-archive-vault-6clips',
    districtId: 'archive-canopy',
    interactionPoint: point(7.85, 10.35),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-navigator-arc',
    role: 'archive-library-and-recovery-guide',
    prompt: 'Talk to the Navigator beside the Archive Arc.',
    productAction: 'library-and-capsule-review',
    states: ['idle', 'wave', 'talk', 'guide'],
    actions: [
      action('archive-library', 'Open Library', '', '/library', 'Review saved local content.'),
      action('archive-capsule', 'Backup & recovery', '', '/capsule', 'Open encrypted Capsule tools after review.')
    ]
  }),
  role({
    id: 'agent-theatre-operator',
    label: 'Agent Theatre Operator',
    assetId: 'eoncity-holo-interface-operator-6clips',
    districtId: 'agent-theatre',
    interactionPoint: point(3.35, 2.95),
    interactionRadius: 3.2,
    nearbyStationId: 'agent-theatre-relay-console',
    nearbyBuildingId: null,
    role: 'truthful-agent-receipt-operator',
    prompt: 'Talk to the operator beside the Agent Theatre Relay Console.',
    productAction: 'agent-receipt-and-automation-review',
    states: ['idle', 'talk', 'inspect', 'open'],
    actions: [
      action('automation-drafts', 'Open Automations', '', '/automations', 'Prepare and review a workflow draft.'),
      action('automation-agents', 'Review Agent Theatre', 'command-room', '', 'Review genuine receipts without claiming unsupported execution.')
    ]
  }),
  role({
    id: 'vault-steward',
    label: 'Vault Steward',
    assetId: 'eoncity-vault-steward-6clips',
    fallbackAssetIds: ['eoncity-vault-steward-male-6clips'],
    districtId: 'vault-station',
    interactionPoint: point(6, 7.55),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-portal-gate',
    role: 'vault-reveal-and-eonkey-guide',
    prompt: 'Talk to the Vault Steward beside the Portal Gate.',
    productAction: 'vault-reveal-and-eonkey-review',
    states: ['idle', 'wave', 'talk', 'inspect'],
    actions: [
      action('vault-reveals', 'Vault Reveals', 'missions-rewards', '', 'Open earned cosmetic Reveals and collection.'),
      action('vault-eonkeys', 'EONKEY unlocks', '', '/eon-keys', 'Review server-issued keys and individual unlock choices.')
    ]
  }),
  role({
    id: 'forge-holo-operator',
    label: 'Forge Holographic Operator',
    assetId: 'eoncity-holo-interface-operator-6clips',
    districtId: 'forge-basilica',
    interactionPoint: point(9.5, -1.3),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-forge-workbench',
    role: 'forge-proposal-and-receipt-operator',
    prompt: 'Talk to the Holographic Operator beside the Forge Workbench.',
    productAction: 'forge-proposal-and-receipt-review',
    states: ['idle', 'talk', 'inspect', 'open'],
    actions: [
      action('forge-holo-open', 'Open Forge', '', '/forge', 'Open Forge and review the current coding workflow.'),
      action('forge-holo-receipts', 'Review agent receipts', 'command-room', '', 'Review only genuine bounded agent and job receipts.')
    ]
  }),
  role({
    id: 'eon-x1-maintenance-worker',
    label: 'EON X1 Maintenance Worker',
    assetId: 'eon-x1-worker-9clips',
    districtId: 'forge-basilica',
    interactionPoint: point(6.1, -4),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-forge-workbench',
    role: 'device-maintenance-and-local-ai-guide',
    prompt: 'Talk to EON X1 beside the Forge maintenance zone.',
    productAction: 'local-ai-device-and-forge-review',
    states: ['idle', 'walk', 'inspect', 'carry'],
    actions: [
      action('x1-local-ai', 'Review Local AI', '', '/local-ai', 'Inspect device-local runtime and model readiness.'),
      action('x1-forge', 'Open Forge', '', '/forge', 'Continue coding work after review.')
    ]
  }),
  role({
    id: 'vault-security-sentinel',
    label: 'Vault Security Sentinel',
    assetId: 'security-sentinel-6clips',
    districtId: 'vault-station',
    interactionPoint: point(8.9, 7.9),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-portal-gate',
    role: 'vault-safety-and-account-security-guide',
    prompt: 'Talk to the Security Sentinel beside the Vault Portal.',
    productAction: 'security-settings-and-vault-review',
    states: ['idle', 'walk', 'inspect', 'wave'],
    actions: [
      action('sentinel-settings', 'Security settings', '', '/settings', 'Review account, privacy and provider settings.'),
      action('sentinel-vault', 'Review Vault', 'missions-rewards', '', 'Review earned Reveals and EONKEY status without exposing secrets.')
    ]
  }),
  role({
    id: 'trade-citizen-guide',
    label: 'Trade Dome Citizen Guide',
    assetId: 'citizen-variant-6clips',
    districtId: 'trade-dome',
    interactionPoint: point(-5, 5.1),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-market-trade-terminal',
    role: 'collection-preview-and-sharing-guide',
    prompt: 'Talk to the Citizen Guide beside the Trade Terminal.',
    productAction: 'collection-information-and-sharing-review',
    states: ['idle', 'walk', 'talk', 'wave'],
    actions: [
      action('citizen-collection', 'Collection Preview', '', '/market', 'Open the informational collection preview; no trade is executed.'),
      action('citizen-share', 'Sharing Center', 'share-center', '', 'Prepare a public-safe invite or gameplay sharing handoff.')
    ]
  }),
  role({
    id: 'architect-sovereign',
    label: 'EON Architect Sovereign',
    assetId: 'eoncity-eon-architect-12clips',
    districtId: 'orientation-hall',
    interactionPoint: point(-1.8, 8.8),
    interactionRadius: 3.2,
    nearbyStationId: null,
    nearbyBuildingId: 'eoncity-orientation-hall',
    role: 'orientation-mastery-and-membership-guide',
    prompt: 'Talk to the Architect inside Orientation Hall.',
    productAction: 'city-mastery-and-membership-review',
    states: ['idle', 'wave', 'talk', 'guide'],
    actions: [
      action('architect-missions', 'City mastery missions', 'missions-rewards', '', 'Review always-available progression routes.'),
      action('architect-membership', 'Membership benefits', 'membership', '', 'Review plan status and hosted checkout choices without auto-purchase.')
    ]
  })
]);

const byId = new Map(EON_CITY_W659F_NPC_ROLES.map((entry) => [entry.id, entry]));

export function getEonCityW659fNpcRole(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function getEonCityW659fNpcRolesForDistrict(districtId = '') {
  const id = normalizeEonCityDistrictId(districtId);
  return freeze(EON_CITY_W659F_NPC_ROLES.filter((entry) => !id || entry.districtId === id));
}

export function getEonCityW659fNpcRoleCoverage(entries = EON_CITY_W659F_NPC_ROLES) {
  const effectiveCharacterAssetIds = EON_CITY_W649_CHARACTER_MANIFEST.entries
    .filter((entry) => entry.lifecycle === 'active' && !EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS.has(entry.id))
    .map((entry) => entry.id);
  const coveredAssetIds = new Set();
  for (const entry of entries || []) {
    if (entry.assetId) coveredAssetIds.add(entry.assetId);
    for (const fallbackId of entry.fallbackAssetIds || []) coveredAssetIds.add(fallbackId);
  }
  const missingAssetIds = effectiveCharacterAssetIds.filter((assetId) => !coveredAssetIds.has(assetId));
  return freeze({
    ok: missingAssetIds.length === 0,
    effectiveCharacterAssetIds: freeze(effectiveCharacterAssetIds),
    coveredAssetIds: freeze(effectiveCharacterAssetIds.filter((assetId) => coveredAssetIds.has(assetId))),
    missingAssetIds: freeze(missingAssetIds),
    effectiveCharacterCount: effectiveCharacterAssetIds.length,
    coveredCharacterCount: effectiveCharacterAssetIds.length - missingAssetIds.length,
    roleCount: entries?.length || 0
  });
}

export function validateEonCityW659fNpcRoles(entries = EON_CITY_W659F_NPC_ROLES) {
  const errors = [];
  const ids = new Set();
  for (const entry of entries || []) {
    if (!entry.id || ids.has(entry.id)) errors.push(`id:${entry.id || 'missing'}`);
    ids.add(entry.id);
    if (!entry.assetId || !entry.districtId || !entry.role || !entry.prompt || !entry.productAction) errors.push(`identity:${entry.id}`);
    if (![entry.interactionPoint?.x, entry.interactionPoint?.z, entry.interactionRadius].every(Number.isFinite) || entry.interactionRadius <= 0) errors.push(`proximity:${entry.id}`);
    if (Boolean(entry.nearbyStationId) === Boolean(entry.nearbyBuildingId)) errors.push(`pairing:${entry.id}`);
    if (entry.states.length < 2 || entry.actions.length < 1) errors.push(`role:${entry.id}`);
    if (entry.actions.some((item) => item.autoExecute || item.autoNavigate || item.privateDataRead || item.reviewRequired !== true)) errors.push(`unsafe-action:${entry.id}`);
    if (entry.autoExecute || entry.privateDataVisible || entry.privateDataRead) errors.push(`unsafe:${entry.id}`);
  }
  const coverage = getEonCityW659fNpcRoleCoverage(entries);
  if (!coverage.ok) errors.push(...coverage.missingAssetIds.map((assetId) => `unbound-character:${assetId}`));
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    count: ids.size,
    roleCount: ids.size,
    effectiveCharacterCount: coverage.effectiveCharacterCount,
    coveredCharacterCount: coverage.coveredCharacterCount,
    missingAssetIds: coverage.missingAssetIds,
    schema: EON_CITY_W659F_NPC_ROLE_REGISTRY_SCHEMA
  });
}

/**
 * W655 — executive EONCITY experience and real-work terminal contract.
 *
 * Persisted W649 runtime IDs stay stable. Product roles, review-first work
 * terminals, district purpose and visual evidence requirements are explicit.
 * No terminal executes work, sends a message, runs an automation, publishes,
 * pays, or reads private content without a separate native EONAPP review.
 */
export const EON_CITY_W655_EXPERIENCE_SCHEMA = 'eon.city.experience.w655.v1';
const freeze = (value) => Object.freeze(value);
const action = ({ id, label, route = null, panel = null, purpose, informationalOnly = false }) => freeze({
  id, label, kind: route ? 'route' : 'city-panel', route, panel, purpose,
  reviewRequired: true, explicitOpenRequired: true, autoExecute: false,
  sendsMessage: false, runsAutomation: false, publishes: false, financialAction: false,
  informationalOnly, localSelectionOnly: true
});
const terminal = ({ id, districtId, label, route = null, panel = null, workType, playValue, evidence }) => freeze({
  id, districtId, label, route, panel, workType, playValue, evidence,
  opensNativeSurface: Boolean(route), reviewRequired: true, explicitOpenRequired: true,
  performsWorkInsideRenderer: false, autoExecute: false, privateDataInWorldTexture: false
});

export const EON_CITY_W655_DISTRICT_EXPERIENCE = freeze({
  'orientation-hall': freeze({ displayName: 'Orientation Hall', canonicalRole: 'onboarding', primarySurface: '/help', productivity: 'Learn controls and choose a useful destination.', entertainment: 'Arrival, guided discovery and first-circuit orientation.', legacyRuntimeIdStable: true }),
  'creator-atrium': freeze({ displayName: 'Creator Atrium', canonicalRole: 'projects-workspace', primarySurface: '/projects', productivity: 'Continue projects, create work and open Workspace.', entertainment: 'Creator companion, command chair and living project identity.', legacyRuntimeIdStable: true }),
  'forge-basilica': freeze({ displayName: 'Forge Bay', canonicalRole: 'build-and-device-lab', primarySurface: '/forge', productivity: 'Review AI build proposals and open the coding workspace.', entertainment: 'Animated worker team and visible build machinery.', legacyRuntimeIdStable: true }),
  'archive-canopy': freeze({ displayName: 'Knowledge Archive', canonicalRole: 'library-research', primarySurface: '/library', productivity: 'Find saved knowledge and turn it into a work brief.', entertainment: 'Navigator guide and archive discovery.', legacyRuntimeIdStable: true }),
  'vault-station': freeze({ displayName: 'Local AI Observatory', canonicalRole: 'local-ai-with-vault-boundary', primarySurface: '/local-ai', productivity: 'Choose and test a local runtime, then explicitly open Vault when needed.', entertainment: 'Device specialist, sentinel and protected portal staging.', legacyRuntimeIdStable: true, ceoDecision: 'Local AI is primary at the eastern destination; Vault remains explicit and secondary.' }),
  'trade-dome': freeze({ displayName: 'Realm Relay', canonicalRole: 'private-realm-and-creative-exchange', primarySurface: '/realm-studio', productivity: 'Open the private local Realm Studio and shape a personal City identity.', entertainment: 'Realm gateway, creator presence and optional non-transactional collection preview.', legacyRuntimeIdStable: true, ceoDecision: 'Realm is primary at the western destination; Market stays informational and secondary.' }),
  'transit-network': freeze({ displayName: 'Transit Network', canonicalRole: 'navigation', primarySurface: 'travel-map', productivity: 'Choose an accessible destination without hidden navigation.', entertainment: 'Fast-travel fiction, street rhythm and city circulation.', legacyRuntimeIdStable: true }),
  'agent-theatre': freeze({ displayName: 'Agent Theater', canonicalRole: 'automation-evidence', primarySurface: '/automations', productivity: 'Inspect receipt-backed automation and agent states.', entertainment: 'Visible agent activity without fabricated completion.', legacyRuntimeIdStable: true })
});

export const EON_CITY_W655_DISTRICT_ACTIONS = freeze({
  'orientation-hall': freeze([
    action({ id: 'start-here', label: 'Start Here', route: '/help', purpose: 'Open help and controls.' }),
    action({ id: 'device-guidance', label: 'Device guidance', route: '/local-ai', purpose: 'Open device guidance without starting a probe.' })
  ]),
  'creator-atrium': freeze([
    action({ id: 'continue-project', label: 'Continue project', route: '/projects', purpose: 'Choose a project to continue.' }),
    action({ id: 'workspace', label: 'Workspace', route: '/workspace', purpose: 'Open the workspace home.' }),
    action({ id: 'command-deck', label: 'Command Room', panel: 'command-room', purpose: 'Return to the in-City control workspace.' })
  ]),
  'forge-basilica': freeze([
    action({ id: 'forge', label: 'Open EON Forge', route: '/forge', purpose: 'Open Forge after review.' }),
    action({ id: 'device-lab', label: 'Device Lab', route: '/local-ai', purpose: 'Open Local AI setup after review.' })
  ]),
  'archive-canopy': freeze([
    action({ id: 'library', label: 'Library', route: '/library', purpose: 'Open saved knowledge.' }),
    action({ id: 'workspace', label: 'Workspace brief', route: '/workspace', purpose: 'Open Workspace to continue useful work.' })
  ]),
  'vault-station': freeze([
    action({ id: 'local-ai', label: 'Local AI Observatory', route: '/local-ai', purpose: 'Open the simple Local AI setup. After the user taps setup, EON may run bounded checks of approved local runtimes and Local Lite without a silent cloud fallback.' }),
    action({ id: 'vault', label: 'Vault', route: '/vault', purpose: 'Open the separate Vault surface.' }),
    action({ id: 'settings', label: 'Settings', route: '/settings', purpose: 'Open account and application settings.' })
  ]),
  'trade-dome': freeze([
    action({ id: 'realm-studio', label: 'Realm Studio', route: '/realm-studio', purpose: 'Open the private local Realm Studio without publishing.' }),
    action({ id: 'studio-collection-information', label: 'Studio / Collection preview', route: '/market', purpose: 'Open the non-transactional informational collection surface.', informationalOnly: true })
  ]),
  'transit-network': freeze([
    action({ id: 'accessible-route-list', label: 'District Map', panel: 'travel-map', purpose: 'Open the visible route list without automatic travel.' })
  ]),
  'agent-theatre': freeze([
    action({ id: 'receipt-backed-agent-states', label: 'Automation receipts', route: '/automations', purpose: 'Open evidence-backed automation state.' })
  ])
});

export const EON_CITY_W655_REAL_WORK_TERMINALS = freeze([
  terminal({ id: 'command-eonbot', districtId: 'command-room', label: 'EONBOT Console', route: '/', workType: 'conversation', playValue: 'Guide companion', evidence: 'review-panel-and-native-chat' }),
  terminal({ id: 'creator-projects', districtId: 'creator-atrium', label: 'Project Continuation Terminal', route: '/projects', workType: 'project-lifecycle', playValue: 'Continue quest-like work', evidence: 'review-panel-and-route' }),
  terminal({ id: 'creator-workspace', districtId: 'creator-atrium', label: 'Workspace Desk', route: '/workspace', workType: 'planning-and-artifacts', playValue: 'Command chair interaction', evidence: 'review-panel-and-route' }),
  terminal({ id: 'forge-builder', districtId: 'forge-basilica', label: 'Forge Workbench', route: '/forge', workType: 'code-and-app-building', playValue: 'Animated build team', evidence: 'review-panel-and-route' }),
  terminal({ id: 'archive-library', districtId: 'archive-canopy', label: 'Knowledge Terminal', route: '/library', workType: 'knowledge-retrieval', playValue: 'Archive discovery', evidence: 'review-panel-and-route' }),
  terminal({ id: 'local-ai-device', districtId: 'vault-station', label: 'Local AI Device Console', route: '/local-ai', workType: 'local-model-setup', playValue: 'Device specialist interaction', evidence: 'review-panel-and-route' }),
  terminal({ id: 'vault-security', districtId: 'vault-station', label: 'Vault Boundary Console', route: '/vault', workType: 'custody-and-secrets', playValue: 'Sentinel gate', evidence: 'review-panel-and-route' }),
  terminal({ id: 'realm-studio', districtId: 'trade-dome', label: 'Realm Relay', route: '/realm-studio', workType: 'private-realm-design', playValue: 'Personal realm identity', evidence: 'review-panel-and-route' }),
  terminal({ id: 'collection-preview', districtId: 'trade-dome', label: 'Collection Preview', route: '/market', workType: 'informational-preview', playValue: 'Creative exchange', evidence: 'review-panel-informational-only' }),
  terminal({ id: 'agent-automation', districtId: 'agent-theatre', label: 'Automation Receipt Console', route: '/automations', workType: 'automation-review', playValue: 'Agent theater', evidence: 'receipt-backed-state-and-route' }),
  terminal({ id: 'transit-map', districtId: 'transit-network', label: 'District Map Beacon', panel: 'travel-map', workType: 'navigation', playValue: 'Fast-travel planning', evidence: 'visible-map-panel' })
]);

export const EON_CITY_W655_WORLD_DENSITY = freeze({
  streetLightsByQuality: freeze({ lite: 6, balanced: 11, cinematic: 16 }),
  minimumRealWorkTerminals: 10,
  minimumDistinctNativeRoutes: 9,
  maxResidentBinaryDistricts: 1,
  repeatLowCostProceduralProps: true,
  repeatHighPolyCharacters: false,
  distantPopulationMayUseProceduralSilhouettes: true
});

export function getEonCityW655DistrictExperience(districtId = '') {
  return EON_CITY_W655_DISTRICT_EXPERIENCE[String(districtId || '').trim()] || null;
}
export function getEonCityW655DistrictActions(districtId = '') {
  return EON_CITY_W655_DISTRICT_ACTIONS[String(districtId || '').trim()] || freeze([]);
}
export function validateEonCityW655Experience({ canonicalRoutes = [] } = {}) {
  const routes = new Set(canonicalRoutes);
  const errors = [];
  const districtIds = Object.keys(EON_CITY_W655_DISTRICT_EXPERIENCE);
  for (const id of districtIds) {
    if (!EON_CITY_W655_DISTRICT_ACTIONS[id]?.length) errors.push(`missing-actions:${id}`);
    if (!EON_CITY_W655_DISTRICT_EXPERIENCE[id]?.productivity || !EON_CITY_W655_DISTRICT_EXPERIENCE[id]?.entertainment) errors.push(`missing-purpose:${id}`);
  }
  const terminals = EON_CITY_W655_REAL_WORK_TERMINALS;
  const nativeRoutes = new Set();
  for (const item of terminals) {
    if (!item.reviewRequired || item.autoExecute || item.performsWorkInsideRenderer) errors.push(`unsafe-terminal:${item.id}`);
    if (item.route) {
      nativeRoutes.add(item.route);
      if (routes.size && !routes.has(item.route)) errors.push(`unknown-route:${item.id}:${item.route}`);
    }
  }
  if (terminals.length < EON_CITY_W655_WORLD_DENSITY.minimumRealWorkTerminals) errors.push('terminal-density');
  if (nativeRoutes.size < EON_CITY_W655_WORLD_DENSITY.minimumDistinctNativeRoutes) errors.push('route-coverage');
  if (getEonCityW655DistrictActions('trade-dome')[0]?.route !== '/realm-studio') errors.push('realm-not-primary');
  if (getEonCityW655DistrictActions('vault-station')[0]?.route !== '/local-ai') errors.push('local-ai-not-primary');
  return freeze({ schema: EON_CITY_W655_EXPERIENCE_SCHEMA, ok: errors.length === 0, errors: freeze(errors), districtCount: districtIds.length, terminalCount: terminals.length, nativeRouteCount: nativeRoutes.size, productionVisualProofPending: true });
}

/** W660F/W660I — one visible, review-first EON NEXUS station per City district. */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { getEonCityW660iDistrictConfig } from '../w660i/eon-city-w660i-district-config.js';

export const EON_CITY_W660_NEXUS_STATION_SCHEMA = 'eon.city.w660.nexus-stations.v2';
export const EON_CITY_W660_NEXUS_INTERACTION_RADIUS = 2.8;
export const EON_CITY_W660_NEXUS_DISTRICT_IDS = Object.freeze([
  'orientation-hall',
  'transit-network',
  'agent-theatre',
  'creator-atrium',
  'forge-basilica',
  'command-centre',
  'archive-canopy',
  'vault-station',
  'trade-dome'
]);

const freeze = (value) => Object.freeze(value);
const orientationArrival = getEonCityW660iDistrictConfig('orientation-hall')?.arrival || freeze({ x: 0, y: 0, z: 5.35 });
const position = (x, z, y = 0) => freeze({ x, y, z });
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
const station = (value) => freeze({
  ...value,
  districtId: normalizeEonCityDistrictId(value.districtId),
  position: position(value.position.x, value.position.z, value.position.y || 0),
  actions: freeze([...(value.actions || [])]),
  interactionRadius: Number(value.interactionRadius || EON_CITY_W660_NEXUS_INTERACTION_RADIUS),
  localOnly: true,
  privacyProjected: true,
  ownsConversation: false,
  ownsProjectStore: false,
  ownsRenderLoop: false
});

export const EON_CITY_W660_NEXUS_STATIONS = freeze([
  station({
    id: 'orientation-nexus-guide',
    label: 'Orientation Nexus Guide',
    districtId: 'orientation-hall',
    position: { x: orientationArrival.x + 1.25, z: orientationArrival.z + 1.25 },
    purpose: 'first-run-state-and-mission-guide',
    actions: [
      action('nexus-orientation-missions', 'Review next mission', { panel: 'missions-rewards', purpose: 'Review verified City progress and the next available mission.' }),
      action('nexus-orientation-projects', 'Open Projects', { route: '/projects', purpose: 'Choose or resume a real project after review.' })
    ]
  }),
  station({
    id: 'transit-nexus',
    label: 'Transit Nexus',
    districtId: 'transit-network',
    position: { x: 0.75, z: 1.35 },
    purpose: 'district-travel-and-arrival-status',
    actions: [
      action('nexus-transit-map', 'Choose a district', { panel: 'travel-map', purpose: 'Review and separately confirm local district travel.' }),
      action('nexus-transit-missions', 'Review missions', { panel: 'missions-rewards', purpose: 'Review verified district-arrival and exploration progress.' })
    ]
  }),
  station({
    id: 'agent-theatre-nexus',
    label: 'Agent Theatre Nexus',
    districtId: 'agent-theatre',
    position: { x: 4.65, z: 1.55 },
    purpose: 'agent-receipt-and-approval-status',
    actions: [
      action('nexus-agent-review', 'Review agent receipts', { panel: 'command-room', purpose: 'Inspect observed task and agent states without fabricated progress.' }),
      action('nexus-agent-automations', 'Open Automations', { route: '/automations', purpose: 'Review upcoming, waiting, successful or failed automation records.' })
    ]
  }),
  station({
    id: 'creator-command-nexus',
    label: 'Creator Command Nexus',
    districtId: 'creator-atrium',
    position: { x: -8.4, z: -3.6 },
    purpose: 'creator-capture-and-sharing-guide',
    actions: [
      action('nexus-creator-capture', 'Creator Capture', { panel: 'creator-capture', purpose: 'Open local gameplay recording with optional microphone and facecam.' }),
      action('nexus-creator-share', 'Sharing Center', { panel: 'share-center', purpose: 'Prepare a public-safe gameplay or signed invite handoff.' })
    ]
  }),
  station({
    id: 'forge-workflow-nexus',
    label: 'Forge Workflow Nexus',
    districtId: 'forge-basilica',
    position: { x: 7.5, z: -2.6 },
    purpose: 'forge-stage-and-local-ai-route',
    actions: [
      action('nexus-forge-open', 'Open Forge', { route: '/forge', purpose: 'Review the current seven-stage Forge workflow.' }),
      action('nexus-forge-local-ai', 'Review Local AI', { route: '/local-ai', purpose: 'Inspect the selected local or hosted AI route without changing it.' })
    ]
  }),
  station({
    id: 'command-status-nexus',
    label: 'Command Status Nexus',
    districtId: 'command-centre',
    position: { x: -0.2, z: -6.8 },
    purpose: 'whole-city-status-and-review-inbox',
    actions: [
      action('nexus-command-receipts', 'Review Agent Theatre', { panel: 'command-room', purpose: 'Review only genuine jobs, receipts and supported controls.' }),
      action('nexus-command-share', 'Sharing Center', { panel: 'share-center', purpose: 'Prepare a signed invite or public-safe gameplay share.' })
    ]
  }),
  station({
    id: 'project-workstation-nexus',
    label: 'Archive Project Nexus',
    districtId: 'archive-canopy',
    position: { x: 8.9, z: 9.0 },
    purpose: 'library-research-and-project-continuity',
    actions: [
      action('nexus-archive-library', 'Open Library', { route: '/library', purpose: 'Review saved knowledge and public-safe library state.' }),
      action('nexus-archive-projects', 'Open Projects', { route: '/projects', purpose: 'Continue the selected project from its native project surface.' })
    ]
  }),
  station({
    id: 'vault-status-nexus',
    label: 'Vault Status Nexus',
    districtId: 'vault-station',
    position: { x: 6.55, z: 6.25 },
    purpose: 'secure-vault-and-eonkey-status',
    actions: [
      action('nexus-vault-reveals', 'Vault Reveals', { panel: 'missions-rewards', purpose: 'Review earned cosmetic Reveals and EONKEY status without reading secrets.' }),
      action('nexus-vault-keys', 'Open EONKEYs', { route: '/eon-keys', purpose: 'Review server-issued feature unlocks.' })
    ]
  }),
  station({
    id: 'eonbot-dock-nexus',
    label: 'Trade Membership Nexus',
    districtId: 'trade-dome',
    position: { x: -6.65, z: 5.9 },
    purpose: 'membership-plan-referral-and-eonkey-guide',
    actions: [
      action('nexus-trade-membership', 'Review Membership', { panel: 'membership', purpose: 'Review the current server-backed plan and available plan paths without starting checkout.' }),
      action('nexus-trade-keys', 'Open EONKEYs', { route: '/eon-keys', purpose: 'Review non-crypto product unlocks and earned status.' })
    ]
  })
]);

const byId = new Map(EON_CITY_W660_NEXUS_STATIONS.map((entry) => [entry.id, entry]));

export function getEonCityW660NexusStation(id = '') {
  return byId.get(String(id || '').trim()) || null;
}

export function getEonCityW660NexusStationsForDistrict(districtId = '') {
  const id = normalizeEonCityDistrictId(districtId);
  return freeze(EON_CITY_W660_NEXUS_STATIONS.filter((entry) => !id || entry.districtId === id));
}

export function validateEonCityW660NexusStations(entries = EON_CITY_W660_NEXUS_STATIONS) {
  const errors = [];
  const ids = new Set();
  const districtCounts = new Map(EON_CITY_W660_NEXUS_DISTRICT_IDS.map((id) => [id, 0]));
  for (const entry of entries || []) {
    if (!entry.id || ids.has(entry.id)) errors.push(`id:${entry.id || 'missing'}`);
    ids.add(entry.id);
    if (!entry.label || !entry.districtId || !entry.purpose) errors.push(`identity:${entry.id}`);
    if (![entry.position?.x, entry.position?.y, entry.position?.z, entry.interactionRadius].every(Number.isFinite)) errors.push(`position:${entry.id}`);
    if (!entry.actions.length) errors.push(`actions:${entry.id}`);
    if (entry.actions.some((item) => !item.reviewRequired || item.autoExecute || item.autoNavigate || item.privateDataRead)) errors.push(`unsafe-action:${entry.id}`);
    if (entry.ownsConversation || entry.ownsProjectStore || entry.ownsRenderLoop || !entry.privacyProjected) errors.push(`ownership:${entry.id}`);
    if (!districtCounts.has(entry.districtId)) errors.push(`unknown-district:${entry.id}:${entry.districtId}`);
    else districtCounts.set(entry.districtId, districtCounts.get(entry.districtId) + 1);
  }
  for (const [districtId, count] of districtCounts) {
    if (count !== 1) errors.push(`district-station-count:${districtId}:${count}`);
  }
  const required = ['creator-command-nexus', 'eonbot-dock-nexus', 'forge-workflow-nexus', 'project-workstation-nexus'];
  for (const id of required) if (!ids.has(id)) errors.push(`required:${id}`);
  return freeze({
    ok: errors.length === 0 && ids.size === EON_CITY_W660_NEXUS_DISTRICT_IDS.length,
    errors: freeze(errors),
    count: ids.size,
    districtCount: districtCounts.size,
    districtIds: freeze([...districtCounts.keys()]),
    schema: EON_CITY_W660_NEXUS_STATION_SCHEMA
  });
}

export default freeze({
  EON_CITY_W660_NEXUS_STATION_SCHEMA,
  EON_CITY_W660_NEXUS_DISTRICT_IDS,
  EON_CITY_W660_NEXUS_STATIONS,
  getEonCityW660NexusStation,
  getEonCityW660NexusStationsForDistrict,
  validateEonCityW660NexusStations
});

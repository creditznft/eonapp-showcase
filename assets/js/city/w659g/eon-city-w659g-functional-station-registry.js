/** W659G — Productive City functions for the six W659F Meshy anchors. */
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { EON_CITY_W659F_FUNCTIONAL_ASSETS } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W659G_FUNCTIONAL_STATION_SCHEMA = 'eon.city.w659g.functional-stations.v1';
const freeze = (value) => Object.freeze(value);
const action = (id, label, panel = '', route = '', purpose = '') => freeze({ id, label, panel, route, purpose, reviewRequired: true, explicitUserAction: true, autoExecute: false, autoNavigate: false });

export const EON_CITY_W659G_FUNCTIONAL_STATIONS = freeze([
  freeze({
    assetId: 'transit-hub-beacon-terminal', districtId: 'transit-network', label: 'Transit Hub Beacon Terminal', operatorClass: 'navigation-and-mission-routing',
    actions: freeze([
      action('district-travel-map', 'Choose a district', 'travel-map', '', 'Review and confirm local district travel.'),
      action('open-missions-rewards', 'Active missions & rewards', 'missions-rewards', '', 'Review current Productive City missions, XP and Vault Reveal progress.')
    ])
  }),
  freeze({
    assetId: 'eonbot-companion-dock', districtId: 'creator-atrium', label: 'EONBOT Dock / Companion Station', operatorClass: 'ai-conversation-and-work',
    actions: freeze([
      action('open-eonbot', 'EONBOT Chat', 'eonbot', '', 'Use text, Dictate or Voice Conversation with the configured AI route.'),
      action('open-eonbot-live', 'Live Voice with EONBOT', 'eonbot', '', 'Open EONBOT and start audio-native Live Voice only when its realtime adapter is ready.')
    ])
  }),
  freeze({
    assetId: 'agent-theatre-relay-console', districtId: 'agent-theatre', label: 'Agent Theatre Relay Console', operatorClass: 'truthful-agent-observation',
    actions: freeze([
      action('review-agent-theatre', 'Review genuine agent receipts', 'command-room', '', 'Show only observed jobs, receipts and supported controls.'),
      action('open-agent-missions', 'Agent missions', 'missions-rewards', '', 'Review mission progress connected to genuine receipts.')
    ])
  }),
  freeze({
    assetId: 'command-signal-totem', districtId: 'command-centre', label: 'Command District Interactive Signal Totem', operatorClass: 'progression-sharing-and-command',
    actions: freeze([
      action('open-missions-rewards', 'Missions & Vault Reveals', 'missions-rewards', '', 'Review verified City progression and open earned cosmetic Reveals.'),
      action('open-share-center', 'Share & Earn Center', 'share-center', '', 'Prepare a signed invite. EONKEY qualification remains server controlled after referred Google sign-in.'),
      action('open-eonkeys', 'EONKEY feature unlocks', '', '/eon-keys', 'Review account-bound EONKEY grants and individual feature unlock choices.')
    ])
  }),
  freeze({
    assetId: 'creator-work-pod', districtId: 'creator-atrium', label: 'Creator Work Pod / Terminal Alcove', operatorClass: 'real-work-capture-sharing-membership',
    actions: freeze([
      action('open-projects', 'Projects', '', '/projects', 'Create or resume real project work.'),
      action('open-workspace', 'Workspace', '', '/workspace', 'Continue real work in the native workspace and return to City.'),
      action('open-forge', 'Forge', '', '/forge', 'Open the AI coding workspace after review.'),
      action('open-creator-capture', 'Creator Capture Studio', 'creator-capture', '', 'Record gameplay, optional mic and optional facecam locally on this device.'),
      action('open-share-center', 'Share gameplay & invite', 'share-center', '', 'Prepare a signed invite and local sharing handoff.'),
      action('open-membership', 'Membership & trial', 'membership', '', 'Review server-confirmed plan status and hosted checkout choices.')
    ])
  }),
  freeze({
    assetId: 'district-arrival-gate', districtId: 'orientation-hall', label: 'District Arrival Gate / Micro Portal', operatorClass: 'arrival-return-and-next-mission',
    actions: freeze([
      action('open-arrival-missions', 'Continue next mission', 'missions-rewards', '', 'Review the next available verified Productive City mission.'),
      action('district-travel-map', 'Open District Map', 'travel-map', '', 'Choose and separately confirm a destination.')
    ])
  })
]);

const byAsset = new Map(EON_CITY_W659G_FUNCTIONAL_STATIONS.map((entry) => [entry.assetId, entry]));
export function getEonCityW659gFunctionalStation(assetId = '') { return byAsset.get(String(assetId || '').trim()) || null; }
export function getEonCityW659gActionsForDistrict(districtId = '') {
  const id = normalizeEonCityDistrictId(districtId);
  const rows = EON_CITY_W659G_FUNCTIONAL_STATIONS.filter((entry) => !id || entry.districtId === id).flatMap((entry) => entry.actions.map((item) => freeze({ ...item, stationAssetId: entry.assetId, stationLabel: entry.label, operatorClass: entry.operatorClass })));
  const seen = new Set();
  return freeze(rows.filter((entry) => { const key = `${entry.id}:${entry.route}:${entry.panel}`; if (seen.has(key)) return false; seen.add(key); return true; }));
}
export function validateEonCityW659gFunctionalStations() {
  const sourceIds = new Set(EON_CITY_W659F_FUNCTIONAL_ASSETS.map((entry) => entry.id));
  const errors = [];
  if (EON_CITY_W659G_FUNCTIONAL_STATIONS.length !== 6) errors.push('six-functional-stations-required');
  for (const station of EON_CITY_W659G_FUNCTIONAL_STATIONS) {
    if (!sourceIds.has(station.assetId)) errors.push(`missing-w659f-asset:${station.assetId}`);
    if (!station.actions.length) errors.push(`missing-actions:${station.assetId}`);
    if (station.actions.some((entry) => entry.autoExecute || entry.autoNavigate || !entry.reviewRequired)) errors.push(`review-boundary-invalid:${station.assetId}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), stationCount: EON_CITY_W659G_FUNCTIONAL_STATIONS.length });
}

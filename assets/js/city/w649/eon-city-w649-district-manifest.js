/** W649C — district placement and lazy residency manifest. */
import { EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS } from '../w676/eon-city-w676-orientation-resident-coherence.js';
export const EON_CITY_W649_DISTRICT_MANIFEST_SCHEMA = 'eon.city.w649.districts.v1';
const freeze = (value) => Object.freeze(value);
const baseDistricts = [{"id":"bootstrap","loadTier":1,"assets":["eoncity-pathfinder-prime-11clips","eoncity-pathfinder-a-vanguard-6clips","eoncity-eonbot-orbit"],"actions":["controls","eonbot"]},{"id":"orientation-hall","loadTier":2,"assets":["eoncity-orientation-hall","eoncity-eon-architect-12clips","eoncity-nav-info-kiosk","eoncity-district-info","eoncity-ascension-portal"],"actions":["start-here","district-map","projects"]},{"id":"creator-atrium","loadTier":2,"assets":["eoncity-civilian-creator-13clips","eoncity-command-chair","eoncity-district-hologram","eoncity-holo-map-beacon","eoncity-eonbot-charging-station"],"actions":["continue-project","projects","workspace","command-deck"]},{"id":"forge-basilica","loadTier":2,"assets":["eoncity-forge-basilica","eoncity-forge-workbench","eoncity-ai-tower-core","eon-x1-worker-9clips","eoncity-holo-interface-operator-6clips","forge-device-lab-specialist-6clips"],"actions":["forge","review-ai-proposal","device-lab"]},{"id":"archive-canopy","loadTier":2,"assets":["eoncity-navigator-arc","eoncity-navigator-archive-vault-6clips"],"actions":["library","workspace"]},{"id":"vault-station","loadTier":2,"assets":["eoncity-vault-steward-6clips","eoncity-vault-steward-male-6clips","security-sentinel-6clips","eoncity-portal-gate"],"actions":["vault","receipts","settings"]},{"id":"trade-dome","loadTier":2,"assets":["eoncity-trade-dome-entrance","eoncity-market-trade-terminal","eoncity-creator-trade-6clips","citizen-variant-6clips"],"actions":["studio-collection-information"]},{"id":"transit-network","loadTier":3,"assets":["eoncity-transit-core","eoncity-street-lamp","eoncity-genesis-core"],"actions":["fast-travel","accessible-route-list"]},{"id":"agent-theatre","loadTier":3,"assets":["eoncity-holo-interface-landmark","eoncity-holo-interface-operator-6clips"],"actions":["receipt-backed-agent-states"]}];
const districts = baseDistricts.map((district) => district.id === 'orientation-hall'
  ? { ...district, assets: [...new Set([...district.assets, ...EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS])] }
  : district);
export const EON_CITY_W649_DISTRICT_MANIFEST = freeze({
  schema: EON_CITY_W649_DISTRICT_MANIFEST_SCHEMA,
  version: '649.3.0',
  districts: freeze(districts.map((district) => freeze({ ...district, assets: freeze(district.assets), actions: freeze(district.actions), proximityLoad: district.id !== 'bootstrap', unloadOnExit: district.id !== 'bootstrap' }))),
  truth: freeze({ preloadAll: false, fakeActions: false, privateTextInTextures: false, financialTrading: false })
});
export function getEonCityW649District(id = '') { return EON_CITY_W649_DISTRICT_MANIFEST.districts.find((entry) => entry.id === String(id || '').trim()) || null; }
export function validateEonCityW649DistrictManifest(manifest = EON_CITY_W649_DISTRICT_MANIFEST, knownIds = new Set(["citizen-variant-6clips","eon-x1-worker-9clips","eoncity-ai-tower-core","eoncity-ascension-portal","eoncity-civilian-creator-13clips","eoncity-command-chair","eoncity-creator-trade-6clips","eoncity-district-hologram","eoncity-district-info","eoncity-eon-architect-12clips","eoncity-eonbot-charging-station","eoncity-eonbot-orbit","eoncity-forge-basilica","eoncity-forge-workbench","eoncity-genesis-core","eoncity-holo-interface-landmark","eoncity-holo-interface-operator-6clips","eoncity-holo-map-beacon","eoncity-market-trade-terminal","eoncity-nav-info-kiosk","eoncity-navigator-arc","eoncity-navigator-archive-vault-6clips","eoncity-orientation-hall","eoncity-pathfinder-a-vanguard-6clips","eoncity-pathfinder-prime-11clips","eoncity-portal-gate","eoncity-street-lamp","eoncity-trade-dome-entrance","eoncity-transit-core","eoncity-vault-steward-6clips","eoncity-vault-steward-male-6clips","forge-device-lab-specialist-6clips","security-sentinel-6clips"])) {
  const errors = [];
  if (manifest?.schema !== EON_CITY_W649_DISTRICT_MANIFEST_SCHEMA) errors.push('schema');
  if (manifest?.districts?.[0]?.id !== 'bootstrap') errors.push('bootstrap-first');
  for (const district of manifest?.districts || []) {
    for (const id of district.assets || []) if (!knownIds.has(id)) errors.push(`unknown-asset:${district.id}:${id}`);
    if (district.id !== 'bootstrap' && !district.proximityLoad) errors.push(`proximity:${district.id}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), count: manifest?.districts?.length || 0 });
}

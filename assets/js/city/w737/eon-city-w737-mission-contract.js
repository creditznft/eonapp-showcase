/**
 * Compatibility bridge for the original W737 mission-contract import path.
 * The single current mission authority lives in eon-city-w737-missions.js;
 * this file intentionally defines no second mission or discovery catalogue.
 */
export {
  EON_CITY_W737_MISSION_SCHEMA,
  EON_CITY_W737_MISSION_STORAGE_KEY,
  EON_CITY_W737_MISSIONS,
  getEonCityW737Mission,
  getEonCityW737MissionForStation,
  getEonCityW737MissionForDiscovery,
  readEonCityW737MissionState,
  writeEonCityW737MissionState,
  buildEonCityW737MissionView,
  validateEonCityW737MissionContract,
  getEonCityW737MissionTruth
} from './eon-city-w737-missions.js';

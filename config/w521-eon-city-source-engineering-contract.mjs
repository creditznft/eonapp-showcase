/** W521 — EON City source-engineering control contract. */
export const W521_EON_CITY_SOURCE_ENGINEERING_SCHEMA = 'eonapp.w521.eon-city-source-engineering.v1';

export const W521_CITY_SOURCE_FILES = Object.freeze([
  'assets/js/eon-city-play-station.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/city/eon-city-runtime-lifecycle.js',
  'assets/js/city/eon-city-performance-observation.js',
  'config/w521-eon-city-source-engineering-contract.mjs',
  'scripts/w521-eon-city-source-engineering-gate.mjs',
  'tests/unit/w521-eon-city-source-engineering.test.mjs'
]);

export const W521_ACTIVE_CITY_ENTRYPOINTS = Object.freeze([
  'assets/js/eon-city-play-station.js',
  'assets/js/eon-app-shell.js',
  'assets/js/chat/eonbot-command-hub.js',
  'assets/js/chat/eonbot-context-registry.js'
]);

export const W521_RETIRED_RENDERER_MARKERS = Object.freeze([
  'eon-city-3d-station.js',
  'eon-city-3d-renderer.js',
  'eoncity-3d.html'
]);

export const W521_BUILD_DENYLIST = Object.freeze([
  'eon-city-3d-station',
  'eon-city-3d-renderer'
]);

export const W521_TRUTH = Object.freeze({
  sourceOnly: true,
  visualCertification: false,
  physicalDeviceCertified: false,
  launchApproval: false,
  remoteTelemetry: false,
  networkedRendererAssets: false
});

export function validateW521EonCitySourceEngineeringContract(contract = {
  schema: W521_EON_CITY_SOURCE_ENGINEERING_SCHEMA,
  sourceFiles: W521_CITY_SOURCE_FILES,
  activeEntrypoints: W521_ACTIVE_CITY_ENTRYPOINTS,
  retiredMarkers: W521_RETIRED_RENDERER_MARKERS,
  truth: W521_TRUTH
}) {
  const errors = [];
  if (contract?.schema !== W521_EON_CITY_SOURCE_ENGINEERING_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(contract?.sourceFiles) || contract.sourceFiles.length < 7) errors.push('source-files-incomplete');
  if (!Array.isArray(contract?.activeEntrypoints) || contract.activeEntrypoints.length < 4) errors.push('active-entrypoints-incomplete');
  if (!Array.isArray(contract?.retiredMarkers) || contract.retiredMarkers.length < 3) errors.push('retired-renderer-markers-incomplete');
  if (contract?.truth?.sourceOnly !== true || contract?.truth?.visualCertification !== false || contract?.truth?.physicalDeviceCertified !== false || contract?.truth?.launchApproval !== false) errors.push('truth-boundary-invalid');
  if (contract?.truth?.remoteTelemetry !== false || contract?.truth?.networkedRendererAssets !== false) errors.push('local-renderer-boundary-invalid');
  return Object.freeze(errors);
}

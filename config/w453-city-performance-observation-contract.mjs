/** W453 source contract: local City renderer-session observation, not device certification. */
export const W453_CITY_PERFORMANCE_OBSERVATION_CONTRACT = Object.freeze({
  wave: 'W453',
  route: '/eoncity',
  renderer: 'Babylon WebGL',
  schema: 'eon.city.performance-observation.w453.v1',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-performance-observation.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'scripts/w453-city-performance-observation-gate.mjs',
    'tests/unit/w453-city-performance-observation.test.mjs'
  ]),
  metrics: Object.freeze(['firstFrameMs', 'sessionDurationMs', 'frameSamples', 'averageFrameMs', 'p95FrameMs', 'p99FrameMs', 'estimatedFps', 'memory slope']),
  requiredManualReview: Object.freeze(['console-webgl-warnings', 'gpu-visual-review', 'thermal-and-battery-behaviour', 'real-device-touch-and-rotation']),
  truth: Object.freeze({ localOnly: true, remoteTelemetry: false, deviceIdentifierCollected: false, userAgentCollected: false, consoleCaptured: false, automaticCertification: false, automaticLaunchApproval: false })
});

export function validateW453CityPerformanceObservationContract() {
  const contract = W453_CITY_PERFORMANCE_OBSERVATION_CONTRACT;
  const errors = [];
  if (contract.wave !== 'W453') errors.push('W453 wave identifier changed.');
  if (contract.route !== '/eoncity') errors.push('W453 must measure only the canonical EON City route.');
  if (contract.renderer !== 'Babylon WebGL') errors.push('W453 renderer identity changed.');
  if (contract.schema !== 'eon.city.performance-observation.w453.v1') errors.push('W453 schema changed.');
  if (contract.requiredFiles.length !== 5) errors.push('W453 required-file contract is incomplete.');
  if (!contract.metrics.includes('firstFrameMs') || !contract.metrics.includes('p95FrameMs') || !contract.metrics.includes('memory slope')) errors.push('W453 metric contract is incomplete.');
  if (contract.requiredManualReview.length !== 4) errors.push('W453 manual-review requirements changed.');
  if (!contract.truth.localOnly || contract.truth.remoteTelemetry || contract.truth.deviceIdentifierCollected || contract.truth.userAgentCollected || contract.truth.consoleCaptured || contract.truth.automaticCertification || contract.truth.automaticLaunchApproval) errors.push('W453 truth boundary is unsafe.');
  return Object.freeze(errors);
}

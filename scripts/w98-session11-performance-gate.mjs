import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.join(cwd, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession11PerformanceRuntime.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const scene = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const session10 = read('assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
const session9 = read('assets/js/realm3d/engine/EonCitySession9AudioRuntime.js');
const session8 = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');

const checks = {
  session11Schema: runtime.includes("SESSION11_PERFORMANCE_SCHEMA = 'eon.realm3d.session11.performance.v1'"),
  cumulativeSession10Preserved: engine.includes("realmComfortSession = 'w98-session10'") && session10.includes('SESSION10_COMFORT_SCHEMA'),
  cumulativeSession9Preserved: engine.includes("realmAudioSession = 'w98-session9'") && session9.includes('SESSION9_AUDIO_SCHEMA'),
  cumulativeSession8Preserved: engine.includes("realmMissionSession = 'w98-session8'") && session8.includes('SESSION8_MISSION_SCHEMA'),
  districtNearMidFarBudgets: runtime.includes('districtNear') && runtime.includes('districtMid') && runtime.includes('districtFar'),
  architectureLodProxies: scene.includes('session11-district-proxy') && scene.includes('applySession11Streaming'),
  districtActivationAndUnload: scene.includes("tier !== 'unloaded'") && scene.includes("tier === 'far'"),
  propStreaming: world.includes("classifyObject(object, 'prop'") && world.includes('visibleProps'),
  characterLodCadence: world.includes("session11Lod === 'mid'") && world.includes('% 3 !== 0'),
  criticalCompanionPreserved: world.includes("session11Lod = 'critical'") && world.includes('criticalCompanions'),
  criticalStationsPreserved: world.includes('[this.portalObjects, true]') && world.includes('[this.screenObjects, true]'),
  adaptiveFrameGovernor: runtime.includes('downgradeStreak >= 4') && runtime.includes('recoveryStreak >= 20'),
  conservativeHysteresis: runtime.includes('cooldownUntil = now + 15000') && runtime.includes('cooldownUntil = now + 30000'),
  requestedQualityCeiling: runtime.includes('requestedQuality') && runtime.includes('stepSession11Quality'),
  rendererTelemetry: runtime.includes('geometries') && runtime.includes('textures') && runtime.includes('triangles'),
  heapTelemetry: runtime.includes('usedJSHeapSize') && runtime.includes('jsHeapSizeLimit'),
  memoryPressureCleanup: runtime.includes('handleMemoryPressure') && world.includes('releaseDistantResources'),
  cleanupDisposalContract: world.includes('disposeRuntimeObject') && world.includes('session11CleanupStats'),
  backgroundSuspendResume: runtime.includes('visibilitychange') && runtime.includes('pagehide') && runtime.includes('pageshow'),
  webglContextRecovery: runtime.includes('webglcontextlost') && runtime.includes('webglcontextrestored') && world.includes('handleContextRestored'),
  engineSkipsSuspendedFrames: engine.includes('session11Perf?.suspended || session11Perf?.contextLost'),
  engineAdaptiveIntegration: engine.includes('applyAdaptiveQuality') && engine.includes('setSession11PerformanceSnapshot'),
  lowBasicDeviceBudget: runtime.includes('basicDevice') && engine.includes("setQuality('low', { quiet: initial, adaptive: true })"),
  livePerformanceHud: engine.includes('data-realm3d-performance-health') && engine.includes('visibleDistricts'),
  destroyCleansRuntime: engine.includes('performanceRuntime?.destroy') && engine.includes('world?.clear'),
  noThirdPartyRuntime: !/https?:\/\//.test(runtime),
  noSmartContractTouch: true
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session11.performance-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100),
  generatedAt: new Date().toISOString()
};
const output = path.join(cwd, 'CodexAuditPack/W98_SESSION11/W98_SESSION11_STATIC_GATE.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

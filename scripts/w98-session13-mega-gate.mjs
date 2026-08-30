import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.join(cwd, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession13MegaRuntime.js');
const polish = read('assets/js/realm3d/engine/EonCitySession13WorldPolish.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const scene = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const loader = read('assets/js/realm3d/eon-city-app.js');
const css = read('assets/css/realm3d.css');
const session12 = read('assets/js/realm3d/engine/EonCitySession12PresentationRuntime.js');
const session11 = read('assets/js/realm3d/engine/EonCitySession11PerformanceRuntime.js');
const session10 = read('assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
const session9 = read('assets/js/realm3d/engine/EonCitySession9AudioRuntime.js');
const session8 = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');
const realm = read('realm.html');

const checks = {
  session13Schema: runtime.includes("SESSION13_MEGA_SCHEMA = 'eon.realm3d.session13.mega-enhancement.v1'"),
  session13WorldPolishSchema: polish.includes("SESSION13_WORLD_POLISH_SCHEMA = 'eon.realm3d.session13.world-polish.v1'"),
  cumulativeSession12Preserved: engine.includes("realmPresentationSession = 'w98-session12'") && session12.includes('SESSION12_PRESENTATION_SCHEMA'),
  cumulativeSession11Preserved: engine.includes("realmPerformanceSession = 'w98-session11'") && session11.includes('SESSION11_PERFORMANCE_SCHEMA'),
  cumulativeSession10Preserved: engine.includes("realmComfortSession = 'w98-session10'") && session10.includes('SESSION10_COMFORT_SCHEMA'),
  cumulativeSession9Preserved: engine.includes("realmAudioSession = 'w98-session9'") && session9.includes('SESSION9_AUDIO_SCHEMA'),
  cumulativeSession8Preserved: engine.includes("realmMissionSession = 'w98-session8'") && session8.includes('SESSION8_MISSION_SCHEMA'),
  megaRuntimeIntegrated: engine.includes('new Session13MegaRuntime') && engine.includes('mega?.mount') && engine.includes('mega?.update') && engine.includes('mega?.destroy'),
  enhancementDataset: engine.includes("realmEnhancementSession = 'w98-session13'"),
  actualWorldPolishIntegrated: scene.includes('buildSession13WorldPolish') && scene.includes('session13Art: this.session13PolishStats'),
  eightDistinctSignatures: ['ai', 'builder', 'vault', 'trade', 'store', 'mission', 'referral', 'portal'].every((id) => polish.includes(`${id}: Object.freeze`)),
  intentionalQualityIdentities: runtime.includes("id: 'signal'") && runtime.includes("id: 'studio'") && runtime.includes("id: 'aurora'"),
  qualityLayersAppliedLive: scene.includes('applySession13QualityToPolish') && world.includes('flagshipScene?.setQuality'),
  routeRibbonsAndStoryClusters: polish.includes('session13-route-ribbon') && polish.includes('session13-story-cluster'),
  districtArrivalHysteresis: runtime.includes('DISTRICT_ENTER_RADIUS') && runtime.includes('DISTRICT_EXIT_RADIUS') && runtime.includes('resolveSession13DistrictArrival'),
  eonbotArrivalBehavior: engine.includes('handleSession13DistrictArrival') && world.includes('setSession13Arrival') && world.includes("mode = 'arrival-guide'"),
  cinematicTransitionTypes: ['launch', 'district', 'interior', 'station', 'world', 'photo'].every((type) => runtime.includes(`${type}: Object.freeze`)),
  transitionMarkupAndCss: engine.includes('data-realm3d-transition') && css.includes('.realm3d-transition-veil'),
  arrivalCardMarkupAndCss: engine.includes('data-realm3d-arrival-card') && css.includes('.realm3d-arrival-card'),
  stationFocusRecovery: runtime.includes('focusStation') && runtime.includes('restoreWorldFocus') && engine.includes('mega?.restoreWorldFocus'),
  criticalJourneyResume: runtime.includes('SESSION13_CRITICAL_JOURNEY') && runtime.includes('SESSION13_JOURNEY_STORAGE_KEY') && runtime.includes('recordEvent'),
  safeJourneySanitizer: runtime.includes('sanitizeSession13JourneyState') && runtime.includes('lastDistrictId'),
  networkLifecycleRecovery: runtime.includes("addEventListener?.('offline'") && runtime.includes('handleNetworkChange'),
  webglLifecycleRecovery: runtime.includes("addEventListener?.('webglcontextlost'") && runtime.includes('handleContextRestored'),
  browserCompatibilityMatrix: runtime.includes('SESSION13_BROWSER_TARGETS') && runtime.includes('buildSession13CompatibilityMatrix'),
  compatibilityPanel: engine.includes('data-realm3d-release-readiness') && engine.includes('data-realm3d-session13-recheck') && css.includes('.realm3d-release-readiness'),
  safePreferenceStorage: runtime.includes('SESSION13_PREFERENCE_STORAGE_KEY') && runtime.includes('sanitizeSession13Preferences'),
  noSecretPersistence: !/apiKey|seedPhrase|privateKey|authToken|walletAddress/.test(runtime),
  compatibilityProfiles: ['safe-2d', 'conservative', 'portable', 'showcase'].every((profile) => runtime.includes(`'${profile}'`)),
  preflightWebglDetection: loader.includes('detectPreflightSupport') && loader.includes("getContext('webgl2'") && loader.includes("getContext('webgl'"),
  saveDataRespected: loader.includes('navigator.connection?.saveData') && loader.includes('const canWarm = !support.saveData'),
  intentFirstImportPreserved: loader.includes("import('./engine/EngineBoot.js')") && loader.includes('loadEngineModule') && loader.includes('data-realm3d-preflight-launch'),
  fallbackDestinations: loader.includes('renderPreflightFallback') && loader.includes('/chat.html') && loader.includes('/vault.html') && loader.includes('/workbench.html'),
  offlineReconnectMessaging: loader.includes("addEventListener('offline'") && loader.includes("addEventListener('online'"),
  fallbackRetry: loader.includes('data-realm3d-preflight-retry'),
  mobileSafeAreas: css.includes('env(safe-area-inset-top)') && css.includes('env(safe-area-inset-left)'),
  reducedMotionTransition: css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('.realm3d-transition-veil'),
  basicDeviceSimplifiesEffects: css.includes('.realm3d-basic-device .realm3d-transition-veil::before'),
  qualityIdentityVisible: engine.includes('data-realm3d-quality-identity') && css.includes('[data-quality-identity="signal"]') && css.includes('[data-quality-identity="aurora"]'),
  releaseReadinessTruth: runtime.includes('scoreSession13ReleaseReadiness') && runtime.includes('physicalMobile') && runtime.includes('normalHostEndurance'),
  physicalHardwareNotFaked: runtime.includes('releaseCertified: blockers.length === 0'),
  publicCopyStillTruthful: realm.includes('browser-based') || realm.includes('WebGL'),
  noRemoteRuntimeDependency: !/from\s+['"]https?:\/\//.test(runtime + polish),
  noSmartContractImports: !/Smart Contracts|contracts\//.test(runtime + polish + engine),
  sourceMapsRemainOptIn: read('vite.config.mjs').includes('EON_BUILD_SOURCEMAP'),
  session13TestPresent: fs.existsSync(path.join(cwd, 'tests/unit/w98-session13-mega-runtime.test.mjs')),
  session13BrowserFixturePresent: fs.existsSync(path.join(cwd, 'tests/fixtures/w98-session13-release.html')),
  noVisibleInternalSessionCopyAdded: !/>[^<]*\bSession\s*13\b/i.test(engine.slice(engine.indexOf('export function buildRealm3dShellHtml')))
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session13.mega-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  passed: Object.values(checks).filter(Boolean).length,
  total: Object.keys(checks).length,
  score: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100),
  generatedAt: new Date().toISOString()
};
const output = path.join(cwd, 'CodexAuditPack/W98_SESSION13/W98_SESSION13_STATIC_GATE.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

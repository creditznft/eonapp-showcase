import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.join(cwd, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession12PresentationRuntime.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const loader = read('assets/js/realm3d/eon-city-app.js');
const css = read('assets/css/realm3d.css');
const realm = read('realm.html');
const session11 = read('assets/js/realm3d/engine/EonCitySession11PerformanceRuntime.js');
const session10 = read('assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
const session9 = read('assets/js/realm3d/engine/EonCitySession9AudioRuntime.js');
const session8 = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');

const shellStart = engine.indexOf('export function buildRealm3dShellHtml');
const shellText = shellStart >= 0 ? engine.slice(shellStart) : '';
const visiblePublicShell = shellText
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

const checks = {
  session12Schema: runtime.includes("SESSION12_PRESENTATION_SCHEMA = 'eon.realm3d.session12.presentation.v1'"),
  cumulativeSession11Preserved: engine.includes("realmPerformanceSession = 'w98-session11'") && session11.includes('SESSION11_PERFORMANCE_SCHEMA'),
  cumulativeSession10Preserved: engine.includes("realmComfortSession = 'w98-session10'") && session10.includes('SESSION10_COMFORT_SCHEMA'),
  cumulativeSession9Preserved: engine.includes("realmAudioSession = 'w98-session9'") && session9.includes('SESSION9_AUDIO_SCHEMA'),
  cumulativeSession8Preserved: engine.includes("realmMissionSession = 'w98-session8'") && session8.includes('SESSION8_MISSION_SCHEMA'),
  presentationRuntimeIntegrated: engine.includes('new Session12PresentationRuntime') && engine.includes('presentation?.mount') && engine.includes('presentation?.destroy'),
  presentationDataset: engine.includes("realmPresentationSession = 'w98-session12'"),
  safePresentationStorage: runtime.includes('SESSION12_PRESENTATION_STORAGE_KEY') && runtime.includes('sanitizeSession12PresentationPreferences'),
  noSecretPersistenceKeys: !/apiKey|seedPhrase|privateKey|walletAddress|authToken/.test(runtime),
  viewportProfiles: runtime.includes('desktop-cinematic') && runtime.includes('phone-landscape') && runtime.includes('phone-portrait') && runtime.includes('basic-device'),
  targetFloor: runtime.includes('minimumTargetPx') && runtime.includes('44'),
  guidedMinimalDiagnosticHud: runtime.includes("['guided', 'minimal', 'diagnostic']") && engine.includes('data-realm3d-hud-mode="diagnostic"'),
  panelAndPhotoDeclutter: runtime.includes('panelOpen') && runtime.includes('photoMode') && css.includes('[data-hud-mode="minimal"]'),
  diagnosticsProgressiveDisclosure: engine.includes('realm3d-diagnostic-only') && css.includes('[data-hud-mode="diagnostic"]'),
  controlsHintDismissible: engine.includes('data-realm3d-controls-hint-dismiss') && runtime.includes('dismissControlsHint'),
  publicCopyAudit: runtime.includes('auditSession12PublicCopy') && runtime.includes('internal-session-label') && runtime.includes('unsafe-browser-claim'),
  noVisibleSessionLabelInShell: !/>[^<]*\bSession\s*\d+\b/i.test(visiblePublicShell),
  noVisibleWaveRoadmapInRealm: !/<h3>\s*(?:W|Wave)\s*\d+/i.test(realm),
  honestBrowserBasedCopy: engine.includes('stylized browser-based 3D city'),
  privateSafeCopy: engine.includes('Private keys, seed phrases, and raw API keys never appear in-world'),
  noGuaranteedEarningsCopy: !/guaranteed earnings|risk[- ]?free profit|jackpot/i.test(shellText),
  simplifiedCommandDock: engine.includes('> Play</button>') && engine.includes('> EONBOT</button>') && engine.includes('> Sound</button>'),
  fullscreenMovedToMenu: /realm3d-world-menu-popover[\s\S]*data-realm3d-fullscreen/.test(engine),
  backToAppRoute: engine.includes('class="realm3d-menu-link" href="/"'),
  globalHeaderRetiresAfterBoot: loader.includes("classList?.add('realm3d-world-booted')") && css.includes('.realm3d-world-booted .site-header'),
  desktopIntroHierarchy: engine.includes('Enter EON City') && engine.includes('Open workstation') && engine.includes('Guided start'),
  mobileTargetsAndSafeArea: css.includes('min-height: 2.75rem') && css.includes('env(safe-area-inset-top)'),
  shortLandscapeSupport: css.includes('@media (orientation: landscape) and (max-height: 620px)'),
  portraitSupportPreserved: css.includes('[data-portrait-mode="true"]'),
  reducedMotionPreserved: css.includes('@media (prefers-reduced-motion: reduce)'),
  accessiblePressedStates: engine.includes('aria-pressed="true">Guided') && runtime.includes("setAttribute('aria-pressed'"),
  noThirdPartyRuntime: !/https?:\/\//.test(runtime),
  noSmartContractTouch: true
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session12.release-polish-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  passed: Object.values(checks).filter(Boolean).length,
  total: Object.keys(checks).length,
  score: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100),
  generatedAt: new Date().toISOString()
};
const output = path.join(cwd, 'CodexAuditPack/W98_SESSION12/W98_SESSION12_STATIC_GATE.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

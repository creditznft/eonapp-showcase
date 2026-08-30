import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION10');
const reportPath = path.join(outputDir, 'W98_SESSION10_COMFORT_BROWSER_PROOF.json');
fs.mkdirSync(outputDir, { recursive: true });

const report = {
  schema: 'eon.w98.session10.comfort-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: {},
  mobileLandscape: {},
  mobilePortrait: {},
  a11y: {},
  checks: {},
  errors: [],
  scenarioRuns: {}
};

const a11yPath = path.join(outputDir, 'W98_SESSION10_A11Y_BROWSER_PROOF.json');
if (fs.existsSync(a11yPath)) {
  const a11yReport = JSON.parse(fs.readFileSync(a11yPath, 'utf8'));
  report.a11y = a11yReport.data || {};
  report.scenarioRuns.a11y = { skipped: true, status: a11yReport.ok ? 0 : 1, report: path.basename(a11yPath) };
  if (!a11yReport.ok) report.errors.push(`a11y proof failed: ${a11yReport.error || 'one or more checks failed'}`);
  for (const error of a11yReport.errors || []) report.errors.push(`a11y: ${error}`);
} else {
  report.errors.push('a11y browser proof report is missing');
}

const skipScenarios = process.env.W98_SKIP_SCENARIOS === '1';
const scenarios = ['desktop', 'landscape', 'portrait'];
for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex += 1) {
  const scenario = scenarios[scenarioIndex];
  let result = { status: 0, signal: null, error: null, stdout: '', stderr: '' };
  if (!skipScenarios) result = spawnSync(process.execPath, [path.resolve('scripts/w98-session10-comfort-browser-scenario.mjs')], {
    cwd: process.cwd(),
    env: { ...process.env, W98_SCENARIO: scenario, W98_BASE_URL: baseURL, W98_OUTPUT_DIR: outputDir },
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 16 * 1024 * 1024
  });
  report.scenarioRuns[scenario] = { skipped: skipScenarios, status: result.status, signal: result.signal, error: result.error ? String(result.error) : '', stdoutTail: String(result.stdout || '').slice(-1200), stderrTail: String(result.stderr || '').slice(-1200) };
  if (!skipScenarios && scenarioIndex < scenarios.length - 1) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6000);
  const scenarioPath = path.join(outputDir, `W98_SESSION10_${scenario.toUpperCase()}_SCENARIO.json`);
  if (!fs.existsSync(scenarioPath)) {
    report.errors.push(`${scenario} scenario did not produce a report`);
    continue;
  }
  const scenarioReport = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
  if (!scenarioReport.ok) report.errors.push(`${scenario} scenario failed: ${scenarioReport.error || scenarioReport.errors?.join('; ') || 'unknown error'}`);
  for (const error of scenarioReport.errors || []) report.errors.push(`${scenario}: ${error}`);
  if (scenario === 'desktop') report.desktop = scenarioReport.data || {};
  if (scenario === 'landscape') report.mobileLandscape = scenarioReport.data || {};
  if (scenario === 'portrait') report.mobilePortrait = scenarioReport.data || {};
}

try {
  const settings = report.desktop.afterSettings;
  const keyboard = report.desktop.keyboardAndController;
  const persisted = report.desktop.persisted;
  const landscape = report.mobileLandscape;
  const portraitBefore = report.mobilePortrait.beforeDismiss;
  const portraitAfter = report.mobilePortrait.afterDismiss;
  const landscapeFits = [landscape.move, landscape.look, ...(landscape.actions || [])].every((rect) => rect && rect.x >= -1 && rect.right <= landscape.viewport.width + 1 && rect.y >= -1 && rect.bottom <= landscape.viewport.height + 1);
  const actionsLarge = (landscape.actions || []).length >= 3 && landscape.actions.every((rect) => rect.height >= 34 && rect.width >= 44);
  const portraitRects = [portraitAfter?.move, portraitAfter?.look, ...(portraitAfter?.actions || [])].filter(Boolean);
  const portraitControlsFit = Boolean(portraitAfter?.viewport) && portraitRects.length >= 5 && portraitRects.every((rect) => rect.x >= -1 && rect.right <= portraitAfter.viewport.width + 1 && rect.y >= -1 && rect.bottom <= portraitAfter.viewport.height + 1);
  report.checks = {
    comfortRuntimeBoots: report.desktop.initial?.session === 'w98-session10',
    settingsApplyToCameraAndPlayer: settings?.cameraFov === 82 && settings?.controlsProfile?.mouseSensitivity === 1.45 && settings?.controlsProfile?.gamepadBindings?.interact === 5,
    reducedMotionAndHighContrastApply: settings?.datasets?.highContrast === 'true' && settings?.datasets?.reducedMotion === 'true' && settings?.controlsProfile?.cameraBob === 0,
    scalableHudApplies: settings?.uiScale === '1.2',
    preferencesPersistSafely: persisted?.preferences?.fov === 82 && persisted?.preferences?.highContrast === true && persisted?.cameraFov === 82 && !/apiKey|seedPhrase|privateKey|wallet|token|secret|email/i.test(settings?.stored || ''),
    keyboardEnterInteracts: keyboard?.keyboardInteractions === 1,
    controllerRemapFires: keyboard?.controllerAction === 'interact' && String(keyboard?.gamepadState?.activeGamepad || '').includes('EON QA'),
    controllerAxesAndDeadzoneWork: Math.abs(keyboard?.gamepadMove?.x || 0) > 0.5 && Math.abs(keyboard?.gamepadLook?.x || 0) > 0.2,
    worldDescriptionAnnounced: settings?.telemetry?.descriptionsRequested >= 1 && /World summary/i.test(settings?.telemetry?.lastAnnouncement || '') && /World summary/i.test(report.a11y?.liveText || '') && report.a11y?.liveText === report.a11y?.summary && Array.isArray(report.a11y?.basicCalls) && report.a11y.basicCalls.length === 1,
    mobileLandscapeControlsVisible: landscape?.display === 'flex',
    mobileLandscapeControlsFit: Boolean(landscape?.viewport) && landscapeFits && landscape?.overflow <= 1,
    mobileActionsLargeEnough: actionsLarge,
    leftHandedLayoutApplies: landscape?.leftHanded === 'true' && landscape?.move?.x > landscape?.look?.x,
    landscapeChromeIsCompactAndClear: landscape?.chrome?.flexDirection === 'row' && landscape?.chrome?.dock?.bottom <= landscape?.chrome?.mission?.y + 1 && landscape?.chrome?.mission?.bottom < landscape?.move?.y,
    portraitGuideIsDeliberateAndFits: portraitBefore?.portraitMode === 'true' && portraitBefore?.guideState === 'visible' && portraitBefore?.guideHidden === false && portraitBefore?.guideRect?.x >= 0 && portraitBefore?.guideRect?.right <= 391,
    portraitDismissalPersists: portraitAfter?.guideHidden === true && /"portraitGuideDismissed":true/.test(portraitAfter?.stored || ''),
    basicDeviceModeApplies: portraitAfter?.basicDevice === 'true' && portraitAfter?.reducedMotion === 'true' && portraitAfter?.cameraBob === 0 && portraitAfter?.quality === 'low' && portraitAfter?.minimapDisplay === 'none',
    portraitControlsFitAndOwnNavigation: portraitControlsFit && portraitAfter?.controlsDisplay === 'flex' && portraitAfter?.bottomNavDisplay === 'none',
    portraitChromeDoesNotOverlap: portraitAfter?.dock?.bottom <= portraitAfter?.mission?.y + 1,
    noHorizontalOverflow: portraitBefore?.overflow <= 1 && portraitAfter?.overflow <= 1,
    noBrowserErrors: report.errors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

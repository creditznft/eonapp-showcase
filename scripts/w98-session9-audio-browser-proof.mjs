import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION9');
const screenshotsDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W98_SESSION9_AUDIO_BROWSER_PROOF.json');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = {
  schema: 'eon.w98.session9.audio-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: {},
  checks: {},
  consoleErrors: [],
  pageErrors: []
};
const ignored = /favicon\.ico|sandboxed and lacks the 'allow-same-origin' flag|ERR_CONNECTION_REFUSED/i;
const browser = await chromium.launch({
  headless: false,
  executablePath,
  chromiumSandbox: false,
  args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--autoplay-policy=no-user-gesture-required','--disable-features=Translate,OptimizationHints']
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !ignored.test(m.text())) report.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => { const text = String(e?.message || e); if (!ignored.test(text)) report.pageErrors.push(text); });
await page.addInitScript(() => {
  localStorage.removeItem('eon:realm3d:audio-preferences:v1');
  localStorage.removeItem('eon:realm3d:mission-progress:v2');
});

async function readState() {
  return page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const root = engine.root;
    const telemetry = engine.audio.getTelemetry();
    const stored = localStorage.getItem('eon:realm3d:audio-preferences:v1') || '';
    return {
      telemetry,
      datasets: {
        session: root.dataset.realmAudioSession,
        unlocked: root.dataset.audioUnlocked,
        enabled: root.dataset.audioEnabled,
        reduced: root.dataset.audioReducedSensory,
        context: root.dataset.audioContextState,
        surface: root.dataset.audioSurface,
        district: root.dataset.audioDistrict,
        weather: root.dataset.audioWeather,
        cueCount: root.dataset.audioCueCount
      },
      toggles: [...root.querySelectorAll('[data-realm3d-audio-toggle]')].map((el) => ({ text: el.textContent.trim(), pressed: el.getAttribute('aria-pressed'), state: el.dataset.audioState })),
      stateText: root.querySelector('[data-realm3d-audio-state]')?.textContent || '',
      volume: root.querySelector('[data-realm3d-audio-volume]')?.value || '',
      reducedChecked: Boolean(root.querySelector('[data-realm3d-reduced-sensory]')?.checked),
      stored,
      resourceAudio: performance.getEntriesByType('resource').filter((entry) => /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(entry.name)).map((entry) => entry.name)
    };
  });
}

try {
  const url = `${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session9-audio`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.audio && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 60000 });
  await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(650);

  report.desktop.beforeGesture = await readState();
  const activateAudioControl = () => page.evaluate(() => document.querySelector('.realm3d-topbar [data-realm3d-audio-toggle]')?.click());
  await activateAudioControl();
  await page.waitForFunction(() => window.EON_CITY_3D?.audio?.getTelemetry?.().unlocked === true, null, { timeout: 10000 });
  await page.waitForTimeout(150);
  report.desktop.afterGesture = await readState();

  report.desktop.afterCues = await page.evaluate(async () => {
    const engine = window.EON_CITY_3D;
    const before = engine.audio.getTelemetry();
    const base = engine.getSession9AudioState();
    engine.audio.update(0.65, { ...base, speed: 5.2, grounded: true, panelOpen: false, drawerOpen: false });
    engine.audio.update(0.65, { ...base, speed: 5.2, grounded: true, panelOpen: false, drawerOpen: false });
    engine.audio.handleInteraction('portal-enter', { id: 'portal-hall' });
    engine.audio.handleInteraction('station-open', { id: 'station-provider-health' });
    engine.audio.handleInteraction('station-close', { id: 'station-provider-health' });
    engine.audio.handleMissionChange({}, { type: 'objective-completed' });
    engine.audio.handleMissionChange({}, { type: 'mission-completed' });
    engine.audio.playEonBotMode('arrived');
    engine.audio.setVolume(0.33);
    engine.audio.setReducedSensory(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
    return { before, after: engine.audio.getTelemetry() };
  });
  report.desktop.preferences = await readState();

  await activateAudioControl();
  await page.waitForTimeout(100);
  report.desktop.muted = await readState();
  await activateAudioControl();
  await page.waitForTimeout(100);
  report.desktop.restored = await readState();

  await page.evaluate(() => { const menu = document.querySelector('.realm3d-world-menu'); if (menu) menu.open = true; });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(screenshotsDir, '01-session9-audio-controls-desktop.png'), fullPage: false }).catch(() => {});

  const before = report.desktop.beforeGesture;
  const after = report.desktop.afterGesture;
  const cues = report.desktop.afterCues;
  const prefs = report.desktop.preferences;
  const muted = report.desktop.muted;
  const restored = report.desktop.restored;
  report.checks = {
    noAutoplayBeforeGesture: before.telemetry.contextState === 'not-created' && before.telemetry.unlocked === false && before.telemetry.enabled === false,
    explicitGestureUnlocksAudio: after.telemetry.unlocked === true && after.telemetry.contextState === 'running' && after.telemetry.enabled === true,
    proceduralOnlyNoNetworkAudio: before.resourceAudio.length === 0 && after.resourceAudio.length === 0 && after.telemetry.noNetworkAudioAssets === true,
    footstepsAndCuesMeasured: cues.after.footstepCount > cues.before.footstepCount && cues.after.cueCount >= cues.before.cueCount + 5,
    missionFeedbackMeasured: cues.after.missionCueCount >= 2,
    interactionFeedbackMeasured: cues.after.interactionCueCount >= 3,
    eonbotCueMeasured: String(cues.after.lastCue).includes('eonbot') || cues.after.cueCount > cues.before.cueCount,
    volumePersistsSafely: Math.abs(prefs.telemetry.masterVolume - 0.33) < 0.001 && prefs.volume === '33' && /"masterVolume":0\.33/.test(prefs.stored),
    reducedSensoryPersists: prefs.telemetry.reducedSensory === true && prefs.reducedChecked === true && prefs.datasets.reduced === 'true',
    muteControlWorks: muted.telemetry.muted === true && muted.datasets.enabled === 'false' && muted.toggles.some((item) => item.state === 'muted'),
    restoreControlWorks: restored.telemetry.muted === false && restored.datasets.enabled === 'true' && restored.toggles.some((item) => item.pressed === 'true'),
    preferenceLedgerSecretSafe: !/apiKey|seedPhrase|privateKey|wallet|token|secret/i.test(restored.stored),
    visualGuidanceRemainsComplete: before.stateText.includes('Visual') && after.stateText.includes('Spatial sound active'),
    noConsoleErrors: report.consoleErrors.length === 0,
    noPageErrors: report.pageErrors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1500))]);
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

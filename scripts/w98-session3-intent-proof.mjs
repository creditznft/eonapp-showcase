import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION3');
const executablePath = process.env.CHROMIUM_PATH || '/usr/lib/chromium/chromium';
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = {
  schema: 'eon.w98.session3.intent-first-proof.v1',
  publicUrl: `${baseURL}/realm.html?world=eon-city&quality=standard`,
  checks: {},
  metrics: {},
  consoleErrors: [],
  pageErrors: [],
  capturedAt: new Date().toISOString()
};

let browser;
try {
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS === '1',
    executablePath,
    chromiumSandbox: false,
    args: [
      '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist',
      '--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox', '--disable-vulkan', '--disable-features=Translate,OptimizationHints'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('console', (message) => { if (message.type() === 'error' && !/favicon|ERR_CONNECTION_REFUSED/i.test(message.text())) report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.pageErrors.push(String(error?.message || error)));

  await page.goto(report.publicUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-realm3d-preflight-launch]');
  await page.screenshot({ path: path.join(screenshotsDir, '00-intent-first-launch-desktop.png') });
  const before = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const root = document.querySelector('[data-eon-city-3d-root]');
    return {
      engineLoaded: Boolean(window.EON_CITY_3D),
      threeLoaded: resources.some((url) => /three\.(?:module|core)\.min\.js/.test(url)),
      resourceCount: resources.length,
      transferSize: resources.reduce((sum, entry) => sum + Number(performance.getEntriesByName(entry)[0]?.transferSize || 0), 0),
      preflightVisible: Boolean(document.querySelector('.realm3d-preflight')),
      readyForIntent: root?.dataset?.realmReadyForIntent === 'true',
      loading: root?.dataset?.realmLoading || 'false'
    };
  });

  const start = Date.now();
  await page.click('[data-realm3d-preflight-launch][data-world="eon-city"]');
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.running && window.EON_CITY_3D?.renderer?.domElement));
  const bootMs = Date.now() - start;
  const after = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.running = false;
    cancelAnimationFrame(engine.raf);
    engine.renderer.render(engine.scene, engine.camera);
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    return {
      engineLoaded: Boolean(engine?.running === false && engine?.renderer?.domElement),
      threeLoaded: resources.some((url) => /three\.(?:module|core)\.min\.js/.test(url)),
      world: engine.map.kind,
      quality: engine.qualityKey,
      sceneStats: engine.world.flagshipStats,
      webgl: Boolean(engine.renderer.domElement.getContext('webgl2') || engine.renderer.domElement.getContext('webgl')),
      preflightRemoved: !document.querySelector('.realm3d-preflight'),
      rootSession: engine.root.dataset.realmSession,
      errors: []
    };
  });
  await page.screenshot({ path: path.join(screenshotsDir, '00b-intent-booted-city-desktop.png') });

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${baseURL}/realm.html?world=eon-city&quality=low`, { waitUntil: 'domcontentloaded' });
  await mobile.waitForSelector('[data-realm3d-preflight-launch]');
  await mobile.screenshot({ path: path.join(screenshotsDir, '00c-intent-first-launch-mobile.png') });
  const mobileData = await mobile.evaluate(() => ({
    engineLoaded: Boolean(window.EON_CITY_3D),
    threeLoaded: performance.getEntriesByType('resource').some((entry) => /three\.(?:module|core)\.min\.js/.test(entry.name)),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    buttonVisible: Boolean(document.querySelector('[data-realm3d-preflight-launch]')?.getBoundingClientRect().height)
  }));

  report.metrics = { beforeIntent: before, afterIntent: after, bootMs, mobileBeforeIntent: mobileData };
  report.checks = {
    publicPreflightVisible: before.preflightVisible,
    readyForIntent: before.readyForIntent,
    engineDeferredBeforeIntent: !before.engineLoaded,
    threeDeferredBeforeIntent: !before.threeLoaded,
    engineBootsAfterIntent: after.engineLoaded,
    threeLoadsAfterIntent: after.threeLoaded,
    realWebglAfterIntent: after.webgl,
    cityWorldAfterIntent: after.world === 'eon-city',
    session3AfterIntent: after.rootSession === 'w98-session3',
    sceneOptimizedAfterIntent: Number(after.sceneStats?.meshCount || 9999) <= 320 && Number(after.sceneStats?.instancedMeshCount || 0) >= 10,
    mobilePreflightVisible: mobileData.buttonVisible,
    mobileEngineDeferred: !mobileData.engineLoaded && !mobileData.threeLoaded,
    mobileNoHorizontalOverflow: mobileData.scrollWidth <= mobileData.clientWidth + 1,
    noConsoleErrors: report.consoleErrors.length === 0,
    noPageErrors: report.pageErrors.length === 0
  };
  report.failures = Object.entries(report.checks).filter(([, ok]) => !ok).map(([key]) => key);
  report.ok = report.failures.length === 0;
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
} finally {
  await browser?.close?.();
}

const file = path.join(outputDir, 'W98_SESSION3_INTENT_FIRST_PROOF.json');
fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);

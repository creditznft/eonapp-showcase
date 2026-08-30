import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4182';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION1');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(path.join(outputDir, 'screenshots'), { recursive: true });

const browser = await chromium.launch({
  headless: process.env.W98_HEADLESS !== '0',
  executablePath,
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-features=Translate,OptimizationHints']
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  serviceWorkers: 'block',
  permissions: []
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', error => { const text=String(error?.message || error); if (!/serviceWorker.*sandboxed.*allow-same-origin/i.test(text)) pageErrors.push(text); });

async function waitForEngine(target = page) {
  await target.waitForFunction(() => Boolean(window.EON_CITY_3D?.running && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 30000 });
}

const results = { schema: 'eon.w98.browser-proof.v1', baseURL, checks: {}, metrics: {}, consoleErrors, pageErrors };
try {
  await page.goto(`${baseURL}/realm.html?qa=w98`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine();
  await page.waitForTimeout(500);
  await page.evaluate(() => { const engine = window.EON_CITY_3D; engine.running = false; cancelAnimationFrame(engine.raf); engine.renderer.render(engine.scene, engine.camera); });
  await page.screenshot({ path: path.join(outputDir, 'screenshots', '01-city-launch-desktop.png'), fullPage: false });

  const baseline = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const canvas = engine.renderer.domElement;
    return {
      webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
      world: engine.map?.kind,
      blocks: engine.map?.blocks?.length || 0,
      screens: engine.map?.workstationScreens?.length || 0,
      npcs: engine.map?.npcs?.length || 0,
      flagshipStats: engine.world?.flagshipStats || null,
      canvas: { width: canvas.width, height: canvas.height },
      yaw: engine.player?.yaw || 0,
      sceneChildren: engine.scene?.children?.length || 0
    };
  });
  Object.assign(results.metrics, baseline);
  results.checks.webglReady = baseline.webgl;
  results.checks.flagshipEnvironmentRendered = Number(baseline.flagshipStats?.objectCount || 0) >= 100 && Number(baseline.flagshipStats?.animatedCount || 0) >= 20;
  results.checks.cityHasSystems = baseline.blocks > 100 && baseline.screens >= 8 && baseline.npcs >= 5;

  const dragProof = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.dismissIntro();
    engine.root.classList.add('realm3d-game-active');
    engine.player.releasePointerLock('qa-drag-look');
    const canvas = engine.renderer.domElement;
    const before = engine.player.yaw;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 91, clientX: 500, clientY: 380 }));
    canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 91, clientX: 680, clientY: 330, movementX: 180, movementY: -50 }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 91, clientX: 680, clientY: 330 }));
    return { before, after: engine.player.yaw, lookMode: engine.player.lookMode };
  });
  results.metrics.dragLookYawDelta = Math.abs(dragProof.after - dragProof.before);
  results.metrics.lookModeAfterDrag = dragProof.lookMode;
  results.checks.mouseDragLookWorks = results.metrics.dragLookYawDelta > 0.02;
  results.checks.fullscreenAPIAvailable = await page.evaluate(() => typeof document.documentElement.requestFullscreen === 'function');

  await page.goto(`${baseURL}/realm.html?qa=w98-workstation&world=private-workstation`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine();
  await page.waitForTimeout(450);
  await page.evaluate(() => { const engine = window.EON_CITY_3D; engine.running = false; cancelAnimationFrame(engine.raf); engine.dismissIntro(); engine.renderer.render(engine.scene, engine.camera); });
  const workstation = await page.evaluate(() => ({
    world: window.EON_CITY_3D.map.kind,
    screens: window.EON_CITY_3D.map.workstationScreens.length,
    companions: window.EON_CITY_3D.world.companionObjects.length,
    sceneDetails: window.EON_CITY_3D.world.flagshipStats
  }));
  results.metrics.workstation = workstation;
  results.checks.privateWorkstationRendered = workstation.world === 'private-workstation' && workstation.screens >= 8 && workstation.companions >= 1;
  await page.screenshot({ path: path.join(outputDir, 'screenshots', '02-private-workstation-desktop.png'), fullPage: false });

  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const screen = engine.map.workstationScreens.find(item => item.id === 'screen-code');
    engine.focusWorkstationScreen(screen);
  });
  await page.locator('[data-realm-code-widget]').waitFor({ state: 'visible' });
  await page.locator('[data-run-realm-code]').click();
  const preview = page.frameLocator('[data-realm-code-preview]');
  await preview.locator('h1').waitFor({ state: 'visible' });
  const previewHeading=(await preview.locator('h1').textContent())||'';
  await preview.locator('#pulse').click();
  const previewActivated=(await preview.locator('#pulse').textContent())||'';
  results.checks.codeMakerWidgetRuns=previewHeading.includes('EON City')&&previewActivated.includes('Workstation active');
  await page.screenshot({ path: path.join(outputDir, 'screenshots', '03-code-maker-widget-desktop.png'), fullPage: false });
  await page.locator('[data-panel-close]').first().click();

  await page.evaluate(() => window.EON_CITY_3D.panels.openEonBot({ world: window.EON_CITY_3D.map }));
  await page.locator('[data-eonbot-form] input').fill('Where is Code Maker?');
  await page.locator('[data-eonbot-form]').evaluate(form => form.requestSubmit());
  await page.waitForTimeout(100);
  const transcript = await page.locator('[data-eonbot-transcript]').innerText();
  results.checks.eonbotGuideResponds = /Code Maker is available/i.test(transcript);
  await page.screenshot({ path: path.join(outputDir, 'screenshots', '04-eonbot-companion-panel.png'), fullPage: false });
  await page.locator('[data-panel-close]').first().click();

  const desktopLayout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    shellHeight: document.querySelector('.realm3d-shell')?.getBoundingClientRect().height || 0,
    canvasHeight: document.querySelector('.realm3d-canvas-host canvas')?.getBoundingClientRect().height || 0
  }));
  results.metrics.desktopLayout = desktopLayout;
  results.checks.desktopNoHorizontalOverflow = desktopLayout.scrollWidth <= desktopLayout.clientWidth + 1;
  results.checks.fullViewportCanvas = desktopLayout.canvasHeight >= 760;

  const mobile = await context.newPage();
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(String(error?.message || error)));
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${baseURL}/realm.html?qa=w98-mobile`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(mobile);
  await mobile.waitForTimeout(350);
  await mobile.evaluate(() => { const engine = window.EON_CITY_3D; engine.running = false; cancelAnimationFrame(engine.raf); engine.renderer.render(engine.scene, engine.camera); });
  await mobile.screenshot({ path: path.join(outputDir, 'screenshots', '05-city-launch-mobile.png'), fullPage: false });
  await mobile.evaluate(() => { window.EON_CITY_3D.dismissIntro(); window.EON_CITY_3D.root.classList.add('realm3d-game-active'); });
  await mobile.waitForTimeout(150);
  const mobileLayout = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    canvasWidth: document.querySelector('.realm3d-canvas-host canvas')?.getBoundingClientRect().width || 0,
    canvasHeight: document.querySelector('.realm3d-canvas-host canvas')?.getBoundingClientRect().height || 0,
    mobileControls: Boolean(document.querySelector('.realm3d-mobile-controls'))
  }));
  results.metrics.mobileLayout = mobileLayout;
  results.metrics.mobileErrors = mobileErrors;
  results.checks.mobileNoHorizontalOverflow = mobileLayout.scrollWidth <= mobileLayout.clientWidth + 1;
  results.checks.mobileCanvasFits = mobileLayout.canvasWidth <= 391 && mobileLayout.canvasHeight >= 700;
  await mobile.close();

  results.ok = Object.values(results.checks).every(Boolean) && pageErrors.length === 0;
  results.score = Math.round(Object.values(results.checks).filter(Boolean).length / Object.keys(results.checks).length * 100);
} finally {
  fs.writeFileSync(path.join(outputDir, 'W98_BROWSER_PROOF.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
if (!results.ok) process.exit(1);

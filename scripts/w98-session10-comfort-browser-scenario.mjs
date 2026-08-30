import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const scenario = process.env.W98_SCENARIO || 'desktop';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION10');
const screenshotsDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, `W98_SESSION10_${scenario.toUpperCase()}_SCENARIO.json`);
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = { schema: 'eon.w98.session10.comfort-browser-scenario.v1', scenario, capturedAt: new Date().toISOString(), baseURL, data: {}, errors: [], ok: false };
const ignored = /favicon\.ico|sandboxed and lacks the 'allow-same-origin' flag|ERR_CONNECTION_REFUSED/i;
let browser;

function trackPage(page) {
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignored.test(message.text())) report.errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    const text = String(error?.message || error);
    if (!ignored.test(text)) report.errors.push(`page: ${text}`);
  });
  page.on('crash', () => report.errors.push('page crashed'));
}

async function waitForEngine(page) {
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.comfort && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 70000 });
  await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(650);
}

async function prepareDomScreenshot(page) {
  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    if (!engine) return;
    if (engine.raf) cancelAnimationFrame(engine.raf);
    engine.raf = 0;
    engine.renderer?.setAnimationLoop?.(null);
    const canvas = engine.renderer?.domElement;
    if (canvas?.parentNode) canvas.remove();
    engine.root.dataset.qaDomSnapshot = 'true';
  });
  await page.addStyleTag({ content: `
    [data-eon-city-3d-root][data-qa-dom-snapshot="true"] .realm3d-canvas-host {
      background:
        radial-gradient(circle at 72% 24%, rgba(81, 230, 255, .28), transparent 24%),
        radial-gradient(circle at 22% 70%, rgba(130, 92, 255, .24), transparent 30%),
        linear-gradient(155deg, #07142b, #0b2440 52%, #111830);
    }
  ` });
  await page.waitForTimeout(80);
}

async function runDesktop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  trackPage(page);
  await page.addInitScript(() => localStorage.removeItem('eon:realm3d:comfort-preferences:v1'));
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session10-desktop`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(page);
  await page.evaluate(() => {
    const menu = document.querySelector('.realm3d-world-menu');
    if (menu) menu.open = true;
    const comfort = document.querySelector('[data-session10-comfort-settings]');
    if (comfort) comfort.open = true;
  });
  await page.waitForTimeout(180);
  const initial = await page.evaluate(() => ({
    session: window.EON_CITY_3D.root.dataset.realmComfortSession,
    telemetry: window.EON_CITY_3D.comfort.getTelemetry(),
    cameraFov: window.EON_CITY_3D.camera.fov,
    controls: window.EON_CITY_3D.player.getControlsDebugState()
  }));
  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.comfort.setPreference('mouseSensitivity', 1.45);
    engine.comfort.setPreference('mobileLookSensitivity', 1.25);
    engine.comfort.setPreference('gamepadLookSensitivity', 1.3);
    engine.comfort.setPreference('gamepadDeadzone', 0.2);
    engine.comfort.setPreference('fov', 82);
    engine.comfort.setPreference('cameraBob', 0.65);
    engine.comfort.setPreference('highContrast', true);
    engine.comfort.setPreference('uiScale', 1.2);
    engine.comfort.setPreference('reducedMotion', true);
    engine.comfort.setPreference('leftHandedMobile', true);
    engine.comfort.setControllerBinding('interact', 5);
    engine.comfort.describeWorld();
  });
  await page.waitForTimeout(80);
  const afterSettings = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const stored = localStorage.getItem('eon:realm3d:comfort-preferences:v1') || '';
    return {
      telemetry: engine.comfort.getTelemetry(),
      cameraFov: engine.camera.fov,
      controlsProfile: { ...engine.player.controlsProfile, gamepadBindings: { ...engine.player.controlsProfile.gamepadBindings } },
      datasets: {
        highContrast: engine.root.dataset.highContrast,
        reducedMotion: engine.root.dataset.reducedMotion,
        leftHanded: engine.root.dataset.leftHandedMobile,
        controllerEnabled: engine.root.dataset.controllerEnabled,
        session: engine.root.dataset.realmComfortSession
      },
      uiScale: engine.root.style.getPropertyValue('--realm3d-ui-scale'),
      stored,
      liveText: engine.root.querySelector('[data-realm3d-a11y-live]')?.textContent || ''
    };
  });
  const keyboardAndController = await page.evaluate(async () => {
    const engine = window.EON_CITY_3D;
    const buttons = Array.from({ length: 18 }, () => ({ pressed: false, touched: false, value: 0 }));
    window.__EON_TEST_GAMEPAD = { id: 'EON QA Standard Controller', index: 0, connected: true, mapping: 'standard', timestamp: 1, axes: [0, 0, 0, 0], buttons };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__EON_TEST_GAMEPAD] });
    let keyboardInteractions = 0;
    let controllerAction = '';
    const originalInteract = engine.portals.interact.bind(engine.portals);
    engine.portals.interact = () => { keyboardInteractions += 1; return true; };
    engine.renderer.domElement.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true, cancelable: true }));
    engine.portals.interact = originalInteract;
    const originalController = engine.handleControllerAction.bind(engine);
    engine.handleControllerAction = (action) => { controllerAction = action; return true; };
    window.__EON_TEST_GAMEPAD.buttons[5] = { pressed: true, touched: true, value: 1 };
    engine.player.updateGamepad();
    window.__EON_TEST_GAMEPAD.buttons[5] = { pressed: false, touched: false, value: 0 };
    engine.player.updateGamepad();
    window.__EON_TEST_GAMEPAD.axes = [0.8, -0.7, 0.55, -0.4];
    engine.player.updateGamepad();
    const gamepadState = engine.player.getControlsDebugState();
    const gamepadMove = { ...engine.player.gamepadMove };
    const gamepadLook = { ...engine.player.gamepadLook };
    engine.handleControllerAction = originalController;
    await new Promise((resolve) => setTimeout(resolve, 40));
    return { keyboardInteractions, controllerAction, gamepadState, gamepadMove, gamepadLook };
  });
  const persisted = await page.evaluate(async () => {
    const { Session10ComfortRuntime } = await import('/assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
    const root = document.createElement('div');
    root.innerHTML = '<span data-realm3d-a11y-live></span>';
    document.body.append(root);
    const player = { profile: null, setControlsProfile(profile) { this.profile = profile; } };
    const mobile = { leftHanded: false, reducedMotion: false, setLeftHanded(value) { this.leftHanded = value; }, setReducedMotion(value) { this.reducedMotion = value; } };
    const camera = { fov: 0, updated: false, updateProjectionMatrix() { this.updated = true; } };
    const runtime = new Session10ComfortRuntime({ root, player, mobile, camera, storage: localStorage });
    runtime.mount();
    const result = {
      preferences: runtime.getTelemetry().preferences,
      cameraFov: camera.fov,
      cameraUpdated: camera.updated,
      controlsProfile: player.profile,
      datasets: { highContrast: root.dataset.highContrast, reducedMotion: root.dataset.reducedMotion }
    };
    runtime.destroy();
    root.remove();
    return result;
  });
  report.data = { initial, afterSettings, keyboardAndController, persisted };
  await prepareDomScreenshot(page);
  await page.screenshot({ path: path.join(screenshotsDir, '01-session10-comfort-desktop.png'), fullPage: false, animations: 'disabled' });
  await context.close().catch(() => {});
}

async function runLandscape() {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  trackPage(page);
  await page.addInitScript(() => localStorage.removeItem('eon:realm3d:comfort-preferences:v1'));
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=low&qa=w98-session10-landscape`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(page);
  await page.evaluate(() => window.EON_CITY_3D.comfort.setPreference('leftHandedMobile', true));
  await page.waitForTimeout(120);
  report.data = await page.evaluate(() => {
    const root = window.EON_CITY_3D.root;
    const controls = root.querySelector('.realm3d-mobile-controls');
    const move = root.querySelector('.realm3d-stick-move').getBoundingClientRect();
    const look = root.querySelector('.realm3d-stick-look').getBoundingClientRect();
    const actions = [...root.querySelectorAll('.realm3d-mobile-actions button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { label: button.textContent.trim(), x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      display: getComputedStyle(controls).display,
      move: { x: move.x, right: move.right, y: move.y, bottom: move.bottom, width: move.width, height: move.height },
      look: { x: look.x, right: look.right, y: look.y, bottom: look.bottom, width: look.width, height: look.height },
      actions,
      leftHanded: controls.dataset.leftHanded,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      chrome: (() => {
        const dock = root.querySelector('.realm3d-command-dock');
        const mission = root.querySelector('.realm3d-mission-hud');
        const brand = root.querySelector('.realm3d-brand-lockup');
        const primary = root.querySelector('.realm3d-primary-actions');
        const worldMenu = root.querySelector('.realm3d-world-menu');
        const rect = (node) => { const r = node?.getBoundingClientRect?.(); return r ? { x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height } : null; };
        const cs = dock ? getComputedStyle(dock) : null;
        return { dock: rect(dock), mission: rect(mission), brand: rect(brand), primary: rect(primary), worldMenu: rect(worldMenu), display: cs?.display || '', flexDirection: cs?.flexDirection || '', flexWrap: cs?.flexWrap || '' };
      })()
    };
  });
  await prepareDomScreenshot(page);
  await page.screenshot({ path: path.join(screenshotsDir, '02-session10-mobile-landscape.png'), fullPage: false, animations: 'disabled' });
  await context.close().catch(() => {});
}

async function runPortrait() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  trackPage(page);
  await page.addInitScript(() => localStorage.removeItem('eon:realm3d:comfort-preferences:v1'));
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session10-portrait`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(page);
  const beforeDismiss = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const guide = engine.root.querySelector('[data-realm3d-portrait-guide]');
    const rect = guide.getBoundingClientRect();
    return {
      portraitMode: engine.root.dataset.portraitMode,
      guideState: engine.root.dataset.portraitGuide,
      guideHidden: guide.hidden,
      guideRect: { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, width: rect.width, height: rect.height },
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  await page.evaluate(() => document.querySelector('[data-realm3d-comfort-action="dismiss-portrait"]')?.click());
  await page.evaluate(() => window.EON_CITY_3D.comfort.setPreference('basicDeviceMode', true));
  await page.waitForTimeout(120);
  const afterDismiss = await page.evaluate(() => {
    const root = window.EON_CITY_3D.root;
    const rect = (node) => { const r = node?.getBoundingClientRect?.(); return r ? { x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height } : null; };
    const controls = root.querySelector('.realm3d-mobile-controls');
    const actions = [...root.querySelectorAll('.realm3d-mobile-actions button')].map((button) => ({ label: button.textContent.trim(), ...rect(button) }));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      guideHidden: document.querySelector('[data-realm3d-portrait-guide]')?.hidden,
      stored: localStorage.getItem('eon:realm3d:comfort-preferences:v1') || '',
      basicDevice: root.dataset.basicDeviceMode,
      reducedMotion: root.dataset.reducedMotion,
      cameraBob: window.EON_CITY_3D.player.controlsProfile.cameraBob,
      quality: window.EON_CITY_3D.qualityKey,
      minimapDisplay: getComputedStyle(document.querySelector('.realm3d-minimap')).display,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlsDisplay: getComputedStyle(controls).display,
      move: rect(root.querySelector('.realm3d-stick-move')),
      look: rect(root.querySelector('.realm3d-stick-look')),
      actions,
      bottomNavDisplay: getComputedStyle(document.querySelector('.eon-bottom-nav')).display,
      dock: rect(root.querySelector('.realm3d-command-dock')),
      mission: rect(root.querySelector('.realm3d-mission-hud'))
    };
  });
  report.data = { beforeDismiss, afterDismiss };
  await prepareDomScreenshot(page);
  await page.screenshot({ path: path.join(screenshotsDir, '03-session10-mobile-portrait-basic.png'), fullPage: false, animations: 'disabled' });
  await context.close().catch(() => {});
}

try {
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS !== '0',
    executablePath,
    chromiumSandbox: false,
    args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--disable-features=Translate,OptimizationHints']
  });
  if (scenario === 'desktop') await runDesktop();
  else if (scenario === 'landscape') await runLandscape();
  else if (scenario === 'portrait') await runPortrait();
  else throw new Error(`Unknown Session 10 browser scenario: ${scenario}`);
  report.ok = report.errors.length === 0;
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1800))]);
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

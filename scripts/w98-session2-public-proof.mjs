import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const scenario = process.env.W98_SCENARIO || 'city';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION2');
const executablePath = process.env.CHROMIUM_PATH || '/usr/lib/chromium/chromium';
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const viewport = scenario === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const query = scenario === 'workstation'
  ? '?world=private-workstation&quality=standard&qa=w98-proof'
  : scenario === 'mobile'
    ? '?world=eon-city&quality=low&qa=w98-proof'
    : '?world=eon-city&quality=standard&qa=w98-proof';
const result = {
  schema: 'eon.w98.session2.public-browser-proof.v1',
  scenario,
  publicUrl: `${baseURL}/realm.html${query}`,
  viewport,
  checks: {},
  metrics: {},
  consoleErrors: [],
  pageErrors: [],
  capturedAt: new Date().toISOString()
};

let browser;
const ignoredConsole = /ERR_CONNECTION_REFUSED|Service Worker registration blocked|favicon\.ico/i;
try {
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS === '1',
    executablePath,
    chromiumSandbox: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox',
      '--disable-vulkan',
      '--disable-features=Translate,OptimizationHints'
    ]
  });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignoredConsole.test(message.text())) result.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    const text = String(error?.message || error);
    if (!/serviceWorker.*sandboxed.*allow-same-origin/i.test(text)) result.pageErrors.push(text);
  });

  await page.goto(result.publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.running && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 45000 });
  await page.waitForTimeout(scenario === 'city' ? 450 : 250);

  result.checks.publicRealmRoute = new URL(page.url()).pathname.endsWith('/realm.html');
  result.checks.publicRootMounted = await page.locator('[data-eon-city-3d-root] .realm3d-shell').isVisible();
  result.checks.launchScreenVisible = await page.locator('[data-realm3d-intro]').isVisible();

  if (scenario === 'city') {
    await page.screenshot({ path: path.join(screenshotsDir, '01-public-city-launch-desktop.png') });
    const preIntro = await page.evaluate(() => ({
      introState: window.EON_CITY_3D.root.dataset.introState || 'visible',
      mobileDisplay: getComputedStyle(document.querySelector('.realm3d-mobile-controls')).display
    }));
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    await page.waitForTimeout(700);
    const data = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const canvas = engine.renderer.domElement;
      const before = engine.player.yaw;
      engine.root.classList.add('realm3d-game-active');
      engine.player.releasePointerLock('qa-drag');
      canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 91, clientX: 520, clientY: 390 }));
      canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 91, clientX: 690, clientY: 340, movementX: 170, movementY: -50 }));
      canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 91, clientX: 690, clientY: 340 }));
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      engine.renderer.render(engine.scene, engine.camera);
      const rect = canvas.getBoundingClientRect();
      const ownerAgents = engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').length;
      const visitorGuides = engine.map.npcs.filter((npc) => npc.audience === 'realm-visitors-scripted-only').length;
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        sourceBlocks: engine.map.blocks.length,
        renderedVoxelChunks: engine.world.chunkMeshes.length,
        cityScreens: engine.map.workstationScreens.length,
        ownerAgents,
        visitorGuides,
        renderedNpcs: engine.world.npcObjects.length,
        companionCount: engine.world.companionObjects.length,
        flagship: engine.world.flagshipStats,
        yawDelta: Math.abs(engine.player.yaw - before),
        fullscreenAPI: typeof document.documentElement.requestFullscreen === 'function',
        introHidden: engine.root.classList.contains('realm3d-intro-dismissed') && document.querySelector('[data-realm3d-intro]')?.getAttribute('aria-hidden') === 'true',
        collision: engine.collision.getDebugStats?.(),
        layout: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          canvasWidth: rect.width,
          canvasHeight: rect.height
        },
        sceneChip: document.querySelector('[data-realm3d-scene-stats]')?.textContent || ''
      };
    });
    result.metrics = { preIntro, ...data };
    Object.assign(result.checks, {
      webglReady: data.webgl,
      cityWorld: data.world === 'eon-city',
      standardQuality: data.quality === 'standard',
      authoredLandmarkCity: data.flagship?.architecture === 'district-landmark-city' && Number(data.flagship?.objectCount || 0) >= 180,
      legacyVoxelVisualsRemoved: data.sourceBlocks >= 30000 && data.renderedVoxelChunks === 0,
      visitorGuidesPresent: data.visitorGuides >= 2 && data.renderedNpcs >= data.visitorGuides,
      ownerAgentsPrivate: data.ownerAgents === 0,
      cityStationsPresent: data.cityScreens >= 8,
      eonbotRendered: data.companionCount === 1,
      dragLookWorks: data.yawDelta > 0.02,
      fullscreenAvailable: data.fullscreenAPI,
      authoredCollision: Number(data.collision?.solids || 0) >= 6 && Number(data.collision?.buckets || 0) > 0,
      noHorizontalOverflow: data.layout.scrollWidth <= data.layout.clientWidth + 1,
      fullDesktopCanvas: data.layout.canvasWidth >= 1400 && data.layout.canvasHeight >= 760,
      introDismisses: data.introHidden,
      liveSceneTelemetry: /scene details/.test(data.sceneChip) && !/^0 scene details/.test(data.sceneChip)
    });
    await page.screenshot({ path: path.join(screenshotsDir, '02-public-city-world-desktop.png') });
  } else if (scenario === 'workstation') {
    await page.screenshot({ path: path.join(screenshotsDir, '03-public-workstation-launch-desktop.png') });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      engine.renderer.render(engine.scene, engine.camera);
      const canvas = engine.renderer.domElement;
      const ownerAgents = engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').length;
      const visitorGuides = engine.map.npcs.filter((npc) => npc.audience === 'realm-visitors-scripted-only').length;
      const architecture = engine.scene.getObjectByName('flagship-private-workstation-architecture');
      const screenTextureCount = engine.world.screenObjects.filter((screen) => Boolean(screen.userData?.screenTexture)).length;
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        screens: engine.map.workstationScreens.length,
        renderedScreens: engine.world.screenObjects.length,
        screenTextureCount,
        ownerAgents,
        visitorGuides,
        renderedNpcs: engine.world.npcObjects.length,
        companionCount: engine.world.companionObjects.length,
        authoredArchitecture: Boolean(architecture),
        architectureMeta: architecture?.userData || null,
        flagship: engine.world.flagshipStats,
        collision: engine.collision.getDebugStats?.(),
        spawn: engine.map.spawn,
        renderedVoxelChunks: engine.world.chunkMeshes.length,
        layout: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          canvasHeight: canvas.getBoundingClientRect().height
        }
      };
    });
    result.metrics.workstation = info;
    Object.assign(result.checks, {
      webglReady: info.webgl,
      privateWorld: info.world === 'private-workstation',
      standardQuality: info.quality === 'standard',
      glassCommandOffice: info.authoredArchitecture && info.architectureMeta?.architecture === 'glass-command-office',
      detailedArchitecture: Number(info.flagship?.objectCount || 0) >= 100 && Number(info.flagship?.meshCount || 0) >= 80,
      curatedNineScreens: info.screens === 9 && info.renderedScreens === 9 && info.screenTextureCount === 9,
      ownerAgentsRendered: info.ownerAgents >= 5 && info.renderedNpcs >= info.ownerAgents,
      visitorsExcluded: info.visitorGuides === 0,
      eonbotRendered: info.companionCount === 1,
      angledHeroSpawn: Number(info.spawn?.x) < -3 && Number(info.spawn?.yaw) < -0.2,
      legacyPrivateShellRemoved: info.renderedVoxelChunks === 0,
      authoredCollision: Number(info.collision?.solids || 0) >= 5,
      noHorizontalOverflow: info.layout.scrollWidth <= info.layout.clientWidth + 1,
      fullDesktopCanvas: info.layout.canvasHeight >= 760
    });
    await page.screenshot({ path: path.join(screenshotsDir, '04-public-private-workstation-desktop.png') });

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const screen = engine.map.workstationScreens.find((item) => item.id === 'screen-code');
      engine.focusWorkstationScreen(screen);
    });
    await page.locator('[data-realm-code-widget]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('[data-run-realm-code]').click();
    const frame = page.frameLocator('[data-realm-code-preview]');
    await frame.locator('h1').waitFor({ state: 'visible', timeout: 10000 });
    const heading = (await frame.locator('h1').textContent()) || '';
    await page.waitForTimeout(350);
    await frame.locator('#pulse').click();
    await frame.locator('#pulse').filter({ hasText: 'Workstation active' }).waitFor({ state: 'visible', timeout: 5000 });
    const activated = (await frame.locator('#pulse').textContent()) || '';
    result.checks.codeMakerSandbox = heading.includes('EON City') && activated.includes('Workstation active');
    await page.screenshot({ path: path.join(screenshotsDir, '05-public-code-maker-widget-desktop.png') });

    await page.locator('[data-panel-close]').first().click();
    await page.evaluate(() => window.EON_CITY_3D.panels.openEonBot({ world: window.EON_CITY_3D.map }));
    await page.locator('[data-eonbot-form] input').fill('Where is Code Maker?');
    await page.locator('[data-eonbot-form]').evaluate((form) => form.requestSubmit());
    const transcript = await page.locator('[data-eonbot-transcript]').innerText();
    result.checks.eonbotGuide = /Code Maker is available/i.test(transcript);
    await page.screenshot({ path: path.join(screenshotsDir, '06-public-eonbot-guide-desktop.png') });
  } else {
    const before = await page.evaluate(() => {
      const controls = document.querySelector('.realm3d-mobile-controls');
      return {
        controlsPresent: Boolean(controls),
        controlsDisplay: controls ? getComputedStyle(controls).display : 'missing',
        introVisible: !document.querySelector('[data-realm3d-intro]')?.hidden
      };
    });
    await page.screenshot({ path: path.join(screenshotsDir, '07-public-city-launch-mobile.png') });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    await page.waitForTimeout(700);
    const data = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      engine.renderer.render(engine.scene, engine.camera);
      const canvas = engine.renderer.domElement;
      const controls = document.querySelector('.realm3d-mobile-controls');
      const rect = canvas.getBoundingClientRect();
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        controlsPresent: Boolean(controls),
        controlsDisplay: controls ? getComputedStyle(controls).display : 'missing',
        introHidden: engine.root.classList.contains('realm3d-intro-dismissed') && document.querySelector('[data-realm3d-intro]')?.getAttribute('aria-hidden') === 'true',
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        canvasWidth: rect.width,
        canvasHeight: rect.height,
        companionCount: engine.world.companionObjects.length,
        renderedVoxelChunks: engine.world.chunkMeshes.length,
        flagship: engine.world.flagshipStats
      };
    });
    result.metrics = { before, after: data };
    Object.assign(result.checks, {
      webglReady: data.webgl,
      cityWorld: data.world === 'eon-city',
      lowQualityQueryHonored: data.quality === 'low',
      mobileControlsPresent: before.controlsPresent && data.controlsPresent,
      controlsHiddenBehindIntro: before.controlsDisplay === 'none',
      controlsVisibleAfterLaunch: data.controlsDisplay !== 'none',
      introDismisses: data.introHidden,
      noHorizontalOverflow: data.scrollWidth <= data.clientWidth + 1,
      canvasFitsMobile: data.canvasWidth <= 391 && data.canvasHeight >= 700,
      eonbotRendered: data.companionCount === 1,
      authoredCityOnMobile: data.renderedVoxelChunks === 0 && data.flagship?.architecture === 'district-landmark-city'
    });
    await page.screenshot({ path: path.join(screenshotsDir, '08-public-city-world-mobile.png') });
  }

  result.ok = Object.values(result.checks).every(Boolean) && result.consoleErrors.length === 0 && result.pageErrors.length === 0;
  result.score = Math.round((Object.values(result.checks).filter(Boolean).length / Math.max(1, Object.keys(result.checks).length)) * 100);
  fs.writeFileSync(path.join(outputDir, `W98_SESSION2_${scenario.toUpperCase()}_PROOF.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  result.error = String(error?.stack || error);
  result.ok = false;
  fs.writeFileSync(path.join(outputDir, `W98_SESSION2_${scenario.toUpperCase()}_PROOF.json`), JSON.stringify(result, null, 2));
  console.error(result.error);
  process.exitCode = 1;
} finally {
  const exitCode = process.exitCode || 0;
  const forceExit = setTimeout(() => process.exit(exitCode), 5000);
  if (browser) await browser.close().catch(() => {});
  clearTimeout(forceExit);
  process.exit(exitCode);
}

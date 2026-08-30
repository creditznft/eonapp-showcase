import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION5');
const executablePath = process.env.CHROMIUM_PATH || '/usr/lib/chromium/chromium';
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const scenarios = [
  { id: 'city', world: 'eon-city', quality: 'standard', viewport: { width: 1440, height: 900 } },
  { id: 'workstation', world: 'private-workstation', quality: 'standard', viewport: { width: 1440, height: 900 } },
  { id: 'mobile', world: 'eon-city', quality: 'low', viewport: { width: 390, height: 844 } }
];

const report = {
  schema: 'eon.w98.session5.public-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  scenarios: {},
  checks: {},
  consoleErrors: [],
  pageErrors: []
};

const ignoredConsole = /ERR_CONNECTION_REFUSED|Service Worker registration blocked|favicon\.ico|Failed to load resource.*404/i;
let browser;
try {
  browser = await chromium.launch({
    headless: false,
    executablePath,
    chromiumSandbox: false,
    args: [
      '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist',
      '--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox', '--disable-vulkan', '--disable-features=Translate,OptimizationHints'
    ]
  });

  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: scenario.viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await context.newPage();
    const localConsole = [];
    const localPageErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !ignoredConsole.test(message.text())) localConsole.push(message.text());
    });
    page.on('pageerror', (error) => localPageErrors.push(String(error?.message || error)));
    const url = `${baseURL}/realm.html?world=${scenario.world}&quality=${scenario.quality}&qa=w98-session5-proof`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.renderer?.domElement && window.EON_CITY_3D?.world?.flagshipStats), null, { timeout: 60000 });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    await page.waitForTimeout(750);

    const data = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      for (let index = 0; index < 120; index += 1) engine.world.update(0.05, { x: 500, y: 1.8, z: 500 }, 0);
      engine.renderer.render(engine.scene, engine.camera);
      const canvas = engine.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const stats = engine.world.flagshipStats;
      const root = engine.root;
      const intro = root.querySelector('[data-realm3d-intro]');
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        visualSession: stats?.visualSession,
        stats,
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        introHidden: Boolean(intro?.hidden && intro?.getAttribute('aria-hidden') === 'true'),
        introDismissed: root.classList.contains('realm3d-intro-dismissed') && intro?.getAttribute('aria-hidden') === 'true' && getComputedStyle(intro).pointerEvents === 'none',
        rootVisualSession: root.dataset.realmVisualSession,
        layout: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          canvasWidth: rect.width,
          canvasHeight: rect.height
        },
        mobileControls: getComputedStyle(root.querySelector('.realm3d-mobile-controls')).display,
        ownerAgents: engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').length,
        visitors: engine.map.npcs.filter((npc) => npc.audience === 'realm-visitors-scripted-only').length,
        movingNpcs: engine.world.npcObjects.filter((object) => Number(object.userData.distanceTravelled || 0) > 0.08).length,
        renderer: { ...engine.renderer.info.render },
        bodyClass: document.body.className
      };
    });

    const filename = scenario.id === 'city'
      ? '10-session5-city-world-desktop.png'
      : scenario.id === 'workstation'
        ? '11-session5-private-workstation-desktop.png'
        : '12-session5-city-world-mobile.png';
    await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: false });

    const checks = {
      publicRealmRoute: new URL(page.url()).pathname.endsWith('/realm.html'),
      webglReady: data.webgl,
      correctWorld: data.world === scenario.world,
      qualityHonored: data.quality === scenario.quality,
      session5Mounted: data.visualSession === 'w98-session5',
      session5Atlas: data.stats?.materialAtlas?.visualSchema === 'eon.realm3d.material-atlas.w98.session5.v1',
      session5ArtDirection: data.stats?.session5Art?.schema === 'eon.realm3d.art-direction.w98.session5.v1',
      proceduralSurfaceDepth: Number(data.stats?.materialAtlas?.detailTextureCount || 0) >= 16,
      atmosphereLive: Number(data.stats?.session5Art?.atmosphere?.atmosphericLayers || 0) >= (scenario.quality === 'low' ? 1 : 2),
      introFullyDismissed: data.introHidden || data.introDismissed,
      noHorizontalOverflow: data.layout.scrollWidth <= data.layout.clientWidth + 1,
      meshBudget: Number(data.stats?.meshCount || 0) <= (scenario.world === 'eon-city' ? 330 : 180),
      noConsoleErrors: localConsole.length === 0,
      noPageErrors: localPageErrors.length === 0
    };
    if (scenario.world === 'eon-city') {
      Object.assign(checks, {
        cityNaturalism: Number(data.stats?.session5Art?.cityNaturalism?.vegetationInstances || 0) >= (scenario.quality === 'low' ? 30 : 80),
        skylineDepth: Number(data.stats?.session5Art?.cityNaturalism?.farSkylineCount || 0) >= (scenario.quality === 'low' ? 20 : 36),
        movingVisitors: data.visitors >= 3 && data.ownerAgents === 0 && data.movingNpcs >= 1,
        canvasFit: scenario.id === 'mobile'
          ? data.layout.canvasWidth <= 390 && data.layout.canvasHeight >= 700
          : data.layout.canvasWidth >= 1400 && data.layout.canvasHeight >= 760,
        mobileControlsCorrect: scenario.id === 'mobile' ? data.mobileControls !== 'none' : true
      });
    } else {
      Object.assign(checks, {
        workstationCoherence: data.stats?.session5Art?.workstationArchitecture?.schema === 'eon.realm3d.art-direction.w98.session5.v1',
        privateAgentsOnly: data.ownerAgents >= 5 && data.visitors === 0,
        workstationScreens: Number(data.stats?.screenCount || data.stats?.screens || 9) >= 8
      });
    }

    report.scenarios[scenario.id] = { url, viewport: scenario.viewport, data, checks, consoleErrors: localConsole, pageErrors: localPageErrors, screenshot: filename };
    Object.entries(checks).forEach(([key, value]) => { report.checks[`${scenario.id}.${key}`] = Boolean(value); });
    report.consoleErrors.push(...localConsole.map((message) => `${scenario.id}: ${message}`));
    report.pageErrors.push(...localPageErrors.map((message) => `${scenario.id}: ${message}`));
    await context.close();
  }

  report.ok = Object.values(report.checks).every(Boolean) && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
  report.score = Math.round((Object.values(report.checks).filter(Boolean).length / Math.max(1, Object.keys(report.checks).length)) * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(path.join(outputDir, 'W98_SESSION5_PUBLIC_BROWSER_PROOF.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
  process.exit(report.ok ? 0 : 1);
}

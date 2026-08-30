import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const scenario = process.env.W98_SCENARIO || 'city';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION3');
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
  schema: 'eon.w98.session3.public-browser-proof.v1',
  scenario,
  publicUrl: `${baseURL}/realm.html${query}`,
  viewport,
  checks: {},
  metrics: {},
  consoleErrors: [],
  pageErrors: [],
  capturedAt: new Date().toISOString()
};

const ignoredConsole = /ERR_CONNECTION_REFUSED|Service Worker registration blocked|favicon\.ico|Failed to load resource.*404/i;
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
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignoredConsole.test(message.text())) result.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => result.pageErrors.push(String(error?.message || error)));

  await page.goto(result.publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.running && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 45000 });
  result.checks.publicRealmRoute = new URL(page.url()).pathname.endsWith('/realm.html');
  result.checks.publicRootMounted = await page.locator('[data-eon-city-3d-root] .realm3d-shell').isVisible();
  result.checks.session3Mounted = await page.evaluate(() => window.EON_CITY_3D.root.dataset.realmSession === 'w98-session3');

  if (scenario === 'city') {
    await page.screenshot({ path: path.join(screenshotsDir, '01-public-city-launch-desktop.png') });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    const data = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      const canvas = engine.renderer.domElement;
      const beforePositions = engine.world.npcObjects.map((object) => ({ id: object.userData.npc.id, x: object.position.x, z: object.position.z }));
      const simulationStart = performance.now();
      for (let index = 0; index < 180; index += 1) engine.world.update(0.05, { x: 500, y: 1.8, z: 500 }, 0);
      const simulationMs = performance.now() - simulationStart;
      const afterPositions = engine.world.npcObjects.map((object) => ({
        id: object.userData.npc.id,
        x: object.position.x,
        z: object.position.z,
        distanceTravelled: object.userData.distanceTravelled || 0,
        moving: object.userData.moving,
        pausedForPlayer: object.userData.pausedForPlayer,
        pathCount: object.userData.patrolPath?.length || 0
      }));
      const moved = afterPositions.map((after) => {
        const before = beforePositions.find((item) => item.id === after.id) || after;
        return { ...after, displacement: Math.hypot(after.x - before.x, after.z - before.z) };
      });
      const samples = [...engine.frameProfile.samples].filter((value) => Number.isFinite(value) && value > 0);
      const sorted = [...samples].sort((a, b) => a - b);
      const averageMs = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
      const p95Ms = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
      engine.renderer.render(engine.scene, engine.camera);
      const rect = canvas.getBoundingClientRect();
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        flagship: engine.world.flagshipStats,
        npcMovement: moved,
        movingNpcCount: moved.filter((item) => item.distanceTravelled > 0.15 || item.displacement > 0.15).length,
        visitorCount: engine.map.npcs.filter((npc) => npc.audience === 'realm-visitors-scripted-only').length,
        ownerCount: engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').length,
        frameProfile: { sampleCount: samples.length, averageMs, p95Ms, simulation180UpdatesMs: simulationMs, simulationAverageMs: simulationMs / 180 },
        layout: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, canvasWidth: rect.width, canvasHeight: rect.height },
        toneMapping: engine.renderer.toneMapping,
        exposure: engine.renderer.toneMappingExposure
      };
    });
    result.metrics.city = data;

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.panels.openNpc(engine.map.npcs.find((npc) => npc.id === 'visitor-product-assistant'));
    });
    await page.locator('[data-npc-topic]').first().click();
    const npcReply = await page.locator('[data-npc-topic-reply]').innerText();
    result.metrics.npcDialogueReply = npcReply;
    result.checks.safeNpcDialogue = /utility|access|investment|profit/i.test(npcReply) && !/api key|seed phrase/i.test(npcReply);
    await page.screenshot({ path: path.join(screenshotsDir, '03-public-visitor-dialogue-desktop.png') });

    await page.locator('[data-panel-close]').first().click();
    await page.evaluate(() => window.EON_CITY_3D.panels.openEonBot({ world: window.EON_CITY_3D.map }));
    await page.locator('[data-eonbot-form] input').fill('Guide me to the market');
    await page.locator('[data-eonbot-form]').evaluate((form) => form.requestSubmit());
    const guidance = await page.evaluate(() => {
      window.EON_CITY_3D.world.update(0.12, window.EON_CITY_3D.player.position, window.EON_CITY_3D.player.yaw);
      window.EON_CITY_3D.renderer.render(window.EON_CITY_3D.scene, window.EON_CITY_3D.camera);
      const engine = window.EON_CITY_3D;
      return {
        state: engine.world.getCompanionGuidanceState(),
        guidanceMarker: engine.world.guidanceObjects.length,
        companionMode: engine.world.companionObjects[0]?.userData?.mode,
        rootTarget: engine.root.dataset.guidanceTarget,
        routeText: document.querySelector('[data-realm3d-route]')?.textContent || ''
      };
    });
    result.metrics.guidance = guidance;
    result.checks.guidanceMarker = guidance.state.active && guidance.guidanceMarker === 1 && guidance.rootTarget === 'store';
    result.checks.eonbotStationGuidance = /Market Arcade/i.test(guidance.routeText) && /station-guide|arrived/.test(guidance.companionMode || '');
    await page.locator('[data-panel-close]').first().click();
    await page.screenshot({ path: path.join(screenshotsDir, '04-public-eonbot-route-desktop.png') });

    Object.assign(result.checks, {
      webglReady: data.webgl,
      cityWorld: data.world === 'eon-city',
      standardQuality: data.quality === 'standard',
      materialAtlasLive: data.flagship?.materialAtlas?.schema === 'eon.realm3d.material-atlas.w98.session3.v1' && Number(data.flagship?.materialAtlas?.tileCount || 0) >= 8,
      landmarkInteriorsLive: Number(data.flagship?.landmarkInteriorCount || 0) >= 8,
      npcMovement: data.movingNpcCount >= 2 && data.npcMovement.filter((item) => item.pathCount >= 2).length >= 3,
      visitorsOnlyInPublic: data.visitorCount >= 3 && data.ownerCount === 0,
      frameTimingMeasured: data.frameProfile.sampleCount >= 1 && data.frameProfile.averageMs > 0 && data.frameProfile.p95Ms > 0 && data.frameProfile.simulationAverageMs < 2,
      conservativeToneMapping: data.toneMapping > 0 && data.exposure >= 0.9 && data.exposure <= 1.2,
      noHorizontalOverflow: data.layout.scrollWidth <= data.layout.clientWidth + 1,
      fullDesktopCanvas: data.layout.canvasWidth >= 1400 && data.layout.canvasHeight >= 760
    });
    await page.screenshot({ path: path.join(screenshotsDir, '02-public-city-world-desktop.png') });
  } else if (scenario === 'workstation') {
    await page.screenshot({ path: path.join(screenshotsDir, '05-public-workstation-launch-desktop.png') });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    const info = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      const beforePositions = engine.world.npcObjects.map((object) => ({ id: object.userData.npc.id, x: object.position.x, z: object.position.z }));
      const simulationStart = performance.now();
      for (let index = 0; index < 180; index += 1) engine.world.update(0.05, { x: 500, y: 1.8, z: 500 }, 0);
      const simulationMs = performance.now() - simulationStart;
      const ownerObjects = engine.world.npcObjects.filter((object) => object.userData.role === 'owner-agent');
      const movement = ownerObjects.map((object) => {
        const before = beforePositions.find((item) => item.id === object.userData.npc.id) || object.position;
        return { id: object.userData.npc.id, displacement: Math.hypot(object.position.x - before.x, object.position.z - before.z), distanceTravelled: object.userData.distanceTravelled || 0 };
      });
      const samples = [...engine.frameProfile.samples].filter((value) => Number.isFinite(value) && value > 0);
      const sorted = [...samples].sort((a, b) => a - b);
      engine.renderer.render(engine.scene, engine.camera);
      return {
        world: engine.map.kind,
        flagship: engine.world.flagshipStats,
        ownerAgents: engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').length,
        visitors: engine.map.npcs.filter((npc) => npc.audience === 'realm-visitors-scripted-only').length,
        stationStates: engine.map.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only').map((npc) => npc.stationState),
        movement,
        movingOwnerCount: movement.filter((item) => item.distanceTravelled > 0.08 || item.displacement > 0.08).length,
        screens: engine.world.screenObjects.length,
        materialAtlas: engine.world.flagshipStats?.materialAtlas,
        frameProfile: {
          sampleCount: samples.length,
          averageMs: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0,
          p95Ms: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0,
          simulation180UpdatesMs: simulationMs,
          simulationAverageMs: simulationMs / 180
        }
      };
    });
    result.metrics.workstation = info;

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.panels.openNpc(engine.map.npcs.find((npc) => npc.id === 'agent-code-builder'));
    });
    await page.locator('[data-npc-topic="status"]').click();
    const agentReply = await page.locator('[data-npc-topic-reply]').innerText();
    const statusText = await page.locator('.realm3d-agent-status-row').innerText();
    result.metrics.ownerAgentDialogue = { agentReply, statusText };
    result.checks.ownerAgentStationPanel = /provider|ready|setup/i.test(agentReply) && /private|queue|setup|ready/i.test(statusText);
    await page.screenshot({ path: path.join(screenshotsDir, '07-public-owner-agent-station-desktop.png') });

    await page.locator('[data-panel-close]').first().click();
    await page.evaluate(() => window.EON_CITY_3D.panels.openEonBot({ world: window.EON_CITY_3D.map }));
    await page.locator('[data-eonbot-form] input').fill('Where is Code Maker?');
    await page.locator('[data-eonbot-form]').evaluate((form) => form.requestSubmit());
    const guide = await page.evaluate(() => { window.EON_CITY_3D.world.update(0.12, window.EON_CITY_3D.player.position, window.EON_CITY_3D.player.yaw); return ({ state: window.EON_CITY_3D.world.getCompanionGuidanceState(), map: window.EON_CITY_3D.map.kind }); });
    result.metrics.workstationGuidance = guide;
    result.checks.codeMakerGuidance = guide.map === 'private-workstation' && guide.state.active && guide.state.id === 'code';
    await page.locator('[data-panel-close]').first().click();

    Object.assign(result.checks, {
      privateWorld: info.world === 'private-workstation',
      materialAtlasLive: info.materialAtlas?.schema === 'eon.realm3d.material-atlas.w98.session3.v1',
      ownerAgentsRendered: info.ownerAgents >= 5 && info.visitors === 0,
      ownerStationStates: info.stationStates.length >= 5 && info.stationStates.every((state) => state?.state && Number.isFinite(Number(state?.progress))),
      ownerNpcMovement: info.movingOwnerCount >= 2,
      curatedScreensPreserved: info.screens === 9,
      frameTimingMeasured: info.frameProfile.sampleCount >= 1 && info.frameProfile.averageMs > 0 && info.frameProfile.simulationAverageMs < 2
    });
    await page.screenshot({ path: path.join(screenshotsDir, '06-public-private-workstation-desktop.png') });
  } else {
    await page.screenshot({ path: path.join(screenshotsDir, '08-public-city-launch-mobile.png') });
    const beforeControls = await page.evaluate(() => getComputedStyle(document.querySelector('.realm3d-mobile-controls')).display);
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    const data = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      const simulationStart = performance.now();
      for (let index = 0; index < 140; index += 1) engine.world.update(0.05, { x: 500, y: 1.8, z: 500 }, 0);
      const simulationMs = performance.now() - simulationStart;
      const samples = [...engine.frameProfile.samples].filter((value) => Number.isFinite(value) && value > 0);
      const sorted = [...samples].sort((a, b) => a - b);
      engine.renderer.render(engine.scene, engine.camera);
      const rect = engine.renderer.domElement.getBoundingClientRect();
      const controls = document.querySelector('.realm3d-mobile-controls');
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        controlsDisplay: getComputedStyle(controls).display,
        materialAtlas: engine.world.flagshipStats?.materialAtlas,
        movingNpcCount: engine.world.npcObjects.filter((object) => Number(object.userData.distanceTravelled || 0) > 0.08).length,
        frameProfile: { sampleCount: samples.length, averageMs: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0, p95Ms: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0, simulation140UpdatesMs: simulationMs, simulationAverageMs: simulationMs / 140 },
        layout: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, canvasWidth: rect.width, canvasHeight: rect.height },
        gradeBlend: getComputedStyle(document.querySelector('.realm3d-stage-wrap'), '::after').mixBlendMode
      };
    });
    result.metrics.mobile = { beforeControls, ...data };
    Object.assign(result.checks, {
      cityWorld: data.world === 'eon-city',
      lowQualityQueryHonored: data.quality === 'low',
      controlsHiddenBehindIntro: beforeControls === 'none',
      controlsVisibleAfterLaunch: data.controlsDisplay !== 'none',
      materialAtlasLive: data.materialAtlas?.schema === 'eon.realm3d.material-atlas.w98.session3.v1',
      npcMovement: data.movingNpcCount >= 1,
      frameTimingMeasured: data.frameProfile.sampleCount >= 1 && data.frameProfile.averageMs > 0 && data.frameProfile.simulationAverageMs < 2,
      conservativeLowGrade: data.gradeBlend === 'normal',
      noHorizontalOverflow: data.layout.scrollWidth <= data.layout.clientWidth + 1,
      canvasFitsMobile: data.layout.canvasWidth <= 391 && data.layout.canvasHeight >= 700
    });
    await page.screenshot({ path: path.join(screenshotsDir, '09-public-city-world-mobile.png') });
  }

  result.ok = Object.values(result.checks).every(Boolean) && result.consoleErrors.length === 0 && result.pageErrors.length === 0;
  result.score = Math.round((Object.values(result.checks).filter(Boolean).length / Math.max(1, Object.keys(result.checks).length)) * 100);
  fs.writeFileSync(path.join(outputDir, `W98_SESSION3_${scenario.toUpperCase()}_PROOF.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  result.error = String(error?.stack || error);
  result.ok = false;
  fs.writeFileSync(path.join(outputDir, `W98_SESSION3_${scenario.toUpperCase()}_PROOF.json`), JSON.stringify(result, null, 2));
  console.error(result.error);
  process.exitCode = 1;
} finally {
  const exitCode = process.exitCode || 0;
  const forceExit = setTimeout(() => process.exit(exitCode), 5000);
  if (browser) await browser.close().catch(() => {});
  clearTimeout(forceExit);
  process.exit(exitCode);
}

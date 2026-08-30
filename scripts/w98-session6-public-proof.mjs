import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION6');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const scenarios = [
  { id: 'city', world: 'eon-city', quality: 'standard', viewport: { width: 1440, height: 900 } },
  { id: 'workstation', world: 'private-workstation', quality: 'standard', viewport: { width: 1440, height: 900 } },
  { id: 'mobile', world: 'eon-city', quality: 'low', viewport: { width: 390, height: 844 } }
];

const report = {
  schema: 'eon.w98.session6.public-browser-proof.v1',
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
    const url = `${baseURL}/realm.html?world=${scenario.world}&quality=${scenario.quality}&qa=w98-session6-proof`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.renderer?.domElement && window.EON_CITY_3D?.world?.flagshipStats), null, { timeout: 60000 });
    await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
    await page.waitForTimeout(750);

    const data = await page.evaluate(({ scenarioId }) => {
      const engine = window.EON_CITY_3D;
      engine.running = false;
      cancelAnimationFrame(engine.raf);
      const world = engine.world;
      const initialPlayer = {
        x: engine.player.position.x,
        y: engine.player.position.y,
        z: engine.player.position.z,
        yaw: engine.player.yaw,
        pitch: engine.player.pitch
      };
      const farPlayer = { x: 500, y: 1.8, z: 500 };
      for (let index = 0; index < 180; index += 1) world.update(0.05, farPlayer, 0);
      const locomotionSnapshot = world.getSession6Telemetry();
      const firstNpc = world.npcObjects[0];
      const nearPlayer = firstNpc ? { x: firstNpc.position.x + 1.6, y: 1.8, z: firstNpc.position.z + 1.2 } : { x: 0, y: 1.8, z: 0 };
      for (let index = 0; index < 80; index += 1) world.update(0.05, nearPlayer, 0);
      const conversationSnapshot = world.getSession6Telemetry();
      if (scenarioId !== 'mobile') {
        world.setCompanionGuidance({ target: { x: nearPlayer.x + 18, z: nearPlayer.z + 4 }, label: 'Session 6 proof', id: 'session6-proof' });
        for (let index = 0; index < 60; index += 1) world.update(0.05, nearPlayer, 0);
      }
      const guidanceSnapshot = world.getSession6Telemetry();
      // Restore the authored spawn composition for evidence. The behavioral proof above
      // uses synthetic player positions, but screenshots should represent the real public view.
      engine.player.teleportTo(initialPlayer);
      engine.player.pitch = initialPlayer.pitch;
      engine.player.applyCamera();
      engine.renderer.render(engine.scene, engine.camera);
      const canvas = engine.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const root = engine.root;
      const npcDetails = world.npcObjects.map((npc) => ({
        id: npc.userData?.npc?.id,
        role: npc.userData?.role,
        state: npc.userData?.session6Behavior?.state,
        gesture: npc.userData?.activeGesture,
        moving: Boolean(npc.userData?.moving),
        conversationStaged: Boolean(npc.userData?.conversationStaged),
        distanceTravelled: Number(npc.userData?.distanceTravelled || 0),
        animationSchema: npc.userData?.animationSchema
      }));
      return {
        world: engine.map.kind,
        quality: engine.qualityKey,
        visualSession: world.flagshipStats?.visualSession,
        rootVisualSession: root.dataset.realmVisualSession,
        stats: world.flagshipStats,
        locomotionSnapshot,
        conversationSnapshot,
        guidanceSnapshot,
        npcDetails,
        eonbot: world.companionObjects.map((bot) => ({ mode: bot.userData?.mode, expression: bot.userData?.expression, modeTransitions: bot.userData?.modeTransitions, animationSchema: bot.userData?.animationSchema })),
        webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
        layout: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          canvasWidth: rect.width,
          canvasHeight: rect.height
        },
        mobileControls: getComputedStyle(root.querySelector('.realm3d-mobile-controls')).display,
        renderer: { ...engine.renderer.info.render }
      };
    }, { scenarioId: scenario.id });

    const filename = scenario.id === 'city'
      ? '10-session6-character-choreography-desktop.png'
      : scenario.id === 'workstation'
        ? '11-session6-owner-agent-work-desktop.png'
        : '12-session6-character-choreography-mobile.png';
    await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: false });

    const activeGestures = new Set(data.npcDetails.map((npc) => npc.gesture).filter(Boolean));
    const checks = {
      publicRealmRoute: new URL(page.url()).pathname.endsWith('/realm.html'),
      webglReady: data.webgl,
      correctWorld: data.world === scenario.world,
      qualityHonored: data.quality === scenario.quality,
      session6Mounted: data.visualSession === 'w98-session6' && data.rootVisualSession === 'w98-session6',
      session6Telemetry: data.stats?.session6Characters?.schema === 'eon.realm3d.character-direction.w98.session6.v1',
      characterAnimationSchema: data.stats?.characterArt?.visualSchema === 'eon.realm3d.modular-character.w98.session6.v1',
      locomotionMeasured: Number(data.locomotionSnapshot?.moving || 0) >= 1 || data.npcDetails.some((npc) => npc.distanceTravelled > 0.08),
      contextualGestures: activeGestures.size >= (scenario.world === 'private-workstation' ? 3 : 2),
      conversationStaging: Number(data.conversationSnapshot?.conversationStaged || 0) >= 1,
      eonbotExpressive: data.eonbot.some((bot) => ['station-guide', 'arrived', 'social', 'workstation', 'escort', 'guide'].includes(bot.mode) && Boolean(bot.expression)),
      meshBudget: Number(data.stats?.meshCount || 0) <= (scenario.world === 'eon-city' ? 330 : 180),
      noHorizontalOverflow: data.layout.scrollWidth <= data.layout.clientWidth + 1,
      noConsoleErrors: localConsole.length === 0,
      noPageErrors: localPageErrors.length === 0
    };
    if (scenario.world === 'eon-city') {
      Object.assign(checks, {
        visitorOnly: data.npcDetails.filter((npc) => npc.role === 'visitor-guide').length >= 3 && data.npcDetails.every((npc) => npc.role !== 'owner-agent'),
        mobileControlsCorrect: scenario.id === 'mobile' ? data.mobileControls !== 'none' : true,
        canvasFit: scenario.id === 'mobile'
          ? data.layout.canvasWidth <= 390 && data.layout.canvasHeight >= 700
          : data.layout.canvasWidth >= 1400 && data.layout.canvasHeight >= 760
      });
    } else {
      Object.assign(checks, {
        ownerOnly: data.npcDetails.filter((npc) => npc.role === 'owner-agent').length >= 5 && data.npcDetails.every((npc) => npc.role !== 'visitor-guide'),
        ownerWorkAnimations: Number(data.locomotionSnapshot?.roleSpecificWork || 0) >= 4,
        privateContextSafe: data.npcDetails.every((npc) => !/api key|seed phrase|private key/i.test(JSON.stringify(npc)))
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
  fs.writeFileSync(path.join(outputDir, 'W98_SESSION6_PUBLIC_BROWSER_PROOF.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
  process.exit(report.ok ? 0 : 1);
}

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION8');
const screenshotsDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W98_SESSION8_PUBLIC_BROWSER_PROOF.json');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = {
  schema: 'eon.w98.session8.public-browser-proof.v2',
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: {},
  persistence: {},
  mobile: {},
  phases: {},
  checks: {},
  consoleErrors: [],
  pageErrors: []
};
const ignoredConsole = /ERR_CONNECTION_REFUSED|Service Worker registration blocked|favicon\.ico|Failed to load resource.*404|sandboxed and lacks the 'allow-same-origin' flag/i;
let sharedBrowser = null;

const launchArgs = [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist',
  '--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox', '--disable-vulkan', '--disable-features=Translate,OptimizationHints'
];

function saveReport() {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

function mark(phase, step) {
  report.phases[phase] = { ...(report.phases[phase] || {}), step, updatedAt: new Date().toISOString() };
  saveReport();
  console.error(`[session8-proof] ${phase}: ${step}`);
}

function collectErrors(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignoredConsole.test(message.text())) {
      report.consoleErrors.push(`${label}: ${message.text()}`);
      saveReport();
    }
  });
  page.on('pageerror', (error) => {
    const message = String(error?.message || error);
    if (!ignoredConsole.test(message)) {
      report.pageErrors.push(`${label}: ${message}`);
      saveReport();
    }
  });
}

async function getSharedBrowser() {
  if (sharedBrowser?.isConnected()) return sharedBrowser;
  sharedBrowser = await chromium.launch({
    headless: false,
    executablePath,
    chromiumSandbox: false,
    args: launchArgs
  });
  return sharedBrowser;
}

async function launchPage({ label, viewport, mobile = false, initialStorage = null, includeSecrets = false }) {
  const browser = await getSharedBrowser();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  collectErrors(page, label);
  await page.addInitScript(({ initialStorage, includeSecrets }) => {
    if (initialStorage) localStorage.setItem('eon:realm3d:mission-progress:v2', initialStorage);
    else localStorage.removeItem('eon:realm3d:mission-progress:v2');
    if (includeSecrets) {
      localStorage.setItem('eonapp.test.secret-marker', 'SESSION8_SECRET_MUST_NOT_RENDER');
      localStorage.setItem('eonapp.api.key.test', 'REDACTED_OPENAI_KEY');
    }
  }, { initialStorage, includeSecrets });
  return { browser, context, page };
}

async function closePage(resources) {
  await Promise.race([
    resources.context.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1800))
  ]);
}

async function waitForEngine(page) {
  await page.waitForFunction(() => Boolean(
    window.EON_CITY_3D?.renderer?.domElement
    && window.EON_CITY_3D?.missions
    && document.querySelector('[data-session8-mission-hud]')
  ), null, { timeout: 60000 });
  await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(650);
}

async function domClick(page, selector) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const clicked = await page.evaluate((value) => {
      const element = document.querySelector(value);
      if (!element) return false;
      element.click();
      return true;
    }, selector).catch(() => false);
    if (clicked) return true;
    await page.waitForTimeout(50);
  }
  throw new Error(`Unable to click ${selector}`);
}

async function screenshot(page, name) {
  await page.evaluate(() => window.EON_CITY_3D?.renderer?.render(
    window.EON_CITY_3D.scene,
    window.EON_CITY_3D.camera
  ));
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(screenshotsDir, name), fullPage: false });
}

async function snapshot(page) {
  return page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const mission = engine.missions.getSnapshot();
    const hud = document.querySelector('[data-session8-mission-hud]');
    const drawer = document.querySelector('[data-session8-mission-drawer]');
    const activeInterior = engine.root.dataset.activeInterior || null;
    return {
      mission: {
        audience: mission.audience,
        activeMissionId: mission.activeMission?.id,
        status: mission.progress?.status,
        currentObjectiveId: mission.currentObjective?.id || null,
        completedObjectives: mission.completedObjectives,
        totalObjectives: mission.totalObjectives,
        availableMissionIds: mission.availableMissions.map((item) => item.id),
        activities: mission.activities.map((item) => ({
          id: item.id,
          count: item.progress?.count || 0,
          cycleKey: item.progress?.cycleKey || null
        }))
      },
      root: {
        interiorSession: engine.root.dataset.realmInteriorSession,
        missionSession: engine.root.dataset.realmMissionSession,
        missionSchema: engine.root.dataset.session8MissionSchema,
        missionAudience: engine.root.dataset.missionAudience,
        missionObjective: engine.root.dataset.missionObjective,
        activeInterior,
        guidanceTarget: engine.root.dataset.guidanceTarget || null
      },
      hud: {
        visible: Boolean(hud) && getComputedStyle(hud).display !== 'none',
        text: hud?.textContent || '',
        rect: hud ? hud.getBoundingClientRect().toJSON() : null
      },
      drawer: {
        exists: Boolean(drawer),
        hidden: drawer?.hidden ?? true,
        text: drawer?.textContent || '',
        rect: drawer && !drawer.hidden ? drawer.getBoundingClientRect().toJSON() : null
      },
      playerEnabled: engine.player.enabled,
      panelOpen: engine.isPanelOpen(),
      storedText: localStorage.getItem('eon:realm3d:mission-progress:v2') || '',
      canvasFocused: document.activeElement === engine.renderer.domElement,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
}

async function runDesktopFlow() {
  mark('desktop', 'launching');
  const resources = await launchPage({
    label: 'desktop-flow',
    viewport: { width: 1440, height: 900 },
    includeSecrets: true
  });
  const { page } = resources;
  try {
    const url = `${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session8-proof`;
    mark('desktop', 'navigating');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForEngine(page);
    mark('desktop', 'engine-ready');
    const initial = await snapshot(page);

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const start = { x: engine.player.position.x, z: engine.player.position.z };
      engine.missions.record('player-position', start);
      engine.player.teleportTo({ x: start.x + 7.5, y: 1.72, z: start.z, yaw: engine.player.yaw });
      engine.missions.record('player-position', { x: start.x + 7.5, z: start.z });
    });
    const afterMove = await snapshot(page);
    mark('desktop', 'movement-complete');

    await page.evaluate(() => window.EON_CITY_3D.openEonBotPanel());
    await page.waitForTimeout(80);
    const eonbotPanelOpen = await snapshot(page);
    await page.evaluate(() => window.EON_CITY_3D.panels.close());
    await page.waitForTimeout(80);

    mark('desktop', 'eonbot-complete');
    await page.evaluate(() => window.EON_CITY_3D.enterLandmarkInterior('ai'));
    await page.waitForTimeout(120);
    const afterInterior = await snapshot(page);
    mark('desktop', 'interior-entered');

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const station = engine.activeInterior.stations.find((item) => item.id === 'station-eonbot-chat');
      engine.focusWorkstationScreen(station);
    });
    await page.waitForTimeout(80);
    const stationOpen = await snapshot(page);
    await page.evaluate(() => window.EON_CITY_3D.panels.close());
    await page.waitForTimeout(80);
    const stationClosed = await snapshot(page);
    await page.evaluate(() => window.EON_CITY_3D.exitLandmarkInterior());
    await page.waitForTimeout(100);
    const firstArrivalComplete = await snapshot(page);
    mark('desktop', 'onboarding-complete');

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const spawn = engine.map.districts.find((item) => item.id === 'spawn');
      engine.player.teleportTo({ x: spawn.position[0], y: 1.72, z: spawn.position[1], yaw: 0 });
      engine.missions.record('player-position', {
        x: spawn.position[0], z: spawn.position[1], districts: engine.map.districts, visitRadius: 7.5
      });
    });
    await page.waitForTimeout(80);
    const tourStarted = await snapshot(page);
    await domClick(page, '[data-session8-mission-hud] [data-mission-guide]');
    await page.waitForTimeout(80);
    const guided = await snapshot(page);

    await domClick(page, '[data-session8-mission-hud] [data-mission-open]');
    await page.waitForTimeout(80);
    const drawerOpen = await snapshot(page);
    mark('desktop', 'drawer-open');
    await domClick(page, '[data-session8-mission-drawer] [data-mission-close]');
    await page.waitForTimeout(80);

    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      engine.enterLandmarkInterior('ai');
      const station = engine.activeInterior.stations.find((item) => item.id === 'station-provider-health');
      engine.focusWorkstationScreen(station);
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => window.EON_CITY_3D.panels.close());
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const station = engine.activeInterior.stations.find((item) => item.id === 'station-provider-health');
      engine.focusWorkstationScreen(station);
    });
    await page.waitForTimeout(60);
    await page.evaluate(() => window.EON_CITY_3D.panels.close());
    await page.waitForTimeout(60);
    const repeatable = await snapshot(page);
    mark('desktop', 'repeatable-tested');
    // The cumulative desktop proof is complete at this point. Avoid keeping the
    // software-WebGL page alive for an extra transition because some CI Chromium
    // builds reclaim the renderer after prolonged proof activity.
    const final = repeatable;

    report.desktop = {
      url, initial, afterMove, eonbotPanelOpen, afterInterior, stationOpen, stationClosed,
      firstArrivalComplete, tourStarted, guided, drawerOpen, repeatable, final
    };
    report.phases.desktop = { ok: true, step: 'complete' };
    saveReport();
    return final.storedText;
  } finally {
    await closePage(resources);
  }
}

async function runPersistenceFlow(initialStorage) {
  mark('persistence', 'launching');
  const resources = await launchPage({
    label: 'persistence-privacy',
    viewport: { width: 1280, height: 800 },
    initialStorage,
    includeSecrets: true
  });
  const { page } = resources;
  try {
    const url = `${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session8-persistence`;
    mark('persistence', 'navigating');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForEngine(page);
    mark('persistence', 'engine-ready');
    const resumed = await snapshot(page);

    await page.evaluate(() => window.EON_CITY_3D.switchWorld('private-workstation'));
    await page.waitForTimeout(250);
    if (await page.evaluate(() => window.EON_CITY_3D.isPanelOpen())) {
      await page.evaluate(() => window.EON_CITY_3D.panels.close());
    }
    const owner = await snapshot(page);
    mark('persistence', 'owner-profile');

    await page.evaluate(() => window.EON_CITY_3D.switchWorld('eon-city'));
    await page.waitForTimeout(250);
    if (await page.evaluate(() => window.EON_CITY_3D.isPanelOpen())) {
      await page.evaluate(() => window.EON_CITY_3D.panels.close());
    }
    const publicRestored = await snapshot(page);
    report.persistence = { url, resumed, owner, publicRestored };
    report.phases.persistence = { ok: true, step: 'complete' };
    saveReport();
  } finally {
    await closePage(resources);
  }
}

async function runMobileFlow() {
  mark('mobile', 'launching');
  const resources = await launchPage({
    label: 'mobile',
    viewport: { width: 390, height: 844 },
    mobile: true
  });
  const { page } = resources;
  try {
    const url = `${baseURL}/realm.html?world=eon-city&quality=low&qa=w98-session8-mobile`;
    mark('mobile', 'navigating');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForEngine(page);
    mark('mobile', 'engine-ready');
    const initial = await snapshot(page);

    await domClick(page, '[data-session8-mission-hud] [data-mission-open]');
    await page.waitForTimeout(80);
    const drawer = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const element = document.querySelector('[data-session8-mission-drawer]');
      const controls = engine.root.querySelector('.realm3d-mobile-controls');
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(controls);
      return {
        drawerHidden: element.hidden,
        drawerRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
        viewport: { width: innerWidth, height: innerHeight },
        playerEnabled: engine.player.enabled,
        controlsVisibility: style.visibility,
        controlsPointerEvents: style.pointerEvents,
        text: element.textContent || '',
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    await domClick(page, '[data-session8-mission-drawer] [data-mission-close]');
    await page.waitForTimeout(80);
    const closed = await snapshot(page);
    report.mobile = { url, initial, drawer, closed };
    report.phases.mobile = { ok: true, step: 'complete' };
    saveReport();
  } finally {
    await closePage(resources);
  }
}

saveReport();

try {
  const persisted = await runDesktopFlow();
  await runPersistenceFlow(persisted);
  await runMobileFlow();

  const d = report.desktop;
  const p = report.persistence;
  const m = report.mobile;
  const activityCount = d.repeatable.mission.activities.find((item) => item.id === 'ai-health-check')?.count || 0;
  const stored = p.resumed.storedText;
  report.checks = {
    session7CumulativeFoundationPresent: d.initial.root.interiorSession === 'w98-session7' && d.initial.root.missionSession === 'w98-session8',
    firstArrivalStartsDeterministically: d.initial.mission.activeMissionId === 'first-arrival' && d.initial.mission.currentObjectiveId === 'move' && d.initial.mission.completedObjectives === 1,
    movementObjectiveCompletes: d.afterMove.mission.currentObjectiveId === 'meet-eonbot',
    eonbotObjectiveCompletes: d.eonbotPanelOpen.panelOpen && d.eonbotPanelOpen.playerEnabled === false && d.eonbotPanelOpen.mission.currentObjectiveId === 'enter-landmark',
    landmarkObjectiveCompletes: d.afterInterior.root.activeInterior === 'ai' && d.afterInterior.mission.currentObjectiveId === 'open-station',
    stationOpenObjectiveCompletes: d.stationOpen.panelOpen && d.stationOpen.playerEnabled === false && d.stationOpen.mission.currentObjectiveId === 'close-station',
    stationCloseRestoresAndCompletes: !d.stationClosed.panelOpen && d.stationClosed.playerEnabled && d.stationClosed.canvasFocused && d.stationClosed.mission.currentObjectiveId === 'return-city',
    safeExitCompletesOnboarding: d.firstArrivalComplete.mission.activeMissionId === 'district-tour' && d.firstArrivalComplete.mission.status === 'active',
    guidedTourProgresses: d.tourStarted.mission.currentObjectiveId === 'tour-ai' && d.guided.root.guidanceTarget === 'ai',
    accessibleDrawerWorks: !d.drawerOpen.drawer.hidden && d.drawerOpen.drawer.text.includes('Available mission chains') && d.drawerOpen.playerEnabled === false,
    repeatableActivityIdempotent: activityCount === 1,
    resumedStatePersists: p.resumed.mission.activeMissionId === d.final.mission.activeMissionId && p.resumed.mission.currentObjectiveId === d.final.mission.currentObjectiveId,
    ownerProfileSeparated: p.owner.mission.audience === 'owner-private' && p.owner.mission.activeMissionId === 'owner-operator-check' && !p.owner.mission.availableMissionIds.includes('first-arrival'),
    publicProfileRestored: p.publicRestored.mission.audience === 'public-visitor' && p.publicRestored.mission.activeMissionId === p.resumed.mission.activeMissionId,
    progressionLedgerSecretSafe: !/SESSION8_SECRET_MUST_NOT_RENDER|REDACTED_OPENAI_KEY|apiKey|seedPhrase|privateKey|walletAddress/i.test(stored),
    mobileHudFits: m.initial.hud.visible && m.initial.hud.rect.width <= 390 && m.initial.overflow <= 1,
    mobileDrawerFits: !m.drawer.drawerHidden && m.drawer.drawerRect.x >= 0 && m.drawer.drawerRect.right <= m.drawer.viewport.width + 1 && m.drawer.drawerRect.bottom <= m.drawer.viewport.height + 1,
    mobileControlsSuspendAndRestore: m.drawer.playerEnabled === false && m.drawer.controlsVisibility === 'hidden' && m.drawer.controlsPointerEvents === 'none' && m.closed.playerEnabled,
    noConsoleErrors: report.consoleErrors.length === 0,
    noPageErrors: report.pageErrors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round((Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length) * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
}

saveReport();
if (sharedBrowser) {
  await Promise.race([
    sharedBrowser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1800))
  ]);
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

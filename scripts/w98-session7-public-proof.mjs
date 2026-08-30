import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION7');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = {
  schema: 'eon.w98.session7.public-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  desktop: null,
  mobile: null,
  checks: {},
  consoleErrors: [],
  pageErrors: [],
  expectedSandboxDenials: []
};
const ignoredConsole = /ERR_CONNECTION_REFUSED|Service Worker registration blocked|favicon\.ico|Failed to load resource.*404/i;
const args = [
  '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist',
  '--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox', '--disable-vulkan', '--disable-features=Translate,OptimizationHints'
];

function collectErrors(page, label) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignoredConsole.test(message.text())) consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    const message = String(error?.message || error);
    if (/sandboxed and lacks the 'allow-same-origin' flag/i.test(message)) report.expectedSandboxDenials.push(`${label}: ${message}`);
    else pageErrors.push(message);
  });
  return {
    consoleErrors,
    pageErrors,
    commit() {
      report.consoleErrors.push(...consoleErrors.map((message) => `${label}: ${message}`));
      report.pageErrors.push(...pageErrors.map((message) => `${label}: ${message}`));
    }
  };
}

async function waitForEngine(page) {
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.renderer?.domElement && window.EON_CITY_3D?.world?.flagshipStats), null, { timeout: 60000 });
  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.dismissIntro();
    engine.running = false;
    cancelAnimationFrame(engine.raf);
    engine.renderer.render(engine.scene, engine.camera);
  });
  await page.waitForTimeout(700);
}

async function captureCanvas(page, filename) {
  const target = path.join(screenshotsDir, filename);
  if (fs.existsSync(target) && process.env.W98_FORCE_SCREENSHOTS !== '1') return;
  await page.evaluate(() => window.EON_CITY_3D?.renderer?.render(window.EON_CITY_3D.scene, window.EON_CITY_3D.camera));
  await page.waitForTimeout(120);
  await page.screenshot({ path: target, fullPage: false });
}

let browser;
try {
  browser = await chromium.launch({ headless: false, executablePath, chromiumSandbox: false, args });

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const desktopPage = await desktopContext.newPage();
  const desktopErrors = collectErrors(desktopPage, 'desktop');
  await desktopPage.addInitScript(() => {
    localStorage.setItem('eonapp.test.secret-marker', 'SESSION7_PRIVATE_MARKER_MUST_NOT_RENDER');
    localStorage.setItem('eonapp.api.key.test', 'REDACTED_OPENAI_KEY');
  });
  const desktopUrl = `${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session7-proof`;
  await desktopPage.goto(desktopUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(desktopPage);
  await captureCanvas(desktopPage, '01-session7-city-entries-desktop.png');

  const catalog = await desktopPage.evaluate(() => window.EON_CITY_3D.world.getSession7InteriorCatalog().map((item) => ({
    id: item.id,
    label: item.label,
    stationIds: item.stations.map((station) => station.id),
    stationTypes: item.stations.map((station) => station.type)
  })));
  const interiorResults = [];
  const stationResults = [];

  for (const interior of catalog) {
    const entered = await desktopPage.evaluate((id) => window.EON_CITY_3D.enterLandmarkInterior(id), interior.id);
    await desktopPage.waitForTimeout(120);
    const room = await desktopPage.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const active = engine.activeInterior;
      engine.renderer.render(engine.scene, engine.camera);
      const canvas = engine.renderer.domElement;
      const hiddenExterior = engine.world.flagshipScene?.root ? engine.world.flagshipScene.root.visible === false : true;
      return {
        activeId: active?.interior?.id,
        stationCount: active?.stations?.length || 0,
        stats: active?.stats || null,
        telemetry: engine.world.getSession7Telemetry(),
        portalInteriorMode: engine.portals.interiorMode,
        hiddenExterior,
        collisionCount: engine.collision?.boxes?.length ?? engine.collision?.solids?.length ?? null,
        canvasFocused: document.activeElement === canvas,
        rootState: engine.root.dataset.activeInterior,
        player: { x: engine.player.position.x, y: engine.player.position.y, z: engine.player.position.z }
      };
    });
    if (interior.id === 'ai') await captureCanvas(desktopPage, '02-session7-ai-tower-interior-desktop.png');
    if (interior.id === 'vault') await captureCanvas(desktopPage, '04-session7-vault-interior-desktop.png');
    if (interior.id === 'portal') await captureCanvas(desktopPage, '07-session7-portal-hall-interior-desktop.png');

    for (const stationId of interior.stationIds) {
      const opened = await desktopPage.evaluate((id) => {
        const engine = window.EON_CITY_3D;
        const station = engine.activeInterior?.stations?.find((item) => item.id === id);
        return engine.focusWorkstationScreen(station);
      }, stationId);
      await desktopPage.waitForTimeout(180);
      const stationState = await desktopPage.evaluate(() => {
        const engine = window.EON_CITY_3D;
        const panel = engine.panels.el;
        const card = panel.querySelector('.realm3d-panel-card');
        const iframe = panel.querySelector('iframe');
        const iframeUrl = iframe ? new URL(iframe.getAttribute('src') || '/', location.href) : null;
        const text = panel.textContent || '';
        const unsafeToken = /SESSION7_PRIVATE_MARKER_MUST_NOT_RENDER|REDACTED_OPENAI_KEY|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b0x[a-fA-F0-9]{64}\b/.test(text);
        return {
          panelVisible: !panel.classList.contains('hidden'),
          dialogRole: card?.getAttribute('role'),
          ariaModal: card?.getAttribute('aria-modal'),
          focusInside: panel.contains(document.activeElement),
          playerEnabled: engine.player.enabled,
          pointerLocked: document.pointerLockElement === engine.renderer.domElement,
          stationId: engine.screenFocus?.id,
          stationType: engine.screenFocus?.type,
          route: engine.screenFocus?.route,
          audience: engine.screenFocus?.audience,
          ownerPrivateContext: engine.screenFocus?.ownerPrivateContext,
          unsafeToken,
          iframeCount: panel.querySelectorAll('iframe').length,
          iframeSameOrigin: iframeUrl ? iframeUrl.origin === location.origin : true,
          iframePath: iframeUrl?.pathname || null,
          iframeSandbox: iframe?.getAttribute('sandbox') || null,
          externalEmbedText: /https?:\/\//i.test(Array.from(panel.querySelectorAll('iframe')).map((node) => node.getAttribute('src') || '').join(' ')),
          nativeWidget: panel.querySelector('[data-native-widget], [data-realm-code-widget]')?.getAttribute('data-native-widget') || (panel.querySelector('[data-realm-code-widget]') ? 'code-maker' : null)
        };
      });
      if (stationState.stationType === 'code-maker' && !fs.existsSync(path.join(screenshotsDir, '03-session7-code-maker-station-desktop.png'))) await desktopPage.screenshot({ path: path.join(screenshotsDir, '03-session7-code-maker-station-desktop.png'), fullPage: false });
      if (stationState.stationType === 'vault-summary' && !fs.existsSync(path.join(screenshotsDir, '05-session7-vault-summary-panel-desktop.png'))) await desktopPage.screenshot({ path: path.join(screenshotsDir, '05-session7-vault-summary-panel-desktop.png'), fullPage: false });
      if (stationState.stationType === 'realm-templates' && !fs.existsSync(path.join(screenshotsDir, '08-session7-realm-template-station-desktop.png'))) await desktopPage.screenshot({ path: path.join(screenshotsDir, '08-session7-realm-template-station-desktop.png'), fullPage: false });

      await desktopPage.evaluate(() => document.querySelectorAll('[data-panel-close]')[document.querySelectorAll('[data-panel-close]').length - 1]?.click());
      await desktopPage.waitForTimeout(100);
      const closed = await desktopPage.evaluate(() => {
        const engine = window.EON_CITY_3D;
        return {
          panelHidden: engine.panels.el.classList.contains('hidden'),
          screenFocusCleared: engine.screenFocus === null,
          playerEnabled: engine.player.enabled,
          canvasFocused: document.activeElement === engine.renderer.domElement,
          stillInside: Boolean(engine.activeInterior)
        };
      });
      stationResults.push({ interiorId: interior.id, stationId, opened, open: stationState, closed });
    }

    const exited = await desktopPage.evaluate(() => window.EON_CITY_3D.exitLandmarkInterior());
    await desktopPage.waitForTimeout(100);
    const restored = await desktopPage.evaluate(() => {
      const engine = window.EON_CITY_3D;
      return {
        activeInterior: engine.activeInterior,
        worldInterior: engine.world.activeInterior,
        portalInteriorMode: engine.portals.interiorMode,
        exteriorVisible: engine.world.flagshipScene?.root ? engine.world.flagshipScene.root.visible : true,
        rootState: engine.root.dataset.activeInterior || null,
        playerEnabled: engine.player.enabled,
        cityEntryCount: engine.world.getInteriorEntrances().length
      };
    });
    interiorResults.push({ interior, entered: Boolean(entered), room, exited, restored });
  }

  const desktopSummary = await desktopPage.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const canvas = engine.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    return {
      world: engine.map.kind,
      quality: engine.qualityKey,
      rootInteriorSession: engine.root.dataset.realmInteriorSession,
      stats: engine.world.flagshipStats,
      telemetry: engine.world.getSession7Telemetry(),
      webgl: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
      layout: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, canvasWidth: rect.width, canvasHeight: rect.height },
      render: { ...engine.renderer.info.render }
    };
  });
  desktopErrors.commit();
  report.desktop = { url: desktopUrl, catalog, interiorResults, stationResults, summary: desktopSummary, consoleErrors: desktopErrors.consoleErrors, pageErrors: desktopErrors.pageErrors };
  await desktopContext.close();
  await browser.close();
  browser = await chromium.launch({ headless: false, executablePath, chromiumSandbox: false, args });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = collectErrors(mobilePage, 'mobile');
  const mobileUrl = `${baseURL}/realm.html?world=eon-city&quality=low&qa=w98-session7-proof`;
  await mobilePage.goto(mobileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(mobilePage);
  await mobilePage.evaluate(() => window.EON_CITY_3D.enterLandmarkInterior('portal'));
  await mobilePage.waitForTimeout(120);
  await captureCanvas(mobilePage, '09-session7-portal-hall-interior-mobile.png');
  await mobilePage.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const station = engine.activeInterior.stations.find((item) => item.type === 'realm-templates');
    engine.focusWorkstationScreen(station);
  });
  await mobilePage.waitForTimeout(180);
  if (!fs.existsSync(path.join(screenshotsDir, '10-session7-realm-template-station-mobile.png'))) await mobilePage.screenshot({ path: path.join(screenshotsDir, '10-session7-realm-template-station-mobile.png'), fullPage: false });
  const mobileState = await mobilePage.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const panel = engine.panels.el;
    const canvas = engine.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    return {
      activeInterior: engine.activeInterior?.interior?.id,
      stationType: engine.screenFocus?.type,
      playerEnabled: engine.player.enabled,
      focusInside: panel.contains(document.activeElement),
      panelVisible: !panel.classList.contains('hidden'),
      mobileControlsDisplay: getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).display,
      mobileControlsOpacity: getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).opacity,
      mobileControlsVisibility: getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).visibility,
      mobileControlsPointerEvents: getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).pointerEvents,
      mobileControlsHiddenDuringPanel: getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).visibility === 'hidden' && getComputedStyle(engine.root.querySelector('.realm3d-mobile-controls')).pointerEvents === 'none',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      canvas: { width: rect.width, height: rect.height },
      templateCount: panel.querySelectorAll('[data-realm-template]').length,
      unsafeIframeCount: Array.from(panel.querySelectorAll('iframe')).filter((frame) => new URL(frame.getAttribute('src') || '/', location.href).origin !== location.origin).length
    };
  });
  await mobilePage.evaluate(() => document.querySelectorAll('[data-panel-close]')[document.querySelectorAll('[data-panel-close]').length - 1]?.click());
  await mobilePage.waitForTimeout(100);
  const mobileClosed = await mobilePage.evaluate(() => ({
    playerEnabled: window.EON_CITY_3D.player.enabled,
    canvasFocused: document.activeElement === window.EON_CITY_3D.renderer.domElement,
    panelHidden: window.EON_CITY_3D.panels.el.classList.contains('hidden')
  }));
  mobileErrors.commit();
  report.mobile = { url: mobileUrl, state: mobileState, closed: mobileClosed, consoleErrors: mobileErrors.consoleErrors, pageErrors: mobileErrors.pageErrors };
  await mobileContext.close();

  const allInteriorIds = new Set(report.desktop.interiorResults.map((item) => item.room.activeId));
  const allStationTypes = new Set(report.desktop.stationResults.map((item) => item.open.stationType));
  const allRoomsPass = report.desktop.interiorResults.every((item) => item.entered && item.exited && item.room.activeId === item.interior.id && item.room.stationCount >= 1 && item.room.stats?.reliableExit && item.room.stats?.externalIframes === 0 && item.room.hiddenExterior && item.room.portalInteriorMode && item.restored.exteriorVisible && item.restored.activeInterior === null && item.restored.portalInteriorMode === false);
  const allStationsPass = report.desktop.stationResults.every((item) => item.opened && item.open.panelVisible && item.open.dialogRole === 'dialog' && item.open.ariaModal === 'true' && item.open.focusInside && item.open.playerEnabled === false && item.open.pointerLocked === false && item.open.audience === 'public-safe' && item.open.ownerPrivateContext === false && item.open.unsafeToken === false && item.open.iframeSameOrigin && item.open.externalEmbedText === false && (item.open.iframeCount === 0 || (item.open.iframePath === '/realm-code-preview.html' && item.open.iframeSandbox === 'allow-scripts')) && item.closed.panelHidden && item.closed.screenFocusCleared && item.closed.playerEnabled && item.closed.canvasFocused && item.closed.stillInside);

  report.checks = {
    publicRealmRoute: report.desktop.url.includes('/realm.html'),
    webglReady: report.desktop.summary.webgl,
    session7Mounted: report.desktop.summary.rootInteriorSession === 'w98-session7' && report.desktop.summary.telemetry?.schema === 'eon.realm3d.landmark-interiors.w98.session7.v1',
    eightInteriorsCatalogued: report.desktop.catalog.length === 8 && allInteriorIds.size === 8,
    allInteriorsEnterAndExit: allRoomsPass,
    sevenRequiredStationTypes: ['chat', 'code-maker', 'provider-health', 'rewards', 'marketplace-preview', 'vault-summary', 'realm-templates'].every((type) => allStationTypes.has(type)),
    allStationsFocusSafe: allStationsPass,
    noExternalIframes: report.desktop.summary.telemetry.externalIframeCount === 0 && report.mobile.state.unsafeIframeCount === 0,
    noOwnerPrivateStations: report.desktop.summary.telemetry.ownerPrivateCount === 0,
    noSecretPatternTelemetry: report.desktop.summary.telemetry.secretPatternDetected === false,
    cityMeshBudget: Number(report.desktop.summary.stats?.meshCount || 0) <= 330,
    desktopCanvasFit: report.desktop.summary.layout.canvasWidth >= 1400 && report.desktop.summary.layout.canvasHeight >= 760,
    desktopNoOverflow: report.desktop.summary.layout.scrollWidth <= report.desktop.summary.layout.clientWidth + 1,
    mobileInteriorWorks: report.mobile.state.activeInterior === 'portal' && report.mobile.state.stationType === 'realm-templates' && report.mobile.state.panelVisible && report.mobile.state.focusInside && report.mobile.state.templateCount >= 6,
    mobileControlsSuspendedDuringPanel: report.mobile.state.mobileControlsHiddenDuringPanel,
    mobileCloseRestoresControls: report.mobile.closed.playerEnabled && report.mobile.closed.canvasFocused && report.mobile.closed.panelHidden,
    mobileNoOverflow: report.mobile.state.overflow <= 1,
    mobileCanvasFit: report.mobile.state.canvas.width <= 390 && report.mobile.state.canvas.height >= 700,
    noConsoleErrors: report.consoleErrors.length === 0,
    noPageErrors: report.pageErrors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round((Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length) * 100);
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(path.join(outputDir, 'W98_SESSION7_PUBLIC_BROWSER_PROOF.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
  process.exit(report.ok ? 0 : 1);
}

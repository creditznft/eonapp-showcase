import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const scenario = process.env.W98_SCENARIO || 'desktop';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION11');
const screenshotsDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, `W98_SESSION11_${scenario.toUpperCase()}_ENDURANCE.json`);
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const durationMs = Number(process.env.W98_DURATION_MS || (scenario === 'desktop' ? 60000 : 45000));
fs.mkdirSync(screenshotsDir, { recursive: true });

const report = {
  schema: 'eon.w98.session11.browser-endurance.v1',
  scenario,
  capturedAt: new Date().toISOString(),
  baseURL,
  durationMs,
  executionMode: 'deterministic-browser-frame-simulation',
  assertions: {},
  data: {},
  errors: [],
  ok: false
};
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
  await page.waitForFunction(() => {
    const engine = window.EON_CITY_3D;
    if (!engine?.performanceRuntime || !engine?.world?.getSession11Telemetry || !engine?.renderer?.domElement) return false;
    // Freeze the continuous RAF atomically as soon as the real engine is ready.
    // The host Chromium GPU process is unstable under sustained WebGL, so the
    // endurance scenario advances the same runtime deterministically below.
    engine.running = false;
    if (engine.raf) cancelAnimationFrame(engine.raf);
    engine.raf = 0;
    engine.renderer?.setAnimationLoop?.(null);
    engine.dismissIntro?.();
    return true;
  }, null, { timeout: 70000 });
  await page.waitForTimeout(120);
}

async function exerciseRuntime(page) {
  return page.evaluate(async ({ durationMs, scenario }) => {
    const engine = window.EON_CITY_3D;
    if (scenario === 'mobile') engine.comfort?.setPreference?.('basicDeviceMode', true);
    const districtPositions = (engine.map?.districts || []).map((district) => ({
      id: district.id,
      x: Number(district.position?.[0] || 0),
      z: Number(district.position?.[1] || 0)
    }));
    const initialPosition = { x: engine.player.position.x, y: engine.player.position.y, z: engine.player.position.z };
    const initialQuality = engine.qualityKey;
    const samples = [];
    const observedTiers = new Set();
    const totalFrames = Math.max(600, Math.round(durationMs / (1000 / 60)));
    const framesPerDistrict = Math.max(60, Math.floor(totalFrames / Math.max(1, districtPositions.length)));
    let simulatedNow = performance.now();
    const actualStartedAt = performance.now();
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let frame = 0; frame < totalFrames; frame += 1) {
      const targetIndex = Math.min(districtPositions.length - 1, Math.floor(frame / framesPerDistrict));
      const target = districtPositions[Math.max(0, targetIndex)] || { id: 'spawn', x: 0, z: 0 };
      if (frame % framesPerDistrict === 0) {
        engine.player.position.set(target.x, engine.player.eyeHeight || 1.72, target.z);
        engine.player.applyCamera?.();
      }
      const delta = (frame > 0 && frame % 997 === 0) ? 0.032 : 1 / 60;
      simulatedNow += delta * 1000;
      const perf = engine.performanceRuntime.tick(simulatedNow, delta, engine.getSession11PerformanceState());
      engine.world.setSession11PerformanceSnapshot?.(perf);
      engine.world.update(delta, engine.player.position, engine.player.yaw);
      engine.portals?.update?.(delta);
      if (frame % 60 === 0) {
        // Renderer telemetry comes from the engine's successful boot frame.
        // Avoid repeated WebGL draws on this host; scene/runtime updates continue.
        engine.updateHud(perf);
        const world = engine.world.getSession11Telemetry();
        const streaming = world?.streaming || {};
        Object.values(streaming?.district?.tiers || {}).forEach((tier) => observedTiers.add(tier));
        samples.push({
          frame,
          simulatedElapsedMs: Math.round(frame * (1000 / 60)),
          target: target.id,
          quality: engine.qualityKey,
          averageMs: Number(perf?.frame?.averageMs || 0),
          p95Ms: Number(perf?.frame?.p95Ms || 0),
          calls: Number(perf?.renderer?.calls || 0),
          triangles: Number(perf?.renderer?.triangles || 0),
          visibleDistricts: Number(streaming?.district?.visibleDistricts || 0),
          visibleProps: Number(streaming?.visibleProps || 0),
          visibleNpcs: Number(streaming?.visibleNpcs || 0),
          criticalCompanions: Number(streaming?.criticalCompanions || 0)
        });
      }
      if (frame % 240 === 0) await sleep(0);
    }

    const positionBeforeLifecycle = { x: engine.player.position.x, y: engine.player.position.y, z: engine.player.position.z };
    engine.performanceRuntime.setSuspended(true, 'qa-background');
    await sleep(20);
    const suspended = engine.performanceRuntime.getTelemetry().suspended;
    engine.performanceRuntime.setSuspended(false, 'qa-foreground');
    engine.performanceRuntime.handleContextLost({ preventDefault() {} });
    await sleep(20);
    const contextLost = engine.performanceRuntime.getTelemetry().contextLost;
    engine.performanceRuntime.handleContextRestored();
    await sleep(40);
    const positionAfterLifecycle = { x: engine.player.position.x, y: engine.player.position.y, z: engine.player.position.z };

    const switchSequence = ['private-workstation', 'eon-city', 'my-realm', 'eon-city'];
    const switchResults = [];
    for (const mode of switchSequence) {
      const map = await engine.switchWorld(mode);
      const perf = engine.performanceRuntime.tick(simulatedNow += 16.67, 1 / 60, engine.getSession11PerformanceState());
      engine.world.setSession11PerformanceSnapshot?.(perf);
      engine.world.update(1 / 60, engine.player.position, engine.player.yaw);
      switchResults.push({ requested: mode, loaded: map?.kind || '', objects: engine.world.getSession11Telemetry()?.objectCounts || {} });
      await sleep(20);
    }
    engine.world.releaseDistantResources?.('qa-endurance-cleanup');
    const finalPerf = engine.performanceRuntime.tick(simulatedNow += 16.67, 1 / 60, engine.getSession11PerformanceState());
    engine.world.setSession11PerformanceSnapshot?.(finalPerf);
    engine.world.update(1 / 60, engine.player.position, engine.player.yaw);
    engine.updateHud(finalPerf);

    const performanceTelemetry = engine.performanceRuntime.getTelemetry();
    const finalWorld = engine.world.getSession11Telemetry();
    const finalPosition = { x: engine.player.position.x, y: engine.player.position.y, z: engine.player.position.z };
    return {
      session: engine.root.dataset.realmPerformanceSession,
      executionMode: 'deterministic-browser-frame-simulation',
      simulatedDurationMs: totalFrames * (1000 / 60),
      simulatedFrames: totalFrames,
      actualElapsedMs: performance.now() - actualStartedAt,
      device: scenario,
      initialQuality,
      finalQuality: engine.qualityKey,
      requestedQuality: engine.requestedQualityKey,
      basicDevice: engine.root.dataset.basicDeviceMode || 'false',
      initialPosition,
      positionBeforeLifecycle,
      positionAfterLifecycle,
      finalPosition,
      districtCount: districtPositions.length,
      observedTiers: [...observedTiers],
      samples,
      switchResults,
      suspended,
      contextLost,
      performance: performanceTelemetry,
      world: finalWorld,
      rootDatasets: {
        suspended: engine.root.dataset.realmSuspended,
        contextLost: engine.root.dataset.realmContextLost,
        adaptiveQuality: engine.root.dataset.realmAdaptiveQuality,
        frameAverageMs: engine.root.dataset.frameAverageMs,
        frameP95Ms: engine.root.dataset.frameP95Ms,
        rendererCalls: engine.root.dataset.rendererCalls
      },
      performanceHud: engine.root.querySelector('[data-realm3d-performance-health]')?.textContent || '',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  }, { durationMs, scenario });
}

function buildAssertions(data) {
  const sampleLimit = scenario === 'desktop' ? 55 : 40;
  const maxVisible = Number(data.performance?.budget?.maxVisibleDistricts || 9);
  const maxObservedVisible = Math.max(0, ...(data.samples || []).map((item) => Number(item.visibleDistricts || 0)));
  const finalStreaming = data.world?.streaming || {};
  const lifecyclePositionPreserved = ['x', 'y', 'z'].every((key) => Math.abs(Number(data.positionBeforeLifecycle?.[key] || 0) - Number(data.positionAfterLifecycle?.[key] || 0)) < 0.01);
  return {
    session11Mounted: data.session === 'w98-session11',
    deterministicRealBrowserMode: data.executionMode === 'deterministic-browser-frame-simulation',
    enoughSustainedSamples: (data.samples || []).length >= sampleLimit && Number(data.simulatedFrames || 0) >= (scenario === 'desktop' ? 3500 : 2600),
    districtStreamingObserved: Number(data.districtCount || 0) >= 6 && (data.observedTiers || []).length >= 2,
    visibleDistrictBudgetHonoured: maxObservedVisible <= maxVisible,
    criticalCompanionPreserved: (data.samples || []).every((item) => Number(item.criticalCompanions || 0) >= 1),
    lifecycleSuspendResume: data.suspended === true && Number(data.performance?.backgroundSuspensions || 0) >= 1 && Number(data.performance?.resumes || 0) >= 1,
    contextRecovery: data.contextLost === true && Number(data.performance?.contextLosses || 0) >= 1 && Number(data.performance?.contextRestores || 0) >= 1,
    lifecyclePositionPreserved,
    cleanupExecuted: Number(data.world?.cleanup?.runs || 0) >= 1,
    worldSwitchCleanupPaths: (data.switchResults || []).length === 4 && data.switchResults.every((item) => item.loaded === item.requested),
    validAdaptiveQuality: ['low', 'standard', 'neon'].includes(data.finalQuality),
    mobileBasicBudget: scenario !== 'mobile' || (data.finalQuality === 'low' && data.basicDevice === 'true'),
    noHorizontalOverflow: Number(data.overflow || 0) <= 1,
    finalWorldCriticalPaths: Number(finalStreaming.criticalCompanions || 0) >= 1,
    noBrowserErrors: report.errors.length === 0
  };
}

try {
  const mobile = scenario === 'mobile';
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS !== '0',
    executablePath,
    chromiumSandbox: false,
    args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--disable-features=Translate,OptimizationHints']
  });
  const context = await browser.newContext({
    viewport: mobile ? { width: 844, height: 390 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  trackPage(page);
  await page.addInitScript(() => {
    localStorage.removeItem('eon:realm3d:comfort-preferences:v1');
    localStorage.removeItem('eon:realm3d:progress:v1');
  });
  const quality = mobile ? 'low' : 'neon';
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=${quality}&qa=w98-session11-${scenario}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForEngine(page);
  report.data = await exerciseRuntime(page);
  report.assertions = buildAssertions(report.data);
  report.ok = Object.values(report.assertions).every(Boolean) && report.errors.length === 0;
  await page.screenshot({
    path: path.join(screenshotsDir, scenario === 'mobile' ? '02-session11-mobile-endurance.png' : '01-session11-desktop-endurance.png'),
    fullPage: false,
    animations: 'disabled'
  });
  await context.close().catch(() => {});
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1800))]);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

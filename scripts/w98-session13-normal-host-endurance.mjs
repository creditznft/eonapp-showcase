import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const durationMs = Math.max(5000, Number(process.env.W98_DURATION_MS || 600000));
const sampleMs = Math.max(500, Number(process.env.W98_SAMPLE_MS || 1000));
const executablePath = process.env.CHROMIUM_PATH || undefined;
const outputDir = path.resolve(process.env.W98_OUTPUT_DIR || 'CodexAuditPack/W98_SESSION13');
const reportPath = path.join(outputDir, 'W98_SESSION13_NORMAL_HOST_ENDURANCE.json');
const screenshotPath = path.join(outputDir, 'screenshots', '06-session13-normal-host-endurance.png');
fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

const report = {
  schema: 'eon.w98.session13.normal-host-endurance.v1',
  capturedAt: new Date().toISOString(),
  executionMode: 'continuous-real-webgl',
  requestedDurationMs: durationMs,
  certificationThresholdMs: 300000,
  baseURL,
  samples: [],
  errors: [],
  assertions: {},
  normalHostCertified: false,
  ok: false
};
let browser;

try {
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS !== '0',
    executablePath,
    chromiumSandbox: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox',
      '--disable-features=Translate,OptimizationHints'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => report.errors.push(`page: ${String(error?.message || error)}`));
  page.on('crash', () => report.errors.push('page crashed'));
  await page.addInitScript(() => {
    localStorage.removeItem('eon:realm3d:session13-journey:v1');
    localStorage.removeItem('eon:realm3d:session13-presentation:v1');
  });
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=standard&qa=w98-session13-normal-host`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.mega && window.EON_CITY_3D?.renderer?.domElement), null, { timeout: 90000 });
  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.dismissIntro?.();
    engine.mega?.recordEvent?.('eonbot-opened', { world: 'eon-city' });
    engine.mega?.recordEvent?.('guided-mission', { world: 'eon-city' });
  });
  const startedAt = Date.now();
  let nextDistrict = 0;
  while (Date.now() - startedAt < durationMs) {
    await page.waitForTimeout(sampleMs);
    const sample = await page.evaluate(({ nextDistrict }) => {
      const engine = window.EON_CITY_3D;
      const districts = engine?.map?.districts || [];
      if (districts.length && nextDistrict % 8 === 0) {
        const district = districts[Math.floor(nextDistrict / 8) % districts.length];
        engine.player?.teleportTo?.({ x: Number(district.position?.[0] || 0), y: 1.8, z: Number(district.position?.[1] || 0) + 4, yaw: 0 });
      }
      const perf = engine?.performanceRuntime?.getTelemetry?.() || {};
      const world = engine?.world?.getSession11Telemetry?.() || {};
      const mega = engine?.mega?.getTelemetry?.() || {};
      return {
        atMs: performance.now(),
        running: Boolean(engine?.running),
        quality: engine?.qualityKey || '',
        fpsText: engine?.root?.querySelector?.('[data-realm3d-fps]')?.textContent || '',
        frameAverageMs: Number(perf?.frame?.averageMs || 0),
        frameP95Ms: Number(perf?.frame?.p95Ms || 0),
        rendererCalls: Number(perf?.renderer?.calls || 0),
        triangles: Number(perf?.renderer?.triangles || 0),
        contextLost: Boolean(perf?.contextLost),
        contextLosses: Number(mega?.contextLosses || 0),
        contextRestores: Number(mega?.contextRestores || 0),
        activeDistrictId: mega?.activeDistrictId || '',
        journeyMilestones: Object.keys(mega?.journey?.milestones || {}).length,
        visibleDistricts: Number(world?.streaming?.district?.visibleDistricts || 0),
        overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    }, { nextDistrict });
    report.samples.push(sample);
    nextDistrict += 1;
  }
  report.actualDurationMs = Date.now() - startedAt;
  await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    engine.mega?.recordEvent?.('world-entered', { world: 'private-workstation' });
    engine.mega?.recordEvent?.('station-opened', { world: 'private-workstation' });
    engine.mega?.recordEvent?.('activity-completed', { world: 'eon-city' });
  });
  const final = await page.evaluate(() => window.EON_CITY_3D?.mega?.getReleaseReport?.());
  report.finalReleaseReport = final;
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });
  const enoughSamples = report.samples.length >= Math.floor(durationMs / sampleMs * 0.85);
  const p95 = Math.max(0, ...report.samples.map((sample) => sample.frameP95Ms));
  report.assertions = {
    continuousEngineStayedRunning: report.samples.every((sample) => sample.running),
    enoughSamples,
    rendererStayedActive: report.samples.some((sample) => sample.rendererCalls > 0 || sample.triangles > 0),
    noUnrecoveredContextLoss: report.samples.every((sample) => !sample.contextLost) && Number(final?.contextLosses || 0) <= Number(final?.contextRestores || 0),
    districtsStreamed: new Set(report.samples.map((sample) => sample.activeDistrictId).filter(Boolean)).size >= 2,
    safeJourneyMaintained: Object.keys(final?.journey?.milestones || {}).length >= 6,
    layoutContained: report.samples.every((sample) => sample.overflowPx <= 1),
    frameTelemetryAvailable: p95 > 0,
    noBrowserErrors: report.errors.length === 0
  };
  report.normalHostCertified = report.actualDurationMs >= report.certificationThresholdMs && Object.values(report.assertions).every(Boolean);
  report.ok = Object.values(report.assertions).every(Boolean);
  await context.close();
} catch (error) {
  report.error = String(error?.stack || error);
  report.ok = false;
} finally {
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({
  ok: report.ok,
  normalHostCertified: report.normalHostCertified,
  actualDurationMs: report.actualDurationMs || 0,
  assertions: report.assertions,
  errors: report.errors,
  error: report.error || ''
}, null, 2));
process.exit(report.ok ? 0 : 1);

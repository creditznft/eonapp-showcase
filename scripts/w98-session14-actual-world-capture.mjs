import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve(process.env.W98_OUTPUT_DIR || 'CodexAuditPack/W98_SESSION14');
const screenshotDir = path.join(outputDir, 'screenshots', 'actual-world');
fs.mkdirSync(screenshotDir, { recursive: true });

const scenarios = [
  { id: 'desktop-signal', quality: 'low', viewport: { width: 1440, height: 900 }, districtIndex: 0 },
  { id: 'desktop-studio', quality: 'standard', viewport: { width: 1440, height: 900 }, districtIndex: 2 },
  { id: 'desktop-aurora', quality: 'neon', viewport: { width: 1440, height: 900 }, districtIndex: 4 },
  { id: 'mobile-studio', quality: 'standard', viewport: { width: 844, height: 390 }, districtIndex: 1, mobile: true }
];

const report = {
  schema: 'eon.w98.session14.actual-world-capture.v1',
  capturedAt: new Date().toISOString(),
  executionMode: 'actual-continuously-rendered-realm-route',
  baseURL,
  scenarios: [],
  ok: false
};

for (const scenario of scenarios) {
  let browser;
  const row = { ...scenario, errors: [], ok: false };
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      chromiumSandbox: false,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--enable-unsafe-swiftshader',
        '--disable-gpu-sandbox',
        '--disable-features=Translate,OptimizationHints',
        '--hide-scrollbars'
      ]
    });
    const context = await browser.newContext({
      viewport: scenario.viewport,
      isMobile: Boolean(scenario.mobile),
      hasTouch: Boolean(scenario.mobile),
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') row.errors.push(`console: ${message.text()}`); });
    page.on('pageerror', (error) => row.errors.push(`page: ${String(error?.message || error)}`));
    page.on('crash', () => row.errors.push('page crashed'));
    await page.goto(`${baseURL}/realm.html?world=eon-city&quality=${scenario.quality}&qa=w98-session14-actual-world`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.renderer?.domElement && window.EON_CITY_3D?.mega), null, { timeout: 60000 });
    await page.evaluate(({ quality, districtIndex }) => {
      const engine = window.EON_CITY_3D;
      engine.dismissIntro?.();
      engine.setQuality?.(quality, { quiet: true });
      const districts = engine.map?.districts || [];
      const district = districts[districtIndex % Math.max(1, districts.length)];
      if (district) {
        const x = Number(district.position?.[0] || 0);
        const z = Number(district.position?.[1] || 0);
        engine.player?.teleportTo?.({ x, y: 1.8, z: z + 10, yaw: Math.PI });
      }
    }, scenario);
    await page.waitForTimeout(2500);
    const telemetry = await page.evaluate(() => {
      const engine = window.EON_CITY_3D;
      const rect = engine.renderer?.domElement?.getBoundingClientRect?.();
      const gl = engine.renderer?.getContext?.();
      const info = engine.renderer?.info || {};
      return {
        running: Boolean(engine.running),
        qualityKey: engine.qualityKey,
        activeDistrictId: engine.mega?.getTelemetry?.()?.activeDistrictId || '',
        renderer: {
          width: Math.round(rect?.width || 0),
          height: Math.round(rect?.height || 0),
          calls: Number(info.render?.calls || 0),
          triangles: Number(info.render?.triangles || 0),
          geometries: Number(info.memory?.geometries || 0),
          textures: Number(info.memory?.textures || 0),
          contextLost: Boolean(gl?.isContextLost?.())
        },
        fpsText: engine.root?.querySelector?.('[data-realm3d-fps]')?.textContent || '',
        overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fallbackVisible: Boolean(document.querySelector('[data-realm3d-fallback]:not([hidden])'))
      };
    });
    const screenshot = `${scenario.id}.png`;
    await page.screenshot({ path: path.join(screenshotDir, screenshot), fullPage: false, animations: 'disabled' });
    row.telemetry = telemetry;
    row.screenshot = `screenshots/actual-world/${screenshot}`;
    row.ok = telemetry.running && telemetry.renderer.width > 0 && telemetry.renderer.height > 0 && telemetry.renderer.geometries > 0 && !telemetry.renderer.contextLost && telemetry.overflowPx <= 1 && !telemetry.fallbackVisible && row.errors.length === 0;
    await context.close();
  } catch (error) {
    row.error = String(error?.stack || error);
  } finally {
    if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2500))]);
    report.scenarios.push(row);
  }
}

report.ok = report.scenarios.length === scenarios.length && report.scenarios.every((row) => row.ok);
report.passed = report.scenarios.filter((row) => row.ok).length;
report.total = report.scenarios.length;
fs.writeFileSync(path.join(outputDir, 'W98_SESSION14_ACTUAL_WORLD_CAPTURE.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

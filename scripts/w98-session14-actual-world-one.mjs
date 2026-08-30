import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4191';
const outputDir = path.resolve(process.env.W98_OUTPUT_DIR || 'CodexAuditPack/W98_SESSION14');
const id = process.env.W98_SCENARIO || 'desktop-studio';
const quality = process.env.W98_QUALITY || 'standard';
const mobile = process.env.W98_MOBILE === '1';
const width = Number(process.env.W98_WIDTH || (mobile ? 844 : 1440));
const height = Number(process.env.W98_HEIGHT || (mobile ? 390 : 900));
const districtIndex = Number(process.env.W98_DISTRICT || 0);
const screenshotDir = path.join(outputDir, 'screenshots', 'actual-world');
fs.mkdirSync(screenshotDir, { recursive: true });
const row = { schema: 'eon.w98.session14.actual-world-one.v1', id, quality, mobile, viewport: { width, height }, capturedAt: new Date().toISOString(), errors: [], ok: false };
let browser;
try {
  console.error(`[capture] launch ${id}`);
  browser = await chromium.launch({
    headless: process.env.W98_HEADLESS !== '0',
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    chromiumSandbox: false,
    args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-features=Translate,OptimizationHints','--hide-scrollbars']
  });
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') row.errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => row.errors.push(`page: ${String(error?.message || error)}`));
  page.on('crash', () => row.errors.push('page crashed'));
  console.error(`[capture] goto ${id}`);
  await page.goto(`${baseURL}/realm.html?world=eon-city&quality=${quality}&qa=w98-session14-actual-world`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.error(`[capture] wait engine ${id}`);
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.renderer?.domElement && window.EON_CITY_3D?.mega), null, { timeout: 35000 });
  console.error(`[capture] prepare ${id}`);
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
  }, { quality, districtIndex });
  await page.waitForTimeout(1800);
  row.telemetry = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const rect = engine.renderer?.domElement?.getBoundingClientRect?.();
    const gl = engine.renderer?.getContext?.();
    const info = engine.renderer?.info || {};
    return {
      running: Boolean(engine.running),
      qualityKey: engine.qualityKey,
      activeDistrictId: engine.mega?.getTelemetry?.()?.activeDistrictId || '',
      renderer: { width: Math.round(rect?.width || 0), height: Math.round(rect?.height || 0), calls: Number(info.render?.calls || 0), triangles: Number(info.render?.triangles || 0), geometries: Number(info.memory?.geometries || 0), textures: Number(info.memory?.textures || 0), contextLost: Boolean(gl?.isContextLost?.()) },
      fpsText: engine.root?.querySelector?.('[data-realm3d-fps]')?.textContent || '',
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fallbackVisible: (() => { const el = document.querySelector('[data-realm3d-fallback]'); if (!el || el.hidden) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01 && r.width > 1 && r.height > 1; })()
    };
  });
  const screenshot = `${id}.png`;
  console.error(`[capture] screenshot ${id}`);
  await page.screenshot({ path: path.join(screenshotDir, screenshot), fullPage: false, animations: 'disabled', timeout: 15000 });
  row.screenshot = `screenshots/actual-world/${screenshot}`;
  row.ok = row.telemetry.running && row.telemetry.renderer.width > 0 && row.telemetry.renderer.height > 0 && row.telemetry.renderer.geometries > 0 && !row.telemetry.renderer.contextLost && row.telemetry.overflowPx <= 1 && !row.telemetry.fallbackVisible && row.errors.length === 0;
  fs.writeFileSync(path.join(outputDir, `W98_SESSION14_ACTUAL_WORLD_${id}.json`), JSON.stringify(row, null, 2));
  console.log(JSON.stringify(row, null, 2));
  await Promise.race([context.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1000))]);
} catch (error) {
  row.error = String(error?.stack || error);
  fs.writeFileSync(path.join(outputDir, `W98_SESSION14_ACTUAL_WORLD_${id}.json`), JSON.stringify(row, null, 2));
  console.log(JSON.stringify(row, null, 2));
} finally {
  if (browser) await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1500))]);
}
process.exit(row.ok ? 0 : 1);

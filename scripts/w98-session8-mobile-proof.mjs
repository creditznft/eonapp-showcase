import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = process.env.W98_OUTPUT_DIR || path.resolve('CodexAuditPack/W98_SESSION8');
const reportPath = path.join(outputDir, 'W98_SESSION8_MOBILE_PROOF.json');
const screenshotPath = path.join(outputDir, 'screenshots', 'session8-mobile-certified.png');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
const report = { schema: 'eon.w98.session8.mobile-proof.v1', capturedAt: new Date().toISOString(), baseURL, checks: {}, errors: [] };
const browser = await chromium.launch({ headless: false, executablePath, chromiumSandbox: false, args: ['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--disable-vulkan','--disable-features=Translate,OptimizationHints'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|sandboxed and lacks/i.test(m.text())) report.errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => report.errors.push(`page: ${String(e?.message || e)}`));
await page.addInitScript(() => localStorage.removeItem('eon:realm3d:mission-progress:v2'));
try {
  const url = `${baseURL}/realm.html?world=eon-city&quality=low&qa=w98-session8-mobile-split`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.EON_CITY_3D?.missions && document.querySelector('[data-session8-mission-hud]')), null, { timeout: 60000 });
  await page.evaluate(() => window.EON_CITY_3D.dismissIntro());
  await page.waitForTimeout(650);
  report.initial = await page.evaluate(() => {
    const hud = document.querySelector('[data-session8-mission-hud]');
    const r = hud.getBoundingClientRect();
    return { hud: { visible: getComputedStyle(hud).display !== 'none', x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }, overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth };
  });
  await page.evaluate(() => document.querySelector('[data-session8-mission-hud] [data-mission-open]')?.click());
  await page.waitForTimeout(120);
  report.drawer = await page.evaluate(() => {
    const engine = window.EON_CITY_3D;
    const element = document.querySelector('[data-session8-mission-drawer]');
    const controls = engine.root.querySelector('.realm3d-mobile-controls');
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(controls);
    return { hidden: element.hidden, rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom}, viewport:{width:innerWidth,height:innerHeight}, playerEnabled:engine.player.enabled, controlsVisibility:style.visibility, controlsPointerEvents:style.pointerEvents, text:element.textContent||'', overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth };
  });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await page.evaluate(() => document.querySelector('[data-session8-mission-drawer] [data-mission-close]')?.click());
  await page.waitForTimeout(120);
  report.closed = await page.evaluate(() => ({ playerEnabled: window.EON_CITY_3D.player.enabled, drawerHidden: document.querySelector('[data-session8-mission-drawer]').hidden }));
  report.checks = {
    mobileHudFits: report.initial.hud.visible && report.initial.hud.x >= 0 && report.initial.hud.right <= 391 && report.initial.overflow <= 1,
    mobileDrawerFits: !report.drawer.hidden && report.drawer.rect.x >= 0 && report.drawer.rect.right <= report.drawer.viewport.width + 1 && report.drawer.rect.bottom <= report.drawer.viewport.height + 1 && report.drawer.overflow <= 1,
    mobileControlsSuspend: report.drawer.playerEnabled === false && report.drawer.controlsVisibility === 'hidden' && report.drawer.controlsPointerEvents === 'none',
    mobileControlsRestore: report.closed.playerEnabled && report.closed.drawerHidden,
    accessibleContentPresent: report.drawer.text.includes('Available mission chains') && report.drawer.text.includes('Stored only in this browser'),
    noBrowserErrors: report.errors.length === 0
  };
  report.ok = Object.values(report.checks).every(Boolean);
  report.score = Math.round(Object.values(report.checks).filter(Boolean).length / Object.keys(report.checks).length * 100);
} catch (error) { report.ok=false; report.error=String(error?.stack||error); }
finally { fs.writeFileSync(reportPath, JSON.stringify(report,null,2)); await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,1500))]); }
console.log(JSON.stringify(report,null,2));
process.exit(report.ok?0:1);

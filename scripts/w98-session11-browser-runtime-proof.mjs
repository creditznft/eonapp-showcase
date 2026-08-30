import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W98_SESSION11');
const reportPath = path.join(outputDir, 'W98_SESSION11_BROWSER_RUNTIME_PROOF.json');
const screenshotsDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });
const errors = [];
let browser;
let report = { schema: 'eon.w98.session11.browser-runtime-proof.v2', capturedAt: new Date().toISOString(), baseURL, errors, scenarios: {}, checks: {}, ok: false };
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    chromiumSandbox: false,
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-software-rasterizer','--disable-features=Translate,OptimizationHints']
  });
  for (const scenario of [
    { name: 'desktop', viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
  ]) {
    const scenarioErrors = [];
    const context = await browser.newContext({ viewport: scenario.viewport, isMobile: scenario.isMobile, hasTouch: scenario.hasTouch, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') scenarioErrors.push(`console: ${message.text()}`); });
    page.on('pageerror', (error) => scenarioErrors.push(`page: ${String(error?.message || error)}`));
    page.on('crash', () => scenarioErrors.push('page crashed'));
    await page.goto(`${baseURL}/tests/fixtures/w98-session11-performance.html?mode=${scenario.name}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.__SESSION11_BROWSER_PROOF__), null, { timeout: 30000 });
    const fixture = await page.evaluate(() => window.__SESSION11_BROWSER_PROOF__);
    await page.screenshot({ path: path.join(screenshotsDir, scenario.name === 'desktop' ? '03-session11-browser-runtime-desktop.png' : '04-session11-browser-runtime-mobile.png'), fullPage: true, animations: 'disabled' });
    report.scenarios[scenario.name] = { fixture, errors: scenarioErrors, ok: fixture.ok === true && scenarioErrors.length === 0 };
    errors.push(...scenarioErrors.map((error) => `${scenario.name}: ${error}`));
    await context.close();
  }
  const scenarioValues = Object.values(report.scenarios);
  report.checks = {
    desktopPassed: report.scenarios.desktop?.ok === true,
    mobilePassed: report.scenarios.mobile?.ok === true,
    bothFrameStreamsCompleted: scenarioValues.every((item) => Number(item.fixture?.data?.final?.totalFrames || 0) >= 3600),
    mobileBasicDevicePolicy: report.scenarios.mobile?.fixture?.data?.final?.budget?.basicDevice === true && report.scenarios.mobile?.fixture?.data?.final?.activeQuality === 'low',
    desktopConservativeRecovery: Number(report.scenarios.desktop?.fixture?.data?.final?.adaptiveRecoveries || 0) >= 1,
    noBrowserErrors: errors.length === 0
  };
  report.passed = Object.values(report.checks).filter(Boolean).length;
  report.total = Object.keys(report.checks).length;
  report.score = Math.round(report.passed / report.total * 100);
  report.ok = report.passed === report.total;
} catch (error) {
  report.error = String(error?.stack || error);
} finally {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  if (browser) await browser.close().catch(() => {});
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

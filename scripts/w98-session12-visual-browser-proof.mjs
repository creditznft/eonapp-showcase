import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W98_SESSION12');
const screenshotDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W98_SESSION12_VISUAL_BROWSER_PROOF.json');
fs.mkdirSync(screenshotDir, { recursive: true });

const scenarios = [
  { name: 'desktop-intro', viewport: { width: 1440, height: 900 }, mobile: false },
  { name: 'desktop-guided', viewport: { width: 1440, height: 900 }, mobile: false },
  { name: 'desktop-diagnostic', viewport: { width: 1280, height: 800 }, mobile: false },
  { name: 'mobile-landscape', viewport: { width: 844, height: 390 }, mobile: true },
  { name: 'portrait-basic', viewport: { width: 390, height: 844 }, mobile: true }
];

const report = {
  schema: 'eon.w98.session12.visual-browser-proof.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  scenarios: {},
  errors: [],
  checks: {},
  ok: false
};

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    chromiumSandbox: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-features=Translate,OptimizationHints',
      '--hide-scrollbars'
    ]
  });

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      isMobile: scenario.mobile,
      hasTouch: scenario.mobile,
      serviceWorkers: 'block',
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('pageerror', (error) => errors.push(`page: ${String(error?.message || error)}`));
    page.on('crash', () => errors.push('page crashed'));
    const url = `${baseURL}/tests/fixtures/w98-session12-visual.html?scenario=${encodeURIComponent(scenario.name)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.__SESSION12_VISUAL_PROOF__), null, { timeout: 30000 });
    const fixture = await page.evaluate(() => window.__SESSION12_VISUAL_PROOF__);
    const file = `${String(scenarios.indexOf(scenario) + 1).padStart(2, '0')}-session12-${scenario.name}.png`;
    await page.screenshot({ path: path.join(screenshotDir, file), fullPage: true, animations: 'disabled' });
    report.scenarios[scenario.name] = {
      viewport: scenario.viewport,
      fixture,
      errors,
      screenshot: `screenshots/${file}`,
      ok: fixture?.ok === true && errors.length === 0
    };
    report.errors.push(...errors.map((error) => `${scenario.name}: ${error}`));
    await context.close();
  }

  const intro = report.scenarios['desktop-intro']?.fixture;
  const guided = report.scenarios['desktop-guided']?.fixture;
  const diagnostic = report.scenarios['desktop-diagnostic']?.fixture;
  const landscape = report.scenarios['mobile-landscape']?.fixture;
  const portrait = report.scenarios['portrait-basic']?.fixture;
  const postLaunch = [guided, diagnostic, landscape, portrait];
  const all = Object.values(report.scenarios);

  report.checks = {
    allScenariosRendered: all.length === scenarios.length && all.every((item) => item.fixture),
    allPresentationScoresPass: all.every((item) => item.fixture?.score?.ok === true),
    publicCopyTruthPasses: all.every((item) => item.fixture?.copyAudit?.ok === true && item.fixture?.publicCopyTruth === 'pass'),
    noHorizontalOverflow: all.every((item) => Number(item.fixture?.measurements?.overflowPx || 0) <= 1),
    noCriticalOverlap: all.every((item) => Number(item.fixture?.measurements?.overlapCount || 0) === 0),
    primaryTargetsMeetDeviceFloor: all.every((item) => Number(item.fixture?.measurements?.undersizedTargets || 0) === 0),
    desktopIntroHierarchy: Number(intro?.measurements?.launchActions?.length || 0) >= 5 && intro?.viewport?.profile === 'desktop-cinematic',
    postLaunchRetiresGlobalHeader: postLaunch.every((fixture) => Number(fixture?.measurements?.header?.opacity || 1) <= 0.01 || Number(fixture?.measurements?.header?.bottom || 0) <= 0),
    guidedHudIsDefault: guided?.mode === 'guided' && guided?.measurements?.hud?.width > 0,
    diagnosticsAreExplicit: diagnostic?.mode === 'diagnostic' && diagnostic?.measurements?.hud?.width >= guided?.measurements?.hud?.width,
    landscapeUsesCompactProfile: landscape?.viewport?.profile === 'phone-landscape' && landscape?.measurements?.controls?.display === 'flex',
    landscapeControlsFit: [landscape?.measurements?.move, landscape?.measurements?.look, ...(landscape?.measurements?.actionRects || [])].filter(Boolean).every((rect) => rect.x >= -1 && rect.right <= 845 && rect.y >= -1 && rect.bottom <= 391),
    portraitBasicUsesMinimalHud: portrait?.viewport?.profile === 'basic-device' && portrait?.mode === 'minimal',
    portraitControlsFit: [portrait?.measurements?.move, portrait?.measurements?.look, ...(portrait?.measurements?.actionRects || [])].filter(Boolean).every((rect) => rect.x >= -1 && rect.right <= 391 && rect.y >= -1 && rect.bottom <= 845),
    noBrowserErrors: report.errors.length === 0
  };
  report.passed = Object.values(report.checks).filter(Boolean).length;
  report.total = Object.keys(report.checks).length;
  report.score = Math.round(report.passed / report.total * 100);
  report.ok = report.passed === report.total;
} catch (error) {
  report.error = String(error?.stack || error);
} finally {
  if (browser) await browser.close().catch(() => {});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

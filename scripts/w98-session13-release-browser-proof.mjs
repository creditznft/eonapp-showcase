import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W98_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W98_SESSION13');
const screenshotDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W98_SESSION13_RELEASE_BROWSER_PROOF.json');
fs.mkdirSync(screenshotDir, { recursive: true });

const scenarios = [
  { name: 'desktop-studio', viewport: { width: 1440, height: 900 }, mobile: false },
  { name: 'desktop-aurora', viewport: { width: 1280, height: 800 }, mobile: false },
  { name: 'mobile-signal', viewport: { width: 844, height: 390 }, mobile: true },
  { name: 'mobile-reduced', viewport: { width: 390, height: 844 }, mobile: true },
  { name: 'desktop-fallback', viewport: { width: 1024, height: 768 }, mobile: false }
];

const report = {
  schema: 'eon.w98.session13.release-browser-proof.v1',
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

  for (const [index, scenario] of scenarios.entries()) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      isMobile: scenario.mobile,
      hasTouch: scenario.mobile,
      serviceWorkers: 'block',
      reducedMotion: scenario.name.includes('reduced') ? 'reduce' : 'no-preference'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('pageerror', (error) => errors.push(`page: ${String(error?.message || error)}`));
    page.on('crash', () => errors.push('page crashed'));
    const url = `${baseURL}/tests/fixtures/w98-session13-release.html?scenario=${encodeURIComponent(scenario.name)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.__SESSION13_RELEASE_PROOF__), null, { timeout: 30000 });
    const fixture = await page.evaluate(() => window.__SESSION13_RELEASE_PROOF__);
    const file = `${String(index + 1).padStart(2, '0')}-session13-${scenario.name}.png`;
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

  const all = Object.values(report.scenarios);
  const studio = report.scenarios['desktop-studio']?.fixture;
  const aurora = report.scenarios['desktop-aurora']?.fixture;
  const signal = report.scenarios['mobile-signal']?.fixture;
  const reduced = report.scenarios['mobile-reduced']?.fixture;
  const fallback = report.scenarios['desktop-fallback']?.fixture;
  report.checks = {
    allScenariosRendered: all.length === scenarios.length && all.every((item) => item.fixture),
    allFixtureContractsPass: all.every((item) => item.fixture?.ok === true),
    studioIdentityApplied: studio?.dataset?.qualityIdentity === 'studio',
    auroraIdentityApplied: aurora?.dataset?.qualityIdentity === 'aurora',
    signalIdentityApplied: signal?.dataset?.qualityIdentity === 'signal',
    districtArrivalWorks: [studio, aurora, signal, reduced].every((item) => item?.checks?.districtArrival === true && item?.checks?.arrivalCard === true),
    transitionsRespectReducedMotion: reduced?.checks?.transitionLayer === true,
    fallbackIsExplicit: fallback?.checks?.fallbackHonest === true && fallback?.compatibility?.fallbackRequired === true,
    noHorizontalOverflow: all.every((item) => Number(item.fixture?.measurements?.overflowPx || 0) <= 1),
    targetFloorsPass: all.every((item) => Number(item.fixture?.measurements?.undersized || 0) === 0),
    compatibilityProfilesResolved: all.every((item) => Boolean(item.fixture?.compatibility?.profile)),
    actualWorldArtConstructed: all.every((item) => item.fixture?.checks?.actualWorldArt === true),
    criticalJourneyReplay: all.every((item) => item.fixture?.checks?.criticalJourney === true),
    networkRecoveryProven: all.every((item) => item.fixture?.checks?.networkRecovery === true),
    graphicsRecoveryProven: all.every((item) => item.fixture?.checks?.graphicsRecovery === true),
    compatibilityPanelReady: all.every((item) => item.fixture?.checks?.compatibilityPanel === true),
    globalHeaderRetiredAfterBoot: all.every((item) => Number(item.fixture?.measurements?.header?.opacity || 0) <= 0.01 || Number(item.fixture?.measurements?.header?.bottom || 0) <= 0),
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

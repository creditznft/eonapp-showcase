#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { RC_LANGUAGE_CODES, RC_LANGUAGE_META, RC_ROUTE_FAMILIES } from '../assets/js/utils/i18n-rc-registry.js';

const baseURL = process.env.W102_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W102_LANGUAGE_TRUTH_REBUILD/browser');
const screenshotDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W102_LANGUAGE_BROWSER_PROOF.json');
fs.mkdirSync(screenshotDir, { recursive: true });

const expectedOptions = ['auto', ...RC_LANGUAGE_CODES];
const allRoutes = [...RC_ROUTE_FAMILIES.p0.routes, ...RC_ROUTE_FAMILIES.p1.routes];
const requestedRouteSet = new Set(String(process.env.W102_ROUTES || '').split(',').map((value) => value.trim()).filter(Boolean));
const requestedMobileLanguageSet = new Set(String(process.env.W102_MOBILE_LANGS || '').split(',').map((value) => value.trim()).filter(Boolean));
const browserSweepRoutes = [
  '/index.html', '/chat.html', '/eon-browser.html', '/workbench.html', '/vault.html',
  '/marketplace.html', '/realm.html', '/realmworld.html', '/reward-access.html', '/onboarding.html',
  '/creator-studio.html', '/code-maker.html', '/trade.html', '/market.html', '/tools.html', '/legal.html'
];
const pairMatrix = {
  en: ['/index.html', '/creator-studio.html'],
  es: ['/index.html', '/creator-studio.html'],
  zh: ['/workbench.html', '/market.html'],
  ja: ['/marketplace.html', '/creator-studio.html'],
  ko: ['/vault.html', '/market.html'],
  fr: ['/realm.html', '/about.html'],
  de: ['/reward-access.html', '/tools.html'],
  pt: ['/onboarding.html', '/code-maker.html'],
  ru: ['/subscription.html', '/trade.html'],
  ar: ['/marketplace.html', '/market.html'],
  hi: ['/onboarding.html', '/creator-studio.html']
};
const restoreRoutes = [
  '/index.html', '/chat.html', '/workbench.html', '/vault.html', '/marketplace.html',
  '/realm.html', '/reward-access.html', '/onboarding.html', '/creator-studio.html', '/trade.html'
];
const mobileMatrix = [
  { lang: 'ar', route: '/marketplace.html', shot: '02-ar-marketplace-mobile.png' },
  { lang: 'zh', route: '/workbench.html', shot: '03-zh-workstation-mobile.png' },
  { lang: 'ja', route: '/creator-studio.html', shot: '04-ja-creator-mobile.png' },
  { lang: 'ko', route: '/vault.html', shot: '05-ko-vault-mobile.png' },
  { lang: 'hi', route: '/onboarding.html', shot: '06-hi-onboarding-mobile.png' },
  { lang: 'de', route: '/reward-access.html', shot: '07-de-rewards-mobile.png' }
];

const report = {
  schema: 'eon.w102.language-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  releaseLanguages: RC_LANGUAGE_CODES,
  routeSweep: [],
  languagePairs: [],
  englishRestore: [],
  mobileLayout: [],
  screenshots: [],
  checks: [],
  unexpectedErrors: [],
  expectedEnvironmentNotes: [],
  ok: false
};

function addCheck(name, passed, detail = null) {
  report.checks.push({ name, passed: Boolean(passed), detail });
}

function diagnostics(page, label) {
  const unexpected = [];
  const expected = [];
  const expectedPattern = /ERR_CONNECTION_REFUSED|ERR_FAILED|Failed to load resource|telegram|monetag|workers\.dev|cloudflare|localhost:11434|127\.0\.0\.1:11434|web3|wallet|ethereum|No provider|frame-src|passkey|service worker is disabled|context is sandboxed|allow-same-origin/i;
  page.on('pageerror', (error) => {
    const text = String(error?.message || error);
    (expectedPattern.test(text) ? expected : unexpected).push(`${label}: pageerror: ${text}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    (expectedPattern.test(text) ? expected : unexpected).push(`${label}: console: ${text}`);
  });
  page.on('crash', () => unexpected.push(`${label}: page crashed`));
  return { unexpected, expected };
}

async function newContext(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1365, height: 900 },
    isMobile: Boolean(options.isMobile),
    hasTouch: Boolean(options.isMobile),
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    locale: 'en-US'
  });
  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    const baseOrigin = new URL(baseURL).origin;
    if (requestUrl.origin === baseOrigin || requestUrl.protocol === 'data:' || requestUrl.protocol === 'blob:') {
      await route.continue();
      return;
    }
    // Language truth is tested against the packaged app. External Telegram, ad, wallet and
    // provider scripts are deliberately blocked so an unavailable third party cannot stall
    // the deterministic browser matrix or contaminate layout/translation evidence.
    await route.abort();
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('eon:lang:preference:v1', 'en');
      localStorage.setItem('eon:lang:v1', 'en');
      localStorage.setItem('eon:onboarding:completed:v1', '1');
      localStorage.setItem('eon:onboarding:complete:v1', '1');
    } catch {}
  });
  return context;
}

async function gotoRoute(page, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#global-lang-picker', { state: 'attached', timeout: 8000 });
  await page.waitForFunction(() => {
    const picker = document.querySelector('#global-lang-picker');
    return picker && picker.options.length >= 12 && document.documentElement.lang;
  }, null, { timeout: 8000 });
  await page.waitForTimeout(250);
}

async function setLanguage(page, lang) {
  await page.locator('#global-lang-picker').evaluate((select, code) => {
    select.value = code;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, lang);
  await page.waitForFunction((code) => document.documentElement.lang === code, lang, { timeout: 12000 });
  await page.waitForTimeout(450);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const picker = document.querySelector('#global-lang-picker');
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const keyed = [];
    const perKey = new Map();
    for (const node of document.querySelectorAll('[data-i18n-key]')) {
      if (!visible(node)) continue;
      const key = node.getAttribute('data-i18n-key') || '';
      const text = String(node.textContent || node.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      const count = perKey.get(key) || 0;
      perKey.set(key, count + 1);
      if (text) keyed.push({ id: `${key}#${count}`, key, text });
    }
    const body = document.body;
    const root = document.documentElement;
    const shell = document.querySelector('.site-header, header');
    return {
      title: document.title,
      lang: root.lang,
      dir: root.dir,
      script: root.dataset.eonScript || '',
      rtlFlag: root.dataset.eonRtl || '',
      pickerValues: picker ? [...picker.options].map((option) => option.value) : [],
      pickerValue: picker?.value || '',
      keyed,
      keyedCount: keyed.length,
      scrollWidth: Math.max(root.scrollWidth, body?.scrollWidth || 0),
      viewportWidth: window.innerWidth,
      overflowPx: Math.max(0, Math.max(root.scrollWidth, body?.scrollWidth || 0) - window.innerWidth),
      bodyDirection: getComputedStyle(body).direction,
      shellDirection: shell ? getComputedStyle(shell).direction : '',
      bodyTextSample: String(body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1200)
    };
  });
}

function changedCount(before, after) {
  const prior = new Map(before.keyed.map((row) => [row.id, row.text]));
  return after.keyed.filter((row) => prior.has(row.id) && prior.get(row.id) !== row.text).length;
}

function restoredExact(before, after) {
  const restored = new Map(after.keyed.map((row) => [row.id, row.text]));
  const comparable = before.keyed.filter((row) => restored.has(row.id));
  return {
    comparable: comparable.length,
    mismatches: comparable.filter((row) => restored.get(row.id) !== row.text).map((row) => ({ id: row.id, before: row.text, after: restored.get(row.id) })).slice(0, 20)
  };
}

let rotatingBrowser = null;
let rotatingBrowserUses = 0;
const MAX_CONTEXTS_PER_BROWSER = Math.max(1, Number(process.env.W102_MAX_CONTEXTS_PER_BROWSER || 4));

async function ensureRotatingBrowser() {
  if (rotatingBrowser && rotatingBrowserUses < MAX_CONTEXTS_PER_BROWSER) return rotatingBrowser;
  if (rotatingBrowser) await rotatingBrowser.close().catch(() => {});
  rotatingBrowser = await launchBrowser();
  rotatingBrowserUses = 0;
  return rotatingBrowser;
}

async function withIsolatedPage(options, label, task) {
  const startedAt = Date.now();
  const browser = await ensureRotatingBrowser();
  rotatingBrowserUses += 1;
  const context = await newContext(browser, options);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const diag = diagnostics(page, label);
  try {
    return await task(page);
  } finally {
    report.unexpectedErrors.push(...diag.unexpected);
    report.expectedEnvironmentNotes.push(...diag.expected);
    await context.close().catch(() => {});
    console.log(`[W102 browser] completed ${label} in ${Date.now() - startedAt}ms`);
  }
}

async function routeSweep() {
  for (const route of browserSweepRoutes) {
    if (requestedRouteSet.size && !requestedRouteSet.has(route)) continue;
    console.log(`[W102 browser] route sweep ${route}`);
    await withIsolatedPage({}, `route-sweep ${route}`, async (page) => {
      try {
        await gotoRoute(page, route);
        const state = await snapshot(page);
        const row = {
          route,
          pickerExact: JSON.stringify(state.pickerValues) === JSON.stringify(expectedOptions),
          lang: state.lang,
          dir: state.dir,
          keyedCount: state.keyedCount
        };
        report.routeSweep.push(row);
        addCheck(`route selector exact ${route}`, row.pickerExact && row.lang === 'en' && row.dir === 'ltr', row);
      } catch (error) {
        const row = { route, error: String(error?.message || error) };
        report.routeSweep.push(row);
        addCheck(`route selector exact ${route}`, false, row);
      }
    });
  }
}

async function languagePairProof() {
  const requestedLanguages = String(process.env.W102_LANGS || '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  const languageFilter = requestedLanguages.length ? new Set(requestedLanguages) : null;
  for (const lang of RC_LANGUAGE_CODES) {
    if (languageFilter && !languageFilter.has(lang)) continue;
    for (const route of pairMatrix[lang]) {
      console.log(`[W102 browser] language pair ${lang} ${route}`);
      await withIsolatedPage({}, `language-pair ${lang} ${route}`, async (page) => {
        try {
          await gotoRoute(page, route);
          const english = await snapshot(page);
          if (lang !== 'en') await setLanguage(page, lang);
          const localized = await snapshot(page);
          const meta = RC_LANGUAGE_META[lang];
          const changes = lang === 'en' ? english.keyedCount : changedCount(english, localized);
          const bodyChanged = english.bodyTextSample !== localized.bodyTextSample;
          const row = {
            lang, route,
            langApplied: localized.lang === lang,
            dirApplied: localized.dir === meta.dir,
            scriptApplied: localized.script === meta.script,
            pickerExact: JSON.stringify(localized.pickerValues) === JSON.stringify(expectedOptions),
            keyedCount: english.keyedCount,
            changedKeyedCount: changes,
            bodyChanged,
            overflowPx: localized.overflowPx
          };
          report.languagePairs.push(row);
          const translated = lang === 'en' || changes > 0 || bodyChanged;
          addCheck(`language runtime ${lang} ${route}`, row.langApplied && row.dirApplied && row.scriptApplied && row.pickerExact && translated, row);
          if (lang === 'ar' && route === '/marketplace.html') {
            const shot = path.join(screenshotDir, '01-ar-marketplace-desktop.png');
            await page.screenshot({ path: shot, fullPage: false, animations: 'disabled' });
            report.screenshots.push(path.relative(outputDir, shot));
          }
        } catch (error) {
          const row = { lang, route, error: String(error?.message || error) };
          report.languagePairs.push(row);
          addCheck(`language runtime ${lang} ${route}`, false, row);
        }
      });
    }
  }
}

async function englishRestoreProof() {
  for (const route of restoreRoutes) {
    if (requestedRouteSet.size && !requestedRouteSet.has(route)) continue;
    console.log(`[W102 browser] English restore ${route}`);
    await withIsolatedPage({}, `english-restore ${route}`, async (page) => {
      try {
        await gotoRoute(page, route);
        const baseline = await snapshot(page);
        await setLanguage(page, 'ar');
        const arabic = await snapshot(page);
        await setLanguage(page, 'ja');
        const japanese = await snapshot(page);
        await setLanguage(page, 'en');
        await page.waitForTimeout(400);
        const restored = await snapshot(page);
        const exact = restoredExact(baseline, restored);
        const row = {
          route,
          baselineKeyed: baseline.keyedCount,
          arabicChanges: changedCount(baseline, arabic),
          japaneseChanges: changedCount(baseline, japanese),
          comparableAfterRestore: exact.comparable,
          restoreMismatches: exact.mismatches,
          lang: restored.lang,
          dir: restored.dir
        };
        report.englishRestore.push(row);
        const hadLocalization = baseline.keyedCount === 0 || row.arabicChanges > 0 || row.japaneseChanges > 0 || baseline.bodyTextSample !== arabic.bodyTextSample;
        addCheck(`A to B to English restore ${route}`, restored.lang === 'en' && restored.dir === 'ltr' && exact.mismatches.length === 0 && hadLocalization, row);
        if (route === '/index.html') {
          const shot = path.join(screenshotDir, '08-en-restored-home-desktop.png');
          await page.screenshot({ path: shot, fullPage: false, animations: 'disabled' });
          report.screenshots.push(path.relative(outputDir, shot));
        }
      } catch (error) {
        const row = { route, error: String(error?.message || error) };
        report.englishRestore.push(row);
        addCheck(`A to B to English restore ${route}`, false, row);
      }
    });
  }
}

async function mobileProof() {
  for (const item of mobileMatrix) {
    if (requestedMobileLanguageSet.size && !requestedMobileLanguageSet.has(item.lang)) continue;
    console.log(`[W102 browser] mobile ${item.lang} ${item.route}`);
    await withIsolatedPage({ viewport: { width: 390, height: 844 }, isMobile: true }, `mobile-layout ${item.lang} ${item.route}`, async (page) => {
      try {
        await gotoRoute(page, item.route);
        await setLanguage(page, item.lang);
        const state = await snapshot(page);
        const meta = RC_LANGUAGE_META[item.lang];
        const row = {
          ...item,
          langApplied: state.lang === item.lang,
          dirApplied: state.dir === meta.dir,
          scriptApplied: state.script === meta.script,
          overflowPx: state.overflowPx,
          bodyDirection: state.bodyDirection,
          shellDirection: state.shellDirection,
          keyedCount: state.keyedCount
        };
        report.mobileLayout.push(row);
        addCheck(`mobile containment ${item.lang} ${item.route}`, row.langApplied && row.dirApplied && row.scriptApplied && row.overflowPx <= 2 && (item.lang !== 'ar' || row.bodyDirection === 'rtl'), row);
        const shot = path.join(screenshotDir, item.shot);
        await page.screenshot({ path: shot, fullPage: false, animations: 'disabled' });
        report.screenshots.push(path.relative(outputDir, shot));
      } catch (error) {
        const row = { ...item, error: String(error?.message || error) };
        report.mobileLayout.push(row);
        addCheck(`mobile containment ${item.lang} ${item.route}`, false, row);
      }
    });
  }
}

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-webgl', '--disable-features=Vulkan'
    ]
  });
}

const phaseRegistry = { route: routeSweep, pairs: languagePairProof, restore: englishRestoreProof, mobile: mobileProof };
const requestedPhases = String(process.env.W102_PHASES || 'route,pairs,restore,mobile')
  .split(',').map((value) => value.trim()).filter(Boolean);
for (const phaseName of requestedPhases) {
  const phase = phaseRegistry[phaseName];
  if (!phase) throw new Error(`Unknown W102 browser phase: ${phaseName}`);
  await phase();
}

report.unexpectedErrors = [...new Set(report.unexpectedErrors)];
report.expectedEnvironmentNotes = [...new Set(report.expectedEnvironmentNotes)].slice(0, 100);
addCheck('zero unexpected browser errors', report.unexpectedErrors.length === 0, report.unexpectedErrors);
report.passedChecks = report.checks.filter((check) => check.passed).length;
report.totalChecks = report.checks.length;
report.ok = report.passedChecks === report.totalChecks;
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  ok: report.ok,
  passedChecks: report.passedChecks,
  totalChecks: report.totalChecks,
  routeSweep: report.routeSweep.length,
  totalStaticRoutes: allRoutes.length,
  languagePairs: report.languagePairs.length,
  englishRestore: report.englishRestore.length,
  mobileLayout: report.mobileLayout.length,
  unexpectedErrors: report.unexpectedErrors.length,
  screenshots: report.screenshots
}, null, 2));
if (!report.ok) {
  console.error(JSON.stringify(report.checks.filter((check) => !check.passed), null, 2));
}
if (rotatingBrowser) {
  await Promise.race([
    rotatingBrowser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);
}
process.exit(report.ok ? 0 : 1);

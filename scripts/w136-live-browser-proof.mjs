#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import {
  W136_ALLOWED_CONSOLE_NOISE,
  W136_BUTTON_AUDIT_GROUPS,
  W136_EONCITY_SCENARIO,
  W136_LIVE_PROOF_SCHEMA,
  W136_PRODUCTION_ROUTES,
  W136_RUNTIME_ERROR_DENYLIST,
  W136_VIEWPORTS
} from '../assets/js/utils/w136-live-proof-contract.js';

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  args.set(key, rest.join('=') || '1');
}

const target = String(args.get('target') || process.env.EONAPP_AUDIT_TARGET || process.env.TARGET_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outRoot = path.resolve(String(args.get('out') || process.env.EONAPP_AUDIT_OUT || 'reports/w136/live-browser-proof'));
const maxRoutes = Number(args.get('max-routes') || W136_PRODUCTION_ROUTES.length);
const headless = String(args.get('headed') || '').toLowerCase() !== '1';
const strict = String(args.get('strict') || process.env.W136_STRICT || '').toLowerCase() === '1';

function isNoise(text) {
  const lower = String(text || '').toLowerCase();
  return W136_ALLOWED_CONSOLE_NOISE.some((noise) => lower.includes(String(noise).toLowerCase()));
}

function classifyConsole(text) {
  const value = String(text || '');
  if (isNoise(value)) return 'allowed-noise';
  const denied = W136_RUNTIME_ERROR_DENYLIST.find((needle) => value.includes(needle));
  return denied ? `deny:${denied}` : 'review';
}

function urlFor(routePath) {
  if (/^https?:/i.test(routePath)) return routePath;
  return `${target}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
}

function normalizeRoutePath(routePath) {
  return String(routePath || '/')
    .split('?')[0]
    .split('#')[0]
    .replace(/\.html$/i, '')
    .replace(/\/+$/, '') || '/';
}

fs.mkdirSync(outRoot, { recursive: true });
fs.mkdirSync(path.join(outRoot, 'screenshots'), { recursive: true });

const startedAt = new Date().toISOString();
let browser;
try {
  browser = await chromium.launch({ headless });
} catch (error) {
  const summary = {
    schema: W136_LIVE_PROOF_SCHEMA,
    target,
    startedAt,
    completedAt: new Date().toISOString(),
    skipped: true,
    reason: 'playwright-browser-not-installed',
    error: error?.message || String(error),
    installHint: 'Run npx playwright install chromium, then rerun npm run qa:w136-live-browser:local or qa:w136-live-browser:production.',
    strict
  };
  fs.writeFileSync(path.join(outRoot, 'w136-browser-proof-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outRoot, 'w136-browser-proof-readable.md'), `# W136 Browser Proof\n\nSkipped: Playwright browser binary is not installed in this runtime.\n\nRun \`npx playwright install chromium\`, then rerun the W136 proof command.\n`);
  console.warn(summary.installHint);
  if (strict) process.exit(1);
  process.exit(0);
}
const routes = W136_PRODUCTION_ROUTES.slice(0, maxRoutes);
const results = [];

try {
  for (const viewport of W136_VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      isMobile: Boolean(viewport.isMobile),
      hasTouch: Boolean(viewport.isMobile),
      reducedMotion: 'reduce'
    });

    for (const route of routes) {
      const page = await context.newPage();
      const consoleRows = [];
      const pageErrors = [];
      page.on('console', (msg) => {
        const text = msg.text();
        consoleRows.push({ type: msg.type(), text, classification: classifyConsole(text) });
      });
      page.on('pageerror', (error) => {
        pageErrors.push({ message: error.message, stack: error.stack || '' });
      });

      const started = Date.now();
      let status = null;
      let finalUrl = '';
      let title = '';
      let bodyText = '';
      let screenshot = '';
      let navigationError = '';
      let linkRows = [];
      let buttonRows = [];
      let groupRows = [];

      try {
        const response = await page.goto(urlFor(route.path), { waitUntil: 'domcontentloaded', timeout: 30000 });
        status = response?.status() || null;
        await page.waitForTimeout(route.id === 'realm' ? 1800 : 750);
        finalUrl = page.url();
        title = await page.title().catch(() => '');
        bodyText = (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 6000);
        screenshot = path.join('screenshots', `${viewport.id}-${route.id}.png`);
        await page.screenshot({ path: path.join(outRoot, screenshot), fullPage: false }).catch(() => {});
        linkRows = await page.locator('a').evaluateAll((links) => links.slice(0, 200).map((a) => ({
          text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          href: a.getAttribute('href') || '',
          aria: a.getAttribute('aria-label') || '',
          target: a.getAttribute('target') || ''
        }))).catch(() => []);
        buttonRows = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]').evaluateAll((buttons) => buttons.slice(0, 220).map((button) => ({
          text: (button.textContent || button.getAttribute('value') || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          aria: button.getAttribute('aria-label') || '',
          disabled: button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true',
          type: button.tagName.toLowerCase()
        }))).catch(() => []);
        groupRows = [];
        const telegramRoute = normalizeRoutePath(route.path) === '/telegram';
        for (const group of W136_BUTTON_AUDIT_GROUPS.filter((item) => {
          if (telegramRoute && ['top-nav', 'footer', 'primary-ctas'].includes(item.id)) return false;
          if (!item.route) return true;
          return normalizeRoutePath(item.route) === normalizeRoutePath(route.path);
        })) {
          const count = await page.locator(group.selector).count().catch(() => 0);
          groupRows.push({ id: group.id, selector: group.selector, count, minCount: group.minCount, ok: count >= group.minCount });
        }
        if (route.id === 'realm') {
          await page.locator('button:has-text("Play"), [data-realm-action="play"], .realm3d-launch-primary').first().click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(1200);
          const cityShot = path.join('screenshots', `${viewport.id}-realm-after-play.png`);
          await page.screenshot({ path: path.join(outRoot, cityShot), fullPage: false }).catch(() => {});
        }
      } catch (err) {
        navigationError = err?.message || String(err);
      } finally {
        const deniedConsole = consoleRows.filter((row) => String(row.classification).startsWith('deny:'));
        const requiredText = (route.requiredText || []).map((needle) => ({ needle, ok: bodyText.includes(needle) || title.includes(needle) }));
        results.push({
          viewport: viewport.id,
          route: route.id,
          path: route.path,
          status,
          finalUrl,
          title,
          ms: Date.now() - started,
          screenshot,
          navigationError,
          requiredText,
          textOk: requiredText.every((item) => item.ok),
          console: { total: consoleRows.length, denied: deniedConsole, review: consoleRows.filter((row) => row.classification === 'review').slice(0, 20) },
          pageErrors,
          links: linkRows,
          buttons: buttonRows,
          groups: groupRows
        });
        await page.close().catch(() => {});
      }
    }
    await context.close().catch(() => {});
  }
} finally {
  await browser.close().catch(() => {});
}

const blockers = results.flatMap((row) => {
  const out = [];
  if (row.navigationError) out.push({ route: row.route, viewport: row.viewport, type: 'navigation', detail: row.navigationError });
  if (row.status && row.status >= 400) out.push({ route: row.route, viewport: row.viewport, type: 'http', detail: String(row.status) });
  if (!row.textOk) out.push({ route: row.route, viewport: row.viewport, type: 'missing-required-text', detail: row.requiredText.filter((item) => !item.ok).map((item) => item.needle).join(', ') });
  for (const denied of row.console.denied) out.push({ route: row.route, viewport: row.viewport, type: 'console', detail: denied.text.slice(0, 240) });
  for (const error of row.pageErrors) out.push({ route: row.route, viewport: row.viewport, type: 'pageerror', detail: error.message.slice(0, 240) });
  for (const group of row.groups.filter((item) => !item.ok)) out.push({ route: row.route, viewport: row.viewport, type: 'button-group', detail: `${group.id}: ${group.count}/${group.minCount}` });
  return out;
});

const summary = {
  schema: W136_LIVE_PROOF_SCHEMA,
  target,
  startedAt,
  completedAt: new Date().toISOString(),
  viewports: W136_VIEWPORTS.map((item) => item.id),
  routes: routes.map((item) => item.path),
  scenario: W136_EONCITY_SCENARIO,
  resultCount: results.length,
  blockerCount: blockers.length,
  ok: blockers.length === 0,
  strict,
  blockers: blockers.slice(0, 200)
};

fs.writeFileSync(path.join(outRoot, 'w136-browser-proof-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(outRoot, 'w136-browser-proof-results.json'), `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(path.join(outRoot, 'w136-browser-proof-readable.md'), `# W136 Browser Proof\n\nTarget: ${target}\n\nRoutes: ${routes.length}\nViewports: ${W136_VIEWPORTS.length}\nResults: ${results.length}\nBlockers: ${blockers.length}\n\n${blockers.map((b) => `- ${b.viewport} ${b.route}: ${b.type} — ${b.detail}`).join('\n') || 'No blockers recorded.'}\n`);

console.log(`W136 browser proof wrote ${results.length} route/viewport rows to ${pathToFileURL(outRoot).href}`);
if (strict && blockers.length) process.exit(1);

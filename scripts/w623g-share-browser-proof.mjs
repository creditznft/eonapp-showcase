import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const baseUrl = String(process.env.EON_W623G_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outputDir = path.resolve('reports/w623g-share-voice-growth/browser');
fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.EON_CHROMIUM_PATH ? { executablePath: process.env.EON_CHROMIUM_PATH } : {}),
  args: ['--no-sandbox']
});
const results = [];

async function inspectDesktop(route, expectedSelector) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error?.message || error)));
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const share = page.locator(expectedSelector).first();
  await share.waitFor({ state: 'visible', timeout: 15000 });
  const box = await share.boundingBox();
  const topRight = Boolean(box && box.x > 980 && box.y < 180);
  await share.click();
  const dialog = page.getByRole('dialog', { name: 'Share Command Center' });
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  const text = await dialog.innerText();
  const required = [
    'Share Command Center', 'Invite to EONAPP', 'Share a creation', 'Celebrate progress',
    'Build a share campaign', 'WhatsApp', 'Telegram', 'LinkedIn', 'Facebook', 'Reddit',
    'Local image or video', 'Save PNG', 'Not active yet'
  ];
  const missing = required.filter((entry) => !text.includes(entry));
  const slug = route === '/' ? 'chat' : route.replace(/^\//, '').replace(/[^a-z0-9-]/gi, '-');
  await page.screenshot({ path: path.join(outputDir, `desktop-${slug}-share.png`), fullPage: true });
  results.push({ route, viewport: 'desktop', shareVisible: true, topRight, missing, pageErrors: errors });
  await page.close();
}

async function inspectMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error?.message || error)));
  await page.goto(`${baseUrl}/create`, { waitUntil: 'networkidle' });
  const share = page.locator('[data-eon-global-share]').first();
  await share.waitFor({ state: 'visible', timeout: 15000 });
  await share.click();
  const dialog = page.getByRole('dialog', { name: 'Share Command Center' });
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  const dialogBox = await dialog.boundingBox();
  const close = page.locator('[data-eon-share-close]');
  const closeVisible = await close.isVisible();
  await page.screenshot({ path: path.join(outputDir, 'mobile-create-share.png'), fullPage: true });
  results.push({ route: '/create', viewport: 'mobile-390x844', shareVisible: true, dialogFitsWidth: Boolean(dialogBox && dialogBox.width <= 390), closeVisible, pageErrors: errors });
  await page.close();
}

try {
  await inspectDesktop('/', '[data-eon-header-share]');
  await inspectDesktop('/create', '[data-eon-global-share]');
  await inspectDesktop('/projects', '[data-eon-global-share]');
  await inspectDesktop('/library', '[data-eon-global-share]');
  await inspectDesktop('/profile', '[data-eon-global-share]');
  await inspectDesktop('/billing', '[data-global-share-launcher]');
  await inspectDesktop('/support', '[data-global-share-launcher]');
  await inspectMobile();
} finally {
  await browser.close();
}

const failures = results.flatMap((result) => {
  const list = [];
  if (!result.shareVisible) list.push(`${result.route}/${result.viewport}: share hidden`);
  if (result.viewport === 'desktop' && !result.topRight) list.push(`${result.route}: share not top-right`);
  if (Array.isArray(result.missing) && result.missing.length) list.push(`${result.route}: missing ${result.missing.join(', ')}`);
  if (result.viewport.startsWith('mobile') && (!result.dialogFitsWidth || !result.closeVisible)) list.push(`${result.route}: mobile dialog overflow/close failure`);
  if (result.pageErrors?.length) list.push(`${result.route}: page errors ${result.pageErrors.join(' | ')}`);
  return list;
});
const report = { schema: 'eonapp.w623g-share-browser-proof.v1', generatedAt: new Date().toISOString(), baseUrl, status: failures.length ? 'failed' : 'passed', results, failures };
fs.writeFileSync(path.join(outputDir, 'browser-proof.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(`W623G browser proof failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`W623G browser proof passed across ${results.length} route/viewport checks.`);

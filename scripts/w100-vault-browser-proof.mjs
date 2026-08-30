import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = process.cwd();
const outDir = path.join(root, 'CodexAuditPack/W100_VAULT_REBUILD');
const screenshotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const baseURL = 'http://127.0.0.1:4183';
const executablePath = process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)
  ? process.env.CHROMIUM_PATH
  : undefined;
const downloadPath = path.join(outDir, 'w100-encrypted-vault-backup.eonvault');
const summaryPath = path.join(outDir, 'w100-safe-summary.json');
const passphrase = 'w100 correct horse battery staple 2026';
const probeRecords = {
  'eon:workspace:w100-proof': JSON.stringify({ note: 'vault-proof-workspace', count: 3 }),
  'eon:projects:w100-proof': JSON.stringify({ title: 'Vault proof project', status: 'local-only' })
};

const checks = [];
const browserErrors = [];

function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
  if (!pass) console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
}

function attachDiagnostics(page, label) {
  page.on('pageerror', (error) => browserErrors.push(`${label}: pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!/favicon|ERR_FAILED|status of 404|net::ERR|503/i.test(text)) browserErrors.push(`${label}: console: ${text}`);
  });
  page.on('response', (response) => {
    if (response.status() !== 404) return;
    if (/\/api\/auth\/session$/i.test(response.url())) return;
    browserErrors.push(`${label}: http404: ${response.url()}`);
  });
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
}

async function waitForServer(url, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Vault proof server did not become ready');
}

async function seedProbeState(page, values = probeRecords) {
  await page.evaluate((records) => {
    localStorage.clear();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(records)) localStorage.setItem(key, value);
  }, values);
}

function currentStorageSnapshot(page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
}

const server = spawn(process.execPath, ['scripts/lhci-static-server.mjs', '--port', '4183', '--root', 'dist'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

let browser;
try {
  await waitForServer(`${baseURL}/vault`);
  browser = await chromium.launch({
    executablePath,
    headless: true,
    chromiumSandbox: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=Translate,OptimizationHints',
      '--window-size=1440,1000'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    serviceWorkers: 'block'
  });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:4183)/, (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'external network disabled in local proof' })
  }));

  const home = await context.newPage();
  attachDiagnostics(home, 'desktop-home');
  await home.goto(`${baseURL}/vault`, { waitUntil: 'domcontentloaded' });
  await seedProbeState(home);
  await home.reload({ waitUntil: 'domcontentloaded' });
  await home.waitForSelector('[data-eon-vault-surface="home"]');
  await home.waitForFunction(() => document.querySelectorAll('[data-eon-vault-card]').length >= 6);
  await home.waitForFunction(() => {
    const provider = document.querySelector('[data-eon-vault-status="providers"]')?.textContent || '';
    const device = document.querySelector('[data-eon-vault-status="device"]')?.textContent || '';
    return !provider.includes('Checking') && !device.includes('Checking');
  });

  check('Vault home title is clear', await home.locator('h1').textContent() === 'Vault');
  check('Vault home exposes current semantic cards', await home.locator('[data-eon-vault-card]').count() >= 7);
  check('Vault home has safe summary action', await home.locator('[data-eon-vault-action="safe-summary"]').count() === 1);
  check('Vault home stays within the viewport width', await home.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2));
  check('Vault home never renders raw probe values', !(await home.locator('body').innerText()).includes('vault-proof-workspace'));
  await home.screenshot({ path: path.join(screenshotDir, '01-vault-home-desktop.png'), fullPage: true });

  const safeSummaryDownload = home.waitForEvent('download', { timeout: 20000 });
  await home.locator('[data-eon-vault-action="safe-summary"]').click();
  const safeSummary = await safeSummaryDownload;
  await safeSummary.saveAs(summaryPath);
  const safeSummaryText = fs.readFileSync(summaryPath, 'utf8');
  check('Safe summary is downloadable JSON', safeSummaryText.trim().startsWith('{'));
  check('Safe summary does not leak probe values', !safeSummaryText.includes('vault-proof-workspace'));

  const backup = await context.newPage();
  attachDiagnostics(backup, 'desktop-backup');
  await backup.goto(`${baseURL}/vault/backup`, { waitUntil: 'domcontentloaded' });
  await seedProbeState(backup);
  await backup.reload({ waitUntil: 'domcontentloaded' });
  await backup.waitForSelector('[data-eon-vault-surface="backup"]');
  await backup.waitForFunction(() => {
    const text = document.querySelector('[data-eon-vault-status="backup-boundary"]')?.textContent || '';
    return !text.includes('Checking');
  });

  check('Backup route title is clear', await backup.locator('h1').textContent() === 'Encrypted Vault backup');
  check('Backup page shows export and restore actions', await backup.locator('[data-eon-vault-action]').count() >= 4);
  await backup.fill('#eon-vault-export-passphrase', passphrase);
  await backup.fill('#eon-vault-export-confirm', passphrase);
  const vaultDownloadPromise = backup.waitForEvent('download', { timeout: 20000 });
  await backup.locator('[data-eon-vault-action="export"]').click();
  const vaultDownload = await vaultDownloadPromise;
  await vaultDownload.saveAs(downloadPath);
  const exportedText = fs.readFileSync(downloadPath, 'utf8');
  const exported = JSON.parse(exportedText);
  check('Encrypted Vault backup downloads an encrypted envelope', exported.encrypted === true && Boolean(exported.cipher));
  check('Encrypted Vault backup file does not expose probe values', !exportedText.includes('restorable'));
  await backup.screenshot({ path: path.join(screenshotDir, '02-vault-backup-desktop.png'), fullPage: true });

  const restoreContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    serviceWorkers: 'block'
  });
  await restoreContext.route(/^https?:\/\/(?!127\.0\.0\.1:4183)/, (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'external network disabled in local proof' })
  }));
  const restore = await restoreContext.newPage();
  attachDiagnostics(restore, 'desktop-restore');
  await restore.goto(`${baseURL}/vault/backup`, { waitUntil: 'domcontentloaded' });
  await restore.waitForSelector('[data-eon-vault-surface="backup"]');
  await restore.setInputFiles('#eon-vault-backup-file', downloadPath);
  await restore.fill('#eon-vault-restore-passphrase', passphrase);
  await restore.locator('[data-eon-vault-action="preview-restore"]').click();
  await restore.waitForFunction(() => {
    const text = document.querySelector('[data-eon-vault-status="restore-plan"]')?.textContent || '';
    return text.includes('Backup has');
  });
  await restore.locator('[data-eon-vault-action="restore-merge"]').click();
  await restore.waitForFunction(() => {
    const status = document.querySelector('[data-eon-vault-status="backup-status"]')?.textContent || '';
    return status.includes('Merge restore complete');
  });
  const restoreStatus = await restore.locator('[data-eon-vault-status="backup-status"]').textContent();
  const restorePlan = await restore.locator('[data-eon-vault-status="restore-plan"]').textContent();
  const restoredStorage = await currentStorageSnapshot(restore);
  check(
    'Merge restore recreates the probe records in a clean browser context',
    restoredStorage['eon:workspace:w100-proof'] === probeRecords['eon:workspace:w100-proof']
      && restoredStorage['eon:projects:w100-proof'] === probeRecords['eon:projects:w100-proof']
  );
  await restore.reload({ waitUntil: 'domcontentloaded' });
  const reloadedStorage = await currentStorageSnapshot(restore);
  check('Restored probe records survive a reload', reloadedStorage['eon:workspace:w100-proof'] === probeRecords['eon:workspace:w100-proof']);
  await restore.screenshot({ path: path.join(screenshotDir, '03-vault-restore-desktop.png'), fullPage: true });

  const recoveryReceipt = {
    restoredKeys: Object.keys(reloadedStorage).filter((key) => key.startsWith('eon:')).sort(),
    restoredProbeValues: {
      workspace: reloadedStorage['eon:workspace:w100-proof'] || '',
      project: reloadedStorage['eon:projects:w100-proof'] || ''
    },
    restoreStatus,
    restorePlan
  };
  fs.writeFileSync(path.join(outDir, 'W100_VAULT_RECOVERY_RECEIPT.json'), JSON.stringify(recoveryReceipt, null, 2));

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  await mobile.route(/^https?:\/\/(?!127\.0\.0\.1:4183)/, (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'external network disabled in local proof' })
  }));
  const mobileHome = await mobile.newPage();
  attachDiagnostics(mobileHome, 'mobile-home');
  for (const route of ['/vault', '/vault/backup']) {
    await mobileHome.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
    await mobileHome.waitForSelector('[data-eon-vault-surface]');
    check(`${route} mobile layout has no horizontal overflow`, await mobileHome.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2));
    check(`${route} mobile primary actions keep a 32px floor`, await mobileHome.evaluate(() => [...document.querySelectorAll('.eon-vault-actions button, .eon-vault-actions a')].filter((node) => node.getBoundingClientRect().height > 0).every((node) => node.getBoundingClientRect().height >= 32)));
  }
  await mobileHome.goto(`${baseURL}/vault`, { waitUntil: 'domcontentloaded' });
  await mobileHome.screenshot({ path: path.join(screenshotDir, '04-vault-home-mobile.png'), fullPage: true });
  await mobileHome.goto(`${baseURL}/vault/backup`, { waitUntil: 'domcontentloaded' });
  await mobileHome.screenshot({ path: path.join(screenshotDir, '05-vault-backup-mobile.png'), fullPage: true });

  check('Browser proof has no unhandled application errors', browserErrors.length === 0, browserErrors.join(' | '));
  await mobile.close();
  await restoreContext.close();
  await context.close();
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
}

const failed = checks.filter((row) => !row.pass);
const result = {
  schema: 'eon.w100.vault-browser-proof.v2',
  generatedAt: new Date().toISOString(),
  passed: checks.length - failed.length,
  total: checks.length,
  score: Math.round(((checks.length - failed.length) / checks.length) * 100),
  failures: failed,
  browserErrors,
  serverLog,
  screenshots: fs.readdirSync(screenshotDir).sort()
};
fs.writeFileSync(path.join(outDir, 'W100_VAULT_BROWSER_PROOF.json'), JSON.stringify(result, null, 2));
console.log(`W100 Vault browser proof: ${result.passed}/${result.total} (${result.score})`);
if (failed.length) process.exit(1);

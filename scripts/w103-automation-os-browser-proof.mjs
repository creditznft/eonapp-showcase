#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseURL = process.env.W103_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W103_AUTOMATION_OS/browser');
const screenshotDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W103_AUTOMATION_OS_BROWSER_PROOF.json');
const storageKey = 'eon:automation-os:v3';
const expectedProviderCount = 181;
fs.mkdirSync(screenshotDir, { recursive: true });

const report = {
  schema: 'eon.w103.automation-os-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  providerCountExpected: expectedProviderCount,
  checks: [],
  desktop: {},
  persistence: {},
  mobile: {},
  workstation: {},
  screenshots: [],
  unexpectedErrors: [],
  expectedEnvironmentNotes: [],
  ok: false
};

function addCheck(name, passed, detail = null) {
  const row = { name, passed: Boolean(passed) };
  if (detail !== null && detail !== undefined) row.detail = detail;
  report.checks.push(row);
  console.log(`[W103 browser] ${row.passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` · ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
}

function addScreenshot(file) {
  report.screenshots.push(path.relative(path.resolve('.'), file).replaceAll('\\', '/'));
}

async function isServerReady() {
  try {
    const response = await fetch(`${baseURL}/automation-studio.html`, { signal: AbortSignal.timeout(1800) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) return null;
  const url = new URL(baseURL);
  const port = url.port || '4183';
  const child = spawn(process.execPath, ['scripts/lhci-static-server.mjs', '--port', port, '--root', 'dist'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverOutput = '';
  child.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
  child.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });
  for (let index = 0; index < 50; index += 1) {
    if (await isServerReady()) return child;
    if (child.exitCode !== null) throw new Error(`Static server exited early: ${serverOutput}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  child.kill('SIGTERM');
  throw new Error(`Static server did not become ready: ${serverOutput}`);
}

function attachDiagnostics(page, label) {
  const unexpected = [];
  const expected = [];
  const expectedPattern = /ERR_CONNECTION_REFUSED|ERR_FAILED|Failed to load resource|telegram|monetag|workers\.dev|cloudflare|localhost:11434|127\.0\.0\.1:11434|wallet|ethereum|service worker|passkey/i;
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

async function makeContext(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 1000 },
    isMobile: Boolean(options.isMobile),
    hasTouch: Boolean(options.isMobile),
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    locale: 'en-US',
    storageState: options.storageState
  });
  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    const baseOrigin = new URL(baseURL).origin;
    if (requestUrl.origin === baseOrigin || ['data:', 'blob:'].includes(requestUrl.protocol)) return route.continue();
    return route.abort();
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

async function gotoAutomation(page) {
  await page.goto(`${baseURL}/automation-studio.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.ao-hero', { state: 'visible', timeout: 20000 });
  await page.waitForFunction((count) => document.body.innerText.includes(`${count}`) && document.querySelectorAll('[data-ao-template]').length >= 10, expectedProviderCount, { timeout: 15000 });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(150);
}

async function getStoredState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key) || '';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    return { raw, parsed };
  }, storageKey);
}

async function clickTab(page, tab) {
  const locator = page.locator(`[data-ao-tab="${tab}"]`).first();
  await locator.click();
  await page.waitForSelector(`[data-ao-view="${tab}"].active`, { timeout: 10000 });
  await page.waitForTimeout(80);
}

async function desktopScenario(browser) {
  const context = await makeContext(browser);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const diag = attachDiagnostics(page, 'desktop');
  await gotoAutomation(page);

  const first = await page.evaluate((expected) => {
    const root = document.documentElement;
    const text = document.body.innerText || '';
    return {
      hero: document.querySelector('.ao-hero h1')?.textContent?.trim() || '',
      statNumbers: [...document.querySelectorAll('.ao-stat strong')].map((node) => node.textContent?.trim()),
      templateCount: document.querySelectorAll('[data-ao-template]').length,
      workflowCards: document.querySelectorAll('[data-ao-open-flow], [data-ao-flow]').length,
      rawLoadingCount: (text.match(/Starting Automation OS|Loading workflow/gi) || []).length,
      overflowPx: Math.max(0, Math.max(root.scrollWidth, document.body.scrollWidth) - window.innerWidth),
      mentionsExpectedProviderCount: text.includes(String(expected))
    };
  }, expectedProviderCount);
  report.desktop.firstRender = first;
  addCheck('Automation OS loads with useful first render', Boolean(first.hero) && first.templateCount >= 10 && first.rawLoadingCount === 0, first);
  addCheck('Provider total is visible and truthful', first.mentionsExpectedProviderCount, first.statNumbers);
  addCheck('Desktop has no persistent horizontal overflow', first.overflowPx === 0, { overflowPx: first.overflowPx });

  const overviewShot = path.join(screenshotDir, '01-automation-desktop-overview.png');
  await page.locator('.ao-hero').screenshot({ path: overviewShot, animations: 'disabled' });
  addScreenshot(overviewShot);

  const before = await getStoredState(page);
  const beforeCount = before.parsed?.workflows?.length || 0;
  await page.locator('[data-ao-template="inbox-triage"]').click();
  await page.waitForSelector('[data-ao-view="workflows"].active');
  await page.waitForTimeout(100);
  const afterTemplate = await getStoredState(page);
  const afterCount = afterTemplate.parsed?.workflows?.length || 0;
  addCheck('Template creates a durable workflow', afterCount === beforeCount + 1, { beforeCount, afterCount });

  await page.locator('[data-ao-action="simulate-flow"]').click();
  await page.waitForFunction(() => document.body.innerText.includes('Latest simulation') && document.body.innerText.includes('no external side effects'), null, { timeout: 12000 });
  const simulated = await getStoredState(page);
  const pendingApprovals = simulated.parsed?.approvals?.filter((item) => item.status === 'pending').length || 0;
  const auditTypes = simulated.parsed?.audit?.map((item) => item.type) || [];
  const workflowWithRun = simulated.parsed?.workflows?.find((item) => Number(item.runCount) > 0);
  report.desktop.simulation = { pendingApprovals, auditTypes: [...new Set(auditTypes)].slice(-20), workflowRunCount: workflowWithRun?.runCount || 0 };
  addCheck('Safe simulation records a run', Number(workflowWithRun?.runCount || 0) >= 1, report.desktop.simulation);
  addCheck('Submit or sensitive steps create approval records', pendingApprovals >= 1, { pendingApprovals });
  addCheck('Simulation records no fabricated external execution', auditTypes.includes('step-simulated') && auditTypes.includes('approval-created') && !simulated.raw.includes('external-action-executed'), null);

  const workflowShot = path.join(screenshotDir, '02-automation-workflow-simulation.png');
  await page.locator('.ao-workspace').screenshot({ path: workflowShot, animations: 'disabled' });
  addScreenshot(workflowShot);

  await clickTab(page, 'approvals');
  const approvalCards = await page.locator('.ao-approval-card').count();
  addCheck('Approval queue exposes prepared human checkpoints', approvalCards >= 1, { approvalCards });

  await clickTab(page, 'providers');
  await page.locator('#ao-provider-search').fill('Power Automate');
  await page.waitForTimeout(500);
  const providerResult = await page.evaluate(() => ({
    headings: [...document.querySelectorAll('.ao-provider h3')].map((node) => node.textContent?.trim()),
    cardCount: document.querySelectorAll('.ao-provider').length,
    matchingTitle: document.querySelector('[data-ao-view="providers"] h2')?.textContent?.trim() || ''
  }));
  addCheck('Provider directory finds Power Automate', providerResult.headings.some((name) => /Power Automate/i.test(name || '')), providerResult);
  await page.locator('.ao-provider').filter({ hasText: 'Power Automate' }).locator('[data-ao-provider]').click();
  await page.waitForSelector('#ao-provider-dialog[open]');
  const dialog = await page.locator('#ao-provider-dialog').innerText();
  addCheck('Provider setup uses a Vault reference instead of a secret field', /vault:\/\/automation\//i.test(dialog) && !/paste.*api key/i.test(dialog), dialog.slice(0, 500));
  await page.locator('#ao-provider-dialog [data-ao-connect]').click();
  const configured = await getStoredState(page);
  const powerConnectionEntry = Object.entries(configured.parsed?.connections || {}).find(([id, item]) => /power-automate/i.test(`${id} ${item?.displayName || ''}`));
  const powerConnection = powerConnectionEntry?.[1] || null;
  addCheck('Provider setup stores non-secret metadata', powerConnection?.status === 'configured' && /^vault:\/\/automation\//.test(powerConnection?.credentialRef || ''), powerConnectionEntry || null);

  const providerShot = path.join(screenshotDir, '03-provider-directory-power-automate.png');
  await page.locator('[data-ao-view="providers"] .ao-panel').screenshot({ path: providerShot, animations: 'disabled' });
  addScreenshot(providerShot);

  const secretSurface = await page.evaluate((key) => {
    const raw = localStorage.getItem(key) || '';
    return {
      passwordInputs: document.querySelectorAll('input[type="password"]').length,
      apiKeyFields: document.querySelectorAll('input[name*="key" i], input[id*="key" i], input[name*="token" i], input[id*="token" i]').length,
      containsApiKeyField: /"apiKey"\s*:|"accessToken"\s*:|"refreshToken"\s*:|"password"\s*:/.test(raw),
      vaultRefs: (raw.match(/vault:\/\/automation\//g) || []).length
    };
  }, storageKey);
  report.desktop.secretSurface = secretSurface;
  addCheck('Automation page never asks for plaintext connector secrets', secretSurface.passwordInputs === 0 && secretSurface.apiKeyFields === 0 && !secretSurface.containsApiKeyField && secretSurface.vaultRefs >= 1, secretSurface);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-ao-action="export-all"]').first().click();
  const download = await downloadPromise;
  const downloadedPath = await download.path();
  const portable = JSON.parse(fs.readFileSync(downloadedPath, 'utf8'));
  const portableRaw = JSON.stringify(portable);
  const portableProof = {
    containsSecrets: portable.containsSecrets,
    workflowCount: portable.state?.workflows?.length || portable.workflows?.length || 0,
    secretFieldDetected: /"apiKey"\s*:|"accessToken"\s*:|"refreshToken"\s*:|"password"\s*:/.test(portableRaw)
  };
  report.desktop.portableExport = portableProof;
  addCheck('Portable workflow export is explicitly secret-free', portableProof.containsSecrets === false && !portableProof.secretFieldDetected && portableProof.workflowCount >= 2, portableProof);

  await clickTab(page, 'runners');
  await page.locator('[data-ao-pref="browserCompanionEnabled"]').check();
  await page.locator('[data-ao-pref="localRunnerEnabled"]').check();
  await page.locator('[data-ao-action="verify-persistence"]').first().click();
  await page.waitForSelector('.ao-toast');
  const persistenceToast = await page.locator('.ao-toast').innerText();
  const runnerState = await getStoredState(page);
  addCheck('Explicit runner preferences persist', runnerState.parsed?.preferences?.browserCompanionEnabled === true && runnerState.parsed?.preferences?.localRunnerEnabled === true, runnerState.parsed?.preferences || null);
  addCheck('Persistence self-check passes', /passed/i.test(persistenceToast), persistenceToast);

  const stateBeforeReload = await getStoredState(page);
  const identity = {
    workflowIds: stateBeforeReload.parsed?.workflows?.map((item) => item.id).sort() || [],
    connectionIds: Object.keys(stateBeforeReload.parsed?.connections || {}).sort(),
    approvals: stateBeforeReload.parsed?.approvals?.length || 0,
    schedules: stateBeforeReload.parsed?.schedules?.length || 0,
    audit: stateBeforeReload.parsed?.audit?.length || 0
  };
  await page.evaluate(() => {
    localStorage.setItem('eon:app-version:v1', 'w104-simulated-update');
    sessionStorage.setItem('eon:session:temporary', 'will-be-cleared');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ao-hero');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ao-hero');
  const stateAfterUpdateAndLogout = await getStoredState(page);
  const afterIdentity = {
    workflowIds: stateAfterUpdateAndLogout.parsed?.workflows?.map((item) => item.id).sort() || [],
    connectionIds: Object.keys(stateAfterUpdateAndLogout.parsed?.connections || {}).sort(),
    approvals: stateAfterUpdateAndLogout.parsed?.approvals?.length || 0,
    schedules: stateAfterUpdateAndLogout.parsed?.schedules?.length || 0,
    audit: stateAfterUpdateAndLogout.parsed?.audit?.length || 0
  };
  const stableCore = JSON.stringify(identity.workflowIds) === JSON.stringify(afterIdentity.workflowIds)
    && JSON.stringify(identity.connectionIds) === JSON.stringify(afterIdentity.connectionIds)
    && afterIdentity.approvals >= identity.approvals;
  addCheck('Workflows and provider metadata survive simulated update and logout/login', stableCore, { before: identity, after: afterIdentity });

  const storageState = await context.storageState();
  report.persistence.sameContext = { before: identity, after: afterIdentity, stableCore };
  report.unexpectedErrors.push(...diag.unexpected);
  report.expectedEnvironmentNotes.push(...diag.expected);
  await context.close();
  return storageState;
}

async function restartPersistenceScenario(browser, storageState) {
  const context = await makeContext(browser, { storageState, viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();
  const diag = attachDiagnostics(page, 'restart-persistence');
  await gotoAutomation(page);
  const stored = await getStoredState(page);
  const snapshot = {
    schema: stored.parsed?.schema,
    workflowCount: stored.parsed?.workflows?.length || 0,
    connectionCount: Object.keys(stored.parsed?.connections || {}).length,
    approvalCount: stored.parsed?.approvals?.length || 0,
    secretFieldDetected: /\"apiKey\"\s*:|\"accessToken\"\s*:|\"refreshToken\"\s*:|\"password\"\s*:/.test(stored.raw)
  };
  report.persistence.newContext = snapshot;
  addCheck('Automation state survives a new browser context with restored login/storage state', snapshot.schema === 3 && snapshot.workflowCount >= 2 && snapshot.connectionCount >= 1 && !snapshot.secretFieldDetected, snapshot);
  report.unexpectedErrors.push(...diag.unexpected);
  report.expectedEnvironmentNotes.push(...diag.expected);
  await context.close();
}

async function mobileScenario(browser) {
  const context = await makeContext(browser, { viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const diag = attachDiagnostics(page, 'mobile');
  await gotoAutomation(page);
  const measurement = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const targets = [...document.querySelectorAll('button, a, input, select, textarea')].filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }).map((node) => {
      const rect = node.getBoundingClientRect();
      return { tag: node.tagName, text: String(node.textContent || node.getAttribute('aria-label') || '').trim().slice(0, 60), width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    return {
      viewportWidth: innerWidth,
      scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
      overflowPx: Math.max(0, Math.max(root.scrollWidth, body.scrollWidth) - innerWidth),
      templateCount: document.querySelectorAll('[data-ao-template]').length,
      smallCriticalTargets: targets.filter((item) => item.height < 40 && ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(item.tag)).slice(0, 20),
      targetCount: targets.length
    };
  });
  report.mobile = measurement;
  addCheck('Mobile layout has no persistent page overflow', measurement.overflowPx === 0, measurement);
  addCheck('Mobile keeps all workflow templates accessible', measurement.templateCount >= 10, { templateCount: measurement.templateCount });

  const mobileShot = path.join(screenshotDir, '04-automation-mobile-overview.png');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: mobileShot, animations: 'disabled', fullPage: false });
  addScreenshot(mobileShot);
  report.unexpectedErrors.push(...diag.unexpected);
  report.expectedEnvironmentNotes.push(...diag.expected);
  await context.close();
}

async function workstationScenario(browser) {
  const context = await makeContext(browser, { viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  const diag = attachDiagnostics(page, 'workstation');
  await page.goto(`${baseURL}/eon-browser.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('[data-ew-open="/automation-studio.html"]', { state: 'visible', timeout: 20000 });
  const integration = await page.evaluate(() => ({
    commandButtons: document.querySelectorAll('[data-ew-open="/automation-studio.html"]').length,
    quickShortcuts: document.querySelectorAll('[data-url="/automation-studio.html"]').length,
    textPresent: /Automation OS|Automate|Build automation/i.test(document.body.innerText || '')
  }));
  report.workstation = integration;
  addCheck('EON Workstation exposes Automation OS in primary navigation', integration.commandButtons >= 2 && integration.textPresent, integration);
  const target = page.locator('[data-ew-open="/automation-studio.html"]').first();
  await target.scrollIntoViewIfNeeded();
  const workstationShot = path.join(screenshotDir, '05-workstation-automation-entry.png');
  await page.locator('.ew-command-deck, #ew-command-deck, .ew-mode-row').first().screenshot({ path: workstationShot, animations: 'disabled' });
  addScreenshot(workstationShot);
  report.unexpectedErrors.push(...diag.unexpected);
  report.expectedEnvironmentNotes.push(...diag.expected);
  await context.close();
}

let serverProcess = null;
let browser = null;
try {
  serverProcess = await ensureServer();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const storageState = await desktopScenario(browser);
  await restartPersistenceScenario(browser, storageState);
  await mobileScenario(browser);
  await workstationScenario(browser);

  addCheck('No unexpected browser errors', report.unexpectedErrors.length === 0, report.unexpectedErrors.slice(0, 20));
  report.checkCount = report.checks.length;
  report.passCount = report.checks.filter((item) => item.passed).length;
  report.failCount = report.checkCount - report.passCount;
  report.ok = report.failCount === 0 && report.unexpectedErrors.length === 0;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`[W103 browser] ${report.ok ? 'PASS' : 'FAIL'} ${report.passCount}/${report.checkCount}`);
  console.log(`[W103 browser] report ${reportPath}`);
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  report.fatalError = error instanceof Error ? error.stack || error.message : String(error);
  report.ok = false;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (serverProcess.exitCode === null) serverProcess.kill('SIGKILL');
  }
}

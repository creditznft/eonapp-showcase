#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseURL = process.env.W103_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W103_AUTOMATION_OS/persistence');
const reportPath = path.join(outputDir, 'W103_UPDATE_SAFE_PERSISTENCE_PROOF.json');
const screenshotDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const PASSPHRASE = 'W103-update-proof-2026!';
const API_SECRET = 'w103_api_secret_proof_not_for_release';
const PASSWORD_SECRET = 'w103-password-proof-not-for-release';
const PASSWORD_PIN = '246810';
const API_VAULT_KEY = 'eon:api-key-vault:v1';
const API_SALT_KEY = 'eon:api-key-vault:salt:v1';
const API_DEVICE_KEY = 'eon:api-key-vault:device-secret:v1';
const PASSWORD_STORE_KEY = 'eon:vault:credentials:v1';
const PASSWORD_SALT_KEY = 'eon:vault:salt:v1';
const AUTOMATION_KEY = 'eon:automation-os:v3';

const report = {
  schema: 'eon.w103.update-safe-persistence-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  checks: [],
  secretsPrinted: false,
  screenshots: [],
  unexpectedErrors: [],
  expectedEnvironmentNotes: [],
  ok: false
};

function addCheck(name, passed, detail = null) {
  const row = { name, passed: Boolean(passed) };
  if (detail !== null && detail !== undefined) row.detail = detail;
  report.checks.push(row);
  console.log(`[W103 persistence] ${row.passed ? 'PASS' : 'FAIL'} ${name}`);
}

function redactText(value = '') {
  return String(value).replaceAll(API_SECRET, '[REDACTED]').replaceAll(PASSWORD_SECRET, '[REDACTED]').replaceAll(PASSPHRASE, '[REDACTED]');
}

function attachDiagnostics(page, label) {
  const unexpected = [];
  const expected = [];
  const expectedPattern = /ERR_CONNECTION_REFUSED|ERR_FAILED|Failed to load resource|telegram|monetag|workers\.dev|cloudflare|localhost:11434|127\.0\.0\.1:11434|wallet|ethereum|service worker|passkey|provider test|network/i;
  page.on('pageerror', (error) => {
    const text = redactText(error?.message || error);
    (expectedPattern.test(text) ? expected : unexpected).push(`${label}: pageerror: ${text}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = redactText(message.text());
    (expectedPattern.test(text) ? expected : unexpected).push(`${label}: console: ${text}`);
  });
  page.on('crash', () => unexpected.push(`${label}: page crashed`));
  return { unexpected, expected };
}

async function isServerReady() {
  try {
    const response = await fetch(`${baseURL}/vault-api-keys.html`, { signal: AbortSignal.timeout(1800) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) return null;
  const port = new URL(baseURL).port || '4183';
  const child = spawn(process.execPath, ['scripts/lhci-static-server.mjs', '--port', port, '--root', 'dist'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isServerReady()) return child;
    if (child.exitCode !== null) throw new Error(`Static server exited early: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  child.kill('SIGTERM');
  throw new Error(`Static server did not become ready: ${output}`);
}

async function makeContext(browser, storageState) {
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    locale: 'en-US',
    storageState
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

async function waitForPage(page, pathName, selector) {
  await page.goto(`${baseURL}${pathName}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector(selector, { state: 'attached', timeout: 25000 });
  await page.waitForTimeout(250);
}

async function seedApiKey(page) {
  await waitForPage(page, '/vault-api-keys.html', '#vlt-persist-encrypted');
  await page.locator('#vlt-persist-encrypted').check();
  await page.locator('#vlt-key-groq').fill(API_SECRET);
  await page.locator('#vlt-save-groq').click();
  await page.waitForFunction((key) => {
    try { return Boolean(JSON.parse(localStorage.getItem(key) || '{}').groq); } catch { return false; }
  }, API_VAULT_KEY, { timeout: 20000 });
  const proof = await page.evaluate(({ vaultKey, saltKey, deviceKey, secret }) => {
    const raw = localStorage.getItem(vaultKey) || '';
    const input = document.querySelector('#vlt-key-groq');
    return {
      encryptedEntryPresent: Boolean(raw),
      ciphertextContainsPlaintext: raw.includes(secret),
      saltPresent: Boolean(localStorage.getItem(saltKey)),
      deviceSecretPresent: Boolean(localStorage.getItem(deviceKey)),
      inputCleared: !input?.value,
      passwordFieldCount: document.querySelectorAll('input[type="password"]').length,
      bodyContainsPlaintext: (document.body.innerText || '').includes(secret)
    };
  }, { vaultKey: API_VAULT_KEY, saltKey: API_SALT_KEY, deviceKey: API_DEVICE_KEY, secret: API_SECRET });
  addCheck('Encrypted AI API key is stored without plaintext or DOM refill', proof.encryptedEntryPresent && !proof.ciphertextContainsPlaintext && proof.saltPresent && proof.deviceSecretPresent && proof.inputCleared && !proof.bodyContainsPlaintext, proof);
}

async function seedAutomation(page) {
  await waitForPage(page, '/automation-studio.html', '.ao-hero');
  const before = await page.evaluate((key) => {
    try { return JSON.parse(localStorage.getItem(key) || '{}').workflows?.length || 0; } catch { return 0; }
  }, AUTOMATION_KEY);
  await page.locator('[data-ao-template="lead-crm"]').click();
  await page.waitForFunction(({ key, beforeCount }) => {
    try { return (JSON.parse(localStorage.getItem(key) || '{}').workflows?.length || 0) > beforeCount; } catch { return false; }
  }, { key: AUTOMATION_KEY, beforeCount: before });
  await page.locator('[data-ao-tab="runners"]').click();
  await page.locator('[data-ao-pref="browserCompanionEnabled"]').check();
  await page.locator('[data-ao-pref="localRunnerEnabled"]').check();
  const proof = await page.evaluate((key) => {
    const raw = localStorage.getItem(key) || '';
    let state = {};
    try { state = JSON.parse(raw); } catch {}
    return {
      workflowCount: state.workflows?.length || 0,
      preferences: state.preferences || {},
      plaintextSecretFieldDetected: /"(?:apiKey|accessToken|refreshToken|password|clientSecret)"\s*:/.test(raw)
    };
  }, AUTOMATION_KEY);
  addCheck('Automation workflows and runner preferences are stored durably without secrets', proof.workflowCount >= 1 && proof.preferences.browserCompanionEnabled === true && proof.preferences.localRunnerEnabled === true && !proof.plaintextSecretFieldDetected, proof);
}

async function seedPasswordManager(page) {
  await waitForPage(page, '/eon-browser.html', '[data-ew-drawer="passwords"]');
  await page.locator('[data-ew-drawer="passwords"]').click();
  await page.locator('[data-ew-click-legacy="eon-pwdmgr-btn"]').click();
  await page.waitForSelector('#eon-pwd-pin', { state: 'visible', timeout: 20000 });
  await page.locator('#eon-pwd-pin').fill(PASSWORD_PIN);
  await page.locator('#eon-pwd-pin-submit').click();
  await page.waitForSelector('#eon-pwd-vault-content:not([hidden])', { timeout: 10000 });
  await page.locator('.eon-pwd-add-details summary').click();
  await page.locator('#eon-pwd-new-domain').fill('proof.example');
  await page.locator('#eon-pwd-new-user').fill('w103-user');
  await page.locator('#eon-pwd-new-pass').fill(PASSWORD_SECRET);
  await page.locator('#eon-pwd-add-btn').click();
  await page.waitForFunction((key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]').length > 0; } catch { return false; }
  }, PASSWORD_STORE_KEY);
  const proof = await page.evaluate(({ storeKey, saltKey, secret }) => {
    const raw = localStorage.getItem(storeKey) || '';
    return {
      encryptedEntryCount: (() => { try { return JSON.parse(raw).length; } catch { return 0; } })(),
      ciphertextContainsPlaintext: raw.includes(secret),
      saltPresent: Boolean(localStorage.getItem(saltKey)),
      passwordInputCleared: !document.querySelector('#eon-pwd-new-pass')?.value,
      bodyContainsPlaintext: (document.body.innerText || '').includes(secret),
      domainVisible: (document.body.innerText || '').includes('proof.example')
    };
  }, { storeKey: PASSWORD_STORE_KEY, saltKey: PASSWORD_SALT_KEY, secret: PASSWORD_SECRET });
  addCheck('EON Browser password record is encrypted, persistent, and not left in the DOM', proof.encryptedEntryCount >= 1 && !proof.ciphertextContainsPlaintext && proof.saltPresent && proof.passwordInputCleared && !proof.bodyContainsPlaintext && proof.domainVisible, proof);
  await page.locator('#eon-pwd-lock-vault').click();
}

async function exportVault(page) {
  await waitForPage(page, '/vault-backup.html', '#vault-export-btn');
  await page.locator('#vault-passphrase').fill(PASSPHRASE);
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('#vault-export-btn').click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Vault download path unavailable.');
  const raw = fs.readFileSync(downloadPath, 'utf8');
  const parsed = JSON.parse(raw);
  const proof = {
    encrypted: parsed.encrypted === true,
    algorithm: parsed.algorithm,
    hasEnvelopeHash: Boolean(parsed.envelopeHash),
    hasCiphertext: Boolean(parsed.cipher),
    serializedContainsApiSecret: raw.includes(API_SECRET),
    serializedContainsPasswordSecret: raw.includes(PASSWORD_SECRET),
    serializedContainsPassphrase: raw.includes(PASSPHRASE)
  };
  addCheck('Vault backup is encrypted and contains no plaintext secrets', proof.encrypted && proof.algorithm === 'AES-GCM-256' && proof.hasEnvelopeHash && proof.hasCiphertext && !proof.serializedContainsApiSecret && !proof.serializedContainsPasswordSecret && !proof.serializedContainsPassphrase, proof);
  return downloadPath;
}

async function clearAndRestore(page, downloadPath) {
  const beforeClear = await page.evaluate(({ automationKey, apiKey, passwordKey }) => ({
    automation: Boolean(localStorage.getItem(automationKey)),
    apiVault: Boolean(localStorage.getItem(apiKey)),
    passwordVault: Boolean(localStorage.getItem(passwordKey)),
    keyCount: localStorage.length
  }), { automationKey: AUTOMATION_KEY, apiKey: API_VAULT_KEY, passwordKey: PASSWORD_STORE_KEY });
  addCheck('All critical stores exist before destructive restore test', beforeClear.automation && beforeClear.apiVault && beforeClear.passwordVault, beforeClear);

  await page.evaluate(() => localStorage.clear());
  const afterClear = await page.evaluate(({ automationKey, apiKey, passwordKey }) => ({
    automation: Boolean(localStorage.getItem(automationKey)),
    apiVault: Boolean(localStorage.getItem(apiKey)),
    passwordVault: Boolean(localStorage.getItem(passwordKey)),
    keyCount: localStorage.length
  }), { automationKey: AUTOMATION_KEY, apiKey: API_VAULT_KEY, passwordKey: PASSWORD_STORE_KEY });
  addCheck('Destructive clear removes the critical local stores before restore', !afterClear.automation && !afterClear.apiVault && !afterClear.passwordVault, afterClear);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#vault-import-btn', { timeout: 25000 });
  await page.locator('#vault-passphrase').fill(PASSPHRASE);
  await page.locator('#vault-import-file').setInputFiles(downloadPath);
  await page.locator('#vault-import-btn').click();
  await page.waitForFunction(({ automationKey, apiKey, passwordKey }) => Boolean(localStorage.getItem(automationKey) && localStorage.getItem(apiKey) && localStorage.getItem(passwordKey)), { automationKey: AUTOMATION_KEY, apiKey: API_VAULT_KEY, passwordKey: PASSWORD_STORE_KEY }, { timeout: 30000 });
  const afterRestore = await page.evaluate(({ automationKey, apiKey, passwordKey, apiSecret, passwordSecret }) => {
    const automation = localStorage.getItem(automationKey) || '';
    const apiVault = localStorage.getItem(apiKey) || '';
    const passwordVault = localStorage.getItem(passwordKey) || '';
    let automationState = {};
    try { automationState = JSON.parse(automation); } catch {}
    return {
      workflowCount: automationState.workflows?.length || 0,
      runnerPreferences: automationState.preferences || {},
      apiVaultPresent: Boolean(apiVault),
      passwordVaultPresent: Boolean(passwordVault),
      apiCiphertextContainsPlaintext: apiVault.includes(apiSecret),
      passwordCiphertextContainsPlaintext: passwordVault.includes(passwordSecret),
      deviceSecretRestored: Boolean(localStorage.getItem('eon:api-key-vault:device-secret:v1')),
      apiSaltRestored: Boolean(localStorage.getItem('eon:api-key-vault:salt:v1')),
      passwordSaltRestored: Boolean(localStorage.getItem('eon:vault:salt:v1'))
    };
  }, { automationKey: AUTOMATION_KEY, apiKey: API_VAULT_KEY, passwordKey: PASSWORD_STORE_KEY, apiSecret: API_SECRET, passwordSecret: PASSWORD_SECRET });
  addCheck('Encrypted Vault restore recovers workflows, API-key ciphertext, password ciphertext, and derivation material', afterRestore.workflowCount >= 1 && afterRestore.runnerPreferences.localRunnerEnabled === true && afterRestore.apiVaultPresent && afterRestore.passwordVaultPresent && !afterRestore.apiCiphertextContainsPlaintext && !afterRestore.passwordCiphertextContainsPlaintext && afterRestore.deviceSecretRestored && afterRestore.apiSaltRestored && afterRestore.passwordSaltRestored, afterRestore);
}

async function verifyAfterUpdateAndLogin(page) {
  await waitForPage(page, '/vault-api-keys.html', '#vlt-restore-encrypted');
  await page.locator('#vlt-restore-encrypted').click();
  await page.waitForTimeout(1200);
  const apiProof = await page.evaluate((secret) => ({
    encryptedProviderListed: (document.body.innerText || '').includes('encrypted provider'),
    providerRowActive: document.querySelector('#vlt-row-groq')?.dataset.sessionKey === '1' || /Session key active/i.test(document.querySelector('#vlt-status-groq')?.textContent || ''),
    inputEmpty: !document.querySelector('#vlt-key-groq')?.value,
    bodyContainsPlaintext: (document.body.innerText || '').includes(secret)
  }), API_SECRET);
  addCheck('Restored API key decrypts into session without refilling or printing the secret', apiProof.providerRowActive && apiProof.inputEmpty && !apiProof.bodyContainsPlaintext, apiProof);

  await waitForPage(page, '/eon-browser.html', '[data-ew-drawer="passwords"]');
  await page.locator('[data-ew-drawer="passwords"]').click();
  await page.locator('[data-ew-click-legacy="eon-pwdmgr-btn"]').click();
  await page.waitForSelector('#eon-pwd-pin', { state: 'visible', timeout: 20000 });
  await page.locator('#eon-pwd-pin').fill(PASSWORD_PIN);
  await page.locator('#eon-pwd-pin-submit').click();
  await page.waitForSelector('#eon-pwd-vault-content:not([hidden])', { timeout: 10000 });
  const entry = page.locator('.eon-pwd-entry').filter({ hasText: 'proof.example' }).first();
  await entry.waitFor({ state: 'visible', timeout: 10000 });
  await entry.locator('.eon-pwd-entry-pass').click();
  const passwordDecrypted = await entry.locator('.eon-pwd-entry-pass').evaluate((node, secret) => node.textContent === secret, PASSWORD_SECRET);
  addCheck('Restored EON Browser password decrypts with the original PIN after update/login', passwordDecrypted, { domainVisible: true, decryptedWithOriginalPin: passwordDecrypted });
  await page.locator('#eon-pwd-lock-vault').click();

  await waitForPage(page, '/automation-studio.html', '.ao-hero');
  const automationProof = await page.evaluate((key) => {
    let state = {};
    try { state = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    return {
      workflowCount: state.workflows?.length || 0,
      connectionCount: Object.keys(state.connections || {}).length,
      localRunnerEnabled: Boolean(state.preferences?.localRunnerEnabled),
      browserCompanionEnabled: Boolean(state.preferences?.browserCompanionEnabled),
      schema: state.schema
    };
  }, AUTOMATION_KEY);
  addCheck('Restored Automation OS state opens after update/login with workflows and runner preferences intact', automationProof.schema === 3 && automationProof.workflowCount >= 1 && automationProof.localRunnerEnabled && automationProof.browserCompanionEnabled, automationProof);

  const bodySecrets = await page.evaluate(({ apiSecret, passwordSecret, passphrase }) => {
    const text = document.documentElement.innerHTML;
    return {
      apiSecretInDom: text.includes(apiSecret),
      passwordSecretInDom: text.includes(passwordSecret),
      passphraseInDom: text.includes(passphrase)
    };
  }, { apiSecret: API_SECRET, passwordSecret: PASSWORD_SECRET, passphrase: PASSPHRASE });
  addCheck('No persistence proof secret remains in the final page DOM', !bodySecrets.apiSecretInDom && !bodySecrets.passwordSecretInDom && !bodySecrets.passphraseInDom, bodySecrets);
}

let serverProcess = null;
let browser = null;
let context = null;
try {
  serverProcess = await ensureServer();
  const preferredChromiumPath = String(process.env.CHROMIUM_PATH || '').trim();
  const launchOptions = {
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  };
  if (preferredChromiumPath) {
    launchOptions.executablePath = preferredChromiumPath;
  } else if (process.platform === 'linux' && fs.existsSync('/usr/bin/chromium')) {
    launchOptions.executablePath = '/usr/bin/chromium';
  }
  browser = await chromium.launch(launchOptions);
  context = await makeContext(browser);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const diag = attachDiagnostics(page, 'persistence');

  await seedApiKey(page);
  await seedAutomation(page);
  await seedPasswordManager(page);
  const backupPath = await exportVault(page);
  await clearAndRestore(page, backupPath);

  // Simulate the next deployment and a completed logout/login cycle by clearing all
  // ephemeral session state, then opening a new browser context with the durable origin state.
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.setItem('eon:app-version:v1', 'w104-simulated-update');
  });
  const storageState = await context.storageState();
  await context.close();
  context = await makeContext(browser, storageState);
  const restartedPage = await context.newPage();
  restartedPage.setDefaultTimeout(20000);
  const restartedDiag = attachDiagnostics(restartedPage, 'restart');
  await verifyAfterUpdateAndLogin(restartedPage);

  report.unexpectedErrors.push(...diag.unexpected, ...restartedDiag.unexpected);
  report.expectedEnvironmentNotes.push(...diag.expected, ...restartedDiag.expected);
  addCheck('No unexpected browser errors during update-safe persistence proof', report.unexpectedErrors.length === 0, report.unexpectedErrors.slice(0, 20));
  report.checkCount = report.checks.length;
  report.passCount = report.checks.filter((item) => item.passed).length;
  report.failCount = report.checkCount - report.passCount;
  report.ok = report.failCount === 0 && report.unexpectedErrors.length === 0;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`[W103 persistence] ${report.ok ? 'PASS' : 'FAIL'} ${report.passCount}/${report.checkCount}`);
  console.log(`[W103 persistence] report ${reportPath}`);
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  report.fatalError = redactText(error instanceof Error ? error.stack || error.message : String(error));
  report.ok = false;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (serverProcess.exitCode === null) serverProcess.kill('SIGKILL');
  }
}

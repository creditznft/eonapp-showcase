/**
 * W646 — direct-browser BYOK certification recorder.
 *
 * This is deliberately an operator tool, not a mock: it uses the normal Vault
 * and EONBOT screens.  It writes only sanitized booleans, identifiers and
 * network metadata; prompts, completions, keys, headers, bodies and storage
 * values never enter the receipt.
 *
 * Example:
 *   node scripts/w646-browser-byok-certification.mjs --provider groq --env C:\\path\\.env.local
 */
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, all) => value.startsWith('--') ? [[value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : 'true']] : []));
const providerId = String(args.provider || '').trim().toLowerCase();
const baseUrl = String(args.url || 'http://127.0.0.1:5173').replace(/\/$/, '');
const timeout = Math.max(10_000, Number(args.timeout || 90_000));
const outputDir = path.resolve(args.output || `reports/provider-certification/${providerId || 'unknown'}`);
const envPath = path.resolve(args.env || '.env.local');

if (!providerId) throw new Error('Use --provider <catalogue-id>.');
if (!fs.existsSync(envPath)) throw new Error(`Environment file was not found: ${envPath}`);

const envName = `EON_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`;
const envLine = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find((line) => line.startsWith(`${envName}=`));
const apiKey = String(envLine || '').slice(envName.length + 1).trim();
if (!apiKey) throw new Error(`${envName} is absent or empty; no browser request was made.`);

const nonce = `EON_BROWSER_OK_${randomBytes(10).toString('hex').toUpperCase()}`;
const receipt = {
  schema: 'eon.w646.browser-byok-certification.v1',
  timestamp: new Date().toISOString(), providerId, baseUrl,
  challenge: { nonceDetected: false, responseNonEmpty: false, responseLength: 0, responseSha256: '' },
  vault: { plaintextKeyFoundInStorage: null, encryptedEnvelopePresent: null, storagePageA: null, storagePageB: null, directRetrieve: null, restoreUiResult: '', restoreUiStatus: '', survivedReload: null, restoredToSession: null, removedFromSession: null, removedFromEncryptedVault: null },
  chatHydration: null,
  uiDiagnostics: [],
  sendLifecycle: [],
  generationLifecycle: { state: 'not-armed', requestStartedAt: '', requestSettledAt: '', settlement: '', status: null, harnessAborted: false },
  network: [], finalUiState: 'not-started', lastSafeStep: 'not-started', errors: []
};
const providerHosts = new Set();
let browser;
let page;
let generationLifecycle;

function pathCategory(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.includes('chat') || pathname.includes('generate')) return 'generation';
  if (pathname.includes('model')) return 'discovery';
  return 'other';
}
function browserFailureCategory(errorText = '') {
  const code = String(errorText).match(/net::ERR_[A-Z0-9_]+/i)?.[0];
  return code ? code.toUpperCase() : 'BROWSER_REQUEST_FAILED';
}
function browserConsoleCategory(message = '') {
  const text = String(message).toLowerCase();
  if (text.includes('cross-origin') || text.includes('cors')) return 'CORS';
  if (text.includes('content security policy') || text.includes('connect-src')) return 'CSP';
  if (text.includes('mixed content')) return 'MIXED_CONTENT';
  const failure = browserFailureCategory(message);
  return failure === 'BROWSER_REQUEST_FAILED' ? 'BROWSER_CONSOLE_ERROR' : failure;
}
function save() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'browser-certification.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
function recordSendCheckpoint(name, detail = {}) {
  receipt.sendLifecycle.push({ name, at: new Date().toISOString(), ...detail });
}
function isSelectedGenerationRequest(request) {
  const url = new URL(request.url());
  if (providerId === 'groq') return url.hostname === 'api.groq.com' && url.pathname === '/openai/v1/chat/completions';
  return url.hostname !== new URL(baseUrl).hostname && pathCategory(request.url()) === 'generation';
}
function armGenerationLifecycle() {
  let resolveStarted;
  let resolveSettled;
  generationLifecycle = {
    active: false,
    request: null,
    harnessAbortRequested: false,
    started: new Promise((resolve) => { resolveStarted = resolve; }),
    settled: new Promise((resolve) => { resolveSettled = resolve; }),
    resolveStarted,
    resolveSettled
  };
  receipt.generationLifecycle.state = 'armed';
  recordSendCheckpoint('generation-lifecycle-armed', { providerHostname: providerId === 'groq' ? 'api.groq.com' : '' });
  return generationLifecycle;
}
function waitForLifecycle(promise, timeoutMs) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => { timer = setTimeout(() => resolve({ kind: 'timeout' }), timeoutMs); })
  ]).finally(() => clearTimeout(timer));
}
async function completedAiMessages(target) {
  return target.evaluate(() => [...document.querySelectorAll('#chat-messages .msg-row.bot')]
    .filter((row) => !['typing-row', 'stream-row'].includes(row.id))
    .filter((row) => row.querySelector('.msg-avatar')?.textContent?.trim() === '✨')
    .map((row) => row.querySelector('.msg-bubble'))
    .filter((bubble) => bubble && bubble.id !== 'stream-bubble' && String(bubble.textContent || '').trim())
    .map((bubble) => String(bubble.textContent || '').trim()));
}
async function waitForProviderChoices(target) {
  await target.waitForSelector('#eon-vault-provider-select');
  await target.waitForFunction(() => document.querySelector('#eon-vault-provider-select')?.options.length > 0);
  await target.selectOption('#eon-vault-provider-select', providerId);
}
async function completedProviderStatus(target, accepted) {
  await target.waitForFunction((source) => {
    const status = document.querySelector('#eon-vault-provider-check-status')?.textContent || '';
    return new RegExp(source, 'i').test(status);
  }, accepted.source, { timeout });
  return target.locator('#eon-vault-provider-check-status').innerText();
}
async function safeVaultStorageMetadata(target, secret, id = providerId) {
  return target.evaluate(({ value, provider }) => {
    const names = ['eon:api-key-vault:v1', 'eon:api-key-vault:salt:v1', 'eon:api-key-vault:device-secret:v1'];
    const lengths = Object.fromEntries(names.map((name) => [name, String(localStorage.getItem(name) || '').length]));
    let providerEntryPresent = false;
    try { providerEntryPresent = Boolean(JSON.parse(localStorage.getItem('eon:api-key-vault:v1') || '{}')[provider]); } catch {}
    return { origin: location.origin, envelopePresent: lengths['eon:api-key-vault:v1'] > 0, saltPresent: lengths['eon:api-key-vault:salt:v1'] > 0, deviceSecretPresent: lengths['eon:api-key-vault:device-secret:v1'] > 0, providerEntryPresent, byteLengths: lengths, plaintextKeyFound: Object.values(localStorage).some((entry) => String(entry).includes(value)) };
  }, { value: secret, provider: id });
}
async function safeProviderRemovalMetadata(target, secret, id = providerId) {
  return target.evaluate(async ({ value, provider }) => {
    const [{ ApiKeyVault }, runtime] = await Promise.all([import('/assets/js/utils/api-key-vault.js'), import('/assets/js/chat/ai-runtime.js')]);
    const encryptedProviders = ApiKeyVault.status().providers || [];
    return { sessionKeyPresent: Boolean(runtime.getApiKey(provider)), encryptedEntryPresent: encryptedProviders.includes(provider), plaintextKeyFoundInLocalStorage: Object.values(localStorage).some((entry) => String(entry).includes(value)), plaintextKeyFoundInSessionStorage: Object.values(sessionStorage).some((entry) => String(entry).includes(value)) };
  }, { value: secret, provider: id });
}
async function captureChatControlState(target, phase, requiredSelector = '') {
  const row = await target.evaluate(({ label, selector }) => {
    const controls = document.querySelector('#chat-controls'); const setup = document.querySelector('[data-eonbot-home-setup]'); const required = selector ? document.querySelector(selector) : null; const style = required ? getComputedStyle(required) : null; const rect = required?.getBoundingClientRect?.();
    return { phase: label, pathname: location.pathname, controlsReady: controls?.dataset?.ready || '', controlsDebugStatus: globalThis.__eonChatControlsDebug?.status || '', controlsChildElementCount: controls?.childElementCount || 0, controlsTextOnly: Boolean(controls && controls.childElementCount === 0 && String(controls.textContent || '').trim()), setupOpen: Boolean(setup?.open), setupTriggerPresent: Boolean(document.querySelector('[data-eonbot-home-open-setup]')), setupClientHeight: Number(setup?.clientHeight || 0), setupScrollHeight: Number(setup?.scrollHeight || 0), setupScrollTop: Number(setup?.scrollTop || 0), requiredSelector: selector, requiredPresent: Boolean(required), requiredWithinControls: Boolean(required && controls?.contains(required)), requiredRendered: Boolean(rect?.width && rect?.height), requiredVisibility: style?.visibility || '', requiredDisplay: style?.display || '' };
  }, { label: phase, selector: requiredSelector });
  receipt.uiDiagnostics.push(row); return row;
}
async function waitForStableChatControls(target, { phase, requiredSelector = '', requireVisible = false } = {}) {
  const label = phase || 'controls-ready';
  try {
    await target.locator('#chat-controls').waitFor({ state: 'attached' });
    await target.waitForFunction((selector) => { const controls = document.querySelector('#chat-controls'); const required = selector ? document.querySelector(selector) : controls; return controls?.dataset?.ready === '1' && globalThis.__eonChatControlsDebug?.status === 'ready' && Boolean(required); }, requiredSelector, { timeout });
    await target.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await target.waitForFunction((selector) => { const controls = document.querySelector('#chat-controls'); return controls?.dataset?.ready === '1' && globalThis.__eonChatControlsDebug?.status === 'ready' && Boolean(selector ? document.querySelector(selector) : controls); }, requiredSelector, { timeout });
    const required = target.locator(requiredSelector || '#chat-controls').first();
    if (requireVisible) { await required.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' })); await required.waitFor({ state: 'visible' }); }
    await captureChatControlState(target, label, requiredSelector); return required;
  } catch (error) {
    try { await captureChatControlState(target, `${label}-failed`, requiredSelector); } catch {}
    throw error;
  }
}

try {
  browser = await chromium.launch({ headless: args.headed !== 'true', chromiumSandbox: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const attachRecorder = (target) => {
    target.setDefaultTimeout(timeout);
    target.on('request', (request) => {
    const url = request.url();
    const host = new URL(url).hostname;
    if (host !== new URL(baseUrl).hostname) {
      providerHosts.add(host);
      if (pathCategory(url) === 'generation') recordSendCheckpoint('generation-request-started', { providerHostname: host });
    }
    if (generationLifecycle?.active === false && isSelectedGenerationRequest(request)) {
      generationLifecycle.active = true;
      generationLifecycle.request = request;
      receipt.generationLifecycle.state = 'active';
      receipt.generationLifecycle.requestStartedAt = new Date().toISOString();
      generationLifecycle.resolveStarted({ kind: 'started', request });
    }
    });
    target.on('response', (response) => {
    const url = response.url(); const host = new URL(url).hostname;
    if (host === new URL(baseUrl).hostname) return;
    const category = pathCategory(url);
    receipt.network.push({ method: response.request().method(), providerHostname: host, pathnameCategory: category, status: response.status(), browserInitiated: true, authorizationHeaderPresent: Boolean(response.request().headers().authorization), keyInUrlDetected: /[?&](key|api[_-]?key|token)=/i.test(url), eonappOrCloudflareProxyObserved: /(^|\.)(eonapp\.ch|cloudflare\.com)$/i.test(host) });
    if (category === 'generation') recordSendCheckpoint('generation-response-received', { providerHostname: host, status: response.status() });
    });
    target.on('requestfailed', (request) => {
      const url = request.url(); const host = new URL(url).hostname;
      if (host === new URL(baseUrl).hostname) return;
      const category = pathCategory(url);
      receipt.network.push({ method: request.method(), providerHostname: host, pathnameCategory: category, status: 0, browserInitiated: true, authorizationHeaderPresent: Boolean(request.headers().authorization), keyInUrlDetected: /[?&](key|api[_-]?key|token)=/i.test(url), eonappOrCloudflareProxyObserved: /(^|\.)(eonapp\.ch|cloudflare\.com)$/i.test(host), requestFailed: true, browserFailureCategory: browserFailureCategory(request.failure()?.errorText || '') });
      if (category === 'generation') recordSendCheckpoint('generation-request-failed', { providerHostname: host });
      if (generationLifecycle?.request === request) {
        const category = generationLifecycle.harnessAbortRequested ? 'HARNESS_TIMEOUT_ABORT' : browserFailureCategory(request.failure()?.errorText || '');
        receipt.generationLifecycle = { ...receipt.generationLifecycle, state: 'settled', requestSettledAt: new Date().toISOString(), settlement: 'requestfailed', status: 0, failureCategory: category, harnessAborted: generationLifecycle.harnessAbortRequested };
        generationLifecycle.active = false;
        generationLifecycle.resolveSettled({ kind: 'requestfailed', status: 0, failureCategory: category });
      }
    });
    target.on('requestfinished', async (request) => {
      if (generationLifecycle?.request !== request) return;
      const response = await request.response();
      const status = response?.status() ?? 0;
      receipt.generationLifecycle = { ...receipt.generationLifecycle, state: 'settled', requestSettledAt: new Date().toISOString(), settlement: 'requestfinished', status };
      generationLifecycle.active = false;
      recordSendCheckpoint('generation-request-finished', { providerHostname: new URL(request.url()).hostname, status });
      generationLifecycle.resolveSettled({ kind: 'requestfinished', status });
    });
    target.on('console', (message) => {
      if (message.type() !== 'error' || !message.text().includes('api.groq.com')) return;
      receipt.errors.push(`browser-console:${browserConsoleCategory(message.text())}`);
    });
    target.on('pageerror', (error) => receipt.errors.push(`pageerror:${error.name}`));
  };
  page = await context.newPage();
  attachRecorder(page);

  receipt.lastSafeStep = 'vault-opened';
  await page.goto(`${baseUrl}/vault#vault-ai-keys`, { waitUntil: 'domcontentloaded' });
  await waitForProviderChoices(page);
  await page.fill('#eon-vault-provider-key', apiKey);
  await page.check('#eon-vault-provider-save');
  receipt.lastSafeStep = 'vault-verification-started';
  await page.click('#eon-vault-provider-verify');
  const verifiedA = await completedProviderStatus(page, /verified|did not return|could not complete/);
  if (!/verified/i.test(verifiedA)) throw new Error('Provider verification did not reach a verified state.');
  receipt.lastSafeStep = 'vault-verified';
  receipt.vault.storagePageA = await safeVaultStorageMetadata(page, apiKey);
  receipt.vault.plaintextKeyFoundInStorage = receipt.vault.storagePageA.plaintextKeyFound;
  receipt.vault.encryptedEnvelopePresent = receipt.vault.storagePageA.envelopePresent;

  receipt.lastSafeStep = 'vault-page-a-closed';
  await page.close();
  page = await context.newPage();
  attachRecorder(page);
  receipt.lastSafeStep = 'vault-page-b-opened';
  await page.goto(`${baseUrl}/vault#vault-ai-keys`, { waitUntil: 'domcontentloaded' });
  await waitForProviderChoices(page);
  receipt.vault.storagePageB = await safeVaultStorageMetadata(page, apiKey);
  receipt.vault.directRetrieve = await page.evaluate(async (id) => {
    const { ApiKeyVault } = await import('/assets/js/utils/api-key-vault.js');
    return ApiKeyVault.diagnoseRetrieve(id, { timeoutMs: 30_000 });
  }, providerId);
  receipt.lastSafeStep = 'vault-restore-started';
  const restoreStatusBefore = await page.locator('#eon-vault-provider-check-status').innerText();
  await page.click('#eon-vault-provider-restore');
  await page.waitForFunction((before) => {
    const status = document.querySelector('#eon-vault-provider-check-status')?.textContent || '';
    return status !== before && !status.includes('Restoring');
  }, restoreStatusBefore, { timeout });
  const restored = await page.locator('#eon-vault-provider-check-status').innerText();
  receipt.vault.restoreUiStatus = restored;
  receipt.vault.restoreUiResult = restored.includes('restored to this browser session') ? 'restored' : restored.includes('could not be restored') ? 'safe-restore-failure' : 'unexpected-final-status';
  if (!restored.includes('restored to this browser session')) throw new Error('Encrypted Vault restore returned an explicit failure state.');
  receipt.vault.survivedReload = true;
  receipt.vault.restoredToSession = true;
  await page.click('#eon-vault-provider-verify');
  const verifiedB = await completedProviderStatus(page, /verified|did not return|could not complete/);
  if (!/verified/i.test(verifiedB)) throw new Error('Restored provider did not reverify successfully.');

  receipt.lastSafeStep = 'chat-opened';
  await page.goto(`${baseUrl}/?new=1`, { waitUntil: 'domcontentloaded' });
  receipt.chatHydration = await page.evaluate(async (id) => {
    const runtime = await import('/assets/js/chat/ai-runtime.js');
    const settings = runtime.loadAISettings();
    const verification = runtime.getProviderVerification(id, settings);
    return {
      mode: String(settings.mode || ''), runtimePreference: String(settings.runtimePreference || ''), provider: String(settings.provider || ''),
      modelPresent: Boolean(String(settings.model || '')), endpointHostname: (() => { try { return new URL(String(settings.endpoint || '')).hostname; } catch { return ''; } })(),
      readiness: verification.state, connected: verification.ready === true,
      sendEnabled: !(document.querySelector('#chat-send')?.disabled)
    };
  }, providerId);
  receipt.lastSafeStep = 'chat-hydrated';
  await waitForStableChatControls(page, { phase: 'chat-controls-ready' });
  receipt.lastSafeStep = 'chat-controls-ready';
  const setupTrigger = page.locator('[data-eonbot-home-open-setup]');
  if (!(await setupTrigger.count())) throw new Error('Canonical EONBOT setup trigger is missing.');
  await setupTrigger.click();
  await page.locator('[data-eonbot-home-setup]').waitFor({ state: 'visible' });
  receipt.lastSafeStep = 'chat-setup-opened';
  // The connected-provider path is explicitly chosen through the visible
  // Advanced controls; each selection rebuilds the controls, so wait and
  // re-query between each user-visible setting change.
  await waitForStableChatControls(page, { phase: 'chat-setup-opened', requiredSelector: '#chat-toggle-mission-ui', requireVisible: true });
  receipt.lastSafeStep = 'chat-controls-visible';
  if (!(await page.locator('[data-mission-advanced]').first().isVisible())) {
    await page.click('#chat-toggle-mission-ui');
    receipt.lastSafeStep = 'chat-advanced-toggle-clicked';
  }
  await waitForStableChatControls(page, { phase: 'chat-advanced-visible', requiredSelector: '#chat-mode-select', requireVisible: true });
  receipt.lastSafeStep = 'chat-advanced-visible';
  await page.selectOption('#chat-mode-select', 'advanced');
  await waitForStableChatControls(page, { phase: 'chat-advanced-mode-selected', requiredSelector: '#chat-runtime-preference', requireVisible: true });
  receipt.lastSafeStep = 'chat-advanced-mode-selected';
  await page.selectOption('#chat-runtime-preference', 'provider-connected');
  let visibleProvider = await waitForStableChatControls(page, { phase: 'chat-provider-runtime-selected', requiredSelector: '#chat-provider-select', requireVisible: true });
  if (await visibleProvider.inputValue() !== providerId) {
    await visibleProvider.selectOption(providerId);
    visibleProvider = await waitForStableChatControls(page, { phase: 'chat-provider-selected', requiredSelector: '#chat-provider-select', requireVisible: true });
  }
  receipt.chatHydration.beforeSend = await page.evaluate(async (id) => {
    const runtime = await import('/assets/js/chat/ai-runtime.js');
    const settings = runtime.loadAISettings();
    const verification = runtime.getProviderVerification(id, settings);
    return { assistantMode: String(settings.assistantMode || ''), runtimePreference: String(settings.runtimePreference || ''), mode: String(settings.mode || ''), provider: String(settings.provider || ''), modelPresent: Boolean(String(settings.model || '')), readiness: verification.state, ready: verification.ready === true, sendEnabled: !(document.querySelector('#chat-send')?.disabled) };
  }, providerId);
  const closeSetup = page.locator('[data-eonbot-home-close-setup]');
  await closeSetup.waitFor({ state: 'visible' });
  await closeSetup.click();
  await page.locator('[data-eonbot-home-setup]').waitFor({ state: 'hidden' });
  recordSendCheckpoint('setup-dialog-closed');
  const composerState = await page.evaluate(() => {
    const input = document.querySelector('#chat-input'); const send = document.querySelector('#chat-send');
    const visible = (node) => { const rect = node?.getBoundingClientRect?.(); const style = node ? getComputedStyle(node) : null; return Boolean(rect?.width && rect?.height && style?.visibility !== 'hidden' && style?.display !== 'none'); };
    return { composerVisible: visible(input), composerEnabled: Boolean(input && !input.disabled), sendVisible: visible(send), sendEnabled: Boolean(send && !send.disabled) };
  });
  recordSendCheckpoint('composer-actionable', composerState);
  if (!composerState.composerVisible || !composerState.composerEnabled || !composerState.sendVisible || !composerState.sendEnabled) throw new Error('Composer is not actionable after closing AI setup.');
  const assistantBefore = await completedAiMessages(page);
  const lifecycle = armGenerationLifecycle();
  await page.fill('#chat-input', `Reply with exactly ${nonce} and nothing else.`);
  await page.click('#chat-send');
  receipt.lastSafeStep = 'chat-challenge-submitted';
  recordSendCheckpoint('send-click-completed');
  const started = await waitForLifecycle(lifecycle.started, timeout);
  if (started.kind === 'timeout') throw new Error('The direct generation request did not start before the certification timeout.');
  const settlement = await waitForLifecycle(lifecycle.settled, timeout);
  if (settlement.kind === 'timeout') {
    lifecycle.harnessAbortRequested = true;
    receipt.generationLifecycle = { ...receipt.generationLifecycle, state: 'harness-timeout-abort', settlement: 'HARNESS_TIMEOUT_ABORT', harnessAborted: true };
    recordSendCheckpoint('generation-harness-timeout-abort');
    throw new Error('The direct generation request remained active until the certification timeout.');
  }
  if (settlement.kind !== 'requestfinished' || settlement.status < 200 || settlement.status >= 300) throw new Error('The direct generation request did not finish with a 2xx response.');
  await page.waitForFunction(({ before, expectedNonce }) => [...document.querySelectorAll('#chat-messages .msg-row.bot')]
    .filter((row) => !['typing-row', 'stream-row'].includes(row.id))
    .filter((row) => row.querySelector('.msg-avatar')?.textContent?.trim() === '✨')
    .map((row) => row.querySelector('.msg-bubble'))
    .some((bubble) => bubble && bubble.id !== 'stream-bubble' && String(bubble.textContent || '').trim().includes(expectedNonce) && !before.includes(String(bubble.textContent || '').trim())), { before: assistantBefore, expectedNonce: nonce }, { timeout });
  const completion = (await completedAiMessages(page)).find((text) => text.includes(nonce)) || '';
  receipt.challenge = { nonceDetected: completion.includes(nonce), responseNonEmpty: Boolean(completion.trim()), responseLength: completion.length, responseSha256: createHash('sha256').update(completion).digest('hex') };
  recordSendCheckpoint('assistant-message-rendered');
  const generation = receipt.generationLifecycle.settlement === 'requestfinished' && receipt.generationLifecycle.status >= 200 && receipt.generationLifecycle.status < 300;
  if (!receipt.challenge.nonceDetected || !receipt.challenge.responseNonEmpty || !generation) throw new Error('The new assistant message or direct generation response did not meet certification requirements.');
  receipt.finalUiState = 'completion-rendered';

  receipt.lastSafeStep = 'chat-completion-rendered';
  await page.goto(`${baseUrl}/vault#vault-ai-keys`, { waitUntil: 'domcontentloaded' });
  await page.selectOption('#eon-vault-provider-select', providerId);
  await page.click('#eon-vault-provider-clear');
  receipt.lastSafeStep = 'vault-clear-complete';
  const removal = await safeProviderRemovalMetadata(page, apiKey);
  receipt.vault.removedFromSession = !removal.sessionKeyPresent && !removal.plaintextKeyFoundInSessionStorage;
  receipt.vault.removedFromEncryptedVault = !removal.encryptedEntryPresent && !removal.plaintextKeyFoundInLocalStorage;
  if (!receipt.vault.removedFromSession || !receipt.vault.removedFromEncryptedVault) throw new Error('Provider cleanup could not be confirmed.');
  receipt.network = receipt.network.filter((entry, index, all) => all.findIndex((other) => JSON.stringify(other) === JSON.stringify(entry)) === index);
  if (!providerHosts.size) receipt.errors.push('No direct provider hostname was observed.');
} catch (error) {
  receipt.finalUiState = 'incomplete';
  receipt.errors.push(`certification:${error instanceof Error ? error.name : 'unknown'}`);
} finally {
  if (generationLifecycle?.active) {
    generationLifecycle.harnessAbortRequested = true;
    receipt.generationLifecycle = { ...receipt.generationLifecycle, state: 'harness-timeout-abort', settlement: 'HARNESS_TIMEOUT_ABORT', harnessAborted: true };
    recordSendCheckpoint('generation-harness-timeout-abort');
  }
  if (page && !receipt.vault.removedFromSession) {
    try {
      await page.goto(`${baseUrl}/vault#vault-ai-keys`, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      await page.selectOption('#eon-vault-provider-select', providerId);
      await page.click('#eon-vault-provider-clear');
      const removal = await safeProviderRemovalMetadata(page, apiKey);
      receipt.vault.removedFromSession = !removal.sessionKeyPresent && !removal.plaintextKeyFoundInSessionStorage;
      receipt.vault.removedFromEncryptedVault = !removal.encryptedEntryPresent && !removal.plaintextKeyFoundInLocalStorage;
      if (!receipt.vault.removedFromSession || !receipt.vault.removedFromEncryptedVault) receipt.errors.push('cleanup:provider-material-still-present');
    } catch { receipt.errors.push('cleanup:could-not-confirm-vault-clear'); }
  }
  await browser?.close();
  save();
}

console.log(JSON.stringify({ providerId, finalUiState: receipt.finalUiState, nonceDetected: receipt.challenge.nonceDetected, providerHostnames: [...new Set(receipt.network.map((entry) => entry.providerHostname))], receiptPath: path.join(outputDir, 'browser-certification.json') }));
process.exitCode = receipt.finalUiState === 'completion-rendered' ? 0 : 1;

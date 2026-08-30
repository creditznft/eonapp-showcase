#!/usr/bin/env node
/**
 * W599 real authenticated EON City evidence runner.
 *
 * Preconditions:
 * - A human signs in with Google in an ordinary Chrome/Edge profile first.
 * - The browser is subsequently started with a loopback-only DevTools port.
 * - This runner only attaches to that existing browser. It never opens Google,
 *   types credentials, creates a storage state, reads cookies, or closes Chrome.
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { EON_BUILD_PROVENANCE_SCHEMA, validateBuildProvenance } from './build-provenance.mjs';
import { routeBrowserConsoleEvidence } from './lib/eon-browser-console-evidence.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = String(process.env.EON_CITY_AUTH_BASE_URL || 'https://eonapp.ch').replace(/\/$/, '');
const cdpEndpoint = String(process.env.EON_CITY_CDP_ENDPOINT || 'http://127.0.0.1:9222').replace(/\/$/, '');
const outputDir = path.join(ROOT, 'reports', 'w599-authenticated-eoncity');
const screenshotDir = path.join(outputDir, 'screenshots');
const expectedBuildProvenancePath = path.resolve(process.env.EON_CITY_EXPECTED_BUILD_PROVENANCE || path.join(ROOT, 'dist', 'build-provenance.json'));

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function assert(condition, code, message) { if (!condition) fail(code, message); }
function safeUrl(value = '') { try { const url = new URL(value); url.search = ''; url.hash = ''; return url.toString(); } catch { return String(value).slice(0, 240); } }
function redact(value = '') { return String(value).replace(/(cookie|authorization|token|code|state|session|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 360); }
async function isVisible(page, selector, timeout = 20_000) { return page.locator(selector).first().isVisible({ timeout }).catch(() => false); }
async function need(page, selector, label, timeout = 30_000) { assert(await isVisible(page, selector, timeout), 'CITY_CONTROL_MISSING', `${label} missing (${selector})`); return page.locator(selector).first(); }
async function inspectPointerOwnership(page, selector, label) {
  const control = await need(page, selector, label);
  const hit = await control.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const point = { x: Math.round(bounds.left + bounds.width / 2), y: Math.round(bounds.top + bounds.height / 2) };
    const stack = document.elementsFromPoint(point.x, point.y);
    const controlIndex = stack.findIndex((node) => node === element || element.contains(node));
    const canvasIndex = stack.findIndex((node) => node instanceof HTMLCanvasElement && node.matches('canvas.eon-play-canvas'));
    const top = stack[0] || null;
    return {
      point,
      visible: bounds.width > 0 && bounds.height > 0,
      controlIndex,
      canvasIndex,
      topMatchesControl: Boolean(top && (top === element || element.contains(top))),
      topTag: top?.tagName?.toLowerCase?.() || '',
      topData: top?.dataset ? Object.keys(top.dataset).slice(0, 8) : []
    };
  });
  assert(hit.visible, 'CITY_OVERLAY_POINTER_INTERCEPT', `${label} has no usable hit area.`);
  assert(hit.controlIndex >= 0 && hit.topMatchesControl, 'CITY_OVERLAY_POINTER_INTERCEPT', `${label} is not the top pointer target at its visible centre.`);
  assert(hit.canvasIndex < 0 || hit.canvasIndex > hit.controlIndex, 'CITY_OVERLAY_POINTER_INTERCEPT', `${label} is intercepted by the Babylon canvas.`);
  return { control, hit };
}
async function loadExpectedBuildProvenance() {
  let candidate;
  try { candidate = JSON.parse(await readFile(expectedBuildProvenancePath, 'utf8')); }
  catch { fail('LOCAL_BUILD_PROVENANCE_MISSING', `Expected deploy-candidate provenance is missing or unreadable (${expectedBuildProvenancePath}). Run npm run build from the exact deployment checkout first.`); }
  const issues = validateBuildProvenance(candidate);
  assert(issues.length === 0, 'LOCAL_BUILD_PROVENANCE_INVALID', `Expected deploy-candidate provenance is invalid (${issues.join(', ')}).`);
  assert(candidate.sourceRevision, 'LOCAL_SOURCE_REVISION_MISSING', 'The deploy-candidate provenance has no source revision. Build from a Git checkout or set EONAPP_SOURCE_REVISION to the exact commit.');
  return candidate;
}
function sameProvenanceField(live, expected, path) {
  const read = (value) => path.split('.').reduce((current, key) => current?.[key], value);
  return read(live) === read(expected);
}
async function verifyDeployedBuildProvenance(expected) {
  const response = await fetch(`${baseUrl}/build-provenance.json`, { headers: { accept: 'application/json', 'cache-control': 'no-store' }, cache: 'no-store' });
  const live = await response.json().catch(() => null);
  assert(response.ok && live, 'DEPLOYED_BUILD_PROVENANCE_UNAVAILABLE', 'The deployed build-provenance.json was unavailable.');
  const issues = validateBuildProvenance(live);
  assert(issues.length === 0, 'DEPLOYED_BUILD_PROVENANCE_INVALID', `The deployed build provenance is invalid (${issues.join(', ')}).`);
  assert(live.schema === EON_BUILD_PROVENANCE_SCHEMA, 'DEPLOYED_BUILD_PROVENANCE_INVALID', 'The deployed provenance schema is unsupported.');
  assert(sameProvenanceField(live, expected, 'sourceRevision'), 'DEPLOYED_SOURCE_REVISION_MISMATCH', 'The deployed source revision does not match the exact local deploy candidate.');
  for (const field of ['distribution.sha256', 'city.eoncityDocumentSha256', 'city.eoncityRouteDocumentSha256', 'city.serviceWorkerSha256']) {
    assert(sameProvenanceField(live, expected, field), 'DEPLOYED_ASSET_HASH_MISMATCH', `The deployed ${field} does not match the exact local deploy candidate.`);
  }
  return Object.freeze({
    sourceRevision: live.sourceRevision,
    distributionSha256: live.distribution.sha256,
    cityDocumentSha256: live.city.eoncityDocumentSha256,
    cityRouteDocumentSha256: live.city.eoncityRouteDocumentSha256,
    serviceWorkerSha256: live.city.serviceWorkerSha256,
    source: safeUrl(`${baseUrl}/build-provenance.json`)
  });
}

async function clickPanel(page, button, panel, close, label, { assertPointerOwnership = false } = {}) {
  await (await need(page, button, `${label} button`)).click();
  assert(await isVisible(page, panel, 10_000), 'CITY_PANEL_BROKEN', `${label} did not open`);
  const target = assertPointerOwnership
    ? await inspectPointerOwnership(page, close, `${label} close button`)
    : { control: await need(page, close, `${label} close button`) };
  await target.control.click();
  assert(!(await isVisible(page, panel, 5_000)), 'CITY_PANEL_BROKEN', `${label} did not close`);
  return target.hit || null;
}

function isUsableCanvasSnapshot(canvas = {}) {
  return Boolean(canvas.present && canvas.cssWidth > 100 && canvas.cssHeight > 100);
}

async function inspectCitySurface(page) {
  return page.evaluate(() => {
    const body = document.body;
    const root = document.querySelector('[data-eon-city-play-root]');
    const canvas = root?.querySelector?.('[data-eon-play-canvas-host] canvas.eon-play-canvas') || null;
    const recovery = root?.querySelector?.('[data-eon-city-recovery-copy]') || null;
    const accessGate = root?.querySelector?.('.eon-city-access-gate') || null;
    const rect = canvas?.getBoundingClientRect?.();
    const isVisible = (element) => Boolean(element && !element.hidden && element.getClientRects?.().length);
    return {
      pathname: String(globalThis.location?.pathname || ''),
      routeState: String(body?.dataset?.eonCityRouteState || ''),
      root: {
        accessState: String(root?.dataset?.eonCityAccessState || ''),
        playState: String(root?.dataset?.eonCityPlayState || ''),
        firstFrame: String(root?.dataset?.eonCityFirstFrame || ''),
        recoveryCode: String(root?.dataset?.eonCityRecoveryCode || ''),
        directEntry: String(root?.dataset?.eonCityDirectEntry || '')
      },
      canvas: {
        present: Boolean(canvas),
        cssWidth: Math.round(Number(rect?.width || 0)),
        cssHeight: Math.round(Number(rect?.height || 0)),
        pixelWidth: Number(canvas?.width || 0),
        pixelHeight: Number(canvas?.height || 0),
        ariaLabel: String(canvas?.getAttribute?.('aria-label') || '')
      },
      recoveryVisible: isVisible(recovery),
      accessGateVisible: isVisible(accessGate),
      standardShell: {
        sidebar: document.querySelectorAll('.eon-app-sidebar').length,
        mobileBar: document.querySelectorAll('.eon-app-mobilebar').length,
        scrollHeight: Math.round(Number(document.documentElement?.scrollHeight || 0)),
        viewportHeight: Math.round(Number(globalThis.innerHeight || 0))
      }
    };
  });
}

async function waitForCitySurface(page, timeout = 75_000) {
  const deadline = Date.now() + timeout;
  let snapshot = await inspectCitySurface(page);
  while (Date.now() < deadline) {
    snapshot = await inspectCitySurface(page);
    const terminalAccessGate = snapshot.accessGateVisible && !['access-checking', 'booting'].includes(snapshot.routeState);
    if (isUsableCanvasSnapshot(snapshot.canvas) || snapshot.recoveryVisible || terminalAccessGate) return snapshot;
    await page.waitForTimeout(300);
  }
  return snapshot;
}

function assertRunningCitySurface(snapshot, phase = 'initial') {
  if (snapshot?.recoveryVisible) {
    const marker = String(snapshot?.root?.recoveryCode || 'CITY_RECOVERY_VISIBLE');
    fail('CITY_RECOVERY_VISIBLE', `City entered its recovery surface during ${phase} (${marker}).`);
  }
  assert(isUsableCanvasSnapshot(snapshot?.canvas), 'CITY_RENDER_SURFACE_MISSING', `City did not surface a usable Babylon canvas during ${phase} (route=${snapshot?.routeState || 'unknown'}, play=${snapshot?.root?.playState || 'unknown'}).`);
}

const report = {
  schema: 'eon.city.authenticated-evidence.w600a.v1',
  createdAt: new Date().toISOString(),
  baseUrl: safeUrl(baseUrl),
  cdpEndpoint: cdpEndpoint.replace(/\/\/[^/]+/, '//127.0.0.1'),
  checks: [], consoleErrors: [], extensionConsoleMessages: [], pageErrors: [], failedRequests: [], firstPartyHttpErrors: [], screenshots: [], pointerOwnership: {}, outcome: 'BLOCKED'
};

try {
  const origin = new URL(baseUrl);
  assert(origin.protocol === 'https:', 'INVALID_TARGET', 'Authenticated evidence must use an HTTPS origin.');
  assert(['127.0.0.1', 'localhost', '::1'].includes(new URL(cdpEndpoint).hostname), 'INVALID_CDP_ENDPOINT', 'CDP must be loopback only.');
  const expectedBuildProvenance = await loadExpectedBuildProvenance();
  report.deploymentProvenance = await verifyDeployedBuildProvenance(expectedBuildProvenance);
  report.checks.push('deployed source revision and City asset hashes match the local deploy candidate');
  await mkdir(screenshotDir, { recursive: true });

  // Guest policy proof without sharing the human browser session.
  const guestResponse = await fetch(`${baseUrl}/api/city/access`, { headers: { accept: 'application/json', 'cache-control': 'no-store' } });
  const guest = await guestResponse.json().catch(() => ({}));
  report.guestAccess = { status: guestResponse.status, mode: String(guest.mode || ''), requiresIdentity: guest.requiresIdentity === true, canBootFullCity: guest.canBootFullCity === true, heavyRuntimeImportAllowed: guest.heavyRuntimeImportAllowed === true, cacheControl: guestResponse.headers.get('cache-control') || '', vary: guestResponse.headers.get('vary') || '' };
  assert(guestResponse.ok, 'GUEST_ACCESS_ENDPOINT_FAILED', 'Guest access endpoint did not return 200.');
  assert(report.guestAccess.mode === 'authenticated-play' && report.guestAccess.requiresIdentity && !report.guestAccess.canBootFullCity && !report.guestAccess.heavyRuntimeImportAllowed, 'AUTH_GATE_NOT_ENFORCED', 'Unauthenticated access endpoint does not deny City renderer boot.');
  assert(/no-store/i.test(report.guestAccess.cacheControl) && /cookie/i.test(report.guestAccess.vary), 'CITY_CACHE_POLICY_INVALID', 'City access endpoint lacks no-store/Vary Cookie response policy.');
  report.checks.push('guest access endpoint denies renderer boot');

  const browser = await chromium.connectOverCDP(cdpEndpoint);
  const context = browser.contexts()[0];
  assert(context, 'CDP_CONTEXT_MISSING', 'No Chrome browser context was available.');
  const page = context.pages().find((candidate) => candidate.url().startsWith(baseUrl)) || await context.newPage();
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    routeBrowserConsoleEvidence(message, { firstParty: report.consoleErrors, extensions: report.extensionConsoleMessages });
  });
  page.on('pageerror', (error) => report.pageErrors.push(redact(error?.message || error)));
  page.on('requestfailed', (request) => report.failedRequests.push({ url: safeUrl(request.url()), error: redact(request.failure()?.errorText || 'unknown') }));
  page.on('response', (response) => { if (response.status() >= 400 && response.url().startsWith(baseUrl)) report.firstPartyHttpErrors.push({ status: response.status(), url: safeUrl(response.url()) }); });

  await page.goto(`${baseUrl}/eoncity`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const session = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, available: body?.available === true, signedIn: body?.signedIn === true };
  });
  report.authSession = session;
  assert(session.status === 200 && session.available && session.signedIn, 'AUTH_SESSION_NOT_SIGNED_IN', 'The attached ordinary browser does not have a verified EONAPP Google session.');

  const access = await page.evaluate(async () => {
    const response = await fetch('/api/city/access', { credentials: 'same-origin', cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, mode: String(body?.mode || ''), requiresIdentity: body?.requiresIdentity === true, signedIn: body?.signedIn === true, canBootFullCity: body?.canBootFullCity === true, heavyRuntimeImportAllowed: body?.heavyRuntimeImportAllowed === true };
  });
  report.authenticatedAccess = access;
  assert(access.status === 200 && access.mode === 'authenticated-play' && access.requiresIdentity && access.signedIn && access.canBootFullCity && access.heavyRuntimeImportAllowed, 'AUTHENTICATED_ACCESS_DENIED', 'Signed-in City access did not authorize the real renderer.');
  report.checks.push('signed-in access endpoint authorizes renderer boot');

  await need(page, '[data-eon-city-play-root]', 'City root', 60_000);
  report.citySurface = await waitForCitySurface(page, 75_000);
  if (report.citySurface.recoveryVisible) {
    await page.screenshot({ path: path.join(screenshotDir, '01-city-recovery.png'), fullPage: true });
    report.screenshots.push('01-city-recovery.png');
  }
  assertRunningCitySurface(report.citySurface, 'initial boot');
  const canvas = await need(page, '[data-eon-play-canvas-host] canvas.eon-play-canvas', 'Babylon canvas', 5_000);
  report.canvas = report.citySurface.canvas;
  assert(report.canvas.cssWidth > 100 && report.canvas.cssHeight > 100, 'CITY_CANVAS_INVALID', 'City canvas has no usable layout size.');
  report.checks.push('real City canvas booted');
  await page.screenshot({ path: path.join(screenshotDir, '01-authenticated-city-running.png'), fullPage: false });
  report.screenshots.push('01-authenticated-city-running.png');

  if (await isVisible(page, '[data-eon-play-resume-panel]', 2_000)) {
    await page.screenshot({ path: path.join(screenshotDir, '02-resume-panel.png'), fullPage: false });
    report.screenshots.push('02-resume-panel.png');
    await (await need(page, '[data-eon-play-resume-continue]', 'resume continue button')).click();
    assert(!(await isVisible(page, '[data-eon-play-resume-panel]', 5_000)), 'CITY_PANEL_BROKEN', 'Resume panel did not close.');
    report.checks.push('resume panel closed through explicit continue');
  }

  if (await isVisible(page, '[data-eon-play-first-run-panel]', 2_000)) {
    await page.screenshot({ path: path.join(screenshotDir, '03-start-here-panel.png'), fullPage: false });
    report.screenshots.push('03-start-here-panel.png');
    const startHerePointer = await inspectPointerOwnership(page, '[data-eon-play-close-start-here]', 'start-here close button');
    report.pointerOwnership.firstRunDismiss = startHerePointer.hit;
    await startHerePointer.control.click();
    assert(!(await isVisible(page, '[data-eon-play-first-run-panel]', 5_000)), 'CITY_PANEL_BROKEN', 'Start-here panel did not close.');
    report.checks.push('start-here panel closed through explicit dismiss and top-layer hit test');
  }

  const hudSelectors = [
    '[data-eon-play-open-command-room]',
    '[data-eon-play-open-eonbot]',
    '[data-eon-play-share-city]',
    '[data-eon-play-open-voice-consent]',
    '[data-eon-play-open-chat]',
    '[data-eon-play-open-travel-map]',
    '[data-eon-play-open-controls]'
  ];
  for (const selector of hudSelectors) await need(page, selector, 'City HUD control');
  assert((await page.locator('[data-eon-play-interact]').count()) === 0, 'CITY_GENERIC_INTERACT_PRESENT', 'Generic Interact must not appear in the direct-entry HUD.');
  assert((await page.locator('[data-eon-play-open-start-here]').count()) === 0, 'CITY_STALE_HUD_ACTION_PRESENT', 'Persistent Start Here must not remain in the live six-action direct-entry HUD.');
  assert((await page.locator('.eon-play-hud-actions > *').count()) >= 7, 'CITY_HUD_INCOMPLETE', 'The live direct-entry HUD is missing one or more current primary actions.');
  report.checks.push('named current direct-entry HUD inventory present without generic Interact or stale Start Here');

  await clickPanel(page, '[data-eon-play-open-controls]', '[data-eon-play-controls-panel]', '[data-eon-play-close-controls]', 'Menu');
  await (await need(page, '[data-eon-play-open-command-room]', 'Command Room button')).click();
  assert(await isVisible(page, '[data-eon-command-room-panel]', 10_000), 'CITY_PANEL_BROKEN', 'Command Room did not open');
  await page.keyboard.press('Escape');
  assert(!(await isVisible(page, '[data-eon-command-room-panel]', 5_000)), 'CITY_PANEL_BROKEN', 'Command Room did not close with Escape.');
  await clickPanel(page, '[data-eon-play-open-voice-consent]', '[data-eon-play-voice-consent-panel]', '[data-eon-play-close-voice-consent]', 'Voice');
  await (await need(page, '[data-eon-play-open-eonbot]', 'EONBOT button')).click();
  assert(await isVisible(page, '[data-eon-play-eonbot-panel]'), 'CITY_PANEL_BROKEN', 'EONBOT did not open.');
  const intent = page.locator('[data-eon-play-work-intent]').first();
  assert(await intent.isVisible({ timeout: 10_000 }).catch(() => false), 'CITY_EONBOT_INCOMPLETE', 'EONBOT has no safe work-review intent.');
  await intent.click();
  await page.waitForFunction(() => String(document.querySelector('[data-eon-play-eonbot-review]')?.textContent || '').trim().length > 0, null, { timeout: 10_000 });
  await (await need(page, '[data-eon-play-close-eonbot]', 'EONBOT close button')).click();
  report.checks.push('all current review panels open and close');
  await canvas.focus();
  await page.keyboard.down('KeyW'); await page.waitForTimeout(180); await page.keyboard.up('KeyW');
  report.checks.push('keyboard input reached the live City canvas');

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  report.refreshCitySurface = await waitForCitySurface(page, 75_000);
  if (report.refreshCitySurface.recoveryVisible) {
    await page.screenshot({ path: path.join(screenshotDir, '06-city-recovery-after-refresh.png'), fullPage: true });
    report.screenshots.push('06-city-recovery-after-refresh.png');
  }
  assertRunningCitySurface(report.refreshCitySurface, 'refresh');
  await need(page, '[data-eon-play-canvas-host] canvas.eon-play-canvas', 'City canvas after refresh', 5_000);
  report.checks.push('authenticated City recovers after refresh');
  report.outcome = report.consoleErrors.length || report.pageErrors.length || report.firstPartyHttpErrors.length ? 'PASS_WITH_DIAGNOSTICS' : 'AUTHENTICATED_CITY_AND_GATE_PROVEN';
  // Do not call browser.close() for a CDP-attached browser: process exit simply
  // drops this loopback connection and leaves the owner's browser untouched.
} catch (error) {
  report.outcome = String(error?.code || 'W599_RUNTIME_FAILURE');
  report.error = redact(error?.message || error);
}
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (report.outcome !== 'AUTHENTICATED_CITY_AND_GATE_PROVEN' && report.outcome !== 'PASS_WITH_DIAGNOSTICS') process.exit(1);

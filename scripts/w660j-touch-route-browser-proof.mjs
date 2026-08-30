#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'reports', 'w660j-touch-route-browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4178').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const headed = process.env.W660J_HEADED === '1';
const shortTapStarvationMs = Math.max(0, Number(process.env.W661E_SHORT_TAP_STARVATION_MS || 0));
const SAFE_DIRECTION_TEST_POSE = Object.freeze({ x: 0, z: 5.35, districtId: 'orientation-hall' });
const RESET_TOLERANCE = 0.04;
const RELEASE_TOLERANCE = 0.04;
const HELD_MOVEMENT_MIN_MS = 320;
const HELD_MOVEMENT_TIMEOUT_MS = 3_200;
const MOVEMENT_SAMPLE_MS = 50;
const HELD_MOVEMENT_MIN_DISTANCE = 0.06;
const RELEASE_SAMPLE_MS = 80;
// Under intentional render starvation the verifier still requires three
// released samples; give it enough wall time to observe them rather than
// mistaking a sparse but fully released renderer for a movement latch.
const RELEASE_TIMEOUT_MS = 2_000;
const RELEASE_STABLE_SAMPLE_COUNT = 3;

const accessPayload = {
  schema: 'eon.city.access.w649b.v1',
  mode: 'authenticated-play',
  accessState: 'authorized',
  requiresIdentity: true,
  identityAvailable: true,
  signedIn: true,
  canBootFullCity: true,
  heavyRuntimeImportAllowed: true,
  staticPortalOnly: false,
  publicPreviewAvailable: false,
  browserGateOnly: true,
  clientFirstStaticAssetDelivery: true,
  pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: false,
  loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Local W661E touch, keyboard and Living Nexus proof.',
  dataCustody: 'Local fixture only; no production account or private content is present.'
};

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.w661e.city-movement-nexus-browser-proof.v4',
  generatedAt: new Date().toISOString(),
  baseURL,
  headed,
  shortTapStarvationMs,
  safeDirectionTestPose: SAFE_DIRECTION_TEST_POSE,
  movementPolicy: {
    frameAwareHeldProof: true,
    minimumHeldMs: HELD_MOVEMENT_MIN_MS,
    timeoutMs: HELD_MOVEMENT_TIMEOUT_MS,
    sampleMs: MOVEMENT_SAMPLE_MS,
    minimumDistance: HELD_MOVEMENT_MIN_DISTANCE,
    releaseTolerance: RELEASE_TOLERANCE,
    releaseStableSamples: RELEASE_STABLE_SAMPLE_COUNT
  },
  status: 'BLOCKED',
  directions: [],
  resetChecks: [],
  releaseChecks: [],
  consoleMessages: [],
  pageErrors: [],
  requestFailures: [],
  attempts: [],
  screenshots: [],
  claims: {
    realBrowser: false,
    realWebGL: false,
    safeResetVerified: false,
    heldReleaseVerified: false,
    frameAwareMovementVerified: false,
    routeStayedEoncity: false,
    allFourDirectionsMoved: false,
    realShortTapMoved: false,
    physicalWKeyMoved: false,
    productiveMenuLivingNexusVisible: false,
    connectedCoreVisible: false,
    sixRealmCatalogVisible: false,
    oneCanonicalLivingNexusPanel: false,
    production: false,
    physicalDevice: false
  }
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 1200);
const distance = (before, after) => before && after ? Math.hypot(after.x - before.x, after.z - before.z) : Number.POSITIVE_INFINITY;
const inputIsReleased = (input) => Array.isArray(input?.activeDirections)
  && Array.isArray(input?.pulseDirections)
  && input.activeDirections.length === 0
  && input.pulseDirections.length === 0;
let browser;
try {
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: !headed,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-features=UseSkiaRenderer',
      '--no-proxy-server',
      '--proxy-bypass-list=*'
    ]
  });
  report.claims.realBrowser = true;
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block'
  });
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 16 }); } catch {}
    try { Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 16 }); } catch {}
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) });
  });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: safe(request.url().replace(baseURL, '')), error: safe(request.failure()?.errorText || 'unknown') }));
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(accessPayload) }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, checkoutActive: true, account: { signedIn: true, billing: { tierId: 'free', status: 'free' }, entitlement: { tier_id: 'free', status: 'free' } } }) }));
  await page.route('**/api/referrals**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, active: true, signedIn: true, account: { signedIn: true }, balances: { available: 0, reserved: 0, redeemed: 0 } }) }));
  await page.route('**/release/candidate-provenance.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ wave: 'W661E-local', commitSha: 'local-unpublished', candidateDigest: 'local-unpublished', distPayloadDigest: 'local-unpublished' }) }));

  await page.goto('/eoncity?w661eCityProof=1', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 90_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    return Boolean(root?.__eonCityReducedRuntime?.getRuntimeSummary?.()?.firstFrame)
      && typeof root?.__eonCityReadInputState === 'function'
      && typeof root?.__eonCityClearInputState === 'function'
      && document.querySelectorAll('[data-eon-city-move]').length === 4;
  }, null, { timeout: 120_000 });

  const webgl = await page.locator('canvas.eon-play-canvas').evaluate((canvas) => Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')));
  report.claims.realWebGL = webgl;
  if (!webgl) throw new Error('A real WebGL context was not available.');

  const layout = await page.evaluate(() => {
    const controls = document.querySelector('[data-eon-city-touch-controls]');
    const style = controls ? getComputedStyle(controls) : null;
    const buttons = [...document.querySelectorAll('[data-eon-city-move]')].map((button) => {
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        direction: button.dataset.eonCityMove,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        hitIsButton: hit === button || button.contains(hit),
        hitTag: hit?.tagName || '',
        hitClass: hit?.className || '',
        hitId: hit?.id || '',
        hitHref: hit?.closest?.('a[href]')?.getAttribute('href') || '',
        stack: document.elementsFromPoint(x, y).slice(0, 8).map((element) => ({
          tag: element.tagName,
          id: element.id || '',
          className: element.className || '',
          position: getComputedStyle(element).position,
          zIndex: getComputedStyle(element).zIndex,
          pointerEvents: getComputedStyle(element).pointerEvents
        }))
      };
    });
    const sidebar = document.querySelector('.eon-app-sidebar');
    const sidebarRect = sidebar?.getBoundingClientRect?.();
    return {
      position: style?.position || '',
      zIndex: Number(style?.zIndex || 0),
      pointerEvents: style?.pointerEvents || '',
      sidebar: sidebar ? {
        className: sidebar.className,
        hoverExpand: sidebar.dataset.eonCityHoverExpand || '',
        rect: sidebarRect ? { left: sidebarRect.left, top: sidebarRect.top, width: sidebarRect.width, height: sidebarRect.height } : null,
        pointerEvents: getComputedStyle(sidebar).pointerEvents,
        zIndex: getComputedStyle(sidebar).zIndex
      } : null,
      buttons
    };
  });
  report.layout = layout;
  if (layout.position !== 'absolute' || layout.zIndex < 10 || layout.pointerEvents === 'none') throw new Error(`Touch HUD layout is not isolated: ${JSON.stringify(layout)}`);
  if (layout.buttons.some((entry) => !entry.hitIsButton || entry.hitHref === '/')) throw new Error(`Touch button hit-test is intercepted: ${JSON.stringify(layout.buttons)}`);

  const getDiagnostics = () => page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const runtime = root?.__eonCityReducedRuntime;
    const direct = runtime?.getPlayerPosition?.();
    const summary = runtime?.getRuntimeSummary?.() || null;
    const player = direct || summary?.player || null;
    return {
      at: Number(globalThis.performance?.now?.() || Date.now()),
      player: player ? { x: Number(player.x), z: Number(player.z) } : null,
      input: root?.__eonCityReadInputState?.() || null,
      runtime: summary ? {
        firstFrame: summary.firstFrame === true,
        mode: String(summary.mode || ''),
        progressiveStatus: String(summary.progressiveStatus || ''),
        productiveCityStarted: summary.productiveCity?.started === true,
        productiveCollision: summary.productiveCity?.collision || null,
        currentDistrictId: summary.productiveCity?.currentDistrictId || summary.district?.activeDistrictId || null
      } : null
    };
  });
  const getPlayer = async () => (await getDiagnostics()).player;

  const resetToSafePose = async (label) => {
    const restoreResult = await page.evaluate((pose) => {
      const root = document.querySelector('[data-eon-city-play-root]');
      const runtime = root?.__eonCityReducedRuntime;
      if (!runtime) return { ok: false, reason: 'runtime-unavailable' };
      root.__eonCityClearInputState?.();
      for (const direction of ['forward', 'backward', 'left', 'right']) runtime.setMove?.(direction, false);
      runtime.setAnalogMove?.({ x: 0, z: 0 });
      const restored = runtime.restoreExplorationPose?.(pose);
      return { ok: restored !== false, restored, input: root.__eonCityReadInputState?.() || null };
    }, SAFE_DIRECTION_TEST_POSE);
    const samples = [];
    let stableSamples = 0;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await page.waitForTimeout(50);
      const diagnostic = await getDiagnostics();
      const error = distance(SAFE_DIRECTION_TEST_POSE, diagnostic.player);
      samples.push({ attempt, ...diagnostic, error });
      stableSamples = error <= RESET_TOLERANCE && inputIsReleased(diagnostic.input) ? stableSamples + 1 : 0;
      if (stableSamples >= 3) break;
    }
    const final = samples.at(-1)?.player || null;
    const passed = restoreResult?.ok === true
      && stableSamples >= 3
      && distance(SAFE_DIRECTION_TEST_POSE, final) <= RESET_TOLERANCE
      && inputIsReleased(samples.at(-1)?.input);
    const check = { label, requested: SAFE_DIRECTION_TEST_POSE, restoreResult, stableSamples, final, samples, passed };
    report.resetChecks.push(check);
    if (!passed) throw new Error(`Safe reset failed before ${label}: ${JSON.stringify(check)}`);
    return final;
  };

  const verifyMovementReleased = async (label, positionAfterRelease) => {
    const samples = [];
    let stableSamples = 0;
    const startedAt = Date.now();
    while (Date.now() - startedAt <= RELEASE_TIMEOUT_MS) {
      await page.waitForTimeout(RELEASE_SAMPLE_MS);
      const diagnostic = await getDiagnostics();
      const drift = distance(positionAfterRelease, diagnostic.player);
      const released = inputIsReleased(diagnostic.input);
      samples.push({ ...diagnostic, drift, released });
      stableSamples = drift <= RELEASE_TOLERANCE && released ? stableSamples + 1 : 0;
      if (stableSamples >= RELEASE_STABLE_SAMPLE_COUNT) break;
    }
    const final = samples.at(-1) || null;
    const passed = stableSamples >= RELEASE_STABLE_SAMPLE_COUNT
      && Number(final?.drift) <= RELEASE_TOLERANCE
      && final?.released === true;
    const check = {
      label,
      positionAfterRelease,
      settled: final?.player || null,
      drift: Number(final?.drift),
      tolerance: RELEASE_TOLERANCE,
      stableSamples,
      input: final?.input || null,
      samples,
      passed
    };
    report.releaseChecks.push(check);
    if (!passed) throw new Error(`Movement release remained active after ${label}: ${JSON.stringify(check)}`);
    return check;
  };

  const verifyPulseReleased = async (label, activationPosition, ledger = null, intendedDirection = 'forward') => {
    const samples = [];
    const startedAt = Date.now();
    let releaseBaseline = null;
    let stableReleasedSamples = 0;
    let inputEngaged = false;
    let pulseDirectionObserved = false;
    while (Date.now() - startedAt <= 1_800) {
      await page.waitForTimeout(RELEASE_SAMPLE_MS);
      const diagnostic = await getDiagnostics();
      const active = diagnostic.input?.activeDirections || [];
      const pulse = diagnostic.input?.pulseDirections || [];
      inputEngaged ||= active.length > 0 || pulse.length > 0;
      pulseDirectionObserved ||= pulse.length > 0;
      if (!releaseBaseline && active.length === 0 && pulse.length === 0) releaseBaseline = diagnostic.player;
      const drift = releaseBaseline ? distance(releaseBaseline, diagnostic.player) : null;
      const released = Boolean(releaseBaseline) && active.length === 0 && pulse.length === 0;
      samples.push({ ...diagnostic, drift, released });
      stableReleasedSamples = released && drift <= RELEASE_TOLERANCE ? stableReleasedSamples + 1 : 0;
      if (stableReleasedSamples >= RELEASE_STABLE_SAMPLE_COUNT) break;
    }
    const final = samples.at(-1) || null;
    const events = ledger?.events || [];
    const frames = ledger?.frames || [];
    const has = (input, key) => Array.isArray(input?.[key]) && input[key].includes(intendedDirection);
    const eventTurnActiveObserved = events.some((entry) => ['microtask', 'promise', 'event-raf'].includes(entry.kind) && has(entry.input, 'activeDirections'));
    const eventTurnPulseObserved = events.some((entry) => ['microtask', 'promise', 'event-raf'].includes(entry.kind) && has(entry.input, 'pulseDirections'));
    const frameActiveObserved = frames.some((entry) => has(entry.input, 'activeDirections'));
    const framePulseObserved = frames.some((entry) => has(entry.input, 'pulseDirections'));
    const delayedSamplerActiveObserved = samples.some((entry) => has(entry.input, 'activeDirections'));
    const delayedSamplerPulseObserved = samples.some((entry) => has(entry.input, 'pulseDirections'));
    const activationSources = [eventTurnActiveObserved || eventTurnPulseObserved ? 'event-turn-ledger' : null, frameActiveObserved || framePulseObserved ? 'frame-ledger' : null, delayedSamplerActiveObserved || delayedSamplerPulseObserved ? 'delayed-sampler' : null].filter(Boolean);
    const activationProven = activationSources.length > 0;
    const check = { label, intendedDirection, activationPosition, movementObserved: distance(activationPosition, samples.at(0)?.player) > 0, inputEngaged, pulseDirectionObserved, activationProven, activationSources, eventTurnActiveObserved, eventTurnPulseObserved, setMoveEnabledObserved: false, frameActiveObserved, framePulseObserved, delayedSamplerActiveObserved, delayedSamplerPulseObserved, delayedSamplerMissedTransient: !(delayedSamplerActiveObserved || delayedSamplerPulseObserved) && activationProven, releaseBaseline, settledPosition: final?.player || null, postReleaseDrift: final?.drift, stableReleasedSamples, reactivationObserved: releaseBaseline ? samples.some((entry) => entry.released && ((entry.input?.activeDirections || []).length || (entry.input?.pulseDirections || []).length)) : false, samples };
    check.passed = Boolean(check.releaseBaseline) && check.activationProven && stableReleasedSamples >= RELEASE_STABLE_SAMPLE_COUNT && check.postReleaseDrift <= RELEASE_TOLERANCE && !check.reactivationObserved;
    report.releaseChecks.push(check);
    if (!check.passed) throw new Error(`Pulse release failed after ${label}: ${JSON.stringify(check)}`);
    return check;
  };

  const waitForObservedMovement = async (label, before, { minimumMs = 0, timeoutMs = HELD_MOVEMENT_TIMEOUT_MS, minimumDistance = HELD_MOVEMENT_MIN_DISTANCE } = {}) => {
    const samples = [];
    const startedAt = Number((await getDiagnostics()).at || 0);
    let inputEngaged = false;
    let observed = false;
    let final = null;
    while (true) {
      await page.waitForTimeout(MOVEMENT_SAMPLE_MS);
      const diagnostic = await getDiagnostics();
      const elapsedMs = Math.max(0, Number(diagnostic.at || 0) - startedAt);
      const moved = distance(before, diagnostic.player);
      inputEngaged = inputEngaged || (diagnostic.input?.activeDirections || []).length > 0 || (diagnostic.input?.pulseDirections || []).length > 0;
      final = { ...diagnostic, elapsedMs, distance: moved };
      samples.push(final);
      if (elapsedMs >= minimumMs && moved >= minimumDistance) {
        observed = true;
        break;
      }
      if (elapsedMs >= timeoutMs) break;
    }
    return { label, observed, inputEngaged, samples, final, elapsedMs: final?.elapsedMs || 0, distance: final?.distance ?? Number.POSITIVE_INFINITY };
  };

  const acquireAndHoldPhysicalDirection = async (direction) => {
    const button = page.locator(`[data-eon-city-move="${direction}"]`);
    if (await button.count() !== 1) throw new Error(`Expected one ${direction} control.`);
    await button.hover();
    const acquisition = await button.evaluate(async (node) => {
      const root = node.closest('[data-eon-city-play-root]');
      const rect = () => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
      const identity = (el) => el ? { tag: el.tagName, direction: el.dataset?.eonCityMove || '', className: el.className || '' } : null;
      const samples = [];
      for (let index = 0; index < 3; index += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const box = rect(); const x = box.left + box.width / 2; const y = box.top + box.height / 2;
        samples.push({ box, hit: identity(document.elementFromPoint(x, y)), connected: node.isConnected, pointerEvents: getComputedStyle(node).pointerEvents });
      }
      const stable = samples.every((entry) => entry.connected && entry.pointerEvents !== 'none' && entry.hit?.direction === node.dataset.eonCityMove)
        && samples.every((entry, index) => !index || ['left','top','width','height'].every((key) => Math.abs(entry.box[key] - samples[0].box[key]) <= .5));
      window.__eonR3Trace?.cleanup?.();
      const events = []; const scopes = [[window,'window'],[document,'document'],[root,'root'],[node,'button']];
      const describe = identity; const listener = (scope) => (event) => events.push({ scope, type: event.type, phase: event.eventPhase, target: describe(event.target), currentTarget: describe(event.currentTarget), pointerId: event.pointerId, pointerType: event.pointerType, button: event.button, buttons: event.buttons, isTrusted: event.isTrusted, timeStamp: event.timeStamp, input: root?.__eonCityReadInputState?.() || null });
      const names = ['pointerdown','gotpointercapture','pointerleave','lostpointercapture','pointerup','pointercancel','mousedown','mouseup','click'];
      const listeners = scopes.flatMap(([target, scope]) => names.map((name) => ({ target, name, fn: listener(scope) })));
      listeners.forEach(({target,name,fn}) => target?.addEventListener?.(name, fn, true));
      window.__eonR3Trace = { events, cleanup: () => listeners.forEach(({target,name,fn}) => target?.removeEventListener?.(name, fn, true)) };
      return { stable, samples, rect: rect(), events };
    });
    if (!acquisition.stable) throw new Error(`Unstable ${direction} physical target: ${JSON.stringify(acquisition)}`);
    const box = await button.boundingBox();
    if (!box) throw new Error(`No stable box for ${direction}.`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const immediate = await getDiagnostics();
    return { acquisition, immediate };
  };

  const installShortTapLedger = async () => page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const runtime = root?.__eonCityReducedRuntime;
    const input = () => root?.__eonCityReadInputState?.() || null;
    const player = () => runtime?.getPlayerPosition?.() || runtime?.getRuntimeSummary?.()?.player || null;
    const ledger = { events: [], transitions: [], frames: [], startedAt: performance.now(), originalSetMove: runtime?.setMove };
    const record = (kind, extra = {}) => ledger.events.push({ kind, at: performance.now(), input: input(), player: player(), ...extra });
    if (runtime?.setMove) runtime.setMove = function (...args) { record('setMove-before', { args }); const value = ledger.originalSetMove.apply(this, args); record('setMove-after', { args }); return value; };
    const listener = (event) => { record('event', { type: event.type, trusted: event.isTrusted, target: event.target?.dataset?.eonCityMove || event.target?.tagName || '', timeStamp: event.timeStamp }); queueMicrotask(() => record('microtask', { origin: event.type })); Promise.resolve().then(() => record('promise', { origin: event.type })); requestAnimationFrame(() => record('event-raf', { origin: event.type })); };
    for (const target of [window, document]) for (const name of ['pointerdown','pointerup','pointercancel','lostpointercapture','click']) target.addEventListener(name, listener, true);
    let frames = 0; const beat = () => { frames += 1; ledger.frames.push({ frame: frames, at: performance.now(), input: input(), player: player() }); if (frames < 120) requestAnimationFrame(beat); }; requestAnimationFrame(beat);
    window.__eonR3BShortTapLedger = { ledger, cleanup: () => { if (runtime?.setMove === undefined || !ledger.originalSetMove) return; runtime.setMove = ledger.originalSetMove; for (const target of [window, document]) for (const name of ['pointerdown','pointerup','pointercancel','lostpointercapture','click']) target.removeEventListener(name, listener, true); } };
  });

  const directions = ['forward', 'backward', 'left', 'right'];
  for (const direction of directions) {
    const before = await resetToSafePose(`held-${direction}`);
    const urlBefore = new URL(page.url()).pathname;
    const physical = await acquireAndHoldPhysicalDirection(direction);
    let held;
    try {
      held = await waitForObservedMovement(`held-${direction}`, before, { minimumMs: HELD_MOVEMENT_MIN_MS });
    } finally {
      await page.mouse.up();
    }
    await page.waitForTimeout(120);
    const afterDiagnostic = await getDiagnostics();
    const after = afterDiagnostic.player;
    const release = await verifyMovementReleased(`held-${direction}`, after);
    const urlAfter = new URL(page.url()).pathname;
    const moved = distance(before, after);
    const result = {
      direction,
      urlBefore,
      urlAfter,
      before,
      after,
      distance: moved,
      held,
      physical,
      afterDiagnostic,
      release,
      passed: urlBefore === '/eoncity'
        && urlAfter === '/eoncity'
        && held.observed
        && held.inputEngaged
        && moved >= HELD_MOVEMENT_MIN_DISTANCE
        && release.passed
    };
    report.directions.push(result);
    if (!result.passed) throw new Error(`Directional route/movement failure: ${JSON.stringify(result)}`);
  }
  report.claims.safeResetVerified = report.resetChecks.length >= 4 && report.resetChecks.every((entry) => entry.passed);
  report.claims.heldReleaseVerified = report.releaseChecks.length >= 4 && report.releaseChecks.every((entry) => entry.passed);
  report.claims.frameAwareMovementVerified = report.directions.every((entry) => entry.held?.observed && entry.held?.inputEngaged);

  const shortTapBefore = await resetToSafePose('real-short-tap');
  const shortTapButton = page.locator('[data-eon-city-move="forward"]');
  const shortTapBox = await shortTapButton.boundingBox();
  if (!shortTapBox) throw new Error('No visible box for the W661E short-tap proof.');
  await installShortTapLedger();
  await page.mouse.move(shortTapBox.x + shortTapBox.width / 2, shortTapBox.y + shortTapBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(25);
  await page.mouse.up();
  if (shortTapStarvationMs > 0) {
    // Proof-only controlled main-thread starvation: queue it after the real
    // pointer completion and before the browser can service the next frame.
    // It deliberately does not alter application code or input state.
    await page.evaluate((durationMs) => new Promise((resolve) => {
      queueMicrotask(() => {
        const startedAt = performance.now();
        while (performance.now() - startedAt < durationMs) {}
        resolve({ startedAt, endedAt: performance.now() });
      });
    }), shortTapStarvationMs);
  }
  await page.waitForTimeout(500);
  const shortTapLedger = await page.evaluate(() => window.__eonR3BShortTapLedger?.ledger || null);
  await page.evaluate(() => window.__eonR3BShortTapLedger?.cleanup?.());
  const shortTapObservation = await waitForObservedMovement('real-short-tap', shortTapBefore, { timeoutMs: 1_400, minimumDistance: 0.01 });
  const shortTapAfter = shortTapObservation.final?.player || await getPlayer();
  const shortTapAttempt = {
    lane: 'real-short-tap',
    collectionComplete: true,
    activationPosition: shortTapBefore,
    observationPosition: shortTapAfter,
    movementDistance: distance(shortTapBefore, shortTapAfter),
    observation: shortTapObservation,
    ledger: shortTapLedger,
    route: new URL(page.url()).pathname,
    collectionError: null,
    missingEvidenceFields: shortTapLedger ? [] : ['ledger']
  };
  report.attempts.push(shortTapAttempt);
  const shortTapRelease = await verifyPulseReleased('real-short-tap', shortTapBefore, shortTapLedger);
  shortTapAttempt.release = shortTapRelease;
  shortTapAttempt.passed = shortTapRelease.passed && shortTapAttempt.movementDistance > 0.01;
  report.realShortTap = {
    pathname: new URL(page.url()).pathname,
    before: shortTapBefore,
    after: shortTapAfter,
    distance: distance(shortTapBefore, shortTapAfter),
    observation: shortTapObservation,
    ledger: shortTapLedger,
    release: shortTapRelease
  };
  report.claims.realShortTapMoved = report.realShortTap.pathname === '/eoncity' && report.realShortTap.distance > 0.01 && shortTapRelease.passed;
  if (!report.claims.realShortTapMoved) throw new Error(`Real short pointer tap failed: ${JSON.stringify(report.realShortTap)}`);

  const clickBefore = await resetToSafePose('accessible-click');
  await installShortTapLedger();
  await page.getByRole('button', { name: 'Move forward' }).evaluate((button) => button.click());
  await page.waitForTimeout(500);
  const clickLedger = await page.evaluate(() => window.__eonR3BShortTapLedger?.ledger || null);
  await page.evaluate(() => window.__eonR3BShortTapLedger?.cleanup?.());
  const clickObservation = await waitForObservedMovement('accessible-click', clickBefore, { timeoutMs: 1_400, minimumDistance: 0.01 });
  const clickAfter = clickObservation.final?.player || await getPlayer();
  const clickRelease = await verifyPulseReleased('accessible-click', clickBefore, clickLedger);
  report.accessibleClick = {
    pathname: new URL(page.url()).pathname,
    before: clickBefore,
    after: clickAfter,
    distance: distance(clickBefore, clickAfter),
    observation: clickObservation,
    ledger: clickLedger,
    release: clickRelease
  };
  if (report.accessibleClick.pathname !== '/eoncity' || report.accessibleClick.distance <= 0.01 || !clickRelease.passed) throw new Error(`Accessible click failed: ${JSON.stringify(report.accessibleClick)}`);

  const keyboardBefore = await resetToSafePose('keyboard-button-activation');
  const keyboardButton = page.getByRole('button', { name: 'Move forward' });
  await installShortTapLedger();
  await keyboardButton.focus();
  await page.keyboard.down('Enter');
  let keyboardObservation;
  try {
    keyboardObservation = await waitForObservedMovement('keyboard-button-activation', keyboardBefore, { minimumMs: HELD_MOVEMENT_MIN_MS });
  } finally {
    await page.keyboard.up('Enter');
  }
  await page.waitForTimeout(500);
  const keyboardLedger = await page.evaluate(() => window.__eonR3BShortTapLedger?.ledger || null);
  await page.evaluate(() => window.__eonR3BShortTapLedger?.cleanup?.());
  await page.waitForTimeout(120);
  const keyboardAfter = await getPlayer();
  const keyboardRelease = await verifyPulseReleased('keyboard-button-activation', keyboardBefore, keyboardLedger);
  report.keyboardActivation = {
    pathname: new URL(page.url()).pathname,
    before: keyboardBefore,
    after: keyboardAfter,
    distance: distance(keyboardBefore, keyboardAfter),
    observation: keyboardObservation,
    ledger: keyboardLedger,
    release: keyboardRelease
  };
  if (report.keyboardActivation.pathname !== '/eoncity' || report.keyboardActivation.distance <= 0.01 || !keyboardRelease.passed) throw new Error(`Keyboard activation failed: ${JSON.stringify(report.keyboardActivation)}`);

  const physicalWBefore = await resetToSafePose('physical-w');
  await page.locator('canvas.eon-play-canvas').focus();
  await page.keyboard.down('w');
  let physicalWObservation;
  try {
    physicalWObservation = await waitForObservedMovement('physical-w', physicalWBefore, { minimumMs: HELD_MOVEMENT_MIN_MS });
  } finally {
    await page.keyboard.up('w');
  }
  await page.waitForTimeout(120);
  const physicalWAfter = await getPlayer();
  const physicalWRelease = await verifyMovementReleased('physical-w', physicalWAfter);
  report.physicalW = {
    pathname: new URL(page.url()).pathname,
    before: physicalWBefore,
    after: physicalWAfter,
    distance: distance(physicalWBefore, physicalWAfter),
    observation: physicalWObservation,
    release: physicalWRelease
  };
  report.claims.physicalWKeyMoved = report.physicalW.pathname === '/eoncity' && report.physicalW.distance > 0.01 && physicalWRelease.passed;
  if (!report.claims.physicalWKeyMoved) throw new Error(`Physical W movement failed: ${JSON.stringify(report.physicalW)}`);

  const cityMenuButton = page.locator('[data-eon-w659n-open="city-menu"]').first();
  await cityMenuButton.waitFor({ state: 'visible', timeout: 90_000 });
  await cityMenuButton.click();
  const productiveMenu = page.locator('[data-eon-w659n-panel="city-menu"]');
  await productiveMenu.waitFor({ state: 'visible', timeout: 20_000 });
  const livingNexusEntry = productiveMenu.locator('[data-eon-w661e-open-living-nexus]');
  await livingNexusEntry.waitFor({ state: 'visible', timeout: 20_000 });
  const continuityEntryCount = await productiveMenu.locator('[data-eon-w659n-open="nexus"]').count();
  if (continuityEntryCount !== 1) throw new Error(`EON NEXUS continuity entry was not preserved separately: ${continuityEntryCount}`);
  await livingNexusEntry.click();

  const livingNexusPanels = page.locator('[data-eon-play-living-nexus-panel]');
  const panelCount = await livingNexusPanels.count();
  const livingNexusPanel = livingNexusPanels.first();
  await livingNexusPanel.waitFor({ state: 'visible', timeout: 20_000 });
  const productMenuHidden = await productiveMenu.evaluate((node) => node.hidden === true);
  const realmCount = await livingNexusPanel.locator('[data-realm-id]').count();
  const nexusText = await livingNexusPanel.innerText();
  const runtimeNexus = await page.evaluate(() => {
    const runtime = document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime;
    return {
      summary: runtime?.getLivingNexusSummary?.() || null,
      core: runtime?.getConnectedCoreSummary?.() || null,
      realms: runtime?.getLivingNexusRealmCatalog?.()?.map?.((entry) => entry.id) || []
    };
  });
  report.livingNexus = {
    panelCount,
    productMenuHidden,
    realmCount,
    continuityEntryCount,
    textIncludesConnectedCore: /Connected Core/i.test(nexusText),
    textIncludesSixRealms: /6 authored Nexus Realms/i.test(nexusText),
    runtime: runtimeNexus
  };
  report.claims.productiveMenuLivingNexusVisible = productMenuHidden && /EONCITY: THE LIVING NEXUS/i.test(nexusText);
  report.claims.oneCanonicalLivingNexusPanel = panelCount === 1;
  report.claims.connectedCoreVisible = runtimeNexus.core?.districtCount === 9
    && runtimeNexus.core?.streetConnectionCount >= 17
    && runtimeNexus.core?.stationCount === 9
    && runtimeNexus.core?.eonbotDockCount === 9
    && /Connected Core/i.test(nexusText);
  report.claims.sixRealmCatalogVisible = realmCount === 6 && runtimeNexus.realms.length === 6;
  if (!report.claims.productiveMenuLivingNexusVisible
    || !report.claims.oneCanonicalLivingNexusPanel
    || !report.claims.connectedCoreVisible
    || !report.claims.sixRealmCatalogVisible) {
    throw new Error(`Living Nexus progressive integration failed: ${JSON.stringify(report.livingNexus)}`);
  }

  const screenshot = 'w661e-city-movement-living-nexus-proof.png';
  await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false });
  report.screenshots.push(screenshot);
  report.claims.routeStayedEoncity = report.directions.every((entry) => entry.urlAfter === '/eoncity')
    && report.accessibleClick.pathname === '/eoncity'
    && report.realShortTap.pathname === '/eoncity'
    && report.physicalW.pathname === '/eoncity';
  report.claims.allFourDirectionsMoved = report.directions.every((entry) => entry.distance >= HELD_MOVEMENT_MIN_DISTANCE && entry.release?.passed);
  report.claims.safeResetVerified = report.resetChecks.every((entry) => entry.passed);
  report.claims.heldReleaseVerified = report.releaseChecks.every((entry) => entry.passed);
  if (report.pageErrors.length) throw new Error(`Page errors: ${report.pageErrors.join(' | ')}`);
  report.status = 'PASS';
  await context.close();
} catch (error) {
  report.status = report.claims.realBrowser && report.claims.realWebGL ? 'FAIL' : 'BLOCKED';
  report.error = safe(error?.stack || error?.message || error);
} finally {
  await browser?.close().catch(() => {});
}

await fs.writeFile(path.join(outputDir, 'W661E_CITY_MOVEMENT_NEXUS_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exit(1);

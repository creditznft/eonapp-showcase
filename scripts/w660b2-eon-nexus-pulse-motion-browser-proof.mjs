#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'reports', 'w660b2-eon-nexus-pulse-motion', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4180').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();

await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.w660b2.eon-nexus-pulse-motion-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  lane: 'loopback-css-state-motion-and-reduced-motion-fallback',
  status: 'BLOCKED',
  checkpoints: [],
  screenshots: [],
  pageErrors: [],
  requestFailures: [],
  forbiddenRequests: [],
  productionAuthenticationClaimed: false,
  physicalDeviceClaimed: false,
  productionProviderClaimed: false,
  microphonePermissionClaimed: false,
  liveVoiceClaimed: false,
  canvasRendererClaimed: false,
  liveNexusClaimed: false,
  eonCityNexusClaimed: false
};

const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 900);
let browser;

function attachDiagnostics(page, label) {
  page.on('pageerror', (error) => report.pageErrors.push({ label, text: safe(error?.message || error) }));
  page.on('requestfailed', (request) => report.requestFailures.push({ label, path: request.url().replace(baseURL, ''), error: safe(request.failure()?.errorText || 'unknown') }));
  page.on('request', (request) => {
    const url = request.url();
    if (/babylon|\.glb(?:\?|$)|webgl/i.test(url)) report.forbiddenRequests.push({ label, path: url.replace(baseURL, '') });
  });
}

async function installEnvironment(context, { deviceMemory = 16, hardwareConcurrency = 16 } = {}) {
  await context.addInitScript(({ memory, cores }) => {
    try { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => memory }); } catch {}
    try { Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => cores }); } catch {}
    window.__eonPulseMicRequests = 0;
    const mediaDevices = navigator.mediaDevices || {};
    try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices }); } catch {}
    try {
      Object.defineProperty(mediaDevices, 'getUserMedia', {
        configurable: true,
        value: async () => {
          window.__eonPulseMicRequests += 1;
          return { getTracks: () => [{ stop() {} }], getAudioTracks: () => [{ stop() {} }] };
        }
      });
    } catch {}
  }, { memory: deviceMemory, cores: hardwareConcurrency });
}

function overlapProbe(root) {
  const toggle = root.querySelector('.eon-nexus-pulse__toggle');
  const toggleRect = toggle?.getBoundingClientRect?.();
  const intersects = (left, right) => Boolean(left && right && !(
    left.right <= right.left ||
    left.left >= right.right ||
    left.bottom <= right.top ||
    left.top >= right.bottom
  ));
  const utilities = [...document.querySelectorAll('button, a[href]')]
    .filter((node) => {
      if (root.contains(node) || node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) return false;
      if (rect.width < 16 || rect.height < 16) return false;
      return rect.right >= window.innerWidth - 240 && rect.bottom >= window.innerHeight - 220;
    })
    .map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        label: String(node.getAttribute('aria-label') || node.textContent || node.className || node.tagName).replace(/\s+/g, ' ').trim().slice(0, 100),
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        overlaps: intersects(toggleRect, rect)
      };
    });
  const composerRect = document.querySelector('.chat-input-bar')?.getBoundingClientRect?.();
  return {
    toggle: toggleRect ? {
      left: Math.round(toggleRect.left),
      top: Math.round(toggleRect.top),
      right: Math.round(toggleRect.right),
      bottom: Math.round(toggleRect.bottom)
    } : null,
    utilityCount: utilities.length,
    utilityOverlaps: utilities.filter((entry) => entry.overlaps),
    bottomClearance: toggleRect ? Math.round(window.innerHeight - toggleRect.bottom) : 0,
    verticalGapToComposer: toggleRect && composerRect ? Math.round(composerRect.top - toggleRect.bottom) : null
  };
}

try {
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const motionContext = await browser.newContext({
    baseURL,
    viewport: { width: 1365, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    reducedMotion: 'no-preference'
  });
  await installEnvironment(motionContext);
  const motionPage = await motionContext.newPage();
  attachDiagnostics(motionPage, 'motion');
  await motionPage.goto('/chat?eonNexusMotionProof=1', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await motionPage.locator('#chat-input').waitFor({ state: 'visible', timeout: 30_000 });
  await motionPage.waitForFunction(() => Boolean(window.EONNexusPulse?.ok), null, { timeout: 15_000 });
  const pulse = motionPage.locator('[data-eon-nexus-pulse]');
  await pulse.waitFor({ state: 'visible', timeout: 10_000 });

  report.motionInitial = await pulse.evaluate((root) => {
    const core = root.querySelector('.eon-nexus-pulse__core');
    return {
      profile: root.dataset.motionProfile || '',
      active: root.dataset.motionActive || '',
      stateMotion: root.dataset.motionState || '',
      readyAnimation: core ? getComputedStyle(core).animationName : '',
      readyDuration: core ? getComputedStyle(core).animationDuration : '',
      canvasCount: document.querySelectorAll('canvas').length,
      micRequests: Number(window.__eonPulseMicRequests || 0)
    };
  });
  report.motionInitial.layout = await pulse.evaluate(overlapProbe);
  if (report.motionInitial.profile !== 'full') throw new Error(`Expected full Pulse motion profile, received ${report.motionInitial.profile || 'none'}.`);
  if (report.motionInitial.active !== 'true') throw new Error('Motion-capable Pulse was not active.');
  if (!/eon-nexus-ready-breathe/.test(report.motionInitial.readyAnimation)) throw new Error(`Ready motion was not active: ${report.motionInitial.readyAnimation || 'none'}.`);
  if (report.motionInitial.canvasCount !== 0) throw new Error('CSS Pulse introduced a canvas unexpectedly.');
  if (report.motionInitial.micRequests !== 0) throw new Error('Motion-capable Pulse requested microphone access automatically.');
  if (report.motionInitial.layout.bottomClearance < 72) throw new Error(`Desktop Pulse did not reserve the bottom control lane: ${report.motionInitial.layout.bottomClearance}px.`);
  if (report.motionInitial.layout.verticalGapToComposer !== null && report.motionInitial.layout.verticalGapToComposer < 0) throw new Error(`Desktop Pulse overlaps the Chat composer by ${Math.abs(report.motionInitial.layout.verticalGapToComposer)}px.`);
  if (report.motionInitial.layout.utilityOverlaps.length) throw new Error(`Desktop Pulse overlaps bottom-right controls: ${JSON.stringify(report.motionInitial.layout.utilityOverlaps)}`);
  report.checkpoints.push('full-profile-ready-motion-active-without-canvas-mic-or-control-overlap');

  await motionPage.evaluate(() => {
    const controller = window.EONNexusPulse;
    const snapshot = controller.adapter.getSnapshot();
    controller.pulse.render({
      ...snapshot,
      eonbot: { ...snapshot.eonbot, state: 'processing', statusLabel: 'Working' },
      task: { ...snapshot.task, stageLabel: 'Inspecting files' }
    });
  });
  await motionPage.waitForFunction(() => document.querySelector('[data-eon-nexus-pulse]')?.dataset?.motionState === 'processing-orbit');
  report.processing = await pulse.evaluate((root) => {
    const orb = root.querySelector('.eon-nexus-pulse__orb');
    const pseudo = orb ? getComputedStyle(orb, '::after') : null;
    return {
      state: root.dataset.eonbotState || '',
      stateMotion: root.dataset.motionState || '',
      orbitAnimation: pseudo?.animationName || '',
      playState: pseudo?.animationPlayState || ''
    };
  });
  if (report.processing.state !== 'processing') throw new Error('Projected processing state did not reach the Pulse.');
  if (!/eon-nexus-processing-orbit/.test(report.processing.orbitAnimation)) throw new Error(`Processing orbit animation missing: ${report.processing.orbitAnimation || 'none'}.`);
  report.checkpoints.push('processing-state-uses-observable-orbit-motion');

  await motionPage.evaluate(() => {
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); } catch {}
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await motionPage.waitForFunction(() => document.querySelector('[data-eon-nexus-pulse]')?.dataset?.motionActive === 'false');
  report.hidden = await pulse.evaluate((root) => ({
    active: root.dataset.motionActive || '',
    paused: root.dataset.motionPaused || '',
    stateMotion: root.dataset.motionState || ''
  }));
  if (report.hidden.active !== 'false' || report.hidden.paused !== 'true' || report.hidden.stateMotion !== 'none') {
    throw new Error(`Hidden-page motion did not pause correctly: ${JSON.stringify(report.hidden)}`);
  }
  report.checkpoints.push('visibilitychange-pauses-motion');

  await motionPage.evaluate(() => {
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); } catch {}
    document.dispatchEvent(new Event('visibilitychange'));
    const controller = window.EONNexusPulse;
    const snapshot = controller.adapter.getSnapshot();
    controller.pulse.render({
      ...snapshot,
      eonbot: { ...snapshot.eonbot, state: 'processing', statusLabel: 'Working' },
      task: { ...snapshot.task, stageLabel: 'Inspecting files' }
    });
    controller.pulse.open();
  });
  await motionPage.locator('.eon-nexus-pulse__panel').waitFor({ state: 'visible' });
  await motionPage.waitForFunction(() => document.querySelector('[data-eon-nexus-pulse]')?.dataset?.motionState === 'processing-orbit');
  report.openFocus = await motionPage.evaluate(() => ({
    className: String(document.activeElement?.className || ''),
    ariaLabel: String(document.activeElement?.getAttribute?.('aria-label') || '')
  }));
  if (!report.openFocus.className.includes('eon-nexus-pulse__close')) throw new Error(`Opening Pulse did not focus the Close button: ${JSON.stringify(report.openFocus)}`);
  report.checkpoints.push('open-panel-focuses-close-control');
  const motionShot = path.join(outputDir, '01-w660b2-motion-processing.png');
  await motionPage.screenshot({ path: motionShot, fullPage: false });
  report.screenshots.push(path.basename(motionShot));
  await motionContext.close();

  const reducedContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  });
  await installEnvironment(reducedContext, { deviceMemory: 8, hardwareConcurrency: 8 });
  const reducedPage = await reducedContext.newPage();
  attachDiagnostics(reducedPage, 'reduced');
  await reducedPage.goto('/chat?eonNexusReducedProof=1', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await reducedPage.locator('#chat-input').waitFor({ state: 'visible', timeout: 30_000 });
  await reducedPage.waitForFunction(() => Boolean(window.EONNexusPulse?.ok), null, { timeout: 15_000 });
  const reducedPulse = reducedPage.locator('[data-eon-nexus-pulse]');
  await reducedPulse.waitFor({ state: 'visible', timeout: 10_000 });
  report.reduced = await reducedPulse.evaluate((root) => {
    const help = [...document.querySelectorAll('button, a[href]')].find((node) => {
      if (root.contains(node)) return false;
      const text = String(node.textContent || '').trim();
      const label = String(node.getAttribute('aria-label') || '');
      return text === '?' || /help/i.test(label);
    });
    return {
      profile: root.dataset.motionProfile || '',
      active: root.dataset.motionActive || '',
      stateMotion: root.dataset.motionState || '',
      animations: [...root.querySelectorAll('*')]
        .map((node) => getComputedStyle(node).animationName)
        .filter((name) => name && name !== 'none'),
      micRequests: Number(window.__eonPulseMicRequests || 0),
      helpControlFound: Boolean(help?.getBoundingClientRect?.())
    };
  });
  report.reduced.layout = await reducedPulse.evaluate(overlapProbe);
  if (report.reduced.profile !== 'static') throw new Error(`Reduced motion selected ${report.reduced.profile || 'none'} instead of static.`);
  if (report.reduced.active !== 'false' || report.reduced.stateMotion !== 'none') throw new Error('Reduced-motion Pulse still reported active motion.');
  if (report.reduced.animations.length) throw new Error(`Reduced-motion Pulse exposed animations: ${report.reduced.animations.join(', ')}`);
  if (report.reduced.micRequests !== 0) throw new Error('Reduced-motion Pulse requested microphone access automatically.');
  if (report.reduced.layout.bottomClearance < 64) throw new Error(`Mobile Pulse did not preserve the lower utility lane: ${report.reduced.layout.bottomClearance}px.`);
  if (report.reduced.layout.verticalGapToComposer !== null && report.reduced.layout.verticalGapToComposer < 0) throw new Error(`Mobile Pulse overlaps the Chat composer by ${Math.abs(report.reduced.layout.verticalGapToComposer)}px.`);
  if (!report.reduced.helpControlFound) throw new Error('The mobile proof could not locate the existing help control.');
  if (report.reduced.layout.utilityOverlaps.length) throw new Error(`Mobile Pulse overlaps bottom-right controls: ${JSON.stringify(report.reduced.layout.utilityOverlaps)}`);
  report.checkpoints.push('mobile-reduced-motion-static-fallback-with-no-control-overlap');
  const reducedShot = path.join(outputDir, '02-w660b2-mobile-reduced-motion.png');
  await reducedPage.screenshot({ path: reducedShot, fullPage: false });
  report.screenshots.push(path.basename(reducedShot));
  await reducedContext.close();

  if (report.pageErrors.length) throw new Error(`Browser page errors: ${JSON.stringify(report.pageErrors)}`);
  if (report.forbiddenRequests.length) throw new Error(`Heavy renderer requests detected: ${JSON.stringify(report.forbiddenRequests)}`);
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.error = safe(error?.stack || error?.message || error);
  process.exitCode = 1;
} finally {
  await browser?.close?.().catch(() => {});
  report.completedAt = new Date().toISOString();
  await fs.writeFile(path.join(outputDir, 'w660b2-eon-nexus-pulse-motion-browser-proof.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

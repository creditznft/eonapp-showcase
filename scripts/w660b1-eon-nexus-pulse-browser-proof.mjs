#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'reports', 'w660b1-eon-nexus-pulse', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4179').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const headed = process.env.W660B1_HEADED === '1';

await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.w660b1.eon-nexus-pulse-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  lane: 'loopback-static-chat-pulse-reduced-motion',
  headed,
  status: 'BLOCKED',
  checkpoints: [],
  consoleMessages: [],
  pageErrors: [],
  requestFailures: [],
  forbiddenRequests: [],
  screenshots: [],
  microphoneRequestsBeforeUserVoiceAction: null,
  productionAuthenticationClaimed: false,
  physicalDeviceClaimed: false,
  productionProviderClaimed: false,
  microphonePermissionClaimed: false,
  liveVoiceClaimed: false,
  animatedPulseClaimed: false,
  liveNexusClaimed: false
};

const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 900);
let browser;
try {
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: !headed,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1365, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  });
  await context.addInitScript(() => {
    class ProofSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = 'en-US';
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    try { Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: ProofSpeechRecognition }); } catch {}
    try { Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: ProofSpeechRecognition }); } catch {}
    const mediaDevices = navigator.mediaDevices || {};
    try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices }); } catch {}
    window.__eonPulseMicRequests = 0;
    try {
      Object.defineProperty(mediaDevices, 'getUserMedia', {
        configurable: true,
        value: async () => {
          window.__eonPulseMicRequests += 1;
          return { getTracks: () => [{ stop() {} }], getAudioTracks: () => [{ stop() {} }] };
        }
      });
    } catch {}
  });

  const page = await context.newPage();
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) });
  });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ path: request.url().replace(baseURL, ''), error: safe(request.failure()?.errorText || 'unknown') }));
  page.on('request', (request) => {
    const url = request.url();
    if (/babylon|\.glb(?:\?|$)/i.test(url)) report.forbiddenRequests.push(url.replace(baseURL, ''));
  });

  await page.goto('/chat?eonNexusProof=1', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('#chat-input').waitFor({ state: 'visible', timeout: 30_000 });
  report.checkpoints.push('standard-chat-composer-visible-first');

  await page.waitForFunction(() => typeof window.EONNexusPulse !== 'undefined', null, { timeout: 15_000 });
  report.bootReceipt = await page.evaluate(() => {
    const receipt = window.EONNexusPulse || {};
    return {
      ok: receipt.ok === true,
      reason: String(receipt.reason || ''),
      name: String(receipt.name || ''),
      message: String(receipt.message || '')
    };
  });
  if (!report.bootReceipt.ok) {
    throw new Error(`Pulse boot failed: ${report.bootReceipt.reason || 'unknown'} ${report.bootReceipt.name || ''} ${report.bootReceipt.message || ''}`.trim());
  }

  const pulse = page.locator('[data-eon-nexus-pulse]');
  await pulse.waitFor({ state: 'visible', timeout: 8_000 });
  report.checkpoints.push('deferred-static-pulse-mounted-from-chat');

  const initial = await pulse.evaluate((root) => {
    const toggleRect = root.querySelector('.eon-nexus-pulse__toggle')?.getBoundingClientRect?.();
    const composerRect = document.querySelector('.chat-input-bar')?.getBoundingClientRect?.();
    return {
      state: root.dataset.eonbotState || '',
      privateRoute: root.dataset.privateRoute || '',
      panelHidden: root.querySelector('.eon-nexus-pulse__panel')?.hidden !== false,
      canvasCount: document.querySelectorAll('canvas').length,
      pulseStyleLoaded: Boolean(document.querySelector('link[data-eon-nexus-pulse-style]')),
      animationNames: [...root.querySelectorAll('*')].map((node) => getComputedStyle(node).animationName).filter((name) => name && name !== 'none'),
      bottomClearance: Math.round(window.innerHeight - (toggleRect?.bottom || window.innerHeight)),
      verticalGapToComposer: composerRect && toggleRect ? Math.round(composerRect.top - toggleRect.bottom) : null,
      viewportWidth: window.innerWidth
    };
  });
  if (!initial.pulseStyleLoaded) throw new Error('The deferred Pulse stylesheet was not attached.');
  if (initial.canvasCount !== 0) throw new Error(`Static Pulse unexpectedly introduced ${initial.canvasCount} canvas element(s).`);
  if (initial.animationNames.length) throw new Error(`Reduced-motion Pulse exposed active CSS animations: ${initial.animationNames.join(', ')}`);
  if (initial.bottomClearance < 72) throw new Error(`Pulse did not reserve the bottom utility lane; bottom clearance=${initial.bottomClearance}px.`);
  if (initial.verticalGapToComposer !== null && initial.verticalGapToComposer < 0) throw new Error(`Pulse overlaps the Chat composer by ${Math.abs(initial.verticalGapToComposer)}px.`);
  report.initial = initial;
  report.checkpoints.push('no-canvas-no-continuous-animation-and-no-composer-overlap');

  report.microphoneRequestsBeforeUserVoiceAction = await page.evaluate(() => Number(window.__eonPulseMicRequests || 0));
  if (report.microphoneRequestsBeforeUserVoiceAction !== 0) throw new Error('Pulse or Chat requested the microphone before an explicit voice action.');
  report.checkpoints.push('no-automatic-microphone-request');

  const toggle = page.locator('.eon-nexus-pulse__toggle');
  await toggle.click();
  const panel = page.locator('.eon-nexus-pulse__panel');
  await panel.waitFor({ state: 'visible' });
  const openChatAction = panel.getByRole('link', { name: 'Open Chat', exact: true });
  const speakAction = panel.getByRole('button', { name: 'Speak', exact: true });
  await openChatAction.waitFor({ state: 'visible' });
  await speakAction.waitFor({ state: 'visible' });
  report.checkpoints.push('visible-chat-and-speak-controls');

  await openChatAction.click();
  const focusedId = await page.evaluate(() => document.activeElement?.id || '');
  if (focusedId !== 'chat-input') throw new Error(`Open Chat did not focus the existing composer; focused=${focusedId || 'none'}.`);
  report.checkpoints.push('open-chat-focuses-existing-composer');

  await page.evaluate(() => {
    const controller = window.EONNexusPulse;
    const snapshot = controller.adapter.getSnapshot();
    controller.pulse.render({
      ...snapshot,
      eonbot: { ...snapshot.eonbot, state: 'processing', statusLabel: 'Working' },
      task: { ...snapshot.task, stageLabel: 'Preparing a truthful browser-proof reply.' }
    });
  });
  await page.waitForFunction(() => document.querySelector('[data-eon-nexus-pulse]')?.dataset?.eonbotState === 'processing');
  report.checkpoints.push('projected-processing-state-renders');

  await page.evaluate(() => {
    const controller = window.EONNexusPulse;
    const snapshot = controller.adapter.getSnapshot();
    controller.pulse.render({
      ...snapshot,
      eonbot: { ...snapshot.eonbot, state: 'complete', statusLabel: 'Reply ready' },
      task: { ...snapshot.task, stageLabel: 'Reply ready' }
    });
  });
  await page.waitForFunction(() => document.querySelector('[data-eon-nexus-pulse]')?.dataset?.eonbotState === 'complete');
  report.checkpoints.push('projected-complete-state-renders');

  await toggle.click();
  await panel.waitFor({ state: 'visible' });
  const screenshotPath = path.join(outputDir, '01-w660b1-eon-nexus-pulse-chat.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  report.screenshots.push(path.basename(screenshotPath));

  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  const expanded = await toggle.getAttribute('aria-expanded');
  if (expanded !== 'false') throw new Error('Escape closed the panel visually but aria-expanded was not reset.');
  report.checkpoints.push('escape-closes-accessibly');

  const micAfterInspection = await page.evaluate(() => Number(window.__eonPulseMicRequests || 0));
  if (micAfterInspection !== 0) throw new Error('Inspecting Pulse controls requested microphone access without activating Speak.');
  if (report.forbiddenRequests.length) throw new Error(`Static Pulse requested forbidden heavy assets: ${report.forbiddenRequests.join(', ')}`);
  if (report.pageErrors.length) throw new Error(`Browser page errors: ${report.pageErrors.join(' | ')}`);

  report.final = await pulse.evaluate((root) => ({
    state: root.dataset.eonbotState || '',
    privateRoute: root.dataset.privateRoute || '',
    ariaLabel: root.getAttribute('aria-label') || '',
    toggleLabel: root.querySelector('.eon-nexus-pulse__toggle')?.getAttribute('aria-label') || '',
    panelHidden: root.querySelector('.eon-nexus-pulse__panel')?.hidden !== false
  }));
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.error = safe(error?.stack || error?.message || error);
  process.exitCode = 1;
} finally {
  await browser?.close?.().catch(() => {});
  report.completedAt = new Date().toISOString();
  await fs.writeFile(path.join(outputDir, 'w660b1-eon-nexus-pulse-browser-proof.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

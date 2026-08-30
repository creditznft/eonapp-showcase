#!/usr/bin/env node
/**
 * W615 live City surface snapshot.
 *
 * Attaches only to an already-open ordinary browser through loopback CDP.
 * It does not navigate, sign in, read cookies, create storage state, or modify
 * the page. The JSON output contains bounded visual/runtime state only.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = String(process.env.EON_CITY_AUTH_BASE_URL || 'https://eonapp.ch').replace(/\/$/, '');
const cdpEndpoint = String(process.env.EON_CITY_CDP_ENDPOINT || 'http://127.0.0.1:9222').replace(/\/$/, '');
const outputDir = path.join(ROOT, 'reports', 'w615-city-surface');

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function safeUrl(value = '') { try { const url = new URL(value); url.search = ''; url.hash = ''; return url.toString(); } catch { return String(value).slice(0, 240); } }
function redact(value = '') { return String(value).replace(/(cookie|authorization|token|code|state|session|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 360); }

async function readCitySurface(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const canvas = root?.querySelector?.('[data-eon-play-canvas-host] canvas.eon-play-canvas') || null;
    const recovery = root?.querySelector?.('[data-eon-city-recovery-copy]') || null;
    const rect = canvas?.getBoundingClientRect?.();
    const visible = (node) => Boolean(node && !node.hidden && node.getClientRects?.().length);
    return {
      pathname: String(globalThis.location?.pathname || ''),
      routeState: String(document.body?.dataset?.eonCityRouteState || ''),
      root: {
        accessState: String(root?.dataset?.eonCityAccessState || ''),
        playState: String(root?.dataset?.eonCityPlayState || ''),
        firstFrame: String(root?.dataset?.eonCityFirstFrame || ''),
        recoveryCode: String(root?.dataset?.eonCityRecoveryCode || ''),
        quality: String(root?.dataset?.eonCityQuality || '')
      },
      recoveryVisible: visible(recovery),
      canvas: {
        present: Boolean(canvas),
        cssWidth: Math.round(Number(rect?.width || 0)),
        cssHeight: Math.round(Number(rect?.height || 0)),
        pixelWidth: Number(canvas?.width || 0),
        pixelHeight: Number(canvas?.height || 0)
      },
      shell: {
        sidebarCount: document.querySelectorAll('.eon-app-sidebar').length,
        mobileBarCount: document.querySelectorAll('.eon-app-mobilebar').length,
        scrollHeight: Math.round(Number(document.documentElement?.scrollHeight || 0)),
        viewportHeight: Math.round(Number(globalThis.innerHeight || 0))
      }
    };
  });
}

const report = {
  schema: 'eon.city.w615.live-surface-snapshot.v1',
  createdAt: new Date().toISOString(),
  baseUrl: safeUrl(baseUrl),
  cdpEndpoint: cdpEndpoint.replace(/\/\/[^/]+/, '//127.0.0.1'),
  outcome: 'BLOCKED'
};

try {
  const origin = new URL(baseUrl);
  if (origin.protocol !== 'https:') fail('INVALID_TARGET', 'The City surface snapshot requires an HTTPS production origin.');
  if (!['127.0.0.1', 'localhost', '::1'].includes(new URL(cdpEndpoint).hostname)) fail('INVALID_CDP_ENDPOINT', 'CDP must be loopback only.');
  const browser = await chromium.connectOverCDP(cdpEndpoint);
  try {
    const pages = browser.contexts().flatMap((context) => context.pages());
    const page = pages.find((candidate) => candidate.url().startsWith(`${baseUrl}/eoncity`));
    if (!page) fail('CITY_TAB_NOT_OPEN', 'Open the normal signed-in EON City tab first; this snapshot never opens or navigates a browser tab.');
    report.pageUrl = safeUrl(page.url());
    report.surface = await readCitySurface(page);
    await mkdir(outputDir, { recursive: true });
    await page.screenshot({ path: path.join(outputDir, 'city-surface.png'), fullPage: false });
    report.screenshot = 'city-surface.png';
    report.outcome = report.surface.recoveryVisible
      ? 'CITY_RECOVERY_VISIBLE'
      : report.surface.canvas.present && report.surface.canvas.cssWidth > 100 && report.surface.canvas.cssHeight > 100
        ? 'CITY_CANVAS_VISIBLE'
        : 'CITY_RENDER_SURFACE_MISSING';
  } finally {
    await browser.close();
  }
} catch (error) {
  report.outcome = String(error?.code || 'W615_SNAPSHOT_FAILURE');
  report.error = redact(error?.message || error);
}
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'surface.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!['CITY_RECOVERY_VISIBLE', 'CITY_CANVAS_VISIBLE', 'CITY_RENDER_SURFACE_MISSING'].includes(report.outcome)) process.exit(1);

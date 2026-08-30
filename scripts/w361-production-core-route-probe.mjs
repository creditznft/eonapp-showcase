#!/usr/bin/env node
/**
 * W361 C-00 production probe. Network use is opt-in and report output contains
 * redirect metadata, marker presence, byte counts and hashes only. It never
 * stores response bodies, credentials, cookies, browser storage, prompts, HARs,
 * provider outputs, or payment material.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getRouteRow } from '../config/route-contract.mjs';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const base = String(valueFor('--base-url') || 'https://eonapp.ch').replace(/\/$/, '');
const outputPath = valueFor('--out');
const EON_CITY_MARKER = getRouteRow('/eoncity')?.expected?.[0] || 'Checking City access';
const routes = Object.freeze([
  { route: '/chat', marker: 'EONBOT', expectedFinalPath: '/', requireRedirect: true },
  { route: '/workspace', marker: 'Workspace', expectedFinalPath: '/workspace', requireRedirect: false },
  { route: '/projects', marker: 'Projects', expectedFinalPath: '/projects', requireRedirect: false },
  { route: '/library', marker: 'Library', expectedFinalPath: '/library', requireRedirect: false },
  { route: '/automations', marker: 'Automations', expectedFinalPath: '/automations', requireRedirect: false },
  { route: '/local-ai', marker: 'Local AI', expectedFinalPath: '/local-ai', requireRedirect: false },
  { route: '/realm-studio', marker: 'Realm', expectedFinalPath: '/realm-studio', requireRedirect: false },
  { route: '/eoncity', marker: EON_CITY_MARKER, expectedFinalPath: '/eoncity', requireRedirect: false },
  { route: '/eoncity/lite', marker: EON_CITY_MARKER, expectedFinalPath: '/eoncity', requireRedirect: true },
  { route: '/eoncity/tour', marker: EON_CITY_MARKER, expectedFinalPath: '/eoncity', requireRedirect: true },
  { route: '/eoncity/3d', marker: EON_CITY_MARKER, expectedFinalPath: '/eoncity', requireRedirect: true },
  { route: '/eoncity/play', marker: EON_CITY_MARKER, expectedFinalPath: '/eoncity', requireRedirect: true }
]);

function report(value) { return JSON.stringify(value, null, 2); }

function dryRun() {
  return Object.freeze({
    wave: 'W361',
    lane: 'C-00-production-truth-repair',
    status: 'dry-run-no-network',
    baseUrl: base,
    routeCount: routes.length,
    routes: routes.map(({ route, marker }) => ({ route, expectedMarker: marker })),
    note: 'Pass --confirm-network only after Cloudflare Pages has deployed the intended commit. No response body is persisted.'
  });
}

async function probeRoute(input, definition = {}) {
  const seen = new Set();
  const chain = [];
  let url = new URL(input, `${base}/`).toString();
  for (let hop = 0; hop < 8; hop += 1) {
    if (seen.has(url)) return { ok: false, failure: 'redirect-loop', chain };
    seen.add(url);
    const response = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'EONAPP-W361-core-route-probe/1.0' } });
    const location = response.headers.get('location');
    chain.push({ url: new URL(url).pathname, status: response.status, location: location ? new URL(location, url).pathname : null });
    if (response.status >= 300 && response.status < 400) {
      if (!location) return { ok: false, failure: 'redirect-without-location', chain };
      url = new URL(location, url).toString();
      continue;
    }
    const body = await response.text();
    const expectedMarker = routes.find((entry) => entry.route === input)?.marker || '';
    const markerPresent = body.includes(expectedMarker);
    const finalPath = new URL(url).pathname;
    const expectedFinalPath = definition.expectedFinalPath || input;
    const redirectPass = definition.requireRedirect !== true || chain.length > 1;
    const finalPathPass = finalPath === expectedFinalPath;
    return {
      ok: response.status === 200 && markerPresent && redirectPass && finalPathPass,
      failure: response.status !== 200
        ? `status-${response.status}`
        : (!markerPresent ? 'expected-marker-missing' : (!redirectPass ? 'expected-redirect-missing' : (!finalPathPass ? 'unexpected-final-path' : null))),
      chain,
      final: Object.freeze({
        path: finalPath,
        status: response.status,
        contentType: response.headers.get('content-type') || null,
        byteLength: Buffer.byteLength(body),
        contentHash: createHash('sha256').update(body).digest('hex'),
        expectedMarkerPresent: markerPresent
      })
    };
  }
  return { ok: false, failure: 'too-many-redirects', chain };
}

async function run() {
  if (!has('--confirm-network')) return dryRun();
  const results = [];
  for (const entry of routes) {
    try {
      results.push({
        route: entry.route,
        expectedMarker: entry.marker,
        expectedFinalPath: entry.expectedFinalPath,
        requireRedirect: entry.requireRedirect === true,
        ...(await probeRoute(entry.route, entry))
      });
    } catch (error) {
      results.push({ route: entry.route, expectedMarker: entry.marker, ok: false, failure: 'network-error', errorName: error?.name || 'Error', errorMessage: String(error?.message || 'Unknown network error').slice(0, 180) });
    }
  }
  return Object.freeze({
    wave: 'W361',
    lane: 'C-00-production-truth-repair',
    status: results.every((entry) => entry.ok) ? 'pass' : 'fail',
    baseUrl: base,
    generatedAt: new Date().toISOString(),
    routeCount: results.length,
    results,
    storage: 'No response body, credentials, cookie, browser storage, HAR, prompt, provider output, or payment data was persisted.'
  });
}

const result = await run();
if (outputPath) {
  const resolved = path.resolve(outputPath);
  if (/\.env(?:\.|$)/i.test(resolved)) throw new Error('Refusing to write a report to an environment file path.');
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${report(result)}\n`);
}
process.stdout.write(`${report(result)}\n`);
process.exitCode = result.status === 'fail' ? 1 : 0;

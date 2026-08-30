#!/usr/bin/env node
/** W615 source gate — standard shell, recoverable City surface and bounded diagnostics. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(ROOT, relative), 'utf8');
const [city, station, access, css, runner, snapshot] = await Promise.all([
  read('eoncity.html'),
  read('assets/js/eon-city-play-station.js'),
  read('assets/js/city/eon-city-access-station.js'),
  read('assets/css/eon-city-play.css'),
  read('scripts/w599-run-authenticated-eoncity.mjs'),
  read('scripts/w615-capture-authenticated-city-surface.mjs')
]);
const issues = [];
const check = (id, value) => { if (!value) issues.push(id); };
check('city-shell-css', /eon-app-shell\.css/.test(city));
check('city-shell-script', /eon-app-shell\.js/.test(city));
check('city-shell-dataset', /data-eon-app-shell="1"/.test(city) && /data-eon-app-page="eoncity"/.test(city));
check('route-state-bridge', /data-eon-city-route-state="access-checking"/.test(city) && /setCityRouteState/.test(station) && /setAccessRouteState/.test(access));
check('recovery-wrapper', /eon-play-gate-copy eon-play-fallback-copy/.test(station));
check('recovery-actions', /Start low-detail City/.test(station) && /Retry full City/.test(station) && /Show safe City code/.test(station));
check('same-direct-safe-mode', /function startCitySafeMode\(root, capability\)/.test(station) && /entryMode: directEntry \? 'direct' : 'safe'/.test(station) && /lowDetailAlreadyTried/.test(station));
check('scrollable-recovery', /body\[data-eon-app-shell="1"\]\.eoncity-play-entry \{ overflow: auto; \}/.test(css) && /\.eon-play-fallback \{ min-height: 100dvh; overflow: visible;/.test(css));
check('real-tertiary-button', /button\.eon-play-tertiary \{ appearance: none;/.test(css));
check('runner-recovery-diagnostic', /inspectCitySurface/.test(runner) && /CITY_RECOVERY_VISIBLE/.test(runner) && /CITY_RENDER_SURFACE_MISSING/.test(runner));
check('live-surface-snapshot', /CITY_TAB_NOT_OPEN/.test(snapshot) && /connectOverCDP/.test(snapshot) && /never opens or navigates a browser tab/.test(snapshot));
check('no-access-bypass', !/document\.cookie|storageState|login\(|google\.com/.test(`${runner}\n${snapshot}`));
const result = Object.freeze({
  schema: 'eon.city.w615.recovery-shell-gate.v1',
  ok: issues.length === 0,
  issues: Object.freeze(issues),
  guarantees: Object.freeze([
    'The protected City route uses the normal EONAPP shell.',
    'Recovery is scrollable and keeps explicit retry, low-detail and support choices.',
    'Low-detail recovery stays in the direct City interaction model.',
    'The authenticated runner reports a bounded safe recovery marker without reading credentials or user content.'
  ]),
  limitations: Object.freeze([
    'This source gate cannot prove the deployed Babylon renderer starts in a signed-in browser.',
    'CITY_RECOVERY_VISIBLE remains a deployment blocker until Codex captures and fixes its actual live marker.'
  ])
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);

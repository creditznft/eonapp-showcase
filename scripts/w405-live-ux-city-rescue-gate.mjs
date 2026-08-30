#!/usr/bin/env node
/** W405 + W423 static source gate: calm shell, one Babylon City, truthful recovery. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W405_LIVE_UX_CITY_RESCUE_CONTRACT, validateW405LiveUxCityRescueContract } from '../config/w405-live-ux-city-rescue-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW405LiveUxCityRescue() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const shell = read('assets/js/eon-app-shell.js');
  const shellCss = read('assets/css/eon-app-shell.css');
  const chatCss = read('assets/css/eon-chat-first.css');
  const station = read('assets/js/eon-city-play-station.js');
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const cityCss = read('assets/css/eon-city-play.css');
  const sw = read('public/sw.js');
  const redirects = read('public/_redirects');
  const artPlan = read('docs/W405_EON_CITY_CHAT_SHELL_AND_ART_RESCUE_PLAN.md');

  check('contract-valid', validateW405LiveUxCityRescueContract().length === 0, 'W405/W423 contract has no internal mismatch');
  check('collapsed-rail-toolips', /function installRailTooltips/.test(shell) && /data-eon-tooltip/.test(shell) && /eon-app-rail-tooltip/.test(shellCss), 'collapsed rail has explicit hover/focus labels instead of clipped navigation text');
  check('brand-opens-sidebar', /data-eon-sidebar-brand-toggle/.test(shell) && /persistCollapsedPreference\(false\)/.test(shell), 'collapsed brand becomes an Open sidebar control instead of a second unexplained button');
  check('sidebar-utilities-unified', /eon-app-sidebar-utilities/.test(shell) && /Billing status/.test(shell) && /Install EONAPP/.test(shell) && !/eon-app-guest-utility/.test(shell), 'billing status, settings, help and install stay together in one lower sidebar area instead of duplicated guest blocks');
  check('anchored-popovers', /const placePopover/.test(shell) && /--eon-shell-popover-left/.test(shell) && /position:\s*fixed/.test(shellCss), 'Search, More and Profile menus anchor beside their triggering control');
  check('hidden-popovers-win', /\.eon-app-thread-menu\[hidden\]\s*\{\s*display:\s*none !important/.test(shellCss) && /\.eon-chat-overflow-menu\[hidden\]\s*\{\s*display:\s*none !important/.test(chatCss), 'thread and header menus cannot remain visibly stuck while hidden');
  check('header-signin-visible', /data-eon-header-account-label>Sign in/.test(shell) && /const label = identity\.signedIn \? 'Profile' : 'Sign in'/.test(shell), 'guest chat header always presents a visible Sign in affordance');
  check('simple-google-modal', /data-eon-signin-dialog/.test(shell) && /Continue with Google/.test(shell) && /data-eon-signin-google/.test(shell) && !/data-eon-signin-guest/.test(shell), 'Guest sign-in remains an explicit one-action dialog and does not add a redundant guest branch');
  check('no-backup-ack-gate', !/data-eon-header-account-ack|dataCustodyAck/.test(shell), 'Header sign-in does not require a backup acknowledgement or a Profile detour');
  check('header-signin-small-screen-safe', /eon-chat-header-account/.test(chatCss) && /eon-signin-dialog-layer/.test(shellCss) && /max-width: 640px/.test(shellCss), 'header entry and shared sign-in dialog remain usable on narrow screens');
  check('canonical-legacy-redirect', /const RELEASE_ID = '[a-z0-9._-]+'/i.test(sw) && /LEGACY_CITY_NAVIGATION_PATHS/.test(sw) && /Response\.redirect\(new URL\('\/eoncity'/.test(sw) && /\/realm \/eoncity 301/.test(redirects), 'legacy Realm navigation is quarantined from stale caches and canonicalized to Babylon City');
  check('legacy-three-retired', /\/eoncity-3d \/eoncity 301/.test(redirects) && /\/eoncity\/tour \/eoncity 301/.test(redirects) && !/href="\/eoncity\/tour/.test(shell) && /'\/realm\.html'/.test(sw), 'legacy Three.js and old tour routes no longer form a public navigation path');
  check('keyboard-focus-rescue', /const target = globalThis\.window \|\| canvas/.test(city) && /target\.addEventListener\('keydown'/.test(city) && /isEditableInputTarget/.test(city), 'keyboard movement survives HUD focus changes without hijacking text entry');
  check('local-reset-view', /resetView\(\)/.test(city) && /data-eon-play-reset-view/.test(station), 'City controls provide a local reset for camera and player position');
  check('direct-hud-calm', /Command District/.test(station) && /\[data-eon-city-direct-entry="true"\] \.eon-play-hud-direct/.test(cityCss) && /data-eon-play-save-proof\] \{ display:none/.test(cityCss), 'direct City entry removes prototype diagnostics and keeps a compact Command District HUD');
  check('same-route-city-recovery', /EON City needs a lighter start/.test(station) && /Start low-detail City/.test(station) && !/href="\/eoncity\/lite"/.test(station), 'City recovery stays in the direct Babylon surface instead of sending users to a default map');
  check('art-rescue-plan', /one canonical public City: Babylon/i.test(artPlan) && /GLB\/GLTF/.test(artPlan) && /## Acceptance gates/.test(artPlan), 'City art rebuild is documented as authored asset work with evidence gates, not a false AAA claim');
  return Object.freeze({ schema: 'eonapp.w423.live-ux-city-rescue-gate.v2', wave: W405_LIVE_UX_CITY_RESCUE_CONTRACT, status: 'pass', sourceOnly: true, checkCount: checks.length, checks, limitations: Object.freeze(['This gate does not prove live OAuth, Service Worker update adoption, gameplay controls on a real device, or visual quality after deployment.', 'W423 establishes the canonical path and rescue foundation; the authored-art production pass remains required.']) });
}

export function runW405LiveUxCityRescueGate({ writeArtifact = true } = {}) {
  const result = inspectW405LiveUxCityRescue();
  if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w405-live-ux-city-rescue-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW405LiveUxCityRescueGate(); process.stdout.write(`W423 live UX + City rescue gate passed (${result.checkCount}/${result.checkCount}).\n`); }

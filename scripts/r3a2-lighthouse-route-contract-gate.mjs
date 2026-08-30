#!/usr/bin/env node
/** W260-R3 A2 — verifies local Lighthouse follows the same exact root redirect as Cloudflare Pages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME_REDIRECT } from '../config/route-contract.mjs';
import { parseRedirectRules, resolveStaticRedirect } from './lhci-static-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const redirects = parseRedirectRules(fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8'));
const home = resolveStaticRedirect('/?lighthouse=1', redirects);
const source = fs.readFileSync(path.join(ROOT, 'scripts', 'w107-main-lighthouse-direct.mjs'), 'utf8');

assert(home?.status === HOME_REDIRECT.status, 'W260-R3 A2 local server must preserve the configured home redirect status.');
assert(home?.location === `${HOME_REDIRECT.to}?lighthouse=1`, 'W260-R3 A2 local server must preserve the home redirect target and query string.');
assert(source.includes("['home', '/']"), 'W260-R3 A2 core Lighthouse matrix must include the public root redirect.');
assert(source.includes('W107_MAIN_LIGHTHOUSE_SUMMARY.json'), 'W260-R3 A2 core Lighthouse runner must persist an inspectable JSON summary.');
assert(source.includes('report-not-created-before-timeout'), 'W260-R3 A2 core Lighthouse runner must fail closed when no report exists.');
assert(source.includes('classifyLighthouseCommandFailure'), 'W282 preflight must classify a trace-unavailable browser failure without fabricating a score.');
assert(source.includes('browser-navigation-trace-unavailable:no-navstart'), 'W282 preflight must retain a specific NO_NAVSTART environment-blocked reason.');
const report = {
  schema: 'eonapp.r3a2.lighthouse-route-contract-gate.v1',
  ok: errors.length === 0,
  homeRedirect: home,
  evidenceLimit: 'PASS validates local redirect emulation and Lighthouse runner structure. It is not a Lighthouse score or browser/device result.',
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W260-R3 A2_LIGHTHOUSE_ROUTE_CONTRACT_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log('W260-R3 A2 Lighthouse route-contract gate: PASS (root redirect is emulated for local Lighthouse).');
}

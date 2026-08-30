#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_W721_PRODUCT_RESET_CONTRACT,
  validateW721ProductResetContract
} from '../config/w721-product-reset-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));
const archive = json('config/archive/w721-superseded-launch-tests.json');
const manifest = json('config/w624d-current-unit-test-manifest.json');
const shell = read('assets/js/eon-app-shell.js');
const commandCss = read('assets/css/eon-command-surface.css');
const commandRegistry = read('assets/js/command/eon-command-registry.js');
const cityNexus = read('assets/js/city/w660/eon-city-w660-nexus-hologram.js');
const redirects = read('_redirects');
const validation = validateW721ProductResetContract();

const checks = Object.freeze([
  Object.freeze({ id: 'contract', pass: validation.ok, detail: validation.errors.join(',') || EONAPP_W721_PRODUCT_RESET_CONTRACT.strategy }),
  Object.freeze({ id: 'archive-explicit', pass: archive.certifying === false && archive.testFiles.length === manifest.supersededLaunchTestCount && archive.testFiles.every(exists), detail: `${archive.testFiles.length} preserved diagnostics` }),
  Object.freeze({ id: 'archive-separated', pass: archive.testFiles.every((file) => !manifest.testFiles.includes(file)), detail: 'no superseded test certifies W720+' }),
  Object.freeze({ id: 'replacement-authority', pass: archive.replacementContracts.every(exists) && manifest.wave === 'W734' && manifest.currentWave === 'W734' && manifest.certifying === true, detail: `${archive.replacementContracts.length} replacement contracts` }),
  Object.freeze({ id: 'frontend-full-screen', pass: /\.eon-command-surface\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/.test(commandCss) && /installEonQuickCommandSurface/.test(shell) && !/scheduleEonNexusAppShell/.test(shell), detail: 'Orb launches full-screen 2D work surface' }),
  Object.freeze({ id: 'shared-productive-routes', pass: ['/workspace', '/forge', '/projects', '/library'].every((href) => commandRegistry.includes(`href: '${href}'`)), detail: 'command registry owns real work routes' }),
  Object.freeze({ id: 'city-nexus-preserved', pass: /eon-city-w660-nexus-station/.test(cityNexus), detail: 'existing 3D Nexus asset remains available to City' }),
  Object.freeze({ id: 'help-converged', pass: /^\/support\s+\/help\s+301$/m.test(redirects) && /^\/support\.html\s+\/help\s+301$/m.test(redirects), detail: 'one Help authority' })
]);

export function inspectW721ProductReset() {
  return Object.freeze({
    schema: 'eonapp.gate.product-reset.w721.2026-07-27.v1',
    wave: 'W721',
    ok: checks.every((check) => check.pass),
    total: checks.length,
    passed: checks.filter((check) => check.pass).length,
    checks,
    performsNetworkRequest: false,
    mutatesProduction: false
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = inspectW721ProductReset();
  for (const check of result.checks) console.log(`[W721] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
  console.log(`[W721] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
  if (!result.ok) process.exitCode = 1;
}

#!/usr/bin/env node
/** W554C source gate — truthful client-first City delivery and load lifecycle. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validateEonCityClientDeliveryContract } from '../config/w554c-eon-city-client-load-contract.mjs';

const root = process.cwd();
const requireDist = process.argv.includes('--require-dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, output);
    else if (entry.isFile()) output.push(target);
  }
  return output;
}
const required = [
  'config/w554c-eon-city-client-load-contract.mjs',
  'assets/js/city/eon-city-client-load-sequence.js',
  'assets/js/city/eon-city-asset-cache-policy.js',
  'assets/js/city/eon-city-access-station.js',
  'assets/js/city/eon-city-runtime-owner.js',
  'assets/js/eon-city-play-station.js',
  'assets/css/eon-city-play.css',
  'tests/unit/w554c-eon-city-client-load.test.mjs'
];
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const contract = exists(required[0]) ? read(required[0]) : '';
const loader = exists('assets/js/city/eon-city-client-load-sequence.js') ? read('assets/js/city/eon-city-client-load-sequence.js') : '';
const cachePolicy = exists('assets/js/city/eon-city-asset-cache-policy.js') ? read('assets/js/city/eon-city-asset-cache-policy.js') : '';
const access = exists('assets/js/city/eon-city-access-station.js') ? read('assets/js/city/eon-city-access-station.js') : '';
const owner = exists('assets/js/city/eon-city-runtime-owner.js') ? read('assets/js/city/eon-city-runtime-owner.js') : '';
const station = exists('assets/js/eon-city-play-station.js') ? read('assets/js/eon-city-play-station.js') : '';
const css = exists('assets/css/eon-city-play.css') ? read('assets/css/eon-city-play.css') : '';
const validation = validateEonCityClientDeliveryContract();
if (!validation.ok) errors.push(...validation.errors.map((entry) => `contract:${entry}`));
if (!/pagesFunctionAssetRelayAllowed:\s*false/.test(contract)) errors.push('contract-must-forbid-pages-function-asset-relay');
if (!/directStaticResponses:\s*true/.test(contract)) errors.push('contract-must-require-direct-static-responses');
if (!/content-hashed-static-browser-cache/.test(contract) || !/persistentAssetCacheName:\s*'eonapp-city-assets-v1'/.test(contract)) errors.push('contract-must-lock-content-hashed-persistent-browser-cache');
if (!/releaseStableCacheName:\s*true/.test(cachePolicy) || !/appUpdatePreservesUnchangedAssets:\s*true/.test(cachePolicy)) errors.push('cache-policy-must-preserve-unchanged-city-assets-across-releases');
if (!/credentials:\s*'same-origin'/.test(loader) || !/cache:\s*'force-cache'/.test(loader)) errors.push('direct-static-loader-must-use-same-origin-cacheable-requests');
if (/fetch\(['"]\/api\//.test(loader)) errors.push('client-loader-must-not-relay-assets-through-an-api-route');
if (!/mountEonCityClientLoadScreen/.test(access) || !/createEonCityClientLoadSequence/.test(access) || !/import\('\.\/eon-city-runtime-owner\.js'\)/.test(access)) errors.push('access-station-must-show-client-load-screen-before-a-literal-deferred-runtime-owner-import');
if (!/from '\.\.\/eon-city-play-station\.js'/.test(owner) || !/mountEonCityPlayStation/.test(owner)) errors.push('runtime-owner-must-be-the-only-heavy-station-entry');
if (!/cityLoadSequence\.ready/.test(station) || !/eon-city-first-frame-progress/.test(station)) errors.push('play-station-must-complete-load-sequence-only-after-first-frame');
if (!/\.eon-city-client-loader/.test(css) || !/\.eon-city-first-frame-progress/.test(css)) errors.push('city-css-must-style-loading-and-first-frame-progress');
const distDirectory = path.join(root, 'dist');
const builtOutputAvailable = fs.existsSync(distDirectory);
const builtOutputChecked = requireDist && builtOutputAvailable;
if (requireDist && !builtOutputAvailable) errors.push('dist-required-but-missing');
if (builtOutputChecked) {
  const builtFiles = walk(distDirectory);
  const builtText = builtFiles.filter((file) => /\.(?:html|js|css)$/i.test(file)).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  if (!/Direct client delivery/.test(builtText) || !/no Pages Function asset relay/.test(builtText)) errors.push('built-output-missing-client-first-loader-copy');
  const builtCity = fs.readFileSync(path.join(distDirectory, 'eoncity.html'), 'utf8');
  const entryMatch = builtCity.match(/<script type=\"module\" crossorigin src=\"([^\"]+)\"><\/script>/);
  const entryPath = entryMatch?.[1] || '';
  const entryFile = entryPath ? path.join(distDirectory, entryPath.replace(/^\//, '')) : '';
  const entryText = entryFile && fs.existsSync(entryFile) ? fs.readFileSync(entryFile, 'utf8') : '';
  if (!entryText.includes('/api/city/access')) errors.push('built-city-entry-missing-access-preflight');
  if (!/eon-city-runtime-owner-[A-Za-z0-9_-]+\.js/.test(entryText)) errors.push('built-city-entry-must-code-split-runtime-owner');
  if (!builtText.includes('mountBabylonCityProof')) errors.push('built-heavy-city-station-chunk-missing');
}
const report = Object.freeze({ wave: 'W554C', ok: errors.length === 0, checks: 14 - errors.length, builtOutputChecked, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w554c-eon-city-client-load-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonCityW660NexusStations } from '../assets/js/city/w660/eon-city-w660-nexus-stations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'assets/js/city/w660/eon-city-w660-nexus-stations.js',
  'assets/js/city/w660/eon-city-w660-nexus-hologram.js',
  'assets/js/city/w659n/eon-city-w659n-product-layer.js',
  'assets/js/nexus/eon-nexus-event-adapter.js',
  'tests/unit/w660f-city-nexus.test.mjs',
  'docs/W660F_EONCITY_NEXUS_SOURCE_RECEIPT_2026-07-19.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const stationSource = fs.readFileSync(path.join(root, required[0]), 'utf8');
const hologramSource = fs.readFileSync(path.join(root, required[1]), 'utf8');
const productSource = fs.readFileSync(path.join(root, required[2]), 'utf8');
const executable = `${stationSource}\n${hologramSource}\n${productSource}`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const stationCheck = validateEonCityW660NexusStations();
add('nine-purpose-stations', stationCheck.ok && stationCheck.count === 9, stationCheck.errors.join(','));
add('one-station-per-district', stationCheck.districtCount === 9 && stationCheck.districtIds.length === 9 && !stationCheck.errors.some((entry) => entry.startsWith('district-station-count:')), stationCheck.errors.join(','));
add('approved-initial-four', ['creator-command-nexus', 'eonbot-dock-nexus', 'forge-workflow-nexus', 'project-workstation-nexus'].every((id) => stationSource.includes(id)));
add('same-state-adapter', /createEonNexusEventAdapter/.test(hologramSource) && /getSnapshot/.test(hologramSource) && /subscribe/.test(hologramSource));
add('product-layer-integration', /createEonCityW660NexusHologram/.test(productSource) && /nexusLayer\.start/.test(productSource) && /nexusLayer\.update/.test(productSource) && /nexusLayer\.dispose/.test(productSource));
add('review-first-actions', /reviewRequired:\s*true/.test(stationSource) && /autoExecute:\s*false/.test(stationSource) && /autoNavigate:\s*false/.test(stationSource));
add('one-babylon-owner', !/runRenderLoop|new Engine|new Scene|createElement\(['\"]canvas/.test(executable));
add('no-glb-dependency', !/\.glb|SceneLoader|LoadAssetContainer/.test(hologramSource));
add('no-second-store', !/createEonNexusStore|localStorage\.setItem|sessionStorage\.setItem|indexedDB/.test(hologramSource));
add('same-product-actions', /executeAction/.test(productSource) && /renderActionButtons/.test(productSource) && /interactionType:\s*'nexus'/.test(productSource));
add('reduced-motion', /if \(reducedMotion\)/.test(hologramSource) && /animation:none!important/.test(fs.readFileSync(path.join(root, 'assets/css/eon-city-product-layer.css'), 'utf8')));
add('privacy-state', /privacyProjected:\s*true/.test(stationSource) && /privateOnDevice/.test(hologramSource) && /approvalPending/.test(hologramSource));

const failed = checks.filter((entry) => !entry.pass);
const report = { wave: 'W660F', scope: 'eoncity-holographic-nexus', ok: failed.length === 0, passed: checks.length - failed.length, total: checks.length, checks, claims: { sourceImplemented: failed.length === 0, stationCount: 9, headedBrowserCertified: false, productionCertified: false } };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;

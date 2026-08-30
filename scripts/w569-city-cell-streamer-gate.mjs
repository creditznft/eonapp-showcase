#!/usr/bin/env node
/** W569 source gate — local 3×3 cell residency, manifest and disposal controls. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_STATIC_CELL_MANIFEST,
  createEonCityCellResidencyController,
  getEonCityCellResidencyPlan,
  getEonCityCellStreamerTruth,
  validateEonCityStaticCellManifest
} from '../assets/js/city/eon-city-cell-streamer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-cell-streamer.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/city/eon-city-asset-runtime.js',
  'tests/unit/w569-city-cell-streamer.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);

export function inspectW569CityCellStreamer({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-cell-streamer.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const assetRuntime = read('assets/js/city/eon-city-asset-runtime.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const manifest = validateEonCityStaticCellManifest();
  const plan = getEonCityCellResidencyPlan({ position: { x: 0, z: 0 }, quality: 'balanced' });
  const truth = getEonCityCellStreamerTruth({ quality: 'lite' });
  const controller = createEonCityCellResidencyController();
  const first = controller.update({ x: 0, z: 0 });
  let disposed = 0;
  const registered = controller.registerResource('cell-0-0', { kind: 'mesh', dispose: () => { disposed += 1; } });
  const second = controller.update({ x: 20, z: 0 });
  controller.dispose();
  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'cell controller, Babylon integration, lifecycle adapter, tests and suite registration exist');
  check('manifest-is-empty-and-valid', manifest.ok === true && EON_CITY_STATIC_CELL_MANIFEST.entries.length === 0, 'no static/binary City cell is registered in W569');
  check('plan-is-exactly-three-by-three', plan.residentCellCount === 9 && plan.expectedResidentCellCount === 9 && plan.cells.filter((cell) => cell.role === 'current').length === 1, 'current cell and eight adjacent cells form the local residency window');
  check('truth-remains-pre-release', truth.staticAssetsLoaded === false && truth.pagesFunctionProxy === false && truth.remoteNetwork === false && truth.containsUserData === false && truth.browserMemoryProofCaptured === false, 'W569 does not claim loaded art, proxy delivery, private data or memory proof');
  check('controller-releases-owned-resources', first.ok === true && registered === true && second.ok === true && disposed === 1, 'moving the residency window invokes only the registered local disposer');
  check('controller-disposes-final-resident-resources', controller.getSummary().disposed === true, 'City runtime teardown can release remaining cell ownership');
  check('scene-integrates-controller', /createEonCityCellResidencyController/.test(scene) && /cellResidency/.test(scene) && /cityCellResidency/.test(scene), 'live Babylon runtime has a local residency controller and honest summary metadata');
  check('scene-updates-from-operator-position', /cellResidency\.update\(operator\.position\)/.test(scene), 'residency changes only from the local operator position');
  check('scene-disposes-cell-controller', /cellResidency\.dispose\(\)/.test(scene), 'live City teardown disposes cell-owned resources before scene destruction');
  check('existing-asset-runtime-retains-disposal', /disposeBabylonCityAsset/.test(assetRuntime) && /disposeAsset/.test(assetRuntime), 'existing approved-asset lifecycle adapter remains the binary-handle owner');
  check('source-has-explicit-disposal-classes', /mesh/.test(source) && /material/.test(source) && /texture/.test(source) && /particle/.test(source) && /observer/.test(source) && /sound/.test(source) && /timer/.test(source) && /asset-container/.test(source), 'all future cell resource classes require an explicit disposer');
  check('no-loader-network-or-storage-api', !/(?:SceneLoader|ImportMesh|AppendAsync|AssetsManager|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager)/.test(source), 'cell controller has no loader, network, storage or permission side effect');
  check('no-commercial-or-private-surface', !/(?:subscription|checkout|purchase|payment|wallet|reward|loot|rarity|nft|accountId|projectId|prompt|vault|token|email)/i.test(source), 'cell controller has no commercial or private-work field');
  check('current-suite-registers-test', /w569-city-cell-streamer\.test\.mjs/.test(runner), 'W569 test is in current certification suite');
  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w569.city-cell-streamer-gate.v1',
    wave: 'W569',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: freeze(failed.map((entry) => entry.id)),
    limitations: freeze([
      'No binary static cell file, byte stream, cache-throughput measurement or memory benchmark exists in W569.',
      'No Cloudflare edge policy, browser visual proof, physical-device benchmark or production deployment is claimed.',
      'Future binary cells still require W566 provenance, W567 package proof, explicit edge policy and real device evidence.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w569-city-cell-streamer-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

function freeze(value) { return Object.freeze(value); }

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW569CityCellStreamer();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

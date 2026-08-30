#!/usr/bin/env node
/** W568 source gate — bounded original procedural Command Horizon street kit. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_COMMAND_HORIZON_STREET_KIT_PROFILES,
  getEonCityCommandHorizonStreetKitPlan,
  getEonCityCommandHorizonStreetKitTruth,
  validateEonCityCommandHorizonStreetKitPlan
} from '../assets/js/city/eon-city-command-horizon-street-kit.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-command-horizon-street-kit.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/city/eon-city-play-art-direction.js',
  'tests/unit/w568-command-horizon-street-kit.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);

export function inspectW568CommandHorizonStreetKit({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-command-horizon-street-kit.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const plans = ['lite', 'balanced', 'cinematic'].map((quality) => getEonCityCommandHorizonStreetKitPlan({ quality }));
  const validation = plans.map((plan) => validateEonCityCommandHorizonStreetKitPlan(plan));
  const truths = ['lite', 'balanced', 'cinematic'].map((quality) => getEonCityCommandHorizonStreetKitTruth({ quality }));
  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'street-kit source, renderer integration, budget source, tests and current suite files exist');
  check('all-quality-plans-validate', validation.every((entry) => entry.ok === true), 'Lite, balanced and cinematic plans validate as bounded geometry descriptors');
  check('profile-counts-are-explicit', Object.values(EON_CITY_COMMAND_HORIZON_STREET_KIT_PROFILES).every((profile) => Number.isInteger(profile.curbCount) && Number.isInteger(profile.rainChannelCount) && Number.isInteger(profile.wayfindingCount)), 'all profile caps are explicit integers');
  check('truth-stays-source-only', truths.every((truth) => truth.originalProcedural === true && truth.binaryAssets === false && truth.remoteAssets === false && truth.userData === false), 'street kit is original procedural geometry with no binary, remote or user content');
  check('truth-has-no-delivery-or-storage', truths.every((truth) => truth.fetchesAssets === false && truth.proxiesAssets === false && truth.storesUserData === false), 'street kit cannot fetch, proxy or store data');
  check('lite-is-a-real-fallback', plans[0].props.rails.length === 0 && plans[0].props.planters.length === 0 && plans[0].props.paverGuides.length === 0 && plans[0].budgets.decorativePropCount <= 2, 'Lite avoids rails, planters and paver ornament');
  check('decorative-counts-stay-within-budget', plans.every((plan) => plan.budgets.decorativePropBudgetRespected === true && plan.budgets.decorativePropCount <= plan.budgets.streetProps), 'decorative prop counts fit the existing City quality profile');
  check('scene-imports-and-uses-plan', /getEonCityCommandHorizonStreetKitPlan/.test(scene) && /addCommandHorizonStreetKit/.test(scene) && /commandHorizonStreetKit/.test(scene), 'Babylon scene uses the real source-controlled street plan and exposes honest metadata');
  check('street-kit-is-deferred-after-first-frame-core', /engineStages\.add\('street-life'/.test(scene) && /addCommandHorizonStreetKit\(scene/.test(scene), 'street dressing runs in the deferred street-life stage rather than blocking core City boot');
  check('procedural-rendering-is-bounded', /props\.curbs/.test(scene) && /props\.rainChannels/.test(scene) && /props\.planters/.test(scene) && /props\.wayfinding/.test(scene), 'renderer covers curbs, rain channels, planters and wayfinding from plan descriptors');
  check('no-binary-loader-or-network-api', !/(?:SceneLoader|ImportMesh|AppendAsync|AssetsManager|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|\.glb|\.ktx2)/.test(source), 'street-kit data module has no binary loader or network delivery API');
  check('no-storage-or-user-surface', !/(?:localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager|accountId|projectId|prompt|vault|token|email)/i.test(source), 'street-kit source contains no storage, permission or private-work fields');
  check('no-entitlement-or-commerce-claim', !/(?:subscription|checkout|purchase|payment|wallet|reward|loot|rarity|nft)/i.test(source), 'street-kit contains no paid, reward or collectible claim');
  check('current-suite-registers-test', /w568-command-horizon-street-kit\.test\.mjs/.test(runner), 'W568 test is in current certification suite');
  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w568.command-horizon-street-kit-gate.v1',
    wave: 'W568',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'No GLB, KTX2, image, audio or remote art asset is added in W568.',
      'No Cloudflare preview/production deployment, browser screenshot, device benchmark, or visual acceptance is claimed.',
      'The street kit is original procedural City dressing only and must still pass later visual and device proof.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w568-command-horizon-street-kit-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW568CommandHorizonStreetKit();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

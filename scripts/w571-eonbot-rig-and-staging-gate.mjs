#!/usr/bin/env node
/** W571 source gate — procedural EONBOT rig, visual staging, safe panel and truthful boundaries. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEonCityEonbotRigPlan,
  getEonCityEonbotRigTruth,
  validateEonCityEonbotRigPlan
} from '../assets/js/city/eon-city-eonbot-rig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/city/eon-city-eonbot-rig.js',
  'assets/js/contracts/city/eon-city-eonbot-companion.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w571-eonbot-rig-and-staging.test.mjs',
  'scripts/run-current-unit-suite.mjs',
  'package.json'
]);
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

export function inspectW571EonbotRigAndStaging({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const rig = read('assets/js/city/eon-city-eonbot-rig.js');
  const companion = read('assets/js/contracts/city/eon-city-eonbot-companion.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const packageJson = JSON.parse(read('package.json'));
  const plans = ['lite', 'balanced', 'cinematic'].map((quality) => createEonCityEonbotRigPlan({ quality }));
  const validation = plans.map((plan) => validateEonCityEonbotRigPlan(plan));
  const truth = getEonCityEonbotRigTruth({ quality: 'balanced' });

  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'rig contract, companion integration, station panel, tests, runner and scripts exist');
  check('quality-plans-validate', validation.every((entry) => entry.ok === true), 'Lite, balanced and cinematic rig plans validate');
  check('lite-is-real-fallback', plans[0].rig.finCount === 0 && plans[0].rig.stageBeaconCount === 0 && plans[0].staging.motionEnabled === false && plans[0].rig.meshBudget < plans[1].rig.meshBudget, 'Lite removes optional rigging and motion rather than relabelling the full plan');
  check('detail-remains-bounded', plans[1].rig.meshBudget < plans[2].rig.meshBudget && plans[2].rig.meshBudget <= 27 && plans.every((plan) => plan.rig.originalProcedural === true && plan.rig.binaryAssets === false && plan.rig.remoteAssets === false), 'all quality levels retain bounded original procedural geometry');
  check('staging-envelope-is-safe', plans.every((plan) => plan.staging.id === 'operator-sidecar-stage' && plan.staging.pauseRespected === true && plan.staging.reducedEffectsRespected === true && plan.staging.envelope.maxHeight > plan.staging.envelope.minHeight), 'local formation envelope respects pause and reduced effects');
  check('same-safe-panel', plans.every((plan) => plan.panel.id === 'eonbot-companion-panel' && plan.panel.opensSameSafePanel === true && plan.panel.captionsFirst === true), 'every entry point is defined to use one captions-first safe panel');
  check('truth-is-local-and-visual', truth.originalProcedural === true && truth.binaryAssets === false && truth.remoteAssets === false && truth.localOnly === true && truth.visualOnly === true, 'rig truth stays local, procedural and visual-only');
  check('truth-rejects-actions-data-and-entitlements', truth.microphoneRequested === false && truth.voiceStarted === false && truth.autonomousWorkStarted === false && truth.privateDataRead === false && truth.routeOpened === false && truth.subscriptionEntitlementClaimed === false, 'rig cannot start voice/work, read data, navigate, or imply access rights');
  check('companion-boundary-is-preserved', /createEonCityEonbotCompanionPlan/.test(companion) && /captionsFirst:\s*true/.test(companion) && /subscriptionBenefitClaimed:\s*false/.test(companion), 'W561 companion behavior and visual-only skin boundary remain intact');
  check('scene-consumes-rig-plan', /createEonCityEonbotRigPlan/.test(scene) && /eonbotRigPlan/.test(scene) && /rigSchema/.test(scene) && /playPaused/.test(scene) && /playReducedEffects/.test(scene), 'Babylon scene consumes the rig plan and protects motion under pause or reduced effects');
  check('station-renders-the-same-panel', /bindEonbotCompanionPanel/.test(station) && /getEonCityEonbotRigPlan/.test(station) && /data-eon-play-open-companion/.test(station) && /data-eon-play-companion-panel/.test(station), 'all station companion controls bind to the existing safe panel');
  check('no-network-storage-or-binary-loader', !/(?:SceneLoader|ImportMesh|AppendAsync|AssetsManager|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager)/.test(rig), 'rig contract has no binary loader, network, storage or permission side effect');
  check('no-remote-or-private-fields', !/(?:accountId|projectId|prompt|vault|token|email|userId|providerId)/i.test(rig), 'rig contract excludes private-data fields');
  check('visual-commercial-firewall', /visualOnly:\s*true/.test(rig) && /subscriptionEntitlementClaimed:\s*false/.test(rig) && /commercialStatus:\s*'visual-only-no-entitlement'/.test(rig), 'rig does not imply paid, owned, unlock, collectible or subscription value');
  check('eonbot-remains-separate-from-ambient-npcs', /getEonCityAmbientNpcCrowdPlan/.test(scene) && /addAmbientNpcCrowd/.test(scene) && /function addEonbot/.test(scene), 'ambient W570 crowd remains a separate visual system');
  check('suite-and-command-registered', /w571-eonbot-rig-and-staging\.test\.mjs/.test(runner) && typeof packageJson.scripts?.['qa:w571-eonbot-rig-and-staging'] === 'string' && typeof packageJson.scripts?.['verify:w555a-w571-source'] === 'string', 'W571 gate/test and cumulative verifier are registered');

  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w571.eonbot-rig-and-staging-gate.v1',
    wave: 'W571',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'No GLB, KTX2, texture, image, audio, remote asset, asset proxy or final art claim is added.',
      'No microphone, speech session, AI/provider request, route action, account read, private data projection, background worker or autonomous action is added.',
      'No checkout, payment, subscription entitlement, collectible, reward, ownership or transfer claim is added.',
      'No browser visual review, physical-device performance proof or production deployment is claimed.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w571-eonbot-rig-and-staging-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW571EonbotRigAndStaging();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

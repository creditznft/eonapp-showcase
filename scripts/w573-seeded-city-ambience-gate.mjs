#!/usr/bin/env node
/** W573 source gate — deterministic local schedules, traffic, signs, and visual moments. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getEonCitySeededAmbiencePlan,
  getEonCitySeededAmbienceTruth,
  validateEonCitySeededAmbiencePlan
} from '../assets/js/city/eon-city-seeded-ambience.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-seeded-ambience.js',
  'assets/js/city/eon-city-play-babylon.js',
  'docs/W573_SEEDED_CITY_AMBIENCE_SCOPE_BOARD_2026-07-03.md',
  'tests/unit/w573-seeded-city-ambience.test.mjs',
  'scripts/w573-seeded-city-ambience-gate.mjs',
  'scripts/run-current-unit-suite.mjs',
  'package.json'
]);

export function inspectW573SeededCityAmbience({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-seeded-ambience.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const scopeBoard = read('docs/W573_SEEDED_CITY_AMBIENCE_SCOPE_BOARD_2026-07-03.md');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const packageJson = JSON.parse(read('package.json'));
  const lite = getEonCitySeededAmbiencePlan({ quality: 'lite', seed: 'command-horizon-alpha', phaseIndex: 1 });
  const balanced = getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha', phaseIndex: 1 });
  const cinematic = getEonCitySeededAmbiencePlan({ quality: 'cinematic', seed: 'command-horizon-alpha', phaseIndex: 1 });
  const paused = getEonCitySeededAmbiencePlan({ quality: 'cinematic', seed: 'command-horizon-alpha', paused: true });
  const reduced = getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha', reducedEffects: true });
  const truth = getEonCitySeededAmbienceTruth({ quality: 'cinematic' });

  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'contract, Babylon integration, scope board, test, gate, runner, and package metadata exist');
  check('written-scope-board-keeps-boundaries', /no real-world schedule, countdown, calendar, invite, reward, or notification/i.test(scopeBoard) && /no audio, microphone, speech/i.test(scopeBoard) && /no network, remote asset/i.test(scopeBoard), 'W573 scope board records its prohibited expansion paths');
  check('all-quality-plans-validate', [lite, balanced, cinematic, paused, reduced].every((plan) => validateEonCitySeededAmbiencePlan(plan).ok), 'Lite, balanced, cinematic, paused, and reduced plans validate');
  check('deterministic-local-seed-no-clock', JSON.stringify(balanced) === JSON.stringify(getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha', phaseIndex: 1 })) && balanced.readsDeviceClock === false && balanced.realWorldCalendar === false && balanced.phase.realWorldTime === false, 'same seed and phase yield the same local plan without wall-clock or calendar semantics');
  check('lite-is-a-real-static-fallback', lite.signs.length === 2 && lite.npcSchedule.length === 0 && lite.traffic.length === 0 && lite.visualMoments.length === 0 && lite.motionEnabled === false && lite.motionState === 'quality-lite', 'Lite retains bounded signs and removes decorative motion');
  check('rich-profiles-are-capped-and-noninteractive', balanced.npcSchedule.length === 3 && balanced.traffic.length === 2 && cinematic.npcSchedule.length === 5 && cinematic.traffic.length === 4 && cinematic.visualMoments.every((entry) => entry.interactive === false && entry.notification === false && entry.calendar === false && entry.social === false && entry.reward === null), 'richer profiles add only finite decorative cues');
  check('static-signs-cannot-open-or-signal-work', balanced.signs.every((entry) => entry.static === true && entry.localVisualOnly === true && entry.interactive === false), 'wayfinding signs are static local labels, not route or work actions');
  check('pause-and-reduced-effects-stop-motion', paused.motionEnabled === false && paused.motionState === 'city-paused' && reduced.motionEnabled === false && reduced.motionState === 'reduced-effects' && paused.staticSignsRemainVisible === true && reduced.staticSignsRemainVisible === true, 'existing pause/reduced-effects protection freezes W573 motion without hiding wayfinding');
  check('truth-is-local-visual-only', truth.valid === true && truth.originalProcedural === true && truth.binaryAssets === false && truth.remoteAssets === false && truth.remoteTelemetry === false && truth.userData === false && truth.interactive === false && truth.autonomous === false && truth.socialMultiplayer === false, 'W573 has no binary asset, data, interaction, autonomy, or multiplayer claim');
  check('truth-rejects-clock-calendar-notification-sound-and-work', truth.readsDeviceClock === false && truth.realWorldCalendar === false && truth.notificationRequested === false && truth.soundRequested === false && truth.workloadJobStarted === false, 'W573 does not activate time, notice, sound, or workload behavior');
  check('contract-has-no-side-effect-api', !/(?:\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.|PushManager|mediaDevices\s*\.|getUserMedia\s*\(|new\s+Audio\s*\()/i.test(source), 'ambience contract has no network, storage, notification, media, or permission side effect');
  check('contract-has-no-commercial-or-private-fields', !/(?:subscription|checkout|purchase|payment|wallet|loot|rarity|nft|accountId|projectId|prompt|vault|token|email)/i.test(source) && cinematic.visualMoments.every((entry) => entry.reward === null), 'ambience contract has no commercial or private-work surface; explicit no-reward fields stay null');
  check('babylon-integrates-seeded-plan-and-npc-cues', /getEonCitySeededAmbiencePlan/.test(scene) && /addSeededAmbience/.test(scene) && /seededAmbiencePlan/.test(scene) && /scheduleCue/.test(scene), 'Babylon scene renders signs, traffic, visual moments, and decorative NPC cues from the source plan');
  check('babylon-respects-pause-and-reduced-effects', /scene\.metadata\?\.playPaused/.test(scene) && /scene\.metadata\?\.playReducedEffects/.test(scene) && /motionEnabled/.test(scene), 'render callbacks retain pause and reduced-effects guards');
  check('runtime-summary-stays-truthful', /seededAmbience: Object\.freeze/.test(scene) && /interactive: false/.test(scene) && /autonomous: false/.test(scene) && /privateDataVisible: false/.test(scene), 'runtime summary exposes only a finite local visual status');
  check('suite-and-command-registered', /w573-seeded-city-ambience\.test\.mjs/.test(runner) && typeof packageJson.scripts?.['qa:w573-seeded-city-ambience'] === 'string' && typeof packageJson.scripts?.['verify:w555a-w573-source'] === 'string', 'W573 test, gate, QA command, and cumulative verifier are registered');

  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w573.seeded-city-ambience-gate.v1',
    wave: 'W573',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'No real-world time, calendar, countdown, invite, event delivery, notification, reward, or social activity is added.',
      'No microphone, speech, audio start, provider request, account read, private-data projection, route action, background task, or autonomous work is added.',
      'No remote asset, stream, binary art loader, telemetry, payment, entitlement, ownership, or commercial claim is added.',
      'No browser visual review, physical-device performance proof, preview deployment, or production deployment is claimed.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w573-seeded-city-ambience-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW573SeededCityAmbience();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

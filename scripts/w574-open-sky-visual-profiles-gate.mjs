#!/usr/bin/env node
/** W574 source gate — session-only, source-controlled open-sky visual profiles. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID,
  getEonCityOpenSkyProfileOptions,
  getEonCityOpenSkyProfilePlan,
  getEonCityOpenSkyTruth,
  validateEonCityOpenSkyProfilePlan
} from '../assets/js/city/eon-city-open-sky-profiles.js';

const freeze = (value) => Object.freeze(value);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-open-sky-profiles.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'docs/W574_OPEN_SKY_VISUAL_PROFILES_SCOPE_BOARD_2026-07-03.md',
  'tests/unit/w574-open-sky-visual-profiles.test.mjs',
  'scripts/w574-open-sky-visual-profiles-gate.mjs',
  'scripts/run-current-unit-suite.mjs',
  'package.json'
]);

export function inspectW574OpenSkyVisualProfiles({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-open-sky-profiles.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const scopeBoard = read('docs/W574_OPEN_SKY_VISUAL_PROFILES_SCOPE_BOARD_2026-07-03.md');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const packageJson = JSON.parse(read('package.json'));
  const lite = getEonCityOpenSkyProfilePlan({ quality: 'lite', profileId: 'clear-horizon' });
  const balanced = getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'violet-dusk' });
  const cinematic = getEonCityOpenSkyProfilePlan({ quality: 'cinematic', profileId: 'signal-storm' });
  const paused = getEonCityOpenSkyProfilePlan({ quality: 'cinematic', profileId: 'signal-storm', paused: true });
  const reduced = getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'dawn-glass', reducedEffects: true });
  const truth = getEonCityOpenSkyTruth({ quality: 'cinematic', profileId: EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID });

  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'contract, Babylon integration, station selector, scope board, test, gate, runner, and package metadata exist');
  check('written-scope-board-keeps-boundaries', /not time, weather, or a forecast/i.test(scopeBoard) && /no device clock, geolocation, weather service, forecast, calendar/i.test(scopeBoard) && /W562 and W572 remain unchanged/i.test(scopeBoard), 'W574 scope board excludes real-world signals and preserves existing voice/audio boundaries');
  check('all-quality-plans-validate', [lite, balanced, cinematic, paused, reduced].every((plan) => validateEonCityOpenSkyProfilePlan(plan).ok), 'Lite, balanced, cinematic, paused, and reduced plans validate');
  check('profiles-are-source-controlled-and-allowlisted', getEonCityOpenSkyProfileOptions().length === 4 && getEonCityOpenSkyProfileOptions().every((entry) => entry.sourceControlled === true && entry.sessionOnly === true && entry.visualStyleOnly === true) && getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'untrusted-value' }).profile.id === EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, 'only finite source-controlled profile ids resolve');
  check('default-profile-is-source-defined', getEonCityOpenSkyProfilePlan({ quality: 'balanced' }).profile.id === EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID && getEonCityOpenSkyProfilePlan({ quality: 'balanced' }).profile.saved === false, 'the default profile is selected from source, not time or persisted state');
  check('no-real-world-time-weather-or-calendar', balanced.profile.realWorldTime === false && balanced.profile.realWorldWeather === false && balanced.profile.forecast === false && balanced.readsDeviceClock === false && balanced.realWorldWeather === false && balanced.realWorldCalendar === false, 'same source inputs produce a visual style with no wall-clock, weather, forecast, or calendar semantics');
  check('lite-and-reduced-are-real-static-fallbacks', lite.atmosphereLayers.length === 0 && lite.motionEnabled === false && lite.motionState === 'quality-lite' && lite.sky.staticFallback === true && reduced.atmosphereLayers.length === 0 && reduced.motionEnabled === false && reduced.motionState === 'reduced-effects' && reduced.sky.staticFallback === true, 'Lite and reduced effects keep fixed sky and lighting without animated layers');
  check('rich-profiles-are-capped-and-noninteractive', balanced.atmosphereLayers.length === 1 && cinematic.atmosphereLayers.length === 2 && cinematic.atmosphereLayers.every((layer) => layer.localVisualOnly === true && layer.interactive === false && layer.animated === true), 'Balanced/Cinematic add only finite decorative local geometry');
  check('pause-stops-motion-with-readable-sky', paused.motionEnabled === false && paused.motionState === 'city-paused' && paused.atmosphereLayers.length === 0 && paused.sky.staticFallback === true, 'City pause freezes W574 motion while retaining a static readable visual layer');
  check('truth-is-session-only-local-visual', truth.valid === true && truth.localVisualOnly === true && truth.sourceControlled === true && truth.sessionOnly === true && truth.proceduralGeometry === true && truth.binaryAssets === false && truth.remoteAssets === false && truth.remoteTelemetry === false && truth.userData === false, 'W574 remains a local session visual contract with no asset or data claim');
  check('truth-rejects-audio-voice-storage-work-and-commercial-scope', truth.soundRequested === false && truth.voiceRequested === false && truth.storageRequested === false && truth.workloadJobStarted === false && truth.interactive === false && truth.autonomous === false && truth.commercial === false, 'W574 does not activate audio, voice, storage, work, interaction, autonomy, or commercial behavior');
  check('contract-has-no-side-effect-api', !/(?:\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.|PushManager|mediaDevices\s*\.|getUserMedia\s*\(|new\s+Audio\s*\(|new\s+Date\s*\(|performance\.now\s*\()/i.test(source), 'visual profile contract has no network, storage, notification, media, clock, or performance side effect');
  check('contract-has-no-commercial-or-private-fields', !/(?:subscription|checkout|purchase|payment|wallet|loot|rarity|nft|accountId|projectId|prompt|vault|token|email)/i.test(source), 'visual profile contract has no commercial or private-work surface');
  check('babylon-integrates-bounded-profile-and-motion-guards', /getEonCityOpenSkyProfilePlan/.test(scene) && /addOpenSkyProfile/.test(scene) && /setOpenSkyProfile/.test(scene) && /scene\.metadata\?\.playPaused/.test(scene) && /scene\.metadata\?\.playReducedEffects/.test(scene), 'Babylon scene applies profiles locally and preserves pause/reduced-effects guards');
  check('station-exposes-session-only-selector-without-persistence', /data-eon-play-settings-open-sky/.test(station) && /setOpenSkyProfile/.test(station) && /session-only visual style/i.test(station) && !/updateCityPlayPreferences\(\{[^}]*openSky/i.test(station), 'City settings explain and apply a current-session visual style without saving it');
  check('suite-and-command-registered', /w574-open-sky-visual-profiles\.test\.mjs/.test(runner) && typeof packageJson.scripts?.['qa:w574-open-sky-visual-profiles'] === 'string' && typeof packageJson.scripts?.['verify:w555a-w574-source'] === 'string', 'W574 test, gate, QA command, and cumulative verifier are registered');

  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w574.open-sky-visual-profiles-gate.v1',
    wave: 'W574',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: freeze(checks),
    failures: freeze(failed.map((entry) => entry.id)),
    limitations: freeze([
      'No device clock, location, weather service, forecast, calendar, countdown, live event, tracking, or telemetry is added.',
      'No microphone, speech, audio start, provider request, private-data read, route action, background task, or autonomous work is added.',
      'No remote asset, stream, binary art loader, storage, payment, entitlement, ownership, reward, or commercial claim is added.',
      'No browser visual review, physical-device performance proof, preview deployment, or production deployment is claimed.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w574-open-sky-visual-profiles-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW574OpenSkyVisualProfiles();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

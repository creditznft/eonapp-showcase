#!/usr/bin/env node
/** W553 source gate: explicit landmark selection, local guide/focus, and second-click route review. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => existsSync(path.join(root, relative));

export function inspectW553EonUniverseInteractionFoundation({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    assert.equal(Boolean(condition), true, `${id}: ${detail}`);
  };
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const styles = read('assets/css/eon-city-play.css');
  check('required-files', [
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'assets/css/eon-city-play.css',
    'tests/unit/w553-eon-universe-interaction-foundation.test.mjs'
  ].every(exists), 'renderer, station, styles and test exist');
  check('five-visible-pick-targets', /createLandmarkInteractionRuntime/.test(renderer) && /eon-universe-landmark-interaction/.test(renderer) && /pickAt\(x, y\)/.test(renderer), 'five finite in-world beacon/ring targets can be selected');
  check('explicit-local-guide-and-focus', /guideToLandmark\(landmarkId/.test(renderer) && /focusLandmark\(landmarkId/.test(renderer) && /opensRoute: false/.test(renderer), 'guide and focus are explicit local City movement only');
  check('station-renders-visible-choice-card', /data-eon-play-landmark-panel/.test(station) && /data-eon-play-landmark-enter/.test(station) && /data-eon-play-landmark-quick-open/.test(station) && /data-eon-play-landmark-inspect/.test(station), 'selected landmarks show Enter, Quick Open and Inspect choices');
  check('quick-open-remains-review-first', /requestInteraction = \(source = 'ui', landmarkOverride = null\)/.test(station) && /renderPreparedActionReview/.test(station) && !/location\.href\s*=/.test(station), 'quick-open still creates a visible review rather than an automatic route');
  check('normal-entry-hud-is-clearer', /data-eon-play-objective-panel/.test(station) && /directEntry \? ' hidden'/.test(station) && /\.eon-play-landmark-panel\{/.test(styles), 'direct entry hides the first-route card until a landmark is actually nearby');
  const rendererInteractionSlice = renderer.slice(renderer.indexOf('function createLandmarkInteractionRuntime'), renderer.indexOf('function cityBootError'));
  const stationInteractionSlice = station.slice(station.indexOf('const renderLandmarkPanel'), station.indexOf('renderDistrictCard ='));
  check('no-commerce-or-network-activation', !/fetch\s*\(|startPlatformOAuth|uploadPlatformContent|schedulePost|payment|wallet|loot|reward/i.test(`${rendererInteractionSlice}\n${stationInteractionSlice}`), 'the new landmark interaction code does not activate network, payment, reward or social-publishing actions');
  const report = Object.freeze({ schema: 'eon.city.w553.interaction-foundation.gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), browserEvidenceRequired: true, deviceEvidenceRequired: true });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w553-eon-universe-interaction-foundation-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW553EonUniverseInteractionFoundation({ writeArtifact: true });
  process.stdout.write(`W553 EON Universe interaction foundation passed (${report.checkCount}/${report.checkCount}). Source proof only.\n`);
}

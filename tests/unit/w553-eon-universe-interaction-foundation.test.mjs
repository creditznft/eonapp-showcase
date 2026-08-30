import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW553EonUniverseInteractionFoundation } from '../../scripts/w553-eon-universe-interaction-foundation-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

test('W553 exposes explicit landmark selection plus local guide and focus operations', () => {
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(renderer, /createLandmarkInteractionRuntime/);
  assert.match(renderer, /onLandmarkSelect/);
  assert.match(renderer, /guideToLandmark\(landmarkId/);
  assert.match(renderer, /focusLandmark\(landmarkId/);
  assert.match(renderer, /eon-universe-landmark-interaction/);
});

test('W553 keeps landmark quick-open behind the existing prepared route review', () => {
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /data-eon-play-landmark-panel/);
  assert.match(station, /requestInteraction = \(source = 'ui', landmarkOverride = null\)/);
  assert.match(station, /prepareCityPlayAction\(landmark\.id\)/);
  assert.doesNotMatch(station, /location\.href\s*=/);
});

test('W553 source gate preserves local-only, evidence-pending boundaries', () => {
  const report = inspectW553EonUniverseInteractionFoundation({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 7);
  assert.equal(report.browserEvidenceRequired, true);
  assert.equal(report.deviceEvidenceRequired, true);
});

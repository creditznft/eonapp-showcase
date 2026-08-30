import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_PREVIEW_EVIDENCE_SCHEMA,
  CITY_PREVIEW_EVIDENCE_STORAGE_KEY,
  CITY_PREVIEW_EVENTS,
  CITY_PREVIEW_TASKS,
  buildCityPreviewExport,
  createCityPreviewSession,
  downloadCityPreviewEvidence,
  isCityPreviewEvidenceMode,
  recordCityPreviewEvent,
  recordCityPreviewFrame,
  recordCityPreviewTask,
  saveCityPreviewSession
} from '../../assets/js/city/city-preview-evidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

function createSession(nowValue = 1_000) {
  return createCityPreviewSession({
    capability: { isMobile: true, webgl: true, lowTier: false, reducedMotion: false, saveData: false, recommendedQuality: 'balanced', cores: 8, memoryGb: 6 },
    quality: 'balanced',
    environment: { touch: true, fullscreenSupported: true, orientationLockSupported: false, screenWidth: 1920, screenHeight: 1080 },
    now: () => nowValue,
    random: () => 0.25
  });
}

test('W259 preview mode is explicit and cannot be enabled by lookalike query values', () => {
  assert.equal(isCityPreviewEvidenceMode('?preview=1'), true);
  assert.equal(isCityPreviewEvidenceMode('?preview=true'), false);
  assert.equal(isCityPreviewEvidenceMode('?preview=01'), false);
  assert.equal(isCityPreviewEvidenceMode('?mode=preview'), false);
  assert.equal(isCityPreviewEvidenceMode(''), false);
});

test('W259 creates a bounded local-only session without account, chat, Vault, wallet or provider data', () => {
  const session = createSession();
  assert.equal(session.schema, CITY_PREVIEW_EVIDENCE_SCHEMA);
  assert.equal(session.localOnly, true);
  assert.equal(session.remoteTelemetry, false);
  assert.equal(session.device.resolutionBucket, 'regular');
  assert.equal(session.device.orientationAtStart, 'landscape-or-square');
  assert.equal(session.events.length, 0);
  assert.equal(session.tasks.length, 0);
  const serialized = JSON.stringify(session);
  assert.doesNotMatch(serialized, /userAgent|chat|vault|secret|api[_ -]?key|seed phrase|wallet|provider|endpoint|account/i);
});

test('W259 accepts only finite events and tasks, de-duplicates task status and records bounded frames', () => {
  let session = createSession();
  const invalidEvent = recordCityPreviewEvent(session, 'surprise-telemetry', { now: () => 2_000 });
  assert.equal(invalidEvent.ok, false);
  const invalidTask = recordCityPreviewTask(session, 'collect-wallet', { now: () => 2_000 });
  assert.equal(invalidTask.ok, false);
  const event = recordCityPreviewEvent(session, 'renderer-ready', { result: 'pass', now: () => 2_000 });
  assert.equal(event.ok, true);
  session = event.session;
  session = recordCityPreviewTask(session, 'movement-controls', { result: 'observe', now: () => 2_001 }).session;
  session = recordCityPreviewTask(session, 'movement-controls', { result: 'pass', now: () => 2_002 }).session;
  assert.equal(session.events[0].type, 'renderer-ready');
  assert.deepEqual(session.tasks, [{ type: 'movement-controls', result: 'pass', at: new Date(2_002).toISOString() }]);
  const framed = recordCityPreviewFrame(session, { frameSamples: -8, averageFrameMs: 9999, minFrameMs: 12, maxFrameMs: 26, fps: 70, activeMeshes: 18, activeLights: 4, contextLost: false, performanceGovernor: { state: 'stable' } }, { now: () => 2_003 });
  assert.equal(framed.ok, true);
  assert.equal(framed.session.finalFrame.frameSamples, 0);
  assert.equal(framed.session.finalFrame.averageFrameMs, 1000);
  assert.equal(framed.session.finalFrame.performanceGovernor, 'stable');
  assert.deepEqual(CITY_PREVIEW_EVENTS.includes('renderer-ready'), true);
  assert.deepEqual(CITY_PREVIEW_TASKS.includes('movement-controls'), true);
});

test('W259 saves at most six local sessions and export is redacted JSON generated only by explicit action', () => {
  const storage = memoryStorage();
  let last = null;
  for (let index = 0; index < 7; index += 1) {
    last = createSession(3_000 + index);
    assert.equal(saveCityPreviewSession(last, storage).ok, true);
  }
  const stored = JSON.parse(storage.getItem(CITY_PREVIEW_EVIDENCE_STORAGE_KEY));
  assert.equal(stored.length, 6);
  assert.equal(stored.some((entry) => entry.id === last.id), true);
  const exportText = buildCityPreviewExport(last);
  assert.match(exportText, new RegExp(CITY_PREVIEW_EVIDENCE_SCHEMA.replaceAll('.', '\\.'), 'u'));
  assert.doesNotMatch(exportText, /userAgent|chat|vault|secret|wallet|provider|endpoint|token|reward/i);

  const events = [];
  const fakeDocument = {
    body: { appendChild(node) { events.push(['append', node]); } },
    createElement() {
      return { hidden: false, click() { events.push(['click']); }, remove() { events.push(['remove']); } };
    }
  };
  const fakeUrl = { createObjectURL() { events.push(['create-url']); return 'blob:local'; }, revokeObjectURL() { events.push(['revoke-url']); } };
  assert.equal(downloadCityPreviewEvidence(last, fakeDocument, fakeUrl), true);
  assert.equal(events.some(([type]) => type === 'click'), true);
});

test('W259 wires a local preview drawer into only the explicit City Play preview path', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const module = read('assets/js/city/city-preview-evidence.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /isCityPreviewEvidenceMode/);
  assert.match(station, /previewEvidence: isCityPreviewEvidenceMode/);
  assert.match(station, /data-eon-play-open-preview/);
  assert.match(station, /data-eon-preview-export/);
  assert.match(station, /mission-returned/);
  assert.match(station, /context-loss-fallback/);
  assert.match(station, /querySelectorAll\('\[data-eon-play-exit-city\]'\)/);
  assert.match(station, /W259 · local preview evidence/);
  assert.match(module, /CITY_PREVIEW_EVIDENCE_SCHEMA/);
  assert.match(module, /remoteTelemetry: false/);
  assert.match(module, /downloadCityPreviewEvidence/);
  assert.doesNotMatch(`${station}\n${module}`, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/);
  assert.match(css, /eon-play-preview-panel/);
  assert.match(css, /eon-play-preview-tasks/);
  assert.match(css, /min-height:3rem/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonCityL95WorldPerformanceLedger } from '../../assets/js/city/l95/eon-city-l95-world-performance-ledger.js';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT90 world performance ledger owns no timer/render/network authority and never infers network duplicate PASS', () => {
  let at = 100;
  const ledger = createEonCityL95WorldPerformanceLedger({ now: () => at });
  const snapshot = ledger.getSnapshot();
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.persistence, 'memory-only');
  assert.equal(snapshot.ownsTimer, false);
  assert.equal(snapshot.ownsRenderLoop, false);
  assert.equal(snapshot.performsNetworkRequests, false);
  assert.equal(snapshot.proofBoundary.headedBrowserNetworkWaterfallRequired, true);
  assert.equal(snapshot.proofBoundary.duplicateNetworkRequestPassNeverInferred, true);
});

test('RT90 world performance ledger records entry -> first frame -> existing fps sample -> return', () => {
  let at = 1000;
  const ledger = createEonCityL95WorldPerformanceLedger({ now: () => at });
  assert.equal(ledger.begin({ worldRegionId: 'my-frontier', reason: 'direct-entry', assetSnapshot: { requested: 12, queued: 12 } }).ok, true);
  at = 1125;
  assert.equal(ledger.recordFirstPlayableFrame({ worldRegionId: 'my-frontier', assetSnapshot: { requested: 12, presented: 2, queued: 8, loading: 2 } }).ok, true);
  at = 2100;
  assert.equal(ledger.recordFpsSample({ worldRegionId: 'my-frontier', fps: 58, engineFps: 59, sampleMs: 1000, frames: 58, samplePhase: 'stable-session', hardwareScalingLevel: 1 }).ok, true);
  at = 3600;
  const finished = ledger.finish({ worldRegionId: 'my-frontier', reason: 'return-to-command-hub', assetSnapshot: { presented: 7, pending: 0 } });
  assert.equal(finished.ok, true);
  assert.equal(finished.session.firstPlayableFrameMs, 125);
  assert.equal(finished.session.fpsSamples.length, 1);
  assert.equal(finished.session.assetSnapshots.length, 3);
  assert.equal(finished.session.network.duplicateRequestCount, null);
  assert.equal(finished.session.network.noDuplicateRequestPassClaimed, false);
});

test('RT90 world switch closes the previous session and counts re-entry independently', () => {
  let at = 0;
  const ledger = createEonCityL95WorldPerformanceLedger({ now: () => at });
  ledger.begin({ worldRegionId: 'signal-frontier' });
  at = 10; ledger.recordFirstPlayableFrame({ worldRegionId: 'signal-frontier' });
  at = 100; ledger.begin({ worldRegionId: 'storm-sector' });
  at = 120; ledger.recordFirstPlayableFrame({ worldRegionId: 'storm-sector' });
  at = 200; ledger.finish({ worldRegionId: 'storm-sector' });
  at = 300; ledger.begin({ worldRegionId: 'signal-frontier' });
  const snapshot = ledger.getSnapshot();
  assert.equal(snapshot.completedSessions.length, 2);
  assert.equal(snapshot.completedSessions[0].worldRegionId, 'signal-frontier');
  assert.equal(snapshot.completedSessions[0].exitReason, 'world-switch:signal-frontier->storm-sector');
  assert.equal(snapshot.activeSession.worldRegionId, 'signal-frontier');
  assert.equal(snapshot.activeSession.entryOrdinal, 2);
});

test('RT90 performance ledger keeps samples bounded', () => {
  let at = 0;
  const ledger = createEonCityL95WorldPerformanceLedger({ now: () => at });
  ledger.begin({ worldRegionId: 'storm-sector' });
  for (let index = 0; index < 30; index += 1) {
    at += 1000;
    ledger.recordFpsSample({ worldRegionId: 'storm-sector', fps: 60 - (index % 3), engineFps: 60, sampleMs: 1000, frames: 60, samplePhase: 'stable-session' });
  }
  assert.equal(ledger.getSnapshot().activeSession.fpsSamples.length, 18);
});

test('W731 feeds instrumentation only from existing entry/render/fps/return owners', () => {
  assert.match(runtimeSource, /createEonCityL95WorldPerformanceLedger\(\{ now \}\)/);
  assert.match(runtimeSource, /worldPerformanceLedger\.recordFirstPlayableFrame\(\{ worldRegionId: observedWorldRegionId/);
  assert.match(runtimeSource, /worldPerformanceLedger\.recordFpsSample\(lastFpsSample\)/);
  assert.match(runtimeSource, /finishObservedWorldPerformanceSession\(returningWorldPerformanceRegionId, 'return-to-command-hub'\)/);
  assert.doesNotMatch(runtimeSource, /setInterval\([^\n]*worldPerformance/i);
  assert.doesNotMatch(runtimeSource, /requestAnimationFrame\([^\n]*worldPerformance/i);
});

test('W731 instruments all three Open World entry authorities and exposes bounded local evidence', () => {
  assert.match(runtimeSource, /beginObservedWorldPerformanceSession\('signal-frontier', 'direct-signal-entry'\)/);
  assert.match(runtimeSource, /beginObservedWorldPerformanceSession\('storm-sector', 'storm-sector-transition-complete'\)/);
  assert.match(runtimeSource, /beginObservedWorldPerformanceSession\('my-frontier', 'direct-my-frontier-entry'\)/);
  assert.match(runtimeSource, /getWorldPerformanceObservation\(\) \{ return worldPerformanceLedger\.getSnapshot\(\); \}/);
  assert.match(runtimeSource, /worldPerformance: worldPerformanceLedger\.getSnapshot\(\)/);
});

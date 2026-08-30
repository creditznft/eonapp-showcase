import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonCityL95WorldPerformanceLedger } from '../../assets/js/city/l95/eon-city-l95-world-performance-ledger.js';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const myFrontierRenderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
const stormPresenter = fs.readFileSync(new URL('../../assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js', import.meta.url), 'utf8');
const streamingPolicy = fs.readFileSync(new URL('../../assets/js/city/l95/eon-city-l95-world-streaming-policy.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

test('RT90 red-team: Signal -> Storm -> My Frontier retires the previous presentation before ownership changes', () => {
  const myEntry = between(runtime, '    enterMyFrontier({ explicitUserAction = false } = {}) {', '    enterStormSector({ explicitUserAction = false } = {}) {');
  const stormSuspend = myEntry.indexOf("reason: 'world-switch-my-frontier'");
  const regionChange = myEntry.indexOf("expanseActiveRegionId = 'my-frontier'");
  assert.ok(stormSuspend >= 0 && regionChange > stormSuspend, 'Storm must be suspended before My Frontier becomes authoritative');

  const stormTransition = between(runtime, "          if (transition.type === 'enter-storm-sector') {", "          } else if (transition.type === 'return-signal-frontier') {");
  const signalDeactivate = stormTransition.indexOf('expanseGateway?.deactivate?.()');
  const stormRegion = stormTransition.indexOf("expanseActiveRegionId = 'storm-sector'");
  assert.ok(signalDeactivate >= 0 && stormRegion > signalDeactivate, 'Signal presentation must retire before Storm owns the region id');
});

test('RT90 red-team: My Frontier -> Signal/Storm clears local streaming ownership and never reuses stale focus', () => {
  assert.match(myFrontierRenderer, /deactivate\(\)[\s\S]*streamingFocus = null;[\s\S]*lastStreamingFocusAt = -Infinity/);
  assert.match(myFrontierRenderer, /setStreamingFocus\?\.\(null, \{ radius: 0 \}\)/);
  assert.match(myFrontierRenderer, /active && unlocked && streamingFocus\?\.valid === true[\s\S]*my-frontier-awaiting-streaming-focus/);
  assert.match(runtime, /enterSignalFrontier[\s\S]*expanseMyFrontierRenderer\?\.deactivate\?\.\(\);[\s\S]*expanseActiveRegionId = 'signal-frontier'/);
  const stormEntry = between(runtime, '    enterStormSector({ explicitUserAction = false } = {}) {', '    reviewExpanseEntry(');
  assert.match(stormEntry, /reconcileMountedWorldAuthority\('storm-sector-entry'\)/);
  const stormTransition = between(runtime, "          if (transition.type === 'enter-storm-sector') {", "          } else if (transition.type === 'return-signal-frontier') {");
  assert.match(stormTransition, /expanseMyFrontierRenderer\?\.deactivate\?\.\(\)/);
});

test('RT90 red-team: Return -> Hub retires every world-specific owner before restoring Hub UI', () => {
  const block = between(runtime, '    returnFromExpanse({ explicitUserAction = false } = {}) {', '    getExplorationPose()');
  assert.match(block, /expanseMyFrontierRenderer\?\.deactivate\?\.\(\)/);
  assert.match(block, /expanseStormSectorPresenter\?\.suspend\?\.\(\)/);
  assert.match(block, /expanseGateway\.deactivate\(\)/);
  assert.match(block, /expanseAudio\.suspend\('return-to-command-hub'\)/);
  assert.match(block, /expanseVisuals\.deactivate\(\)/);
  const worldTeardown = block.indexOf('expanseGateway.deactivate()');
  const hubUi = block.indexOf("ui?.setWorldMode?.('COMMAND_HUB')");
  assert.ok(worldTeardown >= 0 && hubUi > worldTeardown, 'world teardown must precede Hub UI ownership');
  const overlayReset = block.indexOf("expanseUiOverlay.resetWorldPresentation?.({ reason: 'return-to-command-hub' })");
  assert.ok(overlayReset >= 0 && hubUi > overlayReset, 'world overlay reset must precede Hub UI ownership');
});

test('RT90 red-team: performance ledger closes the prior world on every switch and bounds repeated re-entry history', () => {
  let clock = 0;
  const ledger = createEonCityL95WorldPerformanceLedger({ now: () => clock });
  for (const id of ['signal-frontier', 'storm-sector', 'my-frontier', 'signal-frontier', 'storm-sector', 'my-frontier']) {
    clock += 10;
    const begun = ledger.begin({ worldRegionId: id, engineCount: 1, sceneCount: 1, renderLoopOwnerCount: 1 });
    assert.equal(begun.ok, true);
    clock += 5;
    assert.equal(ledger.recordFirstPlayableFrame({ worldRegionId: id }).ok, true);
  }
  clock += 10;
  assert.equal(ledger.finish({ worldRegionId: 'my-frontier', reason: 'return-to-command-hub' }).ok, true);
  const snapshot = ledger.getSnapshot();
  assert.equal(snapshot.activeSession, null);
  assert.equal(snapshot.completedSessions.length, 6);
  assert.deepEqual(snapshot.entryOrdinals, { 'signal-frontier': 2, 'storm-sector': 2, 'my-frontier': 2 });
  assert.ok(snapshot.completedSessions.every((entry) => entry.engineCount === 1 && entry.sceneCount === 1 && entry.renderLoopOwnerCount === 1));
});

test('RT90 red-team: scalable asset streaming owns no autonomous loop and Storm suspension cannot attach hidden in-flight heroes', () => {
  assert.doesNotMatch(streamingPolicy, /setInterval\(|setTimeout\(|requestAnimationFrame\(/);
  assert.doesNotMatch(stormPresenter, /setInterval\(|requestAnimationFrame\(/);
  assert.match(stormPresenter, /if \(disposed \|\| revisions\.get\(heroId\) !== revision \|\| !active\) \{[\s\S]*container\.dispose\?\.\(\)/);
  assert.match(stormPresenter, /suspend\(\)[\s\S]*active = false/);
});

test('RT90 red-team: the canonical runtime still owns exactly one Babylon render-loop registration', () => {
  const registrations = runtime.match(/runRenderLoop\s*\(/g) || [];
  assert.equal(registrations.length, 1);
  assert.match(runtime, /engine\.runRenderLoop\(/);
});

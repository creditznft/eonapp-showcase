import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W759_ATTACHMENT_PRESENTATION_SCHEMA,
  computeEonCityW759GroundCorrection,
  computeEonCityW759TargetScale,
  evaluateEonCityW759AttachmentPresentation
} from '../../assets/js/city/w759/eon-city-w759-attachment-presentation.js';
import { resolveEonCityQualityAuthority } from '../../assets/js/city/eon-city-quality-authority.js';
import { createEonCityW731MovementRenderRecovery } from '../../assets/js/city/w731/eon-city-w731-movement-render-recovery.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const location = (hostname, search = '') => ({ hostname, search });

test('W759R1 has one strict, truthful certification-quality authority', () => {
  for (const hostname of ['localhost', '127.0.0.1', 'review.eonapp-ch.pages.dev']) {
    const authority = resolveEonCityQualityAuthority({
      locationRef: location(hostname, '?eon-city-certification=1&eon-city-quality=cinematic'),
      detectedQuality: ' Lite ',
      deviceProfile: { gpuRenderer: 'Google SwiftShader' }
    });
    assert.deepEqual(authority, {
      detected: 'lite', requested: 'cinematic', effective: 'cinematic', source: 'certification-override',
      overrideAllowed: true, overrideAccepted: true, rejectionReason: null, hostname, renderer: 'Google SwiftShader'
    });
  }
  for (const hostname of ['eonapp-ch.pages.dev', 'eonapp.ch', 'www.eonapp.ch', 'unrelated-project.pages.dev']) {
    const authority = resolveEonCityQualityAuthority({ locationRef: location(hostname, '?eon-city-certification=1&eon-city-quality=cinematic'), detectedQuality: 'balanced' });
    assert.equal(authority.effective, 'balanced');
    assert.equal(authority.overrideAccepted, false);
    assert.equal(authority.rejectionReason, 'host-not-eligible');
    assert.equal(authority.requested, 'cinematic');
  }
  const missingFlag = resolveEonCityQualityAuthority({ locationRef: location('localhost', '?eon-city-quality=cinematic'), detectedQuality: 'lite' });
  assert.equal(missingFlag.rejectionReason, 'certification-flag-required');
  const missingQuality = resolveEonCityQualityAuthority({ locationRef: location('localhost', '?eon-city-certification=1'), detectedQuality: 'lite' });
  assert.equal(missingQuality.rejectionReason, 'quality-required');
  const high = resolveEonCityQualityAuthority({ locationRef: location('localhost', '?eon-city-certification=1&eon-city-quality=high'), detectedQuality: 'lite' });
  assert.deepEqual({ requested: high.requested, effective: high.effective, rejectionReason: high.rejectionReason }, { requested: 'high', effective: 'lite', rejectionReason: 'unsupported-quality' });
});

test('W759R1 shares quality authority from both entries through W731 and the actual loader summary', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const legacy = read('assets/js/eon-city-play-station.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(access, /import \{ resolveEonCityQualityAuthority \} from '\.\/eon-city-quality-authority\.js'/);
  assert.match(legacy, /import \{ resolveEonCityQualityAuthority \} from '\.\/city\/eon-city-quality-authority\.js'/);
  assert.doesNotMatch(legacy, /host\.endsWith\('\.pages\.dev'\)/);
  assert.match(access, /quality: qualityAuthority\.effective/);
  assert.match(runtime, /quality: resolvedQuality,\s*qualityAuthority: resolvedQualityAuthority/);
  assert.match(loader, /qualityAuthority = null/);
  assert.match(loader, /qualityAuthority: normalizedAuthority/);
  assert.match(loader, /budget: freeze\(\{ \.\.\.budget, name:/);
  assert.match(runtime, /const assets = localAssetRuntime\?\.getSummary\?\.\(\) \|\| null/);
  assert.match(runtime, /qualityHandshake/);
  assert.match(runtime, /runtimeToLoaderPass/);
});

test('W759R1 removes the 0.01 scale floor that inflated every audited authored asset', () => {
  const player = computeEonCityW759TargetScale({ targetHeight: 1.88, sourceHeight: 655.3399853520095 });
  assert.equal(player.ok, true);
  assert.ok(Math.abs(player.scale - 0.0028687399548650706) < 1e-12);
  assert.equal(player.clamped, false);
  assert.ok(player.scale < 0.01);

  const nexus = computeEonCityW759TargetScale({ targetHeight: 4.1, sourceHeight: 62222.86081665754 });
  assert.equal(nexus.ok, true);
  assert.ok(Math.abs(nexus.scale - 0.00006589218088317787) < 1e-15);
  assert.equal(nexus.clamped, false);
  assert.ok(nexus.scale < 0.0001);

  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.doesNotMatch(loader, /Math\.min\(20,\s*Math\.max\(0\.01/);
  assert.match(loader, /computeEonCityW759TargetScale/);
  assert.match(loader, /wrapper\.scaling\.setAll\(targetScale\.scale\)/);
});

test('W759R1 grounds authored assets in world space relative to elevated anchors', () => {
  const ground = computeEonCityW759GroundCorrection({ currentWorldMinY: -2, anchorWorldY: 0, positionY: 0 });
  assert.deepEqual({ ok: ground.ok, correctionY: ground.correctionY, desiredWorldGroundY: ground.desiredWorldGroundY }, { ok: true, correctionY: 2, desiredWorldGroundY: 0 });
  const eonbot = computeEonCityW759GroundCorrection({ currentWorldMinY: 0.15, anchorWorldY: 0.85, positionY: 0 });
  assert.ok(Math.abs(eonbot.correctionY - 0.7) < 1e-12);
  assert.equal(eonbot.desiredWorldGroundY, 0.85);
  const offset = computeEonCityW759GroundCorrection({ currentWorldMinY: 0.15, anchorWorldY: 0.85, positionY: 0.1 });
  assert.equal(offset.desiredWorldGroundY, 0.95);
  assert.equal(computeEonCityW759GroundCorrection({ currentWorldMinY: Number.NaN, anchorWorldY: 0.85 }).ok, false);
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(loader, /computeEonCityW759GroundCorrection/);
  assert.doesNotMatch(loader, /wrapper\.position\.y -= bounds\.min\.y/);
});

test('W759R1 requires post-attachment bounds, enabled meshes and visible meshes before fallback retirement', () => {
  const ready = evaluateEonCityW759AttachmentPresentation({
    targetHeight: 1.88,
    bounds: { min: { x: -0.4, y: 0, z: -0.25 }, max: { x: 0.4, y: 1.88, z: 0.25 }, size: { x: 0.8, y: 1.88, z: 0.5 } },
    wrapperEnabled: true,
    renderableMeshes: 3,
    enabledMeshes: 3,
    visibleMeshes: 3
  });
  assert.equal(ready.schema, EON_CITY_W759_ATTACHMENT_PRESENTATION_SCHEMA);
  assert.equal(ready.ready, true);

  const undersized = evaluateEonCityW759AttachmentPresentation({
    targetHeight: 1.88,
    bounds: { size: { x: 0.2, y: 0.4, z: 0.2 } },
    wrapperEnabled: true,
    renderableMeshes: 3,
    enabledMeshes: 3,
    visibleMeshes: 3
  });
  assert.equal(undersized.ready, false);
  assert.ok(undersized.reasons.includes('target-height-mismatch'));

  const invisible = evaluateEonCityW759AttachmentPresentation({
    targetHeight: 4.2,
    bounds: { size: { x: 3, y: 4.2, z: 3 } },
    wrapperEnabled: true,
    renderableMeshes: 2,
    enabledMeshes: 2,
    visibleMeshes: 0
  });
  assert.equal(invisible.ready, false);
  assert.ok(invisible.reasons.includes('no-visible-meshes'));

  const misplaced = evaluateEonCityW759AttachmentPresentation({
    targetHeight: 4.2,
    bounds: {
      min: { x: 49, y: 3, z: 49 },
      max: { x: 53, y: 7.2, z: 53 },
      size: { x: 4, y: 4.2, z: 4 },
      center: { x: 51, y: 5.1, z: 51 }
    },
    wrapperEnabled: true,
    renderableMeshes: 2,
    enabledMeshes: 2,
    visibleMeshes: 2,
    expectedAnchor: { x: 10, y: 0, z: 10 },
    maxHorizontalOffset: 8,
    expectedGroundY: 0,
    groundTolerance: 0.5,
    maxWorldRadius: 34
  });
  assert.equal(misplaced.ready, false);
  assert.ok(misplaced.reasons.includes('anchor-offset'));
  assert.ok(misplaced.reasons.includes('ground-offset'));
  assert.ok(misplaced.reasons.includes('outside-world-radius'));
});

test('W759R1 only hides Pathfinder, NPC, building, terminal and discovery fallbacks after the presentation contract passes', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');

  assert.match(runtime, /function isEonCityW759PresentationReady\(loaded\)/);
  assert.match(runtime, /loaded\?\.presentation\?\.ready === true/);
  assert.match(runtime, /const authoredPlayerPresentationReady = isEonCityW759PresentationReady\(playerAsset\);/);
  assert.match(runtime, /if \(authoredPlayerPresentationReady && authoredPlayerAnimationReadiness\.ready === true\) \{[\s\S]{0,260}fallbackPlayer\.root\.setEnabled\(false\)/);
  assert.match(runtime, /if \(isEonCityW759PresentationReady\(loaded\)\) \{[\s\S]{0,260}hideProceduralStructure\(record\)/);
  assert.match(runtime, /if \(isEonCityW759PresentationReady\(loaded\)\) \{[\s\S]{0,220}hideNodes\(record\.terminalFallbackNodes\)/);
  assert.match(runtime, /if \(isEonCityW759PresentationReady\(loaded\) && record\) \{[\s\S]{0,220}hideNodes\(record\.fallbackVisualNodes\)/);
  assert.match(runtime, /if \(isEonCityW759PresentationReady\(loaded\)\) \{[\s\S]{0,220}record\.fallbackNpc\.root\.setEnabled\(false\)/);
  assert.doesNotMatch(runtime, /if \(playerAsset\?\.ok\)/);
  assert.match(loader, /w759-local-asset-presentation-not-ready/);
  assert.match(loader, /presentationReadinessPass/);
  assert.match(loader, /expectedAnchor/);
  assert.match(loader, /expectedGroundY/);
  assert.match(loader, /maxWorldRadius: 34/);
  assert.match(loader, /attachments: residentRecords\.map/);
});

test('W759R1 separates manual pause from workspace pause and makes keyboard blocking diagnosable', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');

  assert.match(runtime, /let manualPaused = false/);
  assert.match(runtime, /setMovementPaused: \(shouldPause\) => \{[\s\S]{0,520}acquireInputLease\('work-surface'[\s\S]{0,260}workSurfaceOpen = acquired\.ok \|\| inputLockManager\.has\('work-surface'\)/);
  assert.match(runtime, /releaseInputLease\('work-surface', 'work-surface-closed'\)/);
  assert.doesNotMatch(runtime, /setMovementPaused: \(shouldPause\) => \{[\s\S]{0,180}paused = Boolean\(shouldPause\)/);
  assert.match(runtime, /isEditableTarget\(event\?\.target\)/);
  assert.match(runtime, /\[role=\"textbox\"\]/);
  assert.match(runtime, /const onKeyUp = \(event\) => \{[\s\S]{0,700}heldKeys\.delete\(keyboardCode\)[\s\S]{0,800}setDirection\(directionName, false, keyboardCode\)/);
  assert.match(runtime, /reconcileWorkspacePause/);
  assert.match(runtime, /setMove\(directionName[\s\S]{0,180}reconcileWorkspacePause\(\)/);
  assert.match(runtime, /setAnalogMove\(vector[\s\S]{0,180}reconcileWorkspacePause\(\)/);
  assert.match(runtime, /const onWindowBlur = \(\) => clearInput\('window-blur'\)/);
  assert.match(runtime, /blockedReason:/);
  assert.match(runtime, /movementFrameCount/);
  assert.match(runtime, /movementDistance/);
  assert.match(runtime, /getW759PresentationDiagnostics/);
  assert.match(runtime, /eon\.city\.w759r1\.presentation-diagnostics\.v1/);
  assert.match(runtime, /fallbackStructureVisualsEnabled/);
  assert.match(runtime, /fallbackTerminalVisualsEnabled/);
  assert.match(runtime, /fallbackNpcEnabled/);
  assert.match(runtime, /workSurfaceHostVisible/);
  assert.match(runtime, /pause\(\) \{ manualPaused = true/);
  assert.match(runtime, /resume\(\) \{ manualPaused = false/);
  assert.match(runtime, /lastRawKeyboardEvent = freeze/);
  assert.match(runtime, /keydownEvents \+= 1/);
  assert.match(runtime, /keyupEvents \+= 1/);
  assert.match(runtime, /renderLoopFrames \+= 1/);
  assert.match(runtime, /movementUpdateCalls \+= 1/);
  assert.match(runtime, /lastRequestedPosition/);
  assert.match(runtime, /lastClampedPosition/);
  assert.match(runtime, /inputDiagnostics: freeze/);
  assert.match(runtime, /renderDiagnostics: freeze/);
  assert.match(runtime, /movementDiagnostics: freeze/);
});

test('W759R1 pins first-run buttons to the selected City palette with visible keyboard focus', () => {
  const css = read('assets/css/eon-city-play.css');
  assert.match(css, /W759R1 - keep first-run controls/);
  assert.match(css, /html\[data-theme="obsidian"\][\s\S]*--eon-city-w759-button-bg/);
  assert.match(css, /html\[data-theme="ember"\][\s\S]*--eon-city-w759-button-bg/);
  assert.match(css, /body\[data-eon-app-page="eoncity"\] \.eon-play-first-run-card button/);
  assert.match(css, /appearance:none/);
  assert.match(css, /background:var\(--eon-city-w759-button-bg\)!important/);
  assert.match(css, /outline:3px solid rgba\(142,244,223,\.86\)/);
  assert.match(css, /@media \(forced-colors:active\)/);
  const browser = read('tests/e2e/w759r1-city-functional-hotfix.spec.ts');
  assert.match(browser, /getW759PresentationDiagnostics/);
  assert.match(browser, /stationWorldReady/);
  assert.match(browser, /page\.keyboard\.down\('w'\)/);
  assert.match(browser, /page\.keyboard\.down\('ArrowRight'\)/);
  assert.match(browser, /getByRole\('button', \{ name: 'Move forward' \}\)/);
  assert.match(browser, /page\.mouse\.down\(\)/);
  assert.match(browser, /dpadAfter/);
  assert.match(browser, /presentationReadinessPass/);
});

test('W759R1 uses one bounded, shared movement render recovery authority', () => {
  let clock = 1_000;
  let nextTimer = 1;
  const timers = new Map();
  const state = { engine: {}, scene: {}, axisActive: true, documentVisible: true, documentHidden: false, contextLost: false, manualPaused: false, workSurfaceOpen: false, cityMenuOpen: false };
  let restarts = 0;
  const controller = createEonCityW731MovementRenderRecovery({
    now: () => clock,
    setTimer(callback, delay) { const handle = nextTimer++; timers.set(handle, { callback, at: clock + delay }); return handle; },
    clearTimer(handle) { timers.delete(handle); },
    getState: () => state,
    restartRenderLoop: () => { restarts += 1; return true; }
  });
  const advance = (to) => {
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]); clock = due[1].at; due[1].callback();
    }
    clock = to;
  };

  // Healthy render heartbeats never restart the loop, including delayed checks.
  controller.noteRenderCallback(clock);
  controller.noteReliabilityRenderAccepted(clock);
  controller.noteMovementUpdate(clock);
  controller.activate({ source: 'keyboard' });
  clock = 1_100; controller.noteRenderCallback(clock); controller.noteReliabilityRenderAccepted(clock); controller.noteMovementUpdate(clock);
  clock = 1_200; controller.noteRenderCallback(clock); controller.noteReliabilityRenderAccepted(clock); controller.noteMovementUpdate(clock);
  advance(1_220);
  assert.equal(restarts, 0);

  // A stale callback restarts the existing named loop once, then cooldown
  // prevents repeated stop/run churn during the same hold.
  controller.deactivate();
  clock = 2_000;
  controller.activate({ source: 'dpad' });
  assert.equal(restarts, 1);
  advance(2_220);
  assert.equal(restarts, 1);

  // A new aggregate input after cooldown may recover a later genuine stall.
  controller.deactivate();
  clock = 2_300;
  controller.activate({ source: 'setMove' });
  assert.equal(restarts, 2);

  // All shared input sources activate through the same bounded controller.
  for (const source of ['keyboard', 'dpad', 'setMove', 'analog']) {
    controller.deactivate();
    clock += 300;
    controller.activate({ source });
    assert.match(controller.getSnapshot().renderLoopRestartReason, new RegExp(`movement-activated:${source}`));
  }

  // Valid lifecycle blocks never restart rendering merely to bypass a pause.
  for (const blocked of ['documentHidden', 'contextLost', 'manualPaused', 'workSurfaceOpen', 'cityMenuOpen']) {
    controller.deactivate();
    state[blocked] = true;
    clock += 300;
    const before = restarts;
    controller.activate({ source: 'keyboard' });
    advance(clock + 240);
    assert.equal(restarts, before, blocked);
    state[blocked] = false;
  }

  controller.deactivate();
  assert.equal(controller.getSnapshot().watchdogScheduled, false);
  controller.activate({ source: 'analog' });
  controller.destroy();
  assert.equal(timers.size, 0);
  assert.doesNotThrow(() => JSON.stringify(controller.getSnapshot()));
  assert.equal(controller.getSnapshot().stableRenderCallback, true);
});

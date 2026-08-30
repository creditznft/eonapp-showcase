import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_NEXUS_W708_MIN_TARGET_PX,
  getEonNexusW708ResponsiveInteractionTruth,
  interpretEonNexusW708KeyboardInput,
  resolveEonNexusW708CapturePolicy,
  resolveEonNexusW708ResponsiveLayout
} from '../../assets/js/nexus/w708/eon-nexus-w708-responsive-interaction.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W708 auto-fits compact, full, split and in-world layouts without changing work state', () => {
  assert.equal(resolveEonNexusW708ResponsiveLayout({ width: 390, height: 844 }).mode, 'compact');
  assert.equal(resolveEonNexusW708ResponsiveLayout({ width: 820, height: 900 }).mode, 'full');
  assert.equal(resolveEonNexusW708ResponsiveLayout({ width: 1440, height: 900 }).mode, 'split');
  assert.equal(resolveEonNexusW708ResponsiveLayout({ width: 1440, height: 900, embeddedInWorld: true }).mode, 'in-world');
});

test('W708 keeps only three persistent actions and moves advanced controls into More', () => {
  for (const mode of ['compact', 'split', 'full', 'in-world']) {
    const layout = resolveEonNexusW708ResponsiveLayout({ width: 1400, height: 900, requestedMode: mode });
    assert.equal(layout.primaryActionLimit, 3);
    assert.equal(layout.advancedActionsPlacement, 'contextual-more');
    assert.equal(layout.minimumTargetPx, EON_NEXUS_W708_MIN_TARGET_PX);
  }
});

test('W708 keyboard model provides mouse and touch equivalents plus undo redo reset', () => {
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'ArrowLeft' }).action, 'rotate');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'ArrowUp' }).action, 'zoom');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: '0' }).action, 'reset-view');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'z', ctrlKey: true }).action, 'undo');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'Z', ctrlKey: true, shiftKey: true }).action, 'redo');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: '/', ctrlKey: false }).action, 'focus-command');
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'ArrowLeft' }, { editable: true }).ok, false);
  assert.equal(interpretEonNexusW708KeyboardInput({ key: 'z', ctrlKey: true }, { editable: true }).reason, 'editable-target');
});

test('W708 voice and camera capture require explicit action and camera remains local-only', () => {
  assert.equal(resolveEonNexusW708CapturePolicy({ kind: 'voice', available: true }).reason, 'explicit-user-action-required');
  assert.equal(resolveEonNexusW708CapturePolicy({ kind: 'camera', explicitUserAction: true, available: true, localOnly: false }).reason, 'local-only-camera-required');
  const voice = resolveEonNexusW708CapturePolicy({ kind: 'voice', explicitUserAction: true, available: true });
  const camera = resolveEonNexusW708CapturePolicy({ kind: 'camera', explicitUserAction: true, available: true, localOnly: true });
  assert.equal(voice.ok, true);
  assert.equal(voice.pressToStart, true);
  assert.equal(camera.ok, true);
  assert.equal(camera.cameraFramesUploaded, false);
});

test('W708 live Nexus consumes responsive, keyboard and consent authorities', () => {
  const source = read('assets/js/nexus/eon-nexus-live.js');
  assert.match(source, /resolveEonNexusW708ResponsiveLayout/);
  assert.match(source, /interpretEonNexusW708KeyboardInput/);
  assert.match(source, /resolveEonNexusW708CapturePolicy/);
  assert.match(source, /eonNexusResponsive = 'w708'/);
  assert.match(source, /addEventListener\?\.\('resize', viewportHandler/);
  assert.match(source, /getResponsiveLayout/);
  assert.match(source, /\['compact', 'in-world', 'auto'\]\.includes\(requestedMode\)/);
});

test('W708 source and public CSS provide 48px targets and compact plus in-world layouts', () => {
  for (const path of ['assets/css/eon-nexus-live.css', 'public/assets/css/eon-nexus-live.css']) {
    const css = read(path);
    assert.match(css, /W708 — responsive auto-fit/);
    assert.match(css, /--eon-nexus-min-target: 48px/);
    assert.match(css, /data-mode='compact'/);
    assert.match(css, /data-mode='in-world'/);
    assert.match(css, /pointer: coarse/);
  }
});

test('W708 truth preserves one state and no automatic capture navigation or AI work', () => {
  const truth = getEonNexusW708ResponsiveInteractionTruth();
  assert.equal(truth.compactSplitFullAndInWorld, true);
  assert.equal(truth.deviceAutoFit, true);
  assert.equal(truth.mouseKeyboardTouchParity, true);
  assert.equal(truth.voicePressToStart, true);
  assert.equal(truth.cameraExplicitConsent, true);
  assert.equal(truth.captureStartsAutomatically, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.secondStateStore, false);
});

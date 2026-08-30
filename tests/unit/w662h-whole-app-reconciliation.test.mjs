import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  bindEonCityOverlayCoordinator,
  getEonCityOverlayCoordinatorTruth
} from '../../assets/js/city/eon-city-overlay-coordinator.js';
import { getEonForgeNexusStageModel, renderEonForgeNexusStage } from '../../assets/js/forge/eon-forge-nexus-stage.js';
import { createCityAdaptiveSoundscape } from '../../assets/js/city/eon-city-adaptive-soundscape.js';

function control(label, onClick = () => {}) {
  return {
    hidden: false,
    disabled: false,
    dataset: label === 'Close' ? { eonPlayCloseTest: '1' } : {},
    textContent: label,
    isConnected: true,
    getAttribute(name) { return name === 'aria-hidden' ? 'false' : name === 'aria-label' ? label : null; },
    focus() { this.focused = true; },
    click() { onClick(); }
  };
}

function panel(documentRef, label, hidden = false) {
  const close = control('Close');
  const first = control(`${label} action`);
  const instance = {
    hidden,
    dataset: {},
    ownerDocument: documentRef,
    children: [first, close],
    getAttribute(name) { return name === 'aria-hidden' ? 'false' : null; },
    hasAttribute() { return false; },
    setAttribute() {},
    querySelectorAll() { return this.children; },
    contains(node) { return this.children.includes(node) || node === this; },
    focus() { this.focused = true; }
  };
  close.click = () => { instance.hidden = true; };
  return instance;
}

test('W662H overlay coordinator owns one visible modal and releases gameplay input', () => {
  const documentRef = {
    activeElement: control('Menu'),
    addEventListener() {},
    defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
  };
  const session = { dataset: {} };
  const canvas = control('City canvas');
  const first = panel(documentRef, 'First', false);
  const second = panel(documentRef, 'Second', true);
  let released = 0;
  const root = {
    ownerDocument: documentRef,
    classList: { toggle() {} },
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll(selector) { return selector.includes('role="dialog"') ? [first, second] : []; },
    querySelector(selector) { if (selector === '.eon-play-session') return session; if (selector.includes('canvas')) return canvas; return null; }
  };
  const controller = bindEonCityOverlayCoordinator(root, { document: documentRef, environment: {}, getRuntime: () => ({ clearInput() { released += 1; } }) });
  assert.equal(controller.ok, true);
  assert.equal(controller.getActivePanel(), first);
  assert.equal(session.dataset.eonCityModalOpen, 'true');
  assert.equal(released > 0, true);
  assert.equal(controller.closeActive(), true);
  controller.sync();
  assert.equal(session.dataset.eonCityModalOpen, 'false');
  controller.dispose();
});

test('W662H overlay truth keeps review-first boundaries explicit', () => {
  assert.deepEqual(getEonCityOverlayCoordinatorTruth(), {
    schema: 'eon.city.overlay-coordinator.w662h.v1',
    oneVisibleModal: true,
    gameplayInputCleared: true,
    focusTrap: true,
    escapeUsesVisibleCloseAction: true,
    focusReturnsToTriggerOrCanvas: true,
    hidesCompetingHudWhileModalOpen: true,
    startsWork: false,
    navigatesAutomatically: false,
    approvesAutomatically: false
  });
});

test('W662H Forge path renders Request through Approval from truthful state only', () => {
  const model = getEonForgeNexusStageModel({
    projectSelected: true,
    fileCount: 4,
    aiStatus: 'proposal-ready',
    proposalReady: true,
    validation: { checked: true, errorCount: 0 },
    previewReady: true
  });
  assert.equal(model.stages.length, 7);
  assert.deepEqual(model.stages.map((stage) => stage.id), ['request', 'plan', 'files', 'generate', 'validate', 'preview', 'approval']);
  assert.equal(model.activeStageId, 'approval');
  assert.equal(model.startsProviderRequest, false);
  assert.match(renderEonForgeNexusStage({ projectSelected: false }), /Request[\s\S]*Plan[\s\S]*Files[\s\S]*Generate[\s\S]*Validate[\s\S]*Preview[\s\S]*Approval/);
});

test('W662H sound level is session-only and never activates audio by itself', () => {
  const controller = createCityAdaptiveSoundscape({ volume: 0.55, environment: {} });
  assert.equal(controller.getSummary().active, false);
  assert.equal(controller.setVolume(0.8), 0.8);
  assert.equal(controller.getSummary().volume, 0.8);
  assert.equal(controller.getSummary().automaticAudio, false);
  controller.dispose();
});

test('W662H active source uses calmer HUD, modal isolation, Forge stages and explicit volume control', () => {
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  const cityCss = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
  const forge = fs.readFileSync(new URL('../../assets/js/forge/eon-forge-quick-build.js', import.meta.url), 'utf8');
  const shellCss = fs.readFileSync(new URL('../../assets/css/eon-app-shell.css', import.meta.url), 'utf8');
  const vaultCss = fs.readFileSync(new URL('../../assets/css/eon-vault-v2.css', import.meta.url), 'utf8');
  assert.match(station, /bindEonCityOverlayCoordinator/);
  assert.match(station, /data-eon-play-settings-volume/);
  assert.doesNotMatch(station.match(/const directHudActions = '([^']+)'/)?.[1] || '', /data-eon-play-open-eonbot/);
  assert.match(cityCss, /data-eon-city-modal-open="true"/);
  assert.match(cityCss, /outline: 3px solid #ffda73/);
  assert.match(forge, /renderEonForgeNexusStage/);
  assert.match(shellCss, /consistent keyboard focus/);
  assert.match(vaultCss, /#provider-check[\s\S]*color-scheme:dark/);
  assert.match(vaultCss, /#provider-check \.eon-vault-field select option\{background:#0f172a;color:#f8fafc\}/);
});

test('W719.13 overlay coordinator discovers Living Nexus dialogs mounted after coordinator startup', () => {
  const documentRef = {
    activeElement: control('City canvas'),
    addEventListener() {},
    defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
  };
  const session = { dataset: {} };
  const canvas = control('City canvas');
  const dialogs = [];
  const root = {
    ownerDocument: documentRef,
    classList: { toggle() {} },
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll(selector) { return selector.includes('role="dialog"') ? dialogs : []; },
    querySelector(selector) { if (selector === '.eon-play-session') return session; if (selector.includes('canvas')) return canvas; return null; }
  };
  const controller = bindEonCityOverlayCoordinator(root, { document: documentRef, environment: {} });
  assert.equal(controller.getActivePanel(), null);
  const livingNexus = panel(documentRef, 'Living Nexus', false);
  dialogs.push(livingNexus);
  controller.sync();
  assert.equal(controller.getActivePanel(), livingNexus);
  assert.equal(session.dataset.eonCityModalOpen, 'true');
  controller.dispose();
});


test('W719.13 one maintained overlay authority suppresses the historical duplicate coordinator', () => {
  const maintained = fs.readFileSync(new URL('../../assets/js/city/eon-city-overlay-coordinator.js', import.meta.url), 'utf8');
  const historical = fs.readFileSync(new URL('../../assets/js/city/w659h/eon-city-w659h-overlay-coordinator.js', import.meta.url), 'utf8');
  assert.match(maintained, /dataset\.eonCityOverlayAuthority = EON_CITY_OVERLAY_COORDINATOR_SCHEMA/);
  assert.match(historical, /never let two coordinators own/);
  assert.match(historical, /root\.dataset\?\.eonCityOverlayAuthority/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W748_DEFAULT_INTERACTIONS,
  EON_CITY_W748_INTERACTION_BINDINGS,
  createEonCityW748InteractionRegistry,
  getEonCityW748StationInteraction,
  validateEonCityW748InteractionRegistry
} from '../../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import {
  EON_CITY_W748_DEFAULT_PRESENTATION,
  createEonCityW748WorkspacePresenter,
  validateEonCityW748WorkspacePresenterContract
} from '../../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { EON_CITY_W731_STATIONS, EON_CITY_W737_DISCOVERIES } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  EON_WORK_SURFACE_CLOSE_EVENT,
  EON_WORK_SURFACE_PRESENTATION_EVENT,
  normalizeEonWorkSurfaceInvocation
} from '../../assets/js/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

class FakeCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

function fakeEnvironment() {
  const target = new EventTarget();
  target.CustomEvent = FakeCustomEvent;
  target.Event = Event;
  target.performance = { now: () => 748.25 };
  target.crypto = { randomUUID: () => '12345678-90ab-cdef-1234-567890abcdef' };
  return target;
}

test('W748 registers every station structure, terminal and authored NPC through one semantic authority', () => {
  const validation = validateEonCityW748InteractionRegistry();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.stationCount, 10);
  assert.equal(validation.stationPartCount, 30);
  assert.equal(validation.discoveryCount, EON_CITY_W737_DISCOVERIES.length);
  assert.equal(validation.supportCount, 9);
  assert.equal(validation.interactionCount, (EON_CITY_W731_STATIONS.length * 3) + EON_CITY_W737_DISCOVERIES.length + 9);

  for (const station of EON_CITY_W731_STATIONS) {
    for (const part of ['structure', 'terminal', 'npc']) {
      const interaction = getEonCityW748StationInteraction(station.id, part);
      assert.ok(interaction, `${station.id}:${part}`);
      assert.equal(interaction.stationId, station.id);
      assert.equal(interaction.primaryAction.kind, 'open');
      assert.equal(interaction.primaryAction.surface, station.surface);
      assert.equal(interaction.primaryAction.presentationMode, 'dock');
      assert.equal(interaction.primaryAction.explicitUserActionRequired, true);
      assert.equal(interaction.primaryAction.automaticNavigation, false);
      assert.ok(interaction.accessibilityLabel.length > 4);
      assert.ok(interaction.truthBoundary.length > 12);
    }
  }
  assert.deepEqual(EON_CITY_W748_INTERACTION_BINDINGS.keyboard, ['KeyE', 'Enter']);
  assert.deepEqual(EON_CITY_W748_INTERACTION_BINDINGS.touch, ['tap-primary', 'tap-inspect']);
});

test('W748 resolves pointer, gaze and proximity through one deterministic selector', () => {
  const registry = createEonCityW748InteractionRegistry();
  assert.equal(registry.getSummary().stationCoverage, 10);
  assert.equal(registry.getSummary().total, EON_CITY_W748_DEFAULT_INTERACTIONS.length);

  const nexus = getEonCityW748StationInteraction('eonbot-nexus');
  const pointer = registry.select({ playerPosition: { x: 99, z: 99 }, pointerId: nexus.id });
  assert.equal(pointer.selected.entry.id, nexus.id);
  assert.equal(pointer.selected.pointed, true);

  const atlas = getEonCityW748StationInteraction('project-atlas');
  const gaze = registry.select({ playerPosition: { x: 99, z: 99 }, gazeId: atlas.id });
  assert.equal(gaze.selected.entry.id, atlas.id);
  assert.equal(gaze.selected.gazed, true);

  const nearby = registry.select({ playerPosition: nexus.position });
  assert.ok(nearby.selected);
  assert.equal(nearby.selected.entry.stationId, 'eonbot-nexus');
});

test('W748 keeps Focus as the normal app default and makes Dock an explicit City presentation', () => {
  assert.equal(normalizeEonWorkSurfaceInvocation({ id: 'projects' }).presentationMode, 'focus');
  const trigger = { nodeType: 1, focus() {} };
  const city = normalizeEonWorkSurfaceInvocation({
    id: 'projects', presentationMode: 'dock', sessionId: 'city-session', trigger,
    context: { cityPresentation: true, allowFocusWorkspace: true }
  });
  assert.equal(city.presentationMode, 'dock');
  assert.equal(city.sessionId, 'city-session');
  assert.equal(city.trigger, trigger);
  assert.equal(city.context.cityPresentation, true);
  assert.equal(EON_CITY_W748_DEFAULT_PRESENTATION, 'dock');
  assert.equal(validateEonCityW748WorkspacePresenterContract().ok, true);
});

test('W748 presenter pauses the City, preserves one session across Dock and Focus, and restores the exact snapshot', () => {
  const environment = fakeEnvironment();
  const snapshot = Object.freeze({
    player: Object.freeze({ x: 4.25, y: 0, z: -7.5, heading: 1.2 }),
    camera: Object.freeze({ alpha: 0.4, beta: 1.1, radius: 13, target: Object.freeze({ x: 4, y: 1.5, z: -6 }) }),
    activeStationId: 'library-vault', activeMissionId: 'mission-library'
  });
  const pauses = [];
  const backgrounds = [];
  const restores = [];
  const returns = [];
  const station = EON_CITY_W731_STATIONS.find((entry) => entry.id === 'project-atlas');
  const presenter = createEonCityW748WorkspacePresenter({
    environment,
    captureWorldState: () => snapshot,
    focusWorldObject: ({ station: focused }) => ({ stationId: focused.id, cameraMode: 'station-focus' }),
    restoreWorldState: (value, meta) => { restores.push({ value, meta }); return { ok: true }; },
    setMovementPaused: (paused, meta) => pauses.push({ paused, mode: meta.mode }),
    setWorldAudioPaused: () => {},
    setBackgroundPresentation: (mode) => backgrounds.push(mode),
    onReturn: (receipt) => returns.push(receipt)
  });

  const opened = presenter.begin({ station, interaction: getEonCityW748StationInteraction(station.id), surface: station.surface });
  assert.equal(opened.ok, true);
  assert.equal(opened.presentationMode, 'dock');
  assert.equal(presenter.getState().active, true);
  assert.equal(presenter.getState().presentationMode, 'dock');
  assert.deepEqual(pauses.at(-1), { paused: true, mode: 'dock' });
  assert.equal(backgrounds.at(-1), 'dock-background');

  environment.dispatchEvent(new FakeCustomEvent(EON_WORK_SURFACE_PRESENTATION_EVENT, {
    detail: { sessionId: opened.sessionId, presentationMode: 'focus' }
  }));
  assert.equal(presenter.getState().presentationMode, 'focus');
  assert.deepEqual(pauses.at(-1), { paused: true, mode: 'focus' });
  assert.equal(backgrounds.at(-1), 'focus-background');

  environment.dispatchEvent(new FakeCustomEvent(EON_WORK_SURFACE_CLOSE_EVENT, {
    detail: { sessionId: opened.sessionId, presentationMode: 'focus' }
  }));
  assert.equal(presenter.getState().active, false);
  assert.deepEqual(pauses.at(-1), { paused: false, mode: 'world' });
  assert.equal(backgrounds.at(-1), 'world');
  assert.equal(restores.length, 1);
  assert.equal(restores[0].value, snapshot);
  assert.equal(returns.length, 1);
  assert.equal(returns[0].source.stationId, station.id);
  assert.equal(returns[0].source.snapshot, snapshot);
  presenter.dispose();
});

test('W748/R03 source keeps one adapter host, responsive City Dock/Sheet modes and exact world restoration', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const presenter = read('assets/js/city/w748/eon-city-w748-workspace-presenter.js');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const workCss = read('assets/css/eon-work-surface.css');
  const cityCss = read('assets/css/eon-city-play.css');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const build = read('scripts/build-production.mjs');

  assert.match(runtime, /createEonCityW748InteractionRegistry/);
  assert.match(runtime, /createEonCityW748WorkspacePresenter/);
  assert.match(runtime, /captureWorldState:[\s\S]*player:[\s\S]*camera: captureCameraPose\(\)/);
  assert.match(runtime, /restoreWorldState:[\s\S]*applyPlayerPose[\s\S]*restoreCameraPose/);
  assert.match(runtime, /setContextualSelection/);
  assert.match(runtime, /selectionRing\?\.setEnabled/);
  assert.match(runtime, /routeChangeOnOpen: false/);
  assert.doesNotMatch(runtime, /surfaceOpenPending|workSurfaceReturnCamera/);

  assert.match(presenter, /eonCityManagedSurfacePresentation === 'sheet'/);
  assert.match(presenter, /presentationMode = .*\? 'sheet' : 'dock'/);
  assert.match(presenter, /allowFocusWorkspace: true/);
  assert.match(presenter, /returnToCity: true/);
  assert.match(presenter, /restoreWorldState, source\.snapshot/);

  assert.match(host, /data-eon-work-surface-presentation/);
  assert.match(host, /Focus workspace/);
  assert.match(host, /Return to City Dock/);
  assert.match(host, /city-presentation-required/);
  assert.match(host, /eon-work-surface-sheet-open/);
  assert.match(host, /same adapter and state/i);
  assert.match(workCss, /orientation:portrait/);
  assert.match(workCss, /orientation:landscape/);
  assert.match(workCss, /width:clamp\(30rem,42vw,40rem\)/);
  assert.match(cityCss, /eon-work-surface-dock-open/);
  assert.match(cityCss, /eon-work-surface-sheet-open/);
  assert.match(cityCss, /eon-work-surface-focus-open/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.equal(publicSw, sw);
  assert.match(build, /eon\.city\.workspace-presenter\.w748\.v1/);
});

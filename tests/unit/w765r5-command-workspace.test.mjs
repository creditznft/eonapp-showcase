import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W765R5_MONITOR_PROFILES,
  EON_CITY_W765R5_STATION_MONITOR_IDS,
  EON_CITY_W765R5_STATION_MONITOR_SCHEMA,
  createEonCityW765R5StationMonitor,
  projectEonCityW765R5StationMonitor,
  resolveEonCityW765R5MonitorPose,
  validateEonCityW765R5MonitorFacing,
  validateEonCityW765R5StationMonitorContract
} from '../../assets/js/city/w765/eon-city-w765r5-station-monitor.js';
import {
  EON_CITY_W750_WALL_LAYOUT,
  createEonCityW750CommandCentre,
  validateEonCityW750WallPresentation
} from '../../assets/js/city/w750/eon-city-w750-command-centre.js';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { getEonCityW649Character } from '../../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { createEonCityW745HeroPresentationDirector } from '../../assets/js/city/w731/eon-city-w745-hero-companion-polish.js';
import { resolveEonCityCameraRelativeMovement } from '../../assets/js/city/eon-city-camera-relative-movement.js';
import { createEonCityW695LocomotionTruthController } from '../../assets/js/city/w695/eon-city-w695-character-motion-truth.js';
import { buildEonCityW754CastPlan, buildEonCityW754NpcSchedulePlan, createEonCityW754NpcScheduleController } from '../../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

class FakeNode {
  constructor(name) {
    this.name = name;
    this.parent = null;
    this.metadata = null;
    this.position = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.position, { x, y, z }) };
    this.rotation = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.rotation, { x, y, z }) };
    this.scaling = { x: 1, y: 1, z: 1, setAll: (value = 1) => Object.assign(this.scaling, { x: value, y: value, z: value }) };
    this.visibility = 1;
    this.enabled = true;
    this.disposed = false;
  }
  setEnabled(value) { this.enabled = Boolean(value); }
  getAbsolutePosition() {
    const parentPosition = this.parent?.getAbsolutePosition?.() || this.parent?.position || { x: 0, y: 0, z: 0 };
    return { x: parentPosition.x + this.position.x, y: parentPosition.y + this.position.y, z: parentPosition.z + this.position.z };
  }
  dispose() { this.disposed = true; }
}
class FakeTransformNode extends FakeNode {}

function createContext() {
  const texts = [];
  return {
    texts,
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left',
    save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {}, strokeRect() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value || '').length * 8 }; },
    fillText(value) { texts.push(String(value || '')); }
  };
}
class FakeDynamicTexture {
  static instances = [];
  constructor(name, size) {
    this.name = name;
    this.size = size;
    this.context = createContext();
    this.updated = 0;
    this.disposed = false;
    FakeDynamicTexture.instances.push(this);
  }
  getContext() { return this.context; }
  getSize() { return this.size; }
  update() { this.updated += 1; }
  dispose() { this.disposed = true; }
}
class FakeMaterial {
  constructor(name) {
    this.name = name;
    this.disposed = false;
    this.emissiveColor = { set() {} };
    this.specularColor = { set() {} };
  }
  dispose() { this.disposed = true; }
}

function createBuilderLog() {
  const nodes = [];
  const make = (kind, name, options = {}) => {
    const node = new FakeNode(name);
    node.kind = kind;
    node.options = options;
    nodes.push(node);
    return node;
  };
  return {
    nodes,
    builder: Object.freeze({
      CreateBox: (name, options) => make('box', name, options),
      CreatePlane: (name, options) => make('plane', name, options),
      CreatePolyhedron: (name, options) => make('polyhedron', name, options)
    })
  };
}

const materials = Object.freeze({
  structure: Object.freeze({ id: 'structure' }), graphite: Object.freeze({ id: 'graphite' }),
  signal: Object.freeze({ id: 'signal' }), cyan: Object.freeze({ id: 'cyan' }), amber: Object.freeze({ id: 'amber' }),
  mint: Object.freeze({ id: 'mint' }), violet: Object.freeze({ id: 'violet' }), magenta: Object.freeze({ id: 'magenta' }),
  warm: Object.freeze({ id: 'warm' })
});

function station(id) {
  const result = EON_CITY_W731_STATIONS.find((entry) => entry.id === id);
  assert.ok(result, `missing station ${id}`);
  return result;
}

test('W765R5 gives all ten productive stations an upright truthful monitor contract and correct workspace action', () => {
  const validation = validateEonCityW765R5StationMonitorContract();
  assert.equal(validation.ok, true, validation.errors.join(' | '));
  assert.deepEqual(EON_CITY_W765R5_STATION_MONITOR_IDS, EON_CITY_W731_STATIONS.map((entry) => entry.id));
  assert.equal(EON_CITY_W765R5_MONITOR_PROFILES['eonbot-nexus'].hero, true);
  assert.ok(EON_CITY_W765R5_MONITOR_PROFILES['eonbot-nexus'].width > EON_CITY_W765R5_MONITOR_PROFILES['share-capture'].width);

  for (const entry of EON_CITY_W731_STATIONS) {
    const profile = EON_CITY_W765R5_MONITOR_PROFILES[entry.id];
    const pose = resolveEonCityW765R5MonitorPose({ station: entry, profile });
    const facing = validateEonCityW765R5MonitorFacing({ worldPosition: pose.worldPosition, yaw: pose.yaw, focusPose: pose.focusPose });
    assert.equal(pose.ok, true, entry.id);
    assert.equal(facing.ok, true, `${entry.id} facing ${facing.dot}`);
    assert.ok(facing.dot >= 0.985);
    const view = projectEonCityW765R5StationMonitor({ station: entry, productiveView: { stations: [] } });
    assert.equal(view.schema, EON_CITY_W765R5_STATION_MONITOR_SCHEMA);
    assert.equal(view.stationId, entry.id);
    assert.equal(view.privateDataRead, false);
    assert.equal(view.automaticExecution, false);
    assert.equal(view.inventedActivity, false);
    assert.ok(view.title.length > 0);
    assert.equal(view.surface, entry.surface, `${entry.id} monitor must preserve its maintained surface`);
    assert.ok(entry.surface.length > 0, `${entry.id} must own a maintained surface`);

    const { builder } = createBuilderLog();
    const opened = [];
    const controller = createEonCityW765R5StationMonitor({
      scene: {}, station: entry, stationRecord: { root: new FakeTransformNode(`${entry.id}-root`) },
      MeshBuilder: builder, TransformNode: FakeTransformNode, DynamicTexture: FakeDynamicTexture, StandardMaterial: FakeMaterial,
      materials, projectionProvider: () => view,
      openSurface: (stationId) => { opened.push(stationId); return { ok: true, surface: entry.surface }; }
    });
    assert.equal(controller.ok, true, `${entry.id} monitor must mount with explicit materials`);
    assert.deepEqual(controller.open('unit'), { ok: true, surface: entry.surface });
    assert.deepEqual(opened, [entry.id]);
    assert.equal(controller.getSummary().surface, entry.surface);
    assert.equal(controller.getSummary().explicitMaterials, true);
    controller.dispose();
  }
});

test('W765R5 station monitor uses thin rails, paints an upright marker, opens once, throttles redraw and disposes owned resources', () => {
  FakeDynamicTexture.instances.length = 0;
  const { builder, nodes } = createBuilderLog();
  const target = station('create-forge');
  let clock = 0;
  let revision = 0;
  const opens = [];
  const controller = createEonCityW765R5StationMonitor({
    scene: {}, station: target, stationRecord: { root: new FakeTransformNode('station-root') },
    MeshBuilder: builder, TransformNode: FakeTransformNode, DynamicTexture: FakeDynamicTexture, StandardMaterial: FakeMaterial,
    materials, now: () => clock,
    projectionProvider: () => projectEonCityW765R5StationMonitor({
      station: target,
      productiveView: { stations: [{ stationId: target.id, state: revision ? 'reviewed' : 'ready', status: revision ? 'Draft changed' : 'Ready', steps: [{ state: 'current', label: revision ? 'Review draft' : 'Start creation' }], outcome: 'A maintained creation result', completionAuthority: 'native receipt' }] }
    }),
    openSurface: (stationId, trigger) => { opens.push({ stationId, trigger }); return { ok: true, surface: target.surface }; }
  });
  assert.equal(controller.ok, true);
  assert.equal(nodes.filter((node) => node.kind === 'box' && /-rail-/.test(node.name)).length, 4);
  assert.equal(nodes.some((node) => node.kind === 'box' && node.name === `w765r5-monitor-${target.id}`), false);
  assert.equal(controller.getSummary().visibleBackingSlab, false);
  assert.equal(controller.getSummary().negativeScale, false);
  assert.equal(controller.getSummary().redrawCount, 1);
  assert.ok(FakeDynamicTexture.instances[0].context.texts.some((text) => text.includes('UPRIGHT')));

  assert.deepEqual(controller.open('keyboard'), { ok: true, surface: 'create' });
  assert.equal(opens.length, 1);
  assert.equal(opens[0].stationId, target.id);

  clock = 500;
  controller.update(clock, { x: 0, y: 2, z: 0 });
  assert.equal(controller.getSummary().redrawCount, 1);
  clock = 1_300;
  controller.update(clock, { x: 0, y: 2, z: 0 });
  assert.equal(controller.getSummary().redrawCount, 1);
  assert.equal(controller.getSummary().skippedRedrawCount, 1);
  clock = 1_310;
  controller.update(clock, { x: 0, y: 2, z: 0 });
  controller.update(clock + 10, { x: 0, y: 2, z: 0 });
  assert.equal(controller.getSummary().skippedRedrawCount, 1, 'unchanged freshness polling must stay throttled instead of running every frame');
  revision = 1;
  clock = 2_600;
  controller.update(clock, { x: 0, y: 2, z: 0 });
  assert.equal(controller.getSummary().redrawCount, 2);
  assert.equal(controller.getSummary().explicitMaterials, true);
  const texture = FakeDynamicTexture.instances[0];
  const root = controller.root;
  controller.dispose();
  assert.equal(texture.disposed, true);
  assert.equal(root.disposed, true);
});

test('W766IR2-C Command Status wall has five dual-face readable monitors without backing slabs', () => {
  FakeDynamicTexture.instances.length = 0;
  const commandStation = station('command-console');
  const presentation = validateEonCityW750WallPresentation({ station: commandStation });
  assert.equal(presentation.ok, true, presentation.errors.join(' | '));
  assert.equal(presentation.wallCount, 5);
  assert.ok(presentation.sideHeightRatios.every((ratio) => ratio >= 0.7 && ratio <= 0.8));
  assert.ok(presentation.minimumFacingDot >= 0.985);
  assert.equal(presentation.visibleBackingSlab, false);
  assert.equal(presentation.negativeScale, false);
  assert.equal(presentation.uprightMarker, true);
  assert.equal(EON_CITY_W750_WALL_LAYOUT.filter((entry) => entry.central).length, 1);

  const { builder, nodes } = createBuilderLog();
  const controller = createEonCityW750CommandCentre({
    scene: {}, stationRecord: { root: new FakeTransformNode('command-root'), station: commandStation },
    MeshBuilder: builder, TransformNode: FakeTransformNode, Vector3: class {}, DynamicTexture: FakeDynamicTexture, StandardMaterial: FakeMaterial,
    materials, environment: new EventTarget(), districtCount: 9
  });
  assert.equal(controller.ok, true);
  const wallScreens = nodes.filter((node) => node.kind === 'plane' && node.name.startsWith('w750-wall-screen-'));
  assert.equal(wallScreens.length, 10);
  assert.equal(wallScreens.filter((node) => node.name.endsWith('-front')).length, 5);
  assert.equal(wallScreens.filter((node) => node.name.endsWith('-rear')).length, 5);
  assert.ok(wallScreens.every((node) => node.options.sideOrientation === 0));
  assert.ok(wallScreens.filter((node) => node.name.endsWith('-front')).every((node) => node.rotation.y === 0));
  assert.ok(wallScreens.filter((node) => node.name.endsWith('-rear')).every((node) => node.rotation.y === Math.PI));
  assert.equal(nodes.filter((node) => node.kind === 'box' && /w750-wall-frame-.+-rail-/.test(node.name)).length, 20);
  assert.equal(nodes.some((node) => node.kind === 'box' && /^w750-wall-frame-(work|review|systems|atlas-transit|agent-theatre)$/.test(node.name)), false);
  const summary = controller.getPresentationSummary();
  assert.equal(summary.ok, true);
  assert.equal(summary.explicitMaterials, true);
  assert.equal(summary.dualReadableFaces, true);
  assert.equal(summary.faceCount, 10);
  assert.equal(summary.frontFaceOnly, true);
  assert.equal(summary.independentTextures, true);
  assert.equal(summary.independentMaterials, true);
  assert.equal(summary.sameWorkspaceInteraction, true);
  assert.equal(summary.asymmetricCalibration, true);
  assert.equal(FakeDynamicTexture.instances.length, 10);
  assert.equal(new Set(FakeDynamicTexture.instances.map((texture) => texture.name)).size, 10);
  assert.ok(FakeDynamicTexture.instances.every((texture) => texture.context.texts.some((text) => text.includes('UPRIGHT'))));
  assert.ok(FakeDynamicTexture.instances.every((texture) => texture.context.texts.includes('◀ LEFT')));
  assert.ok(FakeDynamicTexture.instances.every((texture) => texture.context.texts.some((text) => text.startsWith('RIGHT ▶'))));
  const textures = [...FakeDynamicTexture.instances];
  controller.dispose();
  assert.ok(textures.every((texture) => texture.disposed));
});

test('W765R5 visible left/right headings, authored Pathfinder idle schedule and NPC authored-or-absent behavior remain deterministic', () => {
  const camera = { cameraPosition: { x: 0, y: 8, z: -10 }, cameraTarget: { x: 0, y: 0.8, z: 0 } };
  const left = resolveEonCityCameraRelativeMovement({ ...camera, inputRight: -1 });
  const right = resolveEonCityCameraRelativeMovement({ ...camera, inputRight: 1 });
  assert.ok(left.x < 0 && right.x > 0);
  const leftMotion = createEonCityW695LocomotionTruthController({ initialPosition: { x: 0, z: 0 }, headingSmoothing: 1 });
  const leftVisual = leftMotion.update({ position: { x: left.x, z: left.z }, desiredDirection: left, deltaSeconds: 0.2, activeAssetId: 'eoncity-pathfinder-prime-11clips' });
  const rightMotion = createEonCityW695LocomotionTruthController({ initialPosition: { x: 0, z: 0 }, headingSmoothing: 1 });
  const rightVisual = rightMotion.update({ position: { x: right.x, z: right.z }, desiredDirection: right, deltaSeconds: 0.2, activeAssetId: 'eoncity-pathfinder-prime-11clips' });
  assert.ok(leftVisual.visualHeading < 0);
  assert.ok(rightVisual.visualHeading > 0);

  const player = getEonCityW649Character('player-primary');
  for (const clip of ['Idle_02', 'Idle_11', 'Walking', 'Running', 'Big_Wave_Hello', 'Hand_on_Hip_Gesture', 'Checkout_Gesture', 'Lower_Weapon_Look_Raise']) {
    assert.ok(player.animationNames.includes(clip), `missing authored Pathfinder clip ${clip}`);
  }
  let time = 0;
  const director = createEonCityW745HeroPresentationDirector({ now: () => time });
  const input = { moving: false, playerPosition: { x: 0, z: 0 }, companionPosition: { x: 1, z: 1 }, nearestStationId: 'eonbot-nexus' };
  assert.equal(director.update(input).playerIdleState, 'idle');
  time = 3_000;
  assert.equal(director.update(input).playerIdleState, 'idle-alt');
  time = 7_400;
  assert.equal(director.update(input).playerIdleState, 'inspect');
  time = 13_700;
  assert.equal(director.update(input).playerIdleState, 'pose');
  time = 20_300;
  assert.equal(director.update(input).playerIdleState, 'wave');
  time = 20_320;
  assert.equal(director.update({ ...input, moving: true }).playerIdleState, 'idle');

  const cast = buildEonCityW754CastPlan({ quality: 'high' });
  const schedules = buildEonCityW754NpcSchedulePlan();
  assert.equal(cast.allStationRolesAssigned, true);
  assert.equal(cast.stationRoleCount, 9);
  assert.equal(schedules.scheduleCount, 9);
  assert.equal(schedules.walkingInPlaceAllowed, false);
  const schedule = createEonCityW754NpcScheduleController({ now: () => 0, plan: schedules });
  const first = schedule.update('create-forge', 0);
  const moving = schedule.update('create-forge', 20_000);
  assert.equal(first.animation, 'idle');
  assert.equal(moving.walkingInPlace, false);
  assert.ok(['idle', 'walk', 'interact'].includes(moving.animation));

  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /fallbackNpc\.root\.setEnabled\(false\)/);
  assert.match(runtime, /npcHitTarget\.setEnabled\(false\)/);
  assert.doesNotMatch(runtime.slice(runtime.indexOf('function createExteriorAmbientCitizens'), runtime.indexOf('function createW744AmbientActors')), /createProceduralPerson/);
});

test('W765R5 runtime integrates exactly nine individual monitors plus the five-screen Command Status wall and versioned City CSS', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const html = read('eoncity.html');
  assert.match(runtime, /const stationMonitors = new Map\(\)/);
  assert.match(runtime, /if \(station\.id === 'command-console'\) continue/);
  assert.match(runtime, /stationMonitors\.size \+ \(commandCentre\.ok \? 1 : 0\)/);
  assert.match(runtime, /for \(const monitor of stationMonitors\.values\(\)\) monitor\.update\?\.\(frameAt, camera\.position\)/);
  assert.match(runtime, /for \(const monitor of stationMonitors\.values\(\)\) monitor\.dispose\?\.\(\)/);
  assert.match(runtime, /now\r?\n\s*\}\);/);
  assert.match(runtime, /timestamp - lastLabelProjectionAt < 90/);
  assert.match(runtime, /ui\.update\(projector, playerAnchor\.position, nearestId, frameAt\)/);
  assert.match(html, /eon-city-play\.css\?v=w765r5/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import {
  EON_CITY_W649_LOCAL_MESHOPT_DECODER,
  configureEonCityW649MeshoptDecoder,
  createEonCityW649AnimationStateMachine,
  createEonCityW649BabylonCoreRuntime
} from '../../assets/js/city/w649/eon-city-w649-babylon-core-runtime.js';

function animationGroup(name) {
  return {
    name,
    from: 0,
    to: 30,
    isPlaying: false,
    starts: [],
    stops: 0,
    start(loop, speed) { this.isPlaying = true; this.starts.push({ loop, speed }); },
    stop() { if (this.isPlaying) this.stops += 1; this.isPlaying = false; }
  };
}

test('W649D animation transitions cancel the previous clip and restore root transforms', () => {
  const idle = animationGroup('Idle_02');
  const walk = animationGroup('Walking');
  const run = animationGroup('Running');
  const root = { position: new Vector3(0, 0, 0), rotation: new Vector3(0, 0, 0), scaling: new Vector3(1, 1, 1) };
  const machine = createEonCityW649AnimationStateMachine({
    characterId: 'eoncity-pathfinder-prime-11clips',
    animationGroups: [idle, walk, run],
    rootNodes: [root]
  });
  assert.equal(machine.transition('idle').ok, true);
  assert.equal(idle.starts[0].loop, true);
  root.position.set(7, 0, -4);
  assert.equal(machine.transition('walk').ok, true);
  assert.deepEqual([root.position.x, root.position.y, root.position.z], [0, 0, 0]);
  assert.equal(idle.stops, 1);
  assert.equal(machine.transition('run').ok, true);
  assert.equal(walk.stops, 1);
  const summary = machine.getSummary();
  assert.equal(summary.activeState, 'run');
  assert.equal(summary.activeClip, 'Running');
  assert.equal(summary.transitionCount, 3);
  assert.equal(summary.cancellationCount, 2);
  machine.dispose();
  assert.equal(machine.getSummary().disposed, true);
});

test('W649D Meshopt decoder is source-controlled and rejects remote configuration', () => {
  assert.equal(EON_CITY_W649_LOCAL_MESHOPT_DECODER, '/assets/vendor/babylon/meshopt_decoder.js');
  assert.equal(fs.existsSync(new URL('../../assets/vendor/babylon/meshopt_decoder.js', import.meta.url)), true);
  assert.deepEqual(configureEonCityW649MeshoptDecoder(), {
    configured: true,
    url: '/assets/vendor/babylon/meshopt_decoder.js',
    sameOrigin: true,
    remoteDecoder: false
  });
  assert.throws(() => configureEonCityW649MeshoptDecoder('https://cdn.example/decoder.js'), /must-be-local/);
});

test('W649D loads the bounded primary core, hides procedural fallbacks, and disposes owned resources', async () => {
  const engine = new NullEngine({ renderWidth: 64, renderHeight: 64 });
  const scene = new Scene(engine);
  const playerAnchor = new TransformNode('player-anchor', scene);
  const playerFallback = new TransformNode('player-fallback', scene);
  playerFallback.parent = playerAnchor;
  playerAnchor.metadata = { proceduralFallbackRoot: playerFallback };
  const eonbotAnchor = new TransformNode('eonbot-anchor', scene);
  const eonbotFallback = new TransformNode('eonbot-fallback', scene);
  eonbotFallback.parent = eonbotAnchor;
  eonbotAnchor.metadata = { proceduralFallbackRoot: eonbotFallback };
  const paths = [];
  let disposedContainers = 0;
  const loadContainer = async ({ path }) => {
    paths.push(path);
    const root = new TransformNode(`asset-${paths.length}`, scene);
    const groups = path.includes('pathfinder_prime')
      ? [animationGroup('Idle_02'), animationGroup('Walking'), animationGroup('Running'), animationGroup('Big_Wave_Hello'), animationGroup('Hand_on_Hip_Gesture'), animationGroup('Victory_Cheer'), animationGroup('Jump_with_Arms_Open')]
      : [];
    return {
      rootNodes: [root],
      meshes: [],
      animationGroups: groups,
      addAllToScene() {},
      removeAllFromScene() {},
      dispose() { disposedContainers += 1; root.dispose(); }
    };
  };
  const runtime = createEonCityW649BabylonCoreRuntime({
    scene,
    playerAnchor,
    eonbotAnchor,
    quality: 'balanced',
    loadContainer,
    detectWebp: async () => true
  });
  const started = await runtime.start();
  assert.equal(started.ok, true);
  assert.equal(started.playerAssetId, 'eoncity-pathfinder-prime-11clips');
  assert.equal(paths.length, 2);
  assert.match(paths[0], /\/primary\/characters\/eoncity_pathfinder_prime_11clips\.[a-f0-9]{12}\.glb$/);
  assert.match(paths[1], /\/primary\/characters\/eoncity_eonbot_orbit\.[a-f0-9]{12}\.glb$/);
  runtime.update({ playerState: 'walk' });
  assert.equal(playerFallback.isEnabled(), false);
  assert.equal(eonbotFallback.isEnabled(), false);
  const summary = runtime.getSummary();
  assert.equal(summary.player.loaded, true);
  assert.equal(summary.player.variant, 'primary');
  assert.equal(summary.eonbot.loaded, true);
  assert.equal(summary.withinControllableCoreTarget, true);
  assert.equal(summary.remoteDecoder, false);
  assert.equal(summary.anchorLockActive, true);
  runtime.dispose();
  assert.equal(runtime.getSummary().disposed, true);
  assert.equal(disposedContainers, 2);
  scene.dispose();
  engine.dispose();
});

test('W649D source integrates core updates and cleanup without starting duplicate legacy rig downloads', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
  assert.match(source, /createEonCityW649BabylonCoreRuntime/);
  assert.match(source, /trackAsyncCityBootStage\('W649_CONTROLLABLE_CORE'/);
  assert.match(source, /enabled:\s*false/);
  assert.match(source, /w649CoreRuntime\.update\(\{ playerState: w649PlayerState \}\)/);
  assert.match(source, /w649CoreRuntime\.dispose\(\)/);
  assert.match(source, /requestW649PlayerState/);
});

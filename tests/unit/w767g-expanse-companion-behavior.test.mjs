import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW767GCompanionBehaviorDirector } from '../../assets/js/city/w766/eon-expanse-w767g-companion-behavior.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const context = (overrides = {}) => ({
  expanseActive: true,
  bonded: true,
  transitActive: false,
  guideActive: false,
  moving: false,
  player: { x: 0, y: 0, z: 0 },
  companion: { x: 1, y: 1, z: 0 },
  candidates: [],
  ...overrides
});

test('W767G gives Transit and explicit guidance priority over ambient companion behavior', () => {
  let clock = 1000;
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => clock, stationaryDelayMs: 500 });
  assert.equal(director.update(context({ bonded: false })).status, 'awaiting-companion-bond');
  assert.equal(director.update(context({ transitActive: true })).mode, 'transit-formation');
  assert.equal(director.update(context({ guideActive: true })).mode, 'guide-route');
  assert.equal(director.certify().ok, true);
});

test('W767G greets the nearest NPC only after the player remains still and never mutates mission state', () => {
  let clock = 2000;
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => clock, stationaryDelayMs: 700, behaviorDurationMs: 3000, maxScoutDistance: 5.8 });
  const npc = { id: 'npc:pathfinder', kind: 'expanse-npc', action: 'meet-pathfinder', npcId: 'pathfinder', world: { x: 4, y: 1, z: 0 }, distance: 4 };
  assert.equal(director.update(context({ candidates: [npc] })).mode, 'formation-follow');
  clock += 701;
  const greeting = director.update(context({ candidates: [npc], at: clock }));
  assert.equal(greeting.mode, 'greet-npc');
  assert.equal(greeting.targetId, 'npc:pathfinder');
  assert.equal(greeting.mutatesMissionState, false);
  assert.equal(greeting.privateContentStored, false);
  assert.ok(Math.hypot(greeting.target.x, greeting.target.z) <= 5.8);
});

test('W767G filters rescue and return controls from ambient inspection targets', () => {
  let clock = 0;
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => clock, stationaryDelayMs: 500 });
  const controls = [
    { id: 'return', action: 'return-to-command-hub', world: { x: 1, y: 0, z: 0 }, distance: 1 },
    { id: 'rescue', action: 'restore-companion-link', world: { x: 2, y: 0, z: 0 }, distance: 2 }
  ];
  director.update(context({ candidates: controls }));
  clock = 501;
  const state = director.update(context({ candidates: controls, at: clock }));
  assert.equal(state.mode, 'curious-hover');
  assert.match(state.targetId, /^curiosity-sector:/);
});

test('W767G returns immediately to formation when the player moves or the companion exceeds its leash', () => {
  let clock = 1000;
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => clock, stationaryDelayMs: 500, maxScoutDistance: 5 });
  director.update(context());
  clock += 501;
  assert.equal(director.update(context({ at: clock })).mode, 'curious-hover');
  assert.equal(director.update(context({ moving: true, at: clock + 1 })).status, 'player-moving');
  const recovery = director.update(context({ companion: { x: 8, y: 1, z: 0 }, at: clock + 2 }));
  assert.equal(recovery.mode, 'return-formation');
  assert.equal(recovery.status, 'companion-distance-recovery');
});


test('W767G recognizes authored dock targets and avoids repeating one nearby target when another is available', () => {
  let clock = 0;
  const director = createEonExpanseW767GCompanionBehaviorDirector({
    now: () => clock,
    stationaryDelayMs: 500,
    behaviorDurationMs: 1800,
    cooldownMs: 1200
  });
  const dock = { id: 'dock:eonbot', kind: 'expanse-living-content', action: 'eonbot-dock-recharge', world: { x: 2, y: 0.5, z: 0 }, distance: 2 };
  const terminal = { id: 'terminal:relay', kind: 'expanse-living-content', action: 'productive-mission-review', world: { x: 3, y: 0.5, z: 0 }, distance: 3 };
  director.update(context({ candidates: [dock, terminal], at: clock }));
  clock = 501;
  const first = director.update(context({ candidates: [dock, terminal], at: clock }));
  assert.equal(first.mode, 'dock-recharge');
  assert.equal(first.targetId, 'dock:eonbot');
  clock += 1801;
  assert.equal(director.update(context({ candidates: [dock, terminal], at: clock })).status, 'ambient-behavior-complete');
  clock += 1201;
  const second = director.update(context({ candidates: [dock, terminal], at: clock }));
  assert.equal(second.mode, 'inspect-nearby');
  assert.equal(second.targetId, 'terminal:relay');
});

test('W767G stays inside the canonical runtime and samples only safe nearby interaction metadata', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const director = await read('../../assets/js/city/w766/eon-expanse-w767g-companion-behavior.js');
  assert.match(runtime, /createEonExpanseW767GCompanionBehaviorDirector/);
  assert.match(runtime, /getInteractionCandidates\?\.\(playerAnchor\.position, \{ maxDistance: 7\.5 \}\)/);
  assert.match(runtime, /expanseCompanionBehavior\.update\(/);
  assert.match(runtime, /certifyExpanseCompanionBehavior/);
  assert.match(runtime, /expanseBehavior: expanseCompanionBehaviorState/);
  assert.match(runtime, /'dock-recharge': 'dock-check'/);
  assert.match(runtime, /const ambientScan = Boolean\(ambientBehavior/);
  assert.match(runtime, /state === 'greet-host'/);
  assert.doesNotMatch(director, /recordSignal|addMilestone|awardXp|interactNearest/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

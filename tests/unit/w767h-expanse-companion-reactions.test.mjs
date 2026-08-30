import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createEonExpanseW767GCompanionBehaviorDirector,
  getEonExpanseW767GCompanionBehaviorLabel
} from '../../assets/js/city/w766/eon-expanse-w767g-companion-behavior.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const candidate = (overrides = {}) => ({
  id: 'productive:create-expedition',
  kind: 'expanse-living-content',
  action: 'productive-mission-review',
  interactionAction: '',
  world: { x: 3, y: 1, z: 1 },
  distance: 3.2,
  ...overrides
});
const options = (overrides = {}) => ({
  explicitUserAction: true,
  expanseActive: true,
  bonded: true,
  transitActive: false,
  guideActive: false,
  player: { x: 0, y: 0, z: 0 },
  at: 5000,
  ...overrides
});

test('W767H explicit reactions are user-action gated and remain subordinate to Transit and guidance', () => {
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => 5000 });
  assert.equal(director.react(candidate(), options({ explicitUserAction: false })).reason, 'explicit-user-action-required');
  assert.equal(director.react(candidate(), options({ transitActive: true })).reason, 'transit-active');
  assert.equal(director.react(candidate(), options({ guideActive: true })).reason, 'explicit-guidance-active');
  assert.equal(director.react(candidate(), options({ bonded: false })).reason, 'companion-not-bonded');
});

test('W767H productive, NPC and discovery interactions produce bounded inspect, greet and scan reactions', () => {
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => 5000, maxScoutDistance: 5.8 });
  const inspect = director.react(candidate(), options());
  assert.equal(inspect.ok, true);
  assert.equal(inspect.state.mode, 'inspect-nearby');
  assert.equal(inspect.state.status, 'explicit-interaction-reaction');
  assert.equal(inspect.state.mutatesMissionState, false);
  assert.equal(getEonExpanseW767GCompanionBehaviorLabel(inspect.state), 'Inspecting terminal');

  const greet = director.react(candidate({ id: 'npc:navigator', kind: 'expanse-npc', action: 'meet-navigator', npcId: 'navigator' }), options({ at: 6000 }));
  assert.equal(greet.state.mode, 'greet-npc');
  assert.equal(getEonExpanseW767GCompanionBehaviorLabel(greet.state), 'Greeting resident');

  const scan = director.react(candidate({ id: 'discovery:archive', action: 'living-discovery', discoveryId: 'archive-memory-wall' }), options({ at: 7000 }));
  assert.equal(scan.state.mode, 'scan-discovery');
  assert.equal(getEonExpanseW767GCompanionBehaviorLabel(scan.state), 'Scanning discovery');
  assert.ok(Math.hypot(scan.state.target.x, scan.state.target.z) <= 5.8);
});

test('W767H never reacts to the return gate or companion rescue controls', () => {
  const director = createEonExpanseW767GCompanionBehaviorDirector({ now: () => 5000 });
  for (const action of ['return-to-command-hub', 'scan-dormant-eonbot', 'recover-companion-signal-core', 'restore-companion-link']) {
    const result = director.react(candidate({ id: action, action, kind: action === 'return-to-command-hub' ? 'w766a-expanse-return-gate' : 'w767a-companion-rescue' }), options());
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'safe-reaction-target-required');
  }
});

test('W767H live runtime refreshes safe candidates, reacts through the canonical director and exposes behavior text in the existing HUD', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /refreshExpanseCompanionBehaviorCandidates/);
  assert.match(runtime, /reactEonbotToExpanseInteraction/);
  assert.match(runtime, /expanseCompanionBehavior\.react\(target/);
  assert.match(runtime, /w767h-companion-interaction-reaction/);
  assert.match(runtime, /getEonExpanseW767GCompanionBehaviorLabel/);
  assert.match(runtime, /behaviorMode: String\(expanseCompanionBehaviorState\?\.mode/);
  assert.match(overlay, /companion\.dataset\.behavior = String\(value\?\.behaviorMode/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

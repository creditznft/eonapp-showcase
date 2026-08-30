import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION6_CHARACTER_SCHEMA,
  buildSession6CharacterTelemetry,
  computeCrowdSeparation,
  createSession6BehaviorState,
  resolveEonBotExpression,
  resolveSession6NpcBehavior,
  shortestAngleDelta
} from '../../assets/js/realm3d/engine/EonCitySession6CharacterDirector.js';

test('Session 6 behavior director creates role-specific private and visitor states', () => {
  const owner = { id: 'agent-code-builder', station: 'builder-forge', audience: 'owner-private-workspace-only' };
  const visitor = { id: 'visitor-realm-guide', station: 'spawn', audience: 'realm-visitors-scripted-only' };
  const ownerState = createSession6BehaviorState({ npc: owner, index: 1 });
  const visitorState = createSession6BehaviorState({ npc: visitor, index: 2 });
  assert.equal(ownerState.schema, SESSION6_CHARACTER_SCHEMA);
  assert.equal(ownerState.role, 'builder');
  assert.equal(visitorState.role, 'guide');
  const work = resolveSession6NpcBehavior({ npc: owner, behaviorState: ownerState, pathPauseRemaining: 2, time: 4, delta: 0.05 });
  const social = resolveSession6NpcBehavior({ npc: visitor, behaviorState: visitorState, pausedForPlayer: true, playerDistance: 2, time: 5, delta: 0.05 });
  assert.equal(work.state, 'station-work');
  assert.equal(work.gesture, 'typing');
  assert.equal(social.state, 'visitor-conversation');
  assert.ok(['greeting', 'explaining', 'pointing'].includes(social.gesture));
  assert.equal(social.conversationStaged, true);
});

test('Session 6 crowd choreography and turning stay bounded', () => {
  const a = { position: { x: 0, z: 0 } };
  const b = { position: { x: 0.5, z: 0 } };
  const separation = computeCrowdSeparation(a, [a, b], { radius: 1.5, strength: 0.4 });
  assert.ok(separation.x < 0);
  assert.equal(separation.neighbors, 1);
  assert.ok(Math.abs(shortestAngleDelta(Math.PI - 0.1, -Math.PI + 0.1)) < 0.25);
});

test('Session 6 EONBOT expressions distinguish guidance, social and workstation modes', () => {
  assert.equal(resolveEonBotExpression({ guidance: { target: { x: 1, z: 1 }, arrived: false } }).mode, 'station-guide');
  assert.equal(resolveEonBotExpression({ guidance: { target: { x: 1, z: 1 }, arrived: true } }).expression, 'celebrating');
  assert.equal(resolveEonBotExpression({ nearbyNpcDistance: 2 }).mode, 'social');
  assert.equal(resolveEonBotExpression({ nearbyScreenDistance: 3 }).mode, 'workstation');
});

test('Session 6 telemetry preserves owner and visitor separation', () => {
  const npcs = [
    { userData: { role: 'owner-agent', moving: false, activeGesture: 'typing', conversationStaged: false, behaviorState: { state: 'station-work' } } },
    { userData: { role: 'visitor-guide', moving: true, activeGesture: 'greeting', conversationStaged: true, behaviorState: { state: 'visitor-conversation' } } }
  ];
  const bots = [{ userData: { mode: 'social', expression: 'listening' } }];
  const telemetry = buildSession6CharacterTelemetry(npcs, bots);
  assert.equal(telemetry.ownerAgents, 1);
  assert.equal(telemetry.visitorGuides, 1);
  assert.equal(telemetry.conversationStaged, 1);
  assert.deepEqual(telemetry.eonbotModes, ['social']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_W760_W765_SCHEMA,
  EON_CITY_W760_SCENE_PROFILE,
  EON_CITY_W761_CHARACTER_PROFILE,
  EON_CITY_W763_MENU_ORDER,
  EON_CITY_W765_ACCEPTANCE_MATRIX,
  createEonCityW762NexusReactionController,
  createEonCityW764RewardReactionController,
  auditEonCityW763InteractionCompleteness,
  validateEonCityW760W765Convergence
} from '../../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';
import { createEonCityW748InteractionRegistry } from '../../assets/js/city/w748/eon-city-w748-interaction-registry.js';

function environmentRecorder() {
  const events = [];
  class LocalCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  return {
    events,
    CustomEvent: LocalCustomEvent,
    dispatchEvent(event) { events.push(event); return true; }
  };
}

function nexusView({ state = 'ready', project = 1, task = 1, approval = 0, systems = 1, systemsFailed = false, mission = 1, results = 0, freshness = 'fresh' } = {}) {
  return {
    state,
    rings: [
      { id: 'project', count: project },
      { id: 'task', count: task },
      { id: 'approval', count: approval },
      { id: 'systems', count: systems, failed: systemsFailed },
      { id: 'mission', count: mission },
      { id: 'results', count: results }
    ],
    freshness: { state: freshness }
  };
}

test('W760-W765 profile preserves one-runtime convergence decisions', () => {
  const validation = validateEonCityW760W765Convergence();
  assert.equal(validation.ok, true);
  assert.equal(validation.schema, EON_CITY_W760_W765_SCHEMA);
  assert.equal(validation.decisions.oneBabylonRuntime, true);
  assert.equal(validation.decisions.oneNexusAuthority, 'w749');
  assert.equal(validation.decisions.oneMissionAuthority, 'w752');
  assert.equal(validation.decisions.expanseSealed, false);
  assert.equal(validation.decisions.expanseGateReviewRequired, true);
  assert.equal(validation.decisions.expanseRuntimeReachable, true);
  assert.equal(EON_CITY_W760_SCENE_PROFILE.skyline.nearWindowRows >= 5, true);
  assert.equal(EON_CITY_W761_CHARACTER_PROFILE.eonbot.noEndlessOrbit, true);
  assert.deepEqual(EON_CITY_W763_MENU_ORDER, ['Living Nexus', 'Mission Board', 'Live Monitors', 'Share Command Center', 'Creator Capture', 'Plans & Access', 'Accessible Map']);
  assert.equal(EON_CITY_W765_ACCEPTANCE_MATRIX.overallOwnerScore, 9.5);
});

test('W762 reacts only to actual W749 state deltas', () => {
  let currentTime = 10_000;
  const environment = environmentRecorder();
  const reactions = [];
  const controller = createEonCityW762NexusReactionController({ environment, now: () => currentTime, onReaction: (reaction) => reactions.push(reaction) });

  const initial = controller.observe(nexusView(), 'initial');
  assert.equal(initial.changed, false);
  const refresh = controller.observe(nexusView(), 'manual-refresh');
  assert.equal(refresh.changed, false);

  currentTime += 100;
  const result = controller.observe(nexusView({ results: 1 }), 'source-event');
  assert.equal(result.changed, true);
  assert.equal(result.current.kind, 'result-created');
  assert.equal(result.current.source, 'actual-w749-view-delta');
  assert.equal(result.current.inventedActivity, false);
  assert.equal(reactions.length, 1);
  assert.equal(environment.events.length, 1);

  currentTime += 100;
  const approval = controller.observe(nexusView({ results: 1, approval: 1, state: 'waiting-approval' }), 'source-event');
  assert.equal(approval.changed, true);
  assert.equal(approval.current.kind, 'approval-waiting');
  assert.equal(controller.getSnapshot().ownsState, false);
  assert.equal(controller.getSnapshot().ownsRenderLoop, false);
});

test('W764 emits reward feedback only for verified W752 receipts', () => {
  let currentTime = 20_000;
  const environment = environmentRecorder();
  const controller = createEonCityW764RewardReactionController({ environment, now: () => currentTime });

  const rejected = controller.noteMissionClaim({ ok: true, reason: 'already-claimed', awarded: { xp: 0, reveal: 0 } });
  assert.equal(rejected.ok, false);
  assert.equal(environment.events.length, 0);

  const mission = controller.noteMissionClaim({ ok: true, reason: 'recorded', awarded: { xp: 25, reveal: 1 } });
  assert.equal(mission.ok, true);
  assert.equal(mission.reaction.kind, 'mission-complete');
  assert.equal(mission.reaction.awardedXp, 25);
  assert.equal(mission.reaction.source, 'verified-w752-result');
  assert.equal(mission.reaction.paid, false);
  assert.equal(mission.reaction.random, false);

  currentTime += 100;
  const reveal = controller.noteVaultReveal({ ok: true, reason: 'opened', reveal: { id: 'cosmetic-1', label: 'Circuit Halo' } });
  assert.equal(reveal.ok, true);
  assert.equal(reveal.reaction.kind, 'vault-reveal');
  assert.equal(reveal.reaction.rewardId, 'cosmetic-1');
  assert.equal(reveal.reaction.deterministic, true);
  assert.equal(environment.events.length, 2);
  assert.equal(controller.getSnapshot().ownsXpLedger, false);
  assert.equal(controller.getSnapshot().ownsRewards, false);
});

test('W763 interaction completeness accepts maintained focus actions and rejects dead promises', () => {
  const registry = createEonCityW748InteractionRegistry();
  const passing = auditEonCityW763InteractionCompleteness(registry.list({ visibleOnly: false }));
  assert.equal(passing.ok, true);
  assert.equal(passing.total >= 42, true);
  const ids = registry.list({ visibleOnly: false }).map((entry) => entry.id);
  assert.equal(ids.includes('discovery:expanse-gate'), true);
  assert.equal(ids.includes('support:sealed-expanse-gateway'), false);
  assert.deepEqual(passing.dead, []);

  const failing = auditEonCityW763InteractionCompleteness([{ id: 'dead-terminal', label: 'Dead', oneLinePurpose: 'Looks active', inspectText: 'No destination', accessibilityLabel: 'Dead terminal', truthBoundary: 'None', primaryAction: { kind: 'open', surface: '' } }]);
  assert.equal(failing.ok, false);
  assert.deepEqual(failing.dead, ['dead-terminal']);
});

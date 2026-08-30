import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLootboxPlanRules,
  evaluateLootboxClaim,
  applyLootboxClaim,
  buildRealmLootEvents
} from '../../assets/js/utils/realmworld-lootbox-economy.js';
import { buildRealmWorldSnapshot } from '../../assets/js/utils/realmworld-generator.js';

describe('realmworld lootbox economy', () => {
  it('caps free daily claims and improves paid daily caps', () => {
    assert.equal(getLootboxPlanRules('free').dailyClaims, 2);
    assert.equal(getLootboxPlanRules('business').dailyClaims, 10);
    const now = Date.parse('2026-06-02T10:00:00.000Z');
    const state = { claimsByDay: { '2026-06-02': 2 }, lastClaimAt: now - 3600000 };
    assert.equal(evaluateLootboxClaim(state, { now, plan: 'free' }).ok, false);
    assert.equal(evaluateLootboxClaim(state, { now, plan: 'business' }).ok, true);
  });

  it('blocks fast repeated claims by cooldown', () => {
    const now = Date.parse('2026-06-02T10:00:00.000Z');
    const result = evaluateLootboxClaim({ claimsByDay: {}, lastClaimAt: now - 60000 }, { now, plan: 'creator' });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'cooldown');
  });

  it('applies a claim and stores a reward locally', () => {
    const now = Date.parse('2026-06-02T10:00:00.000Z');
    const result = applyLootboxClaim({}, { now, plan: 'starter', seed: 'realm-district-1' });
    assert.equal(result.ok, true);
    assert.equal(result.state.claimsByDay['2026-06-02'], 1);
    assert.equal(result.state.rewards.length, 1);
  });

  it('maps generated realm districts into loot events', () => {
    const snapshot = buildRealmWorldSnapshot({ username: 'loot-test' }, { now: '2026-06-02T00:00:00.000Z' });
    const events = buildRealmLootEvents(snapshot, { plan: 'pro' });
    assert.ok(events.length > 0);
    assert.ok(events.every((event) => event.id.startsWith('loot-')));
  });
});

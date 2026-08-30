import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../assets/js/utils/entitlements.js');

function makeModule() {
  const storage = {};
  const lsProxy = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    get length() { return Object.keys(storage).length; },
    key: (i) => Object.keys(storage)[i] ?? null
  };

  const ctx = createContext({
    localStorage: lsProxy,
    window: { EonWallet: null },
    getProfile: () => {
      try {
        return JSON.parse(lsProxy.getItem('eon:profile') || lsProxy.getItem('eon:profile:v1') || 'null');
      } catch {
        return null;
      }
    },
    isAdminProfile: (profile = null) => Boolean(
      profile?.isAdmin
      || String(profile?.role || '').trim().toLowerCase() === 'operator'
      || (Array.isArray(profile?.roles) && profile.roles.map((value) => String(value || '').trim().toLowerCase()).includes('operator'))
      || String(profile?.wallet || profile?.walletAddress || '').trim().toLowerCase() === '0xadmin'
    ),
    Date,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Math,
    Set
  });

  const src = readFileSync(SRC, 'utf8')
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  // collect all named declarations that were exported
  const exportedNames = [...readFileSync(SRC, 'utf8').matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const suffix = exportedNames.map((n) => `exports.${n} = ${n};`).join('\n');
  const wrapped = `const exports = {};\n${src}\n${suffix}\nexports`;
  return { exports: runInContext(wrapped, ctx), store: storage };
}

describe('entitlements — getPlans / getPlan', () => {
  it('getPlans returns all merged plan definitions', () => {
    const { exports } = makeModule();
    const plans = exports.getPlans();
    assert.equal(plans.length, 7);
  });

  it('getPlan returns correct plan for current supporter tier', () => {
    const { exports } = makeModule();
    const plan = exports.getPlan('supporter');
    assert.equal(plan.id, 'supporter');
    assert.equal(plan.label, 'EON Supporter');
    assert.equal(plan.stablePriceCents, 100);
  });

  it('getPlan returns free plan for unknown id', () => {
    const { exports } = makeModule();
    const plan = exports.getPlan('unknown-plan');
    assert.equal(plan.id, 'free');
  });
});

describe('entitlements — isPlanAtLeast', () => {
  it('free is at least free', () => {
    const { exports } = makeModule();
    assert.equal(exports.isPlanAtLeast('free', 'free'), true);
  });

  it('pro is at least spark', () => {
    const { exports } = makeModule();
    assert.equal(exports.isPlanAtLeast('pro', 'spark'), true);
  });

  it('spark is NOT at least pro', () => {
    const { exports } = makeModule();
    assert.equal(exports.isPlanAtLeast('spark', 'pro'), false);
  });

  it('operator is at least operator', () => {
    const { exports } = makeModule();
    assert.equal(exports.isPlanAtLeast('operator', 'operator'), true);
  });

  it('unknown plan normalizes to free — returns false against pro', () => {
    const { exports } = makeModule();
    assert.equal(exports.isPlanAtLeast('unknown', 'pro'), false);
  });
});

describe('entitlements — formatStable', () => {
  it('formats 0 cents as $0.00', () => {
    const { exports } = makeModule();
    assert.equal(exports.formatStable(0), '$0.00');
  });

  it('formats 100 cents as $1.00', () => {
    const { exports } = makeModule();
    assert.equal(exports.formatStable(100), '$1.00');
  });

  it('formats 1500 cents as $15.00', () => {
    const { exports } = makeModule();
    assert.equal(exports.formatStable(1500), '$15.00');
  });

  it('handles undefined gracefully', () => {
    const { exports } = makeModule();
    assert.equal(exports.formatStable(undefined), '$0.00');
  });
});

describe('entitlements — quotePlan', () => {
  it('quotes free plan as $0 stable', () => {
    const { exports } = makeModule();
    const q = exports.quotePlan('free', 'stable', exports.getEntitlementState());
    assert.equal(q.asset, 'stable');
    assert.equal(q.amount, 0);
  });

  it('quotes spark plan at 100 cents stable', () => {
    const { exports } = makeModule();
    const q = exports.quotePlan('spark', 'stable', exports.getEntitlementState());
    assert.equal(q.asset, 'stable');
    assert.equal(q.amount, 100);
  });

  it('quotes spark plan in eonl asset type', () => {
    const { exports } = makeModule();
    const q = exports.quotePlan('spark', 'eonl', exports.getEntitlementState());
    assert.equal(q.asset, 'eonl');
    assert.equal(typeof q.amount, 'number');
    assert.ok(q.amount > 0);
  });

  it('unknown plan defaults to free quote', () => {
    const { exports } = makeModule();
    const q = exports.quotePlan('nonexistent', 'stable', exports.getEntitlementState());
    assert.equal(q.amount, 0);
  });
});

describe('entitlements — getEntitlementState defaults', () => {
  it('default state has activePlanId free', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    assert.equal(state.activePlanId, 'free');
  });

  it('default state has status inactive', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    assert.equal(state.status, 'inactive');
  });

  it('default state stableBalanceCents is 0', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    assert.equal(state.stableBalanceCents, 0);
  });
});

describe('entitlements — topUpStableBalance', () => {
  it('adds balance correctly', () => {
    const { exports } = makeModule();
    exports.topUpStableBalance(500, 'test');
    const state = exports.getEntitlementState();
    assert.equal(state.stableBalanceCents, 500);
  });

  it('clamps balance at MAX_BALANCE_CENTS (1_000_000_000)', () => {
    const { exports } = makeModule();
    exports.topUpStableBalance(1_000_000_000, 'test');
    const state = exports.getEntitlementState();
    assert.equal(state.stableBalanceCents, 1_000_000_000);
  });

  it('zero top-up does not change state', () => {
    const { exports } = makeModule();
    const before = exports.getEntitlementState().stableBalanceCents;
    exports.topUpStableBalance(0, 'test');
    assert.equal(exports.getEntitlementState().stableBalanceCents, before);
  });

  it('records txHistory entry for top-up', () => {
    const { exports } = makeModule();
    exports.topUpStableBalance(200, 'manual');
    const state = exports.getEntitlementState();
    const entry = state.txHistory.find((t) => t.type === 'top-up');
    assert.ok(entry, 'expected top-up in txHistory');
    assert.equal(entry.amount, 200);
  });
});

describe('entitlements — hasEntitlementFeature', () => {
  it('free plan has core tools feature', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    assert.equal(exports.hasEntitlementFeature('core tools', state), true);
  });

  it('free plan does NOT have extra ai budget', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    assert.equal(exports.hasEntitlementFeature('extra ai budget', state), false);
  });

  it('core plan has extra ai budget when active', () => {
    const { exports } = makeModule();
    const coreState = { activePlanId: 'core', status: 'active' };
    assert.equal(exports.hasEntitlementFeature('extra ai budget', coreState), true);
  });

  it('empty feature string returns false', () => {
    const { exports } = makeModule();
    assert.equal(exports.hasEntitlementFeature('', exports.getEntitlementState()), false);
  });
});

describe('entitlements — setStableRate', () => {
  it('sets rate to provided positive value', () => {
    const { exports } = makeModule();
    exports.setStableRate(50);
    const state = exports.getEntitlementState();
    assert.equal(state.stableCentsPerEonl, 50);
  });

  it('zero rate keeps default (20) because 0 is falsy', () => {
    const { exports } = makeModule();
    exports.setStableRate(0);
    const state = exports.getEntitlementState();
    assert.equal(state.stableCentsPerEonl, 20);
  });

  it('negative rate is clamped to minimum of 1', () => {
    const { exports } = makeModule();
    exports.setStableRate(-10);
    const state = exports.getEntitlementState();
    assert.equal(state.stableCentsPerEonl, 1);
  });
});

describe('entitlements — processRenewals', () => {
  it('no active plan (autoRenew=false) returns state unchanged', () => {
    const { exports } = makeModule();
    const before = exports.getEntitlementState();
    const result = exports.processRenewals();
    assert.equal(result.activePlanId, before.activePlanId);
    assert.equal(result.status, before.status);
  });

  it('active plan with future renewsAt returns state unchanged', () => {
    const { exports } = makeModule();
    exports.topUpStableBalance(500, 'test');
    exports.activatePlan('spark', 'stable', { autoRenew: true });
    const result = exports.processRenewals();
    // renewsAt is 30 days in future → no renewal triggered
    assert.equal(result.activePlanId, 'supporter');
    assert.equal(result.status, 'active');
  });

  it('expired plan with sufficient balance renews and deducts cost', () => {
    const { exports, store } = makeModule();
    store['eon:entitlements:v1'] = JSON.stringify({
      activePlanId: 'spark',
      status: 'active',
      paymentAsset: 'stable',
      stableBalanceCents: 500,
      stableCentsPerEonl: 20,
      autoRenew: true,
      renewsAt: new Date(Date.now() - 10000).toISOString(),
      txHistory: [],
      updatedAt: new Date().toISOString()
    });
    const result = exports.processRenewals();
    assert.equal(result.status, 'active');
    assert.equal(result.stableBalanceCents, 400); // 500 - 100 (spark cost)
  });

  it('expired plan with insufficient balance sets status to past_due', () => {
    const { exports, store } = makeModule();
    store['eon:entitlements:v1'] = JSON.stringify({
      activePlanId: 'spark',
      status: 'active',
      paymentAsset: 'stable',
      stableBalanceCents: 50, // less than spark cost (100)
      stableCentsPerEonl: 20,
      autoRenew: true,
      renewsAt: new Date(Date.now() - 10000).toISOString(),
      txHistory: [],
      updatedAt: new Date().toISOString()
    });
    const result = exports.processRenewals();
    assert.equal(result.status, 'past_due');
  });
});

describe('entitlements — activatePlan', () => {
  it('activating free plan always succeeds with no cost', () => {
    const { exports } = makeModule();
    const result = exports.activatePlan('free', 'stable');
    assert.equal(result.ok, true);
    assert.equal(result.plan.id, 'free');
    assert.equal(result.state.status, 'inactive');
  });

  it('activating spark without sufficient stable balance returns insufficient_stable error', () => {
    const { exports } = makeModule();
    const result = exports.activatePlan('spark', 'stable');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'insufficient_stable');
  });

  it('activating spark with sufficient balance succeeds and sets status active', () => {
    const { exports } = makeModule();
    exports.topUpStableBalance(500, 'test');
    const result = exports.activatePlan('spark', 'stable');
    assert.equal(result.ok, true);
    assert.equal(result.state.activePlanId, 'supporter');
    assert.equal(result.state.status, 'active');
  });

  it('invalid plan id normalizes to free and activates successfully', () => {
    const { exports } = makeModule();
    const result = exports.activatePlan('nonexistent', 'stable');
    assert.equal(result.ok, true);
    assert.equal(result.plan.id, 'free');
  });
});

describe('entitlements — applyRemoteEntitlement', () => {
  it('null payload returns current state unchanged', () => {
    const { exports } = makeModule();
    const state = exports.getEntitlementState();
    const result = exports.applyRemoteEntitlement(null);
    assert.equal(result.activePlanId, state.activePlanId);
  });

  it('payload without tier field returns current state unchanged', () => {
    const { exports } = makeModule();
    const result = exports.applyRemoteEntitlement({ status: 'active' });
    assert.equal(result.activePlanId, 'free');
  });

  it('valid payload with known tier applies plan correctly', () => {
    const { exports } = makeModule();
    const result = exports.applyRemoteEntitlement({ tier: 'pro', status: 'active' });
    assert.equal(result.activePlanId, 'pro');
    assert.equal(result.status, 'active');
  });

  it('valid payload records remote-sync entry in txHistory', () => {
    const { exports } = makeModule();
    exports.applyRemoteEntitlement({ tier: 'core', status: 'active' });
    const state = exports.getEntitlementState();
    const syncEntry = state.txHistory.find((t) => t.type === 'remote-sync');
    assert.ok(syncEntry, 'expected remote-sync entry in txHistory');
    assert.equal(syncEntry.source, 'core');
  });
});

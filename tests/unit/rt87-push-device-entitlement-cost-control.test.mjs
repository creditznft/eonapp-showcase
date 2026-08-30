import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  EON_PUSH_DEVICE_LIMITS,
  getEonPushDeviceEntitlementTruth,
  pruneEonPushSubscriptionsToPolicy,
  resolveEonPushDevicePolicy
} from '../../functions/_shared/eon-push-device-policy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('RT87 exact plan caps are server-authoritative and cost-protect free/trial/grace states', () => {
  assert.deepEqual(EON_PUSH_DEVICE_LIMITS, { free: 1, trial: 1, plus: 2, studio: 3, power: 4, max: 5 });
  const cases = [
    [null, 1, 'free'],
    [{ tier_id: 'plus', status: 'trialing' }, 1, 'free'],
    [{ tier_id: 'plus', status: 'active' }, 2, 'plus'],
    [{ tier_id: 'studio', status: 'active' }, 3, 'studio'],
    [{ tier_id: 'power', status: 'active' }, 4, 'power'],
    [{ tier_id: 'max', status: 'active' }, 5, 'max'],
    [{ tier_id: 'max', status: 'cancelling' }, 5, 'max'],
    [{ tier_id: 'max', status: 'grace' }, 1, 'free'],
    [{ tier_id: 'max', status: 'past_due' }, 1, 'free'],
    [{ tier_id: 'max', status: 'revoked' }, 1, 'free']
  ];
  for (const [entitlement, expected, effectiveTier] of cases) {
    const policy = resolveEonPushDevicePolicy(entitlement);
    assert.equal(policy.maxActiveDevices, expected);
    assert.equal(policy.effectiveDeviceTier, effectiveTier);
    assert.equal(policy.serverAuthoritative, true);
    assert.equal(policy.browserOverrideAllowed, false);
  }
  const truth = getEonPushDeviceEntitlementTruth();
  assert.deepEqual(truth.paidMultiDeviceStatuses, ['active', 'cancelling']);
  assert.equal(truth.freeAndTrialDevices, 1);
});

test('RT87 pruning keeps only the newest server-allowed active devices', async () => {
  const observed = {};
  const database = {
    prepare(sql) {
      observed.sql = sql;
      return {
        bind(...args) {
          observed.args = args;
          return { async run() { return { meta: { changes: 3 } }; } };
        }
      };
    }
  };
  const policy = resolveEonPushDevicePolicy({ tier_id: 'plus', status: 'active' });
  const result = await pruneEonPushSubscriptionsToPolicy(database, 'acct_123', policy, 123456);
  assert.match(observed.sql, /ORDER BY updated_at DESC LIMIT \?/);
  assert.deepEqual(observed.args, [123456, 123456, 'acct_123', 'acct_123', 2]);
  assert.equal(result.maxActiveDevices, 2);
  assert.equal(result.olderDevicesDisabled, 3);
});

test('RT87 source gate passes', () => {
  const result = spawnSync(process.execPath, ['scripts/rt87-push-device-entitlement-gate.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /\[RT87\] PASS 17\/17/);
});

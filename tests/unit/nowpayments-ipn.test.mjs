import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { onRequestPost, sortObject, validatePaymentAgainstPlan } from '../../functions/api/nowpayments/ipn.js';
import { getPlanByPublicId } from '../../functions/api/nowpayments/_config.js';

class MemoryKV {
  constructor() { this.store = new Map(); }
  async get(key, type) {
    if (!this.store.has(key)) return null;
    const value = this.store.get(key);
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) {
    this.store.set(key, String(value));
  }
}

const SECRET = 'unit-test-secret';

function signatureFor(payload) {
  return createHmac('sha512', SECRET).update(JSON.stringify(sortObject(payload))).digest('hex');
}

async function postIpn(kv, payload) {
  const body = JSON.stringify(payload);
  const req = new Request('https://eonapp.test/api/nowpayments/ipn', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nowpayments-sig': signatureFor(payload)
    },
    body
  });
  const res = await onRequestPost({ request: req, env: { NOWPAYMENTS_IPN_SECRET: SECRET, NOWPAYMENTS_SUBS_KV: kv } });
  return { status: res.status, body: await res.json() };
}

describe('NOWPayments IPN hardening', () => {
  it('validates a matching USD plan amount', () => {
    const validation = validatePaymentAgainstPlan({ price_amount: 10, price_currency: 'usd' }, getPlanByPublicId('pro'));
    assert.equal(validation.ok, true);
    assert.equal(validation.reason, 'price_validated');
  });

  it('rejects underpaid USD plan amount', () => {
    const validation = validatePaymentAgainstPlan({ price_amount: 1, price_currency: 'usd' }, getPlanByPublicId('pro'));
    assert.equal(validation.ok, false);
    assert.equal(validation.reason, 'under_expected_price');
  });

  it('credits a finished payment exactly once even if a changed finished webhook arrives later', async () => {
    const kv = new MemoryKV();
    const base = {
      payment_id: 'np_test_payment_1',
      payment_status: 'finished',
      subscription_plan_id: '1436661614',
      price_amount: 10,
      price_currency: 'usd'
    };

    const first = await postIpn(kv, base);
    assert.equal(first.status, 200);
    assert.equal(first.body.credit_applied, true);

    const storedAfterFirst = await kv.get('np:payment:np_test_payment_1', 'json');
    assert.equal(storedAfterFirst.credit_applied, true);
    const firstRenewsAt = storedAfterFirst.entitlement.renews_at;

    const changedDuplicate = await postIpn(kv, { ...base, actually_paid: 10, updated_marker: 'second-payload', price_amount: 1 });
    assert.equal(changedDuplicate.status, 200);
    assert.equal(changedDuplicate.body.credit_applied, false);
    assert.equal(changedDuplicate.body.credit_blocked_reason, 'already_credited');

    const storedAfterSecond = await kv.get('np:payment:np_test_payment_1', 'json');
    assert.equal(storedAfterSecond.entitlement.renews_at, firstRenewsAt);
    assert.equal(storedAfterSecond.event_count, 2);
    assert.equal(storedAfterSecond.payment_validation.ok, true);
    assert.equal(storedAfterSecond.payload.updated_marker, undefined);
  });

  it('does not activate finished payment when the price is below the plan price', async () => {
    const kv = new MemoryKV();
    const res = await postIpn(kv, {
      payment_id: 'np_underpaid_1',
      payment_status: 'finished',
      subscription_plan_id: '1436661614',
      price_amount: 1,
      price_currency: 'usd'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.credit_applied, false);
    assert.equal(res.body.credit_blocked_reason, 'under_expected_price');

    const stored = await kv.get('np:payment:np_underpaid_1', 'json');
    assert.equal(stored.entitlement.status, 'pending');
    assert.equal(stored.entitlement.activation_blocked_reason, 'under_expected_price');
  });

  it('does not activate partially_paid payment even when plan and amount fields are present', async () => {
    const kv = new MemoryKV();
    const res = await postIpn(kv, {
      payment_id: 'np_partial_1',
      payment_status: 'partially_paid',
      subscription_plan_id: '1436661614',
      price_amount: 10,
      price_currency: 'usd'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.credit_applied, false);

    const stored = await kv.get('np:payment:np_partial_1', 'json');
    assert.equal(stored.entitlement.status, 'pending');
    assert.equal(stored.credit_applied, false);
  });
});

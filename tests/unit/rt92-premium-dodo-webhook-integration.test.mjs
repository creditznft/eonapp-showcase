import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyPremiumBillingMigration } from '../helpers/eon-d1-test-migrations.mjs';
import { buildBillingPublicState, deriveBillingTransition } from '../../assets/js/billing/eon-billing-lifecycle.js';
import { applyDodoWebhookToD1, detectDodoPremiumProduct, normalizeDodoWebhookPayload } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { prepareBillingCommand, readBillingCommand, updateBillingCommand } from '../../assets/js/billing/eon-billing-command-ledger.js';

class Statement { constructor(db, sql, args=[]){this.db=db;this.sql=sql;this.args=args;} bind(...args){return new Statement(this.db,this.sql,args);} run(){return this.db.prepare(this.sql).run(...this.args);} first(){return this.db.prepare(this.sql).get(...this.args)||null;} all(){return {results:this.db.prepare(this.sql).all(...this.args)}} }
function makeD1(){const sqlite=new DatabaseSync(':memory:');applyBillingMigrations(sqlite);applyPremiumBillingMigration(sqlite);return{sqlite,prepare(sql){return new Statement(sqlite,sql)}};}
const env=(db,rollout='disabled')=>({EON_BILLING_DB:db,EON_PREMIUM_CHECKOUT_ROLLOUT:rollout,DODO_PRODUCT_PRO:'pdt_pro',DODO_PRODUCT_ULTRA:'pdt_ultra',DODO_PRODUCT_ULTIMATE:'pdt_ultimate'});

test('billing lifecycle recognizes Pro and Ultra as recurring paid tiers without treating Ultimate as a subscription tier',()=>{
 const now=1000;
 const pro=deriveBillingTransition(null,{eventType:'subscription_active',tierId:'pro',occurredAt:now,currentPeriodEnd:5000},{now});
 const ultra=deriveBillingTransition(null,{eventType:'subscription_active',tierId:'ultra',occurredAt:now,currentPeriodEnd:5000},{now});
 const ultimate=deriveBillingTransition(null,{eventType:'payment_succeeded',tierId:'ultimate',occurredAt:now},{now});
 assert.equal(pro.next.tierId,'pro'); assert.equal(pro.accessActive,true);
 assert.equal(ultra.next.tierId,'ultra'); assert.equal(ultra.accessActive,true);
 assert.equal(ultimate.next.tierId,'free'); assert.equal(ultimate.accessActive,false);
 const state=buildBillingPublicState({tier_id:'pro',status:'active'},{tier_id:'pro',access_status:'active',current_period_end:5000},{now});
 assert.equal(state.tierId,'pro'); assert.equal(state.accessActive,true);
});

test('premium product detection requires exact configured product id',()=>{
 const db=makeD1();
 const payload={type:'payment.succeeded',data:{product_cart:[{product_id:'pdt_ultimate'}],payment_id:'pay_1',metadata:{eon_account_id:'acct_1',eon_tier_id:'ultimate'}}};
 const detected=detectDodoPremiumProduct(payload,env(db));
 assert.equal(detected.tier,'ultimate'); assert.equal(detected.verifiedProductMatch,true); assert.equal(detected.accountId,'acct_1');
 const mismatch=detectDodoPremiumProduct({...payload,data:{...payload.data,product_cart:[{product_id:'other_product'}]}},env(db));
 assert.equal(mismatch.tier,'ultimate'); assert.equal(mismatch.verifiedProductMatch,false);
 db.sqlite.close();
});

test('normal Dodo payload maps exact Pro/Ultra product ids into recurring tier lifecycle',()=>{
 const db=makeD1();
 const pro=normalizeDodoWebhookPayload({type:'subscription.active',data:{product_id:'pdt_pro',metadata:{eon_account_id:'acct_pro'}}},env(db,'testing'),'evt_pro');
 const ultra=normalizeDodoWebhookPayload({type:'subscription.active',data:{product_id:'pdt_ultra',metadata:{eon_account_id:'acct_ultra'}}},env(db,'testing'),'evt_ultra');
 assert.equal(pro.tierId,'pro'); assert.equal(ultra.tierId,'ultra');
 db.sqlite.close();
});

async function signWebhook({ id, timestamp, payload, secret }) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
  let binary=''; for (const byte of new Uint8Array(signature)) binary+=String.fromCharCode(byte);
  return btoa(binary);
}
function liveEnv(db, rollout='disabled') { return { ...env(db, rollout), EON_BILLING_ROLLOUT:'testing', DODO_PAYMENTS_API_KEY:'test_api', DODO_WEBHOOK_SECRET:'whsec_test', EON_ENTITLEMENT_SIGNING_KEY:'sign_test', DODO_PRODUCT_PLUS:'p_plus', DODO_PRODUCT_STUDIO:'p_studio', DODO_PRODUCT_POWER:'p_power', DODO_PRODUCT_MAX:'p_max' }; }
async function webhookRequest(payload, secret='whsec_test', id='wh_premium_1') {
  const raw=JSON.stringify(payload); const timestamp=String(Math.floor(Date.now()/1000)); const signature=await signWebhook({id,timestamp,payload:raw,secret});
  return new Request('https://eonapp.ch/api/billing/webhooks/dodo',{method:'POST',headers:{'content-type':'application/json','webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':signature},body:raw});
}


test('signed Pro recurring webhook does not depend on the separate Ultimate software rollout', async()=>{
  const { processDodoWebhook } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const db=makeD1(); const e=liveEnv(db,'disabled');
  const request=await webhookRequest({type:'subscription.active',timestamp:new Date().toISOString(),data:{product_id:'pdt_pro',subscription_id:'sub_pro_unified',customer_id:'cus_pro_unified',metadata:{eon_account_id:'acct_pro_unified',eon_tier_id:'pro'}}},e.DODO_WEBHOOK_SECRET,'wh_pro_unified');
  const result=await processDodoWebhook({request,env:e});
  assert.equal(result.ok,true);
  const entitlement=db.sqlite.prepare(`SELECT tier_id, status FROM eon_entitlements WHERE account_id='acct_pro_unified'`).get();
  assert.equal(entitlement.tier_id,'pro');
  assert.ok(['active','trialing'].includes(entitlement.status));
  db.sqlite.close();
});
test('signed premium webhook is retryable and grants nothing while premium rollout is disabled', async()=>{
  const { processDodoWebhook } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const db=makeD1();
  const request=await webhookRequest({type:'payment.succeeded',timestamp:new Date().toISOString(),data:{product_id:'pdt_ultimate',payment_id:'pay_disabled',metadata:{eon_account_id:'acct_disabled',eon_tier_id:'ultimate'}}});
  const result=await processDodoWebhook({request,env:liveEnv(db,'disabled')});
  assert.equal(result.ok,false); assert.equal(result.httpStatus,503); assert.equal(result.status,'premium_webhook_rollout_disabled');
  assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS count FROM eon_software_grants`).get().count,0);
  db.sqlite.close();
});

test('signed exact Ultimate payment webhook grants software, refund revokes it, and neither grants hosted capacity', async()=>{
  const { processDodoWebhook } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const db=makeD1(); const e=liveEnv(db,'testing');
  const paid=await webhookRequest({type:'payment.succeeded',timestamp:new Date().toISOString(),data:{product_id:'pdt_ultimate',payment_id:'pay_u_live',order_id:'ord_u_live',metadata:{eon_account_id:'acct_u_live',eon_tier_id:'ultimate'}}},e.DODO_WEBHOOK_SECRET,'wh_u_paid');
  const applied=await processDodoWebhook({request:paid,env:e});
  assert.equal(applied.ok,true); assert.equal(applied.softwareBundle,'ultimate'); assert.equal(applied.hostedCapacityGranted,false);
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_live'`).get().status,'active');
  const refund=await webhookRequest({type:'refund.succeeded',timestamp:new Date().toISOString(),data:{product_id:'pdt_ultimate',payment_id:'pay_u_live',order_id:'ord_u_live'}},e.DODO_WEBHOOK_SECRET,'wh_u_refund');
  const revoked=await processDodoWebhook({request:refund,env:e});
  assert.equal(revoked.ok,true); assert.equal(revoked.ledgerEventType,'software_revoke');
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_live'`).get().status,'revoked');
  db.sqlite.close();
});


test('subscription creation failure closes the pending checkout command without creating past-due entitlement', async () => {
  const db = makeD1();
  const prepared = await prepareBillingCommand(db, { accountId: 'acct_failed_create', operation: 'checkout', requestedTierId: 'pro', idempotencyKey: 'checkout-failed-create-1', statePrecondition: 'free' }, { now: 1000 });
  assert.equal(prepared.ok, true);
  await updateBillingCommand(db, prepared.command.commandId, { status: 'provider_accepted', resultStatus: 'checkout_created' }, { now: 1100 });
  const applied = await applyDodoWebhookToD1(db, {
    providerEventId: 'evt_subscription_create_failed', rawEventType: 'subscription.failed', eventType: 'subscription_failed',
    accountId: 'acct_failed_create', tierId: 'pro', checkoutAttemptId: prepared.command.commandId, occurredAt: 1200
  }, JSON.stringify({ type: 'subscription.failed' }));
  assert.equal(applied.ok, true);
  assert.equal(applied.entitlementChanged, false);
  assert.equal(applied.processingStatus, 'processed_no_entitlement_change');
  assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS count FROM eon_entitlements WHERE account_id='acct_failed_create'`).get().count, 0);
  assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS count FROM eon_billing_lifecycle WHERE account_id='acct_failed_create'`).get().count, 0);
  const command = await readBillingCommand(db, 'acct_failed_create', 'checkout-failed-create-1');
  assert.equal(command.status, 'failed');
  assert.equal(command.resultStatus, 'subscription_failed');
  assert.equal(command.errorCode, 'subscription_creation_failed');
  db.sqlite.close();
});

test('billing payment-reference authority correlates product-less subscription payments and refunds back to the verified account', async () => {
  const db = makeD1();
  const e = liveEnv(db, 'testing');
  const activated = normalizeDodoWebhookPayload({ type: 'subscription.active', timestamp: '2026-08-17T10:00:00Z', data: { subscription_id: 'sub_corr_1', customer_id: 'cus_corr_1', product_id: 'pdt_pro', metadata: { eon_account_id: 'acct_corr_1' } } }, e, 'evt_corr_active');
  await applyDodoWebhookToD1(db, activated, JSON.stringify({ type: 'subscription.active' }));

  const paid = normalizeDodoWebhookPayload({ type: 'payment.succeeded', timestamp: '2026-08-17T11:00:00Z', data: { subscription_id: 'sub_corr_1', customer_id: 'cus_corr_1', payment_id: 'pay_corr_1' } }, e, 'evt_corr_paid');
  assert.equal(paid.accountId, '');
  assert.equal(paid.tierId, 'free');
  const paidApplied = await applyDodoWebhookToD1(db, paid, JSON.stringify({ type: 'payment.succeeded' }));
  assert.equal(paidApplied.entitlementChanged, true);
  const ref = db.sqlite.prepare(`SELECT account_id, tier_id, provider_subscription_ref FROM eon_billing_payment_refs WHERE payment_ref='pay_corr_1'`).get();
  assert.deepEqual({ accountId: ref.account_id, tierId: ref.tier_id, subscriptionRef: ref.provider_subscription_ref }, { accountId: 'acct_corr_1', tierId: 'pro', subscriptionRef: 'sub_corr_1' });

  const refunded = normalizeDodoWebhookPayload({ type: 'refund.succeeded', timestamp: '2026-08-17T12:00:00Z', data: { payment_id: 'pay_corr_1', refund_id: 'ref_corr_1', metadata: {} } }, e, 'evt_corr_refund');
  assert.equal(refunded.accountId, '');
  const refundApplied = await applyDodoWebhookToD1(db, refunded, JSON.stringify({ type: 'refund.succeeded' }));
  assert.equal(refundApplied.entitlementChanged, true);
  const entitlement = db.sqlite.prepare(`SELECT tier_id, status FROM eon_entitlements WHERE account_id='acct_corr_1'`).get();
  assert.equal(entitlement.tier_id, 'free');
  assert.equal(entitlement.status, 'revoked');
  db.sqlite.close();
});

test('Ultimate refund resolves from prior verified payment reference even when Dodo refund payload has no product id or EON metadata', async () => {
  const db = makeD1(); const e = liveEnv(db, 'testing');
  const paid = await webhookRequest({ type: 'payment.succeeded', timestamp: new Date().toISOString(), data: { product_id: 'pdt_ultimate', payment_id: 'pay_u_corr', order_id: 'ord_u_corr', metadata: { eon_account_id: 'acct_u_corr', eon_tier_id: 'ultimate' } } }, e.DODO_WEBHOOK_SECRET, 'wh_u_corr_paid');
  const granted = await (await import('../../assets/js/billing/eon-dodo-live-runtime.js')).processDodoWebhook({ request: paid, env: e });
  assert.equal(granted.ok, true);
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_corr'`).get().status, 'active');

  const refund = await webhookRequest({ type: 'refund.succeeded', timestamp: new Date().toISOString(), data: { payment_id: 'pay_u_corr', refund_id: 'ref_u_corr', metadata: {} } }, e.DODO_WEBHOOK_SECRET, 'wh_u_corr_refund');
  const revoked = await (await import('../../assets/js/billing/eon-dodo-live-runtime.js')).processDodoWebhook({ request: refund, env: e });
  assert.equal(revoked.ok, true);
  assert.equal(revoked.softwareBundle, 'ultimate');
  assert.equal(revoked.hostedCapacityGranted, false);
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_corr'`).get().status, 'revoked');
  db.sqlite.close();
});

test('payment-only dispute open and dispute won restore the verified recurring tier through payment-reference authority', async () => {
  const db = makeD1(); const e = liveEnv(db, 'testing');
  const active = normalizeDodoWebhookPayload({ type: 'subscription.active', timestamp: '2026-08-17T10:00:00Z', data: { subscription_id: 'sub_disp_1', customer_id: 'cus_disp_1', product_id: 'pdt_pro', metadata: { eon_account_id: 'acct_disp_1' } } }, e, 'evt_disp_active');
  await applyDodoWebhookToD1(db, active, JSON.stringify({ type: 'subscription.active' }));
  const paid = normalizeDodoWebhookPayload({ type: 'payment.succeeded', timestamp: '2026-08-17T11:00:00Z', data: { subscription_id: 'sub_disp_1', customer_id: 'cus_disp_1', payment_id: 'pay_disp_1' } }, e, 'evt_disp_paid');
  await applyDodoWebhookToD1(db, paid, JSON.stringify({ type: 'payment.succeeded' }));

  const opened = normalizeDodoWebhookPayload({ type: 'dispute.opened', timestamp: '2026-08-17T12:00:00Z', data: { payment_id: 'pay_disp_1', dispute_id: 'dsp_1' } }, e, 'evt_disp_opened');
  const openedApplied = await applyDodoWebhookToD1(db, opened, JSON.stringify({ type: 'dispute.opened' }));
  assert.equal(openedApplied.entitlementChanged, true);
  let entitlement = db.sqlite.prepare(`SELECT tier_id, status FROM eon_entitlements WHERE account_id='acct_disp_1'`).get();
  assert.equal(entitlement.tier_id, 'free');
  assert.equal(entitlement.status, 'disputed');

  const won = normalizeDodoWebhookPayload({ type: 'dispute.won', timestamp: '2026-08-17T13:00:00Z', data: { payment_id: 'pay_disp_1', dispute_id: 'dsp_1' } }, e, 'evt_disp_won');
  const wonApplied = await applyDodoWebhookToD1(db, won, JSON.stringify({ type: 'dispute.won' }));
  assert.equal(wonApplied.entitlementChanged, true);
  entitlement = db.sqlite.prepare(`SELECT tier_id, status FROM eon_entitlements WHERE account_id='acct_disp_1'`).get();
  assert.equal(entitlement.tier_id, 'pro');
  assert.equal(entitlement.status, 'active');
  db.sqlite.close();
});

test('verified subscription.plan_changed moves Pro to Ultra only after signed provider lifecycle evidence', async () => {
  const db = makeD1(); const e = liveEnv(db, 'testing');
  const active = normalizeDodoWebhookPayload({ type: 'subscription.active', timestamp: '2026-08-17T10:00:00Z', data: { subscription_id: 'sub_plan_1', customer_id: 'cus_plan_1', product_id: 'pdt_pro', metadata: { eon_account_id: 'acct_plan_1' } } }, e, 'evt_plan_active');
  await applyDodoWebhookToD1(db, active, JSON.stringify({ type: 'subscription.active' }));
  const changed = normalizeDodoWebhookPayload({ type: 'subscription.plan_changed', timestamp: '2026-08-17T11:00:00Z', data: { subscription_id: 'sub_plan_1', customer_id: 'cus_plan_1', product_id: 'pdt_ultra', metadata: { eon_account_id: 'acct_plan_1' } } }, e, 'evt_plan_ultra');
  const applied = await applyDodoWebhookToD1(db, changed, JSON.stringify({ type: 'subscription.plan_changed' }));
  assert.equal(applied.entitlementChanged, true);
  const entitlement = db.sqlite.prepare(`SELECT tier_id, status FROM eon_entitlements WHERE account_id='acct_plan_1'`).get();
  assert.equal(entitlement.tier_id, 'ultra');
  assert.equal(entitlement.status, 'active');
  db.sqlite.close();
});

test('Ultimate dispute won restores a payment-only reversal from the prior verified software grant', async () => {
  const { processDodoWebhook } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const db = makeD1(); const e = liveEnv(db, 'testing');
  const paid = await webhookRequest({ type: 'payment.succeeded', timestamp: new Date().toISOString(), data: { product_id: 'pdt_ultimate', payment_id: 'pay_u_dispute', order_id: 'ord_u_dispute', metadata: { eon_account_id: 'acct_u_dispute', eon_tier_id: 'ultimate' } } }, e.DODO_WEBHOOK_SECRET, 'wh_u_dispute_paid');
  assert.equal((await processDodoWebhook({ request: paid, env: e })).ok, true);
  const opened = await webhookRequest({ type: 'dispute.opened', timestamp: new Date().toISOString(), data: { payment_id: 'pay_u_dispute', dispute_id: 'dsp_u_1' } }, e.DODO_WEBHOOK_SECRET, 'wh_u_dispute_opened');
  assert.equal((await processDodoWebhook({ request: opened, env: e })).ledgerEventType, 'software_revoke');
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_dispute'`).get().status, 'revoked');
  const won = await webhookRequest({ type: 'dispute.won', timestamp: new Date().toISOString(), data: { payment_id: 'pay_u_dispute', dispute_id: 'dsp_u_1' } }, e.DODO_WEBHOOK_SECRET, 'wh_u_dispute_won');
  const restored = await processDodoWebhook({ request: won, env: e });
  assert.equal(restored.ok, true);
  assert.equal(restored.ledgerEventType, 'software_restore');
  assert.equal(db.sqlite.prepare(`SELECT status FROM eon_software_grants WHERE account_id='acct_u_dispute'`).get().status, 'active');
  db.sqlite.close();
});

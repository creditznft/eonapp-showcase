import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyPremiumBillingMigration } from '../helpers/eon-d1-test-migrations.mjs';
import { prepareBillingCommand } from '../../assets/js/billing/eon-billing-command-ledger.js';
import { createPremiumDodoCheckoutSession, getPremiumDodoRuntimeConfig, normalizePremiumCheckoutRequest } from '../../assets/js/billing/eon-premium-dodo-runtime.js';
import { createDodoCheckoutSession } from '../../assets/js/billing/eon-dodo-live-runtime.js';

class Statement { constructor(db, sql, args = []) { this.db=db; this.sql=sql; this.args=args; } bind(...args){return new Statement(this.db,this.sql,args);} run(){return this.db.prepare(this.sql).run(...this.args);} first(){return this.db.prepare(this.sql).get(...this.args)||null;} all(){return {results:this.db.prepare(this.sql).all(...this.args)}} }
function makeD1(){ const sqlite=new DatabaseSync(':memory:'); applyBillingMigrations(sqlite); applyPremiumBillingMigration(sqlite); return {sqlite,prepare(sql){return new Statement(sqlite,sql)}}; }
function env(db, rollout='disabled'){ return { EON_PREMIUM_CHECKOUT_ROLLOUT: rollout, EON_BILLING_ROLLOUT:'testing', EON_BILLING_DB:db, DODO_PAYMENTS_API_KEY:'test_key', DODO_WEBHOOK_SECRET:'test_webhook', EON_ENTITLEMENT_SIGNING_KEY:'test_sign', DODO_PRODUCT_PLUS:'p_plus',DODO_PRODUCT_STUDIO:'p_studio',DODO_PRODUCT_POWER:'p_power',DODO_PRODUCT_MAX:'p_max', DODO_PRODUCT_PRO:'pdt_pro',DODO_PRODUCT_ULTRA:'pdt_ultra',DODO_PRODUCT_ULTIMATE:'pdt_ultimate' }; }

test('premium checkout runtime stays fail-closed while rollout is disabled', async()=>{
 const db=makeD1(); const cfg=getPremiumDodoRuntimeConfig(env(db)); assert.equal(cfg.active,false); assert.ok(cfg.missing.includes('EON_PREMIUM_CHECKOUT_ROLLOUT'));
 const result=await createPremiumDodoCheckoutSession({request:new Request('https://eonapp.ch/api/billing/checkout'),env:env(db),accountId:'acct_1',input:{tier:'ultimate',idempotencyKey:'software:ultimate:test-0001'},fetchImpl:async()=>{throw new Error('must-not-call')}});
 assert.equal(result.status,'premium_checkout_disabled'); db.sqlite.close();
});


test('premium Dodo environment is test for testing rollout, live for production, and mismatches fail closed',()=>{
 const db=makeD1();
 const testing=getPremiumDodoRuntimeConfig({...env(db,'testing'),DODO_API_ENVIRONMENT:'test'});
 assert.equal(testing.active,true); assert.equal(testing.apiBase,'https://test.dodopayments.com');
 const production=getPremiumDodoRuntimeConfig({...env(db,'production'),DODO_API_ENVIRONMENT:'live'});
 assert.equal(production.active,true); assert.equal(production.apiBase,'https://live.dodopayments.com');
 const mismatch=getPremiumDodoRuntimeConfig({...env(db,'testing'),DODO_API_ENVIRONMENT:'live'});
 assert.equal(mismatch.active,false); assert.ok(mismatch.missing.includes('DODO_API_ENVIRONMENT'));
 db.sqlite.close();
});

test('premium request rejects browser entitlement and hosted-capacity claims',()=>{
 const result=normalizePremiumCheckoutRequest({tier:'ultimate',idempotencyKey:'software:ultimate:test-0001',browserEntitlementClaim:true,hostedCapacityClaim:true},{DODO_PRODUCT_ULTIMATE:'pdt_u'});
 assert.equal(result.ok,false); assert.ok(result.errors.includes('browser-entitlement-or-capacity-claim-rejected'));
});

test('billing command ledger represents recurring tiers and Ultimate software purchase with distinct operations', async()=>{
 const db=makeD1();
 const pro=await prepareBillingCommand(db,{accountId:'acct_pro',operation:'checkout',requestedTierId:'pro',idempotencyKey:'checkout:pro:test-0002',statePrecondition:'no-active-subscription'},{now:1000});
 assert.equal(pro.ok,true); assert.equal(pro.command.requestedTierId,'pro'); assert.equal(pro.command.trialDays,7);
 const ultimate=await prepareBillingCommand(db,{accountId:'acct_u',operation:'software-purchase',requestedTierId:'ultimate',idempotencyKey:'software:ultimate:test-0003',statePrecondition:'no-active-ultimate-grant'},{now:1000});
 assert.equal(ultimate.ok,true); assert.equal(ultimate.command.requestedTierId,'ultimate'); assert.equal(ultimate.command.trialDays,0);
 db.sqlite.close();
});

test('main recurring Dodo runtime creates Pro hosted checkout with 7-day trial and grants nothing directly', async()=>{
 const db=makeD1(); let calls=0;
 const fetchImpl=async(url,options)=>{calls++; assert.equal(url,'https://test.dodopayments.com/checkouts'); const body=JSON.parse(options.body); assert.equal(body.product_cart[0].product_id,'pdt_pro'); assert.equal(body.subscription_data.trial_period_days,7); assert.equal(body.metadata.eon_tier_id,'pro'); return {ok:true,status:200,async json(){return {session_id:'sess_pro',checkout_url:'https://checkout.dodopayments.com/session/pro-safe'}}};};
 const result=await createDodoCheckoutSession({request:new Request('https://eonapp.ch/api/billing/checkout'),env:env(db,'testing'),accountId:'acct_pro_checkout',input:{tier:'pro',idempotencyKey:'checkout:pro:test-0004'},fetchImpl});
 assert.equal(result.ok,true); assert.equal(result.entitlementGranted,false); assert.equal(result.trialDays,7); assert.equal(calls,1); db.sqlite.close();
});

test('Ultimate one-time checkout contains no subscription trial and cannot include hosted capacity', async()=>{
 const db=makeD1();
 const fetchImpl=async(_url,options)=>{const body=JSON.parse(options.body); assert.equal(body.product_cart[0].product_id,'pdt_ultimate'); assert.equal('subscription_data' in body,false); assert.equal(body.metadata.eon_hosted_capacity,'separate'); return {ok:true,status:200,async json(){return {session_id:'sess_u',checkout_url:'https://checkout.dodopayments.com/session/u-safe'}}};};
 const result=await createPremiumDodoCheckoutSession({request:new Request('https://eonapp.ch/api/billing/checkout'),env:env(db,'testing'),accountId:'acct_u_checkout',input:{tier:'ultimate',idempotencyKey:'software:ultimate:test-0005'},fetchImpl});
 assert.equal(result.ok,true); assert.equal(result.pricingKind,'one-time-software'); assert.equal(result.trialDays,0); assert.equal(result.hostedCapacityGranted,false); db.sqlite.close();
});

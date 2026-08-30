import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBillingAction, executeDodoSubscriptionAction, previewDodoSubscriptionChange, getDodoCustomerActionTruth } from '../../assets/js/billing/eon-dodo-customer-actions.js';
import { resolveEonPushDevicePolicy } from '../../functions/_shared/eon-push-device-policy.js';
import { isEonPaidAdFreeBillingState } from '../../functions/_shared/eon-monetization-eligibility.js';

const proEntitlement={tier_id:'pro',status:'active',provider_subscription_ref:'sub_pro',provider_customer_ref:'cus_pro'};
const env=(rollout='disabled')=>({EON_BILLING_ROLLOUT:'testing',EON_BILLING_DB:{prepare(){}},DODO_PAYMENTS_API_KEY:'test',DODO_WEBHOOK_SECRET:'test',EON_ENTITLEMENT_SIGNING_KEY:'test',DODO_PRODUCT_PLUS:'p_plus',DODO_PRODUCT_STUDIO:'p_studio',DODO_PRODUCT_POWER:'p_power',DODO_PRODUCT_MAX:'p_max',EON_PREMIUM_CHECKOUT_ROLLOUT:rollout,DODO_PRODUCT_PRO:'p_pro',DODO_PRODUCT_ULTRA:'p_ultra',DODO_PRODUCT_ULTIMATE:'p_ultimate'});

test('Pro and Ultra participate in reviewed subscription rank without becoming a second subscription system',()=>{
 const downgrade=normalizeBillingAction({action:'change-plan',tier:'max',confirmed:true,idempotencyKey:'change:max:from-pro-0001'},proEntitlement);
 assert.equal(downgrade.ok,true); assert.equal(downgrade.currentTier,'pro'); assert.equal(downgrade.isDowngrade,true); assert.equal(downgrade.effectiveAt,'next_billing_date');
 const upgrade=normalizeBillingAction({action:'change-plan',tier:'ultra',confirmed:true,idempotencyKey:'change:ultra:from-pro-0002'},proEntitlement);
 assert.equal(upgrade.ok,true); assert.equal(upgrade.isDowngrade,false); assert.equal(upgrade.effectiveAt,'immediately');
});

test('Pro and Ultra use the same active recurring Dodo lifecycle as Plus through Max', async()=>{
 let upgradeCalled=false;
 const upgrade=await executeDodoSubscriptionAction({env:env('disabled'),input:{action:'change-plan',tier:'ultra',confirmed:true,idempotencyKey:'change:ultra:active-0003'},entitlement:proEntitlement,fetchImpl:async(_url,options)=>{upgradeCalled=true;const body=JSON.parse(options.body);assert.equal(body.product_id,'p_ultra');assert.equal(body.effective_at,'immediately');assert.equal(body.proration_billing_mode,'prorated_immediately');return{ok:true,status:200,async json(){return{}}};}});
 assert.equal(upgrade.ok,true); assert.equal(upgradeCalled,true);
 let downgradeCalled=false;
 const downgrade=await executeDodoSubscriptionAction({env:env('disabled'),input:{action:'change-plan',tier:'max',confirmed:true,idempotencyKey:'change:max:active-0004'},entitlement:proEntitlement,fetchImpl:async(_url,options)=>{downgradeCalled=true;const body=JSON.parse(options.body);assert.equal(body.product_id,'p_max');assert.equal(body.effective_at,'next_billing_date');assert.equal(body.proration_billing_mode,'do_not_bill');return{ok:true,status:200,async json(){return{}}};}});
 assert.equal(downgrade.ok,true); assert.equal(downgradeCalled,true);
});

test('Pro/Ultra stay ad-free and receive no push-device expansion beyond current Max allowance',()=>{
 for(const tier of ['pro','ultra']){
   const policy=resolveEonPushDevicePolicy({tier_id:tier,status:'active'});
   assert.equal(policy.maxActiveDevices,5); assert.equal(policy.effectiveDeviceTier,tier);
   assert.equal(isEonPaidAdFreeBillingState({serverAuthoritative:true,accessActive:true,tierId:tier}),true);
 }
});


test('reviewed plan changes use Dodo preview before mutation and preserve proration semantics', async()=>{
 let previewUrl='';
 const preview=await previewDodoSubscriptionChange({env:env('disabled'),input:{tier:'ultra',idempotencyKey:'preview:ultra:active-0005'},entitlement:proEntitlement,fetchImpl:async(url,options)=>{previewUrl=url;const body=JSON.parse(options.body);assert.equal(body.product_id,'p_ultra');assert.equal(body.effective_at,'immediately');assert.equal(body.proration_billing_mode,'prorated_immediately');return{ok:true,status:200,async json(){return{immediate_charge:{summary:'USD 12.34 due now'}}}};}});
 assert.equal(preview.ok,true); assert.match(previewUrl,/\/change-plan\/preview$/); assert.equal(preview.immediateChargeSummary,'USD 12.34 due now');
 const downgrade=await previewDodoSubscriptionChange({env:env('disabled'),input:{tier:'max',idempotencyKey:'preview:max:active-0006'},entitlement:proEntitlement,fetchImpl:async(_url,options)=>{const body=JSON.parse(options.body);assert.equal(body.effective_at,'next_billing_date');assert.equal(body.proration_billing_mode,'do_not_bill');return{ok:true,status:200,async json(){return{}}};}});
 assert.equal(downgrade.ok,true); assert.equal(downgrade.isDowngrade,true); assert.equal(downgrade.effectiveAt,'next_billing_date');
 const truth=getDodoCustomerActionTruth(); assert.equal(truth.planChangesPreviewBeforeCommit,true);
});

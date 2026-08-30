import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEffectiveCapabilitySnapshot, validateCapabilityEnvelopeForBrowser } from '../../assets/js/capabilities/eon-capability-service.js';

test('active Pro subscription inherits current Max software base plus Pro premium capabilities',()=>{
 const snapshot=buildEffectiveCapabilitySnapshot({accountId:'acct_pro',entitlement:{tier_id:'pro',status:'active'},lifecycle:{tier_id:'pro',access_status:'active',current_period_end:Date.now()+100000},softwareGrants:[],now:Date.now()});
 assert.equal(snapshot.tierId,'pro'); assert.equal(snapshot.tierLabel,'Pro'); assert.equal(snapshot.basePlanId,'max');
 assert.equal(snapshot.limits.projectSlots,250);
 assert.ok(snapshot.premiumCapabilities.includes('local-ai-autopilot'));
 assert.ok(snapshot.featureGroups.includes('premium:local-ai-autopilot'));
 assert.equal(snapshot.hostedCapacityGrantedByUltimate,false);
});

test('active Ultra subscription includes Pro and Ultra software capabilities while preserving separate capacity authority',()=>{
 const now=Date.now(); const snapshot=buildEffectiveCapabilitySnapshot({accountId:'acct_ultra',entitlement:{tier_id:'ultra',status:'active'},lifecycle:{tier_id:'ultra',access_status:'active',current_period_end:now+100000},softwareGrants:[],now});
 assert.equal(snapshot.tierId,'ultra'); assert.ok(snapshot.premiumCapabilities.includes('local-ai-autopilot')); assert.ok(snapshot.premiumCapabilities.includes('client-workspaces')); assert.ok(snapshot.premiumCapabilities.includes('parallel-eonbot-work')); assert.equal(snapshot.capacitySeparateFromSoftwareCapability,true);
});

test('Ultimate is a perpetual software licence layered over the current subscription/base plan rather than a fake subscription tier',()=>{
 const now=Date.now(); const snapshot=buildEffectiveCapabilitySnapshot({accountId:'acct_ultimate',entitlement:null,lifecycle:null,softwareGrants:[{bundleId:'ultimate',status:'active'}],now});
 assert.equal(snapshot.tierId,'free'); assert.equal(snapshot.basePlanId,'free'); assert.deepEqual(snapshot.perpetualLicenses,['ultimate']);
 assert.ok(snapshot.premiumCapabilities.includes('client-workspaces')); assert.ok(snapshot.featureGroups.includes('premium:client-workspaces'));
 assert.equal(snapshot.limits.projectSlots,3,'Ultimate must not silently mint subscription capacity');
 assert.equal(snapshot.hostedCapacityGrantedByUltimate,false);
});

test('browser capability envelope validation accepts server Pro/Ultra tiers but cannot create them',()=>{
 const now=Date.now(); const snapshot=buildEffectiveCapabilitySnapshot({accountId:'acct_pro',entitlement:{tier_id:'pro',status:'active'},lifecycle:{tier_id:'pro',access_status:'active',current_period_end:now+100000},now,serverAuthoritative:true});
 const result=validateCapabilityEnvelopeForBrowser({schema:'eonapp.capability-envelope.a15.v1',algorithm:'HMAC-SHA-256',signature:'present',snapshot},{now});
 assert.equal(result.ok,true); assert.equal(result.snapshot.tierId,'pro'); assert.equal(result.snapshot.browserClaimAccepted,false);
});

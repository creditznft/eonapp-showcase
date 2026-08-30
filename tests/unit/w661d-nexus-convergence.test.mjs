import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getEonNexusMorphicContract, getEonNexusMorphicTruth } from '../../assets/js/nexus/eon-nexus-morphic-contract.js';
import { getEonNexusLivingCorePlan, getEonNexusLivingCoreTruth } from '../../assets/js/nexus/eon-nexus-living-core.js';
import { inspectW661dNexusConvergence } from '../../scripts/w661d-nexus-convergence-gate.mjs';
const env=(queries={},hidden=false)=>({document:{hidden},matchMedia:(q)=>({matches:Boolean(queries[q])})});
const snapshot={eonbot:{state:'processing'},approval:{pending:false},route:{privateOnDevice:true},nodes:[{id:'role:forge',label:'Forge',status:'active',count:2},{id:'role:projects',label:'Projects',status:'waiting',count:1}]};
test('W661A resolves productive immersive and restrained billing contracts',()=>{
 const productive=getEonNexusMorphicContract({page:'forge',context:{allowLiveNexus:true},snapshot,environment:env(),capability:{hidden:false,reducedMotion:false,recommendedMode:'full',webgl:true}});
 assert.equal(productive.productive,true); assert.equal(productive.presentation,'immersive'); assert.equal(productive.renderer,'babylon-living-core'); assert.equal(productive.maxPrimaryControls,3);
 const billing=getEonNexusMorphicContract({page:'billing',context:{presentation:'restrained',allowLiveNexus:false},snapshot,environment:env()});
 assert.equal(billing.restrained,true); assert.equal(billing.allowsLiveNexus,false); assert.match(billing.presentation,/restrained/);
 const truth=getEonNexusMorphicTruth(); assert.equal(truth.secondAssistant,false); assert.equal(truth.automaticWork,false);
});
test('W661A reduced motion and hidden pages preserve static/paused functionality',()=>{
 const reduced=getEonNexusMorphicContract({page:'projects',context:{allowLiveNexus:true},snapshot,environment:env({'(prefers-reduced-motion: reduce)':true})});
 assert.equal(reduced.motionActive,false); assert.equal(reduced.staticFallback,true);
 const hidden=getEonNexusMorphicContract({page:'projects',context:{allowLiveNexus:true},snapshot,environment:env({},true)});
 assert.equal(hidden.presentation,'paused'); assert.equal(hidden.rendererPaused,true);
});
test('W661C plan is bounded, privacy-safe and never starts work',()=>{
 const plan=getEonNexusLivingCorePlan(snapshot,{page:'forge',context:{allowLiveNexus:true},environment:env()});
 assert.ok(plan.nodeCount<=5); assert.equal(plan.privateRoute,true); assert.equal(plan.startsAiWork,false); assert.equal(plan.autoNavigation,false); assert.equal(plan.autoApproval,false);
 const truth=getEonNexusLivingCoreTruth(); assert.equal(truth.maximumPrimaryControls,3); assert.equal(truth.disposesEngineSceneCanvas,true); assert.equal(truth.excludedFromEonCity,true);
});
test('W660N-R5 social previews cover 28 routes with real PNG cards',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../../assets/data/social-preview-manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.activeRouteCount,28); assert.equal(Object.keys(manifest.routes).length,28);
 for(const route of Object.values(manifest.routes)){assert.match(route.wideImage,/1200x630.*\.png\?v=/); assert.match(route.squareImage,/1080x1080.*\.png\?v=/);}
});
test('W661D focused source gate passes',()=>{const r=inspectW661dNexusConvergence(); assert.equal(r.ok,true,r.checks.filter(x=>!x.pass).map(x=>x.id).join(','));});

import test from 'node:test'; import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js'; import { Scene } from '@babylonjs/core/scene.js'; import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { buildEonCityConnectedCorePlan, resolveNearestEonCityConnectedCoreStation, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';
import { createEonCityConnectedCoreBabylonRenderer } from '../../assets/js/city/eon-city-connected-core-babylon.js';
import { createEonCityLivingNexusBabylonRuntime } from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { inspectW660yConnectedCore } from '../../scripts/w660y-connected-core-gate.mjs';

test('W660Y plan connects all nine districts with one closed visible transit loop',()=>{
 const plan=buildEonCityConnectedCorePlan({quality:'cinematic'}); const result=validateEonCityConnectedCorePlan(plan); assert.equal(result.ok,true,result.errors.join(','));
 assert.equal(plan.districts.length,9); assert.equal(plan.transitLoop.stations.length,9); assert.equal(plan.transitLoop.path.length,10); assert.equal(plan.transitLoop.closed,true); assert.ok(plan.streetConnections.length>=17); assert.equal(plan.eonbotDocks.length,9); assert.equal(plan.focusModeFastTravelRetained,true);
 const station=resolveNearestEonCityConnectedCoreStation({x:0,z:1.5},plan); assert.equal(station.districtId,'transit-network');
});

test('W660Y renderer emits connected roads, nine stations, visible capsules, schedules and docks in one scene',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:256,deterministicLockstep:true}); const scene=new Scene(engine); const parent=new TransformNode('existing-city-root',scene);
 const renderer=createEonCityConnectedCoreBabylonRenderer({scene,parent,quality:'balanced'});
 try { const summary=renderer.getSummary(); assert.equal(summary.districtCount,9); assert.equal(summary.stationCount,9); assert.equal(summary.closedTransitLoop,true); assert.equal(summary.transitCapsuleCount,2); assert.equal(summary.ambientScheduleCount,9); assert.equal(summary.eonbotDockCount,9); assert.equal(summary.oneCanonicalScene,true); renderer.update(15000);
 assert.equal(scene.meshes.filter(m=>m.metadata?.kind==='connected-core-station').length,9); assert.equal(scene.meshes.filter(m=>m.metadata?.kind==='connected-core-transit-capsule').length,2); assert.equal(scene.meshes.filter(m=>m.metadata?.kind==='connected-core-eonbot-dock').length,9); assert.ok(scene.meshes.some(m=>m.metadata?.kind==='connected-core-transit-street')); }
 finally {renderer.dispose();scene.dispose();engine.dispose();}
});

test('W660Y Focus and reduced-effects keep the whole Core available while stopping ambient motion',()=>{
 const focus=buildEonCityConnectedCorePlan({quality:'balanced',mode:'focus'}); assert.equal(focus.motionEnabled,false); assert.equal(focus.transitLoop.motionEnabled,false); assert.equal(focus.districtFastTravelRetained,true); assert.equal(focus.physicalWalkingSupported,true);
 const reduced=buildEonCityConnectedCorePlan({quality:'cinematic',reducedEffects:true}); assert.equal(reduced.motionEnabled,false); assert.equal(reduced.transitLoop.capsuleCount,3); assert.equal(validateEonCityConnectedCorePlan(reduced).ok,true);
});

test('W660Y canonical Living Nexus runtime owns Core visibility, mode, update and disposal',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:256,deterministicLockstep:true}); const scene=new Scene(engine); const player=new TransformNode('player',scene); const runtime=createEonCityLivingNexusBabylonRuntime({scene,playerAnchor:player,quality:'balanced'});
 try { let summary=runtime.getSummary(); assert.equal(summary.destination,'core'); assert.equal(summary.connectedCoreVisible,true); assert.equal(summary.connectedCoreDistrictCount,9); assert.equal(summary.connectedCoreStationCount,9); runtime.update({position:player.position,now:16000}); assert.equal(runtime.setMode('focus',{explicitUserAction:true}).ok,true); assert.equal(runtime.getConnectedCoreSummary().motionEnabled,false); assert.equal(runtime.setDestination('expanse',{explicitUserAction:true}).ok,true); assert.equal(runtime.getConnectedCoreSummary().visible,false); assert.equal(runtime.setDestination('core',{explicitUserAction:true}).ok,true); assert.equal(runtime.getConnectedCoreSummary().visible,true); }
 finally {runtime.dispose();scene.dispose();engine.dispose();}
});

test('W660Y plan stores no private work and performs no automatic travel or work',()=>{
 const plan=buildEonCityConnectedCorePlan(); assert.equal(plan.privateDataRead,false); assert.equal(plan.privateContentStored,false); assert.equal(plan.automaticNavigation,false); assert.equal(plan.automaticExecution,false); assert.equal(plan.transitLoop.automaticTravel,false); assert.doesNotMatch(JSON.stringify(plan),/project title|prompt|api[_-]?key|payment complete|reward earned/i);
});

test('W660Y source gate locks connected Core and one-scene boundaries',()=>{ const report=inspectW660yConnectedCore(); assert.equal(report.ok,true,report.checks.filter(c=>!c.pass).map(c=>`${c.id}: ${c.detail}`).join('\n')); });

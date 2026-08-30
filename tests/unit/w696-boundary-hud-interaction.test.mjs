import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEonCityW696PhysicalBoundaryPlan,
  createEonCityW696PhysicalDistrictTransitionController,
  resolveEonCityW696InteractionTarget,
  structureEonCityW696Status,
  getEonCityW696HudContract,
  getEonCityW696Truth
} from '../../assets/js/city/w696/eon-city-w696-interaction-boundary-hud.js';
import { inspectW696BoundaryHud } from '../../scripts/w696-boundary-hud-gate.mjs';

test('W696 requires a connected physical crossing and dwell before district identity changes',()=>{
 const plan=buildEonCityW696PhysicalBoundaryPlan();
 const boundary=plan.boundaries.find((b)=>b.fromId==='transit-network'&&b.toId==='orientation-hall')||plan.boundaries.find((b)=>b.toId==='transit-network'&&b.fromId==='orientation-hall');
 assert.ok(boundary);
 const from='transit-network'; const to='orientation-hall';
 const direction=boundary.fromId===from?1:-1;
 const before={x:boundary.midpoint.x-boundary.normal.x*direction*.4,z:boundary.midpoint.z-boundary.normal.z*direction*.4};
 const after={x:boundary.midpoint.x+boundary.normal.x*direction*.5,z:boundary.midpoint.z+boundary.normal.z*direction*.5};
 const controller=createEonCityW696PhysicalDistrictTransitionController({initialDistrictId:from,initialPosition:before,holdMs:100});
 let state=controller.update({position:after,candidateDistrictId:to,deltaSeconds:.05});
 assert.equal(state.changed,false); assert.equal(state.reason,'crossed-awaiting-dwell'); assert.equal(state.physicalCrossing,true);
 state=controller.update({position:after,candidateDistrictId:to,deltaSeconds:.06});
 assert.equal(state.changed,true); assert.equal(state.districtId,to); assert.equal(state.reason,'physical-boundary-and-dwell-confirmed');
});

test('W696 refuses nearest-centre switching outside an authored corridor',()=>{
 const plan=buildEonCityW696PhysicalBoundaryPlan();
 const boundary=plan.boundaries[0];
 const from=boundary.fromId; const to=boundary.toId;
 const before={x:boundary.midpoint.x-boundary.normal.x,z:boundary.midpoint.z-boundary.normal.z};
 const off={x:boundary.midpoint.x+boundary.normal.x+boundary.tangent.x*(boundary.halfWidth+8),z:boundary.midpoint.z+boundary.normal.z+boundary.tangent.z*(boundary.halfWidth+8)};
 const controller=createEonCityW696PhysicalDistrictTransitionController({initialDistrictId:from,initialPosition:before});
 const state=controller.update({position:off,candidateDistrictId:to,deltaSeconds:1});
 assert.equal(state.changed,false); assert.match(state.reason,/outside-authored|approaching/);
});

test('W696 chooses one meaningful interaction and honors explicit world picks',()=>{
 const candidates=[
  {type:'station',distance:1,value:{entry:{id:'station-a',districtId:'forge-basilica'},reviewFirst:true}},
  {type:'terminal',distance:1.4,value:{id:'terminal-a',districtId:'forge-basilica',reviewFirst:true}},
  {type:'operator',distance:.7,value:{id:'operator-a',districtId:'forge-basilica',reviewFirst:true}}
 ];
 const automatic=resolveEonCityW696InteractionTarget(candidates,{currentDistrictId:'forge-basilica'});
 assert.equal(automatic.oneTargetOnly,true); assert.equal(automatic.selected.type,'terminal');
 const explicit=resolveEonCityW696InteractionTarget(candidates,{currentDistrictId:'forge-basilica',explicitPickId:'station-a'});
 assert.equal(explicit.selected.type,'station'); assert.equal(explicit.reason,'explicit-world-pick');
});

test('W696 status and HUD use simple user-facing ownership',()=>{
 const status=structureEonCityW696Status('Entered Forge Basilica. Workbench and device lab are loading progressively.');
 assert.equal(status.headline,'Entered Forge Basilica.'); assert.match(status.detail,/Workbench/);
 const hud=getEonCityW696HudContract();
 assert.deepEqual(hud.primaryControls.map((x)=>x.label),['Interact','Districts','EONBOT','More']);
 assert.equal(hud.touchTargetPx,48); assert.equal(hud.membershipAndCaptureRemainReachableInMore,true);
});

test('W696 source gate and truth pass',()=>{
 const report=inspectW696BoundaryHud(); assert.equal(report.ok,true,report.checks.filter(x=>!x.pass).map(x=>x.id).join(','));
 const truth=getEonCityW696Truth(); assert.equal(truth.physicalBoundaryCrossingRequired,true); assert.equal(truth.automaticNavigation,false);
});

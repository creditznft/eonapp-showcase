import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityC12IntegrationFreeze, validateEonCityC12IntegrationFreeze } from '../../assets/js/city/c12/eon-city-c12-integration-freeze.js';
const sourceAuthority={ zeroTwoWayImplementationImports:true, serviceWorkerSourceGenerated:true, serviceWorkerMayDeleteProtectedDatabases:false, minimumTargetPx:48, coreInitialBundleMayContainCityImplementation:false, performanceSourceReady:true, releaseOperationsSourceReady:true };

test('C12 freezes all 38 implementation waves across twelve source categories',()=>{
  const state=buildEonCityC12IntegrationFreeze({sourceAuthority});
  assert.equal(state.implementationWaveCount,38);
  assert.equal(state.completedImplementationWaveCount,38);
  assert.equal(state.categories.length,12);
  assert.equal(state.categories.every((entry)=>entry.sourceReady&&entry.sourceScore===10),true);
  assert.equal(state.sourceProgrammeComplete,true);
});

test('C12 makes the source ready for Codex without inventing a 9.5 acceptance score',()=>{
  const state=buildEonCityC12IntegrationFreeze({sourceAuthority});
  assert.equal(state.codexHandoverReady,true);
  assert.equal(state.sourceFreezeEligible,true);
  assert.equal(state.acceptanceScore,null);
  assert.equal(state.targetAcceptanceScore,9.5);
  assert.equal(state.launchDecision,'NO-GO');
  assert.equal(state.productionReady,false);
});

test('C12 rejects incomplete source authority and automatic launch claims',()=>{
  const incomplete=buildEonCityC12IntegrationFreeze({sourceAuthority:{...sourceAuthority,zeroTwoWayImplementationImports:false}});
  assert.equal(validateEonCityC12IntegrationFreeze(incomplete).ok,false);
  const complete=buildEonCityC12IntegrationFreeze({sourceAuthority});
  const forged={...complete,externalCertificationComplete:true,launchDecision:'GO',productionReady:true};
  assert.equal(validateEonCityC12IntegrationFreeze(forged).ok,false);
});

test('C12 complete source freeze validates while all ten external gates remain pending',()=>{
  const state=buildEonCityC12IntegrationFreeze({sourceAuthority});
  const result=validateEonCityC12IntegrationFreeze(state);
  assert.equal(result.ok,true,result.errors.join(','));
  assert.equal(state.externalCertificationGateCount,10);
  assert.equal(state.externalCertificationComplete,false);
  assert.equal(state.automaticCertification,false);
  assert.equal(state.automaticDeployment,false);
});

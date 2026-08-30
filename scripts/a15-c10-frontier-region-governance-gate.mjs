#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityC10FrontierRegionGovernance, validateEonCityC10FrontierRegionGovernance } from '../assets/js/city/c10/eon-city-c10-frontier-region-governance.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[]; const check=(id,pass,detail='')=>checks.push({id,pass:Boolean(pass),detail:String(detail)});
const state=buildEonCityC10FrontierRegionGovernance(); const validation=validateEonCityC10FrontierRegionGovernance(state);
const presenter=read('assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js');
const runtime=read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
check('source-contract-valid',validation.ok,validation.errors.join(','));
check('my-frontier-seven-authored-plots',state.myFrontier.authoredPlotCount===7,String(state.myFrontier.authoredPlotCount));
check('my-frontier-six-resident-slots',state.myFrontier.residentSlotCount===6,String(state.myFrontier.residentSlotCount));
check('my-frontier-no-raw-placement',!state.myFrontier.rawCoordinatePlacementAllowed,'authored choices only');
check('my-frontier-non-financial',!state.myFrontier.publicLandCreated&&!state.myFrontier.tradablePropertyCreated,'no land economy');
check('storm-exact-package',state.stormSector.exactPackageValid,state.stormSector.packageDigest);
check('storm-eight-external-gates',state.stormSector.externalGateCount===8,String(state.stormSector.externalGateCount));
check('storm-thirty-five-owner-cases',state.stormSector.ownerCaseCount===35,String(state.stormSector.ownerCaseCount));
check('storm-locked-by-default',!state.stormSector.releaseReady&&!state.stormSector.gatewayVisible&&!state.stormSector.regionRendered,'source-only state');
check('storm-presenter-requires-activation',/activation\?\.packageDigest/.test(presenter)&&/activation\?\.active === true/.test(presenter),'exact activated package');
check('runtime-owner-confirmation-required',/explicitOwnerAction: true/.test(runtime)&&/validateEonExpanseW793AActivationAction/.test(runtime),'reviewed activation');
check('source-complete-not-certified',!state.stormSector.sourceCompleteIsCertified,'external evidence remains mandatory');
const receipt={schema:'eonapp.a15.c10.frontier-region-governance-gate.v1',wave:'C10',generatedAt:new Date().toISOString(),ok:checks.every(c=>c.pass),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,stormPackageDigest:state.stormSector.packageDigest,myFrontierSourceReady:state.myFrontier.sourceValid,stormSourceProgrammeComplete:true,stormExternallyCertified:false,stormGatewayLocked:true,productionReady:false,limitations:['My Frontier rendered construction, resident, theme and reload evidence remains an owner-browser gate.','Storm Sector remains locked until exact external certification and all 35 owner cases bind to one build digest.']};
for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'} ${c.id} — ${c.detail}`);
console.log(`\nA15 C10 Frontier Region Governance: ${receipt.passed}/${receipt.total}`);
if (WRITE_EVIDENCE) {
  fs.mkdirSync(path.join(ROOT,'artifacts/a15'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'artifacts/a15/A15_C10_FRONTIER_REGION_GOVERNANCE_GATE.json'),JSON.stringify(receipt,null,2)+'\n');
}
if(!receipt.ok) process.exitCode=1;

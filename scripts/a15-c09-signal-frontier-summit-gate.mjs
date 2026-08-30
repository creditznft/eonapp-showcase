#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityC09SignalFrontierSummit, validateEonCityC09SignalFrontierSummit } from '../assets/js/city/c09/eon-city-c09-signal-frontier-summit.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const checks=[]; const check=(id,pass,detail='')=>checks.push({id,pass:Boolean(pass),detail:String(detail)});
const summit=buildEonCityC09SignalFrontierSummit(); const validation=validateEonCityC09SignalFrontierSummit(summit);
check('source-contract-valid',validation.ok,validation.errors.join(','));
check('exact-owner-matrix',summit.requiredCaseCount===35,String(summit.requiredCaseCount));
check('product-source-coverage',summit.productSourceCaseCount===28,String(summit.productSourceCaseCount));
check('external-evidence-matrix',summit.externalEvidenceCaseCount===7,String(summit.externalEvidenceCaseCount));
for(const entry of summit.cases.filter((item)=>item.sourceCovered)) {
  check(`source:${entry.id}`,fs.existsSync(path.join(ROOT,entry.sourceModule)),entry.sourceModule);
  check(`test:${entry.id}`,fs.existsSync(path.join(ROOT,entry.sourceTest)),entry.sourceTest);
}
check('no-prepassed-owner-cases',summit.cases.every((entry)=>entry.passed===false),'source coverage is not owner proof');
check('no-automatic-certification',!summit.automaticCertification&&!summit.automaticDeployment,'explicit external gates');
const receipt={schema:'eonapp.a15.c09.signal-frontier-summit-gate.v1',wave:'C09',generatedAt:new Date().toISOString(),ok:checks.every(c=>c.pass),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,sourceProgrammeComplete:summit.sourceProgrammeComplete,renderedOwnerEvidenceComplete:false,productionReady:false,limitations:['Authenticated Chrome, Edge and mobile-landscape evidence remains pending.','Lite, Balanced and Cinematic foreground performance plus transition soak remain pending.','No source-only result can satisfy owner playthrough or deployment gates.']};
for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'} ${c.id} — ${c.detail}`);
console.log(`\nA15 C09 Signal Frontier Summit: ${receipt.passed}/${receipt.total}`);
if (WRITE_EVIDENCE) {
  fs.mkdirSync(path.join(ROOT,'artifacts/a15'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'artifacts/a15/A15_C09_SIGNAL_FRONTIER_SUMMIT_GATE.json'),JSON.stringify(receipt,null,2)+'\n');
}
if(!receipt.ok) process.exitCode=1;

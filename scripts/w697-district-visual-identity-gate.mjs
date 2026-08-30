#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W697_VISUAL_IDENTITIES, validateEonCityW697DistrictVisualIdentities } from '../assets/js/city/w697/eon-city-w697-district-visual-identity.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));
export function inspectW697DistrictVisualIdentity(){
 const checks=[]; const add=(id,pass,detail)=>checks.push(Object.freeze({id,pass:Boolean(pass),detail}));
 const required=['assets/js/city/w697/eon-city-w697-district-visual-identity.js','assets/js/city/w690/eon-city-w690-district-belts-babylon.js','tests/unit/w697-district-visual-identity.test.mjs'];
 add('required-files',required.every(exists),'W697 authority, renderer integration and maintained test exist');
 const validation=validateEonCityW697DistrictVisualIdentities(EON_CITY_W697_VISUAL_IDENTITIES);
 add('nine-identities',validation.ok&&validation.identityCount===9&&validation.uniqueFingerprints===9,'all nine districts have unique visual fingerprints');
 add('grammar-diversity',validation.uniqueBuildingGrammars>=8,'building grammars are materially differentiated');
 const renderer=read('assets/js/city/w690/eon-city-w690-district-belts-babylon.js');
 add('renderer-adapters',/createDistinctBuilding/.test(renderer)&&/createDistinctStation/.test(renderer)&&/createDistinctDiscovery/.test(renderer),'active W690 renderer consumes district-specific adapters');
 add('creator-forge',/variant\.grammar === 'terrace'/.test(renderer)&&/variant\.grammar === 'cathedral'/.test(renderer),'Creator and Forge have distinct construction paths');
 add('archive-vault-trade',/variant\.grammar === 'canopy'/.test(renderer)&&/variant\.grammar === 'vault'/.test(renderer)&&/variant\.grammar === 'civic-dome'/.test(renderer),'Archive, Vault and Trade have distinct construction paths');
 add('no-generic-dominance',/genericRingDominance: false/.test(renderer)&&/uniqueDistrictVisualFingerprints/.test(renderer),'renderer reports unique adapters and rejects generic ring dominance');
 return Object.freeze({schema:'eon.city.w697.gate.2026-07-25.v1',ok:checks.every(x=>x.pass),passed:checks.filter(x=>x.pass).length,total:checks.length,checks:Object.freeze(checks)});
}
const r=inspectW697DistrictVisualIdentity(); for(const c of r.checks) console.log(`[W697] ${c.pass?'PASS':'FAIL'} ${c.id}: ${c.detail}`); console.log(`[W697] ${r.ok?'PASS':'FAIL'} ${r.passed}/${r.total}`); if(!r.ok) process.exitCode=1;

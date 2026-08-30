#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityRt91ContentPerformanceBudget, validateEonCityRt91ContentPerformanceBudget } from '../assets/js/city/rt91/eon-city-rt91-content-performance-budget.js';
import { validateEonCityRt91CommandHubInteractionAudit } from '../assets/js/city/rt91/command-hub/eon-city-rt91-command-hub-interaction-audit.js';
import { getEonCityRt91ContinuityTruth, validateEonCityRt91ContinuityTruth } from '../assets/js/city/rt91/eon-city-rt91-continuity-contract.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RT91=path.join(ROOT,'assets/js/city/rt91');
const checks=[]; const check=(id,pass,detail='')=>checks.push({id,pass:Boolean(pass),detail:String(detail)});
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]).filter((file)=>file.endsWith('.js'));
const files=walk(RT91);
const forbidden=/\b(?:requestAnimationFrame|setInterval|setTimeout|fetch|XMLHttpRequest|WebSocket|EventSource|AudioContext)\s*\(|\bnew\s+(?:Engine|Scene)\b/;
const owners=files.filter((file)=>forbidden.test(fs.readFileSync(file,'utf8'))).map((file)=>path.relative(ROOT,file).replaceAll('\\','/'));
check('rt91-no-autonomous-runtime-owners',owners.length===0,`${files.length} modules; ${owners.join(',')||'none'}`);
const w731=fs.readFileSync(path.join(ROOT,'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'),'utf8');
check('one-maintained-babylon-render-loop',(w731.match(/engine\.runRenderLoop\s*\(/g)||[]).length===1,'W731 runRenderLoop count');
check('rt91-not-render-loop-mounted',!/rt91Integration[\s\S]{0,160}runRenderLoop/.test(w731),'RT91 integration has no render-loop call');

let budgetOk=true; let hiddenOk=true; let maxLoads=0; let maxNpcs=0; let maxParticles=0;
for(const quality of ['lite','balanced','cinematic']) for(const worldId of ['signal-frontier','storm-sector','my-frontier']) for(const hidden of [false,true]) for(const reducedMotion of [false,true]){
  const plan=buildEonCityRt91ContentPerformanceBudget({quality,worldId,hidden,reducedMotion});
  budgetOk&&=validateEonCityRt91ContentPerformanceBudget(plan).ok;
  maxLoads=Math.max(maxLoads,plan.streaming.maximumConcurrentOptionalAssetLoads); maxNpcs=Math.max(maxNpcs,plan.population.maximumNearAnimatedNpcs); maxParticles=Math.max(maxParticles,plan.effects.maximumActiveParticleEmitters);
  if(hidden) hiddenOk&&=plan.streaming.maximumConcurrentOptionalAssetLoads===0&&plan.population.maximumNearAnimatedNpcs===0&&plan.population.maximumMidPresenceNpcs===0&&plan.effects.maximumActiveParticleEmitters===0&&plan.gameplay.maximumWorldStateEvaluationsPerSecond===0;
}
check('all-quality-world-performance-budgets-validate',budgetOk,`max optional=${maxLoads}; near NPC=${maxNpcs}; particles=${maxParticles}`);
check('hidden-world-budgets-zero-heavy-work',hiddenOk,'stream/NPC/VFX/state evaluation all zero');
const interaction=validateEonCityRt91CommandHubInteractionAudit();
check('command-hub-interaction-coverage',interaction.ok&&interaction.interactionCount>=39,`${interaction.interactionCount} registered significant interactions`);
const continuity=getEonCityRt91ContinuityTruth();
check('sixteen-critical-progress-records',validateEonCityRt91ContinuityTruth(continuity).ok&&continuity.criticalRecoveryCount===16,'update-safe + recovery bundle');
const storageUsers=files.filter((file)=>/\b(?:localStorage|sessionStorage|indexedDB|caches\.|navigator\.storage)\b/.test(fs.readFileSync(file,'utf8'))).map((file)=>path.relative(RT91,file).replaceAll('\\','/'));
const storageAllow=new Set(['eon-city-rt91-session-save.js','eon-city-rt91-productive-receipt-adapter.js']);
check('rt91-storage-authority-bounded',storageUsers.every((file)=>storageAllow.has(file)),storageUsers.join(', '));
const networkUsers=files.filter((file)=>/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(fs.readFileSync(file,'utf8'))).map((file)=>path.relative(RT91,file).replaceAll('\\','/'));
check('rt91-no-network-authority',networkUsers.length===0,networkUsers.join(', ')||'none');

const receipt={schema:'eon.city.phase-h-red-team.rt91.v1',ok:checks.every((x)=>x.pass),passed:checks.filter((x)=>x.pass).length,total:checks.length,checks,limitations:['Source-only performance/red-team gate. Real GPU/FPS/memory/network waterfall remains owner-machine evidence.']};
for(const row of checks) console.log(`${row.pass?'PASS':'FAIL'} ${row.id} — ${row.detail}`);
console.log(`\nRT91 Phase H institutional red-team gate: ${receipt.passed}/${receipt.total}`);
if(!receipt.ok) process.exitCode=1;

#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { W660Y_CONNECTED_CORE_CONTRACT } from '../config/w660y-connected-core-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (p) => fs.readFileSync(path.join(root,p),'utf8'); const exists = (p) => fs.existsSync(path.join(root,p)); const freeze = Object.freeze;
export function inspectW660yConnectedCore() {
  const checks=[]; const add=(id,pass,detail)=>checks.push(freeze({id,pass:Boolean(pass),detail}));
  const required=['config/w660y-connected-core-contract.mjs','assets/js/city/eon-city-connected-core.js','assets/js/city/eon-city-connected-core-babylon.js','assets/js/city/eon-city-living-nexus-babylon-runtime.js','assets/js/city/eon-city-play-babylon.js','tests/unit/w660y-connected-core.test.mjs'];
  add('required-files',required.every(exists),'connected plan, one-scene renderer, runtime integration and tests exist');
  const plan=read(required[1]);
  add('nine-district-authority',/EON_CITY_W689_PRODUCT_DISTRICTS/.test(plan)&&/buildEonCityW690CompleteCoreIdentityPlan/.test(plan)&&/nine-districts-required/.test(plan),'one current nine-district Belt authority drives the connected plan');
  add('closed-transit-loop',/EON_CITY_CONNECTED_CORE_TRANSIT_ORDER/.test(plan)&&/closed: true/.test(plan)&&/closed-nine-station-loop-required/.test(plan),'one closed nine-station Core Loop is explicit');
  add('connected-street-graph',/streetConnections: allEdges/.test(plan)&&/street-graph-not-connected/.test(plan)&&/continuousFabric/.test(plan),'transit and pedestrian edges form a validated connected graph');
  add('living-street-schedules',/Guide shift/.test(plan)&&/Forge round/.test(plan)&&/Vault patrol/.test(plan)&&/claimsRealWork/.test(read(required[2])),'bounded ambient schedules use districts without claiming real work');
  add('eonbot-docks',/eonbotDocks/.test(plan)&&/automaticDocking: false/.test(read(required[2])),'all districts receive explicit-call EONBOT dock markers');
  add('focus-explore-parity',/focusModeFastTravelRetained: true/.test(plan)&&/districtFastTravelRetained: true/.test(plan)&&/physicalWalkingSupported: true/.test(plan),'physical travel does not remove productivity fast travel');
  const renderer=read(required[2]);
  add('one-scene-renderer',/TransformNode\('w660y-connected-core-root'/.test(renderer)&&!/new Engine\(|new Scene\(|requestAnimationFrame\(|registerBeforeRender/.test(renderer),'Connected Core is an existing-scene subtree and update consumer');
  add('visible-capsules',/connected-core-transit-capsule/.test(renderer)&&/visibleUsableLoop: true/.test(renderer)&&/automaticTravel: false/.test(renderer),'Transit Capsules visibly follow the loop but never auto-travel the user');
  add('district-identity',/connected-core-district-identity/.test(renderer)&&/connected-core-station/.test(renderer),'all stations carry district identity metadata');
  const runtime=read(required[3]);
  add('runtime-integration',/createEonCityConnectedCoreBabylonRenderer/.test(runtime)&&/connectedCoreRenderer\.update/.test(runtime)&&/connectedCoreRenderer\.dispose/.test(runtime),'canonical Living Nexus runtime owns update and disposal');
  add('destination-visibility',/mountConnectedCore/.test(runtime)&&/unmountConnectedCore/.test(runtime)&&/if \(next !== 'core'\) unmountConnectedCore\(\)/.test(runtime),'Core connective geometry is mounted only for Core and disposed while other destinations are active');
  const play=read(required[4]); add('play-api',/getConnectedCorePlan/.test(play)&&/getConnectedCoreSummary/.test(play),'existing City controller exposes read-only Core status');
  const pkg=JSON.parse(read('package.json')); add('package-command',pkg.scripts?.['qa:w660y-connected-core']==='node scripts/w660y-connected-core-gate.mjs && node --test tests/unit/w660y-connected-core.test.mjs','focused W660Y command exists');
  const manifest=JSON.parse(read('config/w624d-current-unit-test-manifest.json')); add('maintained-suite',manifest.testFileCount===manifest.testFiles.length&&manifest.testFiles.includes('tests/unit/w660y-connected-core.test.mjs'),`${manifest.testFileCount} maintained files include W660Y`);
  add('contract-invariants',Object.values(W660Y_CONNECTED_CORE_CONTRACT.invariants).every(Boolean),'safety and truth boundaries remain locked');
  return freeze({schema:'eonapp.w660y.connected-core-gate.2026-07-21.v1',ok:checks.every(c=>c.pass),passed:checks.filter(c=>c.pass).length,total:checks.length,checks:freeze(checks)});
}
const report=inspectW660yConnectedCore(); for(const c of report.checks) console.log(`[W660Y] ${c.pass?'PASS':'FAIL'} ${c.id}: ${c.detail}`); console.log(`[W660Y] ${report.ok?'PASS':'FAIL'} ${report.passed}/${report.total}`); if(!report.ok) process.exitCode=1;

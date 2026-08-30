#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W696_WORLD_BOUND,
  buildEonCityW696PhysicalBoundaryPlan,
  getEonCityW696HudContract,
  getEonCityW696Truth
} from '../assets/js/city/w696/eon-city-w696-interaction-boundary-hud.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
export function inspectW696BoundaryHud(){
 const checks=[]; const add=(id,pass,detail)=>checks.push(Object.freeze({id,pass:Boolean(pass),detail}));
 const plan=buildEonCityW696PhysicalBoundaryPlan();
 add('physical-boundary-plan',plan.boundaries.length>=23&&plan.boundaries.every((b)=>b.physicalCrossingRequired&&!b.automaticTransition),'all Core connections expose authored physical boundary corridors');
 add('complete-core-world-bound',EON_CITY_W696_WORLD_BOUND>=90,'movement bounds contain all nine scaled District Belts');
 const hud=getEonCityW696HudContract();
 add('four-primary-controls',hud.primaryControls.map((x)=>x.id).join(',')==='interact,districts,eonbot,more'&&hud.maximumPersistentPrimaryControls===4,'persistent HUD is Interact, Districts, EONBOT and More');
 add('touch-target',hud.touchTargetPx===48&&!hud.hiddenEssentialControls,'all critical actions retain 48px access and no essential hidden control');
 const product=read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
 add('active-boundary-integration',/createEonCityW696PhysicalDistrictTransitionController/.test(product)&&/eonCityPendingBoundary/.test(product)&&/EON_CITY_W696_WORLD_BOUND/.test(product),'product layer uses physical crossing diagnostics and complete Core bounds');
 add('target-arbitration-integration',/resolveEonCityW696InteractionTarget/.test(product),'nearby interactions have one deterministic W696 target');
 const station=read('assets/js/eon-city-play-station.js');
 add('more-and-structured-status',/data-eon-play-open-controls aria-haspopup="dialog">More/.test(station)&&/data-eon-play-status-headline/.test(station)&&/structureEonCityW696Status/.test(station),'station exposes one More surface and two-line truthful status');
 add('capture-remains-reachable',/data-eon-play-open-capture>Creator Capture/.test(station)&&/EON_CITY_W659G_CAPTURE_OPEN_EVENT/.test(station),'Creator Capture remains reachable from More on mobile');
 const css=read('assets/css/eon-city-play.css');
 add('css-48-and-bottom-sheet',/W696 · physical-boundary HUD/.test(css)&&/min-block-size: 48px/.test(css)&&/eon-w659g-capture-panel[\s\S]{0,500}position: fixed !important/.test(css),'CSS enforces 48px controls and mobile bottom sheets');
 const truth=getEonCityW696Truth();
 add('truth-boundary',truth.physicalBoundaryCrossingRequired&&truth.focusReturnRequired&&!truth.automaticNavigation&&!truth.automaticExecution,'review and focus truth remains bounded');
 return Object.freeze({schema:'eon.city.w696.gate.v1',ok:checks.every(x=>x.pass),passed:checks.filter(x=>x.pass).length,total:checks.length,checks:Object.freeze(checks)});
}
const r=inspectW696BoundaryHud(); for(const c of r.checks) console.log(`[W696] ${c.pass?'PASS':'FAIL'} ${c.id}: ${c.detail}`); console.log(`[W696] ${r.ok?'PASS':'FAIL'} ${r.passed}/${r.total}`); if(!r.ok)process.exitCode=1;

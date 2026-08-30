#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonNexusW706SpatialScenePlan, getEonNexusW706SpatialSceneTruth } from '../assets/js/nexus/w706/eon-nexus-w706-spatial-scene-plan.js';
const source = fs.readFileSync(new URL('../assets/js/nexus/eon-nexus-living-core.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/eon-nexus-living-core.css', import.meta.url), 'utf8');
const snapshot = { eonbot:{state:'ready'}, conversation:{id:'c',label:'Conversation'}, project:{id:'p',selected:true,label:'Project',status:'active'}, task:{id:'t',state:'running'}, approval:{pending:false}, results:{count:1}, route:{privateOnDevice:true}, connection:{state:'available'}, atlas:{selected:true}, nodes:[] };
const plan = buildEonNexusW706SpatialScenePlan(snapshot, { layoutMode: 'full' });
const truth = getEonNexusW706SpatialSceneTruth();
const checks = [
  ['responsive-layouts', ['compact','split','full','in-world'].every((mode) => buildEonNexusW706SpatialScenePlan(snapshot,{layoutMode:mode}).mode === mode)],
  ['real-spatial-objects', plan.objects.length > 0 && plan.objects.every((object) => object.pickable && object.draggable && Number.isFinite(object.position.z))],
  ['bounded-user-camera', plan.camera.bounded && plan.camera.userOrbitEnabled && !plan.camera.automaticOrbit],
  // W719.20 keeps Babylon primary through the current spatial surface. The
  // old plan.spatialScene and data-spatial-primary names were superseded; the
  // renderer-ready and primary-renderer contracts retain the same authority.
  ['babylon-primary-integration', /surface\.objects/.test(source) && /dataset\.spatialPrimary/.test(source) && /root\.rotation\.y = 0/.test(source)],
  ['primary-css', /Babylon is the primary spatial command field/.test(css) && /data-primary-renderer='true'/.test(css) && /data-spatial-renderer='ready'/.test(css)],
  ['truth-boundaries', truth.oneSceneAuthority && truth.babylonPrimaryVisual && !truth.secondAssistant && !truth.automaticNavigation && !truth.startsAiWork]
];
for (const [id, pass] of checks) console.log(`[W706] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W706] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;

#!/usr/bin/env node
import fs from 'node:fs';
import { beginEonNexusW707SpatialDrag, projectEonNexusW707SpatialDrag, getEonNexusW707SpatialManipulationTruth } from '../assets/js/nexus/w707/eon-nexus-w707-spatial-manipulation.js';
const source = fs.readFileSync(new URL('../assets/js/nexus/eon-nexus-living-core.js', import.meta.url), 'utf8');
const drag = beginEonNexusW707SpatialDrag({ object:{id:'project:p',draggable:true,sourceObject:{x:50,y:50,z:0}}, pointer:{clientX:10,clientY:10}, viewport:{width:100,height:100}, layoutMode:'split' });
const preview = projectEonNexusW707SpatialDrag(drag,{clientX:75,clientY:75});
const truth = getEonNexusW707SpatialManipulationTruth();
const checks = [
  ['bounded-drag-projection', drag.ok && preview.ok && preview.fieldPosition.x <= 93 && preview.fieldPosition.y <= 93],
  ['one-w684-transaction', /beginMove/.test(source) && /moveTo/.test(source) && /endMove/.test(source)],
  ['preview-then-commit', /\{ commit: false \}/.test(source) && truth.pointerUpCommitsOneUndoableMove],
  ['camera-safe-pointer-capture', /setPointerCapture/.test(source) && /detachControl/.test(source) && /attachControl/.test(source)],
  ['babylon-pointer-authority', /PointerEventTypes\.POINTERDOWN/.test(source) && /PointerEventTypes\.POINTERMOVE/.test(source) && /PointerEventTypes\.POINTERUP/.test(source)],
  ['truth-boundaries', truth.usesExistingW684Controller && !truth.mutatesProjectState && !truth.mutatesTaskState && !truth.automaticNavigation && !truth.startsAiWork]
];
for (const [id, pass] of checks) console.log(`[W707] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W707] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;

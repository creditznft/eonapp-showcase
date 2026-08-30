#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W661D_NEXUS_CONVERGENCE_CONTRACT } from '../config/w661d-nexus-convergence-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const exists = (p) => fs.existsSync(path.join(root,p));
export function inspectW661dNexusConvergence(){
 const checks=[]; const add=(id,pass,detail)=>checks.push(Object.freeze({id,pass:Boolean(pass),detail}));
 const required=['assets/data/social-preview-manifest.json','assets/js/nexus/eon-nexus-morphic-contract.js','assets/js/nexus/eon-nexus-living-core.js','assets/css/eon-nexus-living-core.css','config/w661d-nexus-convergence-contract.mjs','tests/unit/w661d-nexus-convergence.test.mjs'];
 add('required-files',required.every(exists),'social, morphic, Pulse 2.0 and Living Core authority files exist');
 const manifest=JSON.parse(read('assets/data/social-preview-manifest.json'));
 add('social-route-count',manifest.activeRouteCount===28 && Object.keys(manifest.routes||{}).length===28,'28 active routes are explicitly mapped');
 const htmlOk=Object.values(manifest.routes).every((r)=>{const h=read(r.file); const abs=`https://eonapp.ch${r.wideImage}`; return h.includes(`rel="canonical" href="https://eonapp.ch${r.path==='/'?'/':r.path}"`) && h.includes('property="og:image:width" content="1200"') && h.includes('property="og:image:height" content="630"') && h.includes('name="twitter:card" content="summary_large_image"') && h.includes(abs) && !/default\.svg/.test(h.match(/<head>[\s\S]*?<\/head>/i)?.[0]||'');});
 add('social-html',htmlOk,'every mapped route has canonical OG/X metadata, dimensions and non-legacy PNG preview');
 const socialCards=[...new Set(Object.values(manifest.routes).flatMap((r)=>[r.wideImage,r.squareImage]).map((value)=>String(value||'').split('?')[0].replace(/^\/+/,'')))];
 add('social-card-assets',socialCards.length===12 && socialCards.every(exists),'all 12 canonical source-controlled social-card PNGs exist');
 const publicSync=read('scripts/sync-public-assets.mjs');
 add('social-card-emission',publicSync.includes("['assets/media/social', 'assets/media/social']"),'production asset sync emits the complete social-card directory');
 const morphic=read('assets/js/nexus/eon-nexus-morphic-contract.js');
 add('morphic-contract',/productiveRoutesDirectImmersive: true/.test(morphic)&&/billingRestrained: true/.test(morphic)&&/hiddenRendererPaused: true/.test(morphic),'adaptive route/device contract remains truthful and bounded');
 const shell=read('assets/js/nexus/eon-nexus-app-shell.js');
 add('pulse2-integration',/maxPrimaryControls: 3/.test(shell)&&/getEonNexusMorphicContract/.test(shell)&&/mountEonNexusLivingCore/.test(shell),'app shell uses Pulse 2.0 budget and lazy Living Core on explicit expansion');
 add('one-city-renderer',!/eoncity[^\n]{0,120}mountEonNexusLivingCore/i.test(shell),'Living Core is not installed into EONCITY');
 const core=read('assets/js/nexus/eon-nexus-living-core.js');
 add('living-core-lifecycle',/lazyImportedAfterExplicitAction: true/.test(core)&&/hiddenRenderingPaused: true/.test(core)&&/disposesEngineSceneCanvas: true/.test(core),'Living Core pauses, falls back and disposes');
 const pkg=JSON.parse(read('package.json'));
 add('focused-command',pkg.scripts?.['qa:w661d-nexus-convergence']==='node scripts/w661d-nexus-convergence-gate.mjs && node --test tests/unit/w661d-nexus-convergence.test.mjs','focused convergence command exists');
 const unit=JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
 add('maintained-suite',/^W\d+$/.test(unit.currentWave)&&Number(unit.currentWave.slice(1))>=669&&unit.testFiles.includes('tests/unit/w661d-nexus-convergence.test.mjs')&&unit.testFileCount===unit.testFiles.length,`W661D remains maintained inside the current W${unit.currentWave.slice(1)} release authority`);
 add('truth-boundaries',Object.values(W661D_NEXUS_CONVERGENCE_CONTRACT.invariants).every(Boolean),'privacy, review and production boundaries remain locked');
 return Object.freeze({schema:'eonapp.w661d.nexus-convergence-gate.2026-07-22.v2',ok:checks.every(x=>x.pass),passed:checks.filter(x=>x.pass).length,total:checks.length,checks:Object.freeze(checks)});
}
const report=inspectW661dNexusConvergence();
for(const c of report.checks) console.log(`[W661D] ${c.pass?'PASS':'FAIL'} ${c.id}: ${c.detail}`);
console.log(`[W661D] ${report.ok?'PASS':'FAIL'} ${report.passed}/${report.total}`);
if(!report.ok) process.exitCode=1;

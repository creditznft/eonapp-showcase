#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { validateW643CreatorDeviceClosureContract } from '../config/w643-creator-device-closure-contract.mjs';
import { evaluateW643CreatorDeviceClosure } from './lib/w643-creator-device-evidence.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const read=(f)=>fs.readFileSync(path.join(root,f),'utf8'); const exists=(f)=>fs.existsSync(path.join(root,f));
const profile=read('assets/js/local-ai/eon-local-creator-media-profiles.js'); const video=read('assets/js/local-ai/comfyui-video-capability.js'); const board=JSON.parse(read('config/w643-creator-device-board.json'));
const checks=[
 ['contract',validateW643CreatorDeviceClosureContract().ok],
 ['files',['config/w643-creator-device-closure-contract.mjs','config/w643-creator-device-board.json','scripts/lib/w643-creator-device-evidence.mjs','tests/unit/w643-creator-device-closure.test.mjs','EVIDENCE/w643/README.md'].every(exists)],
 ['owner-video-blocked',/ownerFourGbLaneMustRemainBlocked: true/.test(video)&&/usable-vram-below-8gb-reference-minimum/.test(video)],
 ['low-vram-not-recommended',/video-ltx-2b-microclip-trial/.test(profile)&&/hardware\.id === 'low-vram' \? 'not-recommended'/.test(profile)],
 ['board-honest',board.productionVerdict==='not-run'&&!evaluateW643CreatorDeviceClosure(board).launchScopePass],
 ['commands',JSON.parse(read('package.json')).scripts?.['qa:w643-creator-device-closure']?.includes('w643-creator-device-closure-gate.mjs')]
];
for(const [id,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${id}`); const ok=checks.every(([,pass])=>pass); console.log(`\nW643 Creator device closure source gate: ${checks.filter(([,p])=>p).length}/${checks.length}; real device evidence NOT-RUN`); if(!ok)process.exitCode=1;

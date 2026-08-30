#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityC08CommandHubAudit, validateEonCityC08CommandHubConvergence } from '../assets/js/city/c08/eon-city-c08-command-hub-convergence.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const checks=[]; const check=(id,pass,detail='')=>checks.push({id,pass:Boolean(pass),detail:String(detail)});
const audit=buildEonCityC08CommandHubAudit(); const validation=validateEonCityC08CommandHubConvergence(audit);
const runtime=read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const interactions=read('assets/js/city/w748/eon-city-w748-interaction-registry.js');
const nexus=read('assets/js/contracts/nexus/eon-nexus-city-projection.js');
check('source-valid',validation.ok,validation.errors.join(','));
check('ten-stations',audit.stationCount===10,String(audit.stationCount));
check('three-discoveries',audit.discoveryCount===3,String(audit.discoveryCount));
check('station-part-coverage',audit.stations.every(s=>s.interactionParts.length===3&&s.interactionParts.every(p=>p.present)),'station terminal npc');
check('maintained-surfaces',audit.stations.every(s=>s.maintainedSurface),'work-surface registry');
check('support-classified',audit.supportObjects.every(o=>o.declaredInteractive||o.declaredUnavailable),String(audit.supportObjects.length));
check('nexus-privacy',audit.nexus.privacyProjected&&!audit.nexus.rawConversationTextRead&&!audit.nexus.rawProjectContentRead,'bounded state');
check('nexus-non-executing',!audit.nexus.startsAiWork&&!audit.nexus.startsVoiceCapture&&!audit.nexus.autoApproval&&!audit.nexus.autoNavigation,'review only');
check('runtime-enforces-c08',/validateEonCityC08CommandHubConvergence/.test(runtime)&&/a15-c08-command-hub-convergence-invalid/.test(runtime),'mount fail closed');
check('three-worlds-featured',/data-eon-city-featured="signal-frontier"/.test(runtime)&&/data-eon-city-featured="storm-sector"/.test(runtime)&&/data-eon-city-featured="my-frontier"/.test(runtime),'three-world flagship menu');
check('worlds-review-entry',/data-eon-city-menu-open-world>Open Signal Frontier/.test(runtime)&&/openExpanseReview\(trigger\)/.test(runtime),'Signal review-first; world switchers explicit');
check('share-featured',/data-eon-city-quick="share">Share Command Center/.test(runtime)&&/data-eon-city-quick="capture">Creator Capture/.test(runtime),'distribution hierarchy');
check('plans-featured',/data-eon-city-quick="plans">Plans &amp; Access/.test(runtime)&&/data-eon-city-quick="accessible-map">Accessible Map/.test(runtime),'operations remain explicit');
check('no-dead-interaction-surface',!/primaryAction: action\('open'[^\n]+surface: ''/.test(interactions),'open actions have surface');
check('nexus-no-raw-content',/rawConversationTextRead: false/.test(nexus)&&/rawProjectContentRead: false/.test(nexus),'privacy truth');
check('browser-proof-pending',true,'source-only; rendered proof required');
const receipt={schema:'eonapp.a15.c08.command-hub-convergence-gate.v1',wave:'C08',generatedAt:new Date().toISOString(),ok:checks.every(c=>c.pass),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,limitations:['Source-only certification.','Rendered object visibility, interaction reachability and first-party console/network proof remain external gates.']};
for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'} ${c.id} — ${c.detail}`);
console.log(`\nA15 C08 Command Hub Convergence: ${receipt.passed}/${receipt.total}`);
if (WRITE_EVIDENCE) {
  fs.mkdirSync(path.join(ROOT,'artifacts/a15'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'artifacts/a15/A15_C08_COMMAND_HUB_CONVERGENCE_GATE.json'),JSON.stringify(receipt,null,2)+'\n');
}
if(!receipt.ok) process.exitCode=1;

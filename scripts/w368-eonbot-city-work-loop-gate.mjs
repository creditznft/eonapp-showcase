#!/usr/bin/env node
/** W368 — EONBOT City Work Loop static source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { getCityWorkLoopIntents, getCityWorkLoopTruth } from '../assets/js/city/eon-city-work-loop.js';
import { W368_EONBOT_CITY_WORK_LOOP_CONTRACT, validateW368EonbotCityWorkLoopContract } from '../config/w368-eonbot-city-work-loop-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const check = (value, message) => { if (!value) errors.push(message); };
const playStation = read('assets/js/eon-city-play-station.js');
const tourStation = read('assets/js/eon-city-3d-station.js');
const workLoop = read('assets/js/city/eon-city-work-loop.js');
const docs = read('docs/W368_EONBOT_CITY_WORK_LOOP_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const truth = getCityWorkLoopTruth();

check(validateW368EonbotCityWorkLoopContract().length === 0, `W368 contract invalid: ${validateW368EonbotCityWorkLoopContract().join(' | ')}`);
check(getCityWorkLoopIntents().length === 4, 'W368 requires four bounded work intents.');
check(truth.providerRequest === false && truth.externalExecution === false && truth.autoNavigation === false, 'W368 work loop must remain non-executing and user-directed.');
check(/createCityWorkLoopProposal/.test(playStation) && /data-eon-play-open-eonbot/.test(playStation), 'W368 Immersive Work Mode must provide an explicit EONBOT work dock.');
check(/createCityWorkLoopProposal/.test(tourStation) && /data-eon3-open-eonbot/.test(tourStation), 'W368 Spatial Command Space must provide an explicit EONBOT work dock.');
check(/typedRequest.*stored: false/.test(workLoop) && /typedTextForwarded: false/.test(workLoop), 'W368 must discard typed City text before storage and handoff.');
check(/No provider call|does not call a provider/i.test(docs) && /does not claim/i.test(docs), 'W368 docs must disclose the non-provider limitation.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(`${workLoop}\n${playStation}\n${tourStation}`), 'W368 may not add remote I/O or automatic navigation.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = { schema: 'eonapp.w368.eonbot-city-work-loop-gate.v1', ok: errors.length === 0, generatedAt: new Date().toISOString(), intents: getCityWorkLoopIntents().map((item) => item.id), truth: W368_EONBOT_CITY_WORK_LOOP_CONTRACT.truthRules, limitations: ['Source-only local planning receipt; not a provider request.', 'No automation, publish, spending, delete, admin or connection action is created.', 'No browser/device or production evidence is created by this source gate.'], errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W368_EONBOT_CITY_WORK_LOOP_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

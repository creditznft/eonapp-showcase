#!/usr/bin/env node
/** W372 — EON City visual-certification readiness gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { CITY_VISUAL_CERTIFICATION_CASES, evaluateCityVisualCertificationEvidence, getCityVisualCertificationTruth } from '../assets/js/city/eon-city-visual-certification.js';
import { W372_VISUAL_CERTIFICATION_CONTRACT, validateW372VisualCertificationContract } from '../config/w372-visual-certification-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const boardSource = read('assets/js/city/eon-city-visual-certification.js');
const docs = read('docs/W372_VISUAL_CERTIFICATION_READINESS_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const truth = getCityVisualCertificationTruth();
const emptyBoard = evaluateCityVisualCertificationEvidence();

check(validateW372VisualCertificationContract().length === 0, `W372 contract invalid: ${validateW372VisualCertificationContract().join(' | ')}`);
check(CITY_VISUAL_CERTIFICATION_CASES.map((item) => item.id).join(',') === W372_VISUAL_CERTIFICATION_CONTRACT.requiredCaseIds.join(','), 'W372 visual certification case IDs drifted.');
check(emptyBoard.status === 'pending-external-evidence' && !emptyBoard.independentlyCertified && !emptyBoard.launchApproved, 'W372 must remain pending without external evidence.');
check(!truth.automaticBrowserProof && !truth.automaticDeviceProof && !truth.automaticProductionProof && !truth.automaticCertification, 'W372 must prohibit automatic proof and certification.');
check(/portal-first-impression/.test(boardSource) && /route-graph-production/.test(boardSource) && /independentReviewRequired/.test(boardSource), 'W372 must cover entry, production route and independent review lanes.');
check(/does not issue a certificate|does not claim/i.test(docs) && /external browser, device, and production evidence/i.test(docs), 'W372 docs must disclose source-only status and evidence requirements.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(boardSource), 'W372 cannot fabricate remote evidence collection.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w372.visual-certification-readiness-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  readiness: { sourceBoardReady: errors.length === 0, certificationStatus: emptyBoard.status, independentReviewRequired: true, requiredCaseCount: CITY_VISUAL_CERTIFICATION_CASES.length },
  limitations: [
    'W372 creates readiness criteria, not a visual certification result.',
    'External browser, device, and production evidence must still be collected and independently reviewed.',
    'No production route repair, deployment, screenshot analysis, device test, or launch approval is created by this source gate.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W372_VISUAL_CERTIFICATION_READINESS_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;

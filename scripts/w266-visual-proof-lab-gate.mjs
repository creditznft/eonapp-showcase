#!/usr/bin/env node
/** W266 source gate: validates local capture plan and blocks false external claims. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W266_EXTERNAL_VISUAL_EVIDENCE,
  W266_VISUAL_PROOF_LAB_SCHEMA,
  buildW266VisualProofPlan,
  validateW266VisualProofPlan
} from '../assets/js/utils/w266-visual-proof-lab.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const boardPath = path.join(ROOT, 'release-evidence', 'W266_VISUAL_PROOF_LAB_2026-06-25', 'VISUAL_PROOF_BOARD.json');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const plan = buildW266VisualProofPlan();
const validation = validateW266VisualProofPlan(plan);
assert(validation.ok, validation.errors.join(' '));
assert(plan.captures.length >= 10, 'W266 needs a meaningful desktop/mobile/reduced-motion capture matrix.');
assert(plan.captures.every((row) => row.localAutomationOnly === true), 'W266 capture plan must remain local-only.');
assert(plan.captures.filter((row) => row.route.includes('/eoncity/play')).every((row) => row.route === '/eoncity/play?preview=1'), 'W266 must use exact W259 Preview opt-in for City Play screenshots.');
assert(fs.existsSync(boardPath), 'W266 visual proof board is missing.');
let board = null;
try { board = JSON.parse(fs.readFileSync(boardPath, 'utf8')); } catch { errors.push('W266 visual proof board is invalid JSON.'); }
assert(board?.schema === W266_VISUAL_PROOF_LAB_SCHEMA, 'W266 board schema mismatch.');
assert(board?.verdict === 'NO_GO', 'W266 source board must remain NO_GO until external evidence is reviewed.');
assert(board?.localAutomationOnly === true, 'W266 source board must label local automation correctly.');
assert(board?.canCertifyDeviceSupport === false && board?.canCertifyReleaseReadiness === false, 'W266 board must not self-certify device support/release readiness.');
const external = Array.isArray(board?.externalVisualEvidence) ? board.externalVisualEvidence : [];
assert(external.length === W266_EXTERNAL_VISUAL_EVIDENCE.length, 'W266 board must list every external visual lane.');
for (const id of W266_EXTERNAL_VISUAL_EVIDENCE) {
  const row = external.find((item) => item?.id === id);
  assert(row?.status === 'not-collected', `W266 external visual lane must remain not-collected in source: ${id}.`);
  assert(Array.isArray(row?.evidenceRefs) && row.evidenceRefs.length === 0, `W266 source board may not prefill evidence refs: ${id}.`);
}
const source = fs.readFileSync(path.join(ROOT, 'scripts', 'w266-visual-proof-lab.mjs'), 'utf8');
assert(source.includes('--local-only'), 'W266 capture runner must require explicit local-only mode.');
assert(source.includes('refuses non-local target'), 'W266 capture runner must refuse remote target capture.');
assert(source.includes('remoteRequestsObserved'), 'W266 capture runner must record unexpected remote request origins.');
assert(source.includes('blocked-environment'), 'W266 capture runner must distinguish managed-browser blocking from an app failure.');
assert(source.includes('localStorage.clear()'), 'W266 capture runner must begin from test-safe storage.');
const report = {
  schema: W266_VISUAL_PROOF_LAB_SCHEMA,
  ok: errors.length === 0,
  localAutomationCaptureCount: plan.captures.length,
  externalEvidenceStatus: 'not-collected',
  generatedAt: new Date().toISOString(),
  limitations: plan.claimFence,
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W266_VISUAL_PROOF_LAB_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(`W266 visual proof lab gate: PASS (${plan.captures.length} local capture definitions; external visual evidence remains not collected).`);

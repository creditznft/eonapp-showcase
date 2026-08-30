#!/usr/bin/env node
/** W276 source gate: proves strict local comparison and blocks false deployment claims. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
  buildW276EvidenceBoard,
  buildW276LocalStorageReaudit,
  validateW276EvidenceBoard
} from '../assets/js/utils/w276-data-survival-reaudit.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const boardPath = path.join(ROOT, 'release-evidence', 'W276_DATA_SURVIVAL_REAUDIT_2026-06-25', 'DATA_SURVIVAL_BOARD.json');
const releaseBoardPath = path.join(ROOT, 'release-evidence', 'W260_RELEASE_BOARD_2026-06-25', 'RELEASE_BOARD.json');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };

class MemoryStorage {
  constructor(seed = {}) { this.rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.rows.size; }
  key(index) { return [...this.rows.keys()][index] || null; }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
  toObject() { return Object.fromEntries(this.rows.entries()); }
}

const before = new MemoryStorage({
  'eon:chat:threads:v1': '{"thread":"test-safe"}',
  'eon:projects:v3': '{"project":"test-safe"}',
  'eon:city:preview-evidence:w259:v1': '{"localOnly":true}',
  'eon:future-module:dynamic-key:v1': '{"opaque":"test-safe"}',
  'unrelated:outside-app': 'outside-scope'
});
const after = new MemoryStorage(before.toObject());
const pass = buildW276LocalStorageReaudit(before, after, { fromBuild: 'previous', toBuild: 'candidate' });
assert(pass.schema === W276_DATA_SURVIVAL_REAUDIT_SCHEMA && pass.ok === true, 'W276 local re-audit must pass unchanged observed app-owned keys.');
assert(pass.externalDeploymentEvidence === false, 'W276 local re-audit must never claim external deployment proof.');
assert(pass.dynamicAppOwnedKeys >= 1, 'W276 must observe dynamic/unclassified app-owned keys.');
const changed = new MemoryStorage(before.toObject());
changed.setItem('eon:future-module:dynamic-key:v1', '{"opaque":"changed"}');
const changedResult = buildW276LocalStorageReaudit(before, changed);
assert(changedResult.ok === false && changedResult.changedKeys.includes('eon:future-module:dynamic-key:v1'), 'W276 must detect a changed dynamic app-owned key.');
const lost = new MemoryStorage(before.toObject());
lost.removeItem('eon:future-module:dynamic-key:v1');
const lostResult = buildW276LocalStorageReaudit(before, lost);
assert(lostResult.ok === false && lostResult.lostKeys.includes('eon:future-module:dynamic-key:v1'), 'W276 must detect a lost dynamic app-owned key.');
const unexpected = new MemoryStorage(before.toObject());
unexpected.setItem('eon:new-unapproved-update-key:v1', 'new');
const unexpectedResult = buildW276LocalStorageReaudit(before, unexpected);
assert(unexpectedResult.ok === false && unexpectedResult.unexpectedNewAppKeys.includes('eon:new-unapproved-update-key:v1'), 'W276 must flag unapproved new app-owned keys.');

let board = null;
try { board = JSON.parse(fs.readFileSync(boardPath, 'utf8')); } catch { errors.push('W276 data survival board is missing or invalid JSON.'); }
const boardValidation = validateW276EvidenceBoard(board);
assert(boardValidation.ok, boardValidation.errors.join(' '));
assert(board?.verdict === 'NO_GO', 'W276 source board must stay NO_GO until external evidence is captured.');
assert(board?.canDeclareReleaseReadiness === false, 'W276 board must not self-declare release readiness.');
const generatedBoard = buildW276EvidenceBoard({ boardId: 'unit', requiredEvidence: board?.requiredEvidence });
assert(generatedBoard.verdict === 'NO_GO', 'W276 evidence builder must preserve NO_GO for uncollected lanes.');
let releaseBoard = null;
try { releaseBoard = JSON.parse(fs.readFileSync(releaseBoardPath, 'utf8')); } catch { errors.push('W260 release board is missing or invalid JSON.'); }
const w260DataLane = releaseBoard?.requiredEvidence?.find((row) => row?.id === 'data-preservation-restore-proof');
assert(w260DataLane?.status === 'not-collected', 'W276 must not silently close W260 data preservation/restore evidence.');
const updateUtility = fs.readFileSync(path.join(ROOT, 'assets/js/utils/update-safe-user-data.js'), 'utf8');
assert(updateUtility.includes('collectTrackedRows'), 'W276 requires W145 to track observed dynamic app-owned keys.');
assert(updateUtility.includes('localSimulationIsNotExternalReleaseEvidence'), 'W145/W276 must state the local simulation limit.');
assert(!updateUtility.includes("id: 'rewards-billing-trust'"), 'Retired value-system keys must not be described as active required product data.');
const report = {
  schema: W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
  ok: errors.length === 0,
  localSimulation: { passed: pass.ok, dynamicAppOwnedKeys: pass.dynamicAppOwnedKeys, externalDeploymentEvidence: false },
  externalEvidence: 'not-collected',
  generatedAt: new Date().toISOString(),
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W276_DATA_SURVIVAL_REAUDIT_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(`W276 data survival re-audit gate: PASS (dynamic app-owned key comparison enabled; external evidence remains not collected).`);

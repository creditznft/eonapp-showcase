import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildProjectHandoffExport, createProject } from '../../assets/js/utils/eon-workspace-store.js';
import { parseProjectHandoffText } from '../../assets/js/utils/project-handoff-preflight.js';
import { runW288CreatorHandoffIntegrityGate } from '../../scripts/w288-creator-handoff-integrity-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w288-creator-handoff-integrity-gate.mjs');
const preflightPath = path.join(root, 'assets', 'js', 'utils', 'project-handoff-preflight.js');

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.get(String(key)) ?? null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

test('W288 reviews canonical ordinary-work handoffs without any import or mutation', () => {
  const storage = memoryStorage();
  const project = createProject({ title: 'Local creator work', summary: 'Review safe handoff only.' }, { storage });
  const handoff = buildProjectHandoffExport(project.id, { storage, now: 1_000 });
  const before = storage.getItem('eon:projects:v3');
  const reviewed = parseProjectHandoffText(JSON.stringify(handoff));
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.reviewOnly, true);
  assert.equal(reviewed.directImportAvailable, false);
  assert.equal(reviewed.summary.title, 'Local creator work');
  assert.equal(storage.getItem('eon:projects:v3'), before);
});

test('W288 rejects direct-import, automation and secret-like handoff variants', () => {
  const storage = memoryStorage();
  const project = createProject({ title: 'Safe handoff', summary: 'Normal work.' }, { storage });
  const base = buildProjectHandoffExport(project.id, { storage });
  const direct = structuredClone(base);
  direct.recovery.directImportAvailable = true;
  assert.equal(parseProjectHandoffText(JSON.stringify(direct)).ok, false);
  const automation = structuredClone(base);
  automation.project.automationIds = ['workflow_1'];
  assert.equal(parseProjectHandoffText(JSON.stringify(automation)).ok, false);
  const secret = structuredClone(base);
  secret.project.summary = 'api_key=supersecretvalue';
  assert.equal(parseProjectHandoffText(JSON.stringify(secret)).ok, false);
  assert.equal(parseProjectHandoffText('{').code, 'HANDOFF_JSON_INVALID');
});

test('W288 source gate passes and fails closed if the inspector enables mutation', () => {
  const report = runW288CreatorHandoffIntegrityGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(preflightPath, 'utf8');
  try {
    fs.writeFileSync(preflightPath, `${original}\n// createProject(\n`);
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /pure, local, non-mutating/);
  } finally {
    fs.writeFileSync(preflightPath, original);
  }
});

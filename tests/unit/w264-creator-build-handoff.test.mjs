import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  addProjectArtifact,
  addProjectTask,
  buildProjectHandoffExport,
  createProject,
  getProjectHandoffFilename
} from '../../assets/js/utils/eon-workspace-store.js';
import { runW264CreatorBuildHandoffGate } from '../../scripts/w264-creator-build-handoff-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w264-creator-build-handoff-gate.mjs');
const storePath = path.join(root, 'assets', 'js', 'utils', 'eon-workspace-store.js');

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.get(String(key)) ?? null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

test('W264 builds a finite local ordinary-work handoff without automation, Vault or ownership overclaims', () => {
  const storage = memoryStorage();
  const project = createProject({ title: 'Creator launch brief', summary: 'Plan ordinary assets.' }, { storage });
  addProjectTask(project.id, { title: 'Draft brief', note: 'Keep it local.' }, { storage });
  addProjectArtifact(project.id, { type: 'brief', title: 'Launch brief', content: 'Ordinary project text.' }, { storage });
  const handoff = buildProjectHandoffExport(project.id, { storage, now: 1_000 });

  assert.equal(handoff.schema, 'eon.project-handoff.v1');
  assert.equal(handoff.scope, 'local-ordinary-work-export');
  assert.equal(handoff.ownership.status, 'local-creator-asserted-unverified');
  assert.equal(handoff.recovery.directImportAvailable, false);
  assert.equal(handoff.recovery.fullProfileBackupRoute, '/capsule');
  assert.equal(handoff.project.tasks.length, 1);
  assert.equal(handoff.project.artifacts.length, 1);
  assert.equal(Object.hasOwn(handoff.project, 'automationIds'), false);
  assert.doesNotMatch(JSON.stringify(handoff.project), /api[_ -]?key|seed phrase|wallet address|private key|reward balance|payment credential|mint transaction|transfer signature/i);
  assert.match(handoff.exclusions.join('\n'), /payment, wallet and chain data/i);
  assert.match(handoff.ownership.statement, /does not prove legal ownership/i);
  assert.equal(getProjectHandoffFilename(project.id, { storage }).endsWith('.json'), true);
});

test('W264 refuses unavailable projects and preserves existing secret rejection', () => {
  const storage = memoryStorage();
  assert.throws(() => buildProjectHandoffExport('missing', { storage }), /Project not found/);
  assert.throws(() => createProject({ title: 'Bad', summary: 'api_key=supersecretvalue' }, { storage }), /looks like a secret/i);
});

test('W264 source gate passes and fails closed if the recovery boundary becomes direct import', () => {
  const report = runW264CreatorBuildHandoffGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(storePath, 'utf8');
  try {
    fs.writeFileSync(storePath, original.replace('directImportAvailable: false', 'directImportAvailable: true'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /non-import and Capsule recovery boundary/);
  } finally {
    fs.writeFileSync(storePath, original);
  }
});

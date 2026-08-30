import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const gate = path.join(root, 'scripts', 'w280-public-support-narrative-source-gate.mjs');
const supportPath = path.join(root, 'help.html');

test('W280 public support narrative source gate passes the current source', () => {
  execFileSync(process.execPath, [gate], { cwd: root, stdio: 'pipe' });
  const stats = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', 'w280-public-support-narrative-source-gate', 'stats.json'), 'utf8'));
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.topicIds.length, 6);
  assert.deepEqual([...stats.topicCards].sort(), [...stats.topicIds].sort());
});

test('W280 gate fails closed if the explicit current support boundary disappears', () => {
  const original = fs.readFileSync(supportPath, 'utf8');
  try {
    fs.writeFileSync(supportPath, original.replace('Self-service guidance plus private case workflow', 'Staffed support is always available'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /explicitCurrentBoundary/);
  } finally {
    fs.writeFileSync(supportPath, original);
  }
});

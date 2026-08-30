import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('W204 source-only release gate distinguishes local evidence from a live launch', () => {
  const result = spawnSync(process.execPath, ['scripts/w204-release-gate.mjs', '--source-only'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema, 'eon.release-gate.w204.v1');
  assert.equal(payload.mode, 'source-only');
  assert.equal(payload.passed, true, JSON.stringify(payload.failed));
  assert.match(payload.note, /local\/source evidence/i);
});

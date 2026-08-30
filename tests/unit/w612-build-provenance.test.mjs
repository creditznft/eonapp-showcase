import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  EON_BUILD_PROVENANCE_FILE,
  EON_BUILD_PROVENANCE_SCHEMA,
  createBuildProvenance,
  resolveBuildSourceRevision,
  validateBuildProvenance,
  writeBuildProvenance
} from '../../scripts/build-provenance.mjs';

test('W612 fingerprints the final distribution deterministically while excluding its own manifest', async (t) => {
  const dist = await mkdtemp(path.join(os.tmpdir(), 'eon-build-provenance-'));
  t.after(async () => rm(dist, { recursive: true, force: true }));
  await mkdir(path.join(dist, 'eoncity'), { recursive: true });
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  await Promise.all([
    writeFile(path.join(dist, 'eoncity.html'), '<!doctype html><main>city</main>'),
    writeFile(path.join(dist, 'eoncity', 'index.html'), '<!doctype html><main>city route</main>'),
    writeFile(path.join(dist, 'sw.js'), 'self.addEventListener("install",()=>{})'),
    writeFile(path.join(dist, 'assets', 'app.js'), 'console.log("city")')
  ]);
  await mkdir(path.join(dist, 'release'), { recursive: true });
  await writeFile(path.join(dist, 'release', 'candidate-provenance.json'), '{"candidateDigest":"transient"}');
  const first = await createBuildProvenance({ distDir: dist, sourceRevision: 'A'.repeat(40), generatedAt: '2026-07-04T00:00:00.000Z' });
  const written = await writeBuildProvenance({ distDir: dist, sourceRevision: 'A'.repeat(40), generatedAt: '2026-07-04T00:00:00.000Z' });
  const second = await createBuildProvenance({ distDir: dist, sourceRevision: 'A'.repeat(40), generatedAt: '2026-07-04T00:00:00.000Z' });
  assert.equal(first.schema, EON_BUILD_PROVENANCE_SCHEMA);
  assert.equal(first.sourceRevision, 'a'.repeat(40));
  assert.equal(first.distribution.fileCount, 4);
  assert.equal(first.distribution.sha256, second.distribution.sha256);
  assert.equal(written.provenance.distribution.sha256, first.distribution.sha256);
  assert.deepEqual(validateBuildProvenance(second), []);
  const persisted = JSON.parse(await readFile(path.join(dist, EON_BUILD_PROVENANCE_FILE), 'utf8'));
  assert.equal(persisted.privacy.containsUserData, false);
  assert.equal(persisted.privacy.containsSecrets, false);
});

test('W612 accepts only revision-shaped source identifiers and keeps absence explicit', () => {
  assert.equal(resolveBuildSourceRevision({ env: { EONAPP_SOURCE_REVISION: 'B'.repeat(40) }, cwd: process.cwd() }), 'b'.repeat(40));
  assert.equal(resolveBuildSourceRevision({ env: { EONAPP_SOURCE_REVISION: 'not-a-revision', CF_PAGES_COMMIT_SHA: '' }, cwd: '/path/that/does/not/exist' }), null);
});

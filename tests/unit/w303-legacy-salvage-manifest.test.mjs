import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config/w303-legacy-salvage-manifest.json'), 'utf8'));

test('W303 manifest covers all identified legacy families without reactivating them', () => {
  assert.equal(manifest.schema, 'eonapp.w303.legacy-salvage-manifest.v1');
  const ids = new Set(manifest.records.map((record) => record.id));
  for (const id of ['agent-executor', 'video-lab', 'music-lab', 'social-publisher', 'workbench-ai', 'eon-browser-page', 'creator-studio', 'platform-backend']) assert.equal(ids.has(id), true, `missing ${id}`);
  for (const record of manifest.records) {
    assert.ok(manifest.allowedClassifications.includes(record.classification));
    assert.equal(fs.existsSync(path.join(root, record.source)), true, `source must exist: ${record.source}`);
  }
  assert.equal(manifest.records.find((record) => record.id === 'social-publisher')?.classification, 'archive-forever');
  assert.equal(manifest.records.find((record) => record.id === 'platform-backend')?.classification, 'archive-forever');
});

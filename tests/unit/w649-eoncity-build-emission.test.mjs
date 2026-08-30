import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W649I production sync emits the immutable City library and local decoder', () => {
  const sync = read('scripts/sync-public-assets.mjs');
  assert.match(sync, /\['assets\/city\/w649', 'assets\/city\/w649'\]/);
  assert.match(sync, /\['assets\/vendor\/babylon', 'assets\/vendor\/babylon'\]/);
  assert.doesNotMatch(sync, /pagesFunction|worker relay|R2/i);
});

test('W649I build smoke verifies all 76 emitted binaries byte-for-byte and enforces the Pages size ceiling', () => {
  const smoke = read('scripts/smoke-check-build.cjs');
  assert.match(smoke, /w649-eoncity-asset-intake\.json/);
  assert.match(smoke, /entries\.length !== 76/);
  assert.match(smoke, /crypto\.createHash\('sha256'\)/);
  assert.match(smoke, /25 \* 1024 \* 1024/);
  assert.match(smoke, /meshopt_decoder\.js/);
  assert.match(smoke, /path\.join\(root, 'public', decoderRelative\)/);
  assert.match(smoke, /actual build input/);
  assert.match(smoke, /dist W649 binary count mismatch/);
});


test('W649I distribution minification preserves reviewed vendor decoder bytes', () => {
  const minifier = read('scripts/minify-dist.mjs');
  assert.match(minifier, /assets\\\/vendor/);
  assert.match(minifier, /immutable deploy assets/);
});

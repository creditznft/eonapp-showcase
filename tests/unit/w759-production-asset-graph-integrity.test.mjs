import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\//, process.platform === 'win32' ? '' : '/'));
const gate = path.join(root, 'scripts', 'w759-production-asset-graph-integrity-gate.mjs');

function withDist(files, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eonapp-w759-graph-'));
  try {
    for (const [relative, value] of Object.entries(files)) {
      const target = path.join(directory, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, value);
    }
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('W759 recursively accepts complete HTML, dynamic-import, preload and service-worker asset edges', () => {
  const result = withDist({
    'index.html': '<script type="module" src="/assets/entry.js"></script><link rel="modulepreload" href="/assets/preload.js">',
    'assets/entry.js': 'import("./city.js");',
    'assets/preload.js': 'export {}',
    'assets/city.js': 'export {}',
    'sw.js': 'const PRECACHE = ["/assets/entry.js"];'
  }, (dist) => spawnSync(process.execPath, [gate, dist], { encoding: 'utf8' }));
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('W759 fails closed when a dynamically imported emitted chunk is absent', () => {
  const result = withDist({
    'index.html': '<script type="module" src="/assets/entry.js"></script>',
    'assets/entry.js': 'import("./missing-city-core.js");'
  }, (dist) => spawnSync(process.execPath, [gate, dist], { encoding: 'utf8' }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing-city-core\.js/);
});

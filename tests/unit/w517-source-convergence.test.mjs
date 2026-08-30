import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeHtmlSeoSource } from '../../scripts/sync-w477-route-seo.mjs';
import { resolveW517EvidencePath } from '../../scripts/w517-evidence-output.mjs';
import {
  buildW517GateRegistry,
  buildW517SourceManifest,
  gitTrackedFiles,
  isW517SourceConvergenceCli
} from '../../scripts/w517-source-convergence.mjs';
import { W517_ARTIFACT_ROOT, W517_GATE_LIFECYCLE_VALUES, W517_REQUIRED_PUBLIC_MIRRORS, isW517ManifestExcluded } from '../../config/w517-source-convergence-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W517 route/SEO normalization is idempotent and removes inherited indentation drift', () => {
  const source = '<head>\n                                                                                <link rel="canonical" href="https://old.invalid/" />\n                                                                              <meta name="robots" content="noindex" />\n</head>';
  const directive = { canonical: 'https://eonapp.ch/', robots: 'index, follow' };
  const once = normalizeHtmlSeoSource(source, directive);
  const twice = normalizeHtmlSeoSource(once, directive);
  assert.equal(twice, once);
  assert.match(once, /\n  <link rel="canonical" href="https:\/\/eonapp\.ch\/" \/>\n/);
  assert.match(once, /\n  <meta name="robots" content="index, follow" \/>\n/);
  assert.doesNotMatch(once, /\n {10,}<link rel="canonical"/);
});

test('W517 source manifest is deterministic and excludes self-generated convergence artifacts', () => {
  const files = ['package.json', 'scripts/w517-source-convergence.mjs'];
  const first = buildW517SourceManifest({ root: ROOT, files });
  const second = buildW517SourceManifest({ root: ROOT, files: [...files].reverse() });
  assert.equal(first.aggregateSha256, second.aggregateSha256);
  assert.equal(first.fileCount, 2);
  assert.equal(isW517ManifestExcluded(`${W517_ARTIFACT_ROOT}/source-manifest.json`), true);
  assert.equal(isW517ManifestExcluded('public/assets/img/icons/icon-192.png'), true);
  assert.equal(isW517ManifestExcluded('assets/img/icons/icon-192.png'), false);
  assert.equal(isW517ManifestExcluded('package.json'), false);
});

test('W517 tracks every canonical source required to produce a public mirror', () => {
  const tracked = new Set(gitTrackedFiles({ root: ROOT }));
  for (const { source } of W517_REQUIRED_PUBLIC_MIRRORS) {
    assert.equal(tracked.has(source), true, `missing tracked mirror source: ${source}`);
  }
});

test('W517 release registry distinguishes current authority from historical and evidence-only gates', () => {
  const registry = buildW517GateRegistry({ root: ROOT });
  const lifecycles = new Set(registry.entries.map((entry) => entry.lifecycle));
  for (const lifecycle of W517_GATE_LIFECYCLE_VALUES) assert.equal(lifecycles.has(lifecycle), true);
  assert.equal(registry.entries.find((entry) => entry.id === 'w517-canonical-release')?.lifecycle, 'active');
  assert.equal(registry.entries.find((entry) => entry.id === 'production-browser-proof')?.lifecycle, 'evidence-only');
});

test('W517 evidence output stays in the ignored temporary evidence boundary and rejects traversal', () => {
  const output = resolveW517EvidencePath('receipt.json', { root: ROOT, evidenceRoot: 'tmp/evidence/w517-test' });
  assert.match(output.replaceAll('\\', '/'), /\/tmp\/evidence\/w517-test\/receipt\.json$/);
  assert.throws(() => resolveW517EvidencePath('../outside.json', { root: ROOT }), /without traversal/);
});

test('W517 self-generated convergence artifacts stay outside commit scope', () => {
  const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');
  assert.match(gitignore, /^artifacts\/w517-source-convergence\/$/m);
});

test('W517 current-suite runner defaults to deterministic serial certification and retains bounded opt-in parallelism', async () => {
  const fs = await import('node:fs');
  const runner = fs.readFileSync(path.join(ROOT, 'scripts/run-current-unit-suite.mjs'), 'utf8');
  assert.match(runner, /DEFAULT_TEST_CONCURRENCY = 1/);
  assert.match(runner, /EONAPP_TEST_CONCURRENCY/);
  assert.match(runner, /testConcurrency < 1 \|\| testConcurrency > 8/);
  assert.match(runner, /--test-concurrency=\$\{testConcurrency\}/);
});

test('W517 source syntax gate supports the Git-free portable source identity', () => {
  const syntaxGate = readFileSync(new URL('../../scripts/w517-source-syntax.mjs', import.meta.url), 'utf8');
  assert.match(syntaxGate, /sourceIdentityFiles/);
  assert.doesNotMatch(syntaxGate, /requires a Git checkout/);
});

test('W517 canonical release wrapper resolves npm safely for Windows worktrees', () => {
  const wrapper = readFileSync(new URL('../../scripts/w517-canonical-release-verify.mjs', import.meta.url), 'utf8');
  assert.match(wrapper, /npm_execpath/);
  assert.match(wrapper, /process\.execPath/);
  assert.doesNotMatch(wrapper, /const npm = process\.platform === 'win32' \? 'npm\.cmd' : 'npm';/);
});

test('W517 clean-checkout CLI entrypoint resolves Windows and file URL paths safely', () => {
  const currentScript = path.resolve('scripts/w517-source-convergence.mjs');
  assert.equal(
    isW517SourceConvergenceCli(currentScript, pathToFileURL(currentScript).href),
    true
  );
  assert.equal(
    isW517SourceConvergenceCli(path.resolve('scripts/other.mjs'), pathToFileURL(currentScript).href),
    false
  );
});

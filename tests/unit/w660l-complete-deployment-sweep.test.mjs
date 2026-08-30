import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildCompletePagesBundleManifest,
  collectPagesFunctionSupportFiles,
  stageCompletePagesDeployRoot,
  stableDigest,
  verifyCompletePagesBundle
} from '../../scripts/lib/w660l-pages-deploy-bundle.mjs';

const sha256 = (body) => crypto.createHash('sha256').update(body).digest('hex');
const write = (root, relative, body) => {
  const file = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
};

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-w660l-'));
  const source = path.join(root, 'source');
  const candidate = path.join(root, 'candidate');
  const output = path.join(root, 'bundle');
  write(source, 'functions/api/auth/session.js', "import { value } from '../../../config/value.mjs'; export const onRequest=()=>new Response(String(value));\n");
  write(source, 'functions/api/city/access.js', 'export const onRequest=()=>new Response("ok");\n');
  write(source, 'functions/api/billing/status.js', 'export const onRequest=()=>new Response("ok");\n');
  write(source, 'functions/api/referrals.js', 'export const onRequest=()=>new Response("ok");\n');
  write(source, 'functions/package.json', '{"type":"module"}\n');
  write(source, 'config/value.mjs', 'export const value = 1;\n');
  const files = [
    { path: '_routes.json', body: '{"version":1,"include":["/api/*"],"exclude":[]}\n' },
    { path: 'index.html', body: '<!doctype html><title>EON</title>\n' }
  ];
  const rows = files.map(({ path: filePath, body }) => ({ path: filePath, bytes: Buffer.byteLength(body), sha256: sha256(body) }));
  const distPayloadDigest = stableDigest(rows);
  const provenance = { candidateDigest: 'a'.repeat(64), commitSha: 'b'.repeat(40), distPayloadDigest, fileCount: rows.length };
  const manifest = { candidateDigest: provenance.candidateDigest, distPayloadDigest, fileCount: rows.length, files: rows };
  for (const file of files) write(candidate, `dist/${file.path}`, file.body);
  write(candidate, 'candidate-provenance.json', `${JSON.stringify(provenance)}\n`);
  write(candidate, 'candidate-manifest.json', `${JSON.stringify(manifest)}\n`);
  write(candidate, 'dist/release/candidate-provenance.json', `${JSON.stringify(provenance)}\n`);
  write(candidate, 'dist/release/candidate-manifest.json', `${JSON.stringify(manifest)}\n`);
  return { root, source, candidate, output, provenance, manifest };
}

test('W660L discovers every relative module imported by Pages Functions', () => {
  const fixture = createFixture();
  try { assert.deepEqual(collectPagesFunctionSupportFiles(fixture.source), ['config/value.mjs']); }
  finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
});

test('W660L stages immutable static files with Functions and support modules', () => {
  const fixture = createFixture();
  try {
    const deployRoot = path.join(fixture.output, 'deploy-root');
    const staged = stageCompletePagesDeployRoot({ sourceRoot: fixture.source, candidateRoot: fixture.candidate, outputRoot: deployRoot });
    assert.equal(staged.provenance.candidateDigest, fixture.provenance.candidateDigest);
    for (const relative of ['index.html', '_routes.json', 'functions/api/auth/session.js', 'config/value.mjs']) assert.equal(fs.existsSync(path.join(deployRoot, ...relative.split('/'))), true);
  } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
});

test('W660L complete bundle verifier detects tampering', () => {
  const fixture = createFixture();
  try {
    const deployRoot = path.join(fixture.output, 'deploy-root');
    const staged = stageCompletePagesDeployRoot({ sourceRoot: fixture.source, candidateRoot: fixture.candidate, outputRoot: deployRoot });
    const bundle = buildCompletePagesBundleManifest({ deployRoot, provenance: staged.provenance, manifest: staged.manifest, supportFiles: staged.supportFiles, sourceAuthority: 'w660k', sourceCommit: 'c'.repeat(40), generatedAt: '2026-07-20T00:00:00.000Z' });
    write(fixture.output, 'W660L_COMPLETE_DEPLOY_BUNDLE_MANIFEST.json', `${JSON.stringify(bundle)}\n`);
    assert.equal(verifyCompletePagesBundle(fixture.output).ok, true);
    write(deployRoot, 'index.html', 'tampered');
    assert.equal(verifyCompletePagesBundle(fixture.output).ok, false);
  } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
});

test('W660L legacy Babylon owner accepts semantic forward and backward input', () => {
  const body = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
  assert.match(body, /direction === 'forward' \? 'up'/);
  assert.match(body, /direction === 'backward' \? 'down'/);
});

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inspectW766IR2BuiltArtifact, W766IR2_BUILT_ARTIFACT_SCHEMA } from '../../scripts/w766ir2-built-artifact-gate.mjs';

function write(root, relative, body) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

function makeDist() {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'w766ir2-built-'));
  const digest = 'a'.repeat(64);
  const binary = 'binary';
  const binaryHash = crypto.createHash('sha256').update(binary).digest('hex').slice(0, 12);
  const immutableManifestAuthority = {
    schema: 'eon.city.immutable-asset-manifest.r09.v1',
    entries: [{ sourcePath: '/assets/city/models/core.glb', url: `/assets/city/immutable/models/core.${binaryHash}.glb`, sha256: crypto.createHash('sha256').update(binary).digest('hex'), bytes: Buffer.byteLength(binary), group: 'models' }]
  };
  const immutableDigest = crypto.createHash('sha256').update(JSON.stringify(immutableManifestAuthority)).digest('hex');
  write(dist, `assets/city/immutable/models/core.${binaryHash}.glb`, binary);
  write(dist, 'assets/city/immutable/manifest.json', JSON.stringify({ ...immutableManifestAuthority, digest: immutableDigest }));
  write(dist, 'sw.js', "const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1';\n");
  write(dist, '_headers', '/assets/city/immutable/*\n  Cache-Control: public, max-age=31536000, immutable\n');
  write(dist, '_redirects', '/* /index.html 200\n');
  write(dist, 'build-provenance.json', '{}\n');
  write(dist, 'release/candidate-provenance.json', '{}\n');
  write(dist, 'eoncity/index.html', '<link rel="stylesheet" href="/assets/css/eon-city-play-live-3a245e6.css">\n');
  write(dist, 'assets/css/eon-city-play-live-3a245e6.css', [
    '.eon-city-command-menu { position: fixed; inset: 0; }',
    '.eon-city-command-menu__dialog { display: grid; }',
    '.eon-city-command-menu__actions { display: flex; }',
    '.eon-city-transit-review-dialog { position: fixed; inset: 0; }',
    '.eon-city-expanse-review-dialog { position: fixed; inset: 0; }'
  ].join('\n'));
  write(dist, 'offline/eonapp-offline-pack-manifest.json', JSON.stringify({ schema: 'eonapp.offline-pack-manifest.w766ir2.v1', digest, packs: { core: { entries: 1 }, city: { entries: 1 } }, entries: [] }));
  write(dist, '.eon-build-report.json', JSON.stringify({
    schema: 'eon.build.production.v2', ok: true,
    contentAddressedCityAssets: {
      assetsAddressed: 1,
      removedOriginals: 1,
      immutableManifest: { path: 'assets/city/immutable/manifest.json', schema: 'eon.city.immutable-asset-manifest.r09.v1', digest: immutableDigest, entries: 1 }
    },
    offlinePack: { digest },
    buildProvenance: { sourceRevision: 'abc', distributionSha256: 'b'.repeat(64) }
  }));
  return dist;
}

test('W766IR2-F built artifact gate accepts only the complete immutable offline distribution', () => {
  const dist = makeDist();
  try {
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.schema, W766IR2_BUILT_ARTIFACT_SCHEMA);
    assert.equal(report.ok, true, report.failures.map((entry) => entry.id).join(', '));
    assert.equal(report.checks.length, 11);
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

test('W766IR2-K built artifact gate rejects malformed City CSS before later surfaces can be parsed', () => {
  const dist = makeDist();
  try {
    write(dist, 'assets/css/eon-city-play-live-3a245e6.css', '.eon-play-command-deck-card { max-height: calc(100dvh - 1rem; }\n.eon-city-command-menu { position: fixed; inset: 0; }');
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.ok, false);
    assert.ok(report.failures.some((entry) => entry.id === 'city-overlay-css-parses'));
    assert.ok(report.failures.some((entry) => entry.id === 'city-overlay-critical-surfaces-parsed'));
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

test('W766IR2-I built artifact gate rejects a City route without its full-screen overlay stylesheet', () => {
  const dist = makeDist();
  try {
    fs.rmSync(path.join(dist, 'assets/css/eon-city-play-live-3a245e6.css'));
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.ok, false);
    assert.ok(report.failures.some((entry) => entry.id === 'city-overlay-stylesheet-emitted'));
    assert.ok(report.failures.some((entry) => entry.id === 'city-overlay-viewport-geometry'));
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

test('R09 built artifact gate fails closed when immutable City manifest is absent or diverges from the build report', () => {
  const dist = makeDist();
  try {
    fs.rmSync(path.join(dist, 'assets/city/immutable/manifest.json'));
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.ok, false);
    assert.ok(report.failures.some((entry) => entry.id === 'immutable-city-asset-manifest'));
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

test('W766IR2-F built artifact gate fails closed when a mutable City binary survives the build', () => {
  const dist = makeDist();
  try {
    write(dist, 'assets/city/models/mutable.glb', 'mutable');
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.ok, false);
    assert.ok(report.failures.some((entry) => entry.id === 'content-addressed-city-binaries'));
    assert.deepEqual(report.cityAudit.unhashedFiles, ['assets/city/models/mutable.glb']);
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});


test('W766IR2-F built artifact gate fails closed when immutable filename hash does not match emitted bytes', () => {
  const dist = makeDist();
  try {
    const immutable = fs.readdirSync(path.join(dist, 'assets/city/immutable/models'))[0];
    fs.writeFileSync(path.join(dist, 'assets/city/immutable/models', immutable), 'tampered');
    const report = inspectW766IR2BuiltArtifact({ distDir: dist });
    assert.equal(report.ok, false);
    assert.ok(report.failures.some((entry) => entry.id === 'content-addressed-city-binaries'));
    assert.equal(report.cityAudit.hashMismatches.length, 1);
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

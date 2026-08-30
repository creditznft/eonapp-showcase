import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  auditEonCityContentAddressedDist,
  contentAddressEonCityBinaries,
  EON_CITY_IMMUTABLE_PREFIX
} from '../../scripts/eon-city-content-addressed-binaries.mjs';

const sha12 = (body) => crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);

function createDist(body = 'stable-city-model') {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-city-content-address-'));
  const model = path.join(dist, 'assets/city/models/command-horizon.glb');
  fs.mkdirSync(path.dirname(model), { recursive: true });
  fs.writeFileSync(model, body);
  fs.mkdirSync(path.join(dist, 'assets/js'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'assets/js/runtime.js'), "export const model='/assets/city/models/command-horizon.glb';\n");
  fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify({ model: 'assets/city/models/command-horizon.glb' }));
  return dist;
}

test('W766IR2-F rewrites mutable City binaries to hash-bearing immutable URLs and removes originals', () => {
  const dist = createDist();
  try {
    const result = contentAddressEonCityBinaries({ distDir: dist });
    const expected = `/assets/city/immutable/models/command-horizon.${sha12('stable-city-model')}.glb`;
    assert.equal(result.ok, true);
    assert.equal(result.assetsAddressed, 1);
    assert.equal(result.removedOriginals, 1);
    assert.equal(result.rewrittenFiles, 2);
    assert.ok(result.rewrittenReferences >= 2);
    assert.equal(fs.existsSync(path.join(dist, 'assets/city/models/command-horizon.glb')), false);
    assert.equal(fs.existsSync(path.join(dist, expected.slice(1))), true);
    assert.match(fs.readFileSync(path.join(dist, 'assets/js/runtime.js'), 'utf8'), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'), /assets\/city\/immutable\/models\/command-horizon\.[a-f0-9]{12}\.glb/);
    assert.equal(auditEonCityContentAddressedDist({ distDir: dist }).ok, true);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});

test('W766IR2-F unchanged bytes keep the same immutable URL and changed bytes receive a new URL', () => {
  const first = createDist('same');
  const second = createDist('same');
  const changed = createDist('changed');
  try {
    const firstResult = contentAddressEonCityBinaries({ distDir: first });
    const secondResult = contentAddressEonCityBinaries({ distDir: second });
    const changedResult = contentAddressEonCityBinaries({ distDir: changed });
    assert.equal(firstResult.mappings[0].immutableRelative, secondResult.mappings[0].immutableRelative);
    assert.notEqual(firstResult.mappings[0].immutableRelative, changedResult.mappings[0].immutableRelative);
    assert.ok(`/${firstResult.mappings[0].immutableRelative}`.startsWith(EON_CITY_IMMUTABLE_PREFIX));
  } finally {
    for (const dist of [first, second, changed]) fs.rmSync(dist, { recursive: true, force: true });
  }
});

test('W766IR2-F audit fails closed on any emitted un-hashed City binary or reference', () => {
  const dist = createDist();
  try {
    const audit = auditEonCityContentAddressedDist({ distDir: dist });
    assert.equal(audit.ok, false);
    assert.deepEqual(audit.unhashedFiles, ['assets/city/models/command-horizon.glb']);
    assert.ok(audit.unaddressedReferences.some((entry) => entry.reference.includes('assets/city/models/command-horizon.glb')));
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});

test('W766IR2-F rewrites relative glTF buffer references to their immutable hash-bearing companions', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-city-gltf-address-'));
  try {
    const root = path.join(dist, 'assets/city/models');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'scene.bin'), 'buffer-bytes');
    fs.writeFileSync(path.join(root, 'scene.gltf'), JSON.stringify({ asset: { version: '2.0' }, buffers: [{ uri: 'scene.bin', byteLength: 12 }] }));
    fs.writeFileSync(path.join(dist, 'index.html'), '<script>const model="/assets/city/models/scene.gltf"</script>');
    const result = contentAddressEonCityBinaries({ distDir: dist });
    assert.equal(result.ok, true);
    assert.equal(result.assetsAddressed, 2);
    assert.equal(result.rewrittenGltfUris, 1);
    const gltfMapping = result.mappings.find((entry) => entry.sourceRelative.endsWith('/scene.gltf'));
    const binMapping = result.mappings.find((entry) => entry.sourceRelative.endsWith('/scene.bin'));
    const gltfBytes = fs.readFileSync(path.join(dist, gltfMapping.immutableRelative));
    const document = JSON.parse(gltfBytes.toString('utf8'));
    assert.equal(document.buffers[0].uri, path.posix.basename(binMapping.immutableRelative));
    assert.equal(path.basename(gltfMapping.immutableRelative).includes(sha12(gltfBytes)), true, 'glTF URL hash must describe the rewritten emitted bytes');
    assert.equal(fs.existsSync(path.join(dist, binMapping.immutableRelative)), true);
    assert.equal(auditEonCityContentAddressedDist({ distDir: dist }).ok, true);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});


test('W766IR2-F audit rejects a hash-bearing filename whose bytes no longer match its embedded digest', () => {
  const dist = createDist('original');
  try {
    const result = contentAddressEonCityBinaries({ distDir: dist });
    const immutable = path.join(dist, result.mappings[0].immutableRelative);
    fs.writeFileSync(immutable, 'tampered');
    const audit = auditEonCityContentAddressedDist({ distDir: dist });
    assert.equal(audit.ok, false);
    assert.equal(audit.hashMismatches.length, 1);
    assert.equal(audit.hashMismatches[0].file, result.mappings[0].immutableRelative);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});

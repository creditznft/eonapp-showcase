import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW519LegacyTransportQuarantine } from '../../scripts/w519-legacy-transport-quarantine-gate.mjs';
import { W519_APPROVED_WEBRTC_SOURCE_PATHS, W519_BUILD_DENYLIST, W519_QUARANTINED_SOURCE_PATHS, validateW519LegacyTransportQuarantineContract } from '../../config/w519-legacy-transport-quarantine-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_ROOT = path.join(ROOT, 'tmp', 'w519-unit-fixture');

function resetFixture() {
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  fs.mkdirSync(FIXTURE_ROOT, { recursive: true });
}

test('W519 inventory is complete and current source cannot reach quarantined transport/control code', () => {
  assert.deepEqual(validateW519LegacyTransportQuarantineContract(), []);
  assert.ok(W519_QUARANTINED_SOURCE_PATHS.length >= 70);
  const result = inspectW519LegacyTransportQuarantine({ root: ROOT });
  assert.equal(result.ok, true, result.issues.join('\n'));
  assert.equal(result.quarantinedPathCount, W519_QUARANTINED_SOURCE_PATHS.length);
  assert.equal(result.builtOutputChecked, fs.existsSync(path.join(ROOT, 'dist')));
});


test('W519 allows only the explicit loopback-bridge Live Voice WebRTC boundary', () => {
  assert.deepEqual(W519_APPROVED_WEBRTC_SOURCE_PATHS, ['assets/js/chat/eon-live-voice-realtime.js']);
  assert.equal(W519_BUILD_DENYLIST.includes('RTCPeerConnection'), false);
  const source = fs.readFileSync(path.join(ROOT, W519_APPROVED_WEBRTC_SOURCE_PATHS[0]), 'utf8');
  assert.match(source, /explicitUserAction/);
  assert.match(source, /EON_LOCAL_BRIDGE_ENDPOINT/);
  assert.match(source, /noCloudCredentialCustody/);
  assert.doesNotMatch(source, /new\s+WebSocket\s*\(/);
});

test('W519 rejects a deliberate active import of the physical archive boundary', () => {
  resetFixture();
  const fixture = path.join(FIXTURE_ROOT, 'active-import.mjs');
  fs.writeFileSync(fixture, ['im', 'port ', "'../../archive/w519-legacy-transport-control/assets/js/relay/eon-relay-pilot-contract.js';\n"].join(''));
  const result = inspectW519LegacyTransportQuarantine({ root: ROOT, extraActiveEntrypoints: [path.relative(ROOT, fixture)] });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith('active-import-reaches-quarantine:')), result.issues.join('\n'));
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
});

test('W519 rejects a deliberate built-output marker even when source paths are clean', () => {
  resetFixture();
  const dist = path.join(FIXTURE_ROOT, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'chunk.js'), '/* eon-relay-pilot */');
  const result = inspectW519LegacyTransportQuarantine({ root: ROOT, requireDist: true, distDirectory: dist });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith('built-output-marker:')), result.issues.join('\n'));
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
});

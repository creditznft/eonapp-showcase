import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const artSource = fs.readFileSync(new URL('../../assets/js/city/rt92/signal/eon-city-rt92-signal-deep-art.js', import.meta.url), 'utf8');
const gatewaySource = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('RT92 Signal deep art authors all five zones with distinct signatures', () => {
  for (const zone of ['gateway-overlook', 'beacon-fields', 'archive-ruins', 'transit-scar', 'horizon-vault']) assert.match(artSource, new RegExp(zone));
  for (const signature of ['broken-grand-signal-arch', 'rhythmic-relay-field', 'monolith-excavation-ruins', 'fractured-linear-transit-wound', 'monumental-ordered-vault-approach']) assert.match(artSource, new RegExp(signature));
});

test('RT92 Signal deep art adds real procedural environment geometry and restoration', () => {
  for (const marker of ['rt92-signal-broken-grand-arch-a', 'rt92-signal-beacon-mast-', 'rt92-signal-archive-monolith-', 'rt92-signal-transit-fracture-', 'rt92-signal-vault-approach-pylon-']) assert.match(artSource, new RegExp(marker));
  assert.match(artSource, /applyProgress/);
  assert.match(artSource, /restoredOnly/);
  assert.match(artSource, /proceduralGeometryOnly: true/);
  assert.match(artSource, /firstFrameHubBinaryDelta: 0/);
  assert.match(artSource, /ownsRenderLoop: false/);
});

test('Signal gateway mounts RT92 art only with deferred Signal entry and shares lifecycle', () => {
  assert.match(gatewaySource, /mountEonCityRt92SignalDeepArt/);
  assert.match(gatewaySource, /rt92SignalDeepArt\?\.activate/);
  assert.match(gatewaySource, /rt92SignalDeepArt\?\.deactivate/);
  assert.match(gatewaySource, /rt92SignalDeepArt\?\.applyProgress/);
  assert.match(gatewaySource, /rt92SignalDeepArt\?\.update/);
  assert.match(gatewaySource, /rt92SignalDeepArt\?\.dispose/);
});

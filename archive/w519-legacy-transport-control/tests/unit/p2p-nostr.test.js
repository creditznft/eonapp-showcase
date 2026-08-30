const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadNormalizeRelayUrl() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'p2p-nostr.js'), 'utf8');
  const match = source.match(/function _normalizeRelayUrl\([^)]*\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match, '_normalizeRelayUrl function should exist');
  return vm.runInNewContext(`${match[0]}; _normalizeRelayUrl;`, { URL });
}

test('normalizeRelayUrl accepts secure websocket relay URL', () => {
  const normalizeRelayUrl = loadNormalizeRelayUrl();
  assert.equal(normalizeRelayUrl('wss://relay.damus.io'), 'wss://relay.damus.io/');
});

test('normalizeRelayUrl rejects insecure ws:// URL', () => {
  const normalizeRelayUrl = loadNormalizeRelayUrl();
  assert.equal(normalizeRelayUrl('ws://relay.damus.io'), '');
});

test('normalizeRelayUrl rejects https:// URL', () => {
  const normalizeRelayUrl = loadNormalizeRelayUrl();
  assert.equal(normalizeRelayUrl('https://relay.damus.io'), '');
});

test('normalizeRelayUrl rejects relay URL with auth credentials', () => {
  const normalizeRelayUrl = loadNormalizeRelayUrl();
  assert.equal(normalizeRelayUrl('wss://user:pass@relay.damus.io'), '');
});


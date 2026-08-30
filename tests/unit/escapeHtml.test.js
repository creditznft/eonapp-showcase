const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadEscapeHtml() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'escape.js'), 'utf8');
  // Strip the export keyword so it runs in vm context
  const stripped = source.replace(/^export\s+/m, '');
  const match = stripped.match(/function escapeHtml\([^)]*\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match, 'escapeHtml function should exist in utils/escape.js');
  return vm.runInNewContext(`${match[0]}; escapeHtml;`);
}

test('escapeHtml escapes all five HTML entities', () => {
  const escapeHtml = loadEscapeHtml();
  const input = `<tag attr="x">'A' & B > C`;
  const escaped = escapeHtml(input);
  assert.equal(escaped, '&lt;tag attr=&quot;x&quot;&gt;&#39;A&#39; &amp; B &gt; C');
});

test('escapeHtml escapes each entity individually', () => {
  const escapeHtml = loadEscapeHtml();
  assert.equal(escapeHtml('<'), '&lt;');
  assert.equal(escapeHtml('>'), '&gt;');
  assert.equal(escapeHtml('"'), '&quot;');
  assert.equal(escapeHtml("'"), '&#39;');
  assert.equal(escapeHtml('&'), '&amp;');
});


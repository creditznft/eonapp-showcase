import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyBrowserConsoleMessage, routeBrowserConsoleEvidence } from '../../scripts/lib/eon-browser-console-evidence.mjs';

const ownerRunner = fs.readFileSync(new URL('../../scripts/w599-run-authenticated-eoncity.mjs', import.meta.url), 'utf8');

function fakeMessage({ type = 'warning', text = '', url = '' } = {}) {
  return { type: () => type, text: () => text, location: () => ({ url, lineNumber: 1, columnNumber: 1 }) };
}

test('Launch95 classifies extension content-script console noise outside first-party certification evidence', () => {
  const extension = classifyBrowserConsoleMessage(fakeMessage({
    type: 'warning',
    text: 'ObjectMultiplex - orphaned data for stream background-liveness',
    url: 'chrome-extension://abcdefghijklmnop/contentscript.js'
  }));
  assert.equal(extension.source, 'browser-extension');
  assert.equal(extension.firstPartyRelevant, false);

  const app = classifyBrowserConsoleMessage(fakeMessage({
    type: 'error',
    text: 'EON City runtime failure',
    url: 'https://eonapp.ch/assets/eon-city-play-core.js'
  }));
  assert.equal(app.source, 'page-or-browser');
  assert.equal(app.firstPartyRelevant, true);
});

test('Launch95 evidence routing keeps extension noise visible but separate and keeps first-party errors fail-relevant', () => {
  const firstParty = [];
  const extensions = [];
  routeBrowserConsoleEvidence(fakeMessage({ type: 'error', text: 'extension fault', url: 'chrome-extension://abc/contentscript.js' }), { firstParty, extensions });
  routeBrowserConsoleEvidence(fakeMessage({ type: 'error', text: 'app fault', url: 'https://eonapp.ch/eoncity' }), { firstParty, extensions });
  assert.equal(extensions.length, 1);
  assert.equal(firstParty.length, 1);
  assert.match(firstParty[0].text, /app fault/);
});


test('Launch95 console evidence strips query strings and redacts credential-like values', () => {
  const evidence = classifyBrowserConsoleMessage(fakeMessage({
    type: 'error',
    text: 'authorization=secret token=abc123 runtime failed',
    url: 'https://eonapp.ch/eoncity?token=secret#debug'
  }));
  assert.equal(evidence.url, 'https://eonapp.ch/eoncity');
  assert.doesNotMatch(evidence.text, /secret|abc123/);
  assert.match(evidence.text, /\[REDACTED\]/);
});

test('authenticated owner proof uses the same console evidence boundary', () => {
  assert.match(ownerRunner, /routeBrowserConsoleEvidence/);
  assert.match(ownerRunner, /extensionConsoleMessages/);
  assert.match(ownerRunner, /firstParty: report\.consoleErrors, extensions: report\.extensionConsoleMessages/);
});

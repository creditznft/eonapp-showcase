import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('chat mobile CSS keeps messages and input reachable', () => {
  const css = read('assets/css/chat.css');
  assert.match(css, /body\[data-page-type="chat"\][\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.chat-messages[\s\S]*min-height:\s*42dvh/);
  assert.match(css, /\.chat-input-bar[\s\S]*position:\s*sticky/);
  assert.match(css, /\.chat-controls-panel\s*\{[\s\S]*min-height:\s*0/);
});

test('AI Cockpit mobile CSS prevents tab and nav overlap', () => {
  const css = read('assets/css/eon-browser.css');
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.browser-nav-bar[\s\S]*flex-wrap:\s*wrap/);
  assert.match(css, /\.browser-addressbar-wrap[\s\S]*flex:\s*1 0 100%/);
  assert.match(css, /\.eon-browser-tab,[\s\S]*\.browser-tab[\s\S]*min-width:\s*94px/);
  assert.match(css, /\.eon-newtab-apps[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
});

test('AI Cockpit new tab logic gives visible feedback and closes correct tab frame', () => {
  const js = read('assets/js/eon-browser-page.js');
  assert.match(js, /New Tab \$\{tabState\.tabs\.length \+ 1\}/);
  assert.match(js, /setStatus\?\.\(isNewTab \? 'New Cockpit tab opened\.'/);
  assert.match(js, /const \[removedTab\] = tabState\.tabs\.splice\(idx, 1\)/);
});

test('RealmWorld has mobile safe mode and boot fallback', () => {
  const js = read('assets/js/realmworld-page.js');
  const css = read('assets/css/realmworld.css');
  assert.match(js, /function isSmallTouchViewport\(\)/);
  assert.match(js, /EON City safe fallback loaded/);
  assert.match(js, /On phones this opens in safe 2\.5D mode first/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.rw-visual-toolbar,[\s\S]*display:\s*none/);
  assert.match(css, /\.rw-live-entry-note/);
});

test('Genesis launch catalog remains USD open-edition and low-motion by default', () => {
  const js = read('assets/js/utils/genesis-collection.js');
  assert.match(js, /currency:\s*'usd'/);
  assert.match(js, /limited:\s*false/);
  assert.match(js, /animatedVisual:\s*false/);
  assert.match(js, /Open edition utility sale; no resale or profit promise/);
});

test('onboarding reminder covers backup, cloud, AI, and optional email recovery', () => {
  const js = read('assets/js/utils/onboarding-reminder.js');
  assert.match(js, /Create encrypted Vault backup/);
  assert.match(js, /Add recovery mirror/);
  assert.match(js, /Connect AI power/);
  assert.match(js, /Optional recovery contact/);
  assert.match(js, /Remind me later/);
});

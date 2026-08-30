import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W384 makes Apps a compact four-start hub without re-exposing legacy workspace categories', () => {
  const html = read('apps.html');
  const js = read('assets/js/apps/eon-apps-hub.js');
  const css = read('assets/css/eon-apps-hub.css');
  assert.match(html, /eon-apps-root/);
  assert.match(html, /eon-apps-hub\.js/);
  assert.match(html, /eon-apps-hub\.css/);
  assert.doesNotMatch(html, /eon-app-deck-page\.js/);
  for (const label of ["id: 'build'", "id: 'create'", "id: 'research'", "id: 'automate'"]) assert.match(js, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon/);
  assert.match(js, /PENDING_COMPOSER_PROMPT_KEY/);
  assert.match(js, /href: '\/forge'/);
  assert.match(js, /window\.location\.assign\('\/\?new=1'\)/);
  assert.match(js, /Nothing is published, purchased or sent without your clear approval\./);
  assert.match(css, /var\(--clr-text\)/);
  assert.match(css, /@media \(max-width:620px\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('RT90 Open Worlds keeps three equal desktop cards with bounded copy and full-width actions', () => {
  assert.match(css, /\.eon-city-command-menu-worlds\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.eon-city-command-menu-worlds article p\{max-width:36ch/);
  assert.match(css, /\.eon-city-command-menu-worlds article button\{width:100%;min-height:2\.7rem\}/);
  assert.match(css, /text-wrap:balance/);
});

test('RT90 short landscape keeps all three worlds visible without descriptive-copy collision', () => {
  assert.match(css, /@media\(max-height:540px\) and \(orientation:landscape\) and \(max-width:960px\)\{[\s\S]*?data-eon-city-menu-mode="explore"[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /data-eon-city-menu-mode="explore"[^\n]*\.eon-city-command-menu-worlds article p\{display:none\}/);
  assert.match(css, /data-eon-city-menu-mode="explore"[^\n]*\.eon-city-command-menu-worlds article button\{min-height:2\.45rem/);
  assert.match(css, /data-eon-city-menu-mode="explore"[^\n]*\.eon-city-command-menu-worlds\{[\s\S]*?overflow:auto/);
});

test('RT90 world cards expose actionable review-safe copy for all three destinations', () => {
  assert.match(runtime, /data-eon-city-featured="signal-frontier"/);
  assert.match(runtime, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtime, /data-eon-city-featured="storm-sector" data-eon-city-world-status="available"/);
  assert.match(runtime, /Direct review grants no certification, XP or progression/);
  assert.match(runtime, /data-eon-city-menu-open-storm>Open Storm Sector/);
  assert.match(runtime, /data-eon-city-featured="my-frontier" data-eon-city-world-status="available-from-start"/);
  assert.match(runtime, /data-eon-city-menu-open-my-frontier>Open My Frontier/);
});

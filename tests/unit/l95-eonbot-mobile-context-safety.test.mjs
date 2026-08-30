import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../../assets/css/eon-work-surface.css', import.meta.url), 'utf8');

test('phone City EONBOT context cannot grow into the composer or host controls', () => {
  assert.match(css, /\[data-eon-city-chat-world-context\][\s\S]*-webkit-line-clamp:2/);
  assert.match(css, /\[data-eon-city-chat-world-context\][\s\S]*max-height:2\.7em/);
  assert.match(css, /\[data-eon-city-chat-world-context\][\s\S]*overflow:hidden/);
});

test('phone City EONBOT removes redundant page-hop actions from the compact sheet header', () => {
  assert.match(css, /\[data-eon-city-chat-adapter="lightweight"\] \.eon-work-panel-intro > \.eon-work-panel-actions \{[\s\S]*display:none/);
  assert.match(css, /\[data-eon-city-chat-form\][\s\S]*position:sticky/);
  assert.match(css, /\[data-eon-city-chat-form\] \.is-primary[\s\S]*flex:1 1 8rem/);
});

test('phone City EONBOT prioritizes Send and current-step help over secondary draft chrome', () => {
  assert.match(css, /\[data-eon-city-chat-help-current\] \{[\s\S]*flex:1 1 10rem/);
  assert.match(css, /\[data-eon-city-chat-clear\] \{[\s\S]*display:none/);
  assert.match(css, /\[data-eon-city-chat-form\] \.is-primary[\s\S]*flex:1 1 8rem/);
});

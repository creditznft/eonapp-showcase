import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../../assets/css/eon-work-surface.css', import.meta.url), 'utf8');
const chat = await readFile(new URL('../../assets/js/work-surface/adapters/eon-chat-panel.js', import.meta.url), 'utf8');

const mobileChatBlock = css.slice(css.indexOf('/* L95-M12 — phone City EONBOT'));

test('L95 phone City EONBOT sheet gives the chat its own bounded body and composer zone', () => {
  assert.match(mobileChatBlock, /@media \(max-width:640px\)/);
  assert.match(mobileChatBlock, /\[data-eon-city-chat-adapter="lightweight"\][\s\S]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(mobileChatBlock, /\[data-eon-city-chat-form\][\s\S]*position:sticky;[\s\S]*bottom:0/);
  assert.match(mobileChatBlock, /textarea[\s\S]*max-height:22dvh/);
});

test('L95 phone City EONBOT keeps Send a real in-layout 48px action', () => {
  assert.match(chat, /type="submit">Send/);
  assert.match(mobileChatBlock, /\.eon-work-panel-actions button[\s\S]*min-height:48px/);
  assert.match(mobileChatBlock, /\[data-eon-city-chat-form\] \.is-primary[\s\S]*flex:1 1 8rem/);
});

test('L95 phone workspace host keeps Close and Minimize at 48px independently of the chat composer', () => {
  assert.match(css, /:is\(\[data-eon-work-surface-close\],\[data-eon-work-surface-minimize\]\)[\s\S]*min-width: 48px;[\s\S]*min-height: 48px/);
});

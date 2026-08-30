import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const chat = fs.readFileSync(new URL('../../assets/js/work-surface/adapters/eon-chat-panel.js', import.meta.url), 'utf8');

test('persistent City EONBOT is one click to real chat and carries exact active-world context', () => {
  assert.match(runtime, /onOpenStation\?\.\('eonbot-nexus',[\s\S]*'chat', \{ eonbotWorldContext: worldContext \}\)/);
  assert.match(runtime, /worldLabel: 'Signal Frontier'/);
  assert.match(runtime, /worldLabel: 'My Frontier'/);
  assert.match(runtime, /worldLabel: 'Storm Sector'/);
  assert.match(runtime, /includesPrivateContent: false/);
});

test('lightweight EONBOT shows bounded world context and uses it only as public gameplay context for the reply', () => {
  assert.match(chat, /resolveWorldContext\(invocation/);
  assert.match(chat, /Here with you in/);
  assert.match(chat, /EON City public gameplay context — no private content/);
  assert.match(chat, /input: contextualAiInput\(prompt, worldContext\)/);
  assert.match(chat, /includesPrivateContent === true\) return null/);
});

test('world context assists the provider request without polluting the canonical user transcript', () => {
  assert.match(chat, /input: contextualAiInput\(prompt, worldContext\)/);
  assert.match(chat, /\{ role: 'user', text: prompt, source: 'user' \}/);
  assert.doesNotMatch(chat, /\{ role: 'user', text: contextualAiInput/);
  assert.match(chat, /includesPrivateContent: false/);
});

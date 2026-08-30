import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const chat = fs.readFileSync(new URL('../../assets/js/work-surface/adapters/eon-chat-panel.js', import.meta.url), 'utf8');

test('City EONBOT offers a one-tap current-step draft without auto-sending', () => {
  assert.match(chat, /data-eon-city-chat-help-current>Help with current step/);
  assert.match(chat, /textarea\.value = worldContext\.nextAction/);
  assert.match(chat, /Current-step context added to your draft\. Review or edit it, then press Send\./);
  assert.doesNotMatch(chat, /data-eon-city-chat-help-current[^\n]*type="submit"/);
});

test('current-step helper uses bounded world context and still requires explicit Send', () => {
  assert.match(chat, /Help me with this current \$\{worldContext\.worldLabel\} step: \$\{worldContext\.nextAction\}/);
  assert.match(chat, /form\?\.addEventListener\('submit', onSubmit\)/);
  assert.match(chat, /no provider call starts until you press Send/);
});

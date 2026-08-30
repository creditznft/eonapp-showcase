import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('L95 City Quick EONBOT uses the same session thread as main EONBOT', () => {
  const source = read('assets/js/city/eon-city-eonbot-quick-work.js');
  assert.match(source, /resolveChatThread/);
  assert.match(source, /updateChatThreadMessages/);
  assert.match(source, /getChatThreadQuery/);
  assert.match(source, /same Local\/Connected AI setup and active session thread as EONBOT Chat/);
  assert.doesNotMatch(source, /This City conversation is memory-only/);
  assert.match(source, /onLeaveCity\?\.\(canonicalThread\?\.id \? getChatThreadQuery\(canonicalThread\.id\) : '\/'\)/);
});

test('L95 shared City EONBOT workspace persists into canonical chat threads', () => {
  const source = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  assert.match(source, /resolveCanonicalCityChatThread/);
  assert.match(source, /updateChatThreadMessages/);
  assert.match(source, /same active session thread used by the main EONBOT page/);
  assert.match(source, /link\.href = getChatThreadQuery\(canonicalThread\.id\)/);
  assert.doesNotMatch(source, /keeps only a short session transcript in memory/);
});

test('L95 City AI calls do not duplicate the current prompt inside history', () => {
  const source = read('assets/js/city/eon-city-eonbot-quick-work.js');
  assert.match(source, /const priorHistory = history\.slice\(-MAX_HISTORY_MESSAGES\)/);
  assert.match(source, /createAIReply\(\{[\s\S]*input: text,[\s\S]*history: priorHistory/);
});

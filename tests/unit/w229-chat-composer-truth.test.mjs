import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W229 makes the primary Chat route a direct persistent multiline composer', () => {
  const page = read('chat.html');
  const css = read('assets/css/eon-chat-first.css');
  assert.match(page, /<textarea\s+id="chat-input"[\s\S]*?maxlength="4000"[\s\S]*?rows="1"/);
  assert.match(page, /placeholder="Message EONBOT…"/);
  assert.doesNotMatch(page, /chat-feature-unlock-panel/);
  assert.doesNotMatch(page, /Usage & campaign status/);
  assert.doesNotMatch(page, /chat-starter-prompts/);
  assert.doesNotMatch(page, /chat-referral-cta-anchor/);
  assert.match(css, /\.chat-input-bar \{ position: relative;[\s\S]*?flex: 0 0 auto/);
  assert.match(css, /\.chat-input-field \{ min-height: 2\.7rem; max-height: 28dvh;[\s\S]*?resize: none/);
});

test('W229 gives Enter-to-send and Shift+Enter-to-compose without a campaign panel', () => {
  const chat = read('assets/js/chat-page.js');
  assert.match(chat, /function syncComposerHeight\(\)/);
  assert.match(chat, /event\.key === 'Enter' && !event\.shiftKey && !event\.isComposing/);
  assert.match(chat, /Message EONBOT…/);
  assert.doesNotMatch(chat, /function mountChatFeatureUnlockPanel/);
  assert.doesNotMatch(chat, /Qualified referral relationship noted/);
});

test('W229 sponsor copy requires server-authoritative completion and never grants from ordinary ad events', () => {
  const rewards = read('assets/js/access/rewards-status-page.js');
  assert.match(rewards, /qualifying server-validated completion adds exactly 1 Sponsor Key/i);
  assert.match(rewards, /never rewards ordinary impressions or clicks/i);
  assert.match(rewards, /Reward issuance is server-authoritative and duplicate\/replay protected/i);
  assert.doesNotMatch(rewards, /localStorage\.setItem|sessionStorage\.setItem|grantSponsorKey|mintSponsorKey/i);
  assert.doesNotMatch(rewards, /queue a qualified referral-tree relationship/i);
});

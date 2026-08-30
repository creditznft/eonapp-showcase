import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  createNewChatThread,
  listChatThreads,
  MAX_PINNED_CHAT_THREADS,
  setChatThreadPinned
} from '../../assets/js/utils/chat-threads.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function memoryStorage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); }
  };
}

test('W381 keeps chat pins local and limits them to a small, intentional set', () => {
  const storage = memoryStorage();
  const threads = Array.from({ length: MAX_PINNED_CHAT_THREADS + 1 }, (_, index) => createNewChatThread({
    title: `Local thread ${index + 1}`,
    id: `w381_${index + 1}`,
    now: 1000 + index,
    storage
  }));
  for (const thread of threads.slice(0, MAX_PINNED_CHAT_THREADS)) {
    const result = setChatThreadPinned(thread.id, true, { storage, now: 2000 });
    assert.equal(result.ok, true);
    assert.equal(result.thread?.pinned, true);
  }
  const blocked = setChatThreadPinned(threads.at(-1).id, true, { storage, now: 3000 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'pin-limit');
  assert.equal(listChatThreads({ storage }).filter((thread) => thread.pinned).length, MAX_PINNED_CHAT_THREADS);
});

test('W381 exposes guest resources, account controls and a compact profile menu', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const identity = read('assets/js/account/eon-identity-onboarding.js');
  assert.match(shell, /Plans &amp; future pricing/);
  assert.match(shell, /Install EONAPP/);
  assert.match(shell, /Help &amp; support/);
  assert.match(shell, /data-eon-shell-profile-trigger/);
  assert.match(shell, /data-eon-shell-profile-menu/);
  assert.match(shell, /setChatThreadPinned/);
  assert.match(identity, /'\/'/);
});

test('W381 keeps the canonical chat share entry truthful while retaining a compact fallback share surface', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const share = read('assets/js/utils/eon-share-sheet.js');
  const home = read('assets/js/eonbot-home.js');
  assert.match(shell, /data-eon-header-share/);
  assert.match(shell, /openEonShareSheet/);
  assert.match(share, /export async function openEonSharePopover/);
  assert.match(share, /Invite & Share Center/);
  assert.match(share, /Create a share brief/);
  assert.match(share, /No click tracking, referral reward, payout, commission or automatic posting is active/);
  assert.match(share, /destination: '\/'/);
  assert.doesNotMatch(share, /label: 'AI Cockpit invite'/);
  assert.match(home, /eon:composer-prompt/);
});

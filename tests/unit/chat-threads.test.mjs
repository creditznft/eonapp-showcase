import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_CHAT_THREAD_STORAGE_KEY,
  CHAT_THREADS_STORAGE_KEY,
  LEGACY_CHAT_SESSION_STORAGE_KEY,
  createNewChatThread,
  deleteChatThread,
  deriveChatThreadTitle,
  getActiveChatThread,
  getChatThreadQuery,
  listChatThreads,
  renameChatThread,
  resolveChatThread,
  updateChatThreadMessages
} from '../../assets/js/utils/chat-threads.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  get length() { return Object.keys(this.data).length; }
  key(index) { return Object.keys(this.data)[index] || null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

test('W218 migrates the earlier local session into a local-only named chat thread', () => {
  const storage = new MemoryStorage();
  const sessionStorage = new MemoryStorage({
    [LEGACY_CHAT_SESSION_STORAGE_KEY]: JSON.stringify([
      { role: 'user', text: 'Plan a calm local AI setup.' },
      { role: 'bot', text: 'Start with device readiness.' }
    ])
  });
  const result = resolveChatThread({ storage, sessionStorage, now: 1_700_000_000_000 });
  assert.equal(result.created, true);
  assert.equal(result.migrated, true);
  assert.match(result.thread.title, /Plan a calm local AI setup/);
  assert.equal(listChatThreads({ storage }).length, 1);
  assert.equal(getActiveChatThread({ storage })?.id, result.thread.id);
  assert.equal(storage.getItem(ACTIVE_CHAT_THREAD_STORAGE_KEY), result.thread.id);
  assert.match(storage.getItem(CHAT_THREADS_STORAGE_KEY), /eon\.chat\.threads\.v1/);
});

test('W218 keeps a manual title while saving and restores the active thread through the safe query format', () => {
  const storage = new MemoryStorage();
  const thread = createNewChatThread({ storage, now: 1_700_000_000_000, id: 'alpha' });
  const updated = updateChatThreadMessages(thread.id, [
    { role: 'user', text: 'Build a release checklist for my project.' },
    { role: 'bot', text: 'I will start with the route contract.' }
  ], { storage, now: 1_700_000_000_100 });
  assert.match(updated.title, /Build a release checklist/);
  assert.equal(renameChatThread(thread.id, 'Release work', { storage, now: 1_700_000_000_200 })?.title, 'Release work');
  const saved = updateChatThreadMessages(thread.id, [{ role: 'user', text: 'Another normal message.' }], { storage, now: 1_700_000_000_300 });
  assert.equal(saved.title, 'Release work');
  assert.equal(getChatThreadQuery(thread.id), `/chat?thread=${encodeURIComponent(thread.id)}`);
  const restored = resolveChatThread({ storage, search: `?thread=${encodeURIComponent(thread.id)}`, now: 1_700_000_000_400 });
  assert.equal(restored.thread.id, thread.id);
  assert.equal(restored.thread.title, 'Release work');
});

test('W218 chat threads are local records that can be deleted without touching another thread', () => {
  const storage = new MemoryStorage();
  const first = createNewChatThread({ storage, now: 1_700_000_000_000, id: 'first' });
  const second = createNewChatThread({ storage, now: 1_700_000_000_100, id: 'second' });
  const result = deleteChatThread(second.id, { storage, now: 1_700_000_000_200 });
  assert.equal(result.deleted, true);
  assert.equal(listChatThreads({ storage }).length, 1);
  assert.equal(listChatThreads({ storage })[0].id, first.id);
  assert.equal(getActiveChatThread({ storage })?.id, first.id);
  assert.equal(deriveChatThreadTitle([], 'New chat'), 'New chat');
});

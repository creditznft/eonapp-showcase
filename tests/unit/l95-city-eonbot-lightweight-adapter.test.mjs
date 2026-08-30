import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const registry = await readFile(new URL('../../assets/js/contracts/work-surface/eon-work-surface-registry.js', import.meta.url), 'utf8');
const host = await readFile(new URL('../../assets/js/work-surface/eon-work-surface-host.js', import.meta.url), 'utf8');
const chat = await readFile(new URL('../../assets/js/work-surface/adapters/eon-chat-panel.js', import.meta.url), 'utf8');

test('L95 City EONBOT chat uses a dedicated lightweight adapter instead of the generic Creator-heavy productivity adapter', () => {
  assert.match(registry, /const CHAT_ADAPTER = '\/assets\/js\/work-surface\/adapters\/eon-chat-panel\.js'/);
  assert.match(registry, /chat: entry\(\{[\s\S]*adapter: CHAT_ADAPTER/);
  assert.match(host, /eon-chat-panel\.js': \(\) => import\('\.\/adapters\/eon-chat-panel\.js'\)/);
  assert.doesNotMatch(chat, /creator-unified-workspace|eon-music-studio|comfyui-image-lab|comfyui-video-lab|direct-byok-workspace/);
});

test('L95 lightweight City EONBOT keeps canonical thread continuity and the real AI runtime', () => {
  assert.match(chat, /resolveChatThread/);
  assert.match(chat, /updateChatThreadMessages/);
  assert.match(chat, /getChatThreadQuery/);
  assert.match(chat, /createAIReply/);
  assert.match(chat, /buildEonbotCommandHubPlan/);
  assert.match(chat, /same session thread as main EONBOT/);
});

test('L95 City EONBOT remains explicit-send and never auto-opens a prepared action', () => {
  assert.match(chat, /type="submit">Send/);
  assert.match(chat, /no provider call starts until you press Send/);
  assert.match(chat, /Nothing was opened, spent or published automatically/);
});


test('L95 lightweight City EONBOT adapter imports through its real runtime dependency graph', async () => {
  const module = await import('../../assets/js/work-surface/adapters/eon-chat-panel.js');
  assert.equal(typeof module.mountEonWorkSurface, 'function');
});

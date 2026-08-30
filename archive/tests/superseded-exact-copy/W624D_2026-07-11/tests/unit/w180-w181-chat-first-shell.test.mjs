import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { HOME_REDIRECT, PRIMARY_APP_ROUTES, renderCloudflareRedirects } from '../../config/route-contract.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W380 ships a compact reusable app shell and intentional app destinations', () => {
  assert.equal(existsSync(new URL('../../assets/js/eon-app-shell.js', import.meta.url)), true);
  assert.equal(existsSync(new URL('../../assets/css/eon-app-shell.css', import.meta.url)), true);
  const shell = read('assets/js/eon-app-shell.js');
  const navigation = read('assets/js/shell/eon-shell-navigation.js');
  assert.match(shell, /from '\.\/shell\/eon-shell-navigation\.js'/);
  assert.match(shell, /renderEonShellNavigationMarkup/);
  assert.match(navigation, /label: 'Workspace'/);
  assert.match(navigation, /label: 'Utilities'/);
  assert.match(navigation, /label: 'EONBOT'/);
  assert.match(navigation, /label: 'Projects'/);
  assert.match(navigation, /label: 'Library'/);
  assert.match(navigation, /label: 'Forge'/);
  assert.match(navigation, /label: 'EON City'/);
  assert.match(navigation, /label: 'Vault'/);
  assert.match(navigation, /label: 'Search local chats'/);
  assert.match(navigation, /label: 'More'/);
  assert.doesNotMatch(navigation, /label: 'Chats'|label: 'Apps'/);
  assert.match(shell, /data-eon-sidebar-collapse/);
  assert.match(shell, /data-eon-chat-history/);
  assert.match(shell, /data-eon-shell-search/);

  for (const page of ['index.html', 'chat.html', 'workspace.html', 'projects.html', 'library.html', 'market.html', 'vault.html', 'trade.html', 'eoncity.html', 'eoncity-lite.html', 'realm-studio.html']) {
    assert.match(read(page), /data-eon-app-shell="1"/);
  }
  const city = read('eoncity.html');
  assert.match(city, /data-eon-city-direct-entry/);
  assert.match(city, /Checking City access/);
  assert.match(city, /eon-city-access-station\.js/);
  assert.match(city, /eon-app-shell\.js/);
  assert.doesNotMatch(city, /<script[^>]+eon-city-play-station\.js|eon-city-portal\.js/);
});

test('W380 makes root the PWA and public chat entry while preserving truthful setup boundaries', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, '/?source=pwa');
  assert.equal(manifest.shortcuts.some((item) => item.name === 'New Chat'), true);

  const home = read('index.html');
  const runtime = read('assets/js/chat-page.js');
  assert.match(home, /What would you like to make\?/);
  assert.match(home, /data-eonbot-home-open-setup/);
  assert.match(home, /Guest mode/);
  assert.match(home, /eonbot-home\.css/);
  const chatSessionState = read('assets/js/chat/chat-page-session-state.js');
  assert.match(runtime, /chat-page-session-state/);
  assert.match(chatSessionState, /CHAT_DAILY_FREE_GUIDE_LIMIT = 100/);
  assert.match(runtime, /install local AI or connect your own provider/);
  assert.doesNotMatch(runtime, /Basic guide replies are free every day\. Use a verified rewarded ad/);
});

test('W380 makes root the canonical chat document and keeps the generated redirects synchronized', () => {
  assert.deepEqual(HOME_REDIRECT, { id: 'home', from: '/', to: '/index.html', status: 200, lifecycle: 'live' });
  const redirects = read('_redirects');
  assert.equal(redirects, renderCloudflareRedirects());
  assert.match(redirects, /^\/chat \/ 301$/m);
  for (const route of ['/', '/projects', '/library', '/workspace', '/forge', '/eoncity', '/market', '/insights', '/automations', '/profile', '/vault', '/local-ai', '/realm-studio']) {
    assert.equal(PRIMARY_APP_ROUTES.some((entry) => entry.from === route && entry.status === 200), true, `${route} is canonical`);
  }
});

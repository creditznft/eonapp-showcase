import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manager = fs.readFileSync(new URL('../../assets/js/eon-pwa-manager.js', import.meta.url), 'utf8');

test('Launch95 keeps the browser install prompt deferred until an explicit active user gesture', () => {
  assert.match(manager, /window\.addEventListener\('beforeinstallprompt', \(event\) => \{/);
  assert.match(manager, /event\.preventDefault\(\);\s*deferredInstallPrompt = event;/s);
  assert.match(manager, /if \(explicitUserAction !== true\) return \{ ok: false, reason: 'explicit-user-action-required'/);
  assert.match(manager, /if \(userActivation && userActivation\.isActive === false\) return \{ ok: false, reason: 'active-user-gesture-required'/);
  assert.match(manager, /const promptEvent = deferredInstallPrompt;\s*deferredInstallPrompt = null;\s*deferredInstallPromptCapturedAt = 0;/s);
  assert.match(manager, /await promptEvent\.prompt\(\);\s*const choice = await promptEvent\.userChoice;/s);
});

test('Launch95 does not auto-prompt from beforeinstallprompt capture', () => {
  const listenerStart = manager.indexOf("window.addEventListener('beforeinstallprompt'");
  const listenerEnd = manager.indexOf("window.addEventListener('appinstalled'", listenerStart);
  assert.ok(listenerStart >= 0 && listenerEnd > listenerStart);
  const listener = manager.slice(listenerStart, listenerEnd);
  assert.doesNotMatch(listener, /\.prompt\(/);
});

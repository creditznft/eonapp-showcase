import test from 'node:test';
import assert from 'node:assert/strict';

function installBrowserHarness() {
  const listeners = new Map();
  const storage = new Map();
  const windowRef = {
    location: { search: '' },
    navigator: { standalone: false },
    matchMedia: () => ({ matches: false }),
    addEventListener(type, listener) { listeners.set(type, listener); },
    dispatchEvent() { return true; }
  };
  const localStorage = {
    get length() { return storage.size; },
    key(index) { return [...storage.keys()][index] ?? null; },
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(String(key), String(value)); }
  };
  const navigatorRef = { userAgent: 'Node test', userActivation: { isActive: true } };
  const prior = {
    window: globalThis.window,
    navigator: globalThis.navigator,
    localStorage: globalThis.localStorage,
    CustomEvent: globalThis.CustomEvent
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: windowRef });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true, value: navigatorRef });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: localStorage });
  Object.defineProperty(globalThis, 'CustomEvent', { configurable: true, writable: true, value: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } } });
  return {
    listeners,
    navigatorRef,
    restore() {
      for (const [key, value] of Object.entries(prior)) {
        if (value === undefined) delete globalThis[key];
        else Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
      }
    }
  };
}

async function loadManager(label) {
  return import(`../../assets/js/eon-pwa-manager.js?w766ir2h=${label}-${Date.now()}-${Math.random()}`);
}

test('W766IR2-H consumes each install prompt once and requires an active explicit gesture', async () => {
  const harness = installBrowserHarness();
  try {
    const manager = await loadManager('single-use');
    manager.initEonPwaManager();
    let promptCalls = 0;
    const event = {
      preventDefault() {},
      async prompt() { promptCalls += 1; },
      userChoice: Promise.resolve({ outcome: 'dismissed' })
    };
    harness.listeners.get('beforeinstallprompt')(event);

    assert.equal((await manager.requestEonPwaInstall()).reason, 'explicit-user-action-required');
    harness.navigatorRef.userActivation.isActive = false;
    assert.equal((await manager.requestEonPwaInstall({ explicitUserAction: true })).reason, 'active-user-gesture-required');
    harness.navigatorRef.userActivation.isActive = true;

    const first = await manager.requestEonPwaInstall({ explicitUserAction: true });
    assert.deepEqual(first, { ok: false, outcome: 'dismissed' });
    assert.equal(promptCalls, 1);
    assert.equal(manager.getEonPwaState().installAvailable, false);

    const repeated = await manager.requestEonPwaInstall({ explicitUserAction: true });
    assert.equal(repeated.reason, 'install-not-available');
    assert.equal(promptCalls, 1);
  } finally {
    harness.restore();
  }
});

test('W766IR2-H clears a rejected browser prompt instead of retrying the stale event', async () => {
  const harness = installBrowserHarness();
  try {
    const manager = await loadManager('rejected');
    manager.initEonPwaManager();
    let promptCalls = 0;
    harness.listeners.get('beforeinstallprompt')({
      preventDefault() {},
      async prompt() { promptCalls += 1; throw new Error('already used'); },
      userChoice: Promise.resolve({ outcome: 'dismissed' })
    });

    const failed = await manager.requestEonPwaInstall({ explicitUserAction: true });
    assert.equal(failed.reason, 'install-prompt-failed');
    assert.equal(promptCalls, 1);
    assert.equal(manager.getEonPwaState().installAvailable, false);

    const repeated = await manager.requestEonPwaInstall({ explicitUserAction: true });
    assert.equal(repeated.reason, 'install-not-available');
    assert.equal(promptCalls, 1);
  } finally {
    harness.restore();
  }
});

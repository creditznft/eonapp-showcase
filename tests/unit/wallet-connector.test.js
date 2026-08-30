'use strict';
/**
 * Unit tests for assets/js/utils/wallet-connector.js
 * Tests detectWallets() and connectProvider() in isolation using Node vm.
 * The ESM export keywords are stripped before running in vm context.
 */
const vm     = require('node:vm');
const fs     = require('node:fs');
const path   = require('node:path');
const test   = require('node:test');
const assert = require('node:assert/strict');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Load wallet-connector.js into a vm context with a custom window/document env.
 * Strips ES module `export` syntax so the file runs as a plain script.
 */
function loadConnector(windowOverrides = {}) {
  let src = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'wallet-connector.js'),
    'utf8'
  );

  // Strip ESM export keywords — preserve async qualifier
  src = src
    .replace(/^export\s+async\s+function\s+/gm, 'async function ')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+\{[^}]+\};\s*$/gm, '');

  const domElements = [];

  const document = {
    getElementById: (id) => domElements.find(el => el.id === id) ?? null,
    createElement: (tag) => {
      const el = {
        tag, id: '', className: '', textContent: '', href: '',
        style: {}, hidden: false, disabled: false,
        children: [], listeners: {},
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k] ?? null; },
        append(...nodes) { this.children.push(...nodes); },
        appendChild(node) { this.children.push(node); return node; },
        remove() {
          const idx = domElements.indexOf(this);
          if (idx >= 0) domElements.splice(idx, 1);
        },
        querySelector(sel) {
          // simple data-wc-id selector
          const m = sel.match(/\[data-wc-id="([^"]+)"\]/);
          if (m) return this.children.find(c => c['data-wc-id'] === m[1]) ?? null;
          // class selector
          const cm = sel.match(/\.([a-z-]+)$/);
          if (cm) return this.children.find(c => (c.className || '').includes(cm[1])) ?? null;
          return null;
        },
        addEventListener(type, fn) {
          if (!this.listeners[type]) this.listeners[type] = [];
          this.listeners[type].push(fn);
        },
        _trigger(type, event = {}) {
          (this.listeners[type] || []).forEach(fn => fn(event));
        }
      };
      domElements.push(el);
      return el;
    },
    head: { appendChild() {} },
    body: {
      children: [],
      appendChild(el) { this.children.push(el); return el; },
      removeChild(el) {
        const idx = this.children.indexOf(el);
        if (idx >= 0) this.children.splice(idx, 1);
      }
    },
    addEventListener() {},
    dispatchEvent() {}
  };

  const window = {
    ethereum: null,
    coinbaseWalletExtension: null,
    EonWallet: null,
    ...windowOverrides,
  };

  const ctx = vm.createContext({
    window, document,
    setTimeout: (fn, ms) => { void ms; setTimeout(fn, 0); },
    clearTimeout, console,
  });

  vm.runInContext(src, ctx);

  return {
    detectWallets: ctx.detectWallets,
    connectProvider: ctx.connectProvider,
    showWalletModal: ctx.showWalletModal,
    window: ctx.window,
    document: ctx.document,
    domElements,
  };
}

// ─── detectWallets ───────────────────────────────────────────────────────────

test('detectWallets returns empty array when window.ethereum is null', () => {
  const { detectWallets } = loadConnector({ ethereum: null });
  assert.equal(detectWallets().length, 0);
});

test('detectWallets returns empty array when window.ethereum is undefined', () => {
  const { detectWallets } = loadConnector({ ethereum: undefined });
  assert.equal(detectWallets().length, 0);
});

test('detectWallets detects MetaMask provider', () => {
  const provider = { isMetaMask: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  const results = detectWallets();
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'metamask');
  assert.equal(results[0].name, 'MetaMask');
  assert.equal(results[0].icon, '🦊');
  assert.ok(results[0].provider !== null, 'provider reference is set');
});

test('detectWallets detects Brave Wallet (takes priority over MetaMask flag)', () => {
  // Brave overrides MetaMask flag
  const provider = { isBraveWallet: true, isMetaMask: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  const results = detectWallets();
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'brave');
  assert.equal(results[0].name, 'Brave Wallet');
});

test('detectWallets detects Coinbase Wallet provider', () => {
  const provider = { isCoinbaseWallet: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  const results = detectWallets();
  assert.equal(results[0].id, 'coinbase');
  assert.equal(results[0].name, 'Coinbase Wallet');
});

test('detectWallets detects Coinbase via isCoinbaseBrowser flag', () => {
  const provider = { isCoinbaseBrowser: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'coinbase');
});

test('detectWallets detects Rainbow wallet', () => {
  const provider = { isRainbow: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'rainbow');
  assert.equal(detectWallets()[0].icon, '🌈');
});

test('detectWallets detects Trust Wallet via isTrust flag', () => {
  const provider = { isTrust: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'trust');
});

test('detectWallets detects Trust Wallet via isTrustWallet flag', () => {
  const provider = { isTrustWallet: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'trust');
});

test('detectWallets detects OKX Wallet via isOKExWallet flag', () => {
  const provider = { isOKExWallet: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'okx');
  assert.equal(detectWallets()[0].name, 'OKX Wallet');
});

test('detectWallets detects OKX Wallet via isOKX flag', () => {
  const provider = { isOKX: true, request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets()[0].id, 'okx');
});

test('detectWallets detects generic injected wallet (has request, no specific flags)', () => {
  const provider = { request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider });
  const results = detectWallets();
  assert.equal(results[0].id, 'injected');
  assert.equal(results[0].name, 'Browser Wallet');
  assert.equal(results[0].icon, '💼');
});

test('detectWallets skips provider with no request function and no flags', () => {
  const provider = {}; // no request, no flags
  const { detectWallets } = loadConnector({ ethereum: provider });
  assert.equal(detectWallets().length, 0);
});

test('detectWallets handles EIP-5749 multiple providers', () => {
  const p1 = { isMetaMask: true, request: async () => {} };
  const p2 = { isCoinbaseWallet: true, request: async () => {} };
  const ethereum = { providers: [p1, p2], request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum });
  const results = detectWallets();
  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'metamask');
  assert.equal(results[1].id, 'coinbase');
});

test('detectWallets deduplicates same provider id across EIP-5749 list', () => {
  const p1 = { isMetaMask: true, request: async () => {} };
  const p2 = { isMetaMask: true, request: async () => {} }; // duplicate
  const ethereum = { providers: [p1, p2], request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum });
  const results = detectWallets();
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'metamask');
});

test('detectWallets detects coinbaseWalletExtension separately when not in ethereum.providers', () => {
  const mainProvider = { isMetaMask: true, request: async () => {} };
  const cbExt = { request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: mainProvider, coinbaseWalletExtension: cbExt });
  const results = detectWallets();
  assert.equal(results.length, 2);
  assert.ok(results.some(r => r.id === 'metamask'));
  assert.ok(results.some(r => r.id === 'coinbase'));
});

test('detectWallets does not add coinbaseWalletExtension when coinbase already found in providers', () => {
  const provider = { isCoinbaseWallet: true, request: async () => {} };
  const cbExt = { request: async () => {} };
  const { detectWallets } = loadConnector({ ethereum: provider, coinbaseWalletExtension: cbExt });
  const results = detectWallets();
  // coinbase already detected via ethereum, extension is skipped
  assert.equal(results.filter(r => r.id === 'coinbase').length, 1);
});

// ─── connectProvider ─────────────────────────────────────────────────────────

test('connectProvider resolves with first account address', async () => {
  const provider = {
    request: async ({ method }) => {
      if (method === 'eth_requestAccounts') return ['0xABCDEF1234567890ABCDEF1234567890ABCDEf12'];
      if (method === 'wallet_switchEthereumChain') return null;
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  const address = await connectProvider(provider);
  assert.equal(address, '0xABCDEF1234567890ABCDEF1234567890ABCDEf12');
});

test('connectProvider throws when no accounts returned', async () => {
  const provider = {
    request: async ({ method }) => {
      if (method === 'eth_requestAccounts') return [];
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await assert.rejects(() => connectProvider(provider), /No accounts/);
});

test('connectProvider throws when accounts is null', async () => {
  const provider = {
    request: async ({ method }) => {
      if (method === 'eth_requestAccounts') return null;
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await assert.rejects(() => connectProvider(provider), /No accounts/);
});

test('connectProvider switches to Polygon mainnet (chainId 0x89)', async () => {
  const calls = [];
  const provider = {
    request: async ({ method, params }) => {
      calls.push({ method, params });
      if (method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
      if (method === 'wallet_switchEthereumChain') return null;
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await connectProvider(provider);
  const switchCall = calls.find(c => c.method === 'wallet_switchEthereumChain');
  assert.ok(switchCall, 'wallet_switchEthereumChain was called');
  assert.equal(switchCall.params[0].chainId, '0x89');
});

test('connectProvider adds Polygon chain when code 4902 (chain not found)', async () => {
  const calls = [];
  const provider = {
    request: async ({ method, params }) => {
      calls.push({ method, params });
      if (method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
      if (method === 'wallet_switchEthereumChain') {
        const err = new Error('Unrecognized chain'); err.code = 4902; throw err;
      }
      if (method === 'wallet_addEthereumChain') return null;
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  const address = await connectProvider(provider);
  assert.equal(address, '0x1234567890123456789012345678901234567890');
  const addCall = calls.find(c => c.method === 'wallet_addEthereumChain');
  assert.ok(addCall, 'wallet_addEthereumChain was called');
  assert.equal(addCall.params[0].chainId, '0x89');
  assert.equal(addCall.params[0].chainName, 'Polygon');
});

test('connectProvider adds Polygon chain when code -32603', async () => {
  const calls = [];
  const provider = {
    request: async ({ method }) => {
      calls.push({ method });
      if (method === 'eth_requestAccounts') return ['0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'];
      if (method === 'wallet_switchEthereumChain') {
        const err = new Error('Internal error'); err.code = -32603; throw err;
      }
      if (method === 'wallet_addEthereumChain') return null;
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await connectProvider(provider);
  assert.ok(calls.some(c => c.method === 'wallet_addEthereumChain'));
});

test('connectProvider propagates chain switch error with non-4902 code', async () => {
  const provider = {
    request: async ({ method }) => {
      if (method === 'eth_requestAccounts') return ['0x1111111111111111111111111111111111111111'];
      if (method === 'wallet_switchEthereumChain') {
        const err = new Error('User rejected'); err.code = 4001; throw err;
      }
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await assert.rejects(() => connectProvider(provider), /User rejected/);
});

test('connectProvider wallet_addEthereumChain includes correct RPC URLs and explorer', async () => {
  const addCalls = [];
  const provider = {
    request: async ({ method, params }) => {
      if (method === 'eth_requestAccounts') return ['0x2222222222222222222222222222222222222222'];
      if (method === 'wallet_switchEthereumChain') {
        const err = new Error('chain not found'); err.code = 4902; throw err;
      }
      if (method === 'wallet_addEthereumChain') { addCalls.push(params[0]); return null; }
      return null;
    }
  };
  const { connectProvider } = loadConnector({ ethereum: provider });
  await connectProvider(provider);
  assert.equal(addCalls.length, 1);
  const chain = addCalls[0];
  assert.ok(chain.rpcUrls.includes('https://polygon-rpc.com'), 'primary RPC present');
  assert.ok(chain.blockExplorerUrls.includes('https://polygonscan.com'), 'explorer present');
  assert.equal(chain.nativeCurrency.symbol, 'POL');
  assert.equal(chain.nativeCurrency.decimals, 18);
});

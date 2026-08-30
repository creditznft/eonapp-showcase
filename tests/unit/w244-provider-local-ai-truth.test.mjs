import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const read = (relative) => fs.readFileSync(path.resolve(relative), 'utf8');
const activeRouteFiles = [
  'workspace.html',
  'assets/js/eon-app-shell.js',
  'assets/js/eon-workspace-pages.js',
  'vault.html',
  'assets/js/chat/ai-runtime.js',
  'assets/js/chat-page.js',
  'assets/js/utils/ai-readiness.js',
  'assets/js/vault/eon-vault-page.js'
];

const retiredSetupDestination = /\/(?:onboarding\.html|get-free-ai-power\.html|vault-api-keys\.html)\b/;

test('W244 requires explicit local runtime probing and fresh provider verification', () => {
  const runtime = read('assets/js/chat/ai-runtime.js');
  const catalog = read('assets/js/chat/ai-provider-catalog.js');
  const router = read('assets/js/utils/eon-auto-router.js');
  assert.match(runtime, /import\s+\{\s*shouldProbeLocalRuntimes\s*\}/, 'Local runtime policy import is missing.');
  assert.match(runtime, /export\s+async\s+function\s+detectLocalProviders\(/, 'Local provider detection export is missing.');
  assert.match(runtime, /if\s*\(!shouldProbeLocalRuntimes\(\{\s*force\s*\}\)\)/, 'Local provider detection can probe without policy approval.');
  assert.match(runtime, /export\s+function\s+getProviderVerification\(/, 'Provider verification evidence function is missing.');
  assert.match(runtime, /verified-model-list/, 'Hosted readiness must require a current model-list verification.');
  assert.match(runtime, /local-self-test-required/, 'Local readiness must require a completed device self-test.');
  assert.match(runtime, /assertProviderVerifiedForRequest/, 'Model requests are not guarded by verification evidence.');

  const resolverStart = runtime.indexOf('function resolveModelPolicyCompat');
  const resolverEnd = runtime.indexOf('\nfunction trimHistory', resolverStart);
  const resolver = runtime.slice(resolverStart, resolverEnd > resolverStart ? resolverEnd : resolverStart + 5000);
  assert.ok(resolverStart >= 0, 'Evidence-aware compatibility resolver is missing.');
  assert.match(resolver, /getProviderVerification/, 'Compatibility routing must use current verification evidence.');
  assert.doesNotMatch(resolver, /getApiKey\(/, 'Compatibility routing must not treat a stored key as readiness evidence.');
  assert.match(resolver, /return guidePlan\('verification-required'\)/, 'Compatibility routing must fail closed to Guide Mode.');

  assert.match(runtime, /ai-provider-catalog/, 'Runtime must consume the dedicated provider catalog.');
  const hostedDefaults = catalog.match(/id:\s*'(?:groq|gemini|cerebras|mistral|deepseek|perplexity|together|cohere|nvidia|sambanova|fireworks|huggingface|openai|openrouter|xai|qwen|anthropic)'[\s\S]{0,700}?defaultModel:\s*'([^']*)'/g) || [];
  assert.ok(hostedDefaults.length >= 10, 'Expected hosted provider registry rows were not found.');
  for (const row of hostedDefaults) assert.match(row, /defaultModel:\s*''/, `Hosted registry retains an operative hard-coded model: ${row}`);
  assert.doesNotMatch(catalog, /badge:\s*'(?:⚡ Free|💳 Paid)'/, 'Provider catalog must not make static price/tier claims.');
  assert.doesNotMatch(catalog, /signupUrl:/, 'Provider catalog must not direct users to stale signup destinations.');
  assert.match(router, /getProviderVerification/, 'Auto router must receive provider verification evidence.');
  assert.doesNotMatch(router, /routeType === 'free'|routeType === 'premium'/, 'Auto router must not rank providers by static price labels.');
});

test('W244 keeps raw provider-key entry in Vault and replaces retired setup destinations', () => {
  const vault = read('vault.html');
  const vaultRuntime = read('assets/js/vault/eon-vault-page.js');
  const shell = read('assets/js/eon-app-shell.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  assert.match(vault, /<input[^>]*id="eon-vault-provider-key"[^>]*type="password"/, 'Vault provider key field must be password-protected.');
  assert.match(vault, /id="provider-check"/, 'Vault provider verification anchor is missing.');
  assert.match(vaultRuntime, /verifyProviderReadiness\(/, 'Vault must run a user-triggered provider verification.');
  assert.match(vaultRuntime, /ApiKeyVault\.store\(/, 'Vault must keep optional encrypted key persistence local to the device.');
  assert.doesNotMatch(vaultRuntime, /textContent\s*=\s*.*(?:apiKey|providerKey|keyInput)/i, 'Vault must not render a raw provider key.');

  for (const relative of activeRouteFiles) {
    assert.doesNotMatch(read(relative), retiredSetupDestination, `${relative} still points to a retired provider/setup page.`);
  }
  assert.match(shell, /href="\/local-ai(?:#eonbot-local-ai-setup)?"/, 'Current app shell must expose canonical Local AI setup in the compact More menu.');
  assert.match(workspace, /\/local-ai/, 'Workspace must route local setup to Local AI.');
  assert.match(read('assets/js/chat-page.js'), /window\.location\.assign\('\/vault#provider-check'\)/, 'Chat must route hosted setup to Vault verification.');
  const retainedRuntimeSources = [shell, workspace, read('assets/js/chat-page.js')].join('\n');
  assert.doesNotMatch(retainedRuntimeSources, /import\([^\n]*eon-chat-widget|from ['"][^'"]*eon-chat-widget/, 'Current runtime paths may not load the retired floating EONBOT widget.');
  assert.doesNotMatch(read('assets/js/utils/onboarding-reminder.js'), /get-free-ai-power\.html/, 'Active Vault reminder must use the canonical Local AI route.');
});

test('W244 sends Local AI setup to its dedicated explicit flow without Chat probing or auto-selection', () => {
  const chat = read('assets/js/chat-page.js');
  assert.match(chat, /window\.location\.assign\('\/local-ai#eonbot-local-ai-setup'\)/, 'Chat must direct local setup to the Local AI flow.');
  assert.doesNotMatch(chat, /async function detectAndApplyLocalRuntimes/, 'Chat must not retain a competing local-runtime probe path.');
  assert.doesNotMatch(chat, /detectLocalProviders/, 'Chat must not probe local runtimes outside the dedicated Local AI flow.');
  assert.match(chat, /if \(preset\.serverManaged === true\) \{[\s\S]*?verifyProviderReadiness\(providerId, '',/, 'Only the server-managed sponsored route may perform same-origin readiness verification without a BYOK key.');
  assert.match(chat, /window\.location\.assign\('\/vault#provider-check'\)/, 'Chat must send hosted provider checks to Vault.');
});

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

test('W244 never performs a loopback scan from a public origin without user intent', async () => {
  const previous = {
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    location: globalThis.location,
    window: globalThis.window,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
    customEvent: globalThis.CustomEvent
  };
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const location = { origin: 'https://eonapp.ch', hostname: 'eonapp.ch' };
  const CustomEvent = class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
  let fetchCalls = 0;
  try {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorage, configurable: true });
    Object.defineProperty(globalThis, 'location', { value: location, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: { webdriver: false }, configurable: true });
    Object.defineProperty(globalThis, 'window', { value: { location, navigator: globalThis.navigator, dispatchEvent() {}, CustomEvent }, configurable: true });
    Object.defineProperty(globalThis, 'CustomEvent', { value: CustomEvent, configurable: true });
    Object.defineProperty(globalThis, 'fetch', { value: async () => { fetchCalls += 1; throw new Error('unexpected loopback probe'); }, configurable: true });
    const runtime = await import(new URL('../../assets/js/chat/ai-runtime.js?w244-local-probe', import.meta.url).href);
    const result = await runtime.detectLocalProviders();
    assert.equal(fetchCalls, 0);
    assert.ok(result.every((row) => row.reason === 'user-action-required'));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      const target = key === 'customEvent' ? 'CustomEvent' : key;
      if (typeof value === 'undefined') delete globalThis[target];
      else Object.defineProperty(globalThis, target, { value, configurable: true });
    }
  }
});

test('W244 auto routing selects only a currently verified provider or Local AI self-test', async () => {
  const { buildAutoRoutePlan } = await import(new URL('../../assets/js/utils/eon-auto-router.js?w244-route-proof', import.meta.url).href);
  const providers = {
    guide: { id: 'guide', label: 'Guide only', enabled: true },
    ollama: { id: 'ollama', label: 'Ollama (local)', enabled: true },
    sample: { id: 'sample', label: 'Sample hosted', enabled: true, requiresApiKey: true, modelsUrl: 'https://example.invalid/models' }
  };
  const settings = { assistantMode: 'auto', runtimePreference: 'provider-connected', provider: 'sample', mode: 'hybrid' };
  const savedKeyOnly = buildAutoRoutePlan({
    input: 'help me write code',
    settings,
    providers,
    getApiKey: () => 'saved-key',
    getProviderVerification: () => ({ ready: false, state: 'verification-required' }),
    localProviders: [{ provider: 'ollama', available: true, models: ['llama'] }]
  });
  assert.equal(savedKeyOnly.provider, 'guide');
  assert.equal(savedKeyOnly.readyForRealAI, false);

  const verifiedHosted = buildAutoRoutePlan({
    input: 'help me write code',
    settings,
    providers,
    getApiKey: () => 'saved-key',
    getProviderVerification: (id) => id === 'sample'
      ? { ready: true, state: 'verified-model-list', model: 'current-model' }
      : { ready: false, state: 'verification-required' },
    localProviders: []
  });
  assert.equal(verifiedHosted.provider, 'sample');
  assert.equal(verifiedHosted.providerType, 'hosted');

  const verifiedLocal = buildAutoRoutePlan({
    input: 'help me write code',
    settings: { ...settings, runtimePreference: 'local-first', provider: 'ollama' },
    providers,
    getProviderVerification: (id) => id === 'ollama'
      ? { ready: true, state: 'local-self-test', model: 'llama' }
      : { ready: false, state: 'verification-required' },
    localProviders: [{ provider: 'ollama', available: true, models: ['llama'] }]
  });
  assert.equal(verifiedLocal.provider, 'ollama');
  assert.equal(verifiedLocal.providerType, 'local');
});

'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadEscapeHtml() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'escape.js'), 'utf8');
  const compat = source.replace(/^export\s+/m, '');
  return vm.runInNewContext(`${compat}; escapeHtml;`);
}

function loadProviderVisibility(deps = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'provider-visibility.js'), 'utf8');
  const compat = source
    .replace(/^import\s+\{\s*PROVIDERS,\s*loadAISettings(?:,\s*getApiKey)?\s*\}\s+from\s+'..\/chat\/ai-runtime\.js';/m, 'const { PROVIDERS, loadAISettings, getApiKey } = __testDeps;')
    .replace(/^import\s+\{\s*escapeHtml\s*\}\s+from\s+'\.\/escape\.js';/m, 'const { escapeHtml } = __testDeps;')
    .replace(/^import\s+\{\s*getAIReadiness\s*\}\s+from\s+'\.\/ai-readiness\.js';/m, 'const { getAIReadiness } = __testDeps;')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+const\s+/gm, 'var ');

  const ctx = vm.createContext({
    __testDeps: deps,
    window: { addEventListener() {} },
    document: { getElementById() { return null; } },
  });

  vm.runInContext(compat, ctx);
  return ctx;
}

test('createProviderStatusHTML escapes model and endpoint text', () => {
  const escapeHtml = loadEscapeHtml();
  const ctx = loadProviderVisibility({
    escapeHtml,
    PROVIDERS: {
      openai: {
        label: 'OpenAI',
        defaultModel: '',
        badge: 'cloud',
        free: false,
        requiresApiKey: false,
        defaultEndpoint: 'https://api.openai.com/v1'
      },
      guide: {
        label: 'Guide',
        defaultModel: '',
        badge: 'guide',
        free: true,
        requiresApiKey: false,
        defaultEndpoint: ''
      }
    },
    loadAISettings: () => ({
      provider: 'openai',
      model: '<img src=x onerror=alert(1)>',
      mode: 'chat',
      endpoint: 'https://example.com/<img src=x onerror=1>'
    }),
    getApiKey: () => 'sk-test',
    getAIReadiness: () => ({
      ready: true,
      detail: 'hosted · configured',
      state: 'ready'
    })
  });

  const html = ctx.createProviderStatusHTML({ showModel: true, showMode: true, showBadge: true, showEndpoint: true });
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('provider-endpoint'));
});

/**
 * ESLint v9 flat config for EONAPP.ch
 * Browser ESM for assets/, CJS for tests/ and platform-backend/, script for sw.js
 */
import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly',
  location: 'readonly', history: 'readonly', screen: 'readonly',
  fetch: 'readonly', console: 'readonly', alert: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly',
  setInterval: 'readonly', clearInterval: 'readonly',
  requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
  localStorage: 'readonly', sessionStorage: 'readonly',
  CustomEvent: 'readonly', Event: 'readonly', EventTarget: 'readonly',
  AbortController: 'readonly', AbortSignal: 'readonly',
  crypto: 'readonly', performance: 'readonly',
  URL: 'readonly', URLSearchParams: 'readonly',
  Blob: 'readonly', File: 'readonly', FileReader: 'readonly',
  FormData: 'readonly', XMLHttpRequest: 'readonly',
  Worker: 'readonly', WebSocket: 'readonly',
  caches: 'readonly', indexedDB: 'readonly', IDBKeyRange: 'readonly',
  MutationObserver: 'readonly', IntersectionObserver: 'readonly',
  ResizeObserver: 'readonly', PerformanceObserver: 'readonly',
  HTMLElement: 'readonly', Element: 'readonly', Node: 'readonly',
  NodeList: 'readonly', DocumentFragment: 'readonly',
  Image: 'readonly', Audio: 'readonly', Video: 'readonly',
  Canvas: 'readonly', CanvasRenderingContext2D: 'readonly',
  TextDecoder: 'readonly', TextEncoder: 'readonly',
  Promise: 'readonly', Map: 'readonly', Set: 'readonly', WeakMap: 'readonly',
  Symbol: 'readonly', BigInt: 'readonly', Proxy: 'readonly',
  structuredClone: 'readonly', queueMicrotask: 'readonly',
  // Encoding helpers — available in all modern browsers and service workers
  btoa: 'readonly', atob: 'readonly',
  // Fetch API primitives
  Request: 'readonly', Response: 'readonly', Headers: 'readonly',
  // Third-party libraries loaded via script tag
  html2canvas: 'readonly',
};

const nodeGlobals = {
  require: 'readonly', module: 'writable', exports: 'writable',
  __dirname: 'readonly', __filename: 'readonly',
  process: 'readonly', global: 'readonly', Buffer: 'readonly',
  console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
  setInterval: 'readonly', clearInterval: 'readonly',
  Promise: 'readonly', Map: 'readonly', Set: 'readonly',
  TextDecoder: 'readonly', TextEncoder: 'readonly', URL: 'readonly',
  URLSearchParams: 'readonly', fetch: 'readonly',
};

const securityRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
};

const codeQualityRules = {
  'no-var': 'error',
  'prefer-const': 'warn',
  'eqeqeq': ['error', 'smart'],
  'no-unused-vars': ['warn', {
    argsIgnorePattern: '^(_.*|rng|uid|rarity|options|traits|intensity)$',
    varsIgnorePattern: '^(_.*|THEMES|accent|shadowColor|rarityRoll|nowSec|svg|bracketSize|generateShapeSVG|generateMotifSVG|generateDetailsSVG)$',
    caughtErrorsIgnorePattern: '^_'
  }],
  'no-console': 'off',
  'curly': ['warn', 'multi-line'],
  'no-throw-literal': 'error',
  'no-return-assign': 'error',
  'no-sequences': 'error',
  'prefer-promise-reject-errors': 'warn',
  'no-duplicate-imports': 'error',
  // Allow empty catch blocks (common best-effort pattern in browser JS)
  'no-empty': ['warn', { allowEmptyCatch: true }],
  // Control-character regexes require an explicit, file-scoped exception below.
  'no-control-regex': 'warn',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'Smart Contracts/**',
      'archive/**',
      'site/**',
      'test-results/**',
      'campaigns/**',
    ],
  },

  // ── Browser ESM ─────────────────────────────────────────────────────────────
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...securityRules,
      ...codeQualityRules,
    },
  },

  // These exact helpers use a bounded regex solely to replace C0/DEL
  // characters before rendering or persisting identifiers. The exception is
  // intentionally file-scoped; all other browser code retains the warning.
  {
    files: [
      'assets/js/nexus/eon-nexus-pulse.js',
      'assets/js/nexus/eon-nexus-chat-pulse.js',
      'assets/js/nexus/w684/eon-nexus-w684-multimodal-controls.js',
      'assets/js/nexus/w685/eon-nexus-w685-spatial-project-atlas.js',
      'assets/js/nexus/w686/eon-nexus-w686-work-object-continuity.js',
      'assets/js/nexus/w699/eon-nexus-w699-command-clarity.js',
      'assets/js/nexus/w700/eonapp-w700-signature-flow.js',
    ],
    rules: {
      'no-control-regex': 'off',
    },
  },

  // ── Service Worker (global script scope) ────────────────────────────────────
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...browserGlobals,
        self: 'writable',
        clients: 'readonly',
        importScripts: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...securityRules,
      ...codeQualityRules,
    },
  },

  // ── Node.js (tests + backend + scripts) ─────────────────────────────────────
  {
    files: [
      'tests/**/*.js',
      'platform-backend/**/*.js',
      'scripts/**/*.js',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...codeQualityRules,
    },
  },
];

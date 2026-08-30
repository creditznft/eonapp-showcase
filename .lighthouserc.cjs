// .lighthouserc.cjs — Lighthouse CI configuration for EONAPP.ch
// Run locally: npx lhci autorun
// Run in CI:   npx lhci autorun --upload.target=temporary-public-storage
'use strict';

module.exports = {
  ci: {
    collect: {
      // Start the static server then measure the major public surfaces
      startServerCommand: 'node scripts/lhci-static-server.mjs --port 4180 --root dist',
      startServerReadyPattern: 'LHCI server ready',
      url: [
        'http://127.0.0.1:4180/',
        'http://127.0.0.1:4180/chat',
        'http://127.0.0.1:4180/workspace',
        'http://127.0.0.1:4180/vault',
        'http://127.0.0.1:4180/market',
        'http://127.0.0.1:4180/trade',
        'http://127.0.0.1:4180/eoncity',
        'http://127.0.0.1:4180/eoncity/3d',
        'http://127.0.0.1:4180/local-ai',
        'http://127.0.0.1:4180/profile',
      ],
      numberOfRuns: 1,
      settings: {
        // Measure desktop performance (more stable in CI)
        preset: 'desktop',
        // Skip service-worker (localhost has no SW by default)
        skipAudits: ['service-worker', 'installable-manifest', 'splash-screen'],
        // Throttling: no throttle for local server (simulated network already fast)
        throttlingMethod: 'simulate',
        throttling: {
          cpuSlowdownMultiplier: 2,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 5120,
          requestLatencyMs: 0,
          rttMs: 0,
        },
      },
    },
    assert: {
      assertions: {
        // Performance — aim for 85+ (warn below, don't fail CI)
        'categories:performance': ['warn', { minScore: 0.82 }],
        // Accessibility — enforce 90+
        'categories:accessibility': ['error', { minScore: 0.88 }],
        // Best Practices — enforce 85+
        'categories:best-practices': ['error', { minScore: 0.85 }],
        // SEO — enforce 90+
        'categories:seo': ['error', { minScore: 0.88 }],
        // Specific audits
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 400 }],
        'speed-index': ['warn', { maxNumericValue: 4500 }],
        'interactive': ['warn', { maxNumericValue: 4000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

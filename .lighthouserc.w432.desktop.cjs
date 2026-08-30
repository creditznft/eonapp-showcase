'use strict';
const routes = ['/', '/apps', '/workspace', '/forge', '/vault', '/market', '/eoncity', '/profile', '/support'];
const urls = routes.map((route) => `http://127.0.0.1:4192${route}`);
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci-static-server.mjs --port 4192 --root dist',
      startServerReadyPattern: 'LHCI server ready',
      url: urls,
      numberOfRuns: 1,
      settings: { preset: 'desktop', throttlingMethod: 'simulate', skipAudits: ['service-worker', 'installable-manifest', 'splash-screen'] }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.82 }],
        'categories:accessibility': ['error', { minScore: 0.88 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.88 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 400 }]
      }
    },
    upload: { target: 'filesystem', outputDir: 'CodexAuditPack/w432-city-certification/lighthouse-desktop' }
  }
};

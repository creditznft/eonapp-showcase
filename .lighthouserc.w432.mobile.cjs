'use strict';
const routes = ['/', '/apps', '/workspace', '/forge', '/vault', '/market', '/eoncity', '/profile', '/support'];
const urls = routes.map((route) => `http://127.0.0.1:4193${route}`);
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci-static-server.mjs --port 4193 --root dist',
      startServerReadyPattern: 'LHCI server ready',
      url: urls,
      numberOfRuns: 1,
      settings: { preset: 'mobile', throttlingMethod: 'simulate', skipAudits: ['service-worker', 'installable-manifest', 'splash-screen'] }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.72 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }]
      }
    },
    upload: { target: 'filesystem', outputDir: 'CodexAuditPack/w432-city-certification/lighthouse-mobile' }
  }
};

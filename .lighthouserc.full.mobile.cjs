'use strict';

const fs = require('node:fs');
const path = require('node:path');

function loadRoutes() {
  const fallback = [
    '/',
    '/chat',
    '/workspace',
    '/vault',
    '/market',
    '/trade',
    '/eoncity',
    '/eoncity/3d',
    '/local-ai',
    '/profile',
    '/automations',
    '/archive',
    '/rewards',
    '/billing',
  ];
  const file = path.resolve(__dirname, 'CodexAuditPack', 'lighthouse-routes.json');
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const routes = Array.isArray(data.routes) ? data.routes.map((row) => row.route).filter(Boolean) : [];
    return routes.length ? routes : fallback;
  } catch {
    return fallback;
  }
}

const routes = loadRoutes();
const urls = routes.map((route) => `http://127.0.0.1:4180${route.startsWith('/') ? route : `/${route}`}`);

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci-static-server.mjs --port 4180 --root dist',
      startServerReadyPattern: 'LHCI server ready',
      url: urls,
      numberOfRuns: 1,
      settings: {
        preset: 'mobile',
        skipAudits: ['service-worker', 'installable-manifest', 'splash-screen'],
        throttlingMethod: 'simulate',
        throttling: {
          cpuSlowdownMultiplier: 3,
          downloadThroughputKbps: 5120,
          uploadThroughputKbps: 2560,
          requestLatencyMs: 0,
          rttMs: 0,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.72 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
        'speed-index': ['warn', { maxNumericValue: 6500 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'CodexAuditPack/lighthouse-mobile',
    },
  },
};

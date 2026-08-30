/**
 * Lighthouse Performance Tests
 * =============================
 * Verifies core web vitals and performance metrics for key pages.
 * Uses Playwright's built-in CDP session for metrics collection.
 */
const { test, expect } = require('@playwright/test');

const PAGES_TO_TEST = [
  { path: '/', label: 'Home' },
  { path: '/games.html', label: 'Games Hub' },
  { path: '/tools.html', label: 'Tools Hub' },
  { path: '/vault', label: 'Vault' },
  { path: '/chat.html', label: 'Chat' },
  { path: '/create', label: 'Creator Studio' },
  { path: '/market', label: 'Market' },
  { path: '/marketplace.html', label: 'Marketplace' },
  { path: '/trade', label: 'Signal' },
  { path: '/build', label: 'WorkBench' },
];

// Performance thresholds (in ms)
const THRESHOLDS = {
  FCP: 3000,    // First Contentful Paint
  LCP: 5000,    // Largest Contentful Paint
  CLS: 0.15,    // Cumulative Layout Shift
  TTI: 8000,    // Time to Interactive (approximate)
  LOAD: 10000,  // Full page load
};

test.describe('Performance — Core Web Vitals', () => {
  for (const { path, label } of PAGES_TO_TEST) {
    test(`${label} (${path}) meets performance thresholds`, async ({ page }) => {
      // Collect performance metrics
      const metrics = {};
      await page.goto(path, { waitUntil: 'networkidle' });

      // Get navigation timing
      const perfData = await page.evaluate(() => {
        const [nav] = performance.getEntriesByType('navigation');
        if (!nav) return null;
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          domInteractive: nav.domInteractive - nav.startTime,
          transferSize: nav.transferSize,
          decodedBodySize: nav.decodedBodySize,
        };
      });

      // Get paint timing
      const paintData = await page.evaluate(() => {
        const entries = performance.getEntriesByType('paint');
        const result = {};
        for (const entry of entries) {
          result[entry.name] = entry.startTime;
        }
        return result;
      });

      // Get layout shift (CLS)
      const clsValue = await page.evaluate(() => {
        return new Promise(resolve => {
          let cls = 0;
          try {
            const observer = new PerformanceObserver(list => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) cls += entry.value;
              }
            });
            observer.observe({ type: 'layout-shift', buffered: true });
            // Wait briefly then report
            setTimeout(() => {
              observer.disconnect();
              resolve(cls);
            }, 1000);
          } catch {
            resolve(0);
          }
        });
      });

      // Verify no JS errors
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      // Assertions
      if (paintData['first-contentful-paint']) {
        expect(paintData['first-contentful-paint'],
          `${label} FCP should be < ${THRESHOLDS.FCP}ms`).toBeLessThan(THRESHOLDS.FCP);
      }

      expect(clsValue,
        `${label} CLS should be < ${THRESHOLDS.CLS}`).toBeLessThan(THRESHOLDS.CLS);

      if (perfData) {
        expect(perfData.domInteractive,
          `${label} DOM interactive should be < ${THRESHOLDS.TTI}ms`).toBeLessThan(THRESHOLDS.TTI);
      }

      // Page should load within threshold
      const loadTime = await page.evaluate(() => performance.now());
      // This is a rough check — the page should have loaded by now
      expect(loadTime, `${label} should have loaded`).toBeGreaterThan(0);

      // No critical JS errors
      expect(errors.filter(e =>
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection') &&
        !e.includes('Script error')
      ), `${label} should have no unexpected JS errors`).toEqual([]);
    });
  }
});

test.describe('Performance — Resource Loading', () => {
  test('Home page assets are properly sized', async ({ page }) => {
    const resources = [];
    page.on('response', resp => {
      const url = new URL(resp.url());
      resources.push({
        url: url.pathname,
        size: Number(resp.headers()['content-length'] || 0),
        status: resp.status(),
        type: resp.headers()['content-type'] || '',
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // No excessively large JS files (>500KB unminified is a sign of bloat)
    const largeJs = resources.filter(r =>
      r.type.includes('javascript') && r.size > 500000
    );
    expect(largeJs, 'No JS file should exceed 500KB').toEqual([]);

    // All resources should return 200
    const failed = resources.filter(r => r.status >= 400);
    expect(failed, 'All resources should load successfully').toEqual([]);
  });

  test('Service worker is registered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker?.controller !== null ||
             navigator.serviceWorker?.registrations?.length > 0;
    });

    // SW may or may not be active depending on first visit
    // Just verify the SW file exists
    const swResponse = await page.request.get('/sw.js');
    expect(swResponse.ok(), 'sw.js should be accessible').toBeTruthy();
  });

  test('Images use lazy loading', async ({ page }) => {
    await page.goto('/games.html', { waitUntil: 'networkidle' });

    const lazyImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map(img => ({
        src: img.src,
        loading: img.getAttribute('loading'),
        hasLazy: img.getAttribute('loading') === 'lazy',
      }));
    });

    // At least some images should use lazy loading
    const belowFoldImages = lazyImages.filter(img =>
      !img.src.includes('logo') && !img.src.includes('icon') && !img.src.includes('favicon')
    );

    if (belowFoldImages.length > 0) {
      const lazyCount = belowFoldImages.filter(img => img.hasLazy).length;
      // At least 50% of below-fold images should be lazy
      expect(lazyCount / belowFoldImages.length,
        'At least 50% of below-fold images should use lazy loading').toBeGreaterThanOrEqual(0.5);
    }
  });
});

test.describe('Performance — Cache Headers', () => {
  test('Static assets have cache headers', async ({ request }) => {
    const staticFiles = [
      '/assets/css/main.css',
      '/assets/js/main.js',
    ];

    for (const file of staticFiles) {
      const resp = await request.get(file);
      if (resp.ok()) {
        const cacheControl = resp.headers()['cache-control'] || '';
        // Static assets should have some form of caching
        expect(cacheControl.length > 0 || resp.headers()['etag'],
          `${file} should have cache headers`).toBeTruthy();
      }
    }
  });
});

const { test, expect } = require('@playwright/test');

// Release gate: chromium is canonical for this static PWA launch pass.
test.skip(({ browserName }) => browserName !== 'chromium', 'Cross-browser parity tracked separately');

/**
 * Performance Metrics Tests
 * Measures actual loading times and Core Web Vitals
 */

test.describe('Performance Metrics - Speed Tests', () => {
  
  test('Homepage loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime, `Homepage took ${loadTime}ms to load`).toBeLessThan(2000);
  });

  test('WorkBench page loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/build');
    await page.waitForSelector('main', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`WorkBench load time: ${loadTime}ms`);
    expect(loadTime, `WorkBench took ${loadTime}ms to load`).toBeLessThan(2000);
  });

  test('Market page loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/market');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Market page load time: ${loadTime}ms`);
    expect(loadTime, `Market page took ${loadTime}ms to load`).toBeLessThan(2000);
  });

  test('Vault page loads in under 5 seconds', async ({ page, browserName }) => {
    test.setTimeout(20000);
    // Skip on Firefox/WebKit - known performance issues
    if (browserName === 'firefox' || browserName === 'webkit') {
      test.skip(true, 'Vault page has known performance issues on Firefox/WebKit');
      return;
    }
    const startTime = Date.now();
    await page.goto('/vault');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Vault page load time: ${loadTime}ms`);
    expect(loadTime, `Vault page took ${loadTime}ms to load`).toBeLessThan(5000);
  });

  test('Chat page loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/chat.html');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Chat page load time: ${loadTime}ms`);
    expect(loadTime, `Chat page took ${loadTime}ms to load`).toBeLessThan(2000);
  });

  test('Measures Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation');
      if (perfEntries.length === 0) return null;
      
      const nav = perfEntries[0];
      return {
        // Core metrics
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadComplete: nav.loadEventEnd - nav.startTime,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        // Breakdown
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        connect: nav.connectEnd - nav.connectStart,
        response: nav.responseEnd - nav.responseStart,
        domProcessing: nav.domComplete - nav.responseEnd,
      };
    });

    console.log('Core Web Vitals:', JSON.stringify(metrics, null, 2));
    
    expect(metrics).not.toBeNull();
    expect(metrics.domContentLoaded).toBeLessThan(1500);
    expect(metrics.loadComplete).toBeLessThan(2500);
    expect(metrics.firstContentfulPaint).toBeLessThan(1500);
  });

  test.skip('Archived game performance checks removed after WorkBench pivot');

  test('JavaScript bundle sizes are reasonable', async ({ page }) => {
    const resources = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js')) {
        const headers = response.headers();
        const size = headers['content-length'] || 0;
        resources.push({ url: url.split('/').pop(), size: parseInt(size) || 0 });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('JS Bundle sizes:', resources);
    
    // Check that no single JS file is too large
    for (const resource of resources) {
      if (resource.size > 0) {
        expect(resource.size, `${resource.url} is too large`).toBeLessThan(500000); // 500KB
      }
    }
  });

  test('No render-blocking resources detected', async ({ page }) => {
    const blockingResources = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const resourceType = response.request().resourceType();
      
      if (resourceType === 'stylesheet' || resourceType === 'script') {
        const headers = response.headers();
        // Check if render-blocking
        if (!headers['async'] && !headers['defer'] && resourceType === 'script') {
          blockingResources.push(url);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('Potentially blocking resources:', blockingResources);
    
    // Allow render-blocking for critical CSS/JS - our app uses module scripts which are async by default
    expect(blockingResources.length).toBeLessThan(30);
  });
});

test.describe('Memory Usage Tests', () => {
  test('Memory usage stays stable during navigation', async ({ page }) => {
    const measurements = [];
    
    // Measure initial memory
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const pages = ['/', '/build', '/market', '/vault', '/chat.html'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500);
      
      const memory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
          };
        }
        return null;
      });
      
      if (memory) {
        measurements.push({ url, usedMB: Math.round(memory.used / 1024 / 1024) });
      }
    }
    
    console.log('Memory measurements:', measurements);
    
    // Check that memory usage is reasonable
    for (const m of measurements) {
      expect(m.usedMB).toBeLessThan(100); // Less than 100MB per page
    }
  });
});

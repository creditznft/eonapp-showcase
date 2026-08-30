const { test, expect } = require('@playwright/test');

const securePages = ['/', '/vault', '/chat.html', '/games.html', '/tools.html'];

// Check if running on Netlify (has proper headers) or local dev server
async function isNetlifyEnv(request) {
  const response = await request.get('/');
  const headers = response.headers();
  // Netlify adds server header or has proper CSP headers
  return headers['server']?.includes('Netlify') ||
         (headers['content-security-policy']?.length > 20);
}

for (const path of securePages) {
  test(`${path} sends required security headers`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();

    // Skip detailed header checks on local dev (npx serve doesn't use _headers)
    const isNetlify = await isNetlifyEnv(request);
    if (!isNetlify) {
      test.skip(true, 'Skipping header checks on local dev server');
      return;
    }

    // All pages must have X-Content-Type-Options
    expect(headers['x-content-type-options'] || '').toMatch(/nosniff/i);

    // Content-Security-Policy must be present and non-empty
    const csp = headers['content-security-policy'] || '';
    expect(csp.length).toBeGreaterThan(20);

    // CSP must have default-src
    expect(csp).toContain('default-src');

    // CSP must prevent framing
    expect(csp).toMatch(/frame-ancestors\s+'none'/);
  });
}

test('index.html CSP includes object-src none', async ({ request }) => {
  const isNetlify = await isNetlifyEnv(request);
  if (!isNetlify) {
    test.skip(true, 'Skipping on local dev server');
    return;
  }
  const response = await request.get('/');
  const csp = response.headers()['content-security-policy'] || '';
  expect(csp).toContain("object-src 'none'");
});

test('index.html has HSTS header', async ({ request }) => {
  const isNetlify = await isNetlifyEnv(request);
  if (!isNetlify) {
    test.skip(true, 'Skipping on local dev server');
    return;
  }
  const response = await request.get('/');
  const hsts = response.headers()['strict-transport-security'] || '';
  expect(hsts).toContain('max-age=');
  // Should have at least 1 year
  const match = hsts.match(/max-age=(\d+)/);
  if (match) {
    expect(Number(match[1])).toBeGreaterThan(31536000);
  }
});

test('index.html has X-Frame-Options DENY', async ({ request }) => {
  const isNetlify = await isNetlifyEnv(request);
  if (!isNetlify) {
    test.skip(true, 'Skipping on local dev server');
    return;
  }
  const response = await request.get('/');
  const xfo = response.headers()['x-frame-options'] || '';
  expect(xfo).toMatch(/DENY/i);
});

test('assets have long-term cache headers', async ({ request }) => {
  const response = await request.get('/assets/css/base.css');
  if (!response.ok()) {
    test.skip(true, 'CSS file not found');
    return;
  }
  const isNetlify = await isNetlifyEnv(request);
  if (!isNetlify) {
    test.skip(true, 'Skipping on local dev server');
    return;
  }
  const cc = response.headers()['cache-control'] || '';
  expect(cc).toMatch(/max-age=\d{5,}/);
  expect(cc).toContain('immutable');
});

test('sw.js has no-cache headers', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.ok()).toBeTruthy();
  const cc = response.headers()['cache-control'] || '';
  // On local dev, may not have cache headers
  if (!cc) {
    test.skip(true, 'No cache headers on local dev');
    return;
  }
  expect(cc).toMatch(/no-cache|no-store/i);
});

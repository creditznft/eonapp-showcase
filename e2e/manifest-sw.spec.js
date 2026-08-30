const { test, expect } = require('@playwright/test');

test('manifest.webmanifest returns valid JSON', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type'] || '').toContain('json');

  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: expect.any(String),
    start_url: expect.any(String),
    icons: expect.any(Array)
  });
});

test('sw.js returns JavaScript', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.ok()).toBeTruthy();

  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toMatch(/javascript|ecmascript|text\/plain/i);

  const source = await response.text();
  // Minified sw.js may use 'sw' or 'self' variable
  expect(source).toMatch(/(self|sw)\.addEventListener/);
});

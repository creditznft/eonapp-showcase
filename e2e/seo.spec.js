const { test, expect } = require('@playwright/test');

const pages = [
  ['/', { title: /EONAPP/i, canonical: 'https://eonapp.ch/' }],
  ['/vault', { title: /Vault/i, canonical: 'https://eonapp.ch/vault' }],
  ['/chat.html', { title: /EONBOT AI|Chat/i, canonical: 'https://eonapp.ch/chat.html' }],
  ['/games/cyber-rogue/', { title: /CyberRogue/i, canonical: 'https://eonapp.ch/games/cyber-rogue/' }],
  ['/games/realm-wars-lite/', { title: /Realm Wars Lite/i, canonical: 'https://eonapp.ch/games/realm-wars-lite/' }]
];

for (const [path, expectations] of pages) {
  test(`${path} exposes launch SEO metadata`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(expectations.title);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', /.+/);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', expectations.canonical);
  });
}

const jsonLdPages = [
  '/',
  '/vault',
  '/chat.html',
  '/about.html',
  '/blog/index.html',
  '/tools.html',
  '/games.html'
];

for (const path of jsonLdPages) {
  test(`${path} has JSON-LD structured data`, async ({ page }) => {
    await page.goto(path);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);

    // Each JSON-LD block must be valid parseable JSON
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(() => JSON.parse(content)).not.toThrow();
      const schema = JSON.parse(content);
      expect(schema['@context']).toMatch(/schema\.org/i);
      expect(schema['@type']).toBeTruthy();
    }
  });
}

test('index.html has WebSite schema', async ({ page }) => {
  await page.goto('/');
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  let found = false;
  for (let i = 0; i < count; i++) {
    const content = await scripts.nth(i).textContent();
    const schema = JSON.parse(content);
    if (schema['@type'] === 'WebSite') found = true;
  }
  expect(found).toBe(true);
});

test('index.html has Organization schema', async ({ page }) => {
  await page.goto('/');
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  let found = false;
  for (let i = 0; i < count; i++) {
    const content = await scripts.nth(i).textContent();
    const schema = JSON.parse(content);
    if (schema['@type'] === 'Organization') found = true;
  }
  expect(found).toBe(true);
});

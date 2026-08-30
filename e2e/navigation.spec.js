/**
 * Navigation E2E Tests — updated for the current launch shell.
 * Homepage nav now prioritizes AI Cockpit, Chat, Trade, Vault, Market, Realm, and Plans.
 */
const { test, expect } = require('@playwright/test');

async function gotoReady(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

// ── Primary nav links ─────────────────────────────────────────
const navTargets = [
  {
    label: /AI Cockpit/i,
    path: /\/eon-browser\.html(?:\?.*)?$/
  },
  {
    label: /AI Chat/i,
    path: /\/chat\.html(?:\?.*)?$/
  },
  {
    label: /Trade/i,
    path: /\/trade(?:\.html)?(?:\?.*)?$/
  },
  {
    label: 'Vault',
    path: /\/vault(?:\.html)?(?:[?#].*)?$/
  },
  {
    label: /Market/i,
    path: /\/market(?:\.html)?(?:\?.*)?$/
  },
  {
    label: /Realm/i,
    path: /\/realm(?:\.html)?(?:\?.*)?$/
  }
];

for (const target of navTargets) {
  test(`index nav opens ${target.label}`, async ({ page }) => {
    await gotoReady(page, '/');
    const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: target.label });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(target.path);
  });
}

// ── Logo always returns home ──────────────────────────────────
test('logo link navigates to homepage', async ({ page }) => {
  await gotoReady(page, '/build');
  const homeLink = page.locator('a.logo, .logo a, header a[href="/"]').first();
  await expect(homeLink).toBeVisible();
  await homeLink.click();
  await page.waitForURL('/');
  await expect(page).toHaveURL('/');
});

// ── Skip-to-content link present on all main pages ────────────
const skipTargets = ['/', '/build', '/vault', '/realm', '/trade'];
for (const path of skipTargets) {
  test(`skip-to-content link on ${path}`, async ({ page }) => {
    await gotoReady(page, path);
    const skip = page.locator('.skip-to-content, [href="#main"]').first();
    await expect(skip).toBeAttached();
  });
}

// ── Mobile bottom nav: all 6 pages ────────────────────────────
const mobileNavPages = [
  { path: '/build',      activeLabel: /WorkBench|Build/i },
  { path: '/vault',          activeLabel: 'Vault' },
  { path: '/trade',         activeLabel: /Trade/i },
  { path: '/realm',          activeLabel: /Realm|Market/i },
  { path: '/chat.html',           activeLabel: 'Chat' },
  { path: '/create', activeLabel: /Studio|Create/i },
];

for (const { path, activeLabel } of mobileNavPages) {
  test(`mobile bottom nav is present on ${path}`, async ({ page }) => {
    await gotoReady(page, path);
    await expect(page.locator('.eon-bottom-nav')).toBeAttached();
    const items = page.locator('.eon-bottom-nav-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(6);
  });

  test(`mobile bottom nav active item is "${activeLabel}" on ${path}`, async ({ page }) => {
    await gotoReady(page, path);
    const activeItem = page.locator('.eon-bottom-nav-item.active');
    await expect(activeItem).toHaveCount(1);
    await expect(activeItem).toContainText(activeLabel);
    await expect(activeItem).toHaveAttribute('aria-current', 'page');
  });
}

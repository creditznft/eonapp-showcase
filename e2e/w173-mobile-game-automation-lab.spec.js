import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'iphone-se-portrait', width: 375, height: 667 },
  { name: 'iphone-14-portrait', width: 390, height: 844 },
  { name: 'pixel-7-portrait', width: 412, height: 915 },
  { name: 'iphone-se-landscape', width: 667, height: 375 },
  { name: 'iphone-14-landscape', width: 844, height: 390 },
  { name: 'pixel-7-landscape', width: 915, height: 412 }
];

for (const viewport of viewports) {
  test(`W173 EON City mobile UX ${viewport.name}`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/realmworld.html');
    await expect(page.locator('#rw-map')).toBeVisible();
    await expect(page.locator('[data-eoncity-hide-ui]')).toBeVisible();
    await expect(page.locator('[data-eoncity-close-panels]')).toBeVisible();
    await page.locator('[data-eoncity-close-panels]').click();
    await expect(page.locator('#rw-map')).toBeVisible();
    await expect(page.locator('[data-camera="reset"]')).toBeVisible();
    expect(consoleErrors.filter((entry) => !/favicon|ResizeObserver/i.test(entry))).toEqual([]);
  });
}

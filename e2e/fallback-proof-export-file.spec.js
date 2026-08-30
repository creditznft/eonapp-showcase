const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('export fallback proof into launch-signoff folder', async ({ page }) => {
  const outDir = path.join(process.cwd(), 'docs', 'qa', 'launch-signoff');
  const outFile = path.join(outDir, 'fallback-proof-export.json');
  fs.mkdirSync(outDir, { recursive: true });

  await page.goto('/admin.html');
  await page.waitForSelector('#admin-fallback-run-drill', { timeout: 20000 });

  await page.click('#admin-fallback-run-drill');
  await expect(page.locator('#admin-fallback-status')).toContainText(/Fallback drill (passed|failed)/, { timeout: 30000 });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#admin-fallback-export-proof')
  ]);

  await download.saveAs(outFile);
  const stat = fs.statSync(outFile);
  expect(stat.size).toBeGreaterThan(10);
});


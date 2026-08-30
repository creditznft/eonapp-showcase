const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'docs', 'qa', 'launch-signoff', 'screenshots');

function ensureOutDir() {
  fs.mkdirSync(outDir, { recursive: true });
}

async function setArabicLocale(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('eon:lang:preference:v1', 'ar');
      localStorage.setItem('eon:lang:v1', 'ar');
      const opened = {
        'chat:ar': Date.now(),
        'creator-studio:ar': Date.now(),
        'marketplace:ar': Date.now()
      };
      localStorage.setItem('eon:widget:auto-opened:v2', JSON.stringify(opened));
    } catch {}
  });
}

async function closeWidgetIfOpen(page) {
  const closeBtn = page.locator('#ew-close-btn');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true });
  }
}

test('capture rtl visual evidence for chat/creator/marketplace', async ({ page, browserName }) => {
  ensureOutDir();
  const stamp = new Date().toISOString().slice(0, 10);

  await setArabicLocale(page);
  await page.goto('/chat.html');
  await closeWidgetIfOpen(page);
  await page.waitForTimeout(1200);
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, `rtl-chat-ar-${browserName}-${stamp}.png`),
    fullPage: true
  });

  await setArabicLocale(page);
  await page.goto('/create');
  await closeWidgetIfOpen(page);
  await page.waitForTimeout(1500);
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, `rtl-creator-ar-${browserName}-${stamp}.png`),
    fullPage: true
  });

  await setArabicLocale(page);
  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);
  await page.waitForTimeout(1200);
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, `rtl-marketplace-ar-${browserName}-${stamp}.png`),
    fullPage: true
  });
});


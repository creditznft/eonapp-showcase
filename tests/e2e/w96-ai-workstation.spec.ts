import { test, expect } from '@playwright/test';

async function openWorkstation(page: import('@playwright/test').Page) {
  await page.route('**/sw.js', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'self.addEventListener("fetch",()=>{});' });
  });
  await page.route(/http:\/\/(127\.0\.0\.1|localhost):(11434|1234|1337)\/.*/, async (route) => {
    const url = route.request().url();
    const body = url.includes('/api/tags') ? '{"models":[]}' : '{"data":[]}';
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await page.goto('/eon-browser.html?audit=w96', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/eon-workstation-v3/);
  await expect(page.locator('.ew-home-stage')).toBeVisible();
  await expect(page.locator('#eon-contextual-feature-gate')).toBeHidden();
  await expect(page.locator('#eon-newtab-page')).toBeHidden();
}

test.describe('W96 EON Workstation flagship shell', () => {
  test('opens native Code Maker and executes sandboxed preview', async ({ page }) => {
    await openWorkstation(page);
    await page.getByRole('button', { name: /Code Maker/ }).first().click();
    await expect(page.locator('.ew-code-studio')).toBeVisible();
    await expect(page.locator('.ew-code-editors textarea')).toHaveCount(3);

    await page.locator('#ew-code-html').fill('<main><h1 id="proof">Verified Code Maker</h1></main>');
    await page.locator('#ew-code-run').click();
    const preview = page.locator('#ew-code-preview').contentFrame();
    await expect(preview.locator('#proof')).toHaveText('Verified Code Maker');
    await expect(page.locator('#ew-live-status')).toContainText(/updated|ready/i);
  });

  test('uses an honest external-site handoff instead of a broken iframe', async ({ page }) => {
    await openWorkstation(page);
    await page.locator('#ew-command-input').fill('google.com');
    await page.locator('#ew-open-command').click();
    await expect(page.locator('.ew-external-card')).toBeVisible();
    await expect(page.locator('.ew-external-url')).toHaveText('https://google.com/');
    await expect(page.locator('#ew-open-external-now')).toBeVisible();
    await expect(page.locator('#ew-read-external-now')).toBeVisible();
    await expect(page.locator('#browser-frame')).toBeHidden();
  });

  test('opens and closes accessible workstation drawers', async ({ page }) => {
    await openWorkstation(page);
    await page.locator('[data-ew-drawer="apps"]').first().click();
    const drawer = page.locator('#ew-drawer');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#ew-drawer-body [data-ew-open]')).toHaveCount(11);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('keeps command deck and Code Maker within a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openWorkstation(page);
    const homeMetrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      clientWidth: document.documentElement.clientWidth,
      deckWidth: document.querySelector('#ew-command-deck')?.getBoundingClientRect().width || 0,
      commandWidth: document.querySelector('#ew-command-input')?.getBoundingClientRect().width || 0,
    }));
    expect(homeMetrics.overflow).toBe(false);
    expect(homeMetrics.deckWidth).toBeLessThanOrEqual(homeMetrics.clientWidth);
    expect(homeMetrics.commandWidth).toBeGreaterThan(260);

    await page.getByRole('button', { name: /Code Maker/ }).first().click();
    await expect(page.locator('.ew-code-studio')).toBeVisible();
    const codeMetrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      editorWidth: document.querySelector('.ew-code-editors')?.getBoundingClientRect().width || 0,
      previewWidth: document.querySelector('.ew-code-preview-wrap')?.getBoundingClientRect().width || 0,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(codeMetrics.overflow).toBe(false);
    expect(codeMetrics.editorWidth).toBeLessThan(codeMetrics.clientWidth);
    expect(codeMetrics.previewWidth).toBeLessThan(codeMetrics.clientWidth);
  });

  test('lazy-loads model services and EONBOT rail only when requested', async ({ page }) => {
    await openWorkstation(page);
    const initialScripts = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    expect(initialScripts.some((url) => url.includes('/eon-browser-page.js'))).toBe(false);
    expect(initialScripts.some((url) => url.includes('/multi-language.js'))).toBe(false);

    await page.locator('[data-ew-drawer="models"]').first().click();
    await expect(page.locator('[data-ew-runtime-status]')).toHaveText('Module ready', { timeout: 20000 });
    await expect.poll(() => page.evaluate(() => window.EONWorkstation?.runtimeIsReady?.('models'))).toBe(true);
    await page.getByRole('button', { name: 'Open model picker' }).click();
    await expect(page.locator('#eon-panel-models')).toBeVisible({ timeout: 10000 });
    await page.locator('#eon-panel-models-close').click();

    await page.locator('#ew-sidebar-toggle').click();
    await expect(page.locator('#browser-ai-sidebar')).toBeVisible({ timeout: 10000 });
    await expect.poll(() => page.evaluate(() => window.EONWorkstation?.runtimeIsReady?.('browser'))).toBe(true);
  });


  test('opens account and activity services through secure drawers', async ({ page }) => {
    await openWorkstation(page);
    await page.locator('[data-ew-drawer="accounts"]').first().click();
    await expect(page.locator('[data-ew-runtime-status]')).toHaveText('Module ready', { timeout: 20000 });
    await page.getByRole('button', { name: 'Open connected accounts' }).click();
    await expect(page.locator('#eon-panel-accounts')).toBeVisible({ timeout: 10000 });
    await page.locator('#eon-panel-accounts-close').click();

    await page.locator('[data-ew-drawer="activity"]').first().click();
    await expect(page.locator('[data-ew-runtime-status]')).toHaveText('Module ready', { timeout: 10000 });
    await page.getByRole('button', { name: 'Open activity monitor' }).click();
    await expect(page.locator('#eon-panel-aiactivity')).toBeVisible({ timeout: 10000 });
    await page.locator('#eon-panel-agent-close').click();

    await page.locator('[data-ew-drawer="notifications"]').first().click();
    await expect(page.locator('[data-ew-runtime-status]')).toHaveText('Module ready', { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Manage notifications' })).toBeEnabled();
  });

});

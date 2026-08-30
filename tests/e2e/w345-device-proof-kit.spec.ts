import { expect, test } from '@playwright/test';

test.describe('W345 local Device Proof Kit', () => {
  test('stores an explicit local checklist, exports only on user action, and clears after confirmation', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/workspace');
    await expect(page.getByRole('heading', { name: /Record real-device checks without sending evidence anywhere/i })).toBeVisible();
    const form = page.locator('[data-device-proof-kit-form]');
    await expect(form.locator('[data-device-proof-case]')).toHaveCount(7);
    const desktop = form.locator('[data-device-proof-case="desktop-standard"]');
    await desktop.locator('[data-device-proof-status]').selectOption('passed');
    await desktop.locator('[data-device-proof-note]').fill('Manual desktop check completed.');
    await form.getByRole('button', { name: /Save local checklist/i }).click();
    await expect(form.locator('[data-device-proof-status-message]')).toContainText(/Saved locally/i);
    await page.reload();
    await expect(page.locator('[data-device-proof-case="desktop-standard"] [data-device-proof-status]')).toHaveValue('passed');
    const download = page.waitForEvent('download');
    await page.locator('[data-device-proof-export]').click();
    await (await download).cancel();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('[data-device-proof-clear]').click();
    await expect(page.locator('[data-device-proof-case="desktop-standard"] [data-device-proof-status]')).toHaveValue('not-run');
  });
});

import { expect, test } from '@playwright/test';

async function visibleProfilePanels(page) {
  return page.locator('.eon-preferences-section-panel').evaluateAll((nodes) => (
    nodes
      .filter((node) => !node.hasAttribute('hidden'))
      .map((node) => node.id)
  ));
}

test.describe('W537 consumer UX compression', () => {
  test('desktop keeps Profile as a selected-panel surface and Capsule compressed to primary actions', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 960 });

    await page.goto('/profile');
    await expect(page.locator('#profile-general-panel')).toBeVisible();
    await expect(page.locator('#profile-account-backup-panel')).toBeHidden();
    expect(await visibleProfilePanels(page)).toEqual(['profile-general-panel']);

    await page.locator('[data-preference-target="profile-privacy"]').click();
    await expect(page.locator('#profile-privacy-panel')).toBeVisible();
    await expect(page.locator('#profile-general-panel')).toBeHidden();
    expect(await visibleProfilePanels(page)).toEqual(['profile-privacy-panel']);
    await page.screenshot({ path: testInfo.outputPath('w537-profile-desktop-selected-panel.png'), fullPage: true });

    await page.goto('/capsule');
    await expect(page.getByRole('heading', { name: 'Create one encrypted Capsule' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Restore a Capsule' })).toBeVisible();
    expect(await page.locator('details[data-eon-capsule-card="google-drive"]').evaluate((node) => node.hasAttribute('open'))).toBe(false);
    expect(await page.locator('details[data-eon-capsule-card="advanced-recovery"]').evaluate((node) => node.hasAttribute('open'))).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('w537-capsule-desktop-primary-actions.png'), fullPage: true });
  });

  test('390px mobile uses accordion settings and keeps advanced recovery collapsed by default', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/profile');
    await expect(page.locator('.eon-preferences-nav')).toBeHidden();
    await expect(page.locator('#profile-general-panel')).toBeVisible();
    await page.locator('[data-preference-toggle="profile-sharing"]').click();
    await expect(page.locator('#profile-sharing-panel')).toBeVisible();
    await expect(page.locator('#profile-general-panel')).toBeHidden();
    expect(await visibleProfilePanels(page)).toEqual(['profile-sharing-panel']);
    await page.screenshot({ path: testInfo.outputPath('w537-profile-mobile-390-accordion.png'), fullPage: true });

    await page.goto('/capsule');
    expect(await page.locator('details[data-eon-capsule-card="google-drive"]').evaluate((node) => node.hasAttribute('open'))).toBe(false);
    expect(await page.locator('details[data-eon-capsule-card="advanced-recovery"]').evaluate((node) => node.hasAttribute('open'))).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('w537-capsule-mobile-390-primary-actions.png'), fullPage: true });
  });
});

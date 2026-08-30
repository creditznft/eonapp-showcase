const { test, expect } = require('@playwright/test');

test('creator studio browser attachment helpers stay local-first', async ({ page }) => {
  await page.goto('/creator-studio.html', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const result = await page.evaluate(async () => {
    const api = window.EONSocialAttachments;
    if (!api) return { ok: false, reason: 'attachment api missing' };
    const started = await api.startPlatformOAuth('linkedin', 'user-attachment-01', window.location.href);
    const status1 = await api.getPlatformOAuthStatus('linkedin', 'user-attachment-01');
    const confirmed = await api.confirmPlatformOAuth('linkedin', 'user-attachment-01');
    const status2 = await api.getPlatformOAuthStatus('linkedin', 'user-attachment-01');
    return { ok: true, started, status1, confirmed, status2 };
  });

  expect(result.ok).toBeTruthy();
  expect(result.started.authUrl).toContain('linkedin.com/login');
  expect(result.status1.pending).toBeTruthy();
  expect(result.confirmed.connected).toBeTruthy();
  expect(result.status2.connected).toBeTruthy();
});

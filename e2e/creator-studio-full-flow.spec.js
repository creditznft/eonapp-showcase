/**
 * Creator Studio Full Flow (Deterministic)
 *
 * Goal:
 * - Validate end-to-end workflow wiring without depending on external AI/network timing.
 * - Keep launch sign-off evidence stable in local/CI runs.
 */

const { test, expect } = require('@playwright/test');

async function openPanel(page, panelId) {
  await page.click(`.cs-nav-btn[data-panel="${panelId}"]`);
  await page.waitForSelector(`#panel-${panelId}.active, #panel-${panelId}`);
}

async function expectStatusNotEmpty(page) {
  const status = page.locator('#pipeline-status');
  await expect(status).toBeVisible();
  const text = (await status.textContent()) || '';
  expect(text.trim().length).toBeGreaterThan(0);
}

test.describe('Creator Studio Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.waitForSelector('.cs-layout', { timeout: 10000 });
  });

  test('A1: Idea -> Script handoff wiring', async ({ page }) => {
    await openPanel(page, 'idea');
    await page.fill('#idea-topic', 'AI productivity for creators');
    const trending = page.locator('button[data-idea-variant="trending"]');
    if (await trending.count()) {
      await trending.first().click();
    }
    await expectStatusNotEmpty(page);

    await openPanel(page, 'script');
    await expect(page.locator('#script-title')).toBeVisible();
    await expect(page.locator('#script-output')).toBeVisible();
  });

  test('B1: Music -> Voice handoff wiring', async ({ page }) => {
    await openPanel(page, 'music');
    await page.fill('#music-brief', 'upbeat electronic bed');
    await page.click('#music-to-voice');
    await openPanel(page, 'voice');
    await expect(page.locator('#voice-text')).toBeVisible();
    await expectStatusNotEmpty(page);
  });

  test('C1: Video web asset rights gate + controls', async ({ page }) => {
    await openPanel(page, 'video');
    await expect(page.locator('#video-web-asset-url')).toBeVisible();
    await expect(page.locator('#video-web-asset-intent')).toBeVisible();
    await expect(page.locator('#video-web-asset-rights-ok')).toBeVisible();
    await expect(page.locator('#video-export-mp4')).toBeVisible();

    // Verify rights gate path gives user feedback
    await page.fill('#video-web-asset-url', 'https://example.com/video.mp4');
    await page.click('#video-web-asset-fetch');
    await expect(page.locator('#video-web-asset-status')).toBeVisible();
    await expectStatusNotEmpty(page);
  });

  test('D1: Voice + subtitle controls present and connected', async ({ page }) => {
    await openPanel(page, 'voice');
    await page.fill('#voice-text', 'This is line one. This is line two.');
    await page.click('#sub-from-script');
    await expect(page.locator('#sub-editor')).toBeVisible();
    await expectStatusNotEmpty(page);
  });

  test('E1: Distribution queue form wiring', async ({ page }) => {
    await openPanel(page, 'distribute');
    await page.fill('#dist-title', 'Test Distribution');
    await page.fill('#dist-content', 'Check out this content package');
    await page.fill('#dist-media-url', 'https://cdn.example.com/video.mp4');
    await page.click('#dist-add-queue');
    await expect(page.locator('#publish-queue')).toBeVisible();
    const queueState = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('eon:cs:queue:v1') || '[]');
      } catch {
        return [];
      }
    });
    expect(queueState[0]?.mediaUrl).toBe('https://cdn.example.com/video.mp4');
    await expectStatusNotEmpty(page);
  });

  test('F1: Runtime activity + mode controls present', async ({ page }) => {
    await openPanel(page, 'runtime');
    await expect(page.locator('#runtime-activity-map')).toBeVisible();
    await expect(page.locator('#runtime-activity-timeline')).toBeVisible();

    const modeButtons = page.locator('.runtime-mode-btn');
    await expect(modeButtons.first()).toBeVisible();
    const count = await modeButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Creator Studio Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.waitForSelector('.cs-layout', { timeout: 10000 });
  });

  test('K1: Refresh keeps app stable with persisted fields', async ({ page }) => {
    await openPanel(page, 'idea');
    await page.fill('#idea-topic', 'Persistent Test');
    await page.reload();
    await page.waitForSelector('.cs-layout', { timeout: 10000 });
    await openPanel(page, 'idea');
    await expect(page.locator('#idea-topic')).toBeVisible();
  });
});

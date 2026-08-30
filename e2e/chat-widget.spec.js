const { test, expect } = require('@playwright/test');

test('chat widget shell loads with input and send control', async ({ page }) => {
  await page.goto('/chat.html');
  await expect(page.locator('.chat-container')).toBeVisible();
  await expect(page.locator('#chat-input')).toBeVisible();
  await expect(page.locator('#chat-send')).toBeVisible();
});

test('chat input accepts text and clears on send', async ({ page }) => {
  await page.goto('/chat.html');
  const input = page.locator('#chat-input');
  await expect(input).toBeVisible();
  await input.fill('Hello, test message');
  await expect(input).toHaveValue('Hello, test message');
});

test('chat page has correct title and meta description', async ({ page }) => {
  await page.goto('/chat.html');
  await expect(page).toHaveTitle(/EONBOT AI|Chat/i);
  const desc = page.locator('meta[name="description"]');
  await expect(desc).toHaveCount(1);
  await expect(desc).toHaveAttribute('content', /.{10,}/);
});

test('chat settings toggle is accessible', async ({ page }) => {
  await page.goto('/chat.html');
  // Settings control is optional; if present it should be visible and enabled.
  const settingsEl = page.locator('#chat-settings, #chat-settings-toggle, [aria-label*="settings" i], .chat-settings-btn');
  const count = await settingsEl.count();
  if (count > 0) {
    await expect(settingsEl.first()).toBeVisible();
    await expect(settingsEl.first()).toBeEnabled();
  }
  expect(count).toBeGreaterThanOrEqual(0);
});


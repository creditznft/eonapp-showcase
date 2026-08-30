const { test, expect } = require('@playwright/test');

const cases = [
  {
    locale: 'ja',
    prompt: '報酬はどうやって獲得できますか？'
  },
  {
    locale: 'es',
    prompt: '¿Cómo gano recompensas?'
  }
];

async function setGuideLocale(page, locale) {
  await page.addInitScript(({ code }) => {
    localStorage.setItem('eon:lang:preference:v1', code);
    localStorage.setItem('eon:lang:v1', code);
    localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
      mode: 'guide',
      provider: 'guide',
      model: '',
      endpoint: '',
      persistApiKey: false,
      systemPrompt: ''
    }));
  }, { code: locale });
}

async function sendPrompt(page, prompt) {
  const input = page.locator('#chat-input');
  await expect(input).toBeVisible();
  await input.fill(prompt);
  await input.press('Enter');
  await expect(page.locator('.msg-row.user').last()).toContainText(prompt);
  await expect(page.locator('#typing-row')).toHaveCount(0, { timeout: 15000 });
}

test('multilingual guide prompts route to the Vault / Pool Points path', async ({ page }) => {
  for (const { locale, prompt } of cases) {
    await setGuideLocale(page, locale);
    await page.goto('/chat.html');
    await page.waitForSelector('#chat-messages', { timeout: 15000 });

    const initialBotCount = await page.locator('.msg-row.bot').count();
    await sendPrompt(page, prompt);

    await expect.poll(async () => page.locator('.msg-row.bot').count(), { timeout: 15000 }).toBeGreaterThan(initialBotCount);

    const latestBot = page.locator('.msg-row.bot').last();
    await expect(latestBot.locator('.msg-tool-cta')).toHaveAttribute('href', /\/vault$/);
    await expect(latestBot).not.toContainText(/I'm the site guide|not a general AI|ask me about tools/i);
  }
});

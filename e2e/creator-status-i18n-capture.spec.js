const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'docs', 'qa', 'launch-signoff', 'screenshots');

function ensureOutDir() {
  fs.mkdirSync(outDir, { recursive: true });
}

async function setLocale(page, locale) {
  await page.addInitScript((loc) => {
    try {
      localStorage.setItem('eon:lang:preference:v1', loc);
      localStorage.setItem('eon:lang:v1', loc);
      localStorage.setItem('eon:chat-widget-open', '0');
    } catch {}
  }, locale);
}

async function dismissChatOverlay(page) {
  const close = page.locator('[data-chat-close], .chat-widget-close, .ew-close, [aria-label="Close chat"]').first();
  if (await close.count()) {
    try {
      await close.click({ force: true, timeout: 1500 });
    } catch {}
  }
  await page.evaluate(() => {
    const panel = document.querySelector('#eon-widget-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('open');
      panel.setAttribute('hidden', '');
    }
  });
}

async function captureStatus(page, fileName) {
  const status = page.locator('#pipeline-status');
  await expect(status).toBeVisible();
  await status.screenshot({ path: path.join(outDir, fileName) });
}

async function openPanel(page, panelId) {
  await page.locator(`.cs-nav-btn[data-panel="${panelId}"]`).first().evaluate((el) => el.click());
  await page.waitForSelector(`#panel-${panelId}.active, #panel-${panelId}`);
}

test('capture creator status localization evidence (de/ar)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Capture suite is chromium-only for stable screenshot evidence.');
  ensureOutDir();
  const stamp = new Date().toISOString().slice(0, 10);

  for (const locale of ['en', 'de', 'ar']) {
    await setLocale(page, locale);
    await page.goto('/create');
    await page.waitForSelector('.cs-layout', { timeout: 10000 });
    await dismissChatOverlay(page);

    await openPanel(page, 'idea');
    await page.fill('#idea-topic', `Localization smoke ${locale}`);
    await page.waitForTimeout(450);
    await captureStatus(page, `creator-status-idea-${locale}-${browserName}-${stamp}.png`);

    await openPanel(page, 'music');
    await page.fill('#music-brief', `music brief ${locale}`);
    await page.click('#music-to-voice');
    await page.waitForTimeout(450);
    await captureStatus(page, `creator-status-music-voice-${locale}-${browserName}-${stamp}.png`);

    await openPanel(page, 'voice');
    await page.fill('#voice-text', `voice line ${locale}`);
    await page.click('#sub-from-script');
    await page.waitForTimeout(450);
    await captureStatus(page, `creator-status-voice-${locale}-${browserName}-${stamp}.png`);
  }
});

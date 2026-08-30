const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const langs = ['en', 'de', 'ar', 'ja', 'hi', 'es'];
const outDir = path.join(process.cwd(), 'docs', 'qa', 'i18n-voice-screenshots');
const runId = `${Date.now()}-${process.pid}`;

function ensureDir() {
  fs.mkdirSync(outDir, { recursive: true });
}

test('chat exposes CSP-safe DI APIs and multilingual voice diagnostics', async ({ page }) => {
  ensureDir();

  for (const lang of langs) {
    await page.addInitScript(({ code }) => {
      localStorage.setItem('eon:lang:preference:v1', code);
      localStorage.setItem('eon:lang:v1', code);
    }, { code: lang });

    await page.goto('/chat.html');
    await page.waitForSelector('#chat-messages', { timeout: 15000 });

    const result = await page.evaluate(async ({ code }) => {
      const win = /** @type {any} */ (window);
      const apisReady = typeof win.getAvailableModelsForChat === 'function'
        && typeof win.getModelRegistryForChat === 'function'
        && typeof win.getChatModelQuote === 'function';

      if (!win.ChatVoiceEvidence?.captureVoiceDiagnostics) {
        return { ok: false, reason: 'ChatVoiceEvidence missing', apisReady };
      }

      const report = win.ChatVoiceEvidence.captureVoiceDiagnostics([code]);
      const latest = win.ChatVoiceEvidence.getLatestVoiceDiagnostics();
      const entry = Array.isArray(report?.entries) ? report.entries[0] : null;

      const hasVoiceShape = Boolean(entry)
        && typeof entry.language === 'string'
        && typeof entry.resolvedLocale === 'string'
        && Array.isArray(entry.candidates)
        && typeof entry.recognitionSupported === 'boolean'
        && typeof entry.synthesisSupported === 'boolean';

      return {
        ok: apisReady && hasVoiceShape,
        reason: !apisReady ? 'chat DI APIs missing' : (hasVoiceShape ? 'ok' : 'invalid voice diagnostics shape'),
        apisReady,
        entry,
        latestGeneratedAt: latest?.generatedAt || null
      };
    }, { code: lang });

    expect(result.ok, `${lang}: ${result.reason}`).toBeTruthy();

    const shotPath = path.join(outDir, `chat_${lang}_voice_${runId}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
  }
});

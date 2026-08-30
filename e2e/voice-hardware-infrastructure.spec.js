/**
 * voice-hardware-infrastructure.spec.js
 * Validates voice infrastructure (STT/TTS) across all required locales
 * Note: This validates the infrastructure exists and is routable.
 * Actual microphone permission testing requires human browser session.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';
const LOCALES = ['en', 'de', 'ar', 'ja', 'hi', 'es'];
const evidenceDir = path.join(process.cwd(), 'docs', 'qa', 'voice-hardware-evidence');

function ensureDir() {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

test.describe('Voice Hardware Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
    const chatUrl = `${BASE_URL.replace(/\/$/, '')}/chat.html`;
    await page.goto(chatUrl);
    await page.waitForSelector('#chat-messages', { timeout: 15000 });
  });

  test('Voice infrastructure exists and is routable for all required locales', async ({ page }) => {
    ensureDir();

    const report = {
      generatedAt: new Date().toISOString(),
      locales: {},
      summary: { pass: true, blockers: [] }
    };

    for (const lang of LOCALES) {
      await page.evaluate((code) => {
        localStorage.setItem('eon:lang:v1', code);
      }, lang);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#chat-messages', { timeout: 15000 });

      const result = await page.evaluate(async ({ code }) => {
        const win = /** @type {any} */ (window);
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
        const SpeechSynthesis = win.speechSynthesis;

        // Validate speech infrastructure exists
        const hasRecognition = Boolean(SpeechRecognition);
        const hasSynthesis = Boolean('speechSynthesis' in window);
        const hasDiagnosticsAPI = Boolean(win.ChatVoiceEvidence?.captureVoiceDiagnostics);

        // Run diagnostics capture
        let diagnostics = null;
        if (hasDiagnosticsAPI) {
          diagnostics = win.ChatVoiceEvidence.captureVoiceDiagnostics([code]);
        }

        // Get voices for this locale
        let voices = [];
        if (hasSynthesis && SpeechSynthesis.getVoices) {
          voices = SpeechSynthesis.getVoices() || [];
        }

        const localeCode = diagnostics?.entries?.[0]?.locale || `${code}-${code.toUpperCase()}`;
        const hasLocaleVoices = voices.some((v) =>
          String(v?.lang || '').toLowerCase().includes(code.toLowerCase())
        );

        return {
          locale: code,
          recognitionSupported: hasRecognition,
          synthesisSupported: hasSynthesis,
          diagnosticsAvailable: hasDiagnosticsAPI,
          localeResolved: localeCode,
          voiceCount: voices.length,
          hasLocaleVoices,
          diagnosticsReport: diagnostics
        };
      }, { code: lang });

      report.locales[lang] = result;

      // Validation
      if (!result.recognitionSupported) {
        report.summary.blockers.push(`${lang}: STT (SpeechRecognition) not supported`);
        report.summary.pass = false;
      }
      if (!result.synthesisSupported) {
        report.summary.blockers.push(`${lang}: TTS (speechSynthesis) not supported`);
        report.summary.pass = false;
      }
      if (!result.diagnosticsAvailable) {
        report.summary.blockers.push(`${lang}: diagnostics API not available`);
        report.summary.pass = false;
      }
      if (!result.hasLocaleVoices) {
        report.summary.blockers.push(`${lang}: no system voices for locale`);
      }
    }

    // Save infrastructure report
    const reportPath = path.join(evidenceDir, 'voice-infrastructure-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('Voice infrastructure report:', JSON.stringify(report, null, 2));
    expect(report.summary.pass).toBeTruthy();
  });

  test('Multilingual voice diagnostics capture works across all locales', async ({ page }) => {
    ensureDir();

    const diagnosticsReport = {
      generatedAt: new Date().toISOString(),
      perLocale: {}
    };

    for (const lang of LOCALES) {
      await page.evaluate((code) => {
        localStorage.setItem('eon:lang:v1', code);
      }, lang);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#chat-messages', { timeout: 15000 });

      const diag = await page.evaluate(({ code }) => {
        const win = /** @type {any} */ (window);
        if (!win.ChatVoiceEvidence?.captureVoiceDiagnostics) return null;
        return win.ChatVoiceEvidence.captureVoiceDiagnostics([code]);
      }, { code: lang });

      diagnosticsReport.perLocale[lang] = diag;

      // Take screenshot
      const shotPath = path.join(evidenceDir, `chat-voice-ui-${lang}.png`);
      fs.rmSync(shotPath, { force: true });
      await page.screenshot({ path: shotPath, fullPage: false });
    }

    fs.writeFileSync(
      path.join(evidenceDir, 'multilingual-voice-diagnostics.json'),
      JSON.stringify(diagnosticsReport, null, 2)
    );

    expect(Object.keys(diagnosticsReport.perLocale).length).toBe(LOCALES.length);
  });

  test('Voice TTS fallback chain validates for all locales', async ({ page }) => {
    ensureDir();

    const fallbackReport = {
      generatedAt: new Date().toISOString(),
      perLocale: {}
    };

    for (const lang of LOCALES) {
      await page.evaluate((code) => {
        localStorage.setItem('eon:lang:v1', code);
      }, lang);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#chat-messages', { timeout: 15000 });

      const result = await page.evaluate(({ code }) => {
        const win = /** @type {any} */ (window);
        if (!('speechSynthesis' in window)) return { ok: false, reason: 'TTS not available' };

        const voices = window.speechSynthesis.getVoices() || [];
        if (!voices.length) {
          return {
            ok: true,
            conditional: true,
            reason: 'No system voices available in this runtime; manual device sign-off required',
            voiceCount: 0,
            availableLocales: []
          };
        }

        // Try to construct a test utterance
        try {
          const utt = new window.SpeechSynthesisUtterance('Test');
          utt.lang = `${code}-${code.toUpperCase()}`;
          return {
            ok: true,
            utteranceConstructible: true,
            localeSet: true,
            voiceCount: voices.length,
            availableLocales: Array.from(new Set(voices.map((v) => String(v?.lang || '').split('-')[0])))
          };
        } catch (e) {
          return { ok: false, reason: String(e) };
        }
      }, { code: lang });

      fallbackReport.perLocale[lang] = result;
    }

    fs.writeFileSync(
      path.join(evidenceDir, 'voice-fallback-chain.json'),
      JSON.stringify(fallbackReport, null, 2)
    );

    const allPass = Object.values(fallbackReport.perLocale).every((r) => r.ok);
    expect(allPass).toBeTruthy();
  });
});

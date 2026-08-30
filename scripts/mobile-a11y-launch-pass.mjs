#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = 'http://localhost:5173';
const outDir = join(process.cwd(), 'docs', 'qa', 'launch-signoff');
mkdirSync(outDir, { recursive: true });

const pages = [
  '/build',
  '/vault',
  '/trade',
  '/realm',
  '/chat.html',
  '/create',
  '/eon-browser.html',
  '/marketplace.html'
];

async function analyzePage(page, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const activeBottom = document.querySelectorAll('.eon-bottom-nav-item.active').length;
    const bottomCount = document.querySelectorAll('.eon-bottom-nav-item').length;
    const ariaCurrentCount = document.querySelectorAll('.eon-bottom-nav-item[aria-current="page"]').length;
    const skipLink = Boolean(document.querySelector('.skip-to-content, a[href="#main"]'));

    const focusable = Array.from(document.querySelectorAll('a,button,input,textarea,select,[tabindex]'));
    const hiddenFocusables = focusable.filter((el) => {
      const style = window.getComputedStyle(el);
      const tabIndex = Number(el.getAttribute('tabindex') || (/** @type {any} */ (el)).tabIndex || 0);
      return tabIndex >= 0 && style.display !== 'none' && style.visibility !== 'hidden' && el.getAttribute('aria-hidden') === 'true';
    }).length;

    const missingButtonLabels = Array.from(document.querySelectorAll('button')).filter((btn) => {
      const style = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      if (!visible || btn.disabled || btn.getAttribute('aria-hidden') === 'true') return false;
      const text = String(btn.textContent || '').trim();
      const label = String(btn.getAttribute('aria-label') || '').trim();
      return !text && !label;
    }).length;

    const imagesMissingAlt = Array.from(document.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt')).length;

    return {
      activeBottom,
      bottomCount,
      ariaCurrentCount,
      skipLink,
      hiddenFocusables,
      missingButtonLabels,
      imagesMissingAlt
    };
  });

  // Quick keyboard focus traversal sanity on mobile viewport.
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => String(document.activeElement?.tagName || 'none').toLowerCase());

  return {
    path,
    ...result,
    focusedTag,
    pass: result.bottomCount === 0 ? true : (result.activeBottom === 1 && result.ariaCurrentCount === 1),
    a11yWarnings: [
      result.skipLink ? null : 'skip-link-missing',
      result.hiddenFocusables > 0 ? `hidden-focusables:${result.hiddenFocusables}` : null,
      result.missingButtonLabels > 0 ? `button-labels-missing:${result.missingButtonLabels}` : null,
      result.imagesMissingAlt > 0 ? `img-alt-missing:${result.imagesMissingAlt}` : null
    ].filter(Boolean)
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const results = [];
  for (const path of pages) {
    results.push(await analyzePage(page, path));
  }

  await context.close();
  await browser.close();

  const blockers = results.filter((r) => !r.pass).map((r) => `${r.path}: bottom-nav active/aria mismatch`);
  const warnings = results.flatMap((r) => r.a11yWarnings.map((w) => `${r.path}: ${w}`));

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    viewport: { width: 390, height: 844 },
    results,
    summary: {
      pass: blockers.length === 0,
      blockers,
      warnings
    }
  };

  const outPath = join(outDir, 'mobile-a11y-launch-pass.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[mobile-a11y] wrote ${outPath}`);

  if (blockers.length) process.exit(1);
}

main().catch((err) => {
  console.error('[mobile-a11y] failed:', err?.message || err);
  process.exit(1);
});

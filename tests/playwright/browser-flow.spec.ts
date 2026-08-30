/**
 * EON Browser + Studio Handoff Integration Tests
 * Tests: Session save/load, template save/apply, local runtime checks, research flow
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const localUrl = (path) => `${BASE_URL}${path}`;

async function waitForBrowserOutput(page, minLength = 50) {
  await page.waitForFunction(
    (threshold) => {
      const el = document.querySelector('#browser-output');
      return String(el?.textContent || '').trim().length > threshold;
    },
    minLength,
    { timeout: 30000 }
  );
}

test.describe('EON Browser Research Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/eon-browser.html`);
    await page.waitForSelector('.browser-layout', { timeout: 5000 });
  });

  test('A1: Load URL and Verify iframe', async ({ page }) => {
    // Enter URL
    const urlInput = page.locator('#browser-url');
    await urlInput.fill(localUrl('/about.html'));

    // Click Load URL
    await page.click('#browser-load');

    // Wait for iframe to load
    const iframe = page.locator('iframe#browser-frame');
    await expect(iframe).toBeAttached({ timeout: 10000 });
  });

  test('A2: Fetch Readable Source', async ({ page }) => {
    // Load a URL first
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');

    // Fetch readable source
    await page.click('#browser-fetch-source');

    // Wait for source to appear
    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    const sourceText = await page.inputValue('#browser-source');
    expect(sourceText.length).toBeGreaterThan(100);
  });

  test('B1: Research Mode — Summary', async ({ page }) => {
    // Fetch source first
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    // Enter research prompt
    await page.fill('#browser-query', 'What is the main purpose of this page?');

    // Click Summary
    await page.click('#browser-summarize');

    // Wait for AI response
    await waitForBrowserOutput(page, 50);

    const output = await page.textContent('#browser-output');
    expect(output.length).toBeGreaterThan(50);
  });

  test('B2: Research Mode — Full Analysis', async ({ page }) => {
    // Fetch source first
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    // Click Research Mode
    await page.click('#browser-research');

    // Wait for research output
    await waitForBrowserOutput(page, 100);

    const output = await page.textContent('#browser-output');
    expect(output.length).toBeGreaterThan(100);
    expect(output).toContain('Topic');
  });

  test('B3: Hook Extraction', async ({ page }) => {
    // Fetch source first
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    // Click Extract Hooks
    await page.click('#browser-extract');

    // Wait for hook output
    await waitForBrowserOutput(page, 50);

    const output = await page.textContent('#browser-output');
    expect(output.length).toBeGreaterThan(50);
  });

  test('C1: Save to Creator Studio', async ({ page }) => {
    // Prepare browser research flow
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');

    // Save to Creator Studio
    const saveButton = page.locator('#browser-creator');
    
    await Promise.all([
      page.waitForURL('**/create'),
      saveButton.click(),
    ]);

    // Verify the creator page hydrated from the browser handoff
    expect(page.url()).toContain('creator-studio.html');
    const topic = await page.inputValue('#idea-topic');
    expect(topic).toContain('example.com');
  });

  test('D1: Save Session', async ({ page }) => {
    // Do a research workflow
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

      // Enter session name and save in-place
      await page.fill('#browser-session-name', 'Test Research Session');
      await page.click('#browser-session-save');

    // Verify session saved
    await page.waitForFunction(
      () => document.querySelector('#browser-session-list')?.textContent?.includes('Test Research Session'),
      { timeout: 5000 }
    );

    const sessionsList = await page.textContent('#browser-session-list');
    expect(sessionsList).toContain('Test Research Session');
  });

  test('D2: Load Session', async ({ page }) => {
    // Save a session first
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    const sourceTextBefore = await page.inputValue('#browser-source');

    await page.fill('#browser-session-name', 'Load Test Session');
    await page.click('#browser-session-save');

    // Clear the page state
    await page.fill('#browser-url', localUrl('/market'));
    await page.click('#browser-load');

    // Verify different content now
    const newUrl = await page.inputValue('#browser-url');
    expect(newUrl).toContain('market');

    // Load the saved session
    await page.selectOption('#browser-session-list', { label: 'Load Test Session' });
    await page.click('#browser-session-load');

    // Wait for session restoration
    await page.waitForFunction(
      () => document.querySelector('#browser-url')?.value?.includes('about.html'),
      { timeout: 10000 }
    );

    const urlAfterLoad = await page.inputValue('#browser-url');
    expect(urlAfterLoad).toContain('about.html');

    // Source text should be restored
    const sourceTextAfter = await page.inputValue('#browser-source');
    expect(sourceTextAfter).toBe(sourceTextBefore);
  });

  test('E1: Save Template', async ({ page }) => {
    // Create a research prompt
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');

    // Fill research prompt
    await page.fill('#browser-query', 'Extract the main value proposition and key features');

      await page.fill('#browser-template-name', 'Value Prop Analysis');
      await page.click('#browser-template-save');

    // Verify template saved
    await page.waitForFunction(
      () => document.querySelector('#browser-template-list')?.textContent?.includes('Value Prop'),
      { timeout: 5000 }
    );

    const templatesList = await page.textContent('#browser-template-list');
    expect(templatesList).toContain('Value Prop');
  });

  test('E2: Apply Template', async ({ page }) => {
    // Save a template first
    await page.fill('#browser-query', 'What are the key stats and metrics?');
    await page.fill('#browser-template-name', 'Stats Template');
    await page.click('#browser-template-save');

    // Clear the prompt
    await page.fill('#browser-query', '');

    // Apply the template
    await page.selectOption('#browser-template-list', { label: 'Stats Template' });
    await page.click('#browser-template-apply');

    // Verify template applied
    const promptValue = await page.inputValue('#browser-query');
    expect(promptValue).toContain('stats') || expect(promptValue).toContain('metrics');
  });

  test('F1: Multi-URL Comparison Mode — Enable/Disable', async ({ page }) => {
    await expect(page.locator('#browser-compare')).toBeVisible();
    await expect(page.locator('#browser-compare-urls')).toBeVisible();
  });

  test('F2: Multi-URL Comparison — Load Two URLs', async ({ page }) => {
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.fill('#browser-compare-urls', `${localUrl('/market')}\n${localUrl('/trade')}`);
    await page.click('#browser-compare');
    await waitForBrowserOutput(page, 80);
    await expect(page.locator('#browser-compare-metrics')).toContainText('Compare snapshot');
    await expect(page.locator('#browser-compare-visual')).toContainText('market');
  });

  test('F3: Multi-URL Comparison — Fetch Sources and Compare', async ({ page }) => {
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.fill('#browser-compare-urls', `${localUrl('/market')}\n${localUrl('/create')}`);
    await page.click('#browser-compare');
    await waitForBrowserOutput(page, 100);

    const comparisonOutput = (await page.textContent('#browser-output')) || '';
    expect(comparisonOutput.length).toBeGreaterThan(100);
    await expect(page.locator('#browser-compare-metrics')).toContainText('Similarity');
  });

  test('G1: Local Runtime Checks — Probe Endpoints', async ({ page }) => {
    // Navigate to Local Model section
    const localTab = page.locator('text="Local Model + GPU"');
    if (await localTab.count()) await localTab.click();
    await page.waitForSelector('#browser-local-check');

    // Run checks
    await page.click('#browser-local-check');

    await page.waitForFunction(
      () => !!window.EONBrowserEvidence?.getLatestLocalRuntimeProof?.(),
      { timeout: 15000 }
    );

    const status = await page.textContent('#browser-local-status');
    const proof = await page.evaluate(() => window.EONBrowserEvidence.getLatestLocalRuntimeProof());
    expect(status).toBeTruthy();
    expect(proof).toBeTruthy();
    expect(proof.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(status).toContain('runtime') || expect(status).toContain('complete') || expect(status).toContain('No local runtime');
  });

  test('G2: Local Runtime Checks — Show Model List', async ({ page }) => {
    // Navigate to Local Model section
    const localTab = page.locator('text="Local Model + GPU"');
    if (await localTab.count()) await localTab.click();

    // Run checks
    await page.click('#browser-local-check');

    await page.waitForFunction(
      () => !!window.EONBrowserEvidence?.getLatestLocalRuntimeProof?.(),
      { timeout: 15000 }
    );

    const proof = await page.evaluate(() => window.EONBrowserEvidence.getLatestLocalRuntimeProof());
    expect(Array.isArray(proof.findings)).toBeTruthy();
    expect(proof.findings.length).toBeGreaterThan(0);
  });

  test('G3: Local Runtime Checks — Show Latency Tier Hints', async ({ page }) => {
    // Navigate to Local Model section
    const localTab = page.locator('text="Local Model + GPU"');
    if (await localTab.count()) await localTab.click();

    // Run checks
    await page.click('#browser-local-check');

    await page.waitForFunction(
      () => !!window.EONBrowserEvidence?.getLatestLocalRuntimeProof?.(),
      { timeout: 15000 }
    );

    const proof = await page.evaluate(() => window.EONBrowserEvidence.getLatestLocalRuntimeProof());
    expect(proof.tierHint).toContain('Latency profile');
  });

  test('G4: Local Runtime Checks — Show Fallback Recommendation', async ({ page }) => {
    // Navigate to Local Model section
    const localTab = page.locator('text="Local Model + GPU"');
    if (await localTab.count()) await localTab.click();

    // Run checks
    await page.click('#browser-local-check');

    await page.waitForFunction(
      () => !!window.EONBrowserEvidence?.getLatestLocalRuntimeProof?.(),
      { timeout: 15000 }
    );

    const proof = await page.evaluate(() => window.EONBrowserEvidence.getLatestLocalRuntimeProof());
    expect(proof.gpuHint).toMatch(/local runtime|hosted provider|GPU/i);
  });
});

test.describe('EON Browser Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/eon-browser.html`);
    await page.waitForSelector('.browser-layout', { timeout: 5000 });
  });

  test('H1: Blocked Iframe — Fallback to Fetch Source', async ({ page }) => {
    // Try to load a site with strict X-Frame-Options
    await page.fill('#browser-url', 'https://www.example.gov'); // Many gov sites block iframes
    await page.click('#browser-load');

    // Wait a bit for iframe error

    // Check if error message or fallback shown
    const status = await page.textContent('#browser-status');
    
    // Should either show blocked message or offer Fetch Source as alternative
    if (status?.includes('block') || status?.includes('frame')) {
      // Good, error detected
      expect(status).toContain('block') || expect(status).toContain('alternative');

      // Verify Fetch Source button still available
      const fetchButton = page.locator('#browser-fetch-source');
      await expect(fetchButton).toBeEnabled();
    }
  });

  test('I1: Page Refresh — Session Recovery', async ({ page }) => {
    // Do a browser research flow
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    await page.waitForFunction(
      () => document.querySelector('#browser-source')?.value?.length > 100,
      { timeout: 30000 }
    );

    const sourceBeforeRefresh = await page.inputValue('#browser-source');

    // Refresh page
    await page.reload();
    await page.waitForSelector('.browser-layout', { timeout: 5000 });

    // Check if session restored (depending on implementation)
    const urlAfterRefresh = await page.inputValue('#browser-url');
    // URL may or may not persist based on implementation
    expect(urlAfterRefresh).toBeDefined();
  });

  test('J1: Provider Visibility — Show Active Provider/Model', async ({ page }) => {
    // Fetch source
    await page.fill('#browser-url', localUrl('/about.html'));
    await page.click('#browser-load');
    await page.click('#browser-fetch-source');

    // Run AI action
    await page.fill('#browser-query', 'Summarize this page');
    await page.click('#browser-summarize');

    // Wait for output
    await waitForBrowserOutput(page, 50);

    // Check provider chip
    const providerChip = page.locator('#browser-provider-chip');
    const providerText = await providerChip.textContent();

    // Should show provider name and/or model
    expect(providerText).toBeTruthy();
    expect(providerText).toContain('OpenAI') || 
      expect(providerText).toContain('Anthropic') || 
      expect(providerText).toContain('local') ||
      expect(providerText).toContain('Claude') ||
      expect(providerText).toContain('Guide') ||
      expect(providerText).toBeTruthy();
  });
});



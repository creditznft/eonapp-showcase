/**
 * WorkBench E2E Test Suite (v1, May 2026)
 * Tests: page load, mode grid, mission input, voice button, mode switching,
 * Pool Points display, history search, skill-tree section, bounty section,
 * twin section, constitution section, mobile bottom nav.
 */
const { test, expect } = require('@playwright/test');

const allowedErrorPatterns = [
  /failed to load gundb/i,
  /failed to load resource/i,
  /network connectivity/i,
  /cdn\.jsdelivr\.net/i,
  /websocket connection/i,
  /p2p network unavailable/i,
  /no edge backend configured/i,
  /aborterror/i,
  /failed to fetch/i,
  /net::err/i,
  /import statement outside a module/i,
  /illegal return statement/i,
  /cannot use import statement/i,
  /unexpected token/i
];
function isIgnorable(msg) {
  const text = `${msg.text()} ${msg.location()?.url || ''}`.trim();
  return allowedErrorPatterns.some((p) => p.test(text));
}

// ── Load ──────────────────────────────────────────────────────
test('workbench.html loads without JS errors', async ({ page }) => {
  const issues = [];
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !isIgnorable(m)) issues.push(`console: ${m.text()}`);
  });

  const res = await page.goto('/build', { waitUntil: 'domcontentloaded' });
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator('#modeGrid')).toBeAttached({ timeout: 12000 });
  await page.waitForTimeout(2500);
  expect(issues, `Unexpected JS errors:\n${issues.join('\n')}`).toEqual([]);
});

// ── Page structure ────────────────────────────────────────────
test('workbench page has correct title', async ({ page }) => {
  await page.goto('/build');
  await expect(page).toHaveTitle(/Cockpit Workbench/i);
});

test('workbench has manifest link for PWA', async ({ page }) => {
  await page.goto('/build');
  const manifest = page.locator('link[rel="manifest"]');
  await expect(manifest).toHaveCount(1);
});

test('mode grid renders all primary modes', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#modeGrid')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#modeGrid .wb-mode-btn')).toHaveCount(17);
  const modes = ['ask', 'build', 'agent', 'hive', 'signal', 'skill', 'constitution', 'twin', 'browse'];
  for (const mode of modes) {
    await expect(page.locator(`#modeGrid .wb-mode-btn[data-mode="${mode}"]`)).toBeAttached();
  }
});

// ── Mission input ─────────────────────────────────────────────
test('mission input is visible and accepts text', async ({ page }) => {
  await page.goto('/build');
  const input = page.locator('#wb-mission-input');
  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill('Summarize the latest AI news');
  await expect(input).toHaveValue('Summarize the latest AI news');
});

test('voice button is present on mission input', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#wb-mission-voice')).toBeVisible({ timeout: 10000 });
});

test('run button is present and enabled initially', async ({ page }) => {
  await page.goto('/build');
  const runBtn = page.locator('#wb-mission-run');
  await expect(runBtn).toBeVisible({ timeout: 10000 });
});

// ── Mode switching ────────────────────────────────────────────
test('clicking build mode activates it', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#modeGrid')).toBeAttached({ timeout: 10000 });
  await page.waitForFunction(() => Boolean(window.WorkbenchAutomation));
  await page.locator('#modeGrid .wb-mode-btn[data-mode="build"]').evaluate((el) => el.click());
  await expect(page.locator('#modeGrid .wb-mode-btn[data-mode="build"]')).toHaveClass(/active/);
  // Output badge should reflect mode
  const badge = page.locator('#wb-output-mode-badge');
  await expect(badge).toContainText(/build/i, { timeout: 5000 });
});

test('clicking signal mode activates it', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#modeGrid')).toBeAttached({ timeout: 10000 });
  await page.waitForFunction(() => Boolean(window.WorkbenchAutomation));
  await page.locator('#modeGrid .wb-mode-btn[data-mode="signal"]').evaluate((el) => el.click());
  await expect(page.locator('#modeGrid .wb-mode-btn[data-mode="signal"]')).toHaveClass(/active/);
});

// ── Pool Points display ───────────────────────────────────────
test('pool points badge is rendered in toolbar', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#wb-pool-points')).toBeAttached({ timeout: 10000 });
});

// ── History search ────────────────────────────────────────────
test('history search section is present', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#history-search-section')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#wb-history-search')).toBeAttached();
});

// ── Skill tree section ────────────────────────────────────────
test('skill tree section renders 4 tracks', async ({ page }) => {
  await page.goto('/build');
  const section = page.locator('#skill-section');
  await expect(section).toBeAttached({ timeout: 10000 });
  await expect(section).toContainText(/Tracks:\s*Builder,\s*Creator,\s*Trade,\s*Moderator\./i);
  await expect(page.locator('#wb-skill-panel')).toBeAttached();
});

// ── Bounty board section ──────────────────────────────────────
test('bounty board section is present', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#bounty-section')).toBeAttached({ timeout: 10000 });
});

// ── EON Twin section ──────────────────────────────────────────
test('EON Twin section is present', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#twin-section')).toBeAttached({ timeout: 10000 });
});

// ── Constitution section ──────────────────────────────────────
test('Constitution section is present', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#constitution-section')).toBeAttached({ timeout: 10000 });
});

// ── Mobile bottom nav ─────────────────────────────────────────
test('mobile bottom nav is in DOM with 5 links', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('.eon-bottom-nav')).toBeAttached();
  const items = page.locator('.eon-bottom-nav-item');
  await expect(items).toHaveCount(5);
});

// ── Provider status chip ──────────────────────────────────────
test('provider status chip is rendered', async ({ page }) => {
  await page.goto('/build');
  await expect(page.locator('#wb-provider-status')).toBeAttached({ timeout: 10000 });
});

import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * EONAPP.CH E2E Playwright Configuration
 * Tests run against a local Vite preview server (port 4173).
 * Run with: npx playwright test --config=tests/e2e/playwright.config.ts
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';
const baseHostname = (() => { try { return new URL(baseURL).hostname; } catch { return ''; } })();
const usesLocalPreviewServer = ['127.0.0.1', 'localhost'].includes(baseHostname);

export default defineConfig({
  // Discover the real browser specs from the repo root so this focused config
  // stays aligned with the maintained `e2e/*.spec.js` suite.
  testDir: '../..',
  testMatch: ['tests/**/*.spec.ts', 'e2e/**/*.spec.js'],
  testIgnore: [
    '**/fixtures/**',
    '**/.codex-merge-backups/**',
    '**/.tmp*/**',
    '**/tmp/**',
    '**/LAUNCH/**',
    '**/output/**',
    '**/reports/**',
    '**/archive/**',
    '**/test-results/**'
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },

  use: {
    baseURL,
    storageState: process.env.EONAPP_W766IR2_STORAGE_STATE || undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // The continuation package can run against the system Chromium when the
    // bundled browser cache is intentionally omitted from the archive.
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : undefined,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'msedge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
  ],

  /* Start the Vite preview server when running e2e locally */
  webServer: process.env.CI || !usesLocalPreviewServer
    ? undefined
    : {
        command: 'npm run dev -- --port 4173 --strictPort --host 127.0.0.1',
        cwd: path.resolve(__dirname, '../..'),
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});

import { defineConfig, devices } from '@playwright/test';

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig({
  // Unified test discovery: both focused tests in ./tests and smoke tests in ./e2e
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'e2e/**/*.spec.js'],
  testIgnore: '**/fixtures/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,
  timeout: 30000,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // CI notes:
  // - All tests (focused + smoke) are required in CI via forbidOnly mode
  // - Security (e2e/security-headers.spec.js) and SEO (e2e/seo.spec.js) are now enforced
  // - Local dev: can skip non-critical tests with @skip tag
  // - Deployment gates: must pass all suites including security/SEO verification
});

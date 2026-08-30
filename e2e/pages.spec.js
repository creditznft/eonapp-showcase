/**
 * Pages smoke-test E2E suite — updated for WorkBench-first architecture (May 2026).
 * Tests that all primary pages load without JS errors.
 */
const { test, expect } = require('@playwright/test');

const pages = [
  { name: 'index',          path: '/',                    ready: 'main, .hero' },
  { name: 'workbench',      path: '/build',      ready: 'main, #modeGrid' },
  { name: 'creator-studio', path: '/create', ready: 'main' },
  { name: 'signal',         path: '/trade',         ready: 'main, #sg-ticker-bar' },
  { name: 'vault',          path: '/vault',          ready: 'main, #vault-profile' },
  { name: 'realm',          path: '/realm',          ready: 'main, .rl-view-toggle-bar' },
  { name: 'chat',           path: '/chat.html',           ready: 'main, .chat-container, #chat-messages' },
  { name: 'market',         path: '/market',         ready: 'main' },
  { name: 'marketplace',    path: '/marketplace.html',    ready: 'main' },
  { name: 'about',          path: '/about.html',          ready: 'main, .policy-layout' },
  { name: 'onboarding',     path: '/onboarding.html',     ready: 'main' },
  { name: 'get-free-ai',    path: '/get-free-ai-power.html', ready: 'main' }
];

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
  /refused to connect because it violates the document's content security policy/i,
  /coingecko\.com/i,
  /access-control-allow-origin/i,
  /blocked by cors policy/i,
  /due to access control checks/i,
  /api\.kucoin\.com/i,
  /api\.mexc\.com/i,
  /api\.gateio\.ws/i,
  /eonapp\.ch\/(healthz|robots\.txt|favicon\.ico)/i,
  /arweave\.net/i,
  /arweave\.live/i,
  /ar-io\.net/i,
  /polygon-bor-rpc\.publicnode\.com/i,
  /connect-src 'self'/i,
  /violates the following content security policy directive/i,
  /refused to apply a stylesheet/i,
  /style-src directive of the content security policy/i,
  /refused to execute a script/i,
  /script-src directive of the content security policy/i,
  /localhost:11434/i,
  /localhost:1234/i,
  /localhost:1337/i,
];

function isIgnorableConsoleMessage(message) {
  const text = `${message.text()} ${message.location()?.url || ''}`.trim();
  return allowedErrorPatterns.some((pattern) => pattern.test(text));
}

async function collectPageIssues(page) {
  const issues = [];
  page.on('pageerror', (error) => {
    const text = String(error?.message || '');
    if (allowedErrorPatterns.some((pattern) => pattern.test(text))) return;
    issues.push(`pageerror: ${text}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (isIgnorableConsoleMessage(message)) return;
    issues.push(`console: ${message.text()}`);
  });
  return issues;
}

for (const sitePage of pages) {
  test(`${sitePage.name} loads without unexpected JS errors`, async ({ page }) => {
    const issues = await collectPageIssues(page);
    const response = await page.goto(sitePage.path, { waitUntil: 'domcontentloaded' });

    expect(response?.ok(), `Failed loading ${sitePage.path}`).toBeTruthy();
    await page.waitForSelector(sitePage.ready, { timeout: 12000 });
    expect(issues, `Unexpected errors on ${sitePage.path}:\n${issues.join('\n')}`).toEqual([]);
  });
}

// ── SEO: every primary page should have a title and description ──
const seoPages = [
  '/build', '/vault', '/chat.html'
];
for (const path of seoPages) {
  test(`${path} has meta title and description`, async ({ page }) => {
    await page.goto(path);
    const title = await page.title();
    expect(title.length, `Title too short on ${path}`).toBeGreaterThan(5);
    const desc = await page.$eval('meta[name="description"]', (el) => el.content).catch(() => '');
    expect(desc.length, `Missing description on ${path}`).toBeGreaterThan(20);
  });
}

// ── PWA: manifest linked on core pages ───────────────────────────
const pwaCorePages = ['/build', '/vault'];
for (const path of pwaCorePages) {
  test(`${path} links to PWA manifest`, async ({ page }) => {
    await page.goto(path);
    const manifest = await page.$eval('link[rel="manifest"]', (el) => el.getAttribute('href')).catch(() => null);
    expect(manifest, `Missing manifest on ${path}`).toBeTruthy();
  });
}

// ── Canonical URL present on all indexable pages ─────────────────
const canonicalPages = ['/build', '/vault'];
for (const path of canonicalPages) {
  test(`${path} has canonical link tag`, async ({ page }) => {
    await page.goto(path);
    const canonical = await page.$eval('link[rel="canonical"]', (el) => el.getAttribute('href')).catch(() => null);
    expect(canonical, `Missing canonical on ${path}`).toBeTruthy();
    expect(canonical).toMatch(/^https:\/\/eonapp\.ch/);
  });
}

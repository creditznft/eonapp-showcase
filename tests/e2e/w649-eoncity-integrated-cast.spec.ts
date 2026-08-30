import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

declare const process: { env: Record<string, string | undefined> };

const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();
const HEAVY_REQUEST = /(?:\.glb(?:\?|$)|meshopt_decoder|eon-city-runtime-owner|eon-city-play-babylon|city\/w649\/|\.(?:mp3|ogg|wav)(?:\?|$))/i;
const CONTENT_HASHED_GLB = /\/assets\/city\/w649\/(?:primary|fallback)\/(?:characters|world)\/[a-z0-9_]+\.[a-f0-9]{12}\.glb(?:\?|$)/i;

function observe(page) {
  const proof = {
    requests: [] as string[],
    failedRequests: [] as Array<{ url: string; error: string }>,
    consoleErrors: [] as string[],
    pageErrors: [] as string[]
  };
  page.on('request', (request) => proof.requests.push(request.url()));
  page.on('requestfailed', (request) => proof.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' }));
  page.on('console', (message) => { if (message.type() === 'error') proof.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => proof.pageErrors.push(String(error?.message || error)));
  return proof;
}

async function attachProof(testInfo, name: string, value: unknown) {
  const proofPath = testInfo.outputPath(`${name}.json`);
  await fs.writeFile(proofPath, JSON.stringify(value, null, 2));
  await testInfo.attach(name, { path: proofPath, contentType: 'application/json' });
}

test.describe('W649 signed-out bandwidth boundary', () => {
  test('static portal makes zero Babylon, GLB, Meshopt, or City-audio requests', async ({ page }, testInfo) => {
    const proof = observe(page);
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-eon-city-play-root]');
    await expect(root).toHaveAttribute('data-eon-city-access-state', /login|unavailable/, { timeout: 15_000 });
    // The current fail-closed copy may evolve; the security invariant is no renderer before sign-in.
    await expect(page.locator('main')).toContainText(/full renderer has not started|no City download before sign-in/i);
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toHaveCount(0);
    await page.waitForTimeout(800);
    const heavy = proof.requests.filter((url) => HEAVY_REQUEST.test(url));
    expect(heavy, `signed-out heavy requests:\n${heavy.join('\n')}`).toEqual([]);
    expect(proof.pageErrors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('w649-signed-out-static-portal.png'), fullPage: true });
    await attachProof(testInfo, 'w649-signed-out-bandwidth-proof', { schema: 'eonapp.w649.signed-out-browser-proof.v1', ...proof, heavyRequests: heavy });
  });
});

test.describe('W649 authenticated integrated cast Preview proof', () => {
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  // Only a documented real EONAPP session may exercise this lane; local storage is never seeded.
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  for (const profile of [
    { id: 'desktop', viewport: { width: 1440, height: 960 } },
    { id: 'mobile-landscape', viewport: { width: 844, height: 390 } }
  ] as const) {
    test(`${profile.id} streams the bounded core and one Orientation district from same-origin hashed assets`, async ({ page }, testInfo) => {
      const proof = observe(page);
      await page.setViewportSize(profile.viewport);
      await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 25_000 });
      await expect(page.locator('[data-eon-city-play-root]')).toHaveAttribute('data-eon-city-first-frame', 'ready', { timeout: 25_000 });
      await expect.poll(() => proof.requests.filter((url) => CONTENT_HASHED_GLB.test(url)).length, { timeout: 25_000 }).toBeGreaterThanOrEqual(2);
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(1200);

      const glbs = proof.requests.filter((url) => /\.glb(?:\?|$)/i.test(url));
      const remoteGlbs = glbs.filter((url) => new URL(url).origin !== new URL(page.url()).origin);
      const unhashedW649 = glbs.filter((url) => /\/assets\/city\/w649\//i.test(url) && !CONTENT_HASHED_GLB.test(url));
      const remoteMeshopt = proof.requests.filter((url) => /meshopt_decoder/i.test(url) && new URL(url).origin !== new URL(page.url()).origin);
      expect(remoteGlbs).toEqual([]);
      expect(unhashedW649).toEqual([]);
      expect(remoteMeshopt).toEqual([]);
      expect(glbs.length).toBeLessThanOrEqual(12);
      expect(proof.pageErrors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`w649-${profile.id}-integrated-cast.png`), fullPage: true });
      await attachProof(testInfo, `w649-${profile.id}-integrated-cast-proof`, {
        schema: 'eonapp.w649.authenticated-integrated-cast-browser-proof.v1',
        profile: profile.id,
        ownerVisualApprovalRequired: true,
        geometricLodCertificationPending: true,
        ...proof,
        glbs,
        remoteGlbs,
        unhashedW649,
        remoteMeshopt
      });
    });
  }
});

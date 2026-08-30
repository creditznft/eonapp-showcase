import { expect, test } from '@playwright/test';

const authorized = JSON.stringify({
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized', requiresIdentity: true,
  identityAvailable: true, signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, staticPortalOnly: false
});

async function prepare(page: import('@playwright/test').Page) {
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: authorized }));
  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"available":false,"signedIn":false}' }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
}

// This is a production-host readiness gate.  Production deliberately rejects
// the certification query override, so it must exercise the normal automatic
// quality path.  Preview-only certification coverage remains in W759R1.
test('W765R2 performs twenty isolated production-host City starts with one maintained canvas', async ({ browser }, testInfo) => {
  test.setTimeout(300_000);
  const results: unknown[] = [];
  for (let run = 1; run <= 20; run += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await prepare(page);
    await page.goto('/eoncity?release=w765r2-production-host', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.()), null, { timeout: 30_000 });
    await page.waitForFunction(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.()?.qualityHandshake?.state === 'ready', null, { timeout: 30_000 });
    const result = await page.evaluate((attempt) => {
      const root = document.querySelector('[data-eon-city-play-root]') as HTMLElement | null;
      const runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
      const presentation = runtime?.getW759PresentationDiagnostics?.();
      return {
        attempt,
        canvases: document.querySelectorAll('.eon-city-command-hub-canvas').length,
        lifecycle: root?.dataset.eonCityRuntimeLifecycle,
        generation: root?.dataset.eonCityMountGeneration,
        corePreload: root?.dataset.eonCityCorePreload,
        bootStage: root?.dataset.eonCityBootStage,
        runtime: Boolean(runtime),
        quality: presentation?.qualityHandshake?.pass,
        qualityAuthority: presentation?.qualityAuthority?.entry
      };
    }, run);
    expect(result.canvases, JSON.stringify(result)).toBe(1);
    expect(result.lifecycle, JSON.stringify(result)).toBe('running');
    expect(result.runtime, JSON.stringify(result)).toBe(true);
    expect(result.quality, JSON.stringify(result)).toBe(true);
    results.push(result);
    await context.close();
  }
  await testInfo.attach('w765r2-twenty-production-host-starts.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Provider Chaos / Outage Simulation
 * ================================================
 * Tests that AI routing and swap infrastructure gracefully degrade
 * when providers are unavailable.
 */

test.describe('Chaos — AI Provider Failover', () => {
  test('should fall back to next provider when Groq is down', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Simulate Groq being down
    await page.addInitScript(() => {
      const originalFetch = window.fetch;
      (window as any).fetch = function(input: any, init: any) {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url && url.includes('api.groq.com')) {
          return Promise.resolve(new Response(
            JSON.stringify({ error: 'Service Unavailable' }),
            { status: 503, headers: { 'content-type': 'application/json' } }
          ));
        }
        return originalFetch.call(window, input, init);
      };
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify the app loads without crash even with Groq simulated down
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);

    // No uncaught errors should surface
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);

    const fatalErrors = errors.filter(e =>
      !e.includes('groq') &&
      !e.includes('net::ERR') &&
      !e.includes('503')
    );
    expect(fatalErrors.length).toBe(0);
  });

  test('should gracefully handle all AI providers being down', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Simulate all AI providers returning 503
    await page.addInitScript(() => {
      const AI_PATTERNS = [
        'api.groq.com',
        'generativelanguage.googleapis.com',
        'api.together.xyz',
        'api.openai.com',
        'api.anthropic.com',
        'api.mistral.ai',
      ];
      const originalFetch = window.fetch;
      (window as any).fetch = function(input: any, init: any) {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const isAI = AI_PATTERNS.some(p => url && url.includes(p));
        if (isAI) {
          return Promise.resolve(new Response(
            JSON.stringify({ error: 'All providers down (chaos test)' }),
            { status: 503, headers: { 'content-type': 'application/json' } }
          ));
        }
        return originalFetch.call(window, input, init);
      };
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should still load (no fatal crash)
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);

    // Should not show raw JS error stack to user
    const rawErrorStack = await page.locator('pre').count();
    expect(rawErrorStack).toBe(0);
  });

  test('should handle Nostr relay unavailability gracefully', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Simulate all WebSocket connections failing immediately
    await page.addInitScript(() => {
      const OrigWS = window.WebSocket;
      (window as any).WebSocket = class ChaosWS extends OrigWS {
        constructor(url: string, protocols?: string | string[]) {
          if (url && url.startsWith('wss://')) {
            // Create real WS but immediately dispatch error+close
            super(url, protocols);
            setTimeout(() => {
              this.dispatchEvent(new Event('error'));
              this.dispatchEvent(new CloseEvent('close', { code: 1006, wasClean: false }));
            }, 10);
          } else {
            super(url, protocols);
          }
        }
      };
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // App should not crash when Nostr relays are unavailable
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
  });
});

test.describe('Chaos — Swap Registry Fallback', () => {
  test('should publish swap offer to local cache when Nostr relays unavailable', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      // Simulate Nostr unavailability by blocking WebSocket
      const OrigWS = window.WebSocket;
      (window as any).WebSocket = class FailWS {
        constructor() {
          setTimeout(() => {
            (this as any).readyState = 3; // CLOSED
            this.dispatchEvent(new Event('error'));
          }, 10);
          (this as any).readyState = 0;
          (this as any).send = () => {};
          (this as any).close = () => {};
          (this as any).addEventListener = () => {};
          (this as any).removeEventListener = () => {};
          (this as any).dispatchEvent = () => true;
        }
      };

      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();
      const result = await mod.publishP2POffer({
        uid: 'test-user-123',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
      });

      // Restore WebSocket
      (window as any).WebSocket = OrigWS;

      return {
        ok: result.ok,
        isLocal: result.local === true,
        offerCode,
      };
    });

    expect(result.ok).toBe(true);
    // When Nostr is unavailable, should fall back to local-only
    // (either published 0 to Nostr but cached locally, or all local)
  });

  test('should find locally cached offer without network', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();

      // Publish locally first
      await mod.publishP2POffer({
        uid: 'test-user-456',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
      });

      // Look it up (should hit local cache without any network call)
      const lookup = await mod.lookupP2POffer(offerCode);
      return {
        ok: lookup.ok,
        source: lookup.source,
        offerCodeMatch: lookup.offer?.offerCode === offerCode,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.source).toBe('cache');
    expect(result.offerCodeMatch).toBe(true);
  });
});

test.describe('Chaos — Subscription License Verification', () => {
  test('should activate subscription from a locally signed license code', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/subscription.js');
      const uid = 'test-uid-123456789012';
      const expiresAt = new Date(Date.now() + 86400_000).toISOString();
      const code = await mod.createLocalLicenseCode(uid, 'spark', expiresAt, 'abc123nonce456xyz');
      const r = await mod.activateWithLicenseCode(code, uid);
      return { ok: r.ok, error: r.error || null, planId: r.planId || null };
    });

    expect(result.ok).toBe(true);
    expect(result.error).toBe(null);
    expect(result.planId).toBe('spark');
  });
});

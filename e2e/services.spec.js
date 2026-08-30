/**
 * Services E2E Test Suite (v1, May 2026)
 * Tests: Pool Points, Bounty Board, EON Twin, Skill Tree, Constitution,
 * Analytics, Pool Points Anchor — all localStorage-first services.
 * Tests inject modules via page.evaluate() for pure unit-style verification
 * without requiring a running backend.
 */
const { test, expect } = require('@playwright/test');

// ── Pool Points service ───────────────────────────────────────
test.describe('Pool Points service', () => {
  test('EonPoolPoints exposes required API on vault page', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      const pp = window.EonPoolPoints;
      if (!pp) return { loaded: false };
      return {
        loaded: true,
        hasAwardPoints:    typeof pp.awardPoints    === 'function',
        hasGetTotalPoints: typeof pp.getTotalPoints === 'function',
        hasGetMultiplier:  typeof pp.getMultiplier  === 'function',
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.hasAwardPoints).toBeTruthy();
    expect(result.hasGetTotalPoints).toBeTruthy();
  });

  test('awardPoints increases total in localStorage', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      const pp = window.EonPoolPoints;
      if (!pp?.awardPoints) return { ok: false };
      pp.awardPoints('tool-completed', 'e2e test award');
      const total = pp.getTotalPoints();
      return { ok: true, total };
    });

    if (!result.ok) { test.skip(); return; }
    expect(result.total).toBeGreaterThan(0);
  });
});

// ── Token Swap service ────────────────────────────────────────
test.describe('Token Swap service', () => {
  test('EonTokenSwap exposes key methods via window global', async ({ page }) => {
    // token-swap.js is an IIFE that sets window.EonTokenSwap (not an ES module)
    // Load a page that includes it, or inject via script tag
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => new Promise((resolve, reject) => {
      if (window.EonTokenSwap) {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[data-e2e-token-swap]');
      if (existing && window.EonTokenSwap) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = '/assets/js/utils/token-swap.js';
      script.dataset.e2eTokenSwap = '1';
      script.onload = () => resolve(true);
      script.onerror = reject;
      document.head.appendChild(script);
    }));
    await page.waitForFunction(() => !!window.EonTokenSwap);

    const result = await page.evaluate(() => {
      const ts = window.EonTokenSwap;
      if (!ts) return { loaded: false };
      return {
        loaded: true,
        hasCreateOffer:   typeof ts.createOffer        === 'function',
        hasBrowseOffers:  typeof ts.browseSwapOffers   === 'function',
        hasAccept:        typeof ts.acceptSwapOffer     === 'function',
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.hasCreateOffer).toBeTruthy();
    expect(result.hasBrowseOffers).toBeTruthy();
  });
});

// ── Bounty Board ──────────────────────────────────────────────
test.describe('Bounty Board', () => {
  test('bounty-board.js module loads and exports submitTask', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      try {
        const m = await import('/assets/js/utils/bounty-board.js');
        return {
          loaded: true,
          hasTasks:  typeof m.default?.getTasks  === 'function',
          hasSubmit: typeof m.default?.submitTask === 'function',
          hasReview: typeof m.default?.reviewSubmission === 'function',
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });

    expect(result.loaded, result.error).toBeTruthy();
    expect(result.hasTasks).toBeTruthy();
    expect(result.hasSubmit).toBeTruthy();
    expect(result.hasReview).toBeTruthy();
  });

  test('bounty board rejects submission below quality gate', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/bounty-board.js');
      const service = m.default;
      // Submit a task first so we have a valid taskId
      const tasks = service.getTasks();
      if (!tasks.length) return { skipped: true };
      const taskId = tasks[0].id;
      const userId = 'e2e-test-user';
      // Content too short — should fail quality gate
      const res = service.submitTask(taskId, userId, 'too short');
      return { valid: res.success, error: res.error };
    });

    if (result.skipped) { test.skip(); return; }
    expect(result.valid).toBeFalsy();
    expect(result.error).toMatch(/too short|quality|minimum/i);
  });
});

// ── EON Twin ─────────────────────────────────────────────────
test.describe('EON Twin', () => {
  test('eon-twin.js module loads and exposes key methods', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      try {
        const m = await import('/assets/js/utils/eon-twin.js');
        const svc = m.default;
        return {
          loaded: true,
          hasRequest: typeof svc.requestExecution  === 'function',
          hasApprove: typeof svc.approveExecution  === 'function',
          hasExecute: typeof svc.executeApproved   === 'function',
          hasTasks:   typeof svc.getTasks          === 'function',
          hasSummary: typeof svc.getPolicySummary  === 'function',
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });

    expect(result.loaded, result.error).toBeTruthy();
    expect(result.hasRequest).toBeTruthy();
    expect(result.hasSummary).toBeTruthy();
  });

  test('Twin blocks disallowed verbs', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/eon-twin.js');
      const svc = m.default;
      // 'delete' is not in allowlist — should be blocked
      const res = await svc.requestExecution('e2e-task', 'delete all files from the system');
      return { allowed: res.approved, reason: res.reason };
    });

    expect(result.allowed).toBeFalsy();
    expect(result.reason).toMatch(/not in the twin|allowlist|forbidden/i);
  });

  test('Twin allows explicitly allowlisted verbs', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/eon-twin.js');
      const svc = m.default;
      const res = await svc.requestExecution('e2e-allow-test', 'analyze the content for policy compliance');
      return { allowed: res.approved, reason: res.reason };
    });

    // Should reach the approval stage (not auto-approved — needs human approval)
    // Layer 1 pass = reason should not say "not in allowlist"
    expect(result.reason).not.toMatch(/not in the twin/i);
  });
});

// ── EON Constitution ─────────────────────────────────────────
test.describe('EON Constitution', () => {
  test('eon-constitution.js loads with default rules', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/eon-constitution.js');
      const svc = m.default;
      const rules = svc.getRules();
      return {
        loaded: true,
        ruleCount: rules.length,
        hasCheckAction: typeof svc.checkAction === 'function',
        hasCreateRule:  typeof svc.createRule  === 'function',
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.ruleCount).toBeGreaterThanOrEqual(5); // 5 defaults seeded
    expect(result.hasCheckAction).toBeTruthy();
  });

  test('constitution blocks hard_block financial actions', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/eon-constitution.js');
      const check = m.default.checkAction('transfer funds to external wallet');
      return { allowed: check.allowed, blocked: check.blocked };
    });

    expect(result.blocked).toBeTruthy();
    expect(result.allowed).toBeFalsy();
  });
});

// ── Skill Tree ────────────────────────────────────────────────
test.describe('Skill Tree', () => {
  test('skill-tree.js loads and exposes getSnapshot and getBadges', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/skill-tree.js');
      const svc = m.default;
      return {
        loaded: true,
        hasSnapshot:  typeof svc.getSnapshot  === 'function',
        hasBadges:    typeof svc.getBadges    === 'function',
        hasShareCard: typeof svc.generateShareCard === 'function',
        snapshot:     svc.getSnapshot(),
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.hasSnapshot).toBeTruthy();
    expect(result.hasBadges).toBeTruthy();
    expect(result.snapshot.tracks).toHaveProperty('builder');
    expect(result.snapshot.tracks).toHaveProperty('moderator');
  });
});

// ── EON Analytics ─────────────────────────────────────────────
test.describe('EON Analytics', () => {
  test('eon-analytics.js loads and tracks pageview', async ({ page }) => {
    await page.goto('/build', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/eon-analytics.js');
      const svc = m.default;
      svc.trackEvent('e2e', 'test', 'analytics-spec');
      const report = svc.getReport();
      return {
        loaded: true,
        hasReport:      typeof svc.getReport    === 'function',
        hasTrackEvent:  typeof svc.trackEvent   === 'function',
        totalPageviews: report.totalPageviews,
        totalEvents:    report.totalEvents,
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.hasReport).toBeTruthy();
    expect(result.totalEvents).toBeGreaterThan(0);
  });
});

// ── Pool Points Anchor ────────────────────────────────────────
test.describe('Pool Points Anchor', () => {
  test('pool-points-anchor.js loads and exposes signAnchor and getLog', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/assets/js/utils/pool-points-anchor.js');
      const svc = m.default;
      return {
        loaded:          true,
        hasSign:         typeof svc.signAnchor        === 'function',
        hasSubmit:       typeof svc.submitAnchor      === 'function',
        hasLog:          typeof svc.getLog            === 'function',
        hasBalance:      typeof svc.getCurrentBalance === 'function',
        proofHubAddress: m.PROOF_HUB_ADDRESS,
      };
    });

    expect(result.loaded).toBeTruthy();
    expect(result.hasSign).toBeTruthy();
    expect(result.hasSubmit).toBeTruthy();
    // Proof hub address must be the canonical Polygon mainnet contract
    expect(result.proofHubAddress).toBe('0xd00a959308b8627Fe873C9de4987e0C11FB724C5');
  });

  test('anchor button is present in vault.html', async ({ page }) => {
    await page.goto('/vault');
    await expect(page.locator('#vlt-anchor-btn')).toBeAttached({ timeout: 10000 });
  });
});


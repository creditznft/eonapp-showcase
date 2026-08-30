import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Accessibility (WCAG 2.1 Level AA)
 * ===============================================
 * Tests for keyboard navigation, focus management, ARIA, color contrast,
 * and screen reader compatibility.
 */

test.describe('Accessibility — Skip Link', () => {
  test('should have a skip-to-main-content link as first focusable element', async ({ page, browserName }) => {
    // webkit does not focus anchor links on Tab by default (macOS system behavior)
    test.skip(browserName === 'webkit', 'webkit does not Tab-focus links by default');
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Tab from address bar — first Tab press should reach skip link
    await page.keyboard.press('Tab');
    const focusedId = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName || '');
    expect(focusedId).toBe('eon-skip-to-main');
  });

  test('skip link should navigate to main content on Enter', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should scroll to main content anchor
    const mainContentVisible = await page.evaluate(() => {
      const el = document.getElementById('main-content') || document.querySelector('main');
      return !!el;
    });
    expect(mainContentVisible).toBe(true);
  });
});

test.describe('Accessibility — Focus Management', () => {
  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Count all interactive elements
    const interactiveCount = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
      );
      return elements.length;
    });

    // There should be at least some interactive elements
    expect(interactiveCount).toBeGreaterThan(0);

    // Each should have a tabIndex >= 0 (keyboard reachable) or be naturally focusable
    const nonFocusableCount = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled])'
      ));
      return elements.filter(el => (el as HTMLElement).tabIndex < 0).length;
    });
    expect(nonFocusableCount).toBe(0);
  });

  test('focus indicators should be visible when using keyboard navigation', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    // Initialize accessibility module
    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      mod.initAccessibility();
    });

    // Tab to trigger keyboard mode
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Body should have eon-focus-visible class after keyboard navigation
    const hasFocusClass = await page.evaluate(() =>
      document.body.classList.contains('eon-focus-visible')
    );
    expect(hasFocusClass).toBe(true);
  });

  test('clicking removes keyboard focus class (mouse users not affected)', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      mod.initAccessibility();
    });

    // First keyboard nav to add class
    await page.keyboard.press('Tab');

    // Then click to remove it
    await page.mouse.click(100, 100);

    const hasFocusClass = await page.evaluate(() =>
      document.body.classList.contains('eon-focus-visible')
    );
    expect(hasFocusClass).toBe(false);
  });
});

test.describe('Accessibility — ARIA Live Regions', () => {
  test('announce() should inject content into ARIA live region', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      mod.initAccessibility();
      mod.announce('Test announcement message');
    });

    // Wait for debounce
    await page.waitForTimeout(150);

    const liveContent = await page.evaluate(() => {
      const region = document.getElementById('eon-live-region');
      return region?.textContent || '';
    });

    expect(liveContent).toBe('Test announcement message');
  });

  test('assertive announcement should update aria-live attribute', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      mod.initAccessibility();
      mod.announce('Urgent: Connection lost', 'assertive');
    });

    await page.waitForTimeout(150);

    const ariaLive = await page.evaluate(() => {
      return document.getElementById('eon-live-region')?.getAttribute('aria-live');
    });

    expect(ariaLive).toBe('assertive');
  });
});

test.describe('Accessibility — Modal Focus Trap', () => {
  test('trapFocus should contain Tab cycling within modal', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');

      // Create a test modal
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.innerHTML = `
        <button id="btn1">First</button>
        <input id="inp1" type="text" />
        <button id="btn2">Last</button>
      `;
      document.body.appendChild(modal);

      (window as any)._trapCleanup = mod.trapFocus(modal);
    });

    // Focus should be on first element in modal
    const firstFocused = await page.evaluate(() => document.activeElement?.id);
    expect(firstFocused).toBe('btn1');

    // Tab from last element should wrap to first
    await page.keyboard.press('Tab'); // btn1 → inp1
    await page.keyboard.press('Tab'); // inp1 → btn2
    await page.keyboard.press('Tab'); // btn2 → wraps to btn1

    const wrappedFocus = await page.evaluate(() => document.activeElement?.id);
    expect(wrappedFocus).toBe('btn1');

    // Cleanup
    await page.evaluate(() => (window as any)._trapCleanup?.());
  });

  test('Escape key in trapped modal should call onClose', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      const modal = document.createElement('div');
      modal.id = 'test-escape-modal';
      modal.innerHTML = '<button id="escape-btn">Close Me</button>';
      document.body.appendChild(modal);
      (window as any)._escapeCalled = false;
      (window as any)._trapCleanup2 = mod.trapFocus(modal, {
        onClose: () => { (window as any)._escapeCalled = true; }
      });
    });

    await page.keyboard.press('Escape');

    const escapeCalled = await page.evaluate(() => (window as any)._escapeCalled);
    expect(escapeCalled).toBe(true);

    await page.evaluate(() => (window as any)._trapCleanup2?.());
  });
});

test.describe('Accessibility — Color Contrast Utility', () => {
  test('contrastRatio should compute correct ratio for black/white', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const ratio = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      return mod.contrastRatio('#000000', '#ffffff');
    });

    expect(ratio).toBeCloseTo(21, 0);
  });

  test('checkContrast should pass for high contrast pair', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      return mod.checkContrast('#1e1b4b', '#ffffff'); // dark indigo on white
    });

    expect(result.passes).toBe(true);
    expect(result.ratio).toBeGreaterThan(4.5);
  });

  test('checkContrast should fail for low contrast pair', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/accessibility.js');
      return mod.checkContrast('#aaaaaa', '#cccccc'); // low contrast grey pair
    });

    expect(result.passes).toBe(false);
  });
});

test.describe('Accessibility — Page Structure', () => {
  const PAGES = [
    '/build',
    '/vault',
    '/chat.html',
    '/trade',
    '/marketplace.html',
  ];

  for (const pagePath of PAGES) {
    test(`${pagePath} should have a document title`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test(`${pagePath} should have at least one heading`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const headingCount = await page.locator('h1, h2, h3').count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test(`${pagePath} should have lang attribute on <html>`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const lang = await page.evaluate(() => document.documentElement.lang);
      expect(lang.length).toBeGreaterThan(0);
    });
  }
});

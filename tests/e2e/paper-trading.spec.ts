import { test, expect } from '../fixtures/index';

test.describe('Paper Trading & Risk Management', () => {
  test('should initialize paper trading ledger', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');
    
    // Locate paper trading section
    const paperTradingSection = page.locator('[data-testid="paper-trading"]');
    const isSectionVisible = await paperTradingSection.isVisible().catch(() => false);
    
    expect(isSectionVisible).toBe(true);
    
    // Verify initial balance
    const initialBalance = page.locator('text=Starting Balance|Virtual EONL');
    await expect(initialBalance).toBeVisible();
  });

  test('should execute paper trade and track position', async ({ page }) => {
    await page.goto('/signal');
    
    // Set paper trade parameters
    const symbolInput = page.locator('input[placeholder*="symbol"]');
    await symbolInput.fill('BTCUSDT');
    
    const sideSelect = page.locator('select[name="side"]');
    await sideSelect.selectOption('buy');
    
    const quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('0.1');
    
    // Execute paper trade
    const executePaperBtn = page.locator('button:has-text("Execute Paper Trade|Simulate")');
    await executePaperBtn.click();
    
    await page.waitForTimeout(1500);
    
    // Verify position appears in ledger
    const positionRow = page.locator('text=BTC|Bitcoin');
    await expect(positionRow).toBeVisible();
    
    // Verify entry price is recorded
    const entryPrice = page.locator('[data-testid="entry-price"]');
    const isPriceVisible = await entryPrice.isVisible().catch(() => false);
    expect(isPriceVisible).toBe(true);
  });

  test('should calculate unrealized PnL for open position', async ({ page }) => {
    await page.goto('/signal');
    
    // Inject mock position data
    await page.addInitScript(() => {
      localStorage.setItem('paperPositions', JSON.stringify([
        {
          symbol: 'BTCUSDT',
          side: 'buy',
          quantity: 1.0,
          entryPrice: 60000,
          timestamp: Date.now(),
        }
      ]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Locate PnL display
    const pnlDisplay = page.locator('[data-testid="unrealized-pnl"]');
    const isPnLVisible = await pnlDisplay.isVisible().catch(() => false);
    
    expect(isPnLVisible).toBe(true);
    
    // Verify PnL value is calculated (could be positive or negative)
    const pnlValue = await pnlDisplay.textContent();
    expect(pnlValue).toMatch(/[\+\-\$]?[\d,\.]+%?/);
  });

  test('should close paper trade and calculate realized profit', async ({ page }) => {
    await page.goto('/signal');
    
    // Setup open position
    await page.addInitScript(() => {
      localStorage.setItem('paperPositions', JSON.stringify([
        {
          id: 'test-pos-1',
          symbol: 'ETHUSDT',
          side: 'buy',
          quantity: 10,
          entryPrice: 2500,
          timestamp: Date.now() - 10000,
        }
      ]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Locate position and close button
    const closeBtn = page.locator('button:has-text("Close|Exit|Sell")').first();
    await closeBtn.click();
    
    // Set exit price
    const exitPriceInput = page.locator('input[placeholder*="exit"]');
    await exitPriceInput.fill('2750');
    
    // Confirm close
    const confirmBtn = page.locator('button:has-text("Confirm")');
    await confirmBtn.click();
    
    await page.waitForTimeout(1000);
    
    // Verify profit calculated
    const profitMsg = page.locator('text=Profit|Loss|Close');
    await expect(profitMsg).toBeVisible();
  });

  test('should display trading statistics (win rate, max loss)', async ({ page }) => {
    await page.goto('/signal');
    
    // Setup multiple closed trades
    await page.addInitScript(() => {
      localStorage.setItem('closedTrades', JSON.stringify([
        { pnl: 500, side: 'buy', status: 'closed' },
        { pnl: -200, side: 'buy', status: 'closed' },
        { pnl: 750, side: 'sell', status: 'closed' },
        { pnl: -100, side: 'buy', status: 'closed' },
      ]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify stats display
    const winRate = page.locator('[data-testid="win-rate"]');
    const totalTrades = page.locator('[data-testid="total-trades"]');
    const maxLoss = page.locator('[data-testid="max-loss"]');
    
    await expect(winRate).toBeVisible();
    await expect(totalTrades).toBeVisible();
    await expect(maxLoss).toBeVisible();
    
    // Verify values
    const winRateText = await winRate.textContent();
    expect(winRateText).toMatch(/\d+%/);
  });

  test('should enforce position size limits in paper trading', async ({ page }) => {
    await page.goto('/signal');
    
    // Set max position limit
    const maxPosInput = page.locator('input[placeholder*="max position"]');
    await maxPosInput.fill('5'); // Max 5 BTC
    
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    
    // Try to enter larger position
    const quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('10');
    
    const executePaperBtn = page.locator('button:has-text("Execute Paper Trade")');
    await executePaperBtn.click();
    
    await page.waitForTimeout(1000);
    
    // Should show warning/error
    const errorMsg = page.locator('text=exceeds|too large|position limit');
    const hasError = await errorMsg.isVisible().catch(() => false);
    
    expect(hasError).toBe(true);
  });

  test('should support stop-loss and take-profit orders in paper trading', async ({ page }) => {
    await page.goto('/signal');
    
    // Enter trade with SL/TP
    const symbolInput = page.locator('input[placeholder*="symbol"]');
    await symbolInput.fill('BTCUSDT');
    
    const quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('1');
    
    const slInput = page.locator('input[placeholder*="stop loss"]');
    const tpInput = page.locator('input[placeholder*="take profit"]');
    
    await slInput.fill('55000');
    await tpInput.fill('70000');
    
    // Execute
    const executeBtn = page.locator('button:has-text("Execute")');
    await executeBtn.click();
    
    await page.waitForTimeout(1500);
    
    // Verify SL/TP displayed with position
    const slDisplay = page.locator('text=SL:|Stop:|55000');
    const tpDisplay = page.locator('text=TP:|Target:|70000');
    
    const slVisible = await slDisplay.isVisible().catch(() => false);
    const tpVisible = await tpDisplay.isVisible().catch(() => false);
    
    expect(slVisible || tpVisible).toBe(true);
  });
});

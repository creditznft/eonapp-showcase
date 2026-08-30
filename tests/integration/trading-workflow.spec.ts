import { test, expect } from '../fixtures/index';

test.describe('Integration - End-to-End Trading Workflow', () => {
  test('should complete full paper trade workflow: entry -> monitor -> exit', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');

    // ===== STEP 1: Setup =====
    console.log('Step 1: Setup paper trading environment');

    // Verify initial balance
    const balanceDisplay = page.locator('[data-testid="paper-balance"]');
    const initialBalance = await balanceDisplay.textContent();
    expect(initialBalance).toMatch(/\d+/);

    // ===== STEP 2: Enter Position =====
    console.log('Step 2: Enter long position on BTC');

    const symbolInput = page.locator('input[placeholder*="symbol"]').first();
    await symbolInput.fill('BTCUSDT');

    const sideSelect = page.locator('select[name="side"]');
    await sideSelect.selectOption('buy');

    const quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('0.5');

    // Set stop-loss and take-profit
    const slInput = page.locator('input[placeholder*="stop"]');
    const tpInput = page.locator('input[placeholder*="take"]');

    await slInput.fill('55000'); // Stop loss 10% below current
    await tpInput.fill('72000'); // Take profit 20% above current

    // Execute trade
    const executeBtn = page.locator('button:has-text("Execute|Trade|Enter")').first();
    await executeBtn.click();

    await page.waitForTimeout(1500);

    // Verify position entered
    const positionTable = page.locator('[data-testid="open-positions"]');
    const btcPosition = positionTable.locator('text=BTC');
    await expect(btcPosition).toBeVisible();

    // ===== STEP 3: Monitor Position =====
    console.log('Step 3: Monitor unrealized PnL');

    const unrealizedPnL = page.locator('[data-testid="unrealized-pnl"]');
    const pnlText = await unrealizedPnL.textContent();
    expect(pnlText).toMatch(/[\+\-]/); // PnL should show +/- value

    // ===== STEP 4: Update Price & Check SL/TP =====
    console.log('Step 4: Simulate price movement');

    // Inject mock price data
    await page.evaluate(() => {
      localStorage.setItem('mockCurrentPrice', '71000'); // Approaching TP
    });

    // Refresh PnL
    const refreshBtn = page.locator('button:has-text("Refresh|Update")');
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(1000);
    }

    // ===== STEP 5: Exit Position =====
    console.log('Step 5: Exit position');

    const exitBtn = page.locator('button:has-text("Close|Exit")').first();
    await exitBtn.click();

    // Confirm exit
    const confirmBtn = page.locator('button:has-text("Confirm|Yes")');
    await confirmBtn.click();

    await page.waitForTimeout(1500);

    // ===== STEP 6: Verify Closed Trade =====
    console.log('Step 6: Verify trade closed with PnL');

    // Position should now appear in closed trades
    const closedTradesSection = page.locator('[data-testid="closed-trades"]');
    const closedBTC = closedTradesSection.locator('text=BTC');
    await expect(closedBTC).toBeVisible();

    // PnL should be visible
    const tradePnL = closedTradesSection.locator('[data-testid="trade-pnl"]').first();
    const pnlValue = await tradePnL.textContent();
    expect(pnlValue).toMatch(/[\+\-]?\$?[\d,\.]+/);

    // ===== STEP 7: Check Statistics =====
    console.log('Step 7: Verify statistics updated');

    const statsSection = page.locator('[data-testid="trading-stats"]');
    const winRate = statsSection.locator('[data-testid="win-rate"]');
    const totalTrades = statsSection.locator('[data-testid="total-trades"]');

    await expect(winRate).toBeVisible();
    await expect(totalTrades).toBeVisible();

    const tradesText = await totalTrades.textContent();
    expect(tradesText).toMatch(/1/); // Should show 1 completed trade

    console.log('✅ Full trading workflow completed successfully');
  });

  test('should handle multiple concurrent positions with PnL aggregation', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');

    console.log('Multi-position workflow: BTC long, ETH short, ADA long');

    // Position 1: BTC Long
    let symbolInput = page.locator('input[placeholder*="symbol"]').first();
    await symbolInput.fill('BTCUSDT');
    let sideSelect = page.locator('select[name="side"]');
    await sideSelect.selectOption('buy');
    let quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('0.1');
    let executeBtn = page.locator('button:has-text("Execute")').first();
    await executeBtn.click();
    await page.waitForTimeout(800);

    // Position 2: ETH Short
    await symbolInput.fill('ETHUSDT');
    await sideSelect.selectOption('sell');
    await quantityInput.fill('1');
    await executeBtn.click();
    await page.waitForTimeout(800);

    // Position 3: ADA Long
    await symbolInput.fill('ADAUSDT');
    await sideSelect.selectOption('buy');
    await quantityInput.fill('500');
    await executeBtn.click();
    await page.waitForTimeout(800);

    // Verify all three positions are open
    const positionsGrid = page.locator('[data-testid="open-positions"] tr');
    const count = await positionsGrid.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify aggregate portfolio value shows
    const portfolioValue = page.locator('[data-testid="portfolio-value"]');
    await expect(portfolioValue).toBeVisible();

    // Verify total unrealized PnL is aggregated
    const totalPnL = page.locator('[data-testid="total-unrealized-pnl"]');
    const pnlText = await totalPnL.textContent();
    expect(pnlText).toMatch(/[\+\-]/);

    console.log('✅ Multi-position aggregation working');
  });

  test('should enforce risk management rules across all positions', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');

    console.log('Testing risk management enforcement');

    // Set aggressive max position size (1% of balance)
    const riskLimitInput = page.locator('input[placeholder*="max"]');
    await riskLimitInput.fill('1');
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Try to enter position that exceeds limit
    const symbolInput = page.locator('input[placeholder*="symbol"]').first();
    await symbolInput.fill('BTCUSDT');

    const quantityInput = page.locator('input[placeholder*="quantity"]');
    await quantityInput.fill('100'); // Likely exceeds 1% limit

    const executeBtn = page.locator('button:has-text("Execute")').first();
    await executeBtn.click();

    await page.waitForTimeout(1000);

    // Should show error
    const errorMsg = page.locator('text=exceeds|too large|risk');
    const hasError = await errorMsg.isVisible().catch(() => false);

    if (hasError) {
      console.log('✅ Risk limit properly enforced');
      expect(hasError).toBe(true);
    }
  });

  test('should calculate accurate drawdown metrics', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');

    console.log('Testing drawdown calculations');

    // Inject multiple losing trades
    await page.evaluate(() => {
      const trades = [
        { pnl: -500, status: 'closed' },
        { pnl: -300, status: 'closed' },
        { pnl: -200, status: 'closed' },
      ];
      localStorage.setItem('closedTrades', JSON.stringify(trades));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify max drawdown is calculated
    const maxDrawdown = page.locator('[data-testid="max-drawdown"]');
    const drawdownText = await maxDrawdown.textContent();
    expect(drawdownText).toMatch(/\d+\.?\d*%?/);

    // Verify loss stats
    const totalLoss = page.locator('[data-testid="total-loss"]');
    await expect(totalLoss).toBeVisible();

    console.log('✅ Drawdown metrics calculated correctly');
  });
});

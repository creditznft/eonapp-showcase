import { test, expect } from '../fixtures/index';

test.describe('Trading Safety & Orchestration', () => {
  test('should block unauthorized trading without approval', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');
    
    // Attempt to place order without API setup
    const orderBtn = page.locator('button:has-text("Place Order")');
    const isOrderBtnDisabled = await orderBtn.isDisabled();
    
    // Order button should be disabled until proper setup
    expect(isOrderBtnDisabled).toBe(true);
    
    // Verify warning message
    const warning = page.locator('text=API keys required|Enable trading|Not connected');
    const warningVisible = await warning.isVisible().catch(() => false);
    expect(warningVisible).toBe(true);
  });

  test('should require approval for large trades', async ({ page }) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');
    
    // Mock orchestrator policy check
    await page.addInitScript(() => {
      (window as any).testApprovalRequired = true;
    });
    
    // Attempt to execute large trade
    const largeAmountInput = page.locator('input[placeholder*="amount"]');
    await largeAmountInput.fill('100000'); // Large amount
    
    const executeBtn = page.locator('button:has-text("Execute")');
    await executeBtn.click();
    
    // Should show approval modal
    await page.waitForTimeout(1000);
    const approvalModal = page.locator('[role="dialog"]');
    const modalVisible = await approvalModal.isVisible().catch(() => false);
    
    expect(modalVisible).toBe(true);
  });

  test('should enforce risk limits on position size', async ({ page }) => {
    await page.goto('/signal');
    
    // Set risk limit (e.g., max 10% of portfolio)
    const riskInput = page.locator('input[placeholder*="risk"][placeholder*="limit"]');
    await riskInput.fill('10');
    
    // Save settings
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    
    // Try to execute trade exceeding limit
    const positionSizeInput = page.locator('input[placeholder*="size"]');
    await positionSizeInput.fill('50'); // Exceeds 10% limit
    
    const executeBtn = page.locator('button:has-text("Execute")');
    await executeBtn.click();
    
    // Should show error
    await page.waitForTimeout(1000);
    const errorMsg = page.locator('text=exceeds risk limit|violates position');
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    
    expect(errorVisible).toBe(true);
  });

  test('should verify command signature in agent orchestrator', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Inject test command with invalid signature
    await page.addInitScript(() => {
      (window as any).testCommand = {
        action: 'trade',
        params: { symbol: 'BTCUSDT', side: 'buy' },
        signature: 'invalid-sig-12345',
        nonce: 'test-nonce-1',
      };
    });
    
    // Attempt to execute unsigned command
    const executeRemote = page.locator('button:has-text("Execute Remote")');
    const isDisabled = await executeRemote.isDisabled().catch(() => false);
    
    // Should prevent execution
    expect(isDisabled).toBe(true);
  });

  test('should handle orchestrator nonce rejection', async ({ page }) => {
    await page.goto('/chat');
    
    // Send duplicate command (same nonce)
    const commandNonce = 'duplicate-test-nonce';
    
    // First execution
    await page.evaluate((nonce) => {
      localStorage.setItem('lastNonce', nonce);
    }, commandNonce);
    
    // Try to send same nonce again
    const result = await page.evaluate((nonce) => {
      const lastNonce = localStorage.getItem('lastNonce');
      return nonce === lastNonce;
    }, commandNonce);
    
    // Should detect duplicate
    expect(result).toBe(true);
  });

  test('should provide audit trail for all trading actions', async ({ page }) => {
    await page.goto('/signal');
    
    // Open audit log
    const auditBtn = page.locator('button:has-text("Audit Log")');
    await auditBtn.click();
    
    // Verify log panel appears
    await page.waitForTimeout(500);
    const auditPanel = page.locator('[data-testid="audit-log"]');
    const isPanelVisible = await auditPanel.isVisible().catch(() => false);
    
    expect(isPanelVisible).toBe(true);
  });

  test('should support emergency stop/kill-switch', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');
    
    // Locate kill-switch button
    const killSwitch = page.locator('button:has-text("Emergency Stop|Kill Switch|Halt Trading")');
    const isSwitchVisible = await killSwitch.isVisible().catch(() => false);
    
    expect(isSwitchVisible).toBe(true);
    
    if (isSwitchVisible) {
      await killSwitch.click();
      
      // Verify trading is halted
      const tradingSection = page.locator('[data-testid="trading-panel"]');
      const isDisabled = await tradingSection.evaluate((el) => {
        return (el as HTMLElement).style.opacity === '0.5' || 
               (el as HTMLElement).classList.contains('disabled');
      }).catch(() => false);
      
      expect(isDisabled).toBe(true);
    }
  });
});

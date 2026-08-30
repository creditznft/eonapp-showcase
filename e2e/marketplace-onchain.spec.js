const { test, expect } = require('@playwright/test');

test('marketplace create flow executes on-chain path with wallet/network guardrails', async ({ page }) => {
  const wallet = '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862';
  const txHash = '0x' + 'a'.repeat(64);

  await page.addInitScript(({ walletAddress, txHashValue }) => {
    localStorage.setItem('eon:profile:v1', JSON.stringify({ wallet: walletAddress }));

    let receiptPollCount = 0;
    window.ethereum = {
      request: async ({ method }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [walletAddress];
        if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
        if (method === 'eth_sendTransaction') return txHashValue;
        if (method === 'eth_getTransactionReceipt') {
          receiptPollCount += 1;
          if (receiptPollCount > 0) {
            return { status: '0x1', blockNumber: '0x1', logs: [] };
          }
          return null;
        }
        return null;
      }
    };
  }, { walletAddress: wallet, txHashValue: txHash });

  page.on('dialog', async (dialog) => {
    await dialog.dismiss();
  });

  await page.goto('/marketplace.html');

  await page.click('.mp-tab[data-tab="create"]');
  await page.selectOption('#mp-create-settlement', 'onchain');
  await page.fill('#mp-create-token-id', '42');
  await page.fill('#mp-create-title', 'E2E On-chain Listing');
  await page.fill('#mp-create-price', '12.5');

  await page.click('#mp-create-submit-btn');
  await expect(page.locator('#mp-create-result')).toContainText('On-chain listing mined', { timeout: 15000 });
});

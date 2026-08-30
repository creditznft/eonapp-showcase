import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.W101_BASE_URL || 'http://127.0.0.1:4183';
const outputDir = path.resolve('CodexAuditPack/W101_MARKETPLACE_NFT_LOOTBOX_REWARDS/browser');
const screenshotDir = path.join(outputDir, 'screenshots');
const reportPath = path.join(outputDir, 'W101_MARKETPLACE_BROWSER_PROOF.json');
fs.mkdirSync(screenshotDir, { recursive: true });

const report = {
  schema: 'eon.w101.marketplace-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  scenarios: {},
  checks: {},
  unexpectedErrors: [],
  expectedEnvironmentNotes: [],
  ok: false
};

function attachDiagnostics(page, scenario) {
  const unexpected = [];
  const expected = [];
  page.on('pageerror', (error) => unexpected.push(`pageerror: ${String(error?.message || error)}`));
  page.on('crash', () => unexpected.push('page crashed'));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/ERR_CONNECTION_REFUSED|Failed to load resource/i.test(text)) expected.push(`console: ${text}`);
    else unexpected.push(`console: ${text}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    const failure = request.failure()?.errorText || 'request failed';
    if (/telegram\.org|127\.0\.0\.1|localhost|monetag|libtl|propeller/i.test(url)) expected.push(`request: ${url} · ${failure}`);
  });
  return { scenario, unexpected, expected };
}

async function gotoMarketplace(page) {
  await page.goto(`${baseURL}/marketplace.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.mp-card[data-listing-id]', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('#mp-grid')?.getAttribute('aria-busy') === 'false', null, { timeout: 30000 });
  await page.keyboard.press('Escape').catch(() => {});
  await page.mouse.move(4, 4);
}

async function measurePage(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const bodyText = document.body?.innerText || '';
    const createPanel = document.getElementById('mp-create-panel');
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: Math.max(root.scrollWidth, document.body?.scrollWidth || 0),
      overflowPx: Math.max(0, Math.max(root.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth),
      cardCount: document.querySelectorAll('.mp-card[data-listing-id]').length,
      curatedPreviewCount: document.querySelectorAll('.mp-card[data-listing-id] .mp-curated-preview').length,
      rawLoadingCount: (bodyText.match(/\bLoading(?:\.{3}|…)?\b/gi) || []).length,
      createPanelHidden: Boolean(createPanel?.classList.contains('mp-create-hidden')),
      createPanelAriaHidden: createPanel?.getAttribute('aria-hidden'),
      networkState: document.getElementById('mp-contract-trust-center')?.getAttribute('data-network-state') || '',
      networkStatus: document.getElementById('mp-network-status')?.textContent?.trim() || '',
      sourceVerifiedContracts: [...document.querySelectorAll('[id^="mp-"][id$="-status"]')].filter((node) => /Source-verified mapping/i.test(node.textContent || '')).length,
      explorerLinks: [...document.querySelectorAll('#mp-contract-grid a')].filter((node) => node.getAttribute('href')?.includes('polygonscan.com/address/')).length
    };
  });
}

async function desktopMarketplaceScenario(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const diagnostics = attachDiagnostics(page, 'desktop-marketplace');
  await gotoMarketplace(page);
  const firstRender = await measurePage(page);

  await page.locator('#mp-contract-trust-center').screenshot({
    path: path.join(screenshotDir, '01-marketplace-desktop-contract-trust.png'),
    animations: 'disabled'
  });
  await page.locator('#mp-grid').scrollIntoViewIfNeeded();
  await page.locator('#mp-grid').screenshot({
    path: path.join(screenshotDir, '02-marketplace-desktop-curated-grid.png'),
    animations: 'disabled'
  });

  await page.locator('.mp-tab[data-tab="create"]').click();
  await page.waitForFunction(() => document.getElementById('mp-create-panel')?.getAttribute('aria-hidden') === 'false');
  const createOpen = await page.locator('#mp-create-panel').evaluate((node) => ({
    visible: getComputedStyle(node).display !== 'none',
    ariaHidden: node.getAttribute('aria-hidden'),
    title: node.querySelector('.mp-create-title')?.textContent?.trim() || ''
  }));
  await page.locator('#mp-create-panel').screenshot({
    path: path.join(screenshotDir, '03-marketplace-desktop-create-panel.png'),
    animations: 'disabled'
  });
  await page.locator('.mp-tab[data-tab="all"]').click();
  await page.waitForSelector('.mp-card[data-listing-id]');

  await page.locator('.mp-tab[data-tab="all"]').click();
  await page.locator('#mp-filter-max-price').evaluate((element) => {
    element.value = '-1';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#mp-apply-filters-btn').click();
  await page.waitForTimeout(100);
  const emptyStateVisible = await page.locator('.mp-empty-state').isVisible().catch(() => false);
  if (emptyStateVisible) {
    await page.locator('.mp-empty-state').screenshot({
      path: path.join(screenshotDir, '04-marketplace-designed-empty-state.png'),
      animations: 'disabled'
    });
  }
  if (emptyStateVisible) {
    await page.locator('#mp-empty-clear').click();
  } else {
    await page.locator('#mp-clear-filters-btn').click();
  }
  await page.waitForSelector('.mp-card[data-listing-id]');
  await page.locator('.mp-tab[data-tab="ai"]').click();
  await page.waitForSelector('.mp-card[data-listing-id]');
  for (let index = 0; index < 6; index += 1) {
    const loadMore = page.locator('#mp-load-more-btn');
    if (!(await loadMore.isVisible().catch(() => false))) break;
    await loadMore.click();
    await page.waitForTimeout(80);
  }
  const lootboxCard = page.locator('.mp-card[data-listing-id]').filter({ has: page.locator('.mp-lootbox-card-disclosure') }).first();
  await lootboxCard.scrollIntoViewIfNeeded();
  const lootboxCardText = ((await lootboxCard.textContent()) || '').trim();
  await lootboxCard.screenshot({
    path: path.join(screenshotDir, '05-marketplace-lootbox-card-odds.png'),
    animations: 'disabled'
  });
  await lootboxCard.locator('.mp-buy-btn').click();
  await page.waitForSelector('#mp-modal-backdrop');
  const detailModal = page.locator('#mp-modal-backdrop');
  const detailText = (await detailModal.innerText()).trim();
  const detailPercentages = detailText.match(/\d+(?:\.\d+)?%/g) || [];
  await detailModal.screenshot({
    path: path.join(screenshotDir, '06-marketplace-lootbox-detail-disclosure.png'),
    animations: 'disabled'
  });
  await page.locator('#mp-modal-open-lootbox-btn').click();
  await page.waitForSelector('.eon-lootbox-opening-modal');
  const openingModal = page.locator('.eon-lootbox-opening-modal');
  const openingText = (await openingModal.innerText()).trim();
  const openingDetails = await openingModal.evaluate((node) => ({
    hasPre: Boolean(node.querySelector('pre')),
    oddsRows: node.querySelectorAll('.eon-lootbox-odds-row').length,
    poolItems: node.querySelectorAll('.eon-lootbox-pool-list span').length,
    overflowPx: Math.max(0, node.scrollWidth - node.clientWidth)
  }));
  await openingModal.screenshot({
    path: path.join(screenshotDir, '07-marketplace-lootbox-opening-disclosure.png'),
    animations: 'disabled'
  });
  await openingModal.locator('[data-eon-lootbox-close]').click();
  await page.locator('#mp-modal-close-btn').click();

  const result = {
    firstRender,
    createOpen,
    emptyStateVisible,
    lootboxCardText,
    detail: {
      hasOddsHeading: /Odds visible before opening/i.test(detailText),
      hasUtilityPool: /Possible utility reward pool/i.test(detailText),
      hasOpenOnceRule: /Opening consumes the sealed box/i.test(detailText),
      hasNoProfitRule: /No cash prize|No cash-out|profit promise/i.test(detailText),
      percentageCount: detailPercentages.length
    },
    opening: {
      hasOddsHeading: /Disclosed odds/i.test(openingText),
      hasUtilityPool: /Possible utility reward pool/i.test(openingText),
      hasNoProfitRule: /No cash prize|No cash-out|profit promise/i.test(openingText),
      ...openingDetails
    },
    diagnostics
  };
  await context.close();
  return result;
}

async function walletNetworkScenario(browser, name, chainId) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const diagnostics = attachDiagnostics(page, name);
  await page.addInitScript(({ injectedChainId }) => {
    const listeners = new Map();
    const provider = {
      selectedAddress: '0x1111111111111111111111111111111111111111',
      async request({ method }) {
        if (method === 'eth_chainId') return injectedChainId;
        if (method === 'eth_accounts') return [this.selectedAddress];
        return null;
      },
      on(event, handler) { listeners.set(event, handler); },
      removeListener(event) { listeners.delete(event); }
    };
    Object.defineProperty(window, 'ethereum', { configurable: true, enumerable: true, value: provider });
  }, { injectedChainId: chainId });
  await gotoMarketplace(page);
  await page.waitForTimeout(100);
  const measurement = await measurePage(page);
  await page.locator('#mp-contract-trust-center').screenshot({
    path: path.join(screenshotDir, name === 'wallet-correct-network' ? '08-marketplace-wallet-correct-network.png' : '09-marketplace-wallet-wrong-network.png'),
    animations: 'disabled'
  });
  await context.close();
  return { measurement, diagnostics };
}

async function mobileMarketplaceScenario(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const diagnostics = attachDiagnostics(page, 'mobile-marketplace');
  await gotoMarketplace(page);
  const firstRender = await measurePage(page);
  await page.locator('#mp-contract-trust-center').scrollIntoViewIfNeeded();
  await page.locator('#mp-contract-trust-center').screenshot({
    path: path.join(screenshotDir, '10-marketplace-mobile-contract-trust.png'),
    animations: 'disabled'
  });
  const firstCard = page.locator('.mp-card[data-listing-id]').first();
  await firstCard.scrollIntoViewIfNeeded();
  await firstCard.screenshot({
    path: path.join(screenshotDir, '11-marketplace-mobile-curated-card.png'),
    animations: 'disabled'
  });
  await firstCard.locator('.mp-buy-btn').click();
  await page.waitForSelector('#mp-modal-backdrop');
  const modalLayout = await page.locator('#mp-modal-backdrop').evaluate((node) => ({
    viewportWidth: window.innerWidth,
    documentOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    modalOverflowPx: Math.max(0, node.scrollWidth - node.clientWidth),
    closeTarget: (() => {
      const rect = node.querySelector('#mp-modal-close-btn')?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : null;
    })()
  }));
  await page.locator('#mp-modal-backdrop').screenshot({
    path: path.join(screenshotDir, '12-marketplace-mobile-listing-detail.png'),
    animations: 'disabled'
  });
  await page.locator('#mp-modal-close-btn').click();
  await context.close();
  return { firstRender, modalLayout, diagnostics };
}

async function rewardReferralTelegramScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await context.route('https://telegram.org/**', (route) => route.abort('blockedbyclient'));
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const diagnostics = attachDiagnostics(page, 'reward-referral-telegram');

  await page.goto(`${baseURL}/reward-access.html?mode=telegram`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#reward-copy-ref');
  await page.waitForTimeout(1200);
  const reward = await page.evaluate(() => ({
    title: document.getElementById('reward-gate-title')?.textContent?.trim() || '',
    status: document.getElementById('reward-gate-status')?.textContent?.trim() || '',
    referralButton: document.getElementById('reward-copy-ref')?.textContent?.trim() || '',
    continueLabel: document.getElementById('reward-open-target')?.textContent?.trim() || '',
    bodyCopy: document.querySelector('main')?.innerText || '',
    rewardSlots: document.querySelectorAll('[data-reward-ad-slot]').length
  }));
  await page.locator('.reward-gate-shell').screenshot({
    path: path.join(screenshotDir, '13-reward-access-telegram-path.png'),
    animations: 'disabled'
  });

  await page.goto(`${baseURL}/telegram.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#telegramStatus');
  await page.waitForTimeout(800);
  const telegram = await page.evaluate(() => ({
    status: document.getElementById('telegramStatus')?.textContent?.trim() || '',
    headings: [...document.querySelectorAll('h2')].map((node) => node.textContent?.trim()).filter(Boolean),
    rewardLinks: document.querySelectorAll('[data-telegram-route="reward"]').length,
    channelLinks: [...document.querySelectorAll('a[href="https://t.me/EonApps"]')].length,
    proofText: document.getElementById('tg-proof-title')?.parentElement?.innerText || ''
  }));
  await page.locator('.tg-shell').screenshot({
    path: path.join(screenshotDir, '14-telegram-reward-center.png'),
    animations: 'disabled'
  });

  await page.goto(`${baseURL}/referral.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.body.dataset.state === 'error', null, { timeout: 15000 });
  const referral = await page.evaluate(() => ({
    state: document.body.dataset.state || '',
    status: document.getElementById('referral-status')?.textContent?.trim() || '',
    detail: document.getElementById('referral-detail')?.textContent?.trim() || '',
    continueVisible: !document.getElementById('referral-continue')?.hidden,
    continueHref: document.getElementById('referral-continue')?.getAttribute('href') || ''
  }));
  await page.locator('main.card').screenshot({
    path: path.join(screenshotDir, '15-referral-invalid-link-safe-state.png'),
    animations: 'disabled'
  });

  await context.close();
  return { reward, telegram, referral, diagnostics };
}

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    chromiumSandbox: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=Translate,OptimizationHints',
      '--no-proxy-server',
      '--proxy-bypass-list=*',
      '--hide-scrollbars'
    ]
  });

  const [desktopScenario, correctNetworkScenario, wrongNetworkScenario, mobileScenario, rewardReferralTelegramScenarioResult] = await Promise.all([
    desktopMarketplaceScenario(browser),
    walletNetworkScenario(browser, 'wallet-correct-network', '0x89'),
    walletNetworkScenario(browser, 'wallet-wrong-network', '0x1'),
    mobileMarketplaceScenario(browser),
    rewardReferralTelegramScenario(browser)
  ]);
  report.scenarios.desktop = desktopScenario;
  report.scenarios.correctNetwork = correctNetworkScenario;
  report.scenarios.wrongNetwork = wrongNetworkScenario;
  report.scenarios.mobile = mobileScenario;
  report.scenarios.rewardReferralTelegram = rewardReferralTelegramScenarioResult;

  const d = report.scenarios.desktop;
  const correct = report.scenarios.correctNetwork.measurement;
  const wrong = report.scenarios.wrongNetwork.measurement;
  const mobile = report.scenarios.mobile;
  const integrations = report.scenarios.rewardReferralTelegram;

  report.checks = {
    firstRenderHasCuratedListings: d.firstRender.cardCount >= 12 && d.firstRender.curatedPreviewCount === d.firstRender.cardCount,
    noRawMarketplaceLoadingText: d.firstRender.rawLoadingCount === 0 && mobile.firstRender.rawLoadingCount === 0,
    createPanelStartsHidden: d.firstRender.createPanelHidden === true && d.firstRender.createPanelAriaHidden === 'true',
    createPanelOpensOnDemand: d.createOpen.visible === true && d.createOpen.ariaHidden === 'false' && /Sell the thing/i.test(d.createOpen.title),
    designedEmptyStateWorks: d.emptyStateVisible === true,
    sourceVerifiedContractMappings: d.firstRender.sourceVerifiedContracts === 3 && d.firstRender.explorerLinks === 3,
    walletNotConnectedStateHonest: d.firstRender.networkState === 'wallet-not-connected',
    correctWalletNetworkVerified: correct.networkState === 'verified-network' && /matches/i.test(correct.networkStatus),
    wrongWalletNetworkExplicit: wrong.networkState === 'wrong-network' && /switch to Polygon Mainnet/i.test(wrong.networkStatus),
    desktopNoHorizontalOverflow: d.firstRender.overflowPx <= 1,
    mobileNoHorizontalOverflow: mobile.firstRender.overflowPx <= 1 && mobile.modalLayout.documentOverflowPx <= 1 && mobile.modalLayout.modalOverflowPx <= 1,
    mobileCloseTargetUsable: Number(mobile.modalLayout.closeTarget?.width || 0) >= 44 && Number(mobile.modalLayout.closeTarget?.height || 0) >= 44,
    lootboxCardDisclosesOdds: /Disclosed odds/i.test(d.lootboxCardText) && /Open once/i.test(d.lootboxCardText),
    lootboxDetailDisclosesBeforeOpen: d.detail.hasOddsHeading && d.detail.hasUtilityPool && d.detail.hasOpenOnceRule && d.detail.hasNoProfitRule && d.detail.percentageCount >= 4,
    lootboxOpeningUsesReadableDisclosure: d.opening.hasOddsHeading && d.opening.hasUtilityPool && d.opening.hasNoProfitRule && d.opening.hasPre === false && d.opening.oddsRows >= 4 && d.opening.poolItems >= 4 && d.opening.overflowPx <= 1,
    rewardPathShowsReferralAndValuedProof: /Copy referral link/i.test(integrations.reward.referralButton) && /valued postback|postback/i.test(integrations.reward.bodyCopy) && integrations.reward.rewardSlots >= 1,
    telegramRewardCenterAndChannelPresent: integrations.telegram.rewardLinks >= 2 && integrations.telegram.channelLinks >= 2 && integrations.telegram.headings.includes('Reward Center') && /valued postbacks/i.test(integrations.telegram.proofText),
    invalidReferralFailsSafe: integrations.referral.state === 'error' && /could not be verified/i.test(integrations.referral.status) && integrations.referral.continueVisible === true && integrations.referral.continueHref === '/',
    noUnhandledBrowserErrors: Object.values(report.scenarios).every((scenario) => scenario.diagnostics?.unexpected?.length === 0)
  };

  for (const scenario of Object.values(report.scenarios)) {
    report.unexpectedErrors.push(...(scenario.diagnostics?.unexpected || []).map((error) => `${scenario.diagnostics.scenario}: ${error}`));
    report.expectedEnvironmentNotes.push(...(scenario.diagnostics?.expected || []).map((note) => `${scenario.diagnostics.scenario}: ${note}`));
  }
  report.expectedEnvironmentNotes = [...new Set(report.expectedEnvironmentNotes)];
  report.passed = Object.values(report.checks).filter(Boolean).length;
  report.total = Object.keys(report.checks).length;
  report.score = Math.round((report.passed / report.total) * 100);
  report.ok = report.passed === report.total;
} catch (error) {
  report.error = String(error?.stack || error);
} finally {
  if (browser) await browser.close().catch(() => {});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

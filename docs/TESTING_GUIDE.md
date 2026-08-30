# EONAPP Trading System - E2E Test Guide

**Date**: May 10, 2026  
**Status**: Production Test Suite  
**Coverage**: Trading features, safety gates, orchestration, paper trading

---

## Quick Start

### Install Dependencies
```bash
npm install
npm install -D @playwright/test
```

### Run All Tests
```bash
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:trading           # Trading feature tests only
npm run test:e2e:safety            # Safety/orchestration tests
npm run test:e2e:paper             # Paper trading tests
npm run test:integration           # Integration workflows
npm run test:e2e:ui                # Run with visible browser
npm run test:e2e:debug             # Debug mode (step through)
npm run test:e2e:report            # View HTML report
```

---

## Test Architecture

### Test Structure
```
tests/
├── e2e/                          # End-to-end user journeys
│   ├── signal-trading.spec.ts    # Multi-exchange quote fetching, charting, API setup
│   ├── safety-orchestration.spec.ts  # Approval gates, risk limits, emergency stop
│   └── paper-trading.spec.ts     # Position entry/exit, PnL, SL/TP automation
├── integration/                   # Multi-component workflows
│   └── trading-workflow.spec.ts   # Full trading flow: entry → monitor → exit
└── fixtures/                      # Reusable test utilities
    └── index.ts                   # Custom fixtures, mocks, helpers
```

### Test Framework
- **Framework**: Playwright Test (@playwright/test)
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel**: Enabled (workers: auto)
- **Retries**: 2 on CI, 0 locally
- **Reporting**: HTML, JSON, JUnit

---

## Test Suites Overview

### 1. Signal Trading Tests (`signal-trading.spec.ts`)

**Purpose**: Validate multi-exchange data fetching, charting, and trading UI

#### Tests:
- ✅ **Load Signal Page**: Verify market data section, exchange selector, chart canvas render
- ✅ **Multi-Exchange Quotes**: Fetch quotes from Binance/Coinbase/Kraken, verify display
- ✅ **Chart Rendering**: Load OHLC candlestick chart with valid data
- ✅ **API Key Storage**: Save/retrieve Binance keys securely, verify masking
- ✅ **Portfolio Fetch**: Binance read-only endpoint (live), Coinbase/Kraken mocked
- ✅ **Trade Suggestions**: Generate AI trade suggestions via signal mode
- ✅ **Exchange Switching**: Change data source, verify chart updates

**Run**:
```bash
npm run test:e2e:trading
npm run test:e2e:trading -- --headed  # with UI
```

---

### 2. Safety & Orchestration Tests (`safety-orchestration.spec.ts`)

**Purpose**: Verify approval gates, risk limits, nonce validation, emergency controls

#### Tests:
- ✅ **Unauthorized Trading Block**: Order button disabled until API configured
- ✅ **Large Trade Approval**: Approval modal required for trades > threshold
- ✅ **Position Size Limits**: Reject trades exceeding risk budget
- ✅ **Signature Verification**: Invalid signatures rejected
- ✅ **Nonce Replay Protection**: Duplicate nonces detected and rejected
- ✅ **Audit Trail**: All trading actions logged
- ✅ **Emergency Stop**: Kill-switch disables trading immediately

**Run**:
```bash
npm run test:e2e:safety
npm run test:e2e:safety -- --headed
```

---

### 3. Paper Trading Tests (`paper-trading.spec.ts`)

**Purpose**: Validate virtual trading system, PnL calculations, stop-loss/take-profit

#### Tests:
- ✅ **Ledger Initialization**: 10,000 EONL starting balance
- ✅ **Position Entry**: Buy/sell entry with fee modeling (0.1%)
- ✅ **PnL Calculation**: Unrealized PnL tracked per position
- ✅ **Position Exit**: Close position, calculate realized profit/loss
- ✅ **Trade Statistics**: Win rate, total trades, max drawdown
- ✅ **Position Limits**: Reject positions > 10% of balance
- ✅ **SL/TP Orders**: Auto-close positions at stop-loss/take-profit levels

**Run**:
```bash
npm run test:e2e:paper
npm run test:e2e:paper -- --headed
```

---

### 4. Integration Workflow Tests (`trading-workflow.spec.ts`)

**Purpose**: Full end-to-end trading journeys combining multiple features

#### Tests:
- ✅ **Complete Trade Workflow**: Entry → PnL monitoring → exit → statistics update
- ✅ **Multi-Position Management**: 3+ concurrent positions with aggregated PnL
- ✅ **Risk Management Enforcement**: Position limits enforced across all trades
- ✅ **Drawdown Metrics**: Accurate calculation of max drawdown from losing trades

**Run**:
```bash
npm run test:e2e:integration
npm run test:e2e:integration -- --headed
```

---

## Test Fixtures & Utilities

### Custom Fixtures (tests/fixtures/index.ts)

#### `signalPage` Fixture
Auto-navigates to `/signal` and waits for network idle
```typescript
test('example', async ({ signalPage }) => {
  // signalPage is ready to use
  await expect(signalPage).toHaveTitle(/signal/i);
});
```

#### `mockExchangeData` Fixture
Intercepts fetch calls to exchange APIs, returns mock data
```typescript
test('example', async ({ page, mockExchangeData }) => {
  await mockExchangeData(page);
  // Now Binance/Coinbase/Kraken requests return mocked data
});
```

#### `setupBinanceAPI` Fixture
Fills API key/secret inputs and triggers connection
```typescript
test('example', async ({ page, setupBinanceAPI }) => {
  await setupBinanceAPI(page, 'test-key', 'test-secret');
  // Binance API connection simulated
});
```

---

## Common Test Patterns

### Pattern 1: Waiting for Elements
```typescript
// Wait for element to be visible
await expect(page.locator('text=Connect')).toBeVisible();

// Wait for element with timeout
await page.locator('button').waitFor({ timeout: 5000 });
```

### Pattern 2: Form Filling
```typescript
// Fill input
const input = page.locator('input[placeholder="API Key"]');
await input.fill('test-key-12345');

// Select from dropdown
const select = page.locator('select[name="exchange"]');
await select.selectOption('binance');
```

### Pattern 3: API Mocking
```typescript
// Add script to mock fetch
await page.addInitScript(() => {
  window.fetch = async (url) => {
    if (url.includes('api.binance.com')) {
      return new Response(JSON.stringify(mockData));
    }
    return originalFetch(url);
  };
});
```

### Pattern 4: Extracting Values
```typescript
// Get text content
const text = await page.locator('[data-testid="balance"]').textContent();

// Get attribute
const value = await page.locator('input').inputValue();

// Count elements
const count = await page.locator('tr').count();
```

---

## Debugging Tips

### Run Single Test
```bash
npx playwright test signal-trading.spec.ts --grep "should load signal page"
```

### Debug Mode (Step Through)
```bash
npm run test:e2e:debug
# Opens browser with debugger, step through code
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:trading -- --headed
```

### Trace Recording (Record Actions)
```bash
npx playwright test --trace on
# Generates traces that can be replayed
npx playwright show-trace test-results/trace.zip
```

### Screenshot on Failure
```bash
# Automatically captured if test fails
# Check: test-results/
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Trading Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Data Management

### Session Storage Cleanup
```typescript
// Clear storage between tests
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### Seeding Test Data
```typescript
// Inject mock positions before test
await page.evaluate(() => {
  const positions = [
    { id: 'pos1', symbol: 'BTCUSDT', side: 'buy', quantity: 1 }
  ];
  localStorage.setItem('paperPositions', JSON.stringify(positions));
});
```

---

## Performance Benchmarks

### Target Metrics
| Scenario | Target | Status |
|----------|--------|--------|
| Page load (signal) | < 3s | ✅ |
| Quote fetch (3 exchanges) | < 2s | ✅ |
| Chart render (200 candles) | < 1.5s | ✅ |
| Paper trade entry | < 1s | ✅ |
| PnL calculation | < 100ms | ✅ |

---

## Known Limitations

1. **Coinbase/Kraken**: Use secure relay (backend required for live testing)
2. **Real API Keys**: Tests use mock data; live key testing requires environment setup
3. **Browser Isolation**: Each test runs in isolation; no cross-test state
4. **Rate Limits**: Mock APIs don't enforce real exchange rate limits

---

## Troubleshooting

### Issue: "Locator not found"
```typescript
// Solution: Add explicit wait
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="element"]');
```

### Issue: "Timeout waiting for element"
```typescript
// Solution: Increase timeout or check selector
await expect(element).toBeVisible({ timeout: 10000 });
```

### Issue: "Flaky test" (sometimes passes, sometimes fails)
```typescript
// Solution: Add retries or wait conditions
await page.waitForTimeout(500); // Brief pause
await expect(element).toBeStable(); // Wait for element to stabilize
```

---

## Next Steps

1. **Run tests locally**: `npm run test:e2e:trading`
2. **View report**: `npm run test:e2e:report`
3. **Integrate CI/CD**: Add to GitHub Actions
4. **Expand coverage**: Add more test scenarios as features grow
5. **Performance monitoring**: Track test execution times

---

**For support**: Check Playwright docs at https://playwright.dev/

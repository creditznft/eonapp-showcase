# EONAPP Trading System - Quick Reference

## Essential Commands

### Development
```bash
npm run dev              # Start dev server (localhost:5173)
npm run build           # Production build
npm run lint            # Lint all code
npm run lint:fix        # Auto-fix lint issues
```

### Testing
```bash
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:trading           # Trading feature tests only
npm run test:e2e:safety            # Safety/approval tests
npm run test:e2e:paper             # Paper trading tests
npm run test:integration           # Integration workflows
npm run test:e2e:ui                # Run tests with visible browser
npm run test:e2e:debug             # Step-through debugging
npm run test:e2e:report            # View HTML test report
```

---

## Key Modules

### Paper Trading
```javascript
import { paperTradingLedger } from './paper-trading-ledger.js';

// Entry
paperTradingLedger.enterPosition({
  symbol: 'BTCUSDT',
  side: 'buy',
  quantity: 1.0,
  currentPrice: 65000,
  stopLoss: 55000,
  takeProfit: 75000
});

// Exit
paperTradingLedger.exitPosition(positionId, currentPrice);

// Stats
const stats = paperTradingLedger.getStatistics();
// { totalTrades, winRate, profitFactor, netProfit, maxDrawdown, roi }
```

### Trading Indicators
```javascript
import { TradingIndicators } from './trading-indicators.js';

const indicators = new TradingIndicators(candleData);
const ema20 = indicators.ema(closes, 20);
const rsi14 = indicators.rsi(closes, 14);
const macd = indicators.macd(closes);
const signal = indicators.generateSignal(); // { signal, confidence, indicators }
```

### Multi-Exchange Data
```javascript
import {
  fetchTicker,
  fetchCandles,
  fetchAggregateTickers,
  fetchPortfolioReadOnly,
  executePaperTrade,
  getPaperTradingStats
} from './trading-connectors.js';

// Get quotes from all exchanges
const agg = await fetchAggregateTickers('BTCUSDT');
// { symbol, avgPrice, sources, sourceCount }

// Get chart data
const candles = await fetchCandles('binance', 'BTCUSDT', '1h');

// Get portfolio (Binance live, Coinbase/Kraken via relay)
const portfolio = await fetchPortfolioReadOnly('binance', {
  apiKey: 'xxx',
  apiSecret: 'yyy'
});
```

### Secure Relay (Browser Client)
```javascript
import { SecureTradeRelayClient } from './secure-trade-relay.js';

const relay = new SecureTradeRelayClient();
const account = await relay.getCoinbaseAccount();
const balance = await relay.getKrakenAccount();
```

---

## API Endpoints (Exchange)

### Binance
```
Public:  https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
         https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200
Private: https://api.binance.com/api/v3/account (with HMAC signing)
```

### Coinbase
```
Public:  https://api.exchange.coinbase.com/products/BTC-USD/ticker
         https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600
Private: https://api.coinbase.com/api/v1/accounts (needs secure relay)
```

### Kraken
```
Public:  https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD
         https://api.kraken.com/0/public/OHLC?pair=XXBTZUSD&interval=60
Private: https://api.kraken.com/0/private/Balance (needs secure relay)
```

---

## Test Files

```
tests/
├── e2e/
│   ├── signal-trading.spec.ts         # 7 trading feature tests
│   ├── safety-orchestration.spec.ts   # 7 safety/approval tests
│   └── paper-trading.spec.ts          # 8 paper trading tests
├── integration/
│   └── trading-workflow.spec.ts       # 4 full workflow tests
└── fixtures/
    └── index.ts                       # Reusable test utilities
```

---

## Data Storage

### localStorage Keys
```javascript
localStorage.getItem('paperTradingLedger')
localStorage.getItem('paperPositions')      // Open positions
localStorage.getItem('closedTrades')         // Closed trades
```

### Structure
```javascript
// Paper Trading Ledger
{
  initialBalance: 10000,
  balance: 9500,
  positions: [{ id, symbol, side, quantity, entryPrice, status, ... }],
  closedTrades: [{ id, pnl, pnlPercent, exitedAt, ... }],
  stats: { totalTrades, winRate, roi, maxDrawdown, ... }
}
```

---

## UI Components

### Signal Page Elements
```html
<!-- Charts -->
<canvas id="chart-canvas"></canvas>

<!-- Market Data -->
<select name="exchange">
  <option>binance</option>
  <option>coinbase</option>
  <option>kraken</option>
</select>

<!-- Paper Trading -->
<input name="symbol" placeholder="BTCUSDT">
<select name="side">
  <option>buy</option>
  <option>sell</option>
</select>
<input name="quantity" placeholder="1.0">
<input name="stopLoss" placeholder="55000">
<input name="takeProfit" placeholder="75000">
<button onclick="executePaperTrade()">Execute</button>
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Page load | < 3s | Includes network requests |
| Quote fetch | < 2s | 3+ exchanges aggregated |
| Chart render | < 1.5s | 200+ candles on canvas |
| Paper trade | < 1s | Entry/exit processing |
| PnL calc | < 100ms | Real-time updates |

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Lint errors | Run `npm run lint:fix` |
| Tests timeout | Increase timeout in playwright.config.ts |
| API 403 (CORS) | Use secure relay for private APIs |
| Chart not rendering | Verify canvas element exists |

---

## Environment Variables (Backend)

```bash
COINBASE_API_KEY=xxx
COINBASE_API_SECRET=yyy
KRAKEN_API_KEY=aaa
KRAKEN_API_SECRET=bbb
```

---

## Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Lint clean: `npm run lint`
- [ ] Tests pass: `npm run test:e2e`
- [ ] Backend relay configured
- [ ] Environment variables set
- [ ] API keys secured in backend
- [ ] CORS headers configured
- [ ] Rate limits enforced
- [ ] Monitoring/alerting setup

---

**For full documentation, see**: `docs/TESTING_GUIDE.md` and `docs/TRADING_IMPLEMENTATION_SUMMARY.md`

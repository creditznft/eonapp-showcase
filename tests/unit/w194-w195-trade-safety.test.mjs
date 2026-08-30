import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHistoricalScenarioReview } from '../../assets/js/market-intelligence/market-intelligence-analytics.js';
import { createForecast } from '../../assets/js/market-intelligence/market-intelligence-forecast.js';
import { MARKET_INTELLIGENCE_SAFETY_CONTRACT } from '../../assets/js/market-intelligence/market-intelligence-safety-contract.js';

const tradeHtml = fs.readFileSync(new URL('../../trade.html', import.meta.url), 'utf8');
const tradeJs = fs.readFileSync(new URL('../../assets/js/trade/eon-trade-page.js', import.meta.url), 'utf8');

test('W194 Research Lab presents local analysis, not a broker or order UI', () => {
  assert.match(tradeHtml, /Research Lab/);
  assert.match(tradeHtml, /manual reference values/i);
  assert.match(tradeHtml, /Import your CSV/);
  assert.match(tradeHtml, /Scenario Studio/);
  assert.match(tradeHtml, /not personal investment advice/i);
  assert.doesNotMatch(tradeHtml, /Connect Exchange|API key|API secret|type="password"|Place order/i);
  assert.doesNotMatch(tradeHtml, /trading-lab-page\.js|signal-page\.js/);
});

test('W195 Research Lab refuses credentials, broker execution and economic forecasts', () => {
  assert.equal(MARKET_INTELLIGENCE_SAFETY_CONTRACT.externalNetwork, false);
  assert.equal(MARKET_INTELLIGENCE_SAFETY_CONTRACT.liveExecution, false);
  assert.equal(MARKET_INTELLIGENCE_SAFETY_CONTRACT.economicIncentives, false);
  const forecast = createForecast({ title: 'Will demand rise?', resolutionCriteria: 'Compare monthly bookings.', probability: 52, dueAt: '2026-08-01', reward: 'token' });
  assert.equal(forecast.ok, false);
});

test('local historical scenario review works without a future prediction or external side effect', () => {
  const review = createHistoricalScenarioReview([
    { time: '2026-01-01', value: 100 },
    { time: '2026-01-02', value: 110 }
  ], { referenceValue: 250 });
  assert.equal(review.externalSideEffects, false);
  assert.equal(review.liveMarketData, false);
  assert.equal(review.prediction, false);
  assert.equal(review.hypotheticalEndValue, 275);
});

test('trade UI records local research activity and contains no runtime network or order client', () => {
  assert.match(tradeJs, /appendOperatorActivity/);
  assert.match(tradeJs, /createMarketIntelligenceReceipt/);
  assert.doesNotMatch(tradeJs, /fetch\s*\(|WebSocket|XMLHttpRequest|placeOrder|submitOrder|executeLive/);
});

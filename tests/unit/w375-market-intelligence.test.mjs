import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseMarketIntelligenceCsv } from '../../assets/js/market-intelligence/market-intelligence-csv.js';
import { createHistoricalScenarioReview, summarizeLocalSeries } from '../../assets/js/market-intelligence/market-intelligence-analytics.js';
import { buildForecastCalibrationSummary, createForecast } from '../../assets/js/market-intelligence/market-intelligence-forecast.js';
import { addLocalDataset, createDefaultMarketIntelligenceState, resolveLocalForecast, sanitizeMarketIntelligenceState } from '../../assets/js/market-intelligence/market-intelligence-store.js';
import { createMarketIntelligenceReceipt, validateMarketIntelligenceReceipt } from '../../assets/js/market-intelligence/market-intelligence-receipt.js';
import { auditMarketIntelligenceSafety } from '../../scripts/w375-market-intelligence-safety-gate.mjs';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W375 accepts only normalized local manual or CSV data and keeps the workspace credential-free', () => {
  const state = sanitizeMarketIntelligenceState({ datasets: [{ name: 'Manual', symbol: 'BTC/USDT', sourceKind: 'manual', points: [{ time: '2026-01-01', value: 10 }, { time: '2026-01-02', value: 12 }] }], apiKey: 'must-not-persist' });
  assert.equal(state.datasets.length, 1);
  assert.equal(state.datasets[0].points.length, 2);
  assert.equal('apiKey' in state, false);
  assert.equal(state.datasets[0].sourceKind, 'manual');
});

test('W375 CSV parser discovers time/value pairs without a network request', () => {
  const result = parseMarketIntelligenceCsv('date,close\n2026-01-01,100\n2026-01-02,105\n');
  assert.equal(result.ok, true);
  assert.equal(result.points.length, 2);
  assert.equal(result.detected.valueColumn, 'close');
});

test('W375 historical review is deterministic, local and not a prediction or external order', () => {
  const points = [{ time: '2026-01-01', value: 100 }, { time: '2026-01-02', value: 90 }, { time: '2026-01-03', value: 110 }];
  const summary = summarizeLocalSeries(points);
  const review = createHistoricalScenarioReview(points, { referenceValue: 1000 });
  assert.equal(summary.changePct, 10);
  assert.equal(summary.maxDrawdownPct, 10);
  assert.equal(review.externalSideEffects, false);
  assert.equal(review.liveMarketData, false);
  assert.equal(review.prediction, false);
  assert.equal(review.hypotheticalEndValue, 1100);
});

test('W375 Forecast Oracle rejects economic fields and records calibration only after manual resolution', () => {
  const blocked = createForecast({ title: 'Will demand rise?', resolutionCriteria: 'Monthly bookings are greater than the prior month.', probability: 60, dueAt: '2026-08-01', stake: 100 });
  assert.equal(blocked.ok, false);
  const created = createForecast({ title: 'Will demand rise?', resolutionCriteria: 'Monthly bookings are greater than the prior month.', probability: 60, dueAt: '2026-08-01', domain: 'business' });
  assert.equal(created.ok, true);
  let state = createDefaultMarketIntelligenceState();
  state.forecasts.push(created.forecast);
  state = resolveLocalForecast(state, created.forecast.id, 'yes');
  const calibration = buildForecastCalibrationSummary(state.forecasts);
  assert.equal(calibration.resolvedCount, 1);
  assert.equal(calibration.meanBrierScore, 0.16);
  assert.equal(calibration.policy.monetaryIncentives, false);
});

test('W375 safety receipt makes no network, execution, credential or economic-incentive claim', () => {
  const state = addLocalDataset(createDefaultMarketIntelligenceState(), { name: 'CSV', symbol: 'CSV', sourceKind: 'csv', sourceLabel: 'User-imported file', points: [{ time: '2026-01-01', value: 100 }] });
  const receipt = createMarketIntelligenceReceipt(state, { now: 0 });
  assert.equal(validateMarketIntelligenceReceipt(receipt).ok, true);
  assert.equal(receipt.dataBoundary.externalNetworkRequest, false);
  assert.equal(receipt.activityBoundary.orderCreation, false);
  assert.equal(receipt.forecastBoundary.transferableValue, false);
});

test('W375 /insights visibly exposes Research Lab and not an exchange or credential surface', () => {
  const html = read('trade.html');
  const runtime = read('assets/js/trade/eon-trade-page.js');
  assert.match(html, /<h1 id="mi-title">Research Lab<\/h1>/);
  assert.match(html, /Scenario Studio/);
  assert.match(html, /Import your CSV/);
  assert.doesNotMatch(html, /type="password"|API key|API secret|Connect Exchange/i);
  assert.doesNotMatch(runtime, /fetch\s*\(|placeOrder|submitOrder|executeLive/);
});

test('W375 static safety gate blocks legacy live/connector modules from active source', () => {
  const report = auditMarketIntelligenceSafety({ root: process.cwd() });
  assert.equal(report.ok, true, JSON.stringify(report.failures));
});

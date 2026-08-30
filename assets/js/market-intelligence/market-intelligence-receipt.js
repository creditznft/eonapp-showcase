/** Portable local research receipt. No credentials, execution or market-data claim. */
import { FORECAST_ORACLE_POLICY } from './market-intelligence-forecast.js';

export function createMarketIntelligenceReceipt(state, { now = Date.now() } = {}) {
  const datasets = Array.isArray(state?.datasets) ? state.datasets : [];
  const forecasts = Array.isArray(state?.forecasts) ? state.forecasts : [];
  return {
    schema: 'eon.market-intelligence.research-receipt.v1',
    createdAt: new Date(now).toISOString(),
    mode: 'local-research-workspace',
    counts: {
      datasets: datasets.length,
      localObservations: datasets.reduce((sum, dataset) => sum + (Array.isArray(dataset.points) ? dataset.points.length : 0), 0),
      theses: Array.isArray(state?.theses) ? state.theses.length : 0,
      evidenceNotes: Array.isArray(state?.evidence) ? state.evidence.length : 0,
      forecasts: forecasts.length
    },
    dataBoundary: {
      acceptedSources: ['user-entered manual reference values', 'user-imported CSV files'],
      externalNetworkRequest: false,
      liveMarketData: false,
      licensedDataAttached: false,
      dataFreshnessClaim: false
    },
    activityBoundary: {
      brokerConnection: false,
      exchangeConnection: false,
      credentialCollection: false,
      orderCreation: false,
      orderTransmission: false,
      custody: false
    },
    forecastBoundary: FORECAST_ORACLE_POLICY,
    statements: [
      'This receipt records a local research workspace state only.',
      'It is not an investment recommendation, advice, price target or profit claim.',
      'Local historical reviews do not predict future outcomes.',
      'Scenario Studio has no stake, prize, payout, token, transfer or tradable contract.'
    ]
  };
}

export function validateMarketIntelligenceReceipt(receipt) {
  const errors = [];
  if (receipt?.schema !== 'eon.market-intelligence.research-receipt.v1') errors.push('Unexpected receipt schema.');
  if (receipt?.dataBoundary?.externalNetworkRequest !== false) errors.push('Receipt must not claim an external network request.');
  if (receipt?.dataBoundary?.liveMarketData !== false) errors.push('Receipt must not claim live market data.');
  for (const key of ['brokerConnection', 'exchangeConnection', 'credentialCollection', 'orderCreation', 'orderTransmission', 'custody']) {
    if (receipt?.activityBoundary?.[key] !== false) errors.push(`Activity boundary ${key} must be false.`);
  }
  for (const key of ['monetaryIncentives', 'transferableValue', 'publicMarket', 'automatedResolution', 'personalisedAdvice']) {
    if (receipt?.forecastBoundary?.[key] !== false) errors.push(`Forecast boundary ${key} must be false.`);
  }
  return { ok: errors.length === 0, errors };
}

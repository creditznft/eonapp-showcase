/** Explicit product boundary shared by the page, test suite and release gate. */
export const MARKET_INTELLIGENCE_SAFETY_CONTRACT = Object.freeze({
  schema: 'eon.market-intelligence.safety-contract.v1',
  productName: 'Research Lab',
  canonicalRoute: '/insights',
  legacyRoutes: Object.freeze(['/trade', '/trade.html', '/signal']),
  allowedDataInputs: Object.freeze(['manual reference values', 'user-imported CSV']),
  allowedActivities: Object.freeze(['research notes', 'thesis journal', 'historical scenario review', 'non-monetary forecast calibration', 'business research briefs']),
  prohibitedActivities: Object.freeze(['broker connection', 'exchange connection', 'credential collection', 'order creation', 'order transmission', 'copy trading', 'personalised investment advice', 'live market-data claim', 'prediction-market stake', 'forecast payout', 'tradable forecast contract']),
  externalNetwork: false,
  liveExecution: false,
  economicIncentives: false,
  licensedDataRequiredBeforeActivation: true
});

export function createMarketIntelligenceBoundarySummary() {
  return {
    ...MARKET_INTELLIGENCE_SAFETY_CONTRACT,
    allowedDataInputs: [...MARKET_INTELLIGENCE_SAFETY_CONTRACT.allowedDataInputs],
    allowedActivities: [...MARKET_INTELLIGENCE_SAFETY_CONTRACT.allowedActivities],
    prohibitedActivities: [...MARKET_INTELLIGENCE_SAFETY_CONTRACT.prohibitedActivities]
  };
}

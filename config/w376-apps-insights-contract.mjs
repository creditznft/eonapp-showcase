/** W376 contract: expanded free official Blueprint Packs + Insights & Forecasts inside Apps. */

export const W376_APPS_INSIGHTS_CONTRACT = Object.freeze({
  wave: 'W376',
  title: 'Apps catalogue expansion and Insights & Forecasts routing',
  appRoute: '/apps',
  canonicalRoute: '/insights',
  compatibilityRoute: '/trade',
  categories: Object.freeze(['workrooms', 'blueprints', 'insights', 'crew', 'connections']),
  insightsDeskIds: Object.freeze(['market', 'business', 'forecast', 'research', 'data']),
  historicalOfficialBlueprintCount: 20,
  historicalOfficialLocalWorkflowCount: 10,
  minimumOfficialBlueprintCount: 20,
  minimumOfficialLocalWorkflowCount: 10,
  boundaries: Object.freeze({
    localFirst: true,
    paymentActive: false,
    entitlementActive: false,
    providerCallActive: false,
    externalExecutionActive: false,
    liveFinancialDataActive: false,
    brokerOrOrderActive: false,
    economicForecastActive: false
  }),
  requiredBehavior: Object.freeze([
    'Apps retains all W362 categories and adds Insights & Forecasts as a curated Apps collection.',
    'Insights cards use direct local /insights desk links; /trade remains inbound-only compatibility and does not create an account connection, provider request or payment state.',
    'Twenty versioned official Blueprints only prepare local reviewable workflow drafts.',
    'Ten official local workflow templates use only the local runner and simulation/approval model.',
    'Research Lab is public at /insights; /trade remains a redirect-only compatibility alias and is never emitted by active Apps navigation.',
    'No purchase, subscription, paid access, entitlement, payment processor, broker, live feed or economic-forecast feature is activated.'
  ])
});

export function validateW376AppsInsightsContract() {
  const errors = [];
  const contract = W376_APPS_INSIGHTS_CONTRACT;
  if (JSON.stringify(contract.categories) !== JSON.stringify(['workrooms', 'blueprints', 'insights', 'crew', 'connections'])) errors.push('W376 category order drifted.');
  if (contract.historicalOfficialBlueprintCount !== 20 || contract.historicalOfficialLocalWorkflowCount !== 10 || contract.minimumOfficialBlueprintCount < 20 || contract.minimumOfficialLocalWorkflowCount < 10) errors.push('W376 historical catalogue baseline drifted.');
  if (JSON.stringify(contract.insightsDeskIds) !== JSON.stringify(['market', 'business', 'forecast', 'research', 'data'])) errors.push('W376 desk IDs drifted.');
  if (contract.canonicalRoute !== '/insights' || contract.compatibilityRoute !== '/trade') errors.push('W376 Research Lab route contract drifted.');
  for (const [key, value] of Object.entries(contract.boundaries)) if (value !== (key === 'localFirst')) errors.push(`W376 boundary ${key} has an invalid value.`);
  return Object.freeze(errors);
}

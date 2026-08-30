/**
 * W265-A0 — source-only first City district decision.
 *
 * This is a narrow product and technical decision, not a launch approval,
 * procurement approval, or real-device performance result.
 */
export const W265_CITY_DISTRICT_DECISION_SCHEMA = 'eon.city.first-district-decision.w265-a0.v1';

export const W265_FIRST_CITY_DISTRICT_DECISION = Object.freeze({
  schema: W265_CITY_DISTRICT_DECISION_SCHEMA,
  status: 'approved-source-only',
  approvedDistrictId: 'orientation',
  landmarkId: 'orientation-hall',
  title: 'Orientation Hall',
  purpose: 'Give first-time visitors one quiet local place to understand City controls and choose their next route themselves.',
  scope: Object.freeze({
    cityLite: true,
    visualTour: true,
    cityPlay: false,
    reason: 'Babylon Play remains the separately scoped Neon Command District proof until W259 real-device evidence and a new performance/art review are complete.'
  }),
  artPolicy: Object.freeze({
    externalAssetSpendApproved: false,
    remoteAssetsAllowed: false,
    provenance: 'original procedural primitives and existing source-controlled renderers only',
    prohibited: Object.freeze(['copied art', 'licensed asset purchase', 'remote texture', 'remote model', 'new runtime dependency'])
  }),
  performancePolicy: Object.freeze({
    defaultSurface: 'City Lite 2D',
    optionalSurface: 'Visual Tour 3D',
    requiredFallback: 'City Lite remains available',
    additionalNpcBudget: 0,
    additionalNetworkRequests: 0,
    additionalBackgroundTasks: 0,
    deviceProofRequiredBeforePlayExpansion: true
  }),
  trustPolicy: Object.freeze({
    route: null,
    automaticNavigation: false,
    networkIo: false,
    walletOrChain: false,
    rewardsOrReferral: false,
    providerOrVaultContext: false,
    commercialSurface: false
  }),
  exitEvidence: Object.freeze([
    'Source parity and local-state migration tests pass.',
    'Real-device W259/W266 visual and performance evidence is reviewed before any Babylon Play district scope grows.',
    'The W260 board remains NO-GO until external readiness gates close.'
  ])
});

export function validateW265FirstCityDistrictDecision(decision = W265_FIRST_CITY_DISTRICT_DECISION) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(decision?.schema === W265_CITY_DISTRICT_DECISION_SCHEMA, 'W265 schema must match.');
  assert(decision?.status === 'approved-source-only', 'W265 is a source-only approval.');
  assert(decision?.approvedDistrictId === 'orientation', 'Orientation is the sole W265 approved district.');
  assert(decision?.landmarkId === 'orientation-hall', 'Orientation Hall landmark must be fixed.');
  assert(decision?.scope?.cityLite === true && decision?.scope?.visualTour === true, 'W265 must cover City Lite and Visual Tour.');
  assert(decision?.scope?.cityPlay === false, 'W265 must not expand Babylon Play without device evidence.');
  assert(decision?.artPolicy?.externalAssetSpendApproved === false && decision?.artPolicy?.remoteAssetsAllowed === false, 'W265 must not approve spend or remote assets.');
  assert(decision?.performancePolicy?.additionalNpcBudget === 0 && decision?.performancePolicy?.additionalNetworkRequests === 0 && decision?.performancePolicy?.additionalBackgroundTasks === 0, 'W265 must retain bounded local performance.');
  assert(decision?.trustPolicy?.route === null && decision?.trustPolicy?.automaticNavigation === false && decision?.trustPolicy?.networkIo === false, 'Orientation Hall must stay local and non-actionable.');
  assert(decision?.trustPolicy?.walletOrChain === false && decision?.trustPolicy?.rewardsOrReferral === false && decision?.trustPolicy?.providerOrVaultContext === false && decision?.trustPolicy?.commercialSurface === false, 'Orientation Hall must exclude value and private surfaces.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

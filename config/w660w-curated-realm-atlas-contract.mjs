export const W660W_CURATED_REALM_ATLAS_CONTRACT = Object.freeze({
  schema: 'eonapp.w660w.curated-realm-atlas.contract.2026-07-21.v1',
  wave: 'W660W',
  product: 'EONCITY: THE LIVING NEXUS',
  sourceStatus: 'implemented-awaiting-authenticated-browser-proof',
  atlas: Object.freeze({
    store: 'existing Living Nexus local store',
    maximumRealmDiscoveries: 24,
    maximumRealmVisits: 12,
    visitFields: Object.freeze(['realmId', 'portalId', 'enteredAt']),
    discoveryFields: Object.freeze(['realmId', 'discoveryId', 'label', 'discoveredAt']),
    explicitConfirmedEntryOnly: true,
    explicitDiscoveryRecordOnly: true,
    sharePermission: 'private',
    projectContentStored: false,
    promptContentStored: false,
    fileContentStored: false,
    identityStored: false,
    credentialsStored: false
  }),
  expeditionLoop: Object.freeze({
    inspectPortal: true,
    prepareEntry: true,
    separateEntryConfirmation: true,
    recordVisitAfterConfirmedEntry: true,
    inspectAuthoredDiscovery: true,
    explicitPrivateAtlasRecord: true,
    reviewProductiveMission: true,
    matchingVerifiedReceiptTransformation: true,
    exactExpanseReturn: true
  }),
  invariants: Object.freeze({
    oneCanonicalLivingNexusStore: true,
    oneCanonicalBabylonScene: true,
    noSecondAtlasDatabase: true,
    noAutomaticNavigation: true,
    noAutomaticExecution: true,
    noPrivateDataRead: true,
    noPrivateContentStored: true,
    noAutomaticShare: true,
    noRewardIssued: true,
    noPaymentClaimed: true
  }),
  proofStillRequired: Object.freeze([
    'authenticated Archive Noir portal-to-return journey',
    'desktop and mobile private Realm Atlas controls',
    'storage survival across reload and app update',
    'six-Realm entry and collision matrix',
    'matching receipt transformation visual proof',
    'Functions-inclusive Cloudflare Pages preview and production proof'
  ])
});

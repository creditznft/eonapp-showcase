/**
 * RT97 AdSense release policy.
 *
 * Source can prove ownership markup, eligible routes and placement boundaries.
 * Account-side approval, Google-certified CMP behavior and Auto Ads preview
 * settings are external release gates and must be verified live after deploy.
 */
export const EON_ADSENSE_ACCOUNT = 'ca-pub-6759380023085970';
export const EON_ADSENSE_PUBLISHER_ID = 'pub-6759380023085970';
export const EON_ADSENSE_ADS_TXT = 'google.com, pub-6759380023085970, DIRECT, f08c47fec0942fa0';

export const EON_ADSENSE_SOURCE_POLICY = Object.freeze({
  schema: 'eonapp.adsense.live-policy.rt97.v1',
  ordinaryDisplayScope: 'reviewed-public-guides-only',
  appWorkSurfacesAllowed: false,
  cityGameplayAllowed: false,
  localAiWorkSurfaceAllowed: false,
  byokWorkSurfaceAllowed: false,
  manualUnitsAllowedWithoutIssuedSlotIds: false,
  incentivizedClicksAllowed: false,
  deceptiveAdjacencyAllowed: false,
  interactiveExclusionAttribute: 'data-adsense-exclusion-area',
  interactiveExclusionValues: Object.freeze(['interactive-tool', 'eonbot-cta'])
});

export const EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY = Object.freeze({
  schema: 'eonapp.adsense.account-activation.rt97.v1',
  status: 'external-verification-required',
  site: 'eonapp.ch',
  pageScope: '/guides',
  recommendedInitialAutoAds: Object.freeze({
    autoAds: true,
    inPageAds: true,
    multiplexAds: true,
    adIntents: false,
    anchorAds: false,
    vignetteAds: false,
    sideRailAds: false,
    rationale: 'Start with low-interruption editorial placements; expand only after live layout and policy review.'
  }),
  requiredPageExclusions: Object.freeze([
    '/', '/local-ai', '/eoncity', '/projects', '/workspace', '/create', '/forge', '/preview-studio',
    '/automations', '/profile', '/vault', '/capsule', '/realm-studio', '/billing', '/settings', '/install',
    '/rewards', '/referral', '/status'
  ]),
  requiredExcludedAreaSelectors: Object.freeze([
    '.eon-guide-tool',
    '.eon-guide-actions',
    '[data-adsense-exclusion-area="interactive-tool"]',
    '[data-adsense-exclusion-area="eonbot-cta"]'
  ]),
  externalGates: Object.freeze([
    'Google site approval / Ready status',
    'Google-certified CMP configured for EEA, UK and Switzerland when applicable',
    'Auto Ads page exclusions applied to non-guide product/work surfaces',
    'Auto Ads excluded areas applied around interactive tools and EONBOT CTAs',
    'Live mobile and desktop layout review after ads actually serve',
    'Core Web Vitals checked after ad serving begins'
  ])
});

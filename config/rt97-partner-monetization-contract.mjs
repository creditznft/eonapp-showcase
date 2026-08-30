/**
 * RT97.1 partner monetization registry.
 *
 * Verification/approval code is separated from live ad serving. Aggressive
 * redirect/pop/push formats are intentionally not enabled in source. Local AI
 * and BYOK inference remain private; commercial monetization is a separate,
 * explicit Sponsored Discovery action.
 */
export const EON_PARTNER_MONETIZATION_SCHEMA = 'eonapp.partner-monetization.rt97-1.v1';

export const EON_INFOLINKS = Object.freeze({
  publisherId: 3447426,
  websiteId: 0,
  script: 'https://resources.infolinks.com/js/infolinks_main.js',
  scope: 'reviewed-public-guides-only',
  sensitivePagesAllowed: false,
  privateChatAllowed: false,
  localAiWorkSurfaceAllowed: false,
  byokWorkSurfaceAllowed: false
});

export const EON_BIDVERTISER = Object.freeze({
  websiteVerificationMarker: '<!-- Bidvertiser2106784 -->',
  publisherAdsEnabledByDefault: false,
  role: 'adsense-backup-after-editorial-review',
  allowedCandidateFormats: Object.freeze(['native', 'smartlink']),
  forbiddenLaunchFormats: Object.freeze(['popunder', 'push', 'in-page-push', 'injection', 'slider']),
  automaticRedirectAllowed: false,
  privateChatAllowed: false
});

export const EON_ZYNTENT = Object.freeze({
  apiBase: 'https://api.zyntent.ai',
  adsSearchPath: '/public_api/v1/ads/search/',
  enabledEnv: 'EON_ZYNTENT_ENABLED',
  apiKeyEnv: 'EON_ZYNTENT_API_KEY',
  sourceIdEnv: 'EON_ZYNTENT_SOURCE_ID',
  placement: 'local_byok_discovery',
  enabledByDefault: false,
  requiresSignedIn: true,
  requiresExplicitReview: true,
  sendsFullConversation: false,
  sendsLocalAnswer: false,
  sendsByokAnswer: false,
  sendsMemory: false,
  sendsProviderKeys: false,
  allowedOutboundIntentFields: Object.freeze(['query', 'country', 'language', 'ads_limit']),
  note: 'Use only after live token/source-id verification and consent/privacy review.'
});

export const EON_SMARTLINK_PARTNERS = Object.freeze({
  adsterra: Object.freeze({
    url: 'https://www.profitableratecpmnetwork.com/r9hvzegha?key=7f403a7af5e89c1bef0eba4183cb7238',
    enabledByDefault: false,
    explicitSponsoredClickOnly: true,
    automaticKeywordRelinking: false
  }),
  monetag: Object.freeze({
    url: 'https://omg10.com/4/7024916',
    enabledByDefault: false,
    explicitSponsoredClickOnly: true,
    automaticKeywordRelinking: false
  })
});

function truthy(value) {
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value ?? '').trim().toLowerCase());
}

export function getPartnerMonetizationRuntimeConfig(env = {}) {
  const zyntentEnabled = truthy(env[EON_ZYNTENT.enabledEnv]);
  const zyntentKey = String(env[EON_ZYNTENT.apiKeyEnv] || '').trim();
  const zyntentSourceId = String(env[EON_ZYNTENT.sourceIdEnv] || '').trim();
  const zyntentReady = zyntentEnabled && /^[0-9a-f]{64}$/i.test(zyntentKey) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(zyntentSourceId);
  return Object.freeze({
    schema: EON_PARTNER_MONETIZATION_SCHEMA,
    infolinks: Object.freeze({ verificationInSource: true, liveScope: EON_INFOLINKS.scope }),
    bidvertiser: Object.freeze({ verificationInSource: true, adsEnabled: false }),
    zyntent: Object.freeze({ enabled: zyntentEnabled, ready: zyntentReady, provider: zyntentReady ? 'zyntent' : 'none' }),
    smartlinks: Object.freeze({
      adsterra: truthy(env.EON_ADSTERRA_SMARTLINK_ENABLED),
      monetag: truthy(env.EON_MONETAG_SMARTLINK_ENABLED),
      automaticKeywordRelinking: false
    })
  });
}

export default Object.freeze({
  EON_PARTNER_MONETIZATION_SCHEMA,
  EON_INFOLINKS,
  EON_BIDVERTISER,
  EON_ZYNTENT,
  EON_SMARTLINK_PARTNERS,
  getPartnerMonetizationRuntimeConfig
});

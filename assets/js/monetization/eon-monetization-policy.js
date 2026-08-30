import { getRewardedProviderAdapter } from '../../../config/rt97-rewarded-provider-contract.mjs';
const freeze = (value) => Object.freeze(value);
const truthy = (value) => ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value || '').trim().toLowerCase());
const clean = (value = '', max = 80) => Array.from(String(value || '').trim())
  .filter((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint > 31 && codePoint !== 127;
  })
  .join('')
  .slice(0, max);

export const EON_MONETIZATION_POLICY_SCHEMA = 'eonapp.monetization.policy.rt96.v4';
// RT96 product decision: EONAPP and EON City do not mount ordinary display/banner inventory.
// Provider metadata is retained only for provenance and the separate voluntary Sponsor Terminal rail.
export const EON_ORDINARY_DISPLAY_PRODUCT_ENABLED = false;
export const EON_STANDARD_AD_SLOTS_PER_VIEW = 0;
export const EON_REWARDED_PROVIDER_IDS = freeze(['google-h5', 'exoclick', 'adinplay', 'venatus']);
// No rewarded provider is considered launch-ready until its provider-specific
// server completion verifier is implemented in Functions and explicitly
// registered here. Dashboard/config flags alone can never mint Sponsor EONKEYS.
export const EON_REWARDED_SERVER_VERIFIER_IDS = freeze(['exoclick']);
export const EON_DISPLAY_PROVIDER_IDS = freeze(['exoclick', 'adsense']);

export const EON_EXOCLICK_SFW_BLOCK_AD_TYPES = '101';
export const EON_EXOCLICK_SFW_AGE_VERIFICATION = '2';
export const EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE = freeze({
  adTransparencyDsa: true,
  clientHintsMetaTag: false,
  nativeRefreshSeconds: 60,
  blockAdTypes: freeze([
    'Back Button Offer',
    'Explicit Content',
    'High CTR Elements',
    'Misleading Branding',
    'NSFW',
    'Sexy Content',
    'Special Content - BDSM/Fantasy',
    'Target Audience - Gay',
    'Target Audience - Straight',
    'Verified False Positives'
  ]),
  blockSpecificProducts: freeze([
    'Adult: All',
    'Business: Forex / Binary',
    'Business: Generate Income',
    'Gambling: All',
    'Lifestyle: Dating',
    'Lifestyle: Sweepstakes',
    'Lifestyle: CBD',
    'Push Notifications'
  ])
});

export const EON_DISPLAY_AD_PROVIDERS = freeze({
  exoclick: freeze({
    id: 'exoclick',
    label: 'ExoClick',
    publicClientOnly: true,
    status: 'approved-zone-authority',
    enabledByDefault: false,
    script: 'https://a.magsrv.com/ad-provider.js',
    scriptOrigin: 'https://a.magsrv.com',
    vastOrigin: 'https://s.magsrv.com',
    sfw: freeze({
      blockAdTypes: EON_EXOCLICK_SFW_BLOCK_AD_TYPES,
      ageVerification: EON_EXOCLICK_SFW_AGE_VERIFICATION,
      dashboardFilteringRequired: true,
      dsaTransparencyRequired: true,
      dashboardSafetyProfile: EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE
    }),
    zones: freeze({
      '300x250': freeze({ id: '300x250', label: 'Content 300×250', zoneId: '6003982', className: 'eas6a97888e2', width: 300, height: 250, launchDirectMount: false }),
      native: freeze({ id: 'native', label: 'Native content 1×1', zoneId: '6004048', className: 'eas6a97888e20', launchDirectMount: true, desiredLayout: '1x1' }),
      multiformat: freeze({ id: 'multiformat', label: 'Content Multi-Format', zoneId: '6003992', className: 'eas6a97888e38', launchDirectMount: true, rebuiltWithNativeZone: '6004048' }),
      outstream: freeze({ id: 'outstream', label: 'Content Outstream', zoneId: '6004042', className: 'eas6a97888e37', launchDirectMount: true, surfaceRestricted: true }),
      sponsorVast: freeze({
        id: 'sponsor-vast',
        label: 'Sponsor Terminal Video',
        zoneId: '6004002',
        vastTag: `https://s.magsrv.com/v1/vast.php?idz=6004002&ex_av=${EON_EXOCLICK_SFW_AGE_VERIFICATION}&block_ad_types=${EON_EXOCLICK_SFW_BLOCK_AD_TYPES}`,
        launchPlayback: true,
        launchRewarded: true
      })
    }),
    supersededZoneIds: freeze(['6003988', '6004050']),
    forbiddenLaunchFormats: freeze(['popunder', 'smartlink', 'social-bar', 'forced-interstitial', 'push-notification'])
  }),
  adsense: freeze({
    id: 'adsense',
    label: 'Google AdSense',
    publicClientOnly: true,
    status: 'verification-only',
    enabledByDefault: false,
    policySafeSurfaceReviewRequired: true,
    script: '',
    reason: 'Verification can ship now; display inventory remains disabled until site approval, consent/CMP readiness and a separate policy-safe surface review.'
  })
});

export const EON_SPONSORED_SLOT_CATALOG = freeze({
  'apps-native': freeze({ id: 'apps-native', surface: 'apps', preferredFormat: 'multiformat', fallbackFormats: freeze(['native']), allowOutstream: false }),
  'create-native': freeze({ id: 'create-native', surface: 'create', preferredFormat: 'multiformat', fallbackFormats: freeze(['native']), allowOutstream: false }),
  'projects-native': freeze({ id: 'projects-native', surface: 'projects', preferredFormat: 'outstream', fallbackFormats: freeze(['multiformat', 'native']), allowOutstream: true })
});

export function getEonMonetizationRuntimeConfig(env = {}) {
  const rollout = clean(env.EON_MONETIZATION_ROLLOUT || '', 24).toLowerCase();
  const rolloutActive = ['testing', 'production'].includes(rollout);
  const monetizationEnabled = rolloutActive && truthy(env.EON_MONETIZATION_ENABLED);
  const displayEnabled = EON_ORDINARY_DISPLAY_PRODUCT_ENABLED && monetizationEnabled && truthy(env.EON_DISPLAY_ADS_ENABLED);
  const exoclickEnabled = displayEnabled && truthy(env.EON_EXOCLICK_ENABLED);
  const exoclickNativeEnabled = exoclickEnabled && truthy(env.EON_EXOCLICK_NATIVE_ENABLED);
  const exoclickMultiformatEnabled = exoclickEnabled && truthy(env.EON_EXOCLICK_MULTIFORMAT_ENABLED);
  const exoclickOutstreamEnabled = exoclickEnabled && truthy(env.EON_EXOCLICK_OUTSTREAM_ENABLED);
  const sponsorVideoEnabled = monetizationEnabled && truthy(env.EON_SPONSOR_VIDEO_ENABLED);
  const rewardedProvider = clean(env.EON_REWARDED_PROVIDER || 'none', 32).toLowerCase();
  const rewardedAdapter = getRewardedProviderAdapter(rewardedProvider);
  const rewardedProviderSupported = EON_REWARDED_PROVIDER_IDS.includes(rewardedProvider);
  const rewardedProviderVerified = rewardedProviderSupported && truthy(env.EON_REWARDED_PROVIDER_VERIFIED);
  const rewardedVerifierRegistered = EON_REWARDED_SERVER_VERIFIER_IDS.includes(rewardedProvider);
  const rewardedSecretReady = String(env.EON_REWARDED_SIGNING_KEY || '').length >= 32;
  const rewardedDatabaseReady = Boolean(env.EON_REFERRALS_DB?.prepare);
  const rewardedServerVerifierReady = rewardedVerifierRegistered && rewardedSecretReady && rewardedDatabaseReady;
  const rewardedEnabled = monetizationEnabled && truthy(env.EON_REWARDED_ADS_ENABLED) && rewardedProviderVerified && rewardedServerVerifierReady;
  return freeze({
    schema: EON_MONETIZATION_POLICY_SCHEMA,
    rollout,
    active: monetizationEnabled,
    display: freeze({
      enabled: displayEnabled,
      provider: exoclickEnabled && (exoclickNativeEnabled || exoclickMultiformatEnabled || exoclickOutstreamEnabled) ? 'exoclick' : 'none',
      exoclick: freeze({
        enabled: exoclickEnabled,
        native: exoclickNativeEnabled,
        multiformat: exoclickMultiformatEnabled,
        outstream: exoclickOutstreamEnabled,
        banner300x250Authority: true,
        nativeAuthority: true,
        sfwBlockAdTypes: EON_EXOCLICK_SFW_BLOCK_AD_TYPES,
        sfwAgeVerification: EON_EXOCLICK_SFW_AGE_VERIFICATION,
        sponsorVastConfigured: true,
        sponsorRewardsEnabled: rewardedEnabled,
        popunder: false,
        smartlink: false,
        socialBar: false,
        forcedInterstitial: false,
        pushNotification: false
      }),
      adsense: freeze({
        verificationActive: true,
        displayEnabled: false,
        reason: 'AdSense display remains off pending approval, policy-safe surfaces and certified consent/CMP requirements.'
      })
    }),
    sponsorVideo: freeze({
      enabled: sponsorVideoEnabled,
      provider: sponsorVideoEnabled ? 'exoclick' : 'none',
      zoneId: EON_DISPLAY_AD_PROVIDERS.exoclick.zones.sponsorVast.zoneId,
      vastTag: sponsorVideoEnabled ? EON_DISPLAY_AD_PROVIDERS.exoclick.zones.sponsorVast.vastTag : '',
      voluntaryOnly: true,
      signedInOnly: true,
      rewardsEnabled: rewardedEnabled && rewardedProvider === 'exoclick',
      completionProof: rewardedEnabled ? 'server-validated-vast-wrapper-sequence' : 'rewarded-runtime-not-ready'
    }),
    rewarded: freeze({
      enabled: rewardedEnabled,
      provider: rewardedEnabled ? rewardedProvider : 'none',
      providerVerified: rewardedProviderVerified,
      serverVerifierReady: rewardedServerVerifierReady,
      verifierRegistered: rewardedVerifierRegistered,
      signingSecretReady: rewardedSecretReady,
      databaseReady: rewardedDatabaseReady,
      verificationMode: rewardedServerVerifierReady ? 'server-validated-vast-wrapper-sequence' : 'unavailable',
      providerSignedCompletion: rewardedAdapter?.providerSignedCompletion === true,
      completionAssurance: rewardedAdapter?.completionAssurance || 'unimplemented',
      rewardClass: rewardedEnabled ? (rewardedAdapter?.rewardClass || 'none') : 'none',
      permanentValueAllowed: rewardedAdapter?.permanentValueAllowed === true,
      dailyCap: Math.max(1, Math.min(10, Number.parseInt(env.EON_REWARDED_DAILY_CAP || '3', 10) || 3)),
      cooldownMinutes: Math.max(1, Math.min(1440, Number.parseInt(env.EON_REWARDED_COOLDOWN_MINUTES || '10', 10) || 10)),
      keyType: 'sponsor',
      ordinaryBannerClickCanReward: false,
      clientCanComplete: false,
      keysPerCompletion: 1
    })
  });
}

export function validateEonMonetizationPolicy() {
  const errors = [];
  const exoclick = EON_DISPLAY_AD_PROVIDERS.exoclick;
  if (EON_ORDINARY_DISPLAY_PRODUCT_ENABLED !== false || EON_STANDARD_AD_SLOTS_PER_VIEW !== 0) errors.push('ordinary-display-product-boundary');
  if (exoclick.script !== 'https://a.magsrv.com/ad-provider.js') errors.push('exoclick-script-authority');
  if (exoclick.zones.multiformat.zoneId !== '6003992' || exoclick.zones.multiformat.launchDirectMount !== true || exoclick.zones.multiformat.rebuiltWithNativeZone !== '6004048' || exoclick.zones.native.zoneId !== '6004048' || exoclick.zones.native.className !== 'eas6a97888e20' || exoclick.zones.native.desiredLayout !== '1x1' || exoclick.zones.native.launchDirectMount !== true || exoclick.zones['300x250'].zoneId !== '6003982') errors.push('exoclick-content-zone-authority');
  if (!exoclick.supersededZoneIds.includes('6003988') || !exoclick.supersededZoneIds.includes('6004050')) errors.push('exoclick-superseded-zone-boundary');
  if (exoclick.zones.outstream.zoneId !== '6004042') errors.push('exoclick-outstream-zone-authority');
  if (exoclick.zones.sponsorVast.zoneId !== '6004002' || !exoclick.zones.sponsorVast.vastTag.includes('ex_av=2') || !exoclick.zones.sponsorVast.vastTag.includes('block_ad_types=101')) errors.push('exoclick-vast-sfw-authority');
  if (exoclick.sfw.blockAdTypes !== '101' || exoclick.sfw.ageVerification !== '2' || exoclick.sfw.dsaTransparencyRequired !== true || exoclick.sfw.dashboardSafetyProfile.adTransparencyDsa !== true || exoclick.sfw.dashboardSafetyProfile.clientHintsMetaTag !== false || exoclick.sfw.dashboardSafetyProfile.nativeRefreshSeconds < 60 || !exoclick.sfw.dashboardSafetyProfile.blockSpecificProducts.includes('Adult: All') || !exoclick.sfw.dashboardSafetyProfile.blockSpecificProducts.includes('Gambling: All')) errors.push('exoclick-sfw-defense');
  if (exoclick.zones.outstream.launchDirectMount !== true || exoclick.zones.sponsorVast.launchPlayback !== true || exoclick.zones.sponsorVast.launchRewarded !== true) errors.push('video-launch-boundary');
  if (!exoclick.forbiddenLaunchFormats.includes('popunder') || !exoclick.forbiddenLaunchFormats.includes('social-bar')) errors.push('aggressive-format-boundary');
  const adsense = EON_DISPLAY_AD_PROVIDERS.adsense;
  if (adsense.enabledByDefault || adsense.script || !adsense.policySafeSurfaceReviewRequired) errors.push('adsense-display-must-remain-verification-only');
  const demo = getEonMonetizationRuntimeConfig({
    EON_MONETIZATION_ROLLOUT: 'production',
    EON_MONETIZATION_ENABLED: 'true',
    EON_DISPLAY_ADS_ENABLED: 'true',
    EON_EXOCLICK_ENABLED: 'true',
    EON_EXOCLICK_NATIVE_ENABLED: 'true',
    EON_EXOCLICK_MULTIFORMAT_ENABLED: 'true',
    EON_EXOCLICK_OUTSTREAM_ENABLED: 'true',
    EON_SPONSOR_VIDEO_ENABLED: 'true',
    EON_REWARDED_ADS_ENABLED: 'true',
    EON_REWARDED_PROVIDER: 'exoclick',
    EON_REWARDED_PROVIDER_VERIFIED: 'true',
    EON_REWARDED_SIGNING_KEY: '0123456789abcdef0123456789abcdef',
    EON_REFERRALS_DB: { prepare() {} }
  });
  if (!demo.rewarded.enabled || demo.rewarded.provider !== 'exoclick' || !demo.rewarded.serverVerifierReady || demo.rewarded.clientCanComplete || demo.rewarded.providerSignedCompletion) errors.push('rewarded-exoclick-server-sequence-boundary');
  if (demo.display.enabled || demo.display.provider !== 'none' || demo.display.exoclick.enabled || demo.display.exoclick.native || demo.display.exoclick.multiformat || demo.display.exoclick.outstream) errors.push('ordinary-display-must-remain-product-disabled');
  if (!demo.sponsorVideo.enabled || demo.sponsorVideo.provider !== 'exoclick' || demo.sponsorVideo.rewardsEnabled !== true || demo.sponsorVideo.completionProof !== 'server-validated-vast-wrapper-sequence') errors.push('exoclick-sponsor-video-boundary');
  if (demo.display.exoclick.socialBar || demo.display.exoclick.popunder || demo.display.exoclick.smartlink || demo.display.exoclick.pushNotification) errors.push('forbidden-launch-format-enabled');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_MONETIZATION_POLICY_SCHEMA });
}

export default freeze({
  EON_MONETIZATION_POLICY_SCHEMA,
  EON_ORDINARY_DISPLAY_PRODUCT_ENABLED,
  EON_STANDARD_AD_SLOTS_PER_VIEW,
  EON_REWARDED_PROVIDER_IDS,
  EON_REWARDED_SERVER_VERIFIER_IDS,
  EON_DISPLAY_PROVIDER_IDS,
  EON_EXOCLICK_SFW_BLOCK_AD_TYPES,
  EON_EXOCLICK_SFW_AGE_VERIFICATION,
  EON_EXOCLICK_DASHBOARD_SAFETY_PROFILE,
  EON_DISPLAY_AD_PROVIDERS,
  EON_SPONSORED_SLOT_CATALOG,
  getEonMonetizationRuntimeConfig,
  validateEonMonetizationPolicy
});

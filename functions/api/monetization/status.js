

import { jsonResponse } from '../../_shared/eon-auth.js';
import { isEonOrdinaryAdsAllowed, isEonRewardedAdsAllowed, readEonMonetizationAccountEligibility } from '../../_shared/eon-monetization-eligibility.js';
import { getEonMonetizationRuntimeConfig } from '../../../assets/js/monetization/eon-monetization-policy.js';

export const EON_MONETIZATION_STATUS_SCHEMA = 'eonapp.monetization.public-status.rt97.v3';

function response(body, status = 200) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
}

export async function onRequestGet(context) {
  const config = getEonMonetizationRuntimeConfig(context.env);
  const eligibility = await readEonMonetizationAccountEligibility(context.request, context.env);
  const freeEligible = eligibility.ok && eligibility.signedIn && eligibility.free;
  const ordinaryAdsAllowed = isEonOrdinaryAdsAllowed(eligibility);
  const rewardedAdsAllowed = isEonRewardedAdsAllowed(eligibility);
  const displayEligible = ordinaryAdsAllowed && config.display.enabled && config.display.provider !== 'none';
  const rewardedEligible = rewardedAdsAllowed && config.rewarded.enabled;
  return response({
    schema: EON_MONETIZATION_STATUS_SCHEMA,
    ok: eligibility.ok,
    active: config.active,
    rollout: config.rollout,
    signedIn: eligibility.signedIn,
    freeAccount: freeEligible,
    paidAdFree: eligibility.paid === true,
    paidOrdinaryAdFree: eligibility.paid === true,
    ordinaryAdsAllowed,
    rewardedAdsAllowed,
    reason: eligibility.reason,
    standardAdSlotsPerView: 0,
    consent: {
      thirdPartyDisplayConsentRequiredByEonapp: true,
      localChoiceKey: 'eon:monetization:display-consent:v1',
      adsenseDisplayRequiresSeparateCertifiedCmpReadiness: true
    },
    display: {
      eligible: displayEligible,
      provider: displayEligible ? config.display.provider : 'none',
      exoclick: displayEligible ? config.display.exoclick : {
        enabled: false, native: false, multiformat: false, outstream: false, banner300x250Authority: true, nativeAuthority: true,
        sfwBlockAdTypes: '101', sfwAgeVerification: '2', sponsorVastConfigured: true, sponsorRewardsEnabled: config.rewarded.enabled === true,
        socialBar: false, popunder: false, smartlink: false, forcedInterstitial: false, pushNotification: false
      },
      adsense: config.display.adsense,
      chatSurfaceAllowed: false,
      activeCityGameplayAllowed: false
    },
    sponsorVideo: {
      configured: config.sponsorVideo?.enabled === true,
      available: eligibility.signedIn === true && config.sponsorVideo?.enabled === true,
      provider: eligibility.signedIn === true && config.sponsorVideo?.enabled === true ? config.sponsorVideo.provider : 'none',
      zoneId: config.sponsorVideo?.zoneId || '',
      vastTag: eligibility.signedIn === true && config.sponsorVideo?.enabled === true ? config.sponsorVideo.vastTag : '',
      voluntaryOnly: true,
      signedInOnly: true,
      rewardsEnabled: config.sponsorVideo?.rewardsEnabled === true,
      completionProof: config.sponsorVideo?.completionProof || 'rewarded-runtime-not-ready'
    },
    rewarded: {
      eligible: rewardedEligible,
      available: rewardedEligible,
      configuredEnabled: config.rewarded.enabled === true,
      configuredProvider: config.rewarded.provider || 'none',
      provider: rewardedEligible ? config.rewarded.provider : 'none',
      providerVerified: config.rewarded.providerVerified === true,
      serverVerifierReady: config.rewarded.serverVerifierReady === true,
      verificationMode: config.rewarded.verificationMode || 'unavailable',
      providerSignedCompletion: config.rewarded.providerSignedCompletion === true,
      rewardClass: config.rewarded.rewardClass || 'none',
      permanentValueAllowed: config.rewarded.permanentValueAllowed === true,
      keysPerCompletion: config.rewarded.keysPerCompletion || 1,
      keyType: 'sponsor',
      dailyCap: config.rewarded.dailyCap,
      cooldownMinutes: config.rewarded.cooldownMinutes,
      clientCanComplete: false,
      ordinaryBannerClickCanReward: false
    },
    privacy: {
      privatePromptSharedWithDisplayProvider: false,
      byokSecretAccepted: false,
      localAiPromptRerouted: false,
      paidProviderScriptRequested: false,
      rewardedOptInDoesNotEnableOrdinaryAds: true
    }
  }, eligibility.ok ? 200 : eligibility.status || 503);
}

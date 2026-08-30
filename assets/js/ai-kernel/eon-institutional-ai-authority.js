/**
 * Institutional AI source authority.
 *
 * This is a source/runtime-capability ledger, not external certification. It
 * intentionally keeps "implemented" separate from "real-output certified".
 */
import { getEonappKnowledgeTruth } from '../../../config/eonapp-ai-knowledge-base.mjs';
import { getEonAiMemoryTruth } from './eon-ai-memory-ledger.js';
import { getEonAiMemoryPolicyTruth } from './eon-ai-memory-policy.js';
import { getEonAiStructuredMemoryTruth } from './eon-ai-structured-memory.js';
import { getEonAiRoutingPolicyTruth } from './eon-ai-routing-policy.js';
import { getEonAiEvaluationTruth } from './eon-ai-evaluation-ledger.js';
import { getEonModelIntelligenceTruth } from '../chat/eon-model-intelligence-registry.js';
import { getEonbotGroundingTruth } from '../chat/eonbot-knowledge-grounding.js';
import { getEonMusicCapabilityTruth } from '../creator/music/eon-music-capability-router.js';
import { getEonAutoDjPreviewTruth } from '../creator/music/eon-auto-dj-preview.js';
import { getCreateContinuityTruth } from '../create/eon-create-continuity-authority.js';
import { getEonRadioSessionTruth } from '../creator/music/eon-radio-session.js';
import { getEonNotificationCenterTruth } from '../notifications/eon-notification-center.js';
import { getEonCityProgressTruth } from '../contracts/city/eon-city-progress-bridge.js';

export const EON_INSTITUTIONAL_AI_AUTHORITY_SCHEMA = 'eonapp.institutional-ai-authority.v1';
export const EON_INSTITUTIONAL_AI_IMPLEMENTATION_AS_OF = '2026-08-09';

const freeze = (value) => Object.freeze(value);

export function getEonInstitutionalAiAuthority() {
  const knowledge = getEonappKnowledgeTruth();
  const memory = getEonAiMemoryTruth();
  const memoryPolicy = getEonAiMemoryPolicyTruth();
  const structuredMemory = getEonAiStructuredMemoryTruth();
  const routing = getEonAiRoutingPolicyTruth();
  const evaluation = getEonAiEvaluationTruth();
  const modelIntelligence = getEonModelIntelligenceTruth();
  const grounding = getEonbotGroundingTruth();
  const music = getEonMusicCapabilityTruth();
  const autoDjPreview = getEonAutoDjPreviewTruth();
  const create = getCreateContinuityTruth();
  const radioSession = getEonRadioSessionTruth();
  const notifications = getEonNotificationCenterTruth();
  const cityProgress = getEonCityProgressTruth();

  return freeze({
    schema: EON_INSTITUTIONAL_AI_AUTHORITY_SCHEMA,
    implementationAsOf: EON_INSTITUTIONAL_AI_IMPLEMENTATION_AS_OF,
    status: 'source-integrated-certification-pending',
    principles: freeze({
      modelIsReplaceableWorker: true,
      eonIntelligenceIsStableLayer: true,
      noSilentFineTuning: true,
      noSilentProviderHop: true,
      noSilentBillableFallback: true,
      noSilentModelDownload: true,
      explicitExternalAction: true
    }),
    systems: freeze({ knowledge, grounding, memory, memoryPolicy, structuredMemory, routing, evaluation, modelIntelligence, music, autoDjPreview, radioSession, notifications, create, cityProgress }),
    currentTruth: freeze({
      institutionalKnowledgeFabric: knowledge.hybridRetrieval === true && knowledge.authorityMetadata === true,
      firstTurnGrounding: grounding.runtimeGrounding === true,
      projectScopedMemory: memory.projectScoping === true,
      safeStructuredAutoMemory: memoryPolicy.safeAutoStructuredSignalsOnly === true && structuredMemory.safeAutoPolicyRequired === true && structuredMemory.explicitControlChangeRequired === true && structuredMemory.rawChatAccepted === false && structuredMemory.arbitraryTextAccepted === false,
      rawChatAutoMemory: false,
      modelWeightFineTuning: false,
      routingInsideApprovedEnvelope: routing.modelAutoSelectionWithinApprovedEnvelope === true,
      verifiedModelEnvelopePolicyDiverse: modelIntelligence.verifiedEnvelopeFinite === true && modelIntelligence.policyTaskDiverseEnvelope === true && modelIntelligence.providerResponseOrderAuthoritative === false,
      foregroundOperationalModelLearning: evaluation.foregroundOperationalLearning === true && evaluation.operationalQualityInference === false && evaluation.promptStored === false && evaluation.responseStored === false,
      crossProviderFallbackWithoutConsent: false,
      localVideoSourceIntegrated: grounding.localVideoAdapterSourceIntegrated === true,
      localVideoRealOutputCertified: false,
      musicFirstClassCreator: create.musicMode === 'create-now',
      browserMusicSequencerCertifiedScope: create.musicVerifiedScope === 'browser-sequencer-and-wav-export',
      generativeMusicSourceAdapterCertified: music.generativeMusicCertified === true,
      autoDjLocalCrossfadePreview: music.autoDjCrossfadePreview === true && autoDjPreview.browserCrossfadePreview === true && autoDjPreview.upload === false,
      autoDjAudioRenderCertified: music.autoDjRenderCertified === true,
      commercialMusicCatalogueIntegrated: music.commercialStreamingCatalogue === true,
      personalRadioSessionSourceReady: radioSession.sessionOnly === true && radioSession.upload === false,
      cityConsumesRedactedCreatorReceipts: cityProgress.consumesOnlyPolicyApprovedCoreOutcomes === true,
      notificationDeviceDeliverySourceReady: notifications.deviceNotificationDelivery === true,
      backgroundPushLiveProof: notifications.liveDeliveryProof === true
    }),
    certification: freeze({
      sourceGateRequired: true,
      browserProofRequired: true,
      realProviderOutputRequired: true,
      realLocalModelOutputRequired: true,
      realImageOutputRequired: true,
      realVideoOutputRequired: true,
      realGenerativeMusicOutputRequired: true,
      realClosedTabPushDeliveryRequired: true,
      ownerAcceptanceRequired: true,
      externalProofCompletedByThisModule: false
    })
  });
}

export function validateEonInstitutionalAiAuthority(authority = getEonInstitutionalAiAuthority()) {
  const issues = [];
  if (authority?.schema !== EON_INSTITUTIONAL_AI_AUTHORITY_SCHEMA) issues.push('schema-invalid');
  if (authority?.principles?.modelIsReplaceableWorker !== true || authority?.principles?.eonIntelligenceIsStableLayer !== true) issues.push('architecture-principle-missing');
  if (authority?.currentTruth?.institutionalKnowledgeFabric !== true || authority?.currentTruth?.firstTurnGrounding !== true) issues.push('grounding-not-integrated');
  if (authority?.currentTruth?.rawChatAutoMemory !== false || authority?.currentTruth?.modelWeightFineTuning !== false) issues.push('unsafe-learning-overclaim');
  if (authority?.currentTruth?.safeStructuredAutoMemory !== true) issues.push('safe-structured-auto-memory-not-integrated');
  if (authority?.currentTruth?.crossProviderFallbackWithoutConsent !== false) issues.push('provider-consent-boundary-invalid');
  if (authority?.currentTruth?.localVideoSourceIntegrated !== true || authority?.currentTruth?.localVideoRealOutputCertified !== false) issues.push('video-proof-boundary-invalid');
  if (authority?.currentTruth?.musicFirstClassCreator !== true || authority?.currentTruth?.generativeMusicSourceAdapterCertified !== false) issues.push('music-proof-boundary-invalid');
  if (authority?.currentTruth?.autoDjLocalCrossfadePreview !== true) issues.push('auto-dj-crossfade-preview-not-integrated');
  if (authority?.currentTruth?.autoDjAudioRenderCertified !== false || authority?.currentTruth?.commercialMusicCatalogueIntegrated !== false) issues.push('music-rights-or-render-overclaim');
  if (authority?.currentTruth?.personalRadioSessionSourceReady !== true) issues.push('radio-session-not-integrated');
  if (authority?.currentTruth?.cityConsumesRedactedCreatorReceipts !== true) issues.push('city-creator-progress-not-integrated');
  if (authority?.currentTruth?.notificationDeviceDeliverySourceReady !== true || authority?.currentTruth?.backgroundPushLiveProof !== false) issues.push('notification-proof-boundary-invalid');
  if (authority?.certification?.externalProofCompletedByThisModule !== false) issues.push('source-authority-cannot-self-certify-external-proof');
  return freeze(issues);
}

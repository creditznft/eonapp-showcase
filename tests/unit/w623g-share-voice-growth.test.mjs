import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonRewardDisclosure,
  buildEonShareCardPlan,
  buildEonViralCaption,
  calculateEonViralReadiness,
  getEonViralShareTruth,
  shareEonLocalMedia
} from '../../assets/js/share/eon-viral-share-kit.js';
import { getEonVoiceFallbackTruth, resolveEonVoiceFallbackPlan } from '../../assets/js/chat/eon-voice-fallback-strategy.js';
import { W623G_LOCAL_SPEECH_COMPANION_CONTRACT, validateW623gLocalSpeechCompanionContract } from '../../config/w623g-local-speech-companion-contract.mjs';

test('W623G keeps referral activation server-authoritative and never invents rewards from sharing', () => {
  const truth = getEonViralShareTruth();
  assert.equal(truth.programActive, false);
  assert.equal(truth.programActiveMeansClientSourceClaimOnly, true);
  assert.equal(truth.programmeStateAuthority, '/api/referrals');
  assert.equal(truth.defaultProgrammeState, 'unverified');
  assert.equal(truth.clientCanActivateProgramme, false);
  assert.equal(truth.referralQualification, false);
  assert.equal(truth.eonKeyGrant, false);
  assert.equal(truth.paidAdPromotionRecommended, false);
  assert.match(buildEonRewardDisclosure(), /not been verified|not verified/i);
  assert.match(buildEonRewardDisclosure({ state: 'inactive' }), /inactive/i);
  assert.match(buildEonRewardDisclosure({ active: true }), /eligible verified milestone/i);
});

test('W623G builds public-safe captions and local progress card plans', () => {
  const caption = buildEonViralCaption({ preset: 'project', title: 'Launch checkpoint', detail: 'A real saved result.', link: 'https://eonapp.ch/create' });
  assert.match(caption, /Launch checkpoint/);
  assert.match(caption, /https:\/\/eonapp\.ch\/create/);
  const plan = buildEonShareCardPlan({ preset: 'vault', title: 'Reveal unlocked' });
  assert.equal(plan.preset, 'vault');
  assert.equal(plan.localOnly, true);
  assert.equal(plan.containsPrivateData, false);
  assert.equal(plan.containsRewardClaim, false);
});

test('W623G rejects secret-like share text and requires an explicit file-share action', async () => {
  assert.throws(() => buildEonViralCaption({ title: 'api_key=sk_secretsecretsecret' }), /Remove credentials/i);
  const result = await shareEonLocalMedia({ file: { type: 'image/png' } }, { userGesture: false, navigator: {} });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'explicit-user-action-required');
});

test('W623G scores the implemented organic sharing layer at 7.2/10 without inventing reward proof', () => {
  const result = calculateEonViralReadiness({
    universalShareAccess: true,
    signedPublicLinks: true,
    nativeFileShare: true,
    creatorHandoffs: true,
    brandedProgressCards: true,
    campaignDrafts: true,
    platformVariants: true,
    clearDisclosure: true
  });
  assert.equal(result.score, 7.2);
  assert.equal(result.launchClaimAllowed, false);
  assert.deepEqual(result.blockers, ['serverAttribution', 'qualifiedRewardLedger', 'abuseReversal', 'privacySafeMeasurement']);
});

test('W623G provides honest no-key voice fallback paths', () => {
  const full = resolveEonVoiceFallbackPlan({
    targetLocale: 'hi-IN', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true,
    voices: [{ lang: 'hi-IN', default: false }]
  });
  assert.equal(full.input.mode, 'browser-assisted-dictation');
  assert.equal(full.output.mode, 'browser-speech-synthesis');
  assert.equal(full.noEonappApiKey, true);

  const fallback = resolveEonVoiceFallbackPlan({ targetLocale: 'ar-SA' });
  assert.equal(fallback.input.mode, 'typed-or-os-dictation');
  assert.equal(fallback.output.mode, 'visible-text-and-device-read-aloud');
  assert.equal(fallback.typedChatAlwaysAvailable, true);
  assert.equal(getEonVoiceFallbackTruth().offlineSpeechClaimActive, false);
});

test('W623G local speech companion remains inactive until authenticated airplane-mode proof', () => {
  const validation = validateW623gLocalSpeechCompanionContract();
  assert.equal(validation.ok, true);
  assert.equal(W623G_LOCAL_SPEECH_COMPANION_CONTRACT.active, false);
  assert.equal(W623G_LOCAL_SPEECH_COMPANION_CONTRACT.proofRequired.includes('airplane-mode-stt'), true);
  assert.equal(W623G_LOCAL_SPEECH_COMPANION_CONTRACT.proofRequired.includes('airplane-mode-tts'), true);
  assert.equal(W623G_LOCAL_SPEECH_COMPANION_CONTRACT.privacy.transcriptCloudUpload, false);
});

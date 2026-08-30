import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CITY_SOUNDSCAPE_DEFAULTS,
  readCitySoundscapePreferences,
  saveCitySoundscapePreferences
} from '../../assets/js/city/eon-city-adaptive-soundscape.js';
import {
  EON_CITY_SOUNDSCAPE_ASSET_POLICY,
  EON_CITY_SOUNDSCAPE_POLICY_SCHEMA,
  createEonCitySoundscapePolicyController,
  getEonCitySoundscapePolicy,
  getEonCitySoundscapeTruth
} from '../../assets/js/city/eon-city-soundscape-policy.js';
import { getEonCityVoiceConsentTruth } from '../../assets/js/city/eon-city-voice-consent.js';
import { inspectW572LocalSoundscapeAudioPolicy } from '../../scripts/w572-local-soundscape-audio-policy-gate.mjs';

test('W572 declares a source-controlled no-media-pack policy with captions-first visual fallback', () => {
  const policy = getEonCitySoundscapePolicy();
  const truth = getEonCitySoundscapeTruth();
  assert.equal(policy.schema, EON_CITY_SOUNDSCAPE_POLICY_SCHEMA);
  assert.equal(policy.assetPolicy, EON_CITY_SOUNDSCAPE_ASSET_POLICY);
  assert.deepEqual(policy.assetPolicy.assetRegister, []);
  assert.equal(policy.assetPolicy.remoteAssetUrlsAllowed, false);
  assert.equal(policy.assetPolicy.streamingAllowed, false);
  assert.equal(policy.assetPolicy.edgeProxyAllowed, false);
  assert.equal(policy.captionsFirst, true);
  assert.equal(policy.visualCityCompleteWithoutAudio, true);
  assert.equal(policy.autoplay, false);
  assert.equal(policy.explicitUserActionRequired, true);
  assert.equal(truth.mediaFileShipped, false);
  assert.equal(truth.finalSoundtrackClaimed, false);
  assert.equal(truth.cloudTtsClaimed, false);
  assert.equal(truth.liveAudioCaptureClaimed, false);
});

test('W572 requires a direct action, keeps preference memory-only, and reports local synthesis separately', () => {
  const controller = createEonCitySoundscapePolicyController();
  assert.equal(controller.getSnapshot().audibleState, 'off');
  assert.equal(controller.requestEnable().error, 'explicit-user-action-required');
  const requested = controller.requestEnable({ explicitUserAction: true, runtime: { tabVisible: true } });
  assert.equal(requested.ok, true);
  assert.equal(requested.snapshot.audibleState, 'enable-pending-local-procedural-source');
  const active = controller.reportPlaybackResult({ ok: true });
  assert.equal(active.ok, true);
  assert.equal(active.snapshot.audibleState, 'active-local-procedural');
  assert.equal(active.snapshot.audioPreferenceMemoryOnly, true);
  assert.equal(active.snapshot.audioPreferencePersisted, false);
  assert.equal(active.snapshot.actualPlaybackStartedByPolicy, false);
});

test('W572 stops for pause, tab hidden, reduced effects, mute, and never resumes automatically', () => {
  const controller = createEonCitySoundscapePolicyController();
  controller.requestEnable({ explicitUserAction: true, runtime: { tabVisible: true } });
  controller.reportPlaybackResult({ ok: true });
  const paused = controller.setRuntime({ cityPaused: true, tabVisible: true });
  assert.equal(paused.shouldStopExistingAudio, true);
  assert.equal(paused.snapshot.audibleState, 'paused-silent');
  const resumed = controller.setRuntime({ cityPaused: false, tabVisible: true });
  assert.equal(resumed.shouldStopExistingAudio, false);
  assert.equal(resumed.snapshot.audibleState, 'off');
  assert.equal(resumed.snapshot.reason, 'runtime-ready-requires-new-action');
  const hidden = controller.setRuntime({ tabVisible: false });
  assert.equal(hidden.shouldStopExistingAudio, true);
  assert.equal(hidden.snapshot.audibleState, 'hidden-silent');
  const reduced = controller.requestEnable({ explicitUserAction: true, runtime: { tabVisible: true, reducedEffects: true } });
  assert.equal(reduced.ok, false);
  assert.equal(reduced.error, 'reduced-effects');
  const muted = controller.mute({ explicitUserAction: true });
  assert.equal(muted.ok, true);
  assert.equal(muted.shouldStopExistingAudio, true);
  assert.equal(muted.snapshot.audibleState, 'muted');
});

test('W572 removes browser-default sound preference persistence and leaves W562 voice consent unchanged', () => {
  assert.deepEqual(readCitySoundscapePreferences(), CITY_SOUNDSCAPE_DEFAULTS);
  const saved = saveCitySoundscapePreferences({ ambience: true, ui: true });
  assert.equal(saved.ambience, true);
  assert.equal(saved.ui, true);
  const voice = getEonCityVoiceConsentTruth();
  assert.equal(voice.microphoneStartsOnBoot, false);
  assert.equal(voice.explicitMicrophoneActionRequired, true);
  assert.equal(voice.backgroundListening, false);
  assert.equal(voice.audioPersisted, false);
  assert.equal(voice.automaticChatSend, false);
});

test('W572 source gate preserves no-autoplay, no-storage, no-network, and no-commercial boundaries', () => {
  const report = inspectW572LocalSoundscapeAudioPolicy({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 15);
});

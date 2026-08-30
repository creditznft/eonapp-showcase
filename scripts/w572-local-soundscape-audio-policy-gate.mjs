#!/usr/bin/env node
/** W572 source gate — optional local soundscape, captions-first voice boundary, and audio asset policy. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_SOUNDSCAPE_ASSET_POLICY,
  createEonCitySoundscapePolicyController,
  getEonCitySoundscapePolicy,
  getEonCitySoundscapeTruth
} from '../assets/js/city/eon-city-soundscape-policy.js';
import { getEonCityVoiceConsentTruth } from '../assets/js/city/eon-city-voice-consent.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/city/eon-city-soundscape-policy.js',
  'assets/js/city/eon-city-adaptive-soundscape.js',
  'assets/js/eon-city-play-station.js',
  'assets/js/eon-city-3d-station.js',
  'tests/unit/w572-local-soundscape-audio-policy.test.mjs',
  'scripts/w572-local-soundscape-audio-policy-gate.mjs',
  'scripts/run-current-unit-suite.mjs',
  'package.json'
]);
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

export function inspectW572LocalSoundscapeAudioPolicy({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const policySource = read('assets/js/city/eon-city-soundscape-policy.js');
  const soundscape = read('assets/js/city/eon-city-adaptive-soundscape.js');
  const station = read('assets/js/eon-city-play-station.js');
  const spatialStation = read('assets/js/eon-city-3d-station.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const packageJson = JSON.parse(read('package.json'));
  const policy = getEonCitySoundscapePolicy();
  const truth = getEonCitySoundscapeTruth();
  const voiceTruth = getEonCityVoiceConsentTruth();
  const controller = createEonCitySoundscapePolicyController();
  const explicit = controller.requestEnable({ explicitUserAction: true, runtime: { tabVisible: true } });
  const started = controller.reportPlaybackResult({ ok: true });
  const paused = controller.setRuntime({ cityPaused: true, tabVisible: true });
  const resumed = controller.setRuntime({ cityPaused: false, tabVisible: true });

  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'policy, active City surfaces, test, gate, runner, and package metadata exist');
  check('source-controlled-asset-policy', policy.assetPolicy === EON_CITY_SOUNDSCAPE_ASSET_POLICY && policy.assetPolicy.assetRegister.length === 0 && policy.assetPolicy.remoteAssetUrlsAllowed === false && policy.assetPolicy.streamingAllowed === false && policy.assetPolicy.edgeProxyAllowed === false, 'no media pack, remote URL, stream, or proxy is admitted');
  check('captions-first-visual-fallback', policy.captionsFirst === true && policy.visualCityCompleteWithoutAudio === true && truth.localOnly === true && truth.mediaFileShipped === false && truth.mediaAssetLoaderUsed === false, 'City remains usable without sound and no media asset is shipped');
  check('explicit-action-state-machine', explicit.ok === true && explicit.snapshot.audibleState === 'enable-pending-local-procedural-source' && started.snapshot.audibleState === 'active-local-procedural', 'policy distinguishes direct request from the existing local synthesis result');
  check('pause-and-tab-guard-no-auto-resume', paused.shouldStopExistingAudio === true && paused.snapshot.audibleState === 'paused-silent' && resumed.snapshot.audibleState === 'off' && resumed.snapshot.reason === 'runtime-ready-requires-new-action', 'pause/visibility guards stop sound and never resume it implicitly');
  check('truth-rejects-mic-provider-network-storage-and-commercial-claims', truth.microphoneRequested === false && truth.cloudTtsClaimed === false && truth.cloudSttClaimed === false && truth.remoteAudioRequested === false && truth.audioPreferencePersisted === false && truth.notificationRequested === false && truth.commercialClaimed === false && truth.entitlementClaimed === false, 'sound policy has no mic, provider, network, persistence, notification, commercial, or entitlement side effect');
  check('w562-voice-boundary-preserved', voiceTruth.microphoneStartsOnBoot === false && voiceTruth.explicitMicrophoneActionRequired === true && voiceTruth.backgroundListening === false && voiceTruth.audioPersisted === false && voiceTruth.automaticChatSend === false, 'W572 does not widen W562 microphone or dictation consent');
  check('policy-module-has-no-side-effect-apis', !/(?:\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|mediaDevices\s*\.|getUserMedia\s*\(|new\s+SpeechRecognition\s*\(|MediaRecorder\s*\(|Notification\s*\.|PushManager|new\s+Audio\s*\()/i.test(policySource), 'policy module has no network, storage, mic, speech, notification, or media-constructor side effect');
  check('active-sound-controller-defaults-to-memory-only', /readCitySoundscapePreferences\(storage = null\)/.test(soundscape) && /saveCitySoundscapePreferences\(next, storage = null\)/.test(soundscape) && !/storage\s*=\s*globalThis\.localStorage/.test(soundscape) && /audioPreferencePersistedByDefault:\s*false/.test(soundscape), 'legacy compatibility storage is injected-only and default City sound state is memory-only');
  check('play-station-requires-visible-sound-controls', /data-eon-play-soundscape-enable/.test(station) && /data-eon-play-soundscape-mute/.test(station) && /data-eon-play-soundscape-stop/.test(station) && /bindEonCitySoundscapePolicyPanel/.test(station) && /soundscape\.activateFromUserGesture\(\)/.test(station), 'Immersive Work Mode contains separate visible controls and activates only from that handler');
  check('play-station-has-no-default-sound-preference-persistence', !/(?:readCitySoundscapePreferences|saveCitySoundscapePreferences)/.test(station) && /w572-explicit-sound-action-required/.test(station) && /Local sound remains off until you choose Turn on local sound/.test(station), 'Immersive Work Mode starts sound off and does not store active sound preferences by default');
  check('spatial-station-honors-the-same-gate', /createEonCitySoundscapePolicyController/.test(spatialStation) && /data-eon3-sound-enable/.test(spatialStation) && /data-eon3-sound-mute/.test(spatialStation) && /data-eon3-sound-stop/.test(spatialStation) && /soundscape\.activateFromUserGesture\(\)/.test(spatialStation), 'Spatial Command Space uses the same explicit local sound boundary');
  check('spatial-station-has-no-legacy-sound-persistence', !/(?:readCitySoundscapePreferences|saveCitySoundscapePreferences)/.test(spatialStation) && /This does not start sound/.test(spatialStation) && /tab-visibility-change/.test(spatialStation), 'Spatial Command Space keeps selection session-local and stops on hidden-tab guard');
  check('no-auto-start-from-city-entry-fullscreen-or-settings-save', /w572-explicit-sound-action-required/.test(station) && /Full screen requested\. Local sound remains off/.test(station) && /Local sound stays off until you choose Turn on local sound/.test(station), 'City entry, fullscreen, and visual settings save do not activate local sound');
  check('suite-and-command-registered', /w572-local-soundscape-audio-policy\.test\.mjs/.test(runner) && typeof packageJson.scripts?.['qa:w572-local-soundscape-audio-policy'] === 'string' && typeof packageJson.scripts?.['verify:w555a-w572-source'] === 'string', 'W572 test, gate, QA command, and cumulative verifier are registered');

  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w572.local-soundscape-audio-policy-gate.v1',
    wave: 'W572',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'No final soundtrack, licensed music pack, voice persona, cloud TTS/STT, local audio generation, capture, upload, or production audio proof is added.',
      'No microphone, browser dictation, provider request, account read, private-data projection, background task, route action, notification, social, or multiplayer behavior is added.',
      'No payment, subscription entitlement, reward, ownership, commerce, or audio-value claim is added.',
      'No browser visual review, physical-device audio proof, preview deployment, or production deployment is claimed.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w572-local-soundscape-audio-policy-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW572LocalSoundscapeAudioPolicy();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

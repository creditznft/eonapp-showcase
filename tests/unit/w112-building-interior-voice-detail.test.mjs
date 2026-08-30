import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildW112GameplayContract, W112_BUILDING_DETAIL_SCHEMA } from '../../assets/js/realm3d/engine/EonCityBuildingDetailPass.js';

const sceneSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityFlagshipScene.js', import.meta.url), 'utf8');
const detailSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityBuildingDetailPass.js', import.meta.url), 'utf8');
const voiceSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityVoiceInteractionRuntime.js', import.meta.url), 'utf8');
const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const panelsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/WorldPanels.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');

test('W112 building detail pass gives every major building a door, lobby, sign, and use target', () => {
  assert.equal(W112_BUILDING_DETAIL_SCHEMA, 'eon.realm3d.w112.building-interior-detail.v1');
  assert.match(detailSource, /w112-usable-entry-door/);
  assert.match(detailSource, /w112-visible-lobby/);
  assert.match(detailSource, /w112-building-signage/);
  assert.match(detailSource, /major-visual-has-use-target/);
  assert.match(detailSource, /useTarget/);
  assert.match(sceneSource, /buildW112DistrictDetailLayer/);
  assert.match(sceneSource, /w112BuildingDetail/);
});

test('W112 keeps central private command room as the flagship workspace with typed and voice input affordances', () => {
  assert.match(detailSource, /w112-private-command-room-detail-pass/);
  assert.match(detailSource, /w112-command-room-voice-microphone-dock/);
  assert.match(detailSource, /w112-command-room-typed-input-console/);
  assert.match(detailSource, /TYPE OR SPEAK · EONBOT/);
  assert.match(sceneSource, /buildW112PrivateCommandRoomDetailLayer/);
});

test('W112 optional voice uses browser TTS, explicit microphone gesture, and distance based volume', () => {
  assert.match(voiceSource, /speechSynthesis/);
  assert.match(voiceSource, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(voiceSource, /resolveVolume/);
  assert.match(voiceSource, /distance/);
  assert.match(voiceSource, /userGestureRequired/);
  assert.match(bootSource, /EonCityVoiceInteractionRuntime/);
  assert.match(bootSource, /data-realm3d-voice-toggle/);
  assert.match(bootSource, /data-realm3d-mic/);
  assert.match(panelsSource, /realm3d:voice-transcript/);
  assert.match(panelsSource, /realm3d:voice-reply/);
  assert.match(cssSource, /realm3d-voice-settings/);
});

test('W112 gameplay contract documents high desktop detail and low mobile fallback', () => {
  const neon = buildW112GameplayContract({ quality: 'neon' });
  const low = buildW112GameplayContract({ quality: 'low' });
  assert.equal(neon.everyMajorVisualHasUseTarget, true);
  assert.equal(neon.centralOfficeIsPrimaryHub, true);
  assert.match(neon.graphicsRule, /desktop\/high-capability/);
  assert.match(low.graphicsRule, /basic\/mobile/);
  assert.equal(neon.optionalVoice.proximityVolume.includes('distance'), true);
  assert.ok(neon.requiredUseTargets.includes('private command room'));
});

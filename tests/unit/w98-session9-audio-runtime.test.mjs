import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION9_AUDIO_SCHEMA,
  SESSION9_AUDIO_STORAGE_KEY,
  Session9AudioRuntime,
  computeSession9SpatialMix,
  createSession9DefaultAudioPreferences,
  resolveSession9DistrictBed,
  resolveSession9EonBotCue,
  resolveSession9SurfaceFamily,
  sanitizeSession9AudioPreferences
} from '../../assets/js/realm3d/engine/EonCitySession9AudioRuntime.js';

test('Session 9 audio defaults are opt-in and autoplay-safe', () => {
  const value = createSession9DefaultAudioPreferences();
  assert.equal(value.schema, SESSION9_AUDIO_SCHEMA);
  assert.equal(value.enabled, false);
  assert.equal(value.muted, false);
  assert.ok(value.masterVolume > 0 && value.masterVolume < 1);
  assert.equal(SESSION9_AUDIO_STORAGE_KEY, 'eon:realm3d:audio-preferences:v1');
});

test('Session 9 preference migration allowlists safe sensory settings only', () => {
  const value = sanitizeSession9AudioPreferences({
    enabled: true,
    muted: false,
    masterVolume: 7,
    reducedSensory: true,
    apiKey: 'sk-do-not-keep',
    walletAddress: '0xprivate',
    seedPhrase: 'never keep this'
  });
  assert.deepEqual(Object.keys(value).sort(), ['enabled', 'masterVolume', 'muted', 'reducedSensory', 'schema'].sort());
  assert.equal(value.masterVolume, 1);
  assert.equal(value.reducedSensory, true);
  assert.equal(JSON.stringify(value).includes('sk-do-not-keep'), false);
});

test('Session 9 footsteps resolve distinct world surface families', () => {
  const districts = [
    { id: 'builder', label: 'Builder Forge', position: [20, 0] },
    { id: 'store', label: 'EON Store', position: [-20, 0] },
    { id: 'referral', label: 'Referral Beacon', position: [0, 20] }
  ];
  assert.equal(resolveSession9SurfaceFamily({ position: { x: 19, z: 0 }, districts }), 'metal');
  assert.equal(resolveSession9SurfaceFamily({ position: { x: -19, z: 0 }, districts }), 'glass');
  assert.equal(resolveSession9SurfaceFamily({ position: { x: 0, z: 19 }, districts }), 'neon');
  assert.equal(resolveSession9SurfaceFamily({ activeInteriorId: 'vault' }), 'stone');
  assert.equal(resolveSession9SurfaceFamily({ worldKind: 'private-workstation' }), 'glass');
});

test('Session 9 district bed follows the nearest district deterministically', () => {
  const districts = [
    { id: 'ai', label: 'AI Tower', position: [10, 0] },
    { id: 'vault', label: 'Vault Bank', position: [-10, 0] }
  ];
  const ai = resolveSession9DistrictBed({ position: { x: 9, z: 0 }, districts });
  const vault = resolveSession9DistrictBed({ position: { x: -9, z: 0 }, districts });
  assert.equal(ai.id, 'ai');
  assert.equal(vault.id, 'vault');
  assert.notEqual(ai.frequency, vault.frequency);
});

test('Session 9 spatial mix attenuates portals and weather inside interiors', () => {
  const outside = computeSession9SpatialMix({
    player: { x: 0, z: 0 },
    portals: [{ position: [1, 0] }],
    stations: [{ position: [2, 0] }],
    weather: ['soft-rain'],
    worldKind: 'eon-city'
  });
  const inside = computeSession9SpatialMix({
    player: { x: 0, z: 0 },
    portals: [{ position: [14, 0] }],
    stations: [{ position: [2, 0] }],
    weather: ['soft-rain'],
    activeInteriorId: 'ai',
    worldKind: 'eon-city'
  });
  assert.ok(outside.portalGain > inside.portalGain);
  assert.ok(outside.rainGain > inside.rainGain);
  assert.equal(outside.weatherMode, 'rain');
  assert.ok(outside.stationGain > 0);
});

test('Session 9 EONBOT modes have readable but non-verbal earcons', () => {
  const guide = resolveSession9EonBotCue('guide');
  const arrived = resolveSession9EonBotCue('arrived');
  const station = resolveSession9EonBotCue('station-guide');
  assert.ok(guide.length >= 1);
  assert.ok(arrived.length > guide.length);
  assert.notDeepEqual(station, guide);
  assert.ok(arrived.every((frequency) => frequency >= 40 && frequency < 2000));
});

test('Session 9 runtime stays fully understandable without Web Audio', async () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value)
  };
  const runtime = new Session9AudioRuntime({ storage, root: null });
  const before = runtime.getTelemetry();
  assert.equal(before.unlocked, false);
  assert.equal(before.audioIsOptional, true);
  assert.equal(before.userGestureRequired, true);
  assert.equal(before.noNetworkAudioAssets, true);
  const unlocked = await runtime.unlock('unit-test');
  assert.equal(unlocked, false);
  assert.equal(runtime.getTelemetry().autoplayBlocked, true);
});

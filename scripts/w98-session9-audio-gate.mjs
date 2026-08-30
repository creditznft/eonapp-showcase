import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.join(cwd, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession9AudioRuntime.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const portals = read('assets/js/realm3d/engine/PortalSystem.js');
const css = read('assets/css/realm3d.css');
const session8 = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');
const session7 = read('assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js');

const checks = {
  session9AudioSchema: runtime.includes("SESSION9_AUDIO_SCHEMA = 'eon.realm3d.session9.audio.v1'"),
  cumulativeSession8Preserved: engine.includes("realmMissionSession = 'w98-session8'") && session8.includes('SESSION8_MISSION_SCHEMA'),
  cumulativeSession7Preserved: engine.includes("realmInteriorSession = 'w98-session7'") && session7.includes('SESSION7_INTERIOR_SCHEMA'),
  optInUserGestureOnly: runtime.includes('userGestureRequired: true') && runtime.includes("enabled: false"),
  noAutoplayOnBoot: !engine.includes("this.audio?.unlock?.('boot')") && runtime.includes('autoplayAttempts'),
  proceduralNoNetworkAudio: runtime.includes('createOscillator') && runtime.includes('createBuffer') && runtime.includes('noNetworkAudioAssets: true') && !/fetch\(|new Audio\(|\.mp3|\.ogg|\.wav/.test(runtime),
  cityWindAndRainBeds: runtime.includes('windGain') && runtime.includes('rainGain') && runtime.includes('weatherMode'),
  portalAndStationHums: runtime.includes('portalGain') && runtime.includes('stationGain'),
  districtAudioBeds: runtime.includes('DISTRICT_TONES') && runtime.includes('resolveSession9DistrictBed'),
  footstepsBySurface: runtime.includes('SURFACE_PROFILES') && runtime.includes('playFootstep') && runtime.includes('resolveSession9SurfaceFamily'),
  eonbotStateEarcons: runtime.includes('resolveSession9EonBotCue') && runtime.includes('playEonBotMode'),
  missionCompletionFeedback: runtime.includes('handleMissionChange') && runtime.includes("'mission-completed'"),
  spatialInteractionFeedback: runtime.includes('handleInteraction') && portals.includes('onInteraction'),
  muteVolumeControls: engine.includes('data-realm3d-audio-toggle') && engine.includes('data-realm3d-audio-volume'),
  reducedSensoryControl: engine.includes('data-realm3d-reduced-sensory') && runtime.includes('setReducedSensory'),
  backgroundTabSuspension: runtime.includes('visibilitychange') && runtime.includes('context.suspend'),
  textAndVisualIndependence: runtime.includes('Visual, text') && engine.includes('Sound optional'),
  safePreferenceAllowlist: runtime.includes('SAFE_AUDIO_KEYS') && !runtime.includes("'apiKey'") && !runtime.includes("'walletAddress'"),
  audioTelemetry: engine.includes('getSession9AudioState') && runtime.includes('getTelemetry()'),
  mobileAudioControls: css.includes('realm3d-audio-settings') && css.includes('@media (max-width: 780px)'),
  historicalPerformanceArchitecturePreserved: engine.includes('intent-first') || read('assets/js/realm3d/realm-flagship-shell.js').includes('intent')
};
const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session9.audio-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const output = path.join(cwd, 'CodexAuditPack/W98_SESSION9/W98_SESSION9_STATIC_GATE.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

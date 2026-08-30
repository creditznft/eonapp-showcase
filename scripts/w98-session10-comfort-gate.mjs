import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.join(cwd, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const player = read('assets/js/realm3d/engine/PlayerController.js');
const mobile = read('assets/js/realm3d/engine/MobileControls.js');
const css = read('assets/css/realm3d.css');
const session9 = read('assets/js/realm3d/engine/EonCitySession9AudioRuntime.js');
const session8 = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');

const checks = {
  session10ComfortSchema: runtime.includes("SESSION10_COMFORT_SCHEMA = 'eon.realm3d.session10.comfort.v1'"),
  cumulativeSession9Preserved: engine.includes("realmAudioSession = 'w98-session9'") && session9.includes('SESSION9_AUDIO_SCHEMA'),
  cumulativeSession8Preserved: engine.includes("realmMissionSession = 'w98-session8'") && session8.includes('SESSION8_MISSION_SCHEMA'),
  safePreferenceAllowlist: runtime.includes('SAFE_COMFORT_KEYS') && runtime.includes('noIdentityOrSecretStorage: true') && !runtime.includes("'apiKey'"),
  refinedDualStickTouch: mobile.includes('role="application"') && mobile.includes('setLeftHanded') && mobile.includes('getVector'),
  largeTouchActions: mobile.includes('data-action="interact"') && mobile.includes('data-action="eonbot"') && mobile.includes('data-action="menu"'),
  controllerPolling: player.includes('navigator.getGamepads') && player.includes('updateGamepad()'),
  controllerRadialDeadzone: player.includes('radialDeadzone') && runtime.includes('applySession10RadialDeadzone'),
  controllerRemapping: runtime.includes('sanitizeSession10ControllerBindings') && engine.includes('data-realm3d-controller-binding'),
  controllerActionParity: engine.includes('handleControllerAction') && player.includes('onControllerAction'),
  keyboardEnterInteraction: engine.includes("event.code === 'Enter'") && engine.includes('canvasFocused'),
  sensitivityAndInversion: engine.includes('mouseSensitivity') && engine.includes('mobileLookSensitivity') && engine.includes('invertGamepadY'),
  fovAndCameraBob: engine.includes('data-realm3d-comfort="fov"') && player.includes('updateCameraBob'),
  reducedMotion: runtime.includes('reducedMotion') && css.includes('[data-reduced-motion="true"]'),
  comfortVignette: engine.includes('data-realm3d-comfort-vignette') && css.includes('.realm3d-comfort-vignette'),
  highContrastHud: engine.includes('highContrast') && css.includes('[data-high-contrast="true"]'),
  scalableHudType: engine.includes('uiScale') && css.includes('--realm3d-ui-scale'),
  screenReaderWorldSummary: runtime.includes('buildSession10WorldSummary') && engine.includes('data-realm3d-a11y-live'),
  portraitFallbackLayout: engine.includes('data-realm3d-portrait-guide') && css.includes('[data-portrait-mode="true"]'),
  deliberatePortraitChoice: engine.includes('dismiss-portrait') && engine.includes('Use 2D fallback'),
  basicDeviceProfile: runtime.includes('basicDeviceMode') && engine.includes('applyBasicDeviceMode') && css.includes('.realm3d-basic-device'),
  accessibleFocusAndExit: engine.includes('Esc or Back returns control') && engine.includes('renderer?.domElement?.focus'),
  noNewThirdPartyRuntime: !/https?:\/\//.test(runtime + mobile + player),
  intentFirstPreserved: read('assets/js/realm3d/eon-city-app.js').includes('intent-first loader')
};
const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session10.comfort-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const output = path.join(cwd, 'CodexAuditPack/W98_SESSION10/W98_SESSION10_STATIC_GATE.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

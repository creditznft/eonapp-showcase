import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const portals = read('assets/js/realm3d/engine/PortalSystem.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const player = read('assets/js/realm3d/engine/PlayerController.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const css = read('assets/css/realm3d.css');
const livePolicy = read('assets/js/realm3d/engine/EonCityLiveAppPanelRuntime.js');
const session6 = read('scripts/w98-session6-visual-gate.mjs');

const requiredStationTypes = ['chat', 'code-maker', 'provider-health', 'rewards', 'marketplace-preview', 'vault-summary', 'realm-templates'];
const checks = {
  session7InteriorSchema: runtime.includes("SESSION7_INTERIOR_SCHEMA = 'eon.realm3d.landmark-interiors.w98.session7.v1'"),
  eightInteriorSpecifications: ['ai:', 'vault:', 'trade:', 'builder:', 'store:', 'mission:', 'referral:', 'portal:'].every((token) => runtime.includes(token)),
  authoredThresholdsAndReturns: runtime.includes('threshold: [threshold.x, threshold.z]') && runtime.includes('returnPoint: [returnPoint.x, returnPoint.z]'),
  reliableExitContract: runtime.includes("kind: 'interior-exit'") && runtime.includes('reliableExit: true'),
  lazyActiveInteriorBuild: world.includes('createSession7InteriorScene') && world.includes('enterInterior(interiorId') && world.includes('exitInterior()'),
  exteriorWorldVisibilityRestored: world.includes('setWorldVisualsVisible(false)') && world.includes('setWorldVisualsVisible(true)') && world.includes('restoreWorldCollisions'),
  interiorCollisionBounds: runtime.includes('collisionBoxes') && runtime.includes('session7-interior-left-wall') && runtime.includes('session7-interior-front-right'),
  requiredSafeStationTypes: requiredStationTypes.every((type) => runtime.includes(`type: '${type}'`)),
  nativeOnlyStationPolicy: runtime.includes('iframe: false') && runtime.includes('externalEmbed: false') && runtime.includes("mode: summaryOnly ? 'native-summary-only' : 'safe-native-widget'"),
  explicitFullPageHandoff: runtime.includes('fullRouteOnlyAfterExplicitUserChoice: true') && panels.includes('Open full page'),
  sameOriginPreviewOnly: panels.includes("frame.src = '/realm-code-preview.html'") && livePolicy.includes("'/code-maker.html'"),
  secretRedactionContract: ['noApiKeys: true', 'noSeedPhrases: true', 'noPrivateKeys: true', 'noPaymentCredentials: true', 'noOwnerPrivateContext: true'].every((token) => runtime.includes(token)),
  noOwnerPrivateContext: runtime.includes('ownerPrivateContext: false') && runtime.includes('ownerPrivate: false'),
  pointerLockReleasedOnPanel: boot.includes("releasePointerLock?.('workstation-screen-focus')") && boot.includes("releasePointerLock?.('realm-panel-open')"),
  controlsSuspendedDuringPanel: player.includes('setEnabled(enabled = true)') && boot.includes('this.player?.setEnabled?.(false)'),
  focusMovesIntoDialog: panels.includes("card.setAttribute('role', 'dialog')") && panels.includes("card.setAttribute('aria-modal', 'true')") && panels.includes('requestAnimationFrame'),
  keyboardFocusTrapAndEscape: panels.includes("event.key === 'Escape'") && panels.includes("event.key !== 'Tab'") && panels.includes('last.focus()'),
  controlsAndFocusRestored: panels.includes('this.previousFocus') && boot.includes("this.renderer?.domElement?.focus") && boot.includes('this.player?.setEnabled?.(true)'),
  mobileInteriorUi: css.includes('.realm3d-inside-landmark') && css.includes('.realm3d-panel-active') && css.includes('@media (max-width: 760px)'),
  intentFirstAndHistoryPreserved: boot.includes("realmVisualSession = 'w98-session6'") && boot.includes("realmInteriorSession = 'w98-session7'") && session6.includes('historicalSession5GatePreserved'),
  noThirdPartyRuntimeDependency: !runtime.includes('fetch(') && !runtime.includes('WebSocket') && !runtime.includes('XMLHttpRequest') && !runtime.includes('https://')
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session7.interior-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION7/W98_SESSION7_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);

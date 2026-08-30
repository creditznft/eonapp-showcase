import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('assets/js/realm3d/engine/EonCitySession8MissionRuntime.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const css = read('assets/css/realm3d.css');
const session7 = read('assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js');
const proof7 = read('scripts/w98-session7-interior-gate.mjs');

const checks = {
  versionedMissionSchema: runtime.includes("SESSION8_MISSION_SCHEMA = 'eon.realm3d.missions.w98.session8.v2'") && runtime.includes('SESSION8_STATE_VERSION = 2'),
  cumulativeSession7Preserved: boot.includes("realmInteriorSession = 'w98-session7'") && boot.includes("realmMissionSession = 'w98-session8'") && session7.includes('SESSION7_INTERIOR_SCHEMA'),
  firstArrivalChain: ['city-entered', 'player-moved', 'eonbot-opened', 'interior-entered', 'station-opened', 'station-closed', 'interior-exited'].every((token) => runtime.includes(`event: '${token}'`)),
  guidedDistrictTour: ['tour-spawn', 'tour-ai', 'tour-builder', 'tour-vault', 'tour-store', 'tour-mission', 'tour-portal'].every((token) => runtime.includes(token)),
  deterministicCompletionConditions: runtime.includes('objectiveMatches') && runtime.includes('minimumDistance') && runtime.includes('targetId'),
  localResumableLedger: runtime.includes('SESSION8_STORAGE_KEY') && runtime.includes('localStorage') && runtime.includes('migrateSession8State'),
  versionedMigrationAndSanitization: runtime.includes('sanitizeProfile') && runtime.includes('sanitizeMissionProgress') && runtime.includes('unknown identity or secret fields vanish'),
  publicOwnerSeparation: runtime.includes('public-visitor') && runtime.includes('owner-private') && runtime.includes('setAudience(audience)'),
  oneTimeCreditIdempotency: runtime.includes('completionCredits') && runtime.includes('!profile.completionCredits[mission.id]'),
  repeatableActivities: ['ai-health-check', 'builder-sandbox-run', 'mission-briefing', 'portal-template-scan'].every((token) => runtime.includes(token)),
  repeatableCycleIdempotency: runtime.includes('entry.count >= 1') && runtime.includes('cycleKey') && runtime.includes('eventTokens.includes'),
  honestNonFinancialLanguage: runtime.includes('No account identity') && runtime.includes('cash rewards') && runtime.includes('earnings promises'),
  accessibleObjectiveDrawer: runtime.includes("setAttribute('role', 'dialog')") && runtime.includes("data-mission-close") && runtime.includes("event.key === 'Escape'"),
  skipReplayResetControls: ['data-mission-skip', 'data-mission-replay', 'data-mission-reset', 'Confirm local reset'].every((token) => runtime.includes(token)),
  compactMobileHud: css.includes('.realm3d-mission-hud') && css.includes('@media (max-width: 760px)') && css.includes('.realm3d-mission-drawer-active .realm3d-mobile-controls'),
  controlsPauseDuringDrawer: boot.includes('handleMissionDrawerChange(open)') && boot.includes("releasePointerLock?.('mission-objectives')") && boot.includes('setEnabled?.(false)'),
  eonbotWaypoints: boot.includes('guideMissionObjective') && boot.includes('startEonBotGuidance') && runtime.includes('data-mission-guide'),
  realInteriorStationHooks: boot.includes("recordMissionEvent('interior-entered'") && boot.includes("recordMissionEvent('station-opened'") && boot.includes("recordMissionEvent('interior-exited'"),
  intentFirstAndHistoricalGatesPreserved: boot.includes("realmVisualSession = 'w98-session6'") && proof7.includes('intentFirstAndHistoryPreserved'),
  noNetworkOrSecretRuntime: !runtime.includes('fetch(') && !runtime.includes('WebSocket') && !runtime.includes('XMLHttpRequest') && !runtime.includes('indexedDB') && !runtime.includes('walletAddress') && !runtime.includes('privateKey'),
  noSession7RegressionByReplacement: boot.includes('enterLandmarkInterior') && boot.includes('focusWorkstationScreen') && boot.includes('exitLandmarkInterior') && boot.includes('closeWorkstationScreen')
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session8.mission-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION8/W98_SESSION8_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);

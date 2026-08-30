#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityGameplayMatrix, EON_CITY_GAMEPLAY_REQUIREMENTS } from '../assets/js/utils/eoncity-gameplay-certification.js';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

const checks = [];
function check(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail });
}

const html = read('realmworld.html');
const page = read('assets/js/realmworld-page.js');
const mobile = read('assets/js/realm3d/engine/EonCityMobileUxPerfectionRuntime.js');
const mobileCss = read('assets/css/eoncity-mobile-ux.css');
const realmCss = read('assets/css/realmworld.css');
const pkg = JSON.parse(read('package.json'));

check('realmworld-page-type', html.includes('body data-page-type="realmworld"'), 'RealmWorld page declares page type.');
check('map-role-application', html.includes('id="rw-map"') && html.includes('role="application"'), 'Map is an accessible application region.');
check('status-live-region', html.includes('id="rw-status"') && html.includes('aria-live="polite"'), 'Status live region exists.');
check('workspace-panel', html.includes('id="rw-workspace"') && html.includes('Private workstation'), 'Private workstation panel exists.');
check('npc-life-panel', html.includes('id="rw-npc-life"') && html.includes('NPC city life'), 'NPC city life panel exists.');
check('gameplay-cert-section', html.includes('id="rw-gameplay-certification"') && html.includes('data-eoncity-gameplay-certification="session9"'), 'Session 9 gameplay certification section exists.');
check('mobile-ux-entry', html.includes('/assets/js/realm3d/w170-mobile-ux-entry.js') && html.includes('/assets/css/eoncity-mobile-ux.css'), 'Mobile UX runtime and CSS are loaded.');
check('tap-focus-handler', page.includes('focusNode(btn)') && page.includes("addEventListener('click'"), 'Single tap/click focus handler is present.');
check('double-tap-portal', page.includes("addEventListener('dblclick'") && page.includes('activatePortal(btn)'), 'Double-tap portal activation is present.');
check('double-tap-workspace', page.includes('activateWorkspaceModule(btn)') && page.includes('data-workspace-href'), 'Double-tap workstation module activation is present.');
check('keyboard-camera-controls', page.includes('handleMapKeydown') && page.includes('ArrowUp') && page.includes("'0': 'reset'"), 'Keyboard camera controls exist.');
check('safe-fallback', page.includes('showRealmBootFailure') && page.includes('EON City safe mode'), 'Boot fallback keeps gameplay safe.');
check('diagnostic-api', page.includes('EONCityGameplayCertification') && page.includes('getReport'), 'Browser QA diagnostic API is exposed.');
check('cert-module-imported', page.includes('eoncity-gameplay-certification.js'), 'Gameplay certification module is wired into the page.');
check('hide-ui-control', mobile.includes('data-eoncity-hide-ui') && mobile.includes('Hide UI'), 'Hide UI control exists.');
check('close-panels-control', mobile.includes('data-eoncity-close-panels') && mobile.includes('Close panels'), 'Close panels control exists.');
check('reset-camera-control', mobile.includes('data-eoncity-reset-camera') && mobile.includes('Reset camera'), 'Reset camera control exists.');
check('escape-closes-panels', mobile.includes("event.key === 'Escape'") && mobile.includes('closeGameplayOverlays'), 'Escape closes gameplay overlays.');
check('overlay-contract', mobile.includes('allOverlaysCloseable: true') && mobile.includes('bottomNavMayNotCoverControls: true'), 'Overlay contract blocks uncloseable windows and bottom nav coverage.');
check('viewport-matrix', mobile.includes('iphone-se-landscape') && mobile.includes('pixel-7-portrait') && mobile.includes('desktop-ultra'), 'Mobile/landscape/desktop viewport matrix exists.');
check('safe-area-css', mobileCss.includes('env(safe-area-inset-bottom)') && mobileCss.includes('.eoncity-ux-dock'), 'Safe-area-aware dock CSS exists.');
check('landscape-css', mobileCss.includes('@media (orientation: landscape)') && mobileCss.includes('max-height: 520px'), 'Landscape mobile CSS exists.');
check('collapsed-panels-css', mobileCss.includes('eoncity-ui-collapsed') && mobileCss.includes('pointer-events: none'), 'Collapsed panels cannot trap gameplay.');
check('cert-css', realmCss.includes('Session 9: CEO gameplay certification strip') && realmCss.includes('.rw-gameplay-cert-layout'), 'Gameplay certification CSS exists.');
check('w156-w165-artifacts', exists('artifacts/W165_FINAL_GAMER_POWER_USER_CERTIFICATION_STATS_2026-06-14.json') && exists('artifacts/W164_SUSTAINED_PERFORMANCE_LAB_STATS_2026-06-14.json'), 'Prior EON City visual/performance artifacts are carried forward.');
check('package-script', pkg.scripts?.['gpt55:eoncity-gameplay-certification-gate'] === 'node scripts/gpt55-eoncity-gameplay-certification-gate.mjs', 'Package script is registered.');

const matrix = buildEonCityGameplayMatrix();
check('matrix-seven-viewports', matrix.length === 7, 'Certification matrix includes 7 viewports.');
check('matrix-all-green', matrix.every((entry) => entry.score === 100 && entry.ok), 'All certification matrix viewports score 100.');
check('requirements-count', EON_CITY_GAMEPLAY_REQUIREMENTS.length >= 10, 'At least 10 gameplay requirements are defined.');
check('mobile-default-css', matrix.filter((entry) => entry.viewport.isMobile).every((entry) => entry.viewport.defaultRenderer === 'css'), 'Mobile defaults to safe CSS renderer.');
check('landscape-blocked-ratio', matrix.filter((entry) => entry.viewport.orientation === 'landscape').every((entry) => entry.viewport.maxBlockedRatio <= 0.24), 'Landscape blocked ratio budget is strict.');

const passed = checks.filter((item) => item.ok).length;
const failed = checks.filter((item) => !item.ok);
const score = Math.round((passed / checks.length) * 100);
const report = { gate: 'gpt55-eoncity-gameplay-certification-gate', score, passed, total: checks.length, failed, matrix: matrix.map((entry) => ({ orientation: entry.viewport.orientation, width: entry.viewport.width, height: entry.viewport.height, maxBlockedRatio: entry.viewport.maxBlockedRatio, panelMode: entry.viewport.panelMode, score: entry.score })), checks };
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp/session9-eoncity-gameplay-certification-stats.json'), JSON.stringify(report, null, 2));
if (failed.length) {
  console.error(`Session 9 EON City gameplay certification failed: ${score}/100`);
  failed.forEach((item) => console.error(`- ${item.id}: ${item.detail}`));
  process.exit(1);
}
console.log(`Session 9 EON City gameplay certification passed: ${score}/100 (${passed}/${checks.length})`);
console.log(`Viewport matrix: ${matrix.map((entry) => `${entry.viewport.orientation}:${entry.score}`).join(', ')}`);

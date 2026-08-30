#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660S_LIVING_NEXUS_FUNCTIONAL_ENCOUNTERS_CONTRACT } from '../config/w660s-living-nexus-functional-encounters-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660sLivingNexusFunctionalEncounters() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660s-living-nexus-functional-encounters-contract.mjs',
    'assets/js/city/eon-city-living-nexus-encounters.js',
    'assets/js/city/eon-city-living-nexus-encounter-panel.js',
    'tests/unit/w660s-living-nexus-functional-encounters.test.mjs',
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md'
  ];
  add('required-files', required.every(exists), 'contract, encounter controller, review panel, tests and roadmap exist');

  const encounters = read(required[1]);
  add('six-native-mission-families', W660S_LIVING_NEXUS_FUNCTIONAL_ENCOUNTERS_CONTRACT.encounterLayer.missionFamilies.every((missionId) => encounters.includes(`missionId: '${missionId}'`)), 'six existing productive mission families are bound to deterministic specialists');
  add('deterministic-actual-position', /specialistForCell/.test(encounters) && /encounterPosition/.test(encounters) && /position,/.test(encounters), 'encounters derive deterministic cell positions used by the renderer');
  add('review-first-controller', /inspect\(encounterId/.test(encounters) && /prepareMission\(encounterId/.test(encounters) && /explicit-user-action-required/.test(encounters), 'inspection and preparation require explicit user actions');
  add('matching-receipt-only', /syncVerifiedReturn/.test(encounters) && /matching-verified-receipt-not-found/.test(encounters) && /OUTCOME_TO_MISSION\[outcome.kind\] !== state.pending.missionId/.test(encounters), 'only the matching verified productive receipt resolves the prepared location');
  add('opaque-bounded-state', /MAX_RESOLUTIONS = 18/.test(encounters) && /privateContentStored: false/.test(encounters) && /EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY/.test(encounters), 'persistence is bounded to opaque encounter and receipt identifiers');
  add('no-parallel-or-autonomous-system', !/fetch\s*\(|XMLHttpRequest|WebSocket|new\s+Worker\s*\(|new\s+Scene\s*\(|createElement\s*\(\s*["']canvas/.test(encounters) && /automaticNavigation: false/.test(encounters) && /automaticExecution: false/.test(encounters), 'encounter state creates no provider, worker, scene, canvas, automatic route or automatic work system');

  const renderer = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  add('rendered-opportunity-position', /npc\.position\.set\(encounter\.position\.x/.test(renderer) && /getNearestOpportunity/.test(renderer) && /resolveNearestEonCityLivingNexusEncounter/.test(renderer), 'proximity is calculated from the actual rendered NPC position');
  add('exact-transformation-render', /setEncounterResolutions/.test(renderer) && /npcResolved/.test(renderer) && /encounter\.state === 'transformed'/.test(renderer), 'an exact resolved encounter receives the verified visual state');
  add('bounded-nine-residents', /opportunityCount/.test(renderer) && W660S_LIVING_NEXUS_FUNCTIONAL_ENCOUNTERS_CONTRACT.encounterLayer.residentEncounterCount === 9, 'one opportunity is emitted for each resident 3×3 cell');

  const panel = read(required[2]);
  add('visible-review-actions', /data-eon-encounter-inspect/.test(panel) && /data-eon-encounter-interpret/.test(panel) && /data-eon-encounter-review-mission/.test(panel) && /data-eon-encounter-check-return/.test(panel), 'inspect, local EONBOT interpretation, mission review and return receipt are visible controls');
  add('two-step-native-route', /data-eon-encounter-confirm-route/.test(panel) && /Stay in City/.test(panel) && /separate visible click/.test(panel), 'leaving City requires a second visible route confirmation');
  add('existing-eonbot-and-mission-bridge', /setCompanionIntent/.test(panel) && /eon:city:productive-rpg:review/.test(panel) && /eon:city:living-nexus:sync-request/.test(panel), 'the panel reuses canonical EONBOT, Productive RPG and Living Nexus sync flows');

  const station = read('assets/js/eon-city-play-station.js');
  add('station-proximity-context', /onLivingNexusOpportunityChange/.test(station) && /nearbyLivingNexusOpportunity/.test(station) && /eon:city:living-nexus:open-encounter/.test(station), 'the existing City context action opens a nearby Expanse encounter');
  add('station-native-review', /bindEonCityLivingNexusEncounterPanel/.test(station) && /eon:city:productive-rpg:review/.test(station), 'station lifecycle mounts the encounter panel and reuses the native Productive RPG review');

  const livingPanel = read('assets/js/city/eon-city-living-nexus-panel.js');
  add('atlas-sync-bridge', /eon:city:living-nexus:sync-request/.test(livingPanel) && /eon:city:living-nexus:sync-result/.test(livingPanel) && /syncVerifiedOutcomes/.test(livingPanel), 'verified return sync updates the existing Living Nexus transformation bridge');

  const css = read('assets/css/eon-city-play.css');
  add('responsive-encounter-ui', /eon-play-living-nexus-encounter/.test(css) && /eon-play-living-nexus-encounter-panel/.test(css) && /@media\s*\(max-width:/.test(css), 'encounter review surface has responsive desktop and mobile styling');

  const roadmap = read(required[4]);
  add('roadmap-progress-and-proof-boundary', /W660S — functional encounter layer/.test(roadmap) && /W660S source implementation is complete/i.test(roadmap) && /authenticated real-browser proof/i.test(roadmap) && /Functions-inclusive Cloudflare Pages/.test(roadmap), 'roadmap records source completion while authenticated browser and complete Pages proof remain pending');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660s-living-nexus-functional-encounters'] === 'node scripts/w660s-living-nexus-functional-encounters-gate.mjs && node --test tests/unit/w660s-living-nexus-functional-encounters.test.mjs', 'focused W660S QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660s-living-nexus-functional-encounters.test.mjs') && manifest.testFileCount >= 317, `${manifest.testFileCount} maintained test files include W660S`);

  return freeze({ schema: 'eonapp.w660s.living-nexus-functional-encounters-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660sLivingNexusFunctionalEncounters();
for (const check of report.checks) console.log(`[W660S] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660S] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;

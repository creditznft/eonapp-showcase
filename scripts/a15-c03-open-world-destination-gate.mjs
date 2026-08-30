#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { A15_REPOSITORY_ROOT, inspectCityCoreBoundary, inspectCoreCityBoundary } from './lib/a15-source-authority.mjs';
import { A15_BUILD_HTML_ENTRY_FILES } from '../config/a15-current-product-authority.mjs';
import { EON_CITY_W731_STATIONS, EON_CITY_W737_DISCOVERIES } from '../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W763_MENU_ORDER } from '../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';

const ROOT = A15_REPOSITORY_ROOT;
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const runtime = readFileSync(path.join(ROOT, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'), 'utf8');
const accessibility = readFileSync(path.join(ROOT, 'assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js'), 'utf8');
const css = readFileSync(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const physicalGates = EON_CITY_W737_DISCOVERIES.filter((record) => record.id === 'expanse-gate' && record.label === 'Expanse Gate');
const signalIndex = runtime.indexOf('data-eon-city-featured="signal-frontier"');
const stormIndex = runtime.indexOf('data-eon-city-featured="storm-sector"');
const frontierIndex = runtime.indexOf('data-eon-city-featured="my-frontier"');
const featuredHandlerMatch = runtime.match(/const openWorld = event\.target\.closest\('\[data-eon-city-menu-open-world\]'\);\s*if \(openWorld\) \{([\s\S]*?)\n\s*\}/);
const featuredHandler = featuredHandlerMatch?.[1] || '';
const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const expectedOperations = ['Living Nexus', 'Mission Board', 'Live Monitors', 'Share Command Center', 'Creator Capture', 'Plans & Access', 'Accessible Map'];
const errors = [
  ...(signalIndex < 0 ? ['Missing Signal Frontier flagship card.'] : []),
  ...(stormIndex < 0 ? ['Missing Storm Sector flagship card.'] : []),
  ...(frontierIndex < 0 ? ['Missing My Frontier flagship card.'] : []),
  ...(signalIndex < 0 || stormIndex < 0 || frontierIndex < 0 || !(signalIndex < stormIndex && stormIndex < frontierIndex) ? ['World cards must preserve Signal → Storm → My Frontier authored order.'] : []),
  ...(!runtime.includes('<strong>Signal Frontier</strong>') || !runtime.includes('<strong>Storm Sector</strong>') || !runtime.includes('<strong>My Frontier</strong>') ? ['Missing exact three-World labels.'] : []),
  ...(!runtime.includes('data-eon-city-menu-open-world>Open Signal Frontier') ? ['Signal Frontier must expose its explicit entry review action.'] : []),
  ...(!featuredHandler.includes('openExpanseReview(trigger)') ? ['Signal Frontier action must reuse the existing entry review.'] : []),
  ...(featuredHandler.includes('enterExpanseFromReview') ? ['Signal Frontier card must not bypass entry review.'] : []),
  ...(!runtime.includes("eonCityRuntimeLauncher = 'l95'") || !runtime.includes("makeLauncher('Explore'") ? ['Current Launch95 Explore launcher authority is missing.'] : []),
  ...(!runtime.includes('data-eon-city-world-status="available-from-start"') || !runtime.includes('My Frontier is already available if you want to build first.') ? ['My Frontier starter availability is not stated truthfully.'] : []),
  ...(!runtime.includes('Availability is tied only to its own certified build—not Signal completion.') ? ['Storm Sector independence from Signal progression is not explicit.'] : []),
  ...(physicalGates.length !== 1 ? [`Expected one canonical physical Expanse Gate, observed ${physicalGates.length}.`] : []),
  ...(EON_CITY_W731_STATIONS.some((record) => record.id === 'expanse-gate') ? ['Physical Expanse Gate must remain a discovery, not a duplicate station.'] : []),
  ...(JSON.stringify(EON_CITY_W763_MENU_ORDER) !== JSON.stringify(expectedOperations) ? ['Command Hub quick-operation authority does not match the rendered operations row.'] : []),
  ...(!accessibility.includes('Open World — Signal Frontier is entered through the physical Expanse Gate') ? ['Accessible navigation does not explain the Signal/physical-gate relationship.'] : []),
  ...(!['signal-frontier','storm-sector','my-frontier'].every((id) => css.includes(`[data-eon-city-featured="${id}"]`)) ? ['Three-World cards do not all have maintained styling.'] : []),
  ...(A15_BUILD_HTML_ENTRY_FILES.filter((file) => /expanse|signal-frontier|storm-sector|my-frontier|open-world/i.test(file)).length ? ['Worlds must not create a second HTML route.'] : []),
  ...(coreBoundary.coupledRouteCount ? ['C03 regressed Core-to-City isolation.'] : []),
  ...(cityBoundary.nonCityImplementationModuleCount ? ['C03 regressed City-to-Core isolation.'] : [])
];
const receiptCore = {
  schema: 'eonapp.a15.c03.open-world-destination-receipt.v2', wave: 'C03', status: errors.length ? 'fail' : 'pass',
  worlds: { primaryLauncher: 'Explore', order: ['Signal Frontier','Storm Sector','My Frontier'], signalReviewRequired: true, myFrontierStarterAccess: true, stormSignalGateRequired: false, separateRouteCreated: false },
  runtime: { oneEngineSceneRenderLoopPreserved: true, existingSignalReviewControllerReused: true, enterControl: 'Enter Signal Frontier', cancelControl: 'Cancel' },
  authority: { menuOrder: EON_CITY_W763_MENU_ORDER, physicalGateCount: physicalGates.length, buildHtmlEntryCount: A15_BUILD_HTML_ENTRY_FILES.length, coreCoupledRouteCount: coreBoundary.coupledRouteCount, cityCoreImplementationModuleCount: cityBoundary.nonCityImplementationModuleCount }, errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
if (WRITE_EVIDENCE) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(path.join(EVIDENCE_DIR, 'A15_C03_OPEN_WORLD_DESTINATION_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
console.log(`[A15 C03] ${receipt.status.toUpperCase()}: ${receipt.worlds.order.join(' → ')}; ${receipt.authority.physicalGateCount} physical Signal gate; review-first=${receipt.worlds.signalReviewRequired}.`);
if (errors.length) { for (const error of errors) console.error(`[A15 C03] ${error}`); process.exitCode = 1; }

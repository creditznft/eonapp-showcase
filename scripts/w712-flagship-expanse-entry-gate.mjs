#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../assets/js/city/eon-city-connected-core.js';
import { buildEonCityW712FlagshipExpansePlan, getEonCityW712FlagshipExpanseEntryTruth, resolveEonCityW712FlagshipExpanseEntryState, validateEonCityW712FlagshipExpansePlan } from '../assets/js/city/w712/eon-city-w712-flagship-expanse-entry.js';
const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
const play = read('assets/js/city/eon-city-play-babylon.js');
const station = read('assets/js/eon-city-play-station.js');
const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
const panel = read('assets/js/city/eon-city-living-nexus-panel.js');
const css = read('assets/css/eon-city-play.css');
const core = buildEonCityConnectedCorePlan();
const truth = getEonCityW712FlagshipExpanseEntryTruth();
const openWorldPlan = buildEonCityW712FlagshipExpansePlan({ gateway: core.physicalGateway, quality: 'balanced', seed: 'eonapp-expanse' });
const openWorldValidation = validateEonCityW712FlagshipExpansePlan(openWorldPlan);
const ready = resolveEonCityW712FlagshipExpanseEntryState({ gateway: { distance: 5.4, inspectRadius: 5.5, enterRadius: 2.4, entryReadyRadius: 5.5, inInspectRange: true, inEnterRange: false, inEntryReadyRange: true }, prepared: true });
const checks = [
  ['one-review-one-confirmation', ready.id === 'ready-to-enter' && ready.primaryAction === 'enter' && ready.entryReady],
  ['continuous-flagship-approach', core.continuousFabric.borderCorridors.some((entry) => entry.flagshipGateway && entry.visibleContinuation) && core.physicalGateway.discoveryRadius > core.physicalGateway.inspectRadius],
  ['open-world-ready-before-claim', openWorldValidation.ok && openWorldPlan.world.ready && openWorldPlan.world.visibleCellCount === 25 && openWorldPlan.world.interactiveCellCount === 9 && openWorldPlan.map.regionCount === 9 && openWorldPlan.safeReturn.restoresCapturedCorePose],
  ['runtime-removes-hidden-radius', /entryReadyRadius \|\| gatewayAuthority\?\.inspectRadius/.test(runtime) && /noExtraMovementRequired: true/.test(runtime) && !/maxDistance: connectedCoreRenderer\.getGateway\(\)\?\.enterRadius/.test(runtime)],
  ['safe-core-return', /captureEonCityExplorationPose/.test(play) && /normalizeEonCityExplorationPose\(livingNexusCorePose\)/.test(play) && /safeCoreReturnAvailable: true/.test(play) && /Safe return restores/.test(panel)],
  ['state-driven-large-hud-action', /data-eon-w712-state/.test(station) && /data-eon-play-gateway-guide/.test(station) && /flowState\.primaryAction === 'enter'/.test(station) && /min-height:3rem/.test(css)],
  ['product-entry-copy', /flagship open world/.test(product) && /No automatic travel or hidden second movement step/.test(product)],
  ['connected-core-valid', validateEonCityConnectedCorePlan(core).ok],
  ['truth-boundaries', truth.oneReviewThenOneConfirmation && truth.hiddenSecondDistanceThresholdRemoved && truth.safeCoreReturnRetained && truth.oneCanonicalScene && !truth.automaticEntry && !truth.automaticNavigation && !truth.automaticExecution && !truth.privateDataRead]
];
for (const [id, pass] of checks) console.log(`[W712] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W712] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;

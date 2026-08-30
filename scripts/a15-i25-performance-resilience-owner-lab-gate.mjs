#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCoreEnduranceReceipt,
  createCoreWebVitalsReceipt,
  createOwnerLabReceipt,
  getPerformanceResilienceTruth
} from '../assets/js/performance/eon-performance-resilience-owner-lab.js';
import { buildEonAppW715PerformancePlan, validateEonAppW715PerformancePlan } from '../assets/js/runtime/w715/eonapp-w715-performance-asset-engineering.js';
import { buildEonCityW757ReliabilityPlan, validateEonCityW757ReliabilityPlan } from '../assets/js/city/w757/eon-city-w757-performance-reliability.js';
import { inspectCoreCityBoundary, sha256 } from './lib/a15-source-authority.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const policy = JSON.parse(read('config/performance/a15-i25-performance-resilience-policy.json'));
const errors = [];
const digest = 'a'.repeat(64);
const evidence = 'b'.repeat(64);
const git = 'c'.repeat(40);
const samples = Array.from({ length: 20 }, (_, index) => ({ lcpMs: 1800 + index, inpMs: 100 + index, cls: 0.04 + index / 10000 }));

const coreBoundary = inspectCoreCityBoundary();
if (coreBoundary.coupledRouteCount || coreBoundary.distinctCityModuleCount || coreBoundary.routes.some((route) => route.unresolved.length)) errors.push('core-route-closure-contains-city-or-unresolved-import');
if (policy.coreWebVitals.lcpMsMax !== 2500 || policy.coreWebVitals.inpMsMax !== 200 || policy.coreWebVitals.clsMax !== 0.1 || policy.coreWebVitals.minimumSamplesPerRouteProfile !== 20) errors.push('core-web-vital-policy-drift');
if (policy.coreEndurance.durationMinutesMin !== 120 || policy.coreEndurance.canonicalRouteCyclesMin !== 50) errors.push('core-endurance-policy-drift');

const vitals = createCoreWebVitalsReceipt({ releaseDigest: digest, profiles: [{ route: '/', browser: 'chrome', deviceProfile: 'desktop-mid', evidenceDigest: evidence, samples }] });
if (!vitals.measurementComplete || !vitals.withinBudgets || vitals.externallyCertified || vitals.automaticCertification) errors.push('cwv-evaluator-boundary-invalid');
const endurance = createCoreEnduranceReceipt({
  releaseDigest: digest,
  evidenceDigest: evidence,
  durationMinutes: 120,
  canonicalRouteCycles: 50,
  baselineHeapBytes: 100 * 1024 * 1024,
  finalHeapBytes: 108 * 1024 * 1024,
  baselineResources: { listeners: 20, timers: 4, observers: 3, workers: 1, sockets: 0, pendingRequests: 0 },
  finalResources: { listeners: 20, timers: 4, observers: 3, workers: 1, sockets: 0, pendingRequests: 0 }
});
if (!endurance.passed || endurance.externallyCertified || endurance.automaticCertification) errors.push('endurance-evaluator-boundary-invalid');
const ownerLab = createOwnerLabReceipt({ commit: git, tree: git, releaseDigest: digest, sourceReceiptDigest: evidence, explicitUserAction: true, vitalsReceipt: vitals, enduranceReceipt: endurance });
if (!ownerLab.ownerLabReadyForManualDecision || ownerLab.productionAuthorized || ownerLab.automaticDeployment || ownerLab.externalActionPerformed) errors.push('owner-lab-boundary-invalid');
const missingEvidence = createOwnerLabReceipt({ commit: git, tree: git, releaseDigest: digest, sourceReceiptDigest: evidence, explicitUserAction: true });
if (missingEvidence.ownerLabReadyForManualDecision || missingEvidence.evidenceComplete) errors.push('owner-lab-fail-closed-invalid');

for (const quality of ['low', 'balanced', 'high']) {
  if (!validateEonAppW715PerformancePlan(buildEonAppW715PerformancePlan({ quality })).ok) errors.push(`w715-plan-invalid:${quality}`);
}
for (const quality of ['lite', 'balanced', 'cinematic']) {
  if (!validateEonCityW757ReliabilityPlan(buildEonCityW757ReliabilityPlan({ quality })).ok) errors.push(`w757-plan-invalid:${quality}`);
}
const truth = getPerformanceResilienceTruth();
if (truth.coreInitialBundleMayContainCityImplementation || truth.browserMeasurementPerformedByThisModule || truth.performanceObserverStarted || truth.memoryReadPerformed || truth.storageWritten || truth.networkRequestCreated || truth.navigationCreated || truth.automaticCertification) errors.push('performance-resilience-truth-invalid');
const authoritySource = read('assets/js/performance/eon-performance-resilience-owner-lab.js');
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon|PerformanceObserver\s*\(|performance\.memory|localStorage\.|sessionStorage\.|indexedDB|location\.(?:assign|replace)|window\.open/.test(authoritySource)) errors.push('owner-lab-authority-has-side-effect');

const coreClosurePayload = coreBoundary.routes.map((route) => ({ id: route.id, entries: route.entries, moduleCount: route.moduleCount, cityModuleCount: route.cityModuleCount }));
const core = {
  schema: 'eonapp.a15.i25.performance-resilience-owner-lab-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I25',
  status: errors.length ? 'fail' : 'pass',
  coreRouteCount: coreBoundary.routeCount,
  coreRoutesReachingCityImplementation: coreBoundary.coupledRouteCount,
  distinctCityModulesInCoreClosure: coreBoundary.distinctCityModuleCount,
  coreClosureDigest: sha256(JSON.stringify(coreClosurePayload)),
  cwvThresholds: vitals.thresholds,
  deterministicCwvEvaluatorPassed: vitals.withinBudgets,
  deterministicEnduranceEvaluatorPassed: endurance.passed,
  ownerLabReceiptBindingPassed: ownerLab.exactCandidate && ownerLab.budgetsPass,
  sourcePerformancePlansPassed: true,
  builtArtifactCertified: false,
  authenticatedBrowserCertified: false,
  physicalDeviceCertified: false,
  productionAuthorized: false,
  automaticCertification: false,
  externalActionPerformed: false,
  policySha256: createHash('sha256').update(JSON.stringify(policy)).digest('hex'),
  errors
};
const receipt = { ...core, digest: createHash('sha256').update(JSON.stringify(core)).digest('hex') };
const output = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I25_PERFORMANCE_RESILIENCE_OWNER_LAB_GATE_RECEIPT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I25] ${receipt.status.toUpperCase()}: ${core.coreRouteCount} Core routes City-free; deterministic CWV/endurance/Owner Lab gates ${errors.length ? 'failed' : 'passed'}; browser evidence pending.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I25] ${error}`)); process.exitCode = 1; }

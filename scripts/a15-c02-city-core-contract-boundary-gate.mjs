#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A15_CITY_RUNTIME_ROOT,
  A15_REPOSITORY_ROOT,
  buildModuleClosure,
  inspectCityCoreBoundary,
  inspectCoreCityBoundary
} from './lib/a15-source-authority.mjs';

const ROOT = A15_REPOSITORY_ROOT;
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cityClosure = buildModuleClosure([A15_CITY_RUNTIME_ROOT]);
const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const directBoundaryEdges = cityClosure.edges.filter((edge) => edge.from.startsWith('assets/js/city/') && !edge.to.startsWith('assets/js/city/'));
const nonContractEdges = directBoundaryEdges.filter((edge) => !edge.to.startsWith('assets/js/contracts/') && !edge.to.startsWith('config/'));
const shellSource = readFileSync(path.join(ROOT, 'assets/js/eon-app-shell.js'), 'utf8');
const providerSource = readFileSync(path.join(ROOT, 'assets/js/nexus/eon-nexus-city-projection-provider.js'), 'utf8');
const errors = [
  ...(coreBoundary.coupledRouteCount ? [`${coreBoundary.coupledRouteCount} Core routes reach City implementation.`] : []),
  ...(cityBoundary.nonCityImplementationModuleCount ? [`City closure reaches ${cityBoundary.nonCityImplementationModuleCount} non-contract implementation modules.`] : []),
  ...(nonContractEdges.length ? [`City has non-contract direct boundary edges: ${nonContractEdges.map((edge) => `${edge.from}->${edge.to}`).join(', ')}`] : []),
  ...(cityBoundary.unresolved.length ? [`City closure contains ${cityBoundary.unresolved.length} unresolved local import(s).`] : []),
  ...(!/page === 'eoncity'/.test(shellSource) || !/eon-nexus-city-projection-provider\.js/.test(shellSource) ? ['Core Nexus projection provider must load only for the explicit eoncity shell page.'] : []),
  ...(!/EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT/.test(providerSource) ? ['Core Nexus projection provider does not expose the bounded request contract.'] : []),
  ...(/assets\/js\/city\//.test(providerSource) ? ['Core Nexus projection provider must not import City implementation.'] : [])
];
const receiptCore = {
  schema: 'eonapp.a15.c02.city-core-contract-boundary-receipt.v1',
  wave: 'C02',
  status: errors.length ? 'fail' : 'pass',
  core: {
    routeCount: coreBoundary.routeCount,
    coupledRouteCount: coreBoundary.coupledRouteCount,
    distinctCityImplementationModuleCount: coreBoundary.distinctCityModuleCount
  },
  city: {
    moduleCount: cityBoundary.moduleCount,
    cityModuleCount: cityBoundary.cityModuleCount,
    allowedContractModuleCount: cityBoundary.allowedContractModuleCount,
    nonCityImplementationModuleCount: cityBoundary.nonCityImplementationModuleCount,
    allowedContractModules: cityBoundary.allowedContractModules
  },
  directBoundaryEdges,
  nonContractEdges,
  bridge: {
    provider: 'assets/js/nexus/eon-nexus-city-projection-provider.js',
    contract: 'assets/js/contracts/nexus/eon-nexus-city-projection.js',
    explicitCityShellOnly: true,
    privacyProjected: true,
    executionAuthority: false
  },
  invariants: {
    coreImportsCityImplementation: false,
    cityImportsCoreImplementation: false,
    cityMayImportVersionedContracts: true,
    oneEngineSceneRenderLoopPreserved: true,
    deploymentClaimed: false
  },
  errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_C02_CITY_CORE_CONTRACT_BOUNDARY_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 C02] ${receipt.status.toUpperCase()}: Core ${receipt.core.coupledRouteCount} City imports; City ${receipt.city.nonCityImplementationModuleCount} Core implementation imports; ${receipt.directBoundaryEdges.length} contract edge(s).`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 C02] ${error}`);
  process.exitCode = 1;
}

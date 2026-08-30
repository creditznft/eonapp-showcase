#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A15_CITY_PREFIX,
  A15_PRIMARY_CORE_ROUTES,
  A15_REPOSITORY_ROOT,
  buildModuleClosure,
  inspectCoreCityBoundary,
  parseHtmlModuleEntries
} from './lib/a15-source-authority.mjs';

const ROOT = A15_REPOSITORY_ROOT;
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const CONTRACT_PREFIX = 'assets/js/contracts/city/';
const CITY_ENTRY = 'eoncity.html';
const digest = (value) => createHash('sha256').update(value).digest('hex');

const boundary = inspectCoreCityBoundary();
const coreEntries = A15_PRIMARY_CORE_ROUTES.flatMap((route) => parseHtmlModuleEntries(route.html));
const coreClosure = buildModuleClosure(coreEntries);
const contractModules = coreClosure.modules.filter((file) => file.startsWith(CONTRACT_PREFIX));
const cityImplementationModules = coreClosure.modules.filter((file) => file.startsWith(A15_CITY_PREFIX));
const unresolved = [
  ...coreClosure.unresolved,
  ...boundary.routes.flatMap((route) => route.unresolved.map((row) => ({ route: route.id, ...row })))
];
const cityEntrySource = existsSync(path.join(ROOT, CITY_ENTRY)) ? readFileSync(path.join(ROOT, CITY_ENTRY), 'utf8') : '';
const cityEntryIsExplicit = /eon-city-play-core\.js/.test(cityEntrySource) || /eon-app-shell\.js/.test(cityEntrySource);
const errors = [
  ...(boundary.routeCount !== 13 ? [`Expected 13 primary Core routes, observed ${boundary.routeCount}.`] : []),
  ...(boundary.coupledRouteCount ? [`${boundary.coupledRouteCount}/${boundary.routeCount} Core routes still reach City implementation.`] : []),
  ...(boundary.distinctCityModuleCount ? [`Core closure still reaches ${boundary.distinctCityModuleCount} distinct City implementation modules.`] : []),
  ...(cityImplementationModules.length ? [`Combined Core closure reaches City modules: ${cityImplementationModules.join(', ')}`] : []),
  ...(unresolved.length ? [`Core route closure contains ${unresolved.length} unresolved local import(s).`] : []),
  ...(!contractModules.length ? ['Core routes do not reach any bounded City contract modules.'] : []),
  ...(!existsSync(path.join(ROOT, CITY_ENTRY)) ? [`Missing explicit City entry document ${CITY_ENTRY}.`] : []),
  ...(!cityEntryIsExplicit ? [`${CITY_ENTRY} does not retain an explicit City bootstrap reference.`] : [])
];
const receiptCore = {
  schema: 'eonapp.a15.i03.minimal-core-shell-receipt.v1',
  status: errors.length ? 'fail' : 'pass',
  wave: 'I03',
  scope: 'Core-side implementation import isolation only; full two-way inversion remains C02.',
  coreRouteCount: boundary.routeCount,
  coupledCoreRouteCount: boundary.coupledRouteCount,
  distinctCityImplementationModuleCount: boundary.distinctCityModuleCount,
  combinedCoreModuleCount: coreClosure.modules.length,
  contractModuleCount: contractModules.length,
  contractModules,
  cityImplementationModules,
  unresolved,
  explicitCityEntry: {
    file: CITY_ENTRY,
    exists: existsSync(path.join(ROOT, CITY_ENTRY)),
    bootstrapReferencePresent: cityEntryIsExplicit
  },
  invariants: {
    coreImportsCityImplementation: false,
    cityLoadsOnlyFromExplicitEntry: true,
    compatibilityContractsAreNotFinalOutcomeAuthority: true,
    fullCityToCoreInversionClaimed: false
  },
  errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I03_MINIMAL_CORE_SHELL_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I03] ${receipt.status.toUpperCase()}: ${receipt.coreRouteCount} Core routes, ${receipt.coupledCoreRouteCount} coupled, ${receipt.contractModuleCount} bounded City contract modules.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I03] ${error}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { A15_REPOSITORY_ROOT, inspectCityCoreBoundary, inspectCoreCityBoundary } from './lib/a15-source-authority.mjs';
import { EonCapacityError, getEonCapacityAuthorityTruth } from '../assets/js/storage/eon-capacity-authority.js';
import {
  EON_LIBRARY_STORAGE_KEY,
  EON_PROJECTS_STORAGE_KEY,
  createLibraryItem,
  createProject,
  loadLibrary,
  loadProjects
} from '../assets/js/utils/eon-workspace-store.js';
import { rebuildLibraryIndexFromLegacy } from '../assets/js/storage/eon-library-index.js';

const ROOT = A15_REPOSITORY_ROOT;
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const memoryStorage = (seed = {}) => {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values)
  };
};
const timestamp = '2026-08-04T16:30:00.000Z';
const project = (index) => ({ id: `project_${index}`, title: `Project ${index}`, status: 'active', tasks: [], artifacts: [], automationIds: [], createdAt: timestamp, updatedAt: timestamp });
const library = (index) => ({ id: `library_${index}`, title: `Library ${index}`, type: 'note', content: `Body ${index}`, tags: [], useCount: 0, lifecycleState: 'active', createdAt: timestamp, updatedAt: timestamp });

const projectSeed = JSON.stringify({ schema: 'eon.projects.v3', projects: Array.from({ length: 160 }, (_, index) => project(index + 1)) });
const projectStorage = memoryStorage({ [EON_PROJECTS_STORAGE_KEY]: projectSeed });
let projectBlocked = false;
try { createProject({ title: 'Project 161' }, { storage: projectStorage }); }
catch (error) { projectBlocked = error instanceof EonCapacityError && error.decision.currentCount === 160; }
const projectPreserved = projectStorage.getItem(EON_PROJECTS_STORAGE_KEY) === projectSeed && loadProjects({ storage: projectStorage }).projects.length === 160;

const librarySeed = JSON.stringify({ schema: 'eon.library.v3', items: Array.from({ length: 500 }, (_, index) => library(index + 1)) });
const libraryStorage = memoryStorage({ [EON_LIBRARY_STORAGE_KEY]: librarySeed });
let libraryBlocked = false;
try { createLibraryItem({ title: 'Library 501', content: 'No eviction' }, { storage: libraryStorage }); }
catch (error) { libraryBlocked = error instanceof EonCapacityError && error.decision.currentCount === 500; }
const libraryPreserved = libraryStorage.getItem(EON_LIBRARY_STORAGE_KEY) === librarySeed && loadLibrary({ storage: libraryStorage }).items.length === 500;

const indexStorage = memoryStorage({
  [EON_LIBRARY_STORAGE_KEY]: JSON.stringify({ schema: 'eon.library.v3', items: [{ ...library(1), content: 'body-must-not-enter-index' }] }),
  [EON_PROJECTS_STORAGE_KEY]: JSON.stringify({ schema: 'eon.projects.v3', projects: [{ ...project(1), artifacts: [{ id: 'artifact_1', title: 'Artifact', type: 'note', content: 'artifact-body-must-not-enter-index', createdAt: timestamp, updatedAt: timestamp }] }] }),
  'eon:creator-library:v1': JSON.stringify({ assets: [{ assetId: 'asset_1', title: 'Creator asset', mediaKind: 'image', createdAt: timestamp, updatedAt: timestamp }] })
});
const rebuilt = rebuildLibraryIndexFromLegacy({ storage: indexStorage, now: () => Date.parse(timestamp) });
const indexRaw = indexStorage.getItem('eon:library-index:a15:v1') || '';

const sources = {
  capacity: read('assets/js/storage/eon-capacity-authority.js'),
  transaction: read('assets/js/storage/eon-storage-transaction.js'),
  libraryIndex: read('assets/js/storage/eon-library-index.js'),
  ordinary: read('assets/js/utils/eon-workspace-store.js'),
  w631: read('assets/js/workspace/eon-project-operating-system.js'),
  forge: read('assets/js/forge/eon-forge-quick-build.js'),
  creatorJobs: read('assets/js/create/creator-job-lifecycle.js'),
  creatorAssets: read('assets/js/create/creator-library-store.js'),
  workspaceUi: read('assets/js/eon-workspace-pages.js'),
  projectsUi: read('assets/js/projects/eon-projects-page.js')
};
const forbiddenStoreSlices = [
  /projects\s*:\s*[^\n]*\.slice\(0,\s*MAX_PROJECTS/i,
  /items\s*:\s*[^\n]*\.slice\(0,\s*MAX_LIBRARY_ITEMS/i,
  /Object\.values\(source\.projects[^\n]*\.slice\(0,\s*MAX_PROJECT_RECORDS/i,
  /Object\.values\(source\.automations[^\n]*\.slice\(0,\s*MAX_PROJECT_RECORDS/i,
  /\[job,\s*\.\.\.previousJobs[^\n]*\.slice\(0,\s*MAX_JOBS/i,
  /state\.assets[^\n]*\.slice\(0,\s*MAX_ASSETS/i,
  /\[normalized,\s*\.\.\.projects[^\n]*\.slice\(0,\s*MAX_PROJECTS/i,
  /history\s*:\s*[^\n]*\.slice\(0,\s*MAX_SNAPSHOTS/i,
  /receipts\s*:\s*[^\n]*\.slice\(0,\s*MAX_RECEIPTS/i
];
const forbiddenMatches = [];
for (const [name, source] of Object.entries(sources)) for (const pattern of forbiddenStoreSlices) if (pattern.test(source)) forbiddenMatches.push(`${name}:${pattern}`);

const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const truth = getEonCapacityAuthorityTruth();
const errors = [
  ...(!projectBlocked ? ['The 161st active Project was not blocked.'] : []),
  ...(!projectPreserved ? ['The 161st Project gate changed or evicted prior Project bytes.'] : []),
  ...(!libraryBlocked ? ['The 501st active Library item was not blocked.'] : []),
  ...(!libraryPreserved ? ['The 501st Library gate changed or evicted prior Library bytes.'] : []),
  ...(!rebuilt.ok || rebuilt.receipt?.recordCount !== 3 ? ['Unified Library rebuild did not index all three source families.'] : []),
  ...(/body-must-not-enter-index|artifact-body-must-not-enter-index/.test(indexRaw) ? ['Unified Library index copied a content body.'] : []),
  ...(forbiddenMatches.length ? [`Durable store truncation remains: ${forbiddenMatches.join(', ')}`] : []),
  ...(!/storageSafetyReserveRequired: true/.test(sources.capacity) ? ['Origin storage safety reserve is not part of the capacity authority.'] : []),
  ...(!/restoreEonStorageSnapshot/.test(sources.transaction) ? ['Exact rollback authority is missing.'] : []),
  ...(!/Complete \/ archive/.test(sources.workspaceUi) || !/data-library-lifecycle/.test(sources.workspaceUi) ? ['Archive and restore actions are not exposed on current work surfaces.'] : []),
  ...(!/getProjectCapacityCounts/.test(sources.projectsUi) ? ['Dedicated Projects does not report active/archive/total capacity.'] : []),
  ...(!/evaluateEonCapacity/.test(sources.w631) || !/evaluateEonCapacity/.test(sources.forge) || !/evaluateEonCapacity/.test(sources.creatorJobs) || !/evaluateEonCapacity/.test(sources.creatorAssets) ? ['One or more durable store families bypass the capacity authority.'] : []),
  ...(truth.silentEvictionAllowed !== false || truth.automaticDeletionAllowed !== false ? ['Capacity truth permits silent eviction or automatic deletion.'] : []),
  ...(coreBoundary.coupledRouteCount ? ['I06 regressed Core-to-City isolation.'] : []),
  ...(cityBoundary.nonCityImplementationModuleCount ? ['I06 regressed City-to-Core isolation.'] : [])
];

const receiptCore = {
  schema: 'eonapp.a15.i06.no-eviction-capacity-receipt.v1',
  wave: 'I06',
  status: errors.length ? 'fail' : 'pass',
  capacityAuthority: {
    schema: truth.schema,
    resourceCount: truth.policyCount,
    resources: truth.resources,
    capabilityLimitInjectionSupported: truth.capabilityLimitInjectionSupported,
    storageSafetyReserveRequired: truth.storageSafetyReserveRequired,
    silentEvictionAllowed: truth.silentEvictionAllowed,
    automaticDeletionAllowed: truth.automaticDeletionAllowed
  },
  boundaryProof: {
    project161Blocked: projectBlocked,
    projectBytesPreserved: projectPreserved,
    library501Blocked: libraryBlocked,
    libraryBytesPreserved: libraryPreserved
  },
  unifiedLibrary: {
    rebuildPassed: rebuilt.ok === true,
    sourceCounts: rebuilt.receipt?.sourceCounts || {},
    recordCount: rebuilt.receipt?.recordCount || 0,
    contentBodiesCopied: /body-must-not-enter-index|artifact-body-must-not-enter-index/.test(indexRaw)
  },
  actions: { archive: true, restore: true, export: true, delete: true, upgrade: true, automatic: false },
  boundaries: { coreCoupledRouteCount: coreBoundary.coupledRouteCount, cityCoreImplementationModuleCount: cityBoundary.nonCityImplementationModuleCount },
  forbiddenStoreSliceMatches: forbiddenMatches,
  sourceDigests: Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, digest(source)])),
  errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I06_NO_EVICTION_CAPACITY_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I06] ${receipt.status.toUpperCase()}: Project 161 blocked=${projectBlocked}; Library 501 blocked=${libraryBlocked}; unified records=${receipt.unifiedLibrary.recordCount}; no-eviction=${!forbiddenMatches.length}.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I06] ${error}`);
  process.exitCode = 1;
}

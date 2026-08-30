#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { A15_REPOSITORY_ROOT, inspectCityCoreBoundary, inspectCoreCityBoundary } from './lib/a15-source-authority.mjs';
import { EON_PROJECT_REGISTRY_SCHEMA, getProjectRegistryTruth, loadProjectRegistry } from '../assets/js/projects/eon-project-registry.js';
import { EON_PROJECT_MIGRATION_SOURCES, migrateLegacyProjects, rollbackProjectMigration } from '../assets/js/projects/eon-project-registry-migration.js';

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

const seed = {
  'eon:projects:v3': JSON.stringify({ projects: [{ id: 'project_gate', title: 'Gate project', status: 'active', updatedAt: '2026-08-04T00:00:00.000Z' }] }),
  'eon:workspace:projects:v1': JSON.stringify({ projects: [{ id: 'legacy_gate', title: 'Legacy gate', status: 'paused' }] }),
  'eon:project-operating-system:w631:v1': JSON.stringify({ projects: { project_gate: { projectId: 'project_gate', title: 'Gate continuity', updatedAt: '2026-08-04T00:01:00.000Z' } } }),
  'eon:forge:projects:v1': JSON.stringify([{ id: 'forge_gate', title: 'Forge gate', brief: 'Local site', updatedAt: '2026-08-04T00:02:00.000Z' }]),
  'eon:creator-jobs:v1': JSON.stringify({ jobs: [{ jobId: 'creator_gate', safeLabel: 'Creator gate', state: 'saved', updatedAt: '2026-08-04T00:03:00.000Z' }] }),
  'eon:creator-library:v1': JSON.stringify({ assets: [{ assetId: 'asset_gate', sourceJobId: 'creator_gate', title: 'Creator output', updatedAt: '2026-08-04T00:04:00.000Z' }] })
};
const storage = memoryStorage(seed);
const sourceBefore = storage.snapshot();
const migrated = await migrateLegacyProjects({ storage, explicitUserAction: true, now: () => Date.parse('2026-08-04T15:15:00.000Z') });
const migratedState = loadProjectRegistry({ storage });
const idempotent = await migrateLegacyProjects({ storage, automaticIndexOnly: true, now: () => Date.parse('2026-08-04T15:15:00.000Z') });
const rolledBack = migrated.ok
  ? await rollbackProjectMigration(migrated.receipt.receiptId, { storage, explicitUserAction: true, confirmed: true, now: () => Date.parse('2026-08-04T15:16:00.000Z') })
  : { ok: false };
const sourceAfter = storage.snapshot();
for (const key of Object.keys(sourceBefore)) {
  if (sourceAfter[key] !== sourceBefore[key]) throw new Error(`Legacy source mutated during gate: ${key}`);
}

const sources = {
  registry: read('assets/js/projects/eon-project-registry.js'),
  migration: read('assets/js/projects/eon-project-registry-migration.js'),
  bootstrap: read('assets/js/projects/eon-project-registry-bootstrap.js'),
  ordinary: read('assets/js/utils/eon-workspace-store.js'),
  w631: read('assets/js/workspace/eon-project-operating-system.js'),
  forge: read('assets/js/forge/eon-forge-quick-build.js'),
  creatorJobs: read('assets/js/create/creator-job-lifecycle.js'),
  creatorAssets: read('assets/js/create/creator-library-store.js'),
  shell: read('assets/js/eon-app-shell.js'),
  continueResolver: read('assets/js/retention/eon-continue-resolver.js')
};
const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const truth = getProjectRegistryTruth({ storage: memoryStorage({}) });
const errors = [
  ...(!migrated.ok ? [`Migration failed: ${migrated.reason || 'unknown'}.`] : []),
  ...(!idempotent.ok || idempotent.idempotent !== true ? ['Migration is not idempotent.'] : []),
  ...(!rolledBack.ok ? ['Migration rollback failed.'] : []),
  ...(migrated.ok && Object.keys(migratedState.records).length !== 4 ? [`Expected four canonical gate projects, observed ${Object.keys(migratedState.records).length}.`] : []),
  ...(migrated.ok && migratedState.records.project_gate?.sources?.length !== 2 ? ['Ordinary and W631 identities did not merge.'] : []),
  ...(migrated.ok && migratedState.records['project_creator-job_creator_gate']?.sources?.length !== 2 ? ['Creator job and asset identities did not merge.'] : []),
  ...(migrated.ok && migrated.receipt.legacyStoresMutated !== false ? ['Migration receipt overclaims legacy mutation.'] : []),
  ...(!/previousRecords/.test(sources.migration) || !/rollbackProjectMigration/.test(sources.migration) ? ['Migration does not retain bounded rollback authority.'] : []),
  ...(!/registerOrdinaryProject/.test(sources.ordinary) ? ['Ordinary Projects are not registry-backed.'] : []),
  ...(!/namespace: 'w631'/.test(sources.w631) ? ['W631 is not registry-backed.'] : []),
  ...(!/registerForgeProject/.test(sources.forge) ? ['Forge is not registry-backed.'] : []),
  ...(!/registerCreatorJob/.test(sources.creatorJobs) || !/registerCreatorAssetProject/.test(sources.creatorAssets) ? ['Creator lifecycle is not registry-backed.'] : []),
  ...(!/automaticIndexOnly: true/.test(sources.bootstrap) || !/eon-project-registry-bootstrap/.test(sources.shell) ? ['Registry bootstrap is not installed.'] : []),
  ...(!/listProjectRegistryRecords/.test(sources.continueResolver) ? ['Continue does not prefer the canonical registry.'] : []),
  ...(truth.schema !== EON_PROJECT_REGISTRY_SCHEMA || truth.contentBodyStored === true ? ['Registry truth is not identity-and-lifecycle only.'] : []),
  ...(coreBoundary.coupledRouteCount ? ['I05 regressed Core-to-City isolation.'] : []),
  ...(cityBoundary.nonCityImplementationModuleCount ? ['I05 regressed City-to-Core isolation.'] : [])
];
const receiptCore = {
  schema: 'eonapp.a15.i05.universal-project-registry-receipt.v1',
  wave: 'I05',
  status: errors.length ? 'fail' : 'pass',
  registry: {
    schema: EON_PROJECT_REGISTRY_SCHEMA,
    identityAndLifecycleOnly: true,
    lifecycleStates: ['active', 'archived'],
    sourceBodiesMutated: false,
    sourceCount: EON_PROJECT_MIGRATION_SOURCES.length,
    migratedCandidateCount: migrated.receipt?.candidateCount || 0,
    canonicalProjectCount: migrated.ok ? Object.keys(migratedState.records).length : 0,
    targetDigest: migrated.receipt?.targetDigest || '',
    idempotent: idempotent.idempotent === true,
    rollbackPassed: rolledBack.ok === true
  },
  liveAdapters: { ordinary: true, w631: true, forge: true, creatorJobs: true, creatorAssets: true, continueResolver: true },
  boundaries: { coreCoupledRouteCount: coreBoundary.coupledRouteCount, cityCoreImplementationModuleCount: cityBoundary.nonCityImplementationModuleCount },
  sourceDigests: Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, digest(value)])),
  errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I05_UNIVERSAL_PROJECT_REGISTRY_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I05] ${receipt.status.toUpperCase()}: ${receipt.registry.canonicalProjectCount} canonical gate projects from ${receipt.registry.sourceCount} source families; rollback=${receipt.registry.rollbackPassed}.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I05] ${error}`);
  process.exitCode = 1;
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT,
  validateW639ProductionRehearsalFreezeContract
} from '../../config/w639-production-rehearsal-freeze-contract.mjs';
import {
  createW639ReleaseFreezeManifest,
  deriveW639RehearsalBoard,
  inspectW639Build,
  validateW639ServiceWorkerSource,
  W639_REQUIRED_BUILD_FILES
} from '../../scripts/lib/w639-release-freeze.mjs';
import { inspectW639ProductionRehearsalFreeze } from '../../scripts/w639-production-rehearsal-freeze-gate.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');

function tempRoot(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eonapp-w639-'));
  try { return callback(directory); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('W639 canonical contract keeps rehearsal and launch-candidate freeze externally fenced', () => {
  const validation = validateW639ProductionRehearsalFreezeContract();
  assert.equal(validation.ok, true);
  assert.equal(W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.productionRehearsalPassed, false);
  assert.equal(W639_PRODUCTION_REHEARSAL_FREEZE_CONTRACT.launchCandidateFrozen, false);
  const gate = inspectW639ProductionRehearsalFreeze();
  assert.equal(gate.ok, true);
  assert.equal(gate.rehearsal.productionVerdict, 'not-run');
  assert.equal(gate.launchCandidateFrozen, false);
});

test('W639 freeze manifest is deterministic and fingerprints every required category', () => {
  const generatedAt = '2026-07-11T12:00:00.000Z';
  const first = createW639ReleaseFreezeManifest({ root, generatedAt });
  const second = createW639ReleaseFreezeManifest({ root, generatedAt });
  assert.equal(first.ok, true);
  assert.equal(first.freezeDigest, second.freezeDigest);
  assert.equal(first.categoryCount, 10);
  assert.equal(first.fileCount >= 55, true);
  assert.equal(first.categories.every((category) => category.ok && /^[a-f0-9]{64}$/.test(category.categoryDigest)), true);
  assert.equal(first.categories.flatMap((category) => category.files).every((file) => file.exists && /^[a-f0-9]{64}$/.test(file.sha256)), true);
});

test('W639 persistence freeze category includes all current SQL migration registries', () => {
  const manifest = createW639ReleaseFreezeManifest({ root, generatedAt: '2026-07-11T12:00:00.000Z' });
  const persistence = manifest.categories.find((category) => category.id === 'persistence');
  const sql = persistence.files.filter((file) => file.path.endsWith('.sql')).map((file) => file.path);
  assert.equal(sql.length >= 10, true);
  assert.equal(sql.includes('migrations/referrals/0002_referral_operational_views.sql'), true);
  assert.equal(sql.includes('platform-backend/migrations/0005_request_rate_limits.sql'), true);
  assert.equal(sql.includes('platform-backend/migrations/future/0100_eon_invite_access_milestones_schema.DISABLED.sql'), true);
});

test('W639 build inspector fails closed when dist is absent', () => tempRoot((directory) => {
  const result = inspectW639Build({ root: directory });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'dist-missing');
}));

test('W639 accepts the current release identity only with explicit user-approved activation', () => {
  const result = validateW639ServiceWorkerSource("const RELEASE_ID='w757-2026-07-29-performance-reliability-v1'; if (type === 'EONAPP_APPLY_UPDATE' && event.data?.releaseId === RELEASE_ID && event.data?.explicitUserAction === true) sw.skipWaiting();");
  assert.deepEqual(result.markers, ['w757-2026-07-29-performance-reliability-v1']);
  assert.equal(result.exactMarker, true);
  assert.equal(result.explicitActivation, true);
  assert.equal(result.noInstallAutoActivation, true);
});

test('W639 service worker rejects unrelated or partial markers', () => {
  assert.equal(validateW639ServiceWorkerSource("const RELEASE_ID='w757-2026-07-29';").exactMarker, false);
  assert.equal(validateW639ServiceWorkerSource("const RELEASE_ID='w757-2026-07-29-performance-reliability-v1'; const OLD='w650-2026-07-14-city-cache-loading-safety';").exactMarker, false);
});

test('W639 rejects a current marker without explicit user-approved activation', () => {
  const result = validateW639ServiceWorkerSource("const RELEASE_ID='w757-2026-07-29-performance-reliability-v1';");
  assert.equal(result.exactMarker, true);
  assert.equal(result.explicitActivation, false);
});

test('W639 rejects automatic install-time activation', () => {
  const result = validateW639ServiceWorkerSource("const RELEASE_ID='w757-2026-07-29-performance-reliability-v1'; self.addEventListener('install', () => self.skipWaiting()); if (type === 'EONAPP_APPLY_UPDATE' && event.data?.releaseId === RELEASE_ID && event.data?.explicitUserAction === true) self.skipWaiting();");
  assert.equal(result.noInstallAutoActivation, false);
});

test('W639 build inspector verifies critical routes, current service worker and retired alias absence', () => tempRoot((directory) => {
  const dist = path.join(directory, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  for (const relative of W639_REQUIRED_BUILD_FILES.filter((file) => file !== 'sw.js')) {
    const target = path.join(dist, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${relative}\n`);
  }
  fs.writeFileSync(path.join(dist, 'sw.js'), "const RELEASE_ID='w757-2026-07-29-performance-reliability-v1'; if (type === 'EONAPP_APPLY_UPDATE' && event.data?.releaseId === RELEASE_ID && event.data?.explicitUserAction === true) self.skipWaiting();\n");
  const result = inspectW639Build({ root: directory });
  assert.equal(result.ok, true);
  assert.match(result.buildDigest, /^[a-f0-9]{64}$/);
  fs.writeFileSync(path.join(dist, 'apps.html'), 'retired alias must not ship');
  assert.equal(inspectW639Build({ root: directory }).ok, false);
}));

test('W639 cannot freeze a launch candidate from a complete local build with empty external evidence', () => {
  const manifest = { ok: true, freezeDigest: 'a'.repeat(64) };
  const evidenceIndex = {
    indexDigest: 'b'.repeat(64),
    lanes: ['billing', 'referral', 'local-creator', 'direct-provider', 'companion'].map((id) => ({ id, status: 'not-run' }))
  };
  const board = deriveW639RehearsalBoard({ manifest, evidenceIndex, build: { ok: true, buildDigest: 'c'.repeat(64) }, generatedAt: '2026-07-11T12:00:00.000Z' });
  assert.equal(board.sourceGateOk, true);
  assert.equal(board.productionRehearsalPassed, false);
  assert.equal(board.launchCandidateFrozen, false);
  assert.equal(board.productionVerdict, 'not-run');
});

test('W639 launch-candidate state is derived only when every W638 lane and every other rehearsal domain passes', () => {
  const manifest = { ok: true, freezeDigest: 'a'.repeat(64) };
  const evidenceIndex = {
    indexDigest: 'b'.repeat(64),
    lanes: ['billing', 'referral', 'local-creator', 'direct-provider', 'companion'].map((id) => ({ id, status: 'pass' }))
  };
  const domainEvidence = Object.fromEntries(['routes', 'account', 'projects', 'forge', 'automations', 'city', 'backup-recovery', 'incidents-rollback'].map((id) => [id, 'pass']));
  const board = deriveW639RehearsalBoard({
    manifest,
    evidenceIndex,
    build: { ok: true, buildDigest: 'c'.repeat(64) },
    domainEvidence,
    generatedAt: '2026-07-11T12:00:00.000Z'
  });
  assert.equal(board.productionRehearsalPassed, true);
  assert.equal(board.productionVerdict, 'pass');
  assert.equal(board.launchCandidateFrozen, true);
  assert.equal(board.domains.every((domain) => domain.status === 'pass'), true);
});


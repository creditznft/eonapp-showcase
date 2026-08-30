import assert from 'node:assert/strict';
import test from 'node:test';
import { W452_CANONICAL_PUBLIC_ROUTES, validateW452AppShellQualityContract } from '../../config/w452-app-shell-quality-contract.mjs';
import { inspectW452AppShellQuality } from '../../scripts/w452-app-shell-quality-gate.mjs';

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W452 keeps root Chat canonical, removes active legacy Chat links, and preserves transparent live billing copy', () => {
  assert.deepEqual(validateW452AppShellQualityContract(), []);
  assert.equal(W452_CANONICAL_PUBLIC_ROUTES.chat, '/');
  const report = inspectW452AppShellQuality();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.documentLegacyHrefHits.length, 0);
  assert.equal(report.activeModuleLegacyNavigationHits.length, 0);
});

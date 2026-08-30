#!/usr/bin/env node
/** W479-M6 source gate: creator asset handoff stays export-first until future connector approval. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W479M_CREATOR_DISTRIBUTION_SCHEMA,
  W479M_PLATFORM_HANDOFFS,
  W479M_REQUIRED_ADAPTER_PROOFS,
  getW479MCreatorDistributionTruth,
  validateW479MCreatorDistributionContract
} from '../config/w479m-creator-distribution-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectW479MCreatorDistributionContract({ root = ROOT, writeArtifact = true } = {}) {
  const errors = [...validateW479MCreatorDistributionContract()];
  const requiredFiles = [
    'config/w479m-creator-distribution-contract.mjs',
    'assets/js/creator/creator-distribution-handoff.js',
    'scripts/w479m-creator-distribution-contract-gate.mjs',
    'tests/unit/w479m-creator-distribution-contract.test.mjs',
    'docs/W479M_CREATOR_MEDIA_DISTRIBUTION_BRIDGE_2026-07-02.md'
  ];
  for (const relative of requiredFiles) if (!fs.existsSync(path.join(root, relative))) errors.push(`W479-M6 required file is missing: ${relative}`);
  const source = fs.readFileSync(path.join(root, 'assets/js/creator/creator-distribution-handoff.js'), 'utf8');
  for (const marker of ['mediaBodyIncluded: false', 'manualExportRequired: true', 'perPostReviewRequired: true', 'directPublishingCreated: false', 'remotePostCreated: false', 'noSilentCloudFallback: true']) {
    if (!source.includes(marker)) errors.push(`W479-M6 handoff source is missing ${marker}.`);
  }
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket|schedulePost|uploadPlatformContent|startPlatformOAuth/.test(source)) {
    errors.push('W479-M6 handoff source must not perform upload, OAuth, scheduling or remote publishing.');
  }
  const truth = getW479MCreatorDistributionTruth();
  if (truth.directPublishingLive || truth.accountConnectionLive || truth.backgroundUploadLive || truth.schedulingLive || truth.mediaGenerationLive) {
    errors.push('W479-M6 truth must not claim live generation or social publishing.');
  }
  const report = Object.freeze({
    schema: `${W479M_CREATOR_DISTRIBUTION_SCHEMA}.gate-report`,
    sourceStatus: errors.length ? 'fail' : 'pass',
    platformCount: W479M_PLATFORM_HANDOFFS.length,
    requiredAdapterProofCount: W479M_REQUIRED_ADAPTER_PROOFS.length,
    releaseStatus: 'planned-bridge-no-media-or-social-activation',
    truth,
    errors: Object.freeze(errors)
  });
  if (writeArtifact) {
    const outDir = path.join(root, 'artifacts', 'w479m-creator-distribution-contract-gate');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW479MCreatorDistributionContract({ writeArtifact: true });
  if (report.sourceStatus !== 'pass') {
    process.stderr.write(`${report.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`W479-M6 creator distribution bridge source gate passed (${report.platformCount} manual/export-first platform handoffs).\n`);
  }
}

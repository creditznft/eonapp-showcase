#!/usr/bin/env node
/** Verify the downloaded W641 candidate without rebuilding it. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCandidateFileRows,
  buildCandidatePayloadDigest,
  validateCandidateProvenance
} from './lib/w641-release-governance.mjs';
import { validateW641PredeployReceiptIdentity } from './lib/w641-predeploy-receipt-identity.mjs';
import { W641_CANDIDATE_MANIFEST_SCHEMA } from '../config/w641-release-governance-contract.mjs';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateRoot = path.resolve(root, process.argv[2] || 'artifacts/w641-release-candidate');
const expected = String(process.argv[3] || process.env.EON_EXPECTED_CANDIDATE_DIGEST || '');
const certifiedPreview = String(process.env.CERTIFIED_PREVIEW_DIGEST || '');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(candidateRoot, relative), 'utf8'));
const provenance = readJson('candidate-provenance.json');
const manifest = readJson('candidate-manifest.json');
const predeployReceipt = readJson('predeploy-receipt.json');
const validation = validateCandidateProvenance(provenance);
const predeployValidation = validateW641PredeployReceiptIdentity(predeployReceipt);
const rows = buildCandidateFileRows(path.join(candidateRoot, 'dist'), { excludeReleaseMetadata: true });
const graph = spawnSync(process.execPath, [path.join(root, 'scripts', 'w759-production-asset-graph-integrity-gate.mjs'), path.join(candidateRoot, 'dist')], { encoding: 'utf8' });
const digest = buildCandidatePayloadDigest(rows);
const issues = [...validation.issues, ...predeployValidation.issues];
if (manifest.schema !== W641_CANDIDATE_MANIFEST_SCHEMA) issues.push('candidate-manifest-schema-invalid');
if (manifest.candidateDigest !== provenance.candidateDigest) issues.push('manifest-candidate-digest-mismatch');
if (manifest.distPayloadDigest !== digest || provenance.distPayloadDigest !== digest) issues.push('dist-payload-digest-mismatch');
if (manifest.fileCount !== rows.length || provenance.fileCount !== rows.length) issues.push('dist-file-count-mismatch');
if (JSON.stringify(manifest.files) !== JSON.stringify(rows)) issues.push('dist-file-manifest-mismatch');
if (predeployValidation.digest !== provenance.predeployReceiptDigest) issues.push('predeploy-receipt-digest-mismatch');
if (predeployReceipt?.sourceFingerprint?.digest !== provenance.sourceFingerprint) issues.push('predeploy-source-fingerprint-mismatch');
if (expected && expected !== provenance.candidateDigest) issues.push('expected-candidate-digest-mismatch');
if (certifiedPreview && !/^[a-f0-9]{64}$/i.test(certifiedPreview)) issues.push('certified-preview-candidate-digest-invalid');
if (certifiedPreview && certifiedPreview !== provenance.candidateDigest) issues.push('certified-preview-candidate-digest-mismatch');
if (graph.status !== 0) issues.push('dist-asset-graph-integrity-failed');
const result = {
  ok: issues.length === 0,
  candidateRoot,
  candidateDigest: provenance.candidateDigest,
  distPayloadDigest: digest,
  predeployReceiptDigest: predeployValidation.digest,
  fileCount: rows.length,
  certifiedPreviewDigestBound: Boolean(certifiedPreview),
  issues
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

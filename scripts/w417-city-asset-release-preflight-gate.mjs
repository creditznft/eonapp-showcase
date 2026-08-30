#!/usr/bin/env node
/** W417/W611 source gate: local engineering assets may load, final art release remains fail-closed. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_ASSET_CATALOG, getCityAssetCatalogSummary } from '../assets/js/city/eon-city-asset-catalog.js';
import { getCityAssetReleasePreflightSummary, getCityAssetReleaseTruth, validateCityAssetReleaseManifest } from '../assets/js/city/eon-city-asset-release-preflight.js';
import { W417_CITY_ASSET_RELEASE_CONTRACT, validateW417CityAssetReleaseContract } from '../config/w417-city-asset-release-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW417CityAssetReleasePreflight() {
  const contract = W417_CITY_ASSET_RELEASE_CONTRACT;
  const source = read('assets/js/city/eon-city-asset-release-preflight.js');
  const nodePreflight = read('scripts/city-asset-release-preflight.mjs');
  const docs = read('docs/W417_CITY_ASSET_RELEASE_PREFLIGHT_2026-06-28.md');
  const catalog = getCityAssetCatalogSummary();
  const summary = getCityAssetReleasePreflightSummary();
  const emptyValidation = validateCityAssetReleaseManifest({});
  const truth = getCityAssetReleaseTruth();
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW417CityAssetReleaseContract().length === 0, 'W417 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'catalog, preflight, gate, test and docs exist');
  check('catalog-has-local-candidates-only', catalog.shippedBinaryCount >= 8 && CITY_ASSET_CATALOG.filter((entry) => entry.status === 'shipped').every((entry) => entry.sourcePath?.startsWith('/assets/city/') && entry.provenance?.evidencePath?.startsWith('docs/')), 'current source records only local, evidenced engineering candidate binaries');
  check('summary-is-explicitly-blocked', summary.ready === false && /Local engineering-candidate City binaries/i.test(summary.currentState) && summary.catalog.approved === 0 && summary.catalog.shipped >= 8, 'release summary cannot imply that visual art is ready');
  check('manifest-fails-closed', emptyValidation.ok === false && emptyValidation.errors.length >= 3, 'missing manifest evidence fails closed');
  check('local-integrity-script-present', /createHash\('sha256'\)/.test(nodePreflight) && /source hash mismatch/.test(nodePreflight) && /No City asset may receive final visual-release approval/.test(nodePreflight), 'Node companion checks local file hashes and blocks final release on any error');
  check('strict-data-boundaries', truth.binaryLoadEnabled === true && truth.engineeringCandidateLoadEnabled === true && truth.finalVisualCertification === false && truth.finalVisualReleaseApproved === false && truth.remoteNetwork === false && truth.userData === false && /KTX2\/Basis Universal/.test(source) && /lod0/.test(source) && /humanArtReview/.test(source), 'preflight allows only engineering candidate loading while final visual approval remains false');
  check('docs-require-art-and-device-proof', /W611 current-state note/i.test(docs) && /provenance/i.test(docs) && /SHA-256/i.test(docs) && /real-device/i.test(docs) && /not final art/i.test(docs), 'docs retain evidence requirements and final-art limitation');
  return Object.freeze({ schema: 'eonapp.w417.city-asset-release-preflight-gate.v2', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['W417 validates final visual-release procedure. Current local engineering candidate assets are not final visual certification, licence clearance, device proof or owner approval.']) });
}

export function runW417CityAssetReleasePreflightGate({ writeArtifact = true } = {}) {
  const report = inspectW417CityAssetReleasePreflight();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w417-city-asset-release-preflight-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW417CityAssetReleasePreflightGate();
  process.stdout.write(`W417 City asset release preflight gate passed (${report.checkCount}/${report.checkCount}).\n`);
}

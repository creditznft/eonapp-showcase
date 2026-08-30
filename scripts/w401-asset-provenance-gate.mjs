#!/usr/bin/env node
/** W401 source gate: creator asset rights/provenance is local, explicit, and non-legal. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W401_ASSET_PROVENANCE_CONTRACT, validateW401AssetProvenanceContract } from '../config/w401-asset-provenance-contract.mjs';
import { CREATOR_ASSET_SOURCE_TYPES, getCreatorAssetProvenanceTruth } from '../assets/js/creator/asset-provenance.js';
import { getCreatorAssetProvenanceSessionTruth } from '../assets/js/creator/asset-provenance-workspace.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW401AssetProvenance() {
  const registry = read('assets/js/creator/asset-provenance.js');
  const surface = read('assets/js/creator/asset-provenance-workspace.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getCreatorAssetProvenanceTruth();
  const session = getCreatorAssetProvenanceSessionTruth();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${registry}\n${surface}`);

  check('contract-valid', validateW401AssetProvenanceContract().length === 0, 'W401 contract has no internal violations');
  check('source-types', JSON.stringify(CREATOR_ASSET_SOURCE_TYPES.map((entry) => entry.id)) === JSON.stringify(W401_ASSET_PROVENANCE_CONTRACT.sourceTypes), 'source labels include owned, licensed, public-domain, generated, permission, and unknown');
  check('workspace-only', /renderCreatorAssetProvenanceWorkspace/.test(workspace) && /bindCreatorAssetProvenanceWorkspace/.test(workspace), 'rights desk is integrated in Workspace');
  check('page-memory-only', truth.storage === 'current-page-memory-only' && session.currentPageMemory === true && session.localStorage === false, 'receipts remain in page memory until explicit export');
  check('no-upload-or-lookup', noTransport && truth.upload === false && truth.remoteLookup === false && session.upload === false, 'rights desk does not upload assets or contact a remote lookup service');
  check('no-fair-use-or-approval-claim', truth.fairUseClaim === false && truth.publicationApproval === false && /generic “fair use” label/.test(registry), 'rights desk does not claim fair use or approve publishing');
  check('secret-protection', /SECRET_LIKE/.test(registry) && /Do not paste keys/.test(surface), 'receipt fields reject obvious secret-looking values');
  check('export-explicit', session.exportRequiresUserAction === true && /data-creator-asset-export/.test(surface), 'receipt export requires an explicit user action');
  return Object.freeze({ schema: 'eonapp.w401.asset-provenance-gate.v1', wave: 'W401', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Creator-reported local context only.', 'No automatic rights verification, legal advice, licensing proof, provider terms verification, media upload, or publishing approval is enabled.']) });
}

export function runW401AssetProvenanceGate({ writeArtifact = true } = {}) {
  const result = inspectW401AssetProvenance();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w401-asset-provenance-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW401AssetProvenanceGate();
  process.stdout.write(`W401 asset provenance gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

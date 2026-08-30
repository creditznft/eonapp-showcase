#!/usr/bin/env node
/** W393A — verify the lean handover without fabricating omitted historic evidence. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W393A_EXCLUDED_HISTORIC_EVIDENCE,
  W393A_LEAN_HANDOVER_SCHEMA,
  W393A_REQUIRED_ABSENT_ACTIVE_PATHS,
  W393A_REQUIRED_ROOT_ASSETS,
  getW393ALeanHandoverStatus
} from '../config/w393a-lean-handover-integrity-contract.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const toPosix = (value) => value.replaceAll('\\', '/');

export function auditW393ALeanHandoverIntegrity({ root = ROOT } = {}) {
  const errors = [];
  const warnings = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const missingRootAssets = [];
  const assetMirrorMismatches = [];

  for (const relative of W393A_REQUIRED_ROOT_ASSETS) {
    const rootFile = path.join(root, relative);
    const publicFile = path.join(root, 'public', relative);
    if (!fs.existsSync(rootFile)) {
      missingRootAssets.push(relative);
      continue;
    }
    if (fs.existsSync(publicFile) && sha256(rootFile) !== sha256(publicFile)) {
      assetMirrorMismatches.push(relative);
    }
  }
  assert(missingRootAssets.length === 0, `missing root deploy assets: ${missingRootAssets.join(', ')}`);
  assert(assetMirrorMismatches.length === 0, `root/public deploy asset mirror mismatch: ${assetMirrorMismatches.join(', ')}`);

  const restoredActivePaths = W393A_REQUIRED_ABSENT_ACTIVE_PATHS
    .filter((relative) => fs.existsSync(path.join(root, relative)));
  assert(restoredActivePaths.length === 0, `retired active path restored: ${restoredActivePaths.join(', ')}`);

  const archivedEvidencePresent = W393A_EXCLUDED_HISTORIC_EVIDENCE
    .filter((entry) => fs.existsSync(path.join(root, entry.path)))
    .map((entry) => entry.path);
  if (archivedEvidencePresent.length) {
    warnings.push(`Historic archive evidence is present locally and may be verified by its dedicated historical gate: ${archivedEvidencePresent.join(', ')}`);
  } else {
    warnings.push('Historic archive hash evidence is intentionally not packaged in this lean continuation handover; this gate certifies current-source boundaries only.');
  }

  const imports = auditActiveSurfaceImports({ root });
  assert(imports.ok, `active import fence failed: ${[
    ...imports.legacyPrefixHits,
    ...imports.legacyValueHits,
    ...imports.forbiddenLiteralHits,
    ...imports.evmAddressLiteralHits
  ].join(', ')}`);

  return {
    schema: W393A_LEAN_HANDOVER_SCHEMA,
    generatedAt: new Date().toISOString(),
    ok: errors.length === 0,
    status: getW393ALeanHandoverStatus(),
    rootAssets: {
      required: [...W393A_REQUIRED_ROOT_ASSETS],
      missing: missingRootAssets,
      mirrorMismatches: assetMirrorMismatches
    },
    historicEvidence: {
      excluded: W393A_EXCLUDED_HISTORIC_EVIDENCE,
      presentLocally: archivedEvidencePresent,
      verified: false,
      note: 'This lean package does not certify omitted historic archive hashes.'
    },
    currentSourceBoundary: {
      requiredAbsentPaths: [...W393A_REQUIRED_ABSENT_ACTIVE_PATHS],
      restoredActivePaths,
      routeEntryCount: imports.routeEntryCount,
      moduleCount: imports.moduleCount,
      legacyPrefixHits: imports.legacyPrefixHits,
      legacyValueHits: imports.legacyValueHits,
      forbiddenLiteralHits: imports.forbiddenLiteralHits,
      evmAddressLiteralHits: imports.evmAddressLiteralHits
    },
    warnings,
    errors
  };
}

function main() {
  const report = auditW393ALeanHandoverIntegrity({ root: ROOT });
  const evidencePath = writeW517EphemeralJson('legacy-gates/w393a-lean-handover-integrity-report.json', report, { root: ROOT });
  if (!report.ok) {
    console.error('[W393A] Lean handover integrity failed:');
    for (const error of report.errors) console.error(` - ${error}`);
    return 1;
  }
  console.log(`[W393A] PASS: ${report.currentSourceBoundary.moduleCount} reachable modules; ${report.rootAssets.required.length} root deploy assets mirrored; historic evidence=${report.historicEvidence.presentLocally.length ? 'present-but-not-verified-by-this-gate' : 'not-packaged'}. Local receipt: ${evidencePath}`);
  for (const warning of report.warnings) console.warn(`[W393A] note: ${warning}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();

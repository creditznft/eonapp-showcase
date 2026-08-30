#!/usr/bin/env node
/** W476-B source gate: validates the proof runner and documentation without any network request. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW476BProductionProofContract } from '../config/w476-b-production-proof-contract.mjs';
import { W476_API_SURFACE_CONTRACT } from '../config/w476-api-surface-contract.mjs';
import { buildW476BDryRunPlan } from './w476-b-production-proof.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = Object.freeze([
  'config/w476-b-production-proof-contract.mjs',
  'scripts/w476-b-production-proof.mjs',
  'docs/W476_B_PRODUCTION_BROWSER_PROOF_PROTOCOL_2026-07-02.md',
  'docs/EONAPP_MASTER_WAVE_PLAN_W476_W480_2026-07-02.md',
  'EVIDENCE/W476_B/README.md'
]);

export function inspectW476BProductionProofSource({ writeArtifact = true } = {}) {
  const issues = [...validateW476BProductionProofContract()];
  for (const relative of requiredFiles) if (!existsSync(path.join(root, relative))) issues.push(`missing:${relative}`);
  const plan = buildW476BDryRunPlan();
  if (plan.status !== 'dry-run-no-network') issues.push('dry-run-not-network-safe');
  if (plan.productionReleaseApproved !== false || plan.paymentActivationApproved !== false || plan.dodoActivationApproved !== false || plan.localImageVideoAdapterClaimed !== false) {
    issues.push('release-or-commercial-boundary-invalid');
  }
  if (plan.functionRouteCount !== W476_API_SURFACE_CONTRACT.surfaces.length) issues.push('function-route-count-invalid');
  if (plan.manualEvidence.length < 9) issues.push('manual-evidence-incomplete');
  const result = Object.freeze({
    schema: 'eonapp.w476.b.source-gate.v1',
    wave: 'W476-B',
    ok: issues.length === 0,
    sourceOnly: true,
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    localImageVideoAdapterClaimed: false,
    functionRouteCount: plan.functionRouteCount,
    manualEvidenceCount: plan.manualEvidence.length,
    releaseBlockedBy: Object.freeze([
      'reviewed-cloudflare-preview-or-production-deployment',
      'browser-csp-delivery-and-authorised-redaction-review',
      'local-text-runtime-cors-pna-proof',
      'api-conditional-negative-matrix-review',
      'analytics-privacy-bridge-proof',
      'update-rollback-data-survival-proof',
      'desktop-android-ios-evidence',
      'owner-evidence-review'
    ]),
    issues: Object.freeze(issues)
  });
  if (writeArtifact) {
    const evidenceDirectory = path.join(root, 'EVIDENCE', 'W476_B');
    mkdirSync(evidenceDirectory, { recursive: true });
    writeFileSync(path.join(evidenceDirectory, 'SOURCE_PROOF_GATE.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const result = inspectW476BProductionProofSource();
  if (!result.ok) {
    process.stderr.write(`W476-B source gate failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`W476-B source gate passed (${result.functionRouteCount} Functions, ${result.manualEvidenceCount} manual evidence rows). Production remains blocked pending external proof.\n`);
}

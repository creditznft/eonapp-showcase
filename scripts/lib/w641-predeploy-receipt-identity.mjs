import { stableDigest } from './w641-release-governance.mjs';

const RECEIPT_SCHEMA = 'eonapp.codex-predeploy-receipt.w646.2026-07-11.v1';
const HEX64 = /^[a-f0-9]{64}$/;

const freeze = (value) => Object.freeze(value);

export function buildW641PredeployReceiptIdentity(receipt = {}) {
  const steps = Array.isArray(receipt.steps) ? receipt.steps : [];
  return freeze({
    schema: receipt.schema,
    wave: receipt.wave,
    ok: receipt.ok === true,
    sourceFingerprint: freeze({
      algorithm: receipt?.sourceFingerprint?.algorithm,
      digest: receipt?.sourceFingerprint?.digest,
      fileCount: receipt?.sourceFingerprint?.fileCount
    }),
    stepCount: receipt.stepCount,
    steps: freeze(steps.map((step) => freeze({
      script: step?.script,
      args: freeze(Array.isArray(step?.args) ? [...step.args] : []),
      status: step?.status
    })))
  });
}

export function validateW641PredeployReceiptIdentity(receipt = {}) {
  const identity = buildW641PredeployReceiptIdentity(receipt);
  const issues = [];
  if (identity.schema !== RECEIPT_SCHEMA) issues.push('predeploy-receipt-schema-invalid');
  if (identity.wave !== 'W646') issues.push('predeploy-receipt-wave-invalid');
  if (identity.ok !== true) issues.push('predeploy-receipt-not-pass');
  if (identity.sourceFingerprint.algorithm !== 'sha256') issues.push('predeploy-source-fingerprint-algorithm-invalid');
  if (!HEX64.test(String(identity.sourceFingerprint.digest || ''))) issues.push('predeploy-source-fingerprint-digest-invalid');
  if (!Number.isInteger(identity.sourceFingerprint.fileCount) || identity.sourceFingerprint.fileCount < 1) issues.push('predeploy-source-fingerprint-file-count-invalid');
  if (!Number.isInteger(identity.stepCount) || identity.stepCount < 82) issues.push('predeploy-step-count-invalid');
  if (identity.steps.length !== identity.stepCount) issues.push('predeploy-step-count-mismatch');
  for (const [index, step] of identity.steps.entries()) {
    if (typeof step.script !== 'string' || step.script.length < 1) issues.push(`predeploy-step-script-invalid:${index}`);
    if (!Array.isArray(step.args) || step.args.some((arg) => typeof arg !== 'string')) issues.push(`predeploy-step-args-invalid:${index}`);
    if (step.status !== 0) issues.push(`predeploy-step-not-pass:${index}`);
  }
  const digest = stableDigest(identity);
  return freeze({ ok: issues.length === 0, issues: freeze(issues), identity, digest });
}

export function buildW641PredeployReceiptDigest(receipt = {}) {
  const validation = validateW641PredeployReceiptIdentity(receipt);
  if (!validation.ok) throw new Error(`Predeploy receipt identity failed: ${validation.issues.join(', ')}`);
  return validation.digest;
}

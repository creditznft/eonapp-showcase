/** W272-A0 — source-only CSP/network/supply-chain readiness contract. */
export const W272_SECURITY_SUPPLYCHAIN_SCHEMA = 'eonapp.w272.csp-network-supplychain-source-readiness.v1';

export const W272_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'edge-header-capture', status: 'pending-independent-review', owner: 'release owner', evidence: 'Preview and live header capture for canonical, Telegram and retired routes.' }),
  Object.freeze({ id: 'csp-report-review', status: 'pending-independent-review', owner: 'security reviewer', evidence: 'Redacted CSP report review after normal browsing and BYOK provider verification.' }),
  Object.freeze({ id: 'network-allowlist-review', status: 'pending-owner-decision', owner: 'provider owner', evidence: 'Observed endpoint inventory and explicit decision on narrowing broad https/wss allowances.' }),
  Object.freeze({ id: 'supply-chain-review', status: 'pending-independent-review', owner: 'security reviewer', evidence: 'Fresh lockfile audit, SBOM review and dependency remediation decision.' }),
  Object.freeze({ id: 'sourcemap-release-check', status: 'pending-release-owner', owner: 'release owner', evidence: 'Preview/live confirmation that production sourcemaps are absent or access-controlled.' })
]);

export function validateW272SecuritySupplyChainBoard(board = {}) {
  const errors = [];
  if (board.schema !== W272_SECURITY_SUPPLYCHAIN_SCHEMA) errors.push('W272 board schema must match.');
  if (board.decision !== 'SOURCE_CONTROLS_PASS_EXTERNAL_EDGE_AND_AUDIT_PENDING') errors.push('W272 must remain source-controls-pass with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W272 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W272_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W272 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W272 board must retain a proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}

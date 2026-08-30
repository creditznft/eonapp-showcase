/** W289/W290 external evidence board: beta and final certification remain blocked until independent records exist. */
export const W289_W290_EXTERNAL_EVIDENCE_BOARD_SCHEMA = 'eonapp.w289-w290.external-evidence-board.v1';
export const W289_W290_EXTERNAL_EVIDENCE_BOARD = Object.freeze({
  schema: W289_W290_EXTERNAL_EVIDENCE_BOARD_SCHEMA,
  status: 'EXTERNAL_EVIDENCE_REQUIRED_BETA_BLOCKED',
  beta: Object.freeze({ enabled: false, sourceOnlyApproval: false }),
  required: Object.freeze(['W282-lighthouse', 'W259-W266-device-visual-accessibility', 'W276-observed-restore', 'W283-readonly-cloudflare-d1-and-preview-plan', 'W268-named-owners-and-drills', 'W278-qualified-legal-review', 'W279-independent-security-review']),
  conditional: Object.freeze(['W258-chain-evidence-before-W261-W262', 'W284-formal-activation-decision-before-referral-beta']),
  cloudflare: Object.freeze({ executionMode: 'READ_ONLY_EVIDENCE', mutate: false, inspectRows: false, deploy: false, rollback: false }),
  finalCertification: Object.freeze({ enabled: false, independentEvidenceRequired: true })
});
export function validateW289W290ExternalEvidenceBoard(candidate = W289_W290_EXTERNAL_EVIDENCE_BOARD) {
  const errors = [];
  if (candidate?.schema !== W289_W290_EXTERNAL_EVIDENCE_BOARD_SCHEMA) errors.push('W289/W290 board schema drifted.');
  if (candidate?.status !== 'EXTERNAL_EVIDENCE_REQUIRED_BETA_BLOCKED') errors.push('W289/W290 must remain beta-blocked pending external evidence.');
  if (candidate?.beta?.enabled || candidate?.beta?.sourceOnlyApproval || candidate?.finalCertification?.enabled) errors.push('Source-only work cannot enable beta or final certification.');
  if (!candidate?.finalCertification?.independentEvidenceRequired) errors.push('Final recertification must require independent evidence.');
  if (candidate?.cloudflare?.executionMode !== 'READ_ONLY_EVIDENCE' || candidate?.cloudflare?.mutate || candidate?.cloudflare?.inspectRows || candidate?.cloudflare?.deploy || candidate?.cloudflare?.rollback) errors.push('Cloudflare/D1 evidence must remain read-only with no row inspection, deploy, rollback, or mutation.');
  if (!Array.isArray(candidate?.required) || candidate.required.length < 7) errors.push('W289/W290 required evidence list is incomplete.');
  return Object.freeze({ ok: errors.length === 0, errors });
}

const freeze = (value) => Object.freeze(value);

export const W486_EVIDENCE_FRESHNESS_SCHEMA = 'eonapp.w486.evidence-freshness.v1';

export const W486_STALE_HISTORICAL_ARTIFACTS = freeze([
  freeze({
    path: 'artifacts/W235_ACCESS_MILESTONES_DISABLED_GATE_2026-06-25.json',
    disposition: 'historical-stale-noncontrolling',
    portableRetention: 'ledger-only-when-historic-binary-is-not-in-the-clean-source-handover',
    replacement: 'MERGE_PROVENANCE/VALIDATION_RECEIPT.json',
    currentExecutableProof: 'tests/unit/w235-access-milestones-disabled.test.mjs'
  }),
  freeze({
    path: 'artifacts/W238_LEGACY_CONSOLIDATION_REPORT_2026-06-25.json',
    disposition: 'historical-stale-noncontrolling',
    portableRetention: 'ledger-only-when-historic-binary-is-not-in-the-clean-source-handover',
    replacement: 'MERGE_PROVENANCE/VALIDATION_RECEIPT.json',
    currentExecutableProof: 'tests/unit/w238-legacy-consolidation.test.mjs'
  })
]);

export const W486_EVIDENCE_FRESHNESS_CONTRACT = freeze({
  schema: W486_EVIDENCE_FRESHNESS_SCHEMA,
  wave: 'W486',
  authorityOrder: freeze([
    'current-executable-test-and-gate-output',
    'current-build-release-validation-receipt',
    'deployed-commit-linked-browser-device-evidence',
    'historical-artifact-for-context-only'
  ]),
  currentReceipt: 'MERGE_PROVENANCE/VALIDATION_RECEIPT.json',
  historicArtifacts: W486_STALE_HISTORICAL_ARTIFACTS,
  truth: freeze({
    staleArtifactCanApproveRelease: false,
    staleArtifactCanBlockCurrentSourceWithoutReproduction: false,
    sourceGateCanApproveProduction: false,
    liveCityCertification: 'FIX REQUIRED',
    physicalDeviceProof: 'NOT PROVEN',
    activationStatus: 'BLOCKED_UNTIL_SEPARATE_PROOF_AND_OWNER_GO'
  })
});

export function validateW486EvidenceFreshnessContract(contract = W486_EVIDENCE_FRESHNESS_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === W486_EVIDENCE_FRESHNESS_SCHEMA, 'W486 schema must remain canonical.');
  ensure(contract.authorityOrder[0] === 'current-executable-test-and-gate-output', 'Current executable evidence must be authoritative.');
  ensure(contract.authorityOrder.at(-1) === 'historical-artifact-for-context-only', 'Historic artifacts must remain non-controlling.');
  ensure(contract.currentReceipt === 'MERGE_PROVENANCE/VALIDATION_RECEIPT.json', 'W486 must name the fresh W485 validation receipt.');
  ensure(contract.historicArtifacts.length === 2, 'W486 must track the two known stale historical artifacts.');
  for (const artifact of contract.historicArtifacts) {
    ensure(artifact.disposition === 'historical-stale-noncontrolling', `W486 stale disposition invalid: ${artifact.path}`);
    ensure(artifact.portableRetention === 'ledger-only-when-historic-binary-is-not-in-the-clean-source-handover', `W486 portable retention policy invalid: ${artifact.path}`);
    ensure(artifact.replacement === contract.currentReceipt, `W486 stale artifact replacement invalid: ${artifact.path}`);
    ensure(/^tests\/unit\/w23[58]-/.test(artifact.currentExecutableProof), `W486 executable proof invalid: ${artifact.path}`);
  }
  ensure(contract.truth.staleArtifactCanApproveRelease === false, 'Historic artifact cannot approve release.');
  ensure(contract.truth.staleArtifactCanBlockCurrentSourceWithoutReproduction === false, 'Historic artifact cannot block current source without reproduction.');
  ensure(contract.truth.sourceGateCanApproveProduction === false, 'Source-only gates cannot approve production.');
  ensure(contract.truth.liveCityCertification === 'FIX REQUIRED', 'W486 must preserve the current live City status.');
  ensure(contract.truth.physicalDeviceProof === 'NOT PROVEN', 'W486 must preserve physical-device evidence gap.');
  return errors;
}

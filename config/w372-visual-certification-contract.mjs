/** W372 — EON City visual-certification readiness contract. */
export const W372_VISUAL_CERTIFICATION_CONTRACT = Object.freeze({
  wave: 'W372',
  schema: 'eonapp.w372.visual-certification-contract.v1',
  requiredCaseIds: Object.freeze([
    'portal-first-impression', 'city-lite-map', 'immersive-desktop-input', 'immersive-mobile-touch', 'spatial-command-space', 'eonbot-work-loop', 'soundscape-consent', 'realm-visual-backup', 'performance-device-matrix', 'route-graph-production'
  ]),
  truthRules: Object.freeze({
    sourceOnly: true,
    automaticBrowserProof: false,
    automaticDeviceProof: false,
    automaticProductionProof: false,
    automaticCertification: false,
    launchApproval: false,
    independentReviewRequired: true
  })
});

export function validateW372VisualCertificationContract() {
  const errors = [];
  const rules = W372_VISUAL_CERTIFICATION_CONTRACT.truthRules;
  if (!rules.sourceOnly || rules.automaticBrowserProof || rules.automaticDeviceProof || rules.automaticProductionProof || rules.automaticCertification || rules.launchApproval || !rules.independentReviewRequired) errors.push('W372 must remain a readiness board, not fabricated visual certification.');
  if (W372_VISUAL_CERTIFICATION_CONTRACT.requiredCaseIds.length !== 10) errors.push('W372 requires ten independent visual/proof cases.');
  return errors;
}

/** W801A — bounded external certification gate projection. */
const freeze = Object.freeze;
export const EON_EXPANSE_W801A_EXTERNAL_CERTIFICATION_SCHEMA = 'eon.expanse.external-certification-gates.w801a.v1';

const safeText = (value = '') => String(value || '').trim().slice(0, 160);
const gate = (id, label, passed, reason = '') => freeze({ id, label, passed: passed === true, reason: passed === true ? '' : safeText(reason) });

export function projectEonExpanseW801AExternalCertification(input = null) {
  const source = input && typeof input === 'object' ? input : {};
  const dependencyInstall = gate(
    'locked-dependency-install',
    'Locked dependency install',
    source?.dependencyInstall?.passed === true,
    source?.dependencyInstall?.reason || 'locked dependency install not verified'
  );
  const productionBuild = gate(
    'production-build',
    'Production build',
    dependencyInstall.passed && source?.productionBuild?.passed === true,
    dependencyInstall.passed ? (source?.productionBuild?.reason || 'production build not verified') : 'blocked by locked dependency install'
  );
  const builtArtifact = gate(
    'built-artifact-gate',
    'Built artifact gate',
    productionBuild.passed && source?.builtArtifact?.passed === true,
    productionBuild.passed ? (source?.builtArtifact?.reason || 'built artifact gate not verified') : 'blocked by production build'
  );
  const authenticatedBrowsers = gate(
    'authenticated-browser-matrix',
    'Authenticated Chrome, Edge and mobile landscape',
    source?.authenticatedBrowsers?.passed === true,
    source?.authenticatedBrowsers?.reason || 'authenticated browser matrix not verified'
  );
  const foregroundPerformance = gate(
    'foreground-performance-and-soak',
    'Lite, Balanced and Cinematic foreground performance and soak',
    authenticatedBrowsers.passed && source?.foregroundPerformance?.passed === true,
    authenticatedBrowsers.passed ? (source?.foregroundPerformance?.reason || 'foreground performance evidence not verified') : 'blocked by authenticated browser evidence'
  );
  const ownerCertification = gate(
    'owner-playthrough-and-region-certification',
    'Owner playthrough and exact region certification',
    builtArtifact.passed && foregroundPerformance.passed && source?.ownerCertification?.passed === true,
    builtArtifact.passed && foregroundPerformance.passed ? (source?.ownerCertification?.reason || 'owner certification not verified') : 'blocked by build or foreground evidence'
  );
  const previewDeployment = gate(
    'preview-deployment-and-rollback',
    'Preview deployment and rollback rehearsal',
    ownerCertification.passed && source?.previewDeployment?.passed === true,
    ownerCertification.passed ? (source?.previewDeployment?.reason || 'Preview deployment not verified') : 'blocked by owner certification'
  );
  const productionDeployment = gate(
    'production-deployment-and-rollback-proof',
    'Explicit Production deployment and rollback proof',
    previewDeployment.passed && source?.productionDeployment?.passed === true,
    previewDeployment.passed ? (source?.productionDeployment?.reason || 'Production deployment not verified') : 'blocked by Preview certification'
  );
  const gates = freeze([
    dependencyInstall,
    productionBuild,
    builtArtifact,
    authenticatedBrowsers,
    foregroundPerformance,
    ownerCertification,
    previewDeployment,
    productionDeployment
  ]);
  const passedCount = gates.filter((entry) => entry.passed).length;
  const complete = passedCount === gates.length;
  return freeze({
    schema: EON_EXPANSE_W801A_EXTERNAL_CERTIFICATION_SCHEMA,
    gates,
    passedCount,
    requiredCount: gates.length,
    complete,
    status: complete ? 'external-certification-evidence-complete-awaiting-explicit-production-action' : 'external-certification-blocked',
    sourceProgrammeComplete: source?.sourceProgrammeComplete === true,
    automaticCertification: false,
    automaticDeployment: false,
    productionActivated: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W801A_EXTERNAL_CERTIFICATION_SCHEMA, projectEonExpanseW801AExternalCertification });

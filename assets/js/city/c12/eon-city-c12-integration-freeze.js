/** A15 C12 — final source-programme integration freeze and launch-decision authority. */
import { getEonCityWorkHandoffTruth } from '../../contracts/city/eon-city-work-handoff.js';
import { getEonCityProgressTruth } from '../../contracts/city/eon-city-progress-bridge.js';
import { getEonCityAccessDistributionTruth } from '../../contracts/city/eon-city-access-distribution-projection.js';
import { getEonCityDataSurvivalTruth } from '../c06/eon-city-c06-data-survival.js';
import { getEonCityC08CommandHubTruth } from '../c08/eon-city-c08-command-hub-convergence.js';
import { getEonCityC09SignalFrontierTruth } from '../c09/eon-city-c09-signal-frontier-summit.js';
import { getEonCityC10FrontierRegionTruth } from '../c10/eon-city-c10-frontier-region-governance.js';
import { createEonCityC11CertificationReceipt, validateEonCityC11CertificationReceipt } from '../c11/eon-city-c11-device-performance-certification.js';

export const EON_CITY_C12_INTEGRATION_FREEZE_SCHEMA = 'eon.city.integration-freeze.a15.c12.v1';
const freeze = (value) => Object.freeze(value);

export function buildEonCityC12IntegrationFreeze({ sourceAuthority = {} } = {}) {
  const handoff = getEonCityWorkHandoffTruth();
  const progress = getEonCityProgressTruth();
  const survival = getEonCityDataSurvivalTruth();
  const access = getEonCityAccessDistributionTruth();
  const hub = getEonCityC08CommandHubTruth();
  const frontier = getEonCityC09SignalFrontierTruth();
  const regions = getEonCityC10FrontierRegionTruth();
  const deviceReceipt = createEonCityC11CertificationReceipt([], { sourceAuthority });
  const device = validateEonCityC11CertificationReceipt(deviceReceipt);
  const categories = freeze([
    ['architecture-boundary', sourceAuthority.zeroTwoWayImplementationImports === true],
    ['canonical-work-handoffs', handoff.singleConsumeHandoff && handoff.singleConsumeReturnReceipt && !handoff.privateContentAllowed],
    ['verified-outcome-progression', progress.consumesOnlyPolicyApprovedCoreOutcomes && progress.explicitMissionClaimRequired && !progress.xpGranted],
    ['city-data-survival', survival.signalFrontierCovered && survival.myFrontierCovered && survival.stormSectorCovered && survival.atomicRestore],
    ['capabilities-sharing-capture', access.consumesCanonicalCapabilityServiceOnly && !access.automaticUpload && !access.automaticPublishing],
    ['command-hub-living-nexus', hub.sourceValid && hub.stationCount === 10 && hub.discoveryCount === 3 && hub.nexusPrivacyProjected],
    ['signal-frontier-source-summit', frontier.flagshipSourceProgrammeComplete && frontier.ownerCaseCount === 35],
    ['my-frontier-source', regions.myFrontierSourceReady],
    ['storm-package-governance', regions.stormSourceProgrammeComplete && regions.stormGatewayLocked],
    ['accessibility-device-matrix', device.ok && device.receipt.sourceReady && device.receipt.laneCount === 22],
    ['performance-resilience-source', sourceAuthority.performanceSourceReady === true],
    ['release-operations-source', sourceAuthority.releaseOperationsSourceReady === true]
  ].map(([id, sourceReady]) => freeze({ id, sourceReady: sourceReady === true, sourceScore: sourceReady === true ? 10 : 0, acceptanceScore: null, externalEvidenceRequired: true })));
  const sourceProgrammeComplete = categories.every((entry) => entry.sourceReady);
  return freeze({
    schema: EON_CITY_C12_INTEGRATION_FREEZE_SCHEMA,
    implementationWaveCount: 38,
    completedImplementationWaveCount: sourceProgrammeComplete ? 38 : 37,
    categories,
    sourceProgrammeComplete,
    sourceScore: sourceProgrammeComplete ? 10 : 0,
    acceptanceScore: null,
    targetAcceptanceScore: 9.5,
    minimumSubsystemAcceptanceScore: 9.0,
    externalCertificationGateCount: 10,
    externalCertificationComplete: false,
    codexHandoverReady: sourceProgrammeComplete,
    sourceFreezeEligible: sourceProgrammeComplete,
    launchDecision: 'NO-GO',
    productionReady: false,
    automaticCertification: false,
    automaticDeployment: false,
    privateContentStored: false
  });
}

export function validateEonCityC12IntegrationFreeze(state) {
  const errors = [];
  if (!state || state.schema !== EON_CITY_C12_INTEGRATION_FREEZE_SCHEMA) errors.push('schema-invalid');
  if (state?.implementationWaveCount !== 38 || state?.categories?.length !== 12) errors.push('programme-shape-invalid');
  if (!state?.sourceProgrammeComplete || state?.completedImplementationWaveCount !== 38 || state?.sourceScore !== 10) errors.push('source-programme-incomplete');
  if (state?.categories?.some((entry) => !entry.sourceReady || entry.sourceScore !== 10 || entry.acceptanceScore !== null)) errors.push('source-category-invalid');
  if (state?.acceptanceScore !== null || state?.externalCertificationComplete || state?.launchDecision !== 'NO-GO' || state?.productionReady) errors.push('external-certification-fabricated');
  if (!state?.codexHandoverReady || !state?.sourceFreezeEligible) errors.push('handover-not-ready');
  if (state?.automaticCertification || state?.automaticDeployment || state?.privateContentStored) errors.push('safety-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), state });
}

export default freeze({ buildEonCityC12IntegrationFreeze, validateEonCityC12IntegrationFreeze });

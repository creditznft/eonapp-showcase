/** A15 C10 — My Frontier continuity and Storm Sector release-governance authority. */
import { createEonExpanseW768AMyFrontierLayoutContract, validateEonExpanseW768AMyFrontierLayoutContract } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { createEonExpanseW768BMyFrontierState, validateEonExpanseW768BMyFrontierState } from '../w768/eon-expanse-w768b-my-frontier-state.js';
import { validateEonExpanseW792AStormSectorPackage } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { projectEonExpanseW801AExternalCertification } from '../w801/eon-expanse-w801a-external-certification-gates.js';
import { projectEonExpanseW802AOwnerPlaythrough } from '../w802/eon-expanse-w802a-owner-playthrough-matrix.js';

export const EON_CITY_C10_FRONTIER_REGION_GOVERNANCE_SCHEMA = 'eon.city.frontier-region-governance.a15.c10.v1';
const freeze = (value) => Object.freeze(value);

export function buildEonCityC10FrontierRegionGovernance({
  externalCertification = null,
  ownerPlaythroughEvidence = [],
  expectedBuildDigest = ''
} = {}) {
  const layout = createEonExpanseW768AMyFrontierLayoutContract();
  const layoutValidation = validateEonExpanseW768AMyFrontierLayoutContract(layout);
  const initialState = createEonExpanseW768BMyFrontierState();
  const stateValidation = validateEonExpanseW768BMyFrontierState(initialState.getState());
  const packageValidation = validateEonExpanseW792AStormSectorPackage();
  const external = projectEonExpanseW801AExternalCertification(externalCertification);
  const ownerMatrix = projectEonExpanseW802AOwnerPlaythrough(ownerPlaythroughEvidence, { expectedBuildDigest });
  const stormReleaseReady = packageValidation.ok && external.complete && ownerMatrix.complete;
  return freeze({
    schema: EON_CITY_C10_FRONTIER_REGION_GOVERNANCE_SCHEMA,
    myFrontier: freeze({
      sourceValid: layoutValidation.ok && stateValidation.ok,
      authoredPlotCount: layout.plots.length,
      residentSlotCount: layout.residentSlots.length,
      themePersistenceRequired: true,
      constructionPersistenceRequired: true,
      residentPersistenceRequired: true,
      reloadRecoveryRequired: true,
      rawCoordinatePlacementAllowed: false,
      publicLandCreated: false,
      tradablePropertyCreated: false
    }),
    stormSector: freeze({
      regionId: 'storm-sector',
      packageDigest: packageValidation.packageDigest,
      exactPackageValid: packageValidation.ok,
      sourceProgrammeComplete: true,
      externalGateCount: external.requiredCount,
      externalGatePassedCount: external.passedCount,
      ownerCaseCount: ownerMatrix.requiredCount,
      ownerCasePassedCount: ownerMatrix.passedCount,
      releaseReady: stormReleaseReady,
      gatewayVisible: stormReleaseReady,
      signalCampaignCompletionRequired: false,
      directPlayerEntryAfterCertifiedActivation: true,
      gatewayActivationAvailable: false,
      regionRendered: false,
      sourceCompleteIsCertified: false,
      automaticCertification: false,
      automaticActivation: false
    }),
    oneCanonicalScene: true,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    productionAuthorized: false,
    privateContentStored: false
  });
}

export function validateEonCityC10FrontierRegionGovernance(state = buildEonCityC10FrontierRegionGovernance()) {
  const errors = [];
  if (state.schema !== EON_CITY_C10_FRONTIER_REGION_GOVERNANCE_SCHEMA) errors.push('schema-invalid');
  if (!state.myFrontier.sourceValid || state.myFrontier.authoredPlotCount !== 7 || state.myFrontier.residentSlotCount !== 6) errors.push('my-frontier-source-invalid');
  if (state.myFrontier.rawCoordinatePlacementAllowed || state.myFrontier.publicLandCreated || state.myFrontier.tradablePropertyCreated) errors.push('my-frontier-boundary-invalid');
  if (!state.stormSector.exactPackageValid || !/^[a-f0-9]{64}$/.test(state.stormSector.packageDigest)) errors.push('storm-package-invalid');
  if (state.stormSector.externalGateCount !== 8 || state.stormSector.ownerCaseCount !== 35) errors.push('storm-evidence-matrix-invalid');
  if (state.stormSector.sourceCompleteIsCertified || state.stormSector.automaticCertification || state.stormSector.automaticActivation) errors.push('storm-certification-fabricated');
  if (state.stormSector.signalCampaignCompletionRequired !== false || state.stormSector.directPlayerEntryAfterCertifiedActivation !== true) errors.push('storm-player-progression-gate-invalid');
  if (!state.stormSector.releaseReady && (state.stormSector.gatewayVisible || state.stormSector.gatewayActivationAvailable || state.stormSector.regionRendered)) errors.push('storm-lock-failed');
  if (!state.oneCanonicalScene || state.ownsEngine || state.ownsScene || state.ownsRenderLoop || state.productionAuthorized || state.privateContentStored) errors.push('runtime-authority-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), state });
}

export function getEonCityC10FrontierRegionTruth() {
  const result = validateEonCityC10FrontierRegionGovernance();
  return freeze({
    schema: EON_CITY_C10_FRONTIER_REGION_GOVERNANCE_SCHEMA,
    sourceValid: result.ok,
    myFrontierSourceReady: result.state.myFrontier.sourceValid,
    stormPackageDigest: result.state.stormSector.packageDigest,
    stormSourceProgrammeComplete: true,
    stormExternallyCertified: false,
    stormGatewayLocked: true,
    productionReady: false,
    privateContentStored: false
  });
}

export default freeze({ buildEonCityC10FrontierRegionGovernance, validateEonCityC10FrontierRegionGovernance, getEonCityC10FrontierRegionTruth });

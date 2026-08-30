/**
 * R07 — player-facing Open World availability.
 *
 * Release certification and player progression are deliberately separate.
 * Storm Sector may be entered by any player only after an exact maintained
 * activation exists for the certified package/build. Signal Frontier campaign
 * completion is never used as a player-access prerequisite.
 */
import { sanitizeEonExpanseW793AActivation } from '../w793/eon-expanse-w793a-future-region-activation.js';

const freeze = Object.freeze;
export const EON_CITY_R07_OPEN_WORLD_AVAILABILITY_SCHEMA = 'eon.city.open-world-availability.r07.v1';

export function deriveEonCityR07OpenWorldAvailability({
  stormActivation = null,
  signalCampaignComplete = false,
  beaconOneStage = 0
} = {}) {
  const activation = sanitizeEonExpanseW793AActivation(stormActivation);
  const firstRestorationComplete = Number(beaconOneStage || 0) >= 3;
  return freeze({
    schema: EON_CITY_R07_OPEN_WORLD_AVAILABILITY_SCHEMA,
    signalFrontier: freeze({
      id: 'signal-frontier',
      available: true,
      recommendedFirst: true,
      reason: 'available'
    }),
    stormSector: freeze({
      id: 'storm-sector',
      available: Boolean(activation),
      reason: activation ? 'certified-activation-ready' : 'certified-activation-required',
      activationId: activation?.activationId || '',
      packageDigest: activation?.packageDigest || '',
      buildDigest: activation?.buildDigest || '',
      requiresSignalCampaignCompletion: false,
      signalCampaignComplete: signalCampaignComplete === true,
      directEntryAllowed: Boolean(activation),
      automaticActivation: false
    }),
    myFrontier: freeze({
      id: 'my-frontier',
      available: true,
      reason: firstRestorationComplete ? 'available-restoration-progress-detected' : 'available-starter-access',
      starterAccess: true,
      unlockMilestone: 'beacon-one-repaired',
      requiresFullSignalCampaignCompletion: false,
      requiresBeaconOneForEntry: false,
      progressionStillGatesAdvancedReceipts: true
    }),
    releaseCertificationBypassed: false,
    privateContentStored: false
  });
}

export default freeze({ EON_CITY_R07_OPEN_WORLD_AVAILABILITY_SCHEMA, deriveEonCityR07OpenWorldAvailability });

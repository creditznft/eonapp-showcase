/** W771E — truthful damaged/restoring/restored art state for each authored zone. */
import { EON_EXPANSE_W771A_ZONE_IDENTITIES } from './eon-expanse-w771a-five-zone-cinematic-art-contract.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W771E_RESTORATION_ART_SCHEMA = 'eon.expanse.zone-restoration-art-state.w771e.v1';

const stage = (value, restored) => restored ? 'restored' : value > 0 ? 'restoring' : 'damaged';

export function deriveEonExpanseW771ERestorationArtState(progress = {}) {
  const milestones = new Set((progress?.milestones || []).map(String));
  const values = freeze({
    'gateway-overlook': progress?.companionBonded || progress?.companionRecovered || milestones.has('companion-bonded') ? 1 : 0,
    'beacon-fields': Math.max(0, Math.min(1, Number(progress?.beaconOneStage || 0) / 3)),
    'archive-ruins': progress?.beaconTwoRepaired || milestones.has('beacon-two-repaired') ? 1 : Math.max(0, Math.min(0.8, Number(progress?.archiveRecordCount || 0) / 4)),
    'transit-scar': progress?.regionalTransitRestored || milestones.has('regional-transit-restored') ? 1 : Math.max(0, Math.min(0.8, Number(progress?.activatedRelayNodeIds?.length || progress?.activatedRelayNodes || 0) / 4)),
    'horizon-vault': progress?.campaignComplete || milestones.has('campaign:signal-restoration:complete') ? 1 : progress?.vaultRouteOpened ? 0.78 : progress?.regionalCoreSynchronized ? 0.52 : progress?.threeSignalsVerified ? 0.28 : 0
  });
  const zones = EON_EXPANSE_W771A_ZONE_IDENTITIES.map((identity) => {
    const restoration = Number(values[identity.zoneId] || 0);
    const restored = restoration >= 0.999;
    const artStage = stage(restoration, restored);
    return freeze({
      zoneId: identity.zoneId,
      artStage,
      restoration: Number(restoration.toFixed(3)),
      restorationPercent: Math.round(restoration * 100),
      circuitIntensity: Number((0.16 + restoration * 0.84).toFixed(3)),
      warmIntensity: Number((0.12 + restoration * 0.76).toFixed(3)),
      fogRelief: Number((restoration * 0.48).toFixed(3)),
      revealRestorationModules: restored,
      transformationLabel: restored ? identity.transformation.after : artStage === 'restoring' ? `Restoring ${identity.title}` : identity.transformation.before,
      milestone: identity.transformation.milestone,
      mutatesMissionState: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W771E_RESTORATION_ART_SCHEMA,
    zones: freeze(zones),
    restoredZoneCount: zones.filter((zone) => zone.artStage === 'restored').length,
    restoringZoneCount: zones.filter((zone) => zone.artStage === 'restoring').length,
    damagedZoneCount: zones.filter((zone) => zone.artStage === 'damaged').length,
    averageRestorationPercent: Math.round(zones.reduce((sum, zone) => sum + zone.restorationPercent, 0) / Math.max(1, zones.length)),
    receiptDerivedOnly: true,
    awardsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W771E_RESTORATION_ART_SCHEMA, deriveEonExpanseW771ERestorationArtState });

/** W773A — privacy-safe five-zone restoration board derived from canonical campaign progress. */
import { EON_EXPANSE_W771A_ZONE_IDENTITIES } from '../w771/eon-expanse-w771a-five-zone-cinematic-art-contract.js';
import { deriveEonExpanseW771ERestorationArtState } from '../w771/eon-expanse-w771e-zone-restoration-art-state.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W773A_ZONE_RESTORATION_BOARD_SCHEMA = 'eon.expanse.zone-restoration-board.w773a.v1';

const identityByZone = new Map(EON_EXPANSE_W771A_ZONE_IDENTITIES.map((identity) => [identity.zoneId, identity]));

export function deriveEonExpanseW773AZoneRestorationBoard(progress = {}) {
  const art = deriveEonExpanseW771ERestorationArtState(progress);
  const rows = art.zones.map((zone) => {
    const identity = identityByZone.get(zone.zoneId);
    return freeze({
      zoneId: zone.zoneId,
      label: String(identity?.title || zone.zoneId).trim(),
      artStage: zone.artStage,
      restorationPercent: zone.restorationPercent,
      statusLabel: zone.artStage === 'restored' ? 'Restored' : zone.artStage === 'restoring' ? 'Restoring' : 'Damaged',
      transformationLabel: zone.transformationLabel,
      milestone: zone.milestone,
      interactionRequired: false,
      grantsXp: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W773A_ZONE_RESTORATION_BOARD_SCHEMA,
    visible: rows.length > 0,
    rows: freeze(rows),
    restoredZoneCount: art.restoredZoneCount,
    restoringZoneCount: art.restoringZoneCount,
    damagedZoneCount: art.damagedZoneCount,
    averageRestorationPercent: art.averageRestorationPercent,
    receiptDerivedOnly: true,
    privateContentStored: false,
    mutatesMissionState: false
  });
}

export default freeze({ EON_EXPANSE_W773A_ZONE_RESTORATION_BOARD_SCHEMA, deriveEonExpanseW773AZoneRestorationBoard });

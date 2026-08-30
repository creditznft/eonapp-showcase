const freeze = (value) => Object.freeze(value);
const point = (x, y, z) => freeze({ x, y, z });

export const EON_EXPANSE_W766_REGION_CONTRACT_SCHEMA = 'eon.city.expanse.region-contract.w766.v1';

export const EON_EXPANSE_W766_ZONES = freeze([
  freeze({ id: 'gateway-overlook', label: 'Gateway Overlook', x: 0, z: 10, radius: 24, status: 'playable' }),
  freeze({ id: 'beacon-fields', label: 'Beacon Fields', x: -42, z: -32, radius: 28, status: 'playable' }),
  freeze({ id: 'archive-ruins', label: 'Archive Ruins', x: 42, z: -48, radius: 30, status: 'playable' }),
  freeze({ id: 'transit-scar', label: 'Transit Scar', x: -12, z: -88, radius: 32, status: 'playable' }),
  freeze({ id: 'horizon-vault', label: 'Horizon Vault', x: 18, z: -132, radius: 34, status: 'playable' })
]);

export const EON_EXPANSE_W766_ROUTE_WIDTH = 5.2;
export const EON_EXPANSE_W766_ROUTE_SEGMENTS = freeze(EON_EXPANSE_W766_ZONES.slice(0, -1).map((zone, index) => freeze({
  id: `signal-frontier-route-${index + 1}`,
  fromZoneId: zone.id,
  toZoneId: EON_EXPANSE_W766_ZONES[index + 1].id,
  width: EON_EXPANSE_W766_ROUTE_WIDTH
})));

export const EON_EXPANSE_W766_TRANSIT_NODES = freeze(EON_EXPANSE_W766_ZONES.map((zone, index) => freeze({
  id: zone.id,
  label: zone.label,
  x: zone.x,
  z: zone.z,
  unlockedByDefault: index === 0,
  unlockMilestone: index === 1 ? 'beacon-one-repaired'
    : index === 2 ? 'beacon-two-repaired'
      : index === 3 ? 'regional-transit-restored'
        : index === 4 ? 'horizon-transit-unlocked'
          : ''
})));

export const EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS = freeze([
  // Primary authored landmarks. These remain the visual hierarchy owners for each zone.
  freeze({ id: 'gateway-portal', zoneId: 'gateway-overlook', assetId: 'eoncity-ascension-portal', position: point(0, 0, 10), rotationY: Math.PI, targetHeight: 7.6, minimumQuality: 'lite', presentationRole: 'hero', proxyMeshNames: freeze(['w766a-return-gate']) }),
  freeze({ id: 'gateway-map-beacon', zoneId: 'gateway-overlook', assetId: 'eoncity-holo-map-beacon', position: point(-5.2, 0, 4.8), rotationY: Math.PI * 0.18, targetHeight: 3.4, minimumQuality: 'lite', presentationRole: 'functional-landmark', proxyMeshNames: freeze(['w766b-gateway-map-ring']) }),
  freeze({ id: 'beacon-fields-ai-tower', zoneId: 'beacon-fields', assetId: 'eoncity-ai-tower-core', position: point(-42, 0, -36), rotationY: Math.PI * 0.08, targetHeight: 12.5, minimumQuality: 'balanced', presentationRole: 'hero' }),
  freeze({ id: 'archive-navigator-arc', zoneId: 'archive-ruins', assetId: 'eoncity-navigator-arc', position: point(42, 0, -50), rotationY: Math.PI, targetHeight: 10.5, minimumQuality: 'balanced', presentationRole: 'hero' }),
  freeze({ id: 'transit-core-landmark', zoneId: 'transit-scar', assetId: 'eoncity-transit-core', position: point(-12, 0, -108), rotationY: Math.PI * 0.5, targetHeight: 5.6, minimumQuality: 'balanced', presentationRole: 'hero', proxyMeshNames: freeze(['w766b-transit-core']) }),
  freeze({ id: 'horizon-genesis-core', zoneId: 'horizon-vault', assetId: 'eoncity-genesis-core', position: point(18, 0, -132), rotationY: Math.PI, targetHeight: 11.8, minimumQuality: 'balanced', presentationRole: 'hero', proxyMeshNames: freeze(['w766b-vault-core']) }),

  // L95: authored secondary architecture. These are deliberately smaller than the
  // zone hero and replace the previous impression that giant primitive boxes were
  // the finished world. Every balanced zone now has a second authored silhouette.
  freeze({ id: 'gateway-orientation-annex', zoneId: 'gateway-overlook', assetId: 'eoncity-orientation-hall', position: point(8.4, 0, 17.2), rotationY: -Math.PI * 0.18, targetHeight: 5.8, minimumQuality: 'balanced', presentationRole: 'secondary-architecture' }),
  freeze({ id: 'beacon-field-district-marker', zoneId: 'beacon-fields', assetId: 'eoncity-district-info', position: point(-31.5, 0, -28.2), rotationY: -Math.PI * 0.2, targetHeight: 2.7, minimumQuality: 'balanced', presentationRole: 'secondary-architecture' }),
  freeze({ id: 'archive-memory-hologram', zoneId: 'archive-ruins', assetId: 'eoncity-district-hologram', position: point(51.2, 0, -42.5), rotationY: Math.PI * 0.72, targetHeight: 3.5, minimumQuality: 'balanced', presentationRole: 'secondary-architecture' }),
  freeze({ id: 'transit-industrial-entrance', zoneId: 'transit-scar', assetId: 'eoncity-trade-dome-entrance', position: point(-1.8, 0, -94.5), rotationY: -Math.PI * 0.18, targetHeight: 5.2, minimumQuality: 'balanced', presentationRole: 'secondary-architecture' }),
  freeze({ id: 'horizon-vault-interface', zoneId: 'horizon-vault', assetId: 'eoncity-holo-interface-landmark', position: point(29.4, 0, -126.4), rotationY: Math.PI * 0.68, targetHeight: 4.8, minimumQuality: 'balanced', presentationRole: 'secondary-architecture' }),

  // A single distant authored silhouette is enough to imply a world beyond the
  // current route; it never becomes a fake interactive building.
  freeze({ id: 'future-forge-silhouette', zoneId: 'future-forge-wilds', assetId: 'eoncity-forge-basilica', position: point(-68, -1.2, -176), rotationY: Math.PI * 0.12, targetHeight: 22, minimumQuality: 'cinematic', presentationRole: 'distant-silhouette', distantOnly: true })
]);

export const EON_EXPANSE_W766_ROUTE_LAMP_PLACEMENTS = freeze([
  point(-12, 0, -2), point(-24, 0, -16), point(-34, 0, -27),
  point(-18, 0, -38), point(0, 0, -42), point(20, 0, -46),
  point(27, 0, -58), point(12, 0, -70), point(-4, 0, -82),
  point(-8, 0, -103), point(1, 0, -116), point(11, 0, -126)
]);

export function getEonExpanseW766Zone(zoneId = '') {
  return EON_EXPANSE_W766_ZONES.find((zone) => zone.id === String(zoneId || '')) || null;
}

export function deriveEonExpanseW766WorldProgress({ milestones = [], missionLedger = null } = {}) {
  const set = new Set((milestones || []).filter(Boolean).map(String));
  for (const milestone of missionLedger?.worldMilestones || []) set.add(String(milestone));
  const objectives = (missionId) => new Set((missionLedger?.missions?.[missionId]?.completedObjectives || []).map(String));
  const first = objectives('first-light');
  const archive = objectives('echoes-in-the-archive');
  const transit = objectives('the-broken-line');
  const horizon = objectives('horizon-reconnected');
  const reveal = objectives('the-first-reveal');
  const archiveRecordIds = ['archive-record-0', 'archive-record-1', 'archive-record-2'].filter((id) => set.has(`archive-record:${id}`));
  const relayNodeIds = ['relay-node-0', 'relay-node-1', 'relay-node-2'].filter((id) => set.has(`relay-node:${id}`));
  const beaconOneStage = set.has('beacon-one-repaired') || first.has('repair-beacon-one') ? 3
    : first.has('recover-signal-components') ? 2
      : first.has('scan-beacon-one') ? 1
        : 0;
  const archiveRecordCount = set.has('beacon-two-repaired') || archive.has('recover-archive-records') ? 3 : archiveRecordIds.length;
  const activatedRelayNodeIds = set.has('regional-transit-restored') || transit.has('activate-relay-nodes')
    ? ['relay-node-0', 'relay-node-1', 'relay-node-2']
    : relayNodeIds;
  return freeze({
    schema: `${EON_EXPANSE_W766_REGION_CONTRACT_SCHEMA}.progress.v1`,
    milestones: freeze([...set]),
    beaconOneStage,
    archiveRecordIds: freeze(archiveRecordCount >= 3 ? ['archive-record-0', 'archive-record-1', 'archive-record-2'] : archiveRecordIds),
    archiveRecordCount,
    archiveRoutingSolved: set.has('archive-routing-solved') || archive.has('solve-signal-routing'),
    beaconTwoRepaired: set.has('beacon-two-repaired') || archive.has('repair-beacon-two'),
    activatedRelayNodeIds: freeze(activatedRelayNodeIds),
    transitRelayStabilized: set.has('transit-relay-stabilized') || transit.has('stabilize-transit-relay'),
    regionalTransitRestored: set.has('regional-transit-restored') || transit.has('restore-regional-transit'),
    threeSignalsVerified: set.has('three-signals-verified') || horizon.has('verify-three-signals'),
    regionalCoreSynchronized: set.has('regional-core-synchronized') || horizon.has('synchronize-regional-core'),
    horizonTransitUnlocked: set.has('horizon-transit-unlocked') || horizon.has('unlock-horizon-transit'),
    vaultRouteOpened: set.has('vault-route-opened') || horizon.has('open-vault-route'),
    vaultChamberEntered: set.has('vault-chamber-entered') || reveal.has('enter-vault-chamber'),
    signalVanguardClaimed: set.has('vault:signal-vanguard-revealed') || reveal.has('claim-signal-vanguard'),
    signalVanguardActivated: set.has('cosmetic:signal-vanguard-glow:selected') || reveal.has('activate-cosmetic'),
    campaignComplete: set.has('campaign:signal-restoration:complete') || missionLedger?.completedMissions?.includes?.('the-first-reveal') === true
  });
}

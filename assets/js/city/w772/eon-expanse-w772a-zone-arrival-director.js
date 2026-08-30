/** W772A — bounded first-entry zone identity banners for Signal Frontier. */
import { getEonExpanseW771AZoneIdentity } from '../w771/eon-expanse-w771a-five-zone-cinematic-art-contract.js';
import { deriveEonExpanseW771ERestorationArtState } from '../w771/eon-expanse-w771e-zone-restoration-art-state.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W772A_ZONE_ARRIVAL_SCHEMA = 'eon.expanse.zone-arrival-director.w772a.v1';

export function createEonExpanseW772AZoneArrivalDirector({ now = () => Date.now(), minimumIntervalMs = 2500 } = {}) {
  const announced = new Set();
  const interval = Math.max(500, Number(minimumIntervalMs || 2500));
  let lastShownAt = 0;

  const derive = (zoneId = '', progress = {}) => {
    const identity = getEonExpanseW771AZoneIdentity(zoneId);
    if (!identity) return null;
    const art = deriveEonExpanseW771ERestorationArtState(progress).zones.find((entry) => entry.zoneId === identity.zoneId);
    return freeze({
      schema: EON_EXPANSE_W772A_ZONE_ARRIVAL_SCHEMA,
      zoneId: identity.zoneId,
      title: identity.title.toUpperCase(),
      network: `${Number(art?.restorationPercent || 0)}% zone restoration`,
      detail: art?.artStage === 'restored' ? art.transformationLabel : identity.purpose,
      signature: identity.signature,
      artStage: art?.artStage || 'damaged',
      restorationPercent: Number(art?.restorationPercent || 0),
      durationMs: 3200,
      blocksControl: false,
      awardsXp: false,
      mutatesMissionState: false,
      storesPrivateContent: false
    });
  };

  return freeze({
    enter(zoneId = '', { expanseActive = false, progress = {}, at = now(), force = false } = {}) {
      const id = String(zoneId || '');
      if (!expanseActive) return freeze({ ok: false, reason: 'expanse-not-active' });
      const card = derive(id, progress);
      if (!card) return freeze({ ok: false, reason: 'zone-identity-unavailable' });
      if (!force && announced.has(id)) return freeze({ ok: false, reason: 'zone-already-announced', card });
      if (!force && lastShownAt > 0 && at < lastShownAt + interval) return freeze({ ok: false, reason: 'zone-arrival-cooldown', card, nextAllowedAt: lastShownAt + interval });
      announced.add(id);
      lastShownAt = at;
      return freeze({ ok: true, card, announcedZoneCount: announced.size });
    },
    markAnnounced(zoneId = '') {
      const id = String(zoneId || '');
      if (getEonExpanseW771AZoneIdentity(id)) announced.add(id);
      return freeze({ ok: true, announcedZoneCount: announced.size });
    },
    reset(reason = 'session-reset') {
      announced.clear();
      lastShownAt = 0;
      return freeze({ ok: true, reason: String(reason || 'session-reset'), announcedZoneCount: 0 });
    },
    getState() {
      return freeze({ schema: EON_EXPANSE_W772A_ZONE_ARRIVAL_SCHEMA, announcedZoneIds: freeze([...announced]), lastShownAt, minimumIntervalMs: interval, blocksControl: false, storesPrivateContent: false });
    }
  });
}

export default freeze({ EON_EXPANSE_W772A_ZONE_ARRIVAL_SCHEMA, createEonExpanseW772AZoneArrivalDirector });

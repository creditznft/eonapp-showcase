/** W771A — authored visual identity contract for the five Signal Frontier zones. */
import { EON_EXPANSE_W766_ZONES } from '../w766/eon-expanse-w766-region-contract.js';

const freeze = Object.freeze;
const freezeList = (values = []) => freeze(values.map((value) => typeof value === 'object' && value !== null ? freeze({ ...value }) : value));

export const EON_EXPANSE_W771A_CINEMATIC_ART_SCHEMA = 'eon.expanse.five-zone-cinematic-art.w771a.v1';

const identity = ({ zoneId, title, purpose, signature, palette, heroAssetId, propFamilies, transformation, audioFamily }) => freeze({
  zoneId,
  title,
  purpose,
  signature,
  palette: freeze({ ...palette }),
  heroAssetId,
  propFamilies: freezeList(propFamilies),
  transformation: freeze({ ...transformation }),
  audioFamily,
  heroPresentation: 'validated-authored-asset-only',
  finishedHeroPrimitiveAllowed: false,
  modularPrimitiveUse: 'small-environment-connectors-only',
  screenshotDistinctWithoutLabels: true
});

export const EON_EXPANSE_W771A_ZONE_IDENTITIES = freeze([
  identity({
    zoneId: 'gateway-overlook', title: 'Gateway Overlook', purpose: 'Arrival, companion rescue, Pathfinder briefing and panoramic orientation.', signature: 'layered-cyan-overlook',
    palette: { base: '#07111f', primary: '#25b6ff', secondary: '#9d72ff', warm: '#ffbc62' }, heroAssetId: 'eoncity-ascension-portal',
    propFamilies: ['layered-platforms', 'signal-rails', 'relay-cables', 'panorama-frames', 'route-lamps'],
    transformation: { milestone: 'companion-bonded', before: 'damaged-static-relay', after: 'stable-companion-signal' }, audioFamily: 'gateway-wind-and-signal'
  }),
  identity({
    zoneId: 'beacon-fields', title: 'Beacon Fields', purpose: 'First restoration, scanning and visible regional recovery.', signature: 'emerald-storm-pylons',
    palette: { base: '#07151a', primary: '#58e6b2', secondary: '#25b6ff', warm: '#ffd37a' }, heroAssetId: 'eoncity-ai-tower-core',
    propFamilies: ['signal-pylons', 'circuit-trenches', 'energy-crystals', 'maintenance-drones', 'synthetic-grass'],
    transformation: { milestone: 'beacon-one-repaired', before: 'broken-field-network', after: 'sequenced-beacon-grid' }, audioFamily: 'beacon-storm-and-machinery'
  }),
  identity({
    zoneId: 'archive-ruins', title: 'Archive Ruins', purpose: 'Exploration, record recovery, Navigator and knowledge restoration.', signature: 'violet-vertical-archive',
    palette: { base: '#100b1c', primary: '#9d72ff', secondary: '#5aa8ff', warm: '#e7c9ff' }, heroAssetId: 'eoncity-navigator-arc',
    propFamilies: ['ruined-facades', 'vertical-walkways', 'memory-walls', 'archive-bridges', 'holographic-records'],
    transformation: { milestone: 'beacon-two-repaired', before: 'dark-fragmented-records', after: 'orbiting-knowledge-network' }, audioFamily: 'archive-resonance-and-whispers'
  }),
  identity({
    zoneId: 'transit-scar', title: 'Transit Scar', purpose: 'Physical repair, industrial spectacle and Regional Transit restoration.', signature: 'amber-industrial-rail',
    palette: { base: '#170d09', primary: '#ffbc62', secondary: '#ff6f61', warm: '#fff1c2' }, heroAssetId: 'eoncity-transit-core',
    propFamilies: ['rail-segments', 'maintenance-gantries', 'service-cables', 'warning-lights', 'crane-frames'],
    transformation: { milestone: 'regional-transit-restored', before: 'broken-rail-scar', after: 'sequenced-regional-line' }, audioFamily: 'transit-metal-and-power'
  }),
  identity({
    zoneId: 'horizon-vault', title: 'Horizon Vault', purpose: 'Campaign finale, Signal Vanguard reveal and My Frontier unlock.', signature: 'gold-violet-monument',
    palette: { base: '#110d1d', primary: '#d5b6ff', secondary: '#25b6ff', warm: '#ffd27d' }, heroAssetId: 'eoncity-genesis-core',
    propFamilies: ['monumental-rings', 'vault-thresholds', 'key-altar', 'deep-chamber-frames', 'future-gateway-silhouettes'],
    transformation: { milestone: 'campaign:signal-restoration:complete', before: 'sealed-vault-threshold', after: 'illuminated-infinite-frontier' }, audioFamily: 'vault-choir-and-deep-signal'
  })
]);

export function validateEonExpanseW771ACinematicArtContract() {
  const expected = new Set(EON_EXPANSE_W766_ZONES.map((zone) => zone.id));
  const seen = new Set();
  const errors = [];
  for (const zone of EON_EXPANSE_W771A_ZONE_IDENTITIES) {
    if (!expected.has(zone.zoneId)) errors.push(`unknown-zone:${zone.zoneId}`);
    if (seen.has(zone.zoneId)) errors.push(`duplicate-zone:${zone.zoneId}`);
    seen.add(zone.zoneId);
    if (!zone.heroAssetId) errors.push(`hero-asset-missing:${zone.zoneId}`);
    if (zone.propFamilies.length < 5) errors.push(`environment-kit-incomplete:${zone.zoneId}`);
    if (zone.finishedHeroPrimitiveAllowed !== false) errors.push(`hero-primitive-policy-invalid:${zone.zoneId}`);
  }
  for (const zoneId of expected) if (!seen.has(zoneId)) errors.push(`zone-identity-missing:${zoneId}`);
  return freeze({
    ok: errors.length === 0,
    schema: EON_EXPANSE_W771A_CINEMATIC_ART_SCHEMA,
    zoneCount: seen.size,
    expectedZoneCount: expected.size,
    screenshotDistinctZoneCount: EON_EXPANSE_W771A_ZONE_IDENTITIES.filter((zone) => zone.screenshotDistinctWithoutLabels).length,
    heroPrimitiveCount: 0,
    errors: freeze(errors),
    oneCanonicalRuntimeRequired: true,
    privateContentStored: false
  });
}

export function getEonExpanseW771AZoneIdentity(zoneId = '') {
  return EON_EXPANSE_W771A_ZONE_IDENTITIES.find((zone) => zone.zoneId === String(zoneId || '')) || null;
}

export default freeze({ EON_EXPANSE_W771A_CINEMATIC_ART_SCHEMA, EON_EXPANSE_W771A_ZONE_IDENTITIES, validateEonExpanseW771ACinematicArtContract, getEonExpanseW771AZoneIdentity });

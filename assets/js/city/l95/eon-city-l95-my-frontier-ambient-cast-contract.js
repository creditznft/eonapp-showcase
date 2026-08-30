/** L95 — bounded public ambient cast for first-entry My Frontier.
 * World-owned ambience only: no resident identity, task state, XP or progression.
 */
import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';

const freeze = Object.freeze;
const QUALITY_RANK = freeze({ lite: 0, balanced: 1, cinematic: 2 });
const point = (x, y, z) => freeze({ x: Number(x), y: Number(y), z: Number(z) });

export const EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA = 'eon.city.l95.my-frontier-ambient-cast.v1';

const placement = ({ id, assetId, district, x, z, rotationY = 0, targetHeight = 1.8, minimumQuality = 'balanced', animationNames = [] }) => freeze({
  id,
  assetId,
  district,
  position: point(x, 0, z),
  rotationY: Number(rotationY),
  targetHeight: Number(targetHeight),
  minimumQuality,
  animationNames: freeze([...animationNames]),
  ownership: 'public-ambient-cast',
  interactive: false,
  resident: false,
  agent: false,
  taskState: false,
  grantsXp: false,
  grantsConstruction: false,
  mutatesMissionState: false
});

export const EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST = freeze([
  placement({ id: 'central-maintenance-worker', assetId: 'eon-x1-worker-9clips', district: 'central', x: 5.8, z: 10.4, rotationY: Math.PI * 0.84, minimumQuality: 'lite', animationNames: ['Idle_12', 'Female_Bend_Over_Pick_Up_Inspect'] }),
  placement({ id: 'creator-public-citizen', assetId: 'eoncity-civilian-creator-13clips', district: 'creator', x: -25.8, z: -11.8, rotationY: Math.PI * 0.28, minimumQuality: 'balanced', animationNames: ['Idle 02', 'Talk With Hands Open'] }),
  placement({ id: 'knowledge-public-navigator', assetId: 'eoncity-navigator-archive-vault-6clips', district: 'knowledge', x: -8.2, z: -27.4, rotationY: Math.PI * 1.08, minimumQuality: 'cinematic', animationNames: ['Idle_12', 'Talk_with_Hands_Open'] })
]);

function isVariant(value) {
  return Boolean(value?.path?.startsWith('/assets/city/w649/'))
    && /^\/assets\/city\/w649\/(primary|fallback)\/characters\/.+\.[a-f0-9]{12}\.glb$/i.test(String(value?.path || ''))
    && Number(value?.bytes || 0) > 0
    && /^[a-f0-9]{64}$/i.test(String(value?.sha256 || ''));
}

export function createEonCityL95MyFrontierAmbientCastPlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = QUALITY_RANK[quality] == null ? 'balanced' : quality;
  const entries = EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST
    .filter((entry) => QUALITY_RANK[resolvedQuality] >= QUALITY_RANK[entry.minimumQuality])
    .map((entry) => {
      const character = getEonCityW649Character(entry.assetId);
      return freeze({
        ...entry,
        sourceStatus: String(character?.status || ''),
        sourceAnimations: freeze([...(character?.animationNames || [])]),
        variants: freeze({ primary: character?.variants?.primary || null, fallback: character?.variants?.fallback || null })
      });
    });
  return freeze({
    schema: EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA,
    quality: resolvedQuality,
    entries: freeze(entries),
    actorCount: entries.length,
    maximumActorCount: 3,
    publicAmbienceOnly: true,
    interactiveCount: 0,
    residentCount: 0,
    agentCount: 0,
    grantsXp: false,
    grantsConstruction: false,
    mutatesMissionState: false
  });
}

export function validateEonCityL95MyFrontierAmbientCastPlan(plan = createEonCityL95MyFrontierAmbientCastPlan()) {
  const errors = [];
  const entries = Array.isArray(plan?.entries) ? plan.entries : [];
  if (plan?.schema !== EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA) errors.push('schema');
  if (entries.length < 1 || entries.length > 3) errors.push('actor-budget');
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) errors.push('unique-ids');
  for (const entry of entries) {
    if (!entry.sourceStatus.startsWith('READY')) errors.push(`source-not-ready:${entry.id}`);
    if (!isVariant(entry.variants?.primary) || !isVariant(entry.variants?.fallback)) errors.push(`variant:${entry.id}`);
    if (![entry.position?.x, entry.position?.y, entry.position?.z, entry.rotationY, entry.targetHeight].every(Number.isFinite) || entry.targetHeight <= 0) errors.push(`transform:${entry.id}`);
    if (!entry.animationNames.some((name) => entry.sourceAnimations.includes(name))) errors.push(`animation:${entry.id}`);
    if (entry.ownership !== 'public-ambient-cast' || entry.interactive || entry.resident || entry.agent || entry.taskState || entry.grantsXp || entry.grantsConstruction || entry.mutatesMissionState) errors.push(`truth:${entry.id}`);
  }
  if (!plan.publicAmbienceOnly || plan.interactiveCount || plan.residentCount || plan.agentCount || plan.grantsXp || plan.grantsConstruction || plan.mutatesMissionState) errors.push('plan-truth');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), actorCount: entries.length, quality: plan?.quality || '' });
}

export default freeze({
  EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA,
  EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST,
  createEonCityL95MyFrontierAmbientCastPlan,
  validateEonCityL95MyFrontierAmbientCastPlan
});

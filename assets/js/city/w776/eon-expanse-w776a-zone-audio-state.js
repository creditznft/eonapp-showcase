/** W776A — bounded restoration-aware zone audio state derived from canonical public world truth. */
const freeze = Object.freeze;

export const EON_EXPANSE_W776A_ZONE_AUDIO_STATE_SCHEMA = 'eon.expanse.zone-audio-state.w776a.v1';

const ZONE_IDS = freeze(['gateway-overlook', 'beacon-fields', 'archive-ruins', 'transit-scar', 'horizon-vault']);
const STAGE_PROFILES = freeze({
  damaged: freeze({ clarityMultiplier: 0.72, intensityMultiplier: 0.82, noiseMultiplier: 1.15, filterMultiplier: 0.78 }),
  restoring: freeze({ clarityMultiplier: 0.92, intensityMultiplier: 0.96, noiseMultiplier: 0.82, filterMultiplier: 0.96 }),
  restored: freeze({ clarityMultiplier: 1.12, intensityMultiplier: 1.06, noiseMultiplier: 0.55, filterMultiplier: 1.14 })
});

const safeZone = (value = '') => ZONE_IDS.includes(String(value)) ? String(value) : 'gateway-overlook';
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function deriveEonExpanseW776AZoneAudioState({
  zoneId = 'gateway-overlook',
  zoneRestorationBoard = null,
  dynamicEvent = null,
  reducedMotion = false
} = {}) {
  const resolvedZoneId = safeZone(zoneId);
  const row = Array.isArray(zoneRestorationBoard?.rows)
    ? zoneRestorationBoard.rows.find((entry) => String(entry?.zoneId || '') === resolvedZoneId)
    : null;
  const artStage = ['damaged', 'restoring', 'restored'].includes(String(row?.artStage || ''))
    ? String(row.artStage)
    : 'damaged';
  const profile = STAGE_PROFILES[artStage];
  const restorationPercent = clamp(row?.restorationPercent, 0, 100);
  const eventInZone = dynamicEvent?.active === true
    && dynamicEvent?.visible !== false
    && String(dynamicEvent?.zoneId || '') === resolvedZoneId;
  const eventInfluence = eventInZone ? (reducedMotion ? 0.025 : 0.08) : 0;

  return freeze({
    schema: EON_EXPANSE_W776A_ZONE_AUDIO_STATE_SCHEMA,
    zoneId: resolvedZoneId,
    artStage,
    restorationPercent,
    clarityMultiplier: clamp(profile.clarityMultiplier + (restorationPercent / 1000), 0.65, 1.22),
    intensityMultiplier: clamp(profile.intensityMultiplier + eventInfluence, 0.72, 1.12),
    noiseMultiplier: clamp(profile.noiseMultiplier - eventInfluence * 0.45, 0.48, 1.2),
    filterMultiplier: clamp(profile.filterMultiplier + eventInfluence * 0.5, 0.7, 1.2),
    eventInfluence: Number(eventInfluence.toFixed(3)),
    dynamicEventActive: eventInZone,
    reducedSensory: Boolean(reducedMotion),
    explicitUserStartRequired: true,
    createsUrgency: false,
    blocksNavigation: false,
    startsAudioAutomatically: false,
    mutatesProgression: false,
    awardsXp: false,
    storesPrivateContent: false
  });
}

export default freeze({ EON_EXPANSE_W776A_ZONE_AUDIO_STATE_SCHEMA, deriveEonExpanseW776AZoneAudioState });

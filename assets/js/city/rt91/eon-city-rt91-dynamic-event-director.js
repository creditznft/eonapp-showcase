/**
 * RT91 — bounded deterministic world-event director.
 * Events change temporary presentation/activity availability only. Missing an
 * event never removes progress or rewards, and no event blocks Hub return.
 */
import { EON_EXPANSE_W766F_EVENT_FAMILIES } from '../w766/eon-expanse-w766f-living-content.js';

export const EON_CITY_RT91_DYNAMIC_EVENT_SCHEMA = 'eon.city.dynamic-event.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'rt91-event')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const event = (id, label, worldId, familyId, durationMinutes, presentationEffects, activityTags) => freeze({
  id,
  label,
  worldId,
  familyId,
  durationMinutes,
  presentationEffects: freeze([...presentationEffects]),
  activityTags: freeze([...activityTags]),
  optIn: true,
  blocksHubReturn: false,
  irreversibleFailure: false,
  missedEventPenalty: false,
  grantsProgressionAutomatically: false,
  privateContentStored: false
});

const signalEvents = EON_EXPANSE_W766F_EVENT_FAMILIES.map((entry) => event(
  `signal-${entry.id}`,
  entry.label,
  'signal-frontier',
  entry.id,
  entry.durationMinutes,
  ['lighting-accent', 'ambient-audio', 'local-activity-marker'],
  [entry.zoneId, 'signal-event']
));

export const EON_CITY_RT91_DYNAMIC_EVENT_FAMILIES = freeze([
  ...signalEvents,
  event('storm-supercell-pass', 'Supercell Passage', 'storm-sector', 'weather-restoration', 9, ['storm-intensity', 'fog', 'lightning', 'audio'], ['weather-array', 'safe-zone']),
  event('storm-relay-surge', 'Relay Surge', 'storm-sector', 'relay-repair', 7, ['charged-lighting', 'relay-hum', 'warning-beacons'], ['relay', 'grounding']),
  event('storm-rescue-window', 'Rescue Window', 'storm-sector', 'storm-rescue', 10, ['rescue-beacons', 'visibility-break', 'radio-audio'], ['rescue', 'shelter']),
  event('storm-transit-blackout', 'Transit Blackout', 'storm-sector', 'charged-transit', 8, ['transit-lighting', 'route-signals', 'audio'], ['transit', 'grounding']),
  event('frontier-maker-fair', 'Maker Fair', 'my-frontier', 'district-development', 12, ['district-lights', 'ambient-crowd', 'creator-signage'], ['creator', 'public-space']),
  event('frontier-research-window', 'Research Window', 'my-frontier', 'city-maintenance', 10, ['observatory-lights', 'research-markers'], ['knowledge', 'research']),
  event('frontier-transit-rush', 'Transit Rush', 'my-frontier', 'city-maintenance', 8, ['transit-density', 'platform-audio'], ['transit', 'public-space']),
  event('frontier-eonbot-gathering', 'EONBOT Gathering', 'my-frontier', 'resident-assistance', 10, ['companion-lights', 'ambient-eonbot-actions'], ['personal', 'resident'])
]);

export function resolveEonCityRt91DynamicEvent({ worldId = '', worldSeed = 'rt91-world', at = Date.now(), windowMinutes = 30 } = {}) {
  const world = clean(worldId);
  const families = EON_CITY_RT91_DYNAMIC_EVENT_FAMILIES.filter((entry) => entry.worldId === world);
  if (!families.length) return null;
  const timestamp = Number.isFinite(Number(at)) ? Number(at) : Date.now();
  const boundedWindowMinutes = Math.max(15, Math.min(120, Number(windowMinutes) || 30));
  const windowMs = boundedWindowMinutes * 60_000;
  const windowIndex = Math.floor(timestamp / windowMs);
  const key = `${worldSeed}:${world}:${windowIndex}`;
  const selected = families[hash32(key) % families.length];
  const startsAt = windowIndex * windowMs;
  const endsAt = startsAt + Math.min(windowMs, selected.durationMinutes * 60_000);
  return freeze({
    schema: EON_CITY_RT91_DYNAMIC_EVENT_SCHEMA,
    ...selected,
    windowId: `${world}:${windowIndex}:${hash32(key).toString(36)}`,
    startsAt,
    endsAt,
    active: timestamp >= startsAt && timestamp < endsAt,
    deterministic: true,
    persistentPenaltyOnMiss: false,
    changesRewardAuthority: false,
    networkRequestCreated: false
  });
}

export function validateEonCityRt91DynamicEventFamilies(events = EON_CITY_RT91_DYNAMIC_EVENT_FAMILIES) {
  const errors = [];
  const ids = new Set();
  const worlds = new Set();
  for (const entry of events || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`duplicate-or-missing-id:${entry?.id || 'missing'}`);
    ids.add(entry?.id);
    worlds.add(entry?.worldId);
    if (entry.durationMinutes < 4 || entry.durationMinutes > 15) errors.push(`duration:${entry.id}`);
    if (entry.optIn !== true || entry.blocksHubReturn !== false || entry.irreversibleFailure !== false || entry.missedEventPenalty !== false) errors.push(`fairness:${entry.id}`);
    if (entry.grantsProgressionAutomatically !== false || entry.privateContentStored !== false) errors.push(`authority:${entry.id}`);
  }
  for (const required of ['signal-frontier', 'storm-sector', 'my-frontier']) if (!worlds.has(required)) errors.push(`world:${required}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors), eventFamilyCount: ids.size });
}

export default freeze({ EON_CITY_RT91_DYNAMIC_EVENT_SCHEMA, EON_CITY_RT91_DYNAMIC_EVENT_FAMILIES, resolveEonCityRt91DynamicEvent, validateEonCityRt91DynamicEventFamilies });

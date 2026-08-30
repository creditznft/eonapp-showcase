const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value || 0)));

export const EON_EXPANSE_W767Q_EVENT_ATMOSPHERE_SCHEMA = 'eon.city.expanse.event-atmosphere.w767q.v1';

const EVENT_PROFILES = freeze({
  'signal-storm': freeze({ accent: '#7ce8ff', fogMultiplier: 1.16, moteSpeedMultiplier: 1.22, pulseIntensity: 0.08 }),
  'archive-pulse': freeze({ accent: '#c19aff', fogMultiplier: 1.08, moteSpeedMultiplier: 0.88, pulseIntensity: 0.06 }),
  'transit-interruption': freeze({ accent: '#ffc36f', fogMultiplier: 1.12, moteSpeedMultiplier: 1.08, pulseIntensity: 0.05 }),
  'rare-cosmetic-signal': freeze({ accent: '#ffe6a5', fogMultiplier: 0.92, moteSpeedMultiplier: 0.8, pulseIntensity: 0.07 }),
  'lost-drone': freeze({ accent: '#71ffc9', fogMultiplier: 1.02, moteSpeedMultiplier: 0.96, pulseIntensity: 0.04 })
});

export function deriveEonExpanseW767QEventAtmosphere(event = null, {
  active = true,
  reducedMotion = false
} = {}) {
  const eventId = String(event?.eventId || event?.id || '');
  const profile = EVENT_PROFILES[eventId] || null;
  if (!active || !profile) {return freeze({
    schema: EON_EXPANSE_W767Q_EVENT_ATMOSPHERE_SCHEMA,
    active: false,
    eventId: '',
    accent: '',
    fogMultiplier: 1,
    moteSpeedMultiplier: 1,
    pulseIntensity: 0,
    reducedMotion: Boolean(reducedMotion),
    preservesNavigation: true,
    externalWeatherData: false,
    ownsScene: false,
    ownsRenderLoop: false
  });}
  return freeze({
    schema: EON_EXPANSE_W767Q_EVENT_ATMOSPHERE_SCHEMA,
    active: true,
    eventId,
    accent: profile.accent,
    fogMultiplier: clamp(profile.fogMultiplier, 0.85, 1.2),
    moteSpeedMultiplier: reducedMotion ? 1 : clamp(profile.moteSpeedMultiplier, 0.75, 1.25),
    pulseIntensity: reducedMotion ? 0 : clamp(profile.pulseIntensity, 0, 0.1),
    reducedMotion: Boolean(reducedMotion),
    preservesNavigation: true,
    externalWeatherData: false,
    ownsScene: false,
    ownsRenderLoop: false
  });
}

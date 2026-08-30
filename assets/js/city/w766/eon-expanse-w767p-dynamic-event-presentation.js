import { deriveEonExpanseW767ODynamicEventLifecycle } from './eon-expanse-w767o-dynamic-event-lifecycle.js';

const freeze = (value) => Object.freeze(value);
const token = (value = '', max = 96) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);
const text = (value = '', max = 140) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 && character !== '<' && character !== '>' ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
const words = (value = '') => String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').trim();

export const EON_EXPANSE_W767P_DYNAMIC_EVENT_PRESENTATION_SCHEMA = 'eon.city.expanse.dynamic-event-presentation.w767p.v1';

export function deriveEonExpanseW767PDynamicEventPresentation(event = null, {
  at = Date.now(),
  playerZoneId = '',
  expanseActive = true
} = {}) {
  const suppliedAt = Number(at);
  const timestamp = Number.isFinite(suppliedAt) ? suppliedAt : Date.now();
  const lifecycle = deriveEonExpanseW767ODynamicEventLifecycle(event, { at: timestamp });
  if (!expanseActive || !lifecycle.active || !event) {return freeze({
    schema: EON_EXPANSE_W767P_DYNAMIC_EVENT_PRESENTATION_SCHEMA,
    active: false,
    visible: false,
    status: lifecycle.status,
    eventId: '',
    windowId: '',
    label: '',
    zoneId: '',
    zoneLabel: '',
    remainingMs: 0,
    remainingMinutes: 0,
    endingSoon: false,
    playerInZone: false,
    text: '',
    ariaLabel: '',
    markerLabel: '',
    boardTitle: '',
    boardDetail: '',
    optional: true,
    blocksHubReturn: false,
    awardsXp: false,
    grantsXpForVisibility: false,
    financialUrgency: false,
    createsUrgency: false,
    irreversibleFailure: false,
    mutatesProgression: false,
    automaticAction: false,
    storesPrivateContent: false
  });}

  const eventId = token(event.id);
  const zoneId = token(event.zoneId);
  const label = text(event.label || words(eventId) || 'Frontier event');
  const zoneLabel = text(event.zoneLabel || words(zoneId) || 'Signal Frontier');
  const remainingMs = Math.max(0, Number(lifecycle.remainingMs || 0));
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  const endingSoon = remainingMs <= 60000;
  const playerInZone = token(playerZoneId) === zoneId;
  const timeLabel = endingSoon ? 'ending within one minute' : `${remainingMinutes} min remaining`;
  const visible = expanseActive === true;

  return freeze({
    schema: EON_EXPANSE_W767P_DYNAMIC_EVENT_PRESENTATION_SCHEMA,
    active: true,
    visible,
    status: 'active',
    eventId,
    windowId: token(event.windowId, 120),
    label,
    zoneId,
    zoneLabel,
    startsAt: Math.max(0, Number(event.startsAt || 0)),
    endsAt: Math.max(0, Number(event.endsAt || 0)),
    remainingMs,
    remainingMinutes,
    endingSoon,
    playerInZone,
    text: visible ? `Optional event · ${label} · ${zoneLabel} · ${timeLabel}` : '',
    ariaLabel: visible ? `Optional frontier event: ${label}, in ${zoneLabel}, ${timeLabel}` : '',
    markerLabel: `${label} - ${timeLabel}`,
    boardTitle: label,
    boardDetail: `${zoneLabel} - ${timeLabel}. Optional review only; return to the Command Hub remains available.`,
    optional: true,
    blocksHubReturn: false,
    awardsXp: false,
    grantsXpForVisibility: false,
    financialUrgency: false,
    createsUrgency: false,
    irreversibleFailure: false,
    mutatesProgression: false,
    automaticAction: false,
    storesPrivateContent: false
  });
}

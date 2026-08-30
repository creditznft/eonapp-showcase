/**
 * W624E — EONBOT Orbit companion experience.
 *
 * This module owns only local presentation and caption selection. It cannot
 * navigate, execute work, start audio/microphone, read private content, write
 * browser storage, call a provider, or change account/commercial state.
 */
import {
  EON_CITY_COMMAND_DISTRICT_DESTINATIONS,
  EON_CITY_COMMAND_DISTRICT_JOURNEY
} from './eon-city-command-district-vertical-slice.js';

export const EON_CITY_EONBOT_ORBIT_SCHEMA = 'eon.city.eonbot-orbit.w624e.v1';
export const EON_CITY_EONBOT_ORBIT_STATES = Object.freeze([
  'follow', 'lead', 'point', 'think', 'speak', 'scan', 'celebrate', 'warn', 'help'
]);

const freeze = (value) => Object.freeze(value);
const cleanId = (value = '') => String(value || '').trim().toLowerCase();
const finiteCount = (value) => Math.max(0, Math.min(999, Math.floor(Number(value) || 0)));
const DESTINATIONS = new Map(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map((entry) => [entry.id, entry]));
const ROUTE_STEPS = new Set(EON_CITY_COMMAND_DISTRICT_JOURNEY.firstSixtySeconds.map((entry) => entry.id));

const STATE_PRESENTATION = freeze({
  follow: freeze({ directorMode: 'follow', animation: 'Follow', captionTone: 'orientation' }),
  lead: freeze({ directorMode: 'guide', animation: 'Guide', captionTone: 'direction' }),
  point: freeze({ directorMode: 'guide', animation: 'Point', captionTone: 'destination' }),
  think: freeze({ directorMode: 'observe', animation: 'Think', captionTone: 'context' }),
  speak: freeze({ directorMode: 'speak', animation: 'Speak', captionTone: 'explicit-caption' }),
  scan: freeze({ directorMode: 'scan', animation: 'Scan', captionTone: 'orientation' }),
  celebrate: freeze({ directorMode: 'orbit', animation: 'Celebrate', captionTone: 'acknowledgement' }),
  warn: freeze({ directorMode: 'perch', animation: 'Warn', captionTone: 'boundary' }),
  help: freeze({ directorMode: 'return', animation: 'Help', captionTone: 'help' })
});

function destinationHint(entry) {
  const state = entry.boundary === 'proof-gated' ? 'warn' : 'point';
  const text = entry.id === 'agent-theatre'
    ? 'Agent Theatre shows dormant, receipt-backed status only. Open Automations only after your visible review.'
    : `${entry.title} can open ${entry.action.destinationLabel} after your confirmation. City transfers no prompt, file, private content, or automatic action.`;
  return freeze({
    id: `destination:${entry.id}`,
    state,
    title: `EONBOT Orbit · ${entry.title}`,
    text,
    landmarkId: entry.id,
    route: entry.action.route,
    proofBoundary: entry.boundary === 'proof-gated',
    priority: entry.boundary === 'proof-gated' ? 100 : 80
  });
}

const DESTINATION_HINTS = freeze(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map(destinationHint));

const ROUTE_HINTS = freeze([
  freeze({ id: 'route:arrival', state: 'scan', title: 'EONBOT Orbit · Arrival Plaza', text: 'Project Dock and Agent Theatre are the closest review points. Nothing opens automatically.', routeStepId: 'arrival', priority: 70 }),
  freeze({ id: 'route:orient', state: 'lead', title: 'EONBOT Orbit · Read the district', text: 'Creator Atrium is left, Forge Basilica is right, and the central path leads toward the Command Loom.', routeStepId: 'orient', priority: 68 }),
  freeze({ id: 'route:agent', state: 'warn', title: 'EONBOT Orbit · Honest agent state', text: 'Agent Theatre remains dormant until a real reviewable receipt exists. It never invents a running job.', routeStepId: 'agent', priority: 95 }),
  freeze({ id: 'route:command', state: 'lead', title: 'EONBOT Orbit · Command approach', text: 'The Command Loom is an orientation boundary. Choose a visible destination; Orbit will not steer or click for you.', routeStepId: 'command', priority: 72 }),
  freeze({ id: 'route:choose', state: 'help', title: 'EONBOT Orbit · Choose useful work', text: 'Create, Forge, Projects, Library, Workspace, and Automations are review-first destinations. You remain in control.', routeStepId: 'choose', priority: 76 })
]);

function projectHint(savedProjectCount) {
  if (savedProjectCount < 1) return null;
  return freeze({
    id: 'context:saved-project-count',
    state: 'think',
    title: 'EONBOT Orbit · Project return',
    text: `${savedProjectCount} private project portal${savedProjectCount === 1 ? ' is' : 's are'} available locally. Orbit sees only this count—not names, files, prompts, or project content.`,
    landmarkId: 'project-dock',
    route: '/projects',
    proofBoundary: false,
    priority: 64
  });
}

const HELP_HINT = freeze({
  id: 'control:help', state: 'help', title: 'EONBOT Orbit · Help',
  text: 'Move freely, review a named landmark, then use its visible continue action. Orbit never auto-navigates or starts work.',
  priority: 120
});

const SPEAK_HINT = freeze({
  id: 'control:speak', state: 'speak', title: 'EONBOT Orbit · Caption ready',
  text: 'Captions are primary. Optional speech output starts only after your explicit action in the Voice panel; the microphone remains off.',
  priority: 125
});

const CELEBRATE_HINT = freeze({
  id: 'control:celebrate', state: 'celebrate', title: 'EONBOT Orbit · Choice acknowledged',
  text: 'Your local destination choice is ready for review. No success, payment, reward, publication, or completed work is being claimed.',
  priority: 110
});

export function getEonCityEonbotOrbitPresentation(state = 'follow') {
  const normalized = EON_CITY_EONBOT_ORBIT_STATES.includes(cleanId(state)) ? cleanId(state) : 'follow';
  return freeze({ state: normalized, ...STATE_PRESENTATION[normalized] });
}

export function createEonCityEonbotOrbitHint({ routeStepId = '', nearbyLandmarkId = '', savedProjectCount = 0, explicitIntent = '' } = {}) {
  const intent = cleanId(explicitIntent);
  if (intent === 'help') return HELP_HINT;
  if (intent === 'speak') return SPEAK_HINT;
  if (intent === 'celebrate') return CELEBRATE_HINT;
  const landmark = DESTINATIONS.get(cleanId(nearbyLandmarkId));
  if (landmark) return destinationHint(landmark);
  const step = cleanId(routeStepId);
  if (ROUTE_STEPS.has(step)) return ROUTE_HINTS.find((hint) => hint.routeStepId === step) || null;
  return projectHint(finiteCount(savedProjectCount)) || ROUTE_HINTS[0];
}

export function createEonCityEonbotOrbitController({ reducedMotion = false, showLessGuidance = false, muted = true, now = () => Date.now() } = {}) {
  let state = freeze({
    schema: EON_CITY_EONBOT_ORBIT_SCHEMA,
    dismissed: false,
    muted: Boolean(muted),
    showLessGuidance: Boolean(showLessGuidance),
    reducedMotion: Boolean(reducedMotion),
    currentHint: null,
    usedHintIds: freeze([]),
    presentation: getEonCityEonbotOrbitPresentation(reducedMotion ? 'help' : 'follow'),
    updatedAt: Number(now()) || 0,
    localOnly: true
  });
  const used = new Set();
  const snapshot = (patch = {}) => {
    state = freeze({ ...state, ...patch, usedHintIds: freeze([...used]), updatedAt: Number(now()) || 0 });
    return state;
  };
  const present = (hint, { force = false } = {}) => {
    if (!hint || state.dismissed) return snapshot({ currentHint: null });
    if (!force && used.has(hint.id)) return state;
    if (state.showLessGuidance && !force && Number(hint.priority || 0) < 90) return state;
    used.add(hint.id);
    const presentation = getEonCityEonbotOrbitPresentation(state.reducedMotion && ['lead', 'celebrate'].includes(hint.state) ? 'help' : hint.state);
    return snapshot({ currentHint: freeze({ ...hint }), presentation });
  };
  return freeze({
    updateContext(context = {}) { return present(createEonCityEonbotOrbitHint(context)); },
    request(stateId = 'help', context = {}) {
      const normalized = cleanId(stateId);
      const intent = ['help', 'speak', 'celebrate'].includes(normalized) ? normalized : '';
      const hint = intent ? createEonCityEonbotOrbitHint({ ...context, explicitIntent: intent }) : freeze({
        id: `presentation:${normalized}`,
        state: EON_CITY_EONBOT_ORBIT_STATES.includes(normalized) ? normalized : 'help',
        title: 'EONBOT Orbit · Local presentation',
        text: 'This visible companion state is local presentation only. It cannot navigate, execute work, or read private content.',
        priority: 115
      });
      return present(hint, { force: true });
    },
    setMuted(value) { return snapshot({ muted: Boolean(value) }); },
    setDismissed(value) { return snapshot({ dismissed: Boolean(value), currentHint: value ? null : state.currentHint }); },
    setShowLessGuidance(value) { return snapshot({ showLessGuidance: Boolean(value) }); },
    setReducedMotion(value) {
      const next = Boolean(value);
      const presentation = next && ['lead', 'celebrate'].includes(state.presentation.state) ? getEonCityEonbotOrbitPresentation('help') : state.presentation;
      return snapshot({ reducedMotion: next, presentation });
    },
    clearCycle() { used.clear(); return snapshot({ currentHint: null, presentation: getEonCityEonbotOrbitPresentation('follow') }); },
    getSnapshot() { return state; },
    dispose() {
      used.clear();
      return snapshot({ dismissed: true, currentHint: null, presentation: getEonCityEonbotOrbitPresentation('follow') });
    }
  });
}

export function validateEonCityEonbotOrbitExperience() {
  const errors = [];
  if (EON_CITY_EONBOT_ORBIT_STATES.length !== 9 || new Set(EON_CITY_EONBOT_ORBIT_STATES).size !== 9) errors.push('nine-presentation-states-required');
  if (DESTINATION_HINTS.length !== 6) errors.push('six-command-district-destination-hints-required');
  if (ROUTE_HINTS.length !== 5) errors.push('five-first-sixty-second-hints-required');
  for (const hint of [...DESTINATION_HINTS, ...ROUTE_HINTS, HELP_HINT, SPEAK_HINT, CELEBRATE_HINT]) {
    if (!EON_CITY_EONBOT_ORBIT_STATES.includes(hint.state)) errors.push(`invalid-state:${hint.id}`);
    if (/job (is )?running|payment complete|reward earned|successfully published|autonomous agent/i.test(hint.text)) errors.push(`fake-operational-claim:${hint.id}`);
    if (/https?:\/\/|api[-_ ]?key|credential|private prompt|file contents/i.test(hint.text)) errors.push(`private-or-external-content:${hint.id}`);
  }
  return freeze({
    schema: EON_CITY_EONBOT_ORBIT_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    stateCount: EON_CITY_EONBOT_ORBIT_STATES.length,
    destinationHintCount: DESTINATION_HINTS.length,
    routeHintCount: ROUTE_HINTS.length,
    captionsFirst: true,
    microphoneStartsAutomatically: false,
    speechStartsAutomatically: false,
    autoNavigation: false,
    privateDataRead: false,
    browserStorageWritten: false,
    networkRequestCreated: false
  });
}

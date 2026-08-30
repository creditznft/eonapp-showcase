/**
 * W413 — finite EON Signal Expeditions.
 *
 * These are local, project-linked visual planning sessions launched from the
 * canonical Babylon City. They use authored templates and bounded set pieces;
 * they are not an open world, provider runtime, sync feature, publishing tool,
 * collaboration room, reward loop, or remote project reader.
 */
export const EON_SIGNAL_EXPEDITIONS_SCHEMA = 'eon.city.signal-expeditions.w413.v1';
export const EON_SIGNAL_EXPEDITION_SESSION_KEY = 'eon:city:signal-expedition:v1';
export const EON_SIGNAL_EXPEDITION_MAX_AGE_MS = 15 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const MAX_LABEL = 96;
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|ghp|gho)_[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;

const template = (value) => freeze({
  ...value,
  setPieces: freeze(value.setPieces.map((piece) => freeze({ ...piece }))),
  missions: freeze(value.missions.map((mission) => freeze({ ...mission }))),
  destination: freeze({ ...value.destination })
});

export const EON_SIGNAL_EXPEDITION_TEMPLATES = freeze([
  template({
    id: 'campaign-media-district',
    projectType: 'campaign',
    title: 'Media District',
    durationMinutes: 8,
    accent: '#6ee7f9',
    description: 'Shape a campaign direction through a finite media block, then continue in Creator tools.',
    destination: { route: '/workspace#creator-engine', label: 'Creator Engine' },
    setPieces: [
      { id: 'signal-marquee', label: 'Signal Marquee', role: 'Frame the public-safe message.' },
      { id: 'storyboard-alley', label: 'Storyboard Alley', role: 'Choose a short visual sequence.' },
      { id: 'share-arcade', label: 'Share Arcade', role: 'Prepare a draft, export, or native share only.' }
    ],
    missions: [
      { id: 'define-message', label: 'Define one useful message' },
      { id: 'choose-format', label: 'Choose one creator format' },
      { id: 'continue-native', label: 'Continue in Creator Engine' }
    ]
  }),
  template({
    id: 'forge-build-citadel',
    projectType: 'forge',
    title: 'Build Citadel',
    durationMinutes: 10,
    accent: '#a5b4fc',
    description: 'Walk a finite build route, clarify the first useful outcome, then open Forge by choice.',
    destination: { route: '/forge', label: 'Forge' },
    setPieces: [
      { id: 'blueprint-gate', label: 'Blueprint Gate', role: 'Name the first user-visible outcome.' },
      { id: 'component-court', label: 'Component Court', role: 'Choose a small build slice.' },
      { id: 'launch-bridge', label: 'Launch Bridge', role: 'Open Forge only when you are ready.' }
    ],
    missions: [
      { id: 'name-outcome', label: 'Name the first useful outcome' },
      { id: 'choose-slice', label: 'Choose one build slice' },
      { id: 'continue-native', label: 'Continue in Forge' }
    ]
  }),
  template({
    id: 'video-cinematic-studio',
    projectType: 'video',
    title: 'Cinematic Studio',
    durationMinutes: 7,
    accent: '#f9a8d4',
    description: 'Create a bounded video-plan route with no media upload, generation, or publishing claim.',
    destination: { route: '/workspace#creator-engine', label: 'Creator Engine' },
    setPieces: [
      { id: 'hook-stage', label: 'Hook Stage', role: 'Pick the opening beat.' },
      { id: 'cut-lane', label: 'Cut Lane', role: 'Choose a concise sequence.' },
      { id: 'preview-balcony', label: 'Preview Balcony', role: 'Prepare a shareable planning postcard.' }
    ],
    missions: [
      { id: 'pick-hook', label: 'Pick one opening hook' },
      { id: 'outline-beats', label: 'Outline three short beats' },
      { id: 'continue-native', label: 'Continue in Creator Engine' }
    ]
  }),
  template({
    id: 'automation-data-observatory',
    projectType: 'automation',
    title: 'Data Observatory',
    durationMinutes: 9,
    accent: '#86efac',
    description: 'Review a finite automation planning route. Nothing runs, schedules, or connects from City.',
    destination: { route: '/automations', label: 'Automation review' },
    setPieces: [
      { id: 'signal-console', label: 'Signal Console', role: 'Describe the trigger at a high level.' },
      { id: 'review-orbit', label: 'Review Orbit', role: 'Choose a human approval checkpoint.' },
      { id: 'handoff-terminal', label: 'Handoff Terminal', role: 'Open Automation review by choice.' }
    ],
    missions: [
      { id: 'name-trigger', label: 'Name one safe trigger' },
      { id: 'set-review', label: 'Set an approval checkpoint' },
      { id: 'continue-native', label: 'Continue in Automation review' }
    ]
  })
]);

const TEMPLATE_BY_ID = new Map(EON_SIGNAL_EXPEDITION_TEMPLATES.map((entry) => [entry.id, entry]));
const DESTINATIONS = new Set(EON_SIGNAL_EXPEDITION_TEMPLATES.map((entry) => entry.destination.route));

function clean(value = '', limit = MAX_LABEL) {
  const text = Array.from(String(value ?? ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_LIKE.test(text)) throw new Error('Remove credentials, private links, recovery material, or secret-like text before starting an expedition.');
  return text;
}

function toNow(value = Date.now()) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Date.now();
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sessionId(now = Date.now()) {
  let random = '';
  try {
    const bytes = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(bytes);
    random = bytes[0].toString(36);
  } catch {}
  if (!random) random = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `signal-expedition-${Number(now).toString(36)}-${random}`.slice(0, 96);
}

export function getSignalExpeditionTemplate(templateId = '') {
  return TEMPLATE_BY_ID.get(String(templateId || '').trim()) || null;
}

export function getSignalExpeditionTemplates() {
  return EON_SIGNAL_EXPEDITION_TEMPLATES;
}

export function createSignalExpeditionSession(input = {}, { now = Date.now() } = {}) {
  if (input?.explicitUserAction !== true) throw new Error('Starting a Signal Expedition requires a visible user action.');
  const templateEntry = getSignalExpeditionTemplate(input?.templateId);
  if (!templateEntry) throw new Error('Choose a valid Signal Expedition template.');
  const projectLabel = clean(input?.projectLabel || '', MAX_LABEL) || `${templateEntry.title} local project`;
  const createdAt = toNow(now);
  const seed = stableHash(`${templateEntry.id}\u001f${projectLabel}\u001f${createdAt}`);
  return freeze({
    schema: EON_SIGNAL_EXPEDITIONS_SCHEMA,
    id: sessionId(createdAt),
    templateId: templateEntry.id,
    projectType: templateEntry.projectType,
    title: templateEntry.title,
    projectLabel,
    seed,
    createdAt,
    expiresAt: createdAt + EON_SIGNAL_EXPEDITION_MAX_AGE_MS,
    durationMinutes: templateEntry.durationMinutes,
    destination: freeze({ ...templateEntry.destination }),
    setPieces: freeze(templateEntry.setPieces.map((piece, index) => freeze({ ...piece, variation: stableHash(`${seed}:${index}`).slice(0, 6) }))),
    missions: freeze(templateEntry.missions.map((mission, index) => freeze({ ...mission, state: index === 0 ? 'ready' : 'locked' }))),
    state: 'draft',
    completedMissionIds: freeze([]),
    boundary: freeze({
      localOnly: true,
      browserSessionOnly: true,
      finite: true,
      authoredTemplate: true,
      projectRead: false,
      projectWrite: false,
      providerRequest: false,
      externalExecution: false,
      directPublishing: false,
      socialConnection: false,
      collaborationPresence: false,
      tracking: false,
      referralReward: false,
      wallet: false,
      payment: false,
      userContentBeyondLocalLabel: false
    })
  });
}

export function recordSignalExpeditionMission(session = {}, missionId = '', { explicitUserAction = false, now = Date.now() } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit_user_action_required', session: null });
  const validation = validateSignalExpeditionSession(session, { now, allowExpired: true });
  if (!validation.ok) return freeze({ ok: false, reason: 'invalid_session', session: null });
  const mission = session.missions.find((entry) => entry.id === String(missionId || '').trim());
  if (!mission) return freeze({ ok: false, reason: 'unknown_mission', session: null });
  const done = new Set(session.completedMissionIds || []);
  done.add(mission.id);
  const completedMissionIds = session.missions.filter((entry) => done.has(entry.id)).map((entry) => entry.id);
  const complete = completedMissionIds.length === session.missions.length;
  return freeze({
    ok: true,
    reason: null,
    session: freeze({
      ...session,
      state: complete ? 'complete' : 'active',
      completedMissionIds: freeze(completedMissionIds),
      missions: freeze(session.missions.map((entry, index) => freeze({
        ...entry,
        state: done.has(entry.id) ? 'complete' : (index === completedMissionIds.length ? 'ready' : 'locked')
      }))),
      lastObservedAt: toNow(now)
    })
  });
}

export function buildSignalExpeditionPostcard(session = {}) {
  const validation = validateSignalExpeditionSession(session, { allowExpired: true });
  if (!validation.ok) throw new Error('A valid local Signal Expedition is required before creating a postcard.');
  const templateEntry = getSignalExpeditionTemplate(session.templateId);
  const complete = session.state === 'complete';
  return freeze({
    origin: 'city-expedition',
    title: `${templateEntry.title} · ${session.projectLabel}`.slice(0, 120),
    audience: 'Creators and builders who want a finite, useful project starting point.',
    usefulOutcome: complete
      ? `A completed local ${templateEntry.title} planning route with a clear next step in ${templateEntry.destination.label}.`
      : `A local ${templateEntry.title} planning route ready to continue in ${templateEntry.destination.label}.`,
    firstRemixStep: `Choose your own project outcome, then start with the first ${templateEntry.missions[0].label.toLowerCase()}.`,
    remixKind: 'city-postcard',
    explicitUserAction: true,
    boundary: freeze({ browserSessionOnly: true, projectContent: false, files: false, media: false, credentials: false, publicLink: false, posting: false, tracking: false, reward: false })
  });
}

export function validateSignalExpeditionSession(candidate = {}, { now = Date.now(), allowExpired = false } = {}) {
  const errors = [];
  const value = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const templateEntry = getSignalExpeditionTemplate(value.templateId);
  if (value.schema !== EON_SIGNAL_EXPEDITIONS_SCHEMA) errors.push('Unexpected Signal Expedition schema.');
  if (!templateEntry) errors.push('Unknown Signal Expedition template.');
  if (!/^signal-expedition-[a-z0-9-]{8,96}$/i.test(String(value.id || ''))) errors.push('Signal Expedition ID is invalid.');
  try { if (!clean(value.projectLabel, MAX_LABEL)) errors.push('Project label is required.'); } catch { errors.push('Project label is unsafe.'); }
  if (!/^[a-z0-9]{4,16}$/i.test(String(value.seed || ''))) errors.push('Signal Expedition seed is invalid.');
  const createdAt = Number(value.createdAt);
  const expiresAt = Number(value.expiresAt);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt - createdAt !== EON_SIGNAL_EXPEDITION_MAX_AGE_MS) errors.push('Signal Expedition lifetime is invalid.');
  if (!allowExpired && Number.isFinite(expiresAt) && expiresAt < toNow(now)) errors.push('Signal Expedition has expired.');
  if (!DESTINATIONS.has(String(value.destination?.route || ''))) errors.push('Signal Expedition destination is not allowlisted.');
  if (value.boundary?.localOnly !== true || value.boundary?.browserSessionOnly !== true || value.boundary?.finite !== true || value.boundary?.providerRequest !== false || value.boundary?.externalExecution !== false || value.boundary?.directPublishing !== false || value.boundary?.tracking !== false || value.boundary?.referralReward !== false) errors.push('Signal Expedition boundary is invalid.');
  const publicFields = JSON.stringify({
    projectLabel: value.projectLabel,
    destination: value.destination,
    setPieces: value.setPieces,
    missions: value.missions
  });
  if (/https?:\/\/|provider[_-]?key|access[_-]?token|vault|wallet|payment|reward|referral/i.test(publicFields)) errors.push('Signal Expedition contains forbidden remote, economic, or sensitive data.');
  return freeze({ schema: EON_SIGNAL_EXPEDITIONS_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true, finite: true });
}

export function saveSignalExpeditionSession(session = {}) {
  const validation = validateSignalExpeditionSession(session);
  if (!validation.ok) return freeze({ ok: false, reason: validation.errors[0] || 'invalid_session' });
  try {
    globalThis.sessionStorage?.setItem(EON_SIGNAL_EXPEDITION_SESSION_KEY, JSON.stringify(session));
    return freeze({ ok: true, session: freeze({ ...session }) });
  } catch { return freeze({ ok: false, reason: 'browser_session_storage_unavailable' }); }
}

export function readSignalExpeditionSession({ now = Date.now() } = {}) {
  try {
    const value = JSON.parse(globalThis.sessionStorage?.getItem(EON_SIGNAL_EXPEDITION_SESSION_KEY) || 'null');
    if (!validateSignalExpeditionSession(value, { now }).ok) {
      globalThis.sessionStorage?.removeItem(EON_SIGNAL_EXPEDITION_SESSION_KEY);
      return null;
    }
    return freeze({ ...value, completedMissionIds: freeze([...(value.completedMissionIds || [])]), missions: freeze((value.missions || []).map((mission) => freeze({ ...mission }))) });
  } catch { return null; }
}

export function clearSignalExpeditionSession() {
  try { globalThis.sessionStorage?.removeItem(EON_SIGNAL_EXPEDITION_SESSION_KEY); return freeze({ ok: true }); }
  catch { return freeze({ ok: false, reason: 'browser_session_storage_unavailable' }); }
}

export function getSignalExpeditionTruth() {
  return freeze({
    schema: EON_SIGNAL_EXPEDITIONS_SCHEMA,
    localOnly: true,
    browserSessionOnly: true,
    finiteTemplates: true,
    authoredSetPieces: true,
    projectRead: false,
    projectWrite: false,
    providerRequest: false,
    externalExecution: false,
    directPublishing: false,
    socialConnection: false,
    collaborationPresence: false,
    tracking: false,
    referralReward: false,
    wallet: false,
    payment: false,
    remoteAssetDownload: false,
    finalVisualCertification: false
  });
}

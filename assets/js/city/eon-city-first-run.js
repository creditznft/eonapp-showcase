/**
 * W479-A — EON City first-run orientation.
 *
 * This is a tiny local-only guide for a new City visitor. It intentionally
 * stores no typed request, account data, device fingerprint, media, model,
 * provider or social-account information. A path is always opened only after
 * the person presses its own button.
 */
export const EON_CITY_FIRST_RUN_SCHEMA = 'eon.city.first-run.w479.v1';
export const EON_CITY_FIRST_RUN_STORAGE_KEY = 'eon:city:first-run:w479:v1';

const freeze = (value) => Object.freeze(value);
const VALID_STATUS = new Set(['new', 'dismissed', 'selected']);

export const EON_CITY_FIRST_RUN_PATHS = freeze([
  freeze({
    id: 'plan-project',
    label: 'Plan a project',
    detail: 'Start a clear task with EONBOT, then return to City whenever you want.',
    route: '/?new=1',
    category: 'chat'
  }),
  freeze({
    id: 'create-post',
    label: 'Make creator content',
    detail: 'Open Creator Engine to prepare an image, video, voice or campaign brief.',
    route: '/workspace#creator-engine',
    category: 'creator'
  }),
  freeze({
    id: 'set-up-local-ai',
    label: 'Make Local AI ready',
    detail: 'Use the same device-aware Local AI setup as Chat: Local Lite on compatible browsers or a verified desktop runtime. Nothing installs or switches provider automatically.',
    route: '/local-ai#eonbot-local-ai-setup',
    category: 'local-ai'
  })
]);

const PATH_BY_ID = new Map(EON_CITY_FIRST_RUN_PATHS.map((path) => [path.id, path]));

function storageFor(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeIso(now = Date.now()) {
  const parsed = new Date(Number(now));
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function normalize(record = {}) {
  const status = VALID_STATUS.has(String(record?.status || '')) ? String(record.status) : 'new';
  const selectedPathId = PATH_BY_ID.has(String(record?.selectedPathId || '')) ? String(record.selectedPathId) : null;
  const dismissedAt = typeof record?.dismissedAt === 'string' ? record.dismissedAt : null;
  const selectedAt = typeof record?.selectedAt === 'string' ? record.selectedAt : null;
  return freeze({
    schema: EON_CITY_FIRST_RUN_SCHEMA,
    status: status === 'selected' && !selectedPathId ? 'new' : status,
    selectedPathId,
    dismissedAt,
    selectedAt,
    localOnly: true,
    typedContentStored: false,
    providerCall: false,
    socialAccount: false
  });
}

export function getEonCityFirstRunPath(pathId = '') {
  return PATH_BY_ID.get(String(pathId || '').trim()) || null;
}

export function readEonCityFirstRun({ storage } = {}) {
  const resolved = storageFor(storage);
  try {
    return normalize(JSON.parse(resolved?.getItem(EON_CITY_FIRST_RUN_STORAGE_KEY) || '{}'));
  } catch {
    return normalize();
  }
}

function write(record, { storage } = {}) {
  const normalized = normalize(record);
  try {
    storageFor(storage)?.setItem(EON_CITY_FIRST_RUN_STORAGE_KEY, JSON.stringify(normalized));
    return freeze({ ok: true, record: normalized });
  } catch {
    return freeze({ ok: false, record: normalized });
  }
}

export function dismissEonCityFirstRun({ storage, now = Date.now() } = {}) {
  return write({ ...readEonCityFirstRun({ storage }), status: 'dismissed', dismissedAt: safeIso(now), selectedPathId: null, selectedAt: null }, { storage });
}

export function selectEonCityFirstRunPath(pathId = '', { storage, now = Date.now() } = {}) {
  const path = getEonCityFirstRunPath(pathId);
  if (!path) return freeze({ ok: false, reason: 'unknown-path', path: null, record: readEonCityFirstRun({ storage }) });
  const result = write({ ...readEonCityFirstRun({ storage }), status: 'selected', selectedPathId: path.id, selectedAt: safeIso(now), dismissedAt: null }, { storage });
  return freeze({ ok: result.ok, reason: result.ok ? null : 'storage-unavailable', path: freeze({ ...path }), record: result.record });
}

export function validateEonCityFirstRunPaths(paths = EON_CITY_FIRST_RUN_PATHS) {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  for (const path of Array.isArray(paths) ? paths : []) {
    const id = String(path?.id || '');
    const route = String(path?.route || '');
    if (!/^[a-z0-9-]{3,32}$/.test(id)) errors.push(`Invalid City first-run path id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate City first-run path id: ${id}`);
    ids.add(id);
    if (!['/?new=1', '/workspace#creator-engine', '/local-ai#eonbot-local-ai-setup'].includes(route)) errors.push(`Unsafe City first-run route: ${route || '(empty)'}`);
    if (routes.has(route)) errors.push(`Duplicate City first-run route: ${route}`);
    routes.add(route);
    if (!String(path?.label || '').trim() || !String(path?.detail || '').trim()) errors.push(`Incomplete City first-run path: ${id || '(empty)'}`);
  }
  if (!Array.isArray(paths) || paths.length !== 3) errors.push('City first-run guide must keep exactly three simple choices.');
  const serialized = JSON.stringify(paths || []);
  if (/https?:\/\/|oauth|token|payment|wallet|reward|referral|publish|schedule|api[-_ ]?key|credential/i.test(serialized)) {
    errors.push('City first-run guide contains a forbidden external, account, publishing, value or credential surface.');
  }
  return freeze({ schema: EON_CITY_FIRST_RUN_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true, explicitNavigation: true });
}


/**
 * W592 — first-run native destination review.
 *
 * A City orientation choice is not a route command. The City presents a local
 * review first, then the person must choose the visible native-destination
 * confirmation. This keeps first-run behaviour aligned with every other City
 * exit and avoids a “one accidental tap leaves the world” experience.
 */
export const EON_CITY_FIRST_RUN_REVIEW_SCHEMA = 'eon.city.first-run.review.w592.v1';

export function createEonCityFirstRunPathReview(pathId = '') {
  const path = getEonCityFirstRunPath(pathId);
  if (!path) {
    return freeze({
      schema: EON_CITY_FIRST_RUN_REVIEW_SCHEMA,
      ok: false,
      reason: 'unknown-path',
      path: null,
      route: null,
      confirmationRequired: true,
      autoNavigation: false,
      localOnly: true
    });
  }
  return freeze({
    schema: EON_CITY_FIRST_RUN_REVIEW_SCHEMA,
    ok: true,
    reason: null,
    path: freeze({ ...path }),
    route: path.route,
    confirmationRequired: true,
    autoNavigation: false,
    localOnly: true,
    createsWork: false,
    providerCall: false,
    readsPrivateData: false
  });
}

export function validateEonCityFirstRunPathReview(review = {}) {
  const errors = [];
  if (!review || typeof review !== 'object') return freeze(['review must be an object']);
  if (review.schema !== EON_CITY_FIRST_RUN_REVIEW_SCHEMA) errors.push('review schema mismatch');
  if (review.confirmationRequired !== true) errors.push('first-run review must require a visible confirmation');
  if (review.autoNavigation !== false) errors.push('first-run review must never auto-navigate');
  if (review.localOnly !== true) errors.push('first-run review must remain local-only');
  if (review.ok) {
    const path = getEonCityFirstRunPath(review.path?.id || '');
    if (!path) errors.push('review path is unknown');
    if (review.route !== path?.route) errors.push('review route must match the approved City path');
    if (review.createsWork !== false || review.providerCall !== false || review.readsPrivateData !== false) errors.push('first-run review broadened beyond safe City navigation');
  }
  return freeze(errors);
}

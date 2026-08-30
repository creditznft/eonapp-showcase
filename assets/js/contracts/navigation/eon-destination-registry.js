/** A15 I04 — one current destination authority for explicit EONAPP navigation. */

export const EON_DESTINATION_REGISTRY_SCHEMA = 'eonapp.destination-registry.a15.v1';

const freeze = (value) => Object.freeze(value);
const rows = [
  ['home', '/', 'EONBOT', ['new', 'thread', 'support', 'topic', 'detail', 'handoff']],
  ['create', '/create', 'Create', ['mode', 'handoff']],
  ['projects', '/projects', 'Projects', ['new', 'create', 'project', 'cityMission', 'handoff']],
  ['library', '/library', 'Library', ['creator', 'handoff']],
  ['workspace', '/workspace', 'Workspace', ['project', 'handoff']],
  ['forge', '/forge', 'Forge', ['project', 'handoff']],
  ['vault', '/vault', 'Vault', ['handoff']],
  ['capsule', '/capsule', 'Data Survival', ['handoff']],
  ['automations', '/automations', 'Automations', ['project', 'handoff']],
  ['local-ai', '/local-ai', 'Local AI', ['creator', 'handoff']],
  ['help', '/help', 'Help and Support', ['topic', 'caseCategory', 'handoff']],
  ['status', '/status', 'Service Status', []],
  ['profile', '/profile', 'Profile', ['handoff']],
  ['settings', '/settings', 'Settings', ['handoff']],
  ['billing', '/billing', 'Billing and Plans', ['handoff']],
  ['eon-keys', '/eon-keys', 'EON Keys', ['handoff']],
  ['realm-studio', '/realm-studio', 'Realm Studio', ['handoff']],
  ['eoncity', '/eoncity', 'EONCITY', ['resume', 'from', 'cityMission', 'handoff', 'returnReceipt']]
];

export const EON_DESTINATIONS = freeze(rows.map(([id, route, label, queryKeys]) => freeze({
  schema: EON_DESTINATION_REGISTRY_SCHEMA,
  id,
  route,
  label,
  queryKeys: freeze(queryKeys),
  explicitNavigation: true,
  automaticExecution: false
})));

const byId = new Map(EON_DESTINATIONS.map((row) => [row.id, row]));
const byRoute = new Map(EON_DESTINATIONS.map((row) => [row.route, row]));
const clean = (value = '', max = 240) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

export function getEonDestination(id = '') {
  return byId.get(clean(id, 80).toLowerCase()) || null;
}

export function findEonDestinationByRoute(value = '') {
  try {
    const url = new URL(String(value || '/'), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid') return null;
    return byRoute.get(url.pathname.replace(/\/$/, '') || '/') || null;
  } catch { return null; }
}

export function buildEonDestinationHref(id = '', query = {}) {
  const destination = getEonDestination(id);
  if (!destination) return '';
  const url = new URL(destination.route, 'https://eonapp.invalid');
  const allowed = new Set(destination.queryKeys);
  for (const [key, raw] of Object.entries(query || {})) {
    if (!allowed.has(key) || raw === undefined || raw === null || raw === '') continue;
    const value = clean(raw, 300);
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export function resolveEonDestination(value = '', query = {}) {
  const destination = getEonDestination(value) || findEonDestinationByRoute(value);
  if (!destination) return freeze({ ok: false, reason: 'destination-not-registered', destination: null, href: '' });
  return freeze({ ok: true, reason: '', destination, href: buildEonDestinationHref(destination.id, query) });
}

export function validateEonDestinationRegistry() {
  const errors = [];
  if (new Set(EON_DESTINATIONS.map((row) => row.id)).size !== EON_DESTINATIONS.length) errors.push('duplicate-destination-id');
  if (new Set(EON_DESTINATIONS.map((row) => row.route)).size !== EON_DESTINATIONS.length) errors.push('duplicate-destination-route');
  if (!getEonDestination('home') || !getEonDestination('projects') || !getEonDestination('eoncity')) errors.push('required-destination-missing');
  if (EON_DESTINATIONS.some((row) => !row.route.startsWith('/') || row.route.includes('://'))) errors.push('external-or-invalid-route');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), destinationCount: EON_DESTINATIONS.length });
}

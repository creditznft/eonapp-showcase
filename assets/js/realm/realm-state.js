/**
 * W232 — My Realm local return loop.
 *
 * A Realm is a private City district and portable identity. The local state
 * contains only safe presentation choices and local-return metadata. It does
 * not create a public store, seller account, payment path, commission ledger,
 * reward balance, payout, attribution record, or server-side account.
 */
import { bindCityRealm } from '../contracts/city/city-world-state.js';
import { getOrCreateRealmPublicId } from '../utils/realm-share-runtime.js';
import { normalizeRealmHandle } from '../utils/signed-share-link.js';

export const MY_REALM_STATE_VERSION = 3;
export const MY_REALM_STATE_KEY = 'eon:realm:state:v3';
export const MY_REALM_LEGACY_KEYS = Object.freeze(['eon:realm:profile:v2']);
export const MY_REALM_THEMES = Object.freeze([
  Object.freeze({ id: 'graphite', label: 'Graphite' }),
  Object.freeze({ id: 'obsidian', label: 'Obsidian' }),
  Object.freeze({ id: 'ember', label: 'Ember' })
]);
export const MY_REALM_LAYOUTS = Object.freeze([
  Object.freeze({ id: 'command-loft', label: 'Command Loft', note: 'A focused cockpit for active projects, EONBOT and command status.' }),
  Object.freeze({ id: 'creator-studio', label: 'Creator Studio', note: 'A visual workspace for Create, Forge, Library and Creator Capture.' }),
  Object.freeze({ id: 'archive-retreat', label: 'Archive Retreat', note: 'A calm research room for Library, Research, Help and reflection.' })
]);
export const MY_REALM_SHORTCUTS = Object.freeze([
  Object.freeze({ id: 'eonbot', label: 'EONBOT', surface: 'chat' }),
  Object.freeze({ id: 'create', label: 'Create', surface: 'create' }),
  Object.freeze({ id: 'projects', label: 'Projects', surface: 'projects' }),
  Object.freeze({ id: 'library', label: 'Library', surface: 'library' }),
  Object.freeze({ id: 'capture', label: 'Creator Capture', surface: 'creator-capture' }),
  Object.freeze({ id: 'share', label: 'Share', surface: 'share' }),
  Object.freeze({ id: 'automations', label: 'Automations', surface: 'automations' }),
  Object.freeze({ id: 'local-ai', label: 'Local AI', surface: 'local-ai' })
]);
export const MY_REALM_LANDMARKS = Object.freeze([
  Object.freeze({ id: 'observatory', label: 'Sky Observatory', note: 'A quiet signal tower and moonlit terrace.' }),
  Object.freeze({ id: 'garden', label: 'Circuit Garden', note: 'A luminous courtyard with calm growing forms.' }),
  Object.freeze({ id: 'gallery', label: 'Preview Gallery', note: 'A private wall for locally generated moodboard work.' }),
  Object.freeze({ id: 'workshop', label: 'Maker Workshop', note: 'A compact build bay for projects and prototypes.' }),
  Object.freeze({ id: 'sanctum', label: 'Quiet Sanctum', note: 'A minimal refuge for reflection and return.' })
]);
export const MY_REALM_ENTRY_DISTRICTS = Object.freeze([
  'realm', 'command', 'workspace', 'market', 'library', 'trade', 'vault'
]);

const MAX_SHOWCASE_REFS = 4;
const MAX_REALM_SHORTCUTS = 4;
const SAFE_FEATURED_TYPE = new Set(['project', 'library', 'creation']);
const MAX_RETURN_COUNT = 9999;
const SAFE_PREVIEW_REF = /^private-v3-[a-z0-9-]{4,120}$/i;
const RESERVED_HANDLES = new Set(['admin', 'administrator', 'eonapp', 'eonbot', 'official', 'support', 'staff', 'moderator', 'security', 'billing', 'vault']);
const DANGEROUS_PUBLIC_PATTERN = /(seed\s*phrase|mnemonic|private\s*key|api[-_\s]?key|password|recovery\s*code|wallet\s*(?:address|key)|0x[a-f0-9]{40}|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b)/i;
const RETURN_INTENTS = new Set(['realm-studio', 'city-return', 'eonbot-city-return', 'manual']);

function getStorage(storage) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readRaw(storage, key) {
  try { return storage?.getItem(key) || null; } catch { return null; }
}

function writeRaw(storage, key, value) {
  try { storage?.setItem(key, value); return true; } catch { return false; }
}

function parse(value) {
  if (!value || String(value).length > 28000) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function iso(now = Date.now()) {
  return new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now()).toISOString();
}

function cleanText(value, fallback = '', max = 48) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output || fallback;
}

function cleanHandle(value, fallback = 'my-eon-realm') {
  try {
    const normalized = normalizeRealmHandle(String(value || fallback));
    return normalized || fallback;
  } catch {
    return fallback;
  }
}

function getProfileSeed(storage) {
  const profile = parse(readRaw(storage, 'eon:profile:v1')) || parse(readRaw(storage, 'eon:profile')) || {};
  const label = cleanText(profile.displayName || profile.alias || profile.username, 'My EON Realm', 48);
  const candidate = cleanText(profile.username || profile.alias, 'my-eon-realm', 48)
    .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)/g, '');
  return { label, handle: cleanHandle(candidate || 'my-eon-realm') };
}

function normalizeShowcaseRefs(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const refs = [];
  for (const entry of value) {
    const id = String(entry || '').trim();
    if (!SAFE_PREVIEW_REF.test(id) || seen.has(id)) continue;
    seen.add(id);
    refs.push(id);
    if (refs.length >= MAX_SHOWCASE_REFS) break;
  }
  return refs;
}

function normalizeLayout(value) {
  const candidate = String(value || '');
  return MY_REALM_LAYOUTS.some((layout) => layout.id === candidate) ? candidate : 'command-loft';
}

function normalizeShortcuts(value, layout = 'command-loft') {
  const defaults = layout === 'creator-studio'
    ? ['create', 'projects', 'capture', 'share']
    : layout === 'archive-retreat'
      ? ['library', 'projects', 'eonbot', 'share']
      : ['eonbot', 'projects', 'create', 'library'];
  const source = Array.isArray(value) ? value : defaults;
  const allowed = new Set(MY_REALM_SHORTCUTS.map((entry) => entry.id));
  const seen = new Set();
  const result = [];
  for (const entry of source) {
    const id = String(entry || '').trim().toLowerCase();
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= MAX_REALM_SHORTCUTS) break;
  }
  return result.length ? result : defaults.slice(0, MAX_REALM_SHORTCUTS);
}

function publicFeaturedItem(value) {
  if (!value) return null;
  return Object.freeze({ type: value.type, title: value.title });
}

function normalizeFeaturedItem(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const type = SAFE_FEATURED_TYPE.has(String(source.type || '').toLowerCase()) ? String(source.type).toLowerCase() : '';
  const id = cleanText(source.id, '', 96);
  const title = cleanText(source.title, '', 80);
  if (!type || !id || !title || DANGEROUS_PUBLIC_PATTERN.test(title)) return null;
  return Object.freeze({ type, id, title });
}

function normalizeLandmark(value) {
  const candidate = String(value || '');
  return MY_REALM_LANDMARKS.some((landmark) => landmark.id === candidate) ? candidate : 'observatory';
}

function normalizeReturnLoop(value, now = Date.now()) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const count = Math.min(MAX_RETURN_COUNT, Math.max(0, Math.floor(Number(source.returnCount || 0) || 0)));
  const lastReturnedAt = typeof source.lastReturnedAt === 'string' && source.lastReturnedAt.length <= 40
    ? source.lastReturnedAt
    : null;
  const intent = RETURN_INTENTS.has(String(source.lastIntent || '')) ? String(source.lastIntent) : null;
  return Object.freeze({
    returnCount: count,
    lastReturnedAt,
    lastIntent: intent,
    updatedAt: typeof source.updatedAt === 'string' && source.updatedAt.length <= 40 ? source.updatedAt : iso(now)
  });
}

export function reviewRealmPublicMetadata({ label = '', handle = '' } = {}) {
  const issues = [];
  const cleanLabel = cleanText(label, '', 48);
  const cleanHandleValue = cleanHandle(handle || 'my-eon-realm');
  if (!cleanLabel) issues.push('Enter a Realm label.');
  if (DANGEROUS_PUBLIC_PATTERN.test(cleanLabel) || DANGEROUS_PUBLIC_PATTERN.test(cleanHandleValue)) {
    issues.push('Remove credentials, wallet material, personal contact details, payment requests, or recovery information before sharing.');
  }
  if (RESERVED_HANDLES.has(cleanHandleValue)) {
    issues.push('Choose a handle that does not impersonate EONAPP, support, staff, or an official service.');
  }
  if (/^(?:eonapp|official|support|admin|staff)[-_]/i.test(cleanHandleValue)) {
    issues.push('Choose a handle that does not imply official EONAPP ownership or support.');
  }
  return Object.freeze({
    ok: issues.length === 0,
    issues,
    label: cleanLabel,
    handle: cleanHandleValue,
    reportPath: '/support?topic=public-realm',
    publicPublishingActive: false,
    note: 'Public publishing, marketplace placement, commissions, payouts, and seller tools are not active.'
  });
}

function normalizeTheme(value) {
  const candidate = String(value || '').trim().toLowerCase();
  if (MY_REALM_THEMES.some((theme) => theme.id === candidate)) return candidate;
  if (['dark-purple', 'neon-city', 'aurora', 'forest-circuit', 'minimal', 'neon-night'].includes(candidate)) return 'graphite';
  return 'graphite';
}

function normalizeEntryDistrict(value) {
  const candidate = String(value || '');
  return MY_REALM_ENTRY_DISTRICTS.includes(candidate) ? candidate : 'realm';
}

export function createMyRealmState({ storage, now = Date.now(), input = {} } = {}) {
  const resolvedStorage = getStorage(storage);
  const seed = getProfileSeed(resolvedStorage);
  const handle = cleanHandle(input.handle || input.username || seed.handle);
  const label = cleanText(input.label || input.displayName || seed.label, seed.label, 48);
  const id = getOrCreateRealmPublicId({ username: handle, publicRealmId: input.id || input.publicRealmId || '' });
  const review = reviewRealmPublicMetadata({ label, handle });
  return {
    version: MY_REALM_STATE_VERSION,
    id,
    label: review.label || label,
    handle: review.handle,
    theme: normalizeTheme(input.theme),
    layout: normalizeLayout(input.layout),
    shortcuts: normalizeShortcuts(input.shortcuts, normalizeLayout(input.layout)),
    featuredItem: normalizeFeaturedItem(input.featuredItem),
    companionPlacement: cleanText(input.companionPlacement, 'near-dock', 24),
    landmark: normalizeLandmark(input.landmark || input.landmarkStyle),
    entryDistrict: normalizeEntryDistrict(input.entryDistrict),
    showcaseRefs: normalizeShowcaseRefs(input.showcaseRefs),
    returnLoop: normalizeReturnLoop(input.returnLoop, now),
    safety: {
      reviewStatus: review.ok ? 'ready-for-portable-identity-share' : 'needs-review',
      issues: review.issues,
      reportPath: review.reportPath,
      publicPublishingActive: false,
      officialMarketPlacementActive: false,
      affiliateActive: false,
      payoutActive: false,
      reviewedAt: iso(now)
    },
    createdAt: cleanText(input.createdAt, iso(now), 40),
    updatedAt: iso(now)
  };
}

export function normalizeMyRealmState(value, options = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return createMyRealmState({
    ...options,
    input: {
      id: source.id || source.publicRealmId,
      label: source.label || source.displayName,
      handle: source.handle || source.username,
      theme: source.theme,
      layout: source.layout,
      shortcuts: source.shortcuts,
      featuredItem: source.featuredItem,
      companionPlacement: source.companionPlacement,
      landmark: source.landmark || source.landmarkStyle,
      entryDistrict: source.entryDistrict,
      showcaseRefs: source.showcaseRefs,
      returnLoop: source.returnLoop,
      createdAt: source.createdAt
    }
  });
}

export function readMyRealmState({ storage, now = Date.now() } = {}) {
  const resolvedStorage = getStorage(storage);
  const current = parse(readRaw(resolvedStorage, MY_REALM_STATE_KEY));
  if (current) {
    return { state: normalizeMyRealmState(current, { storage: resolvedStorage, now }), source: 'current', migrated: Number(current.version || 0) < MY_REALM_STATE_VERSION, created: false, preservedLegacySource: false };
  }
  for (const key of MY_REALM_LEGACY_KEYS) {
    const legacy = parse(readRaw(resolvedStorage, key));
    if (!legacy) continue;
    return { state: normalizeMyRealmState(legacy, { storage: resolvedStorage, now }), source: key, migrated: true, created: false, preservedLegacySource: true };
  }
  return { state: createMyRealmState({ storage: resolvedStorage, now }), source: 'default', migrated: false, created: true, preservedLegacySource: false };
}

export function persistMyRealmState(value, { storage, now = Date.now(), bindCity = true } = {}) {
  const resolvedStorage = getStorage(storage);
  const state = normalizeMyRealmState(value, { storage: resolvedStorage, now });
  const ok = writeRaw(resolvedStorage, MY_REALM_STATE_KEY, JSON.stringify(state));
  const city = bindCity
    ? bindCityRealm({ id: state.id, theme: state.theme, landmarkStyle: state.landmark, entryDistrict: state.entryDistrict }, { storage: resolvedStorage, now })
    : null;
  return { ok, state, key: MY_REALM_STATE_KEY, city };
}

export function ensureMyRealmState(options = {}) {
  const loaded = readMyRealmState(options);
  const saved = persistMyRealmState(loaded.state, options);
  return { ...loaded, ...saved };
}

export function updateMyRealmState(updater, options = {}) {
  const loaded = ensureMyRealmState(options);
  const next = typeof updater === 'function' ? updater(loaded.state) : loaded.state;
  const saved = persistMyRealmState(next, options);
  return { ...loaded, ...saved };
}

export function updateMyRealmShowcase(refs = [], options = {}) {
  return updateMyRealmState((state) => ({ ...state, showcaseRefs: normalizeShowcaseRefs(refs) }), options);
}

/** Records an explicit local return. It never creates a reward, entitlement, or server event. */
export function recordMyRealmReturn({ intent = 'manual' } = {}, options = {}) {
  const resolvedIntent = RETURN_INTENTS.has(String(intent || '')) ? String(intent) : 'manual';
  const now = options.now ?? Date.now();
  return updateMyRealmState((state) => ({
    ...state,
    returnLoop: {
      returnCount: Math.min(MAX_RETURN_COUNT, Number(state.returnLoop?.returnCount || 0) + 1),
      lastReturnedAt: iso(now),
      lastIntent: resolvedIntent,
      updatedAt: iso(now)
    }
  }), { ...options, now });
}

export function getMyRealmReturnSummary(state) {
  const normalized = normalizeMyRealmState(state, { bindCity: false });
  return Object.freeze({
    landmark: normalized.landmark,
    returnCount: normalized.returnLoop.returnCount,
    lastReturnedAt: normalized.returnLoop.lastReturnedAt,
    lastIntent: normalized.returnLoop.lastIntent,
    note: 'Local return history stays on this device. It is not shared, rewarded, attributed, or used for a public profile.'
  });
}

export function getMyRealmPublicIdentity(state) {
  const normalized = normalizeMyRealmState(state, { bindCity: false });
  const review = reviewRealmPublicMetadata({ label: normalized.label, handle: normalized.handle });
  return Object.freeze({
    id: normalized.id,
    label: review.ok ? normalized.label : '',
    handle: review.ok ? normalized.handle : '',
    theme: normalized.theme,
    layout: normalized.layout,
    shortcuts: [...normalized.shortcuts],
    featuredItem: publicFeaturedItem(normalized.featuredItem),
    entryDistrict: normalized.entryDistrict,
    shareContract: 'eon3-portable-identity',
    shareEligible: review.ok,
    reviewIssues: [...review.issues],
    publicPublishingActive: false,
    officialMarketPlacementActive: false,
    marketplaceActive: false,
    affiliateActive: false,
    payoutActive: false,
    note: review.ok
      ? 'This is a portable identity only. Local showcases, landmark choices, return history, and private City state are not published by the signed link.'
      : 'Resolve the local metadata review before creating a portable identity link. Nothing has been published.'
  });
}

export function buildMyRealmCard(state) {
  const normalized = normalizeMyRealmState(state, { bindCity: false });
  const review = reviewRealmPublicMetadata({ label: normalized.label, handle: normalized.handle });
  const layout = MY_REALM_LAYOUTS.find((entry) => entry.id === normalized.layout) || MY_REALM_LAYOUTS[0];
  const shortcuts = normalized.shortcuts.map((id) => MY_REALM_SHORTCUTS.find((entry) => entry.id === id)).filter(Boolean);
  return Object.freeze({
    schema: 'eonapp.realm-card.v1',
    safeToShare: review.ok,
    id: normalized.id,
    label: review.ok ? normalized.label : '',
    handle: review.ok ? normalized.handle : '',
    theme: normalized.theme,
    layout: Object.freeze({ id: layout.id, label: layout.label, note: layout.note }),
    shortcuts: Object.freeze(shortcuts.map((entry) => Object.freeze({ id: entry.id, label: entry.label }))),
    featuredItem: publicFeaturedItem(normalized.featuredItem),
    note: 'Read-only presentation card. It excludes private City state, local files, return history, provider keys, account data, billing details and visitor tracking.'
  });
}

export function clearMyRealmStateForTest({ storage } = {}) {
  try { getStorage(storage)?.removeItem(MY_REALM_STATE_KEY); } catch {}
}

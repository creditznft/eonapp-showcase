/** RT92 first-party PPC acquisition attribution. No IP, fingerprint or prompt text. */
export const EON_GROWTH_ATTRIBUTION_SCHEMA = 'eonapp.growth.attribution.rt92.v1';
export const EON_GROWTH_ATTRIBUTION_KEY = 'eon:growth:attribution:v1';
export const EON_GROWTH_FIRST_TOUCH_KEY = 'eon:growth:first-touch:v1';
export const EON_GROWTH_SESSION_KEY = 'eon:growth:session:v1';
export const EON_GROWTH_EVENTS = Object.freeze([
  'landing_view','engaged_5s','first_prompt','signup','second_session','7_day_return',
  'trial_start','paid_subscription','qualified_free_user','guide_engaged','guide_tool_used','eonbot_cta_open'
]);
const ALLOWED_CLIENT_EVENTS = new Set(['landing_view','engaged_5s','first_prompt','signup','guide_engaged','guide_tool_used','eonbot_cta_open']);
const PARAMS = Object.freeze({
  source: ['utm_source'],
  medium: ['utm_medium'],
  campaign: ['utm_campaign'],
  creative: ['utm_content','creative'],
  placement: ['utm_term','placement','zone','subid'],
  clickId: ['ppc_click_id','click_id','clickid'],
  ppcCountry: ['ppc_country'],
  ppcOs: ['ppc_os'],
  ppcSsp: ['ppc_ssp'],
  ppcTrackingId: ['ppc_tracking_id','tracking_id']
});

function stripControlCharacters(value = '') {
  return Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');
}
function clean(value = '', max = 120) {
  return stripControlCharacters(value).trim().replace(/[^A-Za-z0-9._:+@/-]/g, '-').slice(0, max);
}
function safeStorage(environment, name) { try { return environment?.[name] || null; } catch { return null; } }
function readJson(storage, key) { try { const raw = storage?.getItem?.(key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function writeJson(storage, key, value) { try { storage?.setItem?.(key, JSON.stringify(value)); return true; } catch { return false; } }
function firstParam(params, names) { for (const name of names) { const value = clean(params.get(name) || ''); if (value) return value; } return ''; }

export function normalizeEonGrowthSource(value = '', hasCampaignSignal = false) {
  const source = clean(value, 120).toLowerCase();
  if (!source) return hasCampaignSignal ? 'unknown' : 'direct';
  if (/(^|[-_.])ppcmate($|[-_.])/.test(source)) return 'ppcmate';
  if (/(^|[-_.])clickadilla($|[-_.])/.test(source)) return 'clickadilla';
  if (/(google|bing|duckduckgo|yahoo|baidu|yandex)/.test(source)) return 'organic';
  if (/(facebook|instagram|tiktok|linkedin|reddit|youtube|telegram|twitter|x-com)/.test(source)) return 'referral';
  return source;
}

export function parseEonGrowthAttribution(urlLike = '', now = Date.now()) {
  let url = null;
  try { url = new URL(String(urlLike || ''), 'https://eonapp.invalid/'); } catch { url = new URL('https://eonapp.invalid/'); }
  const params = url.searchParams;
  const result = { schema: EON_GROWTH_ATTRIBUTION_SCHEMA, capturedAt: Number(now) };
  for (const [key, names] of Object.entries(PARAMS)) result[key] = firstParam(params, names);
  const hasCampaignSignal = Boolean(result.source || result.medium || result.campaign || result.clickId || result.ppcTrackingId);
  if (!result.source && (result.clickId || result.ppcTrackingId)) result.source = 'ppcmate';
  result.source = normalizeEonGrowthSource(result.source, hasCampaignSignal);
  return Object.freeze(result);
}

export function readEonGrowthAttribution(environment = globalThis) {
  const storage = safeStorage(environment, 'sessionStorage');
  const stored = readJson(storage, EON_GROWTH_ATTRIBUTION_KEY);
  return stored && stored.schema === EON_GROWTH_ATTRIBUTION_SCHEMA ? Object.freeze({ ...stored }) : null;
}

export function captureEonGrowthAttribution(environment = globalThis) {
  const current = parseEonGrowthAttribution(environment?.location?.href || '', Date.now());
  const hasCampaignSignal = Boolean((current.source && current.source !== 'direct') || current.medium || current.campaign || current.clickId || current.ppcTrackingId);
  const existing = readEonGrowthAttribution(environment);
  if (!hasCampaignSignal && existing) return existing;
  writeJson(safeStorage(environment, 'sessionStorage'), EON_GROWTH_ATTRIBUTION_KEY, current);
  const firstTouchStorage = safeStorage(environment, 'localStorage');
  if (!readJson(firstTouchStorage, EON_GROWTH_FIRST_TOUCH_KEY)) writeJson(firstTouchStorage, EON_GROWTH_FIRST_TOUCH_KEY, current);
  return current;
}

export function readEonGrowthFirstTouch(environment = globalThis) {
  const stored = readJson(safeStorage(environment, 'localStorage'), EON_GROWTH_FIRST_TOUCH_KEY);
  return stored && stored.schema === EON_GROWTH_ATTRIBUTION_SCHEMA ? Object.freeze({ ...stored }) : null;
}

function sessionState(environment = globalThis) {
  const storage = safeStorage(environment, 'sessionStorage');
  const current = readJson(storage, EON_GROWTH_SESSION_KEY) || { startedAt: Date.now(), sent: {} };
  current.sent = current.sent && typeof current.sent === 'object' ? current.sent : {};
  return { storage, current };
}

export async function emitEonGrowthEvent(eventName, options = {}) {
  const event = clean(eventName, 40);
  if (!ALLOWED_CLIENT_EVENTS.has(event)) return Object.freeze({ ok: false, reason: 'event_not_allowed' });
  const environment = options.environment || globalThis;
  const { storage, current } = sessionState(environment);
  const oncePerSession = options.oncePerSession !== false;
  if (oncePerSession && current.sent[event]) return Object.freeze({ ok: true, skipped: true, reason: 'already_sent' });
  const attribution = captureEonGrowthAttribution(environment) || readEonGrowthAttribution(environment) || {};
  const body = {
    event,
    attribution: {
      source: clean(attribution.source), medium: clean(attribution.medium), campaign: clean(attribution.campaign),
      creative: clean(attribution.creative), placement: clean(options.placement || attribution.placement), clickId: clean(attribution.clickId),
      ppcCountry: clean(attribution.ppcCountry, 8), ppcOs: clean(attribution.ppcOs), ppcSsp: clean(attribution.ppcSsp),
      ppcTrackingId: clean(attribution.ppcTrackingId)
    }
  };
  let response = null;
  try {
    response = await environment.fetch('/api/growth/event', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
  } catch { return Object.freeze({ ok: false, reason: 'transport_unavailable' }); }
  if (!response?.ok) return Object.freeze({ ok: false, reason: `http_${Number(response?.status || 0)}` });
  current.sent[event] = Date.now();
  writeJson(storage, EON_GROWTH_SESSION_KEY, current);
  return Object.freeze({ ok: true, skipped: false });
}

let growthAttributionBootResult = null;

export function bootEonGrowthAttribution(environment = globalThis) {
  if (growthAttributionBootResult) return growthAttributionBootResult;
  captureEonGrowthAttribution(environment);
  void emitEonGrowthEvent('landing_view', { environment });
  const timer = environment.setTimeout?.(() => void emitEonGrowthEvent('engaged_5s', { environment }), 5000);
  try {
    const params = new URL(environment.location.href).searchParams;
    if (params.get('account') === 'connected') void emitEonGrowthEvent('signup', { environment });
  } catch {}
  growthAttributionBootResult = Object.freeze({ timer: timer || null });
  return growthAttributionBootResult;
}

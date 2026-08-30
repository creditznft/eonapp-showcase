import { readSession, getIdentityConfig } from './eon-auth.js';

export const EON_GROWTH_EVENT_NAMES = Object.freeze(new Set([
  'landing_view','engaged_5s','first_prompt','signup','second_session','7_day_return',
  'trial_start','paid_subscription','qualified_free_user',
  'vexrail_eligible','vexrail_request_started','vexrail_response_success',
  'vexrail_no_sponsored_result','vexrail_sponsored_result_present','vexrail_provider_error',
  'vexrail_client_render_success','vexrail_client_render_failure',
  'ad_slot_configured','ad_script_load_attempted','ad_script_loaded','ad_slot_initialized','ad_render_observed','ad_provider_error',
  'guide_engaged','guide_tool_used','eonbot_cta_open',
  'sponsored_discovery_requested','sponsored_discovery_result_present','sponsored_discovery_no_result','sponsored_discovery_provider_error',
  'rewarded_session_requested','rewarded_session_started','rewarded_fill_observed','rewarded_completion_verified','rewarded_reward_granted','rewarded_provider_error'
]));
// Browser posts are limited to acquisition/lifecycle observations. Vexrail
// transport outcomes are server-authoritative and cannot be forged by a client.
export const EON_PUBLIC_GROWTH_EVENT_NAMES = Object.freeze(new Set(['landing_view','engaged_5s','first_prompt','signup','guide_engaged','guide_tool_used','eonbot_cta_open']));
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_GAP_MS = 30 * 60 * 1000;
const encoder = new TextEncoder();

function clean(value = '', max = 120) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^A-Za-z0-9._:+@/-]/g, '-').slice(0, max);
}
function family(value = '', fallback = 'unknown') { return clean(value, 40).toLowerCase() || fallback; }
function dayStart(now = Date.now()) { return Math.floor(Number(now) / DAY_MS) * DAY_MS; }

export function normalizeGrowthAttribution(input = {}) {
  const a = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    source: clean(a.source), medium: clean(a.medium), campaign: clean(a.campaign), creative: clean(a.creative),
    placement: clean(a.placement), clickId: clean(a.clickId), ppcCountry: clean(a.ppcCountry, 8).toUpperCase(),
    ppcOs: clean(a.ppcOs), ppcSsp: clean(a.ppcSsp), ppcTrackingId: clean(a.ppcTrackingId)
  });
}

export function classifyGrowthUserAgent(userAgent = '') {
  const ua = String(userAgent || '').slice(0, 600);
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? (/iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  let os = 'other';
  if (/Windows NT/i.test(ua)) os = 'windows'; else if (/Android/i.test(ua)) os = 'android'; else if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios'; else if (/Mac OS X/i.test(ua)) os = 'macos'; else if (/Linux/i.test(ua)) os = 'linux';
  let browser = 'other';
  if (/Edg\//i.test(ua)) browser = 'edge'; else if (/OPR\//i.test(ua)) browser = 'opera'; else if (/Chrome\//i.test(ua)) browser = 'chrome'; else if (/Firefox\//i.test(ua)) browser = 'firefox'; else if (/Safari\//i.test(ua)) browser = 'safari';
  return Object.freeze({ deviceClass: device, osFamily: os, browserFamily: browser });
}

async function hmacGrowthValue(kind = 'subject', value = '', env = {}) {
  const salt = String(env.EON_GROWTH_SUBJECT_SALT || env.EON_TRUST_RATE_LIMIT_SALT || '');
  if (!value || salt.length < 32) return '';
  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`growth:${kind}:${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function readGrowthIdentity(request, env = {}) {
  let session = null;
  try {
    const identity = getIdentityConfig(request, env);
    if (identity?.configured) session = await readSession(identity, request);
  } catch {}
  const subjectHash = session?.accountId ? await hmacGrowthValue('subject', session.accountId, env) : '';
  return Object.freeze({ signedIn: Boolean(session?.accountId && subjectHash), subjectHash, accountId: session?.accountId || '' });
}

export async function verifyGrowthSignupClaim(database, payload = {}, request = null, env = {}, now = Date.now()) {
  if (!database?.prepare) return Object.freeze({ ok: false, reason: 'growth_database_unavailable' });
  const identity = await readGrowthIdentity(request, env);
  if (!identity.signedIn || !identity.accountId) return Object.freeze({ ok: false, reason: 'growth_signup_sign_in_required' });
  let createdAt = 0;
  try {
    const row = await env.EON_IDENTITY_DB?.prepare?.('SELECT created_at FROM eon_identity_accounts WHERE account_id=? LIMIT 1').bind(identity.accountId).first();
    createdAt = Number(row?.created_at || 0);
  } catch {}
  const fresh = createdAt > 0 && Number(now) >= createdAt && Number(now) - createdAt <= 15 * 60 * 1000;
  if (!fresh) return Object.freeze({ ok: false, reason: 'growth_signup_not_fresh' });
  try {
    const existing = await database.prepare('SELECT signup_at FROM eon_growth_subject_cohort WHERE subject_hash=? LIMIT 1').bind(identity.subjectHash).first();
    if (Number(existing?.signup_at || 0) > 0) return Object.freeze({ ok: true, skipped: true, reason: 'growth_signup_already_counted' });
  } catch {}
  return recordGrowthEvent(database, { ...payload, event: 'signup' }, request, env, now);
}

async function incrementProfitabilityLifecycle(database, event, a, country, ua, now, userCohort = '') {
  const counters = {
    firstPrompt: event === 'first_prompt' ? 1 : 0,
    signup: event === 'signup' ? 1 : 0,
    d7: event === '7_day_return' ? 1 : 0,
    trial: event === 'trial_start' ? 1 : 0,
    paid: event === 'paid_subscription' ? 1 : 0,
    qualifiedFree: event === 'qualified_free_user' ? 1 : 0
  };
  if (!Object.values(counters).some(Boolean)) return;
  await database.prepare(`INSERT INTO eon_profitability_daily(
    day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,
    first_prompt_count,signup_count,d7_return_count,trial_start_count,paid_subscription_count,qualified_free_user_count,ai_prompt_count,updated_at
  ) VALUES (?,'growth',?,?,?,?,?,?,?,?,?,?, '', '', ?,?,?,?,?,?,0,?)
  ON CONFLICT(day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class)
  DO UPDATE SET
    first_prompt_count=first_prompt_count+excluded.first_prompt_count,
    signup_count=signup_count+excluded.signup_count,
    d7_return_count=d7_return_count+excluded.d7_return_count,
    trial_start_count=trial_start_count+excluded.trial_start_count,
    paid_subscription_count=paid_subscription_count+excluded.paid_subscription_count,
    qualified_free_user_count=qualified_free_user_count+excluded.qualified_free_user_count,
    updated_at=excluded.updated_at`).bind(
      dayStart(now), /^[A-Z]{2}$/.test(country) ? country : '', a.source, a.medium, a.campaign, a.creative, a.placement, ua.deviceClass, ua.osFamily, ua.browserFamily,
      clean(userCohort, 40), counters.firstPrompt, counters.signup, counters.d7, counters.trial, counters.paid, counters.qualifiedFree, Number(now)
    ).run();
}

export async function readGrowthCohortAttribution(database, request = null, env = {}) {
  const identity = await readGrowthIdentity(request, env);
  if (!identity.signedIn || !database?.prepare) return Object.freeze({ signedIn: false, source: '', medium: '', campaign: '', creative: '', placement: '', country: '' });
  try {
    const row = await database.prepare('SELECT first_source,first_medium,first_campaign,first_creative,first_placement,first_country,first_device_class,first_os_family,first_browser_family FROM eon_growth_subject_cohort WHERE subject_hash=? LIMIT 1').bind(identity.subjectHash).first();
    return Object.freeze({
      signedIn: true,
      source: clean(row?.first_source || ''), medium: clean(row?.first_medium || ''), campaign: clean(row?.first_campaign || ''), creative: clean(row?.first_creative || ''),
      placement: clean(row?.first_placement || ''), country: clean(row?.first_country || '', 2).toUpperCase(),
      deviceClass: family(row?.first_device_class), osFamily: family(row?.first_os_family), browserFamily: family(row?.first_browser_family)
    });
  } catch {
    return Object.freeze({ signedIn: true, source: '', medium: '', campaign: '', creative: '', placement: '', country: '' });
  }
}

const SERVER_LIFECYCLE_EVENTS = Object.freeze(new Set(['trial_start','paid_subscription','qualified_free_user']));
const SERVER_LIFECYCLE_COUNTER = Object.freeze({
  trial_start: 'trial_start_count',
  paid_subscription: 'paid_subscription_count',
  qualified_free_user: 'qualified_free_user_count'
});
const SERVER_LIFECYCLE_COHORT = Object.freeze({ trial_start: 'trial', paid_subscription: 'paid', qualified_free_user: 'free' });

export async function recordGrowthAccountLifecycle(database, eventName = '', accountId = '', env = {}, now = Date.now()) {
  if (!database?.prepare || typeof database.batch !== 'function') return Object.freeze({ ok: false, reason: 'growth_atomic_database_unavailable' });
  const event = clean(eventName, 40);
  const account = clean(accountId, 80);
  if (!SERVER_LIFECYCLE_EVENTS.has(event) || !account) return Object.freeze({ ok: false, reason: 'growth_lifecycle_invalid' });
  const subjectHash = await hmacGrowthValue('subject', account, env);
  if (!subjectHash) return Object.freeze({ ok: false, reason: 'growth_subject_unavailable' });

  const existing = await database.prepare('SELECT first_recorded_at FROM eon_growth_lifecycle_receipts WHERE subject_hash=? AND event_name=? LIMIT 1').bind(subjectHash, event).first();
  if (existing) return Object.freeze({ ok: true, event, skipped: true, reason: 'growth_lifecycle_already_counted' });

  const row = await database.prepare(`SELECT first_source,first_medium,first_campaign,first_creative,first_placement,first_country,
    first_device_class,first_os_family,first_browser_family FROM eon_growth_subject_cohort WHERE subject_hash=? LIMIT 1`).bind(subjectHash).first();
  const a = normalizeGrowthAttribution({
    source: row?.first_source, medium: row?.first_medium, campaign: row?.first_campaign,
    creative: row?.first_creative, placement: row?.first_placement
  });
  const country = clean(row?.first_country || '', 2).toUpperCase();
  const ua = Object.freeze({
    deviceClass: family(row?.first_device_class), osFamily: family(row?.first_os_family), browserFamily: family(row?.first_browser_family)
  });
  const clickSource = '';
  const counterColumn = SERVER_LIFECYCLE_COUNTER[event];
  const userCohort = SERVER_LIFECYCLE_COHORT[event];
  const safeCountry = /^[A-Z]{2}$/.test(country) ? country : '';
  const growthStatement = database.prepare(`INSERT INTO eon_growth_event_daily(
    day_started_at,event_name,source,medium,campaign,creative,placement,click_source,country,device_class,os_family,browser_family,event_count,signed_in_count,updated_at
  ) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,1,?
  WHERE NOT EXISTS (SELECT 1 FROM eon_growth_lifecycle_receipts WHERE subject_hash=? AND event_name=?)
  ON CONFLICT(day_started_at,event_name,source,medium,campaign,creative,placement,click_source,country,device_class,os_family,browser_family)
  DO UPDATE SET event_count=event_count+1,signed_in_count=signed_in_count+1,updated_at=excluded.updated_at`).bind(
    dayStart(now), event, a.source, a.medium, a.campaign, a.creative, a.placement, clickSource, safeCountry, ua.deviceClass, ua.osFamily, ua.browserFamily, 1, Number(now), subjectHash, event
  );
  const zeroes = { first_prompt_count: 0, signup_count: 0, d7_return_count: 0, trial_start_count: 0, paid_subscription_count: 0, qualified_free_user_count: 0 };
  zeroes[counterColumn] = 1;
  const profitStatement = database.prepare(`INSERT INTO eon_profitability_daily(
    day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,
    first_prompt_count,signup_count,d7_return_count,trial_start_count,paid_subscription_count,qualified_free_user_count,ai_prompt_count,updated_at
  ) SELECT ?,'growth',?,?,?,?,?,?,?,?,?,?, '', '', ?,?,?,?,?,?,0,?
  WHERE NOT EXISTS (SELECT 1 FROM eon_growth_lifecycle_receipts WHERE subject_hash=? AND event_name=?)
  ON CONFLICT(day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class)
  DO UPDATE SET ${counterColumn}=${counterColumn}+1,updated_at=excluded.updated_at`).bind(
    dayStart(now), safeCountry, a.source, a.medium, a.campaign, a.creative, a.placement, ua.deviceClass, ua.osFamily, ua.browserFamily, userCohort,
    zeroes.first_prompt_count, zeroes.signup_count, zeroes.d7_return_count, zeroes.trial_start_count, zeroes.paid_subscription_count, zeroes.qualified_free_user_count, Number(now), subjectHash, event
  );
  const receiptStatement = database.prepare('INSERT OR IGNORE INTO eon_growth_lifecycle_receipts(subject_hash,event_name,first_recorded_at) VALUES(?,?,?)').bind(subjectHash, event, Number(now));
  await database.batch([growthStatement, profitStatement, receiptStatement]);
  return Object.freeze({ ok: true, event, skipped: false });
}

export async function recordVexrailProfitabilityPrompt(database, request = null, env = {}, details = {}, now = Date.now()) {
  if (!database?.prepare) return false;
  const modelId = clean(details?.modelId || '', 160);
  const requestClass = clean(details?.requestClass || '', 40);
  if (!modelId || !requestClass) return false;
  const cohort = await readGrowthCohortAttribution(database, request, env);
  const ua = classifyGrowthUserAgent(request?.headers?.get?.('user-agent') || '');
  const trustedCountry = clean(details?.country || '', 2).toUpperCase();
  const country = /^[A-Z]{2}$/.test(trustedCountry) ? trustedCountry : (/^[A-Z]{2}$/.test(cohort.country) ? cohort.country : '');
  try {
    await database.prepare(`INSERT INTO eon_profitability_daily(
      day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class,ai_prompt_count,updated_at
    ) VALUES (?,'vexrail',?,?,?,?,?,?,?,?,?,?,?,?,1,?)
    ON CONFLICT(day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class)
    DO UPDATE SET ai_prompt_count=ai_prompt_count+1, updated_at=excluded.updated_at`).bind(
      dayStart(now), country, cohort.source, cohort.medium, cohort.campaign, cohort.creative, cohort.placement, ua.deviceClass, ua.osFamily, ua.browserFamily,
      clean(details?.userCohort || '', 40), modelId, requestClass, Number(now)
    ).run();
    return true;
  } catch { return false; }
}

async function incrementGrowthAggregate(database, event, a, country, ua, signedIn, now) {
  const clickSource = a.ppcSsp || (a.clickId ? 'ppcmate-click' : '');
  await database.prepare(`INSERT INTO eon_growth_event_daily(
    day_started_at,event_name,source,medium,campaign,creative,placement,click_source,country,device_class,os_family,browser_family,event_count,signed_in_count,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)
  ON CONFLICT(day_started_at,event_name,source,medium,campaign,creative,placement,click_source,country,device_class,os_family,browser_family)
  DO UPDATE SET event_count=event_count+1, signed_in_count=signed_in_count+excluded.signed_in_count, updated_at=excluded.updated_at`).bind(
    dayStart(now), event, a.source, a.medium, a.campaign, a.creative, a.placement, clickSource,
    /^[A-Z]{2}$/.test(country) ? country : '', ua.deviceClass, ua.osFamily, ua.browserFamily,
    signedIn ? 1 : 0, Number(now)
  ).run();
}

export async function recordGrowthEvent(database, payload = {}, request = null, env = {}, now = Date.now()) {
  if (!database?.prepare) return Object.freeze({ ok: false, reason: 'growth_database_unavailable' });
  const event = clean(payload?.event, 40);
  if (!EON_GROWTH_EVENT_NAMES.has(event)) return Object.freeze({ ok: false, reason: 'growth_event_invalid' });
  const a = normalizeGrowthAttribution(payload?.attribution);
  const country = clean(request?.cf?.country || '', 2).toUpperCase();
  const ua = classifyGrowthUserAgent(request?.headers?.get?.('user-agent') || '');
  const identity = await readGrowthIdentity(request, env);
  const clickHash = a.clickId ? await hmacGrowthValue('click', a.clickId, env) : '';
  await incrementGrowthAggregate(database, event, a, country, ua, identity.signedIn, now);
  await incrementProfitabilityLifecycle(database, event, a, country, ua, now);

  if (clickHash) {
    await database.prepare(`INSERT INTO eon_growth_click_attribution(
      click_hash,first_seen_at,last_seen_at,source,medium,campaign,creative,placement,country,landing_count,first_prompt_count,signup_count,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(click_hash) DO UPDATE SET
      last_seen_at=excluded.last_seen_at,
      landing_count=landing_count+excluded.landing_count,
      first_prompt_count=first_prompt_count+excluded.first_prompt_count,
      signup_count=signup_count+excluded.signup_count,
      updated_at=excluded.updated_at`).bind(
      clickHash, Number(now), Number(now), a.source, a.medium, a.campaign, a.creative, a.placement,
      /^[A-Z]{2}$/.test(country) ? country : '', event === 'landing_view' ? 1 : 0,
      event === 'first_prompt' ? 1 : 0, event === 'signup' ? 1 : 0, Number(now)
    ).run();
  }

  if (identity.signedIn) {
    const firstCountry = /^[A-Z]{2}$/.test(country) ? country : '';
    const previous = await database.prepare(`SELECT first_seen_at,last_seen_at,session_count,second_session_at,day7_return_at,
      first_source,first_medium,first_campaign,first_creative,first_placement,first_country,first_device_class,first_os_family,first_browser_family
      FROM eon_growth_subject_cohort WHERE subject_hash=?`).bind(identity.subjectHash).first();
    const separatedSession = event === 'landing_view' && previous && Number(previous.session_count || 0) > 0 && Number(now) - Number(previous.last_seen_at || 0) >= SESSION_GAP_MS;
    const deriveSecondSession = Boolean(separatedSession && !previous.second_session_at);
    const deriveDay7Return = Boolean(separatedSession && !previous.day7_return_at && Number(now) - Number(previous.first_seen_at || now) >= 7 * DAY_MS);
    const retentionAttribution = previous ? normalizeGrowthAttribution({
      source: previous.first_source, medium: previous.first_medium, campaign: previous.first_campaign,
      creative: previous.first_creative, placement: previous.first_placement
    }) : a;
    const retentionCountry = clean(previous?.first_country || country, 2).toUpperCase();
    await database.prepare(`INSERT INTO eon_growth_subject_cohort(
      subject_hash,first_seen_at,last_seen_at,session_count,first_source,first_medium,first_campaign,first_creative,first_placement,first_country,
      first_device_class,first_os_family,first_browser_family,signup_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(subject_hash) DO UPDATE SET
      first_seen_at=CASE WHEN session_count=0 THEN excluded.first_seen_at ELSE first_seen_at END,
      last_seen_at=excluded.last_seen_at,
      session_count=CASE WHEN session_count=0 THEN 1 ELSE session_count+? END,
      first_source=CASE WHEN session_count=0 THEN excluded.first_source ELSE first_source END,
      first_medium=CASE WHEN session_count=0 THEN excluded.first_medium ELSE first_medium END,
      first_campaign=CASE WHEN session_count=0 THEN excluded.first_campaign ELSE first_campaign END,
      first_creative=CASE WHEN session_count=0 THEN excluded.first_creative ELSE first_creative END,
      first_placement=CASE WHEN session_count=0 THEN excluded.first_placement ELSE first_placement END,
      first_country=CASE WHEN session_count=0 THEN excluded.first_country ELSE first_country END,
      first_device_class=CASE WHEN session_count=0 THEN excluded.first_device_class ELSE first_device_class END,
      first_os_family=CASE WHEN session_count=0 THEN excluded.first_os_family ELSE first_os_family END,
      first_browser_family=CASE WHEN session_count=0 THEN excluded.first_browser_family ELSE first_browser_family END,
      signup_at=CASE WHEN signup_at IS NULL AND ? IS NOT NULL THEN ? ELSE signup_at END,
      updated_at=excluded.updated_at`).bind(
      identity.subjectHash, Number(now), Number(now), 1, a.source, a.medium, a.campaign, a.creative, a.placement, firstCountry,
      ua.deviceClass, ua.osFamily, ua.browserFamily, event === 'signup' ? Number(now) : null, Number(now), separatedSession ? 1 : 0,
      event === 'signup' ? Number(now) : null, event === 'signup' ? Number(now) : null
    ).run();
    if (event === 'second_session' || deriveSecondSession) {
      await database.prepare('UPDATE eon_growth_subject_cohort SET second_session_at=COALESCE(second_session_at, ?), session_count=MAX(session_count,2), updated_at=? WHERE subject_hash=?').bind(Number(now), Number(now), identity.subjectHash).run();
      if (deriveSecondSession) await incrementGrowthAggregate(database, 'second_session', retentionAttribution, retentionCountry, ua, true, now);
    }
    if (event === '7_day_return' || deriveDay7Return) {
      await database.prepare('UPDATE eon_growth_subject_cohort SET day7_return_at=COALESCE(day7_return_at, ?), updated_at=? WHERE subject_hash=?').bind(Number(now), Number(now), identity.subjectHash).run();
      if (deriveDay7Return) {
        await incrementGrowthAggregate(database, '7_day_return', retentionAttribution, retentionCountry, ua, true, now);
        await incrementProfitabilityLifecycle(database, '7_day_return', retentionAttribution, retentionCountry, ua, now);
      }
    }
  }
  return Object.freeze({ ok: true, event, signedIn: identity.signedIn });
}

// Operational outcomes are aggregate-only: no prompt, response, credential,
// conversation ID, IP address, or account identifier is accepted here.
export async function recordGrowthOperationalEvent(database, eventName = '', request = null, env = {}, now = Date.now()) {
  const event = clean(eventName, 40);
  if (!EON_GROWTH_EVENT_NAMES.has(event)) return false;
  try {
    const cohort = await readGrowthCohortAttribution(database, request, env);
    const result = await recordGrowthEvent(database, {
      event,
      attribution: { source: cohort.source, medium: cohort.medium, campaign: cohort.campaign, creative: cohort.creative, placement: cohort.placement }
    }, request, env, now);
    return result.ok === true;
  } catch { return false; }
}

import { enforceSameOriginMutation, getIdentityConfig, jsonResponse, readCookie, readSession, securityHeaders } from '../../_shared/eon-auth.js';
import { EON_REQUEST_LIMITS, readBoundedJson } from '../../_shared/eon-request-security.js';
import { consumeTrustRateLimit, trustRateLimitSubject } from '../../_shared/eon-trust-rate-limit.js';
import { buildBillingStatusPayload, readAccountBillingLifecycle, readAccountEntitlement } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { isEonPaidAdFreeBillingState } from '../../_shared/eon-monetization-eligibility.js';
import { parseVerifiedVexrailEconomics, selectVexrailModelRoute } from '../../_shared/eon-vexrail-model-router.js';
import { recordGrowthOperationalEvent, recordVexrailProfitabilityPrompt } from '../../_shared/eon-growth-attribution.js';
import { getVexrailProfitabilityGovernorConfig, readVexrailProfitabilityGovernor } from '../../_shared/eon-profitability-governor.js';

export const EON_VEXRAIL_SCHEMA = 'eonapp.ai.vexrail-proxy.rt92.v3';
export const VEXRAIL_UPSTREAM = 'https://api.vexrail.com/v1/chat/completions';
const ALLOWED_ROLLOUTS = new Set(['testing', 'production']);
const ALLOWED_GEO_MODES = new Set(['off', 'testing', 'selected_countries', 'all']);
const ALLOWED_TURNSTILE_MODES = new Set(['off', 'required']);
const AUTH_ENABLED_ROLLOUTS = new Set(['testing', 'public']);
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);
const MAX_MESSAGES = 32;
const MAX_MESSAGE_CHARS = 16_000;
const MAX_TOTAL_MESSAGE_CHARS = 32_000;
const MAX_OUTPUT_TOKENS = 2048;
const UPSTREAM_TIMEOUT_MS = 45_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GLOBAL_DAILY_CAP = 1000;
const DEFAULT_COUNTRY_DAILY_CAP = 400;
const DEFAULT_NETWORK_HOURLY_CAP = 80;
const DEFAULT_NETWORK_DAILY_CAP = 300;
const DEFAULT_FREE_DAILY_CAP = 60;
const DEFAULT_PAID_FAIR_USE_HOURLY_CAP = 30;
const DEFAULT_PAID_DAILY_CAP = 100;
// Token-weighted budgets are deliberately estimates, not claims about Vexrail billing.
// They cap worst-case publisher-credit exposure even when request counts stay low.
const DEFAULT_FREE_DAILY_TOKEN_CAP = 80_000;
const DEFAULT_PAID_DAILY_TOKEN_CAP = 120_000;
const DEFAULT_COUNTRY_DAILY_TOKEN_CAP = 750_000;
const DEFAULT_GLOBAL_DAILY_TOKEN_CAP = 2_000_000;
const DEFAULT_BOT_SCORE_MIN = 30;
const DEFAULT_GUEST_NETWORK_DAILY_CAP = 5;
const DEFAULT_GUEST_MAX_OUTPUT_TOKENS = 768;
const DEFAULT_GUEST_COOKIE_DAYS = 30;
const GUEST_COOKIE = '__Host-eon_vexrail_guest';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function cleanText(value = '', max = 256) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function normalizeConversationId(value = '') {
  const id = cleanText(value, 128);
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(id) ? id : '';
}

function envFlag(value, fallback = false) {
  const normalized = cleanText(value ?? '', 16).toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return fallback;
}

function positiveInt(value, fallback, min = 1, max = 1_000_000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function parseCountryList(value = '') {
  return Object.freeze([...new Set(String(value || '')
    .split(',')
    .map((entry) => cleanText(entry, 2).toUpperCase())
    .filter((entry) => /^[A-Z]{2}$/.test(entry)))].sort());
}

function parseHostnameList(value = '') {
  return Object.freeze([...new Set(String(value || '')
    .split(',')
    .map((entry) => cleanText(entry, 180).toLowerCase())
    .filter((entry) => /^[a-z0-9.-]+$/.test(entry)))].sort());
}

function parseAsnList(value = '') {
  return Object.freeze([...new Set(String(value || '')
    .split(',')
    .map((entry) => Number(String(entry || '').replace(/[^0-9]/g, '')))
    .filter((entry) => Number.isInteger(entry) && entry > 0 && entry <= 4_294_967_295))].sort((a, b) => a - b));
}

function trustedCountry(request) {
  const country = cleanText(request?.cf?.country || '', 2).toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : '';
}

function trustedAsn(request) {
  const asn = Number(request?.cf?.asn);
  return Number.isInteger(asn) && asn > 0 && asn <= 4_294_967_295 ? asn : 0;
}

function bytesToBase64Url(bytes = new Uint8Array()) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmacGuestMarker(value = '', env = {}) {
  const secret = String(env.EON_TRUST_RATE_LIMIT_SALT || '');
  if (secret.length < 32) return '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(value || '')));
  return bytesToBase64Url(new Uint8Array(signed));
}

async function readGuestMarker(request, env = {}, maxAgeDays = DEFAULT_GUEST_COOKIE_DAYS, now = Date.now()) {
  const raw = cleanText(readCookie(request, GUEST_COOKIE), 512);
  if (!raw) return Object.freeze({ used: false, valid: false });
  const parts = raw.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return Object.freeze({ used: true, valid: false });
  const usedAt = Number(parts[1]);
  const country = cleanText(parts[2], 2).toUpperCase();
  const signature = cleanText(parts[3], 128);
  if (!Number.isFinite(usedAt) || usedAt <= 0 || !/^[A-Z]{2}$/.test(country) || !signature) return Object.freeze({ used: true, valid: false });
  const expected = await hmacGuestMarker(`v1.${usedAt}.${country}`, env);
  const maxAgeMs = Math.max(1, Number(maxAgeDays) || DEFAULT_GUEST_COOKIE_DAYS) * DAY_MS;
  const valid = Boolean(expected && signature === expected && usedAt <= now + 60_000 && (now - usedAt) <= maxAgeMs);
  return Object.freeze({ used: valid, valid, usedAt, country });
}

async function buildGuestUsedCookie(env = {}, country = '', days = DEFAULT_GUEST_COOKIE_DAYS, now = Date.now()) {
  const safeCountry = cleanText(country, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(safeCountry)) return '';
  const payload = `v1.${Math.floor(Number(now) || Date.now())}.${safeCountry}`;
  const signature = await hmacGuestMarker(payload, env);
  if (!signature) return '';
  const maxAge = Math.max(1, Math.min(90, Math.floor(Number(days) || DEFAULT_GUEST_COOKIE_DAYS))) * 24 * 60 * 60;
  return `${GUEST_COOKIE}=${payload}.${signature}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function luhnValid(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Conservative publisher-policy guard. We never return matched values, only
 * coarse categories, so rejected PII/secrets do not become telemetry.
 */
export function inspectVexrailSensitiveData(messages = []) {
  const userText = (Array.isArray(messages) ? messages : [])
    // EONAPP may place explicitly opted-in, redacted Sponsored-memory context
    // in the system prompt. Inspect every model-visible role so a modified
    // client cannot move sensitive content into `system` to bypass this guard.
    .filter((entry) => entry?.role === 'system' || entry?.role === 'user' || entry?.role === 'assistant')
    .map((entry) => String(entry?.content || ''))
    .join('\n')
    .slice(0, MAX_TOTAL_MESSAGE_CHARS);
  if (!userText) return Object.freeze({ ok: true, categories: Object.freeze([]) });

  const categories = new Set();
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(userText)) categories.add('email');
  if (/-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----/i.test(userText)) categories.add('private_key');
  if (/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9_-]{12,}\b/i.test(userText)
    || /\b(?:sk|pk)-[A-Za-z0-9_-]{20,}\b/i.test(userText)
    || /\bAIza[0-9A-Za-z_-]{30,}\b/.test(userText)
    || /\b(?:ghp|github_pat|xox[baprs])[_-][A-Za-z0-9_-]{16,}\b/i.test(userText)
    || /\bAKIA[0-9A-Z]{16}\b/.test(userText)
    || /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}={0,2}\b/i.test(userText)) categories.add('credential');
  if (/\b(?:password|passcode|pin|otp|one[- ]time password|cvv|cvc)\s*(?:(?:is)\s*[:=]?|[:=])\s*\S{4,}/i.test(userText)) categories.add('secret');
  if (/\b(?:aadhaar|aadhar)\s*(?:number|no\.?|is|:|=)?\s*\d{4}[ -]?\d{4}[ -]?\d{4}\b/i.test(userText)
    || /\b(?:pan|pan card)\s*(?:number|no\.?|is|:|=)?\s*[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(userText)
    || /\b(?:ssn|social security(?: number)?)\s*(?:is|:|=)?\s*\d{3}-?\d{2}-?\d{4}\b/i.test(userText)
    || /\b(?:passport|tax id|tax identification)\s*(?:number|no\.?|is|:|=)\s*[A-Z0-9-]{6,20}\b/i.test(userText)) categories.add('government_id');
  if (/\b(?:phone|mobile|whatsapp|contact number)\s*(?:is|:|=)?\s*\+?[0-9][0-9 ()-]{7,}[0-9]\b/i.test(userText)) categories.add('phone');
  if (/\b(?:bank account|account number|iban|routing number|upi id)\s*(?:is|:|=)\s*[A-Z0-9@._ -]{6,34}\b/i.test(userText)) categories.add('financial_identifier');
  if (/\b(?:my|our)\s+(?:medical record|medical report|diagnosis|prescription|lab report|health record)\b/i.test(userText)) categories.add('sensitive_personal_context');

  const digitCandidates = userText.match(/(?:\d[ -]?){13,19}/g) || [];
  if (digitCandidates.some((entry) => luhnValid(entry))) categories.add('payment_card');
  return Object.freeze({ ok: categories.size === 0, categories: Object.freeze([...categories].sort()) });
}

/** Conservative token-equivalent estimate used only for EONAPP budget guards. */
export function estimateVexrailTokenUnits(payload = {}) {
  const chars = (Array.isArray(payload?.messages) ? payload.messages : [])
    .reduce((sum, entry) => sum + String(entry?.content || '').length, 0);
  // Two chars/token intentionally overestimates many Latin-language prompts and
  // is safer across multilingual text than a four-char heuristic.
  const estimatedInput = Math.max(1, Math.ceil(chars / 2));
  const reservedOutput = Math.max(1, Math.min(MAX_OUTPUT_TOKENS, Number(payload?.max_tokens) || 1));
  return Math.min(1_000_000, estimatedInput + reservedOutput);
}

async function deriveUpstreamConversationId(accountId = '', clientConversationId = '', env = {}) {
  const rawAccount = String(accountId || '').trim();
  const rawConversation = normalizeConversationId(clientConversationId);
  const salt = String(env.EON_VEXRAIL_CONVERSATION_SALT || env.EON_TRUST_RATE_LIMIT_SALT || '');
  if (!rawAccount || !rawConversation || salt.length < 32) return '';
  const material = new TextEncoder().encode(`vexrail-conversation:${salt}:${rawAccount}:${rawConversation}`);
  const digest = await crypto.subtle.digest('SHA-256', material);
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `eon-${hex.slice(0, 48)}`;
}


async function hasVexrailEconomicsLedger(database) {
  if (!database?.prepare) return false;
  try {
    await database.prepare('SELECT day_started_at FROM eon_vexrail_economic_daily LIMIT 1').first();
    return true;
  } catch {
    return false;
  }
}

function vexrailEconomicDayStart(now = Date.now()) {
  return Math.floor(Number(now) / DAY_MS) * DAY_MS;
}

async function recordVexrailEconomicAdmission(database, country = '', accessClass = '', estimatedTokenUnits = 0, now = Date.now()) {
  if (accessClass === 'guest_one_shot') return true;
  if (!database?.prepare || !/^[A-Z]{2}$/.test(String(country || '')) || !['signed_in_free', 'paid_opt_in'].includes(accessClass)) return false;
  try {
    await database.prepare(`INSERT INTO eon_vexrail_economic_daily(
      day_started_at, country, access_class, admitted_requests, upstream_accepted,
      estimated_token_units, provider_prompt_tokens, provider_completion_tokens,
      provider_total_tokens, updated_at
    ) VALUES (?, ?, ?, 1, 0, ?, 0, 0, 0, ?)
    ON CONFLICT(day_started_at, country, access_class) DO UPDATE SET
      admitted_requests = admitted_requests + 1,
      estimated_token_units = estimated_token_units + excluded.estimated_token_units,
      updated_at = excluded.updated_at`).bind(
        vexrailEconomicDayStart(now), String(country), accessClass,
        Math.max(1, Math.floor(Number(estimatedTokenUnits) || 1)), Number(now)
      ).run();
    return true;
  } catch {
    return false;
  }
}

function readVexrailUsage(payload = {}) {
  const usage = payload?.usage && typeof payload.usage === 'object' ? payload.usage : {};
  const prompt = Math.max(0, Math.floor(Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0));
  const completion = Math.max(0, Math.floor(Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0));
  const totalRaw = Math.floor(Number(usage.total_tokens ?? 0) || 0);
  return Object.freeze({ prompt, completion, total: Math.max(0, totalRaw || (prompt + completion)) });
}

async function recordVexrailEconomicSuccess(database, country = '', accessClass = '', payload = null, now = Date.now()) {
  if (accessClass === 'guest_one_shot') return true;
  if (!database?.prepare || !/^[A-Z]{2}$/.test(String(country || '')) || !['signed_in_free', 'paid_opt_in'].includes(accessClass)) return false;
  const usage = readVexrailUsage(payload || {});
  try {
    await database.prepare(`UPDATE eon_vexrail_economic_daily SET
      upstream_accepted = upstream_accepted + 1,
      provider_prompt_tokens = provider_prompt_tokens + ?,
      provider_completion_tokens = provider_completion_tokens + ?,
      provider_total_tokens = provider_total_tokens + ?,
      updated_at = ?
      WHERE day_started_at = ? AND country = ? AND access_class = ?`).bind(
        usage.prompt, usage.completion, usage.total, Number(now), vexrailEconomicDayStart(now), String(country), accessClass
      ).run();
    return true;
  } catch {
    return false;
  }
}

async function recordVexrailModelObservation(database, country = '', modelId = '', requestClass = '', outcome = {}, now = Date.now()) {
  if (!database?.prepare || !/^[A-Z]{2}$/.test(String(country || '')) || !String(modelId || '').trim() || !String(requestClass || '').trim()) return false;
  const usage = readVexrailUsage(outcome?.payload || {});
  const success = outcome?.success === true ? 1 : 0;
  const failure = success ? 0 : 1;
  const latencyMs = Math.max(0, Math.min(300_000, Math.floor(Number(outcome?.latencyMs) || 0)));
  try {
    await database.prepare(`INSERT INTO eon_vexrail_model_daily(
      day_started_at,country,model_id,request_class,success_count,failure_count,
      prompt_tokens,completion_tokens,total_tokens,latency_ms_total,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(day_started_at,country,model_id,request_class) DO UPDATE SET
      success_count=success_count+excluded.success_count,
      failure_count=failure_count+excluded.failure_count,
      prompt_tokens=prompt_tokens+excluded.prompt_tokens,
      completion_tokens=completion_tokens+excluded.completion_tokens,
      total_tokens=total_tokens+excluded.total_tokens,
      latency_ms_total=latency_ms_total+excluded.latency_ms_total,
      updated_at=excluded.updated_at`).bind(
        vexrailEconomicDayStart(now), String(country), cleanText(modelId, 160), cleanText(requestClass, 40),
        success, failure, usage.prompt, usage.completion, usage.total, latencyMs, Number(now)
      ).run();
    return true;
  } catch {
    return false;
  }
}

export function evaluateVexrailNetworkPolicy(config, request, env = {}) {
  const environment = cleanText(env.EON_ENVIRONMENT || '', 24).toLowerCase();
  const country = trustedCountry(request);
  const asn = trustedAsn(request);
  const organization = cleanText(request?.cf?.asOrganization || '', 160);
  const bot = request?.cf?.botManagement || null;
  if (config.requireCfMetadata && environment === 'production' && (!country || !asn)) {
    return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_network_unverified', botScore: null });
  }
  if (asn && config.blockedAsns.includes(asn)) {
    return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_network_restricted', botScore: Number.isFinite(Number(bot?.score)) ? Number(bot.score) : null });
  }
  if (bot) {
    const score = Number(bot.score);
    if (bot.verifiedBot === true || bot.signedAgent === true) {
      return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_automated_traffic', botScore: Number.isFinite(score) ? score : null });
    }
    if (bot.corporateProxy === true) {
      return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_network_restricted', botScore: Number.isFinite(score) ? score : null });
    }
    if (Number.isFinite(score) && score > 0 && score < config.botScoreMin) {
      return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_automated_traffic', botScore: score });
    }
    if (bot.jsDetection && bot.jsDetection.passed === false) {
      return Object.freeze({ allowed: false, country, asn, organization, reason: 'vexrail_human_verification_required', botScore: Number.isFinite(score) ? score : null });
    }
  }
  return Object.freeze({ allowed: true, country, asn, organization, reason: 'network_ok', botScore: Number.isFinite(Number(bot?.score)) ? Number(bot.score) : null });
}

export function evaluateVexrailGeoPolicy(config, request, env = {}) {
  const environment = cleanText(env.EON_ENVIRONMENT || '', 24).toLowerCase();
  const country = trustedCountry(request);
  if (config.geoMode === 'off') return Object.freeze({ allowed: false, country, reason: 'vexrail_geo_disabled' });
  if (config.geoMode === 'testing') return Object.freeze({ allowed: environment !== 'production', country, reason: environment !== 'production' ? 'testing' : 'vexrail_geo_unavailable' });
  if (config.geoMode === 'all') return Object.freeze({ allowed: true, country, reason: 'all' });
  if (config.geoMode === 'selected_countries') {
    const allowed = Boolean(country && config.countries.includes(country));
    return Object.freeze({ allowed, country, reason: allowed ? 'selected_country' : 'vexrail_geo_unavailable' });
  }
  return Object.freeze({ allowed: false, country, reason: 'vexrail_geo_unavailable' });
}

export function getVexrailConfig(env = {}) {
  const rollout = cleanText(env.EON_VEXRAIL_ROLLOUT || '', 24).toLowerCase();
  const environment = cleanText(env.EON_ENVIRONMENT || '', 24).toLowerCase();
  const secretKey = String(env.VEXRAIL_SECRET_KEY || '').trim();
  const publishableKey = String(env.VEXRAIL_PUBLISHABLE_KEY || '').trim();
  const modelEconomics = parseVerifiedVexrailEconomics(env.EON_VEXRAIL_MODEL_ECONOMICS_JSON || '');
  const defaultGeoMode = rollout === 'testing' ? 'testing' : 'off';
  const geoModeValue = cleanText(env.EON_VEXRAIL_GEO_MODE || defaultGeoMode, 32).toLowerCase();
  const countries = parseCountryList(env.EON_VEXRAIL_COUNTRIES || '');
  const paidSponsoredOptIn = envFlag(env.EON_VEXRAIL_PAID_SPONSORED_OPT_IN, false);
  const guestOneShotEnabled = envFlag(env.EON_VEXRAIL_GUEST_ONE_SHOT, false);
  const guestNetworkDailyCap = positiveInt(env.EON_VEXRAIL_GUEST_NETWORK_DAILY_CAP, DEFAULT_GUEST_NETWORK_DAILY_CAP, 1, 1000);
  const guestMaxOutputTokens = positiveInt(env.EON_VEXRAIL_GUEST_MAX_OUTPUT_TOKENS, DEFAULT_GUEST_MAX_OUTPUT_TOKENS, 128, MAX_OUTPUT_TOKENS);
  const guestCookieDays = positiveInt(env.EON_VEXRAIL_GUEST_COOKIE_DAYS, DEFAULT_GUEST_COOKIE_DAYS, 1, 90);
  const globalDailyCap = positiveInt(env.EON_VEXRAIL_GLOBAL_DAILY_CAP, DEFAULT_GLOBAL_DAILY_CAP, 1, 1_000_000);
  const countryDailyCap = positiveInt(env.EON_VEXRAIL_COUNTRY_DAILY_CAP, DEFAULT_COUNTRY_DAILY_CAP, 1, 1_000_000);
  const networkHourlyCap = positiveInt(env.EON_VEXRAIL_NETWORK_HOURLY_CAP, DEFAULT_NETWORK_HOURLY_CAP, 1, 100_000);
  const networkDailyCap = positiveInt(env.EON_VEXRAIL_NETWORK_DAILY_CAP, DEFAULT_NETWORK_DAILY_CAP, 1, 1_000_000);
  const freeDailyCap = positiveInt(env.EON_VEXRAIL_FREE_DAILY_CAP, DEFAULT_FREE_DAILY_CAP, 1, 10_000);
  const paidFairUseHourlyCap = positiveInt(env.EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP, DEFAULT_PAID_FAIR_USE_HOURLY_CAP, 1, 10_000);
  const paidDailyCap = positiveInt(env.EON_VEXRAIL_PAID_DAILY_CAP, DEFAULT_PAID_DAILY_CAP, 1, 100_000);
  const freeDailyTokenCap = positiveInt(env.EON_VEXRAIL_FREE_DAILY_TOKEN_CAP, DEFAULT_FREE_DAILY_TOKEN_CAP, 1, 1_000_000_000);
  const paidDailyTokenCap = positiveInt(env.EON_VEXRAIL_PAID_DAILY_TOKEN_CAP, DEFAULT_PAID_DAILY_TOKEN_CAP, 1, 1_000_000_000);
  const countryDailyTokenCap = positiveInt(env.EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP, DEFAULT_COUNTRY_DAILY_TOKEN_CAP, 1, 1_000_000_000);
  const globalDailyTokenCap = positiveInt(env.EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP, DEFAULT_GLOBAL_DAILY_TOKEN_CAP, 1, 1_000_000_000);
  const botScoreMin = positiveInt(env.EON_VEXRAIL_BOT_SCORE_MIN, DEFAULT_BOT_SCORE_MIN, 1, 99);
  const blockedAsns = parseAsnList(env.EON_VEXRAIL_BLOCKED_ASNS || '');
  const requireCfMetadata = envFlag(env.EON_VEXRAIL_REQUIRE_CF_METADATA, environment === 'production');
  const turnstileModeValue = cleanText(env.EON_VEXRAIL_TURNSTILE_MODE || (environment === 'production' ? 'required' : 'off'), 16).toLowerCase();
  const turnstileSiteKey = cleanText(env.EON_VEXRAIL_TURNSTILE_SITE_KEY || '', 160);
  const turnstileSecret = String(env.EON_VEXRAIL_TURNSTILE_SECRET || '').trim();
  const defaultHostname = (() => { try { return new URL(String(env.APP_ORIGIN || '')).hostname.toLowerCase(); } catch { return ''; } })();
  const turnstileHostnames = parseHostnameList(env.EON_VEXRAIL_TURNSTILE_HOSTNAMES || defaultHostname);
  const profitabilityGovernor = getVexrailProfitabilityGovernorConfig(env);
  const missing = [];
  if (!ALLOWED_ROLLOUTS.has(rollout)) missing.push('EON_VEXRAIL_ROLLOUT');
  if (!ALLOWED_GEO_MODES.has(geoModeValue)) missing.push('EON_VEXRAIL_GEO_MODE');
  if (geoModeValue === 'selected_countries' && countries.length === 0) missing.push('EON_VEXRAIL_COUNTRIES');
  if (!ALLOWED_TURNSTILE_MODES.has(turnstileModeValue)) missing.push('EON_VEXRAIL_TURNSTILE_MODE');
  if (turnstileModeValue === 'required' && !turnstileSiteKey) missing.push('EON_VEXRAIL_TURNSTILE_SITE_KEY');
  if (turnstileModeValue === 'required' && !turnstileSecret) missing.push('EON_VEXRAIL_TURNSTILE_SECRET');
  if (turnstileModeValue === 'required' && turnstileHostnames.length === 0) missing.push('EON_VEXRAIL_TURNSTILE_HOSTNAMES');
  if (!secretKey) missing.push('VEXRAIL_SECRET_KEY');
  if (!publishableKey) missing.push('VEXRAIL_PUBLISHABLE_KEY');
  if (!modelEconomics.verified) missing.push('EON_VEXRAIL_MODEL_ECONOMICS_JSON');
  return Object.freeze({
    rollout: ALLOWED_ROLLOUTS.has(rollout) ? rollout : 'disabled',
    geoMode: ALLOWED_GEO_MODES.has(geoModeValue) ? geoModeValue : 'off',
    countries,
    signedInRequired: true,
    guestOneShotEnabled,
    guestNetworkDailyCap,
    guestMaxOutputTokens,
    guestCookieDays,
    paidSponsoredOptIn,
    globalDailyCap,
    countryDailyCap,
    networkHourlyCap,
    networkDailyCap,
    freeDailyCap,
    paidFairUseHourlyCap,
    paidDailyCap,
    freeDailyTokenCap,
    paidDailyTokenCap,
    countryDailyTokenCap,
    globalDailyTokenCap,
    botScoreMin,
    blockedAsns,
    requireCfMetadata,
    turnstileMode: ALLOWED_TURNSTILE_MODES.has(turnstileModeValue) ? turnstileModeValue : 'off',
    turnstileSiteKey,
    turnstileSecret,
    turnstileHostnames,
    profitabilityGovernor,
    configured: missing.length === 0,
    secretKey,
    publishableKey,
    dynamicModelRouting: true,
    economicsVerified: modelEconomics.verified === true,
    economicsModelCount: Object.keys(modelEconomics.models || {}).length,
    economicsReason: modelEconomics.reason || '',
    missing: Object.freeze(missing)
  });
}

export function normalizeVexrailRequest(input = {}) {
  const sourceMessages = Array.isArray(input?.messages) ? input.messages : [];
  const messages = [];
  let totalChars = 0;
  const errors = [];

  if (!sourceMessages.length) errors.push('messages_required');
  if (sourceMessages.length > MAX_MESSAGES) errors.push('too_many_messages');

  for (const entry of sourceMessages.slice(0, MAX_MESSAGES)) {
    const role = cleanText(entry?.role || '', 16).toLowerCase();
    const content = String(entry?.content || '').trim().slice(0, MAX_MESSAGE_CHARS);
    if (!ALLOWED_ROLES.has(role) || !content) {
      errors.push('invalid_message');
      continue;
    }
    totalChars += content.length;
    if (totalChars > MAX_TOTAL_MESSAGE_CHARS) {
      errors.push('conversation_too_large');
      break;
    }
    messages.push({ role, content });
  }

  const temperatureValue = Number(input?.temperature);
  const maxTokensValue = Number(input?.max_tokens ?? input?.max_completion_tokens);
  const temperature = Number.isFinite(temperatureValue) ? Math.min(1.5, Math.max(0, temperatureValue)) : 0.35;
  const maxTokens = Number.isFinite(maxTokensValue) ? Math.min(MAX_OUTPUT_TOKENS, Math.max(1, Math.floor(maxTokensValue))) : 1024;
  const conversationId = normalizeConversationId(input?.conversationId || input?.conversation_id || '');

  return Object.freeze({
    ok: errors.length === 0 && messages.length > 0,
    errors: Object.freeze([...new Set(errors)]),
    conversationId,
    sponsoredOptIn: input?.sponsoredOptIn === true || input?.sponsored_opt_in === true,
    guestOneShot: input?.guestOneShot === true || input?.guest_one_shot === true,
    turnstileToken: cleanText(input?.turnstileToken || input?.turnstile_token || '', 2048),
    payload: Object.freeze({
      messages: Object.freeze(messages),
      temperature,
      max_tokens: maxTokens,
      stream: input?.stream === true
    })
  });
}

async function readEligibility(context, config) {
  if (!context.env.EON_TRUST_DB?.prepare || String(context.env.EON_TRUST_RATE_LIMIT_SALT || '').length < 32) {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_rate_limit_unavailable', identityConfig: null, session: null, billing: null, accessClass: 'unavailable', geo: null, network: null });
  }
  if (!(await hasVexrailEconomicsLedger(context.env.EON_TRUST_DB))) {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_economics_ledger_unavailable', identityConfig: null, session: null, billing: null, accessClass: 'unavailable', geo: null, network: null });
  }

  const authRollout = cleanText(context.env.EON_AUTH_ROLLOUT || '', 16).toLowerCase();
  const authExpected = AUTH_ENABLED_ROLLOUTS.has(authRollout);
  if (!authExpected) {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_identity_unavailable', identityConfig: null, session: null, billing: null, accessClass: 'unavailable', geo: null, network: null });
  }

  let identityConfig = null;
  let session = null;
  try {
    identityConfig = getIdentityConfig(context.request, context.env);
    if (!identityConfig?.configured) {
      return Object.freeze({ ok: false, status: 503, error: 'vexrail_identity_unavailable', identityConfig, session: null, billing: null, accessClass: 'unavailable', geo: null, network: null });
    }
    session = await readSession(identityConfig, context.request);
  } catch {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_identity_unavailable', identityConfig: null, session: null, billing: null, accessClass: 'unavailable', geo: null, network: null });
  }

  const network = evaluateVexrailNetworkPolicy(config, context.request, context.env);
  if (!network.allowed) {
    return Object.freeze({ ok: false, status: 403, error: network.reason, identityConfig, session, billing: null, accessClass: 'network_blocked', geo: null, network });
  }
  const geo = evaluateVexrailGeoPolicy(config, context.request, context.env);
  if (!geo.allowed) {
    return Object.freeze({ ok: false, status: 403, error: geo.reason || 'vexrail_geo_unavailable', identityConfig, session, billing: null, accessClass: 'geo_blocked', geo, network });
  }

  // RT92 guest bootstrap: one privacy-minimal sponsored answer may be offered
  // before sign-in. The signed HttpOnly marker is a browser-level one-shot,
  // while Turnstile + network/country/global caps bound cookie-reset abuse.
  if (!session?.accountId) {
    if (!config.guestOneShotEnabled) {
      return Object.freeze({ ok: false, status: 401, error: 'vexrail_sign_in_required', identityConfig, session: null, billing: null, accessClass: 'sign_in_required', geo, network });
    }
    const marker = await readGuestMarker(context.request, context.env, config.guestCookieDays, Date.now());
    if (marker.used) {
      return Object.freeze({ ok: false, status: 403, error: 'vexrail_guest_one_shot_used', identityConfig, session: null, billing: null, accessClass: 'guest_used', geo, network });
    }
    return Object.freeze({ ok: true, status: 200, error: '', identityConfig, session: null, billing: null, accessClass: 'guest_one_shot', geo, network });
  }

  if (!context.env.EON_BILLING_DB?.prepare) {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_billing_unavailable', identityConfig, session, billing: null, accessClass: 'unavailable', geo, network });
  }

  try {
    const [entitlement, lifecycle] = await Promise.all([
      readAccountEntitlement(context.env.EON_BILLING_DB, session.accountId),
      readAccountBillingLifecycle(context.env.EON_BILLING_DB, session.accountId)
    ]);
    const billing = buildBillingStatusPayload(context.env, session.accountId, entitlement, lifecycle, null)?.account?.billing || null;
    if (!billing || billing.serverAuthoritative !== true) {
      return Object.freeze({ ok: false, status: 503, error: 'vexrail_billing_unavailable', identityConfig, session, billing: null, accessClass: 'unavailable', geo, network });
    }

    if (isEonPaidAdFreeBillingState(billing)) {
      if (!config.paidSponsoredOptIn) return Object.freeze({ ok: false, status: 403, error: 'vexrail_paid_ad_free', identityConfig, session, billing, accessClass: 'paid_blocked', geo, network });
      return Object.freeze({ ok: true, status: 200, error: '', identityConfig, session, billing, accessClass: 'paid_opt_in', geo, network });
    }

    return Object.freeze({ ok: true, status: 200, error: '', identityConfig, session, billing, accessClass: 'signed_in_free', geo, network });
  } catch {
    return Object.freeze({ ok: false, status: 503, error: 'vexrail_billing_unavailable', identityConfig, session, billing: null, accessClass: 'unavailable', geo, network });
  }
}

async function verifyVexrailHuman(context, config, token = '') {
  if (config.turnstileMode !== 'required') return Object.freeze({ ok: true, reason: 'not_required' });
  if (!token || token.length > 2048) return Object.freeze({ ok: false, reason: 'vexrail_human_verification_required' });
  const remoteip = trustRateLimitSubject(context.request, '');
  let result = null;
  try {
    const upstream = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ secret: config.turnstileSecret, response: token, ...(remoteip ? { remoteip } : {}) }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!upstream.ok) return Object.freeze({ ok: false, reason: 'vexrail_human_verification_unavailable' });
    result = await upstream.json();
  } catch {
    return Object.freeze({ ok: false, reason: 'vexrail_human_verification_unavailable' });
  }
  const hostname = cleanText(result?.hostname || '', 180).toLowerCase();
  const action = cleanText(result?.action || '', 80);
  // `sponsored_gemini` is the legacy Turnstile action token retained for widget compatibility; it never pins the dynamic upstream model.
  if (result?.success !== true || action !== 'sponsored_gemini' || !hostname || !config.turnstileHostnames.includes(hostname)) {
    return Object.freeze({ ok: false, reason: 'vexrail_human_verification_required' });
  }
  return Object.freeze({ ok: true, reason: 'verified' });
}

function publicStatus(config, eligibility) {
  const ready = config.configured && eligibility.ok;
  const paidOptInRequired = eligibility.accessClass === 'paid_opt_in';
  const guestOneShotAvailable = ready && eligibility.accessClass === 'guest_one_shot';
  const eligible = ready && !paidOptInRequired && eligibility.accessClass !== 'guest_one_shot';
  const eligibleByOptIn = ready && paidOptInRequired;
  return Object.freeze({
    schema: EON_VEXRAIL_SCHEMA,
    ok: true,
    configured: config.configured,
    rollout: config.rollout,
    geoMode: config.geoMode,
    country: eligibility.geo?.country || eligibility.network?.country || '',
    geoEligible: eligibility.geo?.allowed === true,
    geoReason: eligibility.geo?.reason || eligibility.error || 'vexrail_geo_unavailable',
    signedIn: Boolean(eligibility.session?.accountId),
    signedInRequired: true,
    signedInRequiredForContinuedUse: true,
    guestOneShotEnabled: config.guestOneShotEnabled === true,
    guestOneShotAvailable,
    accessClass: eligibility.accessClass || 'unavailable',
    eligible,
    eligibleByOptIn,
    sponsoredOptInRequired: paidOptInRequired,
    paidAdFree: paidOptInRequired || eligibility.error === 'vexrail_paid_ad_free',
    dynamicModelRouting: true,
    modelSelection: 'server_dynamic',
    routingMode: 'verified_cheapest_qualified',
    economicsVerified: config.economicsVerified === true,
    economicsModelCount: Number(config.economicsModelCount || 0),
    profitabilityGovernorMode: config.profitabilityGovernor?.mode || 'observe',
    aiCoverageTarget: config.profitabilityGovernor?.targetRatio || 1.25,
    reason: guestOneShotAvailable ? 'guest_one_shot_available' : (eligible ? 'ready' : (eligibleByOptIn ? 'paid_opt_in_available' : (eligibility.error || (config.configured ? 'unavailable' : 'vexrail_not_configured')))),
    sponsoredContentPossible: guestOneShotAvailable || eligible || eligibleByOptIn,
    turnstileRequired: config.turnstileMode === 'required',
    turnstileSiteKey: config.turnstileMode === 'required' ? config.turnstileSiteKey : '',
    globalDailyCap: config.globalDailyCap,
    countryDailyCap: config.countryDailyCap,
    networkHourlyCap: config.networkHourlyCap,
    networkDailyCap: config.networkDailyCap,
    freeDailyCap: config.freeDailyCap,
    paidFairUseHourlyCap: config.paidFairUseHourlyCap,
    paidDailyCap: config.paidDailyCap,
    freeDailyTokenCap: config.freeDailyTokenCap,
    paidDailyTokenCap: config.paidDailyTokenCap,
    tokenBudgetGuard: true,
    sensitiveDataGuard: true,
    upstreamConversationIdHashed: true,
    economicsLedgerRequired: true,
    economicsLedgerAggregateOnly: true,
    localAiRerouted: false,
    byokCredentialAccepted: false,
    groundingForwarded: false,
    secretsExposed: false,
    serverRateLimitReady: Boolean(eligibility.error !== 'vexrail_rate_limit_unavailable'),
    rateLimitClass: eligibility.accessClass === 'guest_one_shot' ? 'guest_one_shot' : (eligibility.accessClass === 'signed_in_free' ? 'signed_in_free' : (eligibility.accessClass === 'paid_opt_in' ? 'paid_opt_in' : 'unavailable'))
  });
}

function response(body, status = 200) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
}

export async function onRequestGet(context) {
  const config = getVexrailConfig(context.env);
  const eligibility = await readEligibility(context, config);
  return response(publicStatus(config, eligibility), 200);
}

export async function executeVexrailRequest(context, inputOverride = null, options = {}) {
  const config = getVexrailConfig(context.env);
  if (!config.configured) return response({ ok: false, error: 'vexrail_not_configured' }, 503);

  let requestOrigin = '';
  let appOrigin = '';
  try {
    requestOrigin = new URL(context.request.url).origin;
    appOrigin = new URL(String(context.env.APP_ORIGIN || '')).origin;
  } catch {}
  const sameOriginConfig = Object.freeze({ configured: Boolean(requestOrigin && appOrigin && requestOrigin === appOrigin), appOrigin });
  if (!enforceSameOriginMutation(context.request, sameOriginConfig)) return response({ ok: false, error: 'same_origin_required' }, 403);

  const eligibility = await readEligibility(context, config);
  if (!eligibility.ok) return response({ ok: false, error: eligibility.error }, eligibility.status);
  if (options?.requireSignedIn === true && !eligibility.session?.accountId) {
    return response({ ok: false, error: 'vexrail_sign_in_required' }, 401);
  }
  await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_eligible', context.request, context.env, Date.now());

  const parsed = inputOverride && typeof inputOverride === 'object'
    ? { ok: true, value: inputOverride, status: 200 }
    : await readBoundedJson(context.request, { maxBytes: EON_REQUEST_LIMITS.aiProxy });
  if (!parsed.ok) return response({ ok: false, error: parsed.error }, parsed.status);
  const normalized = normalizeVexrailRequest(parsed.value);
  if (!normalized.ok) return response({ ok: false, error: 'vexrail_invalid_request', details: normalized.errors }, 400);
  if (eligibility.accessClass === 'guest_one_shot' && normalized.guestOneShot !== true) {
    return response({ ok: false, error: 'vexrail_guest_one_shot_required' }, 403);
  }
  if (eligibility.accessClass === 'paid_opt_in' && normalized.sponsoredOptIn !== true) {
    return response({ ok: false, error: 'vexrail_paid_opt_in_required' }, 403);
  }
  const privacyCheck = inspectVexrailSensitiveData(normalized.payload.messages);
  if (!privacyCheck.ok) {
    return response({ ok: false, error: 'vexrail_sensitive_data_blocked', categories: privacyCheck.categories }, 422);
  }
  const effectivePayload = eligibility.accessClass === 'guest_one_shot'
    ? Object.freeze({ ...normalized.payload, max_tokens: Math.min(config.guestMaxOutputTokens, normalized.payload.max_tokens) })
    : normalized.payload;
  const estimatedTokenUnits = estimateVexrailTokenUnits(effectivePayload);
  const human = await verifyVexrailHuman(context, config, normalized.turnstileToken);
  if (!human.ok) return response({ ok: false, error: human.reason }, human.reason === 'vexrail_human_verification_unavailable' ? 503 : 403);

  const route = await selectVexrailModelRoute({ config, payload: effectivePayload, env: context.env });
  if (!route.ok) return response({ ok: false, error: route.reason || 'vexrail_model_unavailable' }, 503);
  const routedPayload = Object.freeze({ ...effectivePayload, model: route.model });
  const country = eligibility.geo?.country || eligibility.network?.country || '';
  if (!country) return response({ ok: false, error: 'vexrail_geo_unavailable' }, 403);
  const profitability = await readVexrailProfitabilityGovernor(context.env.EON_TRUST_DB, {
    country, requestClass: route.requestClass, userCohort: cleanText(options?.profitabilityCohort || '', 40)
  }, context.env, Date.now());
  // A new country/class has no reconciled evidence yet, so requiring GREEN
  // here would permanently prevent the bounded learning traffic that creates
  // that evidence. The governor remains authoritative: GREEN is admitted,
  // YELLOW is admitted only while its configured learning budget permits it,
  // and RED never receives a guest request.
  const guestProfitabilityAllowed = profitability.state === 'GREEN'
    || (profitability.state === 'YELLOW' && profitability.allowed);
  if (eligibility.accessClass === 'guest_one_shot' && !guestProfitabilityAllowed) {
    return response({ ok: false, error: 'vexrail_guest_profitability_unavailable', economicsState: profitability.state, reason: profitability.reason }, 403);
  }
  if (eligibility.accessClass !== 'guest_one_shot' && !profitability.allowed) {
    return response({ ok: false, error: 'vexrail_profitability_guard', economicsState: profitability.state, reason: profitability.reason }, 503);
  }

  // Only valid, authenticated, human-verified AI requests consume publisher-credit budgets.
  // The nested caps are intentionally conservative during launch. They protect
  // profitability even if an account farm, shared VPN/VPS exit, or one country
  // creates abnormal traffic. Earlier buckets may count a request later denied
  // by a broader bucket; that conservative over-count is safer than under-count.
  const accountId = eligibility.session?.accountId || '';
  const isPaidSponsored = eligibility.accessClass === 'paid_opt_in';
  const isGuestOneShot = eligibility.accessClass === 'guest_one_shot';
  const networkSubject = trustRateLimitSubject(context.request, '');
  if (!networkSubject) return response({ ok: false, error: 'vexrail_network_unverified' }, 403);

  if (isGuestOneShot) {
    const guestNetwork = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_guest_network_daily', networkSubject, Date.now(), { limit: config.guestNetworkDailyCap, windowMs: DAY_MS });
    if (!guestNetwork.ok) {
      const limited = guestNetwork.error === 'trust_rate_limit_exceeded';
      return response({ ok: false, error: limited ? 'vexrail_guest_network_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
    }
  } else {
    const hourlyScope = isPaidSponsored ? 'vexrail_paid_fair_use' : 'vexrail';
    const hourlyLimit = isPaidSponsored ? config.paidFairUseHourlyCap : undefined;
    const dailyScope = isPaidSponsored ? 'vexrail_paid_daily' : 'vexrail_account_daily';
    const dailyLimit = isPaidSponsored ? config.paidDailyCap : config.freeDailyCap;
    const accountHourly = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, hourlyScope, accountId, Date.now(), hourlyLimit ? { limit: hourlyLimit } : {});
    if (!accountHourly.ok) {
      const limited = accountHourly.error === 'trust_rate_limit_exceeded';
      return response({ ok: false, error: limited ? (isPaidSponsored ? 'vexrail_paid_fair_use_limited' : 'vexrail_rate_limited') : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
    }
    const accountDaily = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, dailyScope, accountId, Date.now(), { limit: dailyLimit, windowMs: DAY_MS });
    if (!accountDaily.ok) {
      const limited = accountDaily.error === 'trust_rate_limit_exceeded';
      return response({ ok: false, error: limited ? 'vexrail_account_daily_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
    }
    const accountTokenScope = isPaidSponsored ? 'vexrail_paid_token_daily' : 'vexrail_free_token_daily';
    const accountTokenLimit = isPaidSponsored ? config.paidDailyTokenCap : config.freeDailyTokenCap;
    const accountTokens = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, accountTokenScope, accountId, Date.now(), { limit: accountTokenLimit, windowMs: DAY_MS, increment: estimatedTokenUnits });
    if (!accountTokens.ok) {
      const limited = accountTokens.error === 'trust_rate_limit_exceeded';
      return response({ ok: false, error: limited ? 'vexrail_account_token_budget_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
    }
  }

  const networkHourly = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_network_hourly', networkSubject, Date.now(), { limit: config.networkHourlyCap });
  if (!networkHourly.ok) {
    const limited = networkHourly.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_network_rate_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }
  const networkDaily = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_network_daily', networkSubject, Date.now(), { limit: config.networkDailyCap, windowMs: DAY_MS });
  if (!networkDaily.ok) {
    const limited = networkDaily.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_network_daily_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }

  const countryDaily = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_country_daily', `country:${country}`, Date.now(), { limit: config.countryDailyCap, windowMs: DAY_MS });
  if (!countryDaily.ok) {
    const limited = countryDaily.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_country_budget_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }
  const countryTokens = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_country_token_daily', `country:${country}`, Date.now(), { limit: config.countryDailyTokenCap, windowMs: DAY_MS, increment: estimatedTokenUnits });
  if (!countryTokens.ok) {
    const limited = countryTokens.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_country_token_budget_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }

  const globalAllowance = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_global_daily', `global:${config.rollout}`, Date.now(), { limit: config.globalDailyCap, windowMs: DAY_MS });
  if (!globalAllowance.ok) {
    const limited = globalAllowance.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_global_budget_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }
  const globalTokens = await consumeTrustRateLimit(context.env.EON_TRUST_DB, context.env, 'vexrail_global_token_daily', `global:${config.rollout}`, Date.now(), { limit: config.globalDailyTokenCap, windowMs: DAY_MS, increment: estimatedTokenUnits });
  if (!globalTokens.ok) {
    const limited = globalTokens.error === 'trust_rate_limit_exceeded';
    return response({ ok: false, error: limited ? 'vexrail_global_token_budget_limited' : 'vexrail_rate_limit_unavailable' }, limited ? 429 : 503);
  }

  // Profitability cannot be governed from request limits alone. Before Vexrail
  // contact, persist only an aggregate country/access-class admission receipt.
  // No account, IP, prompt, response or conversation identifier enters this table.
  const economicAdmission = await recordVexrailEconomicAdmission(
    context.env.EON_TRUST_DB, country, eligibility.accessClass, estimatedTokenUnits, Date.now()
  );
  if (!economicAdmission) return response({ ok: false, error: 'vexrail_economics_ledger_unavailable' }, 503);
  await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_request_started', context.request, context.env, Date.now());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('vexrail_timeout'), UPSTREAM_TIMEOUT_MS);
  const abortFromClient = () => controller.abort('client_aborted');
  let clientAbortListenerAttached = false;
  if (context.request.signal?.aborted) {
    controller.abort('client_aborted');
  } else if (context.request.signal?.addEventListener) {
    context.request.signal.addEventListener('abort', abortFromClient, { once: true });
    clientAbortListenerAttached = true;
  }

  try {
    const headers = {
      'content-type': 'application/json',
      accept: routedPayload.stream ? 'text/event-stream' : 'application/json',
      'x-secret-key': config.secretKey,
      'x-publishable-key': config.publishableKey
    };
    const upstreamConversationId = await deriveUpstreamConversationId(accountId, normalized.conversationId, context.env);
    if (upstreamConversationId) headers['x-conversation-id'] = upstreamConversationId;

    const upstreamStartedAt = Date.now();
    const upstream = await fetch(VEXRAIL_UPSTREAM, {
      method: 'POST',
      headers,
      body: JSON.stringify(routedPayload),
      signal: controller.signal
    });

    if (!upstream.ok) {
      await recordVexrailModelObservation(context.env.EON_TRUST_DB, country, route.model, route.requestClass, { success: false, latencyMs: Date.now() - upstreamStartedAt }, Date.now());
      await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_provider_error', context.request, context.env, Date.now());
      return response({ ok: false, error: `vexrail_upstream_${upstream.status}` }, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502);
    }

    await recordVexrailProfitabilityPrompt(context.env.EON_TRUST_DB, context.request, context.env, {
      country, modelId: route.model, requestClass: route.requestClass,
      userCohort: cleanText(options?.profitabilityCohort || eligibility.accessClass, 40)
    }, Date.now());
    const upstreamType = String(upstream.headers.get('content-type') || '').toLowerCase();
    // Vexrail documents x-conversation-id as a publisher-supplied identifier.
    // Echo the validated value we sent so the browser can retain continuity even
    // if the upstream does not return that header.
    const conversationHeader = normalized.conversationId;
    const guestUsedCookie = isGuestOneShot ? await buildGuestUsedCookie(context.env, country, config.guestCookieDays, Date.now()) : '';
    const commonHeaders = {
      'cache-control': 'no-store, max-age=0',
      vary: 'cookie',
      'x-eon-vexrail-model': route.model,
      'x-eon-vexrail-routing': route.routingMode,
      'x-eon-economics-state': profitability.state,
      ...(guestUsedCookie ? { 'set-cookie': guestUsedCookie, 'x-eon-guest-one-shot': 'consumed' } : {}),
      ...(conversationHeader ? { 'x-conversation-id': conversationHeader } : {})
    };

    if (routedPayload.stream || upstreamType.includes('text/event-stream')) {
      if (!upstream.body) return response({ ok: false, error: 'vexrail_empty_stream' }, 502);
      // Upstream accepted the streamed request. Exact token usage is not parsed
      // server-side here because the SSE body is passed through without buffering.
      await recordVexrailEconomicSuccess(context.env.EON_TRUST_DB, country, eligibility.accessClass, null, Date.now());
      await recordVexrailModelObservation(context.env.EON_TRUST_DB, country, route.model, route.requestClass, { success: true, latencyMs: Date.now() - upstreamStartedAt }, Date.now());
      await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_response_success', context.request, context.env, Date.now());
      return new Response(upstream.body, {
        status: 200,
        headers: securityHeaders({ ...commonHeaders, 'content-type': 'text/event-stream; charset=utf-8', 'x-accel-buffering': 'no' })
      });
    }

    const text = await upstream.text();
    if (text.length > 2 * 1024 * 1024) {
      await recordVexrailModelObservation(context.env.EON_TRUST_DB, country, route.model, route.requestClass, { success: false, latencyMs: Date.now() - upstreamStartedAt }, Date.now());
      return response({ ok: false, error: 'vexrail_response_too_large' }, 502);
    }
    let payload;
    try { payload = JSON.parse(text); }
    catch {
      await recordVexrailModelObservation(context.env.EON_TRUST_DB, country, route.model, route.requestClass, { success: false, latencyMs: Date.now() - upstreamStartedAt }, Date.now());
      return response({ ok: false, error: 'vexrail_invalid_upstream_json' }, 502);
    }
    await recordVexrailEconomicSuccess(context.env.EON_TRUST_DB, country, eligibility.accessClass, payload, Date.now());
    await recordVexrailModelObservation(context.env.EON_TRUST_DB, country, route.model, route.requestClass, { success: true, payload, latencyMs: Date.now() - upstreamStartedAt }, Date.now());
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_response_success', context.request, context.env, Date.now());
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: securityHeaders({ ...commonHeaders, 'content-type': 'application/json; charset=utf-8' })
    });
  } catch (error) {
    const aborted = controller.signal.aborted;
    await recordGrowthOperationalEvent(context.env.EON_TRUST_DB, 'vexrail_provider_error', context.request, context.env, Date.now());
    return response({ ok: false, error: aborted ? 'vexrail_timeout_or_cancelled' : 'vexrail_network_error' }, aborted ? 504 : 502);
  } finally {
    clearTimeout(timeout);
    if (clientAbortListenerAttached) context.request.signal.removeEventListener?.('abort', abortFromClient);
  }
}

export async function onRequestPost(context) {
  return executeVexrailRequest(context);
}

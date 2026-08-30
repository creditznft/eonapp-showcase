/**
 * Subscription Feature Gates — EONAPP.CH
 * ========================================
 * Thin feature-gate layer wrapping entitlements.js.
 *
 * Architecture:
 * - entitlements.js handles: plan tiers, billing state, EonLite/stable payment, history
 * - subscription.js handles: WHAT each tier unlocks in WorkBench and tools
 * - All checks are local-first (no server round-trip required for gating)
 * - For real-money purchases: EonLite on-chain burn or signed license code (local verify)
 * - Social video uploads are plan quotas (monthly per platform), not a separate payment rail
 *
 * Plan tiers (from entitlements.js PLAN_DEFS) — WorkBench era (S4 update):
 *   free      — Core AI modes, Vault, Pool Points 1x (cap 500/day), NFT lootbox drops
 *   spark     — $1/mo: 1.5x Pool Points, ad-free, priority AI, challenge streaks (cap 750/day)
 *   builder   — $5/mo: 2x Pool Points, creator workflows, AI budget, compute access (cap 1500/day)
 *   pro       — $15/mo: 3x Pool Points, monthly legendary lootbox, advanced AI, priority inference (cap 2000/day)
 *   operator  — $50/mo: 5x Pool Points, governance, priority epoch, full workspace, API access (cap 3000/day)
 *
 * License code format (local verification — no server dependency):
 *   Base64URL(uid).Base64URL(planId).Base64URL(expiresAt).nonce.hmac
 *   - Codes are verified locally against the device's Nostr identity key
 *   - No central Worker required for verification
 *
 * @module utils/subscription
 */

import {
  getEntitlementState,
  isPlanAtLeast,
  activatePlan,
  getPlans,
  getPlan
} from './entitlements.js';
import { getProfile, isAdminProfile } from './profile.js';
import { getTrustedNow, observeTrustedTime } from './trusted-time.js';
const subscriptionWin = /** @type {any} */ (window);
const rootScope = /** @type {any} */ (globalThis);

function trustedNowFloor() {
  try {
    return typeof getTrustedNow === 'function' ? getTrustedNow() : Date.now();
  } catch {
    return Date.now();
  }
}

function _observeTrustedFloor(/** @type {any} */ value) {
  try {
    return typeof observeTrustedTime === 'function' ? observeTrustedTime(value) : trustedNowFloor();
  } catch {
    return trustedNowFloor();
  }
}
void _observeTrustedFloor;

const LICENSE_PART_RE = /^[A-Za-z0-9_-]{1,512}$/;
const MAX_LICENSE_CODE_LENGTH = 4096;
const LICENSE_HMAC_PREFIX = 'eon-subscription-license:v1';
const SOCIAL_VIDEO_USAGE_KEY = 'eon:social-video:usage:v1';
const SOCIAL_VIDEO_UPLOAD_PLATFORMS = new Set(['youtube', 'tiktok', 'instagram']);
const /** @type {Record<string, number>} */
SOCIAL_VIDEO_UPLOAD_LIMITS = {
  free: 5,
  spark: 12,
  builder: 30,
  pro: 80,
  operator: 250
};
const LEGACY_SUBSCRIPTION_PLAN_ALIASES = {
  supporter: 'spark',
  starter: 'spark',
  core: 'builder',
  creator: 'pro',
  business: 'operator'
};

function decodeBase64UrlPart(/** @type {any} */ part) {
  const normalized = String(part || '').trim();
  if (!LICENSE_PART_RE.test(normalized)) {
    throw new Error('invalid-license-part');
  }
  const padded = normalized.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = atob(padded);
  // eslint-disable-next-line no-control-regex
  if (!decoded || /[\u0000-\u001f\u007f]/.test(decoded)) {
    throw new Error('invalid-license-value');
  }
  return decoded.trim().slice(0, 256);
}

function encodeBase64UrlPart(/** @type {any} */ value) {
  const encoded = btoa(unescape(encodeURIComponent(String(value || ''))));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function hexToBytes(/** @type {any} */ hex) {
  const normalized = String(hex || '').trim();
  if (!normalized || normalized.length % 2 !== 0 || /[^a-f0-9]/i.test(normalized)) {
    throw new Error('invalid-identity-key');
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function getDeviceIdentityKeyHex() {
  try {
    const mod = await import('./p2p-nostr.js');
    if (typeof mod.getNostrSecretKeyHex === 'function') {
      return String(await mod.getNostrSecretKeyHex() || '').trim().toLowerCase() || null;
    }
  } catch {}
  return null;
}

async function signLicensePayload(/** @type {any} */ message, /** @type {any} */ identityKeyHex) {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error('crypto-unavailable');
  }
  const key = await webCrypto.subtle.importKey(
    'raw',
    hexToBytes(identityKeyHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await webCrypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(message || '')));
  return Array.from(new Uint8Array(sig)).map((/** @type {any} */ b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyLicensePayload(/** @type {any} */ message, /** @type {any} */ signature, /** @type {any} */ identityKeyHex) {
  if (!signature || !identityKeyHex) {
    return false;
  }
  try {
    const expected = await signLicensePayload(message, identityKeyHex);
    return String(signature || '').trim().toLowerCase() === expected;
  } catch {
    return false;
  }
}

function clampInt(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, Math.floor(numeric)));
}

function normalizePlanId(/** @type {any} */ planId) {
  const raw = String(planId || '').trim().toLowerCase();
  if (LEGACY_SUBSCRIPTION_PLAN_ALIASES[raw]) {
    return LEGACY_SUBSCRIPTION_PLAN_ALIASES[raw];
  }
  return Object.prototype.hasOwnProperty.call(SOCIAL_VIDEO_UPLOAD_LIMITS, raw) ? raw : 'free';
}

function normalizeSocialVideoPlatform(/** @type {any} */ platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  return SOCIAL_VIDEO_UPLOAD_PLATFORMS.has(normalized) ? normalized : '';
}

function getQuotaMonthKey(/** @type {any} */ date = new Date()) {
  try {
    return new Date(date).toISOString().slice(0, 7);
  } catch {
    return new Date().toISOString().slice(0, 7);
  }
}

function getSocialVideoUsageStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOCIAL_VIDEO_USAGE_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSocialVideoUsageStore(/** @type {any} */ store) {
  try {
    localStorage.setItem(SOCIAL_VIDEO_USAGE_KEY, JSON.stringify(store || {}));
  } catch {
    // ignore storage quota failures in local-first mode
  }
}

function getSocialVideoUsageEntry(/** @type {any} */ store, /** @type {any} */ monthKey) {
  if (!store[monthKey] || typeof store[monthKey] !== 'object') {
    store[monthKey] = {};
  }
  return store[monthKey];
}

function getSocialVideoMonthLabel(/** @type {any} */ monthKey) {
  const [year, month] = String(monthKey || '').split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey || '';
  const dt = new Date(Date.UTC(year, Math.max(0, month - 1), 1));
  return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * Returns the monthly upload quota for social video platforms.
 * Admin/operator profiles bypass limits.
 * @param {string} planId
 * @returns {number}
 */
export function getSocialVideoUploadLimit(/** @type {any} */ planId = getCurrentPlan()) {
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return Number.POSITIVE_INFINITY;
  }
  const limits = /** @type {Record<string, number>} */ (SOCIAL_VIDEO_UPLOAD_LIMITS);
  return limits[normalizePlanId(planId)] ?? limits.free;
}

/**
 * Returns true when the given platform is part of the monthly social video wedge.
 * @param {string} platform
 * @returns {boolean}
 */
export function isSocialVideoUploadPlatform(/** @type {any} */ platform) {
  return SOCIAL_VIDEO_UPLOAD_PLATFORMS.has(normalizeSocialVideoPlatform(platform));
}

/**
 * Returns the current month usage summary for one social video platform.
 * @param {string} platform
 * @param {{ planId?: string, date?: Date | string | number }} [opts]
 * @returns {{ platform: string, platformLabel: string, planId: string, monthKey: string, monthLabel: string, limit: number, used: number, remaining: number, ok: boolean, reason: string }}
 */
export function getSocialVideoUploadUsage(/** @type {any} */ platform, /** @type {any} */ opts = {}) {
  const normalizedPlatform = normalizeSocialVideoPlatform(platform);
  const planId = normalizePlanId(opts.planId || getCurrentPlan());
  const monthKey = getQuotaMonthKey(opts.date || new Date());
  const limit = getSocialVideoUploadLimit(planId);
  const store = getSocialVideoUsageStore();
  const monthBucket = getSocialVideoUsageEntry(store, monthKey);
  const used = clampInt(monthBucket[normalizedPlatform] || 0, 0, SOCIAL_VIDEO_UPLOAD_LIMITS.operator);
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Number.POSITIVE_INFINITY;
  const ok = !normalizedPlatform || !Number.isFinite(limit) ? true : used < limit;
  return {
    platform: normalizedPlatform,
    platformLabel: normalizedPlatform ? normalizedPlatform.charAt(0).toUpperCase() + normalizedPlatform.slice(1) : String(platform || ''),
    planId,
    monthKey,
    monthLabel: getSocialVideoMonthLabel(monthKey),
    limit,
    used,
    remaining,
    ok,
    reason: ok ? 'ok' : 'monthly-limit-reached'
  };
}

/**
 * Returns a readable summary for the video platforms users care about.
 * @param {string} [planId]
 * @returns {Array<{ platform: string, platformLabel: string, planId: string, monthLabel: string, limit: number, used: number, remaining: number, ok: boolean, reason: string }>}
 */
export function getSocialVideoQuotaSummary(/** @type {any} */ planId = getCurrentPlan()) {
  return ['youtube', 'tiktok', 'instagram'].map((platform) => getSocialVideoUploadUsage(platform, { planId }));
}

/**
 * Returns whether the user can still publish to the given social video platform this month.
 * @param {string} platform
 * @param {{ planId?: string, date?: Date | string | number }} [opts]
 * @returns {{ ok: boolean, platform: string, platformLabel: string, planId: string, monthKey: string, monthLabel: string, limit: number, used: number, remaining: number, reason: string, message: string }}
 */
export function canUseSocialVideoUpload(/** @type {any} */ platform, /** @type {any} */ opts = {}) {
  const usage = getSocialVideoUploadUsage(platform, opts);
  const message = usage.ok
    ? `${usage.platformLabel} upload allowance: ${usage.used}/${usage.limit === Number.POSITIVE_INFINITY ? '∞' : usage.limit} used this month.`
    : `${usage.platformLabel} monthly upload limit reached (${usage.limit}/${usage.limit}). Upgrade your plan to publish more.`;
  return { ...usage, message };
}

/**
 * Records a social video upload or publish action against the monthly quota.
 * @param {string} platform
 * @param {{ planId?: string, date?: Date | string | number }} [opts]
 * @returns {{ ok: boolean, recorded: boolean, platform: string, platformLabel: string, planId: string, monthKey: string, monthLabel: string, limit: number, used: number, remaining: number, reason: string, message: string }}
 */
export function recordSocialVideoUpload(/** @type {any} */ platform, /** @type {any} */ opts = {}) {
  const usage = canUseSocialVideoUpload(platform, opts);
  if (!usage.platform) {
    return { ...usage, ok: false, recorded: false, reason: 'not-a-video-platform', message: 'This platform does not use the social video quota.' };
  }
  if (!usage.ok) {
    return { ...usage, recorded: false };
  }
  if (!Number.isFinite(usage.limit)) {
    return { ...usage, recorded: true };
  }

  const store = getSocialVideoUsageStore();
  const monthBucket = getSocialVideoUsageEntry(store, usage.monthKey);
  monthBucket[usage.platform] = clampInt(monthBucket[usage.platform] || 0, 0, SOCIAL_VIDEO_UPLOAD_LIMITS.operator) + 1;
  saveSocialVideoUsageStore(store);
  const after = getSocialVideoUploadUsage(usage.platform, { planId: usage.planId, date: opts.date || new Date() });
  return {
    ...after,
    recorded: true,
    message: `${after.platformLabel} upload recorded for ${after.monthLabel}. ${after.used}/${after.limit === Number.POSITIVE_INFINITY ? '∞' : after.limit} used.`
  };
}

// ─── Feature gate definitions ──────────────────────────────────────────────────

/**
 * Feature keys and their minimum plan requirements.
 * Any plan at or above the minimum tier has access.
 *
 * Convention: 'games:{feature}', 'tools:{feature}', 'vault:{feature}'
 */
/** @type {Record<string, string>} */
export const /** @type {any} */
FEATURE_GATES = {
  // Legacy aliases kept for compatibility with existing tests/callers.
  'games:play-all':           'free',
  'games:tournament-entry':   'pro',

  // ── WorkBench (core AI modes) ────────────────────────────────────────────────
  'workbench:ask':             'free',    // Ask mode (basic AI chat)
  'workbench:build':           'free',    // Build mode (structured AI output)
  'workbench:code':            'free',    // Code mode (code generation)
  'workbench:analyze':         'free',    // Analyze mode (AI analysis)
  'workbench:hive':            'free',    // Hive mode (4-perspective panel)
  'workbench:signal':          'free',    // Signal mode (market intelligence)
  'workbench:creator':         'builder', // Creator mode (content generation)
  'workbench:agent':           'builder', // Agent mode (autonomous tasks)
  'workbench:moderator':       'builder', // Moderator mode (content review)
  'workbench:twin':            'pro',     // Twin mode (persistent AI companion)
  'workbench:voice':           'spark',   // Voice mode (STT + TTS)
  'workbench:language':        'spark',   // Language mode (11 supported interface languages)
  'workbench:iot':             'spark',   // IoT Control Hub
  'workbench:compute':         'builder', // Compute Marketplace
  'workbench:browser':         'free',    // EON Browser mode

  // ── Pool Points & Earning ────────────────────────────────────────────────────
  'earn:pool-points':          'free',    // earn Pool Points (1x, 500/day cap)
  'earn:pool-points-1.5x':    'spark',   // 1.5x Pool Point earning rate (750/day cap)
  'earn:pool-points-2x':       'builder', // 2x Pool Point earning rate (1500/day cap)
  'earn:pool-points-3x':       'pro',     // 3x Pool Point earning rate (2000/day cap)
  'earn:pool-points-5x':       'operator',// 5x Pool Point earning rate (3000/day cap)
  'earn:lootbox-drops':        'free',    // NFT lootbox drops from missions
  'earn:lootbox-boost':        'spark',   // priority lootbox drops (better rarity odds)
  'earn:monthly-legendary':    'pro',     // guaranteed monthly legendary lootbox
  'earn:challenge-streaks':    'spark',   // challenge streak tracking + badge

  // ── AI (budget + providers) ──────────────────────────────────────────────────
  'ai:basic':                  'free',    // basic AI mode (rate-limited)
  'ai:extended-budget':        'builder', // extended AI token budget per session
  'ai:priority-provider':      'pro',     // priority AI provider routing
  'ai:unlimited-budget':       'operator',// no AI budget cap

  // ── IoT Control Hub ─────────────────────────────────────────────────────────
  'iot:devices-3':             'spark',   // up to 3 IoT devices
  'iot:devices-10':            'builder', // up to 10 IoT devices
  'iot:devices-25':            'pro',     // up to 25 IoT devices
  'iot:devices-100':           'operator',// up to 100 IoT devices
  'iot:automation':            'builder', // automation rules engine
  'iot:scene-scheduling':      'pro',     // time-based scene activation

  // ── Voice ────────────────────────────────────────────────────────────────────
  'voice:stt':                 'spark',   // Speech-to-Text input
  'voice:tts':                 'spark',   // Text-to-Speech playback
  'voice:ai-command':          'builder', // AI interprets voice commands
  'voice:music-gen':           'pro',     // AI voice music generation

  // ── Language ────────────────────────────────────────────────────────────────
  'lang:translate':            'spark',   // translation across supported languages
  'lang:50plus':               'builder', // legacy entitlement id: 11 supported languages
  'lang:rtl':                  'builder', // RTL language support
  'lang:contribution':         'pro',     // community contribution portal

  // ── Compute Marketplace ──────────────────────────────────────────────────────
  'compute:access':            'builder', // buy/sell compute units
  'compute:premium-tier':      'pro',     // datacenter-tier access
  'compute:api-access':        'operator',// compute API (programmatic)

  // ── Creator ──────────────────────────────────────────────────────────────────
  'creator:hooks':             'free',    // basic creator hooks
  'creator:workspace':         'builder', // full creator workspace
  'creator:campaign-tracker':  'pro',     // campaign performance tracking

  // ── Vault ────────────────────────────────────────────────────────────────────
  'vault:basic':               'free',
  'vault:export-import':       'free',
  'vault:p2p-offers':          'free',
  'vault:analytics':           'pro',     // vault analytics dashboard
  'vault:bulk-merge':          'builder', // bulk lootbox merge
  'vault:priority-epoch':      'operator',// early epoch claim window
  'vault:governance':          'operator',// on-chain governance actions

  // ── Moderation ───────────────────────────────────────────────────────────────
  'mod:queue-basic':           'builder', // moderation queue (25 items)
  'mod:queue-unlimited':       'pro',     // unlimited moderation queue
  'mod:ai-auto':               'operator',// AI auto-moderation

  // ── Tools / Export ───────────────────────────────────────────────────────────
  'tools:use-basic':           'free',
  'tools:unlimited-runs':      'spark',   // remove per-day tool run limits
  'tools:export-csv':          'builder', // CSV/JSON export from tool results
  'tools:batch-mode':          'builder', // batch input processing
  'tools:api-access':          'operator',// direct API access to tool results
  'tools:advanced-settings':   'pro',     // advanced model/prompt settings
  'tools:custom-templates':    'pro'      // save and reuse custom tool templates
};

// ─── Main gate check ───────────────────────────────────────────────────────────

/**
 * Returns true if the current user's plan has access to the specified feature.
 * @param {string} featureKey - One of the FEATURE_GATES keys
 * @returns {boolean}
 */
/** @param {string} featureKey */
export function hasFeature(/** @type {any} */ featureKey) {
  const minimumPlan = FEATURE_GATES[featureKey];
  if (!minimumPlan) {
    // Unknown feature keys default to gated (safe fail)
    if (subscriptionWin.DEBUG) {
      console.warn(`[subscription] Unknown feature gate: ${featureKey}`);
    }
    return false;
  }
  const state = getEntitlementState();
  return isPlanAtLeast(state.activePlanId, minimumPlan);
}

/**
 * Returns the current plan tier of the user.
 * @returns {string}
 */
export function getCurrentPlan() {
  return getEntitlementState().activePlanId || 'free';
}

/**
 * Returns the current entitlements state (full).
 * @returns {object}
 */
export function getSubscriptionState() {
  return getEntitlementState();
}

// ─── Upgrade prompt helpers ────────────────────────────────────────────────────

/**
 * Returns the minimum plan needed for a feature.
 * Useful for showing upgrade prompts.
 * @param {string} featureKey
 * @returns {string | null} plan ID string, or null if feature unknown
 */
export function getRequiredPlanFor(/** @type {any} */ featureKey) {
  return FEATURE_GATES[featureKey] || null;
}

/**
 * Returns the upgrade prompt text for a locked feature.
 * @param {string} featureKey
 * @returns {{ planId: string, planLabel: string, price: string, message: string } | null}
 */
export function getUpgradePrompt(/** @type {any} */ featureKey) {
  const requiredPlan = FEATURE_GATES[featureKey];
  if (!requiredPlan || requiredPlan === 'free') return null;

  const plan = getPlan(requiredPlan);
  if (!plan) return null;

  const price = plan.stablePriceCents === 0 ? 'Free' : `$${(plan.stablePriceCents / 100).toFixed(0)}/mo`;
  return {
    planId:    plan.id,
    planLabel: plan.label,
    price,
    message:   `Upgrade to ${plan.label} (${price}) to unlock this feature.`
  };
}

/**
 * Injects a standard upgrade gate overlay into a target element.
 * The overlay blurs the content and shows an upgrade CTA.
 *
 * @param {HTMLElement} containerEl - Element to gate
 * @param {string} featureKey - Feature key for the upgrade prompt
 * @param {object} [opts]
 * @param {string} [opts.message] - Custom upgrade message
 * @param {function} [opts.onUpgradeClick] - Called when user clicks upgrade
 */
export function injectUpgradeGate(/** @type {any} */ containerEl, /** @type {any} */ featureKey, /** @type {any} */ opts = {}) {
  if (!containerEl) return;

  const prompt = getUpgradePrompt(featureKey);
  if (!prompt) return;

  const message = String(opts.message || prompt.message || '').trim();

  const /** @type {any} */
overlay = document.createElement('div');
  overlay.className = 'eon-upgrade-gate';
  overlay.style.cssText = [
    'position:absolute',
    'inset:0',
    'background:rgba(9,9,18,0.85)',
    'backdrop-filter:blur(4px)',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'gap:.75rem',
    'padding:1.5rem',
    'border-radius:inherit',
    'z-index:10',
    'text-align:center'
  ].join(';');

  const /** @type {any} */
icon = document.createElement('div');
  icon.style.fontSize = '1.5rem';
  icon.textContent = '🔒';

  const /** @type {any} */
text = document.createElement('div');
  text.style.cssText = 'font-size:.9rem;color:#e2e8f0;font-weight:600;max-width:220px;line-height:1.4';
  text.textContent = message;

  const /** @type {any} */
btn = document.createElement('button');
  btn.className = 'eon-upgrade-btn';
  btn.type = 'button';
  btn.style.cssText = 'background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:.65rem;padding:.6rem 1.3rem;font-weight:700;cursor:pointer;font-size:.88rem';
  btn.textContent = `Upgrade to ${prompt.planLabel} →`;

  overlay.append(icon, text, btn);
  btn.addEventListener('click', () => {
    if (typeof opts.onUpgradeClick === 'function') {
      opts.onUpgradeClick(prompt.planId);
    } else {
      // Default: navigate to vault upgrade tab
      window.location.href = `/vault#subscribe=${prompt.planId}`;
    }
  });

  // Ensure container is positioned for absolute child
  const pos = window.getComputedStyle(containerEl).position;
  if (pos === 'static') containerEl.style.position = 'relative';

  containerEl.appendChild(overlay);
  return overlay;
}

// ─── License code verification (local identity-backed) ────────────────────────

/**
 * Activates a subscription plan from a signed license code.
 * The code is verified locally against the device Nostr identity key.
 *
 * @param {string} licenseCode - Signed license code
 * @param {string} uid - Current user's UID (must match code's uid)
 * @returns {Promise<{ok: boolean, error?: string, planId?: string, expiresAt?: string}>}
 */
export async function activateWithLicenseCode(/** @type {any} */ licenseCode, /** @type {any} */ uid) {
  if (!licenseCode || typeof licenseCode !== 'string') {
    return { ok: false, error: 'Missing license code.' };
  }
  if (!uid) {
    return { ok: false, error: 'Missing UID.' };
  }

  const safeUid = String(uid || '').trim().toLowerCase();
  const safeCode = licenseCode.trim();
  if (!safeUid) {
    return { ok: false, error: 'Missing UID.' };
  }
  if (!safeCode || safeCode.length > MAX_LICENSE_CODE_LENGTH) {
    return { ok: false, error: 'Invalid license code format.' };
  }

  // Parse license code (format: base64url(uid).base64url(planId).base64url(expiresAt).nonce.hmac)
  const parts = safeCode.split('.');
  if (parts.length !== 5) {
    return { ok: false, error: 'Invalid license code format.' };
  }

  let /** @type {any} */
decoded;
  try {
    decoded = {
      uid:       decodeBase64UrlPart(parts[0]).toLowerCase(),
      planId:    decodeBase64UrlPart(parts[1]).toLowerCase(),
      expiresAt: decodeBase64UrlPart(parts[2]),
      nonce:     parts[3],
      hmac:      String(parts[4] || '').trim().toLowerCase()
    };
  } catch {
    return { ok: false, error: 'License code decoding failed.' };
  }

  // Basic validation
  if (decoded.uid !== safeUid) {
    return { ok: false, error: 'License code is not for this account.' };
  }
  const expiryMs = Date.parse(decoded.expiresAt);
  if (!Number.isFinite(expiryMs)) {
    return { ok: false, error: 'License code expiry is invalid.' };
  }
  if (expiryMs < Date.now()) {
    return { ok: false, error: 'License code has expired.' };
  }

  const identityKeyHex = await getDeviceIdentityKeyHex();
  if (!identityKeyHex) {
    return { ok: false, error: 'Device identity key unavailable.' };
  }

  const payload = `${LICENSE_HMAC_PREFIX}:${decoded.uid}.${decoded.planId}.${decoded.expiresAt}.${decoded.nonce}`;
  const verified = await verifyLicensePayload(payload, decoded.hmac, identityKeyHex);
  if (!verified) {
    return { ok: false, error: 'License verification failed.' };
  }

  // Activate plan locally
  const result = activatePlan(decoded.planId, 'stable', /** @type {any} */ ({
    renewsAt: decoded.expiresAt,
    autoRenew: false
  }));

  if (!result.ok && result.error !== 'insufficient_stable') {
    return { ok: false, error: result.error };
  }

  // Store license code for re-verification
  try {
    localStorage.setItem('eon-license-code', licenseCode);
  } catch {}

  return {
    ok:        true,
    planId:    decoded.planId,
    expiresAt: decoded.expiresAt
  };
}

/**
 * Generate a locally signed license code using the device identity key.
 * Useful for offline issuance, demos, and tests in decentralized deployments.
 * @param {string} uid
 * @param {string} planId
 * @param {string | Date} expiresAt
 * @param {string} [nonce]
 * @returns {Promise<string>}
 */
export async function createLocalLicenseCode(/** @type {any} */ uid, /** @type {any} */ planId, /** @type {any} */ expiresAt, /** @type {any} */ nonce = '') {
  const safeUid = String(uid || '').trim().toLowerCase();
  const safePlanId = String(planId || '').trim().toLowerCase();
  const expiry = new Date(expiresAt).toISOString();
  const safeNonce = String(nonce || '').trim() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  if (!safeUid || !safePlanId || !expiry) {
    throw new Error('invalid-license-payload');
  }
  const identityKeyHex = await getDeviceIdentityKeyHex();
  if (!identityKeyHex) {
    throw new Error('device-identity-key-unavailable');
  }
  const payload = `${LICENSE_HMAC_PREFIX}:${safeUid}.${safePlanId}.${expiry}.${safeNonce}`;
  const hmac = await signLicensePayload(payload, identityKeyHex);
  return [
    encodeBase64UrlPart(safeUid),
    encodeBase64UrlPart(safePlanId),
    encodeBase64UrlPart(expiry),
    safeNonce,
    hmac
  ].join('.');
}

/**
 * Returns the stored license code (if any) for Worker re-verification.
 * @returns {string | null}
 */
export function getStoredLicenseCode() {
  try {
    const code = localStorage.getItem('eon-license-code');
    if (typeof code !== 'string') return null;
    const normalized = code.trim();
    return normalized && normalized.length <= MAX_LICENSE_CODE_LENGTH ? normalized : null;
  } catch {
    return null;
  }
}

// ─── Convenience exports ───────────────────────────────────────────────────────

/**
 * Returns all plan definitions with pricing and feature lists.
 * Used by upgrade UI in vault.html / settings panels.
 */
export function getAllPlans() {
  return getPlans();
}

/**
 * Returns whether the user has the given plan ID or higher.
 * @param {string} minimumPlanId
 * @returns {boolean}
 */
export function isAtLeast(/** @type {any} */ minimumPlanId) {
  const state = getEntitlementState();
  return isPlanAtLeast(state.activePlanId, minimumPlanId);
}

/**
 * Returns true if the user's subscription is active (not expired, not past_due).
 * Free plan is always "active" even though status is 'inactive'.
 * @returns {boolean}
 */
export function isSubscriptionActive() {
  const state = getEntitlementState();
  if (state.activePlanId === 'free') return true;
  return state.status === 'active';
}

// ─── Game monetization helpers ──────────────────────────────────────────────────

/**
 * Returns the Pool Point earning multiplier for the current plan.
 * Free=1x, Spark=1.5x, Builder=2x, Pro=3x, Operator=3x
 * Pool Points are value-independent — they determine EonLite mint pool share, not direct EonLite.
 * @returns {number}
 */
export function getPoolPointMultiplier() {
  const plan = getCurrentPlan();
  const /** @type {any} */ multipliers = { free: 1, spark: 1.5, builder: 2, pro: 3, operator: 3 };
  return multipliers[plan] || 1;
}

/**
 * @deprecated Use getPoolPointMultiplier() instead. Pool boost is now Pool Points.
 */
export function getPoolBoostMultiplier() {
  return getPoolPointMultiplier();
}

/**
 * @deprecated EonLite earn caps are replaced by Pool Points.
 * Use getPoolPointMultiplier() for the subscription earning benefit.
 * Kept for backward compatibility — returns the same multiplier.
 * @returns {number}
 */
export function getEarnCapMultiplier() {
  return getPoolPointMultiplier();
}

/**
 * Returns true when ads should be shown.
 * Free users see ads; paid active plans are ad-free.
 * @returns {boolean}
 */
export function shouldShowAds() {
  const state = getEntitlementState();
  if (state.activePlanId === 'free') return true;
  return state.status !== 'active';
}

/**
 * Returns true if the user should see ads in games.
 * @returns {boolean}
 */
export function shouldShowGameAds() {
  return shouldShowAds();
}

/**
 * Returns true if the user gets priority lootbox drops (better rarity odds).
 * DEPRECATED: Games removed. Always returns false.
 * @returns {boolean}
 */
export function hasLootboxBoost() {
  return false; // Games removed - no game lootbox boost
}

/**
 * Returns the lootbox rarity boost modifier.
 * Free=0, Spark=0.1 (10% better odds), Builder=0.15, Pro=0.2, Operator=0.3
 * @returns {number}
 */
export function getLootboxRarityBoost() {
  const plan = getCurrentPlan();
  const /** @type {any} */ boosts = { free: 0, spark: 0.1, builder: 0.15, pro: 0.2, operator: 0.3 };
  return boosts[plan] || 0;
}

/**
 * Returns a summary of all game monetization benefits for the current plan.
 * Used by games to apply all benefits at once.
 * Pool Points replace direct EonLite earning — value-independent.
 * @returns {{ planId: string, adFree: boolean, poolPointMult: number, poolBoost: number, earnCapMult: number, lootboxBoost: boolean, lootboxRarityBoost: number }}
 */
export function getGameBenefits() {
  return {
    planId:              getCurrentPlan(),
    adFree:              !shouldShowGameAds(),
    poolPointMult:       getPoolPointMultiplier(),
    poolBoost:           getPoolPointMultiplier(), // alias for backward compat
    earnCapMult:         getPoolPointMultiplier(), // now same as pool points
    lootboxBoost:        hasLootboxBoost(),
    lootboxRarityBoost:  getLootboxRarityBoost()
  };
}

// ─── Auto-renewal from wallet ──────────────────────────────────────────────────

/**
 * EonLite price per plan per month (in micro-EonLite, 1e6 units = 1 EonLite).
 * These are approximations; final rates should track the USD/EonLite P2P swap rate.
 * Free plan has no charge; others reflect approximate USD parity.
 */
const /** @type {Record<string,number>} */ PLAN_EONL_COST = {
  free:     0,
  spark:    500,    // ~$1 at $0.002/EonLite
  builder:  2500,   // ~$5
  pro:      7500,   // ~$15
  operator: 25000   // ~$50
};

const AUTO_RENEW_KEY        = 'eon:subscription:auto-renew';
const LAST_RENEW_ATTEMPT_KEY = 'eon:subscription:last-renew-attempt';

/**
 * Check if auto-renewal is enabled (user opt-in, default: true).
 * @returns {boolean}
 */
export function isAutoRenewEnabled() {
  try {
    const v = localStorage.getItem(AUTO_RENEW_KEY);
    return v === null ? true : v === 'true'; // default on
  } catch { return true; }
}

/**
 * Enable or disable auto-renewal.
 * @param {boolean} enabled
 */
export function setAutoRenew(/** @type {any} */ enabled) {
  try { localStorage.setItem(AUTO_RENEW_KEY, String(enabled)); } catch { /* ignore */ }
}

/**
 * Attempt to auto-renew an expiring subscription by deducting EonLite from the local wallet.
 * - Only runs if subscription is within 24 h of expiry or already expired (grace period 3 days).
 * - Only runs once per 12 h per device to avoid hammering on soft failures.
 * - Requires wallet.js `getBalance()` and `spend()` exports.
 * - Fires notification on success or failure.
 * @returns {Promise<{renewed: boolean, reason: string}>}
 */
export async function attemptAutoRenew() {
  const state = getEntitlementState();
  if (state.activePlanId === 'free') return { renewed: false, reason: 'free-plan' };
  if (!isAutoRenewEnabled())          return { renewed: false, reason: 'auto-renew-disabled' };

  const now         = Date.now();
  const expiresAt = Date.parse(state.renewsAt || '') || 0;
  const hoursLeft   = (expiresAt - now) / 3_600_000;
  const inGrace     = hoursLeft > -72;  // 3-day grace window after expiry

  // Only try if within 24 h before expiry or in grace period
  if (hoursLeft > 24) return { renewed: false, reason: 'not-due-yet' };
  if (!inGrace)        return { renewed: false, reason: 'grace-period-expired' };

  // Throttle: at most once per 12 h
  const lastAttempt = Number(localStorage.getItem(LAST_RENEW_ATTEMPT_KEY) || '0');
  if (now - lastAttempt < 12 * 3_600_000) return { renewed: false, reason: 'throttled' };
  localStorage.setItem(LAST_RENEW_ATTEMPT_KEY, String(now));

  const planId = state.activePlanId;
  const cost   = PLAN_EONL_COST[planId];
  if (!cost) return { renewed: false, reason: 'unknown-plan' };

  try {
    // wallet.js is an IIFE — access via window.EonWallet (always loaded before subscription init)
    const eonWallet = subscriptionWin.EonWallet;
    if (!eonWallet) return { renewed: false, reason: 'wallet-unavailable' };
    const balance = eonWallet.getBalance();
    if (balance < cost) {
      // Notify insufficient funds
      const { notifySubscription } = await import('./notifications.js');
      notifySubscription('expiring-soon', planId);
      return { renewed: false, reason: 'insufficient-balance' };
    }

    // Deduct from wallet — wallet.spend() is the correct API
    const ok = eonWallet.spend(cost, `subscription:${planId}:renewal`);
    if (!ok) return { renewed: false, reason: 'deduction-failed' };

    // Extend subscription by 30 days
    const newExpiry = Math.max(expiresAt, now) + 30 * 86_400_000;
    activatePlan(planId, { expiresAt: newExpiry, renewedAt: now, source: 'auto-wallet' });

    const { notifySubscription } = await import('./notifications.js');
    notifySubscription('renewed', planId);
    return { renewed: true, reason: 'ok' };
  } catch (/** @type {any} */
err) {
    console.warn('[subscription] auto-renew error:', err);
    return { renewed: false, reason: 'error' };
  }
}

/**
 * Initialise subscription checks on page load.
 * - Triggers auto-renew attempt if applicable.
 * - Exposes wallet-linked subscription state to window for game-shell access.
 */
export async function initSubscription() {
  // Attempt auto-renewal silently in background
  if (isAutoRenewEnabled()) {
    attemptAutoRenew().catch(() => { /* silent */ });
  }

  // Expose globally for game-shell and other modules
  subscriptionWin.EonSubscription = {
    initSubscription,
    hasFeature,
    getCurrentPlan,
    getEntitlementState,
    subscribe: activatePlan,
    attemptAutoRenew,
    getGameBenefits,
    getPoolPointMultiplier,
    shouldShowAds,
    shouldShowGameAds,
    getLootboxRarityBoost,
    getSocialVideoUploadLimit,
    isSocialVideoUploadPlatform,
    getSocialVideoUploadUsage,
    getSocialVideoQuotaSummary,
    canUseSocialVideoUpload,
    recordSocialVideoUpload,
    isAutoRenewEnabled,
    setAutoRenew
  };
}

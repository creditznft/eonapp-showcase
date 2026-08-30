import { recordChallengeEvent } from './challenges.js';
import { buildPublicAlias, generateAliasSeed, generateIdentityId, normalizeAliasSeed, normalizeIdentityId, pickGeneratedAccent } from './identity.js';
import { generateAvatarSeed, normalizeAvatarSeed } from './avatar.js';
import { getBadges } from './storage.js';
import { getTrustedNow, observeTrustedTime } from './trusted-time.js';
import {
  deriveRecoveryStatus,
  normalizeBrowserAttachment,
  normalizeBrowserAttachments,
  normalizeBrowserWorkspaceProfile,
  normalizeBrowserWorkspaceProfiles,
  normalizeEntitlementReceipt,
  normalizeEntitlementReceipts,
  normalizeRecoveryState,
  PROFILE_BROWSER_STATE_LIMITS
} from './profile/profile-browser-state.js';


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

const safeBuildPublicAlias = typeof buildPublicAlias === 'function'
  ? buildPublicAlias
  : ((/** @type {any} */ uid, /** @type {any} */ aliasSeed = '') => {
      const seed = String(aliasSeed || '').replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();
      const short = String(uid || '').replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase() || 'guest';
      return (seed ? `${seed}-${short}` : `eon-${short}`).slice(0, 24);
    });

const safeGenerateAliasSeed = typeof generateAliasSeed === 'function'
  ? generateAliasSeed
  : ((/** @type {any} */ uid) => String(uid || '').replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase() || 'seed');

const safeNormalizeAliasSeed = typeof normalizeAliasSeed === 'function'
  ? normalizeAliasSeed
  : ((/** @type {any} */ seed, /** @type {any} */ uid = '') => {
      const cleaned = String(seed || '').replace(/[^a-z0-9]/gi, '').slice(0, 16).toLowerCase();
      return cleaned || safeGenerateAliasSeed(uid);
    });

const safePickGeneratedAccent = typeof pickGeneratedAccent === 'function'
  ? pickGeneratedAccent
  : () => '✨';

const PROFILE_KEY = 'eon:profile';
const PROFILE_LEGACY_KEY = 'eon:profile:v1';
export const EON_PROFILE_MIGRATION_RECEIPT_KEY = 'eon:profile:migration-receipt:a15-i08:v1';
const CHALLENGE_WIN_LOG_KEY = 'eon:challenge-win-log';
const REFERRAL_RETURN_LOG_KEY = 'eon:referral-return-log';
const REFERRAL_RETURN_EVENT_LOG_KEY = 'eon:referral-return-events:v1';
const REFERRAL_MILESTONE_LOG_KEY = 'eon:referral-milestone-log';
const MAX_HISTORY = 40;
const MAX_WIN_LOG = 80;
const MAX_INVITE_TRAIL = 5;
const CHALLENGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REFERRAL_LOG = 160;
const MAX_PARAM_CHARS = 2000;
const MAX_PARAM_BYTES = 2400;
const MAX_SEARCH_LENGTH = 3600;
const MAX_CHALLENGE_STR_LEN = 180;
const MAX_CHALLENGE_VALUE = 1e12;
// W215: referral relationships are recorded for provenance and optional local
// recognition only. There is no active referral points, cash, token, NFT,
// subscription, revenue-share, or entitlement campaign.
const /** @type {any} */
REFERRAL_TIERS = [
  { min: 0, name: 'Signed Share Ready', emoji: '🔗', unlock: 'Signed invite and QR sharing are available', rewardLabel: 'No active reward campaign', rewardKind: 'none', nftTrigger: null, utility: 'Create durable self-contained links' },
  { min: 1, name: 'Connection Noted', emoji: '🌱', unlock: 'First qualified relationship recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' },
  { min: 5, name: 'Community Builder', emoji: '⚡', unlock: 'Five qualified relationships recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' },
  { min: 10, name: 'Network Steward', emoji: '📣', unlock: 'Ten qualified relationships recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' },
  { min: 25, name: 'Community Architect', emoji: '🏗️', unlock: 'Twenty-five qualified relationships recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' },
  { min: 50, name: 'Community Operator', emoji: '🛠️', unlock: 'Fifty qualified relationships recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' },
  { min: 100, name: 'Community Legend', emoji: '👑', unlock: 'One hundred qualified relationships recorded', rewardLabel: 'Recognition only', rewardKind: 'recognition', nftTrigger: null, utility: 'No credit, payout, or entitlement' }
];

/**
 * W242: wallet-derived administration is deliberately disabled. Older browser
 * profiles may still contain legacy address fields; they are treated as inert
 * compatibility data and are not read for authority, routing, or entitlement.
 */
export function getAdminWalletAllowlist() {
  return [];
}

export function setAdminWalletAllowlist() {
  return [];
}

export function isAdminWalletAddress() {
  return false;
}

function bytesToBase64(/** @type {any} */ bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(/** @type {any} */ base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(/** @type {any} */ value, /** @type {any} */ maxBytes = MAX_PARAM_BYTES) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > maxBytes) {
    return null;
  }
  return bytesToBase64(bytes)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(/** @type {any} */ value, /** @type {any} */ maxChars = MAX_PARAM_CHARS, /** @type {any} */ maxBytes = MAX_PARAM_BYTES) {
  if (!value || value.length > maxChars || /[^A-Za-z0-9\-_]/.test(value)) {
    throw new Error('Invalid payload');
  }
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const bytes = base64ToBytes(padded);
  if (bytes.length > maxBytes) {
    throw new Error('Payload too large');
  }
  return new TextDecoder().decode(bytes);
}

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.min(max, Math.max(min, value));
}

function buildAlias(/** @type {any} */ uid, /** @type {any} */ aliasSeed = '') {
  return safeBuildPublicAlias(uid, aliasSeed);
}

function sanitizeChallengeText(/** @type {any} */ value, /** @type {any} */ fallback = '', /** @type {any} */ maxLen = MAX_CHALLENGE_STR_LEN) {
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim().slice(0, maxLen);
}

function normalizeChallengeValue(/** @type {any} */ value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(-MAX_CHALLENGE_VALUE, Math.min(MAX_CHALLENGE_VALUE, value));
  }
  if (typeof value === 'string') {
    return value.slice(0, 64);
  }
  return '';
}

function sanitizeChallengePayload(/** @type {any} */ challenge, /** @type {any} */ chainDepth) {
  if (!challenge || typeof challenge !== 'object') {
    return null;
  }

  const now = Date.now();
  const createdAtRaw = Number(challenge.createdAt);
  const expiresAtRaw = Number(challenge.expiresAt);
  const createdAt = Number.isFinite(createdAtRaw) ? createdAtRaw : now;
  const maxExpiry = createdAt + CHALLENGE_TTL_MS * 2;
  const fallbackExpiry = now + CHALLENGE_TTL_MS;
  const expiresAt = Number.isFinite(expiresAtRaw)
    ? clamp(expiresAtRaw, createdAt, maxExpiry)
    : fallbackExpiry;

  const /** @type {any} */
payload = {
    tool: sanitizeChallengeText(challenge.tool, '', 42),
    headline: sanitizeChallengeText(challenge.headline, 'Beat my challenge', 120),
    value: normalizeChallengeValue(challenge.value),
    unit: sanitizeChallengeText(challenge.unit, '', 16),
    summary: sanitizeChallengeText(challenge.summary, '', 140),
    label: sanitizeChallengeText(challenge.label, '', 60),
    createdAt,
    expiresAt,
    chainDepth: clamp(Number(chainDepth || 1), 1, MAX_INVITE_TRAIL),
    version: 2
  };

  if (challenge.score !== undefined) {
    payload.score = normalizeChallengeValue(challenge.score);
  }
  if (challenge.dailyBurn !== undefined) {
    payload.dailyBurn = normalizeChallengeValue(challenge.dailyBurn);
  }
  if (challenge.grade !== undefined) {
    payload.grade = sanitizeChallengeText(challenge.grade, '', 8);
  }
  if (challenge.savingsRate !== undefined) {
    payload.savingsRate = normalizeChallengeValue(challenge.savingsRate);
  }

  if (!payload.tool) {
    payload.tool = 'tool';
  }

  return payload;
}

function normalizeSharePath(/** @type {any} */ path) {
  try {
    const parsed = new URL(String(path || '/'), window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return window.location.pathname || '/';
    }
    return parsed.pathname || '/';
  } catch {
    return window.location.pathname || '/';
  }
}

function totalProfileActivity(/** @type {any} */ profile) {
  const stats = profile?.stats || {};
  return [
    stats.totalRuns,
    stats.totalShares,
    stats.challengeWins,
    stats.challengeXp,
    stats.rewardedUnlocks,
    stats.vaultExports,
    stats.referralReturns
  ].reduce((/** @type {any} */ sum, /** @type {any} */ value) => sum + Number(value || 0), 0);
}

function normalizeInviteTrail(/** @type {any} */ trail = []) {
  if (!Array.isArray(trail)) {
    return [];
  }

  const /** @type {any} */
seen = new Set();
  const /** @type {any} */
normalized = [];
  for (const /** @type {any} */
entry of trail) {
    const uid = normalizeIdentityId(entry?.uid);
    if (!uid || seen.has(uid)) {
      continue;
    }

    const aliasSeed = safeNormalizeAliasSeed(entry?.aliasSeed, uid);

    seen.add(uid);
    normalized.push({
      uid,
      aliasSeed,
      alias: buildAlias(uid, aliasSeed)
    });

    if (normalized.length >= MAX_INVITE_TRAIL) {
      break;
    }
  }

  return normalized;
}

function buildInviteTrail(/** @type {any} */ profile) {
  const trail = normalizeInviteTrail([
    ...(profile.inviteTrail || []),
    {
      uid: profile.uid,
      alias: profile.alias,
      aliasSeed: profile.aliasSeed
    }
  ]);

  return trail.slice(-MAX_INVITE_TRAIL);
}

function defaultProfile() {
  const uid = generateIdentityId();
  const aliasSeed = safeGenerateAliasSeed(uid);
  return {
    uid,
    aliasSeed,
    alias: buildAlias(uid, aliasSeed),
    avatar: safePickGeneratedAccent(uid, aliasSeed),
    avatarSeed: generateAvatarSeed(uid),
    role: 'user',
    roles: [],
    isAdmin: false,
    wallet: '',
    walletAddress: '',
    createdAt: new Date().toISOString(),
    favorites: [],
    history: [],
    badges: getBadges(),
    invitedBy: null,
    invitedAlias: null,
    invitedAliasSeed: null,
    inviteTrail: [],
    recovery: {
      status: 'local-only',
      lastExportAt: null,
      lastRestoreAt: null,
      recoveryPhraseSet: false,
      passkeyReady: false,
      mirrorTargets: [],
      notes: '',
      updatedAt: new Date().toISOString()
    },
    browserAttachments: [],
    browserWorkspaceProfiles: [],
    entitlementReceipts: [],
    deviceKeys: [],
    stats: {
      totalRuns: 0,
      totalShares: 0,
      challengeWins: 0,
      challengeStreak: 0,
      challengeXp: 0,
      rewardedUnlocks: 0,
      vaultExports: 0,
      referralReturns: 0
    },
    version: 2
  };
}

function migrateProfile(/** @type {any} */ rawProfile = {}) {
  const base = defaultProfile();
  const uid = normalizeIdentityId(rawProfile.uid) || base.uid;
  const aliasSeed = safeNormalizeAliasSeed(rawProfile.aliasSeed, uid);
  const wallet = typeof rawProfile.wallet === 'string' ? rawProfile.wallet.trim() : '';
  const walletAddress = typeof rawProfile.walletAddress === 'string' ? rawProfile.walletAddress.trim() : '';
  const role = typeof rawProfile.role === 'string' && rawProfile.role.trim()
    ? rawProfile.role.trim().toLowerCase()
    : base.role;
  const roles = Array.isArray(rawProfile.roles)
    ? [...new Set(rawProfile.roles.map((/** @type {any} */ value) => String(value || '').trim().toLowerCase()).filter(Boolean))]
    : [];
  // W242: preserve legacy fields without allowing browser-stored role or wallet data to grant authority.
  const isAdmin = false;
  const customAlias = typeof rawProfile.alias === 'string'
    ? rawProfile.alias.replace(/[^A-Za-z0-9_\- ]/g, '').trim().slice(0, 24)
    : '';
  const invitedBy = normalizeIdentityId(rawProfile.invitedBy);
  const inviteTrail = normalizeInviteTrail(
    rawProfile.inviteTrail?.length
      ? rawProfile.inviteTrail
      : invitedBy
        ? [{ uid: invitedBy, alias: rawProfile.invitedAlias, aliasSeed: rawProfile.invitedAliasSeed }]
        : []
  );
  const recovery = normalizeRecoveryState(rawProfile.recovery || rawProfile.identityRecovery || rawProfile.vaultRecovery || {});
  const browserAttachments = normalizeBrowserAttachments(
    rawProfile.browserAttachments || rawProfile.connectedAccounts || rawProfile.attachments || []
  );
  const browserWorkspaceProfiles = normalizeBrowserWorkspaceProfiles(
    rawProfile.browserWorkspaceProfiles || rawProfile.browserAttachmentWorkspaces || rawProfile.attachmentProfiles || []
  );
  const entitlementReceipts = normalizeEntitlementReceipts(
    rawProfile.entitlementReceipts || rawProfile.subscriptionReceipts || []
  );
  const deviceKeys = Array.isArray(rawProfile.deviceKeys)
    ? [...new Set(rawProfile.deviceKeys.map((/** @type {any} */ value) => String(value || '').trim()).filter(Boolean))].slice(0, 12)
    : [];

  return {
    uid,
    aliasSeed,
    alias: customAlias || buildAlias(uid, aliasSeed),
    avatar: safePickGeneratedAccent(uid, aliasSeed),
    avatarSeed: normalizeAvatarSeed(rawProfile.avatarSeed, uid),
    role,
    roles,
    isAdmin,
    wallet: wallet || walletAddress || base.wallet,
    walletAddress: walletAddress || wallet || base.walletAddress,
    createdAt: rawProfile.createdAt || base.createdAt,
    favorites: Array.isArray(rawProfile.favorites) ? rawProfile.favorites.slice(0, 50) : [],
    history: Array.isArray(rawProfile.history) ? rawProfile.history.slice(0, MAX_HISTORY) : [],
    badges: Array.isArray(rawProfile.badges) ? [...new Set(rawProfile.badges.filter(Boolean))] : base.badges,
    invitedBy,
    invitedAlias: invitedBy ? buildAlias(invitedBy, safeNormalizeAliasSeed(rawProfile.invitedAliasSeed, invitedBy)) : null,
    invitedAliasSeed: invitedBy ? safeNormalizeAliasSeed(rawProfile.invitedAliasSeed, invitedBy) : null,
    inviteTrail,
    recovery,
    browserAttachments,
    browserWorkspaceProfiles,
    entitlementReceipts,
    deviceKeys,
    stats: {
      ...base.stats,
      ...(rawProfile.stats || {})
    },
    version: 3
  };
}

function syncLegacyBadges(/** @type {any} */ profile) {
  localStorage.setItem('eon:badges', JSON.stringify(profile.badges));
}

function ensureBadge(/** @type {any} */ profile, /** @type {any} */ badge) {
  if (!badge || profile.badges.includes(badge)) {
    return;
  }
  profile.badges.unshift(badge);
  syncLegacyBadges(profile);
}

function readChallengeWinLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHALLENGE_WIN_LOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChallengeWinLog(/** @type {any} */ log) {
  localStorage.setItem(CHALLENGE_WIN_LOG_KEY, JSON.stringify(log.slice(-MAX_WIN_LOG)));
}

export function readReferralReturnLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REFERRAL_RETURN_LOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReferralReturnLog(/** @type {any} */ log) {
  localStorage.setItem(REFERRAL_RETURN_LOG_KEY, JSON.stringify(log.slice(-MAX_REFERRAL_LOG)));
}

export function readReferralReturnEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REFERRAL_RETURN_EVENT_LOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReferralReturnEvents(/** @type {any} */ log) {
  try {
    localStorage.setItem(REFERRAL_RETURN_EVENT_LOG_KEY, JSON.stringify(log.slice(-MAX_REFERRAL_LOG)));
  } catch {}
}

function appendReferralReturnEvent(/** @type {any} */ entry) {
  if (!entry || typeof entry !== 'object') return [];
  const log = readReferralReturnEvents();
  log.push(entry);
  saveReferralReturnEvents(log);
  return log;
}

/**
 * @returns {Record<string, any[]>}
 */
function loadReferralMilestoneLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(REFERRAL_MILESTONE_LOG_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, any[]>} log
 */
function saveReferralMilestoneLog(log) {
  try {
    localStorage.setItem(REFERRAL_MILESTONE_LOG_KEY, JSON.stringify(log));
  } catch {}
}

/**
 * @param {any} profile
 * @returns {Promise<{ unlocked: Array<{ min: number, name: string, rewardLabel: string, nftTrigger: any }> }>}
 */
async function applyReferralMilestoneRewards(profile) {
  // Compatibility function name retained for old callers. W215 deliberately
  // records recognition milestones only: no points, NFT, subscription, token,
  // payout, revenue-share, or account entitlement is minted here.
  const count = Number(profile?.stats?.referralReturns || 0);
  if (count <= 0) return { unlocked: [] };

  const uid = normalizeIdentityId(profile?.uid || profile?.id || '') || '';
  const log = loadReferralMilestoneLog();
  const seen = new Set(Array.isArray(log[uid]) ? log[uid] : []);
  const unlocked = [];
  for (const tier of REFERRAL_TIERS) {
    if (!tier.min || count < tier.min || seen.has(tier.min)) continue;
    seen.add(tier.min);
    unlocked.push({ min: tier.min, name: tier.name, rewardLabel: 'Recognition only', nftTrigger: null });
  }
  if (unlocked.length) {
    log[uid] = [...seen].sort((a, b) => a - b);
    saveReferralMilestoneLog(log);
  }
  return { unlocked };
}

/**
 * @param {any} profile
 * @param {string} [isoDate]
 * @returns {{ streak: number, best: number, rewarded: boolean }}
 */
function applyReferralStreak(profile, isoDate = new Date().toISOString()) {
  const stats = profile.stats || (profile.stats = {});
  const day = String(isoDate || '').slice(0, 10);
  if (!day) {
    return { streak: Number(stats.referralStreak || 0), best: Number(stats.referralStreakBest || 0), rewarded: false };
  }

  const previousDay = String(stats.referralStreakLastDay || '').slice(0, 10);
  const currentStreak = Number(stats.referralStreak || 0);
  const consecutive = Boolean(previousDay) && new Date(`${day}T00:00:00Z`).getTime() - new Date(`${previousDay}T00:00:00Z`).getTime() === 24 * 60 * 60 * 1000;
  const nextStreak = previousDay === day
    ? currentStreak
    : consecutive
      ? currentStreak + 1
      : 1;

  stats.referralStreak = nextStreak;
  stats.referralStreakBest = Math.max(Number(stats.referralStreakBest || 0), nextStreak);
  stats.referralStreakLastDay = day;

  // A streak can be shown as local recognition only. It cannot unlock
  // points, NFTs, subscriptions, payouts, revenue share, or other value.
  if (nextStreak >= 7 && !stats.referralStreakRecognizedAt) {
    stats.referralStreakRecognizedAt = isoDate;
    ensureBadge(profile, 'referral-streak');
  }

  return {
    streak: nextStreak,
    best: Number(stats.referralStreakBest || nextStreak),
    rewarded: false
  };
}

export function getReferralTierInfo(/** @type {any} */ count = 0) {
  const safeCount = Math.max(0, Number(count || 0));
  const current = [...REFERRAL_TIERS].reverse().find((/** @type {any} */ tier) => safeCount >= tier.min) || REFERRAL_TIERS[0];
  const next = REFERRAL_TIERS.find((/** @type {any} */ tier) => tier.min > safeCount) || null;

  return {
    ...current,
    count: safeCount,
    nextTarget: next?.min || null,
    nextName: next?.name || null,
    rewardLabel: current.rewardLabel || current.unlock,
    rewardKind: current.rewardKind || 'unlock',
    nftTrigger: current.nftTrigger || null,
    utility: current.utility || current.unlock,
    remaining: next ? Math.max(0, next.min - safeCount) : 0,
    progressToNext: next
      ? Math.min(100, Math.round((safeCount / next.min) * 100))
      : 100
  };
}

function buildReferralBadges(/** @type {any} */ profile) {
  const count = profile.stats.referralReturns || 0;
  if (count >= 1) {
    ensureBadge(profile, 'referral-loop-runner');
  }
  if (count >= 5) {
    ensureBadge(profile, 'referral-catalyst');
  }
  if (count >= 10) {
    ensureBadge(profile, 'referral-amplifier');
  }
  if (count >= 25) {
    ensureBadge(profile, 'referral-architect');
  }
  if (count >= 50) {
    ensureBadge(profile, 'referral-operator');
  }
  if (count >= 100) {
    ensureBadge(profile, 'referral-legend');
  }
}

function buildReferralReturnKey(/** @type {any} */ params) {
  const rawKey = [
    normalizeIdentityId(params.get('ref')) || 'anon',
    window.location.pathname,
    params.get('challenge') || '',
    params.get('trail') || ''
  ].join('|');

  const encoded = base64UrlEncode(rawKey, 1024);
  return `rr:${(encoded || rawKey).slice(0, 160)}`;
}

function _shouldCaptureInitialInvite(/** @type {any} */ profile, /** @type {any} */ ref, /** @type {any} */ trail) {
  if (!ref || ref === profile.uid || profile.invitedBy) {
    return false;
  }

  if (trail.some((/** @type {any} */ entry) => entry.uid === profile.uid)) {
    return false;
  }

  return totalProfileActivity(profile) === 0 && profile.history.length === 0 && profile.favorites.length === 0;
}

function _maybeCreditReferralReturn(/** @type {any} */ profile, /** @type {any} */ params, /** @type {any} */ trail) {
  const ref = normalizeIdentityId(params.get('ref'));
  if (!ref || ref === profile.uid || trail.length < 2) {
    return null;
  }

  const sharer = trail.at(-1);
  const directReferrer = trail.at(-2);
  if (!sharer || !directReferrer) {
    return null;
  }

  if (sharer.uid !== ref || directReferrer.uid !== profile.uid) {
    return null;
  }

  const ledger = readReferralReturnLog();
  const returnKey = buildReferralReturnKey(params);
  if (ledger.includes(returnKey)) {
    return null;
  }

  profile.stats.referralReturns = (profile.stats.referralReturns || 0) + 1;
  buildReferralBadges(profile);
  void applyReferralMilestoneRewards(profile);
  const when = new Date().toISOString();
  const streak = applyReferralStreak(profile, when);

  ledger.push(returnKey);
  saveReferralReturnLog(ledger);

  const tier = getReferralTierInfo(profile.stats.referralReturns);
  const event = {
    id: returnKey,
    at: when,
    fromUid: ref,
    fromAlias: buildAlias(ref, normalizeAliasSeed(params.get('aliasSeed'), ref)),
    count: profile.stats.referralReturns,
    tier,
    rewardLabel: tier.rewardLabel,
    rewardKind: tier.rewardKind,
    utility: tier.utility,
    milestones: REFERRAL_TIERS.filter((/** @type {any} */ tier) => tier.min > 0 && profile.stats.referralReturns >= tier.min).map((/** @type {any} */ tier) => ({
      min: tier.min,
      name: tier.name,
      rewardLabel: tier.rewardLabel,
      utility: tier.utility,
      nftTrigger: tier.nftTrigger
    })),
    streak: streak.streak,
    streakBest: streak.best,
    path: window.location.pathname,
    source: 'invite-return'
  };
  appendReferralReturnEvent(event);
  try {
    document.dispatchEvent(new CustomEvent('eon:referral:return', { detail: event }));
    window.dispatchEvent(new CustomEvent('eon:referral:return', { detail: event }));
  } catch {}

  return {
    fromUid: ref,
    fromAlias: event.fromAlias,
    tier,
    count: profile.stats.referralReturns,
    milestones: event.milestones,
    streak: streak.streak,
    streakBest: streak.best,
    event
  };
}

function applyChallengeProgress(/** @type {any} */ profile, /** @type {any} */ eventType, /** @type {any} */ increment = 1) {
  const update = recordChallengeEvent(profile.uid, eventType, increment);
  profile.stats.challengeStreak = update.meta?.currentStreak || 0;
  profile.stats.challengeXp = update.meta?.totalXp || 0;

  update.newlyCompleted?.forEach((/** @type {any} */ challenge) => {
    if (challenge.reward?.badge) {
      ensureBadge(profile, challenge.reward.badge);
    }
  });

  if (update.dayCompleted) {
    ensureBadge(profile, 'daily-clean-sweep');
  }

  return update;
}

export function getProfile() {
  try {
    const canonicalRaw = localStorage.getItem(PROFILE_KEY);
    const legacyRaw = canonicalRaw ? null : localStorage.getItem(PROFILE_LEGACY_KEY);
    const raw = canonicalRaw || legacyRaw;
    const profile = raw ? migrateProfile(JSON.parse(raw)) : null;
    if (profile) {
      const normalizedRaw = JSON.stringify(profile);
      if (legacyRaw || canonicalRaw !== normalizedRaw) saveProfile(profile, { migratedFromLegacy: Boolean(legacyRaw) });
    }
    return profile;
  } catch {
    return null;
  }
}

export function getActiveProfileUid() {
  const current = getProfile() || ensureProfile();
  return String(current?.uid || current?.id || '').trim();
}

export function saveProfile(/** @type {any} */ profile, options = {}) {
  const next = migrateProfile(profile);
  const raw = JSON.stringify(next);
  const snapshot = new Map([
    [PROFILE_KEY, localStorage.getItem(PROFILE_KEY)],
    [PROFILE_LEGACY_KEY, localStorage.getItem(PROFILE_LEGACY_KEY)],
    [EON_PROFILE_MIGRATION_RECEIPT_KEY, localStorage.getItem(EON_PROFILE_MIGRATION_RECEIPT_KEY)]
  ]);
  const restore = () => {
    let ok = true;
    for (const [key, value] of snapshot.entries()) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
        if (localStorage.getItem(key) !== value) ok = false;
      } catch { ok = false; }
    }
    return ok;
  };

  try {
    localStorage.setItem(PROFILE_KEY, raw);
    if (localStorage.getItem(PROFILE_KEY) !== raw) throw new Error('Profile migration write did not verify.');
    if (localStorage.getItem(PROFILE_LEGACY_KEY) !== null) {
      localStorage.removeItem(PROFILE_LEGACY_KEY);
      if (localStorage.getItem(PROFILE_LEGACY_KEY) !== null) throw new Error('Legacy profile removal did not verify.');
    }
    if (options.migratedFromLegacy === true) {
      const receipt = JSON.stringify({
        schema: 'eon.profile.migration-receipt.a15-i08.v1',
        migratedAt: new Date().toISOString(),
        source: 'legacy-profile-v1',
        canonicalWriteVerified: true,
        legacyRemoved: true,
        rollbackPrepared: true,
        secretFieldsCopied: false,
        rawProfileIncluded: false
      });
      localStorage.setItem(EON_PROFILE_MIGRATION_RECEIPT_KEY, receipt);
      if (localStorage.getItem(EON_PROFILE_MIGRATION_RECEIPT_KEY) !== receipt) throw new Error('Profile migration receipt did not verify.');
    }
  } catch (error) {
    const rolledBack = restore();
    const failure = new Error(rolledBack ? String(error?.message || 'Profile migration failed.') : 'Profile migration failed and rollback could not be verified.');
    failure.cause = error;
    throw failure;
  }
  try { syncLegacyBadges(next); } catch {}
  return next;
}

export function getProfileMigrationTruth() {
  return Object.freeze({
    schema: 'eon.profile.migration-authority.a15-i08.v1',
    canonicalKey: PROFILE_KEY,
    legacyKey: PROFILE_LEGACY_KEY,
    allowlistedNormalization: true,
    secretShapedFieldsCopied: false,
    browserRoleAuthority: false,
    canonicalWriteVerified: true,
    legacyRemovedAfterVerifiedWrite: true,
    rollbackPreparedAndVerified: true,
    duplicateProfileAuthority: false
  });
}


export function ensureTrustedDeviceKey(/** @type {any} */ publicKey) {
  const normalized = String(publicKey || '').trim();
  if (!normalized) {
    return ensureProfile();
  }
  const current = ensureProfile();
  const deviceKeys = Array.isArray(current.deviceKeys) ? current.deviceKeys.slice(0, 12) : [];
  if (!deviceKeys.includes(normalized)) {
    deviceKeys.push(normalized);
  }
  return saveProfile({ ...current, deviceKeys: deviceKeys.slice(0, 12) });
}

export function isTrustedDeviceKey(/** @type {any} */ publicKey, /** @type {any} */ profile = null) {
  const normalized = String(publicKey || '').trim();
  if (!normalized) return false;
  const current = profile ? migrateProfile(profile) : getProfile();
  if (!current) return false;
  const keys = Array.isArray(current.deviceKeys) ? current.deviceKeys.filter(Boolean) : [];
  if (keys.length === 0) {
    return true;
  }
  return keys.includes(normalized);
}

export function ensureProfile() {
  const existing = getProfile();
  if (existing) {
    return saveProfile(existing);
  }
  const created = defaultProfile();
  return saveProfile(created);
}

export function getDecentralIdentitySummary(/** @type {any} */ profile = null) {
  const current = profile ? migrateProfile(profile) : ensureProfile();
  const recovery = normalizeRecoveryState(current.recovery);
  const browserAttachments = normalizeBrowserAttachments(current.browserAttachments);
  const browserWorkspaceProfiles = normalizeBrowserWorkspaceProfiles(current.browserWorkspaceProfiles);
  const entitlementReceipts = normalizeEntitlementReceipts(current.entitlementReceipts);
  const deviceKeys = Array.isArray(current.deviceKeys)
    ? [...new Set(current.deviceKeys.map((value) => String(value || '').trim()).filter(Boolean))].slice(0, 12)
    : [];
  const recoveryStatus = deriveRecoveryStatus(recovery);
  const recoveryLabel = {
    'local-only': 'Local only',
    'encrypted-backup': 'Encrypted backup',
    mirrored: 'Mirrored',
    'fully-recoverable': 'Fully recoverable'
  }[recoveryStatus] || 'Local only';

  return {
    uid: current.uid,
    alias: current.alias,
    wallet: current.wallet || current.walletAddress || '',
    recovery,
    recoveryStatus,
    recoveryLabel,
    isRecoverable: recoveryStatus !== 'local-only',
    browserAttachments,
    browserAttachmentCount: browserAttachments.length,
    browserAttachmentProviders: [...new Set(browserAttachments.map((/** @type {any} */ item) => item.provider))],
    browserWorkspaceProfiles,
    browserWorkspaceProfileCount: browserWorkspaceProfiles.length,
    browserWorkspaceProfileLabel: browserWorkspaceProfiles[0]?.label || 'No workspace profiles yet',
    entitlementReceipts,
    deviceKeys,
    entitlementReceiptCount: entitlementReceipts.length,
    latestEntitlementReceipt: entitlementReceipts[0] || null,
    latestEntitlementReceiptLabel: entitlementReceipts[0]
      ? `${entitlementReceipts[0].planId} · ${entitlementReceipts[0].paymentAsset.toUpperCase()}`
      : 'No receipts yet'
  };
}

export function getPortableEntitlementSummary(/** @type {any} */ profile = null) {
  const current = profile ? migrateProfile(profile) : ensureProfile();
  const entitlementReceipts = normalizeEntitlementReceipts(current.entitlementReceipts);
  const latestReceipt = entitlementReceipts[0] || null;
  const now = Date.now();
  const expiresAt = latestReceipt?.expiresAt ? Date.parse(latestReceipt.expiresAt) : NaN;
  const signatureKind = `${String(latestReceipt?.issuer || '').trim()}::${String(latestReceipt?.signature || '').trim()}`;
  const isLocalProof = signatureKind === 'local-vault::local-device';
  const isExpired = Number.isFinite(expiresAt) && expiresAt < now;
  const receiptStatus = !latestReceipt
    ? 'none'
    : isExpired
      ? 'expired'
      : isLocalProof
        ? 'verified-local'
        : 'portable';
  const receiptStatusLabel = {
    none: 'No portable receipt yet',
    expired: 'Portable receipt expired',
    'verified-local': 'Verified local receipt',
    portable: 'Portable receipt available'
  }[receiptStatus] || 'Portable receipt available';

  return {
    receiptStatus,
    receiptStatusLabel,
    receiptCount: entitlementReceipts.length,
    latestReceipt,
    latestReceiptLabel: latestReceipt
      ? `${latestReceipt.planId} · ${latestReceipt.paymentAsset.toUpperCase()}`
      : 'No receipts yet',
    latestReceiptProofLabel: latestReceipt
      ? `${receiptStatusLabel} · ${latestReceipt.planId} · ${latestReceipt.paymentAsset.toUpperCase()}`
      : receiptStatusLabel,
    latestReceiptExpiresLabel: latestReceipt?.expiresAt
      ? new Date(latestReceipt.expiresAt).toLocaleDateString()
      : 'No expiry set',
    isRecoverable: Boolean(current.recovery?.status && current.recovery.status !== 'local-only')
  };
}

export function verifyPortableEntitlementReceipt(/** @type {any} */ receipt = null, /** @type {any} */ profile = null) {
  const current = /** @type {any} */ (profile ? migrateProfile(profile) : ensureProfile());
  const normalized = /** @type {any} */ (normalizeEntitlementReceipt(receipt || {}));
  const recovery = normalizeRecoveryState(current.recovery);
  const hasMirrorTargets = recovery.mirrorTargets.length > 0;
  const isLocalProof = Boolean(normalized)
    && normalized.issuer === 'local-vault'
    && normalized.signature === 'local-device';
  const isExpired = Boolean(normalized && normalized.expiresAt) && Date.parse(normalized.expiresAt) < Date.now();
  const valid = Boolean(normalized) && !isExpired;
  const status = !normalized
    ? 'missing'
    : isExpired
      ? 'expired'
      : isLocalProof
        ? (hasMirrorTargets ? 'mirrored' : 'verified-local')
        : 'portable';
  const label = {
    missing: 'No portable receipt available',
    expired: 'Portable receipt expired',
    portable: 'Portable receipt ready',
    'verified-local': 'Verified local receipt',
    mirrored: 'Mirrored portable receipt'
  }[status] || 'Portable receipt ready';

  return {
    valid,
    status,
    label,
    isLocalProof,
    isExpired,
    hasMirrorTargets,
    receipt: normalized
  };
}

export function getPortableEntitlementVerificationSummary(/** @type {any} */ profile = null) {
  const current = profile ? migrateProfile(profile) : ensureProfile();
  const portable = getPortableEntitlementSummary(current);
  const recovery = normalizeRecoveryState(current.recovery);
  const isOperator = isAdminProfile(current);
  const hasMirrorTargets = recovery.mirrorTargets.length > 0;
  const latestReceipt = portable.latestReceipt || null;
  const receiptVerification = verifyPortableEntitlementReceipt(latestReceipt, current);
  const trustRelayStatus = latestReceipt
    ? (recovery.lastRestoreAt ? 'restored' : receiptVerification.status === 'mirrored' ? 'mirrored' : 'local-verified')
    : (hasMirrorTargets ? 'mirror-ready' : 'local-only');
  const verificationLabel = {
    'local-only': 'Local proof only',
    'mirror-ready': 'Mirror targets ready',
    'local-verified': 'Verified local proof',
    mirrored: 'Mirrored proof',
    restored: 'Restored from encrypted backup'
  }[trustRelayStatus] || 'Portable proof ready';
  const trustRelayLabel = hasMirrorTargets
    ? `${recovery.mirrorTargets.length} mirror target${recovery.mirrorTargets.length === 1 ? '' : 's'} configured`
    : 'No mirror targets configured';
  const operatorLabel = isOperator
    ? 'Operator wallet attested'
    : 'User wallet attested';
  return {
    ...portable,
    trustRelayStatus,
    verificationLabel,
    trustRelayLabel,
    operatorLabel,
    isOperator,
    hasMirrorTargets,
    receiptVerification,
    verificationDetail: latestReceipt
      ? `${verificationLabel} · ${portable.latestReceiptProofLabel}`
      : verificationLabel
  };
}

export function updateRecoveryState(/** @type {any} */ patch = {}) {
  const profile = ensureProfile();
  profile.recovery = normalizeRecoveryState({ ...profile.recovery, ...patch });
  return saveProfile(profile);
}

export function upsertBrowserAttachment(/** @type {any} */ attachment = {}) {
  const profile = ensureProfile();
  const normalized = normalizeBrowserAttachment(attachment);
  if (!normalized) {
    return profile.browserAttachments || [];
  }
  const list = normalizeBrowserAttachments(profile.browserAttachments || []);
  const key = `${normalized.provider}:${normalized.accountId || normalized.email || normalized.name || normalized.attachmentId}`;
  const next = list.filter((/** @type {any} */ item) => `${item.provider}:${item.accountId || item.email || item.name || item.attachmentId}` !== key);
  next.unshift(normalized);
  profile.browserAttachments = next.slice(0, PROFILE_BROWSER_STATE_LIMITS.attachments);
  return saveProfile(profile).browserAttachments;
}

export function listBrowserAttachments() {
  const profile = ensureProfile();
  return normalizeBrowserAttachments(profile.browserAttachments || []);
}

export function removeBrowserAttachment(/** @type {any} */ provider, /** @type {any} */ hint = '') {
  const profile = ensureProfile();
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  if (!normalizedProvider) {
    return profile.browserAttachments || [];
  }
  const normalizedHint = String(hint || '').trim().toLowerCase();
  profile.browserAttachments = normalizeBrowserAttachments(profile.browserAttachments || []).filter((/** @type {any} */ item) => {
    if (item.provider !== normalizedProvider) {
      return true;
    }
    const haystack = `${item.accountId || ''} ${item.email || ''} ${item.name || ''} ${item.attachmentId || ''}`.toLowerCase();
    if (!normalizedHint) {
      return false;
    }
    return !haystack.includes(normalizedHint);
  });
  return saveProfile(profile).browserAttachments;
}

export function touchBrowserAttachment(/** @type {any} */ provider, /** @type {any} */ hint = '') {
  const profile = ensureProfile();
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedHint = String(hint || '').trim().toLowerCase();
  if (!normalizedProvider) {
    return profile.browserAttachments || [];
  }
  const nowIso = new Date().toISOString();
  profile.browserAttachments = normalizeBrowserAttachments((profile.browserAttachments || []).map((/** @type {any} */ item) => {
    if (item.provider !== normalizedProvider) {
      return item;
    }
    const haystack = `${item.accountId || ''} ${item.email || ''} ${item.name || ''} ${item.attachmentId || ''}`.toLowerCase();
    if (normalizedHint && !haystack.includes(normalizedHint)) {
      return item;
    }
    return {
      ...item,
      lastUsedAt: nowIso
    };
  }));
  return saveProfile(profile).browserAttachments;
}

export function getBrowserWorkspaceProfiles() {
  const profile = ensureProfile();
  return normalizeBrowserWorkspaceProfiles(profile.browserWorkspaceProfiles || []);
}

export function saveBrowserWorkspaceProfile(/** @type {any} */ profileInput = {}) {
  const profile = ensureProfile();
  const normalized = normalizeBrowserWorkspaceProfile(profileInput);
  if (!normalized) {
    return getBrowserWorkspaceProfiles();
  }
  const list = normalizeBrowserWorkspaceProfiles(profile.browserWorkspaceProfiles || []);
  const key = normalized.id || normalized.label;
  const next = list.filter((item) => (item.id || item.label) !== key);
  next.unshift({
    ...normalized,
    updatedAt: new Date().toISOString(),
    snapshotAt: normalized.snapshotAt || new Date().toISOString()
  });
  profile.browserWorkspaceProfiles = next.slice(0, PROFILE_BROWSER_STATE_LIMITS.workspaces);
  return saveProfile(profile).browserWorkspaceProfiles;
}

export function upsertCurrentBrowserWorkspaceProfile(/** @type {any} */ label = '', /** @type {any} */ notes = '') {
  const profile = ensureProfile();
  const attachments = normalizeBrowserAttachments(profile.browserAttachments || []);
  const cleanedLabel = String(label || '').trim().slice(0, 72) || `Workspace ${new Date().toLocaleDateString()}`;
  const existing = normalizeBrowserWorkspaceProfiles(profile.browserWorkspaceProfiles || []).find((item) => item.label.toLowerCase() === cleanedLabel.toLowerCase()) || null;
  return saveBrowserWorkspaceProfile({
    id: existing?.id || cleanedLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || cleanedLabel,
    label: cleanedLabel,
    notes,
    attachments,
    source: 'local-profile',
    snapshotAt: existing?.snapshotAt || new Date().toISOString(),
    lastAppliedAt: existing?.lastAppliedAt || null
  });
}

export function removeBrowserWorkspaceProfile(/** @type {any} */ profileId = '') {
  const profile = ensureProfile();
  const normalizedId = String(profileId || '').trim().toLowerCase();
  if (!normalizedId) {
    return getBrowserWorkspaceProfiles();
  }
  profile.browserWorkspaceProfiles = normalizeBrowserWorkspaceProfiles(profile.browserWorkspaceProfiles || []).filter((item) => String(item.id || '').trim().toLowerCase() !== normalizedId && String(item.label || '').trim().toLowerCase() !== normalizedId);
  return saveProfile(profile).browserWorkspaceProfiles;
}

export function applyBrowserWorkspaceProfile(/** @type {any} */ profileId = '') {
  const profile = ensureProfile();
  const normalizedId = String(profileId || '').trim().toLowerCase();
  if (!normalizedId) {
    return profile.browserAttachments || [];
  }
  const list = normalizeBrowserWorkspaceProfiles(profile.browserWorkspaceProfiles || []);
  const entry = list.find((item) => String(item.id || '').trim().toLowerCase() === normalizedId || String(item.label || '').trim().toLowerCase() === normalizedId);
  if (!entry) {
    return profile.browserAttachments || [];
  }
  profile.browserAttachments = normalizeBrowserAttachments(entry.attachments || []);
  profile.browserWorkspaceProfiles = list.map((item) => {
    if (String(item.id || '').trim().toLowerCase() !== normalizedId && String(item.label || '').trim().toLowerCase() !== normalizedId) {
      return item;
    }
    return {
      ...item,
      lastAppliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
  return saveProfile(profile).browserAttachments;
}

export function appendEntitlementReceipt(/** @type {any} */ receipt = {}) {
  const profile = ensureProfile();
  const normalized = normalizeEntitlementReceipt(receipt);
  if (!normalized) {
    return profile.entitlementReceipts || [];
  }
  const list = normalizeEntitlementReceipts(profile.entitlementReceipts || []);
  const next = list.filter((/** @type {any} */ item) => item.receiptId !== normalized.receiptId);
  next.unshift(normalized);
  profile.entitlementReceipts = next.slice(0, PROFILE_BROWSER_STATE_LIMITS.receipts);
  return saveProfile(profile).entitlementReceipts;
}

export function recordVaultRestore() {
  const profile = ensureProfile();
  const nowIso = new Date().toISOString();
  profile.stats.vaultExports = profile.stats.vaultExports || 0;
  profile.recovery = normalizeRecoveryState({
    ...profile.recovery,
    lastRestoreAt: nowIso,
    status: deriveRecoveryStatus({ ...profile.recovery, lastRestoreAt: nowIso }),
    updatedAt: nowIso
  });
  const challengeUpdate = applyChallengeProgress(profile, 'vaultRestore');
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate };
}

export function getProfileStats() {
  const profile = ensureProfile();
  const referralTier = getReferralTierInfo(profile.stats.referralReturns || 0);
  const identitySummary = getDecentralIdentitySummary(profile);
  return {
    uid: profile.uid,
    alias: profile.alias,
    aliasSeed: profile.aliasSeed,
    avatar: profile.avatar,
    avatarSeed: profile.avatarSeed,
    totalRuns: profile.stats.totalRuns || 0,
    totalShares: profile.stats.totalShares || 0,
    challengeStreak: profile.stats.challengeStreak || 0,
    challengeXp: profile.stats.challengeXp || 0,
    referralReturns: profile.stats.referralReturns || 0,
    referralTier,
    badgeCount: profile.badges.length,
    favoriteCount: profile.favorites.length,
    browserAttachmentCount: identitySummary.browserAttachmentCount,
    entitlementReceiptCount: identitySummary.entitlementReceiptCount,
    recoveryStatus: identitySummary.recoveryStatus,
    recoveryLabel: identitySummary.recoveryLabel
  };
}

export function isAdminProfile() {
  // W242: no wallet, browser profile, or localStorage value can grant admin authority.
  return false;
}

export function updateProfile(/** @type {any} */ { aliasSeed, avatarSeed, alias, avatar }) {
  const profile = ensureProfile();
  let aliasWasSet = false;

  if (typeof alias === 'string' && alias.trim()) {
    const cleaned = alias.replace(/[^A-Za-z0-9_\- ]/g, '').trim().slice(0, 24);
    if (cleaned) {
      profile.aliasSeed = safeNormalizeAliasSeed(cleaned, profile.uid);
      profile.alias = cleaned;
      aliasWasSet = true;
    }
  }

  if (aliasSeed) {
    profile.aliasSeed = safeNormalizeAliasSeed(aliasSeed, profile.uid);
  }

  if (avatarSeed) {
    profile.avatarSeed = normalizeAvatarSeed(avatarSeed, profile.uid);
  }

  if (typeof avatar === 'string' && avatar.trim()) {
    profile.avatar = avatar.trim().slice(0, 2);
  }

  if (!aliasWasSet) {
    profile.alias = buildAlias(profile.uid, profile.aliasSeed);
  }
  if (!profile.avatar) {
    profile.avatar = safePickGeneratedAccent(profile.uid, profile.aliasSeed);
  }
  return saveProfile(profile);
}

export function regenerateProfileAlias() {
  const profile = ensureProfile();
  profile.aliasSeed = safeGenerateAliasSeed(profile.uid);
  profile.alias = buildAlias(profile.uid, profile.aliasSeed);
  profile.avatar = safePickGeneratedAccent(profile.uid, profile.aliasSeed);
  return saveProfile(profile);
}

export function remixProfileAvatar() {
  const profile = ensureProfile();
  profile.avatarSeed = generateAvatarSeed(profile.uid);
  profile.avatar = safePickGeneratedAccent(profile.uid, profile.aliasSeed);
  return saveProfile(profile);
}

/**
 * W212/W215 raw-query referral retirement.
 * New referral and Realm shares are self-contained signed eon2/eon3 envelopes
 * in the URL fragment. A legacy ?ref= / ?trail= URL cannot mutate local
 * referral state, create attribution, create a referral-tree record, or
 * produce any reward. Existing stored referral-tree records are untouched.
 */
export function captureInviteFromUrl() {
  return null;
}

export function recordToolRun(/** @type {any} */ toolId, /** @type {any} */ resultMeta = {}) {
  const profile = ensureProfile();
  profile.stats.totalRuns = (profile.stats.totalRuns || 0) + 1;
  profile.history.unshift({
    toolId,
    at: new Date().toISOString(),
    title: resultMeta.title || '',
    score: resultMeta.score ?? '',
    badge: resultMeta.badge || ''
  });
  profile.history = profile.history.slice(0, MAX_HISTORY);

  if (profile.stats.totalRuns === 1) {
    ensureBadge(profile, 'first-result');
  }
  if (profile.stats.totalRuns === 5) {
    ensureBadge(profile, 'explorer-5');
  }

  const challengeUpdate = applyChallengeProgress(profile, 'toolRun');
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate };
}

export function markShare() {
  const profile = ensureProfile();
  profile.stats.totalShares = (profile.stats.totalShares || 0) + 1;
  if (profile.stats.totalShares === 1) {
    ensureBadge(profile, 'first-share');
  }
  const challengeUpdate = applyChallengeProgress(profile, 'share');
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate };
}

function buildChallengeWinKey(/** @type {any} */ toolId, /** @type {any} */ challenge = {}) {
  return [
    toolId,
    normalizeIdentityId(challenge?.ref) || 'anon',
    String(challenge?.createdAt || challenge?.expiresAt || challenge?.value || '')
  ].join(':');
}

export function recordChallengeWin(/** @type {any} */ toolId, /** @type {any} */ challenge = {}) {
  const winKey = buildChallengeWinKey(toolId, challenge);
  const winLog = readChallengeWinLog();
  if (winLog.includes(winKey)) {
    return { profile: ensureProfile(), challengeUpdate: null, skipped: true };
  }

  const profile = ensureProfile();
  profile.stats.challengeWins = (profile.stats.challengeWins || 0) + 1;
  ensureBadge(profile, `challenge-win:${toolId}`);
  const challengeUpdate = applyChallengeProgress(profile, 'challengeWin');
  winLog.push(winKey);
  saveChallengeWinLog(winLog);
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate };
}

export function recordRewardedUnlock(/** @type {any} */ kind = 'rewarded') {
  const profile = ensureProfile();
  profile.stats.rewardedUnlocks = (profile.stats.rewardedUnlocks || 0) + 1;
  if (profile.stats.rewardedUnlocks === 1) {
    ensureBadge(profile, 'first-bonus-unlock');
  }
  const challengeUpdate = applyChallengeProgress(profile, 'rewardedUnlock');
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate, kind };
}

export function recordVaultExport() {
  const profile = ensureProfile();
  profile.stats.vaultExports = (profile.stats.vaultExports || 0) + 1;
  const nowIso = new Date().toISOString();
  profile.recovery = normalizeRecoveryState({
    ...profile.recovery,
    lastExportAt: nowIso,
    status: deriveRecoveryStatus({ ...profile.recovery, lastExportAt: nowIso }),
    updatedAt: nowIso
  });
  const challengeUpdate = applyChallengeProgress(profile, 'vaultExport');
  const saved = saveProfile(profile);
  return { profile: saved, challengeUpdate };
}

export function toggleFavorite(/** @type {any} */ url, /** @type {any} */ title = '') {
  const profile = ensureProfile();
  const existingIndex = profile.favorites.findIndex((/** @type {any} */ item) => item.url === url);
  if (existingIndex >= 0) {
    profile.favorites.splice(existingIndex, 1);
  } else {
    profile.favorites.unshift({ url, title, savedAt: new Date().toISOString() });
    applyChallengeProgress(profile, 'favorite');
  }
  saveProfile(profile);
  return profile.favorites;
}

export function buildChallengeUrl(/** @type {any} */ path, /** @type {any} */ challenge) {
  const profile = ensureProfile();
  const url = new URL(normalizeSharePath(path), window.location.origin);
  const trail = buildInviteTrail(profile);
  url.searchParams.set('ref', profile.uid);
  url.searchParams.set('aliasSeed', profile.aliasSeed);
  const encodedTrail = base64UrlEncode(JSON.stringify(trail), 1200);
  if (encodedTrail) {
    url.searchParams.set('trail', encodedTrail);
  }

  if (challenge) {
    const payload = sanitizeChallengePayload(challenge, trail.length);
    const encodedChallenge = payload ? base64UrlEncode(JSON.stringify(payload), 1200) : null;
    if (encodedChallenge) {
      url.searchParams.set('challenge', encodedChallenge);
    }
  }

  return url.toString();
}

function parseInviteTrailParam(/** @type {any} */ value) {
  if (!value) return [];
  try {
    return normalizeInviteTrail(JSON.parse(base64UrlDecode(value, 1600, 1800)));
  } catch {
    return [];
  }
}

export function getChallengeFromUrl() {
  if (window.location.search.length > MAX_SEARCH_LENGTH) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const raw = params.get('challenge');
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(raw, 1400, 1800));
    const challenge = sanitizeChallengePayload(decoded, decoded?.chainDepth || 1);
    if (!challenge) {
      return null;
    }
    if (challenge.expiresAt && Number(challenge.expiresAt) < Date.now()) {
      return null;
    }

    const trail = parseInviteTrailParam(params.get('trail'));
    return {
      ...challenge,
      ref: normalizeIdentityId(params.get('ref')) || '',
      alias: normalizeIdentityId(params.get('ref'))
        ? buildAlias(params.get('ref'), normalizeAliasSeed(params.get('aliasSeed'), params.get('ref')))
        : 'A friend',
      trail,
      chainDepth: challenge.chainDepth || trail.length
    };
  } catch {
    return null;
  }
}

export function getInviteSummary() {
  const profile = ensureProfile();
  const referralTier = getReferralTierInfo(profile.stats.referralReturns || 0);
  return {
    shareUrl: '',
    // Raw query-based sharing is retired. Public referral/Realm shares are async signed eon2/eon3 links.
    legacyShareUrl: '',
    publicLinkStatus: 'create-signed-link-async',
    inviteTrail: normalizeInviteTrail(profile.inviteTrail),
    invitedBy: profile.invitedBy,
    invitedAlias: profile.invitedAlias,
    invitedAliasSeed: profile.invitedAliasSeed,
    chainDepth: normalizeInviteTrail(profile.inviteTrail).length,
    referralReturns: profile.stats.referralReturns || 0,
    referralStreak: profile.stats.referralStreak || 0,
    referralStreakBest: profile.stats.referralStreakBest || 0,
    referralTier,
    referralLadder: REFERRAL_TIERS.map((/** @type {any} */ tier) => ({
      ...tier,
      unlocked: (profile.stats.referralReturns || 0) >= tier.min,
      current: tier.name === referralTier.name
    }))
  };
}

export function getReferralActivitySummary(/** @type {any} */ profile = null) {
  const current = /** @type {any} */ (profile ? migrateProfile(profile) : ensureProfile());
  const uid = normalizeIdentityId(current.uid || current.id || '') || '';
  const returnEvents = readReferralReturnEvents();
  const milestoneLog = loadReferralMilestoneLog();
  const milestoneTiers = Array.isArray(milestoneLog[uid]) ? milestoneLog[uid] : [];
  const recentEvents = returnEvents
    .filter((/** @type {any} */ event) => !uid || event.fromUid === uid || event.referrerId === uid || event.profileId === uid)
    .slice(-12)
    .reverse();

  const rewardCounts = recentEvents.reduce((/** @type {Record<string, number>} */ acc, /** @type {any} */ event) => {
    const kind = String(event?.rewardKind || event?.tier?.rewardKind || '').trim() || 'other';
    acc[kind] = (acc[kind] || 0) + 1;
    return acc;
  }, {});

  return {
    uid,
    totalReturns: Number(current.stats?.referralReturns || 0),
    streak: Number(current.stats?.referralStreak || 0),
    streakBest: Number(current.stats?.referralStreakBest || 0),
    milestoneCount: milestoneTiers.length,
    totalPoolPoints: 0,
    recentEvents,
    rewardCounts,
    referralTier: getReferralTierInfo(current.stats?.referralReturns || 0)
  };
}

if (typeof globalThis !== 'undefined') {
  /** @type {any} */ (globalThis).EONProfile = {
    getProfile,
    saveProfile,
    ensureProfile,
    isAdminProfile,
    getAdminWalletAllowlist,
    setAdminWalletAllowlist,
    isAdminWalletAddress,
    getDecentralIdentitySummary,
    getPortableEntitlementSummary,
    updateRecoveryState,
    upsertBrowserAttachment,
    removeBrowserAttachment,
    touchBrowserAttachment,
    getBrowserWorkspaceProfiles,
    saveBrowserWorkspaceProfile,
    upsertCurrentBrowserWorkspaceProfile,
    removeBrowserWorkspaceProfile,
    applyBrowserWorkspaceProfile,
    appendEntitlementReceipt,
    readReferralReturnLog,
    readReferralReturnEvents,
    getInviteSummary,
    getReferralActivitySummary,
    recordVaultExport,
    recordVaultRestore
  };
}

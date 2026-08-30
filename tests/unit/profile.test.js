'use strict';
const vm     = require('node:vm');
const fs     = require('node:fs');
const path   = require('node:path');
const test   = require('node:test');
const assert = require('node:assert/strict');

// -------------------------------------------------------------------------
// Minimal browser context + dependency mocks for profile.js
// -------------------------------------------------------------------------
function makeContext(localInit = {}, locationOverride = {}) {
  const store = { ...localInit };

  const localStorage = {
    getItem:    (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store
  };

  const loc = {
    origin:   'https://eonapp.ch',
    pathname: '/',
    search:   '',
    ...locationOverride
  };

  const window = { location: loc };
  const { URL } = require('url');
  const { URLSearchParams } = require('url');

  // Stub dependency modules injected as globals
  function generateIdentityId() { return 'uid-' + Math.random().toString(36).slice(2, 10); }
  function normalizeIdentityId(v = '') { return typeof v === 'string' && /^[a-f0-9]{8,64}$/i.test(v) ? v : (v ? v.slice(0, 64) : ''); }
  function shortIdentityId(v = '') { return String(v).slice(0, 8); }
  function generateAvatarSeed(uid) { return 'seed-' + (uid || '').slice(0, 6); }
  function normalizeAvatarSeed(seed) { return seed || 'eon-avatar'; }
  function getBadges() { return []; }
  function recordChallengeEvent(uid, eventType, increment = 1) {
    return { meta: { currentStreak: 0, totalXp: 0 }, newlyCompleted: [], dayCompleted: false };
  }

  // atob / btoa for base64 round-trips
  const { atob, btoa } = require('buffer').Buffer
    ? { atob: (s) => Buffer.from(s, 'base64').toString('binary'),
        btoa: (s) => Buffer.from(s, 'binary').toString('base64') }
    : { atob, btoa };

  const TextEncoder = require('util').TextEncoder;
  const TextDecoder = require('util').TextDecoder;

  return vm.createContext({
    localStorage, window, URL, URLSearchParams,
    generateIdentityId, normalizeIdentityId, shortIdentityId,
    generateAvatarSeed, normalizeAvatarSeed, getBadges, recordChallengeEvent,
    atob, btoa, TextEncoder, TextDecoder,
    Date, Math, JSON, Array, Object, Number, String, Set, Boolean,
    _store: store
  });
}

function loadProfile(ctx) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'profile.js'),
    'utf8'
  );
  // Strip ES module import/export so code runs in vm context.
  // Dependency symbols are already injected as globals above.
  const compat = source
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export function /gm, 'function ')
    .replace(/^export async function /gm, 'async function ')
    .replace(/^export const /gm, 'var ');
  vm.runInContext(compat, ctx);

  return {
    getReferralTierInfo:  ctx.getReferralTierInfo,
    getProfile:           ctx.getProfile,
    saveProfile:          ctx.saveProfile,
    ensureProfile:        ctx.ensureProfile,
    getDecentralIdentitySummary: ctx.getDecentralIdentitySummary,
    getProfileStats:      ctx.getProfileStats,
    isAdminProfile:       ctx.isAdminProfile,
    updateProfile:        ctx.updateProfile,
    updateRecoveryState:   ctx.updateRecoveryState,
    upsertBrowserAttachment: ctx.upsertBrowserAttachment,
    removeBrowserAttachment: ctx.removeBrowserAttachment,
    touchBrowserAttachment: ctx.touchBrowserAttachment,
    remixProfileAvatar:   ctx.remixProfileAvatar,
    recordToolRun:        ctx.recordToolRun,
    markShare:            ctx.markShare,
    recordChallengeWin:   ctx.recordChallengeWin,
    recordRewardedUnlock: ctx.recordRewardedUnlock,
    recordVaultExport:    ctx.recordVaultExport,
    recordVaultRestore:   ctx.recordVaultRestore,
    appendEntitlementReceipt: ctx.appendEntitlementReceipt,
    verifyPortableEntitlementReceipt: ctx.verifyPortableEntitlementReceipt,
    toggleFavorite:       ctx.toggleFavorite,
    captureInviteFromUrl: ctx.captureInviteFromUrl,
    buildChallengeUrl:    ctx.buildChallengeUrl,
    getChallengeFromUrl:  ctx.getChallengeFromUrl,
  };
}

// -------------------------------------------------------------------------
// getReferralTierInfo — pure function
// -------------------------------------------------------------------------
test('getReferralTierInfo: count 0 returns Referral Starter', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(0);
  assert.equal(info.name, 'Referral Starter');
  assert.equal(info.count, 0);
  assert.equal(info.remaining, 1);
});

test('getReferralTierInfo: count 1 returns Loop Runner', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(1);
  assert.equal(info.name, 'Loop Runner');
  assert.equal(info.count, 1);
  assert.equal(info.nextTarget, 5);
});

test('getReferralTierInfo: count 5 returns Catalyst', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(5);
  assert.equal(info.name, 'Catalyst');
});

test('getReferralTierInfo: count 10 returns Amplifier', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  assert.equal(getReferralTierInfo(10).name, 'Amplifier');
});

test('getReferralTierInfo: count 25 returns Architect with 100% progress', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(25);
  assert.equal(info.name, 'Architect');
  assert.equal(info.nextTarget, 50);
  assert.equal(info.progressToNext, 50);
  assert.equal(info.remaining, 25);
});

test('getReferralTierInfo: count 50 returns Operator', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(50);
  assert.equal(info.name, 'Operator');
  assert.equal(info.nextTarget, 100);
});

test('getReferralTierInfo: count 100 returns Legend with 100% progress', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  const info = getReferralTierInfo(100);
  assert.equal(info.name, 'Legend');
  assert.equal(info.nextTarget, null);
  assert.equal(info.progressToNext, 100);
  assert.equal(info.remaining, 0);
});

test('getReferralTierInfo: negative count treated as 0', () => {
  const ctx = makeContext();
  const { getReferralTierInfo } = loadProfile(ctx);
  assert.equal(getReferralTierInfo(-5).name, 'Referral Starter');
});

// -------------------------------------------------------------------------
// getProfile / saveProfile / ensureProfile
// -------------------------------------------------------------------------
test('getProfile: returns null when localStorage is empty', () => {
  const ctx = makeContext();
  const { getProfile } = loadProfile(ctx);
  assert.equal(getProfile(), null);
});

test('getProfile: returns parsed profile after save', () => {
  const ctx = makeContext();
  const { ensureProfile, getProfile } = loadProfile(ctx);
  ensureProfile();
  const p = getProfile();
  assert.ok(p !== null);
  assert.ok(typeof p.uid === 'string' && p.uid.length > 0);
  assert.ok(typeof p.alias === 'string');
});

test('ensureProfile: idempotent — same uid on second call', () => {
  const ctx = makeContext();
  const { ensureProfile } = loadProfile(ctx);
  const first = ensureProfile();
  const second = ensureProfile();
  assert.equal(first.uid, second.uid);
});

test('saveProfile: sanitizes alias — strips special chars', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.alias = '<script>xss</script>';
  saveProfile(p);
  const saved = getProfile();
  assert.ok(!saved.alias.includes('<'));
  assert.ok(!saved.alias.includes('>'));
});

test('saveProfile: truncates alias at 24 chars', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.alias = 'A'.repeat(50);
  saveProfile(p);
  const saved = getProfile();
  assert.ok(saved.alias.length <= 24);
});

test('saveProfile: favorites capped at 50', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.favorites = Array.from({ length: 60 }, (_, i) => ({ url: `/t${i}`, title: `T${i}`, savedAt: '' }));
  saveProfile(p);
  const saved = getProfile();
  assert.ok(saved.favorites.length <= 50);
});

test('saveProfile: history capped at MAX_HISTORY (40)', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.history = Array.from({ length: 50 }, (_, i) => ({ toolId: `t${i}`, at: '', title: '', score: '', badge: '' }));
  saveProfile(p);
  const saved = getProfile();
  assert.ok(saved.history.length <= 40);
});

test('saveProfile: preserves role metadata but local role flags do not grant admin', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile, isAdminProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.wallet = '0x1111111111111111111111111111111111111111';
  p.walletAddress = '0x1111111111111111111111111111111111111111';
  p.role = 'operator';
  p.roles = ['operator'];
  p.isAdmin = true;
  saveProfile(p);
  const saved = getProfile();
  assert.equal(saved.wallet, '0x1111111111111111111111111111111111111111');
  assert.equal(saved.walletAddress, '0x1111111111111111111111111111111111111111');
  assert.equal(saved.role, 'operator');
  assert.ok(Array.isArray(saved.roles));
  assert.ok(saved.roles.includes('operator'));
  assert.equal(isAdminProfile(saved), false);
});

test('saveProfile: wallet allowlist can mark an operator profile as admin', () => {
  const ctx = makeContext();
  ctx.__EON_ADMIN_WALLETS__ = '0xf0dbE1026A4cbFD00Bad66163db6f30c62197862';
  const { ensureProfile, saveProfile, getProfile, isAdminProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.wallet = '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862';
  p.isAdmin = false;
  saveProfile(p);
  const saved = getProfile();
  assert.equal(isAdminProfile(saved), true);
});

test('saveProfile: preserves recovery, browser attachments, and receipts', () => {
  const ctx = makeContext();
  const { ensureProfile, saveProfile, getProfile } = loadProfile(ctx);
  const p = ensureProfile();
  p.recovery = {
    status: 'encrypted-backup',
    lastExportAt: '2026-05-20T00:00:00.000Z',
    lastRestoreAt: null,
    recoveryPhraseSet: true,
    passkeyReady: false,
    mirrorTargets: ['ipfs://cid123'],
    notes: 'backup ready',
    updatedAt: '2026-05-20T00:00:00.000Z'
  };
  p.browserAttachments = [
    { provider: 'google', email: 'user@example.com', name: 'User', attachedAt: '2026-05-20T00:00:00.000Z' }
  ];
  p.entitlementReceipts = [
    { receiptId: 'r1', planId: 'builder', paymentAsset: 'stable', issuedAt: '2026-05-20T00:00:00.000Z' }
  ];
  saveProfile(p);
  const saved = getProfile();
  assert.equal(saved.recovery.status, 'encrypted-backup');
  assert.equal(saved.browserAttachments.length, 1);
  assert.equal(saved.entitlementReceipts.length, 1);
});

// -------------------------------------------------------------------------
// updateProfile
// -------------------------------------------------------------------------
test('updateProfile: sets alias', () => {
  const ctx = makeContext();
  const { ensureProfile, updateProfile, getProfile } = loadProfile(ctx);
  ensureProfile();
  updateProfile({ alias: 'HeroUser' });
  assert.equal(getProfile().alias, 'HeroUser');
});

test('updateProfile: strips special chars from alias', () => {
  const ctx = makeContext();
  const { ensureProfile, updateProfile, getProfile } = loadProfile(ctx);
  ensureProfile();
  updateProfile({ alias: 'Bad<>User' });
  assert.ok(!getProfile().alias.includes('<'));
});

test('updateProfile: avatar truncated to 2 chars', () => {
  const ctx = makeContext();
  const { ensureProfile, updateProfile, getProfile } = loadProfile(ctx);
  ensureProfile();
  updateProfile({ avatar: '🔥🎯🌊' });
  assert.ok(getProfile().avatar.length <= 2);
});

// -------------------------------------------------------------------------
// recordToolRun
// -------------------------------------------------------------------------
test('recordToolRun: increments totalRuns', () => {
  const ctx = makeContext();
  const { ensureProfile, recordToolRun, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordToolRun('scorecard');
  assert.equal(getProfile().stats.totalRuns, 1);
});

test('recordToolRun: adds first-result badge on first run', () => {
  const ctx = makeContext();
  const { ensureProfile, recordToolRun, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordToolRun('scorecard');
  assert.ok(getProfile().badges.includes('first-result'));
});

test('recordToolRun: adds explorer-5 badge on 5th run', () => {
  const ctx = makeContext();
  const { ensureProfile, recordToolRun, getProfile } = loadProfile(ctx);
  ensureProfile();
  for (let i = 0; i < 5; i++) recordToolRun('tool');
  assert.ok(getProfile().badges.includes('explorer-5'));
});

test('recordToolRun: adds history entry', () => {
  const ctx = makeContext();
  const { ensureProfile, recordToolRun, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordToolRun('budget', { title: 'My Budget', score: 72 });
  const h = getProfile().history[0];
  assert.equal(h.toolId, 'budget');
  assert.equal(h.title, 'My Budget');
});

test('recordToolRun: history capped at 40', () => {
  const ctx = makeContext();
  const { ensureProfile, recordToolRun, getProfile } = loadProfile(ctx);
  ensureProfile();
  for (let i = 0; i < 45; i++) recordToolRun('tool');
  assert.ok(getProfile().history.length <= 40);
});

// -------------------------------------------------------------------------
// markShare
// -------------------------------------------------------------------------
test('markShare: increments totalShares', () => {
  const ctx = makeContext();
  const { ensureProfile, markShare, getProfile } = loadProfile(ctx);
  ensureProfile();
  markShare();
  assert.equal(getProfile().stats.totalShares, 1);
});

test('markShare: adds first-share badge on first share', () => {
  const ctx = makeContext();
  const { ensureProfile, markShare, getProfile } = loadProfile(ctx);
  ensureProfile();
  markShare();
  assert.ok(getProfile().badges.includes('first-share'));
});

// -------------------------------------------------------------------------
// recordChallengeWin
// -------------------------------------------------------------------------
test('recordChallengeWin: increments challengeWins', () => {
  const ctx = makeContext();
  const { ensureProfile, recordChallengeWin, getProfile } = loadProfile(ctx);
  ensureProfile();
  const challenge = { createdAt: Date.now() };
  recordChallengeWin('budget', challenge);
  assert.equal(getProfile().stats.challengeWins, 1);
});

test('recordChallengeWin: idempotent — same win not counted twice', () => {
  const ctx = makeContext();
  const { ensureProfile, recordChallengeWin, getProfile } = loadProfile(ctx);
  ensureProfile();
  const challenge = { createdAt: 12345 };
  recordChallengeWin('budget', challenge);
  const result = recordChallengeWin('budget', challenge);
  assert.ok(result.skipped === true);
  assert.equal(getProfile().stats.challengeWins, 1);
});

test('recordChallengeWin: adds challenge-win badge for tool', () => {
  const ctx = makeContext();
  const { ensureProfile, recordChallengeWin, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordChallengeWin('scorecard', { createdAt: Date.now() });
  assert.ok(getProfile().badges.includes('challenge-win:scorecard'));
});

// -------------------------------------------------------------------------
// recordRewardedUnlock
// -------------------------------------------------------------------------
test('recordRewardedUnlock: increments rewardedUnlocks', () => {
  const ctx = makeContext();
  const { ensureProfile, recordRewardedUnlock, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordRewardedUnlock('bonus');
  assert.equal(getProfile().stats.rewardedUnlocks, 1);
});

test('recordRewardedUnlock: adds first-bonus-unlock badge', () => {
  const ctx = makeContext();
  const { ensureProfile, recordRewardedUnlock, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordRewardedUnlock();
  assert.ok(getProfile().badges.includes('first-bonus-unlock'));
});

// -------------------------------------------------------------------------
// recordVaultExport
// -------------------------------------------------------------------------
test('recordVaultExport: increments vaultExports', () => {
  const ctx = makeContext();
  const { ensureProfile, recordVaultExport, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordVaultExport();
  assert.equal(getProfile().stats.vaultExports, 1);
  assert.equal(getProfile().recovery.status, 'encrypted-backup');
});

test('recordVaultRestore: marks restored identity recoverable after export', () => {
  const ctx = makeContext();
  const { ensureProfile, recordVaultExport, recordVaultRestore, getProfile } = loadProfile(ctx);
  ensureProfile();
  recordVaultExport();
  recordVaultRestore();
  assert.equal(getProfile().recovery.status, 'fully-recoverable');
  assert.ok(getProfile().recovery.lastRestoreAt);
});

test('browser attachment helpers: upsert and remove entries', () => {
  const ctx = makeContext();
  const { ensureProfile, upsertBrowserAttachment, removeBrowserAttachment, getProfile } = loadProfile(ctx);
  ensureProfile();
  upsertBrowserAttachment({ provider: 'google', email: 'user@example.com', name: 'User' });
  assert.equal(getProfile().browserAttachments.length, 1);
  removeBrowserAttachment('google', 'user@example.com');
  assert.equal(getProfile().browserAttachments.length, 0);
});

test('getDecentralIdentitySummary: reports recovery and receipt counts', () => {
  const ctx = makeContext();
  const { ensureProfile, upsertBrowserAttachment, appendEntitlementReceipt, getDecentralIdentitySummary } = loadProfile(ctx);
  ensureProfile();
  upsertBrowserAttachment({ provider: 'github', name: 'Dev' });
  appendEntitlementReceipt({ receiptId: 'receipt-1', planId: 'builder', paymentAsset: 'stable', issuedAt: '2026-05-20T00:00:00.000Z' });
  const summary = getDecentralIdentitySummary();
  assert.equal(summary.browserAttachmentCount, 1);
  assert.equal(summary.entitlementReceiptCount, 1);
  assert.equal(summary.recoveryStatus, 'local-only');
});

test('verifyPortableEntitlementReceipt: marks local proof as verified and mirrored when targets exist', () => {
  const ctx = makeContext();
  const { ensureProfile, updateRecoveryState, appendEntitlementReceipt, verifyPortableEntitlementReceipt } = loadProfile(ctx);
  ensureProfile();
  updateRecoveryState({ mirrorTargets: ['ipfs://mirror-a'] });
  const receipt = appendEntitlementReceipt({
    receiptId: 'receipt-local',
    planId: 'builder',
    paymentAsset: 'stable',
    issuer: 'local-vault',
    signature: 'local-device',
    issuedAt: '2026-05-20T00:00:00.000Z'
  })[0];
  const verification = verifyPortableEntitlementReceipt(receipt);
  assert.equal(verification.valid, true);
  assert.equal(verification.isLocalProof, true);
  assert.equal(verification.hasMirrorTargets, true);
  assert.equal(verification.status, 'mirrored');
});

// -------------------------------------------------------------------------
// toggleFavorite
// -------------------------------------------------------------------------
test('toggleFavorite: adds favorite', () => {
  const ctx = makeContext();
  const { ensureProfile, toggleFavorite, getProfile } = loadProfile(ctx);
  ensureProfile();
  toggleFavorite('/tools/budget', 'Budget');
  assert.equal(getProfile().favorites.length, 1);
  assert.equal(getProfile().favorites[0].url, '/tools/budget');
});

test('toggleFavorite: removes favorite on second call', () => {
  const ctx = makeContext();
  const { ensureProfile, toggleFavorite, getProfile } = loadProfile(ctx);
  ensureProfile();
  toggleFavorite('/tools/budget', 'Budget');
  toggleFavorite('/tools/budget', 'Budget');
  assert.equal(getProfile().favorites.length, 0);
});

// -------------------------------------------------------------------------
// migrateProfile — via saveProfile/getProfile round-trip
// -------------------------------------------------------------------------
test('migrateProfile: normalizes inviteTrail from raw invitedBy', () => {
  const ctx = makeContext();
  const { saveProfile, getProfile } = loadProfile(ctx);
  // Save a v1-style profile with invitedBy but no inviteTrail
  const p = {
    uid: 'abcdef0123456789',
    alias: 'Tester',
    avatar: '⚡',
    avatarSeed: 'seed-abc',
    createdAt: new Date().toISOString(),
    favorites: [],
    history: [],
    badges: [],
    invitedBy: 'aabbccdd11223344',
    invitedAlias: 'Referrer',
    inviteTrail: [],
    stats: {},
    version: 1
  };
  saveProfile(p);
  const migrated = getProfile();
  // Should have at minimum the invitedBy entry in trail
  assert.ok(migrated.inviteTrail.length >= 1);
  assert.equal(migrated.inviteTrail[0].uid, 'aabbccdd11223344');
});

test('migrateProfile: deduplicates badges', () => {
  const ctx = makeContext();
  const { saveProfile, getProfile } = loadProfile(ctx);
  const p = {
    uid: 'abcdef0123456789',
    alias: 'Tester',
    avatar: '⚡',
    avatarSeed: 'seed',
    createdAt: new Date().toISOString(),
    favorites: [],
    history: [],
    badges: ['a', 'a', 'b', 'b', 'c'],
    invitedBy: null,
    invitedAlias: null,
    inviteTrail: [],
    stats: {},
    version: 2
  };
  saveProfile(p);
  const migrated = getProfile();
  const set = new Set(migrated.badges);
  assert.equal(migrated.badges.length, set.size);
});

// -------------------------------------------------------------------------
// getProfileStats
// -------------------------------------------------------------------------
test('getProfileStats: returns expected shape', () => {
  const ctx = makeContext();
  const { ensureProfile, getProfileStats } = loadProfile(ctx);
  ensureProfile();
  const stats = getProfileStats();
  assert.ok(typeof stats.uid === 'string');
  assert.ok(typeof stats.totalRuns === 'number');
  assert.ok(typeof stats.badgeCount === 'number');
  assert.ok(stats.referralTier && typeof stats.referralTier.name === 'string');
});

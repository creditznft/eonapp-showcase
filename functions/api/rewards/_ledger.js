import { ensureReferralSchema, readAccountActiveEonKeyUnlocks, resolveReferralDatabase } from '../../../assets/js/referrals/eon-referral-server-runtime.js';
import {
  EON_REWARD_HISTORY_LIMIT,
  EON_REWARD_LAUNCH_TTL_MS,
  EON_REWARD_PRIMARY_PROVIDER,
  EON_REWARD_RULES,
  EON_REWARD_SCHEMA,
  normalizeRewardSurface,
  publicRewardUnlocks,
  rewardUnlockById
} from '../../../config/rt98-reward-center-contract.mjs';
import { buildMyLeadOfferwallUrl, getMyLeadConfig } from './_providers.js';

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /[^a-zA-Z0-9._:@/-]/g;

function clean(value = '', max = 256) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').replace(SAFE_ID, '').slice(0, max);
}

function nowMs(value = Date.now()) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : Date.now();
}

function randomToken(byteLength = 24) {
  const bytes = new Uint8Array(Math.max(18, Math.min(64, Number(byteLength) || 24)));
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomPlayerId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function changedRows(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

function rows(result) {
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result)) return result;
  return [];
}

function databaseFromEnv(env = {}) {
  return resolveReferralDatabase(env).database;
}

async function schema(database) {
  if (!database?.prepare) throw new Error('reward_database_unavailable');
  await ensureReferralSchema(database);
}

async function queryRows(statement) {
  return rows(await statement.all());
}

async function readBalance(database, accountId) {
  const row = await database.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS balance
    FROM eon_reward_ledger
    WHERE account_id = ?
  `).bind(accountId).first();
  return Number(row?.balance || 0);
}

async function readPlayerByAccount(database, accountId) {
  return database.prepare(`
    SELECT account_id, player_id, created_at, updated_at
    FROM eon_reward_players
    WHERE account_id = ?
    LIMIT 1
  `).bind(accountId).first();
}

async function readPlayerById(database, playerId) {
  return database.prepare(`
    SELECT account_id, player_id, created_at, updated_at
    FROM eon_reward_players
    WHERE player_id = ?
    LIMIT 1
  `).bind(playerId).first();
}

async function ensurePlayer(database, accountId, timestamp) {
  const existing = await readPlayerByAccount(database, accountId);
  if (existing?.player_id) return existing;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const playerId = randomPlayerId();
    await database.prepare(`
      INSERT OR IGNORE INTO eon_reward_players (account_id, player_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(accountId, playerId, timestamp, timestamp).run();
    const row = await readPlayerByAccount(database, accountId);
    if (row?.player_id) return row;
  }
  throw new Error('reward_player_creation_failed');
}

export async function launchMyLeadMission({ env = {}, accountId = '', surface = 'rewards', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  if (!account) return freeze({ ok: false, status: 'sign_in_required' });
  const provider = getMyLeadConfig(env);
  if (!provider.configured) return freeze({ ok: false, status: 'mylead_not_configured' });
  const database = databaseFromEnv(env);
  try { await schema(database); } catch { return freeze({ ok: false, status: 'reward_database_unavailable' }); }
  const time = nowMs(timestamp);
  const normalizedSurface = normalizeRewardSurface(surface);
  const player = await ensurePlayer(database, account, time);
  const correlationId = randomToken(24);
  const expiresAt = time + EON_REWARD_LAUNCH_TTL_MS;
  await database.prepare(`
    INSERT INTO eon_reward_launches (
      correlation_id, provider, account_id, player_id, surface, created_at, expires_at
    ) VALUES (?, 'mylead', ?, ?, ?, ?, ?)
  `).bind(correlationId, account, player.player_id, normalizedSurface, time, expiresAt).run();
  const offerwallUrl = buildMyLeadOfferwallUrl(provider, { playerId: player.player_id, correlationId, surface: normalizedSurface });
  return freeze({
    ok: true,
    provider: freeze({ id: 'mylead', label: 'MyLead Sponsored Missions', hostedMode: 'new-window' }),
    offerwallUrl,
    launch: freeze({ correlationId, surface: normalizedSurface, expiresAt }),
    authority: 'server-postback-only',
    browserCompletionCreatesReward: false
  });
}

async function readLaunch(database, correlationId) {
  return database.prepare(`
    SELECT correlation_id, provider, account_id, player_id, surface, created_at, expires_at
    FROM eon_reward_launches
    WHERE correlation_id = ?
    LIMIT 1
  `).bind(correlationId).first();
}

async function readTransaction(database, provider, transactionId) {
  return database.prepare(`
    SELECT provider, transaction_id, account_id, player_id, correlation_id, source_surface,
           provider_status, state, virtual_amount, payout_decimal, created_at, updated_at, reversed_at
    FROM eon_reward_transactions
    WHERE provider = ? AND transaction_id = ?
    LIMIT 1
  `).bind(provider, transactionId).first();
}

function publicTransaction(row = null) {
  if (!row) return null;
  return freeze({
    provider: clean(row.provider, 40),
    transactionId: clean(row.transaction_id, 160),
    state: clean(row.state, 32),
    providerStatus: clean(row.provider_status, 40),
    eonkeys: Number(row.virtual_amount || 0),
    surface: normalizeRewardSurface(row.source_surface),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
    reversedAt: Number(row.reversed_at || 0) || null
  });
}

function attributionMatches(transaction, parsed, accountId) {
  return clean(transaction?.account_id, 80) === accountId
    && clean(transaction?.player_id, 160) === parsed.playerId
    && clean(transaction?.correlation_id, 160) === parsed.correlationId;
}

async function insertNewTransaction(database, parsed, accountId, sourceSurface, timestamp) {
  const initialAmount = parsed.state === 'confirmed' ? Number(parsed.virtualAmount || 0) : 0;
  const result = await database.prepare(`
    INSERT OR IGNORE INTO eon_reward_transactions (
      provider, transaction_id, account_id, player_id, correlation_id, source_surface,
      provider_status, state, virtual_amount, payout_decimal, created_at, updated_at, reversed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    parsed.provider,
    parsed.transactionId,
    accountId,
    parsed.playerId,
    parsed.correlationId,
    sourceSurface,
    parsed.providerStatus,
    parsed.state,
    initialAmount,
    parsed.payoutDecimal || '',
    timestamp,
    timestamp,
    parsed.state === 'reversed' ? timestamp : null
  ).run();
  if (changedRows(result) && parsed.state === 'confirmed') {
    await database.prepare(`
      INSERT OR IGNORE INTO eon_reward_ledger (
        entry_id, account_id, provider, transaction_id, entry_type, amount, reason_code, created_at
      ) VALUES (?, ?, ?, ?, 'credit', ?, 'mylead_approved', ?)
    `).bind(`mylead:${parsed.transactionId}:credit`, accountId, parsed.provider, parsed.transactionId, initialAmount, timestamp).run();
  }
  return changedRows(result) > 0;
}

async function transitionTransaction(database, current, parsed, timestamp) {
  const provider = parsed.provider;
  const transactionId = parsed.transactionId;
  if (current.state === parsed.state) {
    if (current.state === 'confirmed' && parsed.virtualAmount !== null && Number(current.virtual_amount || 0) !== Number(parsed.virtualAmount)) {
      return freeze({ ok: false, status: 'mylead_virtual_amount_conflict' });
    }
    return freeze({ ok: true, duplicate: true, transition: freeze({ from: current.state, to: current.state }) });
  }

  if (current.state === 'pending' && parsed.state === 'confirmed') {
    const amount = Number(parsed.virtualAmount || 0);
    if (!Number.isSafeInteger(amount) || amount <= 0) return freeze({ ok: false, status: 'mylead_virtual_amount_required_for_approved_credit' });
    const statements = [
      database.prepare(`
        UPDATE eon_reward_transactions
        SET state = 'confirmed', provider_status = ?, virtual_amount = ?, payout_decimal = ?, updated_at = ?, reversed_at = NULL
        WHERE provider = ? AND transaction_id = ? AND state = 'pending'
      `).bind(parsed.providerStatus, amount, parsed.payoutDecimal || '', timestamp, provider, transactionId),
      database.prepare(`
        INSERT OR IGNORE INTO eon_reward_ledger (
          entry_id, account_id, provider, transaction_id, entry_type, amount, reason_code, created_at
        )
        SELECT ?, account_id, provider, transaction_id, 'credit', virtual_amount, 'mylead_approved', ?
        FROM eon_reward_transactions
        WHERE provider = ? AND transaction_id = ? AND state = 'confirmed' AND virtual_amount > 0
      `).bind(`mylead:${transactionId}:credit`, timestamp, provider, transactionId)
    ];
    await database.batch(statements);
    return freeze({ ok: true, duplicate: false, transition: freeze({ from: 'pending', to: 'confirmed' }) });
  }

  if (current.state === 'pending' && parsed.state === 'reversed') {
    await database.prepare(`
      UPDATE eon_reward_transactions
      SET state = 'reversed', provider_status = ?, updated_at = ?, reversed_at = ?
      WHERE provider = ? AND transaction_id = ? AND state = 'pending'
    `).bind(parsed.providerStatus, timestamp, timestamp, provider, transactionId).run();
    return freeze({ ok: true, duplicate: false, transition: freeze({ from: 'pending', to: 'reversed' }) });
  }

  if (current.state === 'confirmed' && parsed.state === 'reversed') {
    const statements = [
      database.prepare(`
        UPDATE eon_reward_transactions
        SET state = 'reversed', provider_status = ?, updated_at = ?, reversed_at = ?
        WHERE provider = ? AND transaction_id = ? AND state = 'confirmed'
      `).bind(parsed.providerStatus, timestamp, timestamp, provider, transactionId),
      database.prepare(`
        INSERT OR IGNORE INTO eon_reward_ledger (
          entry_id, account_id, provider, transaction_id, entry_type, amount, reason_code, created_at
        )
        SELECT ?, account_id, provider, transaction_id, 'reversal', -ABS(virtual_amount), 'mylead_reversed', ?
        FROM eon_reward_transactions
        WHERE provider = ? AND transaction_id = ? AND state = 'reversed' AND virtual_amount > 0
      `).bind(`mylead:${transactionId}:reversal`, timestamp, provider, transactionId)
    ];
    await database.batch(statements);
    return freeze({ ok: true, duplicate: false, transition: freeze({ from: 'confirmed', to: 'reversed' }) });
  }

  if (current.state === 'confirmed' && parsed.state === 'pending') {
    return freeze({ ok: true, duplicate: true, transition: freeze({ from: 'confirmed', to: 'confirmed' }) });
  }
  if (current.state === 'reversed' && parsed.state === 'reversed') {
    return freeze({ ok: true, duplicate: true, transition: freeze({ from: 'reversed', to: 'reversed' }) });
  }
  return freeze({ ok: false, status: 'mylead_transaction_lifecycle_conflict' });
}

export async function applyMyLeadPostback({ env = {}, parsed, timestamp = Date.now() } = {}) {
  if (!parsed?.ok || parsed.provider !== EON_REWARD_PRIMARY_PROVIDER) return freeze({ ok: false, status: 'mylead_postback_invalid' });
  const database = databaseFromEnv(env);
  try { await schema(database); } catch { return freeze({ ok: false, status: 'reward_database_unavailable' }); }
  const time = nowMs(timestamp);
  const player = await readPlayerById(database, parsed.playerId);
  if (!player?.account_id) return freeze({ ok: false, status: 'mylead_player_not_found' });
  const accountId = clean(player.account_id, 80);
  const launch = await readLaunch(database, parsed.correlationId);
  if (!launch) return freeze({ ok: false, status: 'mylead_launch_correlation_not_found' });
  const launchExpiresAt = Number(launch.expires_at || 0);
  if (!Number.isFinite(launchExpiresAt) || launchExpiresAt <= 0 || launchExpiresAt < time) {
    return freeze({ ok: false, status: 'mylead_launch_expired' });
  }
  if (clean(launch.player_id, 160) !== parsed.playerId || clean(launch.account_id, 80) !== accountId) {
    return freeze({ ok: false, status: 'mylead_player_id_tracking_token_mismatch' });
  }
  const sourceSurface = normalizeRewardSurface(launch.surface || parsed.surface);
  if (parsed.surface !== 'other' && parsed.surface !== sourceSurface) return freeze({ ok: false, status: 'mylead_source_surface_mismatch' });

  let current = await readTransaction(database, parsed.provider, parsed.transactionId);
  if (!current) {
    await insertNewTransaction(database, parsed, accountId, sourceSurface, time);
    current = await readTransaction(database, parsed.provider, parsed.transactionId);
    if (!current) return freeze({ ok: false, status: 'reward_transaction_write_failed' });
    if (!attributionMatches(current, parsed, accountId)) return freeze({ ok: false, status: 'mylead_transaction_attribution_conflict' });
    // If a concurrent pending postback won the INSERT race while this request is approved,
    // complete the safe pending -> confirmed transition now.
    if (current.state !== parsed.state) {
      const transitioned = await transitionTransaction(database, current, parsed, time);
      if (!transitioned.ok) return transitioned;
      current = await readTransaction(database, parsed.provider, parsed.transactionId);
      const balance = await readBalance(database, accountId);
      return freeze({ ok: true, duplicate: transitioned.duplicate === true, transition: transitioned.transition, transaction: publicTransaction(current), balance });
    }
    const balance = await readBalance(database, accountId);
    return freeze({ ok: true, duplicate: false, transition: freeze({ from: null, to: current.state }), transaction: publicTransaction(current), balance });
  }

  if (!attributionMatches(current, parsed, accountId)) return freeze({ ok: false, status: 'mylead_transaction_attribution_conflict' });
  const transitioned = await transitionTransaction(database, current, parsed, time);
  if (!transitioned.ok) return transitioned;
  current = await readTransaction(database, parsed.provider, parsed.transactionId);
  const balance = await readBalance(database, accountId);
  return freeze({ ok: true, duplicate: transitioned.duplicate === true, transition: transitioned.transition, transaction: publicTransaction(current), balance });
}

export async function redeemRewardUnlock({ env = {}, accountId = '', unlockId = '', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  const unlock = rewardUnlockById(unlockId);
  if (!account) return freeze({ ok: false, status: 'sign_in_required' });
  if (!unlock) return freeze({ ok: false, status: 'reward_unlock_not_found' });
  const database = databaseFromEnv(env);
  try { await schema(database); } catch { return freeze({ ok: false, status: 'reward_database_unavailable' }); }
  const time = nowMs(timestamp);
  const active = await database.prepare(`
    SELECT unlock_record_id, expires_at
    FROM eon_key_unlocks
    WHERE account_id = ? AND unlock_catalog_id = ? AND status = 'active'
      AND (expires_at IS NULL OR expires_at = 0 OR expires_at > ?)
      AND (revoked_at IS NULL OR revoked_at = 0)
    ORDER BY issued_at DESC LIMIT 1
  `).bind(account, unlock.id, time).first();
  if (active) return freeze({ ok: true, status: 'unlock_already_active', duplicate: true, unlock: freeze({ id: unlock.id, expiresAt: Number(active.expires_at || 0) || null }) });

  const redemptionId = `reward_redemption_${randomToken(24)}`;
  const unlockRecordId = `reward_unlock_${randomToken(24)}`;
  const sourceId = `mission:${redemptionId}`;
  const expiresAt = time + unlock.durationMinutes * 60 * 1000;
  const cost = Number(unlock.eonkeys);
  const statements = [
    database.prepare(`
      INSERT OR IGNORE INTO eon_reward_redemptions (
        redemption_id, account_id, unlock_catalog_id, eonkeys_cost, status, created_at, expires_at
      )
      SELECT ?, ?, ?, ?, 'active', ?, ?
      WHERE (SELECT COALESCE(SUM(amount), 0) FROM eon_reward_ledger WHERE account_id = ?) >= ?
    `).bind(redemptionId, account, unlock.id, cost, time, expiresAt, account, cost),
    database.prepare(`
      INSERT OR IGNORE INTO eon_reward_ledger (
        entry_id, account_id, provider, transaction_id, entry_type, amount, reason_code, created_at
      )
      SELECT ?, account_id, 'eonapp', redemption_id, 'redemption', -eonkeys_cost, ?, created_at
      FROM eon_reward_redemptions WHERE redemption_id = ? AND status = 'active'
    `).bind(`redeem:${redemptionId}`, `unlock:${unlock.id}`, redemptionId),
    database.prepare(`
      INSERT OR IGNORE INTO eon_key_unlocks (
        unlock_record_id, account_id, unlock_catalog_id, feature_group, source_grant_id,
        status, issued_at, expires_at, revoked_at, updated_at
      )
      SELECT ?, account_id, ?, ?, ?, 'active', created_at, expires_at, NULL, created_at
      FROM eon_reward_redemptions WHERE redemption_id = ? AND status = 'active'
    `).bind(unlockRecordId, unlock.id, unlock.featureGroup, sourceId, redemptionId)
  ];
  await database.batch(statements);
  const redemption = await database.prepare(`SELECT redemption_id, status, expires_at FROM eon_reward_redemptions WHERE redemption_id = ? LIMIT 1`).bind(redemptionId).first();
  const balance = await readBalance(database, account);
  if (!redemption) return freeze({ ok: false, status: balance < 0 ? 'reward_debt_outstanding' : 'insufficient_eonkeys', balance });
  return freeze({
    ok: true,
    status: 'unlock_active',
    balance,
    unlock: freeze({ id: unlock.id, label: unlock.label, featureGroup: unlock.featureGroup, eonkeysCost: cost, expiresAt, route: unlock.route })
  });
}

export async function readRewardCenterStatus({ env = {}, accountId = '', timestamp = Date.now() } = {}) {
  const account = clean(accountId, 80);
  if (!account) return freeze({ ok: true, signedIn: false, schema: EON_REWARD_SCHEMA, rules: EON_REWARD_RULES, unlocks: publicRewardUnlocks() });
  const database = databaseFromEnv(env);
  try { await schema(database); } catch { return freeze({ ok: false, signedIn: true, status: 'reward_database_unavailable', schema: EON_REWARD_SCHEMA, balance: 0, history: freeze([]), activeUnlocks: freeze([]), unlocks: publicRewardUnlocks() }); }
  const time = nowMs(timestamp);
  const [balance, history, activeUnlocks] = await Promise.all([
    readBalance(database, account),
    queryRows(database.prepare(`
      SELECT entry_id, provider, transaction_id, entry_type, amount, reason_code, created_at
      FROM eon_reward_ledger
      WHERE account_id = ?
      ORDER BY created_at DESC, entry_id DESC
      LIMIT ?
    `).bind(account, EON_REWARD_HISTORY_LIMIT)),
    readAccountActiveEonKeyUnlocks({ database, accountId: account, timestamp: time })
  ]);
  return freeze({
    ok: true,
    signedIn: true,
    schema: EON_REWARD_SCHEMA,
    balance,
    debt: Math.max(0, -balance),
    rules: EON_REWARD_RULES,
    unlocks: publicRewardUnlocks(),
    activeUnlocks,
    history: freeze(history.map((row) => freeze({
      id: clean(row.entry_id, 180),
      provider: clean(row.provider, 40),
      transactionId: clean(row.transaction_id, 160),
      type: clean(row.entry_type, 40),
      amount: Number(row.amount || 0),
      reason: clean(row.reason_code, 120),
      createdAt: Number(row.created_at || 0)
    })))
  });
}

export default freeze({ launchMyLeadMission, applyMyLeadPostback, redeemRewardUnlock, readRewardCenterStatus });

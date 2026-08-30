-- W623H legacy single-database migration retained for compatibility. W623I production uses migrations/referrals/0001_referral_authority.sql on EONAPP_REFERRALS_DB.
CREATE TABLE IF NOT EXISTS eon_referral_bind_challenges (
  challenge_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  referral_id TEXT NOT NULL,
  challenge_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_referral_identities (
  referral_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  public_key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  bound_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_invite_accounts (
  invitee_account_id TEXT PRIMARY KEY,
  inviter_account_id TEXT NOT NULL,
  inviter_referral_id TEXT NOT NULL,
  source_share_id TEXT NOT NULL,
  source_token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled',
  program_version INTEGER NOT NULL,
  enrolled_at INTEGER NOT NULL,
  activated_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_invite_events (
  event_id TEXT PRIMARY KEY,
  inviter_account_id TEXT NOT NULL,
  invitee_account_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_event_id TEXT,
  status TEXT NOT NULL,
  available_at INTEGER,
  reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_key_grants (
  grant_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  key_type TEXT NOT NULL,
  grant_reason TEXT,
  source_referral_event_id TEXT,
  status TEXT NOT NULL,
  issued_at INTEGER,
  expires_at INTEGER,
  revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS eon_key_unlocks (
  unlock_record_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  unlock_catalog_id TEXT NOT NULL,
  feature_group TEXT NOT NULL,
  source_grant_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_digital_rewards (
  reward_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  reward_code TEXT NOT NULL,
  source_event_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  revoked_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_referral_challenge_account ON eon_referral_bind_challenges(account_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_eon_referral_identity_account ON eon_referral_identities(account_id);
CREATE INDEX IF NOT EXISTS idx_eon_invite_inviter ON eon_invite_accounts(inviter_account_id);
CREATE INDEX IF NOT EXISTS idx_eon_invite_event_inviter ON eon_invite_events(inviter_account_id, status, available_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eon_invite_event_once ON eon_invite_events(invitee_account_id, event_type);
CREATE INDEX IF NOT EXISTS idx_eon_key_grants_account ON eon_key_grants(account_id, status, key_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eon_key_grant_source ON eon_key_grants(account_id, source_referral_event_id, key_type);
CREATE INDEX IF NOT EXISTS idx_eon_key_unlock_account ON eon_key_unlocks(account_id, status, feature_group);
CREATE INDEX IF NOT EXISTS idx_eon_digital_reward_account ON eon_digital_rewards(account_id, status, reward_code);

-- W629 compatibility additions. Production authority remains migrations/referrals/0001_referral_authority.sql.
CREATE TABLE IF NOT EXISTS eon_referral_milestone_receipts (
  receipt_id TEXT PRIMARY KEY,
  invitee_account_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  source_event_id TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  issued_at INTEGER NOT NULL,
  consumed_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_key_grant_journal (
  journal_id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  source_event_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_referral_support_audit (
  audit_id TEXT PRIMARY KEY,
  account_id TEXT,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason_code TEXT,
  created_at INTEGER NOT NULL
);

-- RT98 MyLead Sponsored Missions / numeric EONKEY authority.
-- Browser actions never mint EONKEYS. Provider transaction identity and launch
-- correlation are recorded server-side; approved MyLead postbacks create the
-- only positive mission-credit ledger entries. Reversals append a negative
-- ledger entry and may therefore create a negative reward balance after spend.

CREATE TABLE IF NOT EXISTS eon_reward_players (
  account_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eon_reward_launches (
  correlation_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  surface TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_reward_launch_player
  ON eon_reward_launches(player_id, created_at);
CREATE INDEX IF NOT EXISTS idx_eon_reward_launch_account
  ON eon_reward_launches(account_id, created_at);

CREATE TABLE IF NOT EXISTS eon_reward_transactions (
  provider TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  source_surface TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  state TEXT NOT NULL,
  virtual_amount INTEGER NOT NULL DEFAULT 0,
  payout_decimal TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  reversed_at INTEGER,
  PRIMARY KEY (provider, transaction_id)
);
CREATE INDEX IF NOT EXISTS idx_eon_reward_transaction_account
  ON eon_reward_transactions(account_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_eon_reward_transaction_player
  ON eon_reward_transactions(player_id, updated_at);

CREATE TABLE IF NOT EXISTS eon_reward_ledger (
  entry_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason_code TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_reward_ledger_account
  ON eon_reward_ledger(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_eon_reward_ledger_transaction
  ON eon_reward_ledger(provider, transaction_id, created_at);

CREATE TABLE IF NOT EXISTS eon_reward_redemptions (
  redemption_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  unlock_catalog_id TEXT NOT NULL,
  eonkeys_cost INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_reward_redemption_account
  ON eon_reward_redemptions(account_id, created_at);

INSERT INTO eon_schema_authority (domain, schema_version, migration_name, applied_at)
VALUES ('referrals', 6, '0006_mylead_reward_center.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version = excluded.schema_version,
  migration_name = excluded.migration_name,
  applied_at = excluded.applied_at;

-- RT92 rewarded sponsor runtime completion authority.
-- Adds one-time VAST event sequencing and multi-key redemption provenance.

CREATE TABLE IF NOT EXISTS eon_sponsor_reward_events (
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  proof_hash TEXT NOT NULL,
  PRIMARY KEY (session_id, event_type),
  FOREIGN KEY (session_id) REFERENCES eon_sponsor_reward_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_sponsor_reward_event_received
  ON eon_sponsor_reward_events(received_at, event_type);

CREATE TABLE IF NOT EXISTS eon_key_unlock_sources (
  unlock_record_id TEXT NOT NULL,
  grant_id TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,
  key_type TEXT NOT NULL,
  consumed_at INTEGER NOT NULL,
  PRIMARY KEY (unlock_record_id, grant_id),
  FOREIGN KEY (unlock_record_id) REFERENCES eon_key_unlocks(unlock_record_id),
  FOREIGN KEY (grant_id) REFERENCES eon_key_grants(grant_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_key_unlock_sources_account
  ON eon_key_unlock_sources(account_id, key_type, consumed_at);

INSERT INTO eon_schema_authority (domain, schema_version, migration_name, applied_at)
VALUES ('referrals', 5, '0005_rewarded_sponsor_runtime.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version = excluded.schema_version,
  migration_name = excluded.migration_name,
  applied_at = excluded.applied_at;

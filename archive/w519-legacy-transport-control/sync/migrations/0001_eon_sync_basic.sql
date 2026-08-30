-- W412 EON Sync Basic D1 schema.
-- Apply ONLY to a new dedicated EON_SYNC_DB. Do not reuse identity, referral,
-- payment, legacy marketplace or Vault databases. This schema intentionally has
-- no Vault/API-key/recovery/media/model/cache/payment/reward tables.

CREATE TABLE IF NOT EXISTS eon_sync_devices (
  account_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER,
  PRIMARY KEY (account_id, device_id)
);

CREATE TABLE IF NOT EXISTS eon_sync_records (
  account_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('preferences', 'chat-metadata', 'chat-text', 'project-metadata', 'project-text', 'share-remix-metadata')),
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 99),
  origin_device_id TEXT NOT NULL,
  deleted_at INTEGER,
  content_hash TEXT NOT NULL,
  content_json TEXT,
  PRIMARY KEY (account_id, record_id),
  CHECK ((deleted_at IS NOT NULL AND content_json IS NULL) OR (deleted_at IS NULL AND content_json IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_eon_sync_records_account_updated ON eon_sync_records(account_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_eon_sync_devices_account_seen ON eon_sync_devices(account_id, last_seen_at);

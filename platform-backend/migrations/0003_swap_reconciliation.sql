CREATE TABLE IF NOT EXISTS swap_offer_reconciliations (
  offer_id TEXT PRIMARY KEY,
  offer_code_hash TEXT NOT NULL,
  offer_payload_json TEXT NOT NULL,
  owner_uid TEXT NOT NULL,
  owner_wallet TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TEXT NOT NULL,
  accepted_uid TEXT NOT NULL DEFAULT '',
  accepted_wallet TEXT NOT NULL DEFAULT '',
  accepted_item_fingerprint TEXT NOT NULL DEFAULT '',
  receipt_code_hash TEXT NOT NULL DEFAULT '',
  receipt_payload_json TEXT NOT NULL DEFAULT '',
  redeemed_uid TEXT NOT NULL DEFAULT '',
  redeemed_wallet TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT,
  redeemed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swap_offer_status
  ON swap_offer_reconciliations(status, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_swap_offer_owner
  ON swap_offer_reconciliations(owner_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS epoch_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence INTEGER NOT NULL,
  domain TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  metrics_hash TEXT NOT NULL DEFAULT '',
  emission_amount TEXT NOT NULL,
  total_points TEXT NOT NULL,
  claim_window_start TEXT NOT NULL,
  claim_window_end TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_epoch_snapshots_unique
  ON epoch_snapshots(sequence, domain);

CREATE TABLE IF NOT EXISTS claim_previews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  domain TEXT NOT NULL,
  wallet_address TEXT DEFAULT '',
  points TEXT NOT NULL,
  claim_amount TEXT NOT NULL,
  proof_root TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_previews_uid
  ON claim_previews(uid, sequence DESC);

CREATE TABLE IF NOT EXISTS user_entitlements (
  uid TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_asset TEXT NOT NULL,
  stable_price_cents INTEGER NOT NULL DEFAULT 0,
  eonl_amount TEXT NOT NULL DEFAULT '0',
  renews_at TEXT,
  features_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence INTEGER NOT NULL,
  uid TEXT NOT NULL,
  referrer_uid TEXT NOT NULL,
  referral_points TEXT NOT NULL DEFAULT '0',
  campaign_points TEXT NOT NULL DEFAULT '0',
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_snapshots_uid
  ON referral_snapshots(uid, sequence DESC);

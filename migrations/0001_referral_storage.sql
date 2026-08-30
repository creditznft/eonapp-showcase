CREATE TABLE IF NOT EXISTS referral_events (
  id TEXT PRIMARY KEY,
  user_id_hash TEXT NOT NULL,
  referrer_id_hash TEXT NOT NULL,
  short_code TEXT,
  signed_envelope_hash TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE TABLE IF NOT EXISTS referral_accounts (
  user_id_hash TEXT PRIMARY KEY,
  referrer_id_hash TEXT NOT NULL,
  first_event_id TEXT,
  first_linked_at INTEGER NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS referral_epochs (
  epoch_id TEXT PRIMARY KEY,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  merkle_root TEXT,
  evidence_hash TEXT,
  filebase_key TEXT,
  filebase_cid TEXT,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'building',
  created_at INTEGER NOT NULL,
  published_at INTEGER
);

CREATE TABLE IF NOT EXISTS referral_epoch_records (
  epoch_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  leaf_hash TEXT NOT NULL,
  proof_json TEXT,
  PRIMARY KEY(epoch_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_events_user ON referral_events(user_id_hash);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id_hash);
CREATE INDEX IF NOT EXISTS idx_referral_events_short_code ON referral_events(short_code);
CREATE INDEX IF NOT EXISTS idx_referral_events_created ON referral_events(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_accounts_referrer ON referral_accounts(referrer_id_hash);
CREATE INDEX IF NOT EXISTS idx_referral_epochs_status ON referral_epochs(status);
CREATE INDEX IF NOT EXISTS idx_referral_epochs_created ON referral_epochs(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_epoch_records_leaf ON referral_epoch_records(leaf_hash);

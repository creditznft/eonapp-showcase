-- RT92 premium hosted-work capacity envelopes + leases.
-- DO NOT APPLY until the dedicated EON_WORK_DB pilot is approved.
-- No browser route may INSERT/UPDATE capacity envelopes. They are future
-- server/billing authority only. Ultimate/perpetual software grants are NOT a
-- valid source_authority for hosted capacity.

CREATE TABLE IF NOT EXISTS eon_work_capacity (
  account_ref TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  source_authority TEXT NOT NULL CHECK (source_authority IN ('subscription', 'metered', 'testing')),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'revoked', 'expired')),
  unit_limit INTEGER NOT NULL CHECK (unit_limit >= 0),
  units_used INTEGER NOT NULL DEFAULT 0 CHECK (units_used >= 0),
  concurrency_limit INTEGER NOT NULL CHECK (concurrency_limit >= 0),
  active_leases INTEGER NOT NULL DEFAULT 0 CHECK (active_leases >= 0),
  starts_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  reservation_nonce TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (account_ref, capability_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_eon_work_capacity_active
  ON eon_work_capacity(account_ref, capability_id, status, expires_at);

CREATE TABLE IF NOT EXISTS eon_work_capacity_leases (
  lease_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  account_ref TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  units_reserved INTEGER NOT NULL CHECK (units_reserved >= 1),
  status TEXT NOT NULL CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  released_at INTEGER,
  FOREIGN KEY (proposal_id) REFERENCES eon_durable_work_proposals(proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_work_capacity_leases_account
  ON eon_work_capacity_leases(account_ref, capability_id, status, expires_at);

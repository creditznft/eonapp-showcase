-- W406/W407 durable Action Gateway schema.
-- DO NOT APPLY until an action-specific privacy policy, token-custody design, action approval UI,
-- cancellation/reversal policy and human release proof are approved.
-- Apply only to a dedicated EON_ACTIONS_DB. Never apply to EON_IDENTITY_DB, EON_RELAY_DB or legacy databases.
-- No token, content body, media, source file, platform credential or browser secret belongs in these tables.

CREATE TABLE IF NOT EXISTS eon_action_proposals (
  proposal_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'approved', 'cancelled', 'expired', 'executed', 'failed')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  approved_at INTEGER,
  cancelled_at INTEGER
);

CREATE TABLE IF NOT EXISTS eon_action_receipts (
  receipt_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  account_ref TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('executed', 'failed', 'cancelled', 'reversed')),
  provider_receipt_ref TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES eon_action_proposals(proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_action_proposals_account ON eon_action_proposals(account_ref, status);
CREATE INDEX IF NOT EXISTS idx_eon_action_proposals_expiry ON eon_action_proposals(expires_at);

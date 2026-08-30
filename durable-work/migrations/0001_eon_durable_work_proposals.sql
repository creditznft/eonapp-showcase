-- RT92 premium durable-work proposal ledger.
-- DO NOT APPLY until EON_WORK_DB is created as a dedicated D1 database and the
-- testing-only rollout receives explicit deployment approval.
-- This schema stores NO prompts, outputs, credentials, provider tokens, files,
-- client bodies, model transcripts or payment data.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS eon_durable_work_proposals (
  proposal_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  project_ref TEXT,
  capability_id TEXT NOT NULL,
  task_class TEXT NOT NULL,
  workload_class TEXT NOT NULL CHECK (workload_class IN ('platform-hosted', 'local', 'byok')),
  requested_units INTEGER NOT NULL CHECK (requested_units >= 1 AND requested_units <= 1000000),
  input_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'cancelled', 'expired')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  UNIQUE(account_ref, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_eon_durable_work_account_status
  ON eon_durable_work_proposals(account_ref, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eon_durable_work_expiry
  ON eon_durable_work_proposals(status, expires_at);

CREATE TABLE IF NOT EXISTS eon_durable_work_audit (
  audit_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  account_ref TEXT NOT NULL,
  event_code TEXT NOT NULL CHECK (event_code IN ('prepared', 'cancelled', 'expired')),
  event_digest TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES eon_durable_work_proposals(proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_durable_work_audit_account
  ON eon_durable_work_audit(account_ref, created_at DESC);

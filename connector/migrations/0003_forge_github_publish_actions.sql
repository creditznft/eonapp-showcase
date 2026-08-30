-- RT89 Forge -> GitHub reviewed publish action ledger.
-- Apply only to the dedicated EON_ACTIONS_DB. No provider credentials or raw
-- source files are stored here: only bounded metadata, hashes and receipts.

CREATE TABLE IF NOT EXISTS eon_forge_github_publish_actions (
  action_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  project_title TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  file_count INTEGER NOT NULL,
  total_bytes INTEGER NOT NULL,
  target_mode TEXT NOT NULL CHECK (target_mode IN ('existing', 'new')),
  target_owner TEXT NOT NULL DEFAULT '',
  target_repo TEXT NOT NULL,
  target_private INTEGER NOT NULL DEFAULT 0,
  repo_created INTEGER NOT NULL DEFAULT 0,
  default_branch TEXT NOT NULL DEFAULT '',
  branch_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prepared','staging','staged','publishing','deploying','published','cancelled','failed')),
  stage_nonce_hash TEXT NOT NULL,
  publish_nonce_hash TEXT NOT NULL DEFAULT '',
  before_sha TEXT NOT NULL DEFAULT '',
  staged_sha TEXT NOT NULL DEFAULT '',
  tree_sha TEXT NOT NULL DEFAULT '',
  pull_number INTEGER,
  pr_url TEXT NOT NULL DEFAULT '',
  review_ci_run_id INTEGER,
  review_ci_url TEXT NOT NULL DEFAULT '',
  merged_sha TEXT NOT NULL DEFAULT '',
  deploy_run_id INTEGER,
  deploy_run_url TEXT NOT NULL DEFAULT '',
  pages_url TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  staged_at INTEGER,
  merged_at INTEGER,
  published_at INTEGER,
  cancelled_at INTEGER,
  UNIQUE(account_ref, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_eon_forge_github_publish_account
ON eon_forge_github_publish_actions(account_ref, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_eon_forge_github_publish_status
ON eon_forge_github_publish_actions(status, expires_at);

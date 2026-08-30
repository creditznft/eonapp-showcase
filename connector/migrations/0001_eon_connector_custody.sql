-- W388B connector custody schema placeholder.
-- DO NOT APPLY until each platform's official OAuth/API requirements, review, token encryption,
-- per-post approval and revoke proof are complete.
-- Apply only to a dedicated EON_CONNECTORS_DB. Never apply to identity, relay, action or legacy databases.
-- This file does not authorize token storage today.

CREATE TABLE IF NOT EXISTS eon_connector_accounts (
  connection_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'connected', 'revoked', 'failed')),
  credential_ref TEXT,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE IF NOT EXISTS eon_connector_post_intents (
  intent_id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  action_proposal_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'cancelled', 'submitted', 'failed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (connection_id) REFERENCES eon_connector_accounts(connection_id)
);

CREATE INDEX IF NOT EXISTS idx_eon_connector_accounts_account ON eon_connector_accounts(account_ref, connector_id);

-- RT89 GitHub Forge connector custody.
-- Apply only to the dedicated EON_CONNECTORS_DB after GitHub App credentials,
-- encryption key, same-origin auth and disconnect proof are configured.
-- Raw OAuth tokens MUST NOT appear in any other table, log, receipt or client response.

CREATE TABLE IF NOT EXISTS eon_github_forge_connections (
  connection_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL UNIQUE,
  provider_account_id TEXT NOT NULL,
  provider_login TEXT NOT NULL,
  credential_envelope TEXT NOT NULL,
  token_expires_at INTEGER,
  refresh_expires_at INTEGER,
  status TEXT NOT NULL CHECK (status IN ('connected', 'revoked', 'failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_eon_github_forge_connection_account
ON eon_github_forge_connections(account_ref, status);

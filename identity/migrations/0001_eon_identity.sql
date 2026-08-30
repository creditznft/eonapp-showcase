-- EONAPP W373 identity-only D1 schema.
-- Apply ONLY to the dedicated eonapp-identity database. Do not apply to legacy/referral databases.
-- This schema intentionally stores no raw email, Google subject, Google access token, refresh token,
-- Chat, prompt, Vault, project, file, Realm, City, provider-key or payment-card data.

CREATE TABLE IF NOT EXISTS eon_identity_accounts (
  account_id TEXT PRIMARY KEY,
  identity_ref_hmac TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL CHECK (email_verified IN (0, 1)),
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL,
  consent_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eon_identity_sessions (
  session_id_hmac TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eon_identity_sessions_account_id ON eon_identity_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_eon_identity_sessions_expires_at ON eon_identity_sessions(expires_at);

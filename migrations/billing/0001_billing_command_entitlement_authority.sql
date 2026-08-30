-- A15 I21 canonical billing D1 schema. Apply only to eonapp-billing.
CREATE TABLE IF NOT EXISTS eon_schema_authority (
  domain TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  migration_name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_billing_events (provider_event_id TEXT PRIMARY KEY, provider TEXT NOT NULL, raw_event_type TEXT NOT NULL, event_type TEXT NOT NULL, provider_customer_ref TEXT, provider_subscription_ref TEXT, account_id TEXT, tier_id TEXT, occurred_at INTEGER, processed_at INTEGER NOT NULL, payload_hash TEXT NOT NULL, processing_status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS eon_entitlements (account_id TEXT PRIMARY KEY, tier_id TEXT NOT NULL, status TEXT NOT NULL, source_provider TEXT, source_event_id TEXT, provider_customer_ref TEXT, provider_subscription_ref TEXT, issued_at INTEGER, renews_at INTEGER, revoked_at INTEGER, reason TEXT, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS eon_billing_checkout_sessions (attempt_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, tier_id TEXT NOT NULL, product_id TEXT NOT NULL, provider_session_ref TEXT, provider_payment_ref TEXT, status TEXT NOT NULL, error_code TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_eon_checkout_account_created ON eon_billing_checkout_sessions(account_id, created_at DESC);
CREATE TABLE IF NOT EXISTS eon_billing_lifecycle (account_id TEXT PRIMARY KEY, tier_id TEXT NOT NULL, access_status TEXT NOT NULL, provider_status TEXT, provider_customer_ref TEXT, provider_subscription_ref TEXT, payment_ref TEXT, checkout_attempt_id TEXT, cancel_at_period_end INTEGER NOT NULL DEFAULT 0, current_period_end INTEGER, trial_ends_at INTEGER, grace_ends_at INTEGER, last_invoice_url TEXT, last_receipt_url TEXT, source_event_id TEXT NOT NULL, source_event_type TEXT NOT NULL, source_occurred_at INTEGER NOT NULL, reason TEXT, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS eon_billing_action_audit (action_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, action_type TEXT NOT NULL, requested_tier_id TEXT, provider_subscription_ref TEXT, result_status TEXT NOT NULL, provider_http_status INTEGER, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_eon_action_account_created ON eon_billing_action_audit(account_id, created_at DESC);
CREATE TABLE IF NOT EXISTS eon_billing_commands (command_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, operation TEXT NOT NULL, requested_tier_id TEXT, state_precondition TEXT NOT NULL, status TEXT NOT NULL, provider_object_ref TEXT, provider_redirect_url TEXT, provider_http_status INTEGER, trial_days INTEGER NOT NULL DEFAULT 0, result_status TEXT, error_code TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(account_id, idempotency_key));
CREATE INDEX IF NOT EXISTS idx_eon_billing_commands_account_status ON eon_billing_commands(account_id, status, updated_at DESC);
-- Compatibility-only tables remain billing scoped until the dedicated referral migration is proven live.
CREATE TABLE IF NOT EXISTS eon_referral_ledger (referral_event_id TEXT PRIMARY KEY, inviter_account_id TEXT, invitee_account_id TEXT, trigger_event_id TEXT, reward_type TEXT, reward_status TEXT, retention_check_at INTEGER, processed_at INTEGER, abuse_cap_year INTEGER);
CREATE TABLE IF NOT EXISTS eon_key_grants (grant_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, key_type TEXT NOT NULL, grant_reason TEXT, source_referral_event_id TEXT, status TEXT NOT NULL, issued_at INTEGER, expires_at INTEGER, revoked_at INTEGER);
INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('billing', 1, '0001_billing_command_entitlement_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET schema_version=excluded.schema_version, migration_name=excluded.migration_name, applied_at=excluded.applied_at;

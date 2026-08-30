-- RT92 Sponsored Gemini economics authority.
-- Aggregate only: no account id, IP/network address, conversation id, prompt,
-- response text, advertiser identity, or user-level behavior is stored here.
CREATE TABLE IF NOT EXISTS eon_vexrail_economic_daily (
  day_started_at INTEGER NOT NULL,
  country TEXT NOT NULL CHECK(length(country) = 2),
  access_class TEXT NOT NULL CHECK(access_class IN ('signed_in_free','paid_opt_in')),
  admitted_requests INTEGER NOT NULL DEFAULT 0,
  upstream_accepted INTEGER NOT NULL DEFAULT 0,
  estimated_token_units INTEGER NOT NULL DEFAULT 0,
  provider_prompt_tokens INTEGER NOT NULL DEFAULT 0,
  provider_completion_tokens INTEGER NOT NULL DEFAULT 0,
  provider_total_tokens INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(day_started_at, country, access_class)
);
CREATE INDEX IF NOT EXISTS idx_eon_vexrail_economic_daily_updated
  ON eon_vexrail_economic_daily(updated_at DESC);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('trust', 2, '0002_vexrail_economic_aggregate.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

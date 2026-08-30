-- A15 I20: trust/support cases and public incident status. Applied only by ordered migration tooling.
CREATE TABLE IF NOT EXISTS eon_trust_cases (
  case_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  account_id TEXT,
  category_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  route_path TEXT NOT NULL,
  evidence_json TEXT,
  status TEXT NOT NULL CHECK(status IN ('submitted','triaged','awaiting_user','in_review','resolved','closed')),
  priority TEXT NOT NULL CHECK(priority IN ('normal','high','urgent')),
  owner_role TEXT NOT NULL,
  public_response TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  resolved_at INTEGER,
  anonymized_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_eon_trust_cases_status_updated ON eon_trust_cases(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_eon_trust_cases_account_updated ON eon_trust_cases(account_id, updated_at DESC);

-- A short-lived, salted request bucket. It never stores an address, account ID,
-- browser fingerprint, request body, or behaviour profile.
CREATE TABLE IF NOT EXISTS eon_trust_submission_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  submission_count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_trust_submission_limits_updated ON eon_trust_submission_limits(updated_at);

CREATE TABLE IF NOT EXISTS eon_service_components (
  component_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('operational','degraded','major_outage','maintenance')),
  public_note TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eon_incidents (
  incident_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  public_summary TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('minor','major','critical')),
  status TEXT NOT NULL CHECK(status IN ('investigating','identified','monitoring','resolved')),
  affected_component TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_eon_incidents_status_started ON eon_incidents(status, started_at DESC);

-- The public status endpoint is deliberately fail-closed while no component
-- registry exists. These initial, non-sensitive records make that registry
-- explicit on first migration without overwriting later operator updates.
INSERT INTO eon_service_components(component_id, label, status, public_note, updated_at)
VALUES
  ('core-app', 'EONAPP', 'operational', 'No current public incident is recorded.', unixepoch() * 1000),
  ('eoncity', 'EON City', 'operational', 'No current public incident is recorded.', unixepoch() * 1000),
  ('trust-support', 'Trust and support', 'operational', 'No current public incident is recorded.', unixepoch() * 1000)
ON CONFLICT(component_id) DO NOTHING;

-- A15 I21 exact schema version receipt.
CREATE TABLE IF NOT EXISTS eon_schema_authority (
  domain TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  migration_name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('trust', 1, '0001_trust_support_incident_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET schema_version=excluded.schema_version, migration_name=excluded.migration_name, applied_at=excluded.applied_at;

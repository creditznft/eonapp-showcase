-- A15 I21 identity schema version receipt. Apply after 0001_eon_identity.sql.
CREATE TABLE IF NOT EXISTS eon_schema_authority (
  domain TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  migration_name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('identity', 2, '0002_identity_schema_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET schema_version=excluded.schema_version, migration_name=excluded.migration_name, applied_at=excluded.applied_at;

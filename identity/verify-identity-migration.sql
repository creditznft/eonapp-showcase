-- W395 read-only verification query. Do not modify data or capture rows.
-- Run only after applying identity/migrations/0001_eon_identity.sql to the dedicated identity D1 database.
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('eon_identity_accounts', 'eon_identity_sessions')
ORDER BY name ASC;

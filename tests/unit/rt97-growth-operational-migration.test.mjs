import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

test('RT97 trust migration expands growth CHECK for operational and guide discovery events without content fields', () => {
  const db = new DatabaseSync(':memory:');
  // RT97/0004 is an ordered migration: execute the real RT92 trust authority first
  // so its ALTER TABLE dependency is represented rather than mocked away.
  const prior = readFileSync(new URL('../../migrations/trust/0003_growth_profitability_authority.sql', import.meta.url), 'utf8');
  db.exec(`CREATE TABLE eon_schema_authority(domain TEXT PRIMARY KEY, schema_version INTEGER NOT NULL, migration_name TEXT NOT NULL, applied_at INTEGER NOT NULL);`);
  db.exec(prior);
  db.prepare(`INSERT INTO eon_growth_event_daily(day_started_at,event_name,updated_at) VALUES(?,?,?)`).run(1,'landing_view',1);
  const migration = readFileSync(new URL('../../migrations/trust/0004_growth_operational_events.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(migration, /(prompt_text|response_text|search_query|account_id|ip_address|cookie_value|provider_key)/i);
  db.exec(migration);
  for (const event of ['vexrail_response_success','ad_provider_error','guide_tool_used','sponsored_discovery_result_present']) {
    db.prepare(`INSERT INTO eon_growth_event_daily(day_started_at,event_name,updated_at) VALUES(?,?,?)`).run(Date.now(), event, Date.now());
  }
  assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM eon_growth_event_daily`).get().n, 5);
  assert.equal(db.prepare(`SELECT schema_version FROM eon_schema_authority WHERE domain='trust'`).get().schema_version, 4);
});

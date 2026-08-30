-- RT97 growth event contract expansion.
-- Fixes the RT92 table-level CHECK so server-authoritative Vexrail/ad outcomes and
-- the new privacy-minimal guide/Sponsored Discovery events can actually persist.
-- No prompt text, search query, URL, account id, IP, cookie or provider key is stored.

-- AdSense revenue is never inferred from client ad rendering. It enters the
-- profitability ledger only through the operator-only provider reconciliation
-- route with an evidence reference and idempotent receipt hash.
ALTER TABLE eon_profitability_daily
  ADD COLUMN adsense_revenue_micros INTEGER NOT NULL DEFAULT 0
  CHECK(adsense_revenue_micros >= 0);
CREATE TABLE IF NOT EXISTS eon_growth_event_daily_rt97 (
  day_started_at INTEGER NOT NULL,
  event_name TEXT NOT NULL CHECK(event_name IN (
    'landing_view','engaged_5s','first_prompt','signup','second_session','7_day_return',
    'trial_start','paid_subscription','qualified_free_user',
    'vexrail_eligible','vexrail_request_started','vexrail_response_success',
    'vexrail_no_sponsored_result','vexrail_sponsored_result_present','vexrail_provider_error',
    'vexrail_client_render_success','vexrail_client_render_failure',
    'ad_slot_configured','ad_script_load_attempted','ad_script_loaded','ad_slot_initialized','ad_render_observed','ad_provider_error',
    'guide_engaged','guide_tool_used','eonbot_cta_open',
    'sponsored_discovery_requested','sponsored_discovery_result_present','sponsored_discovery_no_result','sponsored_discovery_provider_error',
    'rewarded_session_requested','rewarded_session_started','rewarded_fill_observed','rewarded_completion_verified','rewarded_reward_granted','rewarded_provider_error'
  )),
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  creative TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT '',
  click_source TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  device_class TEXT NOT NULL DEFAULT 'unknown',
  os_family TEXT NOT NULL DEFAULT 'unknown',
  browser_family TEXT NOT NULL DEFAULT 'unknown',
  event_count INTEGER NOT NULL DEFAULT 0,
  signed_in_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(
    day_started_at,event_name,source,medium,campaign,creative,placement,click_source,
    country,device_class,os_family,browser_family
  )
);

INSERT OR IGNORE INTO eon_growth_event_daily_rt97(
  day_started_at,event_name,source,medium,campaign,creative,placement,click_source,
  country,device_class,os_family,browser_family,event_count,signed_in_count,updated_at
)
SELECT day_started_at,event_name,source,medium,campaign,creative,placement,click_source,
  country,device_class,os_family,browser_family,event_count,signed_in_count,updated_at
FROM eon_growth_event_daily;

DROP TABLE eon_growth_event_daily;
ALTER TABLE eon_growth_event_daily_rt97 RENAME TO eon_growth_event_daily;
CREATE INDEX IF NOT EXISTS idx_eon_growth_event_daily_campaign
  ON eon_growth_event_daily(day_started_at DESC, source, campaign, event_name);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('trust', 4, '0004_growth_operational_events.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

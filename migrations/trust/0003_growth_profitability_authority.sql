-- RT92 PPC acquisition + profitability authority.
-- Privacy boundary: aggregate acquisition/economic rows only; no prompt/response
-- text, email, raw account id, IP address, cookie value or advertising profile.
CREATE TABLE IF NOT EXISTS eon_growth_event_daily (
  day_started_at INTEGER NOT NULL,
  event_name TEXT NOT NULL CHECK(event_name IN (
    'landing_view','engaged_5s','first_prompt','signup','second_session','7_day_return',
    'trial_start','paid_subscription','qualified_free_user'
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
CREATE INDEX IF NOT EXISTS idx_eon_growth_event_daily_campaign
  ON eon_growth_event_daily(day_started_at DESC, source, campaign, event_name);

-- PPC click continuity is retained only as a server-derived HMAC. Raw click IDs
-- are never stored, logged or exposed back to the browser.
CREATE TABLE IF NOT EXISTS eon_growth_click_attribution (
  click_hash TEXT PRIMARY KEY CHECK(length(click_hash) >= 32),
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  creative TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  landing_count INTEGER NOT NULL DEFAULT 0,
  first_prompt_count INTEGER NOT NULL DEFAULT 0,
  signup_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_growth_click_campaign
  ON eon_growth_click_attribution(source, campaign, first_seen_at DESC);

-- Signed-in retention only. subject_hash must be a server-side HMAC/derived hash;
-- raw account ids are prohibited in this table.
CREATE TABLE IF NOT EXISTS eon_growth_subject_cohort (
  subject_hash TEXT PRIMARY KEY CHECK(length(subject_hash) >= 32),
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 1,
  first_source TEXT NOT NULL DEFAULT '',
  first_medium TEXT NOT NULL DEFAULT '',
  first_campaign TEXT NOT NULL DEFAULT '',
  first_creative TEXT NOT NULL DEFAULT '',
  first_placement TEXT NOT NULL DEFAULT '',
  first_country TEXT NOT NULL DEFAULT '',
  first_device_class TEXT NOT NULL DEFAULT 'unknown',
  first_os_family TEXT NOT NULL DEFAULT 'unknown',
  first_browser_family TEXT NOT NULL DEFAULT 'unknown',
  signup_at INTEGER,
  second_session_at INTEGER,
  day7_return_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_growth_subject_cohort_campaign
  ON eon_growth_subject_cohort(first_source, first_campaign, first_seen_at DESC);

-- One-time authoritative lifecycle receipts. These use only the same keyed
-- subject HMAC as the retention cohort and prevent webhook retries or repeated
-- eligibility checks from inflating funnel conversions.
CREATE TABLE IF NOT EXISTS eon_growth_lifecycle_receipts (
  subject_hash TEXT NOT NULL CHECK(length(subject_hash) >= 32),
  event_name TEXT NOT NULL CHECK(event_name IN ('trial_start','paid_subscription','qualified_free_user')),
  first_recorded_at INTEGER NOT NULL,
  PRIMARY KEY(subject_hash,event_name)
);
CREATE INDEX IF NOT EXISTS idx_eon_growth_lifecycle_receipts_event
  ON eon_growth_lifecycle_receipts(event_name, first_recorded_at DESC);

-- Unified reconciled contribution ledger. Monetary values are integer micros of
-- USD reporting currency for the RT92 launch ledger. Provider revenue/cost MUST remain zero or
-- unreconciled until backed by provider/accounting evidence; the application
-- must never infer realized revenue from ad impressions or model usage alone.
CREATE TABLE IF NOT EXISTS eon_profitability_daily (
  day_started_at INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'growth',
  country TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  creative TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT '',
  device_class TEXT NOT NULL DEFAULT 'unknown',
  os_family TEXT NOT NULL DEFAULT 'unknown',
  browser_family TEXT NOT NULL DEFAULT 'unknown',
  user_cohort TEXT NOT NULL DEFAULT '',
  model_id TEXT NOT NULL DEFAULT '',
  request_class TEXT NOT NULL DEFAULT '',
  ppc_spend_micros INTEGER NOT NULL DEFAULT 0,
  exoclick_revenue_micros INTEGER NOT NULL DEFAULT 0,
  vexrail_revenue_micros INTEGER NOT NULL DEFAULT 0,
  vexrail_cost_micros INTEGER NOT NULL DEFAULT 0,
  vast_revenue_micros INTEGER NOT NULL DEFAULT 0,
  subscription_contribution_micros INTEGER NOT NULL DEFAULT 0,
  payment_refund_cost_micros INTEGER NOT NULL DEFAULT 0,
  infrastructure_cost_micros INTEGER NOT NULL DEFAULT 0,
  first_prompt_count INTEGER NOT NULL DEFAULT 0,
  signup_count INTEGER NOT NULL DEFAULT 0,
  d7_return_count INTEGER NOT NULL DEFAULT 0,
  trial_start_count INTEGER NOT NULL DEFAULT 0,
  paid_subscription_count INTEGER NOT NULL DEFAULT 0,
  qualified_free_user_count INTEGER NOT NULL DEFAULT 0,
  ai_prompt_count INTEGER NOT NULL DEFAULT 0,
  spend_reconciled INTEGER NOT NULL DEFAULT 0 CHECK(spend_reconciled IN (0,1)),
  revenue_reconciled INTEGER NOT NULL DEFAULT 0 CHECK(revenue_reconciled IN (0,1)),
  vexrail_cost_reconciled INTEGER NOT NULL DEFAULT 0 CHECK(vexrail_cost_reconciled IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(day_started_at,provider,country,source,medium,campaign,creative,placement,device_class,os_family,browser_family,user_cohort,model_id,request_class)
);
CREATE INDEX IF NOT EXISTS idx_eon_profitability_daily_campaign
  ON eon_profitability_daily(day_started_at DESC, provider, source, campaign);

-- Observed Vexrail runtime telemetry is deliberately separate from realized
-- provider economics. Token and latency observations never become "actual cost"
-- until reconciled against an explicitly verified model price/provider record.
CREATE TABLE IF NOT EXISTS eon_vexrail_model_daily (
  day_started_at INTEGER NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  model_id TEXT NOT NULL,
  request_class TEXT NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms_total INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(day_started_at,country,model_id,request_class)
);
CREATE INDEX IF NOT EXISTS idx_eon_vexrail_model_daily_model
  ON eon_vexrail_model_daily(day_started_at DESC, model_id, request_class);

-- Idempotency/audit authority for operator-imported provider/accounting evidence.
-- Raw evidence references or provider statement contents are never stored here;
-- only a one-way receipt hash and canonical payload digest are retained.
CREATE TABLE IF NOT EXISTS eon_profitability_reconciliation_receipts (
  receipt_hash TEXT PRIMARY KEY CHECK(length(receipt_hash) = 64),
  payload_digest TEXT NOT NULL CHECK(length(payload_digest) = 64),
  provider TEXT NOT NULL,
  reporting_currency TEXT NOT NULL DEFAULT 'USD' CHECK(reporting_currency = 'USD'),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  row_count INTEGER NOT NULL CHECK(row_count > 0 AND row_count <= 100),
  imported_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_profitability_reconciliation_provider
  ON eon_profitability_reconciliation_receipts(provider, period_start DESC);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('trust', 3, '0003_growth_profitability_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

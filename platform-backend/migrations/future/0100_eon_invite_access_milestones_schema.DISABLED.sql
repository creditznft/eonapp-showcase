-- W234 — FUTURE-ONLY / NOT DEPLOYED
--
-- This file is an auditable design reference. It is not loaded by any deploy
-- command, contains no production database id, and must not be applied until
-- W236's approval gates are complete and an explicit activation change is
-- reviewed. It deliberately models non-financial, non-transferable
-- Access Milestones only.

CREATE TABLE IF NOT EXISTS eon_invite_accounts (
  identity_hash TEXT PRIMARY KEY,
  inviter_identity_hash TEXT,
  enrollment_state TEXT NOT NULL CHECK (enrollment_state IN ('pending','active','blocked','expired')),
  program_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(identity_hash)
);

CREATE TABLE IF NOT EXISTS eon_invite_events (
  event_id TEXT PRIMARY KEY,
  identity_hash TEXT NOT NULL,
  inviter_identity_hash TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'invite_enrolled','activation_observed','qualification_pending',
    'qualification_eligible','milestone_granted','milestone_reversed',
    'milestone_expired','abuse_blocked','support_case_opened','support_case_resolved'
  )),
  idempotency_key TEXT NOT NULL UNIQUE,
  reason_code TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eon_access_milestone_ledger (
  grant_id TEXT PRIMARY KEY,
  identity_hash TEXT NOT NULL,
  capability_id TEXT NOT NULL CHECK (capability_id IN (
    'city_cosmetic','realm_cosmetic','workspace_template_trial',
    'project_capacity_trial','beta_access_trial'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending','eligible','granted','reversed','expired','blocked')),
  starts_at INTEGER,
  expires_at INTEGER,
  policy_version TEXT NOT NULL,
  reason_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eon_invite_events_identity ON eon_invite_events(identity_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_eon_access_milestones_identity ON eon_access_milestone_ledger(identity_hash, status, expires_at);

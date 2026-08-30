-- W391 EON Relay pilot schema.
-- DO NOT APPLY until legal, anti-abuse, identity, recovery and human-release gates are approved.
-- Apply only to a new dedicated EON_RELAY_DB. Never apply to EON_IDENTITY_DB or legacy referral databases.
-- This schema stores opaque account references and redacted evidence digests only. No email, IP address,
-- device fingerprint, chat, project, file, provider key, platform token, media body or financial value.

CREATE TABLE IF NOT EXISTS eon_relay_program_state (
  singleton_id TEXT PRIMARY KEY CHECK (singleton_id = 'relay'),
  rollout TEXT NOT NULL CHECK (rollout IN ('disabled', 'tracking', 'pilot', 'paused')),
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eon_relay_invites (
  invite_id TEXT PRIMARY KEY,
  inviter_account_ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER,
  status TEXT NOT NULL CHECK (status IN ('created', 'revoked', 'expired'))
);

CREATE TABLE IF NOT EXISTS eon_relay_invite_tokens (
  invite_id TEXT PRIMARY KEY,
  invite_code_hmac TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('profile', 'share-pack', 'remix-card', 'creator-atrium', 'manual')),
  FOREIGN KEY (invite_id) REFERENCES eon_relay_invites(invite_id)
);

CREATE TABLE IF NOT EXISTS eon_relay_attributions (
  attribution_id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  invitee_account_ref TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('profile', 'share-pack', 'remix-card', 'creator-atrium', 'manual')),
  captured_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('captured', 'invalidated')),
  FOREIGN KEY (invite_id) REFERENCES eon_relay_invites(invite_id)
);

CREATE TABLE IF NOT EXISTS eon_relay_activation_evidence (
  activation_id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  invitee_account_ref TEXT NOT NULL,
  evidence_digest TEXT NOT NULL,
  first_meaningful_action_at INTEGER NOT NULL,
  return_action_at INTEGER,
  review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_at INTEGER,
  FOREIGN KEY (invite_id) REFERENCES eon_relay_invites(invite_id)
);

CREATE TABLE IF NOT EXISTS eon_relay_grants (
  grant_id TEXT PRIMARY KEY,
  activation_id TEXT NOT NULL UNIQUE,
  inviter_account_ref TEXT NOT NULL,
  invitee_account_ref TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'issued', 'reversed')),
  issued_at INTEGER,
  reversed_at INTEGER,
  reversal_code TEXT,
  FOREIGN KEY (activation_id) REFERENCES eon_relay_activation_evidence(activation_id)
);

INSERT OR IGNORE INTO eon_relay_program_state (singleton_id, rollout, updated_at) VALUES ('relay', 'disabled', CAST(strftime('%s','now') AS INTEGER) * 1000);

CREATE INDEX IF NOT EXISTS idx_eon_relay_invites_inviter ON eon_relay_invites(inviter_account_ref);
CREATE INDEX IF NOT EXISTS idx_eon_relay_attributions_invite ON eon_relay_attributions(invite_id);
CREATE INDEX IF NOT EXISTS idx_eon_relay_evidence_invitee ON eon_relay_activation_evidence(invitee_account_ref);
CREATE INDEX IF NOT EXISTS idx_eon_relay_grants_inviter ON eon_relay_grants(inviter_account_ref, status);

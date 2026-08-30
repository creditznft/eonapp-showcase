-- W623I privacy-safe operational views. Counts only; no click/impression/social tracking.
CREATE VIEW IF NOT EXISTS eon_referral_operational_counts AS
SELECT
  (SELECT COUNT(*) FROM eon_referral_identities) AS identities,
  (SELECT COUNT(*) FROM eon_invite_accounts) AS accepted_invites,
  (SELECT COUNT(*) FROM eon_invite_accounts WHERE activated_at IS NOT NULL) AS activated_invites,
  (SELECT COUNT(*) FROM eon_invite_events WHERE event_type = 'retained_paid_referral' AND status = 'pending') AS paid_pending,
  (SELECT COUNT(*) FROM eon_invite_events WHERE event_type = 'retained_paid_referral' AND status = 'granted') AS paid_retained,
  (SELECT COUNT(*) FROM eon_key_grants WHERE status = 'available') AS keys_available,
  (SELECT COUNT(*) FROM eon_key_grants WHERE status = 'consumed') AS keys_consumed,
  (SELECT COUNT(*) FROM eon_key_grants WHERE status = 'revoked') AS keys_revoked,
  (SELECT COUNT(*) FROM eon_digital_rewards WHERE status = 'available') AS digital_rewards_available;

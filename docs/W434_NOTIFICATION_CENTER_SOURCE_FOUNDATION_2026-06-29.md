# W434 — Notification Center source foundation

## Implemented

W434 adds a local, redacted **Activity Center** inside Settings. It supports six customer-relevant categories: EONBOT replies, approval needed, project completion, Sync/data care, EON City activity, and collaboration.

Every activity item must have a real, caller-supplied event ID and an explicit source-event flag. The Center rejects sensitive text, deduplicates same-browser event IDs, retains local read state, exposes category visibility controls, and stores a quiet-hours preference for a later delivery channel. The Activity Center data key is included in the W145 update-survival registry.

The early VAPID/Web Push helper is now an inert compatibility facade. A stalled mission writes a local approval-needed record instead of requesting browser permission or sending a native notification.

## Explicit boundaries

- No browser permission request on load or in Settings.
- No VAPID key, PushManager, endpoint registration, service-worker push subscription, server delivery, or push unsubscribe claim.
- No reward, marketing, subscription, payout, wallet, or fabricated agent event is created by this Center.
- Quiet hours are a stored user preference only; they are not proof that future device delivery is enforced.
- No cross-device dedupe, remote read state, or live delivery certification.

## Still required before device notifications

1. User-triggered permission flow on supported browsers.
2. Per-device endpoint registration and secure endpoint lifecycle.
3. Server delivery, TTL, errors, rate limits, unsubscribe, and no-marketing defaults.
4. Quiet-hours delivery enforcement, cross-device dedupe/read state, and monitoring.
5. Privacy/security/support review and real-device evidence.

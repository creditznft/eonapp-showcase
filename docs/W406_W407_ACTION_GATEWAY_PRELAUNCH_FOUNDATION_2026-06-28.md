# W406/W407 — Action Gateway Pre-launch Foundation

Action Gateway source is present but hard-disabled. The browser cannot publish, create a repository, deploy a project, connect an account, schedule content or write an external receipt.

A future action requires: a signed-in identity session, a specific official provider connection, a server-issued proposal, visible payload summary, explicit final user confirmation, expiry, cancellation, idempotency, a durable redacted receipt, and provider-specific error/reversal handling.

Apply `action-gateway/migrations/0001_eon_action_gateway.sql` only to a new dedicated `EON_ACTIONS_DB` after the above is implemented and reviewed. Never mix it with the identity database, Relay database or legacy referral data.

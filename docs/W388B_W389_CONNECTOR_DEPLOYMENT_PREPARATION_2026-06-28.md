# W388B/C/D + W389 — Connector and Deployment Preparation

## Current state

- Native share and local export remain the only creator distribution actions.
- The registry lists Instagram professional, Facebook Pages, TikTok, YouTube, LinkedIn, Pinterest, X, Telegram channels/groups, Discord, Reddit, WhatsApp, Threads and Snapchat as future connector targets.
- No OAuth starts. No token is stored. No direct post, schedule, analytics claim, GitHub connection, repository creation or Cloudflare deployment occurs.
- Forge deployment preflight is local source inspection only.

## Future connector policy

Each platform must be implemented separately with official API review, an approved OAuth client, server-side encrypted credential custody, exact user-selected destination, per-post review, final approval, cancellation/revocation and a redacted durable receipt.

Platform eligibility must depend on the user's account, platform availability, platform terms and local law. It must not depend solely on the founder's location.

## Future databases

- `EON_CONNECTORS_DB` only after connector privacy/token design is approved.
- `EON_ACTIONS_DB` only after Action Gateway proof is approved.

Do not apply `connector/migrations/0001_eon_connector_custody.sql` yet.

# W223 — Invite & Share Center

## Decision

The stable top-right Share control is an **Invite & Share Center**, not a chat-collaboration or chat-publication feature.

It creates signed, self-contained public links for:

1. **EONAPP** — `/chat` invite.
2. **EON City** — `/eoncity` invite.
3. **AI Cockpit** — `/workspace` invite.
4. **My Realm** — a portable signed Realm identity only.

## Explicit boundaries

- No conversation is made public.
- No chat history, Vault material, API key, recovery material, wallet data, private City state, or private Market showcase is placed into a share link.
- No public profile database, user storefront, seller program, payment request, follower graph, or content-hosting service is activated.
- No click tracking, auto-posting, social-account connection, reward, payout, commission, or affiliate earning is active.
- A campaign draft is browser-local until a person manually copies or opens a platform-specific share action.

This means W223 does not introduce a public user-content platform requiring moderation. Any future public profile/storefront, user upload, affiliate settlement, or commerce surface remains separately gated by the W217 plan.

## Local data and migration

- Existing legacy share drafts are read and normalized non-destructively.
- New Share Center drafts live at `eon:share:drafts:v1`.
- The optional AI Cockpit campaign brief lives at `eon:share:campaign-intent:v1`.
- These two records are now safely included in the encrypted portable backup allowlist.
- Vault-shaped keys, secrets, passwords, tokens, recovery data, wallet data, and private state remain excluded.

## Test contract

- `npm run qa:w223-invite-share-center`
- `npm run qa:w223-invite-share-center:browser`
- `npm run qa:w216-release-candidate`

Browser proof requires an environment that allows Chromium to reach the local preview or deployed site. The sandbox used for this handover blocks localhost browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`.

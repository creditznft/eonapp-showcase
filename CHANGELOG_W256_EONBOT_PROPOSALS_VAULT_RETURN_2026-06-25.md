# W256 — EONBOT proposals, local receipts and Vault return context

**Status:** local-static complete on 2026-06-25. Preview, browser, device, PWA-update/rollback and human task proof remain open.

## Outcome

Guarded EONBOT destinations now use a short-lived local proposal lifecycle instead of a direct Chat link. A person must request review, inspect the proposed action, and perform a separate confirmation before the finite internal route can open. Vault remains the only credential/provider-verification surface and can return the person to the same local Chat thread without copying Chat text, credentials or provider data.

## What changed

- Added `assets/js/chat/eonbot-action-proposals.js` as the single local proposal contract.
- Guarded commands require an explicit review record, separate confirmation, expiry, cancellation and local failure handling.
- Proposal records are limited to safe action metadata: action ID/type, finite internal route, safe label, status and timestamps. They never retain prompt text, credentials, provider configuration, wallet authority, token/reward/loot/payment state, external URLs or remote effects.
- Added an opaque local proposal ID to the existing local action receipt so approval and receipt can be correlated without storing Chat content.
- Changed guarded EONBOT routes in `eonbot-command-hub.js` to suppress direct CTAs and emit `prepared-review-required` plans.
- Added a guarded `/vault#provider-check` path. Chat does not accept credentials; Vault owns provider checks and the person returns with an explicit local control.
- Added Vault → same-thread Chat return context with a 30-minute expiry. It stores only proposal/action IDs, route and timestamps.
- Added Chat review card UI: **Review** → **Cancel** or **Confirm and open**. An expired, cancelled or failed proposal cannot navigate.
- Added safe widget behavior: the compact widget directs guarded requests to full EONBOT Chat for review rather than executing them.

## Deliberate safety behavior

- A pending proposal is short-lived (10 minutes) and is not restored as a live Chat CTA after a full Chat reload. The person must request and review the action again. The stored proposal is still local-only and expires safely.
- Approval opens only a finite same-origin app route. It does not execute work, verify a provider, grant a permission, change local data, send network traffic, create a wallet request or create any economic value.
- Vault return does not indicate that a provider check succeeded. It only returns the person to the prior Chat thread.

## Non-goals

- No autonomous agents, hidden tool use, background actions, model routing changes, provider verification in Chat, credential input in Chat, wallet, contract RPC, signing, token/reward/loot/referral, payment, commerce, marketplace, publishing or on-chain data writes.
- No migration of existing Chat threads, Vault data or user local settings.

## Evidence

- 186/186 approved current-product tests passed.
- Zero-warning lint passed.
- Production build passed.
- W239/W242/W243/W244/W247/W248/W249/W250/W251/W252/W253/W254/W255/W256 gates passed.
- Build smoke, source syntax, site, readiness, PWA, identity, page, quality, secret and production dependency checks passed.
- Production dependency audit reported 0 vulnerabilities.

Logs: `EVIDENCE/W256_EONBOT_PROPOSALS_VAULT_RETURN_2026-06-25/`.

## Open proof

This wave does not prove a real browser review flow, Android/iPhone/desktop behavior, PWA update/rollback, CSP/network/console behavior, accessibility task success, production deployment or human acceptance. Those remain W259/W260 and the R3 release board.

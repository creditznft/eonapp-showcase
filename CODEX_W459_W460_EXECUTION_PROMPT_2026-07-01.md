This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex execution prompt — EONAPP W459.1 / W460.1 source-only continuation

Work only from the physical source in `EONAPP_W448_W458A_W459_W460_FREEZE_NEXT_CHAT_HANDOFF_2026-07-01`.

## Baseline

The source contains W448–W458.1 / W450.1 / W452.1–W452.2. The earlier chat mentioned W459.1 and W460.1, but the supplied archive does **not** include them. Implement only what is physically present plus the explicit source-only requirements below.

## Required order

1. Confirm Node 22 and run the full command matrix in `CODEX_START_HERE_W448_W458A_W452B_2026-06-30.md`.
2. Implement W459.1 manual, redacted local recovery rehearsal in Profile/Vault context. It must be explicit user action, local-only, fail-closed and protected-data-safe.
3. Implement W460.1 genuine local EONBOT job receipts flowing into Activity Center. Never create fabricated, replayed or background job messages.
4. Add deterministic gates/tests for W459.1 and W460.1, then rerun full verification.
5. Return a source evidence table that separates source validation from deployment/device/payment/Sync/legacy cleanup proof.

## Hard boundaries

- Keep `/` Chat, `/eoncity` City and `/insights` Research Lab canonical.
- Keep old Chat/Trade/Realm/City aliases inbound-only.
- Do not enable ads, reward mechanics, Telegram channel gates, sponsored credits, broker/execution, financial advice, crypto, wallets, tokens, marketplace/resale, referral payouts, browser push, automatic external actions or social auto-posting.
- Dodo is approval-pending only: no checkout, public price, trial marketing, provider SDK, webhook, customer portal, entitlement service, D1 billing records or browser-side access grants.
- Do not put `.env`, secrets, node_modules, dist, browser binaries, customer data or private screenshot evidence in commits/handoffs.
- Do not claim PWA install/update/rollback, real-device validation, Cloudflare deployment, service-worker adoption, Sync Basic launch, Dodo approval, checkout activation or final release from source tests.

## Return format

| Category | Result | Evidence / blocker |
|---|---|---|
| Source validation |  |  |
| W459.1 recovery rehearsal |  |  |
| W460.1 activity receipts |  |  |
| Cloudflare deployment | pending unless run |  |
| Browser/device/PWA proof | pending unless collected |  |
| Sync Basic | source/status only unless Device A/B proof exists |  |
| Dodo commercial status | approval-pending |  |
| Legacy cleanup | inventory/quarantine only |  |
| Next permitted wave |  |  |

Never merge these into a single “release passed” statement.

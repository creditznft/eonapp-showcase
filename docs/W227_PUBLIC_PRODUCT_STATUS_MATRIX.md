# W227 — Public Product Status Matrix

Generated from `config/product-evidence-registry.mjs`. This matrix is a release truth document, not a feature-activation switch.

## Status vocabulary

- **Live** — available within the stated local-first boundary.
- **Local-only** — browser-local state; no account or server publication claim.
- **Preview** — usable prototype/renderer with explicit limits.
- **Disabled** — page may explain the capability, but cannot activate it.
- **Future** — design boundary only; no service is active.
- **Retired** — compatibility redirect to a truthful current destination.

## Route truth

| Route | State | Destination | Evidence |
|---|---|---|---|
| `/` | Live | `/chat` | `tests/unit/w217-route-contract.test.mjs`<br>`tests/e2e/w227-shell-route-regression.spec.ts` |
| `/chat` | Live | `/chat.html` | `tests/unit/w218-chat-first-shell-v2.test.mjs`<br>`tests/unit/w219-eonbot-local-ai-workspace.test.mjs` |
| `/projects` | Live | `/projects.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/library` | Live | `/library.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/workspace` | Live | `/workspace.html` | `tests/unit/w219-eonbot-local-ai-workspace.test.mjs`<br>`tests/unit/w223-invite-share-center.test.mjs` |
| `/eoncity` | Live | `/eoncity.html` | `tests/unit/w221-cityworldstate-2d-rpg.test.mjs` |
| `/eoncity/3d` | Preview | `/eoncity-3d.html` | `tests/unit/w224-cityworldstate-3d-parity.test.mjs` |
| `/market` | Preview | `/market.html` | `tests/unit/w220-market-generation-vertical-slice.test.mjs` |
| `/trade` | Live | `/trade.html` | `tests/unit/w213-calm-city-trade.test.mjs` |
| `/automations` | Live | `/automations.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/profile` | Live | `/profile.html` | `tests/unit/w218-chat-first-shell-v2.test.mjs`<br>`tests/unit/w225-account-catalog-foundations.test.mjs` |
| `/vault` | Live | `/vault.html` | `tests/unit/w209-vault-account-boundary.test.mjs`<br>`tests/unit/w145-update-safe-user-data-survival.test.mjs` |
| `/vault/backup` | Live | `/vault-backup.html` | `tests/unit/w209-vault-account-boundary.test.mjs`<br>`tests/unit/w145-update-safe-user-data-survival.test.mjs` |
| `/local-ai` | Local-only | `/local-ai.html` | `tests/unit/w219-eonbot-local-ai-workspace.test.mjs` |
| `/realm-studio` | Local-only | `/realm-studio.html` | `tests/unit/w222-my-realm-mvp.test.mjs` |
| `/about` | Live | `/about.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/privacy` | Live | `/privacy.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/terms` | Live | `/terms.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/legal` | Live | `/legal.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/support` | Live | `/support.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/billing` | Disabled | `/billing.html` | `tests/unit/w225-account-catalog-foundations.test.mjs`<br>`tests/unit/w226-commercial-decision-gate.test.mjs` |
| `/telegram` | Disabled | `/telegram.html` | `tests/unit/w226-commercial-decision-gate.test.mjs` |
| `/rewards` | Disabled | `/rewards.html` | `tests/unit/w226-commercial-decision-gate.test.mjs`<br>`tests/unit/w215-monetization-decision.test.mjs` |
| `/referral` | Local-only | `/referral.html` | `tests/unit/w223-invite-share-center.test.mjs`<br>`tests/unit/w63-signed-share-link.test.mjs` |
| `/archive` | Retired | `/archive.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/u/*` | Future | `/realm-profile.html?user=:splat` | `tests/unit/w225-account-catalog-foundations.test.mjs` |
| `/r` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/r/` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/r/*` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/m` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/m/` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/m/*` | Local-only | `/referral.html` | `tests/unit/w217-route-contract.test.mjs` |
| `/index.html` | Retired | `/chat` | `tests/unit/w217-route-contract.test.mjs` |
| `/admin` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/admin.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/campaign-admin` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/campaign-admin.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/live-trading-dashboard` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/live-trading-dashboard.html` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/tools` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/tools.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/trust` | Retired | `/legal` | `tests/unit/w217-route-contract.test.mjs` |
| `/trust.html` | Retired | `/legal` | `tests/unit/w217-route-contract.test.mjs` |
| `/wallet-risk` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/wallet-risk.html` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/eon-browser` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/eon-browser.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/browser` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/workbench` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/workbench.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/build` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/builder` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/create` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/creator-studio` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/creator-studio.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/code-maker` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/code-maker.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/music-studio` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/music-studio.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/video-editor` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/video-editor.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm-code-preview` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm-code-preview.html` | Retired | `/workspace` | `tests/unit/w217-route-contract.test.mjs` |
| `/automation` | Retired | `/automations` | `tests/unit/w217-route-contract.test.mjs` |
| `/automate` | Retired | `/automations` | `tests/unit/w217-route-contract.test.mjs` |
| `/automation-studio` | Retired | `/automations` | `tests/unit/w217-route-contract.test.mjs` |
| `/automation-studio.html` | Retired | `/automations` | `tests/unit/w217-route-contract.test.mjs` |
| `/marketplace` | Retired | `/market` | `tests/unit/w217-route-contract.test.mjs` |
| `/marketplace.html` | Retired | `/market` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm.html` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/realmworld` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/realmworld.html` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/team-realm` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/team-realm.html` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/world` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/game` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/games` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/games.html` | Retired | `/eoncity` | `tests/unit/w217-route-contract.test.mjs` |
| `/eoncity-3d` | Retired | `/eoncity/3d` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm-profile` | Retired | `/realm-studio` | `tests/unit/w217-route-contract.test.mjs` |
| `/realm-profile.html` | Retired | `/realm-studio` | `tests/unit/w217-route-contract.test.mjs` |
| `/signal` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/signal.html` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/trade/sandbox` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/trade-sandbox` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/trade-sandbox.html` | Retired | `/trade` | `tests/unit/w217-route-contract.test.mjs` |
| `/get-free-ai-power` | Retired | `/local-ai` | `tests/unit/w217-route-contract.test.mjs` |
| `/get-free-ai-power.html` | Retired | `/local-ai` | `tests/unit/w217-route-contract.test.mjs` |
| `/setup` | Retired | `/local-ai` | `tests/unit/w217-route-contract.test.mjs` |
| `/device-check` | Retired | `/local-ai` | `tests/unit/w217-route-contract.test.mjs` |
| `/device-check.html` | Retired | `/local-ai` | `tests/unit/w217-route-contract.test.mjs` |
| `/onboarding` | Retired | `/chat` | `tests/unit/w217-route-contract.test.mjs` |
| `/onboarding.html` | Retired | `/chat` | `tests/unit/w217-route-contract.test.mjs` |
| `/start` | Retired | `/chat` | `tests/unit/w217-route-contract.test.mjs` |
| `/subscription` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/subscription.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/reward-access` | Retired | `/rewards` | `tests/unit/w217-route-contract.test.mjs` |
| `/reward-access.html` | Retired | `/rewards` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-rewards` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-rewards.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-payments` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-payments.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/kpi-token-dashboard` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/kpi-token-dashboard.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/kpi-dashboard` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/kpi-dashboard.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/leaderboard` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/leaderboard.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/hustle` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/hustle.html` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/social-mission` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/social-missions` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/missions` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-api` | Retired | `/vault` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-api.html` | Retired | `/vault` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-api-keys` | Retired | `/vault` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-api-keys.html` | Retired | `/vault` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-identity` | Retired | `/profile` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-identity.html` | Retired | `/profile` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-inventory` | Retired | `/market` | `tests/unit/w217-route-contract.test.mjs` |
| `/vault-inventory.html` | Retired | `/market` | `tests/unit/w217-route-contract.test.mjs` |
| `/refund-policy` | Retired | `/billing` | `tests/unit/w217-route-contract.test.mjs` |
| `/refund-policy.html` | Retired | `/billing` | `tests/unit/w217-route-contract.test.mjs` |
| `/crypto` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/games/cyber-rogue` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/games/cyber-rogue/*` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/games/realm-wars-lite` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |
| `/games/realm-wars-lite/*` | Retired | `/archive` | `tests/unit/w217-route-contract.test.mjs` |

## Claim evidence

| Claim | State | Routes | Evidence |
|---|---|---|---|
| Chat is the primary local-first EONBOT work surface with restorable local threads. | Live | `/chat` | `tests/unit/w218-chat-first-shell-v2.test.mjs`<br>`tests/unit/w219-eonbot-local-ai-workspace.test.mjs` |
| Invite & Share Center creates signed invitation or portable Realm identity links only; it does not share chats or create rewards, payouts, tracking, commerce, or auto-posting. | Live | `/chat`, `/profile`, `/workspace`, `/referral` | `tests/unit/w223-invite-share-center.test.mjs`<br>`tests/e2e/w223-invite-share-center.spec.ts` |
| Market begins empty and creates private local previews only after explicit user action. | Preview | `/market` | `tests/unit/w220-market-generation-vertical-slice.test.mjs`<br>`tests/e2e/w220-market-local-generation.spec.ts` |
| EON City is a local 2D experience with optional 3D rendering of the same safe CityWorldState. | Preview | `/eoncity`, `/eoncity/3d` | `tests/unit/w221-cityworldstate-2d-rpg.test.mjs`<br>`tests/unit/w224-cityworldstate-3d-parity.test.mjs` |
| My Realm is a local personal district; public publishing and merchant functions are not active. | Local-only | `/realm-studio`, `/u/*` | `tests/unit/w222-my-realm-mvp.test.mjs`<br>`tests/unit/w225-account-catalog-foundations.test.mjs` |
| Checkout, receipts, affiliate attribution, commissions, payouts, reward campaigns, token actions, and user seller functions are disabled. | Disabled | `/billing`, `/rewards`, `/telegram` | `tests/unit/w215-monetization-decision.test.mjs`<br>`tests/unit/w226-commercial-decision-gate.test.mjs` |
| Vault backup and restore are local encrypted workflows that exclude raw credentials and unrelated same-origin storage. | Live | `/vault`, `/vault/backup` | `tests/unit/w209-vault-account-boundary.test.mjs`<br>`tests/unit/w145-update-safe-user-data-survival.test.mjs` |

## Non-negotiable no-go

Sharing is an invitation mechanism only. It does not create attribution, affiliate value, rewards, payout eligibility, token value, public user commerce, or a moderation-free public platform.

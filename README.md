# EONAPP Public Code Showcase

![Showcase scan](https://img.shields.io/badge/showcase-public--safe-22c55e)
![Private core](https://img.shields.io/badge/core-proprietary-f97316)
![Live site](https://img.shields.io/badge/live-eonapp.ch-2563eb)
![Secrets](https://img.shields.io/badge/secrets-not%20included-0ea5e9)
![Status](https://img.shields.io/badge/status-trust%20preview-8b5cf6)

EONAPP is a browser-first AI superapp built around a few clear surfaces:

- `EON City` as the visual flagship and world entry
- `EONBOT` as the operator and guide
- `AI Cockpit` for tools, automation, content, and workflow routing
- `Vault` for local-first user control
- `Market` for starter NFTs, assets, templates, and gated commerce
- `Telegram + Reward Center` for growth, unlocks, and verified reward flows

This repository is the **public-safe showcase** for that product. It is meant to help users, partners, and investors understand the app without exposing the full private source tree, deployment internals, or secrets.

## Why This Repo Exists

The production app is intentionally **not fully open source**.

This public repository exists to show:

- what the app looks like in production
- how the major user-facing systems fit together
- how approval gates, reward safety, and local-first storage are handled
- curated code snippets that communicate design intent without leaking proprietary logic

The private production repository still contains the full implementation, monetization internals, deployment workflows, provider orchestration, contract operations, and secret-backed runtime code.

## Live Production Screens

These are real production screenshots captured from [eonapp.ch](https://eonapp.ch).

### Desktop

| Home | AI Chat |
|---|---|
| ![Home desktop](screenshots/live/home-desktop.png) | ![Chat desktop](screenshots/live/chat-desktop.png) |

| AI Cockpit | Market |
|---|---|
| ![Browser desktop](screenshots/live/browser-desktop.png) | ![Market desktop](screenshots/live/market-desktop.png) |

| Vault | Realm |
|---|---|
| ![Vault desktop](screenshots/live/vault-desktop.png) | ![Realm desktop](screenshots/live/realm-desktop.png) |

| Trust Explorer | Telegram Gateway |
|---|---|
| ![Trust desktop](screenshots/live/trust-desktop.png) | ![Telegram desktop](screenshots/live/telegram-desktop.png) |

### Mobile

| Home | Market | Telegram |
|---|---|---|
| ![Home mobile](screenshots/live/home-mobile.png) | ![Market mobile](screenshots/live/market-mobile.png) | ![Telegram mobile](screenshots/live/telegram-mobile.png) |

### Expanded Product Coverage

| Creator Studio | Trade |
|---|---|
| ![Creator Studio desktop](screenshots/live/creator-studio-desktop.png) | ![Trade desktop](screenshots/live/trade-desktop.png) |

| Plans / Subscription | Support |
|---|---|
| ![Subscription desktop](screenshots/live/subscription-desktop.png) | ![Support desktop](screenshots/live/support-desktop.png) |

| Creator Studio Mobile | Plans Mobile |
|---|---|
| ![Creator Studio mobile](screenshots/live/creator-studio-mobile.png) | ![Subscription mobile](screenshots/live/subscription-mobile.png) |

## Product Tour

### 1. Home

The home route is the orientation surface. It sets expectations around EON City, EONBOT, Vault, Market, Realm, and Plans before the user dives into deeper tools.

### 2. AI Chat / EONBOT

EONBOT is not just a toy chatbot. It is meant to route the user through the app safely, explain features, and ask before sensitive actions such as wallet/payment/backup/microphone/ad-related flows.

### 3. AI Cockpit

The cockpit is the operational workspace for:

- content generation
- workflow routing
- code and creator tools
- browser-assisted tasks
- future automation flows that still remain approval-first

### 3b. Creator Studio

Creator Studio sits on top of the same runtime system and turns it into a production workflow for:

- idea packs
- scripts
- thumbnails
- music drafts
- voice and subtitle prep
- review-first video/export packages

### 4. Vault

Vault is a local-first user control center. It is designed around:

- user-controlled local storage
- backup and restore paths
- safe separation from public-facing surfaces
- explicit warnings around secrets and recovery material

### 5. Market

The Market is meant to feel populated from the first visit, not empty. It seeds a starter drop, explains the Genesis/catalog direction, and keeps paid flows clearly gated behind verified checkout or proof.

### 6. Realm / EON City

EON City is the flagship visual surface. It acts as:

- a world-entry layer
- a workstation/world hybrid
- a place for guided app discovery
- a future-friendly layer for richer game and NPC flows

### 7. Telegram + Reward Center

Telegram is a gateway, not a trap. The public rule is simple:

- no rewarded ad should auto-start
- user action is required
- account-wide reward value needs verified provider proof or postback
- growth surfaces must stay explicit, not deceptive

### 8. Plans, Billing, and Trust

The billing and support surfaces explain:

- what free users can do before paying
- how plans differ
- where ad-supported temporary unlocks stop
- that money, wallet, and entitlement claims need verification

### 9. Trade and Research

Trade is positioned as a research and simulation surface, not a hidden auto-trading promise. The public safety boundary stays visible:

- shadow mode and paper-trading first
- no profit guarantees
- explicit API and wallet warnings

## Included In This Public Repo

- public-safe screenshots and visual previews
- trust and architecture docs
- curated snippets showing approval gates and safety boundaries
- a simple safe preview example
- repo boundary scans that help prevent accidental secret leakage

## Not Included

- full private EONAPP source code
- `.env` files or secret bindings
- provider API keys
- Telegram bot token
- Cloudflare, NOWPayments, Monetag, Filebase, wallet, or contract secrets
- full orchestration and monetization internals
- production deployment runtime details
- proprietary EON City implementation internals

## Selected Public Snippets

- [`src/snippets/approval-gate.js`](src/snippets/approval-gate.js)
- [`src/snippets/vault-local-first.js`](src/snippets/vault-local-first.js)
- [`src/snippets/sponsor-boost-policy.js`](src/snippets/sponsor-boost-policy.js)
- [`src/snippets/eonbot-command-router.js`](src/snippets/eonbot-command-router.js)
- [`src/snippets/mobile-game-ui-guard.js`](src/snippets/mobile-game-ui-guard.js)
- [`src/snippets/telegram-miniapp-browser-bridge.js`](src/snippets/telegram-miniapp-browser-bridge.js)
- [`src/snippets/nft-starter-drop-persistence.js`](src/snippets/nft-starter-drop-persistence.js)

## Trust Model

EONAPP follows these public rules:

1. **Local-first Vault**: user data should stay user-controlled by default.
2. **Approval-gated actions**: payment, wallet, backup, microphone, and ad-sensitive actions require user approval.
3. **Clean default experience**: Sponsor Boost and similar growth mechanics must stay optional and understandable.
4. **Verified reward value**: local clicks alone do not create paid entitlement truth.
5. **Mobile-safe world UX**: EON City overlays must not trap the user.
6. **Public code boundary**: this repo proves product and safety intent, not every internal implementation detail.

## Documentation

- [`docs/architecture-overview.md`](docs/architecture-overview.md)
- [`docs/app-surface-tour.md`](docs/app-surface-tour.md)
- [`docs/live-route-catalog.md`](docs/live-route-catalog.md)
- [`docs/reward-safety-model.md`](docs/reward-safety-model.md)
- [`docs/public-vs-private-boundary.md`](docs/public-vs-private-boundary.md)
- [`docs/in-app-code-preview-plan.md`](docs/in-app-code-preview-plan.md)
- [`docs/launch-readiness-public-summary.md`](docs/launch-readiness-public-summary.md)

## Run The Safety Check

```bash
npm test
```

That scan is meant to catch:

- obvious secret-shaped strings
- accidental `.env` style material
- public/private boundary language mistakes

## Live Product

- Site: [https://eonapp.ch](https://eonapp.ch)
- Public showcase repo: [https://github.com/creditznft/eonapp-showcase](https://github.com/creditznft/eonapp-showcase)

## Notes

This repository is a **trust showcase**, not the full product source release. If you are reviewing EONAPP seriously, this repo should be read together with the live site and the in-app Trust Explorer / Code Showcase route.

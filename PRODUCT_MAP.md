# EONAPP current product map — W393

**Status:** source-proof only. This document describes the current frozen-source boundary; it is not Preview, device, PWA rollback, or production approval evidence.

**Route contract:** `eonapp.w392.direct-eon-city-entry.route-contract.v12` · **City navigation contract:** `eon.city.command-deck.w393.v1`

## One product, four primary work surfaces

| Surface | Canonical route | Lifecycle | Truth |
|---|---|---:|---|
| EONBOT Chat | `/` | live | Guest-first conversational front door. It prepares, but never performs, sensitive actions. |
| Projects | `/projects` | live | Persistent local work context. |
| EON City | `/eoncity` | direct-immersive-city | One-click local Babylon entry with an in-world Command Deck. Full screen, sound, vibration and visual preferences remain explicit choices; City Map is the honest fallback. |
| EON Forge | `/forge` | local-first-builder | Local website source creation, restricted preview, editor, local assets, import review, revisions, source checks, change receipts, and manual export. |

Supporting surfaces are registered only in `config/route-contract.mjs`. Vault/Backup, Local AI, Realm Studio, Market Intelligence, Automations, Profile, and Library remain explicit destinations. Preview Studio (`/market` compatibility route) is a **local-preview** surface, not a marketplace. Billing, Telegram, and rewards are disabled/informational only.

## EON City renderer roles

- **EON City** — `/eoncity` loads the local Babylon district directly after the user chooses City. There is no public portal/settings page before entry. Full screen, orientation, audio, vibration and visual preferences remain explicit in-world actions; City Map is the honest fallback.
- **Command Deck** — an in-world Babylon room and compact HUD panel for EONBOT, Forge, Projects, Library and City Map. It focuses the local room and opens a destination only after a visible user click; it never reads private work, publishes, rewards, connects an account, or sends telemetry.
- **City Map** — `/eoncity/lite` remains the all-device, local-first useful fallback and map route.
- **City Visual Tour** — `/eoncity/3d` remains a legacy optional Three.js view only; it is not primary navigation. The public Command Deck now lives inside Babylon; the legacy tour stays isolated until a later migration-cleanup proof.
- **Compatibility Play** — `/eoncity/play` retains the manual gate for technical review and regression testing. The Babylon district is a working vertical slice, not a finished game or launch-ready flagship claim. Real device proof remains required.

All City renderers share only safe local progress. City Map and the legacy Visual Tour use **prepare → review → user confirm → open canonical route**. Direct EON City remains local-only; work routes are prepared for review and never open automatically. No raw Chat text, credentials, wallet data, personal contact data, external URL, payment, or background action belongs in City state.

## W242 quarantine boundary

1. Vite emits only route-contract HTML, `404.html`, and `offline.html`; retired nested roots cannot reach `dist`.
2. The active import fence traverses every local script referenced by current route entries and rejects archive, legacy game/tool/provider/value families, wallet configuration literals, and EVM-address literals.
3. Wallet-derived administration and payment routing are inert in the active runtime. Historical address/configuration material is retained only as excluded legacy residue for forensic review, never as a reachable surface.
4. The production build does not accept arbitrary HTML roots as public product pages. New public HTML requires a route-contract entry and a W242 gate update.

## Locked commercial and safety boundary

No tokens, wallets, payment, payout, rewards with value, paid/random rewards, lootboxes, ads, sponsored answers, referrals with value, checkout, marketplace, public Realm publishing, or multiplayer is active. The W390–W391 Collection and viral-growth model is a disabled design decision in `EONAPP_W390_W391_COLLECTION_AND_VIRAL_GROWTH_DECISION_2026-06-27.md`, not a live capability. `/market` is titled Preview Studio and creates only local visual previews after explicit user action. Legacy files do not create a product capability merely by existing outside the active route/import/output graph.

## Evidence commands

```powershell
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w239-public-output-quarantine
npm run qa:w242-active-source-quarantine
npm run qa:w249-babylon-play-proof-spike
npm run qa:w392-direct-eoncity-entry
npm run qa:w393-command-deck
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

External W241 proof remains required: Cloudflare Preview status/redirects, console/network/CSP, Lighthouse/accessibility, real devices, installed-PWA update/rollback, deployment rollback, Git-history secret scan, and production Environment reviewer evidence.

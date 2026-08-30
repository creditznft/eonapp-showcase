# EONAPP Final Launch Program — 2026-06-30

## Release definition

EONAPP launches as a **local-first AI workspace** with a premium original **EON Noir City** interface, owner-confirmed Google identity, explicit user-controlled Sync Basic, privacy-safe sharing and one future hosted subscription checkout.

The release does **not** include ads, ad rewards, offerwalls, Telegram rewards, trading or execution, prediction-market stakes, financial advice, crypto, tokens, wallets, NFT resale/marketplace, live referral rewards, browser push, automatic social posting, or autonomous external actions. Telegram remains optional for onboarding, help, updates and explicit deep links. The former Trade surface is **Research Lab**: local research and uncertainty review only.

## Status board

| Functional ID | Decision | Current status | What still makes it launch-ready |
|---|---|---|---|
| `AUTH-GOOGLE` | Google sign-in/out is part of launch | **Green, owner-confirmed** | Capture final production cancel/retry/account-switch evidence; do not reopen the implementation without a real regression. |
| `COMMERCIAL-RETIREMENT` | Ads, rewards and trading execution stay retired | **Source green** | Production configuration review: remove/disable any dormant ad/reward scripts, provider callbacks and stale links outside this repository. |
| `CITY-ROUTE` | `/eoncity` is the only City route | **Source green** | Deploy; prove redirects, stale service-worker recovery and address-bar truth on production. |
| `CITY-ENGINE` | Fast core first, deferred non-critical detail, no visible WebGL warnings | **Source green / real-device red** | Chrome trace, GPU/console sweep, memory slope, first-frame and FPS evidence on actual hardware. |
| `CITY-ART` | Original authored EON Noir landmark kit replaces visible primitive block language | **Red** | Commission/create licenced hero GLB/glTF + PBR assets, LODs, texture compression, provenance manifest and visual sign-off. |
| `CITY-WORLD` | Dense streets, skyline, weather moods, transit, reflections and depth | **Red** | Build/stream an authored vertical slice; fixed-camera visual approval. |
| `CITY-NPCS` | Readable original hero cast + ambient life | **Red** | Rigged/animated models, LODs, interaction cues and device proof. |
| `CITY-WORKSPACE` | Real EONAPP tools work from in-world stations | **Amber** | Complete every station journey and prove it uses live app modules, never fake screens or fake job claims. |
| `CITY-MOBILE` | Landscape Explore and portrait Companion are different intentional modes | **Source green / device red** | Android/iOS portrait, landscape, rotation, safe-area, touch and thermal proof. |
| `CITY-SHARE` | Manual privacy-safe City postcards and Share Packs | **Amber** | Finish City postcard viewpoints, review/copy/native share tests and a privacy review. No automatic posting. |
| `SYNC-BASIC` | Explicit opt-in cross-device preferences + approved text/metadata only | **Red** | Fresh D1 binding, migration, consent, upload/delete/merge/tombstone, Device A/B, browser-clear and rollback proof. |
| `PWA-RECOVERY` | Safe install/update/rollback/data survival | **Amber** | Real installation and production update/rollback drill on desktop and phones. |
| `NOTIFY-CENTER` | In-app Activity Center only | **Amber** | Preference/read-state evidence. Browser push remains off. |
| `EONBOT-JOBS` | Receipt-backed local lifecycle only | **Amber** | Full happy/error/cancel/retry proof. No fabricated agent activity. |
| `TELEGRAM-REPURPOSE` | Optional onboarding/help/updates/deep links | **Source green / live red** | Live bot/page text and deep-link acceptance proof. No rewards or channel gate. |
| `TRADE-INSIGHT` | Research Lab is local and non-financial | **Source green** | Production route/copy crawl after deployment. |
| `COMMERCE-BILLING` | One approved hosted-checkout provider, after core product gates | **Red** | Merchant approval, policies, test checkout, signed webhook, idempotency, cancel/refund/failure/grace paths, live proof. |
| `I18N-VOICE` | Declared locale coverage + browser-safe voice fallback | **Amber** | Translation completeness, non-English layout, typed fallback and permission review. |
| `SECURITY-A11Y` | Security, privacy and accessible launch | **Red** | Dependency remediation, CSP/secret/route review, keyboard/screen-reader/error-state audit. |
| `RELEASE-PROOF` | Fail-closed launch board | **Red** | Evidence matrix, release/rollback rehearsal, human release approval. |

## EON Noir product standard

The City is an original cyberpunk-inspired workplace, not a copied game world. It must use original/licensed assets and avoid copied Cyberpunk artwork, architecture, characters, branding, signs, glyphs or scene layouts.

City art rules:

- No visible landmark is a plain rectangular block. A box is allowed only as hidden collision, low-detail proxy or internal support.
- Every major district has a recognisable silhouette from three camera angles and a real app purpose.
- The City has foreground street detail, mid-ground architecture and distant atmospheric skyline depth.
- Typography is readable, never mirrored and never obscures the main view.
- Most surfaces stay graphite, wet stone, dark glass, carbon, steel and ceramic; cyan, violet and amber are disciplined signals—not default paint.
- NPC status language appears only from verified local receipts. Ambient life is decorative; it never fabricates work, approvals or outcomes.
- A City screen must reveal world first, interface second. Debug/network overlays and crowded desktop HUD patterns are not production UI.

### City production order

1. **`CITY-ROUTE` production proof** — canonical path, aliases, service-worker cache repair.
2. **`CITY-ENGINE` real-device performance proof** — fix WebGL warnings and establish Lite/Balanced/Cinematic budgets before heavy art.
3. **`CITY-ART`** — original hero landmarks, prop kit, materials, decals, provenance and LOD plan.
4. **`CITY-WORLD`** — authored arrival slice: Arrival Rift, Command Loom, Forge Basilica, Creator Atrium, transit lane, rain-capable street, skyline and one garden/quiet edge.
5. **`CITY-NPCS`** — EONBOT, Builder, Curator, Guardian, Device Technician and Support Navigator with rigs/animations/LOD.
6. **`CITY-WORKSPACE`** — validate every in-world station to in-app working surface and return path.
7. **`CITY-MOBILE`** — device matrix and touch/rotation/thermal proof.
8. **`CITY-SHARE`** — preset cinematic postcard viewpoints and manual Share Pack handoff only.

## Option B: private expandable project districts

A user project may render as a private expandable EON Noir district only from a **sanitized City-safe plan**. The City must never receive or render project IDs, prompts, files, credentials, raw chat, hidden metadata or private content. No project district creates a public route, network request, publication, entitlement or referral event. Users may enter a City-safe local station and deliberately continue work through the real EONAPP workspace.

## Core application completion order

1. **Product-scope cleanup:** quarantine/detach stale reward, provider, trading, wallet and marketplace public entry points; maintain transparent retired routes only.
2. **City vertical slice:** route, engine, art, world, NPC, workspace, mobile and share proof in the order above.
3. **`SYNC-BASIC`:** activate only for permitted preferences and user-selected text/metadata. Vault, keys, wallets, payment records, device caches and unknown storage remain excluded.
4. **`PWA-RECOVERY`:** prove installation, update, rollback and local data survival; preserve existing local data during updates.
5. **`NOTIFY-CENTER` + `EONBOT-JOBS`:** in-app activity and truthful local job receipts; no background claims.
6. **`TELEGRAM-REPURPOSE` + `TRADE-INSIGHT`:** live copy/deep-link proof and production route sweep.
7. **`I18N-VOICE` + `SECURITY-A11Y`:** locale/accessibility/privacy/security completion.
8. **`COMMERCE-BILLING`:** apply now, choose one approved processor after core gates, then integrate hosted checkout and lifecycle webhooks.
9. **`RELEASE-PROOF`:** production evidence, rollback rehearsal and final human GO/NO-GO.

## Explicitly held beyond launch

The following are not merely incomplete launch tasks; they remain intentionally off until separately redesigned and proven:

- Vault Sync and any cloud custody of secrets.
- Referral credits, discounts, payouts or attribution ledger.
- Browser push delivery.
- OAuth social posting/connectors.
- Marketplace, resale, token, wallet, crypto or other value systems.
- Autonomy that sends, posts, pays, trades, publishes or changes permissions.

## Current source checkpoint — W448

This checkpoint implements and validates:

- `COMMERCIAL-RETIREMENT`: public product scope, retired monetization state, transparent retired access route and Telegram no-reward surface.
- `TRADE-INSIGHT`: canonical `/insights` Research Lab, with `/trade` and legacy analysis paths safely redirected.
- `CITY-ROUTE`: `/eoncity` canonicalization for old Realm/City URLs, generated redirects and service-worker cache version bump.
- `CITY-ENGINE`: deterministic staged City detail queue plus guarded dynamic texture construction.
- `CITY-MOBILE`: portrait Companion Mode and explicit Landscape Explore Mode.
- Product truth updates: PWA manifest/shell wording, EONBOT routing and local AI wording align to the current scope.

This is a **source/test checkpoint only**. It does not claim a production deployment, real-device City performance, visual acceptance, merchant approval, checkout, live Sync transport, Telegram delivery or release certification.

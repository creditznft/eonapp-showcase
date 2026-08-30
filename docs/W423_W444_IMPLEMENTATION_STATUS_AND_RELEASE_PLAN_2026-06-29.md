# EONAPP W423–W444 — implementation status & release plan

## Product decision record

EONAPP stays **guest-first, Chat-first, and City-capable**:

1. A person can open the product and work locally without creating an account.
2. Home and Chat automatically show one compact EONAPP sign-in card to a signed-out person. It is closable, but there is no second “Continue as guest” step because the person is already a guest.
3. The Google account chooser is opened only after the person presses the card’s single **Continue with Google** button. OAuth requests `prompt=select_account` so account choice is requested at that moment.
4. Google identity is not EON Sync. Local chats, projects, Vault data, API keys, files and City state remain local unless a future separately approved sync flow is enabled.
5. `/eoncity` is the one public City entry. It starts the Babylon renderer directly. Legacy City, Realm, 2D-map, Three.js/tour and play aliases redirect to `/eoncity`.
6. Vault Reveals are non-financial visual collectibles. They are not NFTs, tokens, paid chance, tradable assets, payouts, referrals, purchase receipts or subscription entitlements.

## Completed in this source checkpoint

### W423 — shell, route and production-output integrity

- Repairs desktop shell containment rules and transient-menu cleanup on pointer-away, scroll, page-show, Escape and route resets.
- Makes the canonical product shell guest-first. The signed-out identity card has one Google action and no redundant guest continuation.
- Uses safe account result copy with a sanitized reference code instead of exposing generic OAuth failures in the URL or profile screen.
- Sets OAuth account selection to `prompt=select_account`.
- Makes the lower-left profile launcher the central home for Profile, Settings, Help, Install EONAPP, Vault Reveals and Vault security.
- Removes retired City HTML documents from the production output check. Production must emit the canonical Babylon `eoncity.html` only and retain redirect rows for retired aliases.
- Bumps the service worker cache boundary to `v52` so a later deployed build can replace the old shell/City cache family after the normal update lifecycle.

### W424–W425 — customer-facing simplification

- Reduces EONBOT header diagnostic copy so Chat presents a compact ready state instead of Guide, locale and performance explanations.
- Keeps voice configuration behind controls rather than treating it as first-screen copy.
- Makes Apps use plain-language product cards: Build websites & apps, Create visuals & campaigns, Research & organize ideas and Plan automations.
- Keeps Settings, appearance, local profile and install controls behind the lower-left account launcher instead of leaving multiple overlapping menus in the first view.

### W426 — City motion, authored asset direction and safe visual progression foundation

- Adds controlled Babylon texture drift to repeatable local SVG surfaces on Balanced/Cinematic profiles. Motion respects pause, Lite and reduced-effects preferences.
- Adds original-art production briefs for six professional NPC roles and four City building kits. They define silhouette, readable features, materials, animation loops, LOD and provenance expectations.
- Adds a Foundation/Signal/Studio/Command/Skyline visual progression plan. Foundation is the only rendered tier. Every other tier is preview-only.
- Does not read subscriptions, payments, referrals, rewards, wallet state, accounts or Vault Reveals to alter the City.
- Does not ship final GLB/GLTF characters, building models, animated character rigs or premium binary 3D art. The source uses local procedural and SVG art until an original final-art pipeline is reviewed.

## Release truth

This package provides source-level implementation and local verification. It does **not** prove live deployment, a successful real Google sign-in, universal Babylon startup, final art quality, browser notification delivery, multi-device Sync or remote agent execution.

No reward, payment, referral, marketplace, NFT-trading, auto-posting, external execution, subscription entitlement or payout path is released by this checkpoint.

## W427–W444 sequencing

| Wave | Goal | Required acceptance before calling it done |
|---|---|---|
| W427 | Direct City production cleanup | `/eoncity` direct boot, every retired alias redirects, no 2D map or tour in normal navigation, fresh-service-worker regression proof. |
| W428 | Real browser shell proof | Desktop and mobile screenshots/video for menus, account card, sign-in/out/re-login, Apps first render and no horizontal overflow. |
| W429 | Google identity release proof | Cloudflare OAuth variables verified without exposing secrets; signed-out card → chooser → callback → original route; logout → re-login; cancel/error/retry cases manually proven. |
| W430 | EONBOT job fabric | One real lifecycle: draft → ready for review → awaiting approval → completed/failed. Every visible agent/NPC state must have a real job receipt, cancellation and privacy boundary. |
| W431 | Apps, projects and workspace refinement | Customer language, focused starting points, local-first persistence, no technical setup copy on first impression. |
| W432 | Babylon City functional vertical slice | Arrival, Command, Forge and Creator districts; functional in-game stations; keyboard/mouse/touch controls; direct recovery within the same City runtime. |
| W433 | Original premium 3D asset pipeline | Original GLB/GLTF NPC/building assets, source/provenance manifest, LODs, animation clips, texture budgets, accessibility review, device review and rollback path. |
| W434 | City visual progression release design | Explicit non-financial visual-preview controls first. Any earned/plan-linked styling requires a separate entitlement, reversal, support and abuse-control review. |
| W435 | Project district instances | Bounded private project district templates; no private prompt/file data on public façades; creation, deletion, restore and data-survival proof. |
| W436 | Safe agent presence | NPC “working” bubbles only from actual active jobs. No fabricated work, private prompts, secrets or hidden tool output in-world. |
| W437 | Sync Basic | Explicit opt-in for safe settings and chosen project/chat text; two-device merge/conflict/delete/offline/restore/update proof. |
| W438 | Vault Sync | Separate end-to-end encrypted architecture, recovery, revocation, device loss, export/restore and independent security review. Never piggyback it onto Google identity. |
| W439 | Notifications | First ship in-app Activity Center. Browser/app notifications only after a user-triggered permission action, per-device controls, quiet hours, unsubscribe, rate limits and delivery proof. |
| W440 | Vault Reveals & Collection | Local visual gallery, provenance, accessibility and safe reveal interactions. No financial wording, trading, prices, paid chance or automatic grants. |
| W441 | Relay/referral and external actions | Keep hidden/disabled until a real backend, anti-abuse controls, consent, terms/support, audit logs and manual release gate exist. |
| W442 | Security, privacy and resilience | CSP/XSS review, secret scanning, content-security regression, cache/update-safe data survival, telemetry minimisation and recovery drills. |
| W443 | Performance & visual certification | Valid Lighthouse JSON/HTML from a normal runner, desktop/mobile route matrix, real device City frame evidence, bundle budgets and accessibility audit. |
| W444 | Release candidate & handoff | Clean clone, deterministic install, all gates, source manifest, checksum, deployment procedure, rollback procedure and an explicit remaining-risk register. |

## City art and upgrade policy

Animated SVG/vector art is appropriate for City signage, environmental textures, wayfinding, surface drift, route lights, companion halos and motion accents. It must remain low-cost, respect reduced motion and never obscure interaction labels.

For the premium presentation requested for EON City:

- **Now:** local Babylon geometry + original SVG motion + art-direction briefs.
- **Next:** original designed/commissioned GLB/GLTF hero assets with human review, LODs and source manifests.
- **Later:** bounded visual styling previews for workstations, buildings and NPC companions.
- **Only after a separate release gate:** any relationship between a legitimate user-owned visual unlock and a building/NPC appearance. The first version must have an explicit visual selector and reversal mechanism. It must not use opaque subscription, payment, referral or collectible state.

This avoids fake “RPG upgrades” while preserving the desired City progression language: a cleaner base City can visibly gain richer architecture, console trims, route lighting, companion variants and district atmosphere when the underlying system is real and user-controllable.

## Current validation commands

Run from the source root:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run qa:w419-city-original-vector-art
npm run qa:w422-city-deep-art
npm run qa:w426-city-motion-progression
npm run lighthouse:direct
```

The final Lighthouse command may report an environment block. A Chrome error document, missing navigation start or incomplete Lighthouse JSON is not a performance score and must be rerun in a normal Windows/CI browser environment.

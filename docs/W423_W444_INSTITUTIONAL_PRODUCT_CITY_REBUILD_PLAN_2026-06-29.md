# EONAPP W423–W444 — Institutional Product, Identity and EON City Rebuild Plan

**Date:** 29 June 2026  
**Planning baseline:** W422 live-return source bundle, W405 rescue program, deployed `eonapp.ch`, manual user review, and independent source/build/Lighthouse re-check.  
**Status:** Product rebuild plan. It is not a deployment approval and does not claim that current Sync, push, referral rewards, commerce, execution, or final City art is live.

---

## 1. Executive decision

EONAPP should be rebuilt around a simple promise:

> **Ask. Make. Enter.**  
> Start in a calm chat workspace, sign in with Google in one click when desired, and enter EON City to work inside the same product world.

The public product must stop exposing internal implementation language, alternate engines, diagnostic screens, inactive systems, or multiple versions of the same place. The flagship is **one canonical Babylon EON City**, not a collection of tours, maps, work modes and fallbacks.

### Locked operating decisions

1. **Guest is automatic.** Every signed-out person is already using a local guest workspace. There is no “Continue as guest” action.
2. **The sign-in card opens automatically.** On first anonymous entry to Home or Chat, EONAPP opens a small branded Google sign-in card. One primary action, **Continue with Google**, opens the Google account chooser. The card may be dismissed for the current browser session, and always reappears after explicit logout or a fresh browser session.
3. **Google identity is only identity.** Login never implies Sync, backup, uploads, provider access, Drive/Gmail access, sharing, payment, or deployment.
4. **The left-bottom account area is the owner’s control centre.** Guest/account status, pricing, settings, help, install, profile, Vault/Collection and logout belong there.
5. **EON City opens directly.** The EON City tab immediately boots Babylon on the canonical `/eoncity` route. It does not first send a user to a map, tour, explainer or legacy Three.js scene.
6. **Babylon is the only public 3D runtime.** Three.js source may be archived for reference only. It must not ship as a public route, navigation destination, service-worker cache target, or second game.
7. **Real work only.** EONBOT/agent activity, mission status, notifications, rewards and City NPC status must derive from real approved work records. Decorative ambient City life is fine when clearly non-operational; fake work simulation is not.
8. **The City comes before expansion.** Make one excellent work-ready City vertical slice reliable, useful, visually authored and fast before multiplying districts, modes or features.
9. **No commercial/reward activation by implication.** Vault Reveal, Collection, Relay/referrals, ads, payments, social posting, automated publishing and Action Gateway execution stay disabled or hidden until their separate proof gates pass.

---

## 2. Current audit — evidence-based truth

### 2.1 Package and source truth

The W422 archive is a usable development handover: source, lockfile, scripts, evidence and a Lighthouse helper are present. The local production build completed successfully, producing 307 distribution files; the minification pass reduced 177 JavaScript files from roughly 8.30 MB to 4.72 MB.

It is **not** a clean release candidate yet:

- The current unit suite recorded **391 / 393 passing**.
- Both failing gates are W419/W422 art-integrity aggregate tests.
- The underlying defect is reproducibility: the 58 SVG assets’ catalog hashes are computed against a different line-ending representation than the shipped files. The raw source-byte hashes do not match.
- Therefore the handover is buildable, but its “all green / reproducible” claim cannot be accepted until line endings, manifest generation and clean-clone verification agree.

### 2.2 Lighthouse truth

A new Lighthouse desktop attempt was made against production using Chromium and Lighthouse 12.6.1. It did not return a valid report because the isolated browser environment redirected to `chrome-error://chromewebdata/` with `NO_NAVSTART`.

No performance, Best Practices, SEO, LCP, FCP, TBT or CLS score from that run may be treated as a site score. The one partial accessibility number is also not certification. This is an execution-environment failure, not evidence that EONAPP is slow or fast.

W422 itself records that Lighthouse was intentionally skipped and identifies desktop-shell overflow and the EON City fallback as unresolved visual blockers. fileciteturn0file0 fileciteturn0file1

### 2.3 Live product truth

Current public pages still expose too much technical state:

- Home presents voice-recognition language, optional AI setup, guest-data wording and account/backup content around the main prompt. The first screen should be a calm invitation to start. 
- `/apps` initially exposes only a `Loading Apps…` state to a non-JavaScript page reader; its first-render path and hydration need proof.
- `/eoncity` presents a direct-entry preloader, but the deployment evidence and manual review show that the actual City can fall back into an obsolete map/overview experience.
- Profile is an overloaded long-form settings page. It correctly says Google is optional and Sync is inactive, but it should be a compact account/settings experience rather than a public product lecture.
- Vault currently preserves an important security boundary, but it is not a Collection or reveal gallery; it should not be asked to become a generic dashboard.

The public route contents confirm the cluttered Home state, the Apps loading shell, the City preloader, inactive Sync/notifications, and Vault’s security-only purpose. 

---

## 3. The signed-out experience — exact product contract

### 3.1 Home and Chat

On an anonymous visit to `/` or `/chat`:

1. Render the chat shell immediately.
2. Open a compact EONAPP sign-in card after the first stable paint.
3. The card shows one primary button: **Continue with Google**.
4. Selecting it starts the hosted OAuth request and opens Google’s account chooser.
5. The user returns to the exact original route after successful sign-in.
6. An `×` closes the card for the current session only. The signed-out user remains a guest and may write messages immediately.
7. After explicit logout, the next Home/Chat entry opens the card again.

The automatic element is the **EONAPP sign-in card**, not an unsolicited native Google chooser. The primary click is the dependable user gesture that starts OAuth and lets Google show account selection.

### 3.2 Required visual language

Use the interaction pattern visible in the supplied ChatGPT reference: an anonymous workspace remains useful, a quiet sign-in prompt is visibly available, and the account chooser comes after a clear continuation action. ChatGPT’s public signed-out shell currently includes anonymous navigation, pricing, settings, help, and a login prompt in the lower rail; its login flow offers Google as a sign-in option. citeturn305051view5

EONAPP should use its own visual identity, copy and layout, without copying another product’s artwork or branding.

### 3.3 Account state

| State | Top-right control | Lower-left account area |
|---|---|---|
| Signed out / local guest | **Sign in** | Guest, small sign-in prompt, Plans & pricing, Settings, Help, Install EONAPP |
| OAuth in progress | Disabled spinner with cancel-safe state | Guest remains usable; no local work is removed |
| Signed in | Avatar / account menu | Avatar/name, Profile, Settings, Vault & Collection, Install EONAPP, Help, Log out |
| Sync later enabled | Avatar / account menu | Adds **EON Sync** with explicit status, devices and last sync only after actual proof |

There is no “Continue as guest” button. There is no “Google unavailable” state unless the server has a measured, safe error code.

### 3.4 W425 mandatory identity repair

The observed `/profile?account=error` re-login path is a P0 defect. W425 must:

- instrument each safe OAuth failure stage with a redacted code, not a generic `account=error` route;
- preserve an allow-listed original destination;
- test logout → fresh sign-in → account choice → return to origin;
- test an existing session, an expired session, a closed browser, incognito, and a different Google account;
- clear stale identity UI immediately after logout;
- show a calm retry card rather than a disabled unusable button;
- rotate Google OAuth credentials and re-check Cloudflare production configuration before certification;
- verify cookies, PKCE state, nonce, callback handling, D1 identity record and session lifecycle without exposing tokens or secrets.

**Acceptance:** five clean manual runs in the production environment, two devices, and Playwright coverage of all local error transitions. Google identity cannot be marked completed before this passes.

---

## 4. Information architecture — fewer destinations, clearer language

### 4.1 Left navigation

**Primary navigation:**

```text
New chat
Chats
Search
Library
Projects
Apps
EON City
More
```

**Lower navigation for signed-out users:**

```text
See plans & pricing
Settings
Help
Install EONAPP
Guest  ·  Sign in
```

**Account popover for signed-in users:**

```text
Profile
Settings
Vault & Collection
EON Sync                 [only when genuinely active]
Install EONAPP
Help
Log out
```

Settings owns Appearance, language, voice, local AI, notifications, privacy and data recovery. Vault owns encrypted provider-key and recovery controls. Collection is a non-sensitive gallery area reached through the account menu and Library; it must not contaminate Vault’s secret boundary.

### 4.2 Header contract

The chat header must become:

```text
[EONBOT]  New chat / conversation name                         [Mic] [Sign in or avatar]
```

Move voice language, performance mode, model setup, provider state and guide status behind their deliberate settings surfaces. Keep the microphone visible in the composer and header only where it adds a real one-tap action. Share appears only for a user-selected completed result.

### 4.3 Shell repair

W424 must address the screenshot defects before visual polish:

- Use a grid shell: fixed rail + `minmax(0, 1fr)` work area. Do not layer a full-width page beneath a fixed rail and then hide overflow.
- Make exactly one overlay controller responsible for account menus, thread menus, three-dot menus and sign-in cards.
- All popovers start closed. A menu opens only after its own trigger is chosen.
- Outside pointer, Escape, route change, scroll threshold and viewport change close the active overlay.
- Clear stale `open` states from local browser storage during migration.
- Use correct `aria-expanded`, focus trapping for the sign-in dialog, restore focus to trigger, and proper mobile touch targets.

**Acceptance:** no horizontal overflow at 320, 360, 390, 768, 1024, 1280, 1440 and 1920 CSS pixels; every overlay opens/closes reliably; no menu is visible in a fresh screenshot unless a user opened it.

### 4.4 Apps page — product language

Replace internal wording with clear commercial copy:

| Product | Customer-facing copy |
|---|---|
| **EON Forge** | **Build websites & apps** — Turn an idea into a website, web app or working code project. |
| **EON Studio** | **Create images, video & campaigns** — Shape visual concepts, scripts, storyboards, copy and campaign direction. |
| **EON Insight** | **Research & organize** — Turn notes, files and questions into a clear answer or plan. |
| **EON Flow** | **Plan workflows** — Turn repeat work into an approval-first plan. Nothing runs without your approval. |
| **EON City** | **Work inside EON City** — Enter a game-like workspace for projects, tools and missions. |

Technical qualifications belong inside a compact “How this works” disclosure, not on the first card.

---

## 5. Canonical EON City — the flagship contract

### 5.1 User journey

```text
Sidebar EON City → /eoncity → Babylon canvas → arrive in Command District
```

No welcome page. No route chooser. No 2D map. No public Spatial Command Space. No public Immersive Work Mode. No legacy Three.js destination.

City controls live inside the game:

```text
Pause / Settings
Sound / Voice
Graphics quality
Accessibility and motion
Safe mode
Help
EONBOT
Command Deck
```

Full-screen is an in-game choice. Mobile may offer an immersive/fullscreen prompt after the user enters, never before.

### 5.2 Failure behavior

A City failure must not silently become a distorted 2D product page. The canonical `/eoncity` route should attempt:

1. Standard Babylon profile.
2. Safe Babylon profile: lower LOD, simplified effects, reduced texture budget, static lighting.
3. Clear recovery panel only after both fail:
   - **Try Safe mode**
   - **Open support details** with a non-sensitive failure code
   - **Return to Chat**

The accessibility-safe 2D City overview may remain as a manually chosen Recovery Map within settings, not in public navigation and never as the default experience.

Instrument safe boot markers:

```text
CITY_IMPORT_FAILED
CITY_WEBGL_UNAVAILABLE
CITY_ENGINE_CREATE_FAILED
CITY_ASSET_LOAD_FAILED
CITY_CANVAS_MOUNT_FAILED
CITY_FIRST_FRAME_TIMEOUT
CITY_CONTEXT_LOST
```

These markers are local diagnostics by default. They contain no prompts, project text, keys, user files or account tokens.

### 5.3 Retired public surface map

| Current/legacy surface | Decision |
|---|---|
| `/eoncity` | Canonical Babylon City |
| `/eoncity/lite` | Settings-only recovery map, not public navigation |
| `/eoncity/tour`, `/eoncity/3d` | Retire from public build; one-release redirect to canonical City then remove |
| `/eoncity/play` | Retire; its useful controls become the Babylon in-game overlay |
| Three.js renderer/assets | Archive outside public build and service-worker precache |
| Old Realm/Map shortcuts | Redirect to `/eoncity` or the relevant native tool; remove menu references |

### 5.4 Command Deck: real function, not fake screens

The initial in-game Command Deck includes real overlay panels that use the same local state and routes as the web app:

- EONBOT thread
- Projects
- Forge
- Library
- Vault & Collection
- Mission Board
- Settings

Selecting a station opens a functional in-game panel or a deliberate native-route escape with a clear back-to-City action. It never shows a painted fake monitor as a substitute for a working feature.

### 5.5 City art and world plan

The current 58 SVG asset kit is useful source-controlled environmental art, not a final AAA asset library. It must be treated as a bridge kit until actual asset provenance, rights, LOD policy, texture budgets and real-device reviews exist.

**Option A — Living Creator Metropolis (build first)**

- Arrival Gate and transit lane
- Command District exterior/interior
- Creator Atrium
- Forge Bay
- One readable EONBOT companion
- One support/operator droid
- Wet street kit, skyline kit, rain/fog and soundscape
- One useful mission board linked only to real local project state

**Option B — Signal Expeditions (build second)**

- A project may generate a private visual district after the user requests it.
- A `DistrictManifest` contains a project-safe seed, palette, approved task cards and mission state. It never copies prompts, keys, raw files or hidden work into City.
- It starts as a bounded personal zone, not infinite procedurally generated land.

### 5.6 Agent presence and chat bubbles

This vision is valid only when backed by real activity:

```text
EONBOT / agent job → signed job receipt → state event → City AgentSignal → NPC posture/bubble → user can open real detail
```

Allowed initial states:

```text
Planning
Draft ready
Needs your approval
Paused
Completed
Needs attention
```

Default bubbles show only safe activity, e.g. “Draft ready for review.” They do not show prompts, source code, messages, client names, keys, hidden chain-of-thought or raw provider output. Decorative NPC movement must be labelled ambient and never impersonate an active worker.

---

## 6. EONBOT — one truthful action system

EONBOT currently has many surface modules and action-style files. Rebuild the visible system around a single reliable job fabric rather than several overlapping command systems.

### 6.1 One lifecycle

```text
Answer → Draft → Ready for review → Awaiting approval → Completed / Failed
```

An “agent is working” state requires a real `jobId`, defined runner, safe event record and cancellation/retry behavior. Any work that cannot actually execute is a **draft/proposal**, not a running agent.

### 6.2 Core components

- **Intent Router:** chooses Chat, Forge, Studio, Insight, Flow, City or a clearly unavailable capability.
- **Capability Registry:** shows only features that are presently usable and their limits.
- **Tool Adapter:** validates inputs/outputs and never hands secrets to chat.
- **Approval Gate:** required for sending, publishing, payment, deployment, sharing, external connectors or file changes outside a temporary workspace.
- **Receipt Store:** records real starts, results, failures and approvals locally first.
- **Event Stream:** one shared source of truth for Chat, Notification Center, Projects and City agent signals.

No autonomous public posting, external deployment, money movement, secret use, background job or rewards must be represented as ready until separately proved.

---

## 7. Data, Sync, install and notifications

### 7.1 EON Sync

Google login is not Sync. Current Sync remains inactive until the following order is complete:

1. **Sync Basic:** local-first preferences, safe chat text chosen by the user, project metadata, themes and selected output metadata.
2. **Account index:** minimal D1 account/device index; encrypted content blob storage only for opted-in safe data.
3. **Merge:** explicit import/merge choice, conflict copy behavior, tombstones, deletion propagation and device list.
4. **Recovery:** encrypted export/restore and empty-target recovery.
5. **Secure Vault Sync:** separate end-to-end encryption, recovery phrase/device pairing/revocation and loss tests. It is not part of Sync Basic.

Proof matrix: device A/B, online/offline edits, conflict, deletion, sign-out/sign-in, app update, browser clear, restoration and security-boundary review. The live Profile correctly says browser Sync is not active; retain that truth until every proof is complete.

### 7.2 Install EONAPP

“Install EONAPP” means PWA installation where the browser supports it. It must detect capability and present clear platform instructions. Do not display Windows, Android or iOS binary download buttons until those signed packages/store listings genuinely exist.

The PWA plan includes: update notice, defer/update-now control, cache version, rollback evidence, offline shell behavior, local data migration and durable backup before destructive migrations.

### 7.3 Notification Center

Current code contains local notification/push-related utilities but production itself says browser notifications and background push are inactive. Treat the current implementation as non-certified until its user consent, endpoint storage, delivery and unsubscribe path are proved.

Build in this order:

1. In-app Notification Center first.
2. Settings → Notifications explicit opt-in; no permission prompt on first page load.
3. User chooses categories: EONBOT reply, approval needed, project completion, Sync conflict/data issue, City activity, collaboration.
4. Browser/app push only after signed endpoint registration, per-device preference, server delivery evidence, unsubscribe, TTL, error handling, dedupe and cross-device read-state sync.
5. Rate limits, bundling, quiet hours and no promotional marketing notifications by default.

A notification must correspond to a real event, never a fictional reward or agent status.

---

## 8. Vault, Collection, reveals, sharing and referrals

### 8.1 Vault versus Collection

| Surface | Purpose |
|---|---|
| **Vault** | Local encrypted provider credentials, device health, backup and recovery. No collectible marketplace. |
| **Collection** | Visual mementos, project badges and eligible non-transferable reveals. No prices, trading, wallet jargon or claim of ownership chain. |
| **City Gallery** | A City presentation of the same Collection records. It does not invent a separate asset ledger. |

### 8.2 Vault Reveal

A reveal must only appear when a real, defined eligibility event exists. It must be:

- non-paid;
- non-random unless probability and policy are formally defined later;
- non-transferable and not presented as an investment, NFT, marketplace listing or payout;
- auditable as a local mission/event-to-artifact mapping;
- stored safely across upgrade/migration.

### 8.3 Share, invites and referral boundary

**Now:** safe result sharing and link copy, no tracking and no automatic posting.  
**Later:** collaboration invite with named resource, role, expiry, acceptance and revocation.  
**Not yet:** referral rewards, paid credits, coupon time, multilevel trees, payout, token, trading or automatic social distribution.

A referral/Relay system may only enter a pilot after account identity, consent, server ledger, anti-abuse, privacy policy, reversal/support path and explicit commercial review all pass. Until then, hide incomplete reward cards rather than showing a promise users cannot use.

---

## 9. Wave programme and acceptance gates

### Phase A — Truth and first impression

| Wave | Scope | Exit gate |
|---|---|---|
| **W423** | Repair SVG line endings/manifest generator, clean-clone verification, source/bundle evidence truth | 393/393 tests, build, lint, smoke and artifact hashes reproducible on Windows + Linux |
| **W424** | Shell grid, popover controller, menu/overflow repair, service-worker migration | Fresh desktop/mobile screenshots show no duplicate pane, overflow or open menu |
| **W425** | Google identity repair and automatic sign-in card | Logout/re-login matrix passes; no generic account error route; original route restored |
| **W426** | Chat header, guest rail, account menu, Apps copy and first-render | First 60 seconds pass without technical copy or dead/ambiguous controls |

### Phase B — One canonical City

| Wave | Scope | Exit gate |
|---|---|---|
| **W427** | Babylon direct boot, diagnostic markers, Safe Babylon profile | Desktop + Android + iOS target proof of first rendered frame and usable controls |
| **W428** | Public route retirement, Three.js quarantine, 2D map moved to recovery | Sitemap, navigation, service worker and redirect tests identify one public City only |
| **W429** | Functional City Command Deck and native feature panels | All stations open real data/actions; no painted-only monitor substitutes |
| **W430** | Authorised art vertical slice: Arrival, Command, Creator, Forge | Asset provenance/rights/LOD manifest, art review and device frame budgets |
| **W431** | City quality governor, loading, memory and long-session testing | Tiered visual profiles and 30-minute stability proof without destructive cleanup |
| **W432** | Valid browser/Lighthouse/mobile certification | Reproducible LHCI reports plus manual screenshots and interaction proof |

### Phase C — Product systems that may state they are live

| Wave | Scope | Exit gate |
|---|---|---|
| **W433** | EON Sync Basic transport, merge, update-safe data survival | Device A/B proof, conflict/deletion/recovery/rollback tests |
| **W434** | Notification Center and opt-in device notifications | Permission, delivery, unsubscribe, rate limit and cross-device dedupe proof |
| **W435** | EONBOT job fabric, capability truth and receipt/event stream | Every action state maps to a real receipt or clear unavailable state |
| **W436** | Vault/Collection separation, eligible reveal lifecycle | No market/trading claims; migration and persistence proof |
| **W437** | Result sharing + collaboration invites | Resource permissions, expiry, revocation and no tracking/reward leakage |

### Phase D — City grows from real work

| Wave | Scope | Exit gate |
|---|---|---|
| **W438** | Project DistrictManifest and private project district generation | User-approved, deterministic, privacy-reviewed local project district |
| **W439** | AgentSignal NPC/status pilot | Real job receipts only; private data redaction; no fake live-work claim |
| **W440** | PWA install/update and multi-device UX refinement | Update/rollback/data survival on supported desktop + mobile devices |
| **W441** | Action Gateway execution pilot | Explicit approval, scope, receipt, cancellation and failure recovery |
| **W442** | Collaboration and selected connector foundations | Separate consent, least privilege, visible connection health and revoke |
| **W443** | Reward/Telegram/advertising/commerce decision gate | Product-policy, user-consent and provider postback proof; otherwise hidden |
| **W444** | Institutional release certification | Full test matrix, accessibility, Lighthouse, security, source integrity, recovery and manual CEO sign-off |

---

## 10. Performance and Lighthouse programme

No Lighthouse score is valid until the runner records a real page navigation and trace. W432 must run deterministic Lighthouse CI on a supported Chrome environment, not use a failed container run as evidence.

### Required route matrix

- Home — signed out and signed in
- Chat — first visit, active chat, voice controls closed/open
- Apps — first view and tool entry
- Profile/Settings — guest and signed in
- Vault/Collection
- EON City — desktop high, laptop balanced, Android/iOS safe mode
- Support, Privacy, Plans, install flow

### Budgets to certify, not merely hope for

- Home/Chat mobile LCP: **≤ 2.5 s** on declared test conditions
- CLS: **≤ 0.10**
- INP: **≤ 200 ms**
- Route shell must not import Babylon or City art outside `/eoncity`
- City first useful frame and interactive readiness tracked separately by device quality tier
- Long task/resource evidence retained as redacted local QA artifacts, not user telemetry

No green dashboard is accepted without raw HTML/JSON Lighthouse artifacts, browser version, device/network profile, timestamp, deployed commit, route and screenshot.

---

## 11. Non-negotiable release gates

### Gate 0 — Evidence truth

No “complete” claim while any test or source hash fails.

### Gate 1 — First 60 seconds

A fresh guest can write immediately, sees one calm sign-in opportunity, has no stuck menus and understands Apps/City at a glance.

### Gate 2 — Identity

Google login/logout/re-login returns safely and does not claim Sync.

### Gate 3 — City

EON City opens the Babylon world directly on target hardware. It is useful before it is bigger.

### Gate 4 — Work integrity

Every EONBOT/agent/mission/notification status is connected to a real receipt or clearly labelled local draft.

### Gate 5 — Data and devices

Update-safe local state, optional Sync, recovery and notification consent are proved before marketing them.

### Gate 6 — Institutional release

Security, route retirement, accessibility, performance, data survival, manual visual review and release rollback all have evidence.

---

## 12. Immediate Codex work order — only start W423–W425

Do not expand City art, Sync, notifications or agent systems until the first trust defects are closed.

1. **W423** — normalize SVG source bytes and regenerate the art catalog from the exact files shipped; re-run the complete suite from a fresh clone on Windows and Linux.
2. **W424** — repair the desktop grid/overflow and one-overlay menu controller. Add screenshot + interaction tests for both screenshot bugs.
3. **W425** — repair Google re-login, replace generic `account=error` with safe failure/retry handling, remove `Continue as guest`, auto-open the sign-in card on guest Home/Chat, and test logout/re-login end to end.
4. Submit a new evidence bundle with only truthful results: test log, build log, screenshots, manual OAuth matrix, route matrix, raw Lighthouse report or explicit “no valid report” status.

Only after W423–W425 are green may W426 and the direct City rescue proceed.

---

## 13. Final product picture

A new visitor arrives at EONAPP, can begin immediately, sees a clean one-click Google sign-in opportunity, understands what each workspace does, and enters EON City without choosing between obsolete modes.

Inside City, the user has a real beautiful command world—not an explainer—with EONBOT, Projects, Forge, Library, Vault/Collection and missions. The world grows with real projects. Later, real approved jobs appear as safe City signals and companion activity. Every layer remains local-first, clear about account versus Sync, deliberate about notifications, and precise about what is actually live.

That is the correct standard: **calm enough to understand in seconds, polished enough to want to stay, and truthful enough to trust with work.**

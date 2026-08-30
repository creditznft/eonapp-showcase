# EONAPP Unified Product Masterplan — UX, Identity, Sync, Voice, Share and EON City

**Decision date:** 2026-06-28  
**Status:** CEO-approved direction for the next coding cycle  
**Core product:** Chat-first AI creator/developer workspace with an optional flagship game-like world.

---

## 1. Product standard

EONAPP must feel as easy to begin as a leading chat app:

- open → type or speak → get guidance → make something;
- guest use works immediately;
- account is optional until the user wants identity or Sync;
- settings stay out of the primary work flow;
- City is an optional premium workspace/game mode, never a requirement for basic work.

EONAPP must not imitate another product’s exact screen design, labels, branding or assets. Copy the principles: clear hierarchy, compact account menu, predictable modals, short actions, and no surprise friction.

---

## 2. UX-1 — Simple guest-to-Google sign-in

### Product decision

A first-time visitor does **not** see a visible random account. Internally the browser may create a local device/guest workspace identifier, but the user sees only **Guest**.

The primary entry points are:

- top-right header: **Sign in**;
- bottom-left account chip: **Guest · Sign in**;
- optional contextual prompt only after the user chooses an account-only action.

### Required flow

1. User clicks **Sign in**.
2. A compact modal opens, not the Profile route.
3. Modal contents:
   - heading: `Sign in to EONAPP`
   - primary: `Continue with Google`
   - secondary: `Continue as guest`
   - short privacy line: `Your current work stays on this device. Sync is optional and comes later.`
4. Primary click begins the existing OAuth redirect. Google shows its official account chooser.
5. On callback, return to the previous EONAPP screen with a signed-in account chip.
6. Never show Backup/Vault/Sync requirements during sign-in.
7. If OAuth fails or is unavailable, show an honest inline error and retain the guest path. Do not expose technical configuration jargon.

### Account menu after sign-in

Compact popover only:

- Profile
- Settings
- EON Sync (shown as `Coming soon` until W411/W412 proof)
- Help
- Log out

Guest popover:

- Continue with Google
- Continue as guest
- Help
- Privacy and Terms

### Settings and Profile

- **Settings** is one modal with tabs: General, Appearance, Voice & language, Local AI, Data & Sync, Connected Apps, Privacy & security, Billing (later).
- **Profile** is a smaller modal: display name, avatar, account status, sign out / deletion area.
- Help, Terms, Privacy and support open clean destination pages or external links; they do not occupy permanent sidebar space.

### Acceptance test

A fresh user can reach Google’s account chooser in two deliberate clicks or fewer from the first screen, without reading a backup warning or scrolling Profile.

---

## 3. W411/W412 — EON Sync: build it honestly and in layers

### Rule

Google Login is **identity/session access**. It is not Sync, backup, a password manager, or proof that local data is already stored in the cloud.

### Layer 1: EON Sync Basic (first cross-device release)

Scope:

- user preferences, theme, selected language, chat metadata and text conversations the user elects to sync;
- project metadata and safe text assets;
- Share Pack / Remix Card metadata;
- no local AI model binaries, raw uploaded media, unencrypted API keys, recovery keys, or browser-only caches.

Architecture:

- browser remains offline-capable local-first using IndexedDB;
- each record has `id`, `type`, `updatedAt`, `version`, `originDeviceId`, `deletedAt`, and a deterministic content hash;
- D1 stores identity and record index/metadata;
- R2 stores encrypted large safe blobs only when needed;
- Pages Functions provide authenticated, idempotent sync endpoints;
- use per-record last-write-wins only for low-risk preferences; text projects use revision conflict copies rather than silent overwrite;
- deletion creates a tombstone retained long enough to sync deletion across devices;
- device list and last sync time visible in Settings.

User flow:

1. User signs in.
2. A non-blocking banner says `Sync this device?` with `Turn on EON Sync` and `Not now`.
3. Confirmation summarizes exactly what Layer 1 includes and excludes.
4. Existing local guest work is imported only after explicit user confirmation.
5. A second device signs in and sees a clear import/merge choice if it already has local work.

### Layer 2: Secure Vault Sync (later; separate release)

Scope: selected Vault entries and sensitive user-configured API credentials only.

Requirements before release:

- client-side end-to-end encryption;
- user-controlled recovery/passphrase or secure device-pairing design;
- no server-visible plaintext secret values;
- device revocation;
- encrypted export/recovery kit;
- deliberate restore test on an empty target device;
- threat model and deletion retention policy.

Do not silently upload secrets under an “automatic Sync” label.

### Layer 3: Media / project output sync (later)

- final media output only after user saves it;
- previews, proxies, source downloads and render caches expire automatically;
- choose per-project retention and storage quota;
- no hidden large media upload.

### Required Sync proof

- two browsers/devices, fresh profile and existing guest profile;
- sign-in, explicit migration, offline edit, reconnect, conflict behavior, delete propagation and sign-out;
- data recovery/rollback on a separate empty target;
- screenshots plus redacted logs;
- no claim of “seamless” until this proof is complete.

---

## 4. W394C — Voice and language for non-technical users

### Current source mismatch to repair first

The source currently has:

- product UI/i18n packs for English plus ten translated languages: Spanish, German, French, Portuguese, Russian, Arabic, Hindi, Chinese, Japanese and Korean;
- voice preferences that currently list Auto plus English, Hindi, Spanish, Portuguese, French, German, Arabic, Bengali, Russian, Indonesian, Japanese and Korean.

Do not market “11 languages” until this mismatch is reconciled. The next coding session must create one versioned **language matrix** shared by UI, speech recognition, Guide Mode, tests and settings.

### Recommended launch language matrix

Use 11 full-product languages first:

1. English
2. Hindi
3. Spanish
4. Portuguese (Brazil)
5. French
6. German
7. Arabic
8. Russian
9. Japanese
10. Korean
11. Chinese (Simplified)

Add Bengali and Indonesian only after their UI/Guide copy reaches the same level. This is better than pretending their voice recognition alone makes them full supported languages.

### Voice UX

- visible microphone beside the composer send button;
- `Auto` is default and uses browser/UI language plus recent user-selected language as a hint;
- Auto must never silently change a user’s manual selection;
- manual language selector remains one tap away;
- recognizer uses browser speech APIs only where supported;
- unsupported browser: mic disabled with a concise explanation and text fallback;
- no audio recording archive; transcript becomes normal chat text only once the user sends it;
- language metadata is minimal and local/synced only with user consent;
- Guide Mode uses translated deterministic instructions when no local/API model is configured;
- when a connected/local AI model is available, prompt it to answer in the selected/detected user language;
- do not pretend local Guide Mode understands open-ended speech without a model.

### Guide Mode jobs for first-time non-English users

- start a chat;
- attach a file;
- create a visual or short video plan;
- open Creator / Forge;
- set up Local AI;
- add a user API provider;
- create a Share Pack / Remix Card;
- open EON City;
- get support.

---

## 5. Share, Remix, collaboration and viral growth

The viral object is the completed useful creation, not a generic referral URL.

### Attach EON Share to these completion moments

- image / visual output;
- video plan or completed exported video;
- Forge website preview;
- creator campaign brief;
- caption/hook/storyboard kit;
- template or prompt starter;
- City postcard / milestone;
- selected public project snapshot.

### Actions

- Download/export;
- native device share;
- copy public-safe link;
- create Remix Card;
- invite collaborator;
- optional `Made with EONAPP` attribution;
- later: one clearly disclosed Relay invite attribution, only once the separate backend is approved.

### Non-negotiable boundaries

- never auto-post;
- never share private chat/Vault/project data;
- no click farming, cash, crypto, resale, payout, coupon or subscription-time reward;
- referral attribution needs the dedicated `EON_RELAY_DB`, signed-in inviter, explicit invitee acceptance, anti-abuse review and policy approval;
- rewards remain locked until a separate pilot is proven.

---

## 6. EON City Flagship — selected combined roadmap

### Decision

Build both concepts, sequentially:

- **Option A first:** `EON City — Living Creator Metropolis` is the persistent flagship hub.
- **Option B second:** `EON Signal Expeditions` are project-linked, finite procedural worlds launched from the hub.

Do not build a generic infinite cube city. Do not build an unbounded open world first.

### Option A — Living Creator Metropolis

A crafted cyberpunk creator city where real work changes the user’s environment.

Core districts:

1. **Arrival Gate / Command District** — EONBOT, mission board, projects, return-to-work.
2. **Creator Atrium** — image/video workflows, Share Pack, Remix station, creator boards.
3. **Forge Bay** — code, web builds, previews, project launch.
4. **Signal Tower** — social draft/publishing preparation, campaign brief, creator relay later.
5. **Automation Observatory** — automation review and safe task proposals.
6. **Archive Gardens** — Collection, milestones, personal workspace customization.

User modes:

- Work Sprint: 1–5 minute focused path to a real EONAPP task.
- Explore: optional walking, weather, companion NPCs and rotating city moments.
- Creator Mission: a real project step represented as an in-world route.
- Return: outcomes appear as tasteful, non-sensitive display changes.

The City must never gate core chat work. It is a premium optional workspace mode.

### Option B — EON Signal Expeditions

Each meaningful project may open a finite themed Signal Realm:

- campaign project → media district;
- Forge website → build citadel;
- video project → cinematic studio world;
- automation → data observatory.

Each expedition is 5–15 minutes, generated from **authored modules and set pieces**, not arbitrary primitives. Project seed controls variation, but asset composition follows an art-directed grammar. Completing productive steps creates a shareable project postcard/Remix Card, then returns the user to the permanent City.

### Art quality standard

- Engine: one public canonical Babylon City at `/eoncity`.
- Style: midnight neon atelier, wet streets, dark graphite/navy architecture, glass/metal contrast, cyan/violet/mint accents, restrained bloom, rain/fog, skyline depth and readable signage.
- Asset source: commissioned/original or properly licensed assets only, documented in a provenance manifest.
- Export format: optimized GLB with KTX2/Basis textures, mesh instancing, LOD tiers, light baking where suitable, quality governor and mobile fallback.
- Core visual kit: real street kit, sidewalks, lamps, signs, facade modules, interiors, hero Command Deck, Creator Atrium, Forge Bay, skyline modules, vegetation/props, weather particles and 4–6 readable companion/NPC variants.
- Procedural systems only vary weather, ambient traffic, distant skyline arrangement, alley dressing and expedition layouts. They do not substitute for authored hero art.

### Gameplay standard

- Real work creates missions; no fake productivity grind.
- No random paid rewards, gambling mechanics or pay-to-win.
- City progression is cosmetic/presentation/workspace personalization first.
- Daily/weekly rotating missions must be useful creator/developer goals, not empty click tasks.
- First session must be beautiful within seconds, then offer an understandable task within one interaction.

### City implementation waves

- **W406A:** deploy W405, actual keyboard/mouse/touch/pause/reset proof, route/cache proof and screenshot catalogue.
- **W406B:** asset/art intake: licenses, provenance, art bible, GLB/KTX2/LOD budgets, mobile fallback and build pipeline.
- **W407:** authored Arrival District: gate, street, Command Deck exterior, skyline, rain, one companion NPC and clear first mission.
- **W408:** Creator Atrium and Forge Bay authored districts with genuine EONAPP entry points.
- **W409:** NPC behaviors, weather/day/night, ambient life, mission board and quality governor.
- **W410:** desktop/midrange/mobile visual and control certification.
- **W411/W412:** EON Sync Basic and secure Sync/Vault planning in parallel, not hidden inside City.
- **W413+:** Signal Expeditions project-world templates after Option A is visually and interactively proven.

---

## 7. Exact coding order for the next session

### Phase UX

1. **UX-1** — replace W405 sign-in acknowledgement/profile detour with the simple sign-in modal.
2. **UX-2** — sidebar/icon tooltips, anchored Search/More/Account menus, Profile modal, Settings modal and Apps gallery.
3. **UX-3** — visible composer microphone, shared language matrix, Auto/manual behavior and same-language Guide Mode.

### Phase trust and Sync

4. **W406A proof** — deploy and prove real Google OAuth/Cookie session, desktop/mobile City controls, legacy redirect and W276 rollback/restore.
5. **W411 design/code** — Sync Basic data schema and local migration surface; do not enable it.
6. **W412 proof** — actual two-device Sync Basic proof, then decide public release.

### Phase creator growth

7. **Share-2** — attach Share Pack / Remix Card / collaboration actions to completed creator and Forge outputs.
8. **Relay tracking-only** — only after identity proof and `EON_RELAY_DB` are provisioned; still no rewards.

### Phase City flagship

9. **W406B** — asset/art kit and pipeline.
10. **W407–W410** — authored City build/proof.
11. **W413** — Signal Expeditions only after the hub meets its visual standard.

---

## 8. Features that remain locked

Do not activate these during the next UX/City pass:

- EON Relay rewards/grants;
- Collection/Vault Reveal grants;
- social OAuth, token custody, scheduling or posting;
- GitHub/Cloudflare deployment for user projects;
- Action Gateway execution;
- payment/subscription checkout;
- unreviewed cloud sync of Vault/API credentials;
- any legacy blockchain/NFT/marketplace feature.

---

## 9. Definition of done

The next development cycle is successful only when:

- guest-to-Google flow takes two deliberate clicks or fewer and is live-tested;
- no user sees a backup instruction during authentication;
- Chat sidebar/modal/account behavior is clean on desktop and mobile;
- microphone and language settings are visible and honest;
- one language matrix is shared by UI, Guide and speech settings;
- meaningful output types expose Share/Remix actions;
- legacy City route/caches no longer surface as a second product;
- City keyboard/mouse/touch input is demonstrated on real devices;
- no public wording calls current City AAA before authored art and visual proof exist;
- each completed wave includes source tests, build/smoke/site checks, screenshots, manual proof notes and a fresh lean handover.

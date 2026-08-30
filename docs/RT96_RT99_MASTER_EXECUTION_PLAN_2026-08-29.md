# EONAPP RT96–RT99 MASTER EXECUTION PLAN — 2026-08-29

## Authority

- Frozen Production baseline: RT95
- Commit: `4d09eba31704b3fb25e41a5cdeb72702ac703825`
- Tree: `7731d852448f0cabdb2a1f9817af861115200887`
- Source archive verified locally: 6,265 files
- RT95 baseline remains untouched.
- All work below is local in RT96_WORK until a separately approved protected release.

## Product/economics principle

EONAPP should monetize one visitor through several compliant layers rather than depend on manipulated ad CTR:

`traffic -> useful guide/tool -> optional AdSense view -> EONBOT/Vexrail engagement -> optional sponsored discovery/reward -> sign-in/return -> subscription`

AdSense pages target legitimate commercial-intent subjects. They must never encourage, force, disguise, or manufacture ad clicks. The optimization target is contribution per visitor, not raw CTR.

## Current RT96 work already completed locally

1. Active EON City mobile entry uses analogue movement; four-arrow D-pad is fallback only.
2. W731 adaptive quality can recover after sustained performance headroom with hysteresis.
3. Ordinary display/banner ads are product-disabled; Sponsor Terminal remains separate.
4. Local AI public explanation was expanded and low-value Status was removed from index/sitemap.
5. Production Vexrail country config is locally revised to `US,CA,GB,DE,IN`.
6. India-focused Vexrail/readiness tests: 54/54 PASS.
7. `/guides/` is now a first-class acquisition surface with catalog/build/SEO authority.
8. Four hero pages exist, each with a real utility and >1,200 static words:
   - AI API Cost Calculator
   - Local AI Hardware Checker
   - Local AI vs Cloud AI vs BYOK
   - AI for Small Business ROI/Workflow Planner
9. Editorial Policy and Advertising/Sponsorship Disclosure exist and are routable/indexable.
10. Guide -> EONBOT handoff now uses a review-first draft path; it does not auto-send prompts.
11. Focused guide/SEO tests: 11/11 PASS.

---

# PHASE 1 — ADSENSE REAPPLICATION CANDIDATE (NEXT)

## 1A. Expand the content estate before reapplying

Build 12–20 high-value supporting guides around the four hero pages. Do not generate hundreds immediately. Each published page needs an original purpose, substantial useful text, current sources for changing facts, related internal links, authorship/editorial metadata, and a useful EONBOT draft CTA.

### Cluster A — AI API economics / BYOK

- Cheapest AI APIs in 2026: methodology-led comparison
- OpenAI vs Claude vs Gemini vs Mistral API cost comparison
- AI token pricing explained
- How much does an AI chatbot cost to run?
- How to reduce AI API costs without destroying answer quality
- BYOK AI: complete guide
- How to store AI API keys safely
- Multi-model routing: cost vs quality

### Cluster B — Local AI / hardware

- 8 GB vs 16 GB vs 32 GB RAM for Local AI
- How much VRAM does Local AI need?
- Best laptop specifications for Local AI
- Can an older laptop run Local AI?
- Local AI on Android: realistic limits
- CPU vs GPU for Local AI
- What is WebGPU and why does it matter for browser AI?
- Ollama vs LM Studio vs Jan vs browser Local AI
- AI model storage/download guide

### Cluster C — Business / commercial AI

- AI automation cost for small business
- How to choose an AI stack for a small business
- Private AI for small business
- AI workflow ROI guide
- AI agents vs simple automation
- Local AI vs cloud AI for business data

### Cluster D — EON City/browser technology using first-party evidence

- Why 3D browser apps slow down on phones
- WebGL vs WebGPU for interactive 3D
- How browser asset caching works
- How PWAs improve mobile 3D experiences
- How EON City adapts visual quality to device performance

## 1B. Publishing-quality gate

Before a page becomes indexable:

- original value/utility or first-party methodology
- no keyword stuffing
- no mass template with merely swapped nouns/cities/models
- no unsupported superlatives or fake test results
- no copied provider descriptions
- changing prices/specs have source notes and `updated` date
- substantial explanatory body, generally 1,200–3,000+ words for cornerstone/commercial pages where the topic merits it
- headings answer real user questions naturally
- useful comparison tables/calculator/checklist when appropriate
- author/editorial identity
- related guides and breadcrumb
- review-first EONBOT CTA
- no active AdSense unit before approval

## 1C. Add trust/quality infrastructure

Audit/complete:

- About
- Contact/support path
- Privacy
- Terms
- Editorial Policy
- Advertising/Sponsorship Disclosure
- corrections/update process
- author/editor identity
- sitemap/robots/canonicals
- article/FAQ/Breadcrumb structured data only where truthful
- OG/social metadata
- clear navigation from home and guides
- broken-link check
- duplicate-title/meta check
- mobile readability
- noindex low-value account/app/status/utility shells that do not provide search value

## 1D. AdSense code readiness

Keep account ownership meta, `ads.txt`, CMP/consent and policy infrastructure correct, but keep actual display units OFF until approval.

Design future ad slots only on substantial editorial pages. Keep them clearly separated from:

- EONBOT buttons
- calculator controls
- download/play controls
- City gameplay
- navigation
- rewarded-video controls

After approval, initially activate only a conservative set of content placements and optimize on verified RPM/viewability/contribution, never manipulated CTR.

## 1E. AdSense reapplication gate

Reapply only after:

- at least the first coherent cornerstone + support clusters are live and linked
- all public pages are finished
- no broken navigation/placeholders
- mobile performance/readability is acceptable
- CMP/privacy checks pass
- sitemap/canonicals/indexability audit passes
- content QA passes

Exact approval cannot be guaranteed; this plan maximizes legitimate readiness.

---

# PHASE 2 — EON CITY PORTRAIT / GAME-STUDIO QUALITY REBUILD

This begins immediately after the AdSense reapplication candidate is ready/submitted, while review is pending.

## 2A. Root causes already identified

1. Release identity/debug digest is a fixed ultra-high-z-index gameplay overlay.
2. Mobile onboarding is still a multi-button card occupying a large fraction of short portrait viewports.
3. Secondary City actions remain distributed across multiple floating/legacy owners rather than one mobile command surface.
4. Accessible Map/Nexus/Menu/EONBOT still contain desktop-card behavior on small screens.
5. Active entry historically rendered a four-arrow D-pad instead of the existing analogue system; first slice already repaired locally.

## 2B. New mobile composition

### Permanent gameplay layer

- compact top bar: district/context + Menu + EONBOT only
- left analogue joystick
- right drag/look zone
- context Interact/Action button
- optional sprint/run control
- nearby prompt only when relevant

### Everything secondary moves to one command menu/sheet

- Explore Worlds
- Nexus
- Relay
- Accessible City Map
- Restart 3D
- visual/performance profile
- fullscreen/immersive entry
- Help
- Settings
- diagnostics/release provenance

## 2C. Portrait hard requirements

Test at 320x568, 360x640, 360x800, 375x667, 390x844, 412x915, 430x932 with browser chrome expanded/collapsed, Android nav/gesture bars, safe areas, keyboard, resize and orientation changes.

Target: zero critical overlap and no requirement to rotate to landscape.

## 2D. Controls

- simultaneous move + camera + action multitouch
- joystick deadzone/sensitivity
- right-thumb camera exclusion zones around buttons
- pointer-cancel and background/resume cleanup
- no stuck movement states
- no browser scrolling/pinch conflict during active gameplay
- keyboard/mouse remain supported

## 2E. Modal/surface authority

One major surface at a time:

- Menu
- Nexus
- EONBOT
- Relay/Travel
- Accessible Map

Opening a surface suppresses gameplay input correctly. Close/back restores focus and controls safely.

## 2F. Onboarding

Replace the large three-button welcome panel with a compact contextual tutorial/status sequence. Auto-reduce after the player moves/interacts. Do not cover the world with a desktop-style card.

## 2G. Diagnostics

Preserve release provenance but hide it in normal play. Expose it through Diagnostics/support mode only.

---

# PHASE 3 — EON CITY DEEP RUNTIME QUALITY

## 3A. Character-ready invariant

Do not enable movement until mesh, skeleton, required animation groups and bindings are verified. Cold-boot first movement must never slide a static character.

Test idle/walk/run transitions, refresh, re-entry, travel, restart, background/resume and WebGL recovery.

## 3B. Warm-start/cache proof

Instrument actual transfer rather than guessing from loading screens:

- transfer bytes
- service-worker/cache hits where observable
- GLB/texture fetch source
- first-frame/player-ready/animation-ready/first-playable times
- cold vs warm visit
- duplicate requests

Use immutable caching only for content-versioned/hash-addressed assets.

## 3C. Weak-device adaptive quality

Preserve player/UI clarity first. Degrade in this order where feasible:

1. post-processing
2. shadows
3. reflections
4. particles
5. distant NPCs
6. resident districts
7. environment complexity/LOD
8. distant textures/animation frequency
9. renderer resolution last

Use sustained performance evidence and hysteresis, not constant oscillation.

## 3D. Full game audit

- camera/FOV/occlusion
- collisions/floor/stairs/ramps/unstuck
- all districts/spawns/travel/return
- NPC animation/interaction/culling/cleanup
- lighting/material/scale coherence
- loading transitions
- EONBOT companion behavior
- audio/haptics where appropriate
- memory/resource disposal
- duplicate listeners/render loops/timers/audio contexts
- WebGL context loss/recovery

## 3E. RT96.5 quality gate

Certify desktop, weak Android, mid Android, portrait, landscape, touch, mouse/keyboard, cold/warm launch, district traversal, move+look+action, dialogs, EONBOT, suspend/resume and context recovery before Production.

---

# PHASE 4 — LOCAL AI + BYOK MONETIZATION (RT97)

## 4A. Preserve privacy boundary

Local AI inference stays local. BYOK keys/prompts go only to the provider explicitly selected by the user. Neither path is silently forwarded into Vexrail.

## 4B. Add optional Sponsored Discovery

This is a separate, explicit user action, not part of normal Local/BYOK inference.

Flow:

1. User asks for a product/service/web recommendation or taps `Sponsored Discovery`.
2. EONAPP creates a minimal commercial-intent draft.
3. User sees/reviews what will be sent.
4. Only that minimal intent is sent as a new signed-in one-turn request through EONAPP’s existing server-side Vexrail authority.
5. Do not send the full local/BYOK conversation, the Local/BYOK answer, local model state, memory, API key, files, attachments or raw private history.
6. Reuse Vexrail Turnstile, selected-country policy, verified-cheapest model routing, rate limits and profitability governor; never consume the guest one-shot.
7. Return the Vexrail completion in a visually separate `Sponsored Discovery` card and safely expose only HTTPS links. Vexrail may weave a contextual promoted recommendation into that answer when inventory is relevant; EONAPP does not fabricate a second ad payload.
8. Sponsor never changes the primary Local/BYOK answer, and a `Strict Local` preference can hide Sponsored Discovery entirely.

## 4C. Monetize the workspace around free/local inference

Potential paid/rewarded value:

- cross-device encrypted sync
- larger/advanced memory
- hosted web research
- advanced agents
- scheduled automation
- collaboration/workspaces
- cloud backup/continuity
- voice/cloud services
- advanced file processing
- model-management convenience
- temporary rewarded unlocks

Do not silently mark up the user's BYOK token bill.

## 4D. Adaptive Mobile Local AI

Keep reviewed Lite/Balanced tiers, capability testing, explicit downloads, model persistence, storage pressure handling, WebGPU/WASM fallback and local-only failure behavior. No silent cloud fallback.

---

# PHASE 5 — SPONSORED EONBOT / VEXRAIL

## 5A. Country policy

Local RT96 source currently enables `US,CA,GB,DE,IN` for Vexrail eligibility. Production remains unchanged until protected release.

## 5B. Sponsored EONBOT separation

Normal EONBOT answer remains independent. A separately labeled sponsored recommendation may appear only when eligible and actually supplied/proven.

Track:

- request/session IDs
- eligible country
- provider/model cost
- sponsored-result evidence class
- sponsor impression/click evidence only when real
- frequency caps
- source/campaign attribution
- no raw prompt/response telemetry

Do not equate provider transport success or DOM rendering with revenue.

---

# PHASE 6 — REWARDED VIDEO

## 6A. Short-term provider approach

Audit/test the already-available ExoClick rewarded/VAST path first because account/integration history already exists. Treat browser completion as insufficient authority for valuable permanent rewards unless independently provider-authenticated.

Use:

- unique reward session
- nonce/idempotency
- expiry
- anti-replay
- caps
- small/non-transferable rewards until callback authority is strong

## 6B. AppLixir

Strong technical fit for web rewarded video and server-authoritative callback design, but traffic/account/work-email eligibility may delay approval. A professional `@eonapp.ch` mailbox can solve the work-email presentation problem without inventing a company.

## 6C. Later demand partners

Evaluate AdInPlay/Venatus and Google rewarded web once traffic/eligibility makes sense. Do not add intrusive popunder/push publisher formats merely because approval is easy.

---

# PHASE 7 — ACQUISITION / HERO-PAGE ECONOMICS (RT98–RT99)

## 7A. Four primary paid-traffic hero surfaces

1. AI API Cost Calculator
2. Local AI Hardware Checker
3. Local vs Cloud vs BYOK Decision Guide
4. Small-Business AI ROI/Workflow Planner

These pages are selected because they combine legitimate advertiser demand with a natural EONAPP/EONBOT use case.

## 7B. Paid Native/Push campaign design

After AdSense approval and analytics readiness:

- one source
- one country
- one page
- one creative family
- small controlled budget first
- exact UTM/source tracking
- ClickAdilla/other network price/campaign/click/spot tokens where supported
- conversion postbacks for real signup/subscription events

Do not buy traffic from traffic exchanges or incentivize Google-ad clicks.

## 7C. Profit equation

`contribution_per_visitor = verified AdSense revenue/visitor + verified sponsored/Vexrail revenue/visitor + verified rewarded revenue/visitor + expected subscription contribution/visitor - Vexrail variable cost/visitor - other variable reward/provider costs/visitor`

`break_even_CPC = contribution_per_visitor`

`break_even_CPM = contribution_per_visitor * 1000`

Scale only after the measured contribution exceeds acquisition cost with enough observations to trust the result.

## 7D. Hero-page optimization target

Optimize:

- paid click -> engaged reader/tool user
- guide -> EONBOT draft CTA
- EONBOT -> valid sponsored opportunity when eligible
- sign-in
- return visit
- subscription
- AdSense RPM as secondary revenue

Do not optimize page layout around manufacturing Google ad CTR.

---

# PHASE 8 — CONTENT SCALE TO 50 / 100 / HUNDREDS

Only after the first clusters prove search demand and quality.

Use a catalog-driven publishing system with templates for structure, not templated low-value prose. Every URL must justify its existence. Programmatic pages require meaningful unique data/utility/methodology rather than keyword substitutions.

Possible later scalable datasets:

- model/provider price history
- cost scenarios
- hardware capability profiles
- EONAPP first-party device benchmark observations
- model fit matrices
- workflow ROI scenarios
- updated AI privacy/security explainers

Auto-unpublish/noindex stale pages that cannot be maintained accurately.

---

# RELEASE ORDER

## Immediate local coding

1. Finish AdSense content Wave 2 (12–20 support guides + author/corrections/trust QA).
2. Run full crawl/SEO/content/CMP/mobile-readability gate.
3. Prepare AdSense reapplication candidate; actual submission remains a deliberate account action.
4. Begin EON City portrait/HUD authority rebuild.
5. Character-animation boot race + cache/warm-start instrumentation.
6. Weak-device/game quality/deep district audit.
7. RT96.5 physical device certification.
8. RT97 Local/BYOK Sponsored Discovery + adaptive Mobile Local AI.
9. Rewarded provider hardening/application path.
10. RT98/RT99 controlled paid traffic and profitability scaling.

## Production discipline

No direct Production deployment from this workspace. Preserve exact source -> CI -> predeploy -> immutable candidate -> Preview -> physical acceptance -> same bytes to Production -> provenance/receipt -> rollback authority.


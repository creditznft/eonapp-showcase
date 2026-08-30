# EONAPP Master Remaining Wave Plan — W476 through W480

**Updated:** 2 July 2026  
**Source baseline:** W476-A6 API/CSP/SBOM/release evidence complete; W476-B source tooling added.  
**Release truth:** no source pass, deployment, browser report or Codex handoff is a public-release approval. Dodo is intentionally blocked until W479.5.

This is the controlled roadmap from today to the first eligible payment implementation. It consolidates the previously approved sequence and the Local Creator Media programme so no critical proof, cleanup or creator capability is silently dropped.

## Non-negotiable launch boundaries

- Public core: local-first EONBOT workspace, Projects/Library/Forge, optional BYOK/provider setup, encrypted portable recovery, EON City as visual workspace, Research Lab with no live trading/execution/advice, manual privacy-safe sharing and optional help/onboarding paths.
- Never enable before the approved later gates: payments, Dodo checkout, trial, entitlement, rewards, ads/offerwalls, Telegram rewards, broker/trade execution, prediction/staking, crypto/wallets/tokens/NFT resale, referral payout, browser push, social auto-posting, automatic external actions, cloud Vault custody or local image/video claims without their own adapter proof.
- Every production claim requires separately labelled evidence: source validation, Cloudflare deployment, public edge probe, browser/device proof, manual operator review and human owner GO/NO-GO.

## W476 — release safety foundation

### W476-A1 — storage truth
**State:** completed source wave.  
**Purpose:** define storage ownership, migration facts and survivability boundaries.  
**External proof still needed:** real update/rollback and data survival on devices.

### W476-A2 — Vault and portable state contract
**State:** completed source wave.  
**Purpose:** local custody, encryption/portable backup boundaries and no-cloud-secret truth.  
**External proof still needed:** encrypted backup/restore with disposable test data and loss/rollback behavior.

### W476-A3 — Service Worker update and cache safety
**State:** completed source wave.  
**Purpose:** cache/update contract, recovery behavior and safe client adoption.  
**External proof still needed:** installed PWA update, stale-cache detection, rollback and retained user state.

### W476-A4 — safe measurement/GA bridge and privacy copy
**State:** completed source wave.  
**Purpose:** default-off, consent-led analytics boundary; clear privacy text.  
**External proof still needed:** confirm no analytics request before consent and correct opt-in/out behavior in a real browser.

### W476-A5 — Local AI provider and browser policy
**State:** completed source wave.  
**Purpose:** current text provider compatibility guards plus the only supported browser-local text runtimes: user-triggered Ollama, LM Studio and Jan on reviewed loopback ports.  
**External proof still needed:** browser CORS/PNA, model discovery/self-test/one harmless response and no-cloud-fallback proof for each runtime.

### W476-A6 — API/CSP/SBOM/origin/release evidence
**State:** completed source wave.  
**Purpose:** explicit 18-Function contract, negative matrix, CSP Reporting API collection/redaction, SBOM/audit, origin inventory and release boundaries.  
**External proof still needed:** deployed headers, CSP browser delivery/log redaction, function matrix, runtime network evidence and cleanup classification.

### W476-B — reviewed preview/production browser proof
**State:** source tooling complete; capture is open.  
**Purpose:** turn W476 source contracts into redacted, opt-in public HTTP, CSP, Function and Chromium evidence without storing private information.

**Required sub-gates:**

1. **B0 — exact-source deploy preflight:** clean branch, manifest, checksum, Node 22 validation and reviewed Cloudflare preview.
2. **B1 — document/header matrix:** `/`, `/chat`, `/profile`, `/local-ai`, `/eoncity`, `/insights` prove expected markers and CSP reporting headers.
3. **B2 — CSP collector transport and human log review:** accepted same-origin non-critical synthetic report, foreign document rejection, authorised redaction-only verification.
4. **B3 — safe Function and negative-method matrix:** automated safe reads/wrong methods; manual preview-only configured/unconfigured, cross-origin and malformed cases. OAuth is never started by the runner.
5. **B4 — browser network-origin observation:** record only origins/resource types, compare with W476-A6 inventory and classify every unexpected origin.
6. **B5 — Local AI text runtime proof:** Ollama, LM Studio and Jan each complete scan, discovery, self-test, harmless response, failure/no-fallback, blocked-LAN/wrong-port evidence.
7. **B6 — privacy bridge proof:** default-off analytics/no remote request before consent; opt-in/out is truthful.
8. **B7 — update/rollback/data-survival drill:** disposable PWA/device proof of update, rollback and encrypted portable recovery.
9. **B8 — evidence review:** owner reviews redacted result rows and records NOT PASS items. W476-B never grants final release approval.

**Exit:** evidence is complete enough to start W477 cleanup. Any unknown origin, console error, runtime failure or missing proof remains an explicit blocker.

## W477 — canonical routes, search and legacy retirement

**Purpose:** remove legacy path confusion and reduce the attack/performance surface only after W476-B tells us what is actually used.

1. **W477-A — canonical route map:** verify `/`, `/eoncity` and `/insights` as the canonical public destinations; route aliases only redirect to their designated destination.
2. **W477-B — redirects, sitemap and robots:** inspect deployed redirects, canonical URLs, titles, structured data, sitemap, robots rules and 404 handling; avoid indexing retired pages.
3. **W477-C — legacy quarantine:** move unused code/HTML/assets to a reversible quarantine first. No automatic deletion. Rebuild and rerun current tests.
4. **W477-D — external/local origin retirement:** classify every W476-A6 candidate origin from real network observations. Remove obsolete local endpoints and third-party literals; do not add arbitrary LAN boxes.
5. **W477-E — CSP reduction:** only after runtime evidence, replace broad `https:` allowances with narrowly justified origins where safe. Repeat browser/runtime proof after each tightening.
6. **W477-F — public output verification:** crawl exact deployed routes, cache behavior, clean-route emission and source-import fence. Review before final deletion.
7. **W477-G — Local AI beginner-setup bridge (source foundation):** EONBOT begins with a human goal rather than a runtime name, uses only local browser capability hints after the user opens setup, suggests one conservative reviewed local-text route, and opens official installer/model pages only after a deliberate tap. It never installs a runtime, downloads a model, probes a local endpoint, or switches to cloud. The user returns to scan and self-test a chosen runtime. This is local-text setup only; it does not enable image/video media.

**W477-G source acceptance:** plain-language goal selection, mobile guide-only state, one safe desktop recommendation, clearly marked official links, all alternatives secondary, no automatic installer/model/runtime side effect, and a direct EONBOT chat route to the guide.

**Exit:** no unknown active route/origin; legacy material is quarantined/revalidated/reviewed; CSP is no broader than evidence requires.

## W478 — accessibility, identity and real-device proof

**Purpose:** prove that the current product works for real people across browsers and devices without claiming unavailable cloud behavior.

1. **W478-A — desktop accessibility:** keyboard, focus order, landmarks, skip links, contrast, reduced motion, zoom/reflow and screen-reader traversal across core routes.
2. **W478-B — locale and voice:** 11-language/RTL rendering, typed fallback, default-off voice output, explicit microphone permission and failure handling. No background microphone.
3. **W478-C — Google identity lifecycle:** only if Google OAuth is configured with the reviewed test client: sign-in, cancel, error, session, logout, deletion-request boundary, redirect allowlist and no local-work upload. Otherwise record identity as unavailable/optional, not failed magic.
4. **W478-D — physical device matrix:** Android and iOS portrait/landscape, safe areas, touch targets, virtual keyboard, install prompts, PWA behavior, slow-network and offline messaging.
5. **W478-E — update and recovery evidence:** installed-PWA update, rollback, local data, portable encrypted backup/restore and service-worker cache recovery using disposable test data.
6. **W478-F — Sync Basic evidence:** dedicated D1 binding only after approval; two-device A/B upload, merge review, tombstone, browser-clear, encrypted restore and rollback. Keep Sync disabled if any proof is missing.

**Exit:** accessibility/device/identity/recovery evidence is reviewed. No payment scope is enabled.

## W479 — EON City and Realm playable vertical slice proof

**Purpose:** prove that EON City is a usable flagship workspace rather than an unverified visual demo.

1. **W479-A — City first-run and orientation:** clean entry, readable onboarding, desktop and mobile control hints, exit/re-entry and no blocked content.
2. **W479-B — command-room work loop:** enter City → approach a clear landmark/guide → launch a meaningful current tool → return to the same City context. No fake automation or hidden external action.
3. **W479-C — authored visual quality:** original asset provenance, readable guide cast/faces, district clarity, lighting/material quality, mobile-safe composition and reduced-motion fallback.
4. **W479-D — interaction and accessibility:** mouse/keyboard/touch/controller routes, target feedback, focus/skip options, audio defaults, captions/speech bubbles and no forced microphone.
5. **W479-E — performance truth:** device tiering, frame-time/memory observation, LOD/governor behavior, low-device fallback and no “AAA” claim without measured proof.
6. **W479-F — Realm usefulness:** local-first personal realm/profile and safe share return loop; no marketplace, wallet, token, resale or payout behavior.
7. **W479-G — visual/browser proof:** desktop, Android and iOS screenshots/short recordings retained outside source, with route/viewport/device labels and human review.

**Exit:** EON City is usable, original, navigable and performance-truthful across the certified device matrix.

## W479-M — Local Creator Media programme (after W479 core proof)

**Purpose:** make EONAPP genuinely compelling for creators and influencers with device-guided, local-first image and video creation. It is a major product programme, not a cosmetic checklist.

**Rule:** no image/video runtime is selectable or called “working” until its own adapter proves explicit local connection, narrow reviewed loopback policy, capability discovery, workflow/model selection, one local generation, cancellation/error, local output handling, CSP/CORS/PNA, memory/device behavior and no silent cloud fallback.

### W479-M0 — Choose your device onboarding

- Friendly entry: “What are you creating?” and “What device are you using?”
- Detect/ask for OS, CPU/GPU class, VRAM/RAM/storage, battery/thermal state and desired speed/privacy level.
- Present plain-language capability levels: **Starter**, **Creator**, **Studio**, **Pro Video**. Never shame a low-end device; show realistic offline options.
- Explain exactly what to install, where models live, expected storage, rough generation time range, heat/battery advice and how to remove models later.
- Keep text Local AI, image generation and video generation visibly separate until each connection is proven.

### W479-M1 — local media readiness and install guidance

- Device readiness score with transparent reasons and no fake benchmark.
- Curated runtime/install guides for reviewed adapters only; no arbitrary URL/LAN endpoint field.
- Storage planner, model-library locations, model-card/licence acknowledgement, checksum/size/status and update/removal guidance.
- Personal data remains local; output folders are user-controlled.

### W479-M2 — Local Image Foundation

- One reviewed image runtime adapter at a time, with explicit connect/test/capability discovery.
- Text-to-image and image-to-image only after a successful local capability test.
- Generation queue, cancellation, error state, low-memory fallback, seed/prompt history under local control and export/download to a user-chosen local library.
- No remote model routing under “Local.” Any connected cloud provider is separate, named and explicitly chosen.

### W479-M3 — Lite motion and image-to-video

- Lightweight creator workflows for image-to-video/motion using proven local workflows and realistic hardware guidance.
- Short duration, bounded resolution/fps, progress/cancel controls, frame/temporary-file cleanup and output size warnings.
- Presets for social formats such as vertical short video, but no automatic posting or social account connection.

### W479-M4 — Studio video workflow

- Strong-GPU path with model/workflow compatibility checks, queue ownership, checkpoint memory estimation, thermal/battery warnings and pause/resume where the runtime supports it.
- Multi-shot storyboard, reference image handling, upscaling/interpolation only after adapter capabilities prove them, and local project/output metadata.
- Clear “requires strong device” gating rather than a silent failure.

### W479-M5 — Pro full generative video

- High-end local text-to-video/image-to-video workflows for creator machines with sufficient GPU memory/storage.
- Strong safety controls for uploaded references, local disk quotas, long-job durability, output review and cancellation/recovery.
- Benchmark and reliability matrix across supported GPU tiers. No promise of universal full-video compatibility.

### W479-M6 — Creator Library, Post Pack and share-safe handoff

- Local media library, project files, provenance notes, export presets, rights/model-card reminders and portable local metadata.
- A proven local image/video adapter hands its final output to one **Post Pack**: local save/export location, caption/alt-text draft, format notes and the creator's selected platform handoff.
- The Post Pack is manual/export-first. No background upload, public gallery, marketplace, token/NFT, reward or social autoposting.
- Each direct connector is separate: official platform API/current policy review, account eligibility, server-side OAuth/token custody, per-post review/cancel/revoke, exact file transfer, error/receipt/support proof and human release sign-off.
- Existing web intents/native share can remain a convenience, but do not count as connected accounts or verified publishing.

### Current creator distribution truth (locked before W479-M)

- The app currently has creator briefs, export/native-share routes and a disabled social connector registry; it does **not** have all major platforms connected for direct posting.
- X, Instagram, TikTok, YouTube, Facebook Pages, LinkedIn and similar platforms must each be integrated and proven separately. A button, web intent or manually copied caption is not a token-backed publishing connector.

### W479-M7 — proof, privacy and beta readiness

- Browser/device/CORS/PNA test per adapter, model workflow tests, low-memory and interrupted-job test, storage cleanup, uninstall, privacy review and creator usability sessions.
- Ship each adapter as beta until the evidence matrix is complete. Never merge an image/video claim into general Local AI text copy.

**Exit:** each supported media capability has a distinct, evidenced adapter and honest device tier. This programme can grow after launch; it does not hold the non-payment core release hostage.

## W479.5 — final non-payment certification

**Purpose:** final release decision for the free/local-first product only.

1. Consolidate W476-B/W477/W478/W479 evidence and unresolved exceptions.
2. Repeat source validation: lint, current unit suite, build, smoke, site audit, launch readiness, SBOM/audit and secret scan.
3. Repeat public route/header/redirect crawl, browser matrix and device spot checks after the final deploy candidate.
4. Confirm privacy/support/legal/trust pages match actual behavior; remove beta-looking or misleading copy.
5. Confirm commercial boundaries remain off: no checkout, price, trial, entitlement, provider SDK, webhook, wallet, token/NFT/reward/referral activation.
6. Complete red-team review: routes, CSP, external origins, storage/data survival, OAuth (if present), Sync (if enabled), PWA recovery and accessibility.
7. Owner performs explicit **GO** or **NO-GO**. Missing proof equals NO-GO for that claim.

**Exit:** eligible to begin Dodo implementation planning only if non-payment certification is genuinely green and the owner approves it.

## W480 — Dodo only after W479.5

**No W480 work may activate payment before merchant approval and completed prior gates.**

1. **W480-A — merchant approval and policy verification:** individual/business eligibility, KYC/tax, product policy, recurring billing availability, India/UPI/card support where applicable, refund/cancellation/support disclosures and approved merchant account settings.
2. **W480-B — isolated commerce architecture:** one hosted checkout provider, server-side entitlement service, no raw card data, no client-only grants, no localStorage trial, no billing data in Vault/local work.
3. **W480-C — test-mode lifecycle:** checkout, cancel, trial rules only if approved, renewal, failure, retry, refund, dispute/chargeback, restore, duplicate/replayed webhook signature verification and idempotency.
4. **W480-D — production limited proof:** controlled production purchase/refund support flow only after owner approval; redacted evidence and monitoring.
5. **W480-E — commercial GO/NO-GO:** publish prices/trials only after the entire lifecycle and customer support path are proven.

## Permanent release discipline

- Each deployment reruns source gates, audit/SBOM, source manifest, secret scan and route-output checks.
- Every new external origin requires a purpose, route, CSP classification, privacy review and browser proof before it becomes allowed.
- Every Local AI/media adapter is independently versioned and evidence-gated.
- “Works in source,” “build passed,” “deployed,” “browser observed,” “device proven,” and “owner approved” are always reported as separate states.

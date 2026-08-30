# EONAPP Master Launch Roadmap — W623 Through W640

Date frozen: 2026-07-11  
Current completed checkpoint: W639 whole-app rehearsal and source-freeze programme
Next execution wave: W640 final owner GO/NO-GO certification and launch handover
Current release state: source-certified through W639 after permanent receipt / public production certification NO-GO

This is the canonical continuation plan. It supersedes earlier conflicting referral, subscription, marketplace, cloud-AI, City, and launch sequences.

---

## 1. Non-negotiable product decisions

### Commercial

- Free: $0.
- Plus: $4.99/month.
- Studio: $14.99/month.
- Power: $29.99/month.
- Max: $49.90/month.
- All paid plans use the configured seven-day trial.
- Dodo Payments is the only subscription checkout rail at launch.
- Server status, webhook state, and the entitlement ledger are authoritative. Browser query strings and callbacks cannot grant paid access.

### Referrals and EONKEYS

- No referral subscription discount.
- No free subscription month or whole subscription tier.
- No renewal credit.
- No cash, wallet, token, crypto, commission, payout, lottery, or multi-level reward.
- Referrals may earn non-transferable EONKEYS only.
- EONKEYS unlock selected individual features, temporary limits, workflows, templates, creator presets, or cosmetics.
- Browser links carry stateless signed invite context but cannot grant keys.
- The minimal server ledger prefers the dedicated `EON_REFERRALS_DB` binding for identity association, qualification, grants, reversals, redemption and aggregate qualified progress. `EON_BILLING_DB` remains billing truth and only a temporary migration fallback.
- EONAPP has no advertising system and no watch-an-ad rewards. Independent external promotion of an active referral link is allowed only when it is honest, non-spammy and accurately discloses the possible non-cash EONKEY/digital reward.

### AI execution and privacy

- EONAPP does not operate a Cloudflare image/video generation backend.
- Creator prompts, reference media, provider keys, jobs, and generated files do not pass through EONAPP servers.
- Execution rails are:
  1. local runtime on the user’s device;
  2. direct user-owned external provider/API key;
  3. guide/storyboard mode when generation is unavailable.
- Every screen must clearly label Local, Direct BYOK, or Guide mode.
- No silent fallback from local to external generation.
- No permanent provider key in ordinary browser LocalStorage.
- Browser-assisted Dictate and spoken Guide replies may work without an EONAPP API key, but browser recognition is not automatically private or offline.
- Language selection stays in Profile; Chat follows Auto by default. Fully local speech requires a separately proven local companion/runtime.

### EON City

- EON City is a productive RPG workspace, not a decorative dashboard and not a fake AAA claim.
- Final art direction: premium stylized neo-noir science-fantasy.
- The world must contain custom authored assets, a rigged player avatar, animated EONBOT, animated NPC cast, landmarks, productive missions, real Agent Theatre jobs, a real Command Center, sound, VFX, accessibility, mobile controls, and performance tiers.
- No fake agent activity, fake economy, speculative collectible ownership, or decorative status that looks operational.
- Do not expand final-quality production into every district until the Command District vertical slice is independently scored at least 9/10.

---

## 2. Internal launch certification standard

“GPT-5.6 certified” is an internal EONAPP red-team standard, not an external legal or OpenAI certification.

A surface may be marked launch-ready only when:

1. Product truth matches source, build, deployed route, support copy, legal copy, and actual runtime evidence.
2. No critical or high-severity security/privacy issue remains.
3. Every button has an honest action, disabled state, or explanation.
4. A nontechnical first-time user can complete the main task without documentation.
5. Keyboard, screen-reader basics, reduced motion, contrast, touch targets, and recovery paths pass.
6. Desktop and mobile evidence exists on real devices.
7. Data survives updates or the limitation is explicitly disclosed.
8. Cancellation, failure, retry, timeout, offline, and partial-state recovery are proven.
9. The scored surface is at least 9.0/10 overall with no launch-critical category below 8.5/10.
10. EON City requires at least 9.5/10 visual/product owner approval and no category below 9.0/10 before flagship certification.

A perfect 10/10 is an evidence ceiling, not a promise that software can never improve.

---

## 3. Programme status

| Wave | Status | Purpose |
|---|---|---|
| W623A | Complete | Trustworthy source baseline, local Comfy image adapter source integration, City/UI audit and maintained-suite repair |
| W623B | Runbook ready; real-device proof pending | First physical Windows/Comfy image generation evidence |
| W623C | Complete | Canonical subscriptions, prices, trial, EONKEYS-only referral architecture and public commercial truth |
| W623D | Complete | Production reachability graph and quarantine of obsolete value-system modules |
| W623E | Complete | ChatGPT-style information architecture and unified Create entry |
| W623F | Complete | Certification v2, Guide/copy audit, multilingual routing and source/build/deployment truth board |
| W623G | Complete | Share Command Center, public-safe viral creation loops and no-key voice fallback source foundation |
| W623H | Complete | Minimal referral authority, active/inactive EONKEY grants, reversals, redemption and privacy-safe progress |
| W623I | Live testing activation complete; lifecycle proof pending | Dedicated referral D1 bound and migrated in Production, rollout set to testing, public status endpoints green; genuine business lifecycle/device proof remains pending |
| W624A | Source complete; owner target review pending | Productive Nocturne art bible, final cast/architecture language, target frames, budgets, reject list and scoring contract |
| W624B | Source complete; live/device proof pending | One authoritative City runtime, eleven-state lifecycle, deterministic local asset manifest and recovery contract |
| W624C | Source complete; runtime visual approval pending | Command District vertical slice, honest productive destinations, authored route network, safe spawn and unstuck contract |
| W624D | Source complete; browser/device proof pending | Wayfinder state contract, five collision-aware camera profiles, controls and deterministic test-contract cleanup |
| W624E | Source complete; browser/device/visual proof pending | Captions-first EONBOT Orbit, nine local states, real-route hints, visible controls and no-autonomy boundary |
| W624F | Source complete; browser/device/crowd proof pending | Four bounded Command District guides, nine states, authored paths, review-first interactions and deterministic LOD |
| W624G–L | Source complete; physical device and owner approval pending | Productive RPG loop through final flagship certification; no unrestricted flagship claim until evidence gates pass |
| W625A | Source tooling complete; real owner-runtime proof pending | Generate, fetch, preview, save, reopen and recover one real 512×512 ComfyUI image through EONAPP |
| W625B | Source complete; real-device compatibility evidence pending | Versioned allowlisted workflow registry and bounded low/medium/high device profiles |
| W625C | Source foundation complete; advanced edit workflows and real quality proof pending | Proof-gated aspect, quality, seed, history and export; reference/edit/outpaint/upscale remain disabled |
| W625D | Source complete; reference-device evidence pending | Capability verdicts, 8 GB reviewed minimum, 4 GB safe fallback and no-side-effect detection |
| W625E | Source tooling complete; real owner/reference proof pending | Reviewed local image-to-video lifecycle, real progress/cancel/save/reopen/digest contract and eleven recovery lanes |
| W625F | Source complete; reviewed workflow compatibility evidence pending | Strict API-workflow review, digest confirmation, bounded I2V recipe and product lifecycle |
| W625G | Source complete; real device calibration pending | Conservative workload/storage estimates, safety blockers, warnings, queue one and explicit cleanup proposals |
| W625H | Certification tooling complete; real certification pending | Fixed benchmark board and no-go certification until image, video, recovery and device evidence all pass |
| W626A–H | Source complete; signed companion and real provider/mobile evidence pending | Direct external BYOK image/video programme without EONAPP proxy |
| W627A–G | Source complete; real creator certification pending | Unified Creator, Library, provenance, project integration and data survival |
| W628A–F | Source complete; genuine Dodo customer/provider/D1 evidence pending | Checkout attempt ledger, signed-webhook lifecycle, entitlement refresh, portal/actions, reversal handling and fail-closed certification |
| W629A–H | Source complete · real referral evidence pending | Referral/EONKEYS lifecycle and Vault Reveal integration |
| W630–W632 | Source complete; real evidence pending | Whole-app UX, projects/workspace/Forge/automations, and Vault/account/custody separation |
| W633 | Source complete; production-edge/device/crawler evidence pending | Every-route audit, one-hop alias retirement and navigation cleanup |
| W634 | Source complete; physical-device/assistive-technology evidence pending | Responsive layout, accessibility and input capability hardening |
| W635 | Source complete; production-edge/offline/update/rollback evidence pending | Performance budgets, cache ownership, service-worker and update-safety hardening |
| W636 | Source complete; real edge/hostile-traffic/incident evidence pending | Security, privacy, secrets and abuse-resistance hardening |
| W637 | Source complete; real browser/Drive/cross-device recovery evidence pending | Persistence, migration, backup and recovery hardening |
| W638–W640 | Planned | Evidence convergence, rehearsal/freeze and final owner GO/NO-GO |

---

# 4. Immediate foundation waves

## W623E — ChatGPT-style information architecture

### Build

- Freeze one beginner-first sidebar hierarchy.
- Create one canonical Create entry that routes to Image, Video, Website/Forge, Document/Project, Automation, and Guide choices.
- Remove duplicate naming between Apps, Tools, Studio, Market, Collection, Realm, Creator, and Forge.
- Keep advanced systems discoverable through progressive disclosure rather than the first screen.
- Make Profile, Vault, Settings, Help, Install, Billing, and Support predictable.
- Define one canonical route and one purpose for every visible navigation item.
- Make City a flagship destination without making it the only way to use EONAPP.

### Acceptance

- New user can start Chat, create an image/video plan, open a project, configure AI, and find billing/support without guessing.
- No top-level duplicate concept.
- Sidebar works collapsed, expanded, keyboard-only, mobile drawer, and screen reader.
- Every legacy alias redirects or is visibly labelled compatibility-only.
- Focused navigation tests, screenshot review, lint, build, and full source backup pass.

### W623E completion receipt

- Canonical primary navigation is EONBOT, Create, Projects, Library, and EON City.
- `/create` exposes Image, Video, Website/Forge, Project/Document, Automation, and Guide from one beginner-first surface.
- Apps, Studio, Collection, Tools, Creator Studio, and Marketplace aliases redirect to `/create`; Market remains a hidden compatibility-only Vault Reveal preview.
- Account/support destinations are explicit: Profile, Billing, EONKEYS, Vault, Settings, Help, Install, and Support.
- Advanced workspace, Local AI, Research Lab, Backup Capsule, and Appearance remain behind More/progressive disclosure.
- Focused gates, accessibility regressions, zero-warning targeted lint, route/SEO sync, and one production build passed.
- Real local image/video output remains proof-pending; W623E does not claim generation proof.

## W623F — Certification v2

### Build

- Compare public copy against canonical runtime contracts.
- Compare route status against emitted build files and deployed route results.
- Compare subscription catalogue against server status.
- Compare EONKEYS claims against the server ledger contract.
- Compare AI claims against real local/BYOK proof.
- Detect stale dates, old prices, old tier names, disabled/live contradictions, old NFT/wallet copy, and dead buttons.
- Require build provenance and a source checkpoint in every release receipt.
- Separate maintained certification from archived historical tests.

### Acceptance

- One command produces a machine-readable launch board.
- No route can be certified from source strings alone.
- Missing real-device or live-provider evidence remains explicitly pending.
- False-positive historical gates cannot block current development, and current failures cannot hide inside an archive bucket.

### W623F completion receipt

- Machine-readable certification v2 launch board compares canonical source routes, emitted build files, deployed route evidence, commercial truth, EONKEYS truth, creator privacy boundaries and proof states.
- The deployed site remains honestly **NO-GO** because `/create` was observed redirecting to the older Workspace deployment and the root still exposed the old language selector.
- Guide/EONBOT wording was modernized around one clear next step and the canonical Create, Projects, Library and EON City hierarchy.
- Language settings moved out of the main Chat header into Profile → Voice & language.
- Browser-assisted Dictate and spoken Guide replies no longer require a Local or Connected AI model when the browser exposes recognition, microphone capture and speech synthesis.
- A compact multilingual routing lexicon recognizes high-value typed or dictated requests across all eleven release languages.
- Core Chat, Guide and voice control copy has deterministic local translations across all eleven languages. Broader page translation and recognition quality remain proof-pending rather than overclaimed.
- Local and Direct BYOK model context carries the chosen reply language.
- Real-device multilingual recognition, spoken voice availability, RTL/IME behavior and offline/local speech remain W623I.

## W623G — Share Command Center, viral creation loops and no-key voice fallback

### Build

- Keep one top-right Share action across the app shell while preserving the native Chat and EON City share controls.
- Consolidate signed invite links, local creation sharing, milestone cards and EONBOT campaign drafting in one Share Command Center.
- Add explicit native handoff for one user-selected local image or video without uploading it to EONAPP.
- Add local public-safe PNG cards for creation launches, project milestones, EON City achievements and Vault Reveals.
- Add manual handoffs for WhatsApp, Telegram, X, LinkedIn, Facebook, Reddit and email.
- Keep referral qualification and EONKEY grants inactive until a minimal server authority proves identity, caps, retention, refund/dispute reversal and redemption.
- Keep EONAPP free of ads and watch-to-unlock mechanics. External promotion is a user choice, not EONAPP advertising, and must not be encouraged as reward-bearing until the programme is active for that account.
- Add a no-key voice fallback ladder: browser Dictate/speech synthesis where available, operating-system dictation and device Read Aloud where browser speech is missing, and a design-only authenticated local companion contract for future airplane-mode STT/TTS proof.

### W623G completion receipt

- Universal Share coverage now spans 31 active app/site-shell HTML surfaces; Chat retains its native header Share, EON City retains its City HUD Share, and older billing/help/legal-style shells place Share in the top-right utility rail.
- Share Command Center now exposes four understandable paths: Invite, Share a creation, Celebrate progress and Build a share campaign.
- Local images/videos can be handed to the system share menu only after an explicit user action; EONAPP neither uploads the file nor learns where it was posted.
- Local 4:5 share-card generation is available for creation, project, City and Vault Reveal milestones.
- Platform handoffs expanded to WhatsApp, Telegram, X, LinkedIn, Facebook, Reddit and email.
- EONKEY wording is proof-gated and clearly says rewards are not active. No click, signup, purchase or post can grant a key in this checkpoint.
- Source viral-readiness score is 7.2/10. The remaining blockers are server attribution, qualified reward grants, abuse/refund reversal and privacy-safe measurement; no 10/10 viral claim is allowed before those pass.
- Profile now reports the best available no-key voice path for the selected language/device while keeping typed chat available.
- The optional local speech companion remains inactive and cannot claim offline speech until signed-binary, authenticated-loopback and airplane-mode STT/TTS proof exists.
- Focused W623G gate passed 22/22, unit tests 6/6, W623C 64/64, W623D 5/5 with zero quarantined modules reachable, W623E 5/5, W623F 24/24, targeted lint zero-warning and production build green.
- Automated localhost browser screenshots remain pending because the isolated build container blocks managed Chromium from localhost and cannot download the Playwright browser. The runnable proof harness is included rather than marked as passed.

## W623H — Minimal referral authority and EONKEY lifecycle foundation

### Build

- Reuse the existing `EON_BILLING_DB`; add no new database, secret, cron, queue, click registry or social-post tracker.
- Keep signed public links stateless and generated content, share cards and campaign drafts local.
- Bind an inviter identity only after a fresh ten-minute P-256 proof-of-possession challenge; allow up to five device identities per account.
- Enrol one signed-in invitee under one inviter and reject self-referral, duplicate association and browser-only grants.
- Grant one capped Signal Key plus a digital reward only after a useful activation milestone.
- Create no reward for a click, share, impression, social post or trial start.
- Hold paid referral rewards for 14 days, then grant Builder, Builder and Power keys for the first three retained paid referrals in a calendar year.
- Reverse affected grants, unlocks and digital rewards after refund, dispute, cancellation, expiry, payment failure or entitlement revocation.
- Let users redeem one available key for one allowlisted individual feature, limit, workflow, template, preset or cosmetic.
- Show privacy-safe progress derived only from accepted invites and qualified ledger events.

### W623H completion receipt

- `functions/api/referrals.js` provides authenticated same-origin challenge, binding, enrolment, activation and redemption actions.
- Dodo billing events feed the referral ledger only when `EON_REFERRAL_ROLLOUT` is `testing` or `production`; W623I prefers the existing dedicated `EON_REFERRALS_DB` binding and keeps `EON_BILLING_DB` as a temporary migration fallback.
- Raw signed tokens remain session-only; persistent attribution stores only non-secret metadata.
- An in-memory SQL lifecycle proves identity binding, proof replay rejection, self-referral rejection, Signal grant, digital reward, 14-day paid hold, Builder redemption and refund reversal.
- The EONKEY page now supports identity registration, saved-invite acceptance, balances, verified sharing progress, grant history, digital reward receipts and allowlisted redemption.
- EONAPP remains subscription-only with no in-app ads and no watch-ad unlocks. External promotion is separate from app monetisation and earns nothing unless the referral programme is active and qualification succeeds.
- Source viral-readiness score is 9.7/10. Deployment remains 7.2/10 until D1 migration, rollout activation and real-account proof pass.
- W623H gate passed 20/20, focused W623C–H tests passed 31/31, secret scan passed and one production build passed with zero quarantined legacy modules reachable.

## W623I — Dedicated referral D1 scale architecture and Cloudflare activation kit

### Source completed

- Selected the existing `EONAPP_REFERRALS_DB` as the dedicated authority, bound as `EON_REFERRALS_DB`; no new database is required and no database reset is allowed.
- Kept `eonapp-billing` bound as `EON_BILLING_DB` for Dodo events and subscription entitlement truth.
- Added an eight-table dedicated migration, eleven-plus indexes and a privacy-safe operational-counts view.
- Added a minimal referral billing-state mirror so the referral database never depends on billing tables or duplicates the full Dodo ledger.
- Fixed cross-database delivery: a duplicate Dodo webhook replay can repair a referral write that failed after billing was already stored.
- Added optional `EON_REFERRAL_RATE_LIMITER` support before D1 mutation; the system remains usable without it under auth, same-origin, request-size, proof, idempotency and cap controls.
- Added explicit 7 GB review and 8 GB shard-preparation thresholds below Cloudflare's per-database ceiling.
- Added a non-destructive exact Cloudflare AI prompt, Time Travel/migration/rollback runbook and post-W640 Codex live-certification backlog.
- Kept subscriptions as the only monetisation rail; no ads, watch-to-unlock, click rewards, social-post tracking, cash, discounts, tokens or provider credits were added.

### Source acceptance

- Dedicated binding wins when both referral and billing D1 bindings exist.
- Temporary billing fallback remains visible and testable for migration compatibility.
- Split billing/referral delivery, duplicate replay repair, retention maturity and reversal pass in separate in-memory databases.
- Migrations are non-destructive and apply cleanly to an empty dedicated SQLite/D1-equivalent database.
- W623I gate and focused tests pass; lint, reachability, secret scan and production build are required before packaging.

### Live testing activation completed; lifecycle proof still pending

Owner-provided Cloudflare/Codex evidence confirms that Production now has the existing dedicated referral D1 bound as `EON_REFERRALS_DB`, both non-destructive migrations applied, `EON_REFERRAL_ROLLOUT=testing`, deployment `63ec539b-a552-451d-b99b-28aae3e561b5`, and 200 responses from the referral, referral-status and billing-status endpoints. Preview was not bound to the Production referral database, secrets and identity/billing databases were not changed, and no fabricated rewards or webhooks were used.

The following remain final Codex/owner proof items and continue to block launch certification:

- Genuine two-account identity, activation, EONKEY grant, redemption and rollback proof.
- Genuine Dodo-origin retained-payment qualification and 14-day maturity.
- Refund/dispute reversal on real lifecycle state.
- Physical-device native Share evidence.
- Eleven-language recognition, spoken reply, Arabic RTL and CJK IME evidence.
- Worker/D1 metrics, query plans, rate limiting and scale baseline.

Coding may continue with W624A–W640, but no final GO claim is allowed until the post-W640 Codex live-certification backlog passes.

---

# 5. W624 — EON City flagship programme

## W624A — Art bible and quality target

**Source status: complete. Owner target-frame review and runtime comparison remain pending.**

- Frozen **Productive Nocturne** vision: a premium stylized neo-noir science-fantasy city where every beautiful place leads to useful, reviewable productive work.
- Six design pillars: productive wonder, authored silhouettes, readable nocturne, human warmth, truthful motion, and calm mastery.
- Canonical palette, material, architecture, atmosphere, signage, HUD, camera, animation, audio and human-scale rules.
- Final direction for the Wayfinder player, EONBOT Orbit and five productive NPC archetypes.
- Productive-RPG mission contract requiring a persisted real outcome; fake work, fake economy, loot boxes, combat, and pay-to-win progression remain prohibited.
- Lite/Balanced/Cinematic target ceilings for triangles, draw calls, texture memory, transfer size, NPC count and frame rate.
- Original desktop arrival, mobile arrival and cast-lineup SVG target frames plus owner scorecard.
- Strict reject list for empty black space, generic neon boxes, crushed readability, inconsistent scale, mannequin NPCs, HUD clutter, camera clipping, fake activity and premature district expansion.
- Babylon scene metadata now exposes the canonical art-bible summary so W624B–L can validate against one authority.

**Gate:** W624B runtime consolidation may proceed because it produces no final art. W624C final Command District production requires owner approval of the W624A target direction. Command District expansion still requires a fresh runtime score of at least 9.0/10.

## W624B — Runtime consolidation and City shell — SOURCE COMPLETE

- One authoritative Babylon boot path.
- One City access gate.
- One loading/recovery state.
- Fullscreen City-specific shell with minimal HUD.
- Remove competing legacy City renderer paths from production.
- Deterministic asset manifest and cache version.

**Gate:** cold boot, warm boot, refresh, logout, session expiry, failed asset, WebGL loss, and low-memory recovery pass.

## W624C — Command District vertical slice — SOURCE COMPLETE; RUNTIME VISUAL APPROVAL PENDING

- Added one finite Productive Nocturne Command District contract with six review-first productive destinations: Agent Theatre, Creator Atrium, Forge Basilica, Project Dock, Archive Canopy and Signal Sail.
- Added Arrival Plaza authorship, seven readable path branches, landmark collision volumes, one authoritative safe spawn and six nearest-point unstuck recoveries.
- Added a dedicated Agent Theatre silhouette and honest dormant/review boundary; no fake jobs, running-agent claims or decorative economy state.
- Added explicit first-ten-second cues and a first-sixty-second guided journey.
- Preserved W624B's only-heavy-route, server-authoritative access, one runtime owner, eleven states, required/optional asset boundary, safe degradation, disposal and re-entry.
- W624C deterministic gate: 24/24; focused tests: 6/6; production build and smoke passed.
- Managed-environment Chromium was blocked from loopback by administrator policy; no runtime visual score or screenshot approval was manufactured. A one-command owner/Codex proof runner is included.

**Gate:** source architecture is complete, but expansion beyond the Command District remains blocked until fresh real-runtime desktop/mobile captures score at least 9.0/10 with no launch-critical category below 8.5/10.

## W624D — Player avatar and camera — SOURCE COMPLETE; BROWSER/DEVICE PROOF PENDING

- Added a local Productive Nocturne Wayfinder contract with nine explicit states: idle, walk, run, turn, interact, inspect, celebrate, sit/work and recovery.
- Added an inclusive, non-sexualized, cosmetic-only visual profile with no stat benefit, pay-to-win behavior, remote-art dependency or hidden network activity.
- Added Follow, left-shoulder, right-shoulder, Close and Wide camera profiles.
- Added authored circle/box camera collision resolution using W624C Command District volumes, bounded radius, reset and local-only diagnostics.
- Added keyboard, controller and visible touch/menu-accessible camera controls plus reduced-motion behavior.
- Preserved W624C spawn/Unstuck, W624B runtime ownership and the Command District no-expansion gate.
- Realigned repository certification: 223 maintained test files, 767 current passes, 47 explicit historical skips, 36 untouched archived files, zero current failures and one lock-protected Codex predeploy command.
- W624D Wayfinder gate 20/20; contract alignment 16/16; archive gate 10/10; lint, secret scan, build, smoke and current certification passed.

**Gate:** source is complete. Keyboard/mouse, physical touch/controller feel, real-GPU camera clipping, final imported rig/animation quality and owner visual approval remain pending. No district expansion is authorized.

## W624E — EONBOT companion — SOURCE COMPLETE; BROWSER/DEVICE/VISUAL PROOF PENDING

- Added one captions-first EONBOT Orbit contract with nine explicit local states: follow, lead, point, think, speak, scan, celebrate, warn and help.
- Added five non-repeating first-sixty-second route hints and six destination hints mapped only to W624C routes and proof boundaries.
- Agent Theatre remains dormant and warning-labelled until a genuine receipt exists.
- Saved-project context is limited to a bounded portal count; names, files, prompts and content remain unseen.
- Added visible mute state, Show Less Guidance, Help, Dismiss and Show Orbit restore controls plus reduced-motion adaptation.
- Preserved W624B runtime ownership, W624C paths/spawn/collision/Unstuck and W624D Wayfinder/camera behavior.
- Maintained suite is now 224 files / 820 assertions / 773 current passes / 47 exact archived skips / 0 failures.
- Browser fixture started, but managed Playwright Chromium was absent; the receipt is honestly BLOCKED and no screenshot/visual pass was claimed.

**Gate:** source is complete. Real-browser layout, physical-device controls, optional voice behavior, final imported Orbit rig/animations, sustained performance and owner visual approval remain pending. District expansion remains blocked.

## W624F — NPC production system — SOURCE COMPLETE; BROWSER/DEVICE/CROWD PROOF PENDING

- Added four distinct Productive Nocturne guides: Project Guide, Creator Technician, Automation Operator and Archive & Workspace Guide.
- Added nine bounded local states: idle, navigate, work, talk, listen, point, wait, recover and unavailable.
- Every interaction opens an informational review card and requires a separate visible route confirmation.
- The Automation Operator remains explicitly dormant until genuine job evidence exists.
- Guides use only four authored W624C branch paths and remain clear of spawn, collision and all Unstuck recovery points.
- Added cinematic, balanced, lite and disabled LOD profiles; weak-device fallback can reduce to two silhouettes or zero optional guides without changing productive navigation.
- Updated the maintained W409 guard to accept the newer authored-path patrol contract instead of skipping the historical invariant.
- Maintained suite is now 225 files / 826 assertions / 779 current passes / 47 exact archived skips / 0 failures.
- The stable Codex runner now checkpoints successful stages against a SHA-256 certifying-source fingerprint and safely resumes interrupted sessions only when source is unchanged.
- Exact Codex predeploy passed 20/20, production reachability is 352 files / 610 edges / 0 quarantined, final secret scan is 3,535 files / zero findings, and distribution SHA-256 is `55020c6e675aa046b113c3b2182db691a5afdedebb6dd8f42b320423b5f50d85`.
- Browser fixture started, but Playwright Chromium was unavailable; receipt is honestly BLOCKED and no screenshot/crowd-performance/visual pass was claimed.

**Gate:** source is complete. Real-browser interaction, physical-device crowd/LOD performance, final imported NPC rigs/voice and owner visual approval remain pending. District expansion remains blocked.

## W624G — Productive RPG loop — SOURCE COMPLETE

- Six mission families and nine honest states are implemented across City, Projects, Local AI/BYOK, Create, Automations, Vault/Capsule.
- Completion requires a bounded user-triggered product outcome receipt; no fake success, automatic reward, hidden execution or private content copy.
- Maintained suite at the W624G checkpoint: 832 assertions / 785 current passes / 47 archived skips / 0 failures.

**Gate:** source complete; genuine owner-side outcome and browser/device proof remain pending. District expansion remains blocked.

## W624H — Truthful Command Center — SOURCE COMPLETE

- Six read-only status families expose explicit source, authority, timestamp and freshness.
- Billing is server-authoritative; local status cards remain bounded counts/receipts only.
- Empty, stale, offline and error states are explicit; routing remains review-first.

**Gate:** source complete; production-authenticated browser/device status proof remains pending.

## W624I — Genuine Agent Theatre — SOURCE COMPLETE

- Exact lifecycle: queued, preparing, waiting-for-user, running, paused, failed, cancelled and completed.
- Existing W435 receipts plus bounded Local and Direct-BYOK adapters expose rail, authority, privacy and only authoritative progress.
- City reviews and routes to the owning native surface; it never executes jobs or invents workers/progress.

**Gate:** source complete; one genuine Local job and one genuine approved Direct-BYOK job still require owner/Codex end-to-end evidence.

## W624J — Sharing Center — SOURCE COMPLETE

- Six ordinary sharing families use finite public manifests with explicit included and permanently excluded fields.
- Prepare, review and final platform action are three separate user actions.
- Signed invite creation occurs only after review. Collaboration remains honestly unavailable until delivery, acceptance and recipient authority exist.
- Ordinary sharing creates no click/impression/social-post tracking and never mutates referrals or EONKEY rewards.

**Gate:** 26/26 source checks and 6/6 focused tests passed. Native-share completion, real collaboration delivery and production-authenticated browser proof remain pending.

## W624K — Audio, accessibility, mobile and controller — SOURCE COMPLETE

- Six audio channels are muted by default; captions are primary.
- Reduced sensory, reduced motion, high contrast, text scale, keyboard/touch/controller modes, remapping, safe areas, large targets, battery-saver preference and bounded thermal heuristic are implemented.
- Non-3D fallback is review-first; no audio, fullscreen, orientation, sensor or network action starts automatically.
- Weak-device behavior is recommendation-only and cannot claim hardware or thermal certification.

**Gate:** 35/35 source checks and 6/6 focused tests passed. Real sound output, controller hardware, mobile safe-area/orientation and physical battery/thermal evidence remain pending.

## W624L — Performance and flagship certification — SOURCE COMPLETE

- Low, mid and high quality presets, bounded nine-cell streaming, existing frame-time governor, local frame/memory evidence collection, export and eleven manual evidence cases are implemented.
- LOD, culling, instancing, optional detail, disposal and recovery boundaries remain explicit. Compressed textures remain manifest-gated until real assets exist.
- Source code cannot award device, visual-parity, recovery, thermal or owner-approval passes.
- Combined W624J-L maintained suite: 231 files / 862 assertions / 815 current passes / 47 exact archived skips / 0 failures.
- Stable resumable Codex predeploy passed 26/26. Reachability: 360 files / 632 import edges / 0 quarantined. Secret scan: 3,604 files / 0 findings. Production distribution: 465 files / 295 minified / 40.85% reduction / SHA-256 `f267241146a3d20cecb9c38595beccb45b558459ce39780e5ef0eb19ee88cbab`.
- Combined loopback browser fixture is honestly BLOCKED because Playwright Chromium is unavailable; no screenshots or physical-device/flagship approval were fabricated.

**Gate:** source complete. Public flagship launch remains blocked until low/mid/high physical-device evidence, sustained/recovery/PWA tests, W624A visual comparison and owner approval reach at least 9.5/10 with no category below 9.0.

---

# 6. W625 — Local image and video programme

## W625A — First real local image proof — SOURCE TOOLING COMPLETE; OWNER PROOF NEXT

- The existing loopback-only adapter now exposes explicit queued/running/completed/timeout/cancel states and best-effort server-side cancellation through the identified local `/queue` or `/interrupt` action.
- The positive path is no longer considered complete at preview. EONAPP computes a SHA-256 digest, starts an explicit local save, requires the owner to reopen the saved file, and verifies that the reopened bytes match the generated image.
- A redacted receipt can be exported without the prompt, checkpoint filename, local path, provider key or media body. Source code cannot award real-image proof.
- Runtime-stopped, no-checkpoint, unapproved endpoint, blocked loopback/CORS, timeout, cancellation, restart/retry and reset/refresh evidence remain honestly pending on the owner machine.
- Local video remains disabled and there is no LAN/public endpoint, automatic installation or cloud fallback.

**Gate:** source tooling complete. W625A remains `real-owner-runtime-proof-pending` until one real 512×512 image and every mandatory recovery lane are evidenced through EONAPP.

## W625B — Local image workflow registry — SOURCE COMPLETE

- One versioned EONAPP-authored text-to-image workflow is allowlisted and uses only six built-in ComfyUI nodes.
- Low-VRAM, medium and high-end device profiles are bounded; queue concurrency remains one.
- The first proof lane is fixed at 512×512, 12 steps and batch one. Only an explicitly reviewed, installed SD 1.5-class checkpoint may be auto-suggested for that proof.
- Checkpoint family notes and licence/source responsibility are visible without automatic model, node or workflow installation.
- Arbitrary workflow import, LAN/public runtime expansion and hidden cloud fallback remain prohibited.

**Gate:** source complete; real checkpoint/device compatibility evidence remains part of W625A owner proof and later W625H certification.

## W625C — Excellent image creation — SOURCE FOUNDATION COMPLETE

- After a matching save/reopen proof, bounded aspect, quality and deterministic seed controls unlock.
- Negative-prompt guidance, session-only history and redacted receipt export are present; history is not durable Library storage.
- Beginner proof mode remains fixed and conservative. Creator recipes stay profile-bounded, batch one and queue concurrency one.
- Reference image, variation workflow, edit/inpaint, outpaint, upscale, compare and prompt enhancement remain unavailable until separately allowlisted, privacy-reviewed and proven. No placeholder control pretends otherwise.

**Gate:** foundation source complete. Advanced image workflows and real quality evidence remain unfinished and must not bypass W625A.

## W625D — Local video capability detection — SOURCE COMPLETE

- Approved loopback runtime facts are evaluated without installing, downloading, allocating or submitting a job.
- The reviewed native video reference lane requires at least 8 GiB measured usable VRAM, 16 GiB system RAM minimum, 32 GiB recommended RAM and 35 GiB free storage.
- Verdicts are `supported`, `experimental` or `unsupported`; all blockers and warnings remain visible.
- The owner approximately 4 GB RTX 3050 lane is intentionally blocked before queue submission and receives Guide, future Direct BYOK and supported-device alternatives.
- Capability evidence is redacted and makes no all-device, exact latency or exact memory promise.

**Gate:** source complete. The owner 4 GB fallback and a supported reference machine still require real device evidence.

## W625E — First real local video proof — SOURCE TOOLING COMPLETE; REAL PROOF PENDING

- The loopback-only runtime supports explicit scan, input upload, `/prompt` submission, bounded `/history/{prompt_id}` polling, queue/running cancellation and approved `/view` output fetch.
- The mandatory first lane remains reviewed image-to-video at 512×288, 33 frames, 16 fps, batch one and queue concurrency one.
- Real completion requires EONAPP preview, playback, save, owner-selected reopen and matching SHA-256, plus provenance without raw prompt or private local paths.
- Eleven negative/recovery lanes remain mandatory: stopped runtime, 4 GB fallback, missing model/workflow, invalid input, unapproved endpoint, CORS denial, cancellation, timeout/crash, low disk, refresh/resume truth and preview-decode recovery.
- Source strings, mocks, Comfy-only screenshots or externally created media cannot pass.

**Gate:** source tooling complete. No real owner/reference-device video was generated in the managed environment; verdict remains `source-tooling-ready-real-reference-video-proof-pending`.

## W625F — Local video product workflow — SOURCE COMPLETE

- A strict source-owned review contract accepts only bounded ComfyUI API-format workflows using reviewed native node classes and required input, prompt, sampler, decode and output roles.
- Forbidden network/execution nodes, unknown classes, custom-node hints, oversized graphs and missing roles are rejected before submission.
- Exact SHA-256 digest confirmation is required for every session before the graph can be patched and queued.
- The first proof allows image-to-video only and patches the owner-selected input, prompt, seed, width, height, frames and FPS.
- Audio, interpolation, upscaling, batch expansion and arbitrary graph execution remain disabled.

**Gate:** source complete. Native workflow/model compatibility on the supported reference machine remains part of W625E evidence.

## W625G — Efficiency governor — SOURCE COMPLETE

- Conservative defaults remain 512×288, 33 frames, 16 fps, bounded steps, batch one and queue concurrency one.
- Resolution, frame, FPS and step limits are clamped before submission.
- Workload and output-storage values are directional estimates, never guaranteed latency, VRAM or file-size claims.
- Low free storage blocks; AC/battery and thermal state produce visible warnings.
- Cleanup is proposal-only, never automatic, and cannot remove owner-saved media.

**Gate:** source complete. Real supported-device calibration is pending and may tighten limits but cannot silently weaken safety.

## W625H — Local creator certification — TOOLING COMPLETE; CERTIFICATION PENDING

- The certification board requires real W625A image proof, real W625E video proof, all eleven video recovery lanes, supported reference-device evidence and the owner 4 GB safe-fallback evidence.
- Fixed benchmark categories are quality, latency, memory, failure recovery, privacy, output integrity and update compatibility.
- Every benchmark row defaults to pending and must be rerun after relevant runtime/workflow updates.
- A pass applies only to proven supported profiles. It never authorizes a public all-device claim.
- Source integration alone always returns no-go.

**Programme exit remains blocked:** local image and local video must pass real-device evidence. Weak devices must receive a correct Guide or future Direct BYOK fallback.

---

# 7. W626 — Direct external BYOK image and video

No EONAPP Cloudflare generation proxy is allowed in this programme.

## W626A — Provider-neutral job and threat model — SOURCE COMPLETE

- One bounded request/result/error/progress/cancel schema spans reviewed providers.
- Provider, endpoint, media-origin, content-type, size, redirect and EONAPP-origin allowlists fail closed before network access.
- Explicit user action, provider disclosure, model review and per-job budget acknowledgement are mandatory.
- Public receipts remove prompts, credentials, references, provider payloads and media bodies.

**Gate:** focused source gate 8/8 and unit cases 3/3. Real network-boundary evidence remains pending.

## W626B — EON Creator Companion — SOURCE COMPLETE; SIGNED RELEASE PROOF PENDING

- Loopback-only companion source binds `127.0.0.1:47826` and authenticates an allowlisted EONAPP origin through a short-lived six-digit pairing challenge and HMAC session.
- Provider credentials use Windows DPAPI CurrentUser, macOS Keychain or Linux Secret Service; no plaintext fallback exists.
- Diagnostics disclose readiness without returning credential values.
- Installation, code signing/notarization, package signing, update, uninstall and physical-device diagnostics remain pending.

**Gate:** focused source gate 8/8 and unit cases 2/2. `publicReleaseAllowed` remains false.

## W626C — External image adapters — SOURCE COMPLETE; REAL TWO-PROVIDER OUTPUTS PENDING

- Companion-owned fal and Replicate adapters cover capability preflight, submit, status, result, cancellation and bounded error normalization.
- Paid retry is never automatic; redirects are manual; returned media must use reviewed provider media origins and image content types.
- Model registry entries remain disabled until owner review and real provider-account proof.

**Gate:** focused source gate 8/8 and unit cases 2/2. No source-only image-provider claim is allowed.

## W626D — External video adapters — SOURCE COMPLETE; REAL TWO-PROVIDER OUTPUTS PENDING

- The same two companion-owned providers expose reviewed text-to-video or image-to-video capability only where the selected model declares it.
- Long-running queue states, cancellation, result expiry and provider errors remain explicit.
- Unreviewed video model identifiers cannot be submitted.

**Gate:** focused source gate 8/8 and unit case 1/1. Real video, expiry and recovery evidence remains pending.

## W626E — Unified direct job fabric — SOURCE COMPLETE; REAL JOB PROJECTION PENDING

- Local and Direct BYOK jobs project into one bounded Creator/Agent Theatre state vocabulary without mixing execution rails.
- Provider-specific controls remain hidden unless the selected reviewed provider requires them.
- ISO and numeric timestamps normalize consistently; redacted receipts remain transport-neutral.

**Gate:** focused source gate 8/8 and unit case 1/1. Real local/provider concurrent lifecycle proof remains pending.

## W626F — Mobile secure path — SOURCE COMPLETE; SUPPORTED MOBILE PROOF PENDING

- Mobile prefers provider OAuth, short-lived credentials or a signed native/desktop companion path.
- Permanent provider keys are rejected from ordinary mobile browser storage.
- Providers without a reviewed safe mobile credential path receive an explicit unavailable/desktop fallback rather than insecure capture.

**Gate:** focused source gate 8/8 and unit case 1/1. Supported iOS/Android evidence remains pending.

## W626G — Spending, outage and moderation safety — SOURCE COMPLETE; REAL PROVIDER RECOVERY PENDING

- Per-job confirmation and owner-defined hard budget stops execute before submission.
- No automatic paid retry is permitted.
- Quota, rate limit, moderation, outage, expired result, region and account-state responses retain provider truth and recovery guidance.

**Gate:** focused source gate 8/8 and unit cases 2/2. Real account/provider failure evidence remains pending.

## W626H — BYOK privacy and certification — TOOLING COMPLETE; CERTIFICATION PENDING

- Fixed evidence rows require real desktop image and video outputs from both reviewed providers, a supported mobile path, cancellation/rate-limit/outage/expiry/moderation recovery, local history deletion/export and network-boundary proof.
- Local receipt history is bounded, redacted, exportable and explicitly deletable.
- The board fails closed unless a signed secure companion and complete real evidence are present.
- Source integration alone always returns `no-go-real-provider-evidence-pending`; EONAPP server proxying or media storage is forbidden.

**Gate:** focused source gate 9/9 and unit cases 3/3. Public availability remains no-go.

---

# 8. W627 — Unified Creator and Library

## W627A — One Create experience
- Image, Video, Website/Forge, Project/Document, Automation, and Guide from one surface.

## W627B — Beginner and advanced modes
- Simple goal-first form for beginners; explicit controls for experts.

## W627C — Unified job lifecycle
- Draft, preparing, waiting, running, failed, cancelled, complete, saved and deleted.

## W627D — Creator Library
- Images, videos, project outputs, prompts where user chooses to save them, workflow version, provider/runtime provenance, dimensions, duration and timestamps.

## W627E — Project integration
- Attach output to project, continue editing, create version, use in Forge, use in City, or export.

## W627F — Data survival
- Update-safe local persistence, deletion, export, encrypted Capsule inclusion rules, restore preview, conflict handling and migration.

## W627G — Creator certification
- Nontechnical usability, keyboard/touch, empty/error/offline states, privacy, quality and cross-route continuation.

### W627A–W627G completion receipt

- One `/create` surface now owns image/video intent capture and continues only into the established Local, Direct BYOK or Guide rails.
- Beginner mode is the default; advanced aspect, quality, seed, duration and prompt-save choices require explicit disclosure.
- The shared lifecycle is `draft → preparing → waiting/running → complete/failed/cancelled → saved/deleted`; Local and Direct receipts are projected rather than reimplemented.
- Creator Library accepts only digest-matched completed outputs. Metadata is localStorage-backed; explicitly saved media uses local IndexedDB; prompts are opt-in and secret-looking content is rejected.
- Project attachment, Forge handoff, City-safe reference and export are review-first. Raw prompt and media bodies are never copied into Project or City records.
- Generic encrypted Capsule portability includes creator metadata and lifecycle records but excludes raw media. Restore requires inspection, explicit confirmation and conflict choices; no automatic merge exists.
- The W627G board remains `no-go-real-creator-evidence-pending`. Source integration alone cannot certify image/video quality, keyboard/touch usability, offline recovery or cross-route continuation.

**Gate:** source complete. Public Creator certification remains blocked by the pending W625/W626 real-output proofs plus W627 real usability, continuation and update/export/restore evidence.

---

# 9. W628 — Genuine Dodo billing lifecycle

## W628A — Real customer checkout
- One controlled real customer/test-owner purchase through Dodo-hosted checkout.

## W628B — Real Dodo-origin webhook
- Prove provider-origin signature, event idempotency, ordering and D1 ledger write.

## W628C — Entitlement activation
- Correct tier, trial, dates, limits and UI refresh across devices/sessions.

## W628D — Customer portal and cancellation
- Portal access, cancellation timing, scheduled end, immediate/period-end behavior, reactivation where supported, and UI truth.

## W628E — Expiry, failed payment, refund and dispute
- Grace rules, entitlement downgrade, data retention, retry, refund, chargeback/dispute and support state.

## W628F — Billing certification
- Duplicate event, replay, out-of-order, forged event, stale session, tier change, downgrade, upgrade, tax/receipt links, privacy, support and rollback.

**Source completion receipt (2026-07-11):** W628A–F server and browser contracts are implemented. Checkout attempts are ledgered before provider calls; signed provider webhooks are the only entitlement authority; duplicate delivery can repair interrupted processing; out-of-order events cannot overwrite newer lifecycle state; portal, cancellation, reactivation and plan changes are reviewed server actions that wait for webhook reconciliation; payment failure, expiry, refund and dispute states fail closed. Real customer checkout, provider-origin webhook, production D1, receipt/tax, portal and reversal evidence remains pending, so public certification is **NO-GO**.

---

# 10. W629 — Referral, EONKEYS and Vault Reveals

## W629A — Signed referral attribution
- Signed-in inviter, invite token, invitee acceptance, one-level relationship, self-referral rejection and privacy boundary.

## W629B — Qualification events
- Define which events qualify: activated account/use milestone and retained paid customer where used. Click/share alone never grants a key.

## W629C — EONKEY grant ledger
- Idempotent server grants, caps, pending/vested/revoked/consumed state, timestamps and reason codes.

## W629D — Refund/dispute/abuse reversal
- Reverse unvested or policy-defined rewards; preserve auditable non-sensitive reason records.

## W629E — Feature-unlock redemption
- User chooses an eligible individual feature/limit/workflow/template/cosmetic.
- Signed server entitlement, expiry where temporary, revoke/recovery, and no whole-tier substitution.

## W629F — Referral and key UX
- Explain how keys are earned, pending, available, consumed and expired.
- No misleading money language.
- Separate ordinary sharing from referral participation.

## W629G — Vault Reveal integration
- EONKEY-compatible cosmetic/visual unlocks remain non-financial, non-transferable and clearly separate from generated media and subscriptions.
- Migrate legacy preview records into canonical Vault Reveal storage without data loss.

## W629H — Referral red-team certification
- Self-referral, duplicate accounts, replay, link tampering, refund, dispute, cap, multi-level, browser grant, race condition, support and privacy tests.

**Source completion receipt (2026-07-11):** W629A–H signed attribution, one-time server milestone receipts, qualification boundaries, append-only key transition journal, paid-retention grants, cap/reversal rules, individual feature redemption, referral/key UX, canonical Vault Reveal migration and fail-closed certification board are implemented. Real distinct-account identity, production D1, genuine Dodo retention/refund/dispute, race-condition, support and migration evidence remains pending, so public referral/EONKEY certification is **NO-GO**.

---

# 11. W630–W640 whole-app completion

## W630 — ChatGPT-style whole-app UX

- Root Chat/EONBOT is the calm default.
- Consistent composer, attachments, voice, model/runtime indication and action review.
- One sidebar, one mobile navigation system, one theme system, one loading/error language.
- Progressive disclosure, searchable commands, onboarding and context-sensitive help.
- Subscription/locked-feature prompts are useful and non-pushy.
- Route-to-route continuation without losing project context.

## W631 — Projects, Workspace, Forge and Automations

- Real project lifecycle, recent work, versions, outcomes and continue action.
- Forge create/preview/review/export/deploy boundaries.
- Automation draft, review, schedule, pause, run history, failure and cancellation.
- GitHub/deployment integration only when proven and permissioned.
- No fake remote execution.

## W632 — Vault, account and secure key custody

- Profile/account state, sessions, logout, delete request, provider keys, encrypted local storage, secure companion custody, backup/recovery, receipts and settings.
- Clear separation between account data, local work, provider credentials and generated media.
- Remove remaining old wallet/crypto language from active UI.

### W630–W632 source completion receipt

- W630 adds one calm whole-app command/search surface, route-aware help, a non-pushy locked-feature explanation, consistent context continuation and explicit composer/runtime truth without auto-starting voice or inventing cloud fallback.
- W631 adds local project lifecycle, bounded versions and outcomes, review-first Forge deployment receipts, and prepared-only automation scheduling. Remote execution or deployment is never claimed without permissioned provider evidence.
- W632 separates account/session metadata, local work, provider-credential custody, recovery reviews and generated media. Secret values are rejected from ordinary browser persistence and exports; identity is never described as backup or automatic sync; logout, deletion and restore remain review-first.
- Old wallet/crypto wording is identified for retirement rather than interpreted as active credential custody. The protected `/eoncity` runtime, W624B lifecycle, Productive Nocturne art direction, review-first action boundaries and evidence-gated certification remain unchanged.
- Source-only completion cannot certify real deployment, automation execution, account deletion, secure-companion signing, backup restore or cross-device continuity.

**Gate:** W630, W631 and W632 focused source gates pass 8/8 each. Public whole-app/account certification remains **NO-GO** pending genuine route, device, account, companion, provider, deployment and restore evidence.

## W633 — Every-route audit, alias retirement and navigation cleanup

- Inventory and classify every emitted root document and canonical public route.
- Force every retained compatibility URL to terminate at a live canonical destination in one hop.
- Keep historical alias documents source-only when retained tests still require them; never emit them in the production build.
- Remove current `.html` links and retired-route emissions from public documents.
- Require exactly one correct canonical tag per public document.
- Preserve advanced work destinations in the route-aware shell without presenting them as duplicate primary products.
- Keep production edge, service-worker, crawler and physical-device observations as genuine evidence rather than source claims.

**W633 source completion receipt (2026-07-11):** 36 public routes and 128 redirects are declared; all retained redirects resolve in one hop; 38 root HTML documents are classified; five historical alias documents are source-only; 30 public documents pass canonical-tag review; current public pages emit zero `.html` or retired aliases; six advanced destinations remain discoverable; generated Cloudflare redirect files match the route contract. Public production certification remains **NO-GO** pending edge probes, desktop/Android/iPhone-iPad walkthroughs, service-worker route continuity and crawler observation.

## W634 — Responsive layout, accessibility and input certification

- Certify desktop, narrow desktop, Android, iPhone/iPad, PWA and orientation behavior across every current route.
- WCAG-oriented keyboard, focus, landmarks, names, contrast, zoom, reduced motion, captions, form errors and screen-reader checks.
- Verify touch targets, pointer, keyboard, voice and controller-safe input boundaries without hiding unavailable actions.
- Preserve English source consistency and the existing localization architecture.

**W634 source completion receipt (2026-07-11):** one shared capability bridge now exposes compact/standard/wide layout, portrait/landscape/PWA state, keyboard/touch/pointer/controller/voice availability, reduced-motion, high-contrast, coarse-pointer target and native form-error boundaries without requesting sensors, audio, fullscreen or network access. Missing static fallback headings on Automations, EON Keys and Forge were repaired, and a duplicate Research Lab identifier was removed. The permanent W634 chain passed 68/68 with 273 maintained files, 941 current assertions, 47 explicit historical skips and zero failures. Real physical-device, screen-reader, controller and browser-specific evidence remains pending.

## W635 — Performance, caching, service-worker and update-safety hardening

- Enforce route, City and Creator performance budgets; optimize images, fonts, scripts and startup work.
- Certify cache headers, service-worker update safety, stale-cache prevention, offline truth, install flow and data survival.
- Keep route transitions and persisted work intact across a version update and rollback rehearsal.
- No fake “100% loaded” or fabricated performance claim.

**W635 source completion receipt (2026-07-11):** service-worker reads are restricted to current release-owned caches; redirects, cross-origin responses, private/no-store/no-cache responses, `Vary: *`, authorization/range requests, sensitive queries and query-bearing static assets are not cached. Registration is centralized with `updateViaCache: none`; update activation and reload are separate explicit owner actions; optional share/referral/job workloads are deferred from informational startup; and all 30 public build documents remain below owner-class gzip budgets. The maintained suite contains 274 files with 947 current passes, 47 explicit historical skips and zero expected failures; the permanent W635 receipt is authoritative for the final stage count and fingerprint. Real Cloudflare cache-header, offline, stale-client, rollback, storage-pressure and physical-device update evidence remains pending.

## W636 — Security, privacy, secrets and abuse-resistance audit

- Red-team auth/session, CSP, CORS/private-network, XSS, URL/token handling, webhook forgery/replay, D1 access and entitlement tampering.
- Audit local bridge origin authentication, provider-key custody, file/media validation, dependency/supply-chain risk and abuse controls.
- Re-run whole-tree secret scanning and verify ordinary export/sync paths reject secret-bearing payloads.
- Align privacy, terms and support copy with observed behavior.

**W636 source completion receipt (2026-07-11):** mutation endpoints now use same-origin enforcement plus strict media-type, bounded-stream and fatal UTF-8 parsing; JSON API responses deny framing, cross-origin embedding and ambient device permissions. Dodo checkout URLs are bound to the exact trusted host, public billing payloads suppress account/provider identifiers, and duplicate webhook IDs are cryptographically bound to the original payload hash. Browser admin-HMAC persistence and the plaintext Alchemy alias are retired; CSP telemetry is bounded and redacted; external workflow actions are immutable SHA-pinned; and the dormant legacy PBKDF2/AES provider-key store is migration-only, not post-quantum, with new writes and independent key backup import/export disabled. Privacy, Support and Vault copy now matches actual custody and support boundaries. The focused W636 gate passes 21/21. Independent penetration testing, Cloudflare WAF/rate-limit proof, real signed Dodo replay evidence and owner production-secret review remain pending.

## W637 — Production persistence, migration, backup and recovery certification

- Inventory LocalStorage/IndexedDB data, schema versions and ownership boundaries.
- Prove atomic migration, update survival, corrupted-state recovery, encrypted Capsule, restore preview, conflict handling and revoke/delete behavior.
- Prove user-confirmed Google Drive snapshots and cross-device recovery only where real evidence exists.

**W637 source completion receipt (2026-07-11):** five owned IndexedDB databases and their current versions/stores are machine inventoried. Encrypted portable restore now requires a digest-bound reviewed preview, resolves every conflict before mutation, and applies additions through one add-only IndexedDB transaction; stale review, conflict or injected batch failure writes no partial records. Every committed envelope is reread, and a post-commit mismatch is truthfully labeled `committed-verification-failed` with recovery required rather than being presented as an aborted restore. Workspace Capsule drift detection, encrypted rollback journal and receipt remain intact; raw Creator media, provider keys, OAuth/session and payment/referral secrets remain outside generic portability; Google Drive remains explicit `drive.file` encrypted snapshots with memory-only tokens and no automatic upload, restore or cross-device sync. The focused W637 gate passes 18/18. Real update/rollback, corrupted IndexedDB, quota pressure, interrupted restore, Drive and cross-device evidence remains pending.

## W638 — Billing, referral, Creator and provider evidence convergence

- Converge genuine Dodo checkout, signed webhook, D1 ledger, entitlement, portal, cancellation, reversal and recovery evidence.
- Converge genuine distinct-account referral/EONKEY qualification, grant, cap, reversal, redemption and Vault Reveal evidence.
- Converge local image/video and Direct BYOK provider, companion, cancellation, outage, moderation and saved-result evidence.
- Do not convert source completeness into provider/payment certification.

**W638 source completion receipt (2026-07-11):** one redacted evidence convergence layer now derives five independent lane verdicts across 59 billing, referral, local Creator, Direct BYOK and companion requirements. PASS requires a lane-accepted genuine evidence kind, owner review, artifact existence and SHA-256, redaction review, identifier digests and prior owner approval for destructive payment/customer actions. Source and synthetic artifacts cannot certify production. The historical launch audit no longer trusts typed `Status: PASS`; it consumes the same derived index. The focused W638 gate passes 10/10, while the production verdict remains `NOT-RUN` because no genuine owner/provider/payment/device evidence was supplied.

## W639 — Whole-app production rehearsal and launch-candidate freeze

- Run the complete production route, account, project, Forge, automation, City, Creator, billing, referral, backup and recovery rehearsal.
- Exercise incidents, feature kill switches, deployment rollback, migration rollback and evidence preservation.
- Freeze source revision, dependency lock, workflow registry, provider adapter versions, Dodo catalogue, route contract, legal/support copy and migration versions only after rehearsal passes.
- Produce fresh production screenshots and one machine-readable evidence index.

**W639 source completion receipt (2026-07-11):** a deterministic rehearsal/freeze layer now fingerprints 58 release-critical files across 10 categories: dependencies, immutable workflows, route contracts, service-worker/update rules, provider adapters, Dodo catalogue, referral ledger, persistence plus 12 SQL migrations, legal/support copy and the W638 evidence contract. Eleven whole-app rehearsal domains are independently classified, and a complete local build cannot freeze a launch candidate without the corresponding external evidence. The focused W639 source gate passes 10/10; production remains `NOT-RUN` and the launch candidate remains explicitly unfrozen.

## W640 — Final owner GO/NO-GO certification and launch handover

- Run the full maintained suite, certification v2, lint, build, security scan, browser/device matrix, Lighthouse/performance and accessibility evidence.
- Require City flagship, local Creator, Direct BYOK, billing, referral/EONKEYS and backup/restore evidence at their stated thresholds.
- Obtain independent red-team review and owner visual/product approval.
- Issue an explicit owner GO/NO-GO receipt and complete deployment/rollback/operations handover; no “mostly ready” launch language.

---

## 12. Recommended execution order

### Sequential foundation

1. W623E
2. W623F
3. W623G
4. W623H
5. W623I

### Parallel programmes after W623I

- City: W624A–L
- Local Creator: W625A–H
- Direct BYOK Creator: W626A–H

### Integration sequence

1. W627 Creator/Library integration
2. W628 real billing lifecycle
3. W629 referral/EONKEYS/Vault lifecycle
4. W630–W639 whole-app completion
5. W640 frozen final certification

No programme may declare launch readiness from source implementation alone. Real device, real provider/runtime, real billing, failure recovery and user-facing evidence are mandatory.

---

## 13. Backup rule after every wave

Every completed wave must produce:

1. Full rebuildable source ZIP excluding `.git`, `node_modules`, `dist`, `.wrangler`, secrets and bulky disposable browser caches.
2. SHA-256 checksum.
3. Changed-files report.
4. Machine-readable validation receipt.
5. Updated master launch ledger.
6. Next-wave start instructions.
7. Evidence boundary listing what was not proven.

The backup is not a launch claim. It is a reproducible checkpoint.

# CEO Decisions: Ads, Creator Tools, and Legacy Routes

Date: 2026-05-10

## Ads
- Give new users a 24-hour ad-free grace period to reduce early churn.
- Keep ad inventory live, but throttle sitewide ad injection so ads do not appear on every page view.
- Preserve banner inventory on high-intent pages such as the home funnel, reward access, vault, and workbench surfaces.
- Keep rewarded ads optional and value-led, not intrusive.
- Maintain bot protection and human-only gating.

## Creator Tools
- Prioritize Creator Studio as the main professional creation surface.
- Treat video, music, image, and code workflows as a single creation pipeline, not disconnected toys.
- Build toward a usable local-or-API-assisted workflow for:
  - image generation
  - music mixing / DJ-style recording
  - video generation / editing
  - coding and website/app creation
- Favor practical output quality over novelty features.

## Legacy Games and Tools
- Keep `/games.html`, `/tools.html`, and their route indexes as legacy compatibility surfaces.
- Replace skip-only coverage with active route checks that verify current behavior.
- Do not let archived pages dominate the launch path or the main navigation.

## Platform Direction
- Continue validating WorkBench, Vault, Market, Marketplace, and the creator stack as primary user value.
- Use Lighthouse, lint, build, unit, and E2E gates before deployment.
- Keep Cloudflare Pages as the deployment target, but do not rely on it as the only source of truth.

## CEO Decisions Addendum: Voice + Podcast + Ads (Execution)

### Voice Platform (Approved)
- Enable real voice workflows in Creator Studio: dictation, live subtitle transcription, and spoken EONBOT replies.
- Keep multi-provider TTS with quality tiers:
  - Balanced: lower-cost, faster generation.
  - Studio: higher-fidelity voice for premium outputs.
- Support conversational podcast generation with multi-speaker dialogue scripts and direct pipeline handoff to voice/video/distribution.
- Keep local-first fallback (browser speech APIs) so users can create without paid API keys.

### Creator Pipeline Coordination (Approved)
- Keep pipeline as one coordinated surface: script -> voice -> subtitles -> music -> video -> distribute.
- Keep AI Assist and one-click flow as setup accelerators, but preserve manual control for professional editing.
- Prioritize reliability over novelty: no hidden automation that blocks manual overrides.

### Ads Monetization Algorithm (Approved)
- Maintain 24-hour ad-free grace period for all new users.
- Use adaptive cadence driven by behavior signals:
  - Low engagement: slower cadence, longer cooldown.
  - Medium engagement: default cadence.
  - High engagement: moderate increase, never spammy.
- Run provider split tests with measurable metrics:
  - 50/50 weighted routing between Monetag and Adwixo where both are eligible.
  - Record provider impressions and clicks daily for comparison.
- Keep strict user-protection limits:
  - Human-only gating.
  - Rewarded ads optional and value-led.
  - No aggressive ad bursts during early onboarding.

### KPI Priorities (Approved)
- Primary: 7-day and 30-day retention.
- Secondary: revenue per active user and ad-provider eCPM.
- Guardrail: do not increase ad density if retention falls materially.

## CEO Decisions Addendum: Agent System Hardening + Remote Ops (Execution)

### World-Class Agent Architecture (Approved)
- Treat EONBOT, Creator Studio, WorkBench, and remote channel bridges as one policy-governed agent control plane.
- Enforce a shared action allowlist for autonomous execution paths:
  - plan
  - research
  - idea
  - script
  - voice
  - subtitles
  - video
  - distribute_prepare
  - publish (high-risk, approval-gated)
- Keep anti-abuse hard blocks always on:
  - no mass likes
  - no mass follows
  - no mass comments
  - no mass direct-message automation
- Keep high-risk actions approval-gated by default even when requested remotely.

### Sandboxing Policy (Approved)
- Remote channels (Telegram/webhook/API bridge) are sandboxed by default.
- Remote requests may generate plans and drafts, but publish actions must remain approval-gated.
- Remote command envelopes must include replay protection (nonce + timestamp window).
- Reject expired or replayed envelopes.
- Keep local human-in-the-loop approval as the final gate for publish and other high-risk actions.

### Telegram to EONBOT Control Plane (Approved)
- Telegram remote access is approved as a bridge architecture, not as direct browser token exposure.
- Keep Telegram bot tokens and signing secrets in backend-only secret storage.
- Browser runtime can consume remote requests only through verified bridge envelopes.
- End-to-end pattern:
  - Telegram user request
  - backend verification and policy pre-check
  - signed/verified envelope to EONAPP runtime
  - EONBOT plan creation
  - local approval gate for high-risk execution

### EON Browser Agent Access (Approved)
- Agent access to EON Browser workflow is approved for research and preparation tasks.
- Keep any publish/transaction side effects outside browser automation by default.
- Use bounded-scope tasks and visible execution status for user trust.

### All-in-One Assistant Direction (Approved)
- Position EONAPP as an all-in-one AI work operating surface:
  - creator pipeline
  - app/website build support
  - business operations support
  - customer reply/copilot support
  - distribution coordination
- Keep reliability and deterministic controls above novelty behavior.

### Gap Status and Build Phases (Approved)
- Phase 1 (implemented this pass):
  - shared policy-enforced orchestration module in frontend runtime
  - Creator Studio orchestration hooks for one-click and AI-assist pipeline staging
  - EONBOT command parsing for explicit orchestration requests
  - remote envelope parsing hook with replay protection and sandbox defaults
- Phase 2 (backend hardening required):
  - signed command verification service
  - secret-managed Telegram ingress worker
  - persistent job scheduler with audit log and retries
  - approval API and operator console
- Phase 3 (scale and quality):
  - model-routing QoS and cost policy engine
  - deeper tool adapters for build/deploy/distribution targets
  - observability stack for job success rate, latency, and retention impact

### Engineering Checklist (Execution)
- Control plane
  - [ ] Finalize shared agent action schema across Chat, Creator Studio, WorkBench.
  - [ ] Keep publish and transaction actions gated with explicit approval records.
- Security
  - [ ] Store Telegram and provider secrets only server-side.
  - [ ] Add nonce replay cache and timestamp window checks in backend ingress.
  - [ ] Add signed-envelope verification endpoint and reject unsigned remote commands.
- Orchestration runtime
  - [ ] Persist orchestration jobs with status lifecycle and retry policy.
  - [ ] Add per-step timeout, cancellation, and failure isolation.
- Product UX
  - [ ] Show clear reason when a step is blocked by policy.
  - [ ] Show pending approvals and required operator action in UI.
  - [ ] Keep one-click creator flow deterministic and inspectable.
- Distribution
  - [ ] Keep manual and review modes as default-safe options.
  - [ ] Keep provider metrics and post outcomes logged daily.
- Validation
  - [ ] Run lint/build/unit/E2E before release.
  - [ ] Add policy tests for blocked automation and remote publish gating.
  - [ ] Add regression tests for remote command replay rejection.

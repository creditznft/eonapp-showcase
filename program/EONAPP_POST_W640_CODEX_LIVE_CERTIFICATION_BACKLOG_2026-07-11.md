# Post-W640 Codex live certification backlog

Date created: 2026-07-11  
Purpose: preserve every owner-account, deployed-runtime and physical-device proof that source coding cannot honestly complete.

This backlog is cumulative. Codex must not remove an item because source tests pass. Final GO/NO-GO requires redacted live evidence for every applicable item.

## Cloudflare inventory and scale

- Inventory every Pages project, Worker, route, custom domain, D1 binding, environment variable name, R2/KV/Queue/DO binding and cron trigger.
- Mark each Worker/Function as necessary, compatibility-only or removable. Prove static assets are not unnecessarily routed through Workers.
- Confirm Production and Preview bindings separately.
- Keep `EON_BILLING_DB -> eonapp-billing`.
- Bind `EON_REFERRALS_DB -> EONAPP_REFERRALS_DB` without deleting or resetting data.
- Keep identity production and preview databases isolated and untouched.
- Capture D1 Time Travel bookmarks before each migration.
- Apply reviewed migrations and save table/index/view-name receipts only.
- Record database sizes, rows read, rows written, query latency, Worker requests and CPU baseline.
- Run `EXPLAIN QUERY PLAN` for every billing/referral lookup and prove intended indexes are used.
- Confirm no main D1 approaches the 7 GB review or 8 GB shard-preparation thresholds.
- Exercise rollout disable/enable and deployment rollback without deleting rows.

## Referral and EONKEY lifecycle

- Two separate signed-in accounts and separate browser profiles/devices.
- Proof-of-possession identity binding.
- Copied-link identity theft rejection.
- Self-referral rejection.
- One inviter per invitee.
- Useful activation grants one Signal Key under cap.
- No reward for click, copy, share, post, impression or trial start.
- Real Dodo-origin positive event creates pending 14-day retention state.
- Duplicate webhook repairs any split billing/referral delivery.
- Mature retained referral grants Builder/Builder/Power progression under yearly cap.
- Redemption activates only an allowlisted individual feature/cosmetic.
- Refund, dispute, cancellation, expiry and payment failure reverse derived value.
- Browser storage edits cannot create balance or entitlement.
- Rate-limit behavior returns 429 without writing a reward event.
- Ordinary Share and subscriptions continue when referral rollout is disabled.

## Share Command Center

- Top-right Share on every active general app page and documented exceptions only.
- Signed invite, creation, project, City, Vault Reveal and milestone cards.
- Real local image native sharing.
- Real local video native sharing.
- Locally generated PNG share card.
- Manual copy/download fallback where native file sharing is unavailable.
- No automatic social posting, no media upload to EONAPP and no private-data leakage.

## Multilingual voice and accessibility

- English, Spanish, Chinese, Japanese, Korean, French, German, Portuguese, Russian, Arabic and Hindi.
- Dictation permission granted/denied/revoked states.
- Recognition accuracy receipt on supported browsers/devices.
- Spoken reply availability and device voice fallback.
- OS dictation/read-aloud fallback where Web Speech is unavailable.
- Arabic RTL layout and focus order.
- Chinese/Japanese/Korean IME composition safety.
- Selected language carried into Local and Direct BYOK model prompts.
- No claim of offline STT/TTS until airplane-mode local-companion proof passes.

## Creator and AI

- Real local image output through EONAPP.
- Real local text-to-video or image-to-video output through EONAPP on a supported device.
- Correct safe fallback on the RTX 3050 approximately 4 GB VRAM machine.
- Direct BYOK image and video provider proofs with user-owned keys and no EONAPP proxy.
- Cancel, timeout, retry, cleanup, save, reopen, export and provenance.

## Billing

- Real controlled Dodo customer checkout.
- Dodo-origin signed webhook.
- Trial, active entitlement, portal, cancellation, expiry, failed payment, refund and dispute.
- Duplicate, replay, out-of-order and forged event checks.
- Correct tier, dates and cross-session refresh.

## EON City and whole app

- Compare fresh desktop and mobile runtime captures against the W624A Productive Nocturne target frames.
- Score the Command District with the W624A weighted scorecard; prove at least 9.0/10 before final-quality district expansion.
- Obtain owner visual/product approval of at least 9.5/10 with no flagship category below 9.0 before final flagship certification.
- Verify the Wayfinder player, EONBOT Orbit, five productive NPC roles, human-scale architecture, restrained palette, readable nocturne and reject list in the actual runtime rather than source strings.
- Fresh desktop/mobile screenshots and videos from the frozen release candidate.
- Real controls, missions, persistence, recovery and performance evidence.
- Every route live/preview/local/proof-gated/compatibility/retired classification.
- Accessibility, PWA update, offline truth, data survival, backup/restore and rollback.

## Final receipt

Codex must deliver:

- exact deployed commit and build provenance;
- redacted Cloudflare configuration inventory;
- machine-readable evidence index;
- all live test receipts;
- unresolved risks and severity;
- explicit GO or NO-GO.

No “mostly ready” or source-only launch claim is permitted.

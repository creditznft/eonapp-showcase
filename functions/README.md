# Active Cloudflare Pages Functions

## Active privacy-safe routes

- `csp-report.js` — privacy-bounded CSP report receiver.
- `api/auth/google/start` — optional identity-only Google OAuth start.
- `api/auth/google/callback` — OAuth code/PKCE callback with server-side ID
  token validation.
- `api/auth/session` — display-safe guest/session state only.
- `api/auth/logout` — same-origin session deletion.
- `api/account/delete-request` — explicit deletion of only the minimal D1
  account/session metadata.
- `api/sync/status` — explicit Sync Basic availability display only; it never uploads.
- `api/sync/records` and `api/sync/records/tombstone` — fail-closed manual-proof
  transport only when a dedicated `EON_SYNC_DB`, identity configuration and both
  manual-proof flags are present. They are not public Sync activation.
- `api/ai/vexrail` — reviewed same-origin Sponsored Vexrail proxy for country/budget-eligible free accounts and explicitly opted-in paid/trial/grace accounts. It keeps Vexrail publisher credentials out of browser code and never accepts or forwards user BYOK credentials. Eligible anonymous visitors may spend exactly one bounded Sponsored Vexrail request before sign-in when the guest one-shot, country, human-verification and profitability gates allow it; sign-in is required to continue. Recognized paid/trial/grace sessions stay sponsored-chat-off by default and require explicit provider selection. Local AI is never routed here. The route layers account hourly/daily limits, salted cross-account network limits, per-country and global daily circuit breakers, server-trusted Cloudflare country/ASN policy, optional Bot Management signals when present, and Production Turnstile human verification before Vexrail upstream contact. This does not disable separately opt-in rewarded Sponsor Transmissions.

Google identity functions are fail-closed until the Cloudflare Pages D1 binding,
non-secret variables and encrypted secrets are all configured. The ordinary public
guest shell remains available when identity is unavailable; Sponsored Gemini does not.

## Never store or reactivate

The identity functions must not store Chat, prompts, raw AI outputs, Vault data,
API keys, recovery material, files, projects, Realm layouts, City progress,
Google access/refresh tokens, raw email by default, or card data. They must not
reactivate archived payment, token, reward, referral, social-verification or
Telegram handlers.

W412 Sync Basic transport does not store Vault/API keys, recovery material, raw media, local model binaries, caches, wallets, payments, referrals or rewards. It remains disabled until a dedicated D1 binding and manual two-device proof are deliberately configured.


## RT92 Vexrail deployment configuration

The Vexrail route is fail-closed unless all of the following are configured in the
Cloudflare Pages environment:

- `EON_VEXRAIL_ROLLOUT` — non-secret rollout value (`testing` in Preview,
  `production` in Production; `disabled` locally by default).
- `VEXRAIL_SECRET_KEY` — **encrypted server-side secret only**. Never commit it or
  expose it to browser code/logs.
- `VEXRAIL_PUBLISHABLE_KEY` — configure server-side with the route even though the
  provider designates it publishable, so the integration remains centralized.
- `EON_VEXRAIL_MODEL_ECONOMICS_JSON` — required verified price/quality registry. RT92 queries Vexrail `/v1/models` at runtime and selects the cheapest qualified currently available model for the request class. There is no fixed or fallback model ID in EONAPP Production source.
- Existing `EON_TRUST_DB` plus encrypted `EON_TRUST_RATE_LIMIT_SALT` — always required. Launch source uses 20 requests/account/hour + 60/account/day for signed-in FREE Sponsored Gemini; paid opt-in uses 30/account/hour + 100/account/day. Cross-account network ceilings are 80/hour + 300/day, the initial per-country request ceiling is 400/day, and the Production-wide request circuit breaker is 1,000/day. A second weighted ledger estimates prompt+reserved-output token units and starts at 80,000/free account/day, 120,000/paid-opt-in account/day, 750,000/country/day and 2,000,000/global/day in Production. Those token units are conservative EONAPP guard estimates, not Vexrail invoices or currency amounts. If Trust authority is unavailable, Vexrail fails closed.
- `EON_TRUST_DB` must be migrated through Trust schema v2 (`migrations/trust/0002_vexrail_economic_aggregate.sql`) before Sponsored Gemini becomes eligible. The v2 economics table is aggregate-only by day/country/access class and stores admitted request count, estimated token units and provider token totals when the non-streaming response reports them. It does not store account IDs, IPs, conversation IDs, prompts or response text. Missing economics schema fails closed before Vexrail contact.
- `EON_BILLING_DB` — required for every Sponsored Gemini request so the route can distinguish signed-in FREE from paid/trial/grace and preserve paid ad-free defaults. Preview therefore requires a separate non-production billing D1 plus working Preview auth before Sponsored Gemini can be tested. Never point Preview at the Production billing database.
- Production and Preview both require working identity for Sponsored Gemini. A signed-out visitor receives `vexrail_sign_in_required`; a broken/disabled identity authority fails closed and cannot become a guest bypass.

Set the two credential values using Cloudflare secret/environment controls rather
than Git-tracked `wrangler.jsonc`. The client only calls `/api/ai/vexrail`; it never
receives either publisher credential.

## RT92 display and rewarded monetization deployment boundary

- Preview needs its own non-production `EON_BILLING_DB` **and** `EON_REFERRALS_DB`
  before the full monetization matrix can be exercised. Apply billing migrations
  through schema v2 and referral migrations through schema v4. Never bind Preview
  to either Production database.
- Ordinary display uses the approved ExoClick publisher zones only. The launch
  adapter is fail-closed behind `EON_DISPLAY_ADS_ENABLED`, `EON_EXOCLICK_ENABLED`
  and per-format flags. Approved authority is Native 1x1 `6004048`, Multi-Format
  `6003992`, 300x250 `6003982`, Outstream `6004042`, and Sponsor VAST `6004002`.
  Adsterra is retired and its provider hosts are absent from active CSP routes.
- `EON_EXOCLICK_NATIVE_ENABLED` enables the direct 1x1 Native fallback.
  `EON_EXOCLICK_MULTIFORMAT_ENABLED` enables the standard Multi-Format content
  unit only after its ExoClick dashboard child-zone composition has been reviewed.
  `EON_EXOCLICK_OUTSTREAM_ENABLED` may replace (never stack with) the single
  standard slot on the approved Projects surface. ExoClick dashboard SFW filters
  remain mandatory and the embed adds the documented SFW request parameters as
  defense in depth.
- AdSense is verification-only in this source (`/ads.txt` plus ownership meta).
  Display inventory stays off pending approval, consent/CMP readiness and a
  separate policy-safe placement review.
- Rewarded Sponsor EONKEYS stay fail-closed until all of
  `EON_REWARDED_ADS_ENABLED=true`, a supported `EON_REWARDED_PROVIDER` and
  `EON_REWARDED_PROVIDER_VERIFIED=true` are deliberately configured **and** a
  server-verifiable provider completion adapter exists. Browser callbacks,
  ordinary display impressions/clicks and timers can never mint a Sponsor EONKEY.

### RT92 Sponsored Gemini economic guard

The server route requires identity, geography, network, human-verification and nested budget policy before upstream Vexrail contact:

- `EON_VEXRAIL_GEO_MODE`: `testing`, `selected_countries`, `all`, or `off`. Production launch uses `selected_countries`; Preview uses `testing` until headed proof is complete.
- `EON_VEXRAIL_COUNTRIES`: ISO-3166 alpha-2 **learning/safety allowlist**, not a profitability hard-code. Current Production source is configured for `US,CA,GB,DE,IN`; expansion or contraction must follow measured economics and regional policy/consent readiness.
- `EON_VEXRAIL_PROFIT_GOVERNOR_MODE`: `observe` in Preview and `enforce` in the Production source contract. Production requires reconciled economics to graduate cohorts; an unreconciled country/request class is limited to `EON_VEXRAIL_LEARNING_PROMPT_BUDGET` accepted prompts before it fails closed for reconciliation.
- `EON_VEXRAIL_AI_COVERAGE_TARGET`: initial realized sponsored-AI revenue / actual Vexrail cost target, `1.25`. `EON_VEXRAIL_PROFIT_MIN_PROMPTS` and `EON_VEXRAIL_PROFIT_WINDOW_DAYS` bound the sample/window. `EON_VEXRAIL_LEARNING_LOSS_BUDGET_MICROS` is deliberately `0` in source until the owner explicitly approves a learning-loss budget from real economics.
- `EON_VEXRAIL_MODEL_ECONOMICS_JSON`: required non-secret verified routing registry for publisher-funded Sponsored Gemini. Availability alone is never treated as price. If the registry is absent/unverified, or live `/v1/models` has no qualified covered model for the request class, Sponsored Gemini fails closed without spending publisher credits.
- `EON_VEXRAIL_PAID_SPONSORED_OPT_IN`: allows recognized paid/trial/grace accounts to select Sponsored Gemini explicitly while ordinary advertising stays off. Paid opt-in obeys the same country/economic gate.
- `EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP`, `EON_VEXRAIL_FREE_DAILY_CAP`, `EON_VEXRAIL_PAID_DAILY_CAP`: account-level economic/abuse ceilings. Current launch values are 30 paid/hour, 60 free/day and 100 paid/day; FREE retains the existing 20/hour Trust bucket.
- `EON_VEXRAIL_NETWORK_HOURLY_CAP` / `EON_VEXRAIL_NETWORK_DAILY_CAP`: salted cross-account network ceilings (80/hour and 300/day by current source) to reduce account-farm/proxy-pool abuse. Raw IP addresses are not persisted in the Trust ledger.
- `EON_VEXRAIL_COUNTRY_DAILY_CAP`: current pilot ceiling 400 accepted requests/country/day, preventing one market from consuming the whole Vexrail wallet during measurement.
- `EON_VEXRAIL_GLOBAL_DAILY_CAP`: Production-wide D1-backed request circuit breaker. Current source starts at 1,000 accepted requests/day.
- `EON_VEXRAIL_FREE_DAILY_TOKEN_CAP` / `EON_VEXRAIL_PAID_DAILY_TOKEN_CAP`: token-weighted account budgets. Current source starts at 80,000 estimated units/day for FREE and 120,000/day for paid explicit opt-in.
- `EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP` / `EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP`: broader weighted circuit breakers. Production starts at 750,000 estimated units/country/day and 2,000,000/global/day. Preview is intentionally tighter at 300,000/country/day and 500,000/global/day. These are EONAPP conservative estimates based on message characters plus reserved output tokens, not claims about Vexrail's actual metered token count or monetary spend.
- `EON_VEXRAIL_BLOCKED_ASNS`: optional runtime list of Cloudflare-observed ASNs to deny after owner review/abuse evidence. Do not invent or hard-code consumer VPN lists in source.
- `EON_VEXRAIL_BOT_SCORE_MIN`: if Enterprise Bot Management signals are actually present, low-score/verified automated requests fail before Vexrail. Absence of Enterprise bot signals is not misrepresented as bot detection.
- `EON_VEXRAIL_REQUIRE_CF_METADATA=true` in Production: country and ASN must be available from Cloudflare request metadata. Browser-supplied geography/network claims are ignored.
- `EON_VEXRAIL_TURNSTILE_MODE=required` in Production: a fresh Turnstile token is validated server-side with Siteverify for action `sponsored_gemini` and an approved hostname before each upstream request. Preview can remain `off` until its own widget is configured, then should certify the required mode before Production.
- `EON_VEXRAIL_TURNSTILE_SITE_KEY` is a non-secret runtime value; `EON_VEXRAIL_TURNSTILE_SECRET` is an encrypted server-side secret; `EON_VEXRAIL_TURNSTILE_HOSTNAMES` is an explicit hostname allowlist. Use separate Preview and Production widgets/secrets.

Cloudflare sees the connecting IP/ASN, not a hidden residential address behind a VPN. EONAPP therefore does **not** promise that VPNs/proxies are impossible. It protects Sponsored Gemini with signed-in identity, salted network limits, owner-reviewed ASN blocks, available Cloudflare bot signals, Turnstile and nested request/token budgets. A denied country/network, failed human verification, exhausted account/network/country/global cap, broken Trust authority, broken identity authority or missing billing authority fails before Vexrail upstream contact.

Before those spend guards are consumed, the proxy rejects some obvious credentials, contact identifiers, government/financial identifiers, payment-card patterns and sensitive-record phrases using coarse server-side categories only; matched values are not returned. This is intentionally conservative and cannot guarantee perfect sensitive-data detection. The browser also keeps EONAPP local memory, recent local activity context and queued client-only research out of Sponsored Gemini prompts. The server derives the upstream Vexrail conversation identifier from a salt + account + browser conversation id, so the raw EON account id is not sent as that header.

EONAPP forwards only bounded OpenAI-compatible `model/messages/temperature/max_tokens/stream` fields to Vexrail. Browser-supplied provider keys, arbitrary tools and Google Search/Maps grounding controls are not forwarded, preventing an accidental grounding/tool cost multiplier. Guide Mode, Local AI and BYOK remain separate unsponsored fallbacks; EONAPP never silently switches a denied Sponsored Gemini request to another paid cloud provider. Both batch and SSE Sponsored Gemini transports acquire the same Turnstile token when the deployed environment requires human verification.

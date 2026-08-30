# W260-R3 A1/A2/A3 local evidence status

## Verified local-static results

- Current-product unit suite: **220/220 passing**.
- Lint: **zero warnings**.
- Production build: **193 emitted files**.
- Route inventory: **121 public route variants**.
- All-route local static delivery: **121/121 route variants** resolved through internal redirects to terminal HTML.
- Site audit: **40 HTML files**, sitemap and precache verified.
- Root production dependency audit: **0 vulnerabilities**.
- Smart Contracts production dependency audit: **0 vulnerabilities**.
- W258 C0-I offline verifier stays fail-closed; C0-I tests: **9/9 passing**; offline compiler-source batch: **16/16 labels**.

## Explicit non-passes / open limits

- Lighthouse scores are **not collected** in this environment. Managed Chromium produced `chrome-error://chromewebdata/` on the first local route before page tracing. This is an environment-blocked receipt, not a page score or performance failure.
- W259/W266 device, Preview/live, PWA, visual, accessibility and human-review evidence remains open.
- W260 stays **NO-GO**.
- W258 C0-I lacks live RPC/runtime/role/custody/manifest and toolchain-risk closure; W261 remains blocked.
- Referral rewards and access milestones remain intentionally inactive. No Cloudflare/D1 deployment change is authorised.
- Root full dev audit remains **6 advisories** (1 low, 1 moderate, 4 high). Smart Contracts full dev audit remains **53 advisories** (18 low, 27 moderate, 8 high). These are open toolchain risks, not production audit failures.

# W272 — CSP, network and supply-chain evidence plan

## W272-A0 completed locally

- The checked-in Pages header files are synchronized and preserve a restrictive default script/object/base/form policy.
- The local gate rejects wildcard script/connect sources and unsafe inline/eval script execution in the default CSP.
- Telegram framing remains a route-specific exception, not the site-wide default.
- The CSP reporter remains size-bounded, URL-redacting and does not inspect browser cookies or authorization headers.
- Vite sourcemaps are opt-in and the lockfile has no mutable `file:` or Git dependency resolutions.

## Deliberate decision: do not narrow BYOK network schemes blindly

The existing CSP uses broad `https:`/`wss:` allowances for connections and broad HTTPS media/frame paths. That is **not accepted as a final allowlist**. It stays pending because narrowing it without Preview/provider verification could break user-owned BYOK providers, Telegram or valid content flows. W272-A0 records this explicitly; it does not call the policy final.

## Required external evidence before W272 can close

1. Capture Preview and live response headers for canonical, Telegram and retired routes.
2. Browse normal app flows and user-owned BYOK verification paths; review only redacted CSP receipts.
3. Produce an observed endpoint inventory and approve a staged allowlist narrowing plan with rollback.
4. Run a current dependency audit, generate/review an SBOM and make a remediation decision.
5. Verify source-map behavior on Preview/live and retain only redacted evidence.

## Boundary

No CSP header was tightened in this source freeze. W272-A0 does not alter W260 NO-GO, Cloudflare, deployment, D1, referral/milestone, reward, wallet, chain, provider or commercial state.

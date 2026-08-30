# W476-B Quality Gate Report — 2 July 2026

## Result

**W476-B source implementation: PASS.**  
**W476-B deployment/browser/device evidence: OPEN / NOT CERTIFIED.**

The wave adds a controlled, redaction-safe evidence runner and the full proof protocol. It deliberately cannot self-approve a public release, Dodo, payment, Local AI media or any external integration.

## Implemented

- `config/w476-b-production-proof-contract.mjs`
  - six core document routes;
  - 18-Function coverage model;
  - nine manual evidence requirements;
  - opt-in network only and strict no-private-artifact rules;
  - all release/payment/Dodo/local-media approval flags fixed `false`.
- `scripts/w476-b-production-proof.mjs`
  - no-network dry run by default;
  - same-origin redirect-safe public document probe;
  - selected header/CSP reporting booleans only;
  - safe read-only Function checks, denied-method checks and anonymous Sync fail-closed check;
  - non-critical Reporting API transport/rejection/preflight check;
  - optional ephemeral Chromium observation that retains only origin/resource-type and console-error counts.
- `functions/csp-report.js`
  - OPTIONS now returns the collector endpoint’s own origin, not a hard-coded production value or caller-provided Origin. This keeps Cloudflare preview proof narrow and correct.
- Source gate, current-unit inclusion, test coverage and a merge/proof runbook.
- Complete W476–W480 master roadmap, including the gated W479-M Local Creator Media programme.

## Local verification recorded

| Gate | Result |
|---|---|
| Node syntax checks | PASS |
| Lint | PASS, zero warnings |
| W476 release verifier | PASS |
| Current runnable unit suite | **531/531 PASS** |
| Production build | PASS |
| Build smoke | PASS |
| Site audit | PASS |
| Launch readiness | PASS |
| W476-B source gate | PASS |
| Local Cloudflare Pages document/header matrix | PASS — six routes, canonical redirects handled |
| Local CSP collector transport | PASS — accepted `204`, foreign document `400`, OPTIONS `204`, same-origin policy |
| Local safe/denied Function matrix | PASS — 16 automated paths; Sync anonymous read fail-closed `503` |

## Environment limits encountered

1. This coding environment could not resolve `eonapp.ch` through Node/curl. The failed public probe is an **environment DNS limitation**, not a production verdict.
2. Chromium launched but navigation in this environment is blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). This is an **environment browser limitation**, not browser proof of the app.
3. Therefore no live result, local runtime compatibility result, user-device result, CSP log review or owner release decision was claimed.

## Required W476-B evidence after reviewed deployment

1. Run the redacted observer on a reviewed Cloudflare preview, then `https://eonapp.ch`.
2. Capture the browser CSP delivery result and have an authorised operator verify redacted log fields only.
3. Run the full conditional/API negative matrix on a disposable preview without creating/altering real accounts, relay data or Sync data.
4. Prove Ollama, LM Studio and Jan from real browsers/devices; record CORS/PNA/no-fallback results truthfully.
5. Prove default-off analytics, PWA update/rollback/data survival, desktop/Android/iOS accessibility/locale/voice and owner evidence review.

## Release truth

- `productionReleaseApproved`: **false**
- `paymentActivationApproved`: **false**
- `dodoActivationApproved`: **false**
- `localImageVideoAdapterClaimed`: **false**

**Next implementation lane:** W477 route/SEO/legacy cleanup begins only after the reviewed W476-B network-origin evidence identifies what should be retained, narrowed or quarantined.

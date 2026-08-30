# W361 — Shared CityWorldState, Core Route Truth, and Automation Reality Audit

## What this wave changes

W361 adds a finite, local-only transition receipt shared by:

- EON City Portal
- City Overview
- Spatial Command Space
- Immersive Work Mode
- Chat
- Workspace, Projects and Library
- Automations
- Local AI
- My Realm Studio

A normal link remains the navigation mechanism. The receipt records only the mode names, an optional safe landmark identifier, a timestamp and a local transition identifier. It never stores prompts, AI output, credentials, private files, payment data, wallets or background execution state. It never starts a provider request, automation, fullscreen session or background task.

## C-00: production-truth repair

Source work cannot repair an already-published Cloudflare deployment by itself. The operator must first make production match the intended commit and then run the opt-in core-route probe:

```bash
npm run qa:w361-city-mode-transition
npm run routes:sync
npm run build
npm run qa:w361-production-core-route-probe -- --confirm-network --base-url https://eonapp.ch --out artifacts/w361-production-core-route-probe.json
```

Before promotion, verify in Cloudflare Pages that the production deployment uses the intended Git commit, build command and `dist` output directory. Do not call production green until every route in the report returns its expected marker with no redirect loop.

Rollback condition: any core route returns a non-200 response, exceeds the redirect-hop limit, has a missing marker, or exposes a different deployed revision than the tested Preview.

## Current automation truth

The current Automations surface can create local workflow drafts, inspect them, run local simulations and record local approval decisions. It does not yet have a durable scheduler, external connection vault, OAuth broker, queue, worker, retry system, provider executor or background runner. A reviewed provider catalog is not a live integration.

The phrase “automate anything” is not accurate for the present build. The truthful product promise today is: “Describe a recurring task, receive a reviewable local plan, simulate it, and decide what a future verified connection should be allowed to do.”

## Next automation program

1. **A-01 Capability and effect contracts** — classify every tool action as read, draft, write, publish, spend, delete or credential-admin.
2. **A-02 Connection broker** — explicit OAuth/API-key/companion setup, least-privilege scopes, connection health, revocation and no raw secret display.
3. **A-03 Execution runners** — separate local runner and server scheduler contracts; no browser-tab background illusion.
4. **A-04 Adapter strategy** — native adapters only for highest-value actions; use verified bridges/MCP for long-tail integrations instead of recreating thousands of connectors.
5. **A-05 Approval and policy engine** — risk rules, per-run limits, preview/diff, time-bound approval, two-step confirmation for publish/spend/delete.
6. **A-06 Receipts, retries and recovery** — immutable user-readable receipts, idempotency keys, error taxonomy, retry/backoff, dead-letter review and user cancellation.
7. **A-07 City and Chat interface** — City shows only truthful state summaries; Chat handles intent, review and exceptions; native surfaces expose detailed execution receipts.
8. **A-08 limited beta** — start with low-risk read/draft flows and a very small approved connector set before any publish/write lane.

## Google Login decision note

No Google Login implementation is included in W361. It requires a separately approved identity/account boundary because an optional convenience account must not silently turn EONAPP’s local City, Realm identity, Vault or prompt history into cloud data.

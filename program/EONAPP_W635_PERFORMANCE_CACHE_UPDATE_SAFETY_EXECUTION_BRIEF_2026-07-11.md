# EONAPP W635 — Performance, Cache and Update Safety Execution Brief

## Scope

Freeze bounded initial-transfer budgets, current-release-only cache ownership, safe service-worker registration, explicit update activation/reload separation, stale-client prevention and honest offline/update claims.

## Source acceptance

- Every current public document is owned by a route-class gzip budget.
- Runtime cache reads never fall through to obsolete or unknown namespaces.
- Redirected, cross-origin, private/no-store/no-cache, `Vary: *`, authorized/range and sensitive-query responses are rejected from cache.
- Query-bearing static assets are network-only.
- Service-worker registration uses `updateViaCache: none` and never applies an update automatically.
- Activation and reload require separate explicit user actions.
- Optional share/referral/job workloads are deferred outside relevant workflows.
- Source and build W635 gates are permanent predeploy stages.

## Evidence fence

A source/build pass does not prove Cloudflare cache headers, installability, offline behavior, update continuity, rollback, storage pressure or physical-device persistence. Those remain genuine evidence lanes.

## Permanent commands

```bash
npm ci
npm run verify:codex-predeploy
```

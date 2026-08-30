# W283-A0 — Cloudflare edge, D1 and rollback evidence runbook

## Decision

This is an **owner/Codex read-only evidence runbook**. It does not authorise a Cloudflare deploy, Pages binding change, Worker change, D1 migration, D1 write, secret change, referral activation, reward, wallet, payment, chain action or public launch claim.

The existing Cloudflare D1 database may be used **only after** this inventory proves what it contains, who owns it, what it is bound to, and how it can be rolled back. Existing remote resources are not proof that their schema or past deployment is safe for a future program.

## Required owner evidence (outside Git)

1. Record the authenticated owner role and the UTC timestamp. Do not include access tokens, account IDs, database IDs, secret values, user records, raw IPs, referral codes or private data.
2. Inventory Pages deployments and note Preview/production identifiers and rollback candidate by label only.
3. Inventory D1 database names. Identify the possible referral-tracking database by name only.
4. For that candidate database, inspect **schema metadata only** before looking at any row-level data. Record table and index names only.
5. Record the binding name and environment from dashboard/CLI by name only, plus whether it is actually attached to Pages/Workers. Do not copy secrets.
6. Rehearse a Preview rollback with the owner. Record only pass/fail, timestamp and operator role.

## Read-only CLI template

Run from an authenticated owner workstation after Codex merges the source locally. Preserve the raw output privately, redact it, and attach only a redacted evidence index outside the repository.

```bash
npm ci --include=dev --no-audit --no-fund
npx wrangler pages deployment list --project-name=eonapp-ch
npx wrangler d1 list
npx wrangler d1 execute <candidate-referral-database-name> --remote --command "SELECT name, type, tbl_name FROM sqlite_master WHERE type IN ('table','index') ORDER BY type, name;"
```

Stop immediately when a command would create, bind, deploy, migrate, mutate, delete, reveal a secret, or retrieve user rows. Do **not** run `wrangler d1 migrations apply`, `wrangler d1 execute` with a write statement, `wrangler deploy`, `wrangler pages deploy`, `wrangler secret put`, `wrangler d1 create`, or dashboard toggles during this phase.

## Cloudflare AI / Codex prompt

> Act as a read-only Cloudflare evidence assistant for EONAPP. Do not deploy, create, bind, migrate, write, delete, roll back, enable referrals, enable rewards, modify secrets, or show secret values. Inventory the Pages project `eonapp-ch`, its deployment labels, and D1 database names. For the candidate referral-tracking D1 database, inspect only `sqlite_master` table/index metadata. Return a redacted JSON summary with timestamp, owner role label, command class, resource names, binding names, schema table/index names, and PASS/BLOCKED/UNKNOWN status. Do not return database rows, referral codes, IPs, user IDs, tokens, account IDs, secret values, or query results containing data.

## Exit for W283-A0

W283-A0 is complete only when a named owner records read-only inventory and an observed Preview rollback drill. It remains **not launch evidence** until W278, W279, W282, W284 and the W260 external board are independently closed.

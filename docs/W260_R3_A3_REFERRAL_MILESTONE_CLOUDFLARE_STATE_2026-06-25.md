# W260-R3 A3 — Referral, milestone and Cloudflare state audit

## Decision

**No Cloudflare adjustment, referral activation, milestone activation, D1 migration or reward settlement deployment is authorised by this source audit.**

The product currently preserves a safe read-only/inactive referral context only. It does not have an active referral reward program, access-milestone grant flow, Pages referral endpoint, or deployed backend workflow in this source tree.

## What the source proves

| Area | Current source state | Consequence |
|---|---|---|
| Invite context | `EON_INVITE_PROGRAM_ACTIVE = false`; mode `read-only-design` | Invite metadata may be displayed/retained as a local context, but is not a validated referral program. |
| Referral rewards | `REFERRAL_REWARDS_ENABLED = false` | No reward settlement, network referral call, token, cash, wallet or entitlement claim is allowed. |
| Access milestones | Disabled; pilot mode `no-go`; grant attempts fail closed and preserve storage | No client-side entitlement write can convert an invite into access/reward. |
| Pages Functions | `functions/csp-report.js` only | No active `/api/referrals` Pages Function exists. |
| Pages deployment | GitHub workflow deploys built Pages `dist` only | It does not deploy `platform-backend`. |
| D1 template | Placeholder database id; future migration explicitly `FUTURE-ONLY / NOT DEPLOYED` | Source has a deferred design, not a proven remote database/binding. |

`npm run qa:r3a3-referral-milestone-cloudflare` guards this inactive state in the source tree.

## What the source cannot prove

This freeze has no Cloudflare account credentials. It cannot prove:

- Pages dashboard bindings, environment variables or secret state;
- old Workers/Pages Functions or historical deployments;
- remote D1 databases, tables, contents or migration history;
- whether a past manual deployment differed from the current GitHub workflow;
- Cloudflare access/role ownership or rollback ownership.

Therefore, this is a **no-change-authorised source result**, not an assertion that no historical Cloudflare resource exists.

## Codex/owner read-only verification after merge

Run these only from an authenticated owner account after the source is merged locally. Save redacted output outside Git and do not paste tokens, account IDs, D1 data or secret values into a handover.

```bash
npm ci --include=dev --no-audit --no-fund
npx wrangler pages deployment list --project-name=eonapp-ch
npx wrangler d1 list
```

If and only if the owner identifies a relevant D1 database, inspect schema metadata read-only:

```bash
npx wrangler d1 execute <database-name> --remote \
  --command "SELECT name, type FROM sqlite_master WHERE type IN ('table','index') ORDER BY name;"
```

Do **not** run the future migration. Do **not** deploy `platform-backend`. Do **not** create or bind a D1 database. Do **not** enable referral rewards or milestones from a dashboard toggle.

## Future activation gate (W284 only)

Referral/milestone work may be reconsidered only in W284, after all of the following are independently approved:

1. Exact product goal and non-financial definition (no token, payout, wallet, exchange-rate or revenue-share behaviour).
2. Server-side validation with idempotency, rate limits, abuse review and audit logging.
3. Privacy, consent, retention and deletion policy (W277).
4. Jurisdictional/legal review of consumer/referral claims (W278).
5. Security review, rollback/kill switch and owner responsibility (W279/W283).
6. Preview-first Cloudflare binding and D1 schema proof, then a separately recorded go/no-go decision.

Until then, the correct user-facing behavior is: **invite context exists; referral rewards and milestones are not active.**

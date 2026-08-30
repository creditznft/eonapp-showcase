# W623H/W623I Cloudflare Referral Activation Runbook

> **Superseded for deployment by W623I:** use the existing dedicated `EONAPP_REFERRALS_DB` bound as `EON_REFERRALS_DB`. This W623H document remains historical evidence only.


Date: 2026-07-11  
Purpose: activate the minimal EONKEY referral ledger on the existing Cloudflare Pages project without adding a database, secret, cron, queue or tracking service.

## Preconditions

1. Deploy from the W623H source checkpoint.
2. The existing Pages D1 binding is named `EON_BILLING_DB` and points to the reviewed `eonapp-billing` database.
3. Google/session authentication and Dodo billing remain functional.
4. Do not paste API keys or webhook secrets into commands, logs or source.

## Step 1 — verify the existing database

From a Cloudflare-authenticated owner/Codex terminal:

```bash
npx wrangler d1 list
```

Confirm the database name and ID before applying SQL. Do not create a second referral database.

## Step 2 — apply the migration

Preferred reviewed command when the database name is `eonapp-billing`:

```bash
npx wrangler d1 execute eonapp-billing \
  --remote \
  --file=migrations/0002_minimal_referral_eonkeys.sql
```

Alternatively, paste that migration into the existing D1 SQL console. The application also uses `CREATE TABLE IF NOT EXISTS`, but explicit migration evidence is required for production.

Verify the seven W623H tables:

```bash
npx wrangler d1 execute eonapp-billing --remote --command="
SELECT name FROM sqlite_master
WHERE type='table' AND name IN (
  'eon_referral_bind_challenges',
  'eon_referral_identities',
  'eon_invite_accounts',
  'eon_invite_events',
  'eon_key_grants',
  'eon_key_unlocks',
  'eon_digital_rewards'
)
ORDER BY name;"
```

Expected result: seven rows.

## Step 3 — enable testing rollout

In Cloudflare Pages → eonapp-ch → Settings → Variables and Secrets, add a normal text variable:

```text
EON_REFERRAL_ROLLOUT=testing
```

This is not a secret. Keep the existing `EON_BILLING_DB` binding unchanged. Redeploy the W623H build.

## Step 4 — public status check

Open:

```text
https://eonapp.ch/api/referrals
```

Expected public facts:

- `active: true`
- `rollout: testing`
- `monetization: subscriptions-only`
- `paidAdsInApp: false`
- `adViewRewards: false`
- no raw token, click, impression, social-post, prompt, media or provider-key storage
- event-driven/lazy Cloudflare load model

Do not expose private account rows in the signed-out response.

## Step 5 — two-account proof

Use two genuinely separate signed-in test accounts and separate browser profiles/devices.

### Inviter

1. Open Share or EONKEYS.
2. Register/verify the invite identity.
3. Copy a fresh signed invite.
4. Confirm a second browser cannot bind the copied public link to another account without the original private-key signature.

### Invitee

1. Open the signed invite.
2. Sign in with the separate invitee account.
3. Accept the saved invite.
4. Save one genuine first project or complete another allowlisted useful activation milestone.

### Inviter result

1. Open EONKEYS.
2. Confirm one Signal Key is available.
3. Confirm the Signal digital reward receipt exists.
4. Confirm progress shows one accepted and one activated invite.
5. Redeem the Signal Key for one low-risk allowlisted cosmetic/feature.
6. Confirm the grant becomes consumed and the unlock becomes active.

## Step 6 — negative and abuse checks

Prove all of the following:

- inviter cannot accept their own link;
- invitee cannot replace an already accepted inviter;
- click/copy/share alone grants nothing;
- trial start grants nothing;
- duplicate activation is idempotent;
- copied public link cannot steal inviter identity;
- more than five active device identities on one account is rejected;
- browser LocalStorage edits cannot create a server balance;
- disabled rollout returns inactive grants/redemption while ordinary Share still works.

## Step 7 — paid lifecycle

A genuine Dodo-origin successful paid event may create a pending retained-paid event. Keep the production retention period at 14 days. Do not shorten it or inject a fake production webhook to manufacture evidence.

After 14 days of valid paid status, verify the first retained referral grants one Builder Key and its digital reward. Then test the normal refund/dispute reversal path when a controlled valid case exists.

## Step 8 — production activation

Only after testing evidence passes, change:

```text
EON_REFERRAL_ROLLOUT=production
```

Redeploy and repeat the public status, two-account and rollback smoke tests.

## Rollback

Unset the variable or set an unsupported value such as `disabled`, then redeploy. Expected behavior:

- signed links, local share cards, captions and native sharing continue;
- no new grant, qualification or redemption mutation is accepted;
- subscriptions and Dodo billing remain unaffected;
- existing ledger rows remain auditable and are not deleted.

## Evidence to save

- migration command/result with secrets redacted;
- seven-table query result;
- public `/api/referrals` response;
- inviter identity proof receipt;
- self-referral rejection;
- accepted invite and useful activation;
- Signal grant, digital reward and redemption;
- rollout-disabled rollback response;
- D1 row counts only, not raw personal identifiers;
- desktop/mobile Share and EONKEY screenshots.

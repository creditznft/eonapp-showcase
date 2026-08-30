# Exact Cloudflare AI Prompt — EONAPP Identity-Only Setup

Copy the following prompt into Cloudflare AI. Do **not** paste a Google client
secret, session key, HMAC pepper, API key, cookie value, D1 row, user data, or
browser export into the prompt.

---

You are configuring the Cloudflare infrastructure for the existing Pages project
`eonapp-ch` / custom domain `https://eonapp.ch`.

Goal: prepare the **guest-first, identity-only Google Login infrastructure** for
EONAPP. This is an infrastructure-only task. Do not change unrelated routes,
monetization, payments, wallets, rewards, referrals, caches, analytics, user
workspace storage, production branch, or deployed code. Do not inspect customer
data, database rows, secrets, logs containing user data, or cookies. Do not
print any secret values.

Google OAuth is currently in **Testing** mode. The only configured Google OAuth
web client is for this exact production origin and callback:

- origin: `https://eonapp.ch`
- callback: `https://eonapp.ch/api/auth/google/callback`
- scopes: `openid email profile` only

Create two separate D1 databases:

1. `eonapp-identity-prod`
2. `eonapp-identity-preview`

For the Pages project, create an environment-specific D1 binding named exactly
`EON_IDENTITY_DB`:

- Production → `eonapp-identity-prod`
- Preview → `eonapp-identity-preview`

Set these non-secret **Production** variables exactly:

- `APP_ORIGIN` = `https://eonapp.ch`
- `GOOGLE_REDIRECT_URI` = `https://eonapp.ch/api/auth/google/callback`
- `EON_AUTH_ROLLOUT` = `testing`

For **Preview**, set only:

- `EON_AUTH_ROLLOUT` = `disabled`

Do not bind Preview to the production D1 database. Do not configure a Preview
Google callback until I create a separate Google OAuth Preview client with a
stable exact Preview redirect URI. Do not set `APP_ORIGIN`,
`GOOGLE_REDIRECT_URI`, Google client ID, or identity secrets in Preview.

Apply only this migration, separately to each new identity database:

`identity/migrations/0001_eon_identity.sql`

Do **not** apply legacy/referral migrations, `platform-backend` migrations,
archived migrations, wallet, rewards, payment, referral, token or marketplace
schema. Do not create user data rows and do not read database rows after the
migration.

Do not create analytics, tracking, KV, R2, queues, cron jobs, a second Worker,
or any cloud workspace store. EONAPP must not store Chat, Vault, projects,
files, Realm data, City progress, provider keys, Google access/refresh tokens,
or card data in this identity database.

Do not set the following values yourself and do not ask me to paste values into
this conversation. Instead, stop and provide the exact Cloudflare dashboard
path where I can manually add each one:

- `GOOGLE_OAUTH_CLIENT_ID` — non-secret text variable
- `GOOGLE_OAUTH_CLIENT_SECRET` — encrypted Secret
- `EON_AUTH_SUBJECT_PEPPER` — encrypted Secret
- `EON_SESSION_SIGNING_KEY` — encrypted Secret
- `EON_OAUTH_FLOW_SIGNING_KEY` — encrypted Secret

Do not deploy or promote Production code. Bindings and variables may require a
future redeploy after the source change is merged; report that requirement but
do not trigger deployment in this task.

At the end, return only:

1. database names created;
2. whether Production and Preview bindings exist with the exact binding name
   `EON_IDENTITY_DB`;
3. whether each identity migration completed;
4. the dashboard path for manually adding the listed variable/secrets;
5. whether a redeploy will be needed after the source is merged;
6. all blockers or mismatches.

Never return secret values, database row data, cookies, authorization codes,
OAuth tokens, raw Cloudflare configuration, or a claim that Google Login is
live. Guest mode must remain usable at all times.

---

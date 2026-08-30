# Cloudflare AI Prompt — W378 Optional Google Identity Infrastructure

Copy this prompt to Cloudflare AI **without any secret values**. Do not attach a
`.env`, `.dev.vars`, browser export, screenshot of a secret, database output,
cookie, authorization code, OAuth token, Google client secret, session key or
HMAC pepper.

---

You are preparing Cloudflare infrastructure for the existing Cloudflare Pages
project `eonapp-ch` with production domain `https://eonapp.ch`.

Scope: guest-first, identity-only Google Login infrastructure. This is an
infrastructure review/setup task only. Do not change source code, routes,
production branch, deployment workflow, payment systems, subscription systems,
entitlements, referrals, rewards, wallets, City data, Vault data, Apps data,
workspace storage, analytics, queues, cron jobs or user content.

Google OAuth is in Testing mode. It uses only `openid email profile` and the
exact production callback is:

```text
https://eonapp.ch/api/auth/google/callback
```

Create these two separate Cloudflare D1 databases:

```text
eonapp-identity-prod
eonapp-identity-preview
```

For Production, create exactly one D1 binding:

```text
EON_IDENTITY_DB -> eonapp-identity-prod
```

For Preview, create exactly one D1 binding:

```text
EON_IDENTITY_DB -> eonapp-identity-preview
```

Apply only this migration separately to both identity databases:

```text
identity/migrations/0001_eon_identity.sql
```

Do not apply any legacy referral, wallet, reward, token, marketplace,
platform-backend, payment or archived migration.

Set these Production variables exactly:

```text
APP_ORIGIN=https://eonapp.ch
GOOGLE_REDIRECT_URI=https://eonapp.ch/api/auth/google/callback
EON_AUTH_ROLLOUT=testing
```

For Preview, set only:

```text
EON_AUTH_ROLLOUT=disabled
```

Do not configure Preview OAuth until a separate Google OAuth web client with a
stable exact Preview callback exists. Do not bind Preview to production D1.

Do not set these values, do not request their values in this prompt, and do not
print them:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
EON_AUTH_SUBJECT_PEPPER
EON_SESSION_SIGNING_KEY
EON_OAUTH_FLOW_SIGNING_KEY
```

Instead, give me the exact Cloudflare dashboard path where I can add the
non-secret client ID and encrypted secrets manually. The expected paths are
under `Workers & Pages > eonapp-ch > Settings > Variables and Secrets > Add`.
The D1 binding path is `Workers & Pages > eonapp-ch > Settings > Bindings > Add
> D1 database bindings`.

Do not deploy Preview or Production. State that a redeploy is required after
configuration. Do not inspect database rows, logs, customer data, cookies or
secrets.

At the end, return only:

1. D1 database names created;
2. confirmation of the exact Production and Preview binding name;
3. migration completion status for each database;
4. the dashboard path for the manual client ID/secrets;
5. whether a redeploy is needed;
6. every blocker or mismatch.

Never claim that Google Login is live. Guest mode must remain usable. Google
Login is not a backup. No payment, checkout, subscription, entitlement,
referral benefit, provider connection, ad, CPA or payout code was activated.

---

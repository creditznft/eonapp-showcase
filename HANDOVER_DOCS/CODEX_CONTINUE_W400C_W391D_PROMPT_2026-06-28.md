# Codex Prompt — Continue EONAPP After W400C + W391D

You are continuing from this package. Treat it as the only source of truth.

## First: validate, do not deploy blindly

```bash
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm run qa:w400c-google-identity-entry
npm run qa:w391d-relay-tracking-prep
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

Then run the long aggregate command in a normal CI/terminal session:

```bash
npm run verify:w400c-w391d-prelaunch
```

Do not deploy if any command fails. Do not run a blind `npm audit fix`.

## Google identity proof

The source and Cloudflare identity D1 migration have been reported as deployed, but no real Google test-user session is certified.

Before any production login test:

1. rotate the Google OAuth client secret;
2. update only Cloudflare Production `GOOGLE_OAUTH_CLIENT_SECRET` as an encrypted secret;
3. keep `EON_AUTH_ROLLOUT=testing`;
4. keep Preview Google OAuth disabled.

Perform a controlled Production test-user login, logout, account deletion and guest-mode continuation proof. Return only redacted evidence. Never show secrets, cookies, auth codes, tokens, D1 rows, browser storage, local work, or account identifiers.

## W391D Relay tracking

Do not recreate or use `EONAPP_REFERRALS_DB` or `REFERRALS_DB`. Those were stale legacy bindings and were intentionally removed.

The source contains future Relay tracking paths but they must remain inert until separate approval. They require:

- new dedicated `EON_RELAY_DB`;
- Production/Preview database isolation;
- encrypted `EON_RELAY_TOKEN_PEPPER`;
- a matching database program state;
- `EON_RELAY_ROLLOUT=tracking` only after legal/support/abuse review;
- real identity and recovery proof first.

Do not enable `POST /api/relay/claim`. It is deliberately a hard-disabled no-grant route.

## Boundaries

Do not activate or claim as complete:

- referral rewards, payouts, discounts, free subscription time, credits, tokens, NFTs, transferability, or automatic grants;
- Collection grants or public Vault Reveal rewards;
- social OAuth, connector token custody, scheduling, posting, auto-DM, or engagement tracking;
- GitHub/Cloudflare project deployment on a user’s behalf;
- payments/subscriptions/entitlements;
- automatic cloud backup, cross-device sync, or local-work upload.

## Next code after the real proof lane

Proceed in this order:

1. Limited Relay tracking pilot UX only (explicit create/accept/revoke, no rewards).
2. Collection visual proof and deterministic non-financial reveal UX.
3. Action Gateway approval receipts and durable execution proof.
4. Connector OAuth one platform at a time, with official review/consent and per-post approval.
5. User-owned Forge deployment proof.
6. Payment provider integration only after underwriting approval and legal policy copy.

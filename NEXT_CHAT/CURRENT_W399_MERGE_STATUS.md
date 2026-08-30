# W399 Merge Validation Status

Date: 2026-06-28

## Source merge result

- Handover ZIP verified against supplied SHA-256.
- W399 source overlay merged into the workspace.
- One stale retired active file was removed to satisfy the lean handover boundary:
  - `assets/js/utils/nowpayments-config.js`

## Local validation result

Validated in a fresh merge clone first, then revalidated in the main workspace:

- `npm ci`: pass
- `npm run verify:w399-prelaunch-candidate`: pass
- Runnable unit tests: `327/327` pass
- Build: pass
- Smoke build: pass
- Site audit: pass
- Launch readiness: pass

Current product status proved by source:

- Google OAuth and identity path are source-ready only
- Collection remains locked
- EON Relay remains locked
- Action Gateway remains fail-closed
- Connector custody and deployment remain inactive
- Creator/remix measurement remains local opt-in count-only

## Cloudflare configuration checks

Validated by name only through the Pages project API. No secret values were printed.

Production:

- `EON_IDENTITY_DB` binding present
- `APP_ORIGIN` matches `https://eonapp.ch`
- `GOOGLE_REDIRECT_URI` matches `https://eonapp.ch/api/auth/google/callback`
- `EON_AUTH_ROLLOUT=testing`
- `GOOGLE_OAUTH_CLIENT_ID` present
- `GOOGLE_OAUTH_CLIENT_SECRET` present
- `EON_AUTH_SUBJECT_PEPPER` present
- `EON_SESSION_SIGNING_KEY` present
- `EON_OAUTH_FLOW_SIGNING_KEY` present

Preview:

- `EON_IDENTITY_DB` binding present
- `EON_AUTH_ROLLOUT=disabled`
- no Preview Google client id, client secret, or redirect URI was exposed in the project config

## Cloudflare deploy result

The refreshed Cloudflare token in `.env.local` is valid and now has working Pages and D1 access.

Observed result:

- token verification API: pass
- `npx wrangler pages project list`: pass
- `npx wrangler d1 list --json`: pass
- Preview identity migration apply: pass
- Production identity migration apply: pass
- Preview identity table verification: pass
- Production identity table verification: pass
- `npx wrangler pages deploy dist --project-name eonapp-ch --branch main ...`: pass

Cloudflare cleanup completed before the successful deploy:

- removed stale `EONAPP_KV` Pages binding with an invalid namespace id
- removed stale `EONAPP_ASSETS` and `EONAPP_BACKUPS` R2 bindings that no longer exist
- removed stale `EONAPP_REFERRALS_DB` and `REFERRALS_DB` D1 bindings with invalid legacy ids

Current production deployment:

- commit: `aeea34e5038e2be96c4fcc7b51e239ee7401f66e`
- deployment id: `61316ed5-983d-48de-bade-bae0880abdf4`
- deployment url: `https://61316ed5.eonapp-ch.pages.dev`
- custom domain `https://eonapp.ch` returns `200 OK`
- `https://eonapp.ch` and the deployment URL return the same HTML payload hash

## GitHub workflow status

The app was already live from the successful manual production deploy above. A separate GitHub Actions failure was then traced to an unnecessary fallback job in `.github/workflows/ci.yml`.

Resolved in source:

- removed the redundant `trigger-cloudflare-deploy` job that POSTed `repository_dispatch`
- root cause was GitHub returning `403 Resource not accessible by integration`
- canonical production workflow remains `.github/workflows/deploy.yml`, which deploys from successful `CI` runs on `main` via `workflow_run`

Latest GitHub source commit:

- commit: `5336d28`
- message: `Remove redundant Cloudflare dispatch fallback`

Follow-up confirmation:

- Cloudflare Pages later created a fresh Production deployment for source `5336d28`
- deployment id: `c13f955c-b8cf-4b49-af3f-8311f9eed75a`
- deployment url: `https://c13f955c.eonapp-ch.pages.dev`

Important truth:

- the live app deployment on `eonapp.ch` remains healthy after the workflow-only follow-up push
- the `5336d28` commit changes GitHub workflow behavior only, not runtime app code
- this proves the GitHub-to-Cloudflare production path is working again after removal of the broken fallback job

This session still did **not**:

- run live Google login/logout/delete proof
- collect device screenshots
- complete W276 update, rollback, and local-data restoration proof

## Dependency audit note

Current local result differs from the incoming handover note:

- `npm audit --omit=dev`: `0` vulnerabilities

This should be treated as the current truth for this workspace state unless a later environment-specific audit shows otherwise.

## Activation decision

Do **not** activate the future-wave foundations after this validation. They are intentionally present-but-locked.

Still not ready for activation:

- Collection grants or reveals
- Relay invitations or rewards
- Connector OAuth, custody, scheduling, or posting
- Action Gateway execution
- public Google OAuth rollout

Identity-only production testing can proceed only after:

1. the Google OAuth client secret rotation is confirmed complete
2. redacted Google test-user proof is collected
3. device/browser evidence is collected
4. W276 rollback and restoration proof is collected

# Deploy, Proof, and Lighthouse Runbook

## Required environment variables for deploy work

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT`
- `CLOUDFLARE_ZONE_ID`

This repo does not commit deploy secrets. The local workspace used a separate `.env.local`.

## Install and prepare

```powershell
npm ci
npx playwright install chromium
npm run build
```

## Core validations

```powershell
npm run test:unit
npm run test:e2e:current
npm run qa:w216-release-candidate
```

## Cloudflare Preview deploy

```powershell
npx --no-install wrangler pages deploy dist --project-name=eonapp-ch --branch=w217-r1-preview-20260625
```

If the target project name differs in the receiving environment, use the configured `CLOUDFLARE_PAGES_PROJECT` value instead of hardcoding `eonapp-ch`.

## Real Lighthouse flows

The fallback routes were updated to the current canonical app contract.

```powershell
npm run lighthouse:desktop
npm run lighthouse:mobile
npm run lighthouse:direct
```

## Real browser/device proof still needed

Run these on the Cloudflare Preview URL, not only on localhost:

- desktop Chromium full route sweep
- mobile portrait and landscape screenshots
- console/network/CSP inspection
- installed PWA flow
- update and rollback proof
- accessibility and Lighthouse evidence capture

## Canonical current routes worth proving

- `/chat`
- `/workspace`
- `/market`
- `/eoncity`
- `/eoncity/3d`
- `/local-ai`
- `/realm-studio`
- `/vault`
- `/trade`
- `/profile`
- `/automations`
- `/rewards`

## Watch-outs

- `/city` is not canonical; use `/eoncity`
- several old scripts still refer to retired aliases and should not override the route contract
- do not treat archived source trees as active product code

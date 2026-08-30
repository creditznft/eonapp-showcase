# W216 Live State Diff - Production vs Preview

This file started as a production-vs-preview mismatch note. After the 2026-06-23 production deploy, production now serves the newer W216 shell too.

## Confirmed state on 2026-06-23

Production custom domain after promotion:

- `https://eonapp.ch/chat` shows the newer W216 sidebar/workspace shell
- `https://eonapp.ch/market` shows the newer private-selection market layout

Preview alias:

- `https://codex-w216-final-polish-merg.eonapp-ch.pages.dev/chat` shows the newer W216 sidebar workspace shell
- `https://codex-w216-final-polish-merg.eonapp-ch.pages.dev/market` shows the newer private-selection market layout

## What that means

The earlier old-layout problem was real, but it is no longer the current live state. Production has now been promoted and browser-checked.

Confirmed Cloudflare production deployment:

- project: `eonapp-ch`
- deployment id: `3be16bb0-d9bc-4255-be34-35dd3fbd8acb`
- deployment URL: `https://3be16bb0.eonapp-ch.pages.dev`

Live browser confirmation after deploy:

- `eonapp.ch/chat` body text contains `Open Workspace`
- `eonapp.ch/market` body text contains `Your EON Market`

## Service worker behavior

The current source is already set up to update users on the same origin after a real production deploy:

- `assets/js/main.js` registers `/sw.js` with `updateViaCache: 'none'`
- the app prompts for reload when a new worker is found
- `sw.js` calls `skipWaiting()` and `clients.claim()`

So:

- now that the new build is on the same live production origin, users should usually receive it on reload or after the update banner flow
- if a user still sees the older shell after this promotion, likely causes are cached old HTML/service-worker state, an already-open stale tab, or browser cache lag

## Route truth noted during preview checks

Verified working clean preview routes included:

- `/chat`
- `/projects`
- `/library`
- `/workspace`
- `/market`
- `/vault`
- `/trade`
- `/rewards`
- `/reward-access`
- `/local-ai`
- `/eoncity`
- `/eoncity/3d`
- `/telegram`
- `/automation-studio`

One remaining routing cleanup target:

- `/automations` alias still needs another pass because the canonical working page is `/automation-studio`

## Screenshot references

- user production screenshot: `C:\Users\credi\OneDrive\Pictures\Screenshots\Screenshot (17).png`
- preview evidence set: `output/playwright/w216-liveqa-2`
- live production confirmation set: `output/playwright/live-prod-check`

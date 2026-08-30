# Package scope — EONAPP W448–W458.1 / W450.1 / W452.1–W452.2

This is a runnable source handoff for Codex. It includes the complete current working source tree, including legacy/historical records required by the W451 inventory and cleanup workflow.

## Included

- active application source, static routes, Cloudflare functions, public assets, configuration, scripts and tests;
- current route, commerce, legacy-cleanup and City proof contracts;
- full W450 final launch plan, Codex Start Here handoff, Codex execution prompt and source validation receipt;
- legacy/historical documentation that the W451 inventory must classify before any proof-gated quarantine action.

## Deliberately excluded

- `node_modules/` — restore with `npm ci`;
- `dist/` — regenerate with `npm run build`;
- `artifacts/` and `tmp/` — generated local evidence/cache output;
- `.git/` — this bundle cannot establish canonical repository history;
- compressed bundles — avoid nesting old handoff archives inside this source handoff.

## Do not infer

This package is not evidence of a Cloudflare deployment, real-device visual acceptance, Dodo approval, hosted checkout, live Sync Basic, or a production launch.

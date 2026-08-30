# EONAPP W405 Lean Package Contents

This is a runnable source package for the W405 Live UX + EON City Rescue pass.

Included:

- application source, HTML, Pages Functions, route/public configuration, assets, tests and Node lockfile;
- W405 implementation handover, Codex prompt, manual proof checklist, art/rescue plan and validation summary;
- the current test and build scripts required to run `npm ci` and `npm run verify:w405-live-rescue-source`.

Excluded intentionally:

- `.git`, `node_modules`, `dist`, `.wrangler`, Playwright/browser profiles, generated reports and build artifacts;
- legacy archive/evidence packs, historical screenshot dumps, old patch bundles, large QA captures and obsolete handover ZIPs;
- credentials, `.env*` files, Cloudflare API tokens, OAuth client secrets and production data.

Historical archive-dependent tests are intentionally outside the lean package. The current runnable source suite reports this as `historic evidence=not-packaged`, while still certifying the active W405 source boundary.

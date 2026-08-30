# Lighthouse environment-blocked receipt

**Attempt:** 2026-06-25, fresh 193-file build, guarded core Lighthouse runner.  
**Local server:** root readiness/redirect succeeded before browser launch.  
**Runner result:** first route `/` generated a report whose `finalUrl` was `chrome-error://chromewebdata/`; runner stopped early and correctly set `environmentBlocked: true`.

No category values from that report are accepted. A Chrome error page cannot demonstrate application performance, accessibility, best practices or SEO.

## What is proved separately

- The local static server preserves the intended `/` → `/chat` redirect.
- The generated route inventory has 121 public route variants.
- The all-route static gate resolved 121/121 variants to terminal local HTML.

## Required Codex/browser evidence

Run `npm run lighthouse:direct`, `npm run lighthouse:desktop` and `npm run lighthouse:mobile` with a normal local Chrome/Chromium path. Retain raw JSON/HTML reports outside Git and record route, device profile, scores, build SHA and remediation. Repeat canonical-route checks against Preview and live before changing W260.

# EONAPP.CH Launch Audit Report

Date: 2026-04-22
Mode: Static audit only (no browser tests executed)
Scope: Launch-readiness hardening and deployment integrity

---

## Executive Summary

Status: CONDITIONAL GO

What is strong:
- Core launch files exist and are routable.
- Sitemap URLs resolve to existing files.
- Redirect targets resolve to existing files.
- Security/caching headers are present.
- Challenge link hardening has been added for major game surfaces.

What still blocks a clean production launch:
- Ad config still contains placeholder reward/offerwall URLs.
- Launch checklist/runbook did not exist prior to this pass.
- Existing static audit script had false positives (now fixed in this pass).

---

## Checks Performed

### 1) Critical file presence
Result: PASS

Validated existing:
- index, tools, games, chat, vault, about, privacy, 404
- robots + sitemap + headers + redirects

### 2) Sitemap path validity
Result: PASS

Validation method:
- Parsed each `<loc>` in sitemap
- Mapped URL path to local file/folder index path
- Checked file existence

Outcome:
- No missing sitemap targets detected.

### 3) Redirect target validity
Result: PASS

Validation method:
- Parsed active routes in `_redirects`
- Verified destination file existence for each target

Outcome:
- No broken redirect targets detected.

### 4) Security header baseline
Result: PASS (review recommended)

Current `_headers` includes:
- HSTS
- CSP
- XFO
- XCTO
- COOP
- Permissions Policy
- cache directives per path class

### 5) Monetization readiness
Result: PASS

Current findings:
- Monetag rewarded smartlink is live in `assets/js/ads/config.js`
- CPAlead and AdGate remain intentionally blank and are treated as future optional fallbacks

Impact:
- Rewarded game and bonus flows now have one live smartlink path
- Monetization is no longer blocked on placeholder URLs
- Full multi-network rollout is deferred until the site is live and additional ad inventory is approved

### 6) Launch readiness gate script
Result: PASS

Command:
- `npm run launch:readiness`

Output summary:
- Blockers: 0
- Warnings: 0

---

## Fixes Completed In This Hardening Pass

- Fixed static audit false positives for protocol-relative external URLs in `scripts/site-audit.mjs`.
- Added launch audit script aliases in `package.json`:
  - `audit:site`
  - `launch:check`
- Cleaned deploy workflow comments in `.github/workflows/deploy.yml` to reduce operator confusion.
- Added master launch checklist: `docs/LAUNCH_CHECKLIST_100.md`.

---

## Remaining Required Actions (Before GO)

1. Replace placeholder ad URLs in `assets/js/ads/config.js`.
2. Confirm GitHub secrets exist for deploy workflow:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Run `npm run launch:check` from clean branch head before final push.
4. Run `npm run launch:readiness` and reach zero blockers.
5. Final content/legal disclosure pass on monetized pages.

---

## Risk Register

### High

- Placeholder monetization links remain.
  - Risk: dead sponsor/reward flow and poor launch conversion.

### Medium

- Large static CSP allowlist may drift over time if not curated.
  - Risk: accidental over-permissive policy growth.

### Low

- Workflow comments previously implied manual filename migration steps.
  - Risk: onboarding confusion only.

---

## Decision

Current recommendation: NO-GO until high-risk monetization placeholders are replaced.

When placeholders are replaced and launch audit is re-run cleanly, move to GO.

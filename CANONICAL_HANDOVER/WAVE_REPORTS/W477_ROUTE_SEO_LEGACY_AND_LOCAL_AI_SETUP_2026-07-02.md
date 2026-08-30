# W477 — canonical routes, safe legacy retirement, and EONBOT Local AI setup bridge

**Status:** source controls implemented and locally verified. Deployment/browser evidence is still required before old source is moved, CSP is narrowed, or release approval is considered.

## What this wave changes

### Canonical public surface

The search map is intentionally small and truthful:

- Public/indexable: `/`, `/eoncity`, `/insights`, `/local-ai`, `/about`, `/privacy`, `/terms`, `/legal`, `/support`.
- Personal, local-only, disabled, reward, billing and workspace surfaces: canonical URL retained but `noindex, nofollow`.
- Redirect-only paths such as `/chat`, `/trade`, and disabled `/billing` do not appear in the sitemap.
- Root and `public/` copies of `sitemap.xml` and `robots.txt` are generated from one contract.

### Legacy retirement policy

This wave never recreates or deletes old public documents just to make an inventory look clean.

- Tier-3 legacy filenames are recorded against their declared redirect contracts.
- A legacy source file that is already absent remains a **redirect-ledger item**, not a fake “missing file” failure.
- Existing legacy source stays inventory-only until reviewed deployed browser/network evidence says it is safe to move into the quarantine location.
- No route or origin is declared unused merely because static search did not see it.

### EONBOT Local AI setup for non-technical users

The setup entry is now `#eonbot-local-ai-setup`, including the EONBOT Chat command and the capability-mode CTA.

1. The user chooses a familiar goal: private chat, coding, or creator planning.
2. EONBOT uses local browser hints only after the user opens the guide; it does not scan a LAN, inspect files, or upload hardware data.
3. Desktop users see one conservative reviewed **local text** recommendation first; optional alternatives are secondary.
4. The installer and model-guide links go only to reviewed official runtime pages, and open only after a user tap.
5. The user comes back, explicitly scans the selected runtime’s approved loopback endpoint, runs a local self-test, and only then may select it for EONBOT.

The flow never installs software, downloads a model, runs a terminal command, probes a runtime on page load, stores a provider credential in Chat, or silently switches a failed local path to cloud AI.

## Current boundary

This W477 bridge makes **local text setup** humane. It does not activate Local Creator Media. Image generation, image-to-video and full video remain in W479-M and require their own tested local adapters, capability discovery, loopback policy, generation/cancel/output proof, CORS/PNA evidence, and real-device proof.

## Required deployment evidence before W477 closes

1. W476-B reviewed preview/live browser and device evidence.
2. Exact deployed redirect, canonical, title, robots, sitemap, cache and 404 observation.
3. Network-origin classification from real browser traces before removing any external/local literal.
4. CSP reduction only after the above data supports each origin change.
5. Human review of the reversible legacy ledger before source moves or deletions.

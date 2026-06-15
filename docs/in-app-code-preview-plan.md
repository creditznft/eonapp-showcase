# In-App Code Preview / Explorer Plan

EONAPP already has Code Showcase surfaces through `/realm-code-preview.html` and the Trust Explorer route.

## What should be shown

- selected snippets from this public repo
- architecture summaries
- screenshots
- trust model cards
- links to public GitHub showcase

## What should not be shown

- private source tree
- raw production functions with secrets
- `.env` values
- deployment keys
- full marketplace/monetization internals

## UX rules

- label every snippet as curated/sanitized
- show why the snippet matters
- show what is intentionally private
- allow copy of snippets
- use sandboxed iframes for demo previews
- never expose localStorage/private Vault values in preview

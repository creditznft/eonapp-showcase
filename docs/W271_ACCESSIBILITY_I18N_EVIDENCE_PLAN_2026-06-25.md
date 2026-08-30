# W271 — Accessibility, i18n and content evidence plan

## W271-A0 scope completed locally

- Every canonical route has source-level document language, viewport, title, main landmark and a keyboard skip path.
- App-shell pages share a non-blocking accessibility/language bootstrap; standalone canonical pages load it directly.
- The bootstrap retains document `lang`/`dir` updating and the existing non-English localization path.
- `npm run qa:w271-accessibility-i18n` is fail-closed: missing source wiring fails rather than creating an accessibility claim.

## What this does **not** prove

This is not WCAG certification or full i18n/content completion. No human keyboard, screen-reader, RTL, translation-quality, contrast, zoom, forced-colors, Android TalkBack, iOS VoiceOver, Preview/live or owner review has occurred in this source freeze.

## Required external evidence before W271 can close

1. Keyboard-only task walks on desktop, including Chat, Workspace, City, Vault, support and recovery paths.
2. NVDA and VoiceOver reading/focus/live-region review with defects retained as tickets.
3. Human review of each supported locale, fallback behavior, Arabic/RTL direction and sensitive/legal/support copy.
4. TalkBack and VoiceOver device tasks, including PWA installation/update/return flows.
5. Contrast, 200–400% zoom, reduced-motion and forced-colors evaluation.

## Boundary

W271-A0 does not alter W260 NO-GO, W269 beta, Cloudflare, D1, referral/milestone, rewards, wallet, chain, provider or deployment state.

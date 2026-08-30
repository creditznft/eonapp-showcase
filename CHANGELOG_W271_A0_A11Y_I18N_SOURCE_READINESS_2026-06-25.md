# W271-A0 — accessibility/i18n source readiness

## Source changes

- Added a deferred, non-blocking shared accessibility/language bootstrap to every app-shell route.
- Added direct bootstrap coverage to standalone canonical routes: City Play, Telegram status, signed-share landing, archive and verified Realm profile.
- Added an accessible static skip path to Archive and made the shared utility respect existing standalone `.skip` links.
- Added the W271-A0 source contract, fail-closed gate, unit coverage and evidence board.

## Local result

A passing gate confirms source wiring only. It does not claim WCAG compliance, human translation quality, RTL behavior, screen-reader success, mobile assistive technology, Preview/live evidence or launch readiness.

## Non-changes

No Cloudflare, deployment, Worker, D1, referral/milestone, reward, wallet, chain, provider or commercial state changed. W260 remains NO-GO.

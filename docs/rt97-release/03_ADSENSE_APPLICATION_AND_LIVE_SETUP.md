# RT97 AdSense application/reapplication and live setup

Publisher account authority:
- account meta: `ca-pub-6759380023085970`
- ads.txt publisher: `pub-6759380023085970`
- `ads.txt`: `google.com, pub-6759380023085970, DIRECT, f08c47fec0942fa0`

## What is code-ready
`npm run verify:rt97-release` certifies the local AdSense content boundary. The source currently has 17 reviewed guide routes with:
- substantial crawlable editorial copy (support pages >=800 visible words; utility pages >=1200; guide index >=700)
- unique title/description/canonical authority
- one canonical and one robots directive per page
- Article/TechArticle + BreadcrumbList structured data
- current review/dateModified authority
- editorial method and advertising/trust navigation
- AdSense ownership metadata and the official Auto Ads bootstrap
- no invented `data-ad-slot` IDs
- no incentivized-click wording
- explicit review-first EONBOT handoff
- stable exclusion markers around interactive tools and EONBOT CTA areas

Ordinary AdSense runtime is not added to EON City, Local AI/BYOK, account/workspace/project/create/billing/reward surfaces.

## Recommended first live Auto Ads configuration
After Google marks the site ready/approved, start conservatively:
- Auto Ads: ON
- in-page: ON
- Multiplex: ON
- ad intents: OFF initially
- anchor: OFF initially
- vignette: OFF initially
- side rail: OFF initially

The goal is policy/readability/layout safety first, not maximum ad density on day one.

## Required page exclusions in AdSense
Keep product/private/work surfaces excluded, including at least:
`/`, `/local-ai`, `/eoncity`, `/projects`, `/workspace`, `/create`, `/forge`, `/preview-studio`, `/automations`, `/profile`, `/vault`, `/capsule`, `/realm-studio`, `/billing`, `/settings`, `/install`, `/rewards`, `/referral`, `/status`.

## Required excluded areas
Use AdSense Auto Ads preview/excluded-area tooling to keep ads away from:
- `.eon-guide-tool`
- `.eon-guide-actions`
- `[data-adsense-exclusion-area="interactive-tool"]`
- `[data-adsense-exclusion-area="eonbot-cta"]`

## External gates code cannot fake
Before calling AdSense live-ready, verify in the Google account:
1. eonapp.ch site status is Ready/approved.
2. A Google-certified CMP/consent configuration is active where Google requires it (including EEA/UK/Switzerland traffic as applicable).
3. Page exclusions/excluded areas above are actually saved in the AdSense account.
4. Real ads serve without covering tools, navigation, CTA controls or core content on mobile/desktop.
5. Core Web Vitals/layout shift is acceptable after actual ads serve.
6. No owner/test traffic clicks ads. Never ask users to click ads or reward ad clicks.

The code gate deliberately reports `code-pass-external-pending` until these account/live facts are proven.

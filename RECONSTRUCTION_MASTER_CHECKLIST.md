# Reconstruction Master Checklist

Present checks: **25/39**

## Present
- [shell] `index.html` — launch file restored
- [shell] `chat.html` — launch file restored
- [shell] `vault.html` — launch file restored
- [shell] `about.html` — launch file restored
- [shell] `privacy.html` — launch file restored
- [shell] `404.html` — launch file restored
- [shell] `offline.html` — launch file restored
- [shell] `archive.html` — launch file restored
- [shell] `_headers` — launch file restored
- [shell] `_redirects` — launch file restored
- [shell] `robots.txt` — launch file restored
- [shell] `sitemap.xml` — launch file restored
- [shell] `.github/workflows/deploy.yml` — launch file restored
- [i18n] `assets/js/utils/multi-language.js` — selector locked to RC 11
- [i18n] `assets/css/layout.css` — menu readability bump
- [i18n] `assets/css/chat.css` — menu readability bump
- [i18n] `assets/css/subscription.css` — menu readability bump
- [i18n] `assets/css/workbench.css` — menu readability bump
- [i18n] `assets/js/utils/multi-language.js` — RC core language copy added
- [i18n] `assets/js/utils/multi-language.js` — extended core language copy added
- [i18n] `assets/js/utils/multi-language.js` — creator shell language batch added
- [i18n] `assets/js/utils/multi-language.js` — remaining creator runtime batch added
- [i18n] `I18N_RC_LANGUAGE_STRATEGY.md` — language strategy doc exists
- [i18n] `SESSION_CHECKPOINT_LANGUAGES_01.md` — language checkpoint 01 exists
- [i18n] `SESSION_CHECKPOINT_LANGUAGES_02.md` — language checkpoint 02 exists

## Missing / needs reapply
- [trust] `assets/js/utils/crypto-receipts.js` — crypto receipts helper exists
- [trust] `assets/js/utils/crypto-receipts.js` — consumeEnvelope exists
- [trust] `assets/js/utils/secure-keystore.js` — keystore compatibility wrappers
- [trust] `assets/js/utils/profile.js` — trusted device key support
- [trust] `assets/js/utils/trusted-time.js` — trusted monotonic time helper exists
- [trust] `assets/js/utils/entitlements.js` — trusted time integrated
- [trust] `assets/js/utils/subscription.js` — trusted time integrated
- [trust] `assets/js/utils/profile.js` — trusted time integrated
- [trust] `assets/js/utils/lootbox.js` — profile-scoped exchange trust boundaries
- [trust] `tests/unit/lootbox.test.mjs` — exchange-boundary tests added
- [pages] `assets/js/vault-page.js` — safeHTML hardening present
- [pages] `assets/js/chat-page.js` — safeHTML usage present
- [pages] `assets/js/subscription-page.js` — safeHTML usage present
- [pages] `assets/js/eon-browser-page.js` — safeHTML usage present
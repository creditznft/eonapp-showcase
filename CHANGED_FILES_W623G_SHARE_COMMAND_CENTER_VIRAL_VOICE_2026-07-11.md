# W623G — Share Command Center, Viral Creation Loops And No-Key Voice Fallback

Date: 2026-07-11  
Status: source-complete; focused certification and production build green  
Source revision: `758f6b8c1a050f9526cb60f5e11fa40b25e59431`

## CEO decisions frozen

1. Organic creation, milestone and ordinary invite sharing may launch before referral rewards.
2. Referral EONKEYS remain inactive until the W629 server ledger proves signed attribution, qualification, caps, retention, refund/dispute handling, idempotency and abuse reversal.
3. EONAPP must not encourage users to buy ads for reward links while those proofs are missing.
4. EONKEYS remain non-cash, non-transferable feature unlocks. They never create subscriptions, discounts, renewals, payouts, wallets, tokens, commissions or provider credits.
5. Social sharing is review-first. EONAPP does not connect social accounts, post in the background, host shared media or claim a post/conversion occurred.
6. Browser/OS speech fallback requires no EONAPP API key, but no universal or offline speech claim is allowed.

## What changed

- Consolidated Invite, Creation, Milestone and Campaign sharing into one **Share Command Center**.
- Preserved native top-right Share ownership for Chat and EON City.
- Put Share in the top-right utility rail on older billing/help/legal-style site-shell pages.
- Universal Share coverage now spans **31 active app/site-shell pages**.
- Aligned both shell generations to EONBOT, Create, Projects, Library and EON City.
- Removed the permanent legacy header language picker; overrides remain in Profile → Voice & language.
- Added explicit local image/video handoff through the system share menu where supported.
- Added copy-caption/manual-upload fallback where native file sharing is unavailable.
- Added locally rendered 1080×1350 PNG cards for Creation, Project, EON City and Vault Reveal milestones.
- Added WhatsApp, Telegram, X, LinkedIn, Facebook, Reddit and email handoffs.
- Added EONBOT viral share-kit drafting with review-only boundaries.
- Added secret-like text rejection before caption/card generation.
- Added proof-gated EONKEY wording, reward disclosure copy and paid-promotion safety rules.
- Added a formal viral readiness score. W623G source scores **7.2/10**; the four remaining blockers are server attribution, qualified reward grants, abuse/refund reversal and privacy-safe measurement.
- Added no-key speech fallback selection across browser dictation/synthesis, operating-system dictation, device Read Aloud and a future authenticated local companion.
- Added Profile voice reach status for the selected browser/device/language.
- Added an inactive local speech companion contract requiring authenticated loopback and airplane-mode STT/TTS proof.
- Added a repeatable desktop/mobile Playwright Share proof harness for W623H.

## Validation

- W623G source gate: **22/22 passed**
- W623G unit tests: **6/6 passed**
- Universal Share source coverage: **31 active app/site-shell pages**
- Viral readiness: **7.2/10**, launch claim disallowed
- W623C commercial truth: **64/64 passed**
- W623D reachability tests: **5/5 passed**
- Production reachability: **343 files / 583 import edges**
- Quarantined obsolete modules reachable: **0**
- W623E information architecture: **5/5 passed**
- W623F certification v2: **24/24 passed**, release remains NO-GO
- Multilingual/voice focused tests: **9/9 passed**
- Targeted ESLint: **zero errors and zero warnings**
- Secret scan: **3,367 text files scanned; zero potential secrets**
- Production build: **passed**
- Distribution files: **451**
- Minified files: **289**
- Minification saving: **41.18%**
- Distribution SHA-256: `a351fde95e8c43e025caa1219e6127db292754f2669b46a4a079ddc64ee6cbdb`

## Browser/device evidence boundary

The Playwright proof harness was executed in the build container, but the managed system Chromium blocked localhost with `ERR_BLOCKED_BY_ADMINISTRATOR`. The isolated container also could not download the Playwright browser because external DNS was unavailable. No screenshot or native-file-share pass is claimed. W623H must run the included harness on an owner/Codex machine or immutable deployed preview.

## Historical gates deliberately excluded

- W618B expects the retired Studio/Apps compact navigation and is superseded by W623E.
- W133 expects an older schema and removed `tools.html` surface.
- W243 expects the older public navigation order.

These failures were not rewritten or disguised as current failures. W623G certification uses the current W623E/F/G contracts.

## Changed files in source commit

- `M	EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `M	EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `M	assets/css/eon-app-shell.css`
- `M	assets/css/social-missions.css`
- `M	assets/js/chat-page.js`
- `A	assets/js/chat/eon-voice-fallback-strategy.js`
- `M	assets/js/chat/eonbot-voice-capability-gateway.js`
- `M	assets/js/profile-page.js`
- `A	assets/js/share/eon-viral-share-kit.js`
- `M	assets/js/utils/eon-share-sheet.js`
- `M	assets/js/utils/site-shell.js`
- `A	config/w623g-local-speech-companion-contract.mjs`
- `M	package.json`
- `M	profile.html`
- `A	program/EONAPP_VIRAL_GROWTH_CEO_DECISIONS_W623G_2026-07-11.md`
- `A	program/EONAPP_W623H_SHARE_VOICE_REAL_DEVICE_PROOF_RUNBOOK_2026-07-11.md`
- `A	scripts/w623g-share-browser-proof.mjs`
- `A	scripts/w623g-share-voice-growth-gate.mjs`
- `A	tests/unit/w623g-share-voice-growth.test.mjs`

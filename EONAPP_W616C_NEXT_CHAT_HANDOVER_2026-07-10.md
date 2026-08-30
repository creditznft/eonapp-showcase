> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.

# EONAPP W616C Next-Chat Handover

Date: 2026-07-10
Prepared for: continuation in a fresh chat window
Use as coding source: `SOURCE/` folder in this package, or the W616C source ZIP.

## Current source truth

The current source is based on W616B and includes W616C locked-feature resolver work.

Known baseline before W616B/W616C:

- `test-source(4).zip` was the safest clean coding baseline.
- W615 evidence ZIP verified City signed-in production evidence, but strict all-clear was previously blocked by deployed asset hash mismatch.
- W616B added EON Keys referral unlock foundation and simplified sidebar/profile-hub menu.
- W616C adds the locked-feature resolver.

## W616C implemented in this package

W616C adds a non-live source contract so all premium feature gates can show the same user choice:

> Subscribe, start a trial where eligible, refer to earn EON Keys, or use an earned EON Key.

The resolver deliberately keeps commercial activity disabled:

- no Dodo checkout sessions,
- no live trial starts,
- no browser-only entitlement unlock,
- no live key redemption,
- no referral grants,
- no wallet, cash, token, NFT, payout, commission, renewal discount, or free-month reward.

## CEO product decisions locked

### AI cost boundary

EONAPP does not pay for hosted AI/image/video generation at launch. Users use:

- their own local AI runtime, or
- their own provider/API key.

EON Keys unlock EONAPP app capability around those rails: workflows, project limits, template packs, local-AI/own-key workrooms, automations, exports, showcase slots, Vault Relics, City skins and feature passes.

### Referral reward model

Do not reward inviters with subscription renewal discounts or free months.

Inviters earn:

- Signal Keys,
- Builder Keys,
- Power Keys,
- Vault Reward Relics,
- feature unlocks,
- limit boosts,
- workflow/template/preset packs,
- Studio/Power/selected Max feature passes,
- City and profile cosmetics.

### User-facing unlock promise

Every locked feature should eventually say:

> Unlock this with a plan, start a trial, or use EON Keys earned by referring real active users.

### Subscription tiers

- Free — useful local-first core with limits.
- Plus — public 7-day trial later; entry paid power.
- Studio — contextual trial later; main creator tier.
- Power — no public trial at launch; heavy/builder tier.
- Max — invite-only/no public trial at launch; selected Max-level unlocks can be earned with Power Keys.

## Current W616C code locations

- `assets/js/referrals/eon-keys-catalog.js`
- `assets/js/referrals/eon-feature-unlock-resolver.js`
- `assets/js/referrals/eon-keys-page.js`
- `eon-keys.html`
- `scripts/w616c-locked-feature-resolver-gate.mjs`
- `tests/unit/w616c-locked-feature-resolver.test.mjs`
- `package.json`
- `CHANGED_FILES_W616C_LOCKED_FEATURE_RESOLVER_2026-07-10.md`

## Validation performed in this chat

Passed:

```bash
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
node --test tests/unit/w520-core-modularisation.test.mjs tests/unit/w616b-eon-keys-referral-unlocks.test.mjs tests/unit/w616c-locked-feature-resolver.test.mjs
node --check assets/js/referrals/eon-feature-unlock-resolver.js
node --check assets/js/referrals/eon-keys-page.js
node --check scripts/w616c-locked-feature-resolver-gate.mjs
```

Not completed here:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run build
npm test
```

Reason: `npm ci` did not complete in the current chat runtime before timeout. Do not claim full build/lint certification until the next chat or Codex runs it.

## Immediate next coding wave: W616D

Goal: connect the locked-feature resolver to real user-facing premium/limit surfaces while staying non-live.

Recommended W616D tasks:

1. Create a reusable UI component/module for locked-feature CTA rendering outside `/eon-keys`.
2. Replace at least three hardcoded premium/limit messages with resolver-based CTA:
   - project limit,
   - premium template/workflow,
   - local AI or own API-key advanced workflow.
3. Ensure each CTA has:
   - Subscribe option,
   - Trial option where eligible,
   - Refer-to-earn option,
   - Use EON Key option when inventory exists,
   - disabled state when live redemption is off.
4. Add tests proving no browser-only entitlement unlock is possible.
5. Keep all Dodo and referral grants disabled.

## Roadmap after W616D

### W616E — Sidebar/profile hub QA

- Mobile/desktop scroll audit.
- Automations/More menu reachability.
- Profile hub scroll and keyboard navigation.
- Ensure Billing, Invite, Vault, Backup, Settings, Help are in account/profile hub.

### W617 — Reward Relic contract

- Server-safe Reward Relic ledger schema.
- Relic editions: Signal, Builder, Circle, Creator, Founder.
- Relic utility attachment: feature key, pack, pass, slot, cosmetic.
- No NFT/token/marketplace/resale language.

### W618 — Free activated referral flow

- Invite link creation.
- Attribution from invite link.
- Google sign-in + first project saved = Activated Invite.
- Grant Signal Key and Welcome/Signal Relics only after server ledger exists.

### W619 — Subscription feature map finalization

- Lock all tier limits and feature groups.
- Map every premium feature to subscription tier and EON Key unlock option.
- Prepare Dodo product IDs but keep checkout off.

### W620 — Dodo Test Mode integration

- Hosted checkout only.
- Webhook-only entitlement.
- Customer portal.
- Plus public trial, Studio contextual trial, Power/Max no public trial.
- India localized price and mandate handling.
- No browser unlock.

### W621 — Paid referral event integration

- Trial start event can grant Builder Key after verified server event.
- First successful payment can grant Builder Keys.
- Milestones grant Power Keys.
- Refund/dispute/chargeback freezes unused keys from that referral and blocks future milestone counting.

### W622 — Private beta

- 10–30 real users.
- Test City, projects, local AI, own API-key flow, sidebar UX, EON Keys page, Dodo test/live small cohort.
- No paid traffic yet.

### W623 — Controlled live launch

- Plus trial public.
- Studio contextual.
- Power/Max invite-only.
- Referral programme visible.
- Keys/relics live only after server ledger and anti-abuse proof.

### W624 — Public growth launch

- Landing pages: Builder, Local AI, Creator/Studio.
- Google Search first; Microsoft copy winners; Quora/Reddit after onboarding proof.
- No push/pop/offerwall/cheap traffic brokers.

## Launch checklist not to forget

- Fix remaining W534/W535 release truth gates from older baseline if still failing.
- Re-run W615 production City parity proof after final deploy.
- Verify data survival across Cloudflare updates: LocalStorage/IndexedDB/Vault/projects/settings.
- Verify Google sign-in and guest/light preview paths.
- Verify sidebar/menu scroll at 360x640, 390x844, 768x1024, 1366x768, 1440x900.
- Verify PWA install prompt only after value.
- Verify Billing page says no checkout until Dodo is actually live.
- Verify referral share cards disclose sender may receive EON benefits.
- Verify all Reward Relics are non-transferable, non-cash, non-NFT, no resale.
- Verify no EONAPP-paid AI generation promise is present.
- Verify own API-key/local AI wording is consistent across pricing, local AI, EON Keys and locked-feature CTAs.
- Verify pricing pages mention pay/trial/refer clearly without saying unlimited.

## Paste-ready next-chat prompt

Use this in the next chat window:

```text
Continue EONAPP from W616C. Use the attached W616C source package as the coding baseline.

Current truth:
- W616B added EON Keys referral feature-unlock foundation and simplified shell/profile menu.
- W616C added locked-feature resolver: every premium gate can resolve Subscribe, eligible Trial, Refer for EON Keys, or Use earned EON Key.
- EONAPP has no platform-paid AI/image/video generation cost at launch. Users use local AI or their own provider/API key. EON Keys unlock EONAPP capability, not AI credits.
- No Dodo checkout, live referral grant, live key redemption, or browser entitlement is active yet.
- Targeted W616B/W616C tests pass, but full npm ci/lint/build was not completed in the previous chat due runtime timeout.

First do:
1. Run npm ci.
2. Run npm run qa:w616c-locked-feature-resolver.
3. Run npm run qa:w616b-eon-keys-referral.
4. Run npm run lint -- --max-warnings=0.
5. Run npm run build.
6. If those pass, start W616D: connect the locked-feature resolver to real user-facing premium/limit CTAs while keeping all live grants disabled.

Do not integrate Dodo yet. Do not activate live key grants. Do not add wallet/cash/crypto/NFT/free-month/renewal-discount rewards.
```

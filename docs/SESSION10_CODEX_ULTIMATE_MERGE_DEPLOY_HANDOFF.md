# EONAPP Session 1–10 Ultimate Codex Merge + Deploy Handoff

You are Codex working on `creditznft/EONAPP`.

## Objective

Apply the cumulative Session 1–10 patch package, run all gates, commit only intentional source/docs/proof-script changes, deploy through CI/Cloudflare, and capture live production proof before marking launch confidence as GO.

## Non-negotiable constraints

- Node 22.x only.
- Do not commit secrets, `.env`, `node_modules`, browser caches, or generated private proof tokens.
- Do not weaken reward/payment rules.
- Do not grant account-wide rewards from frontend callbacks alone.
- Do not make Cloudflare the only copy of user NFTs, receipts, identity, rewards, settings, or API-key status.
- Preserve local-first Vault data survival across Cloudflare updates.
- Keep public pages free of internal wave language such as visible `W###` references.

## Apply patch

Preferred path:

```bash
git checkout main
git pull --ff-only
cp -R changed-files/. ./
git diff --stat
git diff --check
```

Alternative path:

```bash
git apply --check SESSION1_10_CUMULATIVE_DIFF.patch
git apply SESSION1_10_CUMULATIVE_DIFF.patch
```

If the patch conflicts, use `changed-files/` as source of truth and preserve newer repo changes only when they clearly supersede the patch.

## Mandatory pre-commit gates

```bash
npm ci
npm run gpt55:final-ceo-launch-signoff
npm run gpt55:eoncity-gameplay-certification-gate
npm run gpt55:payment-reward-server-truth-gate
npm run gpt55:vault-account-survival-gate
npm run gpt55:market-nft-lootbox-visual-gate
npm run gpt55:code-os-gate
npm run gpt55:eonbot-emotion-voice-gate
npm run gpt55:route-truth-device-audit
npm run launch:page-gate
npm run gpt55:static-launch-audit
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run i18n:coverage
npm run i18n:screen-complete
npm run launch:readiness
npm run qa:w132-telegram-monetag-proof
npm run qa:w138-market-nft-generation-proof
npm run qa:w145-update-safe-user-data-survival
npm run qa:w156-w165-eoncity-visuals
```

Also run targeted unit/full CI if time allows:

```bash
npm run test:unit
npm run qa:w175-real-payment-proof
```

## Commit message

```text
W176-W185: CEO launch signoff hardening and cumulative audit gates
```

## Deploy sequence

1. Push branch or direct main only after gates are green.
2. Confirm GitHub Actions uses Node 22 and installs devDependencies.
3. Confirm Cloudflare Pages build uses Node 22.
4. Confirm deploy succeeds.
5. Open `https://eonapp.ch` and verify homepage copy is the new AI command world positioning.
6. Run production browser proof.
7. Capture Telegram/Monetag/NOWPayments proof.
8. Do not start paid ads until live proof artifacts exist.

## Final launch decision

- Source green + deploy green = public soft launch candidate.
- Source green + deploy green + browser green = public launch candidate.
- Source green + deploy green + browser green + Telegram/Monetag/payment/Vault restore proof green = paid ads GO.

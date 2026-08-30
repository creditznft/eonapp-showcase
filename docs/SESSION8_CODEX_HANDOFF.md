# Session 8 Codex Handoff — Payment/Reward Server Truth

Apply the changed files from the cumulative Session 1–8 ZIP. Then run:

```bash
npm ci
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
npm run launch:readiness
npm run qa:w132-telegram-monetag-proof
npm run qa:w175-real-payment-proof
```

Live proof still required after deploy:
- Open Telegram Mini App inside @EonAppsBot.
- Trigger rewarded ad from user tap only.
- Confirm `/api/ad-rewards/status?ymid=...` returns valued postback record.
- Run low-value NOWPayments test and confirm `/api/nowpayments/status?...` shows finished/credit applied.
- Confirm Vault receipt survives reload and Cloudflare deploy.

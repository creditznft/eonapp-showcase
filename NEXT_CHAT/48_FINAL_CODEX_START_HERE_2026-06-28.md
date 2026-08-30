# Final Codex Start Here — W412/W413/W414/W415

Use this package as the **only source baseline**. Do not overlay older handovers, generated builds, old `dist/`, `node_modules`, browser profiles, `.env` files or credential copies.

## 1. Install and certify source

```bash
npm ci
npm run qa:w415-final-source-readiness
npm run lint -- --max-warnings=0
npm run test:unit
npm run security:secret-scan -- --allow-no-history
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

Expected source state: W415 handover gate passes, all current unit tests pass, build/smoke/site audit/readiness pass, and the secret scanner finds no potential secrets.

## 2. Apply only the approved deployment boundaries

- Keep Preview Google OAuth disabled.
- Rotate any OAuth secret that was ever pasted outside its approved secret manager.
- Treat Google Login as **identity/session access only**.
- Do not enable `EON_SYNC_DB`, `EON_SYNC_ROLLOUT=manual-proof`, or `EON_SYNC_MUTATION_GATE=reviewed` until the named manual Sync proof run is scheduled with a disposable approved test account.
- Never put Vault entries, API keys, tokens, recovery material, wallets, payments, raw media or local model files into Sync Basic.
- Do not activate social posting/OAuth connectors, action execution, rewards, referral grants, payment or Secure Vault Sync.

## 3. Run manual evidence separately

Follow `49_FINAL_CODEX_MANUAL_PROOF_RUNBOOK_2026-06-28.md`. The required production checks are Google OAuth, City desktop/mobile controls, W412 Sync Basic test drill, and final licensed asset intake. The absence of a screenshot/video/log means the relevant item remains unproven.

## 4. Return package from Codex

Return a lean source ZIP under 200 MB, SHA-256, source manifest, changed-file list, exact command outputs, a redacted screenshot index, and a list of every remaining blocker. Do not include secrets, `.env`, `node_modules`, `dist`, report caches or browser profiles.

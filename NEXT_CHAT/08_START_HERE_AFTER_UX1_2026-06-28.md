# Start Here — Continue After UX-1

Use this package as the only source baseline. Do not merge older handovers on top of it.

## Completed in this package

- UX-1 simple guest-to-Google sign-in modal;
- identity-only user-tapped OAuth entry with no backup/Profile/Vault detour;
- guest continuation and truthful unavailable state;
- W373/W400C/W405 contract and test alignment;
- restoration of two missing inactive design-only contracts needed for source integrity;
- lint, targeted gates, 334/334 current unit tests, build, smoke, site audit and launch-readiness success.

## Start with

```bash
npm ci
npm run verify:w405-live-rescue-source
npm run qa:w374-google-oauth-pages-functions
npm run qa:w395-google-identity-d1-readiness
```

If the combined verifier hits the local execution wrapper timeout after the unit stage, run the final checks separately:

```bash
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

## Next approved coding wave: UX-2

Implement the shell polish in the approved masterplan, without changing UX-1:

1. retain tooltips for collapsed navigation;
2. keep Search, More and Account menus anchored and keyboard-safe;
3. replace route-heavy Profile/Settings access with compact in-shell modal surfaces;
4. maintain a signed-in popover containing Profile, Settings, disabled `EON Sync — Coming soon`, Help and Log out;
5. maintain a guest popover containing Continue with Google, Continue as guest, Help, and Privacy and Terms;
6. do not activate EON Sync, cloud workspace storage, Vault/API-key sync, payments, Relay, social connectors/posting, deployment, Action Gateway, or legacy chain/market features.

## Manual production proof still needed before deployment claim

Follow `NEXT_CHAT/03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md` using a disposable approved Google test account. Capture redacted screenshots only after a real production Testing-mode Google flow completes. Also retain the existing W406A City proof checklist; no City device/art proof is included here.

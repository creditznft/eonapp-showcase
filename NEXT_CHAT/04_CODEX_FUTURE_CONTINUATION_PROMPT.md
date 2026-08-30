# Codex Prompt — use only after the next ChatGPT coding session prepares a merge-ready source bundle

You are continuing EONAPP from the newest handover source. Read `NEXT_CHAT/00_READ_ME_FIRST.md`, `NEXT_CHAT/02_UNIFIED_PRODUCT_MASTERPLAN.md`, and `NEXT_CHAT/03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md` before touching code.

Do not merge older source bundles over this one. Do not activate EON Relay rewards, Collection grants, social OAuth/posting, Action Gateway execution, user deployment, payment checkout, or Vault Sync.

First validate:

```bash
npm ci
npm run verify:w405-live-rescue-source
```

Then merge only the changes explicitly documented by the latest ChatGPT implementation handover. Validate lint, targeted gates, `npm run test:unit`, build, smoke, site audit and launch readiness. Create a fresh production deployment only after the validation set passes.

For the first deployment after the UX-1 sign-in change:

- keep Google OAuth in Production Testing mode;
- keep Preview OAuth disabled;
- use a disposable approved Google test user;
- return redacted proof of header Sign in -> modal -> Google chooser -> callback -> refresh session -> logout;
- do not claim EON Sync, backup, referral, reward, City visual certification or payment activation without their separate proof.

For City work, use Babylon at `/eoncity` as the only public City. Redirect legacy Realm/Three paths. Do not ship procedural blocks as “AAA”; follow the authored asset, provenance, LOD and visual proof plan.

Return: a lean source ZIP, SHA-256, manifest, changed-file list, validation results, manual proof index, blockers and explicit activation state.

This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — W150–W165 Codex Merge

1. Use `EONAPP_W165_FINAL_GAMER_POWER_USER_CERTIFICATION_FULL_SOURCE_2026-06-14.zip` as the cumulative source.
2. Use `EONAPP_W165_FINAL_GAMER_POWER_USER_CERTIFICATION_PATCH_2026-06-14.zip` only if the repo already exactly matches W164.
3. Read `EONAPP_W150_W165_CODEX_MERGE_HANDOFF_2026-06-14.md` before merging.
4. Run:

```bash
npm ci
npm run qa:w165-final-gamer-power-user-certification
npm run qa:w150-w165-codex-handoff
npm run lint -- --max-warnings=50
npm run build
npm run smoke:build
npm run qa:w149-ceo-launch-verification:server
npm audit --omit=dev --audit-level=high
```

Protected boundaries: no `/telegram` redirect loop, no auto ad, no frontend-only real entitlement, no empty Market first impression, and no user-data loss across Cloudflare deploys.

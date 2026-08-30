# Start here — W646 Codex execution

1. Read `docs/EONAPP_W646_FINAL_DEPLOYMENT_AND_EVIDENCE_RUNBOOK_2026-07-11.md`.
2. Read `docs/EONAPP_W646_TEST_AND_SCREENSHOT_MATRIX_2026-07-11.md`.
3. Treat the included source as the authoritative W646 source. Do not merge it with an older checkout.
4. Keep `.env.local` local and uncommitted. Use it only for approved runtime tests.
5. First reproduce 81/81 permanent predeploy locally.
6. Push through a reviewed draft PR, then use the workflow chain: CI candidate → exact Preview → evidence → protected owner GO → exact production promotion → immediate live verification.
7. Production remains NO-GO until the final post-deploy validator passes.

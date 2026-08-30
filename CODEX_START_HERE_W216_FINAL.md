This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start Here — Final W180–W215 Polish Package

Read in this order:

1. `CODEX_W180_W215_FINAL_POLISH_MERGE_AND_W216_PREVIEW_PROMPT_2026-06-23.md`
2. `W216_LOCAL_RELEASE_AUDIT_2026-06-23.md`
3. `EONAPP_CUMULATIVE_HANDOVER_W180_W215_2026-06-23.md`
4. `EONAPP_STATELESS_REFERRAL_REALM_LINK_CONTRACT_W212_W215_2026-06-23.md`
5. `EONAPP_W213_CALM_EON_CITY_TRADE_SAFETY_HANDOVER_2026-06-23.md`
6. `EONAPP_W214_SECURITY_TRUST_HANDOVER_2026-06-23.md`
7. `EONAPP_W215_MONETIZATION_DECISION_GATE_HANDOVER_2026-06-23.md`
8. `EONAPP_W216_EVIDENCE_MATRIX_2026-06-23.md`
9. `TEST_BASELINE_AND_LEGACY_DIAGNOSTIC_W216_2026-06-23.md`
10. `FUTURE_EXPANSION_ROADMAP_POST_W216_2026-06-23.md`
11. `W216_BROWSER_RENDER_LIMITATION_2026-06-23.md`
12. `W216_ARCHIVE_REPRODUCIBILITY_2026-06-23.md`

Run before Preview deployment:

```bash
npm ci
npm run qa:w216-release-candidate
```

The active product is chat-first, local-first, 2D City-first, and monetization-disabled. Do not reactivate campaign, payment, referral-value, provider, or exchange logic during this merge.

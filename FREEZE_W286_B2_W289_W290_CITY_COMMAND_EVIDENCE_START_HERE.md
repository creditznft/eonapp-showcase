This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start here — W286-B2 City Command Loop + W289/W290 evidence board

## Current truth

This is a source-only continuation of W286-B1. It implements a privacy-safe live work huddle across City Lite, Three.js and Babylon, then converts all remaining release work into precise external-evidence gates.

**W260 remains NO-GO.** This package does not authorise a deployment, beta, referral/milestone, reward, D1/Worker change, wallet/chain work or launch claim.

## Read in this order

1. `README_START_HERE.md`
2. `CHANGELOG_W286_B2_W289_W290_CITY_COMMAND_EVIDENCE_2026-06-25.md`
3. `docs/W286_B2_CITY_COMMAND_LOOP_CEO_DECISION_2026-06-25.md`
4. `CODEX_W286_B2_W289_W290_SAFE_MERGE_AND_EXTERNAL_EVIDENCE_HANDOVER_2026-06-25.md`
5. `docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md`
6. `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md`
7. `docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md`
8. `docs/W289_W290_FINAL_RECERTIFICATION_BOARD_2026-06-25.md`
9. `PACKAGE_VALIDATION_W286_B2_W289_W290_CITY_COMMAND_EVIDENCE_2026-06-25.md`

## Local verification sequence

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w286-b1-city-agent-presence
npm run qa:w286-b2-live-work-command
npm run qa:w289-w290-external-evidence-board
npm run qa:current-static-certification:tail
```

Perform work on a local safety branch. Do not merge/deploy from the package.

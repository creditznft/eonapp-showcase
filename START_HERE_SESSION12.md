This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — EONAPP Session 12 balanced continuation

1. Read `CodexDocs/GPT55_W98_SESSION12_HANDOFF_2026-06-10.md`.
2. Review `CodexAuditPack/W98_SESSION12/SESSION12_CEO_PRECERT_SCORECARD.md`.
3. Use this directory as the source of truth; do not replace it with GitHub main.
4. Install the exact JavaScript dependency tree with `npm ci`.
5. Run `npm run build`.
6. Run `npm run qa:w98-session12-polish`.
7. Continue with Session 13 using `CodexAuditPack/W98_SESSION12/SESSION13_BLOCKER_AND_ENHANCEMENT_LIST.md`.

The fresh `dist/` folder is included, so the certified application can also be served immediately without rebuilding.

No `.git`, secrets, real `.env`, `node_modules`, browser profiles or private wallet material are included.

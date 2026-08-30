This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — EONAPP Session 13 balanced continuation

1. Read `CodexDocs/GPT55_W98_SESSION13_HANDOFF_2026-06-10.md`.
2. Review `CodexAuditPack/W98_SESSION13/SESSION13_CEO_RELEASE_READINESS_SCORECARD.md`.
3. Follow `CodexAuditPack/W98_SESSION13/SESSION14_INDEPENDENT_CERTIFICATION_PLAN.md`.
4. Use this directory as the source of truth; do not replace it with GitHub `main`.
5. Install the exact JavaScript dependency tree with `npm ci`.
6. Run `npm run build`.
7. Run `npm run qa:w98-session13-mega`.
8. Begin Session 14 as an independent verification pass, not as a continuation of unverified claims.

The fresh `dist/` folder is included, so the release candidate can also be served immediately without rebuilding.

No `.git`, secrets, real `.env`, `node_modules`, browser profiles or private wallet material are included in the balanced ZIP.

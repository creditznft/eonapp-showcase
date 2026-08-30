This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — EONAPP Session 11 balanced continuation

1. Read `CodexDocs/GPT55_W98_SESSION11_HANDOFF_2026-06-10.md`.
2. Use this directory as the source of truth.
3. Install the exact JavaScript toolchain with `npm ci`.
4. Run `npm run build`.
5. Run `npm run qa:w98-session11-performance`.
6. Continue with Session 12 only after confirming the included final verification JSON.

The fresh `dist/` folder is included so the certified application can also be served immediately without rebuilding.

No `.git`, secrets, real `.env`, `node_modules`, browser profiles or private wallet material are included.

# EONAPP W422 — Codex Start Here

Use the attached W422 source archive as the **only** source baseline. Do not merge older handovers over it.

## Product decisions that are locked

1. `/eoncity` is the canonical public Babylon City. Do not reintroduce a second public Three.js City.
2. W422 ships **58 original local SVG vector/procedural art assets**. They are runtime art, but they are **not** approved final GLB/KTX2 art.
3. No remote art, data URI, user images, telemetry, screenshot capture, media upload, automatic posting, rewards, or user-data access may be introduced by art work.
4. The final binary-art path remains W417: provenance, rights, exact hashes, LODs, KTX2/Basis, budgets, review evidence, and human approval first.
5. Google identity is not Sync. W412 Sync Basic remains fail-closed unless the required production configuration and manual proof exist.
6. City quality claims must remain accurate: “original local art/procedural fallback” is allowed; “final institutional-grade 3D art” is not allowed until external art and device proof are supplied.

## First commands

```bash
npm ci
npm run qa:w422-city-deep-art
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan -- --allow-no-history
npm audit --omit=dev --audit-level=high
```

Run the combined W422 command only after individual checks are captured; it can exceed restricted runner time limits because it repeats prior gates and a full build.

```bash
npm run verify:w422-city-deep-art
```

## Codex work order

1. Validate and deploy W422 preview without altering City asset/provenance boundaries.
2. Perform the manual proof matrix in `03_MANUAL_VISUAL_ACCEPTANCE_AND_REMAINING_WORK.md`.
3. Collect and review original/licensed final 3D art only through W417.
4. Run live Google OAuth and two-device D1 Sync Basic proofs only after production configuration is ready.
5. Return a clean follow-up handover exactly as defined in `02_CODEX_DEPLOY_PROOF_AND_RETURN_HANDOVER.md`.

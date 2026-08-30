# EONAPP W419 — Start Here for Codex

Use this W419 source package as the **only** baseline. Do not merge older handovers over it.

## What W419 adds

- 18 original, source-authored EON City SVG visual assets under `assets/city/art/`.
- A same-origin Babylon texture runtime with quality tiers and disposal.
- Art integration across wet streets, facades, glass, command surfaces, skyline, district emblems, wayfinding and EONBOT.
- An enforceable W419 source gate that verifies inventory, SHA-256 source hashes, self-contained SVGs, no remote/data URI references, build copying and Babylon integration.

## What is still intentionally not claimed

W419 does **not** ship approved final binary 3D art. There are no reviewed GLB/GLTF models, KTX2/Basis texture packages, final sound/animation packs, or target-device visual evidence. Do not describe the City as final institutional-grade art until W417 binary-art release evidence and the manual proof track are complete.

## First commands

```bash
npm ci
npm run verify:w419-city-original-vector-art
```

Then use `03_CODEX_EXECUTION_AND_DEPLOY_W419.md` and `04_MANUAL_ART_AND_DEVICE_PROOF_W419.md`.

## Non-negotiable boundaries

- Canonical public City stays Babylon at `/eoncity`.
- No remote art URLs, social posting, user project deployment, payment, referral rewards, or Sync activation.
- Google identity is not Sync.
- Sync must stay fail-closed until D1/OAuth/manual two-device proof exists.
- Preserve user local data and do not delete or overwrite existing browser work.
